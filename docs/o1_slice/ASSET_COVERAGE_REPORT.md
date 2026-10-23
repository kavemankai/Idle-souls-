# O1 measured directional sprite coverage

Generated from deterministic 30 Hz O1 controller snapshots by `npx tsx tools/o1-asset-coverage.ts --seeds 100`. Level 80 balanced adventurer; 600 runs (two opponents, three doctrines, 100 seeds per combination). The atlas availability is read from the current repository files. No AI or combat data is changed.

| Measurement | Count | Fraction of frames |
| --- | ---: | ---: |
| Actor frames drawn | 627971 | 100% |
| Reconstructed original fallbacks on this same trace | 60456 | 9.63% |
| Fallbacks with current atlases | 0 | 0.00% |

Previously published sample: 60,456 fallbacks of 627,971 actor frames (9.6%). Here the old coverage is reconstructed on the same deterministic traces, so the denominators and relative reduction are directly comparable. This is not a separate historical rerun of the old checkout.

## Remaining requested clips

No missing direction/clip was requested on this sample.

The absence of fallback requests **does not** prove animation quality, combat tell accuracy, rig appeal, or death animations. A visual review and physical phone review remain required.
