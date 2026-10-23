import Phaser from 'phaser';
import { OldRoadVisualScene } from './scenes/OldRoadVisualScene';
import { O1Scene } from './scenes/O1Scene';
import './style.css';
// ?scene=o1 opens the autonomous O1 slice. Everything else (default, calibration, silhouette, attacks) is the visual study.
// A hosted build can open on O1 without a query string (VITE_DEFAULT_SCENE=o1); normal builds leave it unset.
const slice = (new URLSearchParams(location.search).get('scene') ?? import.meta.env.VITE_DEFAULT_SCENE) === 'o1';
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', backgroundColor: '#142024', scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight }, scene: [slice ? O1Scene : OldRoadVisualScene] });

window.__IDLE_GAME__ = game;
declare global { interface Window { __IDLE_GAME__: Phaser.Game } }
