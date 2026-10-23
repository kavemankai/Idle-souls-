import Phaser from 'phaser';
import { type ActorView, type CombatantView } from '../contracts/presentation';
import { facingAngle } from './directions';
import { ATTACKS, chooseFrame } from './spriteSelection';
export class ActorRenderer {
  private sprite: Phaser.GameObjects.Sprite;
  private shadow: Phaser.GameObjects.Ellipse;
  private fx: Phaser.GameObjects.Image;
  private detail: Phaser.GameObjects.Image;
  private overlay: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene, private kind: string) {
    this.shadow = scene.add.ellipse(0, 0, kind === 'mireling' ? 23 : 25, 13, 0x12251e, .4);
    this.sprite = scene.add.sprite(0, 0, kind).setScale(.63);
    this.fx = scene.add.image(0, 0, 'fx-slash').setScale(.34);
    this.detail = scene.add.image(0, 0, 'fx-contact').setScale(.16).setVisible(false);
    this.overlay = scene.add.graphics();
  }
  draw(actor: ActorView, debug: boolean, reduced: boolean, truth?: CombatantView, shieldCue?: 'block' | 'parry' | 'perfect' | null) {
    const { sprite, shadow, fx, overlay, detail } = this;
    [sprite, shadow].forEach(o => o.setVisible(actor.visible));
    fx.setVisible(false); detail.setVisible(false); sprite.clearTint(); overlay.clear();
    if (!actor.visible) return { missing: false, width: 0 };
    const choice = chooseFrame(actor, f => this.scene.textures.get(this.kind).has(f));
    sprite.setFrame(choice.frame).setPosition(actor.x, actor.y).setDepth(actor.y + .5);
    // Phaser's trimmed atlas metadata restores the common 192² canvas pivot.
    sprite.setOrigin(.5,.5);
    if (truth?.flash && actor.action !== 'death') sprite.setTint(0xffe6bf);
    shadow.setPosition(actor.x,actor.y).setDepth(actor.y-1);
    if (!choice.missing && ATTACKS.includes(actor.action)) {
      const theta = facingAngle(actor.facing);
      fx.setTexture(actor.action === 'heavy' || actor.action === 'bash' ? 'fx-heavy' : actor.action === 'leap' ? 'fx-landing' : 'fx-slash');
      fx.setPosition(actor.x+Math.cos(theta)*15,actor.y+Math.sin(theta)*15).setRotation(theta+Math.PI/2).setDepth(actor.y+.8).setAlpha(reduced ? .65 : actor.phase === 'recovery' ? .18 : .85).setVisible(true);
    }
    // In the authoring workbench this is a sample. O1 only shows a *successful* guard cue from confirmed simulator totals.
    if (!truth && !choice.missing && actor.action === 'guard' && actor.phase === 'active') {
      const theta=facingAngle(actor.facing);
      fx.setTexture('fx-impact').setScale(.1).setPosition(actor.x+Math.cos(theta)*12+Math.sin(theta)*10,actor.y+Math.sin(theta)*12-Math.cos(theta)*10).setRotation(0).setAlpha(.65).setDepth(actor.y+1).setVisible(true);
    } else fx.setScale(.34);
    if (truth && !reduced && actor.action !== 'death') {
      const kind = shieldCue ?? (truth.staggered ? 'stagger' : truth.flash > 0 ? 'contact' : actor.action === 'dodge' ? 'dodge' : null);
      if (kind) {
        const theta = facingAngle(actor.facing);
        const shield = shieldCue !== null && shieldCue !== undefined;
        detail.setTexture(`fx-${kind}`).setScale(shield ? .14 : kind === 'dodge' ? .21 : .13);
        detail.setPosition(actor.x + (shield ? Math.cos(theta) * 12 + Math.sin(theta) * 7 : 0), actor.y + (shield ? Math.sin(theta) * 12 - Math.cos(theta) * 7 : 0));
        detail.setDepth(actor.y + 1.2).setAlpha(kind === 'stagger' ? .52 : .83).setVisible(true);
      }
    }
    if (debug) {
      overlay.setDepth(1000).lineStyle(1,0xe7c684,.9).strokeCircle(actor.x,actor.y,13);
      overlay.lineStyle(1,0xe9ebe0).lineBetween(actor.x-5,actor.y,actor.x+5,actor.y).lineBetween(actor.x,actor.y-5,actor.x,actor.y+5);
      const theta=facingAngle(actor.facing);
      overlay.lineStyle(1,0x9ed6d0).lineBetween(actor.x,actor.y,actor.x+Math.cos(theta)*28,actor.y+Math.sin(theta)*28);
    }
    const frame=sprite.frame;
    return { missing: choice.missing, width: Math.max(frame.cutWidth,frame.cutHeight)*.63*this.scene.cameras.main.zoom };
  }
}
