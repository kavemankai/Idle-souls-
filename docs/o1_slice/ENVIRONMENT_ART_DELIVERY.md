# O1 environment P0 — wall returns, doorway caps, threshold (proof)

Source asset needs: `docs/o1_slice/ASSET_NEEDS.md`.

Five independently authored SVG/PNG texture masters replace misleading rotated wall lighting and procedural endpoints:
- `wall-return-west`, `wall-return-east`: vertical stone courses with lighting authored for that face.
- `doorway-jamb-west`, `doorway-jamb-east`: weathered stone end caps on the blocked outer ends of the 174-unit doorway.
- `endpoint-threshold`: an amber, non-blocking vertical route marker, not a magical gate or extraction objective.

The room geometry and A* pathfinding remain in `combat/rooms/o1.json`, untouched.
Doorway cap placements stay outside the traversable opening. Cutaway walls and fog-of-war remain separate optional visual tasks, not secretly implemented.

Masters live in `assets/environments/source/`; runtime PNGs in `assets/environments/runtime/`. They are regenerated via `python tools/environment/export_o1_additions.py`, called by `npm run assets:environment`. The branch's GitHub Actions workflow validates and commits PNGs. Actual phone readability, painterly approval and artist QA remain pending.
