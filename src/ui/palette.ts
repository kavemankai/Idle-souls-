/**
 * The colours the expedition screens use, in one place. CSS reads them as custom properties (see `applyPalette`), the canvas reads them from here,
 * and `tests/a11y.test.ts` computes the contrast of every pair listed below, so a colour cannot drift below WCAG AA unnoticed.
 */
export const COLORS = {
  page: '#121f1d', card: '#1a2c28', control: '#21342c', pressed: '#3b5a4c', badge: '#223a33', map: '#10201d', mapFog: '#17262a', mapKnown: '#223a33', mapSeen: '#2d4a40',
  text: '#e0decb', muted: '#a3afa0', accent: '#f1d49a', pressedText: '#f6efd0', warn: '#e8a27c', ok: '#c5e8cc', bad: '#f0b4a4',
  /** Boundaries of controls and map shapes: at least 3:1 against every surface they sit on (WCAG 1.4.11). */
  line: '#8aa393', lineOk: '#8fc29a', lineBad: '#d9786a', lineWarn: '#e1b862',
} as const;
export type ColorName = keyof typeof COLORS;

function luminance(hex: string): number {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** WCAG contrast ratio between two #rrggbb colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export interface Pair { fg: ColorName; bg: ColorName; use: string; min: number }
const TEXT = 4.5, UI = 3;
/** Every text colour on every surface it is drawn on, and every control or map boundary against the surface behind it. */
export const PAIRS: readonly Pair[] = [
  ...(['page', 'card', 'control', 'badge', 'map'] as const).flatMap(bg => (['text', 'muted', 'accent', 'warn', 'ok', 'bad'] as const).map(fg => ({ fg, bg, use: `${fg} text on ${bg}`, min: TEXT }))),
  { fg: 'pressedText', bg: 'pressed', use: 'pressed button text', min: TEXT },
  { fg: 'text', bg: 'pressed', use: 'text on a pressed button', min: TEXT },
  ...(['page', 'card', 'control'] as const).map(bg => ({ fg: 'line' as const, bg, use: `control border on ${bg}`, min: UI })),
  ...(['card', 'map'] as const).flatMap(bg => (['lineOk', 'lineBad', 'lineWarn'] as const).map(fg => ({ fg, bg, use: `${fg} map mark on ${bg}`, min: UI }))),
  { fg: 'line', bg: 'map', use: 'room outline on the map', min: UI },
];
/** Put the palette on an element as CSS custom properties (--c-page, --c-text, ...). */
export function applyPalette(el: HTMLElement): void {
  for (const [k, v] of Object.entries(COLORS)) el.style.setProperty(`--c-${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`, v);
}
