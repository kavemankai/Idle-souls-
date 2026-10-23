import Phaser from 'phaser';
import { paintOldRoad } from '../presentation/environment';
import { loadOldRoadAssets } from '../presentation/assets';
import { ActorRenderer } from '../presentation/actorRenderer';
import { loadSim } from '../combat/loadSimBrowser';
import type { SimApi, SimDoctrine } from '../combat/simApi';
import { O1Controller, runO1, type O1Config, type O1Opponent, type O1Result } from '../world/o1Controller';
import { O1PresentationAdapter } from '../world/o1Adapter';
import { O1 } from '../world/o1Room';
declare const __BUILD_SHA__: string;
const TICK_MS = 1000 / 30;
const FOCUSES = ['balanced', 'duelist', 'bulwark', 'skirmisher', 'survivor'];
const DOCTRINES: SimDoctrine[] = ['measured', 'guarded', 'pressing'];
const OUTCOME_TEXT: Record<string, string> = {
  completed: 'Reached the slice endpoint.', defeated: 'Defeated. Travel stopped.', unresolved: 'Unresolved. Travel stopped.',
};

/** O1 single-room slice. The controller walks the route and the simulator fights; this scene only draws what the adapter reports. */
export class O1Scene extends Phaser.Scene {
  private sim!: SimApi;
  private controller!: O1Controller;
  private adapter!: O1PresentationAdapter;
  private hero!: ActorRenderer;
  private enemies!: Record<O1Opponent, ActorRenderer>;
  private overlay!: Phaser.GameObjects.Graphics;
  private acc = 0;
  private speed = 1;
  private debug = false;
  private reduced = false;
  private clips = new Set<string>();
  private hud!: HTMLElement;
  constructor() { super('O1'); }
  preload() { loadOldRoadAssets(this); }
  create() {
    paintOldRoad(this, { room: O1, eastLabel: '' });
    this.sim = loadSim();
    this.hero = new ActorRenderer(this, 'adventurer');
    this.enemies = { mireling: new ActorRenderer(this, 'mireling'), sentry: new ActorRenderer(this, 'sentry') };
    this.drawEndpoint();
    this.overlay = this.add.graphics().setDepth(999);
    const params = new URLSearchParams(location.search);
    this.debug = params.has('debug'); this.reduced = params.has('reduced');
    this.speed = Math.max(1, Math.min(16, Number(params.get('speed')) || 1));
    this.makeHUD(params);
    this.reset();
    const ticks = Number(params.get('ticks'));
    if (params.has('dispatch') || ticks > 0) this.controller.dispatch();
    if (ticks > 0) for (let i = 0; i < ticks && !this.controller.terminal; i++) this.controller.step();
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.hud.remove());
    window.__O1_RUN__ = (cfg: O1Config) => runO1(this.sim, cfg);
    this.syncHud();
    window.__O1_READY__ = true; window.__VISUAL_READY__ = true;
  }
  private config(): O1Config {
    const q = <T extends HTMLElement>(id: string) => this.hud.querySelector<T>(`#${id}`)!;
    const level = Math.max(1, Math.min(this.sim.MAX_LEVEL, Math.round(Number(q<HTMLInputElement>('level').value) || 80)));
    return {
      seed: Math.max(1, Math.round(Number(q<HTMLInputElement>('seed').value) || 1)), opponent: q<HTMLSelectElement>('opponent').value as O1Opponent,
      level, focus: q<HTMLSelectElement>('focus').value, doctrine: q<HTMLSelectElement>('doctrine').value as SimDoctrine,
    };
  }
  private reset() {
    this.controller = new O1Controller(this.sim, this.config());
    this.adapter = new O1PresentationAdapter(this.controller);
    this.clips.clear(); this.acc = 0;
  }
  private drawEndpoint() {
    const x = O1.threshold.x, [y0, y1] = O1.threshold.y;
    // Thin in-world slice-end marker, not a gate or an extraction affordance.
    this.add.image(x, (y0 + y1) / 2, 'endpoint-threshold').setDisplaySize(22, y1 - y0).setDepth(940).setAlpha(.9);
    this.add.text(x - 6, y0 - 4, 'SLICE ENDPOINT', { fontFamily: 'Arial', fontSize: '10px', color: '#f1d49a', backgroundColor: '#172b25dd', padding: { x: 4, y: 3 } }).setOrigin(1, 1).setDepth(960);
    this.add.text(x - 6, y1 + 4, 'O2 is not built', { fontFamily: 'Arial', fontSize: '9px', color: '#c7c7ab', backgroundColor: '#172b25bb', padding: { x: 4, y: 2 } }).setOrigin(1, 0).setDepth(960);
    this.add.text(-294, 105, '← CAMPWARD', { fontFamily: 'Georgia', fontSize: '10px', color: '#c7c7ab', letterSpacing: 2 }).setOrigin(.5).setAlpha(.68).setDepth(950);
  }
  private makeHUD(params: URLSearchParams) {
    const hud = document.createElement('div'); hud.id = 'hud'; this.hud = hud;
    const pick = (key: string, ok: readonly string[], d: string) => ok.includes(params.get(key) ?? '') ? params.get(key)! : d;
    const opts = (list: readonly string[], cur: string) => list.map(v => `<option value="${v}"${v === cur ? ' selected' : ''}>${v[0].toUpperCase()}${v.slice(1)}</option>`).join('');
    hud.innerHTML = `<header><div class="brand"><span class="sigil">♜</span><div><span class="eyebrow">O1 SLICE · 01</span><h1>Idle Souls</h1></div></div><div class="location"><span class="tiny-line"></span><span>OLD ROAD</span><span class="muted">/</span><span class="muted">Outer Road</span></div><span class="study-badge"><i></i> SIMULATOR-OWNED</span></header>
    <section class="scene-title"><p class="eyebrow">O1 &nbsp; / &nbsp; AUTONOMOUS TRAVERSAL · TRIAL SETTINGS</p><h2>West to east, on its own.</h2><p>The adventurer walks, the simulator fights.</p></section>
    <section class="workbench o1-bench" aria-label="Dispatch controls"><div class="bench-heading"><span class="eyebrow">DISPATCH</span></div>
    <div class="o1-grid"><label>Seed<input id="seed" type="number" min="1" step="1" value="${Math.max(1, Math.round(Number(params.get('seed')) || 1))}"></label>
    <label>Opponent<select id="opponent">${opts(['mireling', 'sentry'], pick('opponent', ['mireling', 'sentry'], 'mireling'))}</select></label>
    <label>Level<input id="level" type="number" min="1" max="${this.sim.MAX_LEVEL}" step="1" value="${Math.max(1, Math.min(this.sim.MAX_LEVEL, Math.round(Number(params.get('level')) || 80)))}"></label>
    <label>Focus<select id="focus">${opts(FOCUSES, pick('focus', FOCUSES, 'balanced'))}</select></label>
    <label>Doctrine<select id="doctrine">${opts(DOCTRINES, pick('doctrine', DOCTRINES, 'measured'))}</select></label>
    <button id="dispatch" class="primary">Dispatch to O2</button></div>
    <p id="status" aria-live="polite"></p><p id="result" aria-live="polite"></p><ul id="log" aria-label="Combat log"></ul><p id="clips"></p>
    <div class="toggles"><button id="proxy" aria-pressed="${this.debug}">Solids &amp; route</button><button id="reduced" aria-pressed="${this.reduced}">Reduced FX</button><button id="speed" aria-pressed="${this.speed > 1}" aria-label="Playback speed">Speed x${this.speed > 1 ? this.speed : 4}</button><a href="?">Visual study ↗</a></div></section>
    <footer><span>Slice endpoint is the east threshold · no rewards, retreat or O2</span><span id="build">${__BUILD_SHA__} · PHASER ${Phaser.VERSION}</span></footer>`;
    document.body.append(hud);
    const q = <T extends HTMLElement>(id: string) => hud.querySelector<T>(`#${id}`)!;
    for (const id of ['seed', 'opponent', 'level', 'focus', 'doctrine']) q(id).addEventListener('change', () => { this.reset(); this.syncHud(); });
    q('dispatch').addEventListener('click', () => { if (this.controller.state !== 'ready') this.reset(); this.controller.dispatch(); this.syncHud(); });
    q('speed').addEventListener('click', e => { this.speed = this.speed > 1 ? 1 : 4; (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(this.speed > 1)); (e.currentTarget as HTMLElement).textContent = `Speed x${this.speed > 1 ? this.speed : 4}`; });
    q('proxy').addEventListener('click', e => { this.debug = !this.debug; (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(this.debug)); });
    q('reduced').addEventListener('click', e => { this.reduced = !this.reduced; (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(this.reduced)); });
  }
  private layout() {
    const w = this.scale.width, h = this.scale.height;
    const rect = (sel: string) => this.hud.querySelector(sel)!.getBoundingClientRect();
    const head = rect('header'), foot = rect('footer'), bench = rect('.o1-bench');
    const portrait = bench.width > w * .75;
    const top = head.bottom, vw = portrait ? w : Math.max(200, bench.left - 8), vh = Math.max(120, (portrait ? bench.top : foot.top) - top);
    const cam = this.cameras.main;
    cam.setViewport(0, top, vw, vh);
    cam.setZoom(Math.max(.3, Math.min(1.5, Math.min(vw / 640, vh / 500))));
    cam.centerOn(0, 0);
    document.documentElement.style.setProperty('--scene-zoom', String(cam.zoom));
    void h;
  }
  update(_time: number, delta: number) {
    const c = this.controller;
    if (c.state !== 'ready' && !c.terminal) {
      this.acc += Math.min(delta, 100) * this.speed;
      while (this.acc >= TICK_MS && !c.terminal) { c.step(); this.acc -= TICK_MS; }
    }
    const snapshot = this.adapter.read();
    const [hero, enemy] = snapshot.actors;
    const results = [this.hero.draw(hero, this.debug, this.reduced)];
    for (const key of Object.keys(this.enemies) as O1Opponent[]) {
      const mine = key === c.cfg.opponent;
      const r = this.enemies[key].draw(mine ? enemy : { ...enemy, visible: false }, this.debug, this.reduced);
      if (mine) results.push(r);
    }
    [hero, enemy].forEach((a, i) => { if (results[i].missing && a.visible) this.clips.add(`${a.kind} ${a.action} ${a.facing}`); });
    this.drawOverlay();
    this.syncHud();
    const hx = Math.round(c.hero.x * 10) / 10, hy = Math.round(c.hero.y * 10) / 10;
    window.__O1_STATE__ = { source: snapshot.source, state: c.state, tick: c.tick, fought: c.fought, hp: Math.round(c.hp), hpMax: c.hpMax, hero: { x: hx, y: hy }, enemyAlive: c.enemy.alive, digest: c.digest, missing: [...this.clips], speed: this.speed, build: __BUILD_SHA__, viewport: [this.scale.width, this.scale.height], zoom: this.cameras.main.zoom };
  }
  private drawOverlay() {
    const g = this.overlay.clear();
    if (!this.debug) return;
    g.lineStyle(1, 0xdfb978, .9);
    for (const [x0, y0, x1, y1] of O1.solids.rects) g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    for (const c of O1.solids.circles) g.strokeCircle(c.x, c.y, c.r);
    const c = this.controller;
    g.lineStyle(1, 0x9ed6d0, .8).beginPath().moveTo(c.hero.x, c.hero.y);
    for (const p of c.routePoints) g.lineTo(p.x, p.y);
    g.strokePath();
    if (c.enemy.alive && c.state !== 'fighting') {
      const half = O1.detection.arcDegrees * Math.PI / 360, r = O1.detection.range;
      g.lineStyle(1, 0xd98c6a, .7).beginPath().moveTo(c.enemy.x, c.enemy.y).lineTo(c.enemy.x + Math.cos(c.enemy.face - half) * r, c.enemy.y + Math.sin(c.enemy.face - half) * r);
      g.arc(c.enemy.x, c.enemy.y, r, c.enemy.face - half, c.enemy.face + half).lineTo(c.enemy.x, c.enemy.y).strokePath();
    }
  }
  private syncHud() {
    const c = this.controller, q = (id: string) => this.hud.querySelector<HTMLElement>(`#${id}`)!;
    const label: Record<string, string> = { ready: 'Ready', travelling: 'Travelling', fighting: 'Fighting', completed: 'Completed', defeated: 'Defeated', unresolved: 'Unresolved' };
    q('status').textContent = `${label[c.state]} · tick ${c.tick} · health ${Math.round(c.hp)}/${c.hpMax}${c.state === 'fighting' ? ` · ${c.fight?.enemies[0].name} ${Math.round(c.fight?.enemies[0].hp ?? 0)}` : ''}`;
    q('result').textContent = c.terminal ? `${OUTCOME_TEXT[c.state]} ${c.fought ? 'A fight occurred.' : 'No fight occurred.'}` : '';
    const lines = (c.fight ? c.fight.events.map(e => e.text) : []).concat(c.fight ? [] : c.notes).slice(-4);
    const log = q('log'); const html = lines.map(l => `<li>${l.replace(/[<>&]/g, '')}</li>`).join('');
    if (log.innerHTML !== html) log.innerHTML = html;
    q('clips').textContent = this.clips.size ? `Directional clips unavailable (${this.clips.size}): ${[...this.clips].slice(0, 3).join(', ')}${this.clips.size > 3 ? ', …' : ''}` : 'All directional clips used so far are authored.';
    const d = q('dispatch'); d.textContent = c.terminal ? 'Run again' : 'Dispatch to O2';
    (d as HTMLButtonElement).disabled = c.state === 'travelling' || c.state === 'fighting';
  }
}
export type { O1Result };
declare global { interface Window { __O1_READY__: boolean; __O1_STATE__: unknown; __O1_RUN__: (cfg: O1Config) => O1Result } }
