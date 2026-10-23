# Asset provenance and editability
All character geometry, rigs, poses, broad-plane materials, environment vector paint and effects in this milestone are original project-authored assets generated from the checked-in Python/SVG masters. No external images, fonts, model packs or proprietary art were used. Asset authorship: Codex implementation for Idle Souls. Assets in this directory are dedicated under CC0-1.0 for unrestricted project reuse; this grant does not change the repository's code/document licence.

Characters: `characters/source/*.blend` retain meshes, bone rigs, named actions, shared camera, physical light references and equipment hand labels. `tools/blender/export.py` regenerates them and transparent source frames. Runtime PNG atlases and JSON preserve the complete render preset, source, phase, trim and ground pivot metadata.

Environment: `environments/source/*.svg` have editable named underpainting, plane, wear, crack, shadow and accent groups. Open in Inkscape or import as paint layers into Krita. `tools/environment/export.py` is the deterministic construction/export master. Runtime props/collision notes are separate JSON. VFX have separate named SVG masters and PNGs.

No artist approval, three-viewer recognition test, commercial visual-direction lock, or physical phone performance result is implied by provenance.
