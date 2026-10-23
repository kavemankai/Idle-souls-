/**
 * Performance budgets for the slice. The numbers are ceilings with room for a slow CI machine, set from measurements recorded in docs/slice/M9.md.
 * A budget is a promise about this build on this kind of machine, not a claim about a phone: phone timings are pending a real device.
 */
export const BUDGET = {
  /** Headless Old Road expedition (cross the Old Road to the Causeway and home): wall time in milliseconds, median of the runs. */
  oldRoadExpeditionMs: 1000,
  /** Average wall time per fight inside such an expedition, in milliseconds. */
  perFightMs: 400,
  /** Gzipped JavaScript the browser downloads for the whole game, in bytes. */
  bundleGzipBytes: 600_000,
  /** At 16x in headless Chrome: longest single main-thread task, in milliseconds, and long tasks (over 50 ms) per second of run. */
  longestTaskMs: 400,
  /** Heap growth across twenty expeditions in one page, as a fraction of the heap after the first. */
  heapGrowth: 0.5,
} as const;
