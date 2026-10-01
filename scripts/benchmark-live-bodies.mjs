// Run: node scripts/benchmark-live-bodies.mjs --baseline=2ae0966 --speed=604800 --output=docs/live-body-performance.json
// Real React/R3F reconciliation and Three objects, with a no-op WebGL renderer.
// This measures CPU work for fixed rendered-frame counts, never browser FPS/GPU time.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { Session } from 'node:inspector';
import { cpus, tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createElement, Profiler } from 'react';
import { act, createRoot, extend, _roots } from '@react-three/fiber';
import * as THREE from 'three';
import { createServer } from 'vite';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=');
  return [key, value.join('=')];
}));
const rootDirectory = process.cwd();
const baselineRef = args.baseline || null;
const frameCount = Number(args.frames || 120);
const rounds = Number(args.rounds || 7);
const measuredSpeed = Number(args.speed || 604800);
assert.ok(frameCount >= 2 && rounds >= 1 && measuredSpeed > 0);
const baseTime = Date.parse('2026-06-01T12:00:00Z');
const realNow = performance.now.bind(performance);
const nowDescriptor = Object.getOwnPropertyDescriptor(performance, 'now');
const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
const previousRequestFrame = globalThis.requestAnimationFrame;
const previousCancelFrame = globalThis.cancelAnimationFrame;
let controlledWallTime = 1000;
let nextFrameId = 0;
const servers = [];
const temporaryRoots = [];
const session = new Session();
session.connect();
const inspector = (method, params = {}) => new Promise((resolve, reject) => {
  session.post(method, params, (error, result) => error ? reject(error) : resolve(result));
});
const measuredFunctions = ['getSunPosition', 'getMoonPosition', 'getPlanetPosition', 'getMoonPhaseData'];
const sourceFiles = [
  'src/components/scene/layers/SpaceDynamicLayers.tsx',
  'src/components/scene/layers/SpaceSunLayer.tsx',
  'src/components/scene/layers/SceneBodiesLayer.tsx',
  'src/components/scene/MoonPhaseDisc.tsx',
  'src/components/scene/EarthView.tsx',
  'src/utils/ephemeris.ts',
];

async function loadSource(directory, label) {
  const server = await createServer({
    root: directory, configFile: false, appType: 'custom', mode: 'production',
    logLevel: 'error', esbuild: { jsx: 'automatic' },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [{
      name: 'benchmark-only-export-and-disable-labels', enforce: 'pre',
      transform(source, id) {
        // No tracked sources are edited. Labels are omitted equally in both
        // revisions because Troika glyph construction requires a browser canvas.
        if (!id.endsWith('.tsx') || !id.includes('/src/components/scene/')) return null;
        let code = source.replaceAll('showLabels = true', 'showLabels = false');
        // The baseline kept this component private; expose the identical function.
        if (id.endsWith('/EarthView.tsx') && !/export function EarthDynamicBodiesLayer/.test(code)) {
          code += '\nexport { EarthDynamicBodiesLayer };\n';
        }
        return { code, map: null };
      },
    }],
  });
  servers.push(server);
  const [space, earth, store, ephemeris, projection] = await Promise.all([
    'src/components/scene/layers/SpaceDynamicLayers.tsx',
    'src/components/scene/EarthView.tsx', 'src/store/useAppStore.ts',
    'src/utils/ephemeris.ts', 'src/utils/skyProjection.ts',
  ].map((file) => server.ssrLoadModule(`/${file}`)));
  return { label, directory, Space: space.default, Earth: earth.EarthDynamicBodiesLayer,
    store: store.useAppStore, ...ephemeris, ...projection };
}

async function mount(api, scene, allBodies, speed, startTime) {
  const initialDate = new Date(startTime);
  api.store.setState((state) => ({
    scene: { ...state.scene, viewMode: scene === 'earth' ? 'earth' : 'space',
      referenceFrame: scene === 'space-celestial' ? 'celestial' : 'observer' },
    observer: { latitude: 80, longitude: 0 },
    clock: { ...state.clock, currentTime: initialDate, displayTime: initialDate,
      isPlaying: true, timeSpeed: speed,
      playbackStartWallTime: controlledWallTime, playbackStartSimTimeMs: startTime },
    display: { ...state.display, showMoon: allBodies, showPlanets: allBodies,
      showStars: false, showMilkyWay: false, showAnnualTrail: false,
      showDiurnalArc: false, showCelestialObserverOverlay: false },
  }));
  const canvas = { width: 800, height: 600, addEventListener() {}, removeEventListener() {} };
  const renderer = {
    domElement: canvas, render() {}, setSize() {}, setPixelRatio() {},
    xr: { isPresenting: false, addEventListener() {}, removeEventListener() {} },
    shadowMap: {}, forceContextLoss() {}, renderLists: { dispose() {} },
  };
  const root = createRoot(canvas);
  root.configure({ gl: renderer, size: { width: 800, height: 600, top: 0, left: 0 },
    frameloop: 'never', dpr: 1 });
  const simDateRef = { current: initialDate };
  const spriteTexture = new THREE.Texture();
  let commits = 0;
  const element = scene === 'earth'
    ? createElement(api.Earth, { simDateRef, language: 'en', showMoon: allBodies,
      showPlanets: allBodies, spriteTexture, showLabels: false })
    : createElement(api.Space, { simDateRef, language: 'en', showDiurnalArc: false });
  await act(async () => {
    root.render(createElement(Profiler, { id: 'live-bodies', onRender() { commits++; } }, element));
  });
  const state = _roots.get(canvas).store.getState();
  let simulationTime = startTime;
  function sunGroup() {
    let result;
    state.scene.traverse((object) => {
      if (!result && object.material?.color?.getHexString() === 'ffd166') result = object.parent;
    });
    assert.ok(result, `${api.label}/${scene}: rendered Sun object exists`);
    return result;
  }
  return {
    state, get commits() { return commits; },
    frame(wallStep, collect = false) {
      controlledWallTime += wallStep;
      simulationTime += wallStep * speed;
      simDateRef.current = new Date(simulationTime);
      // Flush exactly one real React/R3F frame, including any legacy setState.
      act(() => { state.advance(controlledWallTime / 1000, false); });
      if (!collect) return null;
      const sun = sunGroup();
      return { time: simDateRef.current.getTime(), position: sun.position.toArray(), visible: sun.visible };
    },
    async close() {
      await act(async () => { root.unmount(); });
      spriteTexture.dispose();
    },
  };
}

async function coverageCounts(api, run) {
  await inspector('Profiler.startPreciseCoverage', { callCount: true, detailed: false });
  try {
    const value = await run();
    const { result } = await inspector('Profiler.takePreciseCoverage');
    const counts = Object.fromEntries(measuredFunctions.map((name) => [name, 0]));
    const scripts = result.filter((script) => script.url.includes(api.directory)
      && script.url.endsWith('/src/utils/ephemeris.ts'));
    assert.ok(scripts.length, `V8 must report the actual ${api.label} ephemeris module`);
    for (const script of scripts) for (const fn of script.functions) {
      if (fn.functionName in counts) counts[fn.functionName] += fn.ranges[0].count;
    }
    assert.ok(counts.getSunPosition > 0, 'coverage must observe actual Sun calls');
    return { value, counts };
  } finally { await inspector('Profiler.stopPreciseCoverage'); }
}

function assertPositions(api, scene, samples) {
  let changed = 0;
  let maxError = 0;
  let previous;
  for (const sample of samples) {
    const date = new Date(sample.time);
    const sun = api.getSunPosition(date);
    const projected = api.projectEquatorialCoordinate(sun.ra, sun.dec, 80, 0, date, scene === 'earth' ? 45 : 10);
    const expected = scene === 'space-celestial' ? projected.celestialPosition : projected.observerPosition;
    const error = Math.max(...sample.position.map((value, index) => Math.abs(value - expected[index])));
    maxError = Math.max(maxError, error);
    assert.ok(error < 1e-10, `${api.label}/${scene}: frame has exact current-time Sun transform (error ${error})`);
    assert.equal(sample.visible, scene === 'space-celestial' || projected.isVisible);
    assert.ok(projected.isVisible, 'polar-day fixture keeps Sun above horizon on every checked frame');
    if (previous && sample.position.some((value, index) => value !== previous[index])) changed++;
    previous = sample.position;
  }
  assert.equal(changed, samples.length - 1, `${api.label}/${scene}: no repeated/skipped Sun positions`);
  return { checkedFrames: samples.length, changingFrameTransitions: changed, maxPositionError: maxError };
}

async function countFrames(api, scene, allBodies, speed, wallStep, count = frameCount) {
  const { value: mounted, counts: mountCounts } = await coverageCounts(api,
    () => mount(api, scene, allBodies, speed, baseTime));
  try {
    if (!allBodies) for (const name of measuredFunctions.slice(1)) {
      assert.equal(mountCounts[name], 0, `hidden ${name} must also do no work during mount`);
    }
    const commitsBefore = mounted.commits;
    const { value: samples, counts } = await coverageCounts(api, () => {
      const result = [];
      for (let frame = 0; frame < count; frame++) result.push(mounted.frame(wallStep, true));
      return result;
    });
    const commits = mounted.commits - commitsBefore;
    assert.equal(counts.getSunPosition, count, 'exactly one Sun evaluation per rendered frame');
    assert.equal(counts.getMoonPosition, allBodies ? count : 0);
    assert.equal(counts.getPlanetPosition, allBodies ? count * 7 : 0);
    if (!allBodies) assert.equal(counts.getMoonPhaseData, 0);
    if (api.label === 'current') {
      assert.equal(counts.getMoonPhaseData, allBodies ? count : 0);
      assert.equal(commits, 0, 'current animation must not schedule React commits');
    }
    let mountedObjects = 0;
    mounted.state.scene.traverse(() => { mountedObjects++; });
    return { source: api.label, scene, bodies: allBodies ? 'sun+moon+7planets' : 'sun-only',
      speed, frameCount: count, controlledWallStepMs: wallStep,
      mountEphemerisCalls: mountCounts, ephemerisCalls: counts,
      animationReactCommits: commits, mountedThreeObjects: mountedObjects,
      ...assertPositions(api, scene, samples) };
  } finally { await mounted.close(); }
}

async function timeFrames(api, scene, allBodies, round) {
  // Distinct dates avoid sharing the previous run's position/rotation caches.
  const runStart = baseTime + round * 86400000;
  const mounted = await mount(api, scene, allBodies, measuredSpeed, runStart);
  try {
    for (let i = 0; i < 30; i++) mounted.frame(40);
    const commitsBefore = mounted.commits;
    const cpuStart = process.cpuUsage();
    const start = realNow();
    for (let i = 0; i < frameCount; i++) mounted.frame(40);
    const elapsedMs = realNow() - start;
    const cpu = process.cpuUsage(cpuStart);
    // Outside the timer: prove that the entire high-speed interval, including
    // prewarming, stays above the horizon. Legacy conditional meshes therefore
    // cannot save work by disappearing at night.
    let minimumSunHeight = Infinity;
    for (let frame = 1; frame <= 30 + frameCount; frame++) {
      const date = new Date(runStart + frame * 40 * measuredSpeed);
      const position = api.getSunPosition(date);
      const projected = api.projectEquatorialCoordinate(position.ra, position.dec, 80, 0, date, 10);
      assert.ok(projected.isVisible, 'all timed dates must keep the Sun above the horizon');
      minimumSunHeight = Math.min(minimumSunHeight, projected.observerPosition[1]);
    }
    return { cpuMs: (cpu.user + cpu.system) / 1000, elapsedMs,
      animationReactCommits: mounted.commits - commitsBefore,
      firstMeasuredDate: new Date(runStart + 31 * 40 * measuredSpeed).toISOString(),
      lastMeasuredDate: new Date(runStart + (30 + frameCount) * 40 * measuredSpeed).toISOString(),
      assertedDaylightFramesIncludingWarmup: 30 + frameCount,
      minimumSunHeightAtRadius10: minimumSunHeight };
  } finally { await mounted.close(); }
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

try {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = () => ++nextFrameId;
  globalThis.cancelAnimationFrame = () => {};
  Object.defineProperty(performance, 'now', { configurable: true, value: () => controlledWallTime });
  extend(THREE);
  await inspector('Profiler.enable');
  let baseline;
  if (baselineRef) {
    const directory = await mkdtemp(path.join(tmpdir(), 'earth-live-bodies-baseline-'));
    temporaryRoots.push(directory);
    const archive = execFileSync('git', ['archive', baselineRef, '--', 'src', 'package.json'], { cwd: rootDirectory });
    execFileSync('tar', ['-x', '-C', directory], { input: archive });
    await symlink(path.join(rootDirectory, 'node_modules'), path.join(directory, 'node_modules'), 'dir');
    baseline = await loadSource(directory, 'baseline');
  }
  const current = await loadSource(rootDirectory, 'current');
  const countResults = [];
  const timingResults = [];
  const scenes = ['space-observer', 'space-celestial', 'earth'];
  for (const scene of scenes) for (const allBodies of [false, true]) {
    for (const api of [baseline, current].filter(Boolean)) {
      countResults.push(await countFrames(api, scene, allBodies, measuredSpeed, 40));
    }
    const timings = { baseline: [], current: [] };
    for (let round = 0; round < rounds; round++) {
      const apis = round % 2 ? [current, baseline] : [baseline, current];
      for (const api of apis.filter(Boolean)) timings[api.label].push(await timeFrames(api, scene, allBodies, round));
    }
    const row = { scene, bodies: allBodies ? 'sun+moon+7planets' : 'sun-only', frameCount, speed: measuredSpeed };
    for (const label of ['baseline', 'current']) if (timings[label].length) {
      row[label] = { medianCpuMs: median(timings[label].map((run) => run.cpuMs)),
        medianElapsedMs: median(timings[label].map((run) => run.elapsedMs)), runs: timings[label] };
    }
    if (row.baseline) row.cpuSpeedup = row.baseline.medianCpuMs / row.current.medianCpuMs;
    timingResults.push(row);
  }
  const continuousFrameResults = [];
  for (const scene of scenes) for (const allBodies of [false, true]) {
    for (const speed of [1, 3600, 86400, 604800]) {
      continuousFrameResults.push(await countFrames(current, scene, allBodies, speed, 1000 / 60, 60));
    }
  }
  const sourceHashes = {};
  for (const file of sourceFiles) sourceHashes[file] = createHash('sha256').update(await readFile(file)).digest('hex');
  const report = {
    measuredAt: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model,
    baseline: baselineRef, baselineCommit: baselineRef
      ? execFileSync('git', ['rev-parse', baselineRef], { cwd: rootDirectory, encoding: 'utf8' }).trim() : null,
    sourceHashes, frameCount, rounds, measuredSpeed,
    method: 'Real React 18 / R3F reconciliation and Three objects; no-op WebGL renderer; V8 precise function coverage and React Profiler',
    countMethod: 'V8 Profiler.startPreciseCoverage(callCount=true) on actual loaded ephemeris module; mount counted separately from animation frames; oracle verification excluded',
    timingMethod: 'Median process CPU and elapsed milliseconds for N frames; 30 warm-up frames per run; alternating revision order; coverage disabled while timing',
    fairness: '40 ms controlled wall-time per measured frame permits every legacy 16/33 ms gate; exactly N Sun calls and N distinct exact-time positions asserted for both revisions. No improvement may come from skipping old frames.',
    sceneConfiguration: 'Sun-only vs Sun+Moon+7 planets. Stars, Milky Way, annual and diurnal trails disabled. Both revisions omit body labels for browser-free execution. Latitude 80°, June daytime fixtures.',
    limitations: 'CPU-only component benchmark, with React development/profiling overhead. Excludes WebGL draw calls, GPU, browser frame pacing, Troika text construction, complete-scene/static-layer cost, and UI/clock scheduling. Does not establish browser FPS or end-to-end latency.',
    countResults, timingResults, continuousFrameResults,
  };
  if (args.output) {
    const output = path.resolve(args.output);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  session.disconnect();
  await Promise.all(servers.map((server) => server.close()));
  for (const directory of temporaryRoots) await rm(directory, { recursive: true, force: true });
  if (nowDescriptor) Object.defineProperty(performance, 'now', nowDescriptor);
  else delete performance.now;
  if (previousActEnvironment === undefined) delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  else globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  if (previousRequestFrame === undefined) delete globalThis.requestAnimationFrame;
  else globalThis.requestAnimationFrame = previousRequestFrame;
  if (previousCancelFrame === undefined) delete globalThis.cancelAnimationFrame;
  else globalThis.cancelAnimationFrame = previousCancelFrame;
}
