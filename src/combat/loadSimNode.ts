import { createRequire } from 'node:module';
import type { SimApi } from './simApi';
/** Node and tests load the sim as CommonJS, exactly as the bench scripts do. */
export function loadSim(): SimApi {
  return createRequire(import.meta.url)('../../combat/deep-stats/combat-sim.js') as SimApi;
}
