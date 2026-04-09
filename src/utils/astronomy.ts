// Simple astronomical calculations for visualization purposes

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
  const obliquity = getMeanObliquity(date);

  const sinDec = Math.sin(eclipticLatitude) * Math.cos(obliquity)
    + Math.cos(eclipticLatitude) * Math.sin(obliquity) * Math.sin(eclipticLongitude);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));

  const y = Math.sin(eclipticLongitude) * Math.cos(obliquity)
    - Math.tan(eclipticLatitude) * Math.sin(obliquity);
  const x = Math.cos(eclipticLongitude);

  let ra = Math.atan2(y, x);
  if (ra < 0) ra += 2 * Math.PI;

  return { ra, dec };
}

// Calculate Greenwich Mean Sidereal Time (GMST) in radians
export function getGMST(date: Date): number {
  const d = getDaysSinceJ2000(date);
  // GMST in degrees
  let gmst = (280.46061837 + 360.98564736629 * d) % 360;
  if (gmst < 0) gmst += 360;
  return gmst * Math.PI / 180;
}

// Convert Equatorial to Horizontal Coordinates
// Returns { azimuth: radians, altitude: radians }
export function equatorialToHorizontal(ra: number, dec: number, lat: number, lon: number, date: Date) {
  const gmst = getGMST(date);
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;

  // Local Sidereal Time
  const lst = gmst + lonRad;

  // Hour Angle
  const ha = lst - ra;

  // Altitude
  const sinAlt = Math.sin(dec) * Math.sin(latRad) + Math.cos(dec) * Math.cos(latRad) * Math.cos(ha);
  const alt = Math.asin(sinAlt);

  // Azimuth
  const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(latRad)) / (Math.cos(alt) * Math.cos(latRad));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))); // clamp to [-1, 1] to avoid NaN

  if (Math.sin(ha) > 0) {
    az = 2 * Math.PI - az;
  }

  return { azimuth: az, altitude: alt };
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
