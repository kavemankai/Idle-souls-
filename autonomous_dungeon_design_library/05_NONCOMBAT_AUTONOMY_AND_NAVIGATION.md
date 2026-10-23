# 05 — Noncombat Autonomy and Navigation
**Owner:** Expedition execution (not combat AI)  
**Status:** Delegated movement/navigation LOCKED concept; algorithms PROPOSED

## Scope boundary
This subsystem chooses *where the adventurer should attempt to go next*, which interactable to examine, and whether to proceed, detour, defer or request a player decision. The separate combat-AI workstream owns block, strike, evade, spacing, stamina tactics and enemy fighting intelligence. This file must not reimplement combat.

## Navigation loop (design, not code)
From current objective and known map, select a reachable route satisfying the return/safety preference; progress through rooms and corridors; observe nearby accessible opportunities; react to route changes; complete, skip or escalate tasks; maintain safe path home when possible. Character may locally move around obstacles and enemies without demanding micromanagement.

## Safe vs shortest route
**Shortest** minimises known travel burden; **safest** considers known enemy territories, recent patrol observations, hazardous regions and current health/supplies. Neither is omniscient: unknown patrols and fog-of-war threats remain uncertainty. The player should see the selected route and simple reasons (“avoids guarded corridor”, “uses opened shortcut”).

## Exploration behaviour
- **Safe:** tolerates detours to known safer corridors, observes patrol windows, avoids optional protected loot.
- **Thorough:** systematically covers accessible side branches in selected survey area and attempts ordinary looting within capacity.
- **Direct:** minimizes optional diversion and returns to objective after ordinary encounters.

Set bounded investigation per room/area to prevent infinite oscillation or circling. When a locale has no further reachable unvisited branches, mark objective finished or report blocked. A detour cannot cause an infinite loop around a discovered shortcut.

## Object interactions
Minor loot: auto-acquire if allowed and within inventory policy. Major discoveries: communicate outcome and offer player choice only when safe. Gates: attempt only if mission allows and prerequisites observed; failed interaction should record reason. Sanctuary: choose resting/upgrade interaction if eligible; cannot bank anything. Recovery cache: physical pick-up changes its state from ground to carried; must return to camp to secure contents.

## Threat avoidance without stealth minigame
The navigator can consider visible patrol positions, cover and timing; this is a simple path/timing preference, not a stealth character class. Disengagement request is sent to combat AI for tactical execution; navigator supplies a retreat target/path. It must never assume that crossing an arbitrary geometric line instantly negates a current hit.

## Path blocked or uncertain
Obstacle types: permanently locked, discoverably unlockable, temporarily hazardous, temporarily occupied by enemies, and genuinely unknown. These must not be conflated. **LOCKED L14:** on a conclusively impossible *ordinary* objective, try distinct legal alternatives, then mark `Skipped — Blocked` and continue the next permissible ordered task. Do not auto-return solely because an ordinary goal is blocked. Active Retreat still takes priority. No stuck walking animation or feedback-free looping.

## Tempo and observation
Known safe traversals may be speeded up visually; danger detection, ongoing combat and player decision prompts return to normal cadence. If simulation speed is increased, mechanical outcomes remain fair and deterministic within the same encounter state. No instant travel in the first prototype.

## Triage priorities
1. Emergency escape/path viability if a retreat is active.
2. Complete current authorized objective.
3. Follow selected exploratory preference.
4. Optional opportunities if time/supply/risk limits allow.

## Acceptance cases
- Can find home by a newly opened shortcut.
- Does not repeatedly enter a known sealed passage.
- Recovery objective is not displaced by shiny optional treasure.
- When no route exists, reports the blockage and selects safe fallback.
- Persists objective and selected route on save/resume without duplicating rewards.
- Does not override combat AI during an active engagement; handles transition back to navigation after safety is established.

## Workshop 09 — Planner-to-navigator contract (LOCKED model, PROPOSED arbitration)
A hybrid planner supplies **an ordered destination list plus optional constraints**, not a pixel-level movement path. The navigator resolves the best presently legal route between confirmed map nodes, then local traversal. Within fog it only receives a frontier-exploration task with explicit stopping bounds, not hidden geometry knowledge.

### Constraints and transparency
1. Every required waypoint must be visited in order unless a higher-priority survival/Retreat order takes precedence or it becomes physically impossible.
2. **LOCKED L13:** Forbidden regions/connections are not intentionally traversed for **any reason**, including emergency withdrawal. The planner reports `constraint conflict` or `no permitted route home` when necessary. There is no automatic emergency override; only an explicit player edit may remove an exclusion.
3. Safest-known route can consider confirmed territorial hazards, recent observations, supplies and known travel burden; it cannot query unobserved enemy placement for a risk score.
4. Route recalculation does not silently insert new player goals, suppress a recovery objective or erase the camp-return end condition.
5. A temporary obstruction triggers bounded reassessment and a legal alternate if available; if definitive blockage remains, **L14** skips the ordinary objective and evaluates the next queued task. Optional safe decision UI cannot replace this unattended fallback. Never endlessly walk at the same obstacle.
6. Newly activated permanent shortcut may improve subsequent routing immediately; its availability survives death and reload.
7. During active combat, only high-level intent changes; tactical motion is under the separate combat workstream. Navigator assumes control only at safe handoff.

### Edge validation scenarios
A player marks the Watchtower avoid and selects an objective only reachable through it: preflight conflict, no spurious launch. They remove avoid: route displays and becomes eligible. An unknown frontier lies beyond a confirmed junction: route preview stops at junction, survey objective handles further discovery. During an expedition, a new shortcut opens: return path is recomputed using the new link. Under pursuit, player Retreat is received immediately but physical escape still follows combat and regional pursuit rules. A cleared pursuer returns to normal after its short search, per locked alert Option A.

## Workshop 10 — Navigation inside absolute exclusions (LOCKED)
- The usable route network consists solely of presently traversable, permitted connections. A route may be shortest or safest **only after** that eligibility condition has been satisfied.
- Local obstacle avoidance, opportunistic scouting, pursuit escape and combat-to-navigation handoff must not produce a route segment that crosses a banned boundary. Threats cannot be used as justification to relax avoidance.
- Recompute when objective, opened shortcut, observed obstruction, player-edited avoidance or real position changes. No unbounded repeated recalculation of an identical blocked state.
- If the character can reach camp only through avoided territory, it **cannot extract** under current orders. Report this explicitly. Choosing a nearer permitted safe position is a *proposed* holding behaviour, not a guaranteed sanctuary or bank.
- An exclusion edited while the character stands inside that region is a contradiction. **Proposed UI guard:** reject activation with `You are currently inside the excluded area; leave it first` rather than manufacturing a forced move. No hidden forced relocation.
- Separate `Unknown beyond frontier` from `Known but forbidden`: exploration cannot explore through a specifically banned region even when its interior is fogged. A new shortcut inside the avoided region does not become a legal route merely by being revealed.

## Workshop 11 — Deterministic ordinary-objective continuation (LOCK L14)
- Receive the ordered task list, actual current position, legal geography, avoidance set, retreat state and task-specific completion evidence. Treat skipped tasks as immutable historical records unless an explicit player edit re-adds one.
- If a goal cannot be reached/achieved using any currently known, permitted alternative after bounded evaluation, report `Skipped — Blocked` with observed reason and select the next queued task. Recompute routing **from real position**, not the destination of the skipped task.
- For each subsequent task, evaluate route and prerequisites independently. A missing prerequisite can cause a chain of explicitly recorded skips, but it must never reorder tasks or enable a route that violates hard avoidance.
- `Known forbidden`, `Unmapped`, `Temporarily contested`, and `Truly inaccessible` remain separate; only confirmed inaccessibility with exhausted legal alternatives merits an immediate skip. Encounter threat alone is not impossible navigation.
- A manual Retreat or standing survival trigger interrupts the task loop; the navigator attempts Return to Camp only on legal paths. Return cannot be skipped. If no legal path home, report `Extraction blocked` and request survival/navigation support without magical rescue.
- Search, combat and major discoveries remain under existing responsibilities. This change specifies *which objective is next*, not how tactical combat AI attacks, evades or disengages.

## Workshop 12 — Discovery interruptions and encounter boundary (LOCKED principles)
Ordinary major-location **discovery** can be recorded without stopping travel, using standing defaults. When player attention is warranted, raise a non-blocking prompt only at a safe point; rare secure upgrade choices may pause. A key-sealed encounter fog gate is **impassable topology** until unlocked; a carried key alone never opens it. No automatic walk-through or pathfinder shortcut into an arena. Encounter gate unlock and boss-entry permission are separate validated world decisions (see `21`). Preserve L13 absolute avoidance; a forbidden path remains forbidden despite key or retreat. Preserve L14 skip-and-continue for genuinely blocked ordinary objectives.

## Workshop 15 — Key provenance and navigation boundaries (L19)
Navigation treats fog-gate first unlock as an **authorised interaction**, not a movement step. It must distinguish `fresh field key` from `previously banked and currently carried key`. A fresh key may be collected, carried, recovered and extracted, but **cannot** change a sealed gate into a traversable link in that same expedition. The planner never searches for a path by pretending to spend ineligible keys. If the gate is required for an ordinary task and no valid alternative exists, L14 skip-and-continue applies. Secure key banking is performed only upon genuine camp extraction; there is no shortcut through sanctuary rest or a world-map interaction. No combat-navigation rule can silently lift L13 absolute exclusions.
