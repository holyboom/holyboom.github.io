# Runtime review

Run `node scripts/qa-profile-runtime-review.cjs` against the source preview on port 4173. `TEST_URL` and `RUNTIME_QA_DIR` select another preview/output directory. `results.json` records hashes of the JavaScript actually loaded by the browser.

The final source run passes nine focused checks:

- Typing, reflection and contact stop drawing once movement and the trail settle.
- The hidden-document handler stops drawing, clears the trail and resumes at the current position.
- Reversing scroll starts a fresh trail span.
- Three complete scroll traversals retain a stable warm heap and listener count, with no browser errors.

After forced garbage collection, warm retained JS heap was 28,448,712 → 28,526,320 → 28,583,876 bytes: an increase of 135,164 bytes across the repeated traversals. DOM nodes returned to 1,790 and listeners remained at 23. This measures retained JavaScript memory in headless desktop Chromium, not total process, GPU or physical-device memory. The first traversal intentionally populates geometry and illustration caches.

A real issue found separately during this review was stale full-motion state after scrolling in Reduced mode. Returning to Full initially traversed unrelated chapters. The renderer owner fixed the static-to-live transition; independent replay then showed the first resumed frame already at its current target, without the intervening traversal. The dedicated layout/accessibility suite covers that regression.

Headless Chromium keeps tabs visible even when another tab is activated. The hidden-document check therefore uses temporary visibility-property overrides and dispatches the real handler. CDP accepted a lifecycle-freeze command but emitted no freeze event and kept running animation frames; a blank-page probe behaved identically. That lifecycle check is recorded as unavailable, rather than a pass or an application failure.
