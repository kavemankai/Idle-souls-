# 03 — Exploration, Fog of War and Discoveries
**Owner:** Exploration design  
**Status:** Persistent fog LOCKED; reveal scales and discovery weights PROPOSED

## Goal
The map is a strategic asset. Every run can reveal something useful even if the adventurer dies. Revealing the geography must not automatically unlock or complete its interactive objects.

## Three knowledge layers
1. **Unexplored:** topology not yet verified; player cannot plot precision waypoints through it.
2. **Mapped but not currently observed:** permanent physical features remain legible; enemies and changing hazards are not presented as live certainties.
3. **Currently observed:** character's actual sensing grants timely sightings, nearby hazards, containers and interactions.

The UI should distinguish static known terrain from last-known enemy information. Enemy position intelligence can expire **within** an expedition; the physical map never expires. A region's threat identity may remain known even as exact patrol positions change.

## Discovery lifecycle
For meaningful map elements: **seen → approached/reached → activated/completed**. Examples: a remote gate can appear on the map when spotted; becomes route-plannable once reachable; becomes a permanent shortcut only when actually opened. This model applies separately to sanctuaries, boss arena entrances, large treasure sites and world mechanisms.

## Frontier navigation
Players cannot set exact room-by-room routes through unknown terrain. Instead they choose an *exploration frontier*—a known edge or suspicious landmark—and an exploration intent. The adventurer locally selects available connections and reports major discoveries. A blind exploration objective is bounded by survival orders and any explicit return condition.

Proposed objective categories:
- **Explore frontier:** advance into unmapped reachable space until risk limit, landmark discovery or planned stopping point.
- **Survey area:** search branches within an accessible district and reveal terrain.
- **Reach landmark:** travel to a known map target through currently usable edges.
- **Open passage:** interact with an identified gate/mechanism.
- **Recover cache:** navigate to prior death site (including last-known uncertainty if routes changed).
- **Return home:** end exploration and follow available extraction route.

## Local exploration preferences
- **Safe:** avoid avoidable combat, favor known cleared routes, tolerate slower discovery.
- **Thorough:** search side spaces and reachable opportunities before advancing; subject to survival limits.
- **Direct:** focus on specified destination and bypass optional side content.

These preferences are separate from combat doctrines; e.g., Guarded + Direct and Pressing + Safe are both legitimate combinations. No preference may override an explicit retreat order.

## Major vs ordinary discoveries
**Ordinary**: minor loot, short empty passage, repeatable supply source; resolve automatically if permitted. **Major**: newly discovered shortcut, sanctuary, boss approach, rare item, blocked vital path, unexpectedly dangerous concentration; surface an optional decision at a safe moment. During active attack/pursuit, defer decision prompts to avoid pause exploits.

## Information reward economy
Map completeness should have both practical and psychological value. Track new tiles/rooms mapped, connections confirmed, meaningful landmarks, shortcuts opened, and route alternatives validated. Permanent knowledge is banked immediately by discovery, independent of loot extraction. Do not award unlimited XP simply for walking across previously mapped ground.

## How variation interacts with knowledge
Static knowledge persists; patrol sightings, temporary fog, local hazards and provisional safety assessments can be stale. Danger estimates should be qualitative and explicitly based on known information. No invented numerical win chance. Unknown territory must retain uncertainty rather than displaying secretly calculated “safe” ratings.

## Anti-exploit principles
- Seeing a boss room does not defeat or activate it.
- Opening a gate requires reaching/interacting with it.
- Brief intentional death can earn map knowledge, but cannot also auto-bank treasure or unique loot.
- A previously explored map section remains usable after death, disconnection and save/load.
- Scout reports cannot reveal enemies through opaque barriers without an authored sensing rule.

## UI needs and tests
Map shows currently planned route, explored vs unknown, last-known hazard annotations, locked vs open passages, expedition's current position and recoverable cache. The player should be able to select the nearest known frontier in a few interactions on mobile. Test that players can distinguish 'I have seen that gate' from 'I can use that gate'.

## Workshop 09 — Fog-aware route editing (hybrid LOCKED)
A waypoint is selectable only on known, reachable geography. The player can designate an unexplored **frontier boundary** as an objective but cannot prescribe unseen turns beyond it. `Survey frontier` may send the adventurer into newly discovered accessible space according to Safe/Thorough/Direct policy and its bounded stop rule. A confirmed route preview must never extend a solid line through fog, even if map generation internally knows the terrain.

**Knowledge-versus-access checks (PROPOSED):** `Seen gate` allows inspection; `Reached gate` allows an Interact/Open objective if physically accessible; only `Opened gate` makes its link traversable. `Last-seen patrol` is a dated observation separate from geographic truth. Temporary regional conditions can change route assessments without erasing mapped topology. Hidden enemy positions must not be used to make a supposed 'safest known' route omniscient.

**Acceptance:** A player can set Camp → known Watchtower junction → explore eastern frontier, then watches route line stop at the frontier edge. An unvisited branch becomes visibly mapped during exploration and can be assigned as waypoint on a *later safe decision*; it must not retroactively appear as a prelaunch known road.

## Workshop 10 — Fog and hard exclusions (LOCK L13)
Exploration of a **frontier** does not waive a region marked forbidden: known avoid boundaries constrain investigation even where terrain beyond is unknown. The preview ends at the last permitted confirmed frontier; a route never paints through a banned district under fog, nor treats merely discovering its shortcut as authorisation to enter. When a frontier survey cannot progress without forbidden travel, report `Survey blocked by Avoid order` and follow an approved fallback (not yet locked). Persistent map knowledge may reveal forbidden geography, but knowing it does not make it traversable under current orders.

## Workshop 11 — Fog must not cause a false blocked-objective skip (LOCK L14 interaction)
- An objective targeting the **known edge of fog** remains valid while a permitted connection to that frontier exists. The absence of information *beyond* fog is not confirmation the task is impossible.
- A survey can end from its explicitly bounded search/coverage condition, without pretending hidden areas are blocked. Specific survey-completion bounds remain OPEN.
- If the mapped connection to the selected frontier is physically barred or excluded and no legal alternative exists, record `Skipped — Blocked` and continue the next permitted expedition objective. This does not erase discovered map information or weaken the exclusion.
- Later revealing a legal shortcut does not automatically reactivate a previously skipped frontier task. The player can add/retry it deliberately through hybrid planning.

## Workshop 12 — Discovering major encounter fog gates (LOCKED concept)
Player-visible discovery of a sealed boss/miniboss gate is map progress but **not automatic entry**. On first sighting, record the gate's location; show it as **seen / key sealed** without exposing arena details beyond what has been observed. Regular unattended discovery defaults can log it and maintain the itinerary. Key acquisition, first unlock and deliberate encounter engagement remain separate. Known gate does not imply known route behind it. Distinguish visual encounter fog from persistent exploration fog in map legend. See `21`.

## Workshop 13 — Distinguishing common and exceptional seals
Once discovered, ordinary sealed boss/miniboss gates may be labelled `Gate Key required` (universal resource; LOCKED). A rare authored special-boss gate may show `Special key required` (PROPOSED P16), revealing only the prerequisite type, not hidden arena geography or boss identity prematurely. Persistent discovery tracks gate location and prerequisite category; ordinary and exceptional gate opening remain one-time permanent world discoveries. Discovering either type never pauses automatically, spends inventory or commits an encounter.

## Workshop 14 — Key discoveries under persistent fog
L18 creates two discovery incentives: fixed authored key sources encourage exploring the unknown world; known repeatable trial landmarks reward mastery of already mapped routes. **Guaranteed key reward** means the source grants the promised universal key when genuinely reached/completed, not that the map can reveal an unseen chest, that first encounter automatically banks it, or that entering an unexplored region guarantees an immediate pickup. Permanent map information should distinguish `unseen source`, `rumoured objective`, `source discovered`, `unique source claimed`, and `repeatable trial available`.

A repeatable challenge should not reveal unexplored world topology, and its reward must be independent of random low-probability enemy drops. One-time discovered key sources remain claimed when their original key moves into a cache or is permanently lost under provisional cache rules; challenge replenishment protects campaign progress. Source difficulty and content are not yet locked.

## Workshop 15 — Discovery does not equal eligible Gate Key (L19)
A one-time key discovery reveals a resource and can award the fresh key when its conditions are met, but does **not** bank or activate it. A newly found key may be shown on the fog-of-war map/Chronicle as `Carried — extract to camp`; it does not make a sealed gate traversable during the same run. Map discovery, visiting a sanctuary and uncovering a gate never replace the deliberate later key-equipped expedition. The persistent source claim flag survives loss; an accessible repeatable replenishment source still protects campaign progress.
