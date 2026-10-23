"""Idle Souls P0: editable articulated models and fixed-camera sprite export.
blender -b -t 4 --python tools/blender/export.py [-- --actor adventurer --sample]
Rigid mesh-to-bone parenting deliberately keeps broad painted miniature planes.
"""
import bpy, math, json, hashlib, sys
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'assets/characters/source'; REND=ROOT/'assets/characters/renders'
SRC.mkdir(parents=True,exist_ok=True); REND.mkdir(parents=True,exist_ok=True)
ARGS=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
KINDS=['mannequin','adventurer','sentry','mireling']
if '--actor' in ARGS: KINDS=[ARGS[ARGS.index('--actor')+1]]
SAMPLE='--sample' in ARGS
FACINGS=['N','NE','E','SE','S','SW','W','NW']; SELECT=['N','NE','E','S','SW']
PRESET={'revision':'p0-75-v1','elevation':75,'azimuth':-90,'orthoScale':5.4,'canvas':[192,192], 'cameraTarget':[0,0,0], 'world':'+Y north, +Z up; screen Y down', 'engine':'BLENDER_WORKBENCH','worldUnitsPerBlenderUnit':22.4,'license':'Original project-generated geometry; CC0-1.0 asset grant; no third-party imagery'}
HASH=hashlib.sha256(json.dumps(PRESET,sort_keys=True).encode()).hexdigest()[:16]
ALL=[]

def material(name,hex):
    m=bpy.data.materials.new(name); m.diffuse_color=tuple(int(hex[i:i+2],16)/255 for i in (0,2,4))+(1,); return m

def mesh(name,loc,scale,mat,kind='sphere',bevel=0):
    if kind=='cube': bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    elif kind=='cone': bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=1,radius2=.55,depth=2,location=loc)
    else: bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=1,location=loc)
    ob=bpy.context.object; ob.name=name; ob.scale=scale; ob.data.materials.append(mat)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=ob.modifiers.new('painted soft edge','BEVEL');mod.width=bevel;mod.segments=2
        ob.modifiers.new('weighted planes','WEIGHTED_NORMAL')
    return ob

def bind(ob,rig,bone):
    # Parent inverse preserves the source mesh position at the bone rest pose.
    world=ob.matrix_world.copy();ob.parent=rig;ob.parent_type='BONE';ob.parent_bone=bone
    bpy.context.view_layer.update();ob.matrix_world=world

def rig_create(creature=False):
    bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='RIG_MIRELING' if creature else 'RIG_HUMANOID'
    bpy.ops.object.mode_set(mode='EDIT'); eb=rig.data.edit_bones;eb.remove(eb[0])
    if creature:
        defs=[('root',(0,0,0),(0,0,.2),None),('body',(0,-.15,.3),(0,.22,.3),'root'),('head',(0,.22,.3),(0,.65,.25),'body'),('tail',(0,-.3,.3),(0,-.8,.25),'body')]
        for side in [-1,1]:
            for j in range(3):defs.append((f'leg_{side}_{j}',(side*.2,(j-1)*.3,.3),(side*.65,(j-1)*.3-.15,.08),'body'))
    else:
        defs=[('root',(0,0,0),(0,0,.2),None),('hips',(0,0,.6),(0,0,.95),'root'),('spine',(0,0,.95),(0,0,1.35),'hips'),('head',(0,0,1.35),(0,0,1.8),'spine'),('weapon_arm',(.37,0,1.25),(.67,.3,.95),'spine'),('shield_arm',(-.37,0,1.25),(-.63,.3,.95),'spine'),('weapon_hand',(.67,.3,.95),(.67,.52,.95),'weapon_arm'),('shield_hand',(-.63,.3,.95),(-.63,.5,.95),'shield_arm'),('foot_L',(-.19,0,.65),(-.19,.1,.12),'hips'),('foot_R',(.19,0,.65),(.19,.1,.12),'hips')]
    for name,head,tail,parent in defs:
        b=eb.new(name);b.head=head;b.tail=tail
        if parent:b.parent=eb[parent]
    bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
    for b in rig.pose.bones:b.rotation_mode='XYZ'
    return rig

def build(kind):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for datablock in list(bpy.data.actions):bpy.data.actions.remove(datablock)
    creature=kind=='mireling';rig=rig_create(creature)
    steel=material('broad iron planes','7f9391');edge=material('worn linen edges','d9d4b6');dark=material('deep iron','293e3d');leather=material('umber leather','685644');brass=material('old brass','af915b')
    cloth=material('travel teal' if kind=='adventurer' else 'sentry faded oxblood','3d706b' if kind=='adventurer' else '875b47')
    if kind=='mannequin':cloth=material('calibration blue','5295a0')
    if creature:
        skin=material('mire chitin','9ba879');belly=material('mire underside','566c54');claw=material('hooked ivory','d0cba3')
        for name,loc,sc,mat,bone in [('segmented carapace',(0,-.1,.36),(.32,.56,.23),skin,'body'),('low hooked head',(0,.47,.28),(.29,.31,.18),belly,'head'),('dorsal shell',(0,-.15,.5),(.23,.34,.16),skin,'body'),('hooked tail',(0,-.67,.29),(.12,.39,.12),belly,'tail')]:bind(mesh(name,loc,sc,mat),rig,bone)
        for side in [-1,1]:
            for j in range(3):
                y=(j-1)*.3
                ob=mesh(f'hooked leg {side} {j}',(side*.43,y,.21),(.33,.085,.085),skin);ob.rotation_euler[2]=side*(.35 if j==0 else -.3);bind(ob,rig,f'leg_{side}_{j}')
                bind(mesh('pale claw',(side*.68,y-.11,.11),(.1,.18,.07),claw),rig,f'leg_{side}_{j}')
            bind(mesh('forward mandible',(side*.18,.72,.2),(.08,.25,.09),claw),rig,'head')
            bind(mesh('amber eye',(side*.22,.52,.43),(.055,.08,.045),brass),rig,'head')
    else:
        sentry=kind=='sentry'
        for side,bone in [(-1,'foot_L'),(1,'foot_R')]:
            bind(mesh('leather greave',(side*.19,0,.41),(.14,.16,.34),leather),rig,bone)
            bind(mesh('iron toe',(side*.19,.12,.12),(.16,.26,.12),dark,'cube',.04),rig,bone)
        bind(mesh('padded coat',(0,0,.89),(.39,.26,.38),cloth,'cone'),rig,'hips')
        bind(mesh('cuirass',(0,0,1.2),(.36,.23,.28),steel,'cube',.06),rig,'spine')
        bind(mesh('back cloth',(0,-.24,1.09),(.3,.11,.43),cloth,'cube',.02),rig,'spine')
        bind(mesh('belt',(0,0,.92),(.39,.27,.07),leather,'cube',.02),rig,'hips')
        bind(mesh('belt clasp',(0,.28,.94),(.08,.035,.08),brass,'cube',.02),rig,'hips')
        for side,bone in [(-1,'shield_arm'),(1,'weapon_arm')]:
            bind(mesh('pauldron',(side*.37,0,1.35),(.23,.25,.17),dark if sentry else steel),rig,bone)
            bind(mesh('arm cloth',(side*.55,.12,1.15),(.16,.23,.15),cloth),rig,bone)
            bind(mesh('glove',(side*.66,.32,1.02),(.12,.15,.12),leather),rig,bone)
        bind(mesh('helmet',(0,.01,1.64),(.25,.27,.27),dark if sentry else steel),rig,'head')
        bind(mesh('helmet ridge',(0,0,1.88),(.045,.24,.07),brass if sentry else edge,'cube',.02),rig,'head')
        bind(mesh('visor',(0,.245,1.65),(.21,.05,.105),edge if sentry else dark,'cube',.02),rig,'head')
        # Shield stays LEFT local X; sword stays RIGHT. Actor yaw, never bitmap reflection.
        sx=-.68; sy=.36
        if sentry:
            ob=mesh('LEFT battered rectangular shield',(sx,sy,1.12),(.29,.13,.43),dark,'cube',.055)
            bind(ob,rig,'shield_hand')
            bind(mesh('LEFT shield iron face',(sx,sy+.14,1.13),(.22,.035,.35),cloth,'cube',.025),rig,'shield_hand')
            bind(mesh('LEFT shield boss',(sx,sy+.2,1.13),(.1,.06,.1),brass),rig,'shield_hand')
        else:
            ob=mesh('LEFT round shield',(sx,sy,1.08),(.34,.12,.37),edge)
            bind(ob,rig,'shield_hand')
            bind(mesh('LEFT painted shield',(sx,sy+.09,1.08),(.28,.06,.3),cloth),rig,'shield_hand')
            bind(mesh('LEFT shield boss',(sx,sy+.15,1.08),(.095,.07,.095),brass),rig,'shield_hand')
        bind(mesh('RIGHT sword grip',(.68,.42,1.03),(.055,.17,.055),leather,'cube',.015),rig,'weapon_hand')
        bind(mesh('RIGHT crossguard',(.68,.59,1.03),(.21,.045,.055),brass,'cube',.015),rig,'weapon_hand')
        # Blade points canonical +Y, with two broad faces and a deliberately clear point.
        verts=[(.60,.62,1.02),(.76,.62,1.02),(.73,1.32,1.02),(.68,1.5,1.02),(.63,1.32,1.02),(.68,.63,1.08),(.68,1.32,1.06)]
        faces=[(0,1,5),(1,2,6,5),(2,3,6),(3,4,6),(4,0,5,6),(0,4,3,2,1)]
        me=bpy.data.meshes.new('blade editable planes');me.from_pydata(verts,[],faces);me.materials.append(edge);me.materials.append(steel)
        ob=bpy.data.objects.new('RIGHT sword blade',me);bpy.context.collection.objects.link(ob)
        for i,p in enumerate(me.polygons):p.material_index=i%2
        bind(ob,rig,'weapon_hand')
    return rig

def scene_setup():
    scene=bpy.context.scene
    scene.render.engine='BLENDER_WORKBENCH'
    scene.render.resolution_x=192;scene.render.resolution_y=192;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
    scene.render.image_settings.color_depth='8';scene.render.fps=12
    s=scene.display.shading;s.light='STUDIO';s.studiolight_rotate_z=.4;s.color_type='MATERIAL';s.show_shadows=True;s.show_cavity=True;s.cavity_type='BOTH';s.curvature_ridge_factor=1.4;s.curvature_valley_factor=1.1
    s.show_specular_highlight=False;s.show_object_outline=True;s.object_outline_color=(.10,.16,.14)
    scene.display.render_aa='16';scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
    bpy.ops.object.camera_add(location=(0,-8*math.cos(math.radians(75)),8*math.sin(math.radians(75))))
    cam=bpy.context.object;cam.name='CAMERA_MASTER_LOCKED_75';cam.rotation_euler=((Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler());cam.data.type='ORTHO';cam.data.ortho_scale=5.4;scene.camera=cam
    for key,value in PRESET.items():scene[key]=json.dumps(value) if isinstance(value,(dict,list)) else value
    # Physical lights retained for future EEVEE material refinements; Workbench uses documented studio lighting.
    for name,loc,energy,size in [('KEY',(-3,-4,7),650,5),('FILL',(4,2,5),250,4)]:
        bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name;light.data.energy=energy;light.data.shape='DISK';light.data.size=size
    bpy.ops.object.empty_add(location=(0,0,0));bpy.context.object.name='FEET_PIVOT_WORLD_ORIGIN'
    return scene

def pose(rig,action,t,creature):
    for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0)
    def rot(name,xyz):rig.pose.bones[name].rotation_euler=tuple(math.radians(v) for v in xyz)
    if creature:
        if action=='walk':
            for side in [-1,1]:
                for j in range(3):rot(f'leg_{side}_{j}',(0,0,math.sin(t*math.tau+j*2+side)*18))
            rot('body',(0,0,math.sin(t*math.tau)*5))
        if action=='leap':
            amount=[-.13,.55,.05][min(2,int(t*3))]
            rig.pose.bones['body'].location.z=amount
            rot('head',([20,-18,0][min(2,int(t*3))],0,0));rot('tail',(0,0,30 if t<.3 else -10))
            for side in [-1,1]:
                for j in range(3):rot(f'leg_{side}_{j}',(0,0,side*(-35 if t<.3 else 25)))
    else:
        if action=='walk':
            a=math.sin(t*math.tau)*24;rot('foot_L',(a,0,0));rot('foot_R',(-a,0,0));rot('weapon_arm',(-a*.3,0,-5));rot('shield_arm',(a*.25,0,4))
        if action=='guard':
            amount=[.3,1,.3][min(2,int(t*3))];rot('shield_arm',(-25*amount,-10*amount,-28*amount));rot('weapon_arm',(-12,0,18))
        if action in ['light','heavy']:
            phase=min(2,int(t*3));heavy=action=='heavy'
            rot('spine',(0,0,[-22,28,7][phase]));rot('weapon_arm',([ -25,-5,4][phase],[-35,12,0][phase],[ -100 if heavy else -65,48,10][phase]));rot('weapon_hand',([ -30,10,0][phase],0,0));rot('shield_arm',(-12,0,12))
        if action=='bash':
            phase=min(2,int(t*3));rot('shield_arm',([8,-45,-5][phase],0,[-15,-35,-10][phase]));rot('spine',([0,15,0][phase],0,0))
        if action=='dodge':rot('spine',(25,0,25));rot('foot_L',(-30,0,10));rot('foot_R',(25,0,-15))
        if action=='reaction':rot('spine',(-25,0,-15));rot('weapon_arm',(10,0,-40))
    bpy.context.view_layer.update()

for kind in KINDS:
    rig=build(kind);scene=scene_setup();creature=kind=='mireling'
    clips={'idle':(FACINGS,1),'walk':(FACINGS,4)}
    if not creature:clips['guard']=(FACINGS,3)
    if kind=='adventurer':clips.update({'light':(SELECT,3),'heavy':(FACINGS,3),'dodge':(SELECT,1),'reaction':(SELECT,1)})
    if kind=='sentry':clips.update({'light':(SELECT,3),'bash':(SELECT,3)})
    if creature:clips['leap']=(FACINGS,3)
    rig.animation_data_create()
    for action,(facings,count) in clips.items():
        act=bpy.data.actions.new(f'{kind}__{action}');rig.animation_data.action=act
        for i in range(count):
            scene.frame_set(i+1);pose(rig,action,(i+.1)/count,creature)
            for b in rig.pose.bones:
                b.keyframe_insert('rotation_euler',frame=i+1,group=b.name);b.keyframe_insert('location',frame=i+1,group=b.name)
        act.use_fake_user=True
    rig.animation_data.action=bpy.data.actions.get(f'{kind}__idle');scene.frame_set(1)
    rig['equipment_handedness']='sword RIGHT +X; shield LEFT -X; never mirror' if not creature else 'independent low-creature skeleton'
    bpy.ops.wm.save_as_mainfile(filepath=str(SRC/f'{kind}.blend'))
    for action,(facings,count) in clips.items():
        rig.animation_data.action=bpy.data.actions.get(f'{kind}__{action}')
        for facing in facings:
            rig.rotation_euler[2]=-FACINGS.index(facing)*math.pi/4
            for i in range(count):
                if SAMPLE and (action!='guard' or facing!='NE' or i!=1):continue
                scene.frame_set(i+1)
                name=f'{kind}__{action}__{facing}__{i:02d}'
                dest=REND/kind/f'{name}.png';dest.parent.mkdir(parents=True,exist_ok=True)
                scene.render.filepath=str(dest);bpy.ops.render.render(write_still=True)
                ALL.append({'name':name,'actor':kind,'action':action,'facing':facing,'modelYaw':-FACINGS.index(facing)*45,'sourceFrame':i+1,'frameIndex':i,'phase':(['windup','active','recovery'][i] if action in ['light','heavy','bash','leap'] else 'loop'),'phaseProgress':(i+.1)/count,'sourceCanvas':[192,192],'feetPivot':[96,96],'renderPresetHash':HASH,'renderPreset':PRESET,'source':f'characters/source/{kind}.blend','license':'CC0-1.0','file':str(dest.relative_to(ROOT))})
    (REND/kind/'frames.json').write_text(json.dumps(ALL[-sum(len(f)*n for f,n in clips.values()):],indent=2)+'\n')
(SRC/'render-preset.json').write_text(json.dumps(PRESET|{'hash':HASH},indent=2)+'\n')
print('IDLE SOULS EXPORT COMPLETE',len(ALL),'frames')
