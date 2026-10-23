# M6 balance tables

Win rate (median fight length) from `combat-sim.js` on this branch, 300 seeds per cell, three doctrines, two focus profiles. Levels are sim levels. Each cell is `SIM.runFight({ seed, stats: SIM.allocate(L, focus, seed), god: false, doctrine, encounter })` over seeds 1 to 300.

focus balanced, 300 seeds; cells are win% (median seconds)
| encounter | doctrine | L1 | L20 | L40 | L60 | L80 | L140 |
|---|---|---|---|---|---|---|---|
| harrier | measured | 46% (12s) | 61% (12s) | 89% (11s) | 88% (11s) | 95% (10s) | 100% (8s) |
| harrier | guarded | 41% (12s) | 52% (12s) | 82% (13s) | 83% (12s) | 90% (11s) | 100% (8s) |
| harrier | pressing | 32% (12s) | 37% (12s) | 67% (13s) | 74% (11s) | 86% (11s) | 100% (7s) |
| spitter | measured | 53% (9s) | 48% (10s) | 62% (9s) | 54% (10s) | 74% (10s) | 93% (8s) |
| spitter | guarded | 60% (9s) | 54% (10s) | 67% (10s) | 73% (9s) | 76% (9s) | 95% (7s) |
| spitter | pressing | 37% (10s) | 38% (10s) | 46% (10s) | 45% (11s) | 63% (11s) | 85% (10s) |
| brute | measured | 1% (12s) | 5% (14s) | 11% (16s) | 18% (19s) | 17% (18s) | 71% (21s) |
| brute | guarded | 2% (19s) | 3% (21s) | 13% (25s) | 32% (34s) | 34% (30s) | 88% (35s) |
| brute | pressing | 0% (11s) | 1% (11s) | 3% (14s) | 7% (15s) | 8% (14s) | 43% (17s) |
| duelist | measured | 9% (11s) | 11% (12s) | 12% (13s) | 20% (14s) | 21% (14s) | 65% (15s) |
| duelist | guarded | 13% (12s) | 22% (13s) | 23% (14s) | 30% (14s) | 50% (15s) | 89% (15s) |
| duelist | pressing | 4% (11s) | 6% (12s) | 6% (12s) | 10% (12s) | 16% (13s) | 61% (15s) |
| warden | measured | 1% (19s) | 0% (20s) | 6% (24s) | 11% (31s) | 17% (30s) | 53% (40s) |
| warden | guarded | 1% (30s) | 3% (31s) | 9% (36s) | 15% (49s) | 30% (52s) | 82% (60s) |
| warden | pressing | 0% (17s) | 0% (18s) | 2% (21s) | 4% (22s) | 6% (25s) | 34% (36s) |
| castellan | measured | 0% (21s) | 0% (23s) | 3% (29s) | 2% (39s) | 3% (33s) | 25% (53s) |
| castellan | guarded | 0% (33s) | 0% (42s) | 2% (49s) | 8% (63s) | 7% (65s) | 31% (86s) |
| castellan | pressing | 0% (19s) | 0% (20s) | 0% (24s) | 0% (28s) | 1% (24s) | 15% (43s) |
| harrierSentry | measured | 0% (11s) | 0% (12s) | 1% (15s) | 1% (17s) | 4% (17s) | 54% (19s) |
| harrierSentry | guarded | 0% (12s) | 0% (14s) | 1% (18s) | 1% (20s) | 5% (20s) | 66% (24s) |
| harrierSentry | pressing | 0% (9s) | 0% (10s) | 0% (12s) | 0% (12s) | 1% (14s) | 28% (18s) |
| harrierMireling | measured | 1% (16s) | 2% (16s) | 5% (18s) | 6% (19s) | 20% (20s) | 63% (25s) |
| harrierMireling | guarded | 2% (16s) | 4% (17s) | 7% (18s) | 7% (20s) | 26% (20s) | 73% (22s) |
| harrierMireling | pressing | 1% (13s) | 1% (14s) | 3% (16s) | 3% (16s) | 9% (18s) | 49% (23s) |
| spitterGrunt | measured | 19% (10s) | 26% (11s) | 31% (12s) | 27% (12s) | 38% (12s) | 74% (12s) |
| spitterGrunt | guarded | 18% (11s) | 20% (11s) | 23% (13s) | 19% (14s) | 34% (14s) | 74% (14s) |
| spitterGrunt | pressing | 13% (11s) | 23% (11s) | 23% (12s) | 21% (13s) | 34% (12s) | 60% (14s) |
| sentrySpitter | measured | 0% (10s) | 0% (11s) | 0% (13s) | 0% (14s) | 0% (14s) | 14% (16s) |
| sentrySpitter | guarded | 0% (10s) | 0% (12s) | 0% (14s) | 0% (15s) | 0% (16s) | 15% (21s) |
| sentrySpitter | pressing | 0% (8s) | 0% (9s) | 0% (11s) | 0% (11s) | 0% (12s) | 5% (15s) |
focus survivor, 300 seeds; cells are win% (median seconds)
| encounter | doctrine | L1 | L20 | L40 | L60 | L80 | L140 |
|---|---|---|---|---|---|---|---|
| harrier | measured | 46% (12s) | 81% (12s) | 80% (12s) | 98% (11s) | 98% (10s) | 100% (8s) |
| harrier | guarded | 41% (12s) | 68% (13s) | 75% (13s) | 91% (12s) | 93% (11s) | 100% (9s) |
| harrier | pressing | 32% (12s) | 53% (13s) | 54% (13s) | 82% (12s) | 87% (10s) | 100% (7s) |
| spitter | measured | 53% (9s) | 58% (10s) | 62% (10s) | 64% (10s) | 71% (9s) | 94% (8s) |
| spitter | guarded | 60% (9s) | 71% (9s) | 69% (10s) | 75% (8s) | 84% (9s) | 74% (11s) |
| spitter | pressing | 37% (10s) | 44% (10s) | 43% (11s) | 55% (10s) | 68% (9s) | 86% (9s) |
| brute | measured | 1% (12s) | 6% (16s) | 14% (18s) | 28% (22s) | 52% (25s) | 85% (24s) |
| brute | guarded | 2% (19s) | 6% (25s) | 21% (30s) | 41% (37s) | 71% (44s) | 92% (38s) |
| brute | pressing | 0% (11s) | 1% (13s) | 2% (15s) | 7% (15s) | 22% (19s) | 38% (19s) |
| duelist | measured | 9% (11s) | 10% (13s) | 15% (14s) | 14% (15s) | 23% (16s) | 72% (17s) |
| duelist | guarded | 13% (12s) | 24% (14s) | 36% (14s) | 37% (16s) | 57% (16s) | 97% (17s) |
| duelist | pressing | 4% (11s) | 6% (12s) | 9% (13s) | 14% (14s) | 21% (15s) | 72% (15s) |
| warden | measured | 1% (19s) | 3% (23s) | 8% (29s) | 20% (37s) | 50% (49s) | 89% (45s) |
| warden | guarded | 1% (30s) | 6% (36s) | 22% (49s) | 44% (65s) | 64% (71s) | 98% (68s) |
| warden | pressing | 0% (17s) | 1% (20s) | 2% (21s) | 7% (29s) | 16% (36s) | 60% (42s) |
| castellan | measured | 0% (21s) | 1% (28s) | 2% (34s) | 7% (45s) | 21% (55s) | 65% (67s) |
| castellan | guarded | 0% (33s) | 0% (45s) | 4% (60s) | 7% (80s) | 23% (113s) | 48% (94s) |
| castellan | pressing | 0% (19s) | 0% (22s) | 0% (25s) | 0% (30s) | 3% (42s) | 20% (44s) |
| harrierSentry | measured | 0% (11s) | 0% (13s) | 0% (14s) | 0% (18s) | 4% (20s) | 68% (19s) |
| harrierSentry | guarded | 0% (12s) | 0% (15s) | 0% (17s) | 3% (21s) | 5% (22s) | 76% (30s) |
| harrierSentry | pressing | 0% (9s) | 0% (11s) | 0% (12s) | 0% (13s) | 2% (16s) | 37% (19s) |
| harrierMireling | measured | 1% (16s) | 2% (17s) | 5% (19s) | 8% (20s) | 18% (22s) | 70% (28s) |
| harrierMireling | guarded | 2% (16s) | 4% (17s) | 4% (18s) | 11% (21s) | 22% (23s) | 62% (21s) |
| harrierMireling | pressing | 1% (13s) | 1% (15s) | 2% (16s) | 5% (17s) | 10% (19s) | 55% (25s) |
| spitterGrunt | measured | 19% (10s) | 28% (11s) | 28% (12s) | 35% (13s) | 34% (14s) | 83% (13s) |
| spitterGrunt | guarded | 18% (11s) | 20% (12s) | 21% (13s) | 26% (14s) | 28% (15s) | 68% (14s) |
| spitterGrunt | pressing | 13% (11s) | 24% (12s) | 23% (13s) | 31% (14s) | 34% (14s) | 68% (14s) |
| sentrySpitter | measured | 0% (10s) | 0% (11s) | 0% (12s) | 0% (15s) | 1% (18s) | 18% (17s) |
| sentrySpitter | guarded | 0% (10s) | 0% (12s) | 0% (13s) | 0% (16s) | 0% (19s) | 18% (27s) |
| sentrySpitter | pressing | 0% (8s) | 0% (9s) | 0% (10s) | 0% (12s) | 0% (14s) | 8% (16s) |
