#!/usr/bin/env python3
"""Reproducible CC0 audio library import: all source packs, compressed runtime OGGs, and O1 cue selections.
Requires ffmpeg and ffprobe; only explicit reviewed HTTPS source URLs can be downloaded.
python tools/audio/import_cc0.py
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import shutil
import subprocess
import tempfile
import time
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "public/audio"
LIBRARY = DEST / "library"
CUES = DEST / "cues"
MUSIC = DEST / "music"
AMBIENCE = DEST / "ambience"
CATALOG = ROOT / "docs/audio/IMPORT_MANIFEST.json"
LICENCE = "https://creativecommons.org/publicdomain/zero/1.0/"
# All licence declarations have been inspected on individual source pages (2026-10-23).
# OGA URLs are the original site download links; Kenney official RPG/Impact were independently documented.
# The UI pack is a CC0-preserving WAV conversion redistributed by Calinou with LICENSE.txt.
SOURCES = [
    dict(id="whispers", kind="music", author="Ruhinre", title="Whispers in the Fog", page="https://opengameart.org/content/whispers-in-the-fog", url="https://opengameart.org/sites/default/files/whispers_in_the_fog.ogg"),
    dict(id="town_ruins", kind="music", author="Brandon Morris", title="Town in Ruins", page="https://opengameart.org/content/town-in-ruins-loop", url="https://opengameart.org/sites/default/files/n3535n5n335n35nj.ogg", note="Source offers CC0 as well as OGA-BY; imported under CC0."),
    dict(id="cathedral", kind="music", author="congusbongus", title="Cathedral in the Forest", page="https://opengameart.org/content/cathedral-in-the-forest-ambient-loop", url="https://opengameart.org/sites/default/files/forest_2_0.ogg"),
    dict(id="pursuit", kind="music", author="Emma_MA", title="Determined Pursuit", page="https://opengameart.org/content/determined-pursuit-epic-orchestra-loop", url="https://opengameart.org/sites/default/files/determined_pursuit_loop.wav"),
    dict(id="boss", kind="music", author="SubspaceAudio / Juhani Junkala", title="Epic Boss Battle", page="https://opengameart.org/content/boss-battle-music", url="https://opengameart.org/sites/default/files/Juhani%20Junkala%20-%20Epic%20Boss%20Battle%20%5BSeamlessly%20Looping%5D.wav"),
    dict(id="wind", kind="ambience", author="Luke.RUSTLTD", title="Wind 1", page="https://opengameart.org/content/wind1", url="https://opengameart.org/sites/default/files/wind1.wav"),
    dict(id="kenney_rpg", kind="sfx", author="Kenney", title="RPG Audio", page="https://kenney.nl/assets/rpg-audio", url="https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip", expected_min=40),
    dict(id="kenney_impact", kind="sfx", author="Kenney", title="Impact Sounds", page="https://kenney.nl/assets/impact-sounds", url="https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip", expected_min=100),
    dict(id="kenney_ui", kind="sfx", author="Kenney; CC0 archive converted by Calinou", title="UI Audio", page="https://kenney.nl/assets/ui-audio", url="https://github.com/Calinou/kenney-ui-audio/archive/refs/heads/master.zip", expected_min=40, note="Fallback mirror/format: Kenney's 50 CC0 UI samples converted losslessly to WAV by Calinou."),
    dict(id="swishes", kind="sfx", author="artisticdude", title="Swishes", page="https://opengameart.org/content/swishes-sound-pack", url="https://opengameart.org/sites/default/files/swishes.zip", expected_min=10),
    dict(id="shield", kind="sfx", author="StarNinjas", title="10 Impact/Shield Blocks", page="https://opengameart.org/content/10-impactshield-blocks", url="https://opengameart.org/sites/default/files/impact_-_starninjas.zip", expected_min=8),
    dict(id="creatures", kind="sfx", author="rubberduck", title="80 Creature SFX", page="https://opengameart.org/content/80-cc0-creature-sfx", url="https://opengameart.org/sites/default/files/80-CC0-creature-SFX_0.zip", expected_min=60),
    dict(id="rpg_sfx", kind="sfx", author="rubberduck", title="80 RPG SFX", page="https://opengameart.org/content/80-cc0-rpg-sfx", url="https://opengameart.org/sites/default/files/80-CC0-RPG-SFX_0.zip", expected_min=60),
    dict(id="footsteps", kind="sfx", author="HaelDB", title="Leather, Cloth, Armor Footsteps", page="https://opengameart.org/content/footsteps-leather-cloth-armor", url="https://opengameart.org/sites/default/files/footsteps.zip", expected_min=10, note="Source offers CC0 and OGA-BY; imported under CC0."),
]
AUDIO_EXT = {".ogg", ".wav", ".mp3", ".flac", ".aif", ".aiff", ".m4a"}
CUE_RULES = {
    "step_hero": (["footsteps", "kenney_rpg", "kenney_impact"], r"cloth|leather|foot|step"),
    "step_sentry": (["footsteps", "kenney_rpg", "kenney_impact"], r"armor|armour|metal|foot|step"),
    "step_mireling": (["kenney_impact", "footsteps", "creatures"], r"soft|grass|dirt|step|bug"),
    "sword_swing": (["swishes", "kenney_rpg"], r"light|swish|swing|whoosh|slash"),
    "heavy_swing": (["swishes", "kenney_rpg"], r"heavy|swing|swish|whoosh"),
    "sword_hit": (["kenney_impact", "rpg_sfx", "shield"], r"metal|impact|blade|sword|hit"),
    "shield_block": (["shield", "kenney_impact"], r"impact|shield|block|hit"),
    "perfect_block": (["shield", "kenney_impact"], r"impact|shield|block"),
    "parry": (["kenney_impact", "shield"], r"metal|impact|shield|hit"),
    "stagger": (["rpg_sfx", "creatures", "kenney_impact"], r"hurt|grunt|hit|body|creature"),
    "mireling_bite": (["creatures", "rpg_sfx"], r"bug|eat|monster|weird|grunt"),
    "mireling_death": (["creatures", "rpg_sfx"], r"hurt|die|death|monster|grunt"),
    "sentry_death": (["rpg_sfx", "creatures", "kenney_impact"], r"hurt|die|death|metal|body"),
    "hero_death": (["rpg_sfx", "creatures", "kenney_impact"], r"hurt|die|death|body"),
    "dodge": (["swishes", "kenney_rpg"], r"light|swish|whoosh|swing"),
    "ui_select": (["kenney_ui"], r"click|switch|select"),
    "ui_dispatch": (["kenney_ui"], r"switch|click|confirm"),
    "ui_success": (["kenney_ui", "rpg_sfx"], r"confirm|select|switch|positive|item"),
    "ui_failure": (["kenney_ui", "rpg_sfx"], r"error|negative|click|switch"),
    "threshold": (["rpg_sfx", "kenney_ui"], r"spell|gem|item|confirm|select"),
}
def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def fetch(source: dict) -> bytes:
    last = None
    for attempt in range(4):
        try:
            request = urllib.request.Request(
                source["url"], headers={"User-Agent": "IdleSoulsAudioImporter/1.0 (+https://github.com/kavemankai/Idle-souls-)", "Accept": "*/*"}
            )
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read(120 * 1024 * 1024 + 1)
            if len(data) > 120 * 1024 * 1024: raise ValueError("download exceeds 120 MiB safety bound")
            if len(data) < 200: raise ValueError("download is too small")
            if source["kind"] == "sfx" and not zipfile.is_zipfile(io.BytesIO(data)):
                raise ValueError("expected ZIP archive, got " + data[:50].hex())
            if source["kind"] != "sfx" and (data.startswith(b"<!") or data.startswith(b"<html")):
                raise ValueError("download is HTML not audio")
            return data
        except Exception as exc:
            last = exc
            print(f"{source['id']} attempt {attempt+1}: {exc}", flush=True)
            time.sleep(min(2 ** attempt, 8))
    raise RuntimeError(f"Required source {source['id']} could not be downloaded: {last}")

def encode(data: bytes, suffix: str, destination: Path, music: bool):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        original = Path(tmp) / ("input" + suffix)
        original.write_bytes(data)
        cmd = [
            "ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", str(original),
            "-vn", "-map_metadata", "-1",
            "-c:a", "libvorbis", "-qscale:a", "4" if music else "2",
            "-ar", "44100" if music else "24000",
        ]
        if not music: cmd.extend(["-ac", "1"])
        cmd.append(str(destination))
        subprocess.run(cmd, check=True, timeout=90)
    if not destination.is_file() or destination.stat().st_size < 100:
        raise RuntimeError(f"Invalid rendered file {destination}")

def list_audio(raw: bytes):
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        members = []
        for f in z.infolist():
            if f.is_dir() or f.file_size <= 0: continue
            p = PurePosixPath(f.filename)
            # ZIPs made on macOS often include AppleDouble resource-fork files
            # named __MACOSX/._swish.wav: these are not decodable audio.
            if any(part.lower() == "__macosx" or part.startswith("._") for part in p.parts): continue
            if p.suffix.lower() not in AUDIO_EXT: continue
            if ".." in p.parts or p.is_absolute() or f.file_size > 60 * 1024 * 1024: continue
            members.append(f)
        # A Kenney pack can include both WAV and OGG for the same clip. Prefer OGG.
        seen = {}
        for info in sorted(members, key=lambda f: (str(PurePosixPath(f.filename).with_suffix("")).lower(), 0 if f.filename.lower().endswith(".ogg") else 1)):
            k = str(PurePosixPath(info.filename).with_suffix("")).lower()
            seen.setdefault(k, info)
        return [(f.filename, z.read(f)) for f in sorted(seen.values(), key=lambda f: f.filename.lower())]

def sanitized(name):
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug[:80] or "sample"

def main():
    for p in [LIBRARY, CUES, MUSIC, AMBIENCE]:
        p.mkdir(parents=True, exist_ok=True)
    manifest = {"format": 1, "license": "CC0-1.0", "licenseUrl": LICENCE, "sources": [], "music": {}, "ambience": {}, "library": [], "cues": {}}
    by_pack = {}
    for source in SOURCES:
        raw = fetch(source)
        note = {k: source[k] for k in ("id", "kind", "title", "author", "page", "url") }
        note.update(license="CC0-1.0", licenseUrl=LICENCE, downloadSha256=sha(raw), bytes=len(raw))
        if "note" in source: note["note"] = source["note"]
        if source["kind"] in ("music", "ambience"):
            path = (MUSIC if source["kind"] == "music" else AMBIENCE) / (source["id"] + ".ogg")
            encode(raw, Path(source["url"]).suffix.lower(), path, True)
            item = {"file": path.relative_to(ROOT / "public").as_posix(), "source": source["id"], "sha256": sha(path.read_bytes())}
            manifest[source["kind"]][source["id"]] = item
            note["count"] = 1
        else:
            audio = list_audio(raw)
            if len(audio) < source.get("expected_min", 1):
                raise RuntimeError(f"{source['id']}: expected at least {source.get('expected_min')} audio files; got {len(audio)}")
            by_pack[source["id"]] = []
            for i, (filename, sound) in enumerate(audio):
                stem = sanitized(PurePosixPath(filename).stem)
                path = LIBRARY / source["id"] / f"{i:03d}_{stem}.ogg"
                encode(sound, PurePosixPath(filename).suffix.lower(), path, False)
                item = {"file": path.relative_to(ROOT / "public").as_posix(), "source": source["id"], "original": filename,
                        "sha256": sha(path.read_bytes()), "bytes": path.stat().st_size}
                manifest["library"].append(item)
                by_pack[source["id"]].append(item)
            note["count"] = len(audio)
        manifest["sources"].append(note)
        print(f"Imported {note['id']}: {note['count']} items", flush=True)
    for cue, (packs, regex) in CUE_RULES.items():
        candidates = [item for pack in packs for item in by_pack.get(pack, [])]
        if not candidates: raise RuntimeError(f"{cue}: no source pack available")
        pattern = re.compile(regex, re.IGNORECASE)
        selected = next((item for item in candidates if pattern.search(item["original"])), candidates[0])
        src = ROOT / "public" / selected["file"]
        path = CUES / f"{cue}.ogg"
        shutil.copy2(src, path)
        manifest["cues"][cue] = {
            "file": path.relative_to(ROOT / "public").as_posix(),
            "source": selected["source"],
            "original": selected["original"],
            "libraryFile": selected["file"],
            "sha256": sha(path.read_bytes()),
        }
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"SUCCESS: {len(manifest['library'])} individual SFX; {len(manifest['cues'])} runtime cues; {len(manifest['music'])} tracks; {len(manifest['ambience'])} ambience")

if __name__ == "__main__":
    main()
