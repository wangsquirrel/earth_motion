import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Astronomy from 'astronomy-engine';
import * as THREE from 'three';
import { equatorialToCartesian, equatorialToHorizontal, horizontalToCartesian } from '../src/utils/astronomy';
import { getMoonPosition, getPlanetPosition, getSunPosition } from '../src/utils/ephemeris';
import { buildCelestialToObserverQuaternion, buildObserverFrameQuaternion } from '../src/components/scene/builders/geometry';
import { buildBodyRenderData, buildProjectedSceneBodies } from '../src/components/scene/builders/sceneData';

const DEG = Math.PI / 180;
const dates = ['2000-01-01T12:00:00Z', '2026-09-10T12:00:00Z', '2100-06-21T00:00:00Z'].map((s) => new Date(s));
function near(actual: number, expected: number, tolerance = 1e-10) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);
}

await test('J2000 projection matches reference horizons, including both geographic poles', () => {
  for (const date of dates) for (const latitude of [-90, -89.999, -40, 0, 40, 89.999, 90]) {
    for (const longitude of [-180, 0, 116.4074, 180]) for (const [ra, dec] of [[0, 0], [1.8849555921538756, 0.3], [4.7, -1.1], [2.1, Math.PI / 2]]) {
      const observer = new Astronomy.Observer(latitude, longitude, 0);
      const vector = new Astronomy.Vector(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec), Astronomy.MakeTime(date));
      const ofDate = Astronomy.EquatorFromVector(Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(date), vector));
      const expected = Astronomy.Horizon(date, observer, ofDate.ra, ofDate.dec);
      const actual = equatorialToHorizontal(ra, dec, latitude, longitude, date);
      near(actual.altitude, expected.altitude * DEG);
      const actualPoint = new THREE.Vector3(...horizontalToCartesian(actual.azimuth, actual.altitude, 1));
      const expectedPoint = new THREE.Vector3(...horizontalToCartesian(expected.azimuth * DEG, expected.altitude * DEG, 1));
      near(actualPoint.distanceTo(expectedPoint), 0);
      const rotated = new THREE.Vector3(...equatorialToCartesian(ra, dec, 1)).applyQuaternion(buildCelestialToObserverQuaternion(latitude, longitude, date));
      near(actualPoint.distanceTo(rotated), 0);
    }
  }
});

await test('zenith/nadir stay finite and frame changes round trip without moving an object', () => {
  for (const date of dates) for (const latitude of [-90, 0, 40, 90]) {
    const forward = buildCelestialToObserverQuaternion(latitude, 116.4, date);
    const inverse = buildObserverFrameQuaternion(latitude, 116.4, date);
    for (const y of [-1, 1]) {
      const j2000 = new THREE.Vector3(0, y, 0).applyQuaternion(inverse);
      const ra = (Math.atan2(-j2000.z, j2000.x) + 2 * Math.PI) % (2 * Math.PI);
      const dec = Math.asin(THREE.MathUtils.clamp(j2000.y, -1, 1));
      const horizontal = equatorialToHorizontal(ra, dec, latitude, 116.4, date);
      near(horizontal.altitude, y * Math.PI / 2, 1e-7);
      assert.ok(Number.isFinite(horizontal.azimuth));
      near(j2000.clone().applyQuaternion(forward).distanceTo(new THREE.Vector3(0, y, 0)), 0);
    }
  }
});

await test('Sun, Moon and planets share geocentric J2000, not a zero-latitude surface observer', () => {
  for (const date of dates) {
    const cases = [
      [getSunPosition(date), Astronomy.GeoVector(Astronomy.Body.Sun, date, true)],
      [getMoonPosition(date), Astronomy.GeoMoon(date)],
      [getPlanetPosition('Mars', date)!, Astronomy.GeoVector(Astronomy.Body.Mars, date, true)],
    ] as const;
    for (const [actual, vector] of cases) {
      const expected = Astronomy.EquatorFromVector(vector);
      near(actual.ra, expected.ra * Math.PI / 12);
      near(actual.dec, expected.dec * DEG);
    }
  }
});

await test('hidden bodies are excluded while both reference frames keep the same sun direction', () => {
  const observer = { latitude: 90, longitude: 0 };
  const currentTime = dates[1];
  const source = buildProjectedSceneBodies({ currentTime, ...observer, isCelestialFrame: false, showMoon: false, showPlanets: false });
  assert.equal(source.moon, null);
  assert.deepEqual(source.planets, []);
  const display = buildBodyRenderData({ projectedBodies: source, isCelestialFrame: false, showMoon: false, showPlanets: false });
  assert.equal(display.moon.isVisible, false);
  const celestial = buildProjectedSceneBodies({ currentTime, ...observer, isCelestialFrame: true, showMoon: false, showPlanets: false });
  const expected = new THREE.Vector3(...celestial.sun.activePosition).applyQuaternion(buildCelestialToObserverQuaternion(observer.latitude, observer.longitude, currentTime));
  near(expected.distanceTo(new THREE.Vector3(...source.sun.activePosition)), 0);
});
