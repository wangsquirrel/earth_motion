import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { createRoot, extend, act, _roots } from '@react-three/fiber';
import * as THREE from 'three';
import CultureHighlightLayer from '../src/components/scene/layers/CultureHighlightLayer';
import { useAppStore } from '../src/store/useAppStore';
import { buildCelestialStarRenderData } from '../src/utils/starField';
import { CATALOG } from '../src/utils/stars';

// Real React/R3F reconciliation, Three objects and demand scheduling, but a stub
// renderer: these assertions are not a WebGL, browser or pixel regression test.
await test('culture highlights reconcile and settle after paused demand-mode changes', async () => {
  const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = globals.IS_REACT_ACT_ENVIRONMENT;
  const previousRequestFrame = globals.requestAnimationFrame;
  const previousCancelFrame = globals.cancelAnimationFrame;
  const previousSelection = useAppStore.getState().selectedCultureEntryId;
  const queuedFrames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;

  globals.IS_REACT_ACT_ENVIRONMENT = true;
  globals.requestAnimationFrame = (callback) => {
    queuedFrames.set(++nextFrameId, callback);
    return nextFrameId;
  };
  globals.cancelAnimationFrame = (id) => { queuedFrames.delete(id); };
  useAppStore.getState().setSelectedCultureEntryId(null);
  extend(THREE);

  const canvas = {
    width: 800,
    height: 600,
    addEventListener() {},
    removeEventListener() {},
  } as unknown as HTMLCanvasElement;
  const renderer = {
    domElement: canvas,
    render() {},
    setSize() {},
    setPixelRatio() {},
    xr: { isPresenting: false, addEventListener() {}, removeEventListener() {} },
    shadowMap: {},
    forceContextLoss() {},
    renderLists: { dispose() {} },
  };
  const root = createRoot(canvas);

  try {
    root.configure({
      gl: renderer,
      size: { width: 800, height: 600, top: 0, left: 0 },
      frameloop: 'demand',
      dpr: 1,
    });
    const stars = buildCelestialStarRenderData(CATALOG, 10, 1.04, 'chinese', 'zh-CN');
    const layer = (clipToHorizon: boolean) => createElement(CultureHighlightLayer, {
      stars, radius: 10, clipToHorizon,
    });
    await act(async () => { root.render(layer(true)); });
    const state = _roots.get(canvas)!.store.getState();

    function drainFrames() {
      let count = 0;
      while (queuedFrames.size && count++ < 20) {
        const callbacks = [...queuedFrames.values()];
        queuedFrames.clear();
        for (const callback of callbacks) callback(performance.now());
      }
      assert.ok(count < 20, 'demand loop should become idle after the update');
      assert.equal(state.internal.frames, 0);
    }

    function rings() {
      const result: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
      state.scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry instanceof THREE.RingGeometry) result.push(object);
      });
      return result;
    }

    async function select(id: string | null, expectedCount: number) {
      await act(async () => { useAppStore.getState().setSelectedCultureEntryId(id); });
      assert.ok(state.internal.frames > 0, 'a changed selection should schedule a demand frame');
      drainFrames();
      assert.equal(rings().length, expectedCount);
    }

    drainFrames();
    assert.equal(rings().length, 0);
    await select('beidou', 7);

    // Repeating a selection is idempotent; it need not schedule a redundant frame.
    await act(async () => { useAppStore.getState().setSelectedCultureEntryId('beidou'); });
    drainFrames();
    assert.equal(rings().length, 7);

    await select('kang', 0); // An explicitly unmapped mansion clears the old rings.
    await select('ziwei', 1);
    await select('xin', 1);
    assert.equal(rings()[0].parent!.parent!.visible, false, 'negative world-y anchor is hidden');

    await act(async () => { root.render(layer(false)); });
    drainFrames();
    assert.equal(rings()[0].material.clippingPlanes, null);
    assert.equal(rings()[0].parent!.parent!.visible, true);

    await act(async () => { root.render(layer(true)); });
    drainFrames();
    assert.equal(rings()[0].material.clippingPlanes!.length, 1);
    assert.equal(rings()[0].parent!.parent!.visible, false);

    await select(null, 0);
  } finally {
    await act(async () => { root.unmount(); });
    useAppStore.getState().setSelectedCultureEntryId(previousSelection);
    if (previousActEnvironment === undefined) delete globals.IS_REACT_ACT_ENVIRONMENT;
    else globals.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    if (previousRequestFrame === undefined) Reflect.deleteProperty(globals, 'requestAnimationFrame');
    else globals.requestAnimationFrame = previousRequestFrame;
    if (previousCancelFrame === undefined) Reflect.deleteProperty(globals, 'cancelAnimationFrame');
    else globals.cancelAnimationFrame = previousCancelFrame;
  }
});
