import source from '../../combat/deep-stats/combat-sim.js?raw';
import type { SimApi } from './simApi';
/** The sim file is a plain script (no ES exports). Evaluate the same source the bench inlines and return its SIM object. */
export function loadSim(): SimApi {
  return new Function('module', `${source}\nreturn SIM;`)(undefined) as SimApi;
}
