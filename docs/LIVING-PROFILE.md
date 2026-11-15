# Living Architecture — Faceless AI experiences / English profile

The English `/profile/` presents Boom's identity through **AI experiences**: architecture at heart, frontend craft, enterprise foundations, personal conviction, skills shaped by experience and synthesis, and systems that people can understand and want to use. `/th/profile/` and the main showcase retain their existing design and behavior.

## Build and preview

```sh
npm ci
npm run build
cd dist
node ../scripts/preview.mjs --host 127.0.0.1 --port 4174
```

Open `http://localhost:4174/profile/`. `npm run build` first generates the profiles and matching SVG fallbacks, then copies only manifest-approved files and validates discovery metadata. Never edit generated `profile/index.html` as the source of truth. Generation has no network dependency.

## Edit the story

- `scripts/data/profile-story.json`: English narrative, chapter order, headings, tags, release key and explicit updated date. Its scene indexes map to the 11 chapter anchors.
- `scripts/build-professional-profile.py`: shared professional identity, career descriptions, role-fit descriptions and existing Thai template. The English story and reverse-chronological summary read the same career entries.
- `scripts/profile_living.py`: English semantic HTML template, navigation, native disclosures, structured metadata inheritance, career summary and contact.
- To add a real case study, supply the actual problem, approach, change and a public evidence link. Do not invent employment dates, skill names, client metrics, testimonials or weekly development logs.
- Re-run `npm run build` after content or scene changes. Update the content `release` key when shipping changed assets; fallback and stylesheet/script references use it consistently. Both font licenses are retained.

## Edit the performance and woven world

The current release is `living-story-worlds-v16`. `assets/profile/scenes.js` owns camera presets, tones, environment energy and chapter configuration; page layout and typography are in `living.css`. Edit body proportions, action timing, support and contact targets in `motion.js`, and finger articulation in `hand-shapes.js`. Human anatomy is rebuilt from the rig; per-scene scale/stretch recipes are not body controls.

There are 31 visual beats across 11 section anchors. The 28 narrative beats in `scripts/data/profile-story.json` are synchronized into the generated `config.story` block by `build-profile-art.cjs`; do not hand-edit that block. Each beat names its action, caption, pose, prop, colour and shot. [The performance plan](plans/faceless-performance.json) specifies attention, preparation, action, response and a readable hold. Its percentages describe scroll distance, not waiting time. That file preserves the original planning snapshot; [the execution log](evidence/faceless-performance/EXECUTION.md) records implementation and current refinement status.

`motion.js` evaluates a deterministic fixed-length body rig using two-bone inverse kinematics for arms and legs, interpolated orientation frames, coordinated spine/weight changes and explicit support targets. `hand-shapes.js` rebuilds fixed-length finger segments with forward kinematics. Its index-tip, palm-pad and tool-tip features are shared by the visible hand geometry and contact calculations. Change those together. `press(pulse, side)` changes only the index joint angles for typing; the same FK fingertip drives key contact, so the wrist can stay comparatively still. Change gesture orientation without moving its intended world target unless the reach itself needs to change. The woven head is intentionally face-free; its direction, shoulders, torso and hands carry the acting. Seat, chair back, palm support and flattened floor patches establish where the body is supported. This is authored symbolic performance, not a force-based biomechanical simulation or a facial likeness.

Three real Blender Actions add bounded secondary curves for drawing, changed retry and rising. [The authoring source](../assets/profile/performance-source/README.md) includes the `.blend`, reproducible Python exporter and 61 samples per clip. The current bake is bounded to 0.12 radians and 0.042 model units, with zero endpoint offsets and zero declared contact offsets. The browser rig owns primary poses, limb lengths, weight transfer and contact constraints; this is not a full Blender character export. Regenerate with `blender --background --python scripts/author-profile-performance.py`.

`geometry.js` turns the sampled rig into **777 persistent strand IDs**, each with 48 samples. The opening retains the approved A surface by remapping 192 strands into an organic membrane. After that formation, anatomical strands come directly from the rig, without vertex morphing or gravity contraction. Environment strands keep their own delayed morph/deformation. Preserve strand identity, count and order across poses. Post-opening scene caches keep anatomy/support metadata but omit their unused vertex arrays; `frame()` supplies the sampled live rig instead. Scene0 and every cached environment strand retain their points. An isolated380-case comparison verified exact returned-frame parity for this cache change. `resolve()` maps chapter position into the beat timeline; `storyAt()` and `paletteAt()` keep captions and semantic colour aligned.

Props share the rig's work, keyboard and support frames. Typing scenes stage the editor as a floating panel above/right of the keyboard so both working hands remain visible without painting them through an opaque surface. Preparation and release determine their handoff, including placing the stylus at a fixed dock, opening the grip and leaving it there before typing. The drawing follows the actual tip path. `living.js` merges projected strands and prop paths into a painter queue using a normalized camera-space work plane: filled surfaces hide farther anatomy while nearer hands remain visible. Anatomical crossings and front-work orb rings are split at the work plane; the keyboard keeps a separate depth stack. The orb split preserves its near hemisphere above the opaque equator. Back-layer bridges retain their own depth. Label timing uses `textAlpha` so outgoing and incoming labels do not collide. The SVG builder mirrors this compositing and supplies 11 static fallbacks with titles/descriptions.

A separate `surroundings` illustration layer adds three faint, rounded background structures: architectural ribs, workspace fragments, connected workflow nodes or seed-like knowledge forms according to the chapter. Its 35 cached paths share the perspective camera and interpolate deterministically with scroll; phones omit 12 secondary paths. The personal-conviction chapter reduces opacity and density within the shapes to preserve its quieter space. Both Canvas and SVG paint this layer behind the actor and active work. It does not alter the rig, hand targets, camera or narrative.

Selected surrounding pieces dissolve and reassemble at nine semantic transitions configured in `scenes.js` → `dust.transitions` (source/destination prop names, flanking pods, interior-only option, inward gathering, spread and vertical drift). Their existing filaments break into six fragments each, contract into rounded grains, curl outward in depth, then join the next woven form. Geometry is a pure function of scroll position and stable fragment seeds, so reversing scroll exactly retraces the change. The largest research-to-skill transition has 120 grains; phones omit alternate grains, leaving at most 60, while retaining particle stroke width so the dust remains legible at small sizes. Dust shares the background painter, uses the chapter colour without bloom and ends before the readable hold. Intact no-JS/error SVG fallbacks contain no dust. The actor, hand light, work surfaces and camera are unchanged.

Chapter transitions occupy 16–91% of each anchor interval. Within them the rig's action phases control the human, while environment groups keep their own timing. The single canvas moves into the professional-summary and contact figures for the final beats. The five colour roles remain violet imagination/identity, cyan engineering, amber human conviction/agency, coral friction and mint approachable outcomes. Native text and recognizable actions support the same meanings.

`gravity` controls environment collapse (0.66), swirl (0.48 radians), trail span (0.25 chapter) and maximum trail lifetime (750 ms). This is a reversible, gravity-inspired deformation, not a gravity solver. The light emitter is a separate wrist-local point, independent of the actual fingertip/stylus contact and docked tool. `geometry.lightAt()` uses `motion.lightAt()` to supply that emitter's trajectory to the directional afterimage trail. The fast rig path shares the full evaluator and skips unused left-arm, leg, tool and drawing output; dense checks require exact equality with `poseAt(t).light`. Reversal resets the trail; rest, layout changes, hidden documents, offscreen art and large jumps clear or fade it. Static SVGs have no trail. No idle whole-body scaling is applied, so planted hands and feet stay planted.

Chapter-ending `bridge` and `hook` fields in the story JSON create a sentence and native link to the next chapter. Keep these specific to the narrative; do not replace them with generic “Next section” labels. `sceneDescription` provides the static illustration's accessible description. The hero hook links architectural childhood ambition to the woven world that unfolds into the maker in chapter one.

## Emotional continuity

`scenes.js` → `actingHolds` extends the settled pose at beats 13 (conviction), 20 (capability) and 23 (a clear entrance). These are native scroll intervals, not timed pauses: `resolve()` stays at the authored pose until the hold ends, while `cameraTrack()` and the orbit continue. The same monotonic resolver drives the body, work, contacts and hand light. The transition still settles by 85% of the beat; reverse scrolling follows the same curve.

A separate background illustration, `id: story-thread`, carries one warm filament from the wrist-local light into the lower woven world. Its 24 stable sections reshape according to `memoryForms`: architectural plan, component, connected form, broken thread, distilled coil, and an open invitation. During resistance, selected sections lose their ink into small grains; later chapters restore the same sections. It is a symbolic memory line, not a historical recording of cursor movement. There are at most 44 extra paths (including grains and two response ripples), with secondary detail omitted on phones. The directional hand afterimage remains independent.

`responseAt()` supplies bounded, scroll-derived environmental reactions. Nearby surrounding strands lean toward the hand during action, withdraw during resistance, and brighten slightly after selected completed actions. Two faint ground ripples propagate after completion. The body and support constraints do not inherit these offsets. No effect uses idle time, random spawning, wheel interception or an independent physics loop. No-JS/error fallbacks render intact static compositions through the shared SVG builder.

Run `npm run test:profile-story-soul` for held-pose/camera separation, monotonic release, filament attachment, head clearance, bounded geometry, forward/reverse reproducibility, and fracture/reformation. `scripts/capture-profile-story-soul.cjs` records the actual browser renderer with native scrolling across the holds.

## Cinematic camera

The existing 3D scene data is drawn through a shared perspective camera. Each story beat's `shot` names a preset in `scenes.js` → `camera.shots`. The nine presets are establish, draft, detail, connect, isolate, intimate, rise, reveal and portrait. Keep framing motivated by the action: elevated drafting, closer inspection, wide isolation, intimate reflection, visible support during a rise and a pullback to the connected result.

`cameraAt(position, {compact, strength, expanded})` derives target, orbit and distance from scroll. Outside the authored orbit and insert windows, camera moves begin at 8% and end at 96% of each beat. Quintic easing has zero first and second derivatives at the endpoints; logarithmic distance interpolation makes a push/pull perceptually smoother. The fixed focal length and changed camera distance produce real perspective and parallax, not CSS scaling. Units are model coordinates, not claimed physical lens millimetres.

`createProjector()` prepares trigonometry and viewport coefficients once per frame. Anatomy, props, labels, glow and trail share it; SVG fallback generation uses the same authored camera. `project()` remains available as a legacy neutral projection. The camera adjusts framing for seated poses and widens around support changes. Settled geometry is reused for pointer parallax, and rendering stops when scroll, pointer, disclosure and trails have settled.

Base presets span yaw −0.42…+0.58, pitch +0.02…+0.30 radians and distance 5.05–7.25 model units. Compact screens use 65% of base movement relative to neutral framing. Four authored windows in `camera.orbits` add side and rear views:

| Window | Purpose | Peak yaw desktop / compact |
| --- | --- | --- |
| `drawing-side` | Observe drawing becoming code from beside the hands | +62° / +57° |
| `conviction-rear` | Move behind the solitary maker and look outward with them | +163° / +152° |
| `synthesis-side` | Follow inward dust gathering into a capability | −62° / −57° |
| `experience-depth` | See the separation behind the interface and optional disclosed layers | +60° / +56° |

Each window has `start`, `lockStart`, `turnEnd`, `holdEnd`, `returnEnd` and `end` in linear camera-track coordinates. `cameraTrack(position)` counts beats before action easing; it is intentionally distinct from `resolve(position)`. Entry blends into an authored pivot, distance and pitch. Between `lockStart` and `returnEnd`, those values and focal length remain constant while yaw turns, holds and returns. Quintic entry/exit blending releases into the existing dolly camera. `orbitAt()` exposes the deterministic direction; it never captures mutable camera state. `cameraAt()` reports `orbitId`, `orbitWeight` and `locked`. Pointer parallax is attenuated by `1 - orbitWeight`, so it cannot disturb the fully locked composition. Compact peak angles are authored separately to retain a real rear view on phones.

The world, dust, body performance, hand light and disclosure continue on their existing scroll timeline. The experience-depth window additionally authors `disclosureFan`: revealed rear graphs spread laterally and downward as the side angle increases, keeping their nodes off the faceless head while retaining their world-space depth and bridges to the unchanged interaction plane. Both painters use a normalized camera-space work plane to avoid depth-sort singularities when the camera crosses an edge-on view; tool and light-trail crossings are split too. On-art labels fade when their work surface faces away; the HTML action and caption retain the meaning. Surroundings remain a faint scenic backdrop behind the maker. This remains a stylized Canvas scene with planar work surfaces, not a full depth-tested mesh renderer. No-JS/error fallback art uses static readable compositions with no orbit. There is no camera roll, automatic orbit, shake or simulated depth-of-field blur.

This iteration deliberately retains Canvas and the existing requestAnimationFrame/native-scroll scheduler: the source already contains 3D coordinates and a reversible timeline. A Three.js or GSAP migration is unnecessary for these camera moves. Use a WebGL renderer when actual mesh assets, depth-tested occlusion, more extensive lighting or substantially more geometry justify the migration.

Seven documentary inserts in `camera.inserts` give attention a distinct subject: drawing hand, review boundary, questioning head, surviving hand light, capability, human choice, and the person behind the work. Each has an approach, readable hold and release on the linear camera track. `focusAt()` follows the sampled head, wrist light, held stylus tip or work origin; it does not change the performance. Desktop and compact distances are authored separately. Camera metadata exposes `focusId`, `focusWeight` and `framing`, distinguishing intentional portraits/details from full-body compositions. The entire head or active work fits in its declared close-up; head shots may crop legs and peripheral work. The light insert settles on beat17 before the next lesson panel enters.

Pointer parallax fades by `1 - max(orbitWeight, focusWeight)`. In-art labels fade during close approaches while native HTML action/caption remains. Opening the system-layer disclosure gradually releases an active close-up to the established wide camera within the disclosure chapter, then restores the scroll-authored insert on closing. Shared projection keeps environment parallax, dust, work, memory filament and light trail attached to the same world. These are continuous authored takes, with no cut, idle zoom or scroll interception. No-JS/error fallbacks retain the wide static SVG compositions. The symbolic head remains face-free; its tilt and surrounding gesture carry the emotion.

Run `npm run test:profile-documentary` for insert timing, complete subject framing, material magnification, camera continuity/reversal, pointer suppression, rear angles, disclosure pullback, native mobile/desktop visibility and the fixed Full policy. [The v13 evidence](evidence/documentary-camera/README.md) includes wide/close/return boards and actual forward/reverse browser recordings. Full-body checks remain for full framings; close-up checks follow the declared subject rather than requiring deliberately cropped feet to stay visible.

Run `npm run test:profile-orbit` for locked-camera invariants, rear/side angles, pointer suppression and composed dust/disclosure behavior. `npm run test:profile-painter` checks the actual Canvas/SVG plane kernels across front, side and rear angles, including finite sorting, contact signs, true intersections and label facing. Run `npm run test:profile-camera` against the built preview for camera continuity, reverse scrubbing, perspective, framing, trail alignment, compact attenuation and the fixed Full policy. `npm run test:profile-performance` separately checks fixed anatomy, visible contacts, support changes, tool ownership and reversible sampling.

## Four ground families, 31 scenes

`scenes.js` → `floors` has one named recipe per visual beat: contour terraces, gravity wells, flowing pathways and linked floating islands. `floors.js` builds all31 genuinely different point sets using the same100 persistent strands and48 samples. It caches immutable scene geometry and prepares one deformation transform per frame. The full100-strand ground survives compact detail so platforms, bridges and path branches remain complete. Material ink is authored per recipe instead of being dimmed again by foreground action energy.

`floorMotion` controls bounded squeeze, turn and sink around the support centre. Source/destination strands interpolate on the shared scroll timeline; the ground deforms below the maker rather than collapsing toward the hand. The rig's actual foot positions flatten local support patches. Faint relief surfaces share that transform and fade during the handoff. The body, C gloves, camera, work, dust and memory filament retain their existing geometry and timeline. This is a reversible stylized terrain, not a gravity or rigid-body simulation.

[The world evidence](evidence/story-worlds/README.md) includes a scene map, all31 compositions, native page captures, transition recording, preservation checks and Full-policy tests. Run `npm run test:profile-floors` for family coverage, unique scene geometry, support, reversal, compact completeness and the fixed Full policy.

## Approved C glove hands

The selected C design replaces the slender hands with a softly squared pebble palm, short inflated fingers and a bean-shaped thumb. `hand-shapes.js` owns the changed proportions, fixed FK lengths, contact pad, stylus offset and shared `skin()` surfaces. The index-tip still solves typing and pointing contacts; palm support uses the new palmar surface. Writing uses a deeper thumb/index grip with the stylus outside the thicker palm. The wrist-local emitter sits just beyond the new palm, and full/fast light sampling share that point.

`geometry.js` retains all777 persistent strands, including27 strands per hand. Seven palm paths and four paths per finger form a sparse surface network; primary contours survive compact detail. Closed palm and finger volumes add1104 small filled patches across both hands. A shared illustrated gradient per glove keeps intersecting parts visually continuous and avoids facet bands. This is an illustrated material, not physically based lighting. Hand strands sort in short sections so the near-side network remains visible over the skin. Canvas and SVG use the same surfaces, gradient parameters and closed-polygon clipping at the work plane; a glove cannot leak through a review panel when the camera turns. Skin joins the almost-formed actor at timeline0.82–1, so the first static human fallback also shows the complete C glove.

The narrative, camera event configuration, support choreography and environment design remain. Wrist/elbow positions adapt to the new hand contact offsets; this is a deliberate model change rather than a claim of identical pose coordinates. [C-glove evidence](evidence/c-glove/README.md) records the accepted design, rendered studies, actual page captures and tests. [The earlier v14 evidence](evidence/soft-hands/README.md) retains the previous simpler hand treatment.

## Interaction and accessibility

- All content and links are static HTML. Native details/summary works without JavaScript.
- Navigation remains native anchors and native scrolling. No wheel/touch interception.
- Motion is fixed to Full by the owner. There is no selector, hidden control or public setter. The old `holyboom.profile.motion.v1` value and OS reduced-motion preference do not switch this profile to a static mode. This is the explicitly requested policy; these tests do not certify reduced-motion accessibility.
- Mobile, short screens and landscape all keep the live Canvas. The boot and runtime agree. Structural reflow preserves the visible reading point and snaps the resumed frame to that location; small toolbar-height changes retain native scrolling. On desktop, narrative and art have separate columns.
- `Explore beneath the surface` opens the Experience / Orchestration / Review & access explanation and spreads the sculpture's layers. Two woven graph layers fan behind the unchanged front surface; the lateral offset exposes actual graph links on compact screens. Layout changes preserve the displayed pose and decay the correction through reversible, monotonic story travel. It is a conceptual diagram, not a claim of live execution.
- Full motion follows native scroll and supports fine-pointer parallax outside locked orbit windows. A paused scroll holds the composition; there is no automatic whole-body breathing cycle or permanent idle render loop. Hidden/offscreen rendering suspends.
- Focus scroll margins keep keyboard targets and outlines clear of the sticky art/header without changing chapter-anchor offsets. Essential narrative content and controls have native HTML equivalents. The decorative Canvas is aria-hidden and does not intercept pointer input.
- Print hides decoration and exposes disclosure content.

## Tests

```sh
npx playwright install --with-deps chromium firefox webkit
npm run check
python3 scripts/test-discovery-gate.py
npm run build
# Keep the production preview running on port 4174, then:
npm run test:profile
npm run test:profile-camera
npm run test:profile-performance
npm run test:profile-accessibility
ENGINE=firefox npm run test:profile
ENGINE=webkit npm run test:profile
ENGINE=chromium PUBLIC_ARTIFACT=1 TEST_URL=http://127.0.0.1:4174/ node scripts/qa-professional-profile.cjs
```

Set `QA_DIR` for profile regression output, `PERFORMANCE_QA_DIR` for a separate performance round, `RECORD_VIDEO=1` for the profile browser recording, or `CHROMIUM_PATH` for a local Chromium executable. `SKIP_BROWSER=1 npm run test:profile-performance` runs the numerical suite and projection sheets. `test:profile-accessibility` covers keyboard focus, native disclosures, short-landscape boot, reading continuity and zoom-equivalent reflow; pass `ENGINE=firefox` or `ENGINE=webkit` to run the same cases. Public English/Thai profile and main-site regressions remain separate from body-performance checks. CI checks the built artifact before Pages upload; `main` is the production deploy branch.

[Performance evidence and review guidance](evidence/faceless-performance/README.md) distinguish numerical correctness from whether viewers understand the acting. [EXECUTION.md](evidence/faceless-performance/EXECUTION.md) tracks the three additional refinement rounds, each requiring at least 30 minutes after initial implementation. All three rounds are complete; their exact elapsed times and evidence are recorded in that log. See [the Thai delivery summary](evidence/faceless-performance/DELIVERY.th.md) and [final visual review](evidence/faceless-performance/FINAL-VISUAL.md). The earlier evidence records its original pre-deployment state. Screenshots, numerical checks and browser emulation do not establish physical-device performance, universal emotional readability or accessibility certification. The [earlier camera report](evidence/cinematic-camera/REPORT.md) remains historical evidence.

## Release and rollback

Review the production preview and test report on the feature branch. A merge/push to main triggers the existing Pages workflow. After deployment verify English profile, Thai profile, main showcase, contact and deep links. Revert the release commit to restore the prior profile if a production regression appears. No database migration, new analytics, account permissions or secret is required.

## Distinct acting and the completed journey

`motion.js` now authors separate torso direction, inclination, head attention, lateral weight, knee level and hand recovery poses for all 30 human beats. Standing foot marks vary in width and stagger; normal transfers step the feet consecutively, keeping a planted support. The existing sit/rise contact choreography remains shared. The reflection surface is lowered toward the lap, and the capability surface follows the deeper crouch; hand contacts and painted props use the same frames. Typing actions still articulate both index fingers; their recovery poses differ between the code, component and AI scenes. See [the acting directions](DISTINCT-ACTING.th.md).

`npm run test:profile-distinct-acting` checks for near-duplicate settled skeletons, varied torso/level language and planted support. Its neutral contact sheet intentionally uses one camera and omits props, colour and face details. Numerical uniqueness does not establish perceived emotion; review the actual Canvas tour too.

The Work chapter includes three native `details` paths from problem through design and workflow to existing public demonstrations. `workPaths` in the story JSON supplies the copy and links; it claims no additional client outcomes. Expanding a path preserves the displayed scene through the same reversible layout correction used by the architecture disclosure. The craft chapter links directly to these paths. The final copy recalls the first imagined space; a faint curved pavilion grows behind the maker and static fallback art carries the same composition. A native link returns to the first line. `npm run test:profile-completion` verifies keyboard/no-JS access, disclosure stability, link targets, the ending and the return route.

## Authored environments

`scenes.js` → `environments` assigns an eight-object set, semantic palette, name and strength to each of the eleven chapters. The new `story-world` illustration adds 114 cached 25-point paths, including connecting spans and room-light filaments. There are ten reusable rounded forms: folios, layers, towers, arches, bridges, chairs, networks, woven orbs, petals and fragments. The conviction chapter changes its set at every beat: empty workplaces, fragmented resistance, fallen lessons, repair and rising connections. These are symbolic spaces, not documentary employer interiors.

The sets keep fixed object/path identities across all 31 beats and interpolate from scroll. They respond subtly to the existing hand attraction and resistance field. All geometry shares the perspective camera and has no independent idle loop, emitter clock or random spawning. They are intentionally a faint scenic backdrop; the Canvas renderer omits 45 secondary paths on phones and culls offscreen scenic strokes.

`sceneryFocus()` and `sceneryOpacity()` are shared by Canvas and static SVG generation. They fade whole scenic filaments near the projected head, hands and primary work, preserving negative space during side/rear orbits. This changes scenic ink only: the rig, work surface, dust, memory line, camera and disclosures retain their definitions. The final build regenerates the static fallback art with the same sets.

`npm run test:profile-world` verifies unique chapter sets, fixed budgets, finite geometry, reverse sampling, head protection and real Canvas pixels with/without scenery. Optional `WORLD_BASELINE=/path/to/old-geometry.cjs` adds exact parity checks for the existing layers and body. The browser pixel comparison keeps render detail stable when toggling scenery, rather than resetting the canvas with resize.
