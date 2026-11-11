# Design and interaction QA

## Status: PASSED within the reviewed scope

Final result: `passed`.

The initial implementation, commit `e2b20d58f72acaa226962daba28272eb20b632f2`, deployed successfully to GitHub Pages and was reviewed in live Chrome. Implementation polish `a191017` was rechecked live with the `holymind-2` stylesheet and script. Share-image commit `3ce7935` was deployed, and its final image was visually reviewed. The final page exposed the correct 1200 × 630 share metadata, and GitHub Pages reported the `3ce7935` deployment built successfully. No concrete blockers remain in the reviewed scope.

## Visual review

No P0 or P1 visual issues were observed in the reviewed desktop views or 390px mobile first fold. The portfolio has a clear hierarchy, readable primary content, and a distinct HolyMind identity. The original brain and skill artwork from the owner's installed assets are preserved; the diagnostic reference image remains private. The visible symbols match the reference without reproducing its diagnostic layout.

| Finding | Priority | Status |
|---|---|---|
| Previous section could remain active in navigation after an anchor jump | P2 | Closed: live recheck confirmed HolyMind active at the collection and Workbench active at the workbench; replacement screenshot shows the correct collection state |
| Both hero CTA labels wrapped into short lines at 390px | P2 | Closed: actions stack at widths ≤420px; computed layout and replacement 390px screenshot confirm clear, single-line labels |
| Mobile About text needed whitespace correction | P2 | Closed: live `innerText` was exactly “The mind behind it.” |

The mobile menu reset breakpoint was corrected from 801px to 681px before the initial deployment. The final `social-preview.png` is a genuine 1200 × 630px PNG, cropped and framed from the actual hero. It preserves the original brain artwork and has no visible clipping of its principal content.

## Observed interaction checks

| Area | Observed result |
|---|---|
| Workbench | All 12 step titles were correct across three scenarios × four steps. ArrowDown and Home tab controls worked. The generated brief updated for each scenario. |
| Clipboard | Clipboard write fulfilled and the success message appeared. Clipboard contents were unavailable through the virtual-browser bridge; paste roundtrip was not verified. |
| Skill collection | Eight featured skills; 34 when expanded. Category counts: Reason 13, Build 12, Verify 9. Search for “chain of verification” returned one result; a nonsense query returned zero with the empty state; reset restored eight. |
| Skill dialog | Open, Escape dismissal, and focus return were observed. The mobile dialog measured 350 × 548px and fitted the viewport. Its Workbench link closed the dialog. |
| Mobile menu | Toggle, Escape dismissal, and closing after a navigation click worked. Resizing to ≥681px eventually reset `aria-expanded` to `false`. |
| Motion | The off state persisted into a new same-origin iframe. Reduced-motion rules were inspected in CSS; preference emulation was not performed. |
| Console | No site-originated errors were observed. The desktop console contained an injected `chrome-extension` metadata error. |

## Responsive checks

Genuine same-origin iframe CSS viewport checks showed no horizontal overflow at any tested width. A 15px scrollbar reduced the corresponding content client width.

| CSS viewport width | Content client width | Horizontal overflow |
|---:|---:|---|
| 320px | 305px | None observed |
| 390px | 375px | None observed |
| 680px | 665px | None observed |
| 768px | 753px | None observed |
| 1024px | 1009px | None observed |
| 1200px | 1185px | None observed |

Desktop Chrome captures measured 1348 × 926px; the dialog capture measured 1363 × 936px. These checks do not substitute for Safari or physical-device testing.

## Evidence

- `docs/evidence/desktop-hero.jpg` — final live hero, with loaded original artwork.
- `docs/evidence/desktop-workbench.jpg` — live workbench evidence.
- `docs/evidence/desktop-skills.jpg` — replacement collection capture; correct active navigation and settled content.
- `docs/evidence/desktop-dialog.jpg` — initial live dialog; appeared settled.
- `docs/evidence/mobile-390.jpg` — replacement 390px iframe capture; settled content and stacked actions.
- `docs/evidence/mobile-skills.jpg` — mobile collection evidence.
- `docs/evidence/mobile-dialog.jpg` — mobile dialog evidence.
- `docs/evidence/mobile-about.jpg` — final mobile About section and corrected heading.
- `social-preview.png` — final share image.

All listed evidence files are present. Browser screenshots use `.jpg`, matching their JPEG content. No automated Lighthouse run, accessibility certification, Safari test, or physical-device test is claimed. Clipboard paste roundtrip and reduced-motion preference emulation remain outside the verified scope.


## Living Mind v4 — 2026-11-11

### Regression diagnosis
- Previous skill art was collected before the asynchronous skills fetch rendered its cards: live baseline had 8 cards and 0 registered motion-art nodes.
- The old brain breathing animation wrote the same CSS transform as the scroll tilt. The new version separates them into parent and child layers.
- Previous CSS kept the same `holymind-2` cache URL across releases. All changed first-party assets now use `living-mind-v4`. Caching on the owner's device was not observed directly.

### Changes
Original 960px and 480px brain images remain byte-identical. 27 bright artwork nodes and 46 weighted bright-pixel routes drive continuous pixel traces. A light sweep is masked to the original luminous artwork.

Added a native-scroll, sticky Reason/Build/Verify orbit. The gallery uses an open staggered composition. Scroll-linked icon and panel transforms are handled by locally served GSAP/ScrollTrigger 3.15.1. Motion works on rebuilt and filtered cards, not just initial DOM nodes.

### Local verification
Automated Chromium and WebKit rendering, screenshots inspected at desktop and mobile sizes. Tested 320, 390, 680, 768, 1024 and 1440px without horizontal page overflow. Canvas frames change; orbit matrices differ at three scroll positions. Tested skill filters (13 Reason / 12 Build / 9 Verify), all 34 cards, empty search, dialog, all 12 scenario steps, global pause and explicit resume. System Reduce Motion defaults to off; a visitor can explicitly enable motion. Physical iOS hardware has not been tested.

A short early Chromium filter sample returned before a queued frame; rerun with a DOM-ready assertion confirmed all 9 Verify cards were registered. The reusable test now waits for registration rather than relying on a 100ms delay.

### Reproduce
`npm ci`, `npx playwright install chromium webkit`, start `npm run dev`, then set `TEST_URL` to the preview URL and run `npm run test:motion`. Set `ENGINE=webkit` for WebKit and `QA_DIR` for output. `CHROME_PATH` can select an installed Chromium browser.

Deployment verification is recorded separately after checking the public URL; local checks alone are not a claim about the live release.

### Public deployment verification — completed
The public release at `https://holyboom.github.io/?v=living-mind-v4` was tested after the GitHub Pages deployment of `f6838f1` completed successfully. Chromium and WebKit each completed 31 recorded checks, with no failed checks, no page JavaScript errors and no HTTP error responses observed. All six viewport widths were checked on the public release.

The five changed first-party assets match local SHA-256 hashes. Canvas output changes over time; the orbital transform changes at three scroll positions. Global pause removes ScrollTriggers and freezes the Canvas. Back-navigation resumes Canvas correctly. The original brain image files remain byte-identical to the previous release.

See `qa/living-v4.html` for actual public-page recordings, and `docs/evidence/living-v4/chromium.json`, `webkit.json` and `live-asset-check.json` for raw observations. The GIF is a sequence of screenshots captured while scrolling the public page; the MP4 is a browser video recording. These are not generated mockups. Physical iPhone hardware and real-world battery use have not been measured.

## Showcase v5 — 11 November 2026

Owner-approved direction: expand the successful v4 identity into a visual showcase, with more distinct scroll scenes rather than requiring visitors to read every paragraph. The hero and the existing orbital chapter are retained.

Implementation adds the signal crossing, exploded assembly slider, six-skill optical fan, service doors, typographic Boom sculpture and contact aperture. The long About description is now a native disclosure. No image regeneration, new runtime dependency, sound, model execution or third-party analytics was added.

Local review: 52 showcase checks passed in WebKit, including keyboard/focus, all six skill dialogs, SVG screen-transform motion, pause/resume, repeated motion toggles without trigger growth, reduced motion, no-JavaScript content and missing-library fallback. The original 31-item motion/interaction regression suite passed in Chromium. Layout inspected at 320, 390, 680, 768, 1024 and 1440 CSS pixels. No horizontal overflow or page runtime errors were recorded in those runs.

First-pass fixes: added accessible previous/next controls for overlapping fan plates on touch screens; used native SVG transform attributes to keep the portal centered in both engines; removed a mobile line-break spacing defect. Original brain WebP hashes match v4. Browser emulation does not establish physical-device frame rate or battery use.

### Published-site verification

Implementation commit `836573b30c975853861b18bdccb1a543425c010d` completed GitHub Pages deployment. Live first-party HTML, CSS and scripts matched all six source SHA-256 comparisons. On the published `showcase-v5` URL, **55/55 showcase checks passed in Chromium and 55/55 in WebKit**, with zero captured page errors and zero failed assertions. The original **31/31** regression checks also passed in WebKit on the published URL.

The new suite exercises the assembly control (keyboard and emulated touch), six skill selections and dialogs, focus return, service disclosures, workbench-to-art synchronization, scroll transforms including SVG CTM, six viewport widths, native mobile menu, reduced motion, repeated pause/resume without accumulating ScrollTriggers, no-JavaScript content and missing-library fallback. Responsive sections did not overflow horizontally at the checked positions.

Live video and the 71-frame GIF were captured from the published site, not generated mockups. See [showcase evidence](qa/showcase-v5.html) and `docs/evidence/showcase-v5/summary.json`. The desktop screenshots and mobile WebKit screenshots are from live verification runs. No physical iPhone frame-rate/battery measurement is claimed.


## Continuous Mind v6 — live verification

- Implementation: e4e8da9ca286fee52062a43965840b3c74f6bfbc.
- Live continuity suites: Chromium 43/43, WebKit 43/43; zero failed checks and runtime errors. All ten bridges tested in both directions at matched scroll positions.
- The hero brain and ribbon crystallizer use actual shared-image handoffs, not separate fade-ins. Temporary source/destination opacity is restored on pause and completion.
- Six responsive widths, dynamic gallery expansion, disclosures, direct navigation, reduced motion, original restoration, pointer-transparent overlay and idle-loop termination checked.
- Existing local showcase suite: 55/55; slider, deck, keyboard, dialog focus, touch controls and previous scenes intact.
- Live index and five key assets hash-matched local files. All 36 original brain/skill WebP files unchanged against the v5 baseline.
- Browser-rendered desktop and mobile captures reviewed. Physical iPhone performance was not measured.
- See qa/continuity-v6.html and docs/evidence/continuity-v6 for the live recording and inspectable results.

## Exploded System v7 — local verification

- Approved scope implemented: right expands / left connects, progressive Human Intent → Connections → Evidence callouts, two intermediate routing/check sheets, projected SVG lines, focus interaction, bounded full-expansion scan, accent colors across existing energy and arrival effects.
- Reviewed actual rendered desktop and phone images. Caught a WebKit compositor issue that hid nested translateZ planes and replaced it with individually projected sheets; verified all five sheets visually.
- Assembly checks: 47 passed in Chromium and 47 in WebKit; no observed runtime errors. Exact leader endpoints are tested against real DOM pin/label coordinates (tolerance 1 CSS px). Viewports 320, 390, 680, 768, 1024 and 1440 checked for clipped plane bounds and horizontal overflow.
- Existing Showcase regression: 55 checks passed in WebKit. Existing Continuity: 43 checks passed in WebKit, including all ten forward/reverse seams. Range expectations updated for the explicitly requested direction change.
- Static/no-JS, missing-GSAP, reduced-motion and offscreen/idle cases covered. No physical iPhone performance test; viewport simulation is not a device benchmark.
- Prior design guidance was reused from Product Design, Impeccable animate/craft floor and frontend guidance. The Impeccable launcher was unavailable; no tool certification claimed.
- Live deployment evidence is recorded separately after publication.

### Published v7 verification

- Implementation commit: `4211be57d82e482b083b50f8348d2b9ac9175db8`.
- Live Assembly: 47 Chromium + 47 WebKit checks passed. Live existing Showcase: 55 WebKit checks passed. Live Continuity: 43 WebKit checks passed. Zero failed checks or observed runtime errors.
- Six published asset hashes match the local implementation exactly. Evidence includes desktop/phone renders, native forward/reverse pointer recording, and raw JSON results at `docs/evidence/exploded-v7/`.
- `qa/exploded-v7.html` is the evidence viewer. Existing site routes and the physical-device-testing limitation are unchanged.

## Spark v8 — local pre-publication verification

Scope: stronger source-aligned brain electricity on all viewports; phone-only image-first hero; no hero shortcut buttons or site Motion switch; shared animated brain transfer and reversible receiving light.

- New acceptance suite: Chromium 85/85, WebKit 85/85, zero runtime errors in each run.
- Adapted WebKit assembly regression: 47/47, including original projected leader endpoints and touch controls.
- Adapted WebKit motion regression: 31/31. System preference changes replace the deliberately removed toggle; selectors now name the hero canvas because orbit/transport canvases are intentional additions.
- Viewport checks include 320, 390, 430, 680, 768, 1024 and 1440 CSS pixels, plus 844×390 touch-landscape.
- Original 37 WebP/PNG asset files were byte-compared to the pre-v8 source and remain unchanged.
- Visual inspection: desktop preserves left-copy/right-brain composition; mobile shows complete visible brain art before the headline. Source sparks survive the shared-object transfer and keep animating in the orbit.
- OS reduced motion selects a calm light field and removes large spatial choreography without showing a toggle. The absence of a manual pause mechanism is not certified as WCAG compliance.
- No physical iPhone performance test or independent flash-safety audit is claimed. Headless renderer paint measurements are diagnostic only.

### Release-candidate timing correction

The first production WebKit pass had two reversal assertions outside the position tolerance. Fresh targeted captures agreed after settling. Removed the fixed-duration assumption: continuity and assembly leader loops now also wait for actual active ScrollTrigger scrub tweens. The acceptance suite waits for visible images and actual motion settlement rather than a one-second snapshot, keeping the same 1.6 px reversal tolerance. Final production rerun required before handoff.

A second production run exposed a sampling race: reverse captures sometimes contained the previous 96% arrival state rather than the requested midpoint. Added a read-only `renderedScrollY` diagnostic and require it to match the requested and actual scroll positions before testing reversal. No coordinate tolerance was relaxed.

Final harness correction also waits for resize debounces and matching measured viewport dimensions before retaining route keys. Reusing route keys measured at the preceding viewport caused false arrival-state assertions. The completed production runs pass the original coordinate and receiver-light thresholds.

### Spark v8 — published-page verification

Production acceptance suite: Chromium 85/85 and WebKit 85/85, with zero failed checks and zero runtime errors. Nine runtime assets matched local SHA-256 hashes. The mobile film was captured from the public page. See `qa/spark-v8.html` and `docs/evidence/spark-v8/summary.json`. No physical-device performance claim is made.

## Always Active v9 — root cause and local correction

Live v8 reproduction with simulated OS Reduce Motion produced `motionProfile=calm`, zero ScrollTriggers, no brain breathing animation, and only three slow traces. With no OS reduction v8 produced 60 ScrollTriggers and twelve phone traces. This is a verified software branch, not a claim about the owner's actual device settings.

The owner explicitly removed that exception: v9 always uses full motion, adds continuous ambient current independent of scroll, and resynchronizes visible brain rendering after pageshow/focus/viewport reentry. Mobile-only brain-first ordering and desktop/tablet composition are unchanged.

Local tests: 38 always-active checks in Chromium, 38 in WebKit, and 85 energy/interaction regression checks in WebKit passed with zero recorded runtime errors. The always-active suite emulates both OS profiles and old localStorage off; samples actual changing Canvas pixels without input; tests seven ambient scene types; exercises lifecycle return, controls, leader endpoints and six viewport widths.

Harness correction: scroll the stable scene or use its live coordinates to view decorative objects; do not wait for the continuously translating ribbon highlight to become stable. Interactive controls still use ordinary Playwright click/tap checks. No coordinate or motion assertion was removed.

37 original image files are byte-identical to v8. No new runtime dependency. Browser tests are not a physical iPhone benchmark or a flash-safety/WCAG certification.

### Always Active v9 — published verification

38/38 always-active checks passed in Chromium and 38/38 in WebKit. The 85-case published energy regression passed in WebKit. Zero failed assertions or runtime errors. All 17 published HTML/CSS/script assets match source. The video captures eight seconds of a stationary mobile page with OS Reduce Motion and stored off active: Canvas frames increased from 23 to 256. See `qa/always-v9.html`.

## Interaction v10 — local pre-publication review

Both Chromium and WebKit passed 68 acceptance checks, with zero failed assertions or captured runtime errors. Tests cover native touch, keyboard burst, repeat bounds, gesture cancellation, pin geometry, nonlinear progress, endpoint hold/release, reversal, real leader endpoints, manual scrubbing, eight viewport/orientation combinations, single-pin rebuilding, continuity interval, all twelve workbench steps, 34 skills, dialogs, direct anchors and fallbacks. Rendered portrait, landscape and desktop views were inspected. A stale inline pin-size issue found during rotation was fixed by rebuilding from natural styles before refresh. Live verification is recorded separately after deployment.

The existing energy/continuity regression suite also passed all 85 checks in WebKit, including all ten reversed bridges and original assembly controls.

### Published Interaction v10 verification

Live acceptance: Chromium 68/68 and WebKit 68/68, zero failures and observed runtime errors. All 19 HTML/CSS/JS files served by the public page matched source hashes. A native-input recording confirms three tap bursts and a 0 → 100 → 0 pinned reveal. See `qa/interaction-v10.html` and `docs/evidence/interaction-v10/summary.json`. Physical-device testing remains outstanding.

## Resonance v11 — local prepublication verification

- Fourteen different renderer geometries, twelve common and two rare; a context-weighted bag excludes the last three selections. 1,200 selection trials exercised all fourteen.
- 48/48 acceptance checks passed in Chromium and 48/48 in WebKit. Checks include trusted-touch AudioContext unlock, a nonzero measured audio graph signal, visual/sound ID matching for all fourteen, three-voice bound, cleanup, sound-only mute/volume persistence, lifecycle, four assembly cues, boundary de-duplication, a single cue for fast scroll, viewport ordering and the direct-preview studio.
- The existing 68-check Interaction suite passed in WebKit, including pinned 0–100–0 progress, attached leader geometry, keyboard, touches, existing controls and fallback content.
- All 37 original bitmap artwork files remain byte-identical. Fourteen deterministic 24 kHz WAVs have distinct SHA-256 hashes, finite nonzero signal and sample peak < 0.5. These are DSP synthesis, not field recordings or generative-audio model output.
- Actual mobile and desktop browser captures were inspected. Headless audio-graph verification does not establish physical iPhone speaker output, perceived timbre naturalness or end-to-end acoustic latency. No independent flash-safety/motion compliance certification is claimed.

### Resonance v11 — published-site verification

Live suites: 48/48 Chromium, 48/48 WebKit, 68/68 existing Interaction WebKit: **164 checks passed**, zero failed assertions and captured runtime errors. The AnalyserNode measured nonzero output after actual trusted taps; every visual preset matched its audio ID. Twenty-three runtime files and fourteen WAV files hash-match the committed implementation. See `docs/evidence/resonance-v11/summary.json` and `qa/resonance-v11.html`. Audio naturalness is a subjective listening judgment, and physical iPhone audio was not tested.

## Electric v12 — audio character refinement

- Replace material/modal timbres with capacitor sweeps, shaped arc crackle, clocked digital pulses and short dry logic latches. All fourteen existing reaction IDs and mappings remain unchanged.
- Generated fourteen reproducible 32 kHz WAVs plus a 15.09 s catalogue reel, a 3.33 s three-preset preview, and a 2.33 s level-matched old/new neural-discharge comparison. Previous v11 WAVs retained.
- DSP checks: 92/92 pass; all signals finite, non-silent, deterministic and unique; endpoints zero; peak <= 0.431, RMS <= 0.075, DC < 0.001. These bounds do not certify device loudness/hearing safety.
- Local browser checks: 48/48 in Chromium and 48/48 in WebKit, including trusted tap audio, nonzero graph signal, style mapping, volume/mute persistence, milestones and fallback.
- Fourteen visual/layout/motion implementation files and all 37 original images byte-identical to v11. No physical iPhone audio or subjective listening certification is claimed. Production results are recorded separately.

### Published Electric v12 verification

48/48 checks passed in Chromium and 48/48 in WebKit on the public release URL, with zero failed assertions/runtime errors. All fourteen audio-visual mappings, sound-only mute, persisted zero volume, first-gesture unlock, bounded voices, milestone cues, no-AudioContext fallback and live Studio selectors were exercised. The 92-check DSP report and source/image comparisons are recorded alongside production results. Audio perception and physical-iPhone playback are not certified.


## Quiet Current v13 — local acceptance
- Soundscape: 48 checks in Chromium + 48 in WebKit, no captured errors or failed checks. Actual output buses, foreground ducking, native wheel/range input, reverse, pause, new completion cue, hidden/return semantics and three comparison mixes exercised.
- Existing interaction regression: 68 WebKit checks pass, including pinning, layers, callouts, geometry, 34 skills and native controls. Only the expected release key changes.
- Tests wait for actual scroll/continuity settlement and the observed gesture activity peak rather than assume an 80 ms snapshot is timely under concurrent browser load. Playwright range fill is not used as evidence of a trusted gesture; native keyboard input is used.
- Five production-graph OfflineAudioContext previews have matched master gain, finite/nonzero PCM, controlled fades and no clipping. Full-mix peak does not exceed the unchanged tap baseline by 5%. No per-file loudness normalization.
- Mobile settings and desktop/mobile studio images reviewed. Original 14 tap DSP and nine pre-existing visual/control modules are unchanged; 37 original source images unchanged.
- Physical iPhone audio, subjective pleasantness and performance are not certified. Published verification is recorded separately.

### Quiet Current v13 — published verification
Live checks: 48 Chromium + 48 WebKit soundscape assertions and 68 WebKit existing-interaction checks, all passed without captured runtime errors. Thirty-one served files match source hashes, including five audio previews. Actual live audio buses, native input, lifecycle and the comparison studio were exercised. See docs/evidence/soundscape-v13/summary.json and qa/soundscape-v13.html. Physical-speaker output and subjective pleasantness are not claimed.


## Quiet Current v14 — whole-page release checks

Approved v13 field and current are extended to eleven reachable zones. All 19 visual/control/tap modules, 37 source images and 17 Electric v12 WAV assets (including all fourteen presets) were byte-compared against 7e596d8 and unchanged.

- Full route: 82 checks per engine in Chromium and WebKit. Measured nonzero ambient/current, pause, direction and reversible material coordinates for every zone; one context and thirteen continuous sources remain constant.
- Existing audio lifecycle/control suite: 48 WebKit checks. Existing interaction suite: 68 WebKit checks. Native mobile touch-swipes: seven Chromium checks via browser input dispatch, not forged DOM events.
- Caught and fixed tablet contact/footer markers clamping to the same maximum scroll coordinate. Reserved reachable late intervals. Caught WebKit rounding fractional Studio chapter coordinates just before a seam; jump targets now land eight CSS pixels inside the intended chapter.
- Optional reading fields reduce ambience when their open summary/content is visible. Dialog/menu scroll does not generate the page current. Gallery/search/disclosure reflows are remeasured without a false swipe sound.
- Offline sample comparison of the original v13 instrument versus the new default graph over twelve seconds at 24 kHz: max delta 4.66e-9. Five forty-second whole-journey audition stems/comparisons use the actual production scene mapper and graph at identical master gain. All samples finite, peaks below 0.5, fades below 0.001.
- No physical iPhone speaker or listener fatigue test was performed. Automated graph checks do not certify subjective pleasantness, hearing safety, accessibility or real-device performance. Production results are recorded after publication.


### Published full-current-v14 verification

Production checks: {'coverage_chromium': 82, 'coverage_webkit': 82, 'core_audio_webkit': 48, 'existing_interaction_webkit': 68, 'native_touch_chromium': 7}; total 287, zero failed assertions and runtime errors in the final runs. 32 public assets, including the five forty-second WAVs, match the local release hashes.

The initial native-swipe harness read only the final sample: resetting per-input gesturePeak between render frames produced two false end-sample assertions despite measured current. The final harness samples throughout every swipe and requires at least three observations with the same strict input/direction/peak/RMS thresholds; all six directions/zones and one-context check pass. Runtime sound code was not changed for this harness correction.

See qa/full-current-v14.html and docs/evidence/full-current-v14/summary.json for the full route, comparisons, measured signal and scope/limitations. No physical iPhone listening/performance test was performed.


## Responsive Current v15 — local checks

{'local-chromium': 69, 'local-webkit': 69, 'local-touch-phase-webkit': 9, 'local-visual-webkit': 68, 'local-continuous-audio-webkit': 48}; total 263. All final assertions pass; no runtime errors captured. Ten finite and unique cue WAVs pass level/DC checks. Original accepted soundscape, fourteen tap synthesis and visual/control source modules remain byte-identical to bf066a9.

The initial test expected the first service panel to open, but it starts open; the corrected test uses a closed panel. The clear-search button is only present in the empty-results state, so its test uses an empty-result query. No runtime logic was weakened to satisfy these test corrections.


### Production feedback-v15 verification

{'feedback_chromium': 69, 'feedback_webkit': 69, 'touch_phase_webkit': 9, 'existing_visual_webkit': 68, 'continuous_audio_webkit': 48}; total 263, zero failed assertions or captured runtime errors in the final live runs. 40 public assets match the local build, including all eleven cue WAVs (ten individual sounds plus audition reel). Continuous audio was independently regression-tested with the new cue lane muted, while separate feedback suites exercise its production default-on behavior. Physical iPhone playback and subjective listening remain unverified.


## Piano Moments v16

Replaced rejected digital-electric event beeps with real recorded piano keys plus quieter section textures. Preserved the exact accepted continuous field, scrolling instrument and all fourteen brain-tap presets. Piano library source and transformed bank are credited on-site and in exported assets.

Local checks: event routing 69 Chromium + 69 WebKit; piano/provenance/moment behavior 32 + 32; prior continuous-audio 48 and visual-interaction 68. All final assertions pass with no captured runtime errors. An initial test used locator.tap on the always-moving brain and timed out waiting for it to become stationary; changed the harness to a native coordinate touch, without disabling animation or changing production behavior.

Twenty-one exported cue/moment waveforms are finite, nonzero and bounded; the eleven scene arrangements have distinct PCM. The captured cue bus has measured output and exposes the scene/notes/texture chosen by actual event routing. The single sounding phrase permits at most one brief release tail, with cleanup checked. Sample fetch failure keeps the visual site and other sounds working but never substitutes the rejected beeps or replays a late note.

No claim of physical iPhone output, listening-comfort certification or guaranteed emotion follows from these automated checks. The owner can audition a 6.81-second Orbit → Assemble → About → Contact preview, or all eleven moments in the Studio.


Published Piano v16: {'piano_chromium': 32, 'piano_webkit': 32, 'events_webkit': 69, 'continuous_audio_webkit': 48}; 181 live checks, zero final assertion failures or captured runtime errors. Thirty-four public assets match the implementation, including piano bank, Studio, attribution and previews. All 21 individual waveform checks pass. No physical-iPhone listening test was performed.


## Scroll Sonata v17

Local score tests: 37 Chromium + 37 WebKit, plus 68 established visual-function tests. Six OfflineAudioContext signal/decay/source-count checks passed. All 204 score notes rendered; full musical preview peak 0.290, no per-file normalization. Six-second piano bank replaces the clipped 1.8-second bank in the foreground instrument; all existing source piano samples remain attributed.

Found and fixed: Studio Pause was calling mute(false), which disposed the instrument and removed tails; it now only stops scheduling. Cleared stale pre-resume scroll intent before recreating audio after background return, so a meaningful action resumes sound without unexpectedly replaying prior motion.

Exact preserved modules: 22 visual/control/ambient/tap modules and 37 artwork images. Twenty-two includes the original v14 continuous soundscape and v12 electric brain synth. No physical iPhone listening or speaker assessment was performed.


### Production Scroll Sonata verification
37 score checks on Chromium + 37 on WebKit + 68 original visual/control checks = 142 live assertions, zero failed checks or runtime errors in the final runs. Verified 36 live asset hashes, including the long sample bank and musical preview files. Pauses preserve ringing voices, resumption continues the next beat, scene changes do not reset the score, and note history exactly matches the selected score. Six offline signal/decay gates passed. Physical iPhone speaker and subjective listening remain untested.


## Current Mix v18 — scoped balance correction

The only changed runtime audio processing is a constant +8 dB GainNode on the existing scroll filament after the original motion envelope/ducking. Existing piano score, transport, samples, level, releases and room; ambience; tap sounds; all visual modules and user controls are byte-identical to v17.

Local checks: 25 mix checks each on Chromium/WebKit and 37 score regression checks on WebKit. Offline matched-gesture stem test measures +8 dB; old/current waveforms match after scaling within float precision; ambient difference is zero. Same-score default mix increases about 0.65 dB RMS, not an across-the-board volume increase. Full-master three-burst stress render remains below sample clipping; this does not prove all possible inputs or real speaker safety.

A first implementation scaled the automated envelope value and failed an exact-waveform tolerance (around 3e-6); the final static post-envelope gain passes the original test without loosening the threshold.

Before/after use identical notes, tempo, current motion and master, without separate normalization. Rendered QA page inspected on 390 px viewport; no horizontal overflow. Physical iPhone listening remains untested.

Published verification: {'mix_chromium': 25, 'mix_webkit': 25, 'piano_score_webkit': 37}, total 87 checks; no failures or runtime errors in the final runs. 33 public files match source hashes. Static post-envelope gain measured +8 dB with waveform difference < 3e-8; the ambient-only render is identical. Piano pause/resume and natural tails remain verified.


## Line Current v19 — visual-path-gated scroll sound

The owner clarified that the non-piano electrical current must only be heard while the shared object travels on the visible connector. A scrolling page is not sufficient. The continuity renderer now reports visible-path/progress motion in the drawing frame; audio gates only the current branch and fails closed without fresh evidence.

The gate opens in 8 ms and reaches exact zero 12 ms after closing. A 50 ms movement-cadence allowance bridges render/input intervals; a 100 ms audio-clock lease closes stale reports. The prior +8 dB gain and waveform are unchanged during open travel. Ambient, piano and their tails are not gated.

Verification samples throughout native-input gestures in the page, not only after awaited browser calls; short sound windows were missed by the first endpoint-only fixture. Fixture navigation waits for the previous compositor motion to settle, and live route keys are re-read for narrow holds. Runtime gates/thresholds were not loosened for the fixture.

Local suites cover ten paths both ways, exact zero at midline stops, real holds, pinned layers, reflow/navigation, lifecycle, mobile touch emulation, musical continuation, default-closed and stale-gate offline rendering. Open-gate waveform and ambient waveform are compared against b6cb59f. All piano/score sources, original audio assets and original art are byte-preserved. Production results follow separately. No physical iPhone audio test is claimed.


### Published v19 verification

Live suites: {'line_chromium': 92, 'line_webkit': 92, 'native_touch_chromium': 6}; 190 passing assertions with zero captured runtime errors. Local regression/targeted suites: 295 assertions. Thirty served runtime assets match the implementation commit.

Exact offline current output is zero in default-closed, docked, stale-renderer and post-close windows. The open-gate current and the independent ambient field match the v18 baseline waveform in the same deterministic render. All ten forward and reverse transfers have sampled audible visible travel; all tested dock/stop/pin intervals are silent on that bus. Piano continues in the pin and retains its natural tail. Native mobile input is emulated, not physical iPhone output.


## Boom Signature Celebration v20

Local acceptance: 51 new-behavior assertions in Chromium and 51 in WebKit, 92 line-only-current checks, 68 existing visual/interaction checks, 37 Mozart continuity/release checks, 8 native-touch/Studio checks, and 5 direct screen-geometry reversal comparisons. All final runs passed without detected runtime errors.

The reverse test compares actual rendered particle coordinates after traversing down and back, not merely the same model called twice. All five sampled progress positions matched exactly in the WebKit run. Five forward bursts and all five inward gather cues were observed on the live audio graph in each tested engine.

A landscape visual review found insufficient overhead space. The signature arrival now occurs earlier in short viewports, and radius/vertical centers shrink to fit above the word, instead of drawing over the letters. The secondary heading recedes only during the moment. No new scroll pin/spacer was introduced.

The original +8 dB line current stays exactly silent while the carrier is docked, including the new effect. Piano score, natural releases, existing ambient/current graphs and original brain timbres are unchanged. Dedicated new voices are bounded and cleaned up on mute/hidden. Physical iPhone audio, frame rate and subjective comfort were not tested.


### Published Boom v20 verification

Live tests: {'boom_chromium': 51, 'boom_webkit': 51, 'native_touch_chromium': 8, 'screen_reversal_webkit': 5}, total 115, zero failed assertions or detected runtime errors in the final runs. 38 public assets match the implementation release. Actual reverse particle coordinates at five matched scroll positions had a maximum observed difference of zero CSS pixels. The full forward and reverse native-scroll clip is from the published page; it does not capture audio. Its GIF is cropped and time-compressed for mobile viewing.

The 312 local checks also include the 92-case line-gate suite, 68 existing visual interactions and 37 Mozart progression/tail tests. Original current and piano sources remain byte-identical. Physical iPhone sound and performance were not tested.
