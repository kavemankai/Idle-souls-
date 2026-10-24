import type { Action, CombatView, Facing, Gauge, Phase } from '../contracts/presentation';
import { facingFromVector } from './directions';
import { poseOf } from '../world/o1Adapter';
import { combatView } from '../world/o1Combat';
import { toWorld } from '../world/worldRunner';
import type { WorldRunner } from '../world/worldRunner';
import { ROOMS } from '../world/roomRegistry';

/**
 * Read-only bridge from the ACTUAL expedition runner to visual poses.
 * Never creates a RoomRunner, ticks a fight, chooses an action or moves an actor.
 * Coordinates remain room-local, as they are in the existing O1 art pipeline.
 */
export interface ExpeditionVisualActor {
  readonly id: string;
  readonly archetype: string;
  readonly illustrated: boolean;
  readonly x: number;
  readonly y: number;
  readonly facing: Facing;
  readonly action: Action;
  readonly phase: Phase;
  readonly progress: number;
  readonly visible: boolean;
  readonly combatSlot: number | null;
}
export interface ExpeditionVisualState {
  readonly room: string;
  readonly tick: number;
  /** Changes whenever a new room visit or encounter begins. */
  readonly fightKey: string | null;
  readonly heroHealth: Gauge;
  readonly fighting: boolean;
  readonly passage: boolean;
  readonly heroStatus: string;
  readonly actors: readonly ExpeditionVisualActor[];
  readonly combat?: CombatView;
}
const illustrated = (arch: string) => arch === 'adventurer' || arch === 'mireling' || arch === 'sentry';
const facing = (angle: number): Facing => facingFromVector(Math.cos(angle), Math.sin(angle));
const walk = (moving: boolean, tick: number): Pick<ExpeditionVisualActor, 'action' | 'phase' | 'progress'> =>
  ({ action: moving ? 'walk' : 'idle', phase: 'active', progress: moving ? tick % 18 / 18 : 0 });

/** Only simulator/runner states influence this small player-facing action chip. */
export function heroActionStatus(world: WorldRunner): string {
  const r = world.runner;
  const f = r?.state === 'fighting' ? r.fight?.p : null;
  if (world.state === 'defeated') return '• Fallen';
  if (r?.retreating) return '• Retreating';
  if (f) {
    const pose = poseOf(f, r!.fight!);
    if (pose.action === 'death') return '• Fallen';
    if (pose.action === 'dodge') return '• Dodging';
    if (pose.action === 'guard') return '• Guarding';
    if (pose.action === 'reaction') return '• Staggered';
    if (['light', 'heavy', 'bash', 'leap'].includes(pose.action)) {
      if (pose.phase === 'windup') return '• Winding up';
      return pose.phase === 'recovery' ? '• Recovering' : '• Attacking';
    }
    return '• Fighting';
  }
  if (!r && !world.terminal) return '• Crossing passage';
  if (r?.idleTicks && r.idleTicks > 0) return '• Resting';
  if (world.state === 'homebound' && r?.hero.moving) return '• Returning';
  if (r?.hero.moving) return '• Exploring';
  return world.terminal ? '• Finished' : '• Surveying';
}

export function readExpeditionVisual(world: WorldRunner): ExpeditionVisualState {
  const r = world.runner;
  const fight = r?.state === 'fighting' ? r.fight : null;
  const hero = fight?.p;
  // WorldRunner.pos is the single continuous position during combat, rooms and passages.
  const position = world.pos;
  const heroPose = hero && fight ? poseOf(hero, fight) : walk(r ? r.hero.moving : !world.terminal, world.tick);
  const heroFace = hero?.face ?? r?.hero.face ?? 0;
  const actors: ExpeditionVisualActor[] = [{
    id: 'hero', archetype: 'adventurer', illustrated: true,
    x: position.x, y: position.y, facing: facing(heroFace), ...heroPose,
    visible: true, combatSlot: fight ? 0 : null,
  }];
  if (r) for (let i = 0; i < r.foes.length; i++) {
    const foe = r.foes[i];
    const slot = fight && foe.engaged ? r.fightSlot(i) : -1;
    const fighter = slot >= 0 ? r.fighterOf(i) : null;
    const pose = !foe.alive ? { action: 'death' as const, phase: 'recovery' as const, progress: 1 } :
      fighter && fight ? poseOf(fighter, fight) : walk(false, world.tick);
    actors.push({
      id: 'foe-' + i, archetype: foe.arch, illustrated: illustrated(foe.arch),
      x: toWorld(ROOMS[world.room], { x: fighter?.x ?? foe.x, y: fighter?.y ?? foe.y }).x,
      y: toWorld(ROOMS[world.room], { x: fighter?.x ?? foe.x, y: fighter?.y ?? foe.y }).y,
      facing: facing(fighter?.face ?? foe.face), ...pose,
      visible: true, combatSlot: slot >= 0 ? slot + 1 : null,
    });
  }
  return {
    room: world.room, tick: world.tick, passage: r === null && !world.terminal,
    heroStatus: heroActionStatus(world),
    // world.tick - r.tick is the room-visit offset; r.fights increments on
    // each actual fight. Presentation never assigns combat identities.
    fightKey: fight && r ? `${world.room}:${world.tick - r.tick}:${r.fights}` : null,
    heroHealth: { value: world.hp, max: world.hpMax },
    fighting: !!fight, actors,
    combat: fight ? combatView(world.sim, fight) : undefined,
  };
}
