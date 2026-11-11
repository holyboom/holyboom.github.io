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
