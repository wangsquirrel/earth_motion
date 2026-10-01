import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement, useLayoutEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot, extend, act, _roots } from '@react-three/fiber';
import * as THREE from 'three';
import CanvasErrorBoundary from '../src/components/ui/CanvasErrorBoundary';
import SceneUnavailable from '../src/components/ui/SceneUnavailable';
import { getSceneFallbackCopy } from '../src/utils/sceneFallbackCopy';

await test('healthy graphics boundary preserves its child output without a wrapper', () => {
  const child = createElement('div', { id: 'scene' }, 'healthy scene');
  const result = renderToStaticMarkup(createElement(CanvasErrorBoundary, {
    children: child,
    fallback: () => createElement('div', null, 'unavailable'),
  }));
  assert.equal(result, renderToStaticMarkup(child));
});

await test('graphics fallback has localized, honest guidance and an explicit retry', () => {
  for (const language of ['zh-CN', 'en'] as const) {
    const copy = getSceneFallbackCopy(language);
    const markup = renderToStaticMarkup(createElement(SceneUnavailable, {
      language,
      onRetry() {},
    }));
    for (const value of Object.values(copy)) assert.ok(markup.includes(value));
    assert.match(markup, /WebGL 2/);
    assert.match(markup, /role="status"/);
    assert.match(markup, /<button type="button"/);
    assert.doesNotMatch(markup, /<canvas/);
  }
});

// Exercise React's real error-boundary lifecycle through the existing R3F test
// renderer. This checks isolation and retry, not browser WebGL availability.
await test('render and initialization errors stay local until an explicit retry', async () => {
  const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = globals.IS_REACT_ACT_ENVIRONMENT;
  const previousRequestFrame = globals.requestAnimationFrame;
  const previousCancelFrame = globals.cancelAnimationFrame;
  const previousConsoleError = console.error;
  const errors: unknown[][] = [];
  const queuedFrames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  globals.requestAnimationFrame = (callback) => {
    queuedFrames.set(++nextFrameId, callback);
    return nextFrameId;
  };
  globals.cancelAnimationFrame = (id) => { queuedFrames.delete(id); };
  console.error = (...args: unknown[]) => { errors.push(args); };
  extend(THREE);

  const canvas = {
    width: 800, height: 600, addEventListener() {}, removeEventListener() {},
  } as unknown as HTMLCanvasElement;
  const renderer = {
    domElement: canvas, render() {}, setSize() {}, setPixelRatio() {},
    xr: { isPresenting: false, addEventListener() {}, removeEventListener() {} },
    shadowMap: {}, forceContextLoss() {}, renderLists: { dispose() {} },
  };
  const root = createRoot(canvas);
  let mode: 'render-error' | 'initialization-error' | 'healthy' = 'render-error';
  let attempts = 0;
  let retry: (() => void) | undefined;
  let label = 'unavailable-zh';

  function GraphicsProbe() {
    attempts += 1;
    useLayoutEffect(() => {
      if (mode === 'initialization-error') throw new Error('Graphics initialization failed');
    });
    if (mode === 'render-error') throw new Error('WebGL context disabled');
    return createElement('group', { name: 'healthy-scene' });
  }

  function tree() {
    return createElement('group', null,
      createElement('group', { name: 'controls-and-culture' }),
      createElement(CanvasErrorBoundary, {
        children: createElement(GraphicsProbe),
        fallback: (requestRetry) => {
          retry = requestRetry;
          return createElement('group', { name: label });
        },
      }),
    );
  }

  try {
    root.configure({
      gl: renderer, size: { width: 800, height: 600, top: 0, left: 0 },
      frameloop: 'never', dpr: 1,
    });
    await act(async () => { root.render(tree()); });
    const scene = _roots.get(canvas)!.store.getState().scene;
    const controls = scene.getObjectByName('controls-and-culture');
    assert.ok(controls);
    assert.ok(scene.getObjectByName('unavailable-zh'));
    assert.equal(scene.getObjectByName('healthy-scene'), undefined);

    const failedAttempts = attempts;
    label = 'unavailable-en';
    mode = 'healthy';
    await act(async () => { root.render(tree()); });
    assert.equal(attempts, failedAttempts, 'ordinary updates must not retry failed graphics');
    assert.ok(scene.getObjectByName('unavailable-en'), 'fallback still responds to UI-language updates');
    assert.equal(scene.getObjectByName('controls-and-culture'), controls, 'surrounding UI stays mounted');

    await act(async () => { retry!(); });
    assert.ok(scene.getObjectByName('healthy-scene'));
    assert.equal(scene.getObjectByName('unavailable-en'), undefined);

    mode = 'initialization-error';
    await act(async () => { root.render(tree()); });
    assert.ok(scene.getObjectByName('unavailable-en'), 'layout-effect initialization errors are caught too');
    assert.equal(scene.getObjectByName('controls-and-culture'), controls);

    // Retrying while graphics remain unavailable must settle back on the
    // fallback, rather than recursively remounting or claiming success.
    await act(async () => { retry!(); });
    const repeatedFailureAttempts = attempts;
    assert.ok(scene.getObjectByName('unavailable-en'));
    await act(async () => { root.render(tree()); });
    assert.equal(attempts, repeatedFailureAttempts);
    assert.equal(scene.getObjectByName('healthy-scene'), undefined);

    mode = 'healthy';
    await act(async () => { retry!(); });
    assert.ok(scene.getObjectByName('healthy-scene'));
    assert.equal(scene.getObjectByName('controls-and-culture'), controls);
    assert.ok(errors.some((args) => args.some((value) => String(value).includes('GraphicsProbe'))));
  } finally {
    await act(async () => { root.unmount(); });
    console.error = previousConsoleError;
    if (previousActEnvironment === undefined) delete globals.IS_REACT_ACT_ENVIRONMENT;
    else globals.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    if (previousRequestFrame === undefined) Reflect.deleteProperty(globals, 'requestAnimationFrame');
    else globals.requestAnimationFrame = previousRequestFrame;
    if (previousCancelFrame === undefined) Reflect.deleteProperty(globals, 'cancelAnimationFrame');
    else globals.cancelAnimationFrame = previousCancelFrame;
  }
});
