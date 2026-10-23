/** Exhibition fixture only. These are artist controls, not AI or combat rules. */
import { type Action, type ActorView, type Facing, type PresentationSnapshot } from '../contracts/presentation';
import { facingFromVector } from './directions';
export type Composition = 'traversal' | 'sentry' | 'mireling' | 'mixed';
export class VisualSequence {
  time = 0;
  paused = false;
  composition: Composition = 'mixed';
  action: Action | 'sequence' = 'sequence';
  facing: Facing = 'NE';
  hero = { x: -105, y: 35 };
  update(delta: number, dx = 0, dy = 0) {
    if (!this.paused) this.time += Math.min(delta, 100) / 1000;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      this.hero.x = Math.max(-222, Math.min(222, this.hero.x + dx / length * delta * .075));
      this.hero.y = Math.max(-185, Math.min(185, this.hero.y + dy / length * delta * .075));
      this.facing = facingFromVector(dx, dy);
    }
  }
  read(moving = false): PresentationSnapshot {
    const cycle: Action[] = ['idle', 'walk', 'guard', 'light', 'heavy', 'guard'];
    const p = (this.time % 2.4) / 2.4;
    const action = moving ? 'walk' : this.action === 'sequence' ? cycle[Math.floor(this.time / 2.4) % cycle.length] : this.action;
    const phase = p < 1 / 3 ? 'windup' : p < 2 / 3 ? 'active' : 'recovery';
    const actor = (id: string, kind: ActorView['kind'], x: number, y: number, facing: Facing, act: Action, visible = true): ActorView => ({ id, kind, x, y, facing, action: act, phase, progress: p, visible });
    return {
      source: 'visual-only', tick: Math.floor(this.time * 30),
      actors: [
        actor('hero', 'adventurer', this.hero.x, this.hero.y, this.facing, action === 'bash' || action === 'leap' ? 'idle' : action),
        actor('sentry', 'sentry', 90, -25, 'SW', this.action === 'sequence' ? (['guard', 'light', 'bash'][Math.floor(this.time / 2.4) % 3] as Action) : this.action === 'heavy' ? 'bash' : action === 'leap' ? 'idle' : action, this.composition === 'mixed' || this.composition === 'sentry'),
        actor('mireling', 'mireling', 65, 80, 'NW', this.action === 'sequence' || this.action === 'leap' ? 'leap' : action === 'walk' ? 'walk' : 'idle', this.composition === 'mixed' || this.composition === 'mireling'),
      ],
    };
  }
}
