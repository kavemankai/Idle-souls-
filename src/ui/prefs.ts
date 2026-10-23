import type { SaveStore } from '../save/save';

/**
 * Per-device settings for the expedition screens. They live beside the save, never inside it: nothing here is game state and none of it can change
 * a run. A missing, damaged or blocked store gives the defaults.
 */
export interface Prefs {
  /** Larger text across the screens (accessibility). */
  bigText: boolean;
  /** null follows the system setting; true or false overrides it. */
  reduceMotion: boolean | null;
  /** The first-run guide has been seen or skipped. */
  onboarded: boolean;
  /** Independent volumes, 0 to 1. Sound itself is always off until the player presses Enable audio, whatever these say. */
  music: number; effects: number;
}
export const DEFAULT_PREFS: Readonly<Prefs> = { bigText: false, reduceMotion: null, onboarded: false, music: 0.4, effects: 0.7 };
const clamp01 = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : d);

export function parsePrefs(text: string | null): Prefs {
  if (!text) return { ...DEFAULT_PREFS };
  try {
    const o = JSON.parse(text) as Partial<Prefs>;
    return {
      bigText: o.bigText === true, reduceMotion: o.reduceMotion === true ? true : o.reduceMotion === false ? false : null, onboarded: o.onboarded === true,
      music: clamp01(o.music, DEFAULT_PREFS.music), effects: clamp01(o.effects, DEFAULT_PREFS.effects),
    };
  } catch { return { ...DEFAULT_PREFS }; }
}

export class PrefsStore {
  private value: Prefs;
  constructor(private readonly store: SaveStore) { this.value = parsePrefs(store.read()); }
  get(): Readonly<Prefs> { return this.value; }
  set(patch: Partial<Prefs>): Readonly<Prefs> {
    this.value = parsePrefs(JSON.stringify({ ...this.value, ...patch }));
    this.store.write(JSON.stringify(this.value));
    return this.value;
  }
  /** Motion is reduced when the player says so, or when they say nothing and the system asks for it. */
  reducedMotion(systemPrefers: boolean): boolean { return this.value.reduceMotion ?? systemPrefers; }
}
