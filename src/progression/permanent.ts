import type { CommitResult, DurableRepository, SaveV3 } from '../save/durable';

export const PERMANENT_TABLE_VERSION = 1;
export type PermanentUpgradeId = 'training' | 'weapon' | 'shield';
export interface PermanentUpgrade {
  id: PermanentUpgradeId;
  title: string;
  description: string;
  /** Price to advance from rank 0 to 1, rank 1 to 2, and so on. */
  prices: readonly { gold: number; mastery: number }[];
}
export const PERMANENT_UPGRADES: readonly PermanentUpgrade[] = [
  {
    id: 'training', title: 'Training', description: 'Raises the starting design level by one; experience gained during expeditions stays temporary.',
    prices: [{ gold: 0, mastery: 8 }, { gold: 0, mastery: 20 }, { gold: 0, mastery: 40 }],
  },
  {
    id: 'weapon', title: 'Sharpen sword', description: 'Permanent +2 swingSkill per rank, never above the simulator stat cap.',
    prices: [{ gold: 20, mastery: 4 }, { gold: 45, mastery: 10 }],
  },
  {
    id: 'shield', title: 'Reinforce shield', description: 'Permanent +2 guardStrength per rank, never above the simulator stat cap.',
    prices: [{ gold: 20, mastery: 4 }, { gold: 45, mastery: 10 }],
  },
] as const;
export interface PurchaseRequest { upgradeId: PermanentUpgradeId; expectedRank: number }
export type PurchaseDecision =
  { ok: true; save: SaveV3; price: { gold: number; mastery: number }; nextRank: number; duplicate: boolean } |
  { ok: false; error: string };
export function permanentUpgrade(id: string): PermanentUpgrade | null {
  return PERMANENT_UPGRADES.find(x => x.id === id) ?? null;
}
export function permanentStartingLevel(save: SaveV3): number { return 1 + save.camp.permanent.training; }
export function permanentStatBonus(save: SaveV3): Readonly<Record<string, number>> {
  return {
    swingSkill: Math.min(20, 2 * save.camp.permanent.weapon),
    guardStrength: Math.min(20, 2 * save.camp.permanent.shield),
  };
}
/** Pure economic command. The repository wraps this in the same atomic revision/ID transaction used for settlement. */
export function purchaseUpgrade(save: SaveV3, request: PurchaseRequest, transactionId: string): PurchaseDecision {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(transactionId)) return { ok: false, error: 'Invalid transaction identity' };
  if (save.processedTransactionIds.includes(transactionId)) return {
    ok: true, save, price: { gold: 0, mastery: 0 },
    nextRank: save.camp.permanent[request.upgradeId] ?? 0, duplicate: true,
  };
  if (save.version !== 3 || save.rulesVersion !== 1 || save.contentVersion !== 1) return { ok: false, error: 'Unsupported save version' };
  if (save.activeExpedition !== null) return { ok: false, error: 'Upgrades can only be bought at camp between expeditions' };
  const upgrade = permanentUpgrade(request.upgradeId);
  if (!upgrade) return { ok: false, error: 'Unknown permanent upgrade' };
  const rank = save.camp.permanent[upgrade.id];
  if (!Number.isInteger(request.expectedRank) || request.expectedRank !== rank) return { ok: false, error: 'Stale or impossible upgrade rank' };
  const price = upgrade.prices[rank];
  if (!price) return { ok: false, error: 'Upgrade is already at its rank cap' };
  if (!Number.isSafeInteger(save.camp.bank.gold) || !Number.isSafeInteger(save.camp.bank.mastery) ||
    save.camp.bank.gold < price.gold || save.camp.bank.mastery < price.mastery) {
    return { ok: false, error: 'Not enough safely banked gold and mastery' };
  }
  return {
    ok: true, duplicate: false, nextRank: rank + 1, price,
    save: {
      ...save, camp: {
        ...save.camp,
        permanent: { ...save.camp.permanent, [upgrade.id]: rank + 1 },
        bank: { ...save.camp.bank, gold: save.camp.bank.gold - price.gold, mastery: save.camp.bank.mastery - price.mastery },
      },
    },
  };
}
/** Durable, idempotent purchase; a failed storage write applies NO apparent upgrade. */
export function commitPurchase(
  repo: DurableRepository, revision: number, request: PurchaseRequest, transactionId: string,
): Promise<CommitResult> {
  return repo.commit(revision, transactionId, previous => {
    const decision = purchaseUpgrade(previous, request, transactionId);
    if (!decision.ok) throw new Error(decision.error);
    return decision.save;
  });
}
