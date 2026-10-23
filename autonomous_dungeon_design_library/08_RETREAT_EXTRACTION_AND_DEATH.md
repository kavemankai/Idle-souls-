# 08 — Retreat, Extraction, Death and Recovery
**Owner:** Risk and loss loop  
**Status:** Camp-only extraction and absolute avoidance LOCKED; cache limit and exact loss categories PROPOSED

## Core rule
Camp is the only banking destination in the prototype. **Pressing Retreat orders a physical trip home; it is not extraction.** The adventurer may still take damage, become blocked, escape or die. Sanctuaries do not bank anything. The player must understand how far they are from safety and what is currently at risk.

## Retreat execution phases
1. **Disengage:** tactical objective switches to breaking hostile contact; combat AI owns timing, guard/evasion and movement safety; remaining necessary combat is permitted.
2. **Withdraw:** navigator routes out of hostile territory using known **permitted** pathways and preferred risk profile; pursuers obey regional chase limits. **An excluded region is never an emergency escape route without explicit player edit.**
3. **Travel home:** adventurer follows selected viable route, avoids optional encounters, handles new threats under survival policies.
4. **Bank:** only upon physically reaching camp alive. No bank on map load, checkpoint, pause or boss kill.

An explicit retreat order overrides previous quest priorities and any optional loot policy. It should not be secretly cancelled by an aggressive doctrine. It may become temporarily unexecutable if trapped or interrupted; report why.

## Automatic retreat triggers
PROPOSED thresholds: health <= chosen percentage; healing reserves below a chosen amount; major blocked path/route viability risk. The game should not decide retreat solely from an omniscient forecast. Keep player-visible assessment qualitative: favourable, hazardous, poor, or unknown. Unseen encounters are not included as certain facts.

## Asset state at any moment
| Asset | While carried | On successful camp return | On death |
|---|---|---|---|
| Gold earned during expedition | At risk | Banked | Added to death cache |
| Found ordinary equipment | At risk | Stored/available by game inventory rules | Added to death cache |
| Found supplies/materials | At risk | Banked if eligible | Added to death cache |
| Recoverable mastery XP | At risk (PROPOSED) | Banked progression | Added to death cache |
| Temporary combat levels/skills | Current-run only | Reset after run | Reset after run |
| Starter sword/shield | Guaranteed baseline | Always available | Never permanently lost |
| Mapped terrain/shortcuts/boss clear | Permanent on discovery/action | Remain | Remain |

Specific categories of consumables and equipment slots are OPEN; players must be told precisely what can be lost before launch.

## Death event
On death: stop live expedition; capture cause and critical timeline; retain permanent world changes; create or update recoverable cache at a sensible navigable death-associated location; end temporary combat progression; return player to camp planning with guaranteed starter kit. No pay-to-revive or paid loss reversal.

## Recovery cache (PROPOSED one-cache model)
There is at most one outstanding cache. A new death **before retrieving** the prior cache replaces the previous cache, clearly warned at launch/recovery decision. If player picks up old cache and later dies, its contents join the newly dropped carried inventory; it is not duplicated. Recovery is complete at pick-up but the resources remain vulnerable until physical camp extraction.

Death inside a boss arena: permit placement near a plausible entrance/edge if required for fair retrieval, but do not grant automatic recovery. Cache should never be inside invalid geometry, through an unopenable door or in unrecoverable void.

## Edge cases
- **Death and boss kill same moment:** order permanent boss state resolution and drop classification explicitly; boss clear should not be lost because of carrier death.
- **Disconnect during expedition:** save/resume safely; don't silently count as death or bank carried loot.
- **Retreat at zero stamina:** intent changes immediately, but physical separation may fail.
- **Already at camp on retreat:** complete extraction once; prevent duplicate banking.
- **No permitted route home:** report blocked, including any relevant absolute exclusion; seek only legal alternatives, do not teleport, silently remove bans or loop eternally. If none exists, extraction can fail and death can occur.
- **Death with zero loot:** cache may be absent or informational only; design must avoid meaningless ghost markers.

## Risk design
Make conservative expeditions viable but not infinitely lucrative. Reward rarer routes, unique discoveries and dangerous objectives, rather than punishing players with arbitrary retreat ambushes. The most interesting failure should be “I pushed too deep” or “I underestimated the return route,” not “the game spawned an impossible enemy at the exit.”

## Required player feedback
Show current carried value, risk status, estimated known route burden (not false exact win probability), currently pursued status, auto-retreat thresholds, and explicit “banked only at camp” reminder. Post-run report separates permanent gains, secured rewards, lost/recovered assets and casualties.

## Acceptance tests
Call retreat while fighting; character stops optional aggression and attempts survival without becoming invulnerable. Successfully leaving enemy territory permits return. Sanctuary rest does not bank. Boss defeat followed by death keeps boss cleared and exposes cache. Successful cache retrieval followed by safe return secures assets once, never twice.

## Workshop 09 — Expedition risk management contract (detailed proposal)
The player sets **risk tolerance through simple observable guardrails**, not an undisclosed numerical success percentage. Risk has four distinct dimensions: *combat condition* (health, stamina, consumables), *travel exposure* (remaining known path length and confirmed hazards), *information uncertainty* (unmapped/last-known threats) and *value at stake* (carried assets and existing recovery cache). Do not merge these into a fake precise `67% chance of survival` meter.

### Proposed exposed controls
| Control | Proposed simple setting | Primary meaning |
|---|---|---|
| Retreat at HP | Named conservative/balanced/bold presets with optional percentage adjustment | Attempt withdrawal when health falls to threshold |
| Healing reserve | Retreat when down to the last item / exhausted | Avoid consuming all supplies before the return journey |
| Return route policy | Safest known / shortest known | Affects physical route home but cannot overcome pursuit by teleportation |
| Region avoidance | Player marks selected known regions as excluded | Constrains outward discretionary route; does not grant hazard immunity |
| Exploration style | Safe / Thorough / Direct | Controls optional detours and patrol avoidance; does not defeat survival rule |

**DO NOT add a complex numeric risk budget to the first prototype without testing.** A small `Return condition` summary is preferable to sliders for enemy strength, loot worth, darkness and alertness. Risk assessment must be visibly sourced from observed/known facts.

### Prelaunch warnings (PROPOSED)
- `Known return path crosses hostile territory` when route planner knows the exposure.
- `Frontier unknown beyond Watchtower` when no reliable preview exists.
- `This plan conflicts with avoided region` when a mandatory waypoint requires forbidden travel; block launch until edited.
- `Existing recovery cache could be replaced by a future death` only if one-cache replacement is approved.
- `Boss victory does not automatically extract rewards` when boss challenge is primary objective.

### Automatic retreat trigger semantics
When configured HP/healing threshold is met, strategic intent changes to withdrawal **before optional objective advancement**. The player can press Retreat anytime with equal or higher authority. If an adversary has contact, combat AI handles disengagement; expedition navigator attempts home only where physically viable. It may need to find an alternate known path after a hazard appears. If known paths are blocked, communicate `Retreat path blocked`, make reasonable survival choices and try a safe alternate; never silently mark resources banked. Whether and how a player can override a triggered survival policy at a safe point is OPEN.

### Risk/reward literacy
Show `carried and at risk`, banked resources, recoverable cache status and unknown hazards separately. The player should be able to compare two legitimate approaches qualitatively: e.g. `shorter but guarded` against `longer and fewer confirmed threats`. Do not guarantee safety based only on a quiet last expedition, because living-world patrol positions change.

### Canonical test
The player uses a waypoint to approach a frontier while avoiding a known defended region. During play, the region's patrol pattern changes and a previously passable corridor is threatened. The adventurer reroutes within the selected policy, retreats when healing reserve triggers, and returns using a newly opened permanent shortcut. Successful camp entry banks resources once; losing pursuit or resting at sanctuary never banks anything. On death, mapped terrain persists and carried reward handling follows the current death-cache proposal.

## Workshop 10 — Retreat cannot override absolute avoidance
**Creator LOCK L13:** `Retreat` is a command to *attempt* camp extraction subject to every current avoidance ban. **It never implies consent to enter a forbidden region**, even with low HP, no healing, pursuit or all known exit routes blocked. Safest/shortest preferences apply only among **permitted** routes. A triggered automatic retreat has exactly the same constraints.

**Proposed fallback protocol:** (1) attempt tactical disengagement; (2) search known permitted homebound route; (3) if none, issue `RETREAT BLOCKED — excluded region / no passable route` with explanation; (4) seek permitted safe hold or alternative route if possible; (5) accept continued danger while awaiting an explicit player change, rather than generating free immunity, teleportation, auto-banking or a secret exception. **Waiting in a dangerous area is not guaranteed safe.**

Risk UX should warn before departure when avoidance leaves a precarious or unverified path home. On death, the normal loss/cache and permanent world-discovery rules remain unchanged. The postrun Chronicle should identify a refusal to enter an excluded region as a contributing cause when relevant; do not blame combat AI for following a locked player constraint.

**Important distinction:** `Cannot presently extract` is not a terminal death event; it is a live blocked-return state. Only actual camp entry can bank; only actual death closes a run with loss. The player may regain a legal route through world change or through a separately authorised edit to the exclusion when editing is allowed.

## Workshop 11 — Priority of return versus ordinary task skip (LOCK L14)
- Ordinary objectives that cannot be completed via permitted alternatives receive `Skipped — Blocked`; the adventurer continues *subsequent ordered objectives*. The system must not invoke automatic Retreat **merely because an objective is blocked**.
- Manual Retreat and preconfigured survival thresholds override all still-pending objectives. They suspend the queue and initiate an attempted physical return; skipping remaining tasks does not run in parallel with retreat.
- Completion or skipping of the final ordinary task triggers the terminal Return-to-Camp attempt. **Return is non-skippable.** If forbidden territory or real obstructions prevent extraction, show `Extraction blocked — no permitted route home`; do not mark `Expedition completed` or bank carried XP/gold/gear.
- An objective can be skipped and the eventual expedition can still successfully extract. Chronicle should show `Extracted, 2 of 4 objectives completed, 2 blocked` rather than falsely claiming full mission success.
- A recovery-cache objective may be skipped only because the cache truly no longer exists or is currently inaccessible by permitted paths, **not** because the adventurer sees optional loot. If the player dies during later objectives, the normal proposed cache handling applies.

## Workshop 12 — Key and gate loss invariants (PROPOSED economic specifics)
First-use key-sealed gate does not extract or bank. Keys carried on expeditions are at risk until camp unless a future explicitly approved key rule says otherwise. **LOCKED L19:** a newly discovered key must be physically secured at camp, then brought on a later expedition before it may be used at a gate. If death occurs before spending, eligible carried key joins normal recoverable death cache. If valid permanent gate-unlock consumes a key, the key is spent and never duplicated in a cache; gate remains open even if adventurer subsequently dies. Boss first-clear and carried rewards remain separate from opening. Full rulebook: `21`. Unanswered safe-gate decisions cannot consume resources.

## Workshop 14 — Risk and key replenishment after death (L18 source model)
A universal Gate Key earned from an authored discovery or repeatable trial remains an at-risk reward until the player's **actual camp extraction**, under the current PROPOSED carried-key lifecycle. A sanctuary cannot secure it (L06). If death occurs before camp, an **unspent** key follows the one-cache death recovery proposal; a second death could replace the cache. The authoring system must nevertheless keep a **challenging repeatable universal-key source accessible on an eligible new expedition**, so recovery is a strategic option rather than the only path to avoiding a permanent campaign block. A lost key does not silently regenerate as banked currency.

The gate-spend event is different: a key deliberately consumed to permanently open a fog gate is no longer carried and never appears in a death cache. The open gate persists after the adventurer dies. First-use requires previous camp extraction and bank (LOCKED L19; former P14/O21 resolved). Regardless of unresolved carrying and death-cache choices: **no sanctuary bank, no free teleport, no automatic extraction, and no override of absolute avoidance**.

The Chronicle should separate `Key claimed`, `Key banked`, `Key dropped`, `Key recovered`, `Key spent opening gate`, and `Repeatable trial completed`. A trial key must not be duplicated if the adventurer dies after claiming but before extraction, or after recovering a previous cache.

## Workshop 15 — Key banking, death and recovery (L19)
- **Fresh key found/earned:** unbanked, ineligible for gate unlock, carried at risk. Only a successful **physical extraction to camp** changes it into banked key stock. Neither sanctuary nor boss victory banks it.
- **Fresh key dies before banking:** under the existing one-cache death rule PROPOSAL P02, it enters the recoverable cache; picking it up **does not count as camp banking**, and it still cannot unlock a gate until an eventual successful extraction.
- **Banked key left at camp:** unaffected by the death of an expedition that did not carry it.
- **Previously banked key issued on departure:** eligible to open a gate while carried on a later expedition, subject to explicit consent and cost. If it is unspent when the adventurer dies, it follows the same proposed recoverable-cache rule; its previously banked eligibility is a provenance attribute, not a free automatic bank refund.
- **Key legitimately spent:** permanently removed from carried stock, matched atomically to the corresponding gate unlock; never duplicated in a death cache or refunded on a failed boss.
- **No route home:** absolute exclusion L13 still wins and the key remains at risk; L19 cannot justify bypassing a forbidden area.
The exact cache replacement severity, key carrying capacity and allocation mechanics remain PROPOSED/OPEN. For full state design see `23`.

## Workshop 16 — Keyring exposure during loss and retreat (L20)
At camp, **prepared 0–2 universal Gate Keys** are removed from bank safety only when deliberately issued. A key left at camp is not in the adventurer's death risk. A key already spent at a fog gate is permanently consumed and never enters the death cache; the permanent gate unlock survives death. Unspent prepared keys remain carried at risk, including during retreat and while at a sanctuary. Fresh keys found on the same expedition are still unbanked, cannot backfill emptied prepared slots, and must return physically to camp to become eligible on a *later* expedition.

**PROPOSED (not locked):** on death, prepared unspent keys and fresh key loot enter the same recoverable cache under O05. If two already-prepared slots are occupied when a previously banked key is recovered, treat it as non-equipped cargo until camp rather than enabling a third simultaneous gate-spend slot; O06 determines cargo limits. All keys retain provenance; no automatic refunds, duplicates or remote banking. See `24`.
