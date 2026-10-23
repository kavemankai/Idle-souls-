# 12 — Player Interface, Feedback and Chronicle
**Owner:** UX/interaction design  
**Status:** Limited control and readable autonomous decisions LOCKED in principle; detailed layouts PROPOSED

## UX goal
The player must understand current objective, current behavior, map knowledge, health/supplies, what is carried, what is at risk, and why an intervention is being offered. The interface must work for glanceable mobile sessions yet also support mouse/desktop planning. Avoid replacing the game with a dense spreadsheet.

## Primary screens
1. **Camp preparation:** world map, current starter kit, carried vs banked inventory, planned itinerary, doctrine, exploration and return preferences, cache marker, Launch action.
2. **Expedition view:** top-down adventure at usable readability, compact objective and condition indicators, retreat control, current movement route, discoverable expandable log.
3. **Map overlay:** persistent explored terrain, connections, status of shortcuts, location of objective, discovered sanctuaries, last known enemy sightings and cache.
4. **Safe decision panel:** major new discovery, optional redirection, sanctuary upgrades; not a per-room confirmation modal.
5. **Post-run Chronicle:** route traced, objectives completed/**skipped with causes**/terminated by retreat, timeline of critical events, banked/lost/persisted assets and one actionable observation.
6. **Optional rematch planning:** active contract and mutually understood risks; never hide ordinary-campaign cleared state.

## Camp planning flow
Choose purpose preset (Explore/Gather/Recover/Boss or Custom), map-select objective, optionally add waypoints, choose Safe/Thorough/Direct exploration, choose Guarded/Measured/Pressing combat doctrine, select retreat triggers and home path preference, inspect expected unknown segments, then launch. Presets must make first launch possible without building a long instruction tree.

## Expedition HUD priority
Highest priority: avatar, visible threats, current objective, health/stamina and active retreat/engagement state. Second: consumable count, carried gold/value, next destination and map progress. Third: expandable reason log, detailed loadout, Chronicle. Big, reachable Retreat control; require only lightweight confirmation if accidental triggering is a common problem (testing OPEN).

## Autonomy explanation
Use short natural statuses: “Travelling to Watchtower”, “Investigating noise”, “Engaged: Harrier”, “Breaking contact”, “Using western shortcut”, “Returning to camp”, “Resting at sanctuary”. The reason log uses sparse event-level messages, e.g., “Retreat started: health threshold”, “Changed route: guarded eastern passage”. Don't create a scrolling narrative of every sword swing.

## Player interrupt hierarchy
Retreat can be tapped during combat, but takes effect at safe action transition. Destination changes queue until a safe navigation decision. Sanctuary choice is available only in a safe area. Significant discovery prompts can wait until the current danger resolves. On absent input, follow a clear default policy; don't leave a running fight paused in a way that creates free safety.

## Map language
Use distinct visuals for unexplored, mapped but unobserved and currently observed. Show permanent-open vs seen-locked vs temporarily blocked gate differently. A last-seen patrol marker must read as historical intel, not live tracking. Do not expose enemy location through walls. Region threat badges are informed estimates, not probabilities.

## Expedition Chronicle fields
Run ID/time, start configuration, actual traversed route, explored additions, combat/avoidance counts, important discoveries, upgrade choices, boss/rematch outcome, retreat initiation reason, extraction/death result, secured vs at-risk vs lost/recovered assets, pivotal decision sequence. Chronological detail should allow replay analysis without overwhelming players.

## Visual and accessibility constraints
High-contrast fog, readable silhouette, clear telegraphs, legible text at mobile scale, input targets large enough for touch, pause/resume support, adjustable screen shake/flash, audio-independent critical alerts, icons combined with labels rather than color alone. Portrait vs landscape is **OPEN**; do not pretend orientation is locked.

## Session pacing controls
Optional accelerate on previously mapped uneventful travel. Slow to normal during observed threats, major discoveries and fights. Pause only in appropriately safe interactions. Save/resume should not become a paid feature or cause resource duplication.

## Tests
First-time player can explain objective, retreat threshold and lost-on-death resources before launch. They can identify a locked shortcut, see a stale enemy sighting, order retreat, and use the Chronicle to explain a failed run. On small screens critical threats never hide under UI elements.


---

## Workshop 08 — Screen hierarchy and intervention ergonomics (PROPOSED, not locked)
**Revision:** v0.2 working proposal. No new creator lock.

### UX hypothesis: three primary states, not many screens
**Camp/Plan:** The world map is primary. A narrow mission panel shows the objective list, default Return to Camp, survival policy and Launch. The fixed sword-and-shield kit is visible but not presented as a kit-selection catalogue.

**Observe/Expedition:** The 2D scene is primary. Persistent compact data: objective, HP/stamina, healing items, carried/unbanked value, stance/status, small map access and an always-reachable Retreat control. Detailed notes and full map open on demand. Avoid covering enemy telegraphs with overlays.

**Review/Chronicle:** A map trace, discoveries kept, gold/gear/XP banked or lost, death-cache state, main cause of failure and 'Plan Again' action. Provide one actionable recommendation, not an AI-generated wall of explanations.

### Progressive disclosure
- New player: mission preset, one objective marker, minimal doctrine and survival defaults.
- Intermediate: add or reorder waypoints, swap Safe/Thorough/Direct and Guarded/Measured/Pressing, adjust return conditions.
- Advanced: customize fallback decisions at junctions and choose approaches based on threat intelligence; avoid freeform scripting in the first version.

### Decision cards
Decision prompts should tell the player: where they are, what changed, what is at stake and the available safe actions. Default action is explicit. Good example: 'Hidden gate discovered; continuing into the Crypt increases uncertainty. Investigate / Continue route / Return'. Ordinary containers, routine patrols and routine level-ups never trigger a modal.

### Information hierarchy
- Absolute always-visible: health, current order, engaged/escaping/travelling state, Retreat action.
- Prominent but secondary: consumables, risked loot, next objective, route safety assessment.
- Optional: full map, last-sighted threat marks, current temporary upgrades, doctrine explanation, event log.
- Banked resources and detailed character progression belong mainly at camp, not as persistent in-combat HUD clutter.

### Mobile-layout considerations (orientation remains OPEN)
Leave the centre of the screen unobstructed for 2D combat legibility. Use legible status text with icon redundancy and sufficiently large, separated hit targets. The world map may be temporarily enlarged as an overlay when not making combat decisions. Don't decide portrait or landscape by assumption.

### Product learning metrics (PROPOSED)
Track time to first launch, number of planning taps, whether users understand automatic Return to Camp, how often field decisions are used, manual-versus-policy retreats, banked extraction rate, percent of deaths with comprehensible Chronicle cause, and second-expedition start rate. Use these to reduce interaction friction, not to justify manipulative timers.

## Workshop 09 — Exact planning-map interaction proposal
**Locks acknowledged:** Hybrid route model (L12) and **absolute avoidance even during emergency return (L13)**. Interaction patterns below **PROPOSED**; orientation remains OPEN.

### Layout: map-first with a collapsible itinerary rail
Present (1) a large interactive persistent map, (2) an ordered itinerary panel, (3) a compact standing-order and risk summary, (4) a clear Launch action. On small touch screens the itinerary can occupy a bottom sheet rather than a permanent narrow side column. Desktop can use a left/right rail; both represent **the same planning state**.

**Recommended prelaunch hierarchy:** map target and action; route preview; mandatory waypoints + avoid regions; doctrine/exploration/return settings; `At risk on death` summary; Launch. Avoid opening a separate full-screen menu for each value. Use sensible named defaults, fully disclosed.

### Map interaction table
| Gesture/control | UI response | Design guardrail |
|---|---|---|
| Select discovered landmark | Focus and offer Reach/Survey/Open/etc based on eligibility | Cannot select an unobserved objective through fog |
| Select explored road node | `Add waypoint`, `Inspect route`, `Avoid connection` | Prevent unintended new mandatory objectives |
| Select known region | Show known hazards; `Avoid region` / `Remove avoidance` | Explain that absolute avoidance may invalidate an objective **or retreat** |
| Select frontier boundary | `Explore beyond this frontier` | Draw solid preview only as far as verified traversability |
| Select numbered itinerary chip | Move up/down, edit, delete | Always show if removing it invalidates subsequent route |
| Select alternative known route | Swap candidate preview / inspect rationale | Compare known relative burden, not probability of victory |
| Select current death cache | Quick `Recover` plan | Only visible when cache actually outstanding |
| Press `Launch` | Preflight validation and concise high-stakes confirmation | No launch if known route is impossible/contradictory |

For no-hover input, never rely on tooltip-only information; every desktop hover explanation needs a touch-accessible equivalent. Prevent map pins and touch targets overlapping crucial navigation controls.

### Proposed visual vocabulary
- Solid line = verified traversable section of selected route.
- Faded/hatched wedge = beyond explored frontier; no implied precise path.
- Hollow gate icon = seen but closed, solid/open symbol = operational shortcut.
- Waypoint numbers = committed intermediate locations; avoid region = marked zone distinct in colour *and* pattern.
- Patrol symbol with `last seen` text/time scope = historical intelligence, not real-time tracking.
- If multiple known alternatives exist, show a short compare: `Shorter / known guarded approach` versus `Longer / fewer observed threats`. Never show invented percentages or enemy knowledge.

### Compact preflight panel (illustrative copy)
```
EXPEDITION: Survey Eastern Frontier
Objective: Reach Watchtower → Survey frontier
Via: Old Road junction            Avoid: Sunken Passage
Path: Confirmed to Watchtower; frontier unmapped
Behaviour: Measured combat · Safe exploration
Retreat: 30% HP or healing reserve reached
Return: Safest known path to camp
Carried rewards are ONLY secured at camp.
[Edit Orders]                         [Launch]
```
This is interface copy for design review, **not code**. Starting item set remains sword and shield; consumable quantities are subject to balancing.

### Route warning priority
1. **Block Launch** if a requested primary goal has no permitted confirmed approach and is *not* explicitly a frontier mission; report specific reason and offered repair.
2. **Allow frontier mission** if the selected edge is reachable while the beyond-fog segment is intentionally unknown; explain that the preview ends at the frontier.
3. **Warn, don't fake certainty** when known return route has substantial exposure or temporary hazards.
4. **Alert if cache outstanding** before a risky nonrecovery trip, if the proposed one-cache loss rule is adopted.
5. **No alert fatigue:** ordinary threat markers should live on the map, not generate compulsory dialogue before each run.

### At-a-glance expedition UI
During normal travel display current instruction and next ordered marker. On map overlay, show **planned route versus actual path**; distinguish new intelligence from permanent geography. During combat, keep tactical view unobscured, but Retreat remains always accessible. If player tries a non-emergency reroute during threat, display `Order queued until safe` instead of freezing combat. On withdrawal, explicitly replace the objective label with `Returning to camp — not yet extracted`.

### Post-run learning and reusable-plan proposal
Chronicle map overlays original planned line, deviations taken and actual traveled line, with reasons (`new gate opened`, `hazard avoided`, `retreat threshold`, `objective blocked`). A `Repeat Plan` action is a **future** convenience and must revalidate world changes and cache existence before launch; it does not guarantee identical encounters in living world.

### Usability test criteria
First-time tester launches with one objective, can add a waypoint after the first tutorial, can mark a region avoid without confusing it with a blocked gate, notices that fog continuation is unspecified, and can find the Return policy and Retreat control without guidance. Collect attempted invalid map actions, number of touches before first launch, unintended mission reorders and inaccurate interpretation of risk badges.

## Workshop 10 — Absolute avoidance in the planning and live UI
**Locked meaning:** `AVOID` is a forbidden area, not a discouragement. The interface must not imply `Retreat` overrides it. A separate explicit player command is required to change an exclusion.

**Proposed map affordances:** Each excluded region is overlaid with hatched shading and a forbidden-entry icon. Show the affected corridor links and route outline; use text + pattern for colour accessibility. Tapping the region opens `Inspect restriction` and `Remove restriction` as **deliberate actions**, not a one-tap accident. The game shows whether the restriction breaks the outward goal, a waypoint, or the known route back.

**Proposed launch validation:**
| State | Copy shown | Launch behaviour |
|---|---|---|
| Outward objective unreachable without forbidden area | `Cannot reach target under current Avoid order` | Block; offer `Edit Avoid / Change Objective` |
| Mandatory waypoint forbidden | `Waypoint conflicts with Avoid: [name]` | Block; must reconcile |
| Known permitted outward and return routes | `Valid known route; conditions may change` | Eligible |
| Reachable frontier but unmapped return possibilities | `Beyond frontier unknown; extraction not guaranteed` | Future policy decision for one-way scouting |
| Known outward path but known return impossible | `No permitted route home` | Block or explicit high-risk launch decision is OPEN, not quietly allowed |

**Live blocked-return treatment (PROPOSED):** Show a high-priority but non-deceptive status: `RETURN BLOCKED — Avoid: Sunken Passage`. In a secure decision state, provide `Inspect options`, `Change restriction`, `Hold position / Other objective` (where viable). The existing Retreat control may remain available, but it cannot promise extraction. While actively threatened, no protective pause is granted and no avoidance is lifted automatically.

**Chronicle record:** Include forbidden-area names, timestamps or relative sequence of explicit avoidance edits, how the chosen approach affected return options and whether the adventurer was unable to complete the retreat because the player retained an exclusion. Do not fabricate a risk percentage.

## Workshop 11 — Blocked objectives: player-visible priority and review (LOCK L14; controls PROPOSED)
### Minimal live itinerary treatment
Represent each ordinary objective as an ordered row with a distinct state: `Queued`, `Active`, `Completed`, `Skipped — Blocked`, `Suspended by Retreat`. Don't erase skipped rows while the expedition runs. Label Return to Camp separately as `Planned`, `Returning`, `Extraction blocked` or `Extracted`—never `Skipped`.

Example expedition display:
1. **Reach Watchtower** — Completed
2. **Open East Gate** — Skipped: unavailable mechanism; no permitted alternate
3. **Survey Northern Frontier** — Active
4. **Recover Supply Cache** — Queued
**Return to Camp** — Planned (non-skippable)

When an item becomes blocked, show one short non-modal notification, `East Gate skipped — no permitted access. Continuing to Northern Frontier.` Include an expandable explanation and highlight the original target on the map. Avoid interrupting the expedition with a mandatory prompt every time an ordinary task is skipped.

### Prelaunch contradictions versus midrun discoveries (PROPOSED UI)
A player who knowingly selects an objective reachable only through a marked forbidden region should see an immediate `Plan conflict` with edit or explicit skip/acknowledge choices. Do not pretend the route is valid; do not silently drop the task. Once a previously valid expedition is underway, **L14** handles newly revealed impossibility automatically.

### Field decision design (PROPOSED)
At a secure decision opportunity, offer limited controls like `Continue plan`, `Review skipped objectives`, `Add/retry objective`, `Change waypoints`, `Edit Avoid`, and `Retreat`. Re-added tasks join where the player places them; they don't retroactively erase skip history. Edits cannot weaken exclusions without explicit approval. How the interface handles queued edits while combat is active remains OPEN.

### Chronicle distinctions
Display separate counts for `Objectives achieved`, `Objectives skipped`, `Withdrawn/terminated`, and `Extraction outcome`. Winning a boss can advance permanent world state even if later objectives are skipped or extraction fails. The Chronicle should answer: *What stopped the task? What did the adventurer try? Why did it move to the next one? What was banked, lost or persisted?*

### Readability constraints
Never colour a skipped task green or report mission success merely because extraction succeeded. Avoid alert spam if three dependent objectives are skipped consecutively: group as `3 objectives unavailable` with a tappable ordered breakdown. During active retreat, foreground `Returning` and reduce skipped-objective noise. The sword-and-shield combat HUD stays primary during fights.

## Workshop 12 — Safe discovery and sealed fog-gate UX
**LOCK L15:** Routine discovery uses standing defaults and does not obstruct unattended execution. Pauses are reserved for **secure and consequential** decisions such as a sanctuary upgrade choice, never mid-swing or mid-pursuit. An unanswered choice cannot assume consent to bank, spend, defeat or enter a boss encounter. On restore, reshow a pending consequential choice in a safe state.

**Fog gate state legend:** `Seen — Sealed / Key required`; `Key banked and allocated` (proposed); `Unlocked — Boss undefeated`; `Boss cleared`; `Rematch available`. Ensure encounter barrier is visually different from exploration fog-of-war. At a sealed gate show meaningful cost and lock persistence: `Spend 1 Gate Key to unlock permanently?` with explicit `Unlock` and `Leave`, with **no preselected paid action**. After opening, show a distinct `Enter encounter / Remain outside` decision. No boss engages from nearby exploration or incidental pathfinding. If the player is not present, any major entrance remains uncommitted; default discovery action is log and continue plan where feasible.

Chronicle separately lists `gate discovered`, `key found`, `key extracted`, `key allocated/carried`, `key spent`, `gate opened`, `encounter entered`, `boss first-clear`, `rematch result`, `loot banked/lost`. A skipped boss objective due to a missing key/gate cannot pretend victory or silently use an excluded region. See `21`.

## Workshop 13 — Common key and special-key presentation
The expedition preparation map shows **universal Gate Keys held** and known ordinary fog-gate costs; optional exceptional gate icons show a different special-key prerequisite once discovered. Costs must not imply that an eligible key will be spent automatically. A confirmed unlock logs key class, exact gate, first-use consumption and permanent opened flag; the Chronicle must not conflate opening with victory or extraction. A missing special key must never be presented as preventing completion of the main campaign. Special keys and universal keys should have different labels and icons, but no final art style is locked.

## Workshop 14 — Player-facing key source and loss tracking
Show separate totals/statuses for `Universal Keys — banked`, `Carried at risk`, `In recovery cache`, `Assigned to current expedition`, `Spent opening gates`, and `Gate open permanently`. The distinction between a guaranteed **reward on completing a source** and guaranteed **safe extraction** must be explicit. Show one-off key source flags only once legitimately discovered; show repeatable trials as available or claimed for current expedition, not as infinite same-run pickups.

At camp the map/journal should answer: `Where can I get another key?`, `Is its route currently permitted?`, `Have I already claimed this trial this expedition?` and `Which gates can I open?` Without revealing unseen geography, provide an understandable first-key breadcrumb and a known repeating challenge once available. On an optional gate unlock, explain opportunity cost: fewer available keys for required gates but replenishment remains possible. At sanctuary explicitly display `This does not bank your Gate Keys`.

Chronicle event vocabulary: `Unique key source discovered`, `Unique key claimed`, `Trial begun`, `Trial completed`, `Universal key carried`, `Key dropped at death`, `Cache recovered`, `Key banked at camp`, `Key spent on opened gate`. No duplicate `trial completed` or key credit on save/resume. No automatic premium-content upsell or paid rescue during key-loss screens.

## Workshop 15 — Visible key eligibility and decision prompts (L19)
**Camp display:** `Banked Gate Keys: N` plus a separate selector showing how many previously banked keys the adventurer will **physically take** (maximum **two**, LOCKED L20). **Expedition display:** distinguish `New keys (unbanked; extract first)` from `Prepared keys (banked previously; may unlock gate)`. Do not show total key count as a single affordance if some cannot legally pay.

**Gate encounter:** if only fresh keys are carried, the interaction reads `Requires a key secured on an earlier expedition` and offers `Mark for future expedition`; no purchase button and no combat. If a prepared key is carried, show eligibility and the exact cost (price still pending); unlock is separately authorised from boss entry. An aborted or interrupted confirmation must not charge the key.

**Extraction recap:** explicit line items `Fresh Gate Keys secured at camp`, `Prepared keys returned unused`, `Keys spent permanently opening gates`, `Keys lost/cached`, and `Gates now open`. Chronicle retains source/trial award record and key-banking history, including death and recovery. Do not accidentally award key banking from arriving at a sanctuary or opening the pause menu. Unattended discovery L15 never implies a key purchase or boss commitment.

## Workshop 16 — Two-key camp provisioning and transparent gate allocation
**LOCKED:** show the camp `Available banked keys: N` and two prepared-keyring slots (`0/2`, `1/2`, `2/2`). The camp stock not issued remains protected. During an expedition label `Prepared eligible keys`, `Fresh unbanked keys` and `Spent keys` separately; do not display a misleading combined balance. Show cost on a *discovered* sealed gate, the planned remaining eligible budget, and a no-spend default when no response is given. Two prepared keys never imply two authorised unlocks, and selecting a route to a boss never implies consent to fight. Price labels must show **1 universal Gate Key** for every standard miniboss or major-boss gate (LOCKED L21); special optional-key gates remain separate proposals.

**PROPOSED:** show an itinerary warning when planned first unlocks cumulatively exceed allocated prepared keys. On a mini-boss preview include a strategic payoff (permanent shortcut or world change, at-risk first-clear spoils) rather than an ungrounded statistical victory percentage. In the Chronicle record which specific gate consumed which issued key, keys returned, keys lost/cached and which remained safely at camp. See `24`.


### Workshop 20 visual cross-reference (PROPOSED)
See `28_VISUAL_STYLE_AND_ART_DIRECTION.md` for the candidate field-cartography UI, screen hierarchy, gate/key/sanctuary visual states, responsive composition and legibility thresholds. These are presentation candidates, not new control rules or an orientation lock. Existing absolute avoid, skip-blocked, physical return and explicit gate/boss permissions remain authoritative.

## Workshop 22 — Presentation workflow compatibility
L22's Blender-to-2D actor sprites must preserve doctrine, stamina, turn/heading, guard orientation, damage state and retreat readability at actual mobile zoom. Painted world, fog gate, map overlays and Chronicle retain independent 2D render layers. Sprite visual interpolation must not leak unseen actors or change the exact absolute route exclusions, banking, or encounter commit logic. `30` owns export and renderer considerations only, not the underlying decisions.

## Workshop 23 — camera and map clarity (L23)
The Phaser gameplay view remains 2D top-down. Blender-generated character sprites now always use a fixed orthographic source camera about +75° above horizontal. This artistic view cannot change the navigable shape, routes, cover or hit geometries shown in the planning map. The presentation renderer anchors a sprite to the actor's ground position, maintains stable heading/handedness and must not leak hidden actors/telegraphs through fog. Validate map/current-target/small-unit readability at actual game zoom. See `31` for authoring standards; the full visual aesthetic is unapproved.
