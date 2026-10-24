import Phaser from 'phaser';
import type { ActorKind, ActorView } from '../contracts/presentation';
import { ActorRenderer } from './actorRenderer';
import { CombatOverlays } from './combatOverlays';
import { ConnectedDungeon } from './connectedDungeon';
import { facingFromVector } from './directions';
import { loadOldRoadAssets } from './assets';
import { readExpeditionVisual, type ExpeditionVisualActor, type ExpeditionVisualState } from './expeditionVisual';
import { ROOMS } from '../world/roomRegistry';
import type { WorldRunner } from '../world/worldRunner';
import type { Vec } from './dungeonGeometry';

const COLORS = { enemy: 0xa35545, corpse: 0x535955 };
type Placeholder = { body: Phaser.GameObjects.Ellipse; label: Phaser.GameObjects.Text };
type Visibility = { known: ReadonlySet<string>; open: ReadonlySet<string> };

/**
 * One continuous world-coordinate Phaser scene. WorldRunner alone owns time,
 * fight outcomes, rewards and position. The camera, scenery and indicators are
 * disposable, readonly presentation and never start a second simulation.
 */
class LiveExpeditionScene extends Phaser.Scene {
  private sprites = new Map<string, ActorRenderer>();
  private placeholders = new Map<string, Placeholder>();
  private shown = new Map<string, ExpeditionVisualActor>();
  private overlays: CombatOverlays | null = null;
  private dungeon: ConnectedDungeon | null = null;
  private actionChip!: Phaser.GameObjects.Text;
  private lastAction = '';
  private previousHero: Vec | null = null;
  private passageFacing: ExpeditionVisualActor['facing'] = 'E';
  private cameraReady = false;
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 1;
  private lastRoom = '';

  constructor(
    private readonly host: HTMLElement,
    private readonly getWorld: () => WorldRunner | null,
    private readonly getVisibility: () => Visibility,
  ) {
    super({ key: 'expedition-visual' });
  }

  preload() {
    loadOldRoadAssets(this);
    this.load.on('loaderror', (file: { key?: string }) => {
      this.host.dataset.visualError = 'Could not load ' + (file.key ?? 'an art asset');
    });
  }

  create() {
    this.dungeon = new ConnectedDungeon(this);
    this.overlays = new CombatOverlays(this);
    this.actionChip = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '11px', color: '#e2eadf',
      backgroundColor: '#14241dbb', stroke: '#0b1713', strokeThickness: 2,
      padding: { x: 4, y: 2 },
    }).setOrigin(.5, .5).setDepth(12000);
    this.host.dataset.visualReady = 'true';
    this.scale.on('resize', () => { this.cameraReady = false; });
    this.events.once('shutdown', () => {
      this.overlays?.destroy(); this.overlays = null;
      this.dungeon?.destroy(); this.dungeon = null;
      this.host.removeAttribute('data-visual-ready');
    });
  }

  private actorKey(actor: ExpeditionVisualActor) {
    return actor.id === 'hero' ? 'hero' : `${actor.id}:${actor.archetype}`;
  }

  private drawActor(actor: ExpeditionVisualActor, combatants: ExpeditionVisualState['combat']) {
    const key = this.actorKey(actor);
    if (actor.illustrated) {
      let sprite = this.sprites.get(key);
      if (!sprite) {
        sprite = new ActorRenderer(this, actor.archetype);
        this.sprites.set(key, sprite);
      }
      const view: ActorView = {
        id: actor.id, kind: actor.archetype as ActorKind,
        x: actor.x, y: actor.y, facing: actor.facing,
        action: actor.action, phase: actor.phase, progress: actor.progress,
        visible: actor.visible,
      };
      sprite.draw(view, false, false,
        actor.combatSlot === null ? undefined : combatants?.combatants[actor.combatSlot]);
    } else {
      // Unauthored enemy forms are labelled explicitly; never substitute an
      // incorrect species animation just to conceal missing production art.
      let proxy = this.placeholders.get(key);
      if (!proxy) {
        proxy = {
          body: this.add.ellipse(0, 0, 32, 25, COLORS.enemy, .9),
          label: this.add.text(0, 0, actor.archetype, {
            fontFamily: 'Arial', fontSize: '10px', color: '#fff0d2',
            backgroundColor: '#241d1dbb', padding: { x: 4, y: 2 },
          }).setOrigin(.5, 0),
        };
        this.placeholders.set(key, proxy);
      }
      proxy.body.setPosition(actor.x, actor.y).setDepth(actor.y).setFillStyle(actor.action === 'death' ? COLORS.corpse : COLORS.enemy);
      proxy.label.setPosition(actor.x, actor.y + 16).setDepth(actor.y + 2);
      proxy.body.setVisible(actor.visible); proxy.label.setVisible(actor.visible);
    }
  }

  private hideAbsentActors(current: ReadonlySet<string>) {
    for (const [key, previous] of this.shown) {
      if (current.has(key)) continue;
      const sprite = this.sprites.get(key);
      if (sprite) {
        sprite.draw({ id: previous.id, kind: previous.archetype as ActorKind,
          x: previous.x, y: previous.y, facing: previous.facing,
          action: previous.action, phase: previous.phase, progress: previous.progress,
          visible: false }, false, true);
      }
      const p = this.placeholders.get(key);
      if (p) { p.body.setVisible(false); p.label.setVisible(false); }
      this.shown.delete(key);
    }
  }

  update(_time: number, delta: number) {
    const world = this.getWorld();
    if (!world || !ROOMS[world.room]) return;
    const raw = readExpeditionVisual(world);
    const visibility = this.getVisibility();
    const rendered = this.dungeon?.sync(world.pos, world.room, raw.passage, visibility.known, visibility.open);

    const hero = raw.actors[0];
    if (raw.passage && this.previousHero) {
      const dx = hero.x - this.previousHero.x, dy = hero.y - this.previousHero.y;
      if (Math.abs(dx) + Math.abs(dy) > .01) this.passageFacing = facingFromVector(dx, dy);
    } else this.passageFacing = hero.facing;
    this.previousHero = { x: hero.x, y: hero.y };
    const actors = raw.passage ? [{ ...hero, facing: this.passageFacing }, ...raw.actors.slice(1)] : raw.actors;
    const view: ExpeditionVisualState = raw.passage ? { ...raw, actors } : raw;
    const current = new Set<string>();
    for (const actor of view.actors) {
      const key = this.actorKey(actor);
      current.add(key);
      this.drawActor(actor, view.combat);
      this.shown.set(key, actor);
    }
    this.hideAbsentActors(current);
    const feedback = this.overlays?.render(view, delta);

    // Short and deliberately quieter than damage numbers. Position just below
    // the in-world HP bar rather than competing with its 11px health label.
    if (view.heroStatus !== this.lastAction) {
      this.lastAction = view.heroStatus;
      this.actionChip.setText(view.heroStatus);
    }
    this.actionChip.setPosition(hero.x, hero.y - 48);

    const opponents = view.fighting ? view.actors.slice(1).filter(a =>
      a.action !== 'death' && Math.abs(a.x - hero.x) < 250 && Math.abs(a.y - hero.y) < 250) : [];
    const involved = [hero, ...opponents];
    const x0 = Math.min(...involved.map(a => a.x)), x1 = Math.max(...involved.map(a => a.x));
    const y0 = Math.min(...involved.map(a => a.y)), y1 = Math.max(...involved.map(a => a.y));
    const w = Math.max(1, this.scale.width), h = Math.max(1, this.scale.height);
    const zoom = Phaser.Math.Clamp(Math.min(w / Math.max(320, x1 - x0 + 160),
      h / Math.max(300, y1 - y0 + 190)), .36, 1.5);
    const x = (x0 + x1) / 2, y = (y0 + y1) / 2;
    const t = Phaser.Math.Clamp(delta / 125, 0, 1);
    if (!this.cameraReady) { this.cameraX = x; this.cameraY = y; this.cameraZoom = zoom; this.cameraReady = true; }
    else {
      this.cameraX = Phaser.Math.Linear(this.cameraX, x, t);
      this.cameraY = Phaser.Math.Linear(this.cameraY, y, t);
      this.cameraZoom = Phaser.Math.Linear(this.cameraZoom, zoom, t);
    }
    this.cameras.main.centerOn(this.cameraX, this.cameraY);
    this.cameras.main.setZoom(this.cameraZoom);
    this.lastRoom = world.room;

    this.host.dataset.visualRoom = view.room;
    this.host.dataset.visualTick = String(view.tick);
    this.host.dataset.visualCombat = String(view.fighting);
    this.host.dataset.visualActors = String(view.actors.length);
    this.host.dataset.visualHpBars = String(feedback?.bars ?? 0);
    this.host.dataset.visualDamageCues = String(feedback?.totalPopups ?? 0);
    this.host.dataset.visualLoadedRooms = String(rendered?.rooms ?? 0);
    this.host.dataset.visualHallways = String(rendered?.hallways ?? 0);
    this.host.dataset.visualPassage = String(view.passage);
    this.host.dataset.visualHeroX = String(hero.x);
    this.host.dataset.visualHeroY = String(hero.y);
    this.host.dataset.visualAction = view.heroStatus;
    this.host.dataset.visualCameraX = String(this.cameraX);
    this.host.dataset.visualCameraY = String(this.cameraY);
  }
}

/** Mounts a disposable visual consumer. The caller owns the authoritative expedition. */
export function mountExpeditionVisual(
  host: HTMLElement, getWorld: () => WorldRunner | null,
  getVisibility: () => Visibility,
): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    backgroundColor: '#101e1c',
    width: Math.max(320, host.clientWidth),
    height: Math.max(320, host.clientHeight),
    scale: { mode: Phaser.Scale.RESIZE, width: Math.max(320, host.clientWidth), height: Math.max(320, host.clientHeight) },
    scene: [new LiveExpeditionScene(host, getWorld, getVisibility)],
    render: { pixelArt: false, antialias: true },
  });
  return () => { game.destroy(true); };
}
