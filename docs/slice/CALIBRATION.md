# Calibration of the level table against the whole roster
> Historical analysis. The pacing harness predated explicit boss challenges and persisted boss-clear inputs. [The release baseline](../release/BASELINE.md) records the corrected harness and new, limited samples. Do not treat the old campaign rows as evidence about the current boss flow or release balance.

Branch `claude/calibration`, built on the M0 to M7 integration head (20ca3f5). Nothing in the simulator, enemy stats, hero offense, world runner, UI or rooms was changed. The only code that changed is `src/progression/levelTable.ts` (rows and a new `ROOM_ARRIVAL` table) and new tools. Raw numbers are in `docs/slice/CALIBRATION_NUMBERS.md` (generated) and `docs/slice/data/*.json`.

Read this first: the roster as it stands is far too strong for the doc 27 level band, the shipped game has no persistent level, and the miniboss and boss fights cannot be started by any plan today. The table below is the best fit that exists, and it still has misses. Do not read it as a tuned game.

## How the table was set

Method. `tools/roster-curves.ts` measured the win rate of every encounter in `ENCOUNTER_CONTRACT.json` (15 ids, including `gruntAlone`) at 23 simulator levels from 1 to 160, for guarded, measured and pressing doctrines, balanced and survivor focus, 300 seeds a point. `tools/level-fit.ts` then picked the strictly rising list of nine simulator levels (at least 2 apart) that minimises the squared miss between each room's win rate and its target, by exact dynamic programming over the interpolated curves. The chosen levels were re-measured with fresh seeds (1001 to 1300) for all three doctrines and both focuses. A design level is flagged "not calibrated" in the table when any room on it misses by more than 12 points.

Arrival levels (`ROOM_ARRIVAL` in `src/progression/levelTable.ts`). Doc 25 section 7 gives a range per region: Old Road 1 to 2, Watchtower 2 to 4, Sunken Passage 3 to 5, Bell Warden 4 to 6, Forgotten Crypt 5 to 8, Castellan 7 to 9. Inside a region a room takes its place along the route (later room, higher level) and the optional miniboss takes the top of its range. That gives O1 at 1, O2/O3/KT at 2, T1 at 3, T2/T3/S1 at 4, S2/S3 at 5, MB and K1 at 6, K2/K3 at 7, and the Castellan at 8 (first attempt) and 9 (prepared).

Targets are the middle of the handoff section 6 bands at the level each band is stated for: Mireling 80 to 95, Sentry 65 to 85, Harrier 75 to 90, Spitter 70 to 85, Brute 60 to 85, Duelist 55 to 80, Warden 35 to 60, Castellan 30 to 55. Pairs have no stated band. Doc 25 says a pair of regular enemies forces a route or retreat decision, so they aim at 45 to 60 (50 for the ranged and guard pairs, 45 for the Mireling pair, 60 for the weak Spitter and Grunt escort). Those pair targets are my reading, not a locked number.

## The table

| Design level | Simulator level | True level (doc 27, 1 + 1.3 per sim level above 1) | Rooms fitted | Status |
|---|---|---|---|---|
| 1 | 1 | 1 | O1 Mireling 96% (target 88) | calibrated |
| 2 | 27 | 35 | O2 Sentry 74 (75), O3 and KT Mireling pair 47 (45) | calibrated |
| 3 | 39 | 50 | T1 Harrier 84 (83) | calibrated |
| 4 | 133 | 172 | T2 Harrier+Sentry 45 (50), T3 Harrier+Mireling 65 (50), S1 Spitter 92 (78) | miss, 15 points |
| 5 | 135 | 175 | S2 Brute 67 (73), S3 Spitter+Grunt 71 (60) | calibrated |
| 6 | 140 | 181 | MB Warden 54 (48), K1 Sentry+Spitter 10 (50) | miss, 40 points |
| 7 | 143 | 185 | K2 and K3 Duelist 70 (68) | calibrated |
| 8 | 156 | 202 | B1 Castellan 33 (35) | calibrated |
| 9 | 160 | 207 | B1 Castellan 38 (50) | calibrated, 12 points low |

Percentages are measured doctrine, balanced focus, fresh seeds, isolated fight. Rows 1 to 4 of the old table were 15, 48, 62, 94. They are replaced, not re-checked into agreement: the old rows were fitted to the pairs only, and the new roster moves every one of them.

Per room at its arrival level, all doctrines (fresh seeds):

| Room | Sim level | Encounter | Target | Guarded | Measured | Pressing | Survivor focus, measured |
|---|---|---|---|---|---|---|---|
| O1 | 1 | mireling | 88 | 99 | 96 | 86 | 96 |
| O2 | 27 | sentry | 75 | 81 | 74 | 72 | 78 |
| O3, KT | 27 | mireling2 | 45 | 73 | 47 | 39 | 50 |
| T1 | 39 | harrier | 83 | 71 | 84 | 51 | 85 |
| T2 | 133 | harrierSentry | 50 | 56 | 45 | 27 | 44 |
| T3 | 133 | harrierMireling | 50 | 73 | 65 | 50 | 70 |
| S1 | 133 | spitter | 78 | 96 | 92 | 85 | 94 |
| S2 | 135 | brute | 73 | 89 | 67 | 36 | 76 |
| S3 | 135 | spitterGrunt | 60 | 73 | 71 | 68 | 75 |
| MB | 140 | warden | 48 | 82 | 54 | 35 | 87 |
| K1 | 140 | sentrySpitter | 50 | 14 | 10 | 7 | 19 |
| K2, K3 | 143 | duelist | 68 | 91 | 70 | 58 | 70 |
| B1 (8) | 156 | castellan | 35 | 42 | 33 | 24 | 58 |
| B1 (9) | 160 | castellan | 50 | 42 | 38 | 22 | 60 |

### Misses, written down

1. The table has a 94-level cliff between design 3 (39) and design 4 (133). It is not a fitting artifact. The Harrier+Sentry pair is 0% win up to sim level 70 and reaches 50% only near 140. Any table that puts T2 at its target puts design 4 there.
2. K1 (Sentry+Spitter) misses by 40 points. It is 13% at sim 160 for the measured doctrine, 25% guarded, 10% pressing. No design level in the table is fair for it.
3. S1 (Spitter) is 92% at its level because its curve is flat: about 50% from sim level 1 to 60, then it climbs. A flat curve cannot place a level, so S1 rides along with T2.
4. The Castellan at design 9 is 12 points under the 50% target. It reaches 30% only at 160 for the measured doctrine, and never reaches 50% inside the table range for any doctrine.
5. Sentry and Mireling alone are flat (Sentry 63 to 76% from level 1 to 55). They place nothing. O1 and O2 are on the table by convention.
6. The pair targets are guesses (see above). Moving them 10 points moves design 4 to 6 by tens of sim levels, because those curves are steep and late.

## Scale against doc 27

Doc 27 puts the boss-ready band at true level 40 to 65, which is sim level 31 to 50. The table needs 133 to 160 (true level 172 to 207) for design 4 and above. The roster is about three times the intended band. Brute, Duelist, Warden, Castellan and every pair containing a ranged enemy are the cause. The Mireling and Sentry were already inside the band. Everything below treats the table as a mapping to be kept honest, and the real fix as an enemy-stat change that this task may not make (proposals below).

## Pacing with the real expedition runner

Real health (no `hpOverride`), shipped progression, rations, sanctuary, roster encounters in their rooms, 300 seeds a row. Cautious is guarded doctrine, retreat at 60%, drink below 70%. Pressing is pressing doctrine, retreat at 30%, drink below 40%. Full tables are in `CALIBRATION_NUMBERS.md`.

How far plans get (start level is the level the expedition begins at; the shipped game has no source for any value but 1, see below):

| Route | Plan | Start | Extracted | Died | Every objective done | Mean level reached |
|---|---|---|---|---|---|---|
| Old Road (O3, KT) | cautious | 1 | 98.7% | 1.3% | 0.0% | 1.0 |
| Old Road | pressing | 1 | 76.0% | 24.0% | 0.3% | 1.1 |
| Watchtower (T1, T2) | cautious | 1 | 99.7% | 0.3% | 5.7% | 1.8 |
| Watchtower | cautious | 3 | 99.0% | 1.0% | 24.3% | 4.3 |
| Watchtower | pressing | 3 | 82.0% | 18.0% | 28.0% | 4.6 |
| Sunken Passage (S1, S2) | cautious | 4 | 90.0% | 10.0% | 20.7% | 5.4 |
| Sunken Passage | pressing | 4 | 66.3% | 33.7% | 3.0% | 5.2 |
| Crypt by the south (S1, S2, K1, K2) | cautious | 5 | 98.0% | 2.0% | 1.3% | 6.2 |
| Crypt by the north (T1, T2, K3, K2) | cautious | 5 | 99.7% | 0.3% | 0.7% | 6.1 |
| Crypt by the north | pressing | 5 | 91.3% | 8.7% | 0.0% | 6.2 |

Plans started at level 1 end on the Old Road or at T1. Median deepest room is O2 for the Old Road, Sunken and south-Crypt plans and T1 for the Watchtower and north-Crypt plans. Almost no run finishes its objectives: a cautious plan survives by retreating, and a retreating plan does not finish. Deaths cluster in the first two rooms for pressing plans at level 1 (O2 19%, O1 5%) and at S2 (19%) and S1 (11%) for pressing plans at start level 4.

Whole-game journeys, scripted player (`tools/pacing-report.ts --part campaign`; it knows the map, explores toward the next goal, banks a key at the Key Trial, issues it, opens the gate, recovers a dropped cache first). 10 campaigns each, cap 120 expeditions:

| Start level | Plan | Key banked | Watchtower gate mapped | Watchtower gate opened | Miniboss killed | Castellan killed |
|---|---|---|---|---|---|---|
| 1 | cautious | expedition 2 (median) | 90% of campaigns, median 22, slowest 119 | 0% | 0% | 0% |
| 1 | pressing | 40 (median) | 90%, median 31 | 0% | 0% | 0% |
| 3 | cautious | 1 | 100%, median 16 | 90%, median expedition 52 | 0% | 0% |
| 5 | cautious | 1 | 100%, median 2 | 100%, median 8, slowest 41 | 0% | 0% |
| 5 | pressing | 1 | 100%, median 2 | 100%, median 8, slowest 35 | 0% | 0% |

Two things stop this table from answering "how many expeditions to the miniboss and the boss":

- Nothing persists but gold, mastery, keys and map memory. Levels and upgrades are dropped at camp (`Progress` is built fresh every expedition). So the start level is a setting in the planner screen, not something the game grants. At the only value the shipped game produces (1), a cautious player never opens the Watchtower gate in 120 expeditions, because T2 (Harrier+Sentry) is unwinnable at the level a level-1 start reaches there (about 1.8, sim 27 or so; the pair is 0% win below sim 70). A pressing player at level 1 dies 12 times per campaign on average and does not open it either.
- The miniboss and the boss are never fought. `reach` completes when the hero enters the room, the Warden stands 190 units away and is not engaged, and `challenge` is not built. Across 300 seeds of the "Bell Warden, gate already open" route at start 5 the plan completes (20% cautious) with zero Warden kills; a six-seed trace shows the full route in and out with the Warden untouched. Expeditions to the miniboss and the boss are therefore "never" in the runner today, and the isolated win rates above are the only numbers available for those two fights. The M8 wiring that was meant to change this did not land on this branch.

First key gate (Watchtower gate opened), in expeditions: never at start 1, 52 at start 3 (cautious, median), 8 at start 5. Miniboss and boss: unreachable until M8 wiring and a persistent start level exist.

## Doc 15 stop conditions

### Safe farming against the dangerous route

Gold and mastery banked per expedition, per game minute, extraction already counted (a death banks nothing). Start level 1 for the safe loops, the level the room is meant for otherwise.

| Loop | Plan | Extracted | Gold per expedition | Mastery per expedition | Minutes | Gold per hour | Mastery per hour |
|---|---|---|---|---|---|---|---|
| Survey the Outer Road | cautious | 100% | 6.0 | 2.0 | 0.7 | 512 | 171 |
| Reach the Crossroads | cautious | 80.7% | 10.2 | 3.4 | 0.9 | 682 | 227 |
| Old Road, O3 and Key Trial | cautious | 98.7% | 4.5 | 1.5 | 0.9 | 312 | 104 |
| Watchtower T1, T2 (start 3) | cautious | 99.0% | 16.4 | 5.1 | 1.5 | 640 | 199 |
| Sunken Passage S1, S2 (start 4) | cautious | 90.0% | 33.6 | 11.1 | 1.9 | 1046 | 345 |
| Crypt north (start 5) | cautious | 99.7% | 29.1 | 8.9 | 1.8 | 989 | 304 |
| Sunken Passage | pressing | 66.3% | 18.2 | 6.0 | 1.6 | 668 | 222 |
| Crypt north | pressing | 91.3% | 24.4 | 7.5 | 1.8 | 814 | 249 |

The stop condition says safe farming must not dominate. It does not dominate on paper: the best safe loop (Crossroads, 682 gold an hour) pays 65% of the best dangerous cautious route (Sunken Passage, 1046) and 6.0 gold a trip against 33.6 on the Sunken Passage. But three facts weaken the margin. First, a cautious Sunken Passage run still extracts 90%, so the danger tax is small. Second, the dangerous routes at pressing plans pay 668 to 814 an hour, about equal to the safe Crossroads loop at 682, with 8 to 34% deaths. A player who plays the pressing style for the risk is not paid for it. Third, a safe loop is trivially repeatable with no skill and no gold sink exists in the slice to force the player on. Verdict: not triggered by the numbers, close to triggered by the pressing style.

Small optional recommendation (not implemented): pay the first claim in each room more and pay repeat visits to the same room less, so the Outer Road and Crossroads loops fall off after the first expedition of a session. This leaves the dangerous routes alone.

### Retreat almost free

Full roster, rations off (`drinkBelowPct` 0), 300 seeds, by retreat threshold (HP percent at which the hero turns back):

| Route (start) | Doctrine | Off | 30% | 50% | 70% |
|---|---|---|---|---|---|
| Watchtower (3), extracted | measured | 5.0% | 57.0% | 88.7% | 98.7% |
| Watchtower (3), all objectives done | measured | 5.0% | 5.0% | 4.7% | 0.7% |
| Sunken Passage (4), extracted | measured | 2.7% | 68.7% | 94.0% | 99.3% |
| Sunken Passage (4), all objectives done | measured | 2.7% | 2.3% | 1.0% | 0.3% |
| Crypt north (5), extracted | measured | 0.0% | 75.3% | 96.7% | 99.7% |
| Crypt north (5), all objectives done | measured | 0.0% | 0.0% | 0.0% | 0.0% |

Without retreat the roster routes kill the hero 95 to 100% of the time (guarded doctrine does a little better on the Watchtower: 24.7% survive). Retreat at 50% moves survival to 89 to 97% and costs almost nothing in objectives completed, because the runs that retreated were the runs that would have died. At 70% survival is 98 to 100% and objective completion drops to about zero. On these routes retreat is nearly free: the cost is lost completion, which was already near zero, and I did not measure loot lost to the early exit. Verdict: triggered. The mechanism that is supposed to make a retreat a decision does not charge for it. The rooms are lethal enough that every competent plan retreats early, and a retreat banks the carried loot.

### Outliers: sentrySpitter and castellan

Levels at which the measured doctrine, balanced focus, reaches a win rate (isolated fights, sim level, table rows in brackets):

| Encounter | 30% | 50% | 70% | At 160 |
|---|---|---|---|---|
| harrierSentry | 140 | 140 | above 160 | 62% |
| brute | 70 | 120 | 140 | 81% |
| duelist | 100 | 140 | 160 | 81% |
| warden | 100 | 140 | above 160 | 69% |
| castellan | 160 | above 160 | above 160 | 37% |
| sentrySpitter | above 160 | above 160 | above 160 | 13% |

sentrySpitter is not fair at any design level in the table. Guarded doctrine, the best of the three, reaches 25% at 160. The pair has no bad mechanic I can point to from here, but at the K1 position (design 6, sim 140) it wins 10%, against 54% for the Warden and 70% for the Duelist, which sit a room away. At design 9 it is still about 13%. The level it would be fair at, 50%, is past the table's end and past sim level 160; I did not measure above 160.

castellan is fair at design 8 and 9 only in the loosest sense: 33 and 38%, inside the 30 to 55% band but under its midpoint at design 9. It is the only encounter that behaves as the handoff band says, and only at sim 156 to 160 (true level 202 to 207, four times the doc 27 boss-ready band). Survivor focus lifts it to 58 to 60%, so the fight rewards a focus choice, which is a good sign for the fight and a bad one for balanced builds. Fair design level: 8 to 9 as the table now stands.

## Proposed changes, ranked, not applied

1. **Bring the roster inside the doc 27 band.** What: scale down enemy health or damage for Brute, Duelist, Warden, Castellan, Harrier, Spitter and the pairs containing a ranged enemy until the table reaches 50% at roughly sim 31 to 50 for design 5 to 9. Why: the table needs sim 133 to 160 against a stated band of 31 to 50, and the 94-level cliff between design 3 and 4 is the plain result. Expected effect: removes the cliff, makes the table tell the truth about the player's power, lets plans clear Watchtower and Sunken rooms from a reachable start level. Risk: a sweeping change to authoritative stats; golden files for O1, expedition runs and the roster reports all move. Needs a human decision on whether the roster or the band is wrong. If the roster is right and the band is wrong, update doc 27 instead.
2. **Add persistent power or a persistent start level.** What: let banked mastery or camp upgrades raise the start level from 1. Why: at start 1 the gate to the Bell Warden is unreachable (0 of 10 campaigns in 120 expeditions, cautious or pressing). With start 3 it takes a median 52 expeditions and with start 5 a median 8. Expected effect: a campaign arc exists at all. Risk: this decides the game's progression model, which is a design lock, not a tuning value.
3. **Wire the miniboss and boss fights into the runner.** What: a `challenge` objective, or let a `reach` into MB and B1 engage the occupant. Why: no plan kills the Warden or the Castellan today, so the pacing questions for them have no runner answer. Expected effect: the Bell Warden and Castellan gates become real milestones and this report can be re-run to give expedition counts. Risk: M8 owns this; it must not turn the controller into a tactics picker.
4. **Replace or retune the K1 Sentry+Spitter pair.** What: swap K1 for a pair that behaves like Spitter+Grunt (71% at its level) or cut the Spitter's ranged damage in that pair. Why: 10% win at design 6, 25% at best, in a mandatory room on the south route. Expected effect: K1 lands near 50%, the south Crypt route stops dead-ending at K1. Risk: the pair is the roster's only elite-adjacent ranged threat; weakening it flattens the south route's identity.
5. **Make retreat cost something.** What: a retreat banks a fraction of carried loot, or leaves a recoverable cache in the room. Why: retreat at 50% raises survival from 3 to 97% at almost no completion cost. Expected effect: a retreat becomes a trade of loot for life instead of a free exit. Risk: punishes the cautious doctrine most, and the loot-loss rule belongs to `settle.ts`, which is a locked bank-once design.
6. **Trim safe-loop yield.** What: the first-claim bonus described above. Why: the best safe loop pays 65% of the best dangerous one, and pressing plans on dangerous routes pay about the same as the safe loop. Expected effect: pushes the player toward the dangerous routes. Risk: low, but the yields are placeholders and a gold sink may change the picture.
7. **Raise the Castellan at design 9 by about 12 points.** What: a small cut in Castellan health or a design-9 table entry a few levels higher. Why: 38% against a 50% target. Expected effect: the prepared attempt lands in the band's upper half. Risk: low, and subsumed by item 1.

## What changed in the repository

- `src/progression/levelTable.ts`: rows 1 to 9 rewritten by `tools/level-fit.ts --write`; `ROOM_ARRIVAL` (the arrival level and target of every room) added.
- `tools/roster-curves.ts` measures the win-rate curves, `tools/level-fit.ts` fits and verifies the table, `tools/pacing-report.ts` runs the real-runner pacing, farming, retreat and campaign parts and assembles `CALIBRATION_NUMBERS.md`. The older `tools/level-calibrate.ts` and `tools/progression-report.ts` are left as they were; `level-calibrate.ts` still holds the old four-target set and would overwrite this table if run with `--write`.
- `tests/progression.test.ts`: no change needed. Its table test passes unchanged because rows 4 and 6 are flagged as misses and row 1 is calibrated.
- Reproduce: `npx tsx tools/roster-curves.ts --enc <ids> --out <file>` (merge with `--merge`), `npx tsx tools/level-fit.ts --curves docs/slice/data/curves.json --write`, `npx tsx tools/pacing-report.ts --part routes|farming|retreat|campaign`, then `--assemble`. A campaign of up to 120 expeditions is slow, so each journey row uses 10 campaigns and everything else uses 300 seeds.
