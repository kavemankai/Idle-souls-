import Phaser from 'phaser';
import { ENVIRONMENT_TEXTURES } from './environment';
/** Everything the Old Road scenes draw with. Shared so the visual study and the O1 slice load the same files. */
export function loadOldRoadAssets(scene: Phaser.Scene) {
  ENVIRONMENT_TEXTURES.forEach(key => scene.load.image(key, `environments/runtime/${key}.png`));
  ['adventurer', 'sentry', 'mireling', 'mannequin'].forEach(key => scene.load.atlas(key, `characters/runtime/${key}.png`, `characters/runtime/${key}.json`));
  ['slash', 'heavy', 'impact', 'landing'].forEach(key => scene.load.image(`fx-${key}`, `vfx/runtime/${key}.png`));
}
