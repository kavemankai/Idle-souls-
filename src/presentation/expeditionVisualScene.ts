import Phaser from 'phaser';
import type { ActorKind, ActorView } from '../contracts/presentation';
import { ActorRenderer } from './actorRenderer';
import { loadOldRoadAssets } from './assets';
import { paintOldRoad } from './environment';
import { readExpeditionVisual, type ExpeditionVisualActor } from './expeditionVisual';
import { ROOMS } from '../world/roomRegistry';
import type { WorldRunner } from '../world/worldRunner';

const COLORS = { enemy: 0xa35545, corpse: 0x535955 };
type Placeholder = { body: Phaser.GameObjects.Ellipse; label: Phaser.GameObjects.Text };

/**
 * The main player's live world is the sole owner of time and combat.
 * Phaser consumes world snapshots only. This scene has no call to step(),
 * no AI, no RNG and no settlement. A renderer failure cannot advance a run.
 */
class LiveExpeditionScene extends Phaser.Scene {
  private roomId = '';
  private sprites = new Map<string, ActorRenderer>();
  private placeholders = new Map<string, Placeholder>();
  private cameraReady = false;
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 1;

  constructor(private readonly host: HTMLElement, private readonly getWorld: () => WorldRunner | null) {
    super({ key: 'expedition-visual' });
  }

  preload() {
    loadOldRoadAssets(this);
    this.load.on('loaderror', (file: { key?: string }) => {
      this.host.dataset.visualError = 'Could not load ' + (file.key ?? 'an art asset');
    });
  }

  create() {
    this.host.dataset.visualReady = 'true';
    this.scale.on('resize', () => { this.cameraReady = false; });
    this.events.once('shutdown', () => { this.host.removeAttribute('data-visual-ready'); });
  }

  private showRoom(room: string) {
    this.children.removeAll(true);
    this.sprites.clear();
    this.placeholders.clear();
    this.roomId = room;
    this.cameraReady = false;
    // The Old Road art is used as an interim environment for adjacent generated
    // rooms. Geometry/walls still come from each room's authoritative manifest.
    paintOldRoad(this, { room: ROOMS[room], eastLabel: '' });
    this.add.text(-245, -150, room, {
      fontFamily: 'Georgia', fontSize: '20px', color: '#ddd4bb',
      backgroundColor: '#17262099', padding: { x: 8, y: 4 },
    }).setDepth(980).setAlpha(.9);
  }

  private drawActor(actor: ExpeditionVisualActor, combatants: ReturnType<typeof readExpeditionVisual>['combat']) {
    if (actor.illustrated) {
      let sprite = this.sprites.get(actor.id);
      if (!sprite) {
        sprite = new ActorRenderer(this, actor.archetype);
        this.sprites.set(actor.id, sprite);
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
      // Not every later-region enemy has an authored sprite atlas. Explicit
      // labelled proxies avoid misrepresenting an enemy as a Mireling/Sentry.
      let proxy = this.placeholders.get(actor.id);
      if (!proxy) {
        proxy = {
          body: this.add.ellipse(0, 0, 32, 25, COLORS.enemy, .9),
          label: this.add.text(0, 0, actor.archetype, { fontFamily: 'Arial', fontSize: '10px', color: '#fff0d2', backgroundColor: '#241d1dbb', padding: { x: 4, y: 2 } }).setOrigin(.5, 0),
        };
        this.placeholders.set(actor.id, proxy);
      }
      proxy.body.setPosition(actor.x, actor.y).setDepth(actor.y).setFillStyle(actor.action === 'death' ? COLORS.corpse : COLORS.enemy);
      proxy.label.setPosition(actor.x, actor.y + 16).setDepth(actor.y + 2);
      proxy.body.setVisible(actor.visible); proxy.label.setVisible(actor.visible);
    }
  }

  update(_time: number, delta: number) {
    const world = this.getWorld();
    if (!world || !ROOMS[world.room]) return;
    const view = readExpeditionVisual(world);
    if (view.room !== this.roomId) this.showRoom(view.room);
    for (const actor of view.actors) this.drawActor(actor, view.combat);
    const hero = view.actors[0];
    const opponents = view.fighting ? view.actors.slice(1).filter(a =>
      a.action !== 'death' && Math.abs(a.x - hero.x) < 250 && Math.abs(a.y - hero.y) < 250) : [];
    const involved = [hero, ...opponents];
    const x0 = Math.min(...involved.map(a => a.x)), x1 = Math.max(...involved.map(a => a.x));
    const y0 = Math.min(...involved.map(a => a.y)), y1 = Math.max(...involved.map(a => a.y));
    const w = Math.max(1, this.scale.width), h = Math.max(1, this.scale.height);
    // Portrait framing: the hero/active enemies fill the viewport, without
    // inventing locations, animations or extra simulator frames.
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
    this.host.dataset.visualRoom = view.room;
    this.host.dataset.visualTick = String(view.tick);
    this.host.dataset.visualCombat = String(view.fighting);
    this.host.dataset.visualActors = String(view.actors.length);
  }
}

/** Mounts a disposable visual consumer. The caller owns the authoritative expedition. */
export function mountExpeditionVisual(host: HTMLElement, getWorld: () => WorldRunner | null): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    backgroundColor: '#101e1c',
    width: Math.max(320, host.clientWidth),
    height: Math.max(320, host.clientHeight),
    scale: { mode: Phaser.Scale.RESIZE, width: Math.max(320, host.clientWidth), height: Math.max(320, host.clientHeight) },
    scene: [new LiveExpeditionScene(host, getWorld)],
    render: { pixelArt: false, antialias: true },
  });
  return () => { game.destroy(true); };
}
