# O1 visual assets — wave 2: Sentry and Mireling reactions and bite

This change depends on wave 1: [PR #4](https://github.com/kavemankai/Idle-souls-/pull/4). Its branch is the pull request base until wave 1 merges.

## Authored delivery

- Sentry reaction: **8** distinct direction renders, one stagger pose per compass heading.
- Mireling bite (`light` in O1 adapter): **24** frames, eight directions × windup/active/recovery.
- Mireling reaction: **8** distinct direction renders, one stagger pose per compass heading.
- Total: **40** new frames; expected **408** character frames including wave 1.
- These gaps contributed **19,854** of the historical **60,456** missing-frame requests. This is *expected* reduction, not a post-render measurement.
- No change to combat moves, player control, simulation tick timing, AI, geometry or equipment handedness.

The new actions are added *in place* to `sentry.blend` and `mireling.blend` using `tools/blender/add_o1_actions.py`. It does not rebuild either rig or overwrite existing action keys. The CI run saves source rigs, recalculates atlases and commits both to the same branch after technical tests. The Blender export camera stays fixed at 75°.

## Acceptance

1. Verify all 8 head directions in `sentry__reaction`, `mireling__reaction` and all three `mireling__light` phases. Confirm correct mesh anchoring and no silhouette clipping.
2. Pass atlas pixel/extrusion checks, geometry-bone validation, TypeScript tests and production build.
3. Run the 600-fight measurement again. The combined waves *could* eliminate 60,456 historic fallbacks but that must be measured; do not state zero until proven.
4. Review on actual phone, and ensure bite active phase matches simulator rather than altering its 8/3/12 tick windows.
5. Defeat poses, additional attack/parry distinctions, world props, VFX, UI and audio remain open.

The Ashen Reliquary visual direction remains proposed; these are technical proof assets, not final creator-approved paintings.
