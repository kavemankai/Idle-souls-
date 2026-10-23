"""Rasterize original editable O1 combat FX vectors; no gameplay geometry or AI.
Run: python tools/environment/export_o1_vfx.py
"""
from pathlib import Path
import cairosvg
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/vfx/source'
RUNTIME = ROOT / 'assets/vfx/runtime'
NAMES = ["contact","stagger","dodge","block","parry","perfect"]
RUNTIME.mkdir(parents=True, exist_ok=True)
for name in NAMES:
    source = SOURCE / f'{name}.svg'
    if not source.is_file():
        raise FileNotFoundError(source)
    cairosvg.svg2png(url=str(source), write_to=str(RUNTIME / f'{name}.png'))
    print('Rasterized', name)
