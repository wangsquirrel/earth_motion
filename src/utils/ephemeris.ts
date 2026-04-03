/**
 * High-precision astronomical calculations using astronomy-engine
 * Replaces simplified formulas in astronomy.ts for Sun, Moon, and planets
 */

import {
  Body,
  Equator,
  EquatorFromVector,
  GeoMoon,
  HOUR2RAD,
  MakeTime,
  Observer,
} from 'astronomy-engine';

// Geocentric observer (at Earth's center) for celestial sphere calculations
const GEO_CENTER = new Observer(0, 0, 0);

/**
 * Get high-precision Sun equatorial coordinates
 * Returns { ra, dec } in radians
 */
export function getSunPosition(date: Date): { ra: number; dec: number } {
  const time = MakeTime(date);
  // Use ofdate=true for true equator/refraction
  const result = Equator(Body.Sun, time, GEO_CENTER, true, true);
  return { ra: result.ra * HOUR2RAD, dec: result.dec * Math.PI / 180 };
}

/**
 * Get high-precision Moon equatorial coordinates
 * Returns { ra, dec } in radians
 */
export function getMoonPosition(date: Date): { ra: number; dec: number } {
  const time = MakeTime(date);
  const vec = GeoMoon(time);
  const result = EquatorFromVector(vec);
  return { ra: result.ra * HOUR2RAD, dec: result.dec * Math.PI / 180 };
}

/**
 * Get planet position
 * Body names: 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
 * Returns { ra, dec } in radians, or null if body not found
 */
export function getPlanetPosition(
  bodyName: string,
  date: Date
): { ra: number; dec: number } | null {
  const body = stringToBody(bodyName);
  if (!body) return null;

  const time = MakeTime(date);
  const result = Equator(body, time, GEO_CENTER, true, true);
  return { ra: result.ra * HOUR2RAD, dec: result.dec * Math.PI / 180 };
}

function stringToBody(name: string): Body | null {
  const map: Record<string, Body> = {
    Mercury: Body.Mercury,
    Venus: Body.Venus,
    Mars: Body.Mars,
    Jupiter: Body.Jupiter,
    Saturn: Body.Saturn,
    Uranus: Body.Uranus,
    Neptune: Body.Neptune,
    Pluto: Body.Pluto,
  };
  return map[name] ?? null;
}

/**
 * Supported planetary bodies for rendering
 */
export const PLANET_BODIES = [
  { name: 'Mercury', color: '#b5b5b5' },
  { name: 'Venus', color: '#e6c87a' },
  { name: 'Mars', color: '#e07858' },
  { name: 'Jupiter', color: '#d4a574' },
  { name: 'Saturn', color: '#f0d9a0' },
  { name: 'Uranus', color: '#7fb8d4' },
  { name: 'Neptune', color: '#5b7fbf' },
];

export type PlanetName = typeof PLANET_BODIES[number]['name'];

/**
 * Check if a body name is a planet
 */
export function isPlanet(name: string): boolean {
  return PLANET_BODIES.some(p => p.name === name);
}
