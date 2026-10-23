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
  /** Authoritative sources only. What the simulator reports about the run; the visual study never sets these. */
  readonly build?: BuildView;
  readonly combat?: CombatView;
}
/** Read-only combat detail. Every value is copied from the simulator, none is computed or invented by rendering. */
export interface Gauge { readonly value: number; readonly max: number }
export interface CombatantView {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hp: Gauge;
  readonly stamina: Gauge;
  readonly poise: Gauge;
  readonly staggered: boolean;
  readonly blocking: boolean;
  readonly guardStance: boolean;
  readonly parryActive: boolean;
  readonly parryWindowLive: boolean;
  readonly invulnerable: boolean;
  readonly flash: number;
  readonly heading: number;
  /** Half-angle of the frontal arc that blocks, in radians. The adventurer's is its Guard Skill number. */
  readonly guardArc: number;
  /** Set while the actor is in an attack move: reach, half-arc and phase come from that move's own numbers. */
  readonly attack: { readonly name: string; readonly range: number; readonly arc: number; readonly phase: Phase } | null;
}
export interface MindView { readonly thought: string; readonly truth: string; readonly intent: string; readonly parryChance: number | null; readonly target: string }
export interface BeliefView { readonly enemy: string; readonly x: number; readonly y: number; readonly radius: number }
export interface TotalsView {
  readonly dealt: number; readonly taken: number; readonly blocks: number; readonly perfects: number; readonly parries: number;
  readonly dodges: number; readonly punishes: number; readonly dodgeCounters: number; readonly guardBreaksDealt: number; readonly counteredHits: number;
}
export interface CauseView { readonly key: string; readonly label: string; readonly stat: string; readonly damage: number }
export interface EventView { readonly tick: number; readonly text: string; readonly kind: string }
export interface CombatView {
  readonly combatants: readonly CombatantView[];
  readonly mind: MindView;
  readonly beliefs: readonly BeliefView[];
  readonly totals: TotalsView;
  readonly causes: readonly CauseView[];
  readonly events: readonly EventView[];
  readonly over: boolean;
  readonly winner: string | null;
}
export interface StatLine { readonly key: string; readonly name: string; readonly value: number; readonly line: string }
export interface BuildView {
  readonly level: number;
  readonly pointsSpent: number;
  readonly focus: string;
  readonly doctrine: string;
  readonly health: number;
  readonly families: readonly { readonly name: string; readonly stats: readonly StatLine[] }[];
}
export interface PresentationAdapter {
  read(): PresentationSnapshot;
}
