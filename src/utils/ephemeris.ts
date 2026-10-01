/**
 * High-precision astronomical calculations using astronomy-engine
 * Replaces simplified formulas in astronomy.ts for Sun, Moon, and planets
 */

import {
  Body,
  EquatorFromVector,
  GeoMoon,
  GeoVector,
  HOUR2RAD,
  Illumination,
  MakeTime,
  MoonPhase,
} from 'astronomy-engine';

import { BoundedCache } from './boundedCache';

type EquatorialPosition = { ra: number; dec: number };
// Exact millisecond keys share computations between bodies, markers and observer edits.
// Bounds prevent playback or long date scrubbing from growing memory indefinitely.
const sunCache = new BoundedCache<number, EquatorialPosition>(32);
const moonCache = new BoundedCache<number, EquatorialPosition>(8);
const phaseCache = new BoundedCache<number, MoonPhaseData>(8);
const planetCaches = new Map<Body, BoundedCache<number, EquatorialPosition>>();
const BODY_BY_NAME: Readonly<Record<string, Body>> = {
  Mercury: Body.Mercury, Venus: Body.Venus, Mars: Body.Mars, Jupiter: Body.Jupiter,
  Saturn: Body.Saturn, Uranus: Body.Uranus, Neptune: Body.Neptune, Pluto: Body.Pluto,
};

// All bodies share the star catalog's geocentric J2000 frame.
// GeoVector provides the actual Earth-center origin; Observer(0, 0, 0) does not.

/**
 * Get high-precision Sun equatorial coordinates
 * Returns { ra, dec } in radians
 */
export function getSunPosition(date: Date): { ra: number; dec: number } {
  const timestamp = date.getTime();
  let position = sunCache.get(timestamp);
  if (!position) {
    position = getSunPositionUncached(date);
    sunCache.set(timestamp, position);
  }
  return { ...position };
}

/** Exact single sample for one-off paths; do not pollute the live-body cache. */
export function getSunPositionUncached(date: Date): EquatorialPosition {
  const result = EquatorFromVector(GeoVector(Body.Sun, MakeTime(date), true));
  return { ra: result.ra * HOUR2RAD, dec: result.dec * Math.PI / 180 };
}

/** One-off path samples bypass the live-body cache rather than evicting its entries. */
export function getSunPositions(dates: readonly Date[]): EquatorialPosition[] {
  return dates.map(getSunPositionUncached);
}

/**
 * Get high-precision Moon equatorial coordinates
 * Returns { ra, dec } in radians
 */
export function getMoonPosition(date: Date): { ra: number; dec: number } {
  const timestamp = date.getTime();
  let position = moonCache.get(timestamp);
  if (!position) {
    const result = EquatorFromVector(GeoMoon(MakeTime(date)));
    position = { ra: result.ra * HOUR2RAD, dec: result.dec * Math.PI / 180 };
    moonCache.set(timestamp, position);
  }
  return { ...position };
}

export interface MoonPhaseData {
  illuminatedFraction: number;
  waxing: boolean;
}

export function getMoonPhaseData(date: Date): MoonPhaseData {
  const timestamp = date.getTime();
  let data = phaseCache.get(timestamp);
  if (!data) {
    const illumination = Illumination(Body.Moon, date);
    const phase = MoonPhase(date);
    data = {
      illuminatedFraction: Math.max(0, Math.min(1, illumination.phase_fraction)),
      waxing: phase < 180,
    };
    phaseCache.set(timestamp, data);
  }
  return { ...data };
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

  let cache = planetCaches.get(body);
  if (!cache) {
    cache = new BoundedCache<number, EquatorialPosition>(8);
    planetCaches.set(body, cache);
  }
  const timestamp = date.getTime();
  let position = cache.get(timestamp);
  if (!position) {
    const result = EquatorFromVector(GeoVector(body, MakeTime(date), true));
    position = { ra: result.ra * HOUR2RAD, dec: result.dec * Math.PI / 180 };
    cache.set(timestamp, position);
  }
  return { ...position };
}

function stringToBody(name: string): Body | null {
  return Object.prototype.hasOwnProperty.call(BODY_BY_NAME, name) ? BODY_BY_NAME[name] : null;
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
