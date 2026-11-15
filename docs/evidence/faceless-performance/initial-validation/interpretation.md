This is the first integration measurement, not a completion report.

The fixed anatomical segment lengths, deterministic reverse sampling, planted foot positions and projected support visibility passed. The initial implementation still had wrist/elbow discontinuities, unreachable authored wrist goals, and locked hand-contact residuals. The nearest rendered left-hand surface was 0.1062 units from its paper contact at timeline 1 and 0.0676 units at timeline 2.

One initial failure was a QA interpretation error: `support.seatWeight` is a supported body-weight fraction with a seated maximum of 0.65, not a 0–1 contact activation. The seated dramatic-passage assertion now checks `seatAmount`, which expresses the intended stance. The raw first-run report is retained so that this correction remains explicit.

The reflection pose initially used a chin-rest gesture. This contradicted the approved lesson-inspection direction and was reported to the motion author; it is not an emotion-recognition finding from these numerical checks.
