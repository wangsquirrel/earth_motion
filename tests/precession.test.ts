import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildPolePath, dateAtEpochYear, getEpochBasis, isPrecessionDateSupported, withEpochYear } from '../src/utils/precession';
import { getObserverRotation, rotateCelestialToObserver } from '../src/utils/astronomy';
import { getSyncedSimTimeMs, getWallNow, useAppStore } from '../src/store/useAppStore';
import { buildCelestialToObserverQuaternion } from '../src/components/scene/builders/geometry';
import { getSunPosition } from '../src/utils/ephemeris';
import { equatorialToHorizontal } from '../src/utils/astronomy';

const near = (a: number, b: number, tolerance = 1e-10) => assert.ok(Math.abs(a-b) < tolerance, `${a} != ${b}`);

await test('epoch basis is orthonormal and epoch pole remains at observer latitude in every view', () => {
  for (const year of [1000, 1500, 2000, 2026, 3000]) {
    for (const hour of [0, 6, 12, 18]) {
      const date = dateAtEpochYear(year); date.setUTCHours(hour);
      const basis = getEpochBasis(date).map(v => new THREE.Vector3(...v));
      basis.forEach(v => near(v.length(), 1));
      near(basis[0].dot(basis[1]), 0);
      near(basis[0].clone().cross(basis[1]).distanceTo(basis[2]), 0);
      for (const lat of [-90, -40, 0, 40, 90]) for (const lon of [-180, 0, 116.4]) {
        const rotation = getObserverRotation(lat, lon, date);
        const pole = rotateCelestialToObserver(getEpochBasis(date)[1], rotation);
        near(pole[0], 0); near(pole[1], Math.sin(lat*Math.PI/180)); near(pole[2], -Math.cos(lat*Math.PI/180));
        const q = buildCelestialToObserverQuaternion(lat, lon, date);
        for (const vector of basis) {
          const observer = vector.clone().applyQuaternion(q);
          near(observer.distanceTo(new THREE.Vector3(...rotateCelestialToObserver(vector.toArray() as [number,number,number], rotation))), 0);
          near(observer.applyQuaternion(q.clone().invert()).distanceTo(vector), 0);
        }
      }
    }
  }
});

await test('dated pole path has explicit bounded endpoints and real movement', () => {
  const path = buildPolePath();
  assert.equal(path[0].year, 1000); assert.equal(path.at(-1)!.year, 3000);
  assert.ok(new THREE.Vector3(...path[0].point).distanceTo(new THREE.Vector3(...path.at(-1)!.point)) > 0.1);
  for (const year of [999, 3001]) assert.equal(isPrecessionDateSupported(dateAtEpochYear(year)), false);
  for (const year of [1000, 3000]) assert.equal(isPrecessionDateSupported(dateAtEpochYear(year)), true);
});

await test('era edits preserve clock playback and UTC time at every existing speed', () => {
  const saved = useAppStore.getState();
  try {
    for (const speed of [1, 3600, 86400, 604800]) {
      saved.setIsPlaying(true); saved.setTimeSpeed(speed);
      saved.setCurrentTime(new Date('2024-02-29T06:07:08Z'));
      saved.setCurrentTime(withEpochYear(new Date('2024-02-29T06:07:08Z'), 1500));
      const clock = useAppStore.getState().clock;
      assert.equal(clock.currentTime.toISOString(), '1500-02-28T06:07:08.000Z');
      assert.equal(clock.isPlaying, true); assert.equal(clock.timeSpeed, speed);
      near(getSyncedSimTimeMs(clock, clock.playbackStartWallTime! + 1000) - clock.playbackStartSimTimeMs!, speed * 1000, 0.01);
      assert.ok(getSyncedSimTimeMs(clock, getWallNow()) >= clock.currentTime.getTime());
    }
  } finally { useAppStore.setState(saved, true); }
});

await test('Sun continues to rise and set daily throughout supported epochs', () => {
  for (const year of [1000, 1500, 2000, 3000]) {
    const altitudes = Array.from({ length: 25 }, (_, hour) => {
      const date = dateAtEpochYear(year); date.setUTCMonth(2, 21); date.setUTCHours(hour);
      const sun = getSunPosition(date);
      return equatorialToHorizontal(sun.ra, sun.dec, 40, 0, date).altitude;
    });
    assert.ok(Math.max(...altitudes) > 0.3); assert.ok(Math.min(...altitudes) < -0.3);
    assert.ok(altitudes.some((v,i) => i && v > 0 && altitudes[i-1] <= 0));
    assert.ok(altitudes.some((v,i) => i && v < 0 && altitudes[i-1] >= 0));
  }
});
