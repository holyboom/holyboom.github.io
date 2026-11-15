# Refinement 2 — gesture clarity, woven volume and revealed architecture

Started2026-11-14 21:17:17 UTC; finished21:48:38 UTC. Elapsed31m21s.

## Changes driven by review

- Reworked the closing gestures: agency releases the control, welcome opens the palm beside the interface, invitation extends fingers into open space, review brings both hands inward, and offering moves the palm forward below the work. The latest welcome/invitation targets put the entire palm beyond the panel rather than leaving only a fingertip visible. Reach remains inside the fixed arm length.
- Removed duplicate ember and recipient labels that crossed the acting space, and moved laptop labels below the keyboard. The nearby native action/caption continues to carry the meaning.
- Reduced the hand light to a compact point and halo; the held stylus remains a separate physical object. This prevents a stray angular mark at the hand while preserving the directional light trail.
- Skill orbs now contain genuine three-dimensional curved meridians and latitude paths. The renderer and SVG fallback split front-work volume paths at the shared work plane so front arcs are visible above the opaque equator and rear arcs remain behind it.
- Explore beneath the surface opens two real woven diagram layers, with graph nodes and connections, behind the unchanged front interface. The layers fan laterally and upward to expose their content on compact screens.
- Disclosure expansion/collapse and subsequent layout changes preserve the displayed pose. The offset decays through actual story travel with a monotonic reversible mapping, including native scroll-anchor adjustment during a width change.
- Fixed repair/research/reveal contact intervals: preparation arcs settle before touch activation, selection pauses on its actual item, and reveal releases before pulling away.
- Increased tablet caption separation by6px after measuring an overly tight gap.

## Verification

- The candidate62-check suite passed, including63 contact intervals and171 start/middle/end painted-surface probes. The strengthened final suite then caught occluded first-layer graph links; the final fan-out was increased to expose the actual connections rather than only the outer rim. The final62-check suite passes. Six native desktop/mobile captures at7.25,7.60,7.85 confirm visible connections and no layer clipping.
- General Chromium profile regression passed59 checks. Its optional-Canvas-label assumption was corrected; the native-HTML check was strengthened to verify every action string, not just the count of beat elements.
- Splitter sweep:668 front-work volume paths produced1,767 fragments with552 front and552 rear nondegenerate arcs;268 back-layer bridges stayed intact. Endpoint error0; maximum wrong-side residual below2e-15.
- Native disclosure inspection at1440px and390px preserved pose/camera/hand on pointer-open and keyboard-close. A390→430px width change with native scroll anchoring also preserved the displayed position.
-31 forward/reverse native-scroll samples per viewport had maximum reversal error0; native Work anchor remained exactly8.
- Targeted final actual-Canvas captures cover skill20, welcome25, invitation26 and offering28. Source response hashes are recorded in the capture manifest.

These results are numerical/browser and art-direction checks, not audience recognition testing or physical-device performance claims. Local production build only; no public deployment has been performed.
