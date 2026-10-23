# 02 — World Topology and Persistence
**Owner:** World design  
**Status:** Stable interconnected geography and persistent map LOCKED; exact layout PROPOSED

## World model
A fixed, top-down 2D world is divided into recognizable regions joined by corridors, gates, outdoor trails, lifts or other authored passages. Its topology must provide loops: travelling from A to B need not require backtracking along the identical path once shortcuts are opened. Geography is always valid across expeditions; it is **not rerolled** between runs.

The world can be streamed, segmented or built room-by-room at production time; players perceive one coherent place with persistent connectivity, not a level-select collection. Regions have a stable danger identity, distinct environmental constraints, landmarks and one or more access transitions.

## World state categories
| Element | Persistence | Rule |
|---|---|---|
| Terrain, room shapes, walls | Permanent | Remain navigationally consistent |
| Fog already revealed | Permanent | Never re-hidden after death |
| Shortcut gates opened | Permanent | Usable on future expeditions |
| Boss first defeat | Permanent | Boss does not reappear in ordinary world |
| Boss-triggered alteration | Permanent | Alters authored connection/access states |
| Ordinary enemy presence | Per-expedition | Re-seeded within regional encounter rules |
| Patrol position and local noise | Live | Changes during a run, no cross-run grudge |
| Weather, fog, temporary hazard | Per-expedition | Changes tactics, not base geography |
| Nonunique loot and supplies | Per-expedition | Finite per run within region budget |
| Unique treasures | Permanent flag | Do not duplicate after extraction |

## Proposed first region network
**Camp ↔ Old Road ↔ Watchtower ↔ Forgotten Crypt ↔ Guardian Arena**, with **Sunken Passage** forming a dangerous alternative link between Old Road/Watchtower and deeper approaches. A discoverable shortcut loops back toward Camp or Old Road. Final geometry is OPEN; this is an interaction requirement, not a mandated map illustration.

Minimum topology tests:
- Two meaningfully different routes can reach one objective after a shortcut unlock.
- At least one route is safer but longer, and another shorter but more dangerous.
- At least one major discovery turns an impractical route into an attractive future expedition.
- Every legitimate return destination has an authored traversable path; trap scenarios are explicit hazards, not geometry bugs.

## Region contracts
Each region specifies: entrances/exits; discoverable connections; territory limits for enemies; landmarks; base threat profile; ordinary encounter budget; temporary-condition pool; sanctuary availability; boss or elite presence; unique rewards; map reveal thresholds and alternate route opportunities. An editor/content checklist should reject a region with unlinked exits or inexplicable dead ends unless deliberately presented as such.

## Permanent boss world alterations
Boss victory can activate a water gate, clear a seal, restore a lift, lower an obstruction or open a route. First defeat is recorded **at the moment of victory**. The player may lose the boss's carried loot on the way home without reverting the world alteration. Boss arenas become normal traversable spaces after first defeat, optionally containing a clearly activated rematch feature.

## Shortcuts and access semantics
A connection has distinct states: unknown; discovered/not activated; accessible; blocked by a temporary condition; permanently disabled only by an authored story event, if ever. **Seeing a gate is not the same as opening it.** A temporary hazard cannot silently invalidate an unlocked permanent route indefinitely.

## Living-world variation
Normal patrols, minor encounters and short-lived conditions vary between expeditions inside stable limits. Variation may make the same route easier or harder, but it must not contradict permanent geography or resurrect a defeated main-world boss. Do not apply hidden difficulty scaling based solely on player success or level.

## Boundaries and extraction geography
Camp is the sole bank location for the prototype. A region border can end an enemy's pursuit only if the border is visually and mechanically understandable. Enemy territory borders are not necessarily the same as map loading boundaries. Sanctuaries are safe rest points, **not** banks or instant home portals.

## Content-authorship guardrails
Focus on memorable authored loops over huge raw area. Distinct tactical geometry—narrow approach, sightline, cover, flank corridor, raised walkway, alternate retreat path—should justify each branch. Avoid building a huge mostly empty map; an interlinked compact environment is a stronger first test.

## Verification scenarios
- New expedition loads with previously opened shortcut available and previously explored region visible.
- Death immediately after a boss defeat preserves boss-clear and world change.
- Ordinary enemies regenerate within allowed limits; unique treasure does not respawn after it is secured.
- Temporary weather does not close all extraction routes without warning or safe alternative.
- Rematch ends without overwriting the permanent boss-defeated flag.

## Workshop 12 — Fog-gate topology (LOCKED access principle; particulars PROPOSED)
A discovered major-boss or miniboss approach includes a **visible key-sealed fog gate**. Its map state is distinct from ordinary visibility fog and from an opened shortcut. A gate's topology node may be `unseen`, `seen-sealed`, `permanently-open`, with a **separate** encounter-clear flag. The gate cannot be traversed until its first one-time key unlock has validly committed. Opening a gate is permanent even if the adventurer dies before fighting or extracting; does not itself defeat the boss or bank rewards. Avoided regions remain forbidden even if connected through an open gate. See `21_FOG_GATES_KEYS_AND_COMMITMENT.md`.

## Workshop 13 — Campaign spine versus optional-key branches
LOCKED universal-key rule: all ordinary boss/miniboss fog gates draw from the same Gate Key class. PROPOSED exceptional special-key boss lives on a side branch, separate from the mandatory route graph. A world-layout review must show a legal chain of regions/ordinary Gate Key sources to the campaign ending **without** the special gate. If the optional boss reveals a shortcut, the original required route must remain independently traversable. Absolute player route exclusions still apply and may independently prevent an individual expedition from progressing; they do not justify making the authored default world dependent on special keys.

## Workshop 14 — Key source topology and softlock-proof regions
**L18:** the world contains guaranteed authored universal-key discoveries as well as challenging repeatable key opportunities. A designer must place at least one legitimate first-key source before the earliest mandatory fog gate and ensure the replenishment path is reachable from camp without consuming another unopened-gate key. Key-source dependencies may be nonlinear across regions, but must never form an unavoidable circular requirement (`must open Gate A to earn the key necessary to open Gate A`).

If the player spends all banked keys on optional standard minibosses, loses a carried key or has an older recovery cache replaced, main campaign access must remain *possible through play*. Repeatable routes can require strong execution and hazardous return journeys, not payment or arbitrary waiting. The player may explicitly ban the only currently known legal route (L13); in that case report `Key source blocked by your avoidance order` instead of teleporting, waiving it or delivering an emergency key.

Rare special-key optional bosses (P16) may live behind noncritical side passages only; no mandatory world spine, ending or universal replenishment route can depend on their unique keys. Reference `22` for reachability requirements.

## Workshop 15 — Gate Key first-use topology rule (L19)
A sealed fog gate stays non-traversable when approached with a newly acquired, unbanked Gate Key. The only gate opening route is a later expedition from camp with an eligible previously banked key physically carried and explicitly spent. This preserves fixed map geometry while making progression access dependent on completed extraction, not on hidden route scaling. Existing keyless-accessible authored/repeatable key sources prevent permanent economic softlocks; player-chosen absolute avoidance can still block their own route without being overridden.
