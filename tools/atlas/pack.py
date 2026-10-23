"""Trim with stable source-canvas pivots, extrude edges, pack per actor.
python tools/atlas/pack.py. Requires Pillow. No sprite rotation or reflection.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib
ROOT=Path(__file__).resolve().parents[2];REND=ROOT/'assets/characters/renders';OUT=ROOT/'assets/characters/runtime'
OUT.mkdir(parents=True,exist_ok=True)
reports=[]
for folder in sorted(REND.iterdir()):
    if not (folder/'frames.json').exists():continue
    frames=json.loads((folder/'frames.json').read_text());items=[]
    for frame in frames:
        im=Image.open(ROOT/frame['file']).convert('RGBA');box=im.getbbox()
        if box is None:raise ValueError(f"Empty frame {frame['name']}")
        if min(box[0],box[1])<2 or max(box[2],box[3])>190:raise ValueError(f"Clipping risk: {frame['name']} {box}")
        items.append((frame,im.crop(box),box))
    width=1024;pad=3;x=y=row=0;entries={};metadata=[];placed=[]
    for f,im,box in items:
        w,h=im.size
        if x+w+pad*2>width:x=0;y+=row;row=0
        placed.append((im,x+pad,y+pad));
        entries[f['name']]={'frame':{'x':x+pad,'y':y+pad,'w':w,'h':h},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':box[0],'y':box[1],'w':w,'h':h},'sourceSize':{'w':192,'h':192},'pivot':{'x':.5,'y':.5}}
        metadata.append(f|{'reviewStatus':'TECHNICAL_PROOF_NOT_APPROVED','timingAuthority':'VISUAL-ONLY exhibition; combat source not connected','sourceHash':hashlib.sha256((ROOT/'assets'/f['source']).read_bytes()).hexdigest(),'file':None,'trimRect':[box[0],box[1],w,h],'trimmedPivot':[96-box[0],96-box[1]],'atlasPage':folder.name+'.png','atlasRect':[x+pad,y+pad,w,h]})
        x+=w+pad*2;row=max(row,h+pad*2)
    height=2**max(1,(y+row-1).bit_length());atlas=Image.new('RGBA',(width,height))
    for im,x,y in placed:
        w,h=im.size
        atlas.paste(im,(x,y))
        # Nearest edge extrusion protects bilinear sampling, transparent padding beyond.
        atlas.paste(im.crop((0,0,w,1)).resize((w,2)),(x,y-2));atlas.paste(im.crop((0,h-1,w,h)).resize((w,2)),(x,y+h))
        atlas.paste(im.crop((0,0,1,h)).resize((2,h)),(x-2,y));atlas.paste(im.crop((w-1,0,w,h)).resize((2,h)),(x+w,y))
    dest=OUT/f'{folder.name}.png';atlas.save(dest,optimize=True)
    (OUT/f'{folder.name}.json').write_text(json.dumps({'frames':entries,'meta':{'image':dest.name,'size':{'w':width,'h':height},'scale':'1'}},separators=(',',':'))+'\n')
    (OUT/f'{folder.name}.metadata.json').write_text(json.dumps(metadata,separators=(',',':'))+'\n')
    reports.append({'actor':folder.name,'frames':len(items),'width':width,'height':height,'rgbaBytes':width*height*4,'pngBytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'directions':{a:sorted({f['facing'] for f in frames if f['action']==a}) for a in sorted({f['action'] for f in frames})}})
    # Eight-view guard+locomotion contact sheets, actual source renders, never concept art.
    dirs=['N','NE','E','SE','S','SW','W','NW'];actions=['walk']+(['guard'] if folder.name!='mireling' else ['leap'])
    sheet=Image.new('RGB',(8*144,2*166),(27,40,37));draw=ImageDraw.Draw(sheet)
    for row,action in enumerate(actions):
        for col,direction in enumerate(dirs):
            hits=[f for f in frames if f['action']==action and f['facing']==direction]
            if not hits:continue
            f=hits[min(1,len(hits)-1)];im=Image.open(ROOT/f['file']).convert('RGBA').resize((144,144))
            sheet.paste(im,(col*144,row*166+20),im);draw.text((col*144+12,row*166+7),f'{direction} / {action}',fill='#ddd8bf')
            draw.line((col*144+68,row*166+92,col*144+76,row*166+92),fill='#b7985a');draw.line((col*144+72,row*166+88,col*144+72,row*166+96),fill='#b7985a')
    proof=ROOT/'docs/visual_proof';proof.mkdir(exist_ok=True,parents=True);sheet.save(proof/f'{folder.name}-compass.png')
(OUT/'atlas-report.json').write_text(json.dumps({'actors':reports,'totalRGBABytes':sum(x['rgbaBytes'] for x in reports),'totalPNGBytes':sum(x['pngBytes'] for x in reports),'padding':3,'edgeExtrusion':2,'physicalPhonePerformance':'NOT TESTED'},indent=2)+'\n')
print(json.dumps(reports,indent=2))
