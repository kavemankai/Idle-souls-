import { GLOSSARY } from './glossary';
import type { PrefsStore } from './prefs';

type Kids = (Node | string | null | false)[];
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | boolean | number | ((e: Event) => void)> = {}, ...kids: Kids): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v);
    else if (typeof v === 'boolean') { if (v) el.setAttribute(k, ''); } else el.setAttribute(k, String(v));
  }
  for (const k of kids) if (k !== null && k !== false) el.append(k);
  return el;
}

/** The first-run guide: six short screens in plain words. It is a card in the page, never a modal, and skipping it is one press. */
export const GUIDE: readonly { title: string; text: string }[] = [
  { title: 'You plan, it walks', text: 'Choose where to go. The adventurer walks there, fights and finds its own way. You do not steer. You can turn it back or change its course.' },
  { title: 'What is at risk', text: 'Everything you win or pick up is carried and at risk until the adventurer is back at camp alive. Only camp banks it. A retreat does not.' },
  { title: 'If it falls', text: 'What it carried stays in one recovery cache where it fell. Fetch it before the next fall, or it is lost. The starter sword and shield are never lost.' },
  { title: 'Avoid is absolute', text: 'Rooms on the Avoid list are never entered, even on the way home. If the only way home crosses one, the adventurer stops rather than break your rule.' },
  { title: 'Retreat', text: 'Retreat any time. In a fight the adventurer stops attacking and walks out by the nearest permitted way. Enemies stay in their room, but they can still hit it on the way.' },
  { title: 'Fog and gates', text: 'The map shows only what you have entered. A sealed gate needs a Gate Key: carry one home, bank it, then take it on a later expedition.' },
];

/** Where the guide stands. Kept outside the screen so a re-render does not send the player back to step one. */
export class Guide {
  step = 0;
  /** Opened by the Help button even after the first run. */
  forced = false;
  constructor(private readonly prefs: PrefsStore) {}
  get visible() { return this.forced || !this.prefs.get().onboarded; }
  open() { this.forced = true; this.step = 0; }
  finish() { this.forced = false; this.prefs.set({ onboarded: true }); }
  render(rerender: () => void): HTMLElement | null {
    if (!this.visible) return null;
    const s = GUIDE[this.step], last = this.step === GUIDE.length - 1;
    return h('section', { class: 'card guide', id: 'guide', 'aria-labelledby': 'guide-title' },
      h('p', { class: 'eyebrow' }, `Welcome · ${this.step + 1} of ${GUIDE.length}`),
      h('h2', { id: 'guide-title' }, s.title),
      h('p', { id: 'guide-text' }, s.text),
      h('div', { class: 'row' },
        h('button', { type: 'button', id: 'guide-back', disabled: this.step === 0, onclick: () => { this.step--; rerender(); } }, 'Back'),
        h('button', { type: 'button', id: 'guide-next', class: 'primary-inline', onclick: () => { if (last) this.finish(); else this.step++; rerender(); } }, last ? 'Done' : 'Next'),
        h('button', { type: 'button', id: 'guide-skip', onclick: () => { this.finish(); rerender(); } }, 'Skip the guide')));
  }
}

/** The glossary as a drawer at the bottom of the plan screen: every term in the feed, one sentence each. */
export function glossaryDrawer(): HTMLElement {
  return h('details', { class: 'card', id: 'glossary' }, h('summary', {}, 'Glossary: what the words mean'),
    h('dl', { class: 'glossary' }, ...GLOSSARY.flatMap(t => [h('dt', { id: `term-${t.id}` }, t.term), h('dd', {}, t.meaning)])));
}
