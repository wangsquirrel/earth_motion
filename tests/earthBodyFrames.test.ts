import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createElement, Profiler } from 'react';
import { createRoot, extend, act, _roots } from '@react-three/fiber';
import * as THREE from 'three';
import { createServer } from 'vite';
import MoonPhaseDisc from '../src/components/scene/MoonPhaseDisc';
import type { MoonPhaseData } from '../src/utils/ephemeris';

// Exercise real React reconciliation, Three objects, subscriptions and frame order.
// Rendering is stubbed; these tests do not claim WebGL or pixel coverage.
function createFrameHarness() {
  const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = globals.IS_REACT_ACT_ENVIRONMENT;
  const previousRequestFrame = globals.requestAnimationFrame;
  const previousCancelFrame = globals.cancelAnimationFrame;
  const queuedFrames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  globals.requestAnimationFrame = (callback) => {
    queuedFrames.set(++nextFrameId, callback);
    return nextFrameId;
  };
  globals.cancelAnimationFrame = (id) => { queuedFrames.delete(id); };
  extend(THREE);
  const canvas = {
    width: 800, height: 600, addEventListener() {}, removeEventListener() {},
  } as unknown as HTMLCanvasElement;
  const root = createRoot(canvas);
  root.configure({
    gl: {
      domElement: canvas, render() {}, setSize() {}, setPixelRatio() {},
      xr: { isPresenting: false, addEventListener() {}, removeEventListener() {} },
      shadowMap: {}, forceContextLoss() {}, renderLists: { dispose() {} },
    },
    size: { width: 800, height: 600, top: 0, left: 0 }, frameloop: 'demand', dpr: 1,
  });
  return {
    root,
    state: () => _roots.get(canvas)!.store.getState(),
    drain() {
      let frames = 0;
      while (queuedFrames.size && frames++ < 20) {
        const callbacks = [...queuedFrames.values()];
        queuedFrames.clear();
        for (const callback of callbacks) callback(performance.now());
      }
      assert.ok(frames < 20, 'paused scene should settle back to idle');
      assert.equal(_roots.get(canvas)!.store.getState().internal.frames, 0);
    },
    async close() {
      await act(async () => { root.unmount(); });
      if (previousActEnvironment === undefined) delete globals.IS_REACT_ACT_ENVIRONMENT;
      else globals.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      if (previousRequestFrame === undefined) Reflect.deleteProperty(globals, 'requestAnimationFrame');
      else globals.requestAnimationFrame = previousRequestFrame;
      if (previousCancelFrame === undefined) Reflect.deleteProperty(globals, 'cancelAnimationFrame');
      else globals.cancelAnimationFrame = previousCancelFrame;
    },
  };
}

function phaseMaterial(scene: THREE.Scene) {
  let material: THREE.ShaderMaterial | undefined;
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) material = object.material;
  });
  assert.ok(material, 'moon phase material should be mounted');
  return material;
}

function assertPhase(material: THREE.ShaderMaterial, phase: MoonPhaseData) {
  const z = 2 * THREE.MathUtils.clamp(phase.illuminatedFraction, 0, 1) - 1;
  assert.deepEqual(material.uniforms.uLight.value.toArray(), [
    Math.sqrt(Math.max(0, 1 - z * z)) * (phase.waxing ? 1 : -1), z,
  ]);
}

await test('Earth bodies and moon phase use every frame at every speed without React commits', async (t) => {
  // Count calls at the module boundary, including work whose output is hidden.
  // The wrapped functions still run the real ephemeris implementation.
  const virtualId = 'virtual:earth-ephemeris-calls';
  const server = await createServer({
    configFile: false, appType: 'custom', logLevel: 'error',
    // Attach HMR to an unlistened server so the nested transformer opens no port.
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    plugins: [{
      name: 'count-earth-ephemeris-calls',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === virtualId || (/\/utils\/ephemeris(?:\.ts)?$/.test(source) && importer?.endsWith('/EarthView.tsx'))) return `\0${virtualId}`;
      },
      load(id) {
        if (id !== `\0${virtualId}`) return;
        return `
          import * as actual from '/src/utils/ephemeris.ts';
          export * from '/src/utils/ephemeris.ts';
          export const calls = { sun: 0, moon: 0, phase: 0, planets: 0 };
          export function getSunPosition(...args) { calls.sun++; return actual.getSunPosition(...args); }
          export function getMoonPosition(...args) { calls.moon++; return actual.getMoonPosition(...args); }
          export function getMoonPhaseData(...args) { calls.phase++; return actual.getMoonPhaseData(...args); }
          export function getPlanetPosition(...args) { calls.planets++; return actual.getPlanetPosition(...args); }
        `;
      },
    }],
  });
  const harness = createFrameHarness();
  let wallNow = 1000;
  t.mock.method(performance, 'now', () => wallNow);
  try {
    const { EarthDynamicBodiesLayer } = await server.ssrLoadModule('/src/components/scene/EarthView.tsx') as typeof import('../src/components/scene/EarthView');
    const { useAppStore, getSyncedSimTimeMs } = await server.ssrLoadModule('/src/store/useAppStore.ts') as typeof import('../src/store/useAppStore');
    const { useSimulationTime } = await server.ssrLoadModule('/src/hooks/useSimulationTime.ts') as typeof import('../src/hooks/useSimulationTime');
    const ephemeris = await server.ssrLoadModule('/src/utils/ephemeris.ts') as typeof import('../src/utils/ephemeris');
    const { projectEquatorialCoordinate } = await server.ssrLoadModule('/src/utils/skyProjection.ts') as typeof import('../src/utils/skyProjection');
    const { calls } = await server.ssrLoadModule(virtualId) as { calls: { sun: number; moon: number; phase: number; planets: number } };
    const actions = useAppStore.getState();
    actions.setIsPlaying(false);
    actions.setCurrentTime(new Date('2026-10-01T08:00:00Z'));
    actions.setObserverLocation(40, 116.4);
    let commits = 0;
    function Scene() {
      const { simDateRef } = useSimulationTime();
      const { showMoon, showPlanets } = useAppStore((state) => state.display);
      return createElement(EarthDynamicBodiesLayer, {
        simDateRef, showMoon, showPlanets, language: 'zh-CN', spriteTexture: null, showLabels: false,
      });
    }
    await act(async () => {
      harness.root.render(createElement(Profiler, { id: 'earth-bodies', onRender: () => { commits++; } }, createElement(Scene)));
    });
    const state = harness.state();
    function assertCurrentBodies(checkPhase = true) {
      const { clock, observer, display } = useAppStore.getState();
      const date = new Date(getSyncedSimTimeMs(clock, wallNow));
      const expected = [ephemeris.getSunPosition(date)];
      if (display.showMoon) expected.push(ephemeris.getMoonPosition(date));
      if (display.showPlanets) expected.push(...ephemeris.PLANET_BODIES.map((planet) => ephemeris.getPlanetPosition(planet.name, date)!));
      assert.equal(state.scene.children.length, expected.length);
      expected.forEach((body, index) => {
        const projection = projectEquatorialCoordinate(body.ra, body.dec, observer.latitude, observer.longitude, date, 45);
        assert.deepEqual(state.scene.children[index].position.toArray(), projection.observerPosition);
        assert.equal(state.scene.children[index].visible, projection.isVisible);
      });
      if (display.showMoon && checkPhase) assertPhase(phaseMaterial(state.scene), ephemeris.getMoonPhaseData(date));
    }
    // Layout sync supplies correct positions even before the first demand frame.
    assertCurrentBodies(false);
    harness.drain();
    assertCurrentBodies();
    const material = phaseMaterial(state.scene);

    for (const speed of [1, 3600, 86400, 604800]) {
      await act(async () => { actions.setIsPlaying(true); actions.setTimeSpeed(speed); });
      const beforeCommits = commits;
      for (let frame = 0; frame < 4; frame++) {
        const before = { ...calls };
        wallNow += 1; // Deliberately less than the old 16ms wall-clock interval.
        await act(async () => { state.advance(wallNow, false); });
        assertCurrentBodies();
        assert.deepEqual(calls, {
          sun: before.sun + 1, moon: before.moon + 1, phase: before.phase + 1,
          planets: before.planets + ephemeris.PLANET_BODIES.length,
        });
        assert.equal(phaseMaterial(state.scene), material);
      }
      assert.equal(commits, beforeCommits, 'frame changes should mutate Three objects and uniforms only');
    }

    await act(async () => { actions.setIsPlaying(false); });
    harness.drain();
    const inputs = [
      () => actions.setCurrentTime(new Date('2027-02-14T23:59:45Z')),
      () => actions.setCurrentTime(new Date()), // Same action as the Now control.
      () => actions.stepCurrentTime(3600000),
      () => actions.setLongitude(-73.9),
      () => actions.setObserverLocation(-33.8688, 151.2093),
    ];
    for (const input of inputs) {
      await act(async () => { input(); });
      assertCurrentBodies(false);
      assert.ok(state.internal.frames > 0, 'paused input must schedule a render');
      await act(async () => { state.advance(wallNow, false); });
      assertCurrentBodies();
      harness.drain();
    }

    await act(async () => { actions.setShowMoon(false); actions.setShowPlanets(false); });
    const hiddenCalls = { ...calls };
    await act(async () => { actions.stepCurrentTime(86400000); actions.setObserverLocation(90, 0); });
    harness.drain();
    assertCurrentBodies();
    assert.equal(calls.moon, hiddenCalls.moon);
    assert.equal(calls.phase, hiddenCalls.phase);
    assert.equal(calls.planets, hiddenCalls.planets);
    assert.ok(calls.sun > hiddenCalls.sun);

    await act(async () => { actions.setIsPlaying(true); });
    for (let frame = 0; frame < 4; frame++) {
      wallNow += 1;
      await act(async () => { state.advance(wallNow, false); });
      assertCurrentBodies();
    }
    assert.equal(calls.moon, hiddenCalls.moon);
    assert.equal(calls.phase, hiddenCalls.phase);
    assert.equal(calls.planets, hiddenCalls.planets);
    await act(async () => { actions.setIsPlaying(false); });

    await act(async () => { actions.setShowMoon(true); actions.setShowPlanets(true); });
    assertCurrentBodies(false);
    await act(async () => { state.advance(wallNow, false); });
    assertCurrentBodies();
    harness.drain();
  } finally {
    await harness.close();
    await server.close();
  }
});

await test('MoonPhaseDisc keeps its material across legacy props and live phase refs', async () => {
  const harness = createFrameHarness();
  try {
    const props = { position: [0, 0, 0] as [number, number, number], size: 1.45 };
    const first = { illuminatedFraction: 0.2, waxing: true };
    await act(async () => { harness.root.render(createElement(MoonPhaseDisc, { ...props, ...first })); });
    const state = harness.state();
    const material = phaseMaterial(state.scene);
    assertPhase(material, first);
    const next = { illuminatedFraction: 0.8, waxing: false };
    await act(async () => { harness.root.render(createElement(MoonPhaseDisc, { ...props, ...next })); });
    assert.equal(phaseMaterial(state.scene), material);
    assertPhase(material, next);
    const phaseRef = { current: { illuminatedFraction: 0.35, waxing: false } };
    await act(async () => { harness.root.render(createElement(MoonPhaseDisc, { ...props, phaseRef })); });
    assertPhase(material, phaseRef.current);
    for (const phase of [first, next, { illuminatedFraction: 1.01, waxing: true }]) {
      phaseRef.current = phase;
      await act(async () => { state.advance(performance.now(), false); });
      assert.equal(phaseMaterial(state.scene), material);
      assertPhase(material, phase);
    }
    harness.drain();
  } finally {
    await harness.close();
  }
});
