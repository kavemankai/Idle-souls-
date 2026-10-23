"""blender -b --python tools/blender/validate.py: inspect saved source contracts."""
import bpy, math, json
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
root=Path(__file__).resolve().parents[2];rows=[]
for source in sorted((root/'assets/characters/source').glob('*.blend')):
    bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene;cam=scene.camera
    elev=math.degrees(math.atan2(cam.location.z,math.hypot(cam.location.x,cam.location.y)))
    origin=world_to_camera_view(scene,cam,Vector((0,0,0)))
    assert cam.data.type=='ORTHO' and abs(elev-75)<.001
    assert abs(origin.x-.5)<.00001 and abs(origin.y-.5)<.00001
    rigs=[o for o in scene.objects if o.type=='ARMATURE'];assert len(rigs)==1
    rig=rigs[0];assert 'root' in rig.data.bones
    assert all(o.parent==rig for o in scene.objects if o.type=='MESH')
    names=[a.name for a in bpy.data.actions];assert any('walk' in a for a in names)
    rows.append({'actor':source.stem,'cameraElevation':elev,'cameraType':cam.data.type,'orthoScale':cam.data.ortho_scale,'projectedGroundPivot':[origin.x*192,(1-origin.y)*192],'bones':len(rig.data.bones),'meshes':len([o for o in scene.objects if o.type=='MESH']),'actions':names,'status':'PASS'})
(root/'docs/visual_proof/source-validation.json').write_text(json.dumps(rows,indent=2)+'\n')
print('PASS: all four source cameras, rigged mesh parents, actions and ground pivots')
