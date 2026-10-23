#!/usr/bin/env python3
"""Curated O1 trial cues, chosen from the COMPLETE reviewed CC0 audio inventory.
Original 428 entries are preserved; this only changes the 20 small O1 cue copies.
"""
import hashlib
import json
import shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "docs/audio/IMPORT_MANIFEST.json"
CATALOG = json.loads(MANIFEST.read_text())
CUES = {
    "step_hero": ("footsteps", "step_lth1.ogg"),
    "step_sentry": ("footsteps", "step_metal (2).ogg"),
    "step_mireling": ("kenney_impact", "footstep_grass_000.ogg"),
    "sword_swing": ("swishes", "swish-2.wav"),
    "heavy_swing": ("swishes", "swish-9.wav"),
    "sword_hit": ("kenney_impact", "impactMetal_medium_000.ogg"),
    "shield_block": ("shield", "impact.1.ogg"),
    "perfect_block": ("shield", "impact.5.ogg"),
    "parry": ("kenney_impact", "impactMetal_light_002.ogg"),
    "stagger": ("rpg_sfx", "creature_hurt_02.ogg"),
    "mireling_bite": ("creatures", "bug_02.ogg"),
    "mireling_death": ("creatures", "hurt_03.ogg"),
    "sentry_death": ("kenney_impact", "impactPlate_heavy_003.ogg"),
    "hero_death": ("kenney_impact", "impactSoft_heavy_000.ogg"),
    "dodge": ("swishes", "swish-3.wav"),
    "ui_select": ("kenney_ui", "click2.wav"),
    "ui_dispatch": ("kenney_ui", "switch5.wav"),
    "ui_success": ("kenney_ui", "switch11.wav"),
    "ui_failure": ("kenney_ui", "switch17.wav"),
    "threshold": ("rpg_sfx", "spell_02.ogg"),
}
if set(CATALOG["cues"]) != set(CUES): raise ValueError("Expected exactly the known runtime cue list")
for name, (pack, filename) in CUES.items():
    matches = [a for a in CATALOG["library"] if a["source"] == pack and Path(a["original"]).name.casefold() == filename.casefold()]
    if len(matches) != 1: raise ValueError(f"Cannot unambiguously curate {name} -> {pack}/{filename}: {len(matches)} matches")
    entry = matches[0]
    origin = ROOT / "public" / entry["file"]
    target = ROOT / "public/audio/cues" / (name + ".ogg")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(origin, target)
    CATALOG["cues"][name] = {
        "file": target.relative_to(ROOT / "public").as_posix(),
        "source": pack, "original": entry["original"],
        "libraryFile": entry["file"],
        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        "selection": "curated candidate, not auditioned or approved",
    }
MANIFEST.write_text(json.dumps(CATALOG, indent=2, ensure_ascii=False) + "\n")
print(f"Curated {len(CUES)} uniquely sourced O1 cues; full 428-file archive unchanged.")
