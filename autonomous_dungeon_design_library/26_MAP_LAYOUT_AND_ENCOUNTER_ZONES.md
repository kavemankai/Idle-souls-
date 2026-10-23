# 26 — Map Layout, Encounter Zones, Dimensions and Route Coverage
**Status:** PROPOSED working layout; creator has not approved coordinates, dimensions, or roster balance.
**Source:** Current `combat-sim.js` scale (30 Hz, player r13 and speed 2.5/tick, dodge 92, arena diameter 460), existing design library locks, and Workshop 18 proposed roster.

This module is intended as a **physical world/encounter specification**, not a replacement tactical AI. The files `vertical_slice_room_schedule.csv`, `vertical_slice_connections.csv`, `vertical_slice_map_blueprint.png` and `.svg` are included in the release package; consult them for coordinates, sizes and connectivity.

## Region and room schedule
The horizontal world bounding box is about 5,120 units; vertical about 3,584. One planning/editor grid unit is **32 simulation units**. Spatial extents are sketched, not final collision geometry; the five broad locations are Camp, Old Road, Watchtower, Sunken Passage and Forgotten Crypt, with miniboss, major boss, trial and secret pockets.

| ID | Location | Center (x,y) | Clear combat floor (w×h) | Candidate threat |
|---|---|---|---|---|
| C0 | Camp | (400,1800) | 500×480 | None |
| O1 | Outer Road | (950,1750) | 480×440 | 1 Mireling |
| O2 | Crossroads | (1450,1700) | 540×480 | Mireling / Sentry solo |
| O3 | Broken Causeway | (1450,2150) | 500×400 | Ashen Sentry / 2 Mirelings |
| KT | Key Trial Watchpost | (980,2170) | 500×420 | 3 staged enemies/waves |
| T1 | Tower Yard | (2030,1120) | 520×480 | Harrier solo / Sentry |
| T2 | Tower Barracks | (2600,920) | 560×520 | Sentry + Harrier (telegraphed) |
| T3 | High Gallery | (2460,490) | 500×360 | Harrier + Mireling optional |
| MB | Bell Warden | (3480,600) | 720×700 | Bell Warden |
| S1 | Sludge Ford | (2100,2760) | 540×480 | Silt Spitter solo |
| S2 | Broken Pump | (2750,2780) | 620×520 | Mudjaw Brute solo |
| S3 | Low Gallery | (2540,3260) | 520×380 | Spitter / Grunt escort |
| K1 | Crypt Threshold | (3360,2180) | 560×540 | Sentry + Spitter staged |
| K2 | Ossuary | (3900,1870) | 560×520 | Crypt Duelist solo |
| K3 | Upper Crypt | (3800,1320) | 520×360 | Duelist / Harrier + Sentry |
| B1 | Siltbound Castellan | (4720,1880) | 740×740 | Siltbound Castellan |
| SB | Unmoored Surveyor | (4540,640) | 740×720 | Unmoored Surveyor |


## Collision and cover rules
- Current simulated benchmark is a circular radius-230 field. Clear usable rooms should be >=460 units across when testing comparable fight patterns. Some narrow travel rooms may be smaller, but DO NOT benchmark regular multi-enemy fights in them before wall-aware combat AI exists.
- Corridors intended for combat must be 160–224 units wide, permitting movement around a radius-13 adventurer and radius-18-to-24 Brute. Initial spawn-to-enemy separation >=110 units, subject to tests.
- A 92-unit dodge cannot phase through walls, locked gates, forbidden regions or boss arena boundaries. Projectile and hazard collision must share the world collision map.
- Standalone arena is 460 diameter, but bosses require >=700 clear units for attacks with radius ~140 and multiple active lanes. Check safe pocket reachability in every boss attack pattern.
- Treat connections as transitions, not teleport nodes. A physical path must be traced between adjoining doors, with spatially obvious territory boundaries and a route home.

## Optional features vs approved locks
The Warden first-clear bypass T2→K2 and the S3→C0 sluice shortcut are proposed permanent world benefits. The main boss opening a downstream region aligns with locked permanent first-clear progress. Special optional boss-key implementation is still a proposal; standard fog gate prices are locked to one previously banked and carried universal key.

## Failure modes to test
- A pursuit enters a doorway: enemies remain region-bound and do not teleport/forget line-of-sight immediately.
- Two pursuers arrive from separate rooms: no instant offscreen hits and a legal retreat path exists if not explicitly prohibited.
- Player prohibited a region: even to save its life the adventurer cannot intentionally cross it. No fallback objective selection silently changes route exclusions.
- Newly found key adjacent to gate: key ineligible until extracted and banked; player gets clear explanation.
- Spitter hazard overlaps doorway or boss channel covers all ground: reject placement/attack scheduling as unfair.
- Sanctuary nearby: it restores limited supplies only, never banks gathered keys or other rewards.
