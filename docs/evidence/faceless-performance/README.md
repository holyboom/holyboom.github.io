# Faceless performance evidence

Latest delivery: [Thai summary](DELIVERY.th.md), [three completed refinement rounds](EXECUTION.md), [final visual review](FINAL-VISUAL.md), [verification results](verification-summary.json), and [continuous page preview](round3-delivery/journey-preview-desktop.webm).

`baseline-anatomy.json` records distances between anatomical joints in the original named poses, before the fixed rig was integrated. The old left forearm varied by 3.63× and right upper arm by 3.21× across the story. These are joint-coordinate measurements, not estimates from screenshots.

Run the physical performance suite from the repository root:

```sh
SKIP_BROWSER=1 node scripts/qa-profile-performance.cjs
TEST_URL=http://127.0.0.1:4174/ node scripts/qa-profile-performance.cjs
```

Set `PERFORMANCE_QA_DIR` to keep a separate refinement-round output. The default directory is `docs/evidence/faceless-performance/validation`.

The numerical suite samples 6,001 poses through the complete 0–30 timeline. It measures limb and finger lengths, contact residuals, foot sliding, local frame validity, discontinuities, reversible sampling, the two rises and one sit, the seated dramatic passage, and projected joint visibility. Integer timeline positions are readable endpoints; each action approaches its endpoint from the preceding integer. The support bridges are 6→7, 12→13 and 16→17.

Rendered contacts are measured against visible finger/palm/tool geometry and actual painted polygons or strands. A mathematically valid target in empty space is a failure. The drawing-to-typing passage has 401 ownership samples and 41 rendered samples: the stylus must stay rigid, settle at its dock before release, remain visible as typing begins, clear the actual painted keyboard, and rewind exactly. Browser checks also compare the built rig with the verified source and compare settled canvas pixels after scrolling through release and back; transient light trails are allowed to finish first.

The generated monochrome review sheets show the same skeleton with the authored desktop camera, compact camera, and a fixed neutral camera. The fixed view helps reveal whether the acting itself communicates a change. The support sheet shows intermediate weight-transfer poses. Browser mode captures the actual woven renderer at desktop and phone viewport sizes.

For human review, hide the captions below each frame and ask what the person is doing, where their attention is, and what changed between poses. Compare conviction, resistance, reflection, a changed attempt and persistence. Record ambiguous readings instead of treating body language as a universal code. A passing numerical suite does not establish that viewers recognise these emotions.

Contact checks establish animation continuity; they are not a force-based biomechanical simulation. Browser captures use emulated viewports and do not constitute physical-device testing.
