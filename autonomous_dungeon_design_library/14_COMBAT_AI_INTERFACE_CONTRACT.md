# 14 — Combat AI Integration Contract (Design Only)
**Owner:** Cross-workstream interface; microcombat owned by separate combat AI session  
**Status:** Ownership boundary LOCKED; exact inputs/outputs need joint validation

## Purpose
This document protects the game from conflicting independently designed systems. It does **not** specify combat decision algorithms, animation timings, attack state machines, dodge windows, damage formulas or code. Another session is developing combat AI. That session remains authoritative over tactical movement and attack/defence decision-making.

## Workstream responsibilities
| Expedition/world workstream | Combat AI workstream |
|---|---|
| Defines objectives, target destinations and survival priorities | Chooses tactical attacks, blocks, evades, approach and spacing |
| Maintains persistent map, territory, encounter roster and run state | Resolves combat decisions under rules of chosen doctrine |
| Requests retreat/disengagement and supplies viable exits | Executes tactical disengagement, may fail honestly |
| Provides observed enemy/context information | Evaluates incoming threats at moment-to-moment scale |
| Records resources, XP, boss world state and Chronicle | Reports results, combat resource use and key causes |
| Determines when a safe navigation decision can occur | Reports whether it is safe to suspend tactical execution |

## Expeditions send **intent**, not microcommands
- Combat doctrine: Guarded / Measured / Pressing.
- Strategic engagement status: pursue planned objective, fight required blocking foe, avoid optional encounter or attempt disengagement.
- Available tactical context: current enemy contacts, accessible local movement geometry, current equipment, health/consumables, intended retreat corridor.
- Constraints: do not override active emergency retreat for optional loot; no combat bonuses from unapproved monetization; observe territory/boss rules.

## Combat AI reports **outcomes and constraints**
- Entered/left combat; engaged threats; successful or failed disengagement.
- Character status: health, stamina/guard status, healing use, equipment consumption.
- Threat observation events: newly seen foes and last-known positions (integrated with fog rules).
- Defeated enemies, death and boss victory signals.
- Explanation tags adequate for post-run log: guard broken, cornered, resource exhausted, outnumbered, target lost, withdrawal blocked.

## Arbitration and handoff
If player presses Retreat during combat, expedition control changes the strategic goal immediately; combat AI attempts to exit danger at next legal tactical opportunity. Navigator picks a viable route only once/while the AI can traverse it; combat AI may indicate “cannot currently disengage”. Upon contact loss and a stable safe window, control transitions to noncombat navigation. Do not double-drive movement or let navigation forcibly override a committed combat animation.

## Enemy awareness ownership
World/encounter system owns enemy territories and whether pursuit/search/reset states may occur. Tactical AI owns how an alerted enemy attacks or reacts to threats. Last-seen memory rules and quick-alert-reset lock remain the same irrespective of combat tactics. Bosses cannot leave arena through pursuit logic.

## Doctrine semantics to align
Guarded = conservative stamina and defensive commitments; Measured = balanced; Pressing = higher offensive commitment. These are **behavior interpretations**, not mandatory numeric modifiers. Both sessions must use the same names and explain the resulting differences to the player.

## State and event invariants
A defeated ordinary enemy cannot generate repeated XP/gold in one expedition. A defeated first-world boss emits permanent-clear only once. Death during an exit transition does not silently bank carried resources. Combat session cannot teleport avatar to safety for a retreat. A rematch fight cannot overwrite original boss-clear world state. Sanctuary is never an in-combat heal zone.

## Integration acceptance scenarios
1. Player orders retreat during incoming enemy pressure; combat AI works to break contact, navigator waits for safe path, enemies pursue locally, then return to normal on lost-contact search failure.
2. Combat AI defeats boss; world records permanent alteration immediately; avatar later dies; main-world boss remains dead, carried rewards recoverable only through cache rules.
3. Character enters sanctuary after successful disengagement; combat ends; sanctuary offers its normal one-time recovery and rare choice without banking.
4. One event appears once in Chronicle and resource ledger; no duplicate reward from both subsystems.
5. No mid-swing player doctrine exploitation unless future workshop explicitly changes that rule.

## Questions for combat AI session
What combat states can safely accept a retreat request? How does the AI signal unable-to-disengage vs unwilling-to-disengage? What minimum telegraph/feedback is available for explaining failures? Can 3 doctrine behaviors be made perceptibly distinct with the one kit? What does a boss-engagement reset technically mean for its tactical state? These are interface questions, not assumptions about its current implementation.

## Workshop 09 — Additional planner-to-combat event requirements (design only)
The **LOCKED hybrid planning model** supplies an intended waypoint sequence, avoid-region constraints, safe/short return preference and an emergency withdrawal target. Tactical fighting decisions remain the combat session's responsibility. Planning does not drive combat movement with tile-level commands.

**Planner requests:** `continue objective`, `avoid optional contact`, `attempt disengagement toward viable corridor`, `do not pursue departing threat`, `retreat priority active`. **Combat outputs:** `engagement active`, `safe for major field edit`, `contact lost but enemy searching`, `disengagement feasible or blocked`, `last observed enemy position`, `character condition changed`. These are semantic event labels for coordination, not a proposed technical API.

**Avoidance nuance — updated by LOCK L13:** A banned region is a hard movement boundary for **intentional** tactical and noncombat travel, including emergency retreat. The adventurer must still defend against nearby enemies, but the combat AI must not intentionally dodge, chase or disengage **through forbidden territory**. Retreat cannot bypass the ban; if all legal escape vectors fail, `cannot disengage via permitted route` is a valid outcome, including possible death. Do not invent a permitted escape. Forced displacement/knockback across boundaries needs explicit joint design resolution, not a hidden exemption. Enemy reset remains quick after the short search (L10), never a persistent regional alarm.

## Workshop 10 — Separation-of-concerns note for the parallel combat session
**Hard external requirement (creator L13):** The expedition layer must provide the combat layer with forbidden-boundary information relevant to any attempted tactical withdrawal/repositioning. The combat layer owns *how* it fights, blocks and disengages, but must not route **intentional** movement through a forbidden region when calculating a safe action. Report `no legal disengage corridor` rather than stepping across the boundary.

This document makes **no decisions about attack timing, dodge algorithms, stamina thresholds or enemy tactics**. It only states the contract needed to protect a player order across subsystem ownership. Open integration edge case: forced knockback into a banned zone, crossing a boundary while an edit becomes active, or moving through forbidden region due to external control loss. These should be reconciled explicitly before implementation; none can be used to claim intentional passage is allowed.

## Workshop 11 — Task skip is expedition ownership (LOCK L14)
- The expedition command layer alone declares ordinary objectives `Completed`, `Skipped — Blocked` or `Suspended by Retreat`; tactical combat AI must not silently advance, remove or reorder strategic objectives.
- When the command layer skips a failed navigation/interact task, it sends the *next permitted high-level destination* to the movement/combat handoff; tactical control continues safely and is not interrupted mid-action to satisfy the next route.
- Active manual/survival Retreat supersedes the ordinary task queue. If all permitted physical escape vectors are obstructed, combat AI reports that condition; the expedition layer records `Extraction blocked` rather than falling through to the next outward task.
- Enemy difficulty, being attacked, losing stamina, or an unknown danger are **not sufficient evidence** that an objective is impossible; only confirmed target/route/prerequisite unavailability can drive L14 skip logic. Tactical feasibility reporting must not be mistaken for global mission authority.
- No change to locked regional pursuit, quick alert reset, fixed sword-and-shield prototype or absolute avoided-region boundary. The combat AI remains designed in a separate session.

## Workshop 12 — Encounter-entry boundary (LOCKED high-level authority)
The **world/expedition layer owns** sealed fog-gate detection, eligibility for first-time key spending, confirmed permanent gate opening, deliberate boss/miniboss engagement permission, and first-clear/rematch progression state. The **separate combat AI layer owns** tactical fight execution only after a valid `encounter committed` decision; it does not automatically start a major fight because the avatar nears a gate, nor does it spend keys or mark world gates open. A secure upgrade/gate decision is not permitted to grant a protective pause mid-combat or while regional pursuit is active. Combat layer reports whether staging is safe, engagement outcome and resource/death events. A sealed gate is nontraversable and L13 forbidden regions remain forbidden, even during tactical disengagement. See `21`.

## Workshop 15 — Gate-Key first-use eligibility boundary (L19)
The expedition/world controller, **not combat AI**, verifies that a key **has already been banked at camp on a prior expedition and is physically carried now** before allowing a deliberate sealed-gate unlock. Combat AI receives only validated arena-entry intent after the independent boss commitment. It must not mint, secure, convert or spend Gate Keys, and cannot grant entry because a newly acquired key appears in loot. Interruption, tactical fallback and death do not modify this boundary. Numerical combat tuning remains exclusively in the separate combat-AI session.

## Workshop 18 — Enemy briefs for parallel combat session
Use `25_VERTICAL_SLICE_ENEMY_BOSS_ROSTER_AND_LEVEL_CURVE.md` as the **proposed creative/tuning brief**: role/size/speed/ranged flags, 3 moves per ordinary enemy, 4 telegraphed moves plus gimmick for Bell Warden/ Castellan/Surveyor, static level bands and viable counterplay. The combat session remains free to recommend changes to moves, HP, stamina, windups and hitboxes based on actual tests. Required external invariants: locked gate access/one-key spending and separate fight consent, arena confinement, boss persistence/rematch, honest hazards, forbidden region boundary and expedition retreat requests. Do not imply tactical code or AI is already implemented.


## Workshop 19 — current combat bench bridge (PROPOSED)
Existing model 30Hz, arena radius230, player radius13, dodge distance92; `combat-sim.js` and `combat-bench.html` should be kept aligned. World interface must provide solid-cover projectile collision, terrain-hazard avoidance, legal movement masks including ABSOLUTE route exclusions, zone pursuit boundaries, objective-state handoff, confirmed boss-entry consent, and cumulative HP/XP state between encounters. See archive root `CLAUDE_CODE_COMBAT_AND_WORLD_HANDOFF.md` and `26_MAP_LAYOUT_AND_ENCOUNTER_ZONES.md`. Do not rewrite separate-session combat AI architecture by assumption.
