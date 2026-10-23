/** Read-only boundary. A future adapter must map the selected authoritative source.
 * No action here triggers damage, navigation, defense or simulation time. */
export const FACINGS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type Facing = typeof FACINGS[number];
export type ActorKind = 'mannequin' | 'adventurer' | 'sentry' | 'mireling';
export type Action = 'idle' | 'walk' | 'guard' | 'light' | 'heavy' | 'bash' | 'leap' | 'dodge' | 'reaction';
export type Phase = 'windup' | 'active' | 'recovery';
export interface ActorView {
  readonly id: string;
  readonly kind: ActorKind;
  readonly x: number;
  readonly y: number;
  readonly facing: Facing;
  readonly action: Action;
  readonly phase: Phase;
  readonly progress: number;
  readonly visible: boolean;
}
export interface PresentationSnapshot {
  readonly source: 'visual-only' | 'authoritative';
  readonly tick: number;
  readonly actors: readonly ActorView[];
}
export interface PresentationAdapter {
  read(): PresentationSnapshot;
}
