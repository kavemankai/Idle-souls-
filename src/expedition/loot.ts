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

export const emptyCarried = (): Carried => ({ gold: 0, supplies: {}, gear: [], mastery: 0, keys: 0, prepared: 0 });
export const cloneBank = (b: Bank): Bank => ({ gold: b.gold, supplies: { ...b.supplies }, gear: b.gear.slice(), mastery: b.mastery, keys: b.keys, prepared: b.prepared });
export function isEmptyBank(b: Bank): boolean { return b.gold === 0 && b.mastery === 0 && b.keys === 0 && b.prepared === 0 && b.gear.length === 0 && Object.values(b.supplies).every(n => n === 0); }
/** `a` plus `b`, as a new bundle. */
export function addBanks(a: Bank, b: Bank): Bank {
  const supplies = { ...a.supplies };
  for (const [k, n] of Object.entries(b.supplies)) if (n > 0) supplies[k] = (supplies[k] ?? 0) + n;
  return { gold: a.gold + b.gold, supplies, gear: [...a.gear, ...b.gear], mastery: a.mastery + b.mastery, keys: a.keys + b.keys, prepared: a.prepared + b.prepared };
}
export function describeBank(b: Bank): string {
  const parts: string[] = [];
  if (b.gold) parts.push(`${b.gold} gold`);
  for (const [k, n] of Object.entries(b.supplies)) if (n) parts.push(`${n} ${k}`);
  for (const g of b.gear) parts.push(g);
  if (b.keys) parts.push(`${b.keys} Gate Key${b.keys === 1 ? '' : 's'}`);
  if (b.prepared) parts.push(`${b.prepared} prepared Gate Key${b.prepared === 1 ? '' : 's'}`);
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
  carried: Carried;
  readonly gains: Gain[] = [];
  /** The cache this expedition started with, until the adventurer picks it up. */
  cache: Cache | null;
  recovered: Cache | null = null;
  /** Gates and shortcuts opened during this expedition (link keys). They stay open for good, whatever happens next. */
  readonly opened = new Set<string>();
  /** Keys spent on gates this expedition. A spent key is gone: it is in no bank and no cache. */
  spent = 0;
  /** One-time discoveries claimed during this expedition. */
  readonly claimed = new Set<string>();
  /** Gate Keys issued from camp at launch. */
  readonly issued: number;
  /** Rations from the starter kit: drunk first, never banked and never put in a cache (they are not loot). */
  kitRations = 0;
  /** Rations drunk this expedition, from the kit or from loot. */
  rationsUsed = 0;
  private readonly taken = new Set<string>();
  private readonly paid = new Set<string>();
  constructor(cache: Cache | null = null, issued = 0, private readonly priorClaims: ReadonlySet<string> = new Set(), private readonly priorOpen: ReadonlySet<string> = new Set()) {
    this.cache = cache ? { ...cache, contents: cloneBank(cache.contents) } : null;
    this.issued = issued;
    this.carried = { ...emptyCarried(), prepared: issued };
  }
  isOpen(link: string) { return this.priorOpen.has(link) || this.opened.has(link); }
  private add(g: Gain) { this.carried = addBanks(this.carried, g.bundle); this.gains.push(g); return g; }
  /** Pay for a kill the first time only; returns the gain or null. */
  kill(arch: string, room: string, index: number): Gain | null {
    const key = `${room}/${index}`;
    const table = KILL_LOOT[arch];
    if (this.paid.has(key) || !table) return null;
    this.paid.add(key);
    return this.add({ source: 'kill', room, label: `${arch} defeated`, bundle: { ...emptyCarried(), gold: table.gold, mastery: table.mastery } });
  }
  pickup(room: string, p: Pickup): Gain | null {
    if (this.taken.has(p.id)) return null;
    if (p.kind === 'key' && p.claim === 'once' && this.priorClaims.has(p.id)) return null;   // a one-time discovery pays once, ever
    this.taken.add(p.id);
    if (p.kind === 'key' && p.claim === 'once') this.claimed.add(p.id);
    const bundle: Bank = p.kind === 'supplies' ? { ...emptyCarried(), supplies: { [p.item]: p.qty } }
      : p.kind === 'key' ? { ...emptyCarried(), keys: p.qty }
      : { ...emptyCarried(), gear: Array.from({ length: p.qty }, () => p.item) };
    return this.add({ source: 'pickup', room, label: p.item, bundle });
  }
  /** Pick the old cache up. Its contents join what is carried and are exposed to the next death like everything else; they are not banked. Keys keep their provenance. */
  recoverCache(): Gain | null {
    const c = this.cache;
    if (!c) return null;
    this.cache = null; this.recovered = c;
    return this.add({ source: 'cache', room: c.room, label: 'recovery cache', bundle: cloneBank(c.contents) });
  }
  get rations(): number { return this.kitRations + (this.carried.supplies.ration ?? 0); }
  /** Drink one ration: the kit's first, then a found one. Returns where it came from, or null when none is left. */
  useRation(): 'kit' | 'found' | null {
    if (this.kitRations > 0) { this.kitRations--; this.rationsUsed++; return 'kit'; }
    const n = this.carried.supplies.ration ?? 0;
    if (n < 1) return null;
    this.carried = { ...this.carried, supplies: { ...this.carried.supplies, ration: n - 1 } };
    this.rationsUsed++;
    return 'found';
  }
  /** Spend one prepared (eligible) key to open a sealed gate for good. Fresh keys cannot do this (L19). Returns false and changes nothing when no eligible key is carried. */
  spendKey(link: string): boolean {
    if (this.isOpen(link)) return false;
    if (this.carried.prepared < 1) return false;
    this.carried = { ...this.carried, prepared: this.carried.prepared - 1 };
    this.spent++; this.opened.add(link);
    return true;
  }
  /** Activate a keyless shortcut (the sluice). */
  activate(link: string): boolean {
    if (this.isOpen(link)) return false;
    this.opened.add(link);
    return true;
  }
}
