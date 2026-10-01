import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement, Fragment, Profiler } from 'react';
import { createRoot, extend, act, _roots } from '@react-three/fiber';
import * as THREE from 'three';
import SpaceSunLayer from '../src/components/scene/layers/SpaceSunLayer';
import SceneBodiesLayer from '../src/components/scene/layers/SceneBodiesLayer';
import { useAppStore } from '../src/store/useAppStore';
import { getSunPosition, getMoonPosition, getPlanetPosition, PLANET_BODIES } from '../src/utils/ephemeris';
import { projectEquatorialCoordinate } from '../src/utils/skyProjection';

// Exact Three/R3F transform and lifecycle checks; the renderer has no GPU.
await test('all visible space bodies follow every frame at every speed without React motion commits', async () => {
  const original = useAppStore.getState();
  const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const oldAct = globals.IS_REACT_ACT_ENVIRONMENT;
  const oldRaf = globals.requestAnimationFrame;
  const oldCancel = globals.cancelAnimationFrame;
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  globals.requestAnimationFrame = () => 0;
  globals.cancelAnimationFrame = () => {};
  extend(THREE);
  const canvas = { width: 800, height: 600, addEventListener() {}, removeEventListener() {} } as unknown as HTMLCanvasElement;
  const renderer = {
    domElement: canvas, render() {}, setSize() {}, setPixelRatio() {},
    xr: { isPresenting: false, addEventListener() {}, removeEventListener() {} },
    shadowMap: {}, forceContextLoss() {}, renderLists: { dispose() {} },
  };
  const root = createRoot(canvas);
  const dateRef = { current: new Date('2026-03-20T00:00:00Z') };
  let commits = 0;
  try {
    useAppStore.setState({
      observer: { latitude: 40, longitude: 0 },
      display: { ...original.display, showMoon: true, showPlanets: true },
    });
    root.configure({ gl: renderer, size: { width: 800, height: 600, top: 0, left: 0 }, frameloop: 'never', dpr: 1 });
    await act(async () => {
      root.render(createElement(Profiler, { id: 'live-bodies', onRender: () => { commits++; } },
        createElement(Fragment, null,
          createElement(SpaceSunLayer, { simDateRef: dateRef, language: 'zh-CN', showRay: true, showLabels: false }),
          createElement(SceneBodiesLayer, { simDateRef: dateRef, language: 'zh-CN', showLabels: false }),
        ),
      ));
    });
    const state = _roots.get(canvas)!.store.getState();
    const sun = state.scene.getObjectByName('continuous-sun')!;
    const ray = state.scene.getObjectByName('continuous-sun-ray')!;
    const moon = state.scene.getObjectByName('continuous-moon')!;
    assert.ok(sun && moon && ray);
    const sunId = sun.uuid;
    const moonId = moon.uuid;
    const geometries = (object: THREE.Object3D) => {
      const ids: string[] = [];
      object.traverse((child) => { if (child instanceof THREE.Mesh) ids.push(child.geometry.uuid); });
      return ids;
    };
    const sunGeometry = geometries(sun);
    const appearance = () => {
      const values: unknown[] = [];
      for (const body of [sun, moon]) body.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.Material;
          values.push([child.scale.toArray(), material.opacity, material.transparent, material.depthTest, material.depthWrite]);
        }
        if (child instanceof THREE.PointLight) values.push([child.intensity, child.distance, child.decay, child.color.getHex()]);
      });
      return values;
    };
    const originalAppearance = appearance();
    let frame = 0;
    let horizonCrossings = 0;
    let lastVisible = sun.visible;
    const base = new Date('2026-03-20T00:00:00Z').getTime();

    function checkBody(name: string, coordinate: { ra: number; dec: number }, celestial: boolean) {
      const body = state.scene.getObjectByName(name)!;
      const observer = useAppStore.getState().observer;
      const expected = projectEquatorialCoordinate(coordinate.ra, coordinate.dec, observer.latitude, observer.longitude, dateRef.current, 10);
      const point = celestial ? expected.celestialPosition : expected.observerPosition;
      assert.ok(body.position.distanceTo(new THREE.Vector3(...point)) < 1e-10, `${name} must use this frame's time`);
      assert.equal(body.visible, celestial || expected.isVisible);
      return expected;
    }

    for (const referenceFrame of ['observer', 'celestial'] as const) {
      for (const speed of [1, 3600, 86400, 604800, -604800]) {
        await act(async () => { useAppStore.setState({
          scene: { ...useAppStore.getState().scene, referenceFrame },
          clock: { ...useAppStore.getState().clock, timeSpeed: speed },
        }); });
        const before = commits;
        for (let sample = 0; sample < 60; sample++) {
          // Run faster than any wall-time gate. Virtual frames are still 1/60s apart.
          dateRef.current.setTime(base + sample * speed * 1000 / 60);
          state.advance(++frame / 60, false);
          const projectedSun = checkBody('continuous-sun', getSunPosition(dateRef.current), referenceFrame === 'celestial');
          checkBody('continuous-moon', getMoonPosition(dateRef.current), referenceFrame === 'celestial');
          for (const planet of PLANET_BODIES) checkBody(`continuous-planet-${planet.name}`, getPlanetPosition(planet.name, dateRef.current)!, referenceFrame === 'celestial');
          assert.equal(ray.visible, projectedSun.isVisible);
          const rayDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(ray.quaternion);
          assert.ok(rayDirection.distanceTo(new THREE.Vector3(...projectedSun.observerPosition).normalize()) < 1e-10);
          if (speed === 604800 && referenceFrame === 'observer' && sun.visible !== lastVisible) horizonCrossings++;
          lastVisible = sun.visible;
        }
        assert.equal(commits, before, 'motion and phase uniforms must not submit React frames');
        assert.deepEqual(appearance(), originalAppearance, 'speed never changes geometry, light or transparency');
      }
    }
    assert.ok(horizonCrossings >= 12, 'exercise repeated sunrise and sunset');
    assert.equal(sun.uuid, sunId);
    assert.equal(moon.uuid, moonId);
    assert.deepEqual(geometries(sun), sunGeometry, 'sunrise must not rebuild geometry');

    // Pause at one exact instant; repeated renders and observer edits obey the same rules.
    await act(async () => { useAppStore.setState({
      clock: { ...useAppStore.getState().clock, isPlaying: false },
      observer: { latitude: -33.9, longitude: 151.2 },
      scene: { ...useAppStore.getState().scene, referenceFrame: 'observer' },
    }); });
    state.advance(++frame / 60, false);
    checkBody('continuous-sun', getSunPosition(dateRef.current), false);
    const pausedPosition = sun.position.clone();
    state.advance(++frame / 60, false);
    assert.deepEqual(sun.position, pausedPosition);

    await act(async () => {
      useAppStore.getState().setShowMoon(false);
      useAppStore.getState().setShowPlanets(false);
    });
    assert.equal(state.scene.getObjectByName('continuous-moon'), undefined);
    for (const planet of PLANET_BODIES) assert.equal(state.scene.getObjectByName(`continuous-planet-${planet.name}`), undefined);
    dateRef.current.setTime(base + 250 * 86400000);
    await act(async () => {
      useAppStore.getState().setShowMoon(true);
      useAppStore.getState().setShowPlanets(true);
    });
    // Layout sync restores current positions before the first rendered frame.
    checkBody('continuous-moon', getMoonPosition(dateRef.current), false);
    for (const planet of PLANET_BODIES) checkBody(`continuous-planet-${planet.name}`, getPlanetPosition(planet.name, dateRef.current)!, false);
  } finally {
    await act(async () => { root.unmount(); });
    useAppStore.setState(original, true);
    if (oldAct === undefined) delete globals.IS_REACT_ACT_ENVIRONMENT; else globals.IS_REACT_ACT_ENVIRONMENT = oldAct;
    if (oldRaf === undefined) Reflect.deleteProperty(globals, 'requestAnimationFrame'); else globals.requestAnimationFrame = oldRaf;
    if (oldCancel === undefined) Reflect.deleteProperty(globals, 'cancelAnimationFrame'); else globals.cancelAnimationFrame = oldCancel;
  }
});
