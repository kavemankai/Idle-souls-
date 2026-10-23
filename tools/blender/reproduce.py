"""Render a retained source coupon again; compare decoded pixels, not PNG metadata."""
from pathlib import Path
import subprocess, hashlib, json
from PIL import Image, ImageChops
root=Path(__file__).resolve().parents[2]
subprocess.run(['blender','-b','-t','4','--python','tools/blender/export.py','--','--actor','adventurer','--from-blend','--sample','--output','.tmp/repro'],cwd=root,check=True)
name='adventurer__guard__NE__01.png'
a=Image.open(root/'assets/characters/renders/adventurer'/name).convert('RGBA')
b=Image.open(root/'.tmp/repro/adventurer'/name).convert('RGBA')
assert a.tobytes()==b.tobytes(),ImageChops.difference(a,b).getbbox()
result={'status':'PASS','actor':'adventurer','action':'guard','facing':'NE','sourceFrame':2,'decodedRGBA_SHA256':hashlib.sha256(a.tobytes()).hexdigest(),'regeneratedRGBA_SHA256':hashlib.sha256(b.tobytes()).hexdigest(),'method':'Exact decoded pixel equality from retained .blend; PNG container metadata may differ','blender':'4.3.2','command':'python tools/blender/reproduce.py'}
(root/'docs/visual_proof/reproducibility.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS: decoded RGBA matches retained-source regeneration exactly')
