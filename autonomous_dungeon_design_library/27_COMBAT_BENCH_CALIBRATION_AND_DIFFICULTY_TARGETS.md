# 27 — Combat Bench Calibration and Updated Slice Difficulty Targets
**Status:** PROPOSED quantitative calibration. No game code changes. Current fight rates are measured; future enemy/boss win targets are unverified proposals.

## Source-derived baseline
`combat-sim.js`: 30Hz, arena radius230; starting HP75 and increases by +0.75 per true level (rounded); light 11 / heavy24; 6 attributes each from 1..20. Character level = 1+sum(attribute-1). Uniform presets 1/2/3/4/5/10 correspond to true levels 1/7/13/19/25/55.

The headless results below are from 120 deterministic seeds, Measured doctrine, isolated fights with no sequential attrition, equipment progression or healing. Rates are not field-observed retention estimates.

| Encounter | L1 win | L7 | L13 | L19 | L25 | L55 |
|---|---:|---:|---:|---:|---:|---:|
| 3 Grunts | 100% | 100% | 100% | 100% | 100% | 100% |
| 2 Grunts + Archer | 98% | 100% | 100% | 100% | 100% | 100% |
| 4 Grunts + Archer | 85% | 85% | 89% | 88% | 88% | 96% |
| Stalker | 24% | 20% | 25% | 32% | 35% | 68% |
| Breaker | 3% | 7% | 17% | 22% | 31% | 83% |
| 2 Stalkers | 0% | 0% | 0% | 0% | 0% | 0% |
| Stalker + Breaker | 0% | 0% | 0% | 0% | 0% | 0% |

**Notable:** pressing/guarded doctrines yield materially different rates for stalker and breaker. No global flat multiplier produces a good balance across all encounters. Pairing two elite enemies is currently overwhelming even at true L55; reserve such pairs for late clearly telegraphed options, if at all.

## Fresh target adjustment
Earlier working enemy roster described 100 initial HP and L7–9 boss readiness. Those were not implemented facts and should NOT guide tuning of this build. Proposed boss readiness is now about **true L40–65**, with defined in-expedition gains and sanctuary choices, and boss prototype HP is suggested at 540–680 (not 950 fixed). This is an experimental hypothesis, not verification that boss fights will be viable.

## Targets and evidence contract
Use 300 seeds per configuration and each doctrine across true levels 1/7/13/25/55 and boss-ready level 40–65 using stat allocations that sum accurately. Record mean and distribution of remaining HP, duration, timeout/draw, block/dodge/guard-break causes, and lower-performing doctrine. Evaluate cumulative sequential route survival separately with healing/XP/inventory; never infer from multiplying isolated-fight win rates without accounting for carryover and correlated seeds.

See `CLAUDE_CODE_COMBAT_AND_WORLD_HANDOFF.md` for the proposed exact numeric ranges for each of 9 enemy types and conditions of success.
