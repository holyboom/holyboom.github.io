# Round 3 pre-change geometry CPU/cache baseline

Captured 2026-11-14 at 21:46:10 UTC, before the authorized Round 3 implementation start. Runtime files were not edited by this review. Exact source hashes, process metadata and raw summary measurements are in `round3-geometry-baseline.json`.

Reproduce with:

```sh
node --expose-gc scripts/benchmark-profile-geometry.cjs --out /tmp/profile-geometry-result.json
```

Each case launches a fresh Node process with explicit garbage collection. These are isolated geometry CPU and JavaScript heap measurements, not browser or device FPS, GPU time, or end-to-end rendering results. Compare repeated measurements at equal detail; cold/JIT behavior and allocation pauses affect timings.

## Baseline

| Case | Median | P95 |
| --- | ---: | ---: |
| Detail 1, first visit per scene | 25.52 ms | 43.03 ms |
| Detail 1, warmed transition frames | 8.56 ms | 14.24 ms |
| Detail 2, first visit per scene | 19.56 ms | 27.86 ms |
| Detail 2, warmed transition frames | 4.68 ms | 8.94 ms |
| 36-sample light trail | 0.952 ms | 2.976 ms |
| Detail 2 frame in light-comparison worker | 5.012 ms | 10.414 ms |

Heap after importing geometry and its initial scene: **8.73 MB**. After visiting all scene and transition frame caches: **102.58 MB**, a **93.85 MB** increase. After also visiting all illustration/camera caches: **103.59 MB**. Values use decimal MB.

## Safe cache trim

Each scene has 777 lines. The first 502 body/support lines contain 24,096 sampled points; the remaining 275 environment lines contain 13,200 points. Thirty post-opening scenes therefore retain 722,880 body point arrays even though `frame()` rebuilds and returns live anatomy/support for these lines.

For cached scenes **1–30**, preserve every line's metadata and ordering but leave body/support `points` empty. Ideally, skip their sample generation in the static-cache construction rather than generate and discard them. Keep:

- Every point of scene 0, because the opening A membrane morph uses them.
- Every environment point, including hidden alpha-zero lines, because `frame()` can return those cached lines directly. Trimming them would change the public frame result even if the visible picture stayed unchanged.
- IDs, groups, parts, importance flags, alpha and line widths; adaptive detail depends on them before the live-body replacement.

This is safe because the `a > 0 && l < body.length` branch replaces the cached body line with its live equivalent before reading cached body points. In the opening transition the destination body is also the live `body[l]`, not the cached destination points.

A pre-change geometry source snapshot exists at `/tmp/profile-geometry-round3-before.cjs`. For an exact optimization comparison despite concurrent motion improvements, load that source with a custom CommonJS `require` resolving its dependencies to the current `assets/profile` directory. Compare its frame results with the optimized module using the same current motion/config inputs. Test both detail settings, opening/mid-transition/endpoint positions, and explosion values.

## Light trail cost

The 36-point light trail calls the complete rig 36 times. Its median is about 19% of the frame cost measured in the same worker. It is worth a later focused optimization, but the unused body cache is the larger immediate return.

Any trail optimization must preserve historical world-space light positions and project them with the current camera. Do not quantize progress or cache positions by rounded values merely to improve the benchmark. A dedicated right-hand/light evaluation path could skip unused left-arm and leg work, but requires exact comparison against `poseAt(t).light` across all phases. Reusing the already sampled current pose saves only the first sample and is a smaller gain.


## Cache-only result (21:49:31 UTC)

The after-run source hashes confirm that motion, hand geometry and scenes were unchanged; only `geometry.js` changed. Full outputs are in `round3-geometry-cache-after.json` and the derived comparison in `round3-geometry-cache-comparison.json`.

| Measurement | Before | After |
| --- | ---: | ---: |
| Retained heap after all frame caches | 102.58 MB | 44.51 MB |
| Retained heap after all scene caches | 103.59 MB | 45.54 MB |
| Frame-cache heap growth over import | 93.85 MB | 35.78 MB |
| Detail 1 cold median | 25.52 ms | 19.27 ms |
| Detail 2 cold median | 19.56 ms | 13.38 ms |
| Detail 1 warm median | 8.56 ms | 8.55 ms |
| Detail 2 warm median | 4.68 ms | 4.70 ms |
| 36-sample trail median | 0.952 ms | 0.946 ms |

Retained frame-cache heap is **56.6% lower**; the incremental cache allocation is **61.9% lower**. The measured first visits are also cheaper, consistent with avoiding unused point generation. Warm frame generation and light-trail costs are effectively unchanged. This change should be described as a memory and first-visit improvement, not a steady-frame acceleration or browser-FPS result.

Both CPU columns are single fresh-worker samples at the same settings. They remain sensitive to JIT and host activity. Exact frame-result parity is being checked independently by the QA agent; this benchmark does not substitute for that correctness check.
