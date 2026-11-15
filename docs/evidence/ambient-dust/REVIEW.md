# Scroll dust review

Final recommendation: retain the current treatment. Selected background pieces break into fine grains and reassemble in both scroll directions. The character, foreground work, and captions remain dominant. The final mobile particle-width adjustment makes the grains easier to pick out without increasing their opacity or turning them into a foreground effect.

## Numerical evidence

[Final results](qa-final/results.json): **17 checks passed, zero skipped**, using the explicit pre-dust geometry baseline. Coverage includes 421 timeline samples obtained through inversion of the actual public resolver, reverse/shuffled history independence, finite geometry, source identities, bounded spread, fine cloud formation, stable endpoints, and sampled continuity.

- Maximum particle paths: **120 desktop / 60 after mobile filtering**.
- All 31 static beats preserve the undissolved surroundings.
- Actor performance, foreground work, camera, and hand light match the baseline through all samples; 61 full body/gravity-field samples also match exactly.
- Maximum sampled neighboring point step: 0.000126 world units; maximum effective alpha step: 0.000071.
- Normal runs without an existing `DUST_BASELINE` explicitly skip five parity checks. They do not claim baseline parity. That branch was also verified.

The tested geometry hash is `0a29e9124d56e11aa858869396be72cb645d70bb61430724de37d8a95b999f5b`; the baseline hash is `64c64227e339387ed99516e3370eb9ee7816241fe37f5f012554f480bd3f9a82`.

## Visual evidence

[Main capture manifest](final/manifest.json) contains **28 stills and eight native forward/reverse sweeps**, with 220 recorded states and zero browser errors. All four phase sheets, eight desktop/mobile midpoint contexts, and seven motion strips were inspected. Response-body hashes agree across the desktop, mobile, isolated-art, and video contexts.

Reviewed transitions:

- [Drawing → frontend](final/transition-03.png): the right background piece erodes beside the editor, then reforms. The foreground keyboard and hands stay clear.
- [Human control → solitude](final/transition-13.png): the surroundings thin out quietly, keeping attention on the hand-held light.
- [Research → capability](final/transition-20.png): the two inward-gathering clouds are the clearest example of dust becoming a new form.
- [Complexity → interface](final/transition-23.png): a peripheral network dissolves while the foreground interface remains legible.

The initial mobile review found the drawing-to-frontend grains too delicate. The renderer now exempts particle strokes from the usual mobile width reduction. [Focused final mobile evidence](mobile-final/manifest.json) adds three stills and a native 390px forward/reverse recording with zero errors. The cloud remains intentionally subtle, but the breakup and reconstruction can be followed through the individual grains. No further brightness or placement change is recommended.

The focused mobile capture confirms renderer hash `65e2ef74b94b6e038869a330b23fa9e00ce81618aea17a305d21d55325906a14` and the same geometry hash as the numerical suite. Earlier main captures used renderer `6059bb1098d0`; their desktop appearance is unaffected by the mobile-only width adjustment.

## Useful previews

- [Desktop synthesis cloud](final/desktop-20-cloud.png)
- [Four forward/reverse transitions](final/dust-forward-reverse.webm)
- [Final mobile forward/reverse transition](mobile-final/mobile-03-forward-reverse.webm)
- [Final mobile cloud still](mobile-final/mobile-03-cloud.png)

Recordings were reviewed through sequential video frames, including native-sized mobile stage crops. Each pilot traversal uses continuous native scrolling; jumps between nonadjacent pilots are capture navigation. These are headless browser captures, not physical-device frame-rate measurements.
