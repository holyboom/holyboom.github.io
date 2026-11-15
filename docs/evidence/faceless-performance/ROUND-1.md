# Refinement 1 — acting, physical contact and natural posing

Started2026-11-14 20:47:02 UTC; finished21:17:17 UTC. Elapsed30m15s. This report records the implementation and evidence from that round.

## Changes driven by actual inspection

- Shared FK hand shapes now supply both the visible finger geometry and the rig's physical contact feature. Typing/pointing use the visible index tip; holding/bracing use the palm pad; writing uses a separately held tool. Fixed phalange lengths remain invariant through angle blends.
- The real stylus shaft is held between the thumb and index rather than hovering above them. The held shaft was measured0.05141 /0.04178 model units from thumb/index; the adjusted local offset and shaft axis reduce this to0.00349 /0.00558, inside their rendered envelopes. The world writing tip remains on the intended surface.
- Drawing now hands off through transport, docking, finger release and keyboard approach. The released pen stays on a visible side rest clear of the keyboard. Work-surface changes wait for release.
- Active contacts are tied to painted node/orb/card edges instead of a generic empty work plane. Hand and object share one frame during reflection's single inspection turn.
- Resistance keeps a partially withdrawn hand close to the failed connection. Retry holds the joined result to inspect it, then releases right and left in sequence. The final stand relaxes the left arm while the right retains the working light.
- A smooth blank-front/chin versus rounded occiput makes head direction more legible without eyes or facial animation.
- Seat/back contours and a stable, rounded woven floor patch clarify support during sitting and rising. Obsolete floating UI/furniture traces were removed. Compact in-art labels were removed where they crossed the action; the native action/caption remains.

## Evidence

- `round-1-final/results.json`:46 passing checks, including6,001 timeline poses, hand/contact/tool sampling, runtime/source parity at desktop/mobile sizes, and an actual settled Canvas pixel rewind through pen ownership change.
- `round1-final/`:31 scenes in desktop/mobile/isolated-art contexts,15 transition samples and25 semantic action-phase views.
- `round1-pinch-review/`:10 high-DPR phases and actual-render detail crops.
- `round1-motion-clean/pilot-traversal.webm`: native forward/reverse scroll recording;175 finite camera/hand telemetry samples.
- `round1-acting-review.md`, `refinement1-geometry-review.md`, `round-1-final/visual-review.md`: independent qualitative observations and the changes they motivated.

The recorded review is engineering/art-direction inspection. It is not an audience study, physical-device benchmark or claim that every viewer will infer an identical emotion. Small remaining lighting, duplicate desktop label and composition details are assigned to refinement2; sustained performance and broader compatibility to refinement3.

## Complete visual scan

All31 isolated-art frames and the corresponding mobile stage sheets were reviewed. No additional round1 blocker was found. Round2 priorities from that scan: remove redundant desktop ember labels crossing the acting space, make the last invitations visibly different from inward inspection, soften lighting around pinch/hand contours, and give the skill/network imagery more depth while retaining its actual contact edges.
