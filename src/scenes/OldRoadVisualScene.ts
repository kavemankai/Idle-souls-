import Phaser from 'phaser';
export class OldRoadVisualScene extends Phaser.Scene {
  constructor() { super('OldRoad'); }
  create() { this.add.text(40, 40, 'IDLE SOULS · Old Road\nVisual production bench', { color: '#d8d4c6', fontSize: '24px' }); }
}
