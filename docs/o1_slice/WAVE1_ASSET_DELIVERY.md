# O1 asset delivery — wave 1 (attack-heading coverage)

Source: [ASSET_NEEDS.md](ASSET_NEEDS.md). **This is a candidate art delivery, not art-direction approval or measured combat-quality acceptance.**

## Scope

Render **33 additional frames**, using the retained Blender 4.3.2 sources and original fixed +75° orthographic camera; yaw rotates the 3D actor, never the camera or bitmap.

| Actor | Clip | Added headings | Frames |
|---|---|---|---:|
| Adventurer | light | W / NW / SE | 9 |
| Adventurer | dodge | W / NW / SE | 3 |
| Adventurer | reaction | W / NW / SE | 3 |
| Sentry | light | W / NW / SE | 9 |
| Sentry | bash | W / NW / SE | 9 |
| **Total** | | | **33** |

Those missing headings were associated with **40,602 fallback frames** of **60,456 total** (67.2%) in the recorded 600-fight baseline. This is a historical *potential* reduction, not a newly measured result. It is not a guarantee of zero missing frames because the Sentry reaction and Mireling bite/reaction still need animations.

## Reproducible production

```sh
npm ci
python -m pip install -r tools/requirements.txt
npm run assets:characters
npm run assets:atlas
npm run assets:validate
blender -b -t 4 --python tools/blender/validate.py
npm run assets:reproduce
npm test
npm run build
```

The workflow `.github/workflows/render-o1-wave1.yml` runs these steps on branch `art/o1-attack-facings-wave1`, checks the official Blender release checksum, saves inspectable sprite/compass proof, and commits generated runtime sprites to that same branch **only after validations pass**. Existing editable `.blend` masters are retained; no geometry, combat values or timing were changed. Generated atlases and metadata should be reviewed before merge.

## Remaining QA gate

After the CI render is present, run a 600-fight missing-frame measurement using the same opponents/doctrines/seeds and compare with 60,456/627,971; verify attack and equipment handedness at all eight headings, event-aligned active phases, phone readability, pixel-exact atlas trim, and stable feet pivots. Never claim the baseline count improved until retested. Remaining priority: Sentry reaction, Mireling bite and reaction, then defeat poses and world/UI/VFX/audio.

## Guardrails

- L22 Blender model → transparent 2D atlas, L23 fixed 75° orthographic camera, L24 eight-direction locomotion/guard and selective per-attack coverage.
- No mirrored/rotated screen sprites, extrapolated combat hitboxes, fake new moves, or unapproved new art identity.
- Do not rebuild procedural source files with `assets:characters:rebuild`; that could overwrite hand-edited `.blend` masters.
