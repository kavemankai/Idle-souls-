# 06 — Enemy Ecology and Encounter Generation
**Owner:** World encounter design  
**Status:** Living encounters with region identity LOCKED; content/tuning PROPOSED

## Objective
Make a fixed world feel alive without producing arbitrary encounters. Geography and enemy *territorial identity* are stable; group membership, starting positions, schedules, nonunique supplies and temporary conditions vary per expedition. Avoid an invisible difficulty director that spawns threats whenever the player is succeeding.

## Prototype role roster (mechanical placeholders)
| Role | World function | Sword/shield problem | Proposed region |
|---|---|---|---|
| Stalker | Mobile patroller | Flanks and tests stamina | Old Road |
| Breaker | Heavy territorial guard | Punishes indiscriminate blocking | Sunken Passage |
| Harrier | Ranged sentry | Tests cover and target priority | Watchtower |
| Warden | Optional elite | Combines threats, guards rare opportunity | Crypt |
| Guardian | Authored boss | Multi-phase expedition milestone | Boss arena |

Names and visuals are placeholders; no requirement to emulate any existing IP. Combat micro-behaviors belong to combat AI owner; here only encounter roles, geography and combinations are defined.

## Region encounter template
Each region defines allowed roles, a finite population budget, routes/patrol anchors, guarding locations, sightlines, acoustic links, encounter grouping constraints, rest/safe zones and one or more optional event slots. The encounter selector samples **before or at controlled region entry**, not endlessly while the adventurer is performing well. Ordinary defeated enemies do not instantly respawn during the same expedition.

## Layered variation
1. **Fixed authoring:** identity, chokepoints, geography, baseline difficulty and enemy role pool.
2. **Run setup:** patrol group selection, start anchors, temporary weather and finite resource placement.
3. **Live simulation:** patrol movement, sound investigation, line-of-sight detection, pursuit and retreat within territory.

A normal route may be quiet, reinforced by permitted groups, or obscured by a temporary condition; it should still feel recognizably like the same region.

## Group composition constraints
Avoid creating unavoidable openings where several heavy/fast/ranged roles guarantee death before reaction. Early encounters teach one mechanic at a time; later corridors combine two roles if terrain supports meaningful response. Encounters should be authored or sampled from curated combinations, not unconstrained enemy soup. Elite guards can be avoided, observed or attacked depending on objective.

## Ecological plausibility
Patrol groups move between plausible posts. Guards defend gates or valuables. Suspicious foes investigate plausible nearby sounds. Some NPC presence may imply past activity or temporary world events, but do not build breeding, food chains, economy or other complex ecosystem simulation for first build.

## Encounter scarcity and farming
An enemy gives combat rewards when defeated, not repeatedly when re-engaged. A killed group remains absent for the remainder of the expedition. Encounter budgets cap renewable gold/XP and make repeated safe loops less profitable than deeper risks. If returning to a region in a **new expedition**, ordinary groups may refresh from its eligible pool; defeated main-world bosses never refresh.

## Temporary conditions
Dense mist (changes detection), slippery floor/flooding (changes path risk but not permanent topology), quieter patrol, reinforced sentries, guarded resource opportunity. Conditions should be announced through visual/environmental evidence. A condition must not soft-lock access to camp or produce fully hidden fatal obstacles.

## Fairness rules
No spontaneous spawn in camera view near the adventurer; no random unavoidable lethal ambush; no automatic level-scaling to current player; no enemy resurrected on breaking pursuit; no elite spawned into already-secured camp; no main-world boss restoration. Enemy strength belongs to geography/encounter class and is telegraphed.

## Future expansion
Add unique faction relationships, changing occupation patterns and rare roaming threats only after basic territory + pursuit is robust. World changes from permanent boss defeat may alter **allowed region groups** in authored ways but must not invalidate existing discoveries.

## Acceptance tests
Run same known route multiple times: encounters vary but region identity remains stable. Eliminated enemies stay gone during current run; changed expedition can repopulate ordinary foes. Identical player decisions under differing clear conditions have explainably different results, not unlogged RNG lethality.

## Workshop 18 — Specific slice enemy roster (PROPOSED)
The mechanical placeholder Stalker/Breaker/Harrier/Warden/Guardian roster is refined, **not retroactively locked**, in `25_VERTICAL_SLICE_ENEMY_BOSS_ROSTER_AND_LEVEL_CURVE.md`. Proposed content: E01 Mireling (small/fast/melee), E02 Ashen Sentry (medium/medium/melee), E03 Tower Harrier (medium/medium/ranged), E04 Mudjaw Brute (big/slow/melee), E05 Silt Spitter (small/slow/ranged), E06 Crypt Duelist (medium/fast/melee); MB01 Bell Warden, B01 Siltbound Castellan, optional SB01 Unmoored Surveyor. Enemy combat AI specifics live in separate workstream. Fixed authored regional threat bands; no level-scaling of ordinary enemies.
