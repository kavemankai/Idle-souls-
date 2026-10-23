# 18 — Art, Audio and Presentation Direction
**Owner:** Visual/audio identity  
**Status:** Primary art direction remains OPEN; detailed **Ashen Reliquary** candidate specified in 28 (PROPOSED)

## Direction constraints
The game is top-down **2D**. The player observes one sword-and-shield adventurer in a visually coherent, large ruined world. Visuals must make routes, doors, fog, enemy intent, combat affordances and important discoveries legible at mobile size. Do not imitate a specific game's map, creature designs, UI art or lore; references discussed in workshop were shorthand for feeling, not instructions to copy.

## Candidate aesthetic directions (historical alternatives; remain OPEN)
- **Living Atlas:** authored miniature environments paired with an old expedition chart; route lines, landmarks and lost caches become the iconic look.
- **Flooded Ruins:** stone, submerged crossings and luminous ecology; environmental contrast indicates risk and region identity.
- **Broken Expanse:** abandoned settlements, weathered structures and uncanny remnants; strong distinct silhouettes and unusual ecology.

These can be combined at the interface level, but pick one primary art bible before mass-producing assets. **The final visual style is not yet approved**; technical art production and camera projection are already locked by L22 and L23.

## Visual hierarchy
Primary: controllable-by-plan adventurer, current enemies/hazards, navigable bounds. Secondary: doors, shortcuts, important interactables and sanctuary. Tertiary: decorative props and ambient detail. Fog of war must never confuse unknown solid terrain with walked space. Enemy detection/search should have clear silhouette and minimal unobtrusive cues; color alone insufficient.

## Sword-and-shield readability
Attacking vs guarding vs disengaging should have unmistakable poses. A player watching at speed must tell whether guard failed, stamina exhausted or a heavy strike demanded movement, without parsing tiny numbers. The separate combat session specifies animation/readability needs; this art document receives that contract.

## Regional art language
Old Road: legible pathways and low threat clutter. Watchtower: sightlines, elevated ranged positions. Sunken Passage: narrow approaches and environmental hindrance. Forgotten Crypt: layered loops, unusual landmarks. Guardian Arena: clean combat read, obvious entry/exit and optional rematch activator after victory. Environmental themes are working examples, not locked fiction.

## Audio roles
Distinctive but restrained exploration ambience; audible enemy awareness escalation; shield impacts, guard stress, footsteps, item pickup, shortcut activation, sanctuary quiet, boss-phase cue, retreat confirmation, bank success and death report. Critical cues must have visual equivalents; no player should depend on listening to win.

## Presentation pacing
Camera follows adventurer but offers map overlay and contextual zoom. Avoid screen shake overload, high flash frequency and over-detailed particles that obscure threat telegraphs. On known safe travel, allow accelerated playback without distorting music/feedback obnoxiously. Art should support original emotional arc: lonely departure, uncertainty, discovery, difficult escape, earned arrival home.

## Asset planning categories
Character motion/gear poses; enemy role variants; boss animations; terrain tiles and collision layers; region props and interactables; map symbols and route lines; fog/shadow states; HUD icons; effects; ambience/music; event sounds; title/menu/Chronicle layout. Every gameplay-significant symbol needs a high-contrast readable state.

## Art acceptance
Before committing to large asset generation, test one complete encounter in a narrow corridor and one open arena at realistic phone scale. If threat cues, map lines, shield position or loot icons are unclear, correct the art system first. Visual polish must not hide the simulation's reasoning.


## Workshop 20 — Full proposed visual bible (2026-10-23)
The creator selected **A: write the full visual style and art-direction document**. This does **not** formally lock the proposed style. `28_VISUAL_STYLE_AND_ART_DIRECTION.md` now owns a full candidate **Ashen Reliquary** art bible (painted miniature dark fantasy), including palettes, region treatments, actor silhouettes, 2D camera/scale, collision-versus-presentation rules, combat telegraph grammar, Gate Key/fog-gate/sanctuary states, mobile UX, animation briefs, asset production and art acceptance. Keep this file as cross-discipline art/audio overview; document 28 becomes the proposed source for detailed visual specifications.

Neither the prototype title *Ashen Expedition* nor the working art codename *Ashen Reliquary* is a creator-approved final title. Gameplay locks L01–L21 are unchanged.


## v0.14 art-workstream note
Detailed candidate world visual direction is `28`; proposed P0 Old Road art-production and approval gate is `29`, with an itemised asset manifest `29A` and tests `29B`. Neither document locks style or replaces the independently developed combat simulation. Audio direction remains independent and open to later workshop.

## Workshop 22 — LOCKED hybrid sprite production (L22; 2026-10-23)
Creator explicitly locked **Option C**: build/rig/animate characters in Blender, render them to 2D sprites, pair with hand-painted 2D environment and VFX. This is an **asset-authoring/workflow decision**, not approval of the candidate Ashen Reliquary style (P18/O15), not a switch to 3D gameplay, not a new engine lock, and not permission to change original combat simulation. `30` owns production/export/camera/atlas proposals; `29` owns first P0 validation scene. Old artwork directions remain historical alternatives until creator selection.

## Workshop 23 — Fixed orthographic 75° character camera (L23)
The creator locked a **Blender character sprite camera of approximately 75° above horizontal (15° from overhead), orthographic, constant across actors**. This is an **asset render-camera requirement**, not perspective world navigation. Paint environment and VFX separately in 2D under L22. Keep original combat AI authority, grounded feet pivots, and truthful blocked/visible map semantics. See `31` (full modelling/render standard), `31A` (shot list), `31B` (source manifest). **Ashen Reliquary aesthetic P18 remains only a candidate.**

## Locked sprite-facing strategy, Workshop 24
L24 requires eight compass-facing locomotion/guard sprites and selective per-attack headings (with full eight-heading validation). P18 Ashen Reliquary visuals are still proposed. Character export documentation source: `30`, `31`, `32`; 75° orthographic camera remains L23.
