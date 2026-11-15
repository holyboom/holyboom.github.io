# Living Architecture — v1 verification (historical)

This report records the abstract-sculpture version. The current human narrative revision is documented in `../human-matrix/REPORT.md`; the earlier Lighthouse scores do not certify that revision.

Implemented on branch `feat/living-architecture-profile`. English `/profile/` only. Production is not deployed or pushed. The running production-artifact preview is `http://localhost:4174/profile/` in the execution workspace.

## Delivered

- Personal narrative centered on **AI experiences**, from architectural ambition through enterprise frontend, personal conviction, experience-led skills and synthesis to applied AI.
- Eleven art states, continuous reversible transformations, a shared architectural signature, human review gate and inspectable layers.
- Native career summary and links, configurable geometry, System/Full/Reduced motion, mobile layouts, no-JS/static fallbacks and print layout.
- Generator integration, shared career source, deterministic SVG generation, self-hosted fonts and licenses, manifest integration, and pre-deployment CI browser checks.
- Owner customization guide: `docs/LIVING-PROFILE.md`.

## Verification

| Check | Result |
| --- | --- |
| Production discovery validation | 2,141 assertions passed |
| Discovery gate tests | 26/26 passed |
| Chromium behavior tests | 44/44 passed |
| Firefox behavior tests | 44/44 passed |
| WebKit behavior tests | 44/44 passed |
| Existing professional profile / main-site regression | 42/42 passed |
| Axe WCAG 2 A/AA + 2.1 AA automated checks | No reported violations |
| Source syntax and whitespace checks | Passed |
| Generator repeatability | Identical generated files on repeat build |
| Keyboard skip link and 200% zoom overflow | Passed |
| Closed disclosures printed without JavaScript | Verified visible in Chromium, Firefox and WebKit |
| Thai page, homepage, shared professional identity and plain summary | No diff |

The browser suite covers chapter targets, reverse geometry, contact docking and return, inspectable layers, preferences, live OS motion changes, deep links, fast scrolling, seven viewport sizes, short-phone fallback, native no-JS disclosure/FAQ, script failure, blocked storage, and absence of third-party runtime requests.

## Performance

Three sequential mobile Lighthouse runs against the production artifact:

- Performance: **100 / 100 / 100**.
- Accessibility: **100 / 100 / 100**.
- Median LCP: **0.90 s**.
- Median total blocking time: **54 ms**.
- Median CLS: **0.0035**.
- Profile-specific external JavaScript: **13.7 KiB uncompressed**.

An initial variable layout shift was fixed by reserving the enhanced stage before first paint. Failed scripts restore the static view; reduced motion avoids the stage reservation. Geometry is cached per scene on demand instead of computing all states during initial load.

## Evidence

- `desktop.png`, `mobile.png`: rendered implementation.
- `desktop-beneath.png`, `mobile-beneath.png`: inspectable layers.
- `desktop.webm`, `mobile.webm`: forward story, inspection, reverse travel and contact.
- `storyboard.png` / `storyboard.html`: all states rendered from actual fallback geometry.
- `profile-print.pdf`: print export.
- Browser, regression, Axe and performance JSON results alongside this report.

## Limits and release

These are headless Linux browser checks and viewport emulation, not physical iPhone/Android measurements, a screen-reader audit, a field INP measurement, or accessibility certification. WebKit was executed with required Debian shared libraries extracted locally into its test-browser cache; it is not Safari running on an Apple device. Lighthouse scores are lab results and will vary on production networks and hardware. GPU frame-time p95 and physical-device listening/performance were not measured; this profile contains no audio. GitHub Actions was updated but has not run remotely because no branch was pushed.

The live GitHub site is unchanged. Review this preview before a release to `main`; the existing Pages workflow deploys main automatically. Roll back with a revert of the release commit if needed. No database migration or external service setup is required.
