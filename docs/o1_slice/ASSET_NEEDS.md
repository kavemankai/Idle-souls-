# Assets the O1 slice needs

Measured against `?scene=o1`: 600 fights (Mireling and Sentry, three doctrines, 100 seeds each, level 80 balanced) were played headless through the real controller and adapter. 627,971 drawn actor frames were checked against the runtime atlases. 60,456 of them (9.6%) asked for a clip that does not exist and fell back to idle. Priorities follow `29A_OLD_ROAD_ART_ASSET_MANIFEST.csv`. Nothing here is approved art; all of it follows L22 (Blender to 2D), L23 (fixed +75 degree camera) and L24 (eight-way locomotion and guard, selective attacks, no mirroring).

## 1. Character clips the slice already requests and does not have

Counts are fallback frames out of the 600 fights. The simulator decides which clip is needed, so these are the real gaps.

| Actor | Clip | Missing facings | Fallback frames | Note |
| --- | --- | --- | --- | --- |
| Sentry | light (sword slash) | NW, SE, W | 17,379 | Authored: N, NE, E, S, SW |
| Adventurer | light | NW, SE, W | 14,324 | Authored: N, NE, E, S, SW |
| Sentry | reaction (stagger) | all 8 | 14,129 | No clip at all |
| Adventurer | reaction (stagger, defeat pose) | NW, SE, W | 4,946 | Authored: N, NE, E, S, SW |
| Mireling | light (bite) | all 8 | 3,443 | Only the leap exists; the bite needs its own clip |
| Sentry | bash | NW, SE, W | 2,501 | Authored: N, NE, E, S, SW |
| Mireling | reaction (stagger) | all 8 | 2,282 | No clip at all |
| Adventurer | dodge | NW, SE, W | 1,452 | Authored: N, NE, E, S, SW |

Facing note: W, NW and SE are the three attack headings that were left out of the selective set. They are the most frequent gap because the slice runs west to east and the enemies sit east, so fights face W often. Asymmetric gear means these cannot be mirrored from E, NE and SW.

Also needed, not yet requested by the slice but visible as a hole:
- Enemy defeat (Mireling, Sentry). A dead enemy currently disappears. P0 in the manifest (`ROAD_CHAR_SENTRY_DEATH`, `ROAD_CHAR_MIRELING_HIT` with collapse).
- Adventurer death (`GLOBAL_CHAR_ADVENTURER_DEATH`). A defeated run currently holds the stagger pose.
- Sentry guard stance exists (8 facings). Sentry riposte (counter) currently reuses the slash clip.
- Adventurer parry and block contact poses (the slice maps both to guard).

Already authored and in use, no change needed: adventurer idle, walk, guard (8 each), heavy (8); sentry idle, walk, guard (8 each); mireling idle, walk, leap (8 each).

## 2. Environment pieces for the single O1 room

Present in `assets/environments/runtime`: earth, road underpaint, paving 0 to 5, moss, rubble, wall, pillar, marker, warm light.

- Wall corner, end cap and ruin variants (`ROAD_WALL_SOLID`). The slice paints every wall from one 114x57 sprite, rotated 90 degrees for the west and east returns. A rotated sprite changes the light direction, so proper vertical-return pieces are needed.
- West doorway frame (campward) and east doorway frame (slice endpoint) (`ROAD_DOOR_CAMP`, `ROAD_DOOR_CROSSROADS`). The openings are 174 wide with no frame art today.
- A dedicated slice-endpoint threshold marker. The current one is a drawn line and a text label. It must read as an edge of the slice, not a gate, and show no O2 room.
- Ground transition from ash dirt to paving, crack decals, a wider paving edge set (`ROAD_GROUND_TRANSITION`, `ROAD_GROUND_CRACK`).
- Contact shadows for adventurer, small enemy (Mireling), medium enemy (Sentry) and the pillar. Today these are procedural ellipses.
- Wall cutaway or translucent variant (`ROAD_WALL_CUTAWAY`) if the south wall is to stop hiding actors near it.
- Fog or unknown-edge vignette (`ROAD_FOG_BOUNDARY`), only if the east side should fade out.

## 3. Combat feedback VFX

Present: slash, heavy, impact, landing.
- Block contact spark (`GLOBAL_FX_BLOCK`), dodge trail (`GLOBAL_FX_DODGE`), stagger cue (`GLOBAL_FX_STAGGER`), heavy and guard-break warning wedge (`GLOBAL_FX_HEAVY_WARN`).
- Parry deflect flash and perfect-block flash. The simulator reports both.
- Hit flash for the enemy and the adventurer. The simulator exposes a `flash` timer that the presentation does not use yet.
- Enemy detection cue (a short "noticed you" mark) for the moment the controller hands over to the simulator. It must not show the cone as a gameplay hint unless that is decided.

## 4. Interface

- The HUD is DOM text and buttons. Needed: a health bar, an enemy health bar, a route and state strip (ready, travelling, fighting, completed, defeated, unresolved) and a result card, as drawn assets or an agreed CSS style.
- Icons for dispatch, speed, solids view and visual-study link (currently text only).
- Result art or wording for the three outcomes. No rewards, extraction or retreat art belongs in this slice.
- Font decision. The study uses Georgia and Arial as stand-ins.
- Touch targets are 44 px and verified in software captures only. Real-device touch review is still open.

## 5. Audio

None exists in the repository. A slice with fights needs, at minimum:
- Footsteps on paving (adventurer, Mireling skitter, Sentry tread).
- Sword light and heavy swing and hit, shield block, perfect block, guard break, parry.
- Mireling bite and leap, Sentry slash and shield bash.
- Dodge, stagger, enemy defeat, adventurer defeat.
- Detection sting, slice-endpoint reached tone.
- Road ambience loop (quiet, ruined) and low music bed if wanted.
- Sync points come from simulator events (`SimFight.events` kinds good, bad, neutral, end), not from animation timing.

## 6. Data and tooling the art side needs from the slice

- Animation timings per move, from `MOVES` in `combat/deep-stats/combat-sim.js` (windup, active, recovery in 30 Hz ticks). Example: Mireling bite 8, 3, 12; Sentry slash 13, 4, 18; Sentry bash 10, 3, 14. Clips must be cut to these phases, not the other way round.
- Body radii for collision proxies: adventurer 13, Mireling 9, Sentry 13, pillar 27 (trial values).
- The exact facing the slice requests per frame is already recorded in `window.__O1_STATE__.missing` and listed in the HUD. After new clips land, re-run `npx tsx tools/capture-o1.ts` and check that list is empty.

## Suggested order

1. Sentry light, adventurer light and reaction at W, NW, SE (about 36,000 fallback frames, the most visible gap).
2. Sentry and Mireling reaction, Mireling bite (about 20,000).
3. Enemy and adventurer defeat clips.
4. Doorway frames, vertical wall returns, endpoint marker.
5. Combat feedback VFX, then audio, then interface art.
