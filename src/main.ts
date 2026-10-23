import Phaser from 'phaser';
import { OldRoadVisualScene } from './scenes/OldRoadVisualScene';
import './style.css';
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', backgroundColor: '#142024', scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight }, scene: [OldRoadVisualScene] });

window.__IDLE_GAME__ = game;
declare global { interface Window { __IDLE_GAME__: Phaser.Game } }
