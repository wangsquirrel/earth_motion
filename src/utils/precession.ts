import { MakeTime, RotateVector, Rotation_EQD_EQJ, Vector } from 'astronomy-engine';

// A deliberately bounded educational window for the same P03 precession/nutation
// transform already used by EQJ_HOR. This is not a long-term 26,000-year model.
export const PRECESSION_MIN_YEAR = 1000;
export const PRECESSION_MAX_YEAR = 3000;
export type ScenePoint = [number, number, number];

export function isPrecessionDateSupported(date: Date) {
  const year = date.getUTCFullYear();
  return Number.isFinite(date.getTime()) && year >= PRECESSION_MIN_YEAR && year <= PRECESSION_MAX_YEAR;
}

/** Columns of the true equator/equinox-of-date basis in scene J2000 coordinates. */
export function getEpochBasis(date: Date): [ScenePoint, ScenePoint, ScenePoint] {
  const time = MakeTime(date);
  const rotation = Rotation_EQD_EQJ(time);
  const scene = (x: number, y: number, z: number): ScenePoint => {
    const v = RotateVector(rotation, new Vector(x, y, z, time));
    return [v.x, v.z, -v.y];
  };
  return [scene(1, 0, 0), scene(0, 0, 1), scene(0, -1, 0)];
}

export function dateAtEpochYear(year: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, 0, 1);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

/** Edit the shared clock's year, preserving UTC month/day/time (clamp leap day). */
export function withEpochYear(date: Date, year: number) {
  const result = new Date(date);
  const month = result.getUTCMonth();
  result.setUTCFullYear(year);
  if (result.getUTCMonth() !== month) result.setUTCDate(0);
  return result;
}

export function buildPolePath() {
  return Array.from({ length: 101 }, (_, i) => {
    const year = PRECESSION_MIN_YEAR + i * 20;
    return { year, point: getEpochBasis(dateAtEpochYear(year))[1] };
  });
}
