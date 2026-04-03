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

// Get Sun's position in Equatorial Coordinates (Right Ascension and Declination)
// Returns { ra: number (radians), dec: number (radians) }
export function getSunEquatorialPosition(date: Date) {
  const d = getDaysSinceJ2000(date);

  // Mean anomaly of the Sun
  let g = (357.529 + 0.98560028 * d) % 360;
  if (g < 0) g += 360;

  // Mean longitude of the Sun
  let q = (280.459 + 0.98564736 * d) % 360;
  if (q < 0) q += 360;

  // Ecliptic longitude of the Sun
  const gRad = g * Math.PI / 180;
  const L = q + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
  const LRad = L * Math.PI / 180;

  // Obliquity of the ecliptic
  const e = 23.439 - 0.00000036 * d;
  const eRad = e * Math.PI / 180;

  // Right ascension and declination
  let ra = Math.atan2(Math.cos(eRad) * Math.sin(LRad), Math.cos(LRad));
  if (ra < 0) ra += 2 * Math.PI;

  const dec = Math.asin(Math.sin(eRad) * Math.sin(LRad));

  return { ra, dec, LRad }; // LRad is useful for drawing the ecliptic position
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
