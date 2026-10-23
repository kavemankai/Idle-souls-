import { STARTER_KIT, type Bank, type Cache } from '../save/saveTypes';
export { STARTER_KIT };
import type { Pickup } from '../world/roomTypes';

/**
 * What the adventurer carries is a Bank-shaped bundle (gold, supplies, found gear, recoverable mastery). It is at risk until camp: banking and the death
 * cache are the only two things that ever move it (doc 08). The starter sword and shield are not loot and never appear in any bundle.
 */
export type Carried = Bank;
/** Trial amounts per enemy type, awarded once per enemy per expedition. Not tuned. */
export const KILL_LOOT: Readonly<Record<string, { gold: number; mastery: number }>> = { mireling: { gold: 6, mastery: 2 }, sentry: { gold: 15, mastery: 5 } };
/** How close the adventurer must pass to take a pickup or the cache. */
export const PICKUP_REACH = 45;

export const emptyCarried = (): Carried => ({ gold: 0, supplies: {}, gear: [], mastery: 0 });
export const cloneBank = (b: Bank): Bank => ({ gold: b.gold, supplies: { ...b.supplies }, gear: b.gear.slice(), mastery: b.mastery });
export function isEmptyBank(b: Bank): boolean { return b.gold === 0 && b.mastery === 0 && b.gear.length === 0 && Object.values(b.supplies).every(n => n === 0); }
/** `a` plus `b`, as a new bundle. */
export function addBanks(a: Bank, b: Bank): Bank {
  const supplies = { ...a.supplies };
  for (const [k, n] of Object.entries(b.supplies)) if (n > 0) supplies[k] = (supplies[k] ?? 0) + n;
  return { gold: a.gold + b.gold, supplies, gear: [...a.gear, ...b.gear], mastery: a.mastery + b.mastery };
}
export function describeBank(b: Bank): string {
  const parts: string[] = [];
  if (b.gold) parts.push(`${b.gold} gold`);
  for (const [k, n] of Object.entries(b.supplies)) if (n) parts.push(`${n} ${k}`);
  for (const g of b.gear) parts.push(g);
  if (b.mastery) parts.push(`${b.mastery} mastery`);
  return parts.length ? parts.join(', ') : 'nothing';
}

/** One thing gained, for the intent feed and the Chronicle. */
export interface Gain { source: 'kill' | 'pickup' | 'cache'; room: string; label: string; bundle: Bank }
export interface DeathSpot { room: string; x: number; y: number }

/**
 * Everything at risk during one expedition. A kill pays once, a pickup is taken once, and a cache picked up is carried again like any find.
 * The ledger never banks: only `settle` (src/expedition/settle.ts) turns a finished expedition into a new save.
 */
export class Ledger {
  carried: Carried = emptyCarried();
  readonly gains: Gain[] = [];
  /** The cache this expedition started with, until the adventurer picks it up. */
  cache: Cache | null;
  recovered: Cache | null = null;
  private readonly taken = new Set<string>();
  private readonly paid = new Set<string>();
  constructor(cache: Cache | null = null) { this.cache = cache ? { ...cache, contents: cloneBank(cache.contents) } : null; }
  private add(g: Gain) { this.carried = addBanks(this.carried, g.bundle); this.gains.push(g); return g; }
  /** Pay for a kill the first time only; returns the gain or null. */
  kill(arch: string, room: string, index: number): Gain | null {
    const key = `${room}/${index}`;
    const table = KILL_LOOT[arch];
    if (this.paid.has(key) || !table) return null;
    this.paid.add(key);
    return this.add({ source: 'kill', room, label: `${arch} defeated`, bundle: { gold: table.gold, supplies: {}, gear: [], mastery: table.mastery } });
  }
  pickup(room: string, p: Pickup): Gain | null {
    if (this.taken.has(p.id)) return null;
    this.taken.add(p.id);
    const bundle: Bank = p.kind === 'supplies' ? { gold: 0, supplies: { [p.item]: p.qty }, gear: [], mastery: 0 } : { gold: 0, supplies: {}, gear: Array.from({ length: p.qty }, () => p.item), mastery: 0 };
    return this.add({ source: 'pickup', room, label: p.item, bundle });
  }
  /** Pick the old cache up. Its contents join what is carried and are exposed to the next death like everything else; they are not banked. */
  recoverCache(): Gain | null {
    const c = this.cache;
    if (!c) return null;
    this.cache = null; this.recovered = c;
    return this.add({ source: 'cache', room: c.room, label: 'recovery cache', bundle: cloneBank(c.contents) });
  }
}
