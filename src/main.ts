import Phaser from 'phaser';
import { OldRoadVisualScene } from './scenes/OldRoadVisualScene';
import { O1Scene } from './scenes/O1Scene';
import { mountExpedition } from './ui/expeditionScreen';
import './style.css';
// ?scene=o1 opens the autonomous O1 slice. Everything else (default, calibration, silhouette, attacks) is the visual study.
// A hosted build can open on O1 without a query string (VITE_DEFAULT_SCENE=o1 or expedition); normal builds leave it unset.
const sceneName = new URLSearchParams(location.search).get('scene') ?? import.meta.env.VITE_DEFAULT_SCENE;
const slice = sceneName === 'o1';
// ?scene=expedition opens the camp planner and the expedition screen (DOM, no Phaser).
const expedition = sceneName === 'expedition';
if (expedition) mountExpedition(document.getElementById('game')!);
const game = expedition ? null : new Phaser.Game({ type: Phaser.AUTO, parent: 'game', backgroundColor: '#142024', scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight }, scene: [slice ? O1Scene : OldRoadVisualScene] });

if (game) window.__IDLE_GAME__ = game;
declare global { interface Window { __IDLE_GAME__: Phaser.Game } }
