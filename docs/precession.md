# Bounded precession visualization

Baseline before changes: local HEAD and remote main both
`b37c0bcd699e9e1a42f97db3fe90b4ce8bc0651e` (2026-10-02).
The fresh checkout had no user changes.

The optional overlay uses the existing simulation clock. Editing its era slider
calls `setCurrentTime` with a new UTC year, retaining month/day/time, playback and
speed. February 29 is clamped to February 28 when needed. Daily rotation and all
body calculations keep their existing semantics. The overlay never pauses time.

`Rotation_EQD_EQJ(date)` converts the true equator/equinox-of-date basis into
J2000. Astronomy Engine vectors become scene vectors `(x,z,-y)`. The overlay is
inside the existing J2000 sky group: the existing `getObserverRotation` applies
EQJ→HOR exactly once in both observer views. Stars keep their original J2000
coordinates. Existing reference grids are explicitly labeled J2000; gold marks
the current epoch equator, pole and equinox. Cyan is a dated segment sampled every
20 years, labeled every 500 years. Pink compares the pole at today's real date,
captured when the optional layer mounts; it is a reference, not a second clock.
Geometry is reused while the epoch group quaternion updates each frame, without
React state updates. The layer is absent by default and does not alter Sun-only
performance paths.

The supported overlay window is 1000–3000 CE (inclusive calendar years). Outside
it, the overlay hides with an explicit UI message; normal simulation continues.
Astronomy Engine uses fifth-degree P03 precession, IAU 2000B nutation and a
polynomial mean obliquity, not a periodic 26,000-year solution. The ±10-century
window is supported by the comparison of precession models in Vondrák et al.;
it is not a claim of independently validated historical planetary positions or
ancient Earth rotation. No full-cycle extrapolation is drawn. J2000 catalog
proper motion is omitted, ancient UT/TT is approximate, and dates use the
proleptic Gregorian calendar. Current cultural names do not reconstruct the
selected era's historical sky culture.

Sources:
- [Astronomy Engine API and model](https://github.com/cosinekitty/astronomy/tree/master/source/js)
- [Vondrák, Capitaine and Wallace, long-term precession comparison (Fig. 4)](https://syrte.obspm.fr/jsr/journees2011/pdf/vondrak.pdf)
- The cultural note reuses the sourced `ziwei` entry in
  `src/data/chineseSkyCulture.ts`, rather than inventing a historic pole-star identity.

Numerical tests cover epoch basis orthonormality, both geographic poles, pole
altitude = observer latitude, celestial/horizon round trips, path bounds, era
editing at all four existing speeds, and daily solar horizon crossings.
