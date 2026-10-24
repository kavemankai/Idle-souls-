import type { Action, CombatView, Facing, Phase } from '../contracts/presentation';
import { facingFromVector } from './directions';
import { poseOf } from '../world/o1Adapter';
import { combatView } from '../world/o1Combat';
import { toLocal } from '../world/worldRunner';
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
  readonly fighting: boolean;
  readonly passage: boolean;
  readonly actors: readonly ExpeditionVisualActor[];
  readonly combat?: CombatView;
}
const illustrated = (arch: string) => arch === 'adventurer' || arch === 'mireling' || arch === 'sentry';
const facing = (angle: number): Facing => facingFromVector(Math.cos(angle), Math.sin(angle));
const walk = (moving: boolean, tick: number): Pick<ExpeditionVisualActor, 'action' | 'phase' | 'progress'> =>
  ({ action: moving ? 'walk' : 'idle', phase: 'active', progress: moving ? tick % 18 / 18 : 0 });

export function readExpeditionVisual(world: WorldRunner): ExpeditionVisualState {
  const r = world.runner;
  const fight = r?.state === 'fighting' ? r.fight : null;
  const hero = fight?.p;
  const position = r ? (hero ?? r.hero) : toLocal(ROOMS[world.room], world.pos);
  const heroPose = hero && fight ? poseOf(hero, fight) : walk(r?.hero.moving ?? false, world.tick);
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
      x: fighter?.x ?? foe.x, y: fighter?.y ?? foe.y,
      facing: facing(fighter?.face ?? foe.face), ...pose,
      visible: true, combatSlot: slot >= 0 ? slot + 1 : null,
    });
  }
  return {
    room: world.room, tick: world.tick, passage: r === null,
    fighting: !!fight, actors,
    combat: fight ? combatView(world.sim, fight) : undefined,
  };
}
