# 04 — Expedition Planning and Player Orders
**Owner:** Expedition-command design  
**Status:** Limited field orders, hybrid routing, absolute avoidance, blocked-task skipping and unattended standing defaults LOCKED; exact UI/risk numbers/rare-choice mechanics PROPOSED

## Player agency contract
Player is an expedition commander. The player defines *what* to achieve, *where* to attempt it and *how much risk* is acceptable. Adventurer handles local navigation and moment-to-moment combat. Field orders are limited to material decisions; no direct movement joystick, attack button or spammed mid-fight doctrine switches.

## Pre-departure plan
A launch-ready expedition consists of:
1. **Purpose:** explore, gather, recover, boss attempt or custom.
2. **Ordered objectives:** reachable landmark / frontier / gate / treasure / cache / return. PROPOSED prototype cap: five tasks.
3. **Route preferences:** **LOCKED hybrid model**: system automatically connects known, legal paths between selected objectives; player may optionally designate waypoints and areas to avoid. Avoidance strength is **LOCKED ABSOLUTE**, including during emergency extraction; threat weights remain PROPOSED.
4. **Exploration preference:** Safe, Thorough or Direct.
5. **Combat doctrine:** Guarded, Measured or Pressing (behavior preference, not flat stat bonus).
6. **Survival policy:** health retreat threshold, healing-reserve trigger, and return-route priority.
7. **Starting kit:** prototype fixed sword + shield + basic armour, supplies as configured.

The interface provides presets but does not lock players into inflexible mission modes. It should display warnings where no known route exists or a requested objective is beyond presently verified access.

## Task semantics
- **Reach:** completes when a valid target interaction/zone is reached.
- **Survey/explore:** completes by scoped coverage/landmark discovery or when an explicit stop condition is reached; ambiguous “explore all” orders must have bounded search behavior.
- **Interact:** requires physical access and a valid interactable object; failure may produce an alternative/blocked state.
- **Recover:** succeeds when the cache is actually acquired; extraction is separate.
- **Defeat boss:** succeeds on first kill or selected rematch success; expedition may continue or retreat as standing policy directs.
- **Return:** attempts physically navigable route to camp; completion banks eligible rewards.

## Priority arbitration
Immediate survival responses operate tactically; above tactical autonomy, **player retreat order** and active survival-retreat policy override optional loot/combat/quest completion. Required combat for escape is allowed. The current mission's required interactions override ordinary curiosity, not critical defence. If the character cannot obey an order, show an explicit reason and fallback rather than silently choosing an unrelated goal.

## Field orders
- **Retreat to camp:** may be issued anytime. Takes effect at next legal decision/action transition; cannot confer invulnerability or cancel unavoidable contact.
- **Redirect destination:** allowed at safe junction, sanctuary or noncombat decision window; pending changes during combat queue until safe.
- **Investigate / skip:** offered only on major discovery and only when safe enough to decide.
- **Continue plan:** executes prior objectives without repeated prompts.
- **Change doctrine:** available at sanctuary or secure preparation state, not for every enemy windup.

No requirement to stay actively present for each minor encounter. If no user interaction occurs at a significant but nonessential event, follow a chosen default policy (e.g., stay on task), not a random choice. Whether to pause indefinitely at a mandatory decision is OPEN and platform-resume dependent.

## Standing-order examples
- Safe + Guarded + retreat at 40% health + retain last healing item: conservative exploration.
- Direct + Measured + shortest return: objective-oriented, riskier travel.
- Thorough + Guarded + recovery cache first: prioritise confirmed cache, avoid unrelated optional fights.

## Failure and obstacle handling
When an ordered destination becomes impossible under current known, permitted access, first attempt a genuinely distinct legal alternative. If none is available after bounded evaluation, **LOCKED L14: mark the objective `Skipped — Blocked`, record its reason, and proceed to the next permissible objective in original order**. An active manual/automatic retreat overrides this task loop. Never path through excluded terrain or invent a shortcut. A dangerous encounter alone is not proof a goal is impossible.

## State transitions to test
Preparing → Travelling → Combat/Investigation → Decision Opportunity → Travelling → Withdrawing → Camp/Death. A boss victory changes permanent world state but does **not** necessarily terminate the active expedition. All interruptions produce coherent resumable intent; retreat should not be overwritten by an old exploration task.

## Acceptance criteria
A tester can launch an expedition with fewer than ~6 meaningful choices via presets, override one significant junction, request retreat during combat, and explain which order the character is following at any time. Repeatedly watching must be optional during uneventful traversal.


---

## Workshop 08 — Route authoring and expedition execution (PROPOSED, not locked)
**Revision:** v0.2 working proposal. This section is a proposed UX contract awaiting creator approval; earlier locked game rules are unchanged.

### Recommendation: select objective nodes, let the adventurer connect them
The player should not be required to draw precise tile-by-tile paths. On the permanent world map, they choose an objective, optionally one or two intermediate waypoints, and a route preference. The adventurer chooses a currently navigable connection consistent with known geography and orders. A route preview distinguishes confirmed geography from unknown territory and never fabricates a path through fog.

### Initial planning experience
1. Show current banked resources, permanent map, last death-cache marker and one proposed mission card.
2. Offer a single prominent first objective (example: Survey Watchtower Frontier) and alternative mission intents: Explore, Gather, Recover, Boss, Custom. No obligation to select an entire sequence to start.
3. Tap a known landmark or frontier boundary. Select action: Reach, Survey, Interact, Recover, or Challenge. Contextual choices must be valid (a cache cannot be selected unless one exists).
4. Optionally insert waypoints to influence approach, but do not require a fully specified path.
5. The system appends Return to Camp as the **default end-state** unless the player selects a limited stop-and-request decision. Returning is still physical and can fail.
6. Surface doctrine, exploration style and survival defaults on one compact panel. Advanced details can be expanded.
7. Preview uncertainty with three phrases: known route, partly unmapped, blocked/no confirmed access. Do not use invented odds or omniscient enemy positions.
8. Launch after showing the unbanked-loss rule. A default prepared plan should take only a few deliberate actions.

### Sample ordered plan (illustrative)
- 1. Travel to Old Road junction (intermediate waypoint)
- 2. Survey Watchtower frontier (primary objective, bounded by one frontier zone or the next meaningful landmark)
- 3. Investigate first major route connection if safe (conditional major-discovery opportunity)
- 4. Return to Camp (default ending)

Do not count these labels as final objective-slot limits. The provisional cap remains five player-selected tasks, with Return to Camp automatically appended.

### Runtime states and exceptions
- **Transit:** Normal autonomous traversal on known terrain; optional fast display for uneventful segments.
- **Observed threat:** Character responds through the separate combat AI; route planner may propose an alternate approach but cannot override immediate combat decisions.
- **Decision opportunity:** Only when not actively threatened: meaningful new shortcut, sanctuary choice, consequential detour, blocked goal or boss doorway. Offer Continue / Investigate or Redirect / Return in context.
- **Withdrawal:** Player or policy orders physical retreat, now highest mission-level priority. The original task queue is suspended, not resumed automatically if withdrawal succeeds in breaking contact.
- **Skipped — Blocked (L14):** Only for a conclusively impossible ordinary objective after bounded legal alternatives. Log the observed reason, keep the skipped row, and continue the next permissible ordered task. A risky enemy or unmapped frontier alone is not conclusive blockage. Independent Retreat/survival orders override this continuation.
- **Extraction:** Complete only upon actually arriving at camp alive.
- **Death:** Save permanent discoveries; generate an at-risk recovery marker and a Chronicle record.

### Player-absent policy (PROPOSED)
Minor navigation and combat resolve automatically. At nonessential major discoveries, apply the predefined 'Stay on Mission' response if unattended; allow a user option to pause safely for meaningful decisions during supervised play. The default should never wait forever during imminent danger. The exact pause/resume and abandoned-session behaviour still requires platform validation.

### Time and friction budget
The first run should not require more than a primary objective, a launch action and a confirmation of the loss rule. After players gain competence, optional objective sequencing and field route redirection provide mastery. Present the tactical scene first during danger; keep long-form route authoring in camp and safe decision windows.

### Acceptance walkthrough
Player selects an unmapped frontier, sees a known route ending at its edge, launches with sword/shield and preset orders, discovers a shortcut, elects to follow it at a safe pause, suffers an enemy encounter without a planning modal, issues immediate retreat, survives a physical route home, and correctly identifies secured versus still-risked rewards. The combat AI owner is responsible for action-level disengagement; planner owns the destination and the high-level retreat intent.

## Workshop 09 — Hybrid planner specification
**Revision:** v0.3. **CREATOR LOCK:** Hybrid route planning (Option C): automatically selected route segments, optional player waypoints, optional areas/regions to avoid. **All numerical limits, interaction details and risk calculations below are proposals until approved.**

### A. Planning model: player intent, not drawn footsteps
Represent the planned expedition to the player as: **mission purpose → ordered objectives → optional approach constraints → survival orders → physical return**. The map automatically previews the currently usable connections between recognized nodes. Player-added waypoints shape the approach but do not require tracing corridors or every movement command.

Three scales of action must not be conflated:
1. **Region map:** geographical structure, hub, territory links, confirmed shortcuts and known frontiers; suitable for choosing objective order and bypasses.
2. **Local navigation:** the adventurer resolves doorways, corridors, obstacles and room movement while respecting strategic constraints; no player path painting required.
3. **Unknown frontier:** the route preview ends at the **last confirmed reachable node**. Past that node the adventurer receives an exploration instruction, not a fictitious calculated path.

### B. Precise preparation workflow (PROPOSED)
| Step | Input | Immediate interface feedback | Required for simple launch? |
|---|---|---|---|
| 1 | Pick a mission card (Explore, Gather, Recover, Boss, Custom) or select map target directly | A plan is pre-populated only with objectives available in current world state | Default Explore can be preselected |
| 2 | Select a **known point** (landmark/interaction) or **frontier edge** on the map | Contextual action sheet offers only valid actions: Reach, Survey, Open, Recover, Challenge | Yes: one primary target |
| 3 | Inspect auto-generated route | Solid route over reachable, confirmed links; preview ends at fog; locked edges remain visibly blocked | Automatic |
| 4 | Optionally insert/reorder waypoints | Preview recalculates; shows additional travel burden and known threat exposure, not invented survival odds | No |
| 5 | Optionally mark regions as avoid | Affected route dims; valid alternate is shown or a clear constraint-conflict warning appears | No |
| 6 | Inspect compact standing orders | Doctrine, exploration style, retreat HP, healing reserve, return-route preference; defaults shown rather than hidden | Default values suffice |
| 7 | Review launch summary and launch | Primary goal, route/unknown boundary, risks, bank-at-camp requirement, existing death cache warning | Yes: deliberate launch |

**Fast path:** Tap target → Launch, provided a viable planned approach exists. **Advanced path:** Configure approach and fallback before launching. The game should never make players re-select the starter sword/shield unless a future kit feature is explicitly added.

### C. Touch/mouse map interaction (PROPOSED)
- **Single tap/click on known landmark:** focus marker, show known access status and valid context actions; choosing an action adds it as an objective.
- **Tap known road/junction:** offer `Use as waypoint` if reachable; don't create a mandatory objective by accidental tap.
- **Long press/right-click on known region/link:** offer `Avoid region`, `Remove avoidance` or `Prefer approach` as context permits. For accessibility, provide identical actions in a menu; long press must not be the only method.
- **Tap a fog boundary:** `Explore from here`; do not expose or allow tap-targeting unseen room coordinates.
- **Tap objective chip in itinerary:** inspect, change target, reorder or remove; `Return to Camp` is a distinct, visible completion instruction.
- **Tap an alternative preview route:** only select if supported by presently known and traversable links; comparison uses disclosed known distance/danger labels.
- **Hover (desktop) or info action (touch):** explain preview labels such as `known guarded territory`, `last-seen patrol`, `unexplored beyond point`, and `access blocked`.

### D. Mandatory waypoint versus avoidance semantics (avoidance LOCKED; others PROPOSED)
- **Waypoint:** positive ordered commitment to pass through a *known traversable* location. It becomes an intermediate itinerary obligation; its priority is lower than an explicit Retreat or survival order.
- **Preferred route:** soft preference for an approach, only if still connected and legal.
- **Avoid region — LOCKED:** A player-marked forbidden region/connection is excluded from **all intentional traversal**: outbound travel, detours, mandatory objectives, return and emergency retreat. The character cannot grant its own exception. Only an **explicit player edit** removes the ban; it must be validated before applying. A preferred approach remains a separate nonbinding concept.
- **Constraint conflict:** if the selected objective requires entering an excluded region, mark the plan **Conflicted** and offer `Remove avoidance`, `Change objective`, or `Cancel`; do not enable misleading Launch.
- **No available legal connection:** display `Blocked` and the strongest known reason (closed gate, missing explored connection, temporary obstruction, conflicting avoidance). Distinguish blocked from `Uncertain frontier`.
- **Return under emergency — LOCKED:** Never enter an excluded region, **even if that is the only apparent way home and the character may die**. Report `No permitted route home`, attempt only lawful navigation or defensive survival, and request an explicit order edit when safely possible. A Retreat order is not consent to remove avoidance.

### E. Route preview contract (PROPOSED)
Preview states are mutually interpretable: **Confirmed** (known and connected), **Frontier** (known approach ends at fog), **Blocked** (known unavailable segment), **Conflicted** (orders/avoidances mutually incompatible), **Changing** (a previously available segment changed during this expedition). Neither preview nor risk label may consult undiscovered enemy positions as if player knew them. Indicate *why* the proposed route was selected: e.g. `shorter known travel`, `avoids Watchtower patrol zone`, or `passes requested waypoint`.

**Required itinerary visualization:** numbered objectives, optional waypoint symbols, differently drawn restricted regions, solid known route, faded/hatched frontier continuation and an always-visible small `Return to Camp` ending. Return is physical, not teleportation; its preview can differ from outward path if new shortcuts/conditions are observed. If the player configures a one-way exploration plan, the UI still displays the return rule as a necessary eventual extraction condition.

### F. Objective execution and resolution contract (PROPOSED)
| Objective | Valid target | Completion event | Typical failure/blocked reason | Default after completion |
|---|---|---|---|---|
| Reach | Discovered accessible landmark | Enters required interaction/arrival zone | Sealed link, no known connection, avoided-only approach | Advance next itinerary objective |
| Survey | Named known district or frontier edge | Bounded exploration target achieved: specified reachable branches surveyed **or** one significant discovery reported | No new reachable branches, hazard makes continuation impossible | Report explored portion; proceed/return per plan |
| Open passage | Discovered interactable gate/mechanism | Actual successful activation commits world change | Missing key/prerequisite, interaction inaccessible | Continue; shortcut available immediately |
| Gather | Authored region or target resource class | Specified useful find / collection target achieved (subject to capacity), **or** bounded search ends | No eligible resource presently accessible | Continue/return; no infinite farm loop |
| Recover | Actual outstanding death-cache marker | Cache picked up; contents are **still carried** | Cache inaccessible, replaced or nonexistent | Follow next already-ordered objective; attempt Return when the ordinary queue finishes or a Retreat order triggers |
| Challenge boss | Known reachable undefeated arena, or consciously selected rematch | Valid boss victory event | Boss access blocked; expedition defeated; rematch not activated | Follow planned exit/return; world-clear already committed |
| Return | Home camp | Character enters camp alive and banking commits | Cannot physically navigate or survives poorly | Conclude expedition with secured rewards |

A survey must have a **bounded** completion rule to prevent infinite wandering. Initial design proposal: stop after surveying selected frontier sector or encountering the next major landmark, and respect finite local-search budget and survival policy. Do not claim a fully explored unknown region merely because time elapsed.

### G. Task statuses and automatic fallback (PROPOSED)
**Superseded by creator lock L14:** Ordinary objectives show **Queued, Active, Completed, Skipped — Blocked, Cancelled by player, Suspended by Retreat**. If a task is definitively blocked, attempt bounded legal alternatives, then **automatically skip and advance to the next permissible task in its original order**. A safe UI may explain or allow an explicit re-add but cannot require attendance for a basic skip. No infinite retry at the same locked gate. Return to Camp is a non-skippable terminal extraction intent.

**Priority:** manual emergency retreat > automatic survival policy > mandatory objective > authorised waypoint > exploration preference > ordinary loot curiosity. Immediate tactical safety, animations and disengagement are managed by separate combat AI. A priority doesn't imply impossible actions: a character can attempt to retreat but still fail.

### H. Field-edit transaction rules (PROPOSED)
- **Retreat:** immediately changes the high-level goal, including midcombat; tactical handoff executes at next legal opportunity. Cancels/suspends the outbound itinerary and reroutes home; no free teleport or forced shield invulnerability.
- **Change objective / add waypoint / change avoidance:** available only at a safe decision point or camp. If requested while threatened, store as pending, visibly marked, and validate again once safe; no pause exploit.
- **Major discovery:** offer context choices `Inspect`, `Continue original mission`, `Return`; show whether the diversion changes current return risk.
- **Return condition triggered:** do not present optional loot/boss prompts that implicitly override retreat. Permit a conscious risk override *only when safe*; exact availability and UI are OPEN.
- **World changes under plan:** on opening gate, boss clear, collapsing temporary passage or encountering a new known threat, recompute feasible route **without** changing mission purpose; if user's hard constraint conflicts, surface reason rather than silently disobeying.

### I. Unattended/pause policy (OPEN, documented proposal)
Minor encounters and navigation do not require player input. Optional discoveries use existing standing orders if there is no response. A truly mandatory sanctuary choice may pause **only in a secure state** (whether and how is OPEN). An inaccessible ordinary mission task **does not pause by default**: L14 skips it after legal alternatives fail. Never pause a live incoming attack for free safety. Offline/background simulation is **not assumed** on RUN.world. Unanswered input must not implicitly authorise spending carried gold or entering a boss arena. The selected default must be previewed before launch.

### J. Three canonical expedition examples
**Frontier survey:** Camp → select Watchtower frontier → automatic known route to edge → survey unknown accessible branches → discover a shortcut → safe choice `Open now / Continue / Return` → physical extraction. Fog stays revealed whether or not extraction succeeds; gate only opens if activated.

**Cache recovery:** Camp → select existing cache → auto-route via safest allowed links → encounter prompts subordinate to recovery objective → pick up cache → Return to Camp. Map shows recovered resources as carried, not secured; death on return processes them once.

**Boss approach:** Camp → select Guardian arena → prefer waypoint near sanctuary, avoid known Harrier territory → validate legal preview → level and prepare automatically → reach arena and consciously commit → defeat boss → world mechanism changes immediately → navigate home to bank nonpermanent loot; optional rematch only after original clear and explicit selection.

### K. Anti-patterns and validation questions
Never: draw an exact route through fog; allow **any intentional** automatic violation of an exclusion, whether explained or not; treat mere arrival near camp as banking; stop indefinitely at every fork; change doctrine every combat frame; route through closed shortcut; show made-up win percentages; let minor exploration replace a required cache-recovery objective.

In user testing ask the player to identify (i) *their* orders vs AI navigation, (ii) where the route preview becomes uncertain, (iii) what `Avoid` actually prevents, (iv) how they can interrupt an expedition, and (v) whether their current loot is secure. If these answers aren't clear, simplify the planner before increasing content.

## Workshop 10 — Absolute route avoidance and blocked-objective contract
**Status:** The prohibition in sections A–D is **LOCKED (L13)**; response to impossible ordinary objectives is now **LOCKED (L14: skip and continue)**. Exact controls and absence policy remain PROPOSED.

### 1. Meaning and authority of Avoid
1. `Avoid region` means **must not intentionally enter** a region. If the map supports individual forbidden connections as well, they follow the same rule. A ban is not a threat rating, a soft path penalty or an enemy-avoidance preference.
2. Every itinerary leg, optional waypoint, exploration continuation and potential **return path** is planned on the permitted network only. Low HP, limited healing, a valuable cache or lack of an alternative do **not** authorise violating the ban.
3. `Retreat` changes **objective priority**, not permission boundaries. The adventurer must attempt to reach camp without forbidden travel. If impossible, extraction remains unavailable; resources stay carried/at risk.
4. Only a **deliberate player action** to remove/edit the avoidance may change that rule. No automatic timeout, suggested route, combat panic state, simulation resume or default choice can count as permission.
5. Avoidance constrains intentional travel even when combat AI controls locomotion. Defensive movement must be chosen within permitted space; the combat workstream should flag if physical collision/knockback could force a boundary crossing (a separate edge case for joint design, never a licence to route deliberately across it).

### 2. Prelaunch and map interaction (PROPOSED presentation)
- Route preview recalculates **both outward objectives and the known potential return path**, respecting avoided regions. Forbidden areas use a clear hatch pattern plus exclusion icon rather than colour alone.
- If a known mandatory target or waypoint requires forbidden travel, classify the plan as `CONFLICTED`, explain which exclusion is responsible, and disable launch until the player changes an explicit instruction. Do not replace the chosen goal silently.
- If the mission is a frontier survey, preview only the known permitted leg to the fog boundary. Unknown return access is labelled `Unverified`; it is never claimed to be safe because a planned outward approach exists.
- Offer `Inspect permitted alternatives`, `Edit exclusions`, or `Change objective`. These are **user actions**, not automatic permission changes. Potentially irreversible high-risk one-way frontier launches need a separate policy decision (OPEN).

### 3. Objective evaluation (PROPOSED operational handling)
- `Completed`: required arrival/interaction/kill confirmation has happened.
- `Queued`: valid and pending.
- `Active`: current instruction.
- `Blocked—no permitted path`: all currently known connections to target violate a ban or are inaccessible. Distinguish `avoidance conflict` from physical obstruction and unmapped frontier.
- `Awaiting orders`: an interactive **safe** decision is possible, without claiming world simulation has paused during danger.
- `Suspended by retreat`: current outward tasks are no longer attempted while trying to return.
- `Failed / expedition ended`: death or other legitimate terminal event; no silent task completion.
- On newly observed blockers, retry only **legal, materially different** routes; no oscillation against one forbidden gate or infinite replan.

### 4. Blocked objective vs. blocked extraction (UPDATED BY LOCK L14)
- If an **ordinary mission objective, including a waypoint**, is conclusively blocked, first try bounded, permitted alternatives. If none works, **skip and continue with remaining permitted tasks in original order**. This is the locked unattended behaviour, not a proposal to return/hold.
- A safe decision can explain the skip and allow a later explicit retry; it does not require the player to respond before the next ordinary task starts.
- If **retreat itself** has no permitted camp route, report `Extraction blocked by your exclusion` and identify the conflicting region if known. Only separately confirmed player edits can authorise previously banned travel. Do not skip Return, teleport or bank.
- If there are no remaining ordinary tasks, commence the Return-to-Camp attempt even if the mission achieved zero tasks. If no legal camp route exists, remain in a legitimate blocked-extraction state rather than a successful expedition.

### 5. Worked scenario
The player bans Sunken Passage, plots Watchtower → Crypt → Camp, and launches with a legal preview. An encounter closes the Watchtower return corridor. A Retreat order takes priority. No permitted route home exists because the only remaining known connection crosses Sunken Passage. The adventurer **does not take it**. It tries a legal alternate if one becomes known, otherwise reports `Cannot return without changing Avoid` and attempts to survive within permissible space. If the player later explicitly edits the ban at a safe decision point, a newly permitted route may become available. If not, death and recovery consequences remain possible. This is a deliberate consequence of locked Option A, not a navigation bug.

### 6. Test invariants
- `Avoid` cannot be silently cleared by changing objective, pressing Retreat, triggering an HP threshold, reopening a saved run, opening a shortcut, or failing to respond to a prompt.
- With a valid legal alternate, navigation takes it; with none, the system visibly fails to complete the desired objective rather than entering forbidden territory.
- The Chronicle records **who authorised an exclusion edit**, why a mission was blocked, whether a return route was possible, and whether extraction ultimately occurred.

## Workshop 11 — Objective execution, priority, and field decisions
**Authority:** L14 is creator LOCKED. Detailed UI, objective taxonomy, bounded-search conditions and unattended decision behaviour below are DESIGN PROPOSALS, not additional locks. **Supersedes Workshop 09/10 proposals** to automatically return or hold indefinitely simply because a normal task becomes blocked.

### A. Distinguish the objective list from the extraction invariant
- An itinerary is an ordered list of **ordinary objectives** (reach, survey, gather, activate, recover cache, defeat boss, visit waypoint). The prototype supports one objective at a time; the rest remain queued. A mandatory waypoint is a route obligation subject to the same L14 skip treatment if later proven impossible, not silent permission to enter a banned region.
- **Return to Camp** is a distinct, non-skippable terminal objective / extraction intent, not a regular queued chore. A plan may display it as the final row for readability, but a failed camp route becomes **`Extraction blocked`**, not `Skipped — Blocked` or `Completed`.
- Ordinary task completion never banks assets. Extraction occurs only after the character physically reaches camp under all current avoidance rules; dying transfers at-risk assets according to recovery rules.

### B. Proposed objective model and minimum completion evidence
| Type | Completion evidence | Blocked only when | Avoid false failure |
|---|---|---|---|
| Reach location / waypoint | Adventurer physically reaches valid target boundary | No permitted, currently traversable known path after bounded alternate search | A dangerous enemy nearby is risk, not geometric impossibility |
| Survey frontier | Scoped mapped-area/landmark condition reached, or explicit bounded survey stop | Frontier itself cannot legally be entered / explored from actual position | Fog remains `Unknown`, not `Blocked` merely for being unmapped |
| Activate gate / interact | Confirmed interaction success; gate flag changes only then | Locked mechanism without current means, forbidden path, unreachable object | A locked but solvable gate may warrant a survey/alternative rather than immediate skip |
| Recover cache | Cache physically picked up, not merely approached | Cache absent/replaced, inaccessible by any legal route | Another death may invalidate cache reference; don't grant its contents |
| Defeat boss / rematch | Valid encounter-victory event | Known invalid/cleared target, unenterable arena, mutually contradictory route bans | A hard boss fight is not itself evidence the task is impossible |
| Gather supplies | Required qualifying pick-up or bounded search condition | Source depleted/absent, available area exhausted | No endless circle waiting for random respawn |

### C. Proposed task-state vocabulary
`Queued` → `Active` → (`Completed` **or** `Skipped — Blocked`); direct player removal produces `Cancelled by player`; retreat produces `Suspended by Retreat`; death produces `Terminated by death` for unresolved objectives. A paused safe decision is `Awaiting decision` and is not equivalent to an impossible objective. None of these statuses grants rewards by itself.

Each `Skipped — Blocked` record contains: objective name, last attempted location, observed cause (`forbidden route`, `sealed prerequisite`, `collapsed passage`, `expired target`, etc.), which legal alternatives were considered at a useful summary level, and next attempted objective. `Unknown map` and `Known but excluded` use different labels.

### D. Authoritative resolution order
1. **Always obey L13 hard avoidance:** Never intentionally cross a forbidden region/connection. This is a constraint on *every* action and remains in force even if retreating.
2. **Tactical survival within legal space:** Separate combat AI handles imminent attacks; it does not alter the strategic goal.
3. **Manual Retreat or triggered survival Retreat:** Suppress remaining outward itinerary; attempt physical home extraction. If blocked, stay in extraction-blocked state until legitimately resolved or expedition ends. **Never skip the return**.
4. **Current ordinary objective:** Attempt meaningful legal routes/interactions; distinguish temporary danger from inability to reach the objective.
5. **L14 skip on demonstrated impossibility:** Record `Skipped — Blocked`, advance to the next *originally ordered* ordinary task and evaluate it from the adventurer's **actual current position**, not from the failed goal's theoretical location.
6. **Optional discovery / opportunistic loot:** Permitted only when it does not override a required task, hard ban or retreat.
7. **When ordinary queue exhausted:** Begin Return-to-Camp attempt; this is not a bank event.

### E. Blocking is an evidence-based conclusion (PROPOSED details)
- Before skip, try a bounded set of meaningfully different **known permitted** connections, then relevant currently enabled interactions. Avoid repeated attempts at the same gate or circular rerouting.
- `Blocked` is appropriate for confirmed hard prohibition, confirmed closed/no-key route, invalid/vanished target, or confirmed impassable connection with no permitted alternate. It is **not** appropriate for low HP (retreat policy handles that), enemy strength (risk), unexplored fog (frontier objective), unknown enemy locations or a mere longer route.
- Temporary path occupation without a known permanent obstruction is better represented as `Delayed / Reassessing` with a bounded wait or alternative. The precise wait budget is OPEN; after definitive exhaustion of permitted options, it can become blocked. Do not let it stall indefinitely.
- Each skip is single-shot for that objective occurrence. New shortcuts found later do not silently reinstate skipped orders or reorder completed ones. At a legal decision point the player may deliberately re-add an objective.

### F. Objective dependencies and ordering (PROPOSED)
- Default tasks run independently and **in order**; skipping task 2 does not automatically discard tasks 3–5. After every skip, recalculate the route from actual current position to task 3 and assess its prerequisites independently.
- If task 4 depends on a gate task 2 failed to open, task 4 can also become `Skipped — Blocked` with reason `prerequisite unmet`. Do not fabricate completion of the first task, open the gate, move the player to task 2's location or auto-substitute a different quest.
- A player explicitly removing task 2 may trigger a warning if its dependents will be affected. The existence and UI of formal dependency links are OPEN; minimal prototype can infer only direct map access prerequisites.
- If all ordinary tasks are skipped or completed, attempt Return. The Chronicle distinguishes `mission objectives not achieved` from `successful extraction`.

### G. Field-order decisions while expedition is active (PROPOSED)
- **Retreat** immediately changes strategic intent at any time and terminates further outward task execution. Tactical disengagement still has normal timing and can fail.
- **Skip now**, **Retry/re-add prior skipped task**, **Reorder remaining tasks**, **Remove an objective**, and **Change target** are possible *future* safe-point edit actions; the precise set available to the player remains OPEN. They must be explicit edits and are never inferred from an unanswered prompt.
- An interaction prompt for a **major discovery** may offer `Investigate`, `Stay on plan`, `Return` once tactically safe. The adventurer may not insert a side objective that takes precedence over the existing mandatory queue without permission.
- An unavoidable field decision should not freeze lethal incoming combat. Unanswered optional discovery can follow a previewed standing default (PROPOSED: Stay on plan), but unanswered critical decisions remain an OPEN design question.
- Reassigning objectives cannot lift a region exclusion. Only separately and explicitly editing Avoid can do that.

### H. Canonical scenario (one sword-and-shield adventurer)
Itinerary: `1. Reach Watchtower`, `2. Open East Gate`, `3. Survey Northern Frontier`, `4. Recover Supply Cache`, `Return to Camp`. The player absolutely excludes Sunken Passage. The East Gate has no current key or permitted alternate, so objective 2 is **Skipped — Blocked**. Objective 3 is evaluated from the Watchtower, succeeds if accessible by legal roads; objective 4 is evaluated next and may succeed despite objective 2's failure. If frontier 3 depended on the gate, it too is skipped and 4 is still tried. When all four have resolved, the adventurer attempts permitted extraction. If all legal camp connections are blocked, **Return is blocked but never skipped**, and carried gold stays at risk.

### I. Explicit non-goals for prototype
No branching script language, no conditional loops, no 'repeat until rich', no automatic revisiting of a skipped objective without player order, no task optimisation that reorders player priorities, no auto-override of forbidden regions, no stealthily swapping Recover for Gather, no paid risk reset or guaranteed extraction.

## Workshop 12 — Major discoveries and unattended field decisions (LOCK L15)
- **Routine discovery:** Ordinary side rooms, map reveal, seen sealed fog gates, loot and minor patrols use expedition policy/standing defaults, not a mandatory modal. Player may review recent discoveries afterward.
- **Major optional discovery:** If it is safe and the player is actively present, offer a brief `Investigate / Continue plan / Return` decision where appropriate. Without response, use the predefined ordinary-discovery fallback and continue; never silently reorder explicit mandatory objectives.
- **Secure consequential choice:** At an eligible sanctuary, major character upgrade selection can **pause only in a genuinely secure state**. No protective tactical pause during combat or active pursuit. Exact default/resume semantics remain PROPOSED; do not treat absence as a selected upgrade.
- **First boss/miniboss fog gate:** Map discovery can happen automatically. Spending a key and deliberately entering a major encounter are *not* routine discoveries. They require the creator-approved deliberate player commitment; no unattended key purchase/engagement, and no timeout consent. See `21`.
- **Blocked objective:** L14 still wins when an ordinary objective is actually impossible: mark `Skipped — Blocked` and continue remaining permitted tasks in original order. A sealed boss gate without an unlock authorisation or eligible key must not be crossed to fulfil an objective. Mark the objective blocked using normal rules, not a magical bypass.
- **High-level priority:** absolute exclusions > tactical immediate survival and locked combat handoff > requested/manual retreat or standing survival withdrawal > valid committed major interaction > current ordinary objective > next objective > optional opportunities. Distinguish a secure pause awaiting explicitly required consent from an impossible ordinary task.

### Example plan with a gate
1. Survey the western frontier (auto-record seen sealed gate).
2. Search a known key source.
3. Return to camp to bank carried fresh keys (LOCKED L19).
4. On a separate prepared expedition, travel via specified permitted waypoints to opened/known gate.
5. Explicitly unlock if eligible, then decide `Enter fight` or `Retreat`.
The discovery of a gate never inserts a surprise boss objective into a custom itinerary. No player presence means no implicit authorisation to fight.

## Workshop 13 — Key prerequisites in expedition objectives
A planned `Open sealed gate` objective must carry the gate's discovered required-key category. For ordinary boss/miniboss gates the requirement is the **universal Gate Key** (LOCKED L17); exceptional optional bosses may require a distinct special key (PROPOSED P16). Plan validation must distinguish `No key available`, `Gate already permanently open`, `Key source undiscovered`, `Key not allocated for this expedition` (allocation is PROPOSED), and `Forbidden route`. If a prerequisite remains unmet after legal alternatives, automatically mark that task `Skipped — Blocked` and continue the original subsequent permitted objectives (L14). Never exchange key types or auto-consume keys during ordinary observation. Selecting an intentionally gated boss objective is not itself permission to unlock or enter without the distinct consent required by L16.

## Workshop 14 — Key-source expedition objectives (L18)
Add two **proposed objective templates**, reusing the already locked hybrid itinerary model without increasing confirmed starter kits:
- `Seek authored Gate Key`: travel to known legitimate source, claim the one-time reward if still present/eligible, then optionally proceed to later *permitted* tasks and finally attempt camp extraction.
- `Complete Key Trial`: travel to an accessible repeatable challenge, meet its visible authored conditions, claim a universal key reward once for the eligible expedition (proposed cap), then attempt camp extraction to secure it. A failed trial does not award a key, and skipping a blocked trial obeys L14.

`Open fog gate` remains an independently authorised first spend, not a default consequence of passing near it; `Commit boss encounter` is distinct. L19 now **requires prior camp banking before first gate use**. O23 (preauthorise unlock versus gate-site confirmation) and expedition key carrying limits remain open; do not present either as locked. Absolute avoidance L13 applies to every source route and gate approach, with no special key exception. A completed `Earn key` objective cannot implicitly mark `Return to camp` as successful.

## Workshop 15 — Key-aware itinerary and blockers (L19)
**Preparation at camp:** the player sees already banked universal key stock and fresh key opportunities discovered on the map. To plan a first gate unlock, the player must provision a previously banked key for a **subsequent** expedition. A strict maximum of **two** previously banked keys may be provisioned under LOCK L20; a launch screen must not misrepresent camp-stored keys as physically carried.

**During the run:** a `Collect key` or `Complete Key Trial` objective grants a fresh, unbanked key only after legitimate completion. This reward **cannot satisfy a later `Open fog gate` objective in the same itinerary**, even if the gate is directly ahead. If there are no separately provisioned eligible keys, that gate objective resolves `Skipped — Blocked: no previously banked key carried` under L14, then remaining legal tasks continue. The adventurer never reorders tasks merely to circumvent L19, and never auto-returns just because one gate task was skipped.

**Example valid multi-run plan:** Run 1 locate trial/one-time key → physically return home and bank it. Run 2 choose gate objective, provision banked key, travel on legal route, explicitly authorise first unlock, then independently choose encounter or retreat. The player can have extra ordinary tasks on either run; L19 does not impose a timer, minimum number of fights or mandatory boss attempt upon unlocking.

**Preflight:** show `Key unbanked — return to camp` when a planned gate opening relies solely on a key that would be found later in the same run. A player may choose to launch for exploration anyway, but the impossible gate task should be visibly flagged/handled under normal skip rules. Conflicting absolute avoid orders still block access and may take precedence.

## Workshop 16 — Two-slot keyring and planned gate budget (L20)
**LOCKED:** at camp, a plan may provision at most **two** previously banked universal Gate Keys. The planner may show a sequence of named unopened gate targets, but it must track how many eligible carried keys remain *after confirmed prior unlocks*, not silently use fresh keys acquired later or keys safely stored at camp. During route preflight, show `Prepared Gate Keys: 0/2, 1/2 or 2/2`; show known gate prices as **OPEN balance** until selected. Distinguish `Known legal route`, `Insufficient prepared keys`, `Fresh/unbanked key only`, and `Restricted route (absolute exclusion)`.

**PROPOSED:** preview the projected costs of an itinerary without charging or guaranteeing completion; a route containing more expected key charges than the two prepared slots can support gets a transparent budget warning. At each unopened gate require its own separately authorised unlock under L16; named itinerary selection does not currently grant consent by itself (O23 open). If insufficient eligible keys remain, `Skipped — Blocked` and continue the next allowed ordinary objective (L14). Boss fight itself remains a distinct explicit commitment. See `23` and `24`.
