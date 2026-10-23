# 15 — Vertical Slice and Acceptance Tests
**Owner:** Prototype scope and design verification  
**Status:** Prototype narrow focus LOCKED in intent; budgets and numerical targets PROPOSED

## Vertical slice hypothesis
One sword-and-shield adventurer, a small looped map, controlled variable encounters, one boss and a real extraction/death-recovery loop should reveal whether autonomous expedition command is intrinsically fun. Building a larger campaign first would conceal core-design flaws behind content volume.

## Proposed playable slice
| Component | Target |
|---|---|
| Starter kit | One sword/shield + basic armour + limited consumables |
| Combat doctrines | Guarded, Measured, Pressing |
| Exploration priorities | Safe, Thorough, Direct |
| World | Camp, Old Road, Watchtower, Sunken Passage, Forgotten Crypt, Guardian Arena |
| Connections | Minimum one meaningful locked shortcut and one alternate return path |
| Foes | Stalker, Breaker, Harrier, Warden elite, one Guardian boss |
| Variability | Several curated population patterns and one temporary region condition |
| Orders | Destination/objective, survival triggers, emergency retreat, safe junction redirect |
| Map | Permanent fog, visible route, discovered vs activated gates |
| Sanctuary | One safe rest/recovery point; no bank; one significant upgrade choice |
| Progression | Temporary auto-levels and a small selection of meaningful upgrades |
| Loss | Carried resources, one suggested death cache, physical home banking |
| Boss | Permanent first defeat, world alteration, optional original rematch + one challenge |
| Feedback | Current intent, recent reasons, end-of-run Chronicle |

## First-session test script
1. Start at camp; select a planning preset and identify first frontier.
2. Traverse Old Road, observe one ordinary encounter and clear description of adventurer behavior.
3. Reveal Watchtower connection and make one meaningful diversion decision.
4. Reach sanctuary, rest and choose a major upgrade without banking.
5. Attempt return or continue toward objective, creating genuine extraction risk.
6. After death (if encountered), relaunch and plan route to cache using retained map.
7. Open shortcut; demonstrate return path actually changes.
8. Kill first boss, verify world route changes; later rematch without reverting clear.

## Acceptance checklist: gameplay
- Route choice affects distance, expected opposition and resource use.
- Safe/Direct preference yields legible different travel decisions.
- Combat AI is competent enough that results are explained, not purely random spectacle.
- Emergency retreat changes high-level intent in combat and can fail only for understandable reasons.
- Map memory and permanent shortcut persist across death/reload.
- Sanctuary never deposits carried currency/items.
- Camp extraction is the only reward-bank event.
- Cache retrieval and a second death obey one-cache rule if that proposal is accepted.
- Boss first defeat permanently opens authored change; optional rematches don't reverse it.
- Ordinary populations vary across runs within territory rules; disengagement returns enemies quickly to normal.

## Acceptance checklist: player comprehension
Observe participants without guiding them. Ask: “What were you trying to achieve?”, “Why did your character take that route?”, “What will you lose if you die?”, “What would you change next time?”, “What is the shortest safe way home?” If answers are mostly guesses, redesign information flow before adding more content.

## Quantitative hypotheses to measure (not commitments)
Share reaching first expedition conclusion, percentage launching second expedition, abandonment during safe traversal, frequency of retreat order, death recoverability, use of newly opened shortcut, and rematch interest. Establish targets after observing first testers rather than inventing conversion success criteria.

## Stop conditions
Pause content expansion if repeated routes have no interesting strategic decisions; if deaths lack actionable explanations; if leaving through shortcut does not meaningfully change risk; if AI must be micromanaged to succeed; if safe-farming produces dominant progression; or if save/load breaks banking invariants. Fix causes before increasing scope.

## Excluded until slice passes
Extra classes, procedural terrain, complex crafting, multiple party members, multiplayer, macro live-ops economy, premium expansions, high-volume art collection, sophisticated factions or permanent region-wide alarm simulations.

## Workshop 09 — Hybrid planning acceptance suite (PROPOSED)
| ID | Setup / action | Expected result |
|---|---|---|
| H01 | New run; select accessible landmark; launch without advanced edits | A legal auto-generated route and visible physical-return order |
| H02 | Add reachable junction as waypoint | Proposed approach changes to include it; still autonomously navigates locally |
| H03 | Avoid an optional dangerous region with legal alternate | Preview avoids that region and explains new travel burden qualitatively |
| H04 | Avoid the only legal approach to required objective | Preflight says Conflicted; does not launch on a false valid route |
| H05 | Tap unmapped map space | Cannot create impossible precise waypoint; suggests known frontier instead |
| H06 | Survey frontier and discover new connection | Map reveals progressively; shortcut usable only after interaction/opening |
| H07 | Encounter patrol in supposedly safer region | No breach of known-intelligence honesty; last-known data clearly distinguished from certainty |
| H08 | Press Retreat in active combat | Strategic goal changes immediately; tactical system attempts legal disengagement |
| H09 | Retreat HP or healing threshold reached | Optional objectives suspended; route home prioritized; no auto banking |
| H10 | Recovery cache selected, optional treasure encountered | Recovery objective retains priority under Direct instructions |
| H11 | Mandatory waypoint confirmed impossible after bounded alternatives | Visible `Skipped — Blocked`; continues next legal objective in original order, never crosses ban |
| H12 | Boss permanently defeated but character dies on journey home | World change permanent; unbanked loot handled by death cache proposal |
| H13 | Sanctuary reached during itinerary | May recover and offer rare choice; never banks anything |
| H14 | Return on newly opened shortcut | Planner uses valid new connection; resource bank only at camp |
| H15 | Close/resume during queued reroute | Same active plan and constraints restored without duplication or magical extraction |
| H16 | Enemy loses contact in region | After short search returns quickly to normal; no persistent regional alarm |

**UX test:** Have an unfamiliar player distinguish confirmed routes, frontiers, hard avoidance, temporary threat reports and the actual selected plan. If they cannot, reduce UI complexity before adding multiple kit types or region count.

## Workshop 10 — Hard avoidance acceptance suite (L13, mandatory)
| ID | Setup | Required result |
|---|---|---|
| A01 | Mark region forbidden; another legal route exists | Automatic route chooses legal alternate for all planned legs |
| A02 | Mark only known path to mandatory objective forbidden | Prelaunch route is `Conflicted`; no deceptive successful Launch |
| A03 | Mark region forbidden; Retreat pressed during combat | Strategic retreat starts, but neither combat movement nor navigator intentionally enters forbidden area |
| A04 | Low HP triggers retreat; only possible route home crosses forbidden region | No emergency permission created; `No permitted route home` is shown; character can die if escape fails |
| A05 | New shortcut opens inside forbidden region | Route remains prohibited; discovery/opening alone does not clear avoid |
| A06 | App closes/reopens after avoid selected | Same avoid constraint survives; no route revalidation silently drops it |
| A07 | Major waypoint and forbidden region conflict after a route closure | L14 explicitly records `Skipped — Blocked` and continues next permitted task; no invisible deletion or forbidden travel |
| A08 | At safe point, player explicitly removes restriction | New permitted route may be calculated and used; audit/Chronicle records the edit |
| A09 | During fight, character has only forbidden-tile dodge path | No intentional forbidden crossing; separate combat AI may instead defend, be hit or report trapped |
| A10 | Character cannot return but remains alive | Loot remains carried, not banked; run stays active until actual extraction/death or legitimate later resolution |

**Test emphasis:** test the prohibition under pressure, not just in the camp preview. The edge-case test for involuntary knockback is **OPEN**, requires joint agreement with combat-AI workstream.

## Workshop 11 — Locked skip-and-continue acceptance cases (L14)
| ID | Test setup | Required expected result |
|---|---|---|
| B01 | Task 2 truly inaccessible, tasks 3 and 4 accessible | Task 2 `Skipped — Blocked` with reason; execute tasks 3 then 4 in original order |
| B02 | Task 2 inaccessible because its only known route is excluded; task 3 reachable elsewhere | No forbidden boundary crossed; task 2 skipped; task 3 pursued from actual current position |
| B03 | Task 2 very dangerous but legally reachable | Do **not** label task 2 blocked solely due to difficulty; survival and combat policies still decide outcome |
| B04 | Task 2 involves still-unmapped frontier with legal access to its boundary | Do **not** automatically skip as blocked because route beyond fog is unknown |
| B05 | Task 2 is skipped; task 3 depends on the skipped gate opening; task 4 independent | Task 3 separately marked skipped for unmet prerequisite; task 4 attempted |
| B06 | Task 2 blocked; manual Retreat issued before task 3 | Retreat takes priority; tasks 3+ suspended, not executed |
| B07 | HP-based survival Retreat triggers while skipping task 2 | Stop processing outward tasks; attempt permitted extraction, do not continue to task 3 |
| B08 | All ordinary tasks unavailable but camp route exists | Record skips, physically return home, bank on arrival only; report partial/no objective completion |
| B09 | All ordinary tasks unavailable and permitted camp route missing | `Extraction blocked`; no automatic skip/teleport/banking; carried resources remain at risk |
| B10 | Two objectively different legal alternatives to task 2 exist | Attempt valid alternatives before issuing skip, avoiding unbounded repeated paths |
| B11 | Skipped objective becomes accessible after unrelated shortcut opens later | Does not silently resume; player may explicitly re-add the objective at a permitted decision point |
| B12 | Death-cache objective points to missing/replaced cache | Skip with `cache unavailable`, attempt later allowed goals, never fabricate the cache's contents |
| B13 | Boss is already permanently cleared but planned as first-time kill | Incompatible normal boss objective is not silently counted as complete; rematch requires explicit selection |
| B14 | Save/resume while objective 2 skipped and task 3 active | Same skip reason, queue index, region bans and task 3 intent restored; no retry or duplicate loot |
| B15 | No response to an optional discovery after task 2 skipped | Ordinary L14 queue continues according to visible standing defaults, without inserting a new mandatory goal |
| B16 | Prelaunch contains known forbidden-only destination | UX displays contradiction and requires explicit plan correction/acknowledgement; no deceptive reachable preview (presentation remains PROPOSED) |

**Test prioritisation:** B01, B02, B06, B07, B08, B09 and B14 are minimum prototype acceptance criteria because they prove actual L14/L13 interaction and extraction correctness. B03–B05 protect against false 'blocked' classifications. No combat AI internals are specified here.

## Workshop 12 — Major discovery + fog-gate acceptance matrix
These design scenarios preserve the original single-kit slice. A miniboss is now part of the creator's intended encounter-access concept; including one in the *first* slice is a scope decision, not a settled requirement.

| ID | Scenario | Pass condition |
|---|---|---|
| D01 | Routine map reveal while player absent | Records permanent discovery; continues standing plan; no forced modal |
| D02 | Optional side passage revealed | Uses standing exploration default, no auto-added mandatory boss objective |
| D03 | Sanctuary significant upgrade during safe state | Can pause for player choice; no free tactical invulnerability |
| D04 | Browser closes during unanswered sanctuary choice | On restore, pending secure choice remains; no auto-awarded upgrade |
| D05 | First boss fog gate discovered without key | Permanent map marker; no fight; no route through gate |
| D06 | Key already carried, passing sealed gate | Neither spend nor engage automatically |
| D07 | Gate unlock confirmed | Exactly one key spent; permanent gate opened; boss not yet engaged |
| D08 | Player retreats just after unlock | Gate remains open next run; spent key does not respawn |
| D09 | Player chooses `Leave` on encounter-entry prompt | Can retreat/continue legally; boss not started |
| D10 | Browser interrupt on unlock confirmation | Pending or completed state restored atomically; no duplicate charge |
| D11 | No key and boss objective queued | Objective skipped as blocked; subsequent permitted objectives attempted in order |
| D12 | L13 exclusion covers gate approach | Key availability never authorises entering forbidden region |
| D13 | First boss defeat then death before extraction | Boss remains defeated, reward loss follows carried/cache rules |
| D14 | Boss rematch through previously opened gate | Separate opt-in; no new key spend; first clear unchanged |
| D15 | Key source resides behind own gate | Fails progression reachability validation; revise authored region |

## Workshop 13 — Key classification and campaign reachability tests
| ID | Scenario | Pass condition |
|---|---|---|
| D16 | Two sealed ordinary gates, one universal key | Player can choose either; only selected one opens and consumes one unit |
| D17 | Ordinary miniboss gate versus standard major-boss gate | Both recognise the same universal Gate Key type |
| D18 | Exceptional optional gate reached with only universal key | Cannot unlock; key not consumed; blocked objective skipped and later allowed tasks continue |
| D19 | Player holds special key at an ordinary gate | No implicit exchange, spend or unlock without a universal key |
| D20 | Campaign route graph excludes every special-key gate | Campaign remains complete with ordinary access mechanisms and reachable key supplies |
| D21 | Optional ordinary gate spent early | No irreversible depletion that makes required gate(s) permanently unopenable under authored default world economy |
| D22 | Key unlock committed, app interrupted or character dies | Gate remains open and same key cannot be charged twice |
| D23 | Optional special boss unlocked and later lost | Main campaign and required passages remain unchanged; optional gate state persists |

**Test scope:** D16–D22 are design/authoring acceptance scenarios. Optional special-boss D18–D20/D23 can be validated in content authoring without building an actual special boss for the first playable prototype.

## Workshop 14 — Key acquisition / extraction acceptance suite (L18)
These are **design acceptance scenarios**, not requested automated gameplay code:
1. A first-time authored discovery yields its specified universal key on genuine completion, even when enemy patrol composition differs.
2. Revisiting the already-claimed authored source does not yield another key.
3. A repeatable trial is reachable without opening the required next gate and yields a universal key on successful completion, with a real return journey.
4. The trial may be retried on a later expedition after failure; no daily wait, ad, premium purchase or random rare drop is required.
5. Clearing the trial a second time on the same expedition cannot be exploited to generate infinite keys (proposed one-claim cap).
6. A player who spends a key on an optional miniboss gate can still earn enough keys to unlock the next mandatory gate.
7. A player who loses all held keys through death and death-cache replacement retains a legal trial path for re-acquisition.
8. A reward carried from the trial is not credited to permanent bank at sanctuary, on boss victory or on merely finishing the objective.
9. Completing a trial objective with a prohibited route to its location produces `Skipped — Blocked` and continues following L14; restriction is not overridden.
10. Confirmed gate unlocking consumes the universal key exactly once, permanently opens the selected gate and does not automatically begin combat.
11. Reload immediately before/after obtaining a key, reclaiming a cache or unlocking a gate does not duplicate or delete key transactions.
12. Finishing the campaign never requires the optional special key or special boss.

**Initial content budget proposal:** exactly one authored discovery, one renewable key challenge and one ordinary fog gate in the first integrated vertical slice. A second optional ordinary gate is added only to validate key spend trade-offs. Any result where losing/using an optional key creates permanent main-campaign deadlock is a **design failure**, not an intended punishment.

## Workshop 15 — L19 camp-first Gate Key acceptance scenarios
1. Claim a guaranteed key during expedition A and approach an eligible unopened gate before extracting: cannot unlock; gate stays closed and key stays carried/unbanked.
2. Complete a repeatable Key Trial on expedition A then approach a boss gate: same ineligible outcome, regardless of whether the player pre-planned gate access.
3. Visit sanctuary with fresh key: rest/upgrade may proceed; key remains unbanked and unusable for gate unlock.
4. Extract to actual camp after claiming key: banked stock increases exactly once. Starting expedition B with the key explicitly issued makes it eligible.
5. Leave banked stock at camp and arrive at gate without issued key: no remote spend permitted; gate remains sealed.
6. Arrive with both fresh and issued keys: only previously banked/issued keys count toward unlock cost; no automatic conversion or substitution.
7. Die with fresh key: under provisional P02, it enters cache still unbanked; recover it in expedition B without visiting camp and attempt gate: still ineligible.
8. Die with issued but unspent key: under provisional P02 it follows recoverable-cache flow, retaining its prior banked eligibility but never automatically refunded into camp stock.
9. Spend eligible key and die immediately: key consumed once, gate remains open, no spent key in cache and no second opening charge.
10. A sealed-gate objective with only fresh key skips as blocked (L14); subsequent independent tasks continue on permitted routes (L13).
11. Optional gate consumes all issued keys, but keyless-accessible repeatable trial still exists; mandatory campaign not permanently softlocked.
12. Close browser before unlock confirmation: no spend and no unapproved encounter; resume preserves key eligibility and gate state.
13. Attempt repeated camp-bank event from reload: key stock must not double count.
14. First-time key is discovered but the player dies and loses a recovery cache: replenishment still accessible via legal, challenging keyless path.
15. Onboarding correctly teaches one full acquisition → extraction → provision → unlock cycle without claiming the player is forced to fight immediately.
Numerical gate costs, key carrying quantity and cache replacement severity remain open, so tests should parametrize those assumptions in future implementation instead of asserting them as approved design locks.

## Workshop 16 — L20 two-slot keyring economy acceptance scenarios
| ID | Design scenario | Pass condition |
|---|---|---|
| K20-01 | Camp provisions 0, 1 or 2 banked keys | Valid; exactly selected quantity moves from protected camp stock into prepared carried slots |
| K20-02 | Player attempts to provision 3 | Rejected; no third prepared slot or silent substitution |
| K20-03 | Two prepared keys + one freshly trial-earned | Fresh key is separate unbanked cargo, cannot open gate or refill ring |
| K20-04 | Two unopened gates, both cost 1 under proposed O26 Price A | Each requires separate explicit spend, not automatic on reaching it |
| K20-05 | One prepared key spent and character killed | Opened gate persists; spent key not dropped; other unspent key obeys proposed recovery lifecycle |
| K20-06 | Two prepared keys but camp retains three more | Death risks only issued keys; camp stock untouched; no remote gate spending |
| K20-07 | Previously banked key recovered with full ring | Does not enable a third usable keyring slot; preserve key provenance and cargo until resolved |
| K20-08 | Keyless expedition earns challenging trial key | Must physically bank at camp before any first unlock; no instant replenishment |
| K20-09 | All universal keys spent on optional miniboss gates | A keyless-accessible repeatable trial still supports future mandatory unlock |
| K20-10 | Major gate priced above 2 under current L20 | Authoring/validation flags impossible first payment, unless a later creator-approved alternative exists |
| K20-11 | Optional miniboss first defeat changes a shortcut under proposed O22 | World change persists even if the return trip fails; unbanked loot does not |
| K20-12 | Multiple gate spends interrupted by reload | Prepared key count and permanent opened flags remain consistent, never duplicated |

This is a **design acceptance matrix**, not evidence of implemented or passing software tests. O26 (standard gate price) is RESOLVED by L21: one universal key. O22 (miniboss rewards), O23 (authorisation UX) and O05 (cache) remain OPEN. Detailed ledger examples: `24`.

## Workshop 18 — Roster and difficulty acceptance additions (PROPOSED)
Reference `25` for six normal enemy briefs, the Bell Warden miniboss, Siltbound Castellan major boss and stretch Unmoored Surveyor secret boss. Priority for test execution: Sentry → Mireling → Tower Harrier → Mudjaw Brute → Silt Spitter → Crypt Duelist → miniboss → major boss → optional secret boss. Validate fresh L1 solo early-fight survivability and genuine risk in pairs; L1 main boss near-impossible by **readable attrition**, not character-level lock, input-independent damage or AI blindness; L7–9 achievable on a valid pre-boss route despite expedition level reset. Enemy stats are fixed by region, no adaptive level-matching. First unlock price exactly one key L21, must be banked then issued. Boss never auto-engages. Secret boss not required for minimal test slice.


## v0.14 proposed art-readability acceptance gate
Reference `29` and `29B`: test adventurer/Sentry/Mireling recognition; normal-speed attack warnings versus 30Hz event timestamps; true wall/cover/collision; mobile camera readability; focus on O1 Old Road before expanding all bosses. These are **proposed** review criteria, not verification evidence. No gameplay locks change.

## Workshop 22 — Hybrid art pipeline quality gate (not yet executed)
Because L22 selected Blender-to-2D sprite production, verify the same seed/AI doctrine produces identical combat event results with and without exported sprites; test asset handedness, fixed ground-pivot and animation phase truth; check atlas download/VRAM on a low-end Android and actual mobile viewports; store source `.blend`, painted layer masters and licences. 3D scene renders must never be used to override 2D world collision/visibility. Evidence/status register: `30B_HYBRID_PIPELINE_VALIDATION.csv`. No new asset tests are claimed passed.

## Workshop 23 — 75° camera integration acceptance (design only)
A successful Old Road O1 visual proof must: (1) show N/E/S/NE and opposing shield-side mannequin facings exported from **one orthographic +75°** Blender camera, (2) show no hand-swapping, (3) maintain world ground pivot through guard/dodge/attack without sim movement, (4) visibly distinguish hero/Sentry/Mireling at target zoom on light and dark tiles, (5) preserve deterministic combat results before/after art substitution, (6) report real atlas/runtime memory and export repeatability, and (7) retain genuinely separate painted environment/VFX layers. Camera choice is locked; character proportion and direction count are pending test. Record evidence in `31A`/`31B`, no QA pass assumed.

## Workshop 24 art integration test additions — L24
- Eight-direction travel/guard coverage, including all diagonal headings and sword/shield handedness.
- Every selectively rendered attack viewed from eight actual facing angles; floor telegraph and sprite strike agree with simulation hit shape, timing and target-lock cutoff.
- Consistent feet pivots across heading/clip transitions and no root drift in moving camera.
- Replacing placeholder combat render with sprites changes no deterministic 30Hz seeded win/loss or damage results.
- Frame atlas counts, decoded memory and mobile test captures submitted before bulk asset production.
These tests are design acceptance criteria, **not executed tests**; detailed matrix `32A`.
