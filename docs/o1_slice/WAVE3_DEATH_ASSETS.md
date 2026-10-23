# O1 wave 3: death animation proof

Source: `docs/o1_slice/ASSET_NEEDS.md`. Adds 72 character frames: 3 keyed death poses × 8 true Blender model facings for Adventurer, Ashen Sentry, and Mireling; target 480 total frames. Saved editable Blender actions are added idempotently to the retained character masters; the camera remains fixed at +75° orthographic with no mirrored sprites.

Death state is read exclusively from the simulator's `dead`/HP state. Falling animation uses 140ms, 170ms and terminal held pose on a **render-only** clock, because O1's simulation stops ticking on defeat. Neither the renderer nor animator alters hitboxes, AI, HP, combat ticks or results. A dead enemy remains on the ground at its last simulator position after the surviving adventurer resumes travelling. The corpse is not loot, interaction or navigation collision.

The three poses, outlines, sword/shield handedness, anchoring, atlas clipping and phone readability require visual review. Testable sprite coverage does not establish final approved art. Any browser-vs-Node parity failures must be reported separately and never suppressed to claim combat correctness.
