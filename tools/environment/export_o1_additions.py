"""Export additional editable O1 SVGs to PNG using pinned CairoSVG.
The SVGs are retained as masters. No geometry or collision values are authored here.
"""
from pathlib import Path
import cairosvg

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'assets/environments/source'
DST = ROOT / 'assets/environments/runtime'
FILES = ["wall-return-west","wall-return-east","doorway-jamb-west","doorway-jamb-east","endpoint-threshold"]
DST.mkdir(parents=True, exist_ok=True)
for name in FILES:
    source = SRC / f'{name}.svg'
    if not source.is_file():
        raise FileNotFoundError(source)
    cairosvg.svg2png(url=str(source), write_to=str(DST / f'{name}.png'))
    print('Rendered environment', name)
