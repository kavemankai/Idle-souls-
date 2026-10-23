# CLAUDE CODE HANDOFF — Combat-bench extension + vertical slice encounter/world layout
**Status:** Implementation brief / proposed tuning targets, not a claim of implemented changes. **No gameplay code has been written as part of this handoff.**
**Source of truth:** `combat-bench.html`, `combat-sim.js`, `balance.js` supplied by creator, plus `autonomous_dungeon_design_library/` in the accompanying design archive.
**Scope:** retain the watchable, tunable 30 Hz tactical model; add enemy archetypes, weapon/attack patterns and encounter templates; design/test a physically connected 2D world and regional encounter zones. Combat AI is being developed in a separate session. Do not remove, replace, or rearchitect its current behaviours without evidence and creator approval.

## 0. Non-negotiable prior locks
- One player kit: sword and shield. Do not introduce additional player class/weapon loadouts as a prerequisite.
- Single adventurer automatically explores/fights; player issues limited strategic field orders.
- Permanent fog-of-war discovery and fixed interconnected geography; ordinary encounters and temporary conditions vary between expeditions.
- Player-defined prohibited regions are ABSOLUTE: no intentional crossing even for emergency retreat. Blocked objectives are SKIPPED; continue later permitted objectives; returning to camp cannot be trivially marked complete or skipped.
- Enemy regional pursuit with territory limits and line-of-sight search, then quick alert reset. Do not add persistent alert memory.
- Sanctuaries rest/limited recovery/rare major upgrade choices, NEVER bank loot.
- Rewards including new keys must physically extract to camp. New Gate Keys cannot be used in their acquisition expedition: bank first, provision for a later expedition. Prepared keyring maximum TWO. Other banked keys stay home.
- Each normal miniboss/major-boss fog gate opens permanently for ONE universal Gate Key, with an explicit key-spend authorization. Gate unlock and encounter entry are TWO separate explicit decisions. Boss defeat is permanent in main world; rematches optional. The proposed special-key secret boss must not obstruct mandatory progression.
- Guaranteed authored first-time keys and hard but repeatable key replenishment; key trials must remain keylessly accessible. No pay-to-recover/progression monetization.

## 1. Code audit findings (source-derived; preserve exact meanings)
- Simulator `HZ=30`, circular benchmark arena `ARENA_R=230` (460-unit diameter); player `r=13`, `speed=2.5` units/tick (75 units/second when unobstructed); dodge `dist=92` units, duration 13 ticks with invulnerability ticks 2..9.
- Player moves: light hit 11 damage / 56 range / 7 windup / 9 recovery / 14 stamina; heavy 24 damage / 62 range / 15 windup /16 recovery / 26 stamina. Enemy archetypes currently `grunt` (22 HP), `archer` (14), `stalker` (95), `breaker` (170). Enemy move IDs: `slash`, `lunge`, `swing`, `delayed`, `chop`, `shot`, `overhead`.
- The bench offers `measured`, `guarded`, `pressing`; player skills are Reflex, Perception, Discipline, Footwork, Guard, Composure. Attributes are integers 1..20. `playerLevel = 1 + Σ(attribute-1)`; with all 6 attributes at 5, character level is **25**. Initial HP **75** +0.75 for each additional total character level (rounded). This contradicts earlier *proposal* of 100 initial HP and boss readiness at level 7–9; UPDATE the design targets, do NOT silently retain outdated numbers.
- `balance.js` outputs `L1/L5/L10/L15/L20` for UNIFORM STAT PRESETS, not actual summed character levels. Do not present its L5 as character level 5.
- Headless single arena has no navigation mesh, persistent HP between encounters, dungeon walls/cover, unlocked gates, healing consumables, fog/extraction, or lasting terrain hazard implementation. Those must be integrated and re-tested; do not claim existing arena rates are expedition survival rates.
- Preserve seeded deterministic tests, outcome categories, 150-second max fight (until a deliberate timeout policy is designed), damage-cause reporting, player doctrine identity, AI errors as tunable stats, and benchmark controls. Verify HTML embedded sim and Node sim remain synced or share single source.

## 2. Baseline evidence (real runs of current `combat-sim.js`, 120 seeds each, Measured doctrine)
Numbers are WIN RATES per isolated arena fight; full route win probabilities are lower. All-six-stats uniform presets: 1→char level 1; 2→7; 3→13; 4→19; 5→25; 10→55.

| Current encounter | Lv1 | Lv7 | Lv13 | Lv25 | Lv55 |
|---|---:|---:|---:|---:|---:|
| 3 Grunts | 100% | 100% | 100% | 100% | 100% |
| 2 Grunts + Archer | 98% | 100% | 100% | 100% | 100% |
| 4 Grunts + Archer | 85% | 85% | 89% | 88% | 96% |
| Stalker | 24% | 20% | 25% | 35% | 68% |
| Breaker | 3% | 7% | 17% | 31% | 83% |
| 2 Stalkers | 0% | 0% | 0% | 0% | 0% |
| Stalker + Breaker | 0% | 0% | 0% | 0% | 0% |

This means DO NOT drop stalker+breaker or double stalker into early patrol pools simply to make the beginning 'difficult'. The gap is already enormous. Strengthen and diversify introductory packs/attrition, and reserve high-end mixed elites for telegraphed high-risk areas. Do not globally nerf the player AI to create difficulty.

## 3. Proposed regular enemy catalogue — adapt existing archetypes before inventing mechanics
All numbers BELOW are proposal ranges (unbenchmarked); set up each enemy individually and run seeded tests. 'Ranged' means intentional damage beyond melee reach. Relative move speeds refer to the 2.5-unit/tick adventurer, not an animation playback rate.

| ID | Name | Speed | Size/body radius | Ranged | Candidate HP | Combat identity | Existing foundation |
|---|---|---|---|---|---:|---|---|
| E01 | Mireling | Fast 2.8–3.2 | Small r8–10 | No | 34–46 | Leap/bite, withdraw and re-enter; weak but evasive | `grunt` + cautious parts of `stalker` |
| E02 | Ashen Sentry | Medium 2.0–2.5 | Medium r12–14 | No | 60–85 | Basic sword + guarding + shield bash; readable opening | `grunt` + defensive new moves |
| E03 | Tower Harrier | Medium 1.9–2.2 | Medium r10–12 | Yes | 38–60 | Bow/short-shot, cover, retreat to firing lane | `archer` |
| E04 | Mudjaw Brute | Slow 1.2–1.7 | Big r18–24 | No | 155–220 | Delayed swing, overhead, short committed charge | `breaker` |
| E05 | Silt Spitter | Slow 1.4–1.8 | Small r9–11 | Yes | 50–70 | Travel-time bolt + short-lived floor hazard | `archer` + new hazard system |
| E06 | Crypt Duelist | Fast 2.7–3.1 | Medium r12–14 | No | 95–125 | Two-hit combo, lunge, lateral counter | `stalker` |

Do not treat these candidate HP numbers as balanced. Current `stalker` at 95 HP wins versus a new level-1 player in 76% of simulated fights; substituting its exact brain for an introductory Sentry would be too punishing.

## 4. Moves and weapons to add (keep player kit sword/shield)
The aim is NEW readable decisions, not extra particle effects:
- E01 **Hooked jaws / bite-lunge**: short slash-like bite with 8–10 dmg; a crouch→committed ~55–75-unit leap; landing recovery; no auto-hit tracking after leap commits.
- E02 **Notched sword / battered shield**: slash 12–15 dmg, distinct low-damage shield bash with high stamina/poise pressure, short guard stance with clear expiry and punish window.
- E03 **Hunting bow**: arrow 8–11 dmg; alternate aimed 24–32-tick telegraph vs weaker quicker shot; real projectile/cover collision; don't fake shots through obstacles.
- E04 **Stone-headed maul**: current `swing`, `delayed` and `overhead` variants; add short, fully committed charge with blocked path/obstacle collision; distinguish guard-break from true unblockable.
- E05 **Silt bladder / spit nozzle**: arcing or straight 7–10 dmg bolt; visible circular puddle ~70–95 radius, 0.65–1s pre-activation warning, active 2.5–4s, periodic damage and/or stamina drain at a controlled tick rate, never instant full-HP burst.
- E06 **Twin hooked blades**: 2-hit combination with separately visible timings, linear thrust, brief sidestep-to-counter; NO teleport and NO unavoidable frame-perfect read.
- Reusable environmental attack primitives: directional cone, narrow linear lane, delayed circular pulse, telegraphed persistent patch, chained pulses. Each should expose shape, cast/telegraph, live interval, collision and recovery to the existing perception system.
- Ensure moves inherit signed, testable block/guard-break/unblockable/poise semantics; do not use VFX-only hazard damage. Do not tune by invisible AI handicaps.

## 5. Boss encounter proposals and actual-bench-adjusted HP
Do not copy the earlier untested 420/950/1250 HP as fixed production numbers. Relative to the existing 170-HP Breaker (L1 only 3% survival), those amounts may be extremely long or reach the existing 150-second timeout. Start smaller and tune against seeded full encounter simulations.

**MB01 Bell Warden** — Big, medium walk 1.5–1.9, mace and bell, **initial 300–420 HP**.
- Moves: `Mace Sweep` (wide blockable 20–25), `Gatebreaker` (single clear guard-break 32–38), `Bell Toll` (visible radial pulse, 110–145-unit radius, 25–35-tick warning, active <=8 ticks, stamina damage with small HP consequence), `Recovery` 35–55 ticks.
- Gimmick: below 50% HP, two distinct, separated concentric pulses with a readable safe action; do not make unavoidable concentric spam.
- Intended first-clear reward **proposal**: permanent Watchtower→Crypt bypass + extractable shield sidegrade; neither auto-refunds key.
- Gate is 1 universal key, banked from earlier run and explicitly spent; another explicit choice starts fight.

**B01 Siltbound Castellan** — Big, slow 1.3–1.7 with medium bursts, halberd and channel activator, **initial 540–680 HP** (not 950 fixed).
- Moves: `Castellan Arc` frontal sweep (20–27), `Weirbreaker Slam` guard-break (32–42), `Silt Wave` narrow linear ranged attack (12–18), `Flood Channel` telegraph marked ground lane 30–45 ticks, channel live 45–75 ticks, `Recovery` 38–60 ticks.
- Gimmick: three visually distinct flood lanes across 740×740 arena. Phase 1 activates 1 lane; phase 2 after ~45% HP activates 2 lanes **sequentially** while leaving a physically reachable safe corridor. Do not trigger unavoidable overlaps during attack commitment/recovery.
- Recommended first boss challenge: L1 is effectively unwinnable (target <=1% wins across 300 seeds with no free invulnerability, not a hard level lock). Level 40–65, with a *realistic attainable* in-expedition upgrade and consumable budget, should present a hard but viable challenge (target 30–55% first-attempt win in prepared, post-approach state). Retune after testing actual movement/regen/consumables. Avoid hard-coded 'boss checks level' logic.
- Defeat permanently reveals downstream world connection; reward remains carried until extraction. Optional rematch uses existing arena with distinct opt-in.

**SB01 Unmoored Surveyor** — Medium, fast 2.7–3.1, blade and thrown survey pins, **initial 680–850 HP** (stretch content; optional).
- Moves: `Surveyor Cut` fast blockable, `Bearing Pin` projectile, `Route Mark` drops 2–3 visible delayed line markers from recent player positions, `False Advance` committed thrust, `Phase 2 Echo` repeats marked lines in reverse. Marker damage must remain avoidable within arena by a legally moving AI.
- Proposed optional special key is NOT locked; boss cannot block critical path or ordinary-key trial access. Reward optional trophy/sidegrade, NOT mandatory progression.

## 6. Objective numeric balance targets (PROPOSED; per 300 deterministic seeded fights)
Configure exact player character LEVELS via `1 + Σ(attribute-1)`; test multiple point allocations at the same total level to ensure no single doctrine/build dominates.

| Encounter | L1 solo win target | Recommended test level | Win-rate target at that test level | Rationale |
|---|---:|---:|---:|---|
| Mireling alone | 65–85% | L7 | 80–95% | Harsh tutorial but recoverable |
| Ashen Sentry alone | 35–65% | L13 | 65–85% | Teaches guarded combat |
| Tower Harrier alone | 45–75% | L19 | 75–90% | Cover and pursuit matter |
| Mudjaw Brute alone | 0–8% | L55 | 60–85% | Danger signposted in lower region |
| Silt Spitter alone | 20–50% | L25 | 70–85% | Hazard movement challenge |
| Crypt Duelist alone | 0–12% | L55 | 55–80% | Requires levels/knowledge |
| Bell Warden | 0–2% | L45–60 with preparation | 35–60% | Optional meaningful challenge |
| Siltbound Castellan | <=1% | L40–65 with preparation | 30–55% | Main boss extremely hard at level 1 |
| Unmoored Surveyor | ~0% | L75–95 with preparation | 20–45% | Optional mastery stretch |

PLUS **route-level tests**, not reducible to isolated-fight win rate:
- First-ever L1 Old Road expedition: 30–50% of novice/untuned run profiles return with bankable loot under sensible standing orders, not 0% and not 100%. If this proves overly frustrating in human tests, raise after feedback.
- 2–3 early contacts should consume meaningful healing/recovery budget; no automatic full heal after fights.
- Key Trial: designed chance to finish and extract on first fresh expedition is low but credible, ~10–25%; becomes dependable through player map knowledge, route and improvements. This trial is keylessly reachable, deterministic 1-key award on *legitimate completion*, but newly found key must reach camp then be provisioned on a new trip.
- Fresh L1 direct boss approach is nearly unwinnable if permitted to reach it (boss requires deliberate gate open/fight; player levels not used as access lock).
- At least one designed pre-boss preparation route plus XP/sanctuary choices must get the adventurer to intended boss-ready level without grinding disconnected arenas forever. EXPEDITION level resets; the previous design's L7–9 first-boss target is inconsistent with this code's 6-attribute total-level model. Reconcile XP grants, checkpoint abilities and stage hazards BEFORE locking targets.
- Average ordinary encounter active combat around 8–25s, elite around 20–50s; boss first clear 45–110s. Some current high-stat elite fights approach 150s and draw; report timeout rates separately.
- Evaluate all three doctrines, varied seeds, survival HP %, durations, damage causes, timeout rate, and especially sequential encounter attrition without automatic healing.

## 7. Map: spatial scale and bounds (PROPOSED; macro, not built geometry)
**Coordinate system:** existing sim world units. Planning grid 32 world units = 1 tile-like editor cell (convention only). Total map bounding box 5,120 × 3,584 units (~160×112 cells). This is a compact, interconnected VERTICAL SLICE—not full game world. More region content should arrive later. Travel movement unconstrained is nominally 75 world units/s at 30 Hz; use actual navigation/pathfinding distances, not straight-line estimates, and adjust after playtesting.

**Collision constraints based on EXISTING SIM:** player radius 13, Brute radius ~18–24, dodge 92. Typical combat rooms should provide clear floors at least 480×440 (prefer 520×480+). Corridors width 160–224 units (5–7 grid cells) for regular encounters, boss arena 740×740 (may grow to 800×800 if required), miniboss 720×700, optional secret 740×720. Door approach buffer >=160 depth; do not begin combat with bodies directly stacked at doorway. Overhead/lateral cover must actually block ranged line-of-sight and projectiles. Narrow passages may exist as pure traversal but should not spawn unavoidable area hazards or high-count simultaneous attacks.

Rooms use supplied file `vertical_slice_room_schedule.csv` with center coordinates and CLEAR FLOOR dimensions. Key examples:

| ID | Encounter zone | Clear floor | Threat / purpose |
|---|---|---|---|
| C0 | Camp | 500×480 | Safe; storage/bank only |
| O1 | Outer Road | 480×440 | 1 early enemy |
| O2 | Crossroads | 540×480 | First routing / key trial branch |
| O3 | Broken Causeway | 500×400 | Sentry or pair; warning |
| KT | Key Trial Watchpost | 500×420 | Repeatable keyless challenge |
| T1 | Tower Yard | 520×480 | Archer and cover |
| T2 | Tower Barracks | 560×520 | Sentry+Harrier, telegraphed |
| T3 | High Gallery | 500×360 | Optional cache and encounter |
| MB | Bell Warden | 720×700 | Sealed fog gate, first-clear bypass |
| S1 | Sludge Ford | 540×480 | Spitter/hazard |
| S2 | Broken Pump | 620×520 | Brute/sanctuary nearby |
| S3 | Low Gallery | 520×380 | Opens camp shortcut |
| K1 | Crypt Threshold | 560×540 | Advanced mixed, staged |
| K2 | Ossuary | 560×520 | Crypt Duelist |
| K3 | Upper Crypt | 520×360 | Long crypt approach |
| B1 | Siltbound Castellan | 740×740 | Sealed main boss; first clear campaign gate |
| SB | Unmoored Surveyor | 740×720 | Optional secret boss pocket |

**Topology** (links are in `vertical_slice_connections.csv`):
```
                         T3 High Gallery
                              |
           T1 Tower Yard — T2 Barracks — [KEY GATE] MB Bell Warden
             |                    |                      .. unlockable bypass ..
C0 Camp — O1 Road — O2 Crossroads  |                                      K2 Ossuary — [KEY GATE] B1 Castellan
                 |       |         K3 Upper Crypt ----------------------  /       
                 KT      O3 Causeway    |                                 /         SB optional
                 Trial    |             +-- route to K2                   /         special pocket
                         S1 Ford — S2 Pump — K1 Crypt Threshold ---------
                                      |
                                     S3 Low Gallery -- (unlocked shortcut) -- C0 Camp
```
Use blueprint image `vertical_slice_map_blueprint.png` and its editable `svg` companion for approximate placement. Position/size are target clear floors not finished art or verified traversal times. Regions can vary enemy presence, but geometry and permanently unlocked shortcuts remain stable.

**Encounter zoning / fairness**:
- Fixed 32-unit planning grid is NOT equivalent to AI decision/action units until integrated; movement remains continuous.
- Spawn no enemies within 110 world units of the initial adventurer entry point, and do not position multi-enemy packs to surround player on zone activation. At least one legal 160+ wide retreat corridor at encounter start. These are proposed starting tolerances to test against player dodge distance 92, not guaranteed safe rules.
- Do not aggregate entire regional populations into one simultaneous circle fight. At lower levels, groups spawn as actual local residents and detect the adventurer using line-of-sight/noise. Regional pursuit, last-known search, quick alert reset remain as locked.
- Boss gates display to the map when found, need a prior-banked/provisioned 1 universal key, and open permanently without starting fight. Boss encounter starts only after separately commanded engagement. Boss remains arena-bound. Miniboss first clear optionally opens T2→K2 bypass; this is PROPOSED reward, not locked.
- Key Trial accessible via O2→KT without crossing a fog gate, and permanent geography discovery carries across death. Optional special boss cannot block routes or normal key replenishment.
- High-level enemies should be fixed to predictable territory sets; no global auto-scaling or invisible threat inflation.

## 8. Proposed encounter placement and pacing
- `O1` 1 Mireling OR 1 weak sentry (not two elite); the first safe chance to level/grab loot.
- `O2` 1 Mireling OR Sentry at a distance, never forced double-Stalker; `KT` branch visible. Each region gets 1–2 deterministic authored teaching encounters and variable low-tier patrol slots.
- `O3` one Sentry or up to 2 Mirelings with a warning window; no hard Brute at camp approach.
- `T1` Harrier alone with 2 solid cover objects and one unblocked approach; `T2` Sentry+Harrier at separate positions so no instant firing squad; `T3` optional Harrier/Mireling and treasure.
- `S1` one Spitter and 1 telegraphed hazard patch; `S2` one Brute and sanctuary in adjacent safe alcove (sanctuary cannot bank); `S3` 1 Spitter or 1 weak escort, unlocks camp passage.
- `K1` staged Sentry + Spitter rather than simultaneous arrival with no cover; `K2` one Duelist, `K3` an optional high-risk pair; `MB/B1/SB` behind deliberate gates only.
- Ensure region variability uses a documented threat budget, with elite/multi-archer combinations authored as risky discoveries, not unadvertised population rolls.

## 9. Claude Code execution & acceptance sequence
1. Read `AGENTS.md` if present, current project structure, attached combat files, and design library. Do not assume these attachments are the active repo build. Report which files are authoritative and any differences in embedded HTML vs Node sim.
2. Freeze reproducible baseline: current modules + 300-seed reports for existing encounter/doctrine presets, including timestamp, seed range, win/draw, mean remaining HP and duration.
3. Expose/reuse move metadata, then implement one enemy at a time. **DO NOT** rewrite existing player AI. Add tests for the new move type before bosses (projectile + cover, telegraphed ground hazard, 2-stage attacks, deterministic seeds).
4. Start with **E02 Ashen Sentry** and **E01 Mireling**. Verify L1 is difficult but not hopeless; avoid testing only against god-mode AI.
5. Add E03 ranged cover; E04 Brute; E05 hazard; E06 Duelist. For each, run win curves at character levels 1/7/13/25/55, all three doctrines and 300 seeds; record actual point allocations.
6. Create rooms/zones to coordinates and dimensions in CSV, including walls, cover, inter-zone portals, connected region nav and retreat. Build reliable map/encounter orchestration BEFORE attempting arena phase hazards in the world.
7. Add Key Trial and its extract-to-camp lifecycle; miniboss standard gate; then main boss and optional secret pocket. Preserve route exclusions, distinct gate spend consent and boss engage consent.
8. Ensure combat AI receives world-authoritative collision/avoidance constraints, regional chase boundaries, and legal disengagement vectors; never silently cross excluded regions.
9. Run 300+ seeded isolated combat tests AND integrated sequential-route tests (persistent HP/stamina/inventory, level-up schedule, safe rest, enemy packs, key extraction). Record results and tune to targets, rejecting tuning that only makes arena work.
10. Output a human-playable slice, a before/after balance report, known deviations from source spec, and a list of required human tuning decisions. No premature asset/content inflation.

## 10. Completion criteria
- A seeded encounter can be reproduced on both bench and game world (subject to geometry/cover differences which are tested and explained).
- L1 progression is demanding but attainable; first boss near-impossible at L1 **for transparent combat reasons** and convincingly beatable after a real pre-boss route with earned upgrades.
- At least two alternate camp→Crypt routes with materially different threats, and at least one genuine shortcut that persists.
- Recovery extraction remains risky and boss gate consent never conflated with spending a key.
- New attacks are perceivable to handicapped player AI and readable to human spectators; no invisible/unblockable unavoidable damage.
- Trial keys awarded once per trial completion, never created by backing in/out or repeated room activation.
- 300-seed quantitative reports and one manual observation pass validate isolated fights, sequential attrition, rematch reset and full expedition outcomes.

**Priority if schedule is tight:** benchmark + two normal enemies + one gated miniboss + two looped routes + keyless Trial. Secret boss remains a planned stretch, not a dependency.
