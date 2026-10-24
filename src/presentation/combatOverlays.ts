import Phaser from 'phaser';
import type { Gauge } from '../contracts/presentation';
import type { ExpeditionVisualState } from './expeditionVisual';
import { CombatFeedbackTracker, combatHealthBars, type CombatFeedback, type CombatHealthBar } from './combatFeedback';

interface BarObjects {
  readonly graphic: Phaser.GameObjects.Graphics;
  readonly text: Phaser.GameObjects.Text;
}
interface Popup {
  readonly text: Phaser.GameObjects.Text;
  readonly y: number;
  age: number;
}
const COLOR = {
  backing: 0x101715, border: 0xded8bd,
  hero: 0x75b9a2, enemy: 0xb96556, low: 0xe08d62,
  stamina: 0x799fcb,
  hitHero: '#ffbca6', hitEnemy: '#ffe1a0',
  heal: '#a1efb1', defence: '#a9e3ee',
} as const;

function fraction(gauge: Gauge): number {
  return gauge.max > 0 && Number.isFinite(gauge.value) && Number.isFinite(gauge.max)
    ? Phaser.Math.Clamp(gauge.value / gauge.max, 0, 1) : 0;
}
function hpText(hp: Gauge) {
  return `${Math.ceil(Math.max(0, hp.value))}/${Math.ceil(Math.max(0, hp.max))}`;
}

/**
 * A disposable, world-space cosmetic layer. No input actions, no simulation
 * ticks and no event subscriptions. Every value comes from a read-only snapshot.
 */
export class CombatOverlays {
  private readonly bars = new Map<string, BarObjects>();
  private readonly tracker = new CombatFeedbackTracker();
  private popups: Popup[] = [];
  private totalPopups = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  private makeBar(actorId: string): BarObjects {
    let objects = this.bars.get(actorId);
    if (!objects) {
      objects = {
        graphic: this.scene.add.graphics().setDepth(1300),
        text: this.scene.add.text(0, 0, '', {
          fontFamily: 'Arial', fontSize: '11px', fontStyle: 'bold',
          color: '#f6f1e5', stroke: '#091411', strokeThickness: 3,
        }).setOrigin(.5, 1).setDepth(1301),
      };
      this.bars.set(actorId, objects);
    }
    return objects;
  }

  private drawBar(bar: CombatHealthBar, stamina?: Gauge) {
    const { graphic, text } = this.makeBar(bar.actorId);
    const w = bar.hero ? 94 : 82;
    const x = bar.x - w / 2, y = bar.y - 74;
    const pct = fraction(bar.hp);
    const fill = pct <= .25 ? COLOR.low : bar.hero ? COLOR.hero : COLOR.enemy;
    graphic.clear()
      .fillStyle(COLOR.backing, .94).fillRect(x - 2, y - 2, w + 4, stamina ? 20 : 13)
      .lineStyle(1, COLOR.border, .65).strokeRect(x - 2, y - 2, w + 4, 13)
      .fillStyle(fill).fillRect(x, y, w * pct, 9);
    if (stamina) {
      graphic.fillStyle(COLOR.stamina).fillRect(x, y + 13, w * fraction(stamina), 3);
    }
    text.setText(`${bar.hero ? 'HERO' : bar.name}  ${hpText(bar.hp)}`);
    text.setPosition(bar.x, y - 4);
  }

  private popup(cue: CombatFeedback) {
    const color = cue.kind === 'heal' ? COLOR.heal
      : cue.kind === 'damage' ? (cue.actorId === 'hero' ? COLOR.hitHero : COLOR.hitEnemy)
      : COLOR.defence;
    const x = cue.x, y = cue.y - 99;
    const text = this.scene.add.text(x, y, cue.label, {
      fontFamily: 'Arial', fontSize: cue.kind === 'damage' ? '19px' : '15px',
      fontStyle: 'bold', color, stroke: '#0a1312', strokeThickness: 4,
    }).setOrigin(.5, .5).setDepth(1600);
    this.popups.push({ text, y, age: 0 });
    this.totalPopups++;
    // Bounded visual effects even at 16x simulation speed.
    while (this.popups.length > 16) this.popups.shift()!.text.destroy();
  }

  private movePopups(delta: number) {
    const dt = Math.max(0, Math.min(100, delta));
    const keep: Popup[] = [];
    for (const p of this.popups) {
      p.age += dt;
      const t = p.age / 850;
      if (t >= 1) { p.text.destroy(); continue; }
      p.text.setY(p.y - 36 * t).setAlpha(t > .6 ? Math.max(0, (1 - t) / .4) : 1);
      keep.push(p);
    }
    this.popups = keep;
  }

  render(view: ExpeditionVisualState, delta: number): { bars: number; popups: number; totalPopups: number } {
    this.movePopups(delta);
    const live = combatHealthBars(view);
    const known = new Set(live.map(b => b.actorId));
    for (const [id, objects] of this.bars) {
      if (known.has(id)) continue;
      objects.graphic.destroy(); objects.text.destroy(); this.bars.delete(id);
    }
    for (const bar of live) {
      const actor = view.actors.find(a => a.id === bar.actorId);
      const slot = actor?.combatSlot;
      const stamina = slot === undefined || slot === null ? undefined : view.combat?.combatants[slot]?.stamina;
      this.drawBar(bar, bar.hero ? stamina : undefined);
    }
    for (const cue of this.tracker.sample(view)) this.popup(cue);
    return { bars: live.length, popups: this.popups.length, totalPopups: this.totalPopups };
  }

  destroy() {
    this.tracker.reset();
    for (const item of this.bars.values()) { item.graphic.destroy(); item.text.destroy(); }
    this.bars.clear();
    for (const popup of this.popups) popup.text.destroy();
    this.popups = [];
  }
}
