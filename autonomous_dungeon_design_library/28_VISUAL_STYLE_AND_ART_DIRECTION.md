# 28 — Visual Style and Art Direction Bible
**Working art-direction codename:** ASHEN RELIQUARY  
**Game title:** Unlocked; *Ashen Expedition* is a separate working prototype title, not an approved final title.  
**Status:** **PROPOSED full visual specification — NOT a creator-locked style.** Creator requested this full document in Workshop 19; the proposed direction awaits explicit visual approval.  
**Applies to:** Standalone top-down 2D dungeon crawler, Phaser/TypeScript presentation prototype, potential RUN.world/web/PC/mobile outputs. Engine choice is an implementation recommendation, not an immutable design lock.  
**Source documents:** `18_ART_AUDIO_AND_PRESENTATION_DIRECTION.md`, `12_PLAYER_UX_AND_EXPEDITION_CHRONICLE.md`, `19_ONBOARDING_DIFFICULTY_AND_ACCESSIBILITY.md`, `25_VERTICAL_SLICE_ENEMY_BOSS_ROSTER_AND_LEVEL_CURVE.md`, `26_MAP_LAYOUT_AND_ENCOUNTER_ZONES.md`, and locked rules in `16_DECISIONS_AND_OPEN_QUESTIONS.md`.

## 0. Decision status and scope

The creator selected **Option A: write the full visual-style document**. This approves production of the specification, **not automatically the art direction itself**. The material below is a candidate production baseline requiring an explicit lock or a short visual comparison before mass asset production.

**Do not revise prior gameplay locks because of the art style.** The game remains a 2D top-down autonomous dungeon extraction RPG: the player plans expedition objectives and optional waypoints, watches one sword-and-shield adventurer, and relies on independent combat AI for tactical action. The player may absolutely prohibit routes, skip blocked ordinary objectives, extract to camp to bank goods, and approach key-sealed boss/miniboss gates that never begin combat accidentally. Sanctuaries restore but do not bank. Ordinary gates use one previously camp-banked Gate Key, and the prepared keyring holds at most two; gameplay logic is specified elsewhere.

**Implementation separation:** This is art direction, not source code, an AI combat rewrite, a promise of finished art, or approval of new lore. All dimensions and performance/readability thresholds here are **targets to test**; they are not verified measurements of the current Phaser prototype.

## 1. Art thesis

> **ASHEN RELIQUARY** — A hand-painted, top-down dark-fantasy world presented like a carefully crafted miniature diorama: ruined sacred and military architecture; rain-dark stone, ash, moss and silt; quiet human refuges; and rare, meaningful luminous relics. Atmosphere is restrained. Characters, routes, threats and autonomous decisions must remain instantly readable at game speed and on small displays.

**Three-word test:** *Ancient. Legible. Melancholy.*

**Player's emotional progression:** quiet preparation at camp → uncertain departure → observing intelligent movement → danger that can be read → surprising discovery → physical escape and earned relief → reflective Chronicle → renewed expedition.

**What makes this visual system specific to this game:** the character is an *observed decision-maker*, not a player-controlled cursor. A viewer must understand an adventurer approaching an archer, defending a heavy blow, deciding to retreat, avoiding a forbidden route, discovering an inaccessible gate, and making it back to camp—without needing to read a combat log every few seconds. The scenery must make those decisions visible.

### Five governing pillars
1. **Readability over surface detail.** Important silhouettes and telegraphs win every compositional conflict; beautiful texture that obscures attacks is defective art.
2. **Sacred ruin with military history.** Roads, watchworks, sluices, shrines, grave architecture and gates should feel related, not assembled from generic fantasy kits.
3. **Handmade miniature, not toy miniature.** Material planes and purposeful imperfections suggest a painted physical model; maintain gravitas and believable scale.
4. **Low-noise ground, high-signal interactions.** Floors and walls use quiet values; active combat, interactive gates, recoverable caches and sanctuaries have controlled visual emphasis.
5. **Melancholy rather than relentless horror.** Warm refuge and strange beauty give the player a reason to keep exploring. Avoid gore, heavy saturation and constant VFX chaos.

### Non-goals and protected exclusions
- Not pixel art, photorealism, high-gloss 3D, high-saturation mobile cartooning, or a visually noisy loot-filled ARPG.
- Not a copy of a named studio, film, game, illustrator, historical religious order or commercial IP; references must inform broad qualities, never recreated designs.
- No always-on screen-edge vignette so dark that enemies or map information disappear.
- No full-screen combat effects that obscure actor positions or safe lanes.
- No new playable weapon class implied by decorative mockups: the slice remains **sword and shield**.
- No UI animation, key glow or shrine visual may imply a gameplay permission the player has not granted.

## 2. Visual hierarchy and contrast budget

Order of recognition at a single glance:

| Tier | Information | Visual treatment | Must not be obscured by |
|---|---|---|---|
| 0 / immediate | Player, incoming strike, active hazard, open retreat vector, boss safe zone | Distinct silhouette, hard local edges, high luminance separation and shape cue | Fog sprites, floor cracks, labels, particles, decorative lights |
| 1 / current decision | Target enemy, health/guard/stamina stress, current order, combat/retreat status | Clear character pose and compact context indicator | Unimportant text or floating loot |
| 2 / strategic | Doors, forbidden regions, route/waypoint, fog gate, sanctuary, recoverable death cache | Consistent outlined symbols and state-specific map marks | Decorative carvings or ground stains |
| 3 / atmosphere | Floor cracks, candles, loose rubble, banners, vegetation, rain ripples | Low saturation and low-contrast detail clusters | Never competes with tier 0–2 |

**Contrast:** Aim for WCAG-style **4.5:1** minimum for ordinary interface text against its immediate panel, **3:1** for larger type and critical non-text indicators, measured in the actual final composite, not the source swatch. These are proposed accessibility targets, not a statement that the prototype currently meets them. Important world cues also use motion/shape/pattern labels, since their exact contrast varies with scene lighting.

**Visual density guidance:** In a typical combat viewport, reserve at least one uncluttered region around the protagonist and attack landing zones. Decorative cracks/pebbles should form patches rather than uniform pixel-level noise. Place dramatic debris against room edges; maintain playable center-space.

## 3. Camera, viewpoint and rendering contract

- **Projection:** true **2D top-down / slightly illustrative top-down**, not a tilted isometric camera. Walls may show short southern-facing elevations to imply height without changing movement geometry. All movement, attack cones, collision and map coordinates obey one overhead plane.
- **Reference world unit:** use the existing combat simulation's logical units, NOT a new game-physics scale. It currently uses an adventurer radius around 13, a 92-unit dodge and a 460-unit diameter test arena. Rendering maps simulation positions to screen pixels without changing hitboxes.
- **World planning grid:** current proposed map uses **32 simulation units** per cell. Visual terrain can break the square-grid silhouette through edge meshes, rubble and transition art, while collision remains authoritative.
- **Art export target:** author at **4 source pixels per simulation unit** as an *illustrative import convention* (a 32-unit terrain cell exports around 128×128 source pixels), retaining layered masters. Exact texture and atlas scale to be benchmarked on target devices before bulk production. Do not assume one source pixel equals one screen pixel.
- **Gameplay screen size:** after camera and responsive UI layout, target player visual diameter **approximately 42–64 actual displayed pixels** at representative mobile viewpoints. At different zoom levels, check that the weapon and shield remain separately visible. This is a visual legibility target, independent of combat collision radius.
- **Reference viewports to test:** desktop 1280×720 and 1920×1080; mobile portrait around 390×844 and mobile landscape around 844×390 CSS pixels. **Primary orientation remains OPEN**; do not hard-lock portrait/landscape based on an early preview.
- **Camera movement:** damped follow with modest look-ahead in navigation direction; minimal unpredictable camera rotation. During combat, keep protagonist, focused foe and imminent hazard on-screen if possible; reframe for boss arenas. No automatic cinematic zoom that hides the escape path.
- **Camera shake:** light on boss slams only, bounded to a few screen pixels at normal zoom; optional reduced motion/off toggle. A shield hit uses crisp local response over full-screen shake.
- **Lighting:** painted ambient shading with a few local warm or cold halos; sprites and telegraphs should not rely on GPU-only lighting to remain comprehensible. Phaser WebGL effects are optional enhancements and must have simple low-end fallbacks.
- **Parallax:** very restrained or absent in combat floors. The arena's perceived space must correspond to actual collision and pathfinding.

### Occlusion and collision matching
Terrain layers: ground → ground details/hazards → shadows (nonbinding) → actors/props with explicit ordering → overhangs/walls where appropriate → gameplay cues and labels. Render large overhangs translucent or cut away when the adventurer walks behind them. Decorative rubble must be visibly nonblocking; blocking pillars/walls must look solid. Avoid decorative gaps that appear traversable but are collision-blocked.

## 4. Working palette and colour script

All colours below are **proposed sRGB hex reference swatches**; validate contrast in composite scenes under lighting and colour-vision simulation. Colour names are role tokens; art may vary locally without changing their functions.

| Token | Hex | Intended role |
|---|---|---|
| Night Ink | `#142024` | Deep non-gameplay backdrop, map deep fog, dark UI |
| Cold Slate | `#34454B` | Major masonry shadow planes |
| Weathered Stone | `#6F7974` | Terrain midtones, ruin edge variation |
| Ash Linen | `#D8D4C6` | High-priority text, bone/limestone accents |
| Silt Umber | `#6E5848` | Soil, rotted wood, old dirt |
| Olive Moss | `#5B6956` | Damp vegetation and secondary ecological cues |
| Brass | `#B89458` | Rare relic fittings, key-gate identity, selective trim |
| Safe Ember | `#DAA56C` | Camp warmth, friendly fires, sanctuary nucleus |
| Spectral Cyan | `#87C3C4` | Unusual magic, survey marks, optional secret systems |
| Warning Orange | `#E19B5F` | Heavy-physical-attack telegraph; paired with stroke/symbol |
| Corruption Green | `#93B978` | Toxic-area warning; paired with hatch/particle language |
| Critical Vermilion | `#CE6654` | Irreversible/high danger and boss-critical signals; sparing |

**Colour governance:** Avoid overlapping warm safe-light glows and orange hazard overlays without non-colour distinction. Green may mean vegetation in the world, but never a hazard without an active stipple/hatch boundary. Cyan secret-boss effects must not be confused with confirmed paths on the map: map routes use stroke patterns and arrow direction as well as colour.

### Palette by region
| Region | Core light/materials | Small accent | Emotional job | Readability restriction |
|---|---|---|---|---|
| Camp | Warm ember, cloth, umber timber, soft stone | Brass and pale chalk | Safety, preparation, return | Bank and keyring readable; do not make camp so busy it resembles loot room |
| Old Road | Dry slate paving, ash dust, olive weeds | Muted warm sky light | First journey, manageable uncertainty | Broad path silhouette, first enemies readable on pale ground |
| Watchtower | Cold slate, black iron, washed timber | Distant pale daylight, brass | Exposure, archery, surveillance | Arrow origin/projectile remain visible against masonry |
| Sunken Passage | Teal-leaning slate, umber silt, wet algae | Small cold reflections; warning green | Oppression, heavy risk, bottlenecks | Wet sheen never masks toxic patches or navigable shore |
| Forgotten Crypt | Bone limestone, soot, dim brass, blue slate | Sparse sacred pale light | Solitude, ritual significance | Gate and sanctuary state never look identical |
| Bell Warden arena | Dark military stone, old bell bronze | Gold/amber ring pulses | Ritual force, air pressure | Radial waves remain distinct from static floor rings |
| Castellan arena | Dark ash slate, channel silt, rusted iron | Orange mechanical warning and cold flood edge | Heavy, architectural threat | Three weirs visible; always clearly indicate warning, active, safe |
| Secret pocket | Sparse neutral dark slate, map/compass etching | Spectral cyan and ivory | Uncanny expertise, optional mastery | Footstep traces readable without visually drawing fake navigable routes |

### Value grouping
Treat floors as the quietest field, walls as stronger framing planes, actors as sharper mid/high-contrast shapes, and active hazards as the clearest temporary local event. A grayscale pass is mandatory: attacks and player must be distinguishable without colour. Limit animated luminance accents to important gameplay events.

## 5. Environment art construction

### Material vocabulary
- **Stone:** broad irregular blocks with hand-broken edges; shallow cracks, not dense photo texture. Keep floor tiles desaturated and simplify near melee spaces.
- **Timber:** cold, split beams and old scaffolds; warmer in camp, bleached in Watchtower; no random bright highlights.
- **Metal:** oxidised iron, aged bronze/brass and deliberate wear at interaction points.
- **Water:** broad dark pools, soft ripple sheets and highly controlled specular strokes. Depth is communicated by edge bands and shore shape, never by a confusing full-screen blue overlay.
- **Moss:** clustered around drainage, cracks and low traffic areas. Never flood every floor cell with noise.
- **Ash/fog:** layered translucency at distance or low altitude; pull back instantly around current combat telegraphs and the avatar.
- **Cloth:** faded banners and functional adventurer cloth with colour restraint; motion distinguishes active bodies from props.

### Wall, floor and prop grammar
- **Walkable:** continuous floor field and legible connecting thresholds.
- **Blocked:** solid high-value edge and mass/shadow, clearly not just decorative paving.
- **Cover:** visibly occupies floor, readable height/occlusion, consistent with projectile blocking rules.
- **Hazard:** temporary animated cue with bold boundary and safe-space contrast, distinguishable from ambient wetness.
- **Interactable:** conspicuous authored focal object with readable interaction state; do not outline every prop.
- **Exit/door:** placed at geometrically coherent connection. If route is absolutely forbidden by player, add a clear barred-route overlay on both world map and immediate relevant doorway, never an invisible physical wall.

### Room composition rules
The 17-zone physical map and dimensions in `26` are **PROPOSED**. Maintain encounter-relevant clear floor: early rooms roughly 480–540×400–480 sim units, standard rooms 520–620×480–520, mini/main arenas ≥~700 across. Corridors 160–224 wide. Preserve dodging and flanking lanes and ensure projectile cover is intentional. Boss floor patterns must never take over entire arena with overlapping unreadable texture. Keep one recognisable landmark per combat zone; reduce repeated room silhouettes by varying approach angle and edge framing, not by filling floors with props.

## 6. Player character art bible

**Starter identity:** one readable sword-and-shield adventurer. Wear is utilitarian, not noble or heavily ornamented: weathered mail/leather/cloth, readable shield, modest travel cloak/tabard. A bright but muted edge on the shield differentiates guard posture from background.

### Silhouette contract
- Compact central mass and forward weight; asymmetric shield side and blade side visible at normal encounter zoom.
- Facial features may be simplified; avoid dependence on face-scale information at phone size.
- Direction is recognisable in **8-direction facing**, or equivalent smooth rotation with legible directional poses.
- Neutral, moving, guarding, light attack, heavy attack, dodge, stagger, hit, retreat/break contact, death and rest each have distinct key poses.
- Stamina stress is communicated through changing motion/guard quality and HUD, **not** by making combat collision unknowable.
- An optional cape/tabard is motion punctuation, not a large VFX that conceals sword or shield.

### Animation priority
1. Readable wind-up silhouette and facing.
2. Clear active contact moment and impact.
3. Noticeable recovery/commitment pose.
4. Movement and secondary cloth motion.

Combat timing remains controlled by the **existing deterministic simulation**. Animation is a presentation mapping onto move events and tick boundaries; do **not** adjust `windup`, `active`, `recovery`, hit arcs or iframes solely to fit an animation before discussing the trade-off with the combat AI workstream.

## 7. Enemy and boss silhouette briefs

All roster names are **PROPOSED** from document `25`; these descriptions should not become character model locks without creator approval. Size labels refer to combat collision classes; rendered silhouette may extend further for weapons and accessories.

| ID / role | Speed / size / range | Silhouette and movement motif | Required visual tell |
|---|---|---|---|
| E01 Mireling | Fast / small / melee | Low hooked body, restless segmented motion, low center | Coil then leap; readable launch direction |
| E02 Ashen Sentry | Medium / medium / melee | Upright short shield and worn blade, soldier stance | Blade shoulder pull; shield-side guard; bash impulse |
| E03 Tower Harrier | Medium / medium / ranged | Narrow upper mass; strong bow/launcher negative space | Aim line / raise weapon; visible projectile launch |
| E04 Mudjaw Brute | Slow / large / melee | Heavy sloped back, oversized maul-like limb, huge feet | Distinct overhead silhouette; long guard-break wind-up |
| E05 Silt Spitter | Slow / small / ranged | Low swollen throat, narrow nozzle/head silhouette | Head rearward then spit; ground hazard starts outlined |
| E06 Crypt Duelist | Fast / medium / melee | Thin blade, long split garment, sharply angled stance | Two-hit chain rhythm and clear sidestep exit |
| MB01 Bell Warden | Medium / large / radial + melee | Single memorable bell, old bronze and heavy tool | Ring draw-in / pulse expansion, second pulse in phase two |
| B01 Siltbound Castellan | Slow with bursts / large / melee + lanes | Monumental halberd silhouette and layered armour | Channel activation pose; directional wave; phase cue |
| SB01 Unmoored Surveyor | Fast / medium / melee + ranged marks | Surveying pole/compass geometry, sparse spectral trim | Discrete footprints; finite delayed line-trace activation |

### Rendering economy
Author one hero-grade player, one reference humanoid enemy, and one genuinely distinct small creature before scaling the roster. Common enemies share a material/rendering language, **not** identical silhouettes with palette swaps. Boss identity relies on weapon/prop and pose, not particle quantity. Prototype models should remain replaceable with higher-quality art without changes to attack or collision logic.

## 8. Attack telegraph and VFX specification

The combat AI has real move `windup`, `active`, `recovery`, range, arc, tracking and projectile timing. VFX subscribe to these mechanics and communicate truth; the art layer must never draw an attack landing zone that contradicts active hit geometry.

### Telegraph grammar
| Event | Shape/motion | Suggested value/colour | Accessibility redundancy |
|---|---|---|---|
| Standard light melee | Short directional crescent, restrained metal glint | Ash/steel white | Strong attacker pose and strike sound |
| Heavy melee / guard-break | Broad, solid-edged wedge or striking lane; slow swell | Warning orange | Thick outline + repeated chevron mark; unique heavy pose |
| Bow / linear projectile | Fine aiming vector or weapon tracking pose; visible projectile | Off-white or pale amber | Arrowhead/origin cue; line of fire distinct from map routes |
| Ground puddle | Closed irregular hazard outline; grows then remains patterned | Corruption green | Dot/stipple fill and animated edge |
| Bell Warden radial toll | Concentric rings expand from actual hit origin | Warm brass/ivory | Alternating dashed ring marks; obvious two-beat rhythm |
| Castellan channel | Long bounded floor stripe before activation, then active current | Orange warning → dark silt/current | Triple-hatch prewarn → animated directional ripple active |
| Secret Surveyor trace | Up to three footprint markers and links, resolved after countdown | Spectral cyan | Numbered glyphs 1–3 and dash direction; inactive vs active state |
| Block / perfect block | Small shield spark and compact recoil | Pale warm spark | Shield pose, contact shape and distinct sound |
| Dodge / invulnerability | Brief low-opacity motion smear, visible landing location | Neutral gray-blue | Motion arc + post-dodge planted pose |
| Stagger | Strong posture break and recoil | Desaturated flash / edge stroke | Actor pose persists enough to read |
| Retreat intent | Clear action status and route destination; not a dangerous aura | UI reserved neutral or amber | “RETREATING” text + map arrow |

### Telegraph timing contract
- **Wind-up:** cue begins when move begins or at a documented keyed point; recognizable before the damaging active frames.
- **Tracking cutoff:** cue freezes or otherwise truthfully indicates locked direction when simulation stops turning to track. No cinematic last-moment retarget misleading the viewer.
- **Active:** shape and contact line correlate with actual damaging region. Clear immediately after active time unless lingering hazard semantics say otherwise.
- **Recovery:** reduced clutter; actor animation makes counterattack opportunity apparent.
- **Failure states:** on stun, interrupt, death or cancellation, remove or abort attacks visually alongside simulation state.
- **Density budget:** in mixed groups, dim nonimminent threat decorations, **not genuine imminent hazards**; high-danger signals always remain independently legible.

### VFX restrictions
Avoid camera-anchored flashes for ordinary strikes; use character- and ground-anchored effects. No frequent bloom, full-screen particle fields, persistent blurry motion trails, or boss particle fog that hides the player's landing spot. Combat-screen shake is user-adjustable. Low-end fallback may replace additive effects with opaque sprite/line overlays but must preserve gameplay information.

## 9. Fog gates, Gate Keys and permanent world states

**Locked gameplay interface:** standard miniboss/major-boss fog gate costs exactly **one universal previously camp-banked and carried** Gate Key on first deliberately approved unlock; prepared keyring max two. Gate discovery/opening does **not** authorise combat. Key sources include guaranteed discoveries and repeatable replenishment. Special optional key remains a separate proposal. The art must reflect the state machine without suggesting a premature spend.

| Gate state | World treatment | Map treatment | Player message meaning |
|---|---|---|---|
| Unknown behind fog | No ghost outline unless genuinely observed | Unmapped dark mask | Unknown; no omniscience |
| Discovered and sealed | Carved iron/stone frame, dense still pale mist, closed sigil | Closed gate/lock icon | Known, cannot freely pass |
| Key held but not eligible (fresh unbanked) | Same sealed treatment | Lock remains | Key must first return to camp |
| Eligible prepared key available | Low-motion brass sigil response on nearby approach, no automatic opening | Sealed with eligible marker | May choose deliberate unlock; not already spent |
| Permanently unlocked, boss not engaged | Sigil broken, mist parted, floor beyond visible to allowed sightline | Permanent open-gate mark | Entrance available; fight still requires consent |
| Boss cleared normally | Weathered open gate/clear marker; world first-clear benefit | Cleared-boss marker | First-clear is persistent |
| Optional rematch selected | Separate trial sigil/device, distinct from ordinary travel | Rematch/challenge icon | Explicit challenge mode only |

**Gate Key icon:** big asymmetric ritual key with a distinctive dual-notch bow and inset pale stone; readable in monotone as a key, distinct from gold. Do not use a shape identical to a door handle or generic coin. A fresh key pickup and eligible keyring key can share silhouette but require **different labelled UI states**. Rare optional special key, if introduced later, may be an elaborate cousin, never an implied mandatory main-path requirement.

**Spending confirmation:** gating state visuals should support either in-person confirmation or named preauthorisation, because that exact interaction is OPEN; visual art may not hard-wire one.

## 10. Sanctuary, extraction, and death-cache language

**Sanctuary:** small, intentionally uncluttered circle of warm ivory/ember light around a weathered altar or brazier. Use clean ground, low particle count and a different focal shape than key gates. It can offer recovery/rare choices. **It never banks loot or keys.** Never show it as a vault, currency deposit or full expedition-completion icon.

**Camp and successful extraction:** distinct ordinary supply chest, route planning desk and safe-key storage. The banking visual should only play on **physical arrival at camp** and actual successful state transition, not whenever the player opens a map or sanctuary. Secure loot transitions visually from backpack at-risk to camp-secured.

**Death cache:** grounded satchel/reliquary remains, engraved with a broken-return mark and an unambiguous last-known position on the explored map. Mark that the resource is **recoverable but not banked**. Exact cache overwrite/replacement is still OPEN; the art should support unclaimed, retrieved, lost/unavailable states without implying persistence that the system does not guarantee.

**Route avoidance:** excluded region/connection uses a thick barred line and a repeated diagonal pattern on the planning map. In world view, only flag relevant immediate boundary/doorway with a compact barred-route indicator; do not erect a fictional physical forcefield. Combat AI must not voluntarily cross the barred boundary even on retreat.

**World changes:** first-clear opening shortcuts/draining channels should use visible before/after environmental states. These persist even if unbanked loot is lost. Fog-of-war states must separately distinguish *known*, *currently visible*, *last-known threat position*, *open shortcut* and *sealed gate*.

## 11. Exploration map and expedition UI style

### Art language
**Diegetic inspiration, modern usability.** Map reads as a field survey on weathered ink/charcoal paper; route lines are clean vector overlays. Panels use subtle slate, brass hairlines, ash-white type and restrained serif *display* headings paired with clear sans-serif body labels. Decorative frame flourishes may be used around important modal decisions, not every value field.

**Typography proposal:** a restrained high-quality serif for large headings; a legible humanist sans for HUD, objective lists and descriptions; a tabular-numeral face/setting for counts and time. Use freely licensed/embed-safe fonts for shipping; avoid reliance on online font downloads at runtime. No condensed tiny uppercase labels for crucial state.

### Camp planning screen
Hierarchy: world map → ordered itinerary and optional waypoints → excluded-route pattern → keyring preparation (0/1/2 banked eligible keys) → expedition risk/survival policy → Launch. Show `fresh unbanked`, `camp banked`, `eligible prepared`, and `spent` as named states. Risk is qualitative, not a fake percentage of survival.

### Observe expedition screen
**Always visible:** adventurer, threat cues, current objective, health/stamina, doctrine or active state, Retreat action. **Secondary:** healing count, unbanked loot/key indicator, route guidance and expandable event log. Prefer short reason text (“Blocking the archer”, “Avoiding forbidden bridge”, “Returning to camp”) rather than flashing algorithm details.

**On-device UI targets (proposed, to test):** touch hit targets ≥44×44 CSS pixels and separated enough to avoid adjacent accidental taps; critical status copy generally ≥16 CSS pixels at reference mobile layouts; compact secondary copy generally ≥14 when adequate contrast. Do not cover boss safe zones with panels. Ensure live retreat available without digging through a drawer. Users must be able to pause or turn off camera shake/flash and understand alerts without audio.

### Fog map legend and Chronicle
- Undiscovered: nearly dark with irregular field edge; no invented route preview through unknown space.
- Discovered, not currently observed: muted and outlined; old patrol sightings marked with age/staleness cue.
- Route preview: clean directional solid line along verified traversability; waypoints numbered.
- Avoided route: barred line plus diagonal pattern; hard exclusion semantics, not just risk preference.
- Locked gate: closed engraved icon; opened permanent shortcut: open-arch icon; boss cleared: distinct completion mark.
- Death cache: salvage emblem, not mistaken for banked chest.
- Chronicle: observed path trace, completed vs skipped objectives, camp-banked vs carried/lost resources and one concise explanatory reason. It should read like an expedition field report rather than a monetisation reward screen.

### Responsive composition policy
Desktop may use side panels. Mobile uses compact overlays and bottom drawers when they do not hide live hazard telegraphs. Orientation is **OPEN**: test both portrait and landscape with the exact same gameplay truth; allow only presentation differences. Avoid shrinking the world to fit a decorative UI frame.

## 12. Enemy awareness, intention and feedback

- **Passive:** no persistent glowing ring around every enemy. Light idle/route movement is enough.
- **Noticed / investigating:** brief head turn or alert chevron over enemy; limited timing/visibility and no omniscient display through walls.
- **Engaging:** target emphasis as a thin local outline/short marker, not a giant target circle over all hazards.
- **Searching:** last-known-position search in the world is signalled by a small searching motion/cue; map intelligence remains correctly historical.
- **Region return:** enemy resumes normal patrol after search as locked. Any UI label describing continuing “high alert” across expeditions would contradict the game's short-lived alert reset.
- **Player action reasons:** short readable in-world cue accompanied by a precise optional log. Damage-cause reports use the existing six-attribute error categories (late reaction, misread, commitment, stamina, dodge, surrounded, guardbreak, hesitation), not arbitrary new invented reasons.

## 13. Animation library and style timing

**Motion adjectives:** weighted, economical, directional, intelligible. Avoid hyperactive anime smears, constant squash-and-stretch, unbounded hit stop or floaty root motion. Actors can have subtle anticipation/exaggeration without changing underlying collision or real dodge distance.

### Key animation set by priority
| Asset class | Essential states | Secondary polish |
|---|---|---|
| Adventurer | 8-direction move/idle, shield guard, light/heavy, dodge, stagger, death, retreat intent | Cloak inertia, foot dust, breath |
| Basic melee enemy | Idle/patrol, detect, pursue, wind-up, active, recover, stagger/death | Fidget/gear rattle |
| Ranged enemy | Aim, fire, recover/reposition, death | Quiver/string motion |
| Brute | Slow travel, delayed wind-up, block-breaking overhead, recovery | Dust plume and armour rattle |
| Spitter | Charge throat, spit, hazard active/expire | Ground droplets |
| Bell Warden | Bell draw, pulse 1/2, mace sweep, recovery, death | Metal sway |
| Castellan | Halberd attack, channel mark, flood activation, phase transition, death | Architecture settling |
| Surveyor | Mark, trace, reverse echo, rest/death | Sparse afterimage |
| World state | Sealed→unlocked gate, activated shortcut, sanctuary, bank successful | Local dust/ash particles |

**Timing:** map each state to the simulation events rather than hard-code a universal frames-per-attack value. Telegraph should be legible at 1× speed first; sped-up travel modes automatically return to combat speed for threats. An adjustable VFX intensity level is recommended.

## 14. Asset production and export standards

### Master files and outputs
- Editable masters may be layered PSD/ORA/KRA or native illustration formats plus documented export scripts. Never treat flat PNG only as a complete master for complex characters/backgrounds.
- Runtime outputs: transparent PNG or texture atlases for character poses/effects; transparent overlays for interactables; opaque/atlased terrain textures; SVG or raster icons as renderer supports. Preserve named layer responsibilities (base/albedo, emissive/accent, shadow, mask/occlusion, collision reference, FX anchors).
- Normalise transparent margins and pivot points. Store collision shapes as explicit data; **do not derive physics radius from painted pixels**.
- All interactive assets require identifiable states and descriptive names. Bake static ornament into terrain where practical to reduce draw calls and texture switching.
- For performance, prototype a texture-atlas and object-pooling budget based on real target device tests, not an invented fixed FPS guarantee. Test visible VFX, map overlays and UI simultaneously.
- Include metadata: asset ID, owner, source filename, export, dimensions, pivot, facing directions, event hooks, visual states, region, accessibility note, status/version, and rights/provenance.
- AI-generated visual assets, if used, must be licensed and reviewed for commercial suitability, consistency and derivative/IP concerns; no wholesale recreation of third-party branded art. Use manually edited common palette and silhouettes to unify disparate sources.

### Suggested asset ID convention
`[region]_[role]_[subject]_[state]_[direction]_[variant]`, e.g. `ROAD_CHAR_ASHEN_SENTRY_ATTACK_N_01`. For generic objects, use `GLOBAL_PROP_GATE_SEALED_01`; for VFX `GLOBAL_FX_HEAVY_WINDUP_01`. One consistent naming convention is preferable to the exact strings proposed here.

### First implementation asset batch — vertical slice
| Order | Deliverable | Minimum useful state | Validation question |
|---|---|---|---|
| P0 | Player sword/shield silhouette | Idle, travel, guard, light, heavy, dodge, hurt/death | Can a phone viewer read the move without zooming? |
| P0 | Ashen Sentry | Stance, basic strike, guard, stagger/death | Is attacker facing and block state clear? |
| P0 | Mireling | Locomotion, bite/leap, death | Does small/fast remain visible on every floor? |
| P0 | Old Road tiles/materials | Floor, solid wall, one pillar/cover, threshold | Are collision and retreat lines visually obvious? |
| P0 | Core telegraph kit | Slash, heavy, linear aim, guardbreak, block, dodge | Do overlays match simulation hitboxes/timing? |
| P0 | Planning HUD + fog-map states | Map, known/unknown, avoided route, objective and Return | Can viewer plan and explain the rule? |
| P1 | Tower Harrier | Aim/fire/reposition/death | Does range/cover read in a real room? |
| P1 | Watchtower props/materials | Arrow slits, timber, raised positions | Are sightlines readable? |
| P1 | Sanctuary altar | Safe/rest and upgrade cue | Does it avoid suggesting banking? |
| P1 | Fog gate / Gate Key | Locked/eligible/open/cleared, key pickup/banked/issued | Is unlocking separate from boss combat? |
| P1 | Camp and extraction | Planning table, bank state, safe key storage | Is extraction unmistakably at camp only? |
| P2 | Sunken Passage / Crypt set | Flood, ritual stone, tombs | Is late-region danger distinct? |
| P2 | Mudjaw, Spitter, Duelist | Full combat states | Can each archetype be recognized at normal zoom? |
| P2 | Bell Warden and Castellan | Distinct moves, arena hazard cues, death/world first-clear | Is each phase fair and clear? |
| P3 | Secret Surveyor and rare optional pocket | Trail-mark patterns, phase 2 echo, optional arena | Does this add to game without delaying core slice? |

**Production gate:** no mass decoration or full roster art until P0 player + Sentry + Mireling + one wall-aware room have been compared on desktop and a small phone view.

## 15. Asset review board and acceptance tests

### Four required art review compositions
1. **Old Road traversal:** protagonist walking through a lit-to-shadow transition, known/unknown map edge, clear doorway and no enemies.
2. **Mixed melee/ranged combat:** sword/shield player, Sentry, Harrier, a cover pillar, one telegraphed heavy/aim event and a legal retreat line; readable at 1× speed.
3. **Sanctuary and extraction contrast:** same explorer at sanctuary, then at camp; viewers can identify which one secures carried assets without reading a paragraph.
4. **Fog gate and major boss:** sealed/open distinction, key eligible vs unbanked; then Castellan three-channel arena with only truthful active hazards.

### Acceptance checklist
- [ ] At 100% actual mobile display size, unfamiliar reviewers can locate avatar, shield side, enemy attack origin and active danger zone.
- [ ] At least three testers can distinguish sealed gate, opened gate, cleared boss, sanctuary, banked camp and death cache on static gameplay captures using both icon/shape and labels.
- [ ] Grayscale and common colour-vision simulations preserve critical hazard and forbidden-route distinctions.
- [ ] Visual cues correspond to current combat events and hitboxes at normal, low, and sped-up/noncombat playback, without temporal falsehoods.
- [ ] A hidden enemy is not accidentally revealed by UI, glow, shadow or map overlay before legitimate observation.
- [ ] Doorway/cover blocking in art matches navigation and projectile collision.
- [ ] Important indicators remain visible when the screen is narrow and when two threats overlap.
- [ ] Reduced-motion/low-VFX modes preserve information, not just remove effects.
- [ ] Sans-serif HUD text and interaction controls are readable/tappable at planned reference viewport sizes.
- [ ] Prototype runs acceptably on a representative lower-end mobile device, with intended frame rate and asset budget measured and recorded; **do not claim this before device testing**.
- [ ] Files have editable masters or a clear reconstruction process, rights/provenance, export IDs and consistent pivots.
- [ ] Character animation does not alter combat timing, invulnerability or pathfinding as a silent side effect.

### Failure triggers / redesign required
If most viewers cannot identify a dangerous attack before it resolves; if glowing floor decorations look like actual hazards; if the adventurer disappears against stone/water; if mobile UI hides an escape route; if sanctuary appears to bank loot; if a sealed fog gate appears already passable; or if camera/lighting affects enemy visibility without simulation agreement—change the presentation before producing more assets.

## 16. Production workflow and responsibilities

1. **Visual prototype board** (artist/designer): one restrained mood frame each for Camp, Old Road, Watchtower, Sunken Passage and Crypt, plus one full combat screenshot at target zoom. Compare silhouette and floor noise across all five before approval.
2. **Render contract** (developer + combat AI owner): agree sprite anchors, collision radius reference, event hooks, attack range/arc overlay data, projectile origin, line-of-sight/cutaway rules, and low-end fallback.
3. **P0 art kit** (artist): player, Sentry, Mireling, basic terrain/props, universal HUD and telegraphs with editable masters.
4. **Phaser integration** (developer): preserve deterministic simulation, put presentation state in view layer, test 30 Hz simulation against variable render frame rates. Browser demo proves look only when runtime QA occurs; visual preview is concept art, not test evidence.
5. **Three-route observation test** (designer/QA): short camp-to-camp run, Gate Key trial-to-bank run and later gated boss approach; assess whether art communicates autonomy and stakes.
6. **Art lock checkpoint** (creator): approve style, palette, proportion, UI language and a canonical reference screenshot. Only then produce P1–P3 at scale.

### Risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Painterly floors too textured | Attack clues disappear | Value-group ground, telegraph tests before detail |
| UI too ornate | Players cannot follow orders | Minimal field-report panels and compact readable typography |
| Fog and lighting too dark | Enemy/player indistinguishable | Material/actor edge hierarchy, brightness/accessibility options |
| AI art inconsistent | World feels like unrelated asset packs | Shape language, common palette, editable paintovers and model sheets |
| Overlarge 4× source art | Web/mobile load and memory cost | Texture atlases, variant budgets, low-end builds benchmarked early |
| Premature boss VFX production | High rework if AI mechanics change | Lock event contract, build P0 combat vocabulary first |
| New fiction hides old mechanics | Gate/key/sanctuary confusion | All visual concepts reviewed against L06, L13, L16–L21 |

## 17. Open visual decisions (not creator locks)

- **A:** Approve **ASHEN RELIQUARY** as the primary hand-painted miniature dark-fantasy direction? May refine working codename.
- **B:** Choose primary screen orientation / target composition after real portrait and landscape tests.
- **C (RESOLVED L22):** Creator selected Blender-to-2D character sprites with hand-painted environments and VFX. Technical character camera is now also **LOCKED L23 at +75° orthographic**; the overall art appearance remains open.
- **D:** Lock actual character proportions and minimum screen-space footprint after the player/Sentry/Mireling P0 comparison.
- **E:** Approve precise hex swatches and set a colour-blind-safe telegraph key based on tested screenshots.
- **F:** Decide whether the game's formal title differs from the Phaser prototype *Ashen Expedition* and the art codename *Ashen Reliquary*.
- **G:** Determine primary platform and realistic frame/memory budgets from measured web/mobile test hardware.

## 18. Implementation handoff summary (no gameplay code)

**Artist:** Produce *one* top-down scene at intended zoom containing sword-and-shield player, Sentry, Mireling, readable road, one solid cover object, grounded fog and attack cues. Submit both clean art and annotated gameplay-readability version. Provide layered source, palette references and approved silhouettes before moving to other regions.

**Phaser developer:** Keep simulation authoritative for movement/hits/attack timing; render sprites, cues, map and camera as presentation. Implement no new combat decisions from this document. Review 2D layer order, camera framing, UI-safe area and mobile responsiveness against documents `12`, `14` and `26`.

**Designer/QA:** Perform grayscale, mobile-scale, attack-cue, forbidden-route, fog-gate and sanctuary-vs-camp comprehension tests. Track recorded misses and revise the visual grammar; record evidence instead of declaring acceptance from static concept alone.

**Decision register:** Mark this entire visual bible **PROPOSED**, leave O15 open pending creator lock, and retain all previous gameplay locks.


## v0.14 execution addendum — first art validation
Continue the candidate style with proposed `29_OLD_ROAD_ART_PRODUCTION_AND_STYLE_VALIDATION.md`, manifest `29A`, QA `29B`, and concise artist handoff `29C`. These files do not formalise style approval. They constrain the *first* production test to O1 Old Road, sword-and-shield adventurer, proposed Sentry and Mireling. Until sample art is reviewed, do not create full region/boss asset families. This addendum leaves all previous palette and technical standards as proposals.

## Workshop 22 addendum — Locked *production method*, visual aesthetic still proposed
**LOCKED L22:** use Blender to model, rig and animate character sprites; export 2D sprite frames/atlases, paired with hand-painted 2D environments and visual effects. See `30_HYBRID_BLENDER_CHARACTER_SPRITE_PIPELINE.md` for pipeline-specific handoffs and `30A`/`30B` for proposed budget/validation. The game remains top-down 2D in Phaser presentation and the actual simulation remains authoritative. This does **not** approve the Ashen Reliquary art look, the exact orthographic angle, all-eight-direction sprite production, final palette or cost of the full asset set. Those remain subject to creator review and runtime testing. The earlier broad advice in this bible that hand-painted or 3D-to-2D sources were interchangeable is now resolved for **characters** specifically; environments and VFX remain painted 2D.

## Workshop 23 — Locked +75° fixed character-camera overlay
**LOCKED L23** fixes **Blender character-sprite rendering** to one orthographic camera approximately **75° above horizontal**, independent of game-camera zoom. Character sprites are pre-rendered from this angle and applied in the 2D top-down runtime; the painterly floor, cover and hazard overlays remain hand-authored 2D. If older descriptions in this *proposed* aesthetic mention alternate character camera options, `31` and L23 control.

Art-direction consequences to test rather than assume:
- More visible shoulders, shield, weapon and head than straight-overhead, but still shallow enough that subtle facial design won't read at zoom; model action silhouettes accordingly.
- Character root/ground-contact point anchors to simulation position; correct image offset must account for the projected model's head and equipment. The long weapon's image extends beyond collider and must not determine contact/draw depth.
- One camera/lighting/pivot master across player, Sentry and Mireling; tests at real mobile and desktop zoom over pale paving and dark damp floors.
- No 45° isometric tiles, raised navigation, gameplay camera pitch, animation-owned hitboxes or real-time 3D runtime.

**Status distinction:** camera L23 and authoring method L22 are locked; palette, materials, final title and the complete Ashen Reliquary visual direction P18/O15 remain **PROPOSED**. Full technical art deliverables and tests are in `31`, `31A` and `31B`.

## Workshop 24 locked sprite coverage (L24)
Art production must support eight compass facings for locomotion and guard, while attack sprites use deliberately selected views per move. Every attack is inspected from all eight simulation-facing headings; do not make misleading telegraphs to save texture memory. This is an **animation workflow lock**, not approval of the candidate *Ashen Reliquary* look P18. See `32` for the binding direction contract.
