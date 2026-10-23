# 16 — Locked Decisions, Working Proposals and Open Questions
**Owner:** Game-design change control  
**Status:** Active decisions register  
**Updated:** 2026-10-23  
**Rule:** Only decisions clearly selected by creator are LOCKED

## Explicit locked decisions
| ID | Locked rule | Notes |
|---|---|---|
| L01 | Top-down 2D autonomous dungeon crawler for RUN.world | This workshop is design-only, not code |
| L02 | Limited field orders (Option B) | Player plans; character automatically adventures; retreats anytime and redirects at safe decisions |
| L03 | Major development choices at checkpoints (Option B) | Routine leveling/equipment automated; rare significant choices manual |
| L04 | Prototype uses exactly one starter kit: sword and shield | Don't widen kit roster during prototype |
| L05 | Persistent fog of war (Option B) | Revealed geography retained across runs/death |
| L06 | Sanctuaries option A | Rest/recover/rare choice, **never bank loot** |
| L07 | Boss option C | First defeat permanent; optional rematches afterward |
| L08 | Living world option B | Stable geography; variable ordinary encounters and temporary conditions |
| L09 | Enemy pursuit option B | Regional chase across connected rooms, line-of-sight loss/search, clear territory boundaries |
| L10 | Regional alert option A | After short search, enemies quickly return to normal; no persistent vigilance debt |
| L11 | Combat AI developed in a separate session | This library specifies interaction contract, not tactical AI implementation |
| L12 | Hybrid route planning (Option C) | Auto-select routes through known traversable geography; player can optionally place waypoints and mark regions to avoid; no tile-by-tile route drawing |
| L13 | Absolute route avoidance (Option A) | Marked regions/connections are never voluntarily entered, **including emergency retreat**. Only an explicit player edit can lift an exclusion. No silent override, even if that results in blocked extraction or death. |
| L14 | Blocked-objective fallback (Option C) | After trying permitted, genuinely distinct alternatives, **skip an impossible objective and proceed through subsequent permissible objectives in their original order**. Skipped items remain explicitly recorded; they do not reactivate automatically. Retreat/survival policy takes priority. Extraction is a non-skippable terminal attempt. |
| L15 | Unattended discoveries option B | Routine discoveries follow standing defaults; pause selectively only for consequential decisions at secure states, never granting safety mid-fight. |
| L16 | First-unlock key-sealed encounter fog gates | Major bosses and minibosses sit behind deliberately key-sealed fog gates; first opening requires key; discovery cannot accidentally start the boss fight. |
| L17 | Universal Gate Key currency (Option A) | Standard major-boss and miniboss fog gates use the same universal Gate Key resource for first, permanent unlock. Standard gate costs fixed by L21 at one universal key. |
| L18 | Universal key acquisition option C | **Guaranteed authored one-time key discoveries plus challenging repeatable replenishment.** Acquiring a key is not automatic banking; sources must not rely on paid purchases or random rare drops as the sole way to progress. Exact source placements/payouts remain open. |
| L19 | Gate Key first-use rule A | **A newly found or trial-earned universal Gate Key cannot unlock any fog gate during its acquisition expedition. It must first be physically extracted and banked at camp, then explicitly taken on a later expedition to become spend-eligible.** No sanctuary banking, remote key access, or accidental unlock. |
| L20 | Gate Key carrying option B | **Prepared keyring holds at most two previously banked universal Gate Keys per expedition.** Player deliberately provisions 0–2 from camp; the remainder stays protected in camp. Freshly found keys remain unbanked and ineligible. This did not itself lock gate price (subsequently resolved by L21); general inventory capacity remains open. |
| L21 | Standard fog-gate cost option A | **Exactly one universal Gate Key per standard major-boss or miniboss fog gate on first deliberate unlock.** No second payment on repeat entry or opt-in rematches; bank-first, two-slot keyring and separate engagement consent unchanged. |
| L22 | Art-production workflow option C | **Characters are modeled, rigged and animated in Blender, exported as 2D sprites; environments and VFX are hand-painted 2D assets.** No gameplay 3D conversion or combat AI change. The candidate *Ashen Reliquary* LOOK and sprite export details remain unapproved; projection is now locked by L23. |
| L23 | Character-sprite camera option B | **Fixed orthographic Blender render camera approximately +75° above the horizontal XY ground plane (15° off straight overhead).** A unified production camera for character sprite assets; no runtime perspective, isometric world/camera conversion or change to existing 2D combat/nav/collisions. **This does not lock** facing count, character proportions, raster sizes, the proposed *Ashen Reliquary* look or orientation. |
| L24 | Selective eight-direction sprites (Option C) | **Locomotion and guard animations have N, NE, E, SE, S, SW, W and NW directional coverage.** Attacks use an intentionally selected facing set per move, expanding to eight only where tell/impact readability requires it. No dishonest attack visual direction, no unchecked mirroring that reverses sword/shield hands, and no combat tick/hitbox changes to compensate for fewer rendered directions. Final per-attack direction set, atlas budget and frame counts remain OPEN pending test. |

## Established design direction, but still PROPOSED in detail
| ID | Proposal | Owner |
|---|---|---|
| P01 | Camp-only physical extraction; no teleport return | 08; strongly established across workshops |
| P02 | One recoverable death cache; replacement on another death | 08 |
| P03 | Three combat doctrines: Guarded/Measured/Pressing | 10, 14 |
| P04 | Three exploration preferences: Safe/Thorough/Direct | 03–05 |
| P05 | Five mission objectives max; four common presets | 04, 12 |
| P06 | Temporary combat XP resets; recoverable mastery XP banks at camp | 10, 09 |
| P07 | One major upgrade choice per expedition | 09–10 |
| P08 | Limited first sanctuary recovery per expedition | 09 |
| P09 | Camp + five external locations; enemy roster expanded in proposed Workshop 18 authoring brief | 02, 15, 25 |
| P10 | Qualitative route threat assessment; Chronicle and optional fast-forward | 12 |
| P11 | Optional rematch challenge variants + cosmetic/record rewards | 11, 13 |
| P12 | Cosmetic-led ethical monetization; no paid death recovery | 13 |
| P13 | Complete campaign ending; optional postgame mastery challenges | 01, 11, 13 |
| P14 | **SUPERSEDED by LOCK L19.** Previously proposed bank-before-first-use; now required. Exact unlock price, number of keys transported and gate-site versus preauthorized approval remain open. | 09, 21, 22, 23 |
| P16 | A rare distinct key may unlock an exceptional **optional** boss; no mandatory campaign route, ending, or progression-critical gate requires that key | 02, 11, 21 |
| P15 | Encounter gate key spending and boss entry are separate explicit confirmation interactions; one miniboss added to vertical slice if affordable | 11, 21 |

Important: P01 is central to the design as developed, but the explicit standalone option selected was sanctuary **A**, which implies camp extraction in the discussed prototype. Keep the concept, but mark specific extraction semantics as tunable where needed.

| P17 | Vertical-slice roster: six standard foes (Mireling, Ashen Sentry, Tower Harrier, Mudjaw Brute, Silt Spitter, Crypt Duelist), one Bell Warden miniboss, one Siltbound Castellan boss, optional Unmoored Surveyor secret boss. Level bands and attack concepts are provisional; combat AI handled separately. | 06, 11, 25 |

| P18 | **Visual style PROPOSED:** *Ashen Reliquary*, hand-painted miniature top-down dark fantasy with ruined sacred architecture, readable restrained ground, clear combat telegraphs, controlled luminous accents, and a field-cartography UI; see `28`. User commissioned full document, did not yet formally lock the style. | 18, 28 |

| P19 | **First art validation milestone PROPOSED:** fully staged Old Road O1 scene with player, Mireling and Ashen Sentry; layered terrain, true telegraphs, 6 capture board, mobile/readability review. Art stays proposed pending approval. | 29, 29A, 29B, 29C |

## Open decisions to resolve over future workshops
| ID | Question | Why it matters |
|---|---|---|
| O01 | Portrait or landscape primary layout? | Map/detail readability and audience |
| O02 | Exact safe-resume UI for rare consequential pauses? | **Default behaviour itself resolved by L15**; still need safe resume policy and preference handling |
| O03 | Does a route plan permit conditional fallback branches in initial version? | **Route model is locked hybrid**; conditional branching and absence defaults are still open |

| O19 | How to handle player edits that forbid the region currently occupied? | Recommend rejecting contradictory active changes; exact interface remains open |
| O04 | Which items are risked, kept, or auto-equipped? | Clarity of loot stakes |
| O05 | One-cache replacement rule final approval? | Severity of death loop |
| O06 | What are finite inventory slots/weight rules? | Avoid annoying inventory micro |
| O07 | Is equipment durability worth its overhead? | Economy depth vs busywork |
| O08 | Sanctuary recovery amounts and availability? | Prevent infinite farming |
| O09 | Exact temporary XP and mastery XP relationship? | Permanent vs per-run progression |
| O10 | How many major upgrades can be gained per expedition? | Run depth vs frequency of interruptions |
| O11 | Minimum region encounter budget and patrol reset timing? | Replayability without randomness abuse |
| O12 | What qualifies as a completed survey/frontier objective? | Prevent endless wander |
| O13 | What is campaign region count, ending length and side-content budget? | Full scope and production cost |
| O14 | Initial monetary business model and ads policy? | Revenue without pay-to-win |
| O15 | Art style, world fiction, UI theme, audio language? **Still OPEN** for the LOOK itself. Workflow C was independently LOCKED by L22, but the complete Ashen Reliquary visual proposal in `28` is awaiting approval. | Visual uniqueness and readability |
| O16 | How does save/resume work during active hazards? | Platform reliability |
| O17 | Challenge score formula and cheat/identity constraints? | Fair rematches/weekly content |
| O20 | RESOLVED by L17: universal Gate Keys for normal boss/miniboss gates; exceptional optional-boss key possibility is P16 | Do not reopen ordinary region-specific key model by accident |
| O21 | **RESOLVED by L19:** Key must be physically banked at camp before eligible first use | Later expedition required for newly earned keys |
| O22 | Are optional miniboss first defeats persistent; what are their rewards/rematches? | Encounter investment and scope |
| O23 | Can first gate unlock be preauthorised in plan or always confirmed at gate? | Prevent unintended currency spending and encounters |
| O24 | Which exceptional optional boss, if any, merits a unique key? Where is it earned? | Prevent special keys multiplying into a confusing second economy |
| O25 | RESOLVED by L18: guaranteed authored discoveries plus challenging repeatable replenishment | Exact content, difficulty, payout and loss implementation remain open in 22 |
| O26 | RESOLVED by L21: one universal key per standard boss/miniboss first unlock | All higher/tiered ordinary gate price options superseded. |

## Change log
- **2026-10-23:** Creator LOCKED flat standard fog-gate price (L21). Requested vertical-slice enemy and boss authoring roster with L1 difficult and first boss practically unwinnable at L1. Added P17 and document 25; names, exact stats, miniboss first-clear effect and optional secret key/boss remain proposals.
- **2026-10-23:** L15 locked safe selective discovery pauses; L16 established first-time keyed fog gates for major/miniboss encounters. Detailed key economy remains OPEN.
- **2026-10-23:** L14 confirmed automatic skip-and-continue for blocked ordinary objectives (Option C); Return remains non-skippable.
- **2026-10-23:** L10 confirmed quick regional alert reset (Option A), overriding prior assistant preference for temporary elevated alert.
- **2026-10-23:** Combat AI confirmed as a separate ongoing session; scope boundary formalized.
- **2026-10-23:** Detailed multi-file design library created. No code or abbreviated master GDD produced.

## Editing protocol
When a decision changes, revise this register, the owning rule document, any integration or test implications, then update relevant cross-reference summaries. Prefer adding a “Superseded” note over quietly erasing previous intent. Do not declare a proposal locked without an explicit creator decision.


## Workshop 08 revision (2026-10-23)
No new creator-confirmed lock. Proposed: objective-node planning with automatic path connection; Return to Camp appended by default; three-state camp/observe/review UX; optional waypoints and meaningful safe decision cards; stay-on-mission unattended fallback pending validation. These are documented as proposals in 04 and 12. Next creator choice: planning interaction model (draw exact paths versus select goals versus hybrid).

## Workshop 09 revision (2026-10-23)
- **NEW EXPLICIT LOCK L12:** Hybrid route planning (C) with automatic route selection, optional player waypoints and areas/regions to avoid. Supersedes prior unresolved model choice; does **not** lock manual click/long-press gestures, five-task limit, avoidance hardness, exact risk weights or response to impossible emergency avoidance.
- **New detailed proposals:** 04 route authoring and objective-status contract; 12 map-first interaction and preflight; 05 navigation constraint interpretation; 08 transparent risk warnings and retreat precedence; 03 fog-aware waypoints; 14 combat handoff; 15 scenarios; 17 plan-state persistence; 19 progressive onboarding.
- **Superseded OPEN items from Workshop 09:** hard vs soft avoidance and emergency physical return overriding forbidden travel were resolved by creator selection L13: **absolute exclusion, no emergency exception**. Still OPEN: precise survey completion bounds; queuing field edits while threatened; override of auto-retreat thresholds; handling unanswered decisions; exact number of tasks.
- **Unaffected explicit locks:** single sword/shield kit, limited field orders, permanent fog, sanctuary no-bank, permanent first boss defeat with optional rematches, living world with stable geography, regional enemy pursuit, fast reset after losing contact, combat AI in separate session.

## Workshop 10 revision (2026-10-23) — explicit creator lock
- **NEW LOCK L13:** Route avoidance is absolute. In a valid active plan, excluded regions/links are not eligible for automatic route selection, shortcut selection, emergency extraction, opportunistic investigation or intentional combat repositioning. A direct Retreat command does not change the travel prohibitions. Only an **explicit player edit** can remove the exclusion; the adventurer never infers such permission from low health, low supplies or a high-value death cache.
- **Consequences:** A conflict is caught before departure when already known; newly blocked returns report `No permitted route home`, seek legal alternatives and can end in death if no escape is viable. Sanitising a save, changing map state or timing out a prompt may not quietly remove exclusions.
- **Still proposals, NOT locks:** availability of editing orders during danger, how long to wait at a safe point, whether to allow one-way frontier expeditions, control gestures, threat-rating weights, and threshold numbers. The blocked-objective fallback is now resolved by L14.
- **Superseded:** Previous proposed emergency exception/"only practicable route" and wording allowing an avoided corridor in desperate retreat are invalid after L13.

## Workshop 11 revision (2026-10-23) — creator lock L14
- **NEW LOCK L14:** A task becomes `Skipped — Blocked` **only** after it cannot currently be fulfilled through any known, permitted, traversable alternative and bounded re-evaluation has completed. Do not skip because something is merely risky, currently guarded or beyond mapped fog.
- The adventurer then attempts remaining objectives **in original order**, independently assessing whether each is feasible. A blocked prerequisite may cause later dependent tasks to be skipped too; no automatic task reordering, recovery substitution or route-ban relaxation.
- **No stealthy plan edits:** Mark skipped items visibly with a cause and Chronicle entry. Keep skipped tasks in history. A skipped task is not automatically retried after an unrelated shortcut unlock; the player may explicitly re-add/retry it via available field orders.
- Direct Retreat and configured survival triggers supersede task iteration. The **Return to Camp / extraction attempt** remains terminal and non-skippable; if no permitted home route exists, report `Extraction blocked`, retain carried risk and continue permitted survival behaviour (no banking/teleport).
- A knowingly impossible *prelaunch* objective is a distinct UX conflict. Proposed presentation: warn and request conscious correction/acknowledgement before launch; L14 guarantees in-expedition skip, not that clearly contradictory launch orders are accepted silently.
- **Remaining OPEN:** whether absent player input after a major discovery auto-selects Continue or waits at a safe decision; whether plans can have conditional task branches; exact task count; survey completion limits; field-edit permissions while in danger; how to treat unresolved temporary obstacles versus definitive blockages.
- **Superseded:** Workshop 09/10 proposals that defaulted blocked primary objectives to automatic return or indefinite hold, or demanded a major decision before any skip, do not apply to L14's ordinary blocked-task fallback.

## Workshop 12 — Discovery defaults and key-sealed encounter gates
**New creator-confirmed locks:** L15 (standing defaults during unattended ordinary discovery, selective pauses only at secure consequential decisions); L16 (boss and miniboss access behind key-sealed fog gates that consume a key on first opening; access never triggers an accidental boss fight). No code added.

**Historical Workshop 12 context (superseded):** At that point shared keys and bank-before-use were proposals. They are now **LOCKED L17 and L19** respectively; category prices and exact source frequency remain OPEN. The idea is designed to make expedition repetition meaningful; it does not authorise a paid progression gate or arbitrary run-count wall. One-time gate opening never revives a permanently defeated boss. For detailed ownership see `21`.

**Superseded open item:** O02 (whether ordinary unattended discoveries pause indefinitely) is resolved by L15. Remaining open: exact safe pause/resume UX for sanctuary, whether player may pre-authorise a first unlock, key exchange system, mini-boss persistence, and whether all keys must be extracted before eligible spending.

## Workshop 13 — Universal keys approved; exceptional optional keys proposed (2026-10-23)
**NEW LOCK L17:** Creator selected **A: universal Gate Keys** for ordinary major boss and miniboss fog gates. One shared Gate Key currency is the default. This supersedes any older prose treating shared versus region-specific keys as an open choice. Opening remains first-use, player-authorised and permanent, and entering combat still requires separate authorisation (L16).

**Creator's qualified direction, not a finalized key specification:** A *special key* may be used for an exceptional **optional boss outside the mandatory progression route** (P16). This should be rare and authored, not a regional-key system in disguise. Final source, whether exactly one exists, whether it is consumed, whether the optional boss has rematches, and how its rewards work remain OPEN. A special-key gate must never be the sole way to complete the campaign or reach a required route, ending, mandatory sanctuary or ordinary Gate Key source.

**Economy safeguard (PROPOSED authoring standard):** Spending universal keys on optional miniboss gates must not irreversibly strand the main campaign. Every essential standard-gate unlock needs a reachable and learnable key supply or recovery route, respecting absolute route avoidance and camp-only banking. Avoid compulsory repetitive farming. Banking-before-use and precise charges remain OPEN.

## Workshop 14 — Gate Key supply lock (2026-10-23)
- **NEW L18:** creator selected key acquisition **C**, combining guaranteed, authored first-time discoveries and challenging repeatable replenishment. This is a **resource availability guarantee**, not guaranteed victory or free automatic delivery. Keys must remain something the adventurer actively finds/earns and successfully extracts under the intended risky economy.
- **RESOLVED:** O25 category question: key supply is not finite-only and not repeatable-only. Repeatable sources must be reliably available via keyless paths so optional miniboss spending or dropped/lost keys cannot irreversibly block required progression. See new `22`.
- **Still PROPOSED:** specific trial conditions, one key per trial, first key's precise source, one key per gate and key risk/cache semantics. **Banked-at-camp first-use was subsequently LOCKED L19.** Rare special-boss keys remain **P16** optional side content.
- No change to L06 sanctuary cannot bank, L07 permanent boss defeat/rematches, L13 absolute avoidance, L14 skip-and-continue, L15 safe selective pauses, L16 deliberate first unlock, or L17 universal ordinary key type.

## Workshop 15 — Creator lock L19 (2026-10-23)
- **NEW LOCK L19:** Universal Gate Keys earned or found during an expedition have **not completed the required camp-banking step** and cannot open a sealed encounter gate in that same expedition. Even if the character discovers a gate and has a fresh key in their bag, access remains `Unbanked key — return to camp first`.
- Only a universal Gate Key previously extracted and banked at camp may be deliberately assigned to a later expedition for first gate unlock. Camp storage is safe while left at camp; key copies carried on an expedition are still risked if not spent. A successful first unlock consumes the qualifying carried key and permanently opens exactly the chosen gate; a defeat afterward cannot undo that spend or reopen the charge.
- **Prior P14/O21 are superseded/resolved**, not competing rules. Source categories L18, universal currency L17, separate gate unlock/encounter choice L16 and sanctuary prohibition L06 remain unchanged.
- **RESOLVED by L20/L21:** at most two banked keys packed; standard gate price exactly one key. **Still OPEN:** at-gate confirmation vs named pre-authorisation (O23), one-cache replacement (O05), exceptional optional special-key mechanics P16. Applying the first-use banking rule to a special key would be a separate proposal, not a creator lock.
- New source of truth for first-use eligibility: `23_KEY_BANKING_LOADOUT_AND_FIRST_USE.md`, linked from `21` and `22`. No gameplay code added; combat AI remains separate.

## Workshop 15 open economy questions
| ID | Question | Why it matters |
|---|---|---|
| O27 | **RESOLVED by L20:** prepared keyring capacity is two previously banked universal keys per expedition. | Do not reopen capacity as an unapproved proposal. |
| O28 | If a player brings several keys but spends only one, are the remaining unspent keys always carried at risk until camp? | Consistency with physical extraction and death cache |

## Workshop 16 — Creator lock L20, prepared two-key keyring (2026-10-23)
- **NEW LOCK L20:** At camp, the player may deliberately assign **zero, one or two** previously banked universal Gate Keys to an expedition. This is a strict **two-slot prepared keyring**. Extra banked keys stay safely in camp and are not accessible remotely; fresh keys earned in the field never become eligible simply because an empty slot exists (L19).
- **O27 RESOLVED:** the numerical keyring limit is two. The player may take fewer than two. A plan cannot pay for a required 3-key ordinary gate under current mechanics; gate costs above two would contradict L20 unless a future creator decision introduces a new payment method.
- **O26 resolved by L21:** exactly **1 universal key** for first opening of every ordinary miniboss or major-boss gate. Tiered alternatives superseded.
- **O22 remains OPEN:** optional miniboss first-clear permanence and reward structure. Proposed: a meaningful permanent map benefit plus at-risk extractable one-time spoils, without automatic Gate Key refund or repeatable key farming.
- **O23 remains OPEN:** at-gate spend confirmation versus explicitly preauthorised named unlocks. Under either model, unlocking and entering combat require separate, deliberately authorised decisions (L16), and unanswered prompts cannot spend keys (L15).
- **Overflow/death cache remains PROPOSED:** recovering additional once-banked keys must not allow a third *eligible* keyring slot; preserve provenance and no-duplication. Exact cache replacement and normal cargo rules remain O05/O06.
- **New document:** `24_GATE_COSTS_MINIBOSS_REWARDS_AND_KEY_ALLOCATION.md`. The separate combat AI session does not own currency, unlocking or rewards.


## Workshop 19 — proposed bench-matched roster and map (NOT LOCKED)
Creator supplied `combat-bench.html`, `combat-sim.js`, `balance.js` and requested Claude Code production handoff for proposed enemy units, patterns, measured balance targets and map encounter dimensions. Existing L1 player HP=75 and level formula `1 + Σ(attribute−1)` supersede the old **proposed** 100-HP/L7–9 placeholder assumptions when targeting this implementation. Proposed additions: E01–E06 and bosses MB01/B01/SB01, initial boss HP retarget 540–680 pending test, macro layout 5120×3584, 17 combat/landmark zones, 32-unit planning grid, persistent map links, boss/progression safe pacing. These are DRAFT recommendations, not creator locks. Existing universal Gate Key one-cost, two-slot banked keyring, extraction, persistence, absolute avoid, mandatory consent remain locked.


## Workshop 20 — Full proposed visual bible (2026-10-23; no new locks)
- Creator chose **Option A — write the full Visual Style & Art Direction document**. This is a document-deliverable selection, **not approval of the proposed style itself**.
- New `28_VISUAL_STYLE_AND_ART_DIRECTION.md` contains the candidate art thesis *Ashen Reliquary*; global swatch palette, regional colour script, top-down rendering/combat scale policy, first nine enemy/boss silhouettes, accurate move telegraphs, fog gates/keys/sanctuary state grammar, camp/map/Chronicle UX, low-end/mobile and accessibility constraints, editable asset pipeline, priority production order and visual acceptance tests.
- **P18** records the candidate visual direction; **O15 remains OPEN**. No change to L01–L21, combat AI, encounter geometry, key economy, expedition rules or authoring requirements.
- `18` stays the multidisciplinary art/audio overview; `28` owns detailed visual requirements once approved.


## Workshop 21 — Old Road art milestone (2026-10-23; proposals only)
- Creator said **Continue** after commissioning the full art bible. This authorises continued design/specification work, **not** selection or locking of the Ashen Reliquary visual style. L01–L21 remain intact; **P18 and O15 remain open.**
- New **P19 (PROPOSED):** first art-production/visual validation target is existing O1 Old Road, 480×440 sim units, sword/shield adventurer, Mireling and Ashen Sentry shown in individual then overlap tests; no combat mechanics changes. See `29`.
- **O29 RESOLVED by L22 (2026-10-23):** final sprite authoring workflow **C hybrid** now selected; the preceding alternatives are history. Pipeline selection does not itself lock overall art direction.
- New review files: `29A` asset manifest (all rows proposed/not created); `29B` QA matrix (all unrun); `29C` concise artist/Phaser handoff. No actual sprite production, Phaser code, runtime QA, or creator visual approval is claimed.
- Scope gate: keep expensive Watchtower/Crypt/boss/secret-boss art beyond P0 until silhouette/ground/telegraph/readability evidence is reviewed.

## Workshop 22 — Hybrid Blender character sprite authoring (2026-10-23)
- Creator **explicitly LOCKED L22: Option C** — Blender-authored character models/rigs/animations rendered to 2D sprites, with hand-painted 2D environments and effects. This resolves O29; no other prior locks are changed.
- **P18 / O15 remain OPEN:** the working *Ashen Reliquary* aesthetic, title, palette and mood are still candidate directions until explicit approval from test art. New documents: `30` (complete pipeline contract), `30A` (production clip/budget manifest), `30B` (unrun render QA).
- **O30 (RESOLVED by L23):** Blender character-sprite projection is a fixed orthographic camera approximately +75° above horizontal, not directly overhead or isometric. Capture production-frame calibration evidence; do not reopen camera choice without creator request.
- **O31 (RESOLVED by L24):** eight-way locomotion/guard and selective per-attack facings are now locked. Only the exact per-attack view lists, clip cadence, trimmed atlas budget and target-device performance remain open.
- Retain **L01** 2D world, **L04** one sword/shield starter kit, **L11** separately owned tactical combat AI, route/retreat restrictions, Gate Keys and boss-entry commitment. Art cannot change simulation tick/hit times.
- No artwork, runtime code or QA evidence has been created by this documentation revision; `30A`/`30B` mark items proposed/not run.

## Workshop 23 — Locked fixed orthographic camera (2026-10-23)
- **NEW L23 (LOCKED):** Option B character rendering camera, orthographic **approximately 75° above horizontal** (+15° deviation from overhead), fixed relative to the game-world compass. Blender models rotate under this stationary render camera; the runtime game remains top-down 2D in Phaser presentation. **O30 RESOLVED**; earlier Option A/B comparisons remain history/diagnostics only.
- Existing **L22** Blender rigs to 2D sprites, hand-painted environments/VFX and **L04** starter sword/shield remain unchanged. No game-engine, combat AI, 3D-navigation or world-geometry conversion is implied.
- Detailed spec: `31_LOCKED_75DEG_CAMERA_AND_CHARACTER_SPRITE_STANDARDS.md`; production evidence checklists: `31A` and `31B`. Camera parameters, model yaw direction mapping, grounded sprite pivots and sim-owned hit geometry must be verified rather than assumed to work.
- **O31 superseded by L24:** final category model is eight-way locomotion/guard with selective attack views. Clip rate, per-attack view counts, atlas/frame budget and target hardware remain OPEN. **O15 / P18 remain OPEN:** candidate *Ashen Reliquary* visual style not yet formally approved. Camera azimuth, rig proportions, render resolution, material recipes and performance targets are **PROPOSED/OPEN**.
- Proposed next production choice: A four-way, B full eight-way, or C selective eight-way clip strategy after actual +75° silhouette proof. No gameplay code or finished character meshes/sprites created by this workshop.

## Workshop 24 — Selective eight-direction sprite authoring lock (2026-10-23)
- **NEW LOCK L24:** creator selected option **C**, **eight directions for movement and guard** with **attack clip directions selected per move**. This resolves the A/B/C workflow choice O31. Do not mislabel this as a universal four-way attack requirement; attacks may require 4, 6, 8 or tailored angle coverage according to QA.
- Preserve **L22** Blender models/rigs to 2D sprites, **L23** locked 75° orthographic camera, L04 sword and shield, and the original combat simulation's 30Hz timing, collision and hit/defense logic.
- Missing attack views must have visually honest direction, stance, handedness and telegraphs at the actual facing. A cosmetic fallback is acceptable only after documented view-by-view tests; it cannot change actual attack heading or tracking cutoff.
- Source of truth: new `32_SELECTIVE_EIGHT_DIRECTION_ANIMATION_STANDARD.md` plus `32A_DIRECTIONAL_CLIP_MATRIX.csv`; update existing docs `30`, `31`, `28`, `29`, artist handoff and the validation matrix.
- **Still PROPOSED/OPEN:** per-attack directional counts, animation frame counts, atlas resolution/bytes, facing threshold quantization, fixed azimuth and finished *Ashen Reliquary* visual look P18/O15. No new gameplay code or finished sprite assets are claimed.
