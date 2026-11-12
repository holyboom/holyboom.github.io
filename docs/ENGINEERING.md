# Engineering notes

This repository is Boom’s public portfolio and an interactive presentation of HolyMind concepts. It is not the installable HolyMind framework or a hosted agent service.

## Run locally

The application is static HTML, CSS and JavaScript. GitHub Pages publishes the repository root on `main`; there is no production compilation step.

```sh
git clone https://github.com/holyboom/holyboom.github.io.git
cd holyboom.github.io
node scripts/preview.mjs --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/`. The preview server uses Node built-ins and does not require an install. Run `npm run check` for first-party JavaScript syntax. Browser tests require the development dependencies and the corresponding Playwright engine.

```sh
npm ci
npx playwright install webkit
TEST_URL=http://127.0.0.1:4173/ ENGINE=webkit npm run test:contact-readme
```

Older release-specific test fixtures can assert their original copy/layout; use the current contact/README suite and preserved-behavior regressions for this release.

## Architecture

| Responsibility | Entry points |
| --- | --- |
| Identity, metadata and contact | `index.html`, `profile-schema.json`, `llms.txt` |
| Scenarios, skill collection and accessible controls | `site.js`, `assets/skills.json` |
| Explicit choices and inspectable examples | `intent-journey.js`, `workflow-proof.js` |
| Native scroll, shared visual object, exploded layers | `continuity.js`, `assembly-scroll.js`, `viewport-stability.js` |
| Piano and four sound roles | `holymind-audio.js`, `holymind-scroll-score.js`, `scroll-sonification.js` |
| Reversible firework geometry and recordings | `boom-particles.js`, `boom-celebration.js`, `boom-audio.js` |

## Behavior worth preserving

Motion is always active in the owner-selected showcase. Sound starts only after a meaningful gesture; master mute and four independent sound roles remain available. The electrical current is audible only during visible movement on a line. Piano follows scrolling with ordered notes and natural tails; it does not share the line gate. Reverse fireworks reuse the same particle identities. Small mobile browser-height changes must not reset the distant pin or clear active scroll input.

The workbench is explicitly illustrative. Example sources are fictional, no model API or submission runs, and a draft does not imply authorization. Brief choices are validated IDs in current-tab session storage. Inspecting examples and scrolling do not overwrite the visitor’s choices.

## Verification and rights

Current contact/README evidence: [release report](evidence/linkedin-fieldnotes-v28/summary.json). Earlier engineering evidence is retained in [release history](RELEASE-HISTORY.md) and [design QA](../design-qa.md). Automated browser checks are not physical-iPhone, listening-comfort, frame-rate or accessibility certification.

The HolyMind brain and symbols remain the owner’s original artwork; publication is not an open-source icon license. See [brand attribution](../assets/brand-attribution.md), [audio credits](../audio-credits.html), and the individual third-party notices. No private framework instructions are included.
