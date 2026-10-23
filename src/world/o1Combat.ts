import type { BeliefView, BuildView, CombatantView, CombatView, Phase, StatLine } from '../contracts/presentation';
import type { SimApi, SimDerived, SimFight, SimFighter, SimMoveFull } from '../combat/simApi';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const ms = (t: number, hz: number) => `${Math.round(t * 1000 / hz)} ms`;
/** One plain-text line per stat, quoting the derived numbers the simulator uses. Same wording as the bench's stat sliders. */
export function describeStat(key: string, d: SimDerived, mv: Record<string, SimMoveFull>, hz: number): string {
  switch (key) {
    case 'swingSpeed': return `Light windup ${mv.light.windup} ticks, heavy ${mv.heavy.windup}`;
    case 'swingPower': return `Light ${mv.light.dmg} damage, heavy ${mv.heavy.dmg}, poise x${d.poisePower.toFixed(2)}`;
    case 'swingSkill': return `Tracking x${d.trackMult.toFixed(2)}, arc x${d.arcMult.toFixed(2)}${d.glance < 1 ? `, edge hits do ${pct(d.glance)}` : ''}, chains up to ${d.chainMax} light${d.chainMax > 1 ? 's' : ''}`;
    case 'guardSpeed': return `Shield up in ${d.raise} tick${d.raise === 1 ? '' : 's'}, parry startup ${d.parryStart}`;
    case 'guardStrength': return `Blocks cost ${pct(d.blockMult)}, guard-break chip ${pct(d.chip)}, break stagger ${d.breakStag} ticks`;
    case 'guardSkill': return `Perfect block ${ms(d.perfect, hz)}, parry window ${ms(d.parry, hz)}, guard +/-${Math.round(d.guardArc * 180 / Math.PI)} degrees`;
    case 'moveSpeed': return `Moves at ${pct(d.moveMult)} speed`;
    case 'dodgePower': return `Dodge covers ${d.dodgeDist} units`;
    case 'dodgeSkill': return `${d.iframes} invulnerable ticks, ${d.dodgeStam} stamina, rolling-slash window ${d.counterWin} ticks`;
    case 'endurance': return `Max stamina ${d.maxSt}`;
    case 'wind': return `Regains ${d.regen.toFixed(2)} a tick after a ${d.regenPause}-tick pause`;
    case 'balance': return `Poise ${d.poise}, staggers last x${d.staggerMult.toFixed(2)}`;
    case 'vitality': return `Health ${d.hp}`;
    case 'reflex': return `Reacts after ${ms(d.delay, hz)}`;
    case 'perception': return `Misreads a deceptive attack ${pct(d.misread)} of the time`;
    case 'discipline': return `Keeps ${Math.round(d.reserve)} stamina back, greed ${d.greed.toFixed(2)}`;
    case 'composure': return `Decision noise ${d.temp.toFixed(2)}`;
    case 'positioning': return `Spacing off by up to ${Math.round(d.spacingErr)}, panicked rolls ${pct(d.dodgeErr)}, awareness of other enemies ${d.flankSense.toFixed(2)}`;
    default: return '';
  }
}

/** The adventurer's build as the simulator will use it. Static for a run. */
export function buildView(sim: SimApi, stats: Record<string, number>, focus: string, doctrine: string): BuildView {
  const d = sim.derive(stats, false), mv = sim.playerMoves(d);
  return {
    level: sim.playerLevel(stats), pointsSpent: sim.pointsSpent(stats), focus, doctrine: sim.DOCTRINES[doctrine].name, health: d.hp,
    families: sim.FAMILIES.map(f => ({
      name: f.name,
      stats: sim.STATS.filter(s => s.family === f.key).map((s): StatLine => ({ key: s.key, name: s.name, value: stats[s.key], line: describeStat(s.key, d, mv, sim.HZ) })),
    })),
  };
}

function phaseOf(f: SimFighter, m: SimMoveFull): Phase {
  const w = m.windup ?? 0, a = m.active ?? 1;
  return f.actT <= w ? 'windup' : f.actT <= w + a ? 'active' : 'recovery';
}
// Enemies block within 1.3 radians in checkHit; the adventurer's arc is derived from Guard Skill.
const ENEMY_GUARD_ARC = 1.3;
function combatant(id: string, f: SimFighter, guardArc: number): CombatantView {
  const m = f.act;
  const attacking = m && m.kind === 'attack' && m.range !== undefined && m.arc !== undefined;
  return {
    id, name: f.name, x: f.x, y: f.y, radius: f.r,
    hp: { value: Math.max(0, f.hp), max: f.maxHp }, stamina: { value: f.st, max: f.maxSt }, poise: { value: f.poise, max: f.maxPoise },
    staggered: f.stagger > 0, blocking: f.blocking,
    guardStance: !!m && m.kind === 'guard' && f.actT <= (m.active ?? 0),
    parryActive: !!m && m.kind === 'parry',
    parryWindowLive: !!m && m.kind === 'parry' && f.actT > m.windup && f.actT <= m.windup + (f.parryWin ?? 0),
    invulnerable: f.iframe, flash: f.flash, heading: f.face, guardArc,
    attack: attacking ? { name: m.name, range: m.range!, arc: m.arc!, phase: phaseOf(f, m) } : null,
  };
}

/** Copy what the simulator reports into the read-only contract. Reads only; nothing here writes to the fight. */
export function combatView(sim: SimApi, S: SimFight): CombatView {
  const live = S.enemies;
  const beliefs: BeliefView[] = [];
  S.ai.snaps.forEach((sn, i) => { const e = live[i]; if (e && !e.dead) beliefs.push({ enemy: e.name, x: sn.x, y: sn.y, radius: e.r }); });
  const t = S.stats;
  return {
    combatants: [combatant('hero', S.p, S.d.guardArc), ...live.map((e, i) => combatant(live.length > 1 ? `enemy${i}` : 'enemy', e, ENEMY_GUARD_ARC))],
    mind: { thought: S.ai.readout || '', truth: S.ai.truth || '', intent: S.over ? '' : S.ai.intent || '', parryChance: S.ai.parryP, target: live[S.ai.target]?.name ?? '' },
    beliefs,
    totals: { dealt: t.dealt, taken: t.taken, blocks: t.blocks, perfects: t.perfects, parries: t.parries, dodges: t.dodges, punishes: t.punishes, dodgeCounters: t.dodgeCounters, guardBreaksDealt: t.guardBreaksDealt, counteredHits: t.counteredHits },
    causes: Object.keys(sim.CAUSES).map(k => ({ key: k, label: sim.CAUSES[k][0], stat: sim.STATS.find(s => s.key === sim.CAUSES[k][1])!.name, damage: t.dmgBy[k] ?? 0 })),
    events: S.events, over: S.over, winner: S.winner,
  };
}

export interface DefenceCounts { blocks: number; parries: number; perfects: number }
/** A shield cue only when the simulator's own totals went up. A new fight restarts the totals at 0, so the baseline restarts too. */
export function defenceCue(prev: DefenceCounts, now: DefenceCounts | undefined, newFight: boolean): { cue: 'parry' | 'perfect' | 'block' | null; counts: DefenceCounts } {
  const base = newFight ? { blocks: 0, parries: 0, perfects: 0 } : prev;
  if (!now) return { cue: null, counts: base };
  const cue = now.parries > base.parries ? 'parry' : now.perfects > base.perfects ? 'perfect' : now.blocks > base.blocks ? 'block' : null;
  return { cue, counts: { blocks: now.blocks, parries: now.parries, perfects: now.perfects } };
}
