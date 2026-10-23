# Idle Souls — Full CC0 music and SFX import

Requested: all 14 sources from the research shortlist. Import: python tools/audio/import_cc0.py.

Music, all CC0: Whispers in the Fog (Ruhinre), Town in Ruins (Brandon Morris), Cathedral in the Forest (congusbongus), Determined Pursuit (Emma_MA), Epic Boss Battle (SubspaceAudio / Juhani Junkala). O1 wind ambience: Wind 1 by Luke.RUSTLTD.

Sound-effect packs, all CC0: Kenney RPG Audio (50), Kenney Impact Sounds (130), Kenney UI Audio (50), artisticdude Swishes (13), StarNinjas Impact/Shield Blocks (10), rubberduck 80 Creature SFX, rubberduck 80 RPG SFX, and HaelDB Leather/Cloth/Armor Footsteps (12).

Source pages:
- https://opengameart.org/content/whispers-in-the-fog
- https://opengameart.org/content/town-in-ruins-loop
- https://opengameart.org/content/cathedral-in-the-forest-ambient-loop
- https://opengameart.org/content/determined-pursuit-epic-orchestra-loop
- https://opengameart.org/content/boss-battle-music
- https://opengameart.org/content/wind1
- https://kenney.nl/assets/rpg-audio
- https://kenney.nl/assets/impact-sounds
- https://kenney.nl/assets/ui-audio
- https://opengameart.org/content/swishes-sound-pack
- https://opengameart.org/content/10-impactshield-blocks
- https://opengameart.org/content/80-cc0-creature-sfx
- https://opengameart.org/content/80-cc0-rpg-sfx
- https://opengameart.org/content/footsteps-leather-cloth-armor

Original licence declarations were checked on source pages on October 23, 2026. All selected under CC0-1.0 (https://creativecommons.org/publicdomain/zero/1.0/). Town in Ruins and HaelDB footsteps also list OGA-BY, but each explicitly offers CC0. The Kenney UI pack is sourced through Calinou's openly published, CC0-licensed WAV repackaging with its original licence; that is recorded in the import manifest. Retain all attribution information in game credits even when optional.

The importer fetches all original source payloads and converts them to OGG Vorbis with ffmpeg, conserving all distinct source sounds and rejecting missing packs. OGG encoded SFX go into public/audio/library/source-id, five music tracks into public/audio/music, wind into public/audio/ambience. It also selects provisional sounds per O1 event and copies them to public/audio/cues. The manifest docs/audio/IMPORT_MANIFEST.json records every source URL, author, licence, source-byte SHA-256, output clip SHA-256 and the selected O1 cue's original filename.

Runtime: only selected music/ambience/cues are requested by the browser; full audio library is NOT preloaded. Audio requires a user gesture, selectable soundtrack and independent music/effects volumes. Background ambience ducks under normal combat. Damage, contact, defence and death cues come from simulator events; attacks from simulator move IDs; footsteps from actual presentation movement. None of this alters the 30 Hz authoritative simulation.

This is a production-candidate first pass. Individual sound choices are deterministic based on file-name heuristics and still require human audition, loudness equalisation, seamless-loop checks and mobile speaker review. Shipping all library files in the public directory increases deployment size and should be replaced with a separate CDN/archive for final release, even though none are preloaded.

## O1 sound curation after import

The deterministic first-pass filenames did not always fit the intended event. tools/audio/curate_o1.py replaces the 20 runtime cue copies with explicitly chosen files from the complete 428-item inventory, without removing anything in the library. Hero uses leather footsteps, Sentry uses metal footsteps, and Mireling uses soft grassy steps. Sword swing and heavy swing use different swishes. A threshold uses a spell chime rather than coins; creature bite uses an insect clip rather than breathing. Shield contact, perfect block and parry are distinguishable.

A dedicated Chromium audio smoke test verifies click-to-unlock, music track selection, dispatch cue HTTP success and turning audio off. Human audition still required: filenames alone do not verify tonal fit, loudness, loops or quality on phone speakers.
