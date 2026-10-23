/** The save document. One versioned JSON text; the format knows nothing about where it is stored, so it can sync to an account later. */
export const SAVE_VERSION = 1;
/** The starter sword and shield are guaranteed and are never loot: they appear in no bank and no cache. */
export const STARTER_KIT: readonly string[] = ['starter-sword', 'starter-shield'];
export interface Bank { gold: number; supplies: Record<string, number>; gear: string[]; mastery: number }
export interface Cache { room: string; x: number; y: number; contents: Bank }
export interface SaveV1 {
  version: 1;
  /** Build that wrote the file; informational. */
  build: string;
  world: {
    /** Rooms the player has seen. Map memory is permanent. */
    discovered: string[];
    /** Link keys (WorldGraph.linkKey) that are open for good. */
    openedLinks: string[];
    defeatedBosses: string[];
    keysBanked: number;
  };
  camp: { bank: Bank; cache: Cache | null; expeditions: number; deaths: number };
  settings: { music: number; effects: number; reducedFx: boolean };
}
export type AnySave = SaveV1;
export const emptyBank = (): Bank => ({ gold: 0, supplies: {}, gear: [], mastery: 0 });
export function defaultSave(build = 'dev'): SaveV1 {
  return {
    version: 1, build,
    world: { discovered: ['C0'], openedLinks: [], defeatedBosses: [], keysBanked: 0 },
    camp: { bank: emptyBank(), cache: null, expeditions: 0, deaths: 0 },
    settings: { music: 0.6, effects: 0.8, reducedFx: false },
  };
}
