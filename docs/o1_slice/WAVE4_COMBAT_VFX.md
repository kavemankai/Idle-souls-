# O1 combat VFX: render-only defence and contact indicators

Six editable original SVG masters, each exported to a transparent 192×192 PNG: contact, stagger, dodge, block, parry and perfect block. These are new art proofs, not final style approval. Rasters are regenerated using `npm run assets:vfx`.

O1 presentation anchors short effects to genuine simulator state: fighter `flash`, `stagger`, movement `dodge` and successful defence-total increments. `parry`, `perfect` and `block` cues mean the simulator confirmed that outcome, *not* merely that the fighter has a guard pose. The original workbench may still show its labelled sample guard spark; O1 no longer fabricates one for a raised shield. Visual effects neither alter nor produce damage, parry windows, invulnerability, geometry, resource values, AI, camera or event timing.

The renderer keeps effects restrained and hides the additional cue when Reduced FX is selected. Dodge trails communicate motion, not precise iframe duration. Current cue priorities allow one latest effect per actor; a later art pass may add simultaneous layering if visually justified. No unsupported audio exists yet.

Verification: SVG/Png contract test, TS/lint/build, actual captured fight and phone readability, combat-event timing review and human approval. Death sprites are supplied by the prerequisite Wave 3 PR #10.
