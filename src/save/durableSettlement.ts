import type { Chronicle } from '../expedition/chronicle';
import { settle } from '../expedition/settle';
import {
  type ActiveExpeditionV3, type CommitResult, type DurableRepository, type SaveV3, toLegacy,
} from './durable';

const asV3 = (old: SaveV3, changed: ReturnType<typeof settle>['save']): SaveV3 => ({
  ...old, build: changed.build, world: changed.world,
  camp: { ...changed.camp, permanent: old.camp.permanent },
  settings: changed.settings,
});
/** Atomic dispatch: the checkpoint exists durably before player controls are enabled. */
export async function commitDispatch(repo: DurableRepository, revision: number, active: ActiveExpeditionV3): Promise<CommitResult> {
  return repo.commit(revision, 'dispatch:' + active.id, old => {
    if (old.activeExpedition) throw new Error('Finish or explicitly discard the existing expedition');
    if (active.tick !== 0 || active.commands.length) throw new Error('Dispatch checkpoint must be at tick zero');
    return { ...old, activeExpedition: active };
  });
}
/** Durable periodic checkpoint. Out-of-order asynchronous writes can never move the run backward. */
export async function commitCheckpoint(
  repo: DurableRepository, revision: number, active: ActiveExpeditionV3,
): Promise<CommitResult> {
  return repo.commit(revision, 'checkpoint:' + active.id + ':' + active.tick + ':' + active.commands.length, old => {
    if (!old.activeExpedition || old.activeExpedition.id !== active.id) throw new Error('Checkpoint expedition identity differs');
    if (active.tick < old.activeExpedition.tick) throw new Error('Checkpoint would rewind durable simulation');
    if (active.commands.length < old.activeExpedition.commands.length) throw new Error('Checkpoint omitted accepted orders');
    return { ...old, activeExpedition: active };
  });
}
/**
 * Authoritative one-time settlement, guarded by both the transaction ledger
 * and the active expedition identity. A repeated callback cannot settle a
 * different run or reclaim a formerly banked reward.
 */
export async function commitSettlement(
  repo: DurableRepository, revision: number, expeditionId: string,
  chronicle: Chronicle, startedAt: number,
): Promise<CommitResult> {
  return repo.commit(revision, 'settle:' + expeditionId, old => {
    if (!old.activeExpedition || old.activeExpedition.id !== expeditionId) throw new Error('No matching active expedition to settle');
    if (old.camp.expeditions !== startedAt) throw new Error('Expedition counter changed before settlement');
    if (old.activeExpedition.config.seed !== chronicle.seed) throw new Error('Chronicle seed does not match dispatch');
    const domain = settle(toLegacy(old), chronicle, startedAt);
    if (!domain.applied) throw new Error(domain.refused ?? 'Settlement refused');
    return { ...asV3(old, domain.save), activeExpedition: null };
  });
}
/** Discard means discard the unbanked run. It never invokes settle. */
export async function commitDiscard(repo: DurableRepository, revision: number, expeditionId: string): Promise<CommitResult> {
  return repo.commit(revision, 'discard:' + expeditionId, old => {
    if (!old.activeExpedition || old.activeExpedition.id !== expeditionId) throw new Error('No matching expedition to discard');
    return { ...old, activeExpedition: null };
  });
}
