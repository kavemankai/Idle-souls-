"""Append O1 action poses to existing editable Blender rigs, without rebuilding geometry or camera.
Blender 4.3.2: blender -b -t 4 --python tools/blender/add_o1_actions.py
Idempotent: authored actions are left unmodified on reruns.
"""
import bpy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'assets/characters/source'

def radians(values):
    return tuple(math.radians(float(x)) for x in values)

def reset(rig):
    for bone in rig.pose.bones:
        bone.rotation_mode = 'XYZ'
        bone.rotation_euler = (0, 0, 0)
        bone.location = (0, 0, 0)

def twist(rig, name, degrees):
    rig.pose.bones[name].rotation_euler = radians(degrees)

def sentry_reaction(rig, frame):
    # A distinct stagger silhouette: recoil through torso, left shield displaced,
    # right-hand sword lowered. No weapon-handedness swap or simulated knockback.
    twist(rig, 'spine', (-21, 2, 19))
    twist(rig, 'head', (10, 0, -9))
    twist(rig, 'weapon_arm', (19, -17, -43))
    twist(rig, 'shield_arm', (-13, -10, 24))
    twist(rig, 'foot_L', (-12, 0, -7))
    twist(rig, 'foot_R', (12, 0, 8))

def mireling_reaction(rig, frame):
    # Flinch backward into the chitin with legs splayed. Ground pivot never moves.
    rig.pose.bones['body'].location.y = -.12
    rig.pose.bones['body'].location.z = -.075
    twist(rig, 'body', (0, 0, 18))
    twist(rig, 'head', (25, 0, -12))
    twist(rig, 'tail', (0, 0, -26))
    for side in (-1, 1):
        for leg in range(3):
            twist(rig, f'leg_{side}_{leg}', (0, 0, side * 24))

def mireling_bite(rig, frame):
    # Three separate keyed poses aligned to actual simulator windup/active/recovery.
    # Move timing (8/3/12 ticks) is supplied by the simulator, never by this art.
    stage = frame - 1
    rig.pose.bones['body'].location.y = [-.14, .19, -.04][stage]
    rig.pose.bones['body'].location.z = [-.055, .03, 0][stage]
    twist(rig, 'head', ([25, -23, 9][stage], 0, 0))
    twist(rig, 'tail', (0, 0, [16, -18, 0][stage]))
    twist(rig, 'body', ([0, -7, 5][stage], 0, 0))
    for side in (-1, 1):
        for leg in range(3):
            twist(rig, f'leg_{side}_{leg}', (0, 0, side * [23, -17, 3][stage]))


def humanoid_death(rig, frame):
    """Three key-poses for a fall, with the same rig, camera and equipment hands."""
    i = frame - 1
    rig.pose.bones['hips'].location.z = [0, -.18, -.37][i]
    rig.pose.bones['hips'].location.y = [0, .02, .14][i]
    twist(rig, 'hips', ([0, 19, 42][i], 0, [5, 15, 18][i]))
    twist(rig, 'spine', ([19, 52, 79][i], 0, [-12, 12, 16][i]))
    twist(rig, 'head', ([5, 11, 25][i], 0, 0))
    twist(rig, 'shield_arm', ([-15, -27, -42][i], 0, [-5, -17, -24][i]))
    twist(rig, 'weapon_arm', ([13, 36, 53][i], 0, [-25, -39, -52][i]))
    twist(rig, 'foot_L', ([-7, -22, -38][i], 0, 8))
    twist(rig, 'foot_R', ([12, 20, 35][i], 0, -7))

def mireling_death(rig, frame):
    """Crumple the Mireling through 3 poses; no hitbox or physics changes."""
    i = frame - 1
    rig.pose.bones['body'].location.z = [0, -.10, -.19][i]
    rig.pose.bones['body'].location.y = [0, -.09, -.16][i]
    twist(rig, 'body', ([0, 13, 26][i], 0, [8, 17, 23][i]))
    twist(rig, 'head', ([12, 30, 49][i], 0, -10))
    twist(rig, 'tail', (0, 0, [12, -22, -42][i]))
    for side in (-1, 1):
        for leg in range(3):
            twist(rig, f'leg_{side}_{leg}', (0, 0, side * [13, 33, 58][i]))

specs = (
    ('adventurer', {'death': (3, humanoid_death)}),
    ('sentry', {'reaction': (1, sentry_reaction), 'death': (3, humanoid_death)}),
    ('mireling', {'light': (3, mireling_bite), 'reaction': (1, mireling_reaction), 'death': (3, mireling_death)}),
)
for kind, actions in specs:
    path = SRC / f'{kind}.blend'
    bpy.ops.wm.open_mainfile(filepath=str(path))
    rigs = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    if len(rigs) != 1:
        raise ValueError(f'{kind}: expected exactly one original rig, got {len(rigs)}')
    rig = rigs[0]
    rig.animation_data_create()
    added = []
    for action, (count, painter) in actions.items():
        name = f'{kind}__{action}'
        if bpy.data.actions.get(name) is not None:
            print(f'PRESERVED existing {name}')
            continue
        clip = bpy.data.actions.new(name)
        rig.animation_data.action = clip
        for i in range(count):
            bpy.context.scene.frame_set(i + 1)
            reset(rig)
            painter(rig, i + 1)
            for bone in rig.pose.bones:
                bone.keyframe_insert('rotation_euler', frame=i + 1, group=bone.name)
                bone.keyframe_insert('location', frame=i + 1, group=bone.name)
        clip.use_fake_user = True
        added.append(name)
    if added:
        rig.animation_data.action = bpy.data.actions.get(f'{kind}__idle')
        bpy.context.scene.frame_set(1)
        bpy.ops.wm.save_as_mainfile(filepath=str(path))
        print('ADDED', kind, ', '.join(added))
    else:
        print('NO CHANGE', kind)
