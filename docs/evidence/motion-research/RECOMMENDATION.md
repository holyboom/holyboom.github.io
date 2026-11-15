# Natural human motion — research and next implementation decision

Research date: 2026-11-14. Scope: natural posing and motion for the existing symbolic woven character. The current 31 scenes, semantic colours, gravity-inspired environment, cinematic camera and reversible scroll remain the baseline. Production code and deployed files were not changed in this research pass.

## Recommendation

Build a **small, fixed-proportion hierarchical rig with FK/IK and contact targets**, then author/polish reusable actions in **Blender + Rigify + Graph Editor**. Drive the existing wire surface from evaluated local joint transforms. Use a three-action proof before extending across the story. This is an engineering judgment based on the measured current defects and retrieved sources, not a promise that a library alone will improve acting.

This is a meaningful replacement of the character's motion layer, not another easing tweak. It does not require replacing the page, camera, story, palette or entire renderer.

## Why the present motion looks artificial

The local source audit found:

| Finding | Evidence | Practical consequence |
| --- | --- | --- |
| Limb lengths are authored independently by pose | Left forearm ranges 0.395–1.435 model units (3.63×); right upper arm varies 3.21× | The person changes proportions to reach a prop |
| Vertices interpolate between finished shapes | Reflect → repair right forearm midpoint shrinks 45.6% relative to the mean endpoint length, before the extra body contraction | Smooth interpolation still looks like a rubber morph |
| Standing torso/feet do not participate | All 17 standing beats share the same hip, shoulder-centre and foot positions | No weight transfer, supporting leg or body counter-pose |
| Hands lack local articulation | Fixed world-space finger offsets; no wrist frame for the palm | Typing, drawing and offering share an ambiguous hand shape |
| One timing interval drives all anatomy | Head, body, hand and detail groups all move over the same 0–76% interval | No gaze lead, preparation, overlap or recovery |
| No consistent support surface | Sole-to-visible-sheet offsets range −0.577 to +0.151 model units | The sheet looks disconnected from the person's weight |

The terrain is decorative, not a collider. Its offsets are a visual-grounding diagnostic, not evidence that the current program has a broken physics solver. Full method and results: [audit](ANATOMY-AUDIT.md), [data](anatomy-audit.json). Source locations: `geometry.js` pose construction around lines 29–56, limbs/hands around 119–126, vertex interpolation/body contraction around 173–198.

## What professional practice contributes

1. **Reference → thumbnails → blocking → breakdowns → curves → polish.** Plan the action and contact first. The Animation Mentor push/pull walkthrough describes using FK for free swinging and IK after contact, with deliberate breakdowns before spline interpolation [S1]. Apply that process to drawing and rising, not its heavy-object story.
2. **Weight and balance.** Move the pelvis relative to the supporting feet; coordinate spine and shoulders so effort is visible. Timing and posture jointly communicate weight [S2]. A lower pose alone does not demonstrate that weight has moved.
3. **Motion arcs.** Give the hand a deliberate path and orientation; clean its trajectory in a fixed view. Both curved and straight paths can be intentional, but endpoint-only movement is insufficient [S3].
4. **Two-bone IK with bend guidance.** A target defines the hand/foot position; a hint/pole defines elbow/knee bend direction [S4, S6]. Disable stretch for this anatomical layer. If a target is unreachable, move the root/shoulder/prop or change the staging rather than lengthening a limb.
5. **Offline authoring and baking.** Rigify builds controls and bones, not skinning [S5]. Bake evaluated deformation-bone animation; do not expect Blender's control constraints to execute inside the web renderer [S7].

## Highest-return implementation order

### 1. A dependable body and shared contact coordinates

- Define one rest skeleton with fixed limb lengths, pelvis, 2–3 spine segments, neck/head, clavicles, arms, legs and wrists.
- Animate local rotations and root translation. Use normalized quaternion interpolation for rotations and fixed local bone offsets. Blending world-space joint positions or matrices directly can reintroduce shortening/shear.
- Expose prop frames and grip/drawing/contact points as shared scene data. `poseAt()` and prop rendering must consume the same targets; current props and anatomy are authored separately.
- Use analytic two-bone IK for arms/legs, stable bend directions, joint limits and a reach clamp. No free-running body physics is required for this scroll experience.
- Introduce a stable support/contact plane or designed support patches below the feet and a real seat target. The decorative wave may continue moving around them.
- Attach the stylus/light to a wrist/grip frame. Keep the light trail derived from the resulting hand path.
- Keep gravity collapse on the environment. Preserve anatomical lengths once the human is formed. The opening abstract-to-human reveal may retain its explicit formation morph.

### 2. Three motion proofs with clear intentions

| Pilot | Preparation | Main action | Contact and recovery |
| --- | --- | --- | --- |
| Draw a line | Look at the paper, lean from pelvis/spine, place the supporting hand | Elbow leads a small wrist/stylus arc; shoulders respond subtly | Pen tip remains on the drawing plane while drawing; lift before repositioning |
| Reflect → return to work | Head lowers, gaze pauses, shoulders soften | Gaze returns toward the task before torso/arm; hand reaches along a deliberate path | Wrist turns into the intended grip and settles at the task |
| Sit → stand | Feet settle beneath the body; torso leans forward and hips load | Weight transfers over the supporting feet before the pelvis rises | Legs extend while feet remain planted; chest/head finish with a small settling motion |

Review first with the camera held still and distracting glow reduced, then with the approved camera path and colours. A camera move must not conceal a weak pose or contact error. The user should be able to identify the action from silhouette and interaction, without reading its caption.

### 3. Reuse a small action library across the 31 beats

Author roughly 6–8 motion phrases (drawing, typing, reaching/placing, inspecting, reflecting, standing/recovering, presenting) with target, handedness, tempo and emotional-intensity variations. This is an initial library design, not a requirement for 31 separately animated clips.

Build three readable hand presets first: relaxed, stylus/grip, open offer. Add articulated fingers only where a close shot needs them. Add chest breathing, gaze lead, shoulder/pelvis counter-rotation and restrained follow-through after the main body mechanics work. Random jitter or a uniform whole-body sine wave is not a substitute for these actions.

The dramatic passage can read through softened shoulders and a pause before returning to the work; it does not need exaggerated collapse or invented emotional events.

## Toolchain and integration choice

| Route | Expected return | Relative effort | Decision |
| --- | --- | --- | --- |
| Fixed rig + FK/IK in the current renderer | Directly addresses the measured structural problems | Medium | First foundation |
| Blender/Rigify authored clips → existing renderer | Better control of poses, arcs and acting; clips are reusable | Medium–high initial setup | Preferred authoring path after the three proofs |
| Blender rigged GLB → Three.js SkinnedMesh | Volumetric meshes, depth-tested occlusion and broader camera freedom | High migration cost | Reconsider if those capabilities become the goal or profiling warrants it |
| Mixamo clips as input | Fast access to generic motions | Low acquisition, meaningful retarget/cleanup effort | Optional reference/start point, not the drawing/emotion solution |

The current disconnected procedural strands are not a ready Mixamo auto-rig upload. Rigify also does not automatically attach this line representation to bones. Keep a cached bind-space representation of strands; deform them through bone-local transforms, with limited blending around joints/torso. This adapter is new work.

For authored data, bake local deformation-bone rotations and root motion with contact-phase metadata. A compact custom export adapter is required for the current renderer. Use glTF/GLB when taking the Three.js route. Both paths should evaluate an absolute clip time from scroll position; avoid accumulated `update(dt)` state for primary body animation. Three.js documents exact `AnimationMixer.setTime()` seeking, including the effect of `timeScale` [S8].

FK/IK changes should be matched at the handoff and blended with contact-aware weights; blindly crossfading separate clips may reintroduce sliding feet. Sample local rotations with quaternion slerp [S9]. Secondary physical effects should be baked or analytic when exact reverse scrubbing is required.

## Actual tool feasibility check in this session

Blender **4.3.2** runs in the workspace; the Rigify module is available. A separate two-bone Blender IK probe was run with fixed lengths, stretching disabled, a pole target and a slightly bent rest pose. Across 61 forward/backward samples:

- Maximum bone-length error: approximately **1.1 × 10⁻⁷ model units**.
- Maximum target error: approximately **9.5 × 10⁻⁵ model units**.
- Forward/backward tip-position difference for the sampled targets: **0**.

The initial perfectly straight rest-chain probe failed to bend to the intended inner targets. A slightly bent rest chain resolved that singular setup. This is a practical reminder to define a stable rest bend and pole direction; it is not a full-body quality result.

[Probe code](blender_ik_probe.py) · [Measured output](blender-ik-probe.json)

This verifies a small solver setup only. It does not establish a finished human rig, a motion clip, browser integration or a new performance result. No character/model/motion asset was downloaded, and production rendering remains unchanged.

## Acceptance criteria before scaling up

- Bone lengths stay within 0.5% of rest lengths throughout anatomical motion; opening formation is explicitly excluded.
- During declared contact intervals, hand/foot world-space residual stays below a proposed 1% of the relevant limb length. Evaluate both planted contact and release, not just endpoint poses.
- No elbow/knee flip or wrist snap near straightened chains; unreachable targets have an authored fallback.
- Drawing, reflecting/returning and rising remain recognizable in silhouette and from the existing camera presets.
- Forward/reverse sampling produces the same pose at the same scroll position. Contact acquisition/release is also reversible.
- Head and hand arcs are inspected frame-by-frame; gaze, torso and hands do not all start and stop together by default.
- Retest the existing 31-scene camera bounds, trail alignment, reduced motion, mobile layout and no-JavaScript fallback.
- Benchmark against the current v5 render diagnostic with the same device, resolution, strand detail and workload. Set a render budget from that baseline; no FPS gain is assumed before the motion prototype is measured.

Effort categories and acceptance thresholds above are proposed project decisions, not performance guarantees or universal animation standards.

## Sources read

- **S1:** Animation Mentor, *Animating Pushing and Pulling Motions for Strong Body Mechanics* — https://www.animationmentor.com/blog/tutorial-animating-pushing-and-pulling-motions/
- **S2:** Wayne Gilbert / Animation Mentor, *How to Create Believable Weight in Animation* — https://www.animationmentor.com/blog/how-to-create-believable-weight-in-animation/
- **S3:** Anthony Wong / Animation Mentor, *Arc: The 12 Basic Principles of Animation* — https://www.animationmentor.com/blog/arc-the-12-basic-principles-of-animation/
- **S4:** Unity Animation Rigging 1.2.1, *Two Bone IK* — https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.2/manual/constraints/TwoBoneIKConstraint.html
- **S5:** Blender Manual, *Rigify introduction* — https://docs.blender.org/manual/en/latest/addons/rigify/introduction.html
- **S6:** Blender Manual, *Inverse Kinematics Constraint* — https://docs.blender.org/manual/en/latest/animation/constraints/tracking/ik_solver.html
- **S7:** Blender Manual, *glTF 2.0 export* — https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html
- **S8:** Three.js, *AnimationMixer* — https://threejs.org/docs/pages/AnimationMixer.html
- **S9:** Three.js, *Quaternion* — https://threejs.org/docs/pages/Quaternion.html
- **S10:** Adobe, *Mixamo FAQ* — https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html

These sources support the methods/tool capabilities. The measured current defects, selected pilot actions and return-on-effort recommendation are project-specific analysis. See [pipeline research](pipeline-research.md) for the licensing/input constraints and version caveats of optional tools.
