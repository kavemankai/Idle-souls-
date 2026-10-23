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
  if (f.dead || f.hp <= 0) return { action: 'reaction', phase: 'recovery', progress: .9 };
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
  constructor(private readonly c: O1Controller) {}
  read(): PresentationSnapshot {
    const c = this.c, S = c.fight;
    const kind = c.cfg.opponent as ActorKind;
    const facing = (a: number) => facingFromVector(Math.cos(a), Math.sin(a));
    const live = c.state === 'fighting' || (S !== null && (c.state === 'defeated' || c.state === 'unresolved'));
    let hero: ActorView, enemy: ActorView;
    if (live && S) {
      const e = S.enemies[0];
      hero = { id: 'hero', kind: 'adventurer', x: S.p.x, y: S.p.y, facing: facing(S.p.face), ...poseOf(S.p, S), visible: true };
      enemy = { id: 'enemy', kind, x: e.x, y: e.y, facing: facing(e.face), ...poseOf(e, S), visible: !e.dead };
    } else {
      const walking = c.state === 'travelling' && c.hero.moving;
      hero = { id: 'hero', kind: 'adventurer', x: c.hero.x, y: c.hero.y, facing: facing(c.hero.face), action: walking ? 'walk' : 'idle', phase: 'active', progress: walking ? (c.tick % 18) / 18 : 0, visible: true };
      enemy = { id: 'enemy', kind, x: c.enemy.x, y: c.enemy.y, facing: facing(c.enemy.face), action: 'idle', phase: 'active', progress: 0, visible: c.enemy.alive };
    }
    this.build ??= buildView(c.sim, c.stats, c.cfg.focus, c.cfg.doctrine);
    return { source: 'authoritative', tick: c.tick, actors: [hero, enemy], build: this.build, combat: S ? combatView(c.sim, S) : undefined };
  }
}
