/** The save document. One versioned JSON text; the format knows nothing about where it is stored, so it can sync to an account later. */
export const SAVE_VERSION = 2;
/** The starter sword and shield are guaranteed and are never loot: they appear in no bank and no cache. */
export const STARTER_KIT: readonly string[] = ['starter-sword', 'starter-shield'];
/**
 * A bundle of things. In the camp bank `keys` is the banked Gate Key stock and `prepared` is always 0. In a carried bundle or a cache `keys` are fresh keys
 * (found this run or recovered from a cache, ineligible to open a gate until banked, L19) and `prepared` are keys issued from camp (eligible, L20).
 */
export interface Bank { gold: number; supplies: Record<string, number>; gear: string[]; mastery: number; keys: number; prepared: number }
export interface Cache { room: string; x: number; y: number; contents: Bank }
export interface SaveV2 {
  version: 2;
  /** Build that wrote the file; informational. */
  build: string;
  world: {
    /** Rooms the player has seen. Map memory is permanent. */
    discovered: string[];
    /** Link keys (WorldGraph.linkKey) that are open for good: a gate unlocked, a shortcut activated. */
    openedLinks: string[];
    defeatedBosses: string[];
    /** One-time discoveries already claimed (a claimed key is never granted again, even if it was dropped). */
    claims: string[];
  };
  camp: { bank: Bank; cache: Cache | null; expeditions: number; deaths: number };
  settings: { music: number; effects: number; reducedFx: boolean };
}
/** The shape before Gate Keys were tracked. Kept so the migration is typed. */
export interface SaveV1 {
  version: 1; build: string;
  world: { discovered: string[]; openedLinks: string[]; defeatedBosses: string[]; keysBanked: number };
  camp: { bank: Omit<Bank, 'keys' | 'prepared'>; cache: (Omit<Cache, 'contents'> & { contents: Omit<Bank, 'keys' | 'prepared'> }) | null; expeditions: number; deaths: number };
  settings: SaveV2['settings'];
}
export type Save = SaveV2;
export type AnySave = SaveV1 | SaveV2;
export const emptyBank = (): Bank => ({ gold: 0, supplies: {}, gear: [], mastery: 0, keys: 0, prepared: 0 });
export function defaultSave(build = 'dev'): Save {
  return {
    version: 2, build,
    world: { discovered: ['C0'], openedLinks: [], defeatedBosses: [], claims: [] },
    camp: { bank: emptyBank(), cache: null, expeditions: 0, deaths: 0 },
    settings: { music: 0.6, effects: 0.8, reducedFx: false },
  };
}
