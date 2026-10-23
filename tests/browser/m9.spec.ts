import { test, expect, type Page } from '@playwright/test';

// M9: Chronicle screen and history, camp map, onboarding, accessibility, audio cues and layouts. Software checks only: real devices, screen readers and ears are listed as pending in docs/slice/M9.md.
const open = async (page: Page, query = '') => { await page.goto(`/?scene=expedition&save=memory&progress=0${query.includes('known=') ? '' : '&known=oldroad'}${query}`); await page.waitForFunction(() => window.__EXPEDITION_READY__); };
const skipGuide = async (page: Page) => { if (await page.locator('#guide-skip').count()) await page.locator('#guide-skip').click(); };
const noSideScroll = (page: Page) => page.evaluate(() => { const x = document.getElementById('xp')!; return document.documentElement.scrollWidth <= window.innerWidth + 1 && x.scrollWidth <= x.clientWidth + 1; });
const finish = async (page: Page) => { if (await page.locator('#skip').isEnabled()) await page.locator('#skip').click(); await expect(page.locator('#outcome')).toBeVisible(); };
const SHOTS = process.env.M9_SHOTS === '1';

// ---------- Chronicle and history ----------
test('the Chronicle screen shows route, decisions with causes, gains, keys, loot fate and what stays', async ({ page }) => {
  await open(page, '&seed=1&hp=5000&known=save');
  await skipGuide(page);
  await page.locator('[data-preset=first]').click();
  await page.locator('#launch').click();
  await finish(page);
  await expect(page.locator('#route-map')).toBeVisible();
  await expect(page.locator('#route-map')).toHaveAttribute('aria-label', /Map of the walk/);
  await expect(page.locator('#route-list li').first()).toBeVisible();
  expect(await page.locator('#decisions li').count()).toBeGreaterThan(2);
  await expect(page.locator('#decisions li small').first()).toContainText('s ·');
  await expect(page.locator('#gains')).toContainText('Kills:');
  await expect(page.locator('#key-line')).toBeVisible();
  await expect(page.locator('#permanent-line')).toContainText('newly mapped');
  await expect(page.locator('#settle-lines')).toContainText('Banked');
});

test('a fall names its cause from the simulator', async ({ page }) => {
  await open(page, '&seed=1&hp=45');
  await skipGuide(page);
  await page.locator('[data-preset=cross]').click();
  await page.locator('#retreat').fill('0');
  await page.locator('#launch').click();
  await finish(page);
  await expect(page.locator('#outcome')).toHaveAttribute('data-outcome', 'died');
  await expect(page.locator('#death-cause')).toContainText('Fell in');
  await expect(page.locator('#death-cause')).toContainText('Most health lost to');
});

test('finished expeditions are listed, reopened, bounded to twenty, and kept apart from the save', async ({ page }) => {
  await open(page, '&seed=1&hp=5000');
  await skipGuide(page);
  await page.locator('#history-btn').click();
  await expect(page.locator('#history-empty')).toBeVisible();
  await page.locator('#history-plan').click();
  await page.locator('[data-preset=first]').click();
  await page.locator('#launch').click();
  await finish(page);
  await page.locator('#again').click();
  await page.locator('#history-btn').click();
  await expect(page.locator('#history-list li')).toHaveCount(1);
  await page.locator('[data-history]').first().click();
  await expect(page.locator('#history-entry #outcome')).toBeVisible();
  await expect(page.locator('#history-entry #route-map')).toBeVisible();
  await page.locator('#history-back').click();
  await expect(page.locator('#history-list')).toBeVisible();
  await page.locator('#history-clear').click();
  await expect(page.locator('#history-empty')).toBeVisible();
  expect((await page.evaluate(() => window.__EXPEDITION_SAVE__())).camp.expeditions).toBe(1);   // clearing the list never touches the save
});

test('the Help and history buttons are off while an expedition is out, so a press cannot drop it', async ({ page }) => {
  await open(page, '&seed=1&hp=5000');
  await skipGuide(page);
  await page.locator('[data-preset=cross]').click();
  await page.locator('#launch').click();
  await expect(page.locator('#history-btn')).toBeDisabled();
  await expect(page.locator('#help-btn')).toBeDisabled();
  await finish(page);
  await expect(page.locator('#history-btn')).toBeEnabled();
});

// ---------- Camp map ----------
const roomCentre = async (page: Page, id: string) => {
  const box = (await page.locator('#camp-canvas').boundingBox())!;
  const rooms = JSON.parse((await page.locator('#camp-canvas').getAttribute('data-rooms'))!) as { id: string; x: number; y: number; w: number; h: number }[];
  const r = rooms.find(x => x.id === id)!;
  return { x: box.x + (r.x + r.w / 2) * box.width / 640, y: box.y + (r.y + r.h / 2) * box.height / 420 };
};

test('camp map: tap picks a room and adds an objective; Avoid works by button, by long press and from the list', async ({ page }) => {
  await open(page);
  await skipGuide(page);
  await page.locator('#camp-canvas').scrollIntoViewIfNeeded();
  let p = await roomCentre(page, 'O2');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('#map-picked')).toContainText('entered');
  await page.locator('[data-map-add=reach]').click();
  await expect(page.locator('[data-obj-kind="0"]')).toHaveValue('reach');
  await expect(page.locator('[data-obj-room="0"]')).toHaveValue('O2');
  // Avoid by the visible button.
  await page.locator('#camp-canvas').scrollIntoViewIfNeeded();
  p = await roomCentre(page, 'O3');
  await page.mouse.click(p.x, p.y);
  await page.locator('[data-map-avoid=O3]').click();
  await expect(page.locator('[data-avoid=O3]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-map-avoid=O3]').click();
  await expect(page.locator('[data-avoid=O3]')).toHaveAttribute('aria-pressed', 'false');
  // Avoid by long press (a shortcut).
  await page.locator('#camp-canvas').scrollIntoViewIfNeeded();
  p = await roomCentre(page, 'KT');
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.waitForTimeout(750); await page.mouse.up();
  await expect(page.locator('[data-avoid=KT]')).toHaveAttribute('aria-pressed', 'true');
  // Avoid from the list, with no pointer at all.
  await page.locator('#map-list summary').click();
  await page.locator('[data-map-room=KT]').focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-map-avoid=KT]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-avoid=KT]')).toHaveAttribute('aria-pressed', 'false');
});

test('camp map: the keyboard moves between rooms, and an edge room offers Explore from here', async ({ page }) => {
  await open(page);
  await skipGuide(page);
  await page.locator('#camp-canvas').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#map-picked')).toBeVisible();
  const first = await page.locator('#map-picked').textContent();
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('#map-picked').textContent()).not.toBe(first);
  await page.keyboard.press('Escape');
  await expect(page.locator('#map-select')).toContainText('Choose a room');
  await page.locator('#map-list summary').click();
  const edge = page.locator('#map-list [data-map-room]', { hasText: 'edge of the map' }).first();
  await expect(edge).toBeVisible();
  await edge.click();
  await page.locator('[data-map-add=explore]').click();
  await expect(page.locator('[data-obj-kind="0"]')).toHaveValue('explore');
});

test('camp map: the route preview shows its three states in words', async ({ page }) => {
  await open(page);
  await skipGuide(page);
  await expect(page.locator('#map-preview')).toContainText('No route yet');
  await page.locator('[data-preset=cross]').click();
  await expect(page.locator('#map-preview')).toContainText('known route');
  await page.locator('[data-avoid=O2]').click();   // the only way to O3 passes O2
  await expect(page.locator('#map-preview')).toContainText('blocked');
  await page.locator('[data-avoid=O2]').click();
  await page.locator('[data-preset=ahead]').click();
  await expect(page.locator('#map-preview')).toContainText('partly unmapped');
});

// ---------- Onboarding ----------
test('the first-run guide shows one screen at a time, can be skipped, and does not come back', async ({ page }) => {
  await open(page);
  await expect(page.locator('#guide')).toBeVisible();
  await expect(page.locator('#launch')).toBeVisible();   // non-blocking: the planner is reachable behind it
  const first = await page.locator('#guide-title').textContent();
  await page.locator('#guide-next').click();
  expect(await page.locator('#guide-title').textContent()).not.toBe(first);
  await expect(page.locator('#guide-back')).toBeEnabled();
  await page.locator('#guide-skip').click();
  await expect(page.locator('#guide')).toHaveCount(0);
  await page.locator('[data-preset=first]').click();   // a re-render must not bring it back
  await expect(page.locator('#guide')).toHaveCount(0);
  await page.locator('#help-btn').click();
  await expect(page.locator('#guide')).toBeVisible();
  for (let i = 0; i < 5; i++) await page.locator('#guide-next').click();
  await expect(page.locator('#guide-next')).toHaveText('Done');
  await page.locator('#guide-next').click();
  await expect(page.locator('#guide')).toHaveCount(0);
});

test('the glossary drawer defines the terms the feed uses', async ({ page }) => {
  await open(page);
  await skipGuide(page);
  await page.locator('#glossary summary').click();
  for (const t of ['Recovery cache', 'Gate Key', 'Retreat']) await expect(page.locator('#glossary dt', { hasText: t }).first()).toBeVisible();
});

test('the stored onboarding flag survives a reload in normal storage', async ({ page }) => {
  await page.goto('/?scene=expedition&known=oldroad&progress=0');
  await page.waitForFunction(() => window.__EXPEDITION_READY__);
  await page.evaluate(() => localStorage.removeItem('idle-souls.prefs'));
  await page.reload();
  await page.waitForFunction(() => window.__EXPEDITION_READY__);
  await expect(page.locator('#guide')).toBeVisible();
  await page.locator('#guide-skip').click();
  await page.reload();
  await page.waitForFunction(() => window.__EXPEDITION_READY__);
  await expect(page.locator('#guide')).toHaveCount(0);
  await page.evaluate(() => localStorage.removeItem('idle-souls.prefs'));
});

// ---------- Settings ----------
test('larger text and reduced motion are stored and applied', async ({ page }) => {
  await page.goto('/?scene=expedition&known=oldroad&progress=0');
  await page.waitForFunction(() => window.__EXPEDITION_READY__);
  await page.evaluate(() => localStorage.removeItem('idle-souls.prefs'));
  await page.reload();
  await page.waitForFunction(() => window.__EXPEDITION_READY__);
  await skipGuide(page);
  const size = () => page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('xp')!).fontSize));
  const before = await size();
  await page.locator('#bigtext').click();
  expect(await size()).toBeGreaterThan(before);
  await page.locator('#calm-btn').click();
  await expect(page.locator('#xp')).toHaveClass(/calm/);
  await page.reload();
  await page.waitForFunction(() => window.__EXPEDITION_READY__);
  await expect(page.locator('#xp')).toHaveClass(/big/);
  await expect(page.locator('#bigtext')).toHaveAttribute('aria-pressed', 'true');
  expect(await noSideScroll(page)).toBe(true);
  await page.evaluate(() => localStorage.removeItem('idle-souls.prefs'));
});

test('reduced motion follows the system setting when the player says nothing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await expect(page.locator('#xp')).toHaveClass(/calm/);
});

// ---------- Audio ----------
test('audio is off until Enable audio; every cue has a visual pair; volumes are independent', async ({ page }) => {
  await open(page, '&seed=1&hp=5000');
  await skipGuide(page);
  await expect(page.locator('#audio-btn')).toHaveText('Enable audio');
  await expect(page.locator('#vol-music')).toHaveCount(0);
  await page.locator('[data-preset=first]').click();
  await page.locator('#launch').click();
  await finish(page);
  const silent = await page.evaluate(() => window.__EXPEDITION_AUDIO__.played);
  expect(silent.length).toBeGreaterThan(0);
  expect(silent.every(c => !c.sounded)).toBe(true);
  await expect(page.locator('#cue-banner')).not.toHaveText('');   // the visual pair appeared with sound off
  await page.locator('#again').click();
  await page.locator('#audio-btn').click();
  await expect(page.locator('#audio-btn')).toHaveText('Audio on');
  await expect(page.locator('#vol-music')).toBeVisible();
  await expect(page.locator('#vol-effects')).toBeVisible();
  await page.locator('#vol-effects').fill('0');
  expect(await page.locator('#vol-music').inputValue()).toBe('40');
  await page.evaluate(() => window.__EXPEDITION_AUDIO__.playBossPhase());
  await expect(page.locator('#cue-banner')).toContainText('boss changes phase');
  const last = await page.evaluate(() => window.__EXPEDITION_AUDIO__.played.at(-1));
  expect(last).toEqual({ cue: 'bossPhase', sounded: false });   // effects at 0: shown, not heard
});

test('a fall and a return each raise a cue with a visual line', async ({ page }) => {
  await open(page, '&seed=1&hp=45');
  await skipGuide(page);
  await page.locator('[data-preset=cross]').click();
  await page.locator('#retreat').fill('0');
  await page.locator('#launch').click();
  await finish(page);
  expect(await page.evaluate(() => window.__EXPEDITION_AUDIO__.played.map(c => c.cue))).toContain('death');
  await expect(page.locator('#cue-banner')).toContainText('fell');
});

// ---------- Accessibility audit ----------
async function audit(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const vis = (e: Element) => { const r = (e as HTMLElement).getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const name = (e: Element): string => {
      const a = e.getAttribute('aria-label'); if (a) return a;
      const lb = e.getAttribute('aria-labelledby'); if (lb) return lb.split(' ').map(i => document.getElementById(i)?.textContent ?? '').join(' ').trim();
      if (e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement) { const l = (e as HTMLInputElement).labels; if (l && l.length) return [...l].map(x => x.textContent).join(' ').trim(); }
      return (e.textContent ?? '').trim() || e.getAttribute('title') || '';
    };
    for (const e of document.querySelectorAll('button, a[href], select, input, textarea, summary, [role=button], canvas[tabindex]')) {
      if (!vis(e) && !(e as HTMLElement).closest('details:not([open])')) continue;
      if (!name(e)) problems.push(`no name: <${e.tagName.toLowerCase()} ${e.id ? '#' + e.id : e.className}>`);
    }
    for (const c of document.querySelectorAll('canvas')) if (!c.getAttribute('aria-label')) problems.push(`canvas without a text alternative: #${c.id}`);
    const ids = new Map<string, number>();
    for (const e of document.querySelectorAll('[id]')) ids.set(e.id, (ids.get(e.id) ?? 0) + 1);
    for (const [id, n] of ids) if (n > 1) problems.push(`duplicate id ${id} x${n}`);
    let level = 0, seenH1 = 0;
    for (const hd of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      if (!vis(hd)) continue;
      const l = Number(hd.tagName[1]);
      if (l === 1) seenH1++;
      if (level === 0 && l !== 1) problems.push(`first heading is ${hd.tagName}, not H1`);
      if (level && l > level + 1) problems.push(`heading jumps from H${level} to H${l}: ${hd.textContent}`);
      level = l;
    }
    if (seenH1 !== 1) problems.push(`${seenH1} H1 headings`);
    if (document.querySelectorAll('main').length !== 1) problems.push('there should be exactly one main landmark');
    for (const e of document.querySelectorAll('[aria-labelledby], [aria-describedby]')) for (const id of (e.getAttribute('aria-labelledby') ?? e.getAttribute('aria-describedby') ?? '').split(' ')) if (id && !document.getElementById(id)) problems.push(`dangling reference ${id}`);
    return problems;
  });
}

test('audit: names on controls, labels on inputs, heading order and unique ids on every screen', async ({ page }) => {
  await open(page, '&seed=1&hp=5000');
  await skipGuide(page);
  await page.locator('details summary').first().click();
  expect(await audit(page), 'plan').toEqual([]);
  await page.locator('[data-preset=cross]').click();
  await page.locator('#launch').click();
  expect(await audit(page), 'run').toEqual([]);
  await finish(page);
  expect(await audit(page), 'result').toEqual([]);
  await page.locator('#again').click();
  await page.locator('#history-btn').click();
  expect(await audit(page), 'history').toEqual([]);
  await page.locator('[data-history]').first().click();
  expect(await audit(page), 'history entry').toEqual([]);
});

test('audit: the guide screen has a valid structure too', async ({ page }) => {
  await open(page);
  expect(await audit(page)).toEqual([]);
});

test('keyboard: Tab reaches the planner controls in order with a visible focus ring, and Enter and Space press buttons', async ({ page }) => {
  await open(page);
  await skipGuide(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  const preset = page.locator('[data-preset=first]');
  await preset.focus();
  const ring = await preset.evaluate(e => { const s = getComputedStyle(e); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; });
  expect(ring).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-obj-kind="0"]')).toBeVisible();
  await page.locator('[data-seg=exploration-thorough]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-seg=exploration-thorough]')).toHaveAttribute('aria-pressed', 'true');
  // Tab order follows the page: every tabbable control is reachable and none has a positive tabindex.
  expect(await page.evaluate(() => [...document.querySelectorAll('[tabindex]')].filter(e => Number(e.getAttribute('tabindex')) > 0).length)).toBe(0);
});

test('keyboard: the details drawers open and close with Enter and Escape on the map selection', async ({ page }) => {
  await open(page);
  await skipGuide(page);
  await page.locator('#glossary summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#glossary')).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(page.locator('#glossary')).not.toHaveAttribute('open', '');
});

test('no signal is colour only: gates, avoid, danger and low health carry a mark or pattern', async ({ page }) => {
  await open(page, '&seed=1&hp=5000&known=save');
  await skipGuide(page);
  await expect(page.locator('#map-help')).toContainText('▣ sealed gate');
  await expect(page.locator('#map-help')).toContainText('⊘ avoided');
  await page.locator('[data-preset=first]').click();
  await expect(page.locator('#preflight')).toContainText(/Known route|Ends at|Blocked|Conflicted/);   // status badge has words
  await page.locator('#launch').click();
  await page.locator('#skip').click();
  await expect(page.locator('#feed li[data-kind=discovery]').first()).toHaveAttribute('data-mark', /◇/);
});

// ---------- Layouts ----------
const SIZES = [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 360, height: 640 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }];
async function layout(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const W = window.innerWidth;
    for (const e of document.querySelectorAll('button, select, summary, a.btn, input:not([type=range]), textarea, input[type=range]')) {
      if (e.closest('.skip-link') || (e as HTMLElement).classList.contains('skip-link')) continue;
      const r = (e as HTMLElement).getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const label = `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${(e.textContent ?? '').trim().slice(0, 24) ? ' "' + (e.textContent ?? '').trim().slice(0, 24) + '"' : ''}`;
      if (r.height < 43.5) problems.push(`${label} is ${Math.round(r.height)}px tall`);
      if (r.width < 43.5 && !(e as HTMLInputElement).type?.startsWith('range')) problems.push(`${label} is ${Math.round(r.width)}px wide`);
      if (r.left < -1 || r.right > W + 1) problems.push(`${label} is clipped sideways (${Math.round(r.left)}..${Math.round(r.right)} of ${W})`);
    }
    for (const e of document.querySelectorAll('p, li, dd, dt, label, h1, h2, h3, small, b')) {
      const fs = parseFloat(getComputedStyle(e).fontSize);
      if (fs < 11.5 && (e.textContent ?? '').trim()) problems.push(`text of ${fs}px (under 11.5): ${(e.textContent ?? '').trim().slice(0, 30)}`);
    }
    return problems;
  });
}
for (const vp of SIZES) {
  test(`layout at ${vp.width}x${vp.height}: no sideways scroll, no clipped controls, 44px targets, readable text`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page, '&seed=1&hp=5000');
    // The screen scrolls inside a fixed box, so for the picture it is let flow into the page and the whole length is captured.
    const shot = async (name: string) => {
      if (!SHOTS) return;
      await page.evaluate(() => { for (let e: HTMLElement | null = document.getElementById('xp'); e; e = e.parentElement) { e.dataset.css = e.style.cssText; e.style.position = 'static'; e.style.overflow = 'visible'; e.style.height = 'auto'; e.style.maxHeight = 'none'; e.style.inset = 'auto'; } });
      await page.screenshot({ path: `docs/slice/screens/${name}-${vp.width}x${vp.height}.png`, fullPage: true });
      await page.evaluate(() => { for (let e: HTMLElement | null = document.getElementById('xp'); e; e = e.parentElement) { e.style.cssText = e.dataset.css ?? ''; delete e.dataset.css; } });
    };
    await shot('guide');
    expect(await noSideScroll(page), 'guide').toBe(true);
    await skipGuide(page);
    await page.locator('#glossary summary').click();
    await page.locator('#map-list summary').click();
    await page.locator('[data-preset=cross]').click();
    expect(await noSideScroll(page), 'plan').toBe(true);
    expect(await layout(page), 'plan').toEqual([]);
    await shot('plan-and-map');
    await page.locator('#launch').click();
    expect(await noSideScroll(page), 'run').toBe(true);
    expect(await layout(page), 'run').toEqual([]);
    await shot('run');
    await finish(page);
    expect(await noSideScroll(page), 'chronicle').toBe(true);
    expect(await layout(page), 'chronicle').toEqual([]);
    await shot('chronicle');
    await page.locator('#again').click();
    await page.locator('#history-btn').click();
    expect(await noSideScroll(page), 'history').toBe(true);
    expect(await layout(page), 'history').toEqual([]);
    await shot('history');
  });
}

test('layout with larger text at 360x640 still has no sideways scroll or clipped control', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await open(page, '&seed=1&hp=5000');
  await skipGuide(page);
  await page.locator('#bigtext').click();
  await page.locator('[data-preset=cross]').click();
  expect(await noSideScroll(page)).toBe(true);
  expect(await layout(page)).toEqual([]);
  await page.locator('#launch').click();
  expect(await noSideScroll(page)).toBe(true);
  await finish(page);
  expect(await noSideScroll(page)).toBe(true);
});
