import type { Intent, IntentKind } from '../expedition/expedition';
import type { CueId } from '../audio/O1Audio';

/**
 * Sound for the expedition screen. Event cues reuse the CC0 cues already shipped under public/audio/cues; the music is the existing looping track.
 * Rules (doc 18, 19): nothing plays until the player presses Enable audio; music and effects have separate volumes; every cue that matters also
 * has a visual pair (`onVisual`), which fires whether or not sound is on. The choice of file per event is a first pass that needs a human to audition.
 */
export type ExpeditionCue = 'discovery' | 'retreat' | 'bank' | 'shortcut' | 'keySpent' | 'death' | 'sanctuary' | 'levelUp' | 'bossPhase';
export const CUE_MAP: Readonly<Record<ExpeditionCue, { file: CueId; label: string }>> = {
  discovery: { file: 'threshold', label: 'New ground mapped' },
  retreat: { file: 'ui_dispatch', label: 'Retreat confirmed' },
  bank: { file: 'ui_success', label: 'Back at camp' },
  shortcut: { file: 'ui_select', label: 'Shortcut opened' },
  keySpent: { file: 'perfect_block', label: 'Gate Key spent' },
  death: { file: 'hero_death', label: 'The adventurer fell' },
  sanctuary: { file: 'ui_select', label: 'Sanctuary: quiet' },
  levelUp: { file: 'ui_select', label: 'Level gained' },
  bossPhase: { file: 'heavy_swing', label: 'The boss changes phase' },
};
/** Intent kinds that never make a sound on purpose (they happen all the time or have no cue yet). */
export const SILENT_KINDS: readonly IntentKind[] = ['launch', 'route', 'objective', 'sweep', 'fight', 'redirect', 'skip', 'order', 'loot', 'ration'];

/** Which cue, if any, an intent line calls for. */
export function cueForIntent(i: Pick<Intent, 'kind' | 'text'>): ExpeditionCue | null {
  switch (i.kind) {
    case 'discovery': return 'discovery';
    case 'retreat': return /^Heading for camp/.test(i.text) ? 'retreat' : null;
    case 'sanctuary': return 'sanctuary';
    case 'level': return 'levelUp';
    case 'end': return /camp alive|Already at camp/.test(i.text) ? 'bank' : null;
    case 'loot': return /Spent 1 Gate Key/.test(i.text) ? 'keySpent' : /shortcut/i.test(i.text) && /open for good/.test(i.text) ? 'shortcut' : null;
    default: return null;
  }
}

export class ExpeditionAudio {
  private on = false;
  private musicEl: HTMLAudioElement | null = null;
  private music = 0.4;
  private effects = 0.7;
  private readonly live = new Set<HTMLAudioElement>();
  /** Every cue ever requested, with whether sound was on. For tests and the visual pair. */
  readonly played: { cue: ExpeditionCue; sounded: boolean }[] = [];
  constructor(private readonly onVisual: (text: string, cue: ExpeditionCue) => void = () => {}, private readonly base = '/audio') {}
  get enabled() { return this.on; }
  setLevels(music: number, effects: number) {
    this.music = Math.max(0, Math.min(1, music)); this.effects = Math.max(0, Math.min(1, effects));
    if (this.musicEl) this.musicEl.volume = this.music;
  }
  /** Must be called from a click or key press: browsers refuse to start sound otherwise. */
  enable() {
    if (this.on) return;
    this.on = true;
    try {
      this.musicEl = new Audio(`${this.base}/music/whispers.ogg`);
      this.musicEl.loop = true; this.musicEl.preload = 'none'; this.musicEl.volume = this.music;
      void this.musicEl.play().catch(() => {});
    } catch { this.musicEl = null; }
  }
  disable() {
    this.on = false;
    this.musicEl?.pause(); this.musicEl = null;
    for (const a of this.live) { a.pause(); a.src = ''; }
    this.live.clear();
  }
  /** Play a cue and show its visual pair. The visual pair always fires. */
  cue(c: ExpeditionCue) {
    this.played.push({ cue: c, sounded: this.on && this.effects > 0 });
    this.onVisual(CUE_MAP[c].label, c);
    if (!this.on || this.effects <= 0) return;
    try {
      const a = new Audio(`${this.base}/cues/${CUE_MAP[c].file}.ogg`);
      a.volume = this.effects; this.live.add(a);
      a.addEventListener('ended', () => this.live.delete(a));
      void a.play().catch(() => this.live.delete(a));
      // The sanctuary is a quiet place: the music steps down for a few seconds.
      if (c === 'sanctuary' && this.musicEl) { const m = this.musicEl, v = this.music; m.volume = v * 0.3; setTimeout(() => { m.volume = v; }, 4000); }
    } catch { /* no audio device: the visual pair already told the player */ }
  }
  /** For the boss work (M8) to call when a boss changes phase. */
  playBossPhase() { this.cue('bossPhase'); }
  /** Route a feed line to its cue, if it has one. */
  onIntent(i: Pick<Intent, 'kind' | 'text'>) { const c = cueForIntent(i); if (c) this.cue(c); }
}
