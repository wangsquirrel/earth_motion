# Performance changes and verification

This document records the initial culture/performance release (`2ae0966`, measured on September 30–October 1, 2026). The later correction to body/path update cadence and hidden-layer work is documented separately in [continuous-body-rendering.md](continuous-body-rendering.md). Its uniform per-frame updates replace the earlier rendering cadence; the numerical cache/projection benchmarks below remain scoped to their original workloads.

## Scope and visual invariants

These changes remove redundant CPU work. They do not reduce the star catalog, line segments, sphere tessellation, texture resolution, DPR, annual/diurnal sample counts, update cadence, or celestial precision. The performance refactor itself preserves label content. Separately, the cultural-data work corrects ε Ori from 参宿三 to 参宿二 and δ Ori from 参宿二 to 参宿三; these two reviewed text corrections are not described as visual equivalence. The existing `Line2`/Billboard components, materials, draw order, dash phase, transparency and horizon clipping remain in place. No draw-call batching was introduced because browser pixel/transparent-sort verification was unavailable.

- Annual Sun paths retain all 361 samples; a four-year LRU lets remounts, language changes and trail toggles reuse the same exact-year result
- Ephemerides use bounded caches keyed by the exact millisecond, never a rounded time. Returned live-body objects are copies, so callers cannot corrupt the cache. One-off path samples bypass live-body caches
- J2000-to-observer projection rotates the Cartesian vector directly and derives angles only when callers require them. It retains the same Astronomy Engine observer rotation, precession, nutation and sidereal-time model
- Ecliptic samples reuse the exact-date ecliptic rotation
- Catalog/constellation caches use object identity rather than array length or joined IDs, avoiding collisions. They assume immutable source arrays and star records, as used by this project. Replace arrays/records when editing data; do not mutate them in place
- Horizon readers share ancestor-matrix work within a render frame. Each leaf matrix is still refreshed, and the rotating sky still updates at priority -1. The helper is restricted to stable ancestors after negative-priority animation. It uses render-clock time, not simulation time, so paused interaction is not treated as a stale frame

## Reproduce

From the repository root after installing the existing lockfile dependencies:

```sh
npm test
npm run check
npm run lint
npm run build
node scripts/benchmark-performance.mjs \
  --baseline=ed5b07398ba73302335cd0bee094367bbbb90d28 \
  --output=docs/performance-results.json
```

The benchmark materializes the requested Git baseline into a temporary directory, reuses the same installed dependencies, loads both versions through Vite, verifies deterministic output equivalence, alternates execution order and reports the median of seven measured rounds. Warmup is excluded. The two allowed label changes are keyed to their exact stable IDs and their expected before/after strings; all other text is compared normally. Temporary files are removed afterward. `--baseline` is optional when only current timings are needed.

## Recorded results

Machine: AMD EPYC 9V74, Node v24.19.0. Raw measurements from the three-process diurnal follow-up are in `performance-runs.json`; `performance-results.json` contains a later final-code verification run, including the two cultural label corrections. Each process uses the same unchanged seven-round workload. Millisecond values below are per workload invocation, not per rendered frame.

The final process measured:

| Workload | Baseline ms | Updated ms | Interpretation |
| --- | ---: | ---: | --- |
| 330 horizon readers, synthetic shared scene hierarchy | 0.0733 | 0.0222 | matrix-reader primitive only |
| 10,000 coordinate projections | 2.3103 | 1.6293 | projection primitive |
| Repeated-year annual path, 361 samples | 1.5994 | 0.0008 | exact cache hit avoids resampling |
| Cold-year annual path, 361 samples | 1.4676 | 1.4527 | no robust improvement across runs |
| Advancing diurnal path, 145 samples | 0.7402 | 0.7412 | mixed repeated runs; no stable speedup claim |
| Ecliptic helper, 181 samples | 0.1573 | 0.0899 | retained utility, not a scene hot path |
| Five observer changes at one time, all bodies | 0.4213 | 0.1107 | exact-time reuse |
| Advancing Space body + seven-marker calculations | 0.1225 | 0.1223 | approximately equal across runs |
| Observer star/line rebuild helpers | 0.4226 | 0.0417 | retained utility, not a scene hot path |

### Diurnal allocation follow-up

An earlier recorded process showed an 8% diurnal-path slowdown. Inspection found two unnecessary intermediate arrays: all sample Dates, then all Sun coordinates, followed by projection into the actual output array. The final implementation uses one `Array.from` output pass, computes each Date and exact uncached Sun position and projects it immediately. The 145 output points and sample dates are unchanged; the live-body cache remains unpolluted. No benchmark parameter was changed to obtain better numbers.

| Independent process | Baseline ms | Updated ms | Updated runtime change |
| --- | ---: | ---: | --- |
| 1 | 0.6906 | 0.7990 | 15.7% slower |
| 2 | 0.8276 | 0.7648 | 7.6% faster |
| 3 | 0.7386 | 0.6921 | 6.3% faster |

All three processes passed the same `1e-10` baseline output-equivalence check. These mixed results do **not** establish a stable regression or a stable speedup for the diurnal path, and they do not prove that the earlier 8% slowdown was caused by those allocations. The simpler one-pass implementation is retained because it removes demonstrably unnecessary intermediate allocations, not because one favorable timing was selected.

Across the same three processes, the horizon-reader primitive was 3.35× / 3.44× / 3.49× faster, projection was 1.52× / 1.75× / 1.44× faster, and five observer changes were 3.21× / 3.33× / 4.05× faster. Advancing body-plus-marker work was 1.28× / 0.99× / 0.98× baseline speed and is treated as approximately unchanged.

### Interpretation limits

The horizon-reader benchmark is a synthetic primitive benchmark using the current catalog's reader count. It is **not an entire R3F frame**. Drei's own Billboard callbacks still update ancestor/camera matrices, and Three's renderer still performs its own matrix traversal. Consequently the primitive's result must not be described as the same frame-rate or total-rendering improvement.

The ecliptic and observer star/line rebuild helpers are not currently called by the stable-geometry main scenes; their speedups are not playback/FPS gains. Raw speed ratios vary with scheduling/JIT/GC. The cold path and advancing ephemeris rows do not establish a meaningful speedup. The strongest measured results are eliminated annual resampling, shared horizon-reader ancestor work, exact-time reuse during observer edits, and the projection primitive.

## Regression evidence

- The final complete test suite passed with 23 tests, including cultural identity corrections and a real R3F demand-mode reconciliation test using a stub renderer
- Type checking, ESLint and the production build passed
- The benchmark compares baseline/current coordinates, visibility, sample counts, colors, sizes, IDs and segment endpoints, plus every label except the two explicitly asserted ε/δ Ori corrections with relative tolerance `1e-10`, over J2000/current/2100 dates, both geographic poles/equator/mid-latitude and multiple longitudes, plus both chart cultures and interface languages
- Tests cover cache eviction, mutable `Date` input, 1 ms time changes, mutation-safe ephemeris returns, equal-length catalog collisions, same-ID constellation collisions, direct projection at radius zero, unchanged sample counts and cached-year eviction
- Matrix tests compare every matrix element exactly over 20 transformed frames, including parent translation/rotation/scaling and within-frame leaf rotation. The ancestor-update count assertion is scoped to these explicit readers only

Browser visual/interaction verification remains incomplete: the coordinating task's cloud browser navigation to the local app was blocked with `ERR_BLOCKED_BY_CLIENT`. That block was not bypassed. There are no measured FPS, startup, GPU-time, screenshot-equivalence or browser interaction claims. Run the app in an authorized browser to inspect observer/celestial/Earth views, horizon crossings, camera drags, pause/play and culture/language combinations.

The build retains existing large-chunk/Browserslist-age warnings; no packages were upgraded or installed for these optimizations.
