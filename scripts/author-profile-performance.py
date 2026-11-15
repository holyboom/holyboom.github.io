"""Author and bake compact expressive control clips in Blender.

Run: blender --background --python scripts/author-profile-performance.py
The browser rig owns primary action, fixed anatomy, IK and contact. These real
Blender Actions supply bounded secondary offsets, sampled at absolute scroll
phase. This does not export a full Rigify character or a skinned mesh.
"""
import bpy, json, math, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/profile/performance-source'
OUT.mkdir(parents=True, exist_ok=True)
FPS, END_FRAME, SAMPLES = 60, 121, 61
CHANNELS = ['lean', 'yaw', 'headYaw', 'headPitch'] + [f'{name}_{axis}' for name in ['handR', 'handL', 'pelvis'] for axis in 'xyz']
ZERO = {name: 0.0 for name in CHANNELS}

# Keyed phase, amount. These are expressive offsets, not the primary action.
# Contact intervals are intentionally unmodified: drawing .28-.68, repair .42-.72.
# The rising rig owns primary pelvis transfer and both foot plants.
CURVES = {
    'draw': {
        'lean': [(0,0),(.12,.015),(.28,.055),(.58,.06),(.70,.035),(.86,-.01),(1,0)],
        'yaw': [(0,0),(.18,-.018),(.48,-.025),(.74,-.01),(1,0)],
        'headYaw': [(0,0),(.08,.035),(.30,.045),(.65,.025),(.82,-.015),(1,0)],
        'headPitch': [(0,0),(.10,.065),(.28,.075),(.62,.065),(.82,-.025),(1,0)],
        'handR_x': [(0,0),(.15,-.025),(.28,0),(.68,0),(.82,-.018),(1,0)],
        'handR_y': [(0,0),(.16,.03),(.28,0),(.68,0),(.80,.042),(1,0)],
        'handR_z': [(0,0),(.16,-.015),(.28,0),(.68,0),(.82,-.02),(1,0)],
    },
    'repair': {
        'lean': [(0,0),(.12,-.018),(.30,.018),(.48,.065),(.66,.055),(.84,.012),(1,0)],
        'yaw': [(0,0),(.16,-.035),(.36,-.045),(.58,.015),(.80,.012),(1,0)],
        'headYaw': [(0,0),(.08,.055),(.26,.07),(.52,.025),(.78,-.01),(1,0)],
        'headPitch': [(0,0),(.12,-.035),(.30,.02),(.48,.055),(.70,.035),(.88,-.01),(1,0)],
        'handL_x': [(0,0),(.16,-.035),(.28,-.025),(.42,0),(1,0)],
        'handL_y': [(0,0),(.16,.025),(.30,.01),(.42,0),(1,0)],
        'handR_x': [(0,0),(.28,-.025),(.42,0),(.72,0),(.86,-.012),(1,0)],
        'handR_y': [(0,0),(.30,.025),(.42,0),(.72,0),(.86,.032),(1,0)],
        'handR_z': [(0,0),(.30,-.018),(.42,0),(.72,0),(.86,-.016),(1,0)],
    },
    'rise': {
        'lean': [(0,0),(.14,.035),(.30,.12),(.45,.095),(.64,.02),(.79,-.018),(1,0)],
        'yaw': [(0,0),(.18,-.025),(.38,-.025),(.62,.015),(.84,.008),(1,0)],
        'headYaw': [(0,0),(.14,.025),(.34,.035),(.62,.018),(.88,-.008),(1,0)],
        'headPitch': [(0,0),(.10,.045),(.28,.075),(.48,.04),(.69,-.025),(.86,-.01),(1,0)],
    },
}
INTENT = {
    'draw': 'Attention leads; hand prepares; fixed contact is preserved; wrist lifts before recovery.',
    'repair': 'Attention returns, left hand prepares first, right hand takes a shorter path, then releases.',
    'rise': 'Forward preparation precedes standing; pelvis and feet remain owned by the IK rig; chest/head settle last.',
}
CONTACTS = {'draw': {'handR': [[.28,.68]], 'handL': [[0,1]]}, 'repair': {'handR': [[.42,.72]], 'handL': [[.42,.72]]}, 'rise': {'handL': [[0,1]], 'feet': 'primary-rig-owned'}}

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for action in list(bpy.data.actions):
    if action.users == 0:
        bpy.data.actions.remove(action)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = END_FRAME
scene.render.fps = FPS
scene['purpose'] = 'Secondary performance control curves. No full character rig or skinning is exported.'
scene['browser_coordinate_system'] = 'X right, Y up, Z toward viewer; angles in radians; offsets in model units.'
scene['contact_rule'] = 'The browser applies contact constraints after these bounded offsets.'
bpy.context.preferences.filepaths.save_version = 0
controls = {}
for name in CURVES:
    obj = bpy.data.objects.new('PERFORMANCE_' + name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_type = 'PLAIN_AXES'
    obj.empty_display_size = .12
    obj.location = (0, 0, 0)
    obj['intent'] = INTENT[name]
    obj.animation_data_create()
    action = bpy.data.actions.new('Performance / ' + name)
    obj.animation_data.action = action
    for channel in CHANNELS:
        keys = CURVES[name].get(channel, [(0,0),(1,0)])
        for phase, value in keys:
            obj[channel] = float(value)
            obj.keyframe_insert(data_path=f'["{channel}"]', frame=1 + phase * (END_FRAME - 1), group='Angles' if '_' not in channel else channel.split('_')[0])
    for curve in action.fcurves:
        for key in curve.keyframe_points:
            key.interpolation = 'BEZIER'
            key.handle_left_type = 'AUTO_CLAMPED'
            key.handle_right_type = 'AUTO_CLAMPED'
        # Explicitly horizontal endpoint tangents keep offset handoffs quiet.
        for key in [curve.keyframe_points[0], curve.keyframe_points[-1]]:
            key.handle_left_type = 'FREE'
            key.handle_right_type = 'FREE'
            key.handle_left = (key.co.x - 2, key.co.y)
            key.handle_right = (key.co.x + 2, key.co.y)
    controls[name] = obj

clips = {}
for name, control in controls.items():
    keys = []
    for i in range(SAMPLES):
        t = i / (SAMPLES - 1)
        frame = 1 + t * (END_FRAME - 1)
        scene.frame_set(math.floor(frame), subframe=frame % 1)
        values = {channel: float(control[channel]) for channel in CHANNELS}
        row = {'t': round(t,8)}
        for channel in ['lean','yaw','headYaw','headPitch']:
            row[channel] = round(values[channel],8)
        for vector in ['handR','handL','pelvis']:
            row[vector] = [round(values[f'{vector}_{axis}'],8) for axis in 'xyz']
        keys.append(row)
    clips[name] = {'duration': 1, 'intent': INTENT[name], 'contactIntervals': CONTACTS[name], 'keys': keys}

# Pure-data validation: finite samples, exact offset-free handoffs and bounded ranges.
max_angle, max_offset = 0.0, 0.0
contact_residual = 0.0
for name, clip in clips.items():
    for row in clip['keys']:
        values = [row[k] for k in ['lean','yaw','headYaw','headPitch']] + row['handR'] + row['handL'] + row['pelvis']
        assert all(math.isfinite(v) for v in values)
        max_angle = max(max_angle, max(abs(row[k]) for k in ['lean','yaw','headYaw','headPitch']))
        max_offset = max(max_offset, max(abs(v) for v in row['handR']+row['handL']+row['pelvis']))
        for hand, intervals in CONTACTS[name].items():
            if hand not in ['handR','handL']: continue
            for begin, end in intervals:
                if begin <= row['t'] <= end:
                    contact_residual = max(contact_residual, max(abs(v) for v in row[hand]))
    for row in [clip['keys'][0],clip['keys'][-1]]:
        assert max(abs(v) for v in [row[k] for k in ['lean','yaw','headYaw','headPitch']]+row['handR']+row['handL']+row['pelvis']) == 0
assert .10 < max_angle <= .15 and .03 < max_offset <= .05
assert contact_residual < 1e-7, ('Unexpected contact offset',contact_residual)

payload = {
    'version': 'blender-performance-controls-1',
    'source': {'tool':'Blender','version':bpy.app.version_string,'authoringScript':'scripts/author-profile-performance.py','blendFile':'assets/profile/performance-source/performance-controls.blend','samplesPerClip':SAMPLES,'coordinateSystem':'X right, Y up, Z toward viewer','scope':'Bounded secondary control curves. Browser rig owns primary pose, bone lengths and contact constraints.'},
    'clips': clips,
}
serialized = json.dumps(payload,ensure_ascii=False,separators=(',',':'))
(OUT/'pilot-clips.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
(OUT/'pilot-clips.js').write_text('/* Generated by Blender. Edit the authoring script/source and rebake. */\n(function(root){"use strict";const data='+serialized+';if(typeof module==="object"&&module.exports)module.exports=data;else root.ProfilePerformanceClips=data;})(typeof globalThis!=="undefined"?globalThis:this);\n')
report = {'tool':'Blender '+bpy.app.version_string,'actions':list(clips),'samplesPerClip':SAMPLES,'maximumAngleRadians':max_angle,'maximumOffsetUnits':max_offset,'maximumDeclaredContactOffset':contact_residual,'boundaryOffsetsZero':True,'payloadSHA256':hashlib.sha256(serialized.encode()).hexdigest(),'scope':'Control-curve validation only, not a full-body IK/contact/acting validation.'}
(OUT/'bake-report.json').write_text(json.dumps(report,indent=2)+'\n')

# The .blend opens with real Actions and a curve inspection chart. The chart is a
# diagnostic visualization, not a representation of the browser character.
def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color,1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    emission = nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value = (*color,1)
    emission.inputs['Strength'].default_value = 1
    mat.node_tree.links.new(emission.outputs[0],out.inputs['Surface'])
    return mat
white = material('Typography',(.76,.74,.84))
muted = material('Grid',(.10,.09,.16))
colours = { 'lean':material('Lean violet',(.67,.37,1)), 'headPitch':material('Head amber',(1,.60,.24)), 'handR_y':material('Hand cyan',(.20,.80,1)) }
def text_obj(body,x,y,size=.18,mat=white):
    curve=bpy.data.curves.new('Label','FONT');curve.body=body;curve.size=size
    obj=bpy.data.objects.new('Label / '+body,curve);bpy.context.collection.objects.link(obj);obj.location=(x,y,.03);obj.data.materials.append(mat)
    return obj
def stroke(name,points,mat,width=.008):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=width;curve.bevel_resolution=2
    poly=curve.splines.new('POLY');poly.points.add(len(points)-1)
    for dst,point in zip(poly.points,points):dst.co=(*point,1)
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    return obj
text_obj('Authored performance / control curves',-.15,5.25,.30)
text_obj('Real Blender Actions; absolute phase samples for the deterministic browser rig.',-.15,4.88,.13)
text_obj('Violet: torso lean   Amber: head pitch   Cyan: right-hand lift',-.15,4.62,.13)
for index,(name,clip) in enumerate(clips.items()):
    base=3.55-index*1.55
    text_obj(name.upper(),-.15,base+.40,.20)
    text_obj(INTENT[name],-.15,base+.14,.085)
    for phase in [0,.25,.5,.75,1]:
        x=phase*6
        stroke('Guide',[(x,base-.75,0),(x,base,.0)],muted,.003)
        text_obj(str(round(phase,2)),x,base-.92,.09)
    stroke('Baseline',[(0,base-.62,0),(6,base-.62,0)],muted,.004)
    for channel in ['lean','headPitch','handR_y']:
        points=[]
        for row in clip['keys']:
            value=row['handR'][1] if channel=='handR_y' else row[channel]
            points.append((row['t']*6,base-.62+value*5,.02))
        stroke(name+' / '+channel,points,colours[channel])
scene.world.color=(.015,.012,.025)
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.012,.009,.023,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.1
bpy.ops.object.camera_add(location=(2.95,2.50,10))
camera=bpy.context.object;camera.name='Curve inspection camera';camera.data.type='ORTHO';camera.data.ortho_scale=8.4
scene.camera=camera
scene.render.engine='CYCLES'
scene.cycles.samples=8
scene.cycles.use_denoising=False
scene.render.resolution_x=1440;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='Standard'
scene.render.filepath=str(OUT/'control-curves.png')
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
controls['draw'].select_set(True)
bpy.context.view_layer.objects.active=controls['draw']
# Keep the Actions easily reachable in the ordinary Animation workspace.
for obj in controls.values():obj.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'performance-controls.blend'))
bpy.ops.render.render(write_still=True)
(OUT/'README.md').write_text('''# Authored performance controls

These three real Blender Actions provide bounded **secondary** timing/pose offsets for drawing, changed retry and rising. The browser rig owns the primary pose, fixed limb proportions, IK, grounded support and contact. This is not a complete Blender character rig or a skinned-mesh export.

- `performance-controls.blend`: open in Blender, select `PERFORMANCE_draw`, `PERFORMANCE_repair` or `PERFORMANCE_rise`, then inspect its Action in the Graph Editor.
- `pilot-clips.js` / `.json`: baked phase samples, evaluated from the Blender F-curves; phase is normalized scroll progress, not elapsed browser time.
- `bake-report.json`: numerical validation and a checksum of the exported data.
- `control-curves.png`: a diagnostic curve chart rendered from the source file.

Regenerate from the repository root:

```sh
blender --background --python scripts/author-profile-performance.py
```

The supported reproducible authoring source is the Python key specification. If editing the `.blend` by hand, transfer those intentional key changes into the script before regenerating; this script recreates the authoring scene.

Browser integration: load `pilot-clips.js`, then provide `ProfilePerformanceClips` to `ProfileMotion.setClips()`. Do not claim the data drive the live scene unless that call is present. Angles are radians. Coordinates are X right, Y up, Z toward the viewer, with small model-unit offsets around the browser's own stage. Apply authoritative contact constraints after secondary offsets. Endpoints contain zero offsets; declared drawing/contact phases leave the relevant hand offsets at zero. No external motion/model asset is bundled.
''')
print('PROFILE_PERFORMANCE_BAKE',json.dumps(report))
