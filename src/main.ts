import Phaser from 'phaser';
import { OldRoadVisualScene } from './scenes/OldRoadVisualScene';
import './style.css';
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', backgroundColor: '#142024', scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight }, scene: [OldRoadVisualScene] });
