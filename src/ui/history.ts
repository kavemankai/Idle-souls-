import type { Chronicle } from '../expedition/chronicle';
import type { SaveStore } from '../save/save';

/** One finished expedition as the player sees it later: the Chronicle plus the words the screen showed (what happened to the loot, what killed the adventurer). */
export interface HistoryEntry {
  /** Seed, digest and the expedition's place in the save, so two runs with one seed do not collide. */
  id: string;
  /** Milliseconds since 1970 when the expedition ended. The Chronicle itself has no clock. */
  at: number;
  chronicle: Chronicle;
  /** The settlement lines shown at the end: banked, cached, lost. */
  settlement: string[];
  /** Plain words for what ended a fall, from the simulator's own blame; null when the expedition did not end in a fall. */
  deathCause: string | null;
}
export const HISTORY_LIMIT = 20;
/** Cap on stored text so a pile of long Chronicles can never fill the browser's storage. */
export const HISTORY_BYTES = 1_500_000;

/**
 * The last few Chronicles, kept in browser storage under their own key. Not part of the save document: losing them costs the player a memory, never
 * a bank, a cache or a map. Newest first.
 */
export class History {
  constructor(private readonly store: SaveStore, private readonly limit = HISTORY_LIMIT) {}
  list(): HistoryEntry[] {
    const text = this.store.read();
    if (!text) return [];
    try {
      const v = JSON.parse(text) as unknown;
      return Array.isArray(v) ? (v as HistoryEntry[]).filter(e => e && typeof e.id === 'string' && e.chronicle && e.chronicle.version >= 2) : [];
    } catch { return []; }
  }
  add(entry: HistoryEntry): void {
    let all = [entry, ...this.list().filter(e => e.id !== entry.id)].slice(0, this.limit);
    while (all.length > 1 && JSON.stringify(all).length > HISTORY_BYTES) all = all.slice(0, -1);
    this.store.write(JSON.stringify(all));
  }
  clear(): void { this.store.write('[]'); }
  get(id: string): HistoryEntry | undefined { return this.list().find(e => e.id === id); }
}
export const entryId = (c: Chronicle, expeditionIndex: number) => `${c.seed}-${c.digest}-${expeditionIndex}`;
