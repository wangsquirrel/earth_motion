import { EquatorFromVector, MakeTime, Observer, RotateVector, Rotation_ECT_EQJ, Rotation_EQJ_HOR, Vector } from 'astronomy-engine';

// Equatorial inputs and scene geometry use geocentric J2000 coordinates.
// Projection includes precession, nutation and apparent sidereal time.

const J2000 = new Date('2000-01-01T12:00:00Z').getTime();

// Calculate Julian Day
export function getJulianDay(date: Date): number {
  return (date.getTime() / 86400000) + 2440587.5;
}

// Calculate days since J2000.0
export function getDaysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000) / 86400000;
}

export function getMeanObliquity(date: Date): number {
  const d = getDaysSinceJ2000(date);
  const e = 23.439 - 0.00000036 * d;
  return e * Math.PI / 180;
}

export function eclipticToEquatorial(
  eclipticLongitude: number,
  eclipticLatitude = 0,
  date: Date = new Date()
) {
  const time = MakeTime(date);
  const vector = new Vector(
    Math.cos(eclipticLatitude) * Math.cos(eclipticLongitude),
    Math.cos(eclipticLatitude) * Math.sin(eclipticLongitude),
    Math.sin(eclipticLatitude),
    time
  );
  const equatorial = EquatorFromVector(RotateVector(Rotation_ECT_EQJ(time), vector));
  return { ra: equatorial.ra * Math.PI / 12, dec: equatorial.dec * Math.PI / 180 };
}

// Calculate Greenwich Mean Sidereal Time (GMST) in radians
export function getGMST(date: Date): number {
  const d = getDaysSinceJ2000(date);
  // GMST in degrees
  let gmst = (280.46061837 + 360.98564736629 * d) % 360;
  if (gmst < 0) gmst += 360;
  return gmst * Math.PI / 180;
}

type ObserverRotation = readonly [number, number, number, number, number, number, number, number, number];
let cachedObserverRotation: { time: number; latitude: number; longitude: number; matrix: ObserverRotation } | null = null;

/** Row-major rotation from scene J2000 (x, z, -y) to local (east, up, south). */
export function getObserverRotation(latitude: number, longitude: number, date: Date): ObserverRotation {
  const time = date.getTime();
  if (cachedObserverRotation?.time === time
    && cachedObserverRotation.latitude === latitude
    && cachedObserverRotation.longitude === longitude) {
    return cachedObserverRotation.matrix;
  }
  // Astronomy Engine uses (north, west, zenith) for the horizontal frame.
  const r = Rotation_EQJ_HOR(date, new Observer(latitude, longitude, 0)).rot;
  const matrix: ObserverRotation = [
    -r[0][1], -r[2][1], r[1][1],
    r[0][2], r[2][2], -r[1][2],
    -r[0][0], -r[2][0], r[1][0],
  ];
  cachedObserverRotation = { time, latitude, longitude, matrix };
  return matrix;
}

// No division by cos(latitude) or cos(altitude): valid at the poles and zenith.
export function equatorialToHorizontal(ra: number, dec: number, lat: number, lon: number, date: Date) {
  const [x, y, z] = equatorialToCartesian(ra, dec, 1);
  const r = getObserverRotation(lat, lon, date);
  const east = r[0] * x + r[1] * y + r[2] * z;
  const up = r[3] * x + r[4] * y + r[5] * z;
  const south = r[6] * x + r[7] * y + r[8] * z;
  const altitude = Math.atan2(up, Math.hypot(east, south));
  const azimuth = Math.hypot(east, south) < 1e-14
    ? 0 // Azimuth at zenith/nadir is undefined; choose a deterministic value.
    : (Math.atan2(east, -south) + 2 * Math.PI) % (2 * Math.PI);
  return { azimuth, altitude };
}

// Convert spherical to cartesian coordinates
// azimuth is measured from North (0) towards East (pi/2)
// altitude is measured from horizon (0) to zenith (pi/2)
// In Three.js: 
// y is up (zenith)
// -z is North
// x is East
export function horizontalToCartesian(azimuth: number, altitude: number, radius: number) {
  const y = radius * Math.sin(altitude);
  const rProjected = radius * Math.cos(altitude);
  const x = rProjected * Math.sin(azimuth);
  const z = -rProjected * Math.cos(azimuth);

  return [x, y, z] as [number, number, number];
}

// For space view, we want to map equatorial coordinates to a sphere
// Right Ascension (ra) is angle from vernal equinox
// Declination (dec) is angle from equator
export function equatorialToCartesian(ra: number, dec: number, radius: number) {
  // In our space view:
  // y is north celestial pole
  // x, z is celestial equator plane

  // Apply earth rotation to celestial sphere if we want the earth to be stationary
  // Or apply to the earth if we want celestial sphere stationary.
  // We'll keep celestial sphere stationary, so ra=0 is fixed.

  const y = radius * Math.sin(dec);
  const rProjected = radius * Math.cos(dec);

  // ra is measured counterclockwise from x axis (vernal equinox)
  const x = rProjected * Math.cos(ra);
  const z = -rProjected * Math.sin(ra);

  return [x, y, z] as [number, number, number];
}
