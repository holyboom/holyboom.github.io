# Natural motion pipeline research

Research only. No production geometry, runtime, dependencies or deployed assets changed by this investigation.

## Recommendation

The best immediate return is a fixed-proportion hierarchical rig with two-bone IK and explicit hand/foot contact targets. Retain the existing woven material, camera, scroll mapping and Canvas renderer. Prototype three demanding actions (draw, reach/inspect, seated-to-standing) before touching all 31 scenes. Animation quality depends on posing, weight shift and contact, not the renderer brand.

Use Blender + Rigify + the Graph Editor as the next authoring step for polished reusable motion phrases. Bake only the evaluated deformation-bone transforms, then sample those transforms from scroll position in the current renderer. A compact custom joint-clip export requires a small adapter; this is a proposed pipeline, not a feature already supported by the site. Do not export Rigify controls and expect their constraints to run in the browser.

| Route | Relative effort | Best return | Main remaining work |
| --- | --- | --- | --- |
| Fixed bones + FK/IK in current renderer | Medium, most targeted | Removes limb stretching, floating hands/feet and simultaneous robotic movement while preserving the look | Pose blocking, reachable targets, wrist orientation, spine/pelvis motion and authored timing |
| Blender-authored baked joint clips → current renderer | Medium–high initial setup; reusable | Professional pose/curve authoring and coherent body mechanics without a renderer migration | Reference animation, baking/export adapter, local transform sampling, contact-aware transitions |
| Blender rigged GLB → Three.js SkinnedMesh | High | Full skinned geometry, proper depth testing and volumetric lighting; appropriate if future camera needs broad orbits | Woven material recreation, skinning, rig/asset integration, scene migration, accessibility fallbacks and performance validation |
| Mixamo motion as a starting point | Low acquisition; medium cleanup | Broad locomotion/idle references and reusable generic movement | Retargeting, character-specific proportion/contact cleanup; custom drawing and emotional gestures still need authoring |

Mixamo is optional, not a requirement. Its automatic rigger expects a clean connected humanoid mesh in a neutral pose; the current procedural collection of wire strands is not a ready-to-upload mesh. No external model or animation was downloaded during this research.

## Verified primary sources

1. **Blender, Rigify introduction** — <https://docs.blender.org/manual/en/latest/addons/rigify/introduction.html>
   - Rigify automates rigs using arms, legs, spine and fingers as building blocks.
   - Includes FK/IK controls and snapping.
   - Explicitly does **not** attach a rig to a mesh; skinning remains separate work.
   - Generated rigs can function without the Rigify add-on.

2. **Blender, Inverse Kinematics Constraint** — <https://docs.blender.org/manual/en/latest/animation/constraints/tracking/ik_solver.html>
   - IK rotates a bone chain to reach a target; the example is a desired hand position.
   - Pole targets determine elbow orientation.
   - Stretch is an explicit option. For this profile, use bounded reach with no unintended limb stretching.

3. **Blender, glTF 2.0 export** — <https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html>
   - Supports pose-bone, transform and shape-key animation.
   - “Export Deformation Bones only” bakes animation for deformation bones.
   - Includes sampling and duplicate-keyframe optimization.
   - “Bake All Objects Animations” is useful for constrained objects that are not animated directly.
   - This supports an offline bake/export workflow; it does not promise arbitrary Blender constraints or simulations will run at runtime.

4. **Blender, Actions** — <https://docs.blender.org/manual/en/latest/animation/actions.html>
   - Actions organize reusable animation data and can be exported as distinct animations.
   - Suitable for a small reusable motion library rather than 31 unrelated clips.

5. **Three.js, AnimationMixer** — <https://threejs.org/docs/pages/AnimationMixer.html>
   - `setTime(time)` evaluates an exact global animation time.
   - The time passed to `setTime()` is scaled by `timeScale`; setting the mixer scale to zero and then seeking is a trap.
   - `update(deltaTime)` advances accumulated time. For reversible scroll storytelling, absolute sampling is the appropriate principle.

6. **Three.js, Quaternion** — <https://threejs.org/docs/pages/Quaternion.html>
   - `slerp` / `slerpQuaternions` interpolate rotations spherically.
   - Relevant to interpolating local joint rotations while keeping bone lengths fixed; vertex-space blending does not provide that invariant.

7. **Adobe, Mixamo FAQ** — <https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html>
   - Retrieved FAQ says Mixamo is free with an Adobe ID and characters/animations may be used royalty-free in personal, commercial and nonprofit projects.
   - The FAQ displayed a September 14, 2021 update date. This was verified as the retrieved text, not assumed to be a newly issued policy.
   - It specifies a clean neutral humanoid mesh, without disconnected parts or extra scene objects, for automatic rigging.
   - This page was not treated as a blanket license to redistribute raw asset libraries.

## Integration details worth preserving

- Keep the same 31 story beats and named camera presets; a motion phrase can drive multiple beats with different targets and emotional intensity.
- A pure `poseAt(scrollPosition)` should determine root translation, local bone rotations, hand targets and contact states. Solve constraints deterministically from that state.
- Attach light and held props to the wrist/hand frame; use grip offsets rather than an absolute world-space offset.
- Keep the woven environment's dramatic collapse separate from anatomical scaling. It can move around a stable human rig.
- Use three pilot actions to measure perceived naturalness, contact error, fixed bone lengths, smooth reverse sampling and existing mobile render budgets.
- Live spring or ragdoll simulation is not the first choice for the main body: it introduces history dependence and makes exact reverse scrubbing harder. Secondary effects can be authored analytically or baked.

Sources retrieved during the current research session. Technical choices and relative effort are engineering judgments, not claims from the source documents.
