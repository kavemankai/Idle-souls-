"""Pixel-exact atlas reconstruction and source clipping evidence."""
from PIL import Image, ImageChops
from pathlib import Path
import json
root=Path(__file__).resolve().parents[2];out=[]
for path in sorted((root/'assets/characters/runtime').glob('*.metadata.json')):
    frames=json.loads(path.read_text());atlas=Image.open(path.with_name(path.name.replace('.metadata.json','.png'))).convert('RGBA')
    for f in frames:
        name=f['name'];im=Image.open(root/f'assets/characters/renders/{f["actor"]}/{name}.png').convert('RGBA')
        x,y,w,h=f['trimRect'];ax,ay,aw,ah=f['atlasRect'];assert (w,h)==(aw,ah)
        assert f['feetPivot']==[96,96] and f['trimmedPivot']==[96-x,96-y]
        assert x>=2 and y>=2 and x+w<=190 and y+h<=190, name
        assert not ImageChops.difference(atlas.crop((ax,ay,ax+w,ay+h)),im.crop((x,y,x+w,y+h))).getbbox(), name
    out.append({'actor':frames[0]['actor'],'frames':len(frames),'pixelExactTrimReconstruction':'PASS','stableGroundPivot':'PASS','sourceCanvasClipping':'PASS'})
(root/'docs/visual_proof/atlas-validation.json').write_text(json.dumps(out,indent=2)+'\n')
print('PASS: pixel-exact reconstruction, ground pivot offsets, padded canvas for',sum(x['frames'] for x in out),'frames')
