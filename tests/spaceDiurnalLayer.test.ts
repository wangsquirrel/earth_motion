import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement, Profiler } from 'react';
import { act, createRoot, extend, _roots } from '@react-three/fiber';
import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib';
import SpaceDiurnalLayer, { SpaceDiurnalObjects } from '../src/components/scene/layers/SpaceDiurnalLayer';
import { buildDiurnalLayerData } from '../src/components/scene/builders/sceneData';
import { DIURNAL_SAMPLE_COUNT, SPHERE_RADIUS } from '../src/components/scene/SpaceView.constants';
import { getSunPosition } from '../src/utils/ephemeris';
import { projectEquatorialCoordinate } from '../src/utils/skyProjection';
import { useAppStore } from '../src/store/useAppStore';

const HOUR_MS = 3600000;

function referenceLine(points: THREE.Vector3[], visible: boolean) {
  // The installed Drei Line constructs these exact stdlib objects, flattens its
  // points through LineGeometry.setPositions, then calls computeLineDistances.
  const geometry = new LineGeometry();
  geometry.setPositions(points.flatMap((point) => point.toArray()));
  const material = new LineMaterial({
    linewidth: visible ? 1.5 : 0.9,
    transparent: true,
    opacity: visible ? 0.5 : 0.14,
    dashed: true,
    dashSize: visible ? 0.4 : 0.28,
    gapSize: visible ? 0.28 : 0.34,
    resolution: new THREE.Vector2(1280, 720),
  });
  material.color.set(visible ? '#b9c8d8' : '#607186');
  return new Line2(geometry, material).computeLineDistances();
}

function assertLineMatchesDrei(actual: Line2, points: THREE.Vector3[], visible: boolean) {
  const expected = referenceLine(points, visible);
  assert.equal(actual.visible, true);
  assert.equal(actual.geometry.instanceCount, points.length - 1, 'render exactly the original edges, including caps');
  for (const name of ['instanceStart', 'instanceEnd', 'instanceDistanceStart', 'instanceDistanceEnd']) {
    const expectedAttribute = expected.geometry.getAttribute(name);
    const actualAttribute = actual.geometry.getAttribute(name);
    for (let index = 0; index < expectedAttribute.count; index++) {
      for (let component = 0; component < expectedAttribute.itemSize; component++) {
        assert.equal(actualAttribute.getComponent(index, component), expectedAttribute.getComponent(index, component),
          `${name}[${index}, ${component}] must match Drei bit for bit`);
      }
    }
  }
  assert.equal(actual.geometry.getAttribute('instanceDistanceStart').getX(0), 0, 'each split segment restarts its dash');
  assert.deepEqual(actual.geometry.boundingBox, expected.geometry.boundingBox, 'padding must not alter bounds');
  assert.deepEqual(actual.geometry.boundingSphere, expected.geometry.boundingSphere, 'padding must not alter sorting/culling');
  assert.deepEqual(actual.material.color, expected.material.color);
  assert.deepEqual(actual.material.defines, expected.material.defines);
  for (const property of ['linewidth', 'opacity', 'transparent', 'dashScale', 'dashSize', 'gapSize', 'dashOffset',
    'worldUnits', 'depthTest', 'depthWrite', 'toneMapped', 'alphaToCoverage'] as const) {
    assert.equal(actual.material[property], expected.material[property], property);
  }
  expected.geometry.dispose();
  expected.material.dispose();
}

function assertFrameMatchesDrei(objects: Pick<SpaceDiurnalObjects, 'hiddenLines' | 'visibleLines' | 'markers'>,
  date: Date, latitude: number, longitude: number) {
  const path = buildDiurnalLayerData(date, latitude, longitude);
  for (const visible of [false, true]) {
    const pool = visible ? objects.visibleLines : objects.hiddenLines;
    const segments = visible ? path.visibleSegments : path.hiddenSegments;
    assert.equal(pool.filter((line) => line.visible).length, segments.length);
    segments.forEach((segment, index) => assertLineMatchesDrei(pool[index], segment, visible));
    assert.ok(pool.slice(segments.length).every((line) => !line.visible), 'obsolete split segments must disappear immediately');
  }
  assert.equal(objects.markers.length, 7);
  [-9, -6, -3, 0, 3, 6, 9].forEach((hours, index) => {
    const sampleDate = new Date(date.getTime() + hours * HOUR_MS);
    const sun = getSunPosition(sampleDate);
    const expected = projectEquatorialCoordinate(sun.ra, sun.dec, latitude, longitude, sampleDate, SPHERE_RADIUS);
    const marker = objects.markers[index];
    assert.deepEqual(marker.position.toArray(), expected.observerPosition);
    assert.equal(marker.visible, expected.isVisible);
    assert.equal(marker.geometry.parameters.radius, 0.055);
    assert.equal(marker.geometry.parameters.widthSegments, 10);
    assert.equal(marker.geometry.parameters.heightSegments, 10);
    assert.equal(marker.material.color.getHexString(), 'd8e5f2');
    assert.equal(marker.material.opacity, 0.45);
    assert.equal(marker.material.transparent, true);
  });
}

await test('all 145 diurnal samples, split horizons and dash origins match Drei across seasons and poles', () => {
  assert.equal(DIURNAL_SAMPLE_COUNT, 145);
  const objects = new SpaceDiurnalObjects(1280, 720);
  try {
    for (const dateString of ['2026-03-20T12:00:00.123Z', '2026-06-21T00:00:00.987Z',
      '2026-09-23T06:00:00.456Z', '2026-12-21T18:00:00.789Z']) {
      for (const [latitude, longitude] of [[-90, -179.9], [-66.56, 116.4], [0, 0], [40, 116.4], [66.56, -74], [90, 179.9]]) {
        const date = new Date(dateString);
        assert.equal(objects.update(date, latitude, longitude, true), true);
        assertFrameMatchesDrei(objects, date, latitude, longitude);
      }
    }
  } finally {
    objects.dispose();
  }
});

// Real React/R3F lifecycle and frame callbacks with a stub renderer. GPU/browser
// pixels are deliberately not inferred from this integration regression.
await test('mounted diurnal layer commits no React updates while every frame follows the exact mutable Date', async () => {
  const original = useAppStore.getState();
  const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const oldAct = globals.IS_REACT_ACT_ENVIRONMENT;
  const oldRaf = globals.requestAnimationFrame;
  const oldCancel = globals.cancelAnimationFrame;
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  globals.requestAnimationFrame = () => 0;
  globals.cancelAnimationFrame = () => {};
  extend(THREE);
  const canvas = { width: 1280, height: 720, addEventListener() {}, removeEventListener() {} } as unknown as HTMLCanvasElement;
  const renderer = {
    domElement: canvas, render() {}, setSize() {}, setPixelRatio() {},
    xr: { isPresenting: false, addEventListener() {}, removeEventListener() {} },
    shadowMap: {}, forceContextLoss() {}, renderLists: { dispose() {} },
  };
  const root = createRoot(canvas);
  const initialTime = Date.parse('2026-10-01T12:00:00Z');
  const dateRef = { current: new Date(initialTime) };
  let commits = 0;
  try {
    useAppStore.setState({ observer: { latitude: 40, longitude: 116.4 },
      display: { ...original.display, showDiurnalArc: true } });
    root.configure({ gl: renderer, size: { width: 1280, height: 720, top: 0, left: 0 }, frameloop: 'never', dpr: 1 });
    const layer = () => createElement(Profiler, { id: 'diurnal', onRender: () => { commits++; } },
      createElement(SpaceDiurnalLayer, { simDateRef: dateRef }));
    await act(async () => { root.render(layer()); });
    const state = _roots.get(canvas)!.store.getState();
    const objects = () => {
      const group = state.scene.children[0];
      return {
        hiddenLines: group.children[0].children as Line2[],
        visibleLines: group.children[1].children as Line2[],
        markers: group.children.slice(2) as SpaceDiurnalObjects['markers'],
      };
    };
    assertFrameMatchesDrei(objects(), dateRef.current, 40, 116.4);
    let frame = 0;
    for (const speed of [1, 3600, 86400, 604800]) {
      useAppStore.setState({ clock: { ...useAppStore.getState().clock, timeSpeed: speed } });
      const before = commits;
      for (let sample = 1; sample <= 12; sample++) {
        dateRef.current.setTime(initialTime + sample * speed * 1000 / 60);
        await act(async () => { state.advance(++frame / 60, false); });
        assertFrameMatchesDrei(objects(), dateRef.current, 40, 116.4);
      }
      assert.equal(commits, before, 'exact path and marker motion must never call React setState');
    }
    useAppStore.setState({ observer: { latitude: -33.86, longitude: 151.21 },
      clock: { ...useAppStore.getState().clock, isPlaying: false } });
    await act(async () => { state.advance(++frame / 60, false); });
    assertFrameMatchesDrei(objects(), dateRef.current, -33.86, 151.21);

    useAppStore.setState({ display: { ...useAppStore.getState().display, showDiurnalArc: false } });
    await act(async () => { state.advance(++frame / 60, false); });
    assert.equal(state.scene.children[0].visible, false);
    await act(async () => { root.render(null); });
    dateRef.current.setTime(initialTime - 123456789);
    useAppStore.setState({ display: { ...useAppStore.getState().display, showDiurnalArc: true } });
    await act(async () => { root.render(layer()); });
    assertFrameMatchesDrei(objects(), dateRef.current, -33.86, 151.21);
  } finally {
    await act(async () => { root.unmount(); });
    useAppStore.setState(original, true);
    if (oldAct === undefined) delete globals.IS_REACT_ACT_ENVIRONMENT; else globals.IS_REACT_ACT_ENVIRONMENT = oldAct;
    if (oldRaf === undefined) Reflect.deleteProperty(globals, 'requestAnimationFrame'); else globals.requestAnimationFrame = oldRaf;
    if (oldCancel === undefined) Reflect.deleteProperty(globals, 'cancelAnimationFrame'); else globals.cancelAnimationFrame = oldCancel;
  }
});

await test('every playback speed uses the same exact-frame path and markers with stable GPU buffers', () => {
  for (const speed of [1, 3600, 86400, 604800]) {
    const objects = new SpaceDiurnalObjects(1280, 720);
    const initialTime = Date.parse('2026-10-01T12:00:00.000Z');
    const date = new Date(initialTime);
    const allocated = new Map<Line2, unknown[]>();
    try {
      for (const wallTime of [0, 1, 17, 33, 50, 67, 84, 101]) {
        date.setTime(initialTime + wallTime * speed);
        assert.equal(objects.update(date, 40, 116.4, true), true, `speed=${speed}, wallTime=${wallTime}`);
        assertFrameMatchesDrei(objects, date, 40, 116.4);
        for (const line of [...objects.hiddenLines, ...objects.visibleLines]) {
          const resources = [line.geometry, line.material, line.geometry.getAttribute('instanceStart'),
            line.geometry.getAttribute('instanceEnd'), line.geometry.getAttribute('instanceDistanceStart'),
            line.geometry.getAttribute('instanceDistanceEnd')];
          const previous = allocated.get(line);
          if (previous) resources.forEach((resource, index) => assert.equal(resource, previous[index]));
          else allocated.set(line, resources);
        }
      }
    } finally {
      objects.dispose();
    }
  }
});

await test('paused input, reverse jumps, hidden/remounted state and first resize are immediately correct', () => {
  const objects = new SpaceDiurnalObjects(0, 0);
  try {
    assert.equal(objects.update(new Date(NaN), 40, 0, false), false);
    assert.equal(objects.hiddenLines.length + objects.visibleLines.length + objects.markers.length, 0, 'hidden initialization never solves');
    objects.setResolution(1280, 720);
    const date = new Date('2026-10-01T12:00:00Z');
    assert.equal(objects.update(date, 40, 0, true), true);
    assertFrameMatchesDrei(objects, date, 40, 0);
    for (const line of [...objects.hiddenLines, ...objects.visibleLines]) {
      assert.deepEqual(line.material.resolution.toArray(), [1280, 720]);
    }
    const versions = objects.visibleLines.map((line) =>
      (line.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute).data.version);
    assert.equal(objects.update(date, 40, 0, true), false, 'paused camera-only frames reuse exact data');
    assert.deepEqual(objects.visibleLines.map((line) =>
      (line.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute).data.version), versions);
    // Same exact time, new city: update path and all markers together.
    assert.equal(objects.update(date, -33.86, 151.21, true), true);
    assertFrameMatchesDrei(objects, date, -33.86, 151.21);
    date.setTime(date.getTime() - 1);
    assert.equal(objects.update(date, -33.86, 151.21, true), true);
    assertFrameMatchesDrei(objects, date, -33.86, 151.21);
    const lines = [...objects.hiddenLines, ...objects.visibleLines];
    const beforeHidden = lines.map((line) =>
      (line.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute).data.version);
    date.setTime(date.getTime() + 86400000);
    assert.equal(objects.update(date, 90, -179.9, false), false);
    assert.equal(objects.group.visible, false);
    assert.deepEqual(lines.map((line) =>
      (line.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute).data.version), beforeHidden);
    assert.equal(objects.update(date, 90, -179.9, true), true);
    assertFrameMatchesDrei(objects, date, 90, -179.9);
    objects.setResolution(390, 844);
    for (const line of [...objects.hiddenLines, ...objects.visibleLines]) {
      assert.deepEqual(line.material.resolution.toArray(), [390, 844]);
      const renderer = { getViewport: (target: THREE.Vector4) => target.set(0, 0, 800, 600) } as THREE.WebGLRenderer;
      line.onBeforeRender(renderer, new THREE.Scene(), new THREE.PerspectiveCamera(), line.geometry, line.material, null);
      assert.deepEqual(line.material.resolution.toArray(), [800, 600], 'retain native Line2 viewport synchronization');
    }
  } finally {
    objects.dispose();
  }
});
