import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Astronomy from 'astronomy-engine';
import * as THREE from 'three';
import { updateWorldMatrixForFrame } from '../src/components/scene/builders/frameWorldMatrix';
import { BoundedCache } from '../src/utils/boundedCache';
import { eclipticToEquatorial, equatorialToCartesian, equatorialToHorizontal, horizontalToCartesian } from '../src/utils/astronomy';
import { getMoonPhaseData, getMoonPosition, getPlanetPosition, getSunPosition, getSunPositions } from '../src/utils/ephemeris';
import { projectEquatorialCoordinate } from '../src/utils/skyProjection';
import { buildCelestialStarRenderData, buildCelestialConstellationLines, buildObserverStarRenderData, buildObserverConstellationLines } from '../src/utils/starField';
import { CATALOG, CONSTELLATIONS_BY_CULTURE, type Constellation, type StarData } from '../src/utils/stars';
import { buildAnnualSunEquatorialSamples } from '../src/components/scene/builders/sceneData';
import { buildEclipticSamples, buildSunDiurnalArcSamples } from '../src/utils/sunPaths';

function near(actual: number, expected: number, tolerance = 1e-10) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
}
function nearPoint(actual: number[], expected: number[]) {
  actual.forEach((coordinate, index) => near(coordinate, expected[index]));
}

await test('bounded cache evicts least-recently-used data without quantizing keys', () => {
  const cache = new BoundedCache<number, string>(2);
  cache.set(1, 'one'); cache.set(2, 'two');
  assert.equal(cache.get(1), 'one');
  cache.set(3, 'three');
  assert.equal(cache.get(2), undefined);
  assert.equal(cache.get(1), 'one');
  assert.equal(cache.get(1.001), undefined);
  cache.set(1, 'updated');
  assert.equal(cache.get(1), 'updated');
});

await test('exact-time ephemeris caches survive mutable Dates and do not expose mutable entries', () => {
  const date = new Date('2026-09-30T12:00:00Z');
  const functions = [getSunPosition, getMoonPosition, (d: Date) => getPlanetPosition('Mars', d)!];
  const reference = [Astronomy.Body.Sun, Astronomy.Body.Moon, Astronomy.Body.Mars];
  for (let i = 0; i < functions.length; i++) {
    const first = functions[i](date);
    const again = functions[i](new Date(date));
    assert.deepEqual(first, again);
    first.ra = -123;
    assert.deepEqual(functions[i](date), again);
    date.setTime(date.getTime() + 1);
    const expected = Astronomy.EquatorFromVector(reference[i] === Astronomy.Body.Moon
      ? Astronomy.GeoMoon(date) : Astronomy.GeoVector(reference[i], date, true));
    near(functions[i](date).ra, expected.ra * Astronomy.HOUR2RAD);
    near(functions[i](date).dec, expected.dec * Math.PI / 180);
  }
  const phase = getMoonPhaseData(date);
  const expectedPhase = { ...phase };
  phase.illuminatedFraction = -99;
  assert.deepEqual(getMoonPhaseData(date), expectedPhase);
  for (const invalid of ['unknown', 'toString', '__proto__']) assert.equal(getPlanetPosition(invalid, date), null);
  const samples = [date, new Date(date.getTime() + 86400000)];
  assert.deepEqual(getSunPositions(samples), samples.map(getSunPosition));
});

await test('direct projection preserves spherical results at both poles, zenith and zero radius', () => {
  for (const date of [new Date('2000-01-01T12:00:00Z'), new Date('2100-06-21T00:00:00Z')]) {
    for (const latitude of [-90, 0, 40, 90]) for (const longitude of [-180, 0, 180]) {
      for (const radius of [0, 1, 50]) for (const [ra, dec] of [[0, 0], [4.6, -1.1], [2, Math.PI / 2]]) {
        const actual = projectEquatorialCoordinate(ra, dec, latitude, longitude, date, radius);
        const expected = equatorialToHorizontal(ra, dec, latitude, longitude, date);
        nearPoint(actual.celestialPosition, equatorialToCartesian(ra, dec, radius));
        nearPoint(actual.observerPosition, horizontalToCartesian(expected.azimuth, expected.altitude, radius));
        near(actual.azimuth, expected.azimuth); near(actual.altitude, expected.altitude);
        assert.equal(actual.isVisible, expected.altitude >= 0);
      }
    }
  }
});

await test('cached ecliptic rotations still update for a mutated Date and preserve sample counts', () => {
  const date = new Date('2026-09-30T12:00:00Z');
  for (let day = 0; day < 3; day++) {
    date.setUTCDate(date.getUTCDate() + 1);
    for (const longitude of [0, 1, 2, 3]) {
      const time = Astronomy.MakeTime(date);
      const vector = new Astronomy.Vector(Math.cos(longitude), Math.sin(longitude), 0, time);
      const expected = Astronomy.EquatorFromVector(Astronomy.RotateVector(Astronomy.Rotation_ECT_EQJ(time), vector));
      const actual = eclipticToEquatorial(longitude, 0, date);
      near(actual.ra, expected.ra * Math.PI / 12); near(actual.dec, expected.dec * Math.PI / 180);
    }
  }
  assert.equal(buildEclipticSamples(date, 40, 116.4, 10, 180).length, 181);
  assert.equal(buildSunDiurnalArcSamples(date, 40, 116.4, 10, 145).length, 145);
  const annual = buildAnnualSunEquatorialSamples(2026);
  assert.equal(annual.length, 361);
  assert.equal(buildAnnualSunEquatorialSamples(2026), annual);
  for (let year = 2027; year < 2032; year++) buildAnnualSunEquatorialSamples(year);
  assert.notEqual(buildAnnualSunEquatorialSamples(2026), annual);
  assert.deepEqual(buildAnnualSunEquatorialSamples(2026), annual);
});

await test('same-length catalogs and same-ID constellations never collide in render caches', () => {
  const first: StarData[] = [{ ...CATALOG[0], names: { chineseAsterism: '甲' } }];
  const second: StarData[] = [{ ...CATALOG[0], names: { chineseAsterism: '乙' }, raHours: CATALOG[0].raHours + 1 }];
  const a = buildCelestialStarRenderData(first, 10, 1.04, 'chinese', 'zh-CN');
  const b = buildCelestialStarRenderData(second, 10, 1.04, 'chinese', 'zh-CN');
  assert.notDeepEqual(a[0].position, b[0].position);
  assert.notEqual(a[0].label, b[0].label);
  assert.equal(buildCelestialStarRenderData(first, 10, 1.04, 'chinese', 'zh-CN'), a);
  const source = CONSTELLATIONS_BY_CULTURE.chinese.find((item) => item.lines.length > 1)!;
  const original: Constellation[] = [{ ...source, lines: [source.lines[0]] }];
  const changed: Constellation[] = [{ ...source, lines: [source.lines[1]] }];
  const lineA = buildCelestialConstellationLines(original, CATALOG, 10);
  const lineB = buildCelestialConstellationLines(changed, CATALOG, 10);
  assert.equal(lineA.length, 1); assert.equal(lineB.length, 1);
  assert.notDeepEqual(lineA, lineB);
});

await test('observer star and line builders preserve every visible object and celestial geometry', () => {
  const date = new Date('2026-09-30T12:00:00Z');
  const celestial = buildCelestialStarRenderData(CATALOG, 50, 1.04, 'chinese', 'zh-CN');
  const before = JSON.stringify(celestial);
  for (const latitude of [-90, 0, 40, 90]) {
    const visible = buildObserverStarRenderData(CATALOG, latitude, 116.4, date, 50, 1.04, 'chinese', 'zh-CN');
    const expected = celestial.flatMap((star) => {
      const position = new THREE.Vector3(...star.position).normalize();
      const ra = Math.atan2(-position.z, position.x);
      const dec = Math.asin(position.y);
      const horizontal = equatorialToHorizontal(ra, dec, latitude, 116.4, date);
      return horizontal.altitude < 0 ? [] : [{ id: star.id, position: horizontalToCartesian(horizontal.azimuth, horizontal.altitude, 50) }];
    });
    assert.equal(visible.length, expected.length);
    visible.forEach((star, index) => {
      assert.equal(star.id, expected[index].id);
      nearPoint(star.position, expected[index].position);
    });
    const lines = buildObserverConstellationLines(CONSTELLATIONS_BY_CULTURE.chinese, CATALOG, latitude, 116.4, date, 50);
    assert.ok(lines.every((line) => line.points.every((point) => point.y >= 0)));
  }
  assert.equal(JSON.stringify(celestial), before);
});

await test('horizon readers share ancestors once per render frame without changing world transforms', () => {
  const root = new THREE.Group();
  const sky = new THREE.Group();
  const field = new THREE.Group();
  root.add(sky); sky.add(field);
  const leaves = Array.from({ length: 100 }, (_, i) => {
    const object = new THREE.Object3D();
    object.position.set(Math.sin(i), Math.cos(i), i * 0.01);
    field.add(object);
    return object;
  });
  let ancestorUpdates = 0;
  for (const parent of [root, sky, field]) {
    const original = parent.updateMatrix.bind(parent);
    parent.updateMatrix = () => { ancestorUpdates++; original(); };
  }
  for (let frame = 1; frame <= 20; frame++) {
    root.position.set(frame * 0.1, 1, -2);
    sky.rotation.set(frame * 0.04, frame * -0.01, 0.2);
    field.scale.set(1.15, 1.15, 1.15);
    const expected = leaves.map((leaf) => {
      leaf.updateWorldMatrix(true, false);
      return leaf.matrixWorld.clone();
    });
    ancestorUpdates = 0;
    leaves.forEach((leaf, index) => {
      updateWorldMatrixForFrame(leaf, frame);
      assert.deepEqual(leaf.matrixWorld.elements, expected[index].elements);
      // Billboard leaf rotation may change within a frame; it is never cached.
      leaf.rotateY(0.01);
      updateWorldMatrixForFrame(leaf, frame);
      const actual = leaf.matrixWorld.clone();
      leaf.updateMatrix();
      const reference = field.matrixWorld.clone().multiply(leaf.matrix);
      assert.deepEqual(actual.elements, reference.elements);
    });
    assert.equal(ancestorUpdates, 3, '100 sibling readers should update 3 shared ancestors, not 300');
  }
});
