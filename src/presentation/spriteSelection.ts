import type { ActorView } from '../contracts/presentation';
export const ATTACKS = ['light', 'heavy', 'bash', 'leap'];
export function chooseFrame(actor: ActorView, available: (name: string) => boolean): { frame: string; missing: boolean } {
  const count = actor.action === 'walk' ? 4 : ['guard', ...ATTACKS].includes(actor.action) ? 3 : 1;
  // Combat adapters supply phase. The renderer never divides real move time into equal thirds.
  const index = ATTACKS.includes(actor.action)
    ? ['windup', 'active', 'recovery'].indexOf(actor.phase)
    : Math.min(count - 1, Math.floor(Math.max(0, Math.min(.999, actor.progress)) * count));
  const frame = `${actor.kind}__${actor.action}__${actor.facing}__${String(index).padStart(2, '0')}`;
  if (available(frame)) return { frame, missing: false };
  return { frame: `${actor.kind}__idle__${actor.facing}__00`, missing: true };
}
