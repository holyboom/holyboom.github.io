# Procedural human motion audit

Read-only analysis of `assets/profile/geometry.js` and `living.js`. No production source or scene was modified. Raw measurements are in `anatomy-audit.json`.

## Measured findings

The scene has recognizable human landmarks, but it does not yet use a fixed-length articulated skeleton. `pose()` assigns world-space shoulder, elbow, wrist, hip, knee and ankle coordinates independently, and `tube()` joins those positions. The resulting lengths change substantially between authored actions.

| Segment | Smallest length | Largest length | Largest / smallest |
| --- | ---: | ---: | ---: |
| Left upper arm | 0.3431 | 0.4920 | 1.43× |
| Left forearm | 0.3950 | 1.4353 | 3.63× |
| Right upper arm | 0.2864 | 0.9183 | 3.21× |
| Right forearm | 0.4147 | 1.0968 | 2.64× |
| Left thigh | 0.4981 | 0.6564 | 1.32× |
| Right thigh | 0.4717 | 0.6458 | 1.37× |

These are model-coordinate lengths, not metres. The hero's abstract surface is excluded. For example, the `type` pose moves the left hand to `[0.32, -0.15, 0.88]` while leaving the elbow at `[-0.91, -0.03, 0.15]`. Reaching the new keyboard location stretches the forearm rather than solving elbow/shoulder placement.

Interpolation adds a second distortion. The midpoint between `reflect` and `repair` gives the right forearm a centreline length of **0.3546**, compared with an average endpoint length of **0.6518**: a **45.6% contraction** relative to that average. This diagnostic isolates the linear interpolation of the same landmark endpoints. The renderer additionally applies up to **4.5% uniform contraction** to human geometry around the hand attractor. Continuous easing cannot correct this geometric collapse.

All **17 standing beats** share the same:

- Hip: `[-0.4, -0.22, -0.08]`
- Shoulder centre: `[-0.4, 0.48, -0.02]`
- Feet: `[[-0.6, -1.24, 0.12], [-0.18, -1.24, 0.1]]`

There is therefore no authored weight transfer or pelvis/shoulder counter-pose while the arms reach. The torso has a single straight centreline; head motion is position plus one pitch angle. Palms and fingers are constructed with fixed world-space offsets, so the fingers do not follow a rotated wrist and cannot change between writing, typing, pointing or offering grips.

The apparent foot support is also inconsistent. Authored ankle heights remain `y = -1.24`, with nominal shoe soles at `-1.355`. Sampling the animated woven sheet beneath the same foot locations produces sole-to-sheet differences from **−0.5771** to **+0.1511**. Negative means below the sheet; positive means above it. The sheet may be intended as decorative scenery, so these are not assertions of a failed physical simulation. They demonstrate that it does not serve as a controlled contact surface. A separate stable support plane, with the decorative weave shaped around contacts, would be simpler than making the person continuously balance on an undulating sheet.

## Source-level causes

- `geometry.js:29`: world-space pose coordinates, rather than fixed rest lengths and local rotations.
- `geometry.js:81`: tubes align independently to endpoint vectors; their reference basis switches near vertical directions, without a persistent twist frame.
- `geometry.js:123`: palm and finger geometry uses fixed offsets and no wrist orientation or finger joints.
- `geometry.js:152`: the visible ground is generated independently from feet/support contacts.
- `geometry.js:173`: the whole body, hand, hair and details share one timing range.
- `geometry.js:184`: shape vertices interpolate directly between different poses instead of moving through an articulated skeleton.
- `living.js:70`: the existing ambient “breath” scales the entire geometry by 0.8% on a 10-second cycle in two locations; it is not chest/rib/pelvis breathing.

## Highest-return order

1. **Fixed proportions and constrained joints.** Define one rest skeleton, preserve limb lengths, and solve arms/legs with two-bone IK plus stable elbow/knee pole directions. Reach targets must be reachable: move/reorient the prop or add a natural torso lean rather than stretching a limb. Keep the existing camera, story, colours, woven strands and Canvas renderer. Human-to-human motion should use articulated transforms; reserve free vertex morphing for the initial membrane reveal and the environment.
2. **Contact and action before secondary motion.** Author short action clips for drawing, typing, reviewing, reflecting, rising and offering. Include hand trajectories on arcs, wrist orientation and a few grip presets; pin the stylus tip or fingers to a task-space target during contact. Lock support feet and animate the pelvis through sitting/standing. A held drawing pose needs an actual small stroke, not only a pose transition.
3. **Weight, anticipation and overlap.** Add pelvis/shoulder counter-pose, head/gaze leading a reach, torso following, wrist/fingers settling last, and a restrained chest breathing layer. Preserve deterministic scrubbing by sampling authored curves from local scene progress. Live physics or free-running springs are unnecessary initially and complicate reverse playback.

A focused before/after proof should cover (a) drawing on a board, (b) the current `reflect → repair` reach, and (c) seated-to-standing persistence. These expose the current structural problems and cover most reusable rig features. Expand the same small clip library across 31 story beats only after those three actions read naturally.

## Implementation caution

The current scene caches complete strand arrays per pose. A rig should not rebuild every ellipse/tube from scratch each frame. Cache strand samples in local bone space and transform them with a small hierarchy (plus light blending around shoulders/elbows); use typed/reused buffers where appropriate. Benchmark after adding joint solving and deformation. The audit does not claim a performance improvement or measured animation-quality outcome for a system that has not yet been built.

## Method

The audit loaded the current `geometry.js` into a temporary Node VM and exposed `pose()` only in that in-memory copy. Lengths used the same shoulder/hip offsets and endpoints as the production `tube()` calls. Midpoint diagnostics linearly interpolated each endpoint pair before measuring their distance. Foot comparison sampled the terrain formula at the nominal lowest shoe point and accounted for the scene's scale. No source export was changed.
