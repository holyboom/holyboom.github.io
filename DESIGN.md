# HolyMind visual system

## Direction

Boom's professional website uses the original HolyMind violet neural brain and geometric skill marks supplied by the owner. This is a redesign of the existing public profile, not a reproduction of the diagnostic asset grid. The homepage gives the brain one memorable focal position; the workbench explains a business outcome; the skill collection supports exploration without making the whole site a catalogue.

## Tokens

| Token | Value | Use |
|---|---|---|
| Night | `#100b1b` | Main background |
| Surface | `#181121` | Workbench and collection section |
| Raised | `#21172f` | Selected tasks and skill tiles |
| Ink | `#f4efff` | Main text |
| Muted | `#bcb0ce` | Supporting text |
| Soft | `#d8cbe9` | Secondary headings |
| Violet | `#a274ee` | Progress and small accents |
| Lilac | `#d3b4ff` | Primary actions and selected states |
| Action ink | `#231133` | Text on lilac |
| Line | `#3c2e4e` | Quiet structural separators |

Display: self-hosted Sora variable, weight 500 for large headings, tracking no tighter than -0.04em. Body: self-hosted DM Sans variable. Thai content uses the user's native Thai font fallback. Body measure is bounded, with headings balanced and fluid down to 320 CSS pixels.

## Layout and interaction

- Wide hero with a readable statement and original brain artwork; mobile stacks the primary message and action before the artwork.
- Three purposeful symbol-led links connect the hero to the relevant sections.
- The existing three-scenario workbench remains functional. Each of four steps has an illustrative HolyMind skill pairing.
- The collection initially shows eight featured skills; search and purpose filters expose all 34 without forcing a long first scroll.
- Skill details use a native dialog with a close control, Escape dismissal, and focus return.
- Living Mind v4 adds one scroll-linked orchestration chapter, with restrained supporting motion in the workbench, open skills gallery, approach symbol and contact symbol. Native scrolling is never hijacked.
- Original brain artwork is unchanged. A Canvas overlay follows 46 image-derived bright-pixel paths; a masked light sweep stays on the original luminous lines.
- System reduced motion is the default. An explicit visitor choice in the persistent, visibly labelled Motion control is shared by Canvas, CSS and GSAP. No content is hidden when motion or JavaScript is disabled.
- A separate hero wrapper owns scroll transforms; the inner artwork owns breathing. Rebuilt skill cards are registered after asynchronous rendering.
- GSAP and ScrollTrigger 3.15.1 are served locally. Every changed stylesheet and first-party script carries the same release key. No third-party runtime requests.
- Mobile navigation is an explicit menu. Without JavaScript, its links remain visible.
- Use original artwork and unmodified Phosphor UI icons. No generated substitute logo, decorative pseudo-code, invented business statistics, or gradient text.

## Source and implementation

The owner supplied a diagnostic image of the installed HolyMind artwork. Original local artwork was available, so no artwork was regenerated. Responsive WebP derivatives preserve image content and transparency. See `assets/brand-attribution.md` for asset and font notices.

Product Design, Impeccable 4.8.2, Anthropic frontend-design and UI/UX Pro Max source guidance informed the design. Impeccable's binary workflow was unavailable; no certification is claimed. UI/UX Pro Max returned a partial portfolio typography match and generic guidance; its unrelated AI photo-generator palette was not applied.

See `design-qa.md` for the observed review outcome and its limits.

## Showcase v5 — experiential expansion

- Preserve the approved hero, electric brain and Reason → Build → Verify orbit verbatim. Original brain and skill image bytes remain unchanged.
- Signal crossing: two diagonal bands travel in opposite directions as intent turns into a system.
- Assembly workbench: three transparent architecture planes separate and reconnect with a native range control. Scroll changes the viewing angle, not the slider state. Actual workbench step selection updates the top-plane symbol.
- Skill instrument: six original glyphs fan out as optical plates. Tap a plate or use next/previous controls; arrow keys, Home and End work too. The action opens the existing description dialog, returning focus on close. The gallery still contains all 34 skills.
- Services: oversized illustrated disclosure panels rotate into place, with explanations on demand rather than mandatory paragraphs.
- Identity: the existing Boom name is a layered typographic sculpture. Decorative copies are hidden from assistive technology. The longer description is a native details disclosure.
- Contact: a seven-plane octagonal aperture opens around the original goal symbol. Desktop pointer movement tilts its own parent; touch scroll is never captured. The public contact destination is unchanged.
- Bound motion to scroll and control input; add no constant new render loop, sound, network service, analytics or extra runtime dependency. The shared motion switch reverts all contexts and clears pointer effects. Reduced motion defaults to the static compositions; explicit opt-in remains available.
- Every release asset uses the same showcase-v5 key. Capability prose and simulations remain labelled illustrative; there is no live model execution.

## Continuous Mind v6 — shared spatial narrative

- The original hero brain is visually transferred into the orbital scene: one overlay while source and destination are temporarily muted, restored exactly on pause and completion.
- A single luminous shard and three small fragments carry the intention across eleven artifact stations. Its outline transitions between crystal, plane, plate, signature point and octagonal aperture. Ten bridges are derived from scroll position, not play-once entrance events.
- The ribbon crystallizer is actually borrowed during the ribbon-to-assembly handoff; the source and destination images are muted only for that transfer. Different workbench symbol choices crossfade within the same carrier.
- The thread routes through outer margins while in flight, reconnecting to live positions of the original transformed artwork. Long galleries have an exit station so optional expansion does not break the narrative.
- Source art, existing geometry and interactive state are never repainted or reparented. All new visuals use a pointer-transparent, aria-hidden viewport layer below the navigation and native dialog.
- Resize, fonts, gallery height, disclosure changes and ScrollTrigger refreshes remeasure the route. The layer uses input-driven rendering and stops after the existing scrub has settled. Motion off restores all originals and removes the enhancement.
- Release key: continuity-v6. No new runtime library or external network service.

## Exploded System v7 — approved layer storytelling and accent roles

- Preserve every existing scene, original artwork, shared-object continuity, actions and public profile. Experience is the surface mode.
- Native range moves right to expand, left to connect. Three primary layers reveal Human Intent, Connections and Evidence in order; two intermediate circuit sheets appear between them.
- Real DOM pins on the transformed planes drive projected SVG leader lines to side explanations. Recompute on input, scroll settling, resize and layout changes. No invented fixed anchor coordinates.
- Violet remains identity. Cyan carries energy/leader lines, champagne gold marks arrivals/confirmed focus, pearl is the small bright core, orchid pink is a sparse glint. Do not recolor original images.
- Focal moment: the exploded diagram unpacks into three short anchored explanations. A finite scan acknowledges full expansion, not a perpetual light show. Every state reverses with the slider.
- Phone: the illustration and side annotations share the same viewport; short copy, generous touch target, no horizontal scrolling. Reduced motion still allows immediate explicit slider input and static lines. No background loops or new library.

## Spark v8 — mobile-first entrance, shared electricity (current)

This revision supersedes the earlier mobile text-first arrangement and persistent motion toggle, not the desktop layout or established pixel-neon artwork.

- Phone portrait and narrow touch-landscape: image-first hero. Desktop/tablet keep the established left-copy/right-art composition. Remove the two hero shortcut actions everywhere; retain navigation and contact destinations.
- One 480×480 Canvas light field uses the 46 source-derived paths and 96 contour samples. Full mode uses 12 moving traces on phones and 18 on wider screens, six edge discharges, and sparse pixel debris. Source bitmaps are unchanged.
- Hero, travelling brain and orbit copy the same rendered frame from one clock. The overlay pauses outside those visible targets; transport explicitly retains its renderer when the hero leaves view.
- Cyan expresses energy; champagne expresses arrival; pearl cores remain tiny; pink is a sparse edge glint. Local reflections illuminate existing borders, circuit SVGs, glyphs, the signature point and portal geometry. Reading text is not flashed, distorted or recolored wholesale.
- Departing/receiving light is derived from the same reversible continuity progress. It never writes to the slider, skill selection or disclosure state.
- Always-on is the normal experience; legacy localStorage off is ignored. System Reduce Motion uses a low-amplitude 12 fps light field and disables spatial scroll choreography, without showing a site toggle. The no-pause-control choice is NOT represented as WCAG 2.2.2 compliance. Flash safety has not been independently certified.
- No new runtime dependencies, WebGL contexts, audio, analytics or external network calls. Adapted regression tests exercise OS profile changes instead of the intentionally removed toggle.
- Release key: spark-v8. Validate pixel movement, handoff rendering, geometry, reversibility, phone ordering, desktop preservation and existing interactive controls before publication.

## Always Active v9 — explicit owner correction

The owner requires full visible animation without the previous system-level calm exception. This supersedes the Spark v8 motion-policy paragraph only, not the layout or artwork.

- Always resolve to `data-motion=on`, `data-motion-profile=full`, `data-motion-policy=always`. Neither an OS preference nor legacy localStorage off disables choreography or reduces the brain to the three-trace calm field. There is no site toggle.
- Source-aligned brain electricity runs automatically on a visible hero, transferred brain, or orbital brain without hover, touch, or scroll. Foreground/pageshow/focus and viewport reentry resynchronize the renderer.
- Ambient current on decorative cloned SVG paths continues while the page is stationary: orbit, assembly circuitry, ribbon, skill-frame edges, service outlines, signature point and portal. Scroll still owns spatial composition and reversible transfers; the ambient layer never overwrites GSAP transforms or input state.
- Ambient animations are parked offscreen and on pagehide; they resume automatically on visibility/focus. No new timer or JavaScript frame loop is introduced for this layer.
- Phone-only brain-first layout, tablet/desktop layout, original images, range direction, callout geometry, skill dialogs and destinations remain unchanged.
- This deliberate no-pause/no-system-reduction policy is not represented as WCAG conformance; no independent flash-safety or physical-device performance certification is claimed. Bounded local glows only; no fullscreen flashing.

## Interaction v10 — tap discharge and guided exploded-system reveal

- The owner approved two additions to v9: a HolyMind-specific brain tap discharge, and a pinned scroll demonstration that starts at 0%, unfolds slow-normal-slow to 100%, then releases. Reverse scrolling reconnects the same layers.
- Hero and orbital brains expose native, labelled keyboard-focusable buttons. A real click/tap, Enter or Space releases a finite 1.2-second discharge of original crystallizer glyphs, faceted pixel shards, and extra light along the six nearest source-derived paths. Cancelled/drifting scroll gestures do not fire. Three concurrent bursts maximum, short repeat cooldown; no new render loop or fullscreen flash.
- All ambient motion remains always active in visible scenes. Phone-only image-first layout and desktop/tablet placement are retained. Original image bytes unchanged.
- The guided assembly pins only its presentation below the actual masthead, with a viewport-fitting responsive composition. Native scroll is never intercepted. The guide and subsequent workbench remain outside the pin.
- One scroll progress drives all layer transforms, real anchored leaders, callouts and percentage via smootherstep. The opening 4% holds at 0; the last 7% holds the completed view. Native range input seeks the same timeline using inverse easing, including keyboard Home/End/arrows.
- Pin interval is 1200–2400 CSS scroll pixels, derived from viewport size. A resize rebuild restores natural dimensions before remeasuring to avoid stale pinned sizes on orientation change.
- Continuity docks at assembly for the entire pin interval, then resumes the ten existing reversible transfers. Slider, scroll and geometry have a single source of progress, rather than competing writers.
- No external runtime library, audio or analytics added. No-JS content/guide and missing-GSAP manual range remain available. Always-on policy remains as explicitly requested; no WCAG motion conformance or physical-iPhone performance certification is claimed.

## Resonance v11 — authored cognitive reactions and sonic identity

- Fourteen visibly different cognitive-inspired metaphors: twelve regular reactions and two infrequent signature reactions. These are narrative visual metaphors, not treatment claims or insight into a visitor's actual cognitive state.
- Context-weighted non-repeating bag; exclude the previous three reactions. Rare effects require at least seven intervening selections and a separate 12% eligibility roll. Original violet/cyan/gold pixel geometry and existing glyphs remain unchanged.
- The established single neural canvas clock renders every style. At most three concurrent bursts, 180 ms input cooldown, 1.2-second finite geometry and a bounded 2.1-second synaptic afterglow. Ambient energy remains active during and after reactions.
- Fourteen original parameter-authored DSP timbres, with seeded friction texture, modal resonances, warm impact and deliberately uneven note timing. No stock sample, actual glass/metal recording, external audio API or generative-audio model. Subjective naturalness is not certified.
- Sound is armed but silent until a trusted brain tap or explicit sound-enable gesture creates/resumes the AudioContext. First-party PCM is warmed without an AudioContext; no network audio fetch gates a tap. Never automatically replay a delayed gesture after return.
- Separate sound-only mute and volume. Muting never affects visual motion. Sound preferences persist; no sound/context is created on initial load. Three voices maximum, gain discipline and compressor; stop on pagehide/hidden, resume on a new gesture.
- After sound unlock only, assembly crossings at 25/50/75/100 produce quiet matching cues. Boundary dithering does not repeat a cue, a fast jump emits only the last cue, and returning to 0 rearms the sequence.
- The QA studio offers intentional selection of all fourteen animations and sounds, plus reproducible WAVs and their provenance. Main-page brain taps remain randomized.
- Preserve v10 pinned 0→100→0 scroll, all ten reversible transfers, 34 skills, phone-only brain-first layout and the explicitly requested always-on motion. No new runtime library. Physical iPhone audio, latency, speakers and independent flash/accessibility certification remain untested.

## Digital + Electricity v12 — owner sound-direction refinement

- Audio-only character revision: replace the previous material/modal ringing with fast capacitor/FM sweeps, shaped irregular electric sparks, clocked digital packet pulses and short dry logic latches. Retain violet pixel identity, all fourteen visual reactions, rarity and random selection unchanged.
- All fourteen sound IDs retain their visual mapping; names and parameters now explicitly communicate digital electricity. Prime and Triad are longer signature charging gestures, not bells or musical pads.
- Use deterministic source-authored DSP, not stock, actual material recordings or generative audio. Ship matching 32 kHz WAVs in `assets/audio/electric-v12/`, a complete reel, a level-matched before/after and the source kit. Preserve v11 samples for comparison.
- Keep default volume, browser gesture unlock, mute, three-voice mixing, lifecycle behavior and assembly milestone controls. Do not touch layout, visual renderer, pin/scroll progress or existing semantics. User audio preferences remain intact.
- Bound the signal with shaped attacks, DC removal, two low-pass stages and normalization; test waveforms and the browser graph. Subjective timbre and real iPhone speaker behavior must not be claimed from automated tests.


## Quiet Current v13 — approved listening prototype

Scope: Hero → orbital chapters → ribbon → pinned Assemble. Keep the original fourteen Electric v12 tap waveforms byte-identical and every visual/motion layout intact. No general rollout below assembly until this prototype is evaluated.

Three audio roles share one gesture-unlocked AudioContext: a quiet slowly evolving electric field; a smooth directional scroll filament; existing brief tap discharges. New soft settle/reconnect cues replace the four reused tap milestones. No new music track, stock effect, recorded texture or generative model.

Ambient and scroll buses yield to taps via bounded ducking. New controls in Sound mix can disable the background and scroll independently. The global sound switch and saved volume remain separate from Always-on Motion. Scroll itself cannot create/resume audio. Returning from a hidden/interrupted page requires a fresh explicit gesture; no missed events are replayed.

Scroll sound follows genuine wheel, touch, keyboard and manual-range input. Resize, anchor jumps, overscroll and unprompted programmatic repositioning must not make swooshes. Read the assembly's continuous eased progress rather than its rounded displayed percentage. One source of visual truth remains unchanged. A deadband plus direction hysteresis avoids tiny-jitter retriggers.

Prototype exit fades the new buses away, leaving old taps elsewhere intact. Compare Taps only / Field + taps / Full mix at the same master level in the listening studio. Offline previews are rendered through the exact production audio graph, not a separate approximation. Automated signal checks do not establish subjective pleasantness or physical-iPhone speaker performance.


## Quiet Current v14 — owner-approved full-site rollout

The owner approved the v13 sound and asked for coverage everywhere. This supersedes the prototype-only scope, not its sonic identity or controls.

- One existing instrument follows eleven measured zones: Hero, Orbit, Ribbon, Assemble, Workbench, Skill Instrument, Skill Gallery, Services, About, Contact, Footer. No new oscillator bank or chapter-triggered sound is created at a boundary.
- Original Electric v12 fourteen tap presets, waveform files, synthesis source, random visual registry and all visual/motion modules remain byte-identical. The accepted v13 default sound graph is compared sample by sample in OfflineAudioContext against the new default graph.
- Hero through the pinned assembly keeps its accepted parameters. Later scenes blend deterministic material profiles: slightly open skill navigation; restrained gallery; structured services; softer About/reading; gentle Contact and Footer. All profile weights remain positive. Scroll direction and speed still shape one continuous current, and native scroll is never intercepted.
- Existing assembly completion/reconnect cues remain specific to the assembly interval. Passing chapter boundaries does not play a chime, restart the soundscape, or queue missed events.
- Dialogs and mobile navigation soften ambience and suppress page-scroll sonification; visible optional reading disclosures gently lower the field. Layout changes, filter/search changes, gallery expansion and navigation jumps are suppressed as audio gestures, but remeasure the route. Native assembly range remains sonified.
- Master mute/volume and independent ambience/current controls remain global and persistent. Always-on visual motion is independent. One trusted sound/brain gesture starts audio; hidden/interrupted pages stop audio and require a new gesture on return as before.
- Full-journey Studio jumps to all eleven zones, compares Taps only / Field + taps / Full mix, and provides forty-second equal-master previews from the actual production graph. Preview files are not loaded by the main runtime.
- No new runtime dependency, outside audio request, recording, stock music, or generative-audio model. No physical-iPhone speaker, listener-comfort, hearing-safety or motion-accessibility certification claimed.


## Responsive Current v15 — missing arrival/action feedback

The owner reported that motion stops at a point or changes action without any sound. v14 deliberately had continuous ambience/current but omitted semantic acknowledgements. This revision supersedes that omission; it does not replace the accepted soundscape or original fourteen brain taps.

- Add ten short, original digital-electric cue timbres (150–310 ms): dock, return, phase, layer, select, switch, open, close, confirm and filter. No old brain sample is reused. One foreground feedback lane with brief fade-out on preemption, priority/cooldown/deduplication, and no replay queue. Brain taps retain priority.
- Arrival follows the ACTUAL visual continuity from/to/progress and stable docking; reverse docking uses a return sound. A 65 ms settle and traversal rearm prevent stationary loops. Fast skipped stations are not queued.
- Reason/Build/Verify and real layer-callout reveal/retract transitions respond during trusted scrolling. Preserve the distinct original full assembly settle/reconnect cues; do not add a second completion sound.
- Meaningful actual control changes receive feedback: Workbench scenario/stage, selected skill, dialog open/close/Escape, filters, gallery expansion, service/about/brief disclosures, menu, layer focus and navigation. Re-selecting the current state stays silent. Search cues occur once after typing settles. Copy confirmation only follows the actual success status.
- A first trusted relevant control action can unlock/resume the single AudioContext, as can the existing brain/sound button. Scroll/hover/programmatic UI changes cannot unlock it. Saved master mute still wins.
- Add one independent Action & arrival cues checkbox to existing Sound mix, default on; no Motion toggle. Ambience/current/tap sources and every visual/motion module remain unchanged.
- Use the existing scroll-update loop and actual DOM state; no second perpetual rendering loop. Hidden/interrupted pages cancel pending cues and require a new explicit gesture.
- Main-site layout preserved. The dedicated event Studio exposes ten audition buttons through the same production cue bus, displays the latest semantic event, and retains old-mix comparisons.
- Tests exercise native input and measured cue-bus output, all ten forward landings, five reverse landings, layer and phase changes, state deduplication, preferences, first-action unlock and lifecycle. Physical iPhone speaker quality and perceived comfort remain untested.
