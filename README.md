# Holyboom × HolyMind

Public website: https://holyboom.github.io/

Theerawee Rangram (Boom), AI Engineer and AI Solutions Architect in Bangkok, and creator of HolyMind Framework.

## The experience

An original HolyMind neural brain anchors the deep-violet profile. Visitors can explore three illustrative business challenges, inspect their workflow steps, and copy a starting brief. A searchable collection presents 34 original HolyMind skill symbols, grouped into Reason, Build and Verify, with plain-language summaries and illustrative examples.

The workbench and examples are not client case studies, measured business results or a live AI service. The page sends no form submissions and calls no model APIs. Fonts, images and interface icons are self-hosted. No analytics or trackers are included in application code.

## Files and hosting

GitHub Pages serves `main` from the repository root, with no production build step.

- `index.html`: semantic content, metadata and ProfilePage/Person JSON-LD.
- `style.css`: responsive HolyMind design, focus states, motion controls and print styles.
- `site.js`: scenarios, keyboard controls, brief copy, skill search, dialogs and navigation.
- `assets/skills.json`: 34 public concept summaries, with no internal skill instructions.
- `assets/`: optimized original artwork, local fonts, licensed UI icons and attribution.
- `profile-schema.json`, `llms.txt`, `robots.txt`, `sitemap.xml`: public discovery metadata.
- `PRODUCT.md`, `DESIGN.md`: product constraints and durable design decisions.
- `design-qa.md`: review evidence, findings and verification limits.

Run `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort` for the dependency-free development server. `npm run check` checks JavaScript syntax. The development-only `/__review?width=390&height=852` route frames the page at a real mobile CSS viewport for responsive inspection. The noindex `qa/responsive.html` fixture supports the same review on GitHub Pages; it is not linked from the public navigation.

## Design references

Product Design, Impeccable 4.8.2, Anthropic frontend-design and UI/UX Pro Max informed the redesign. Their guidance is not a certification. The supplied HolyMind theme and the original artwork are the visual authority. See `DESIGN.md` for deliberate choices and `assets/brand-attribution.md` for ownership and license notices.

Original public identity and section anchors remain. Search inclusion and ranking are not guaranteed.


## Living Mind v4

Adds an original-artwork neural pulse overlay, sticky Reason → Build → Verify orbital narrative, staggered open skill gallery, and scroll-linked symbol movement. Motion is optional and never hides content. The same preference controls every effect.

All libraries, paths, images and fonts are same-origin. See `design-qa.md` for verification scope and `docs/evidence/living-v4/` for browser evidence.

## Showcase v5

Six new experience surfaces extend the approved v4 orbit without replacing it: a kinetic signal crossing, an interactive exploded system, a six-skill optical fan, spatial service panels, a layered Boom signature, and a seven-plane contact aperture. Existing workbench, search, filters, all 34 descriptions and contact links are preserved.

`npm run check` validates all first-party JavaScript. Start preview with `npm run dev -- --host 127.0.0.1 --port 8768`, then run `npm run test:showcase` (Playwright browsers required). Set `TEST_URL`, `QA_DIR`, `ENGINE=webkit` and optionally `CHROME_PATH` to change the test target. `npm run test:motion` retains the v4 functional regressions.

Test output and captured live evidence are linked from `qa/showcase-v5.html` after release. Browser-engine testing is not a physical iPhone performance certification.

## Continuous Mind v6

Shared brain transfer, reversible crystal-to-system transfer, and one shape-shifting visual thread connect the approved v5 scenes. `continuity.js` owns only its own overlay and temporary source opacity classes. See DESIGN.md and `scripts/qa-continuity.cjs` for the contract and reversal checks. Native controls continue to work with motion disabled.

## Exploded System v7

Visit `#system-assembly`. Drag the native slider right to expand. Three primary planes and two intermediate circuit sheets reveal in sequence. Side labels connect to actual projected pins, and can focus a layer. Drag left to reverse. The existing shared brain/crystal and all eleven continuity stations remain.

Accent roles: violet identity, cyan movement, champagne gold arrivals, pearl spark core, sparse orchid glints. Original image bytes are unchanged. No new runtime dependencies or external services.

The range now means **expanded percentage**; `data-expanded` is the range value and `data-assembled` is its complement. This deliberate direction change is reflected in regression tests.

`npm run test:assembly` verifies the native range, staged reveals, endpoint alignment, reversal, keyboard/touch input, six viewport widths, offscreen/idle behavior, and static fallbacks. Set `TEST_URL`, `QA_DIR`, and optionally `ENGINE=webkit`. Tests require the installed Playwright browser engine.

### Spark v8

Brain-first entrance on phones only; stronger shared neural electricity on all screens. The two hero shortcuts and site Motion control have been removed. Old `holyboom-motion=off` values no longer disable the experience. System Reduce Motion selects a calm profile.

Run `npm run check` and `npm run test:energy` with `TEST_URL`, `QA_DIR` and optionally `ENGINE=webkit`. Existing motion/showcase/assembly/continuity scripts now exercise OS-profile changes in place of the removed site control. Browser simulation is not a physical-device performance benchmark.

### Always Active v9
Full motion is now the fixed showcase policy, including with OS Reduce Motion and old stored off preferences. The new `test:always` suite checks real Canvas frame changes without input, continuous visible linework, foreground recovery, and unchanged controls/layout. `test:energy` keeps the 85-case end-to-end regression with the intentional always-on expectations updated.

## Interaction v10

Tap the hero/orbit brain to release a HolyMind charge. Scroll through the pinned assembly to uncover its layers, then reverse to reconnect. The range remains a manual scrubber. Run `npm run test:interaction` with `TEST_URL` and `ENGINE=webkit` or `ENGINE=chromium` for the reusable acceptance suite.

## Resonance v11
Tap the brain for one of 14 visual reactions and its authored micro-score. Sound begins only after a trusted gesture; the independent mute/volume controls do not stop motion. Try all styles at `qa/resonance-v11.html`. Rebuild the original WAV previews with `npm run build:sounds`.

Sound-source documentation: `assets/audio/README.md`; data and waveform metrics: `assets/audio/manifest.json`. The sounds are procedural DSP, not actual recordings or output from an audio-generation model.
