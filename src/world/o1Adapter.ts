import type { Action, ActorKind, ActorView, Phase, PresentationAdapter, PresentationSnapshot } from '../contracts/presentation';
import type { SimFight, SimFighter } from '../combat/simApi';
import { facingFromVector } from '../presentation/directions';
import type { O1Controller } from './o1Controller';
import { buildView, combatView } from './o1Combat';
import type { BuildView } from '../contracts/presentation';

const MOVE_ACTION: Record<string, Action> = {
  light: 'light', dodgeAtk: 'light', riposte: 'light', heavy: 'heavy', dodge: 'dodge', parry: 'guard', sguard: 'guard',
  sslash: 'light', bash: 'bash', bite: 'light', leap: 'leap',
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
type View = Pick<ActorView, 'action' | 'phase' | 'progress'>;

/** Read-only mapping from a simulator fighter to a presentation pose. Nothing here feeds back into the fight. */
export function poseOf(f: SimFighter, S: SimFight): View {
  if (f.dead || f.hp <= 0) return { action: 'death', phase: 'recovery', progress: 1 };
  if (f.stagger > 0) return { action: 'reaction', phase: 'active', progress: .5 };
  const m = f.act;
  if (m) {
    const action = MOVE_ACTION[m.id] ?? 'idle';
    if (m.kind === 'attack') {
      const w = m.windup ?? 0, a = m.active ?? 1, r = m.recovery ?? 1;
      const phase: Phase = f.actT <= w ? 'windup' : f.actT <= w + a ? 'active' : 'recovery';
      return { action, phase, progress: clamp01(f.actT / (w + a + r)) };
    }
    if (m.kind === 'dodge') return { action, phase: 'active', progress: clamp01(f.actT / (m.dur ?? 13)) };
    if (m.kind === 'guard') return { action, phase: 'active', progress: clamp01(f.actT / ((m.active ?? 1) + (m.recovery ?? 1))) };
    return { action, phase: 'active', progress: clamp01(f.actT / ((m.windup ?? 0) + (m.recovery ?? 1) + 6)) };
  }
  if (f.blocking) return { action: 'guard', phase: 'active', progress: S.tick - f.blockStart < S.d.raise + 2 ? .1 : .5 };
  if (Math.abs(f.mvx) + Math.abs(f.mvy) > .05) return { action: 'walk', phase: 'active', progress: (S.tick % 18) / 18 };
  return { action: 'idle', phase: 'active', progress: 0 };
}

export class O1PresentationAdapter implements PresentationAdapter {
  private build?: BuildView;
  private visualMs = 0;
  private firstDeadMs = new Map<string, number>();
  /** Cosmetic fall timing never calls sim.step or changes authoritative fighter state. */
  private deathPose(id: string): View {
    if (!this.firstDeadMs.has(id)) this.firstDeadMs.set(id, this.visualMs);
    const age = this.visualMs - this.firstDeadMs.get(id)!;
    const phase: Phase = age < 140 ? 'windup' : age < 310 ? 'active' : 'recovery';
    return { action: 'death', phase, progress: phase === 'recovery' ? 1 : 0 };
  }
  constructor(private readonly c: O1Controller) {}
  read(deltaMs = 0): PresentationSnapshot {
    this.visualMs += Math.max(0, Math.min(250, deltaMs));
    const c = this.c, S = c.fight;
    const facing = (a: number) => facingFromVector(Math.cos(a), Math.sin(a));
    const live = c.state === 'fighting' || (S !== null && (c.state === 'defeated' || c.state === 'unresolved'));
    const viewPose = (id: string, f: SimFighter): View => (f.dead || f.hp <= 0) ? this.deathPose(id) : poseOf(f, S!);
    let hero: ActorView;
    if (live && S) hero = { id: 'hero', kind: 'adventurer', x: S.p.x, y: S.p.y, facing: facing(S.p.face), ...viewPose('hero', S.p), visible: true };
    else {
      const walking = c.state === 'travelling' && c.hero.moving;
      hero = { id: 'hero', kind: 'adventurer', x: c.hero.x, y: c.hero.y, facing: facing(c.hero.face), action: walking ? 'walk' : 'idle', phase: 'active', progress: walking ? (c.tick % 18) / 18 : 0, visible: true };
    }
    const foes = c.foes.map((f, i): ActorView => {
      const id = c.foes.length > 1 ? `enemy${i}` : 'enemy', kind = f.arch as ActorKind, fighter = c.fighterOf(i);
      if (live && S && f.engaged && fighter) return { id, kind, x: fighter.x, y: fighter.y, facing: facing(fighter.face), ...viewPose(id, fighter), visible: true };
      // A foe that fell stays where the simulator left it, in its death pose, through later fights and after the run.
      if (!f.alive) return { id, kind, x: f.x, y: f.y, facing: facing(f.face), ...this.deathPose(id), visible: true };
      return { id, kind, x: f.x, y: f.y, facing: facing(f.face), action: 'idle', phase: 'active', progress: 0, visible: true };
    });
    this.build ??= buildView(c.sim, c.stats, c.cfg.focus, c.cfg.doctrine);
    return { source: 'authoritative', tick: c.tick, actors: [hero, ...foes], build: this.build, combat: S ? combatView(c.sim, S) : undefined };
  }
}
