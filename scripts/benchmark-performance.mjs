// Run: node scripts/benchmark-performance.mjs [--baseline=<git-ref>] [--output=<json-path>]
// CPU-only deterministic workloads. This does not measure browser FPS or GPU draw time.
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, symlink, rm, access } from 'node:fs/promises';
import { tmpdir, cpus } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createServer } from 'vite';
import * as THREE from 'three';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=');
  return [key, value.join('=')];
}));
const root = process.cwd();
const baselineRef = args.baseline;
const temp = baselineRef ? await mkdtemp(path.join(tmpdir(), 'earth-motion-benchmark-')) : null;
const servers = [];
let checksum = 0;

// Intentional cultural-data corrections, reviewed independently of performance.
// Compare every other field/label; never blanket-ignore text differences.
const labelCorrections = {
  'star:bayer:epsilon-ori': { before: '参宿三', after: '参宿二' },
  'star:bayer:delta-ori': { before: '参宿二', after: '参宿三' },
};

async function load(rootDirectory) {
  const server = await createServer({ root: rootDirectory, configFile: false, appType: 'custom', mode: 'production',
    logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  servers.push(server);
  const [projection, scene, paths, field, stars, ephemeris] = await Promise.all([
    'src/utils/skyProjection.ts', 'src/components/scene/builders/sceneData.ts', 'src/utils/sunPaths.ts',
    'src/utils/starField.ts', 'src/utils/stars.ts', 'src/utils/ephemeris.ts',
  ].map((file) => server.ssrLoadModule(`/${file}`)));
  const hasMatrixHelper = await access(path.join(rootDirectory, 'src/components/scene/builders/frameWorldMatrix.ts')).then(() => true, () => false);
  const matrix = hasMatrixHelper
    ? await server.ssrLoadModule('/src/components/scene/builders/frameWorldMatrix.ts')
    : { updateWorldMatrixForFrame: (object) => object.updateWorldMatrix(true, false) };
  return { ...projection, ...scene, ...paths, ...field, ...stars, ...ephemeris, ...matrix };
}

function compare(actual, expected, location = 'fixture') {
  if (typeof expected === 'number') {
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-10 * Math.max(1, Math.abs(expected))) {
      throw new Error(`${location}: ${actual} differs from ${expected}`);
    }
  } else if (expected && typeof expected === 'object') {
    const keys = Object.keys(expected);
    if (keys.join('|') !== Object.keys(actual ?? {}).join('|')) throw new Error(`${location}: shape changed`);
    for (const key of keys) {
      const correction = labelCorrections[expected.id];
      if (key === 'label' && correction && expected.label === correction.before) {
        if (actual.label !== correction.after) throw new Error(`${location}.label: unexpected cultural correction`);
        continue;
      }
      compare(actual[key], expected[key], `${location}.${key}`);
    }
  } else if (actual !== expected) throw new Error(`${location}: ${actual} differs from ${expected}`);
}

function fixtures(api) {
  const results = [];
  for (const time of ['2000-01-01T12:00:00Z', '2026-09-30T12:00:00Z', '2100-06-21T00:00:00Z']) {
    const date = new Date(time);
    for (const latitude of [-90, 0, 40, 90]) {
      for (const longitude of [-180, 116.4, 180]) {
        results.push(api.projectEquatorialCoordinate(1.234, -0.456, latitude, longitude, date, 50));
        results.push(api.buildSunDiurnalArcSamples(date, latitude, longitude, 10, 145));
        results.push(api.buildEclipticSamples(date, latitude, longitude, 10, 180));
      }
    }
  }
  for (const culture of ['chinese', 'western']) for (const language of ['zh-CN', 'en']) {
    results.push(api.buildCelestialStarRenderData(api.CATALOG, 50, 1.04, culture, language));
    results.push(api.buildCelestialConstellationLines(api.CONSTELLATIONS_BY_CULTURE[culture], api.CATALOG, 50));
    for (const latitude of [-90, 0, 40, 90]) {
      results.push(api.buildObserverStarRenderData(api.CATALOG, latitude, 116.4, new Date(baseTime), 50, 1.04, culture, language));
      results.push(api.buildObserverConstellationLines(api.CONSTELLATIONS_BY_CULTURE[culture], api.CATALOG, latitude, 116.4, new Date(baseTime), 50));
    }
  }
  return results;
}

const baseTime = Date.parse('2026-09-30T12:00:00Z');
const hierarchies = new WeakMap();
function hierarchy(api) {
  if (hierarchies.has(api)) return hierarchies.get(api);
  const root = new THREE.Group();
  let parent = root;
  for (let i = 0; i < 4; i++) {
    const child = new THREE.Group();
    parent.add(child); parent = child;
  }
  const count = api.buildCelestialConstellationLines(api.CONSTELLATIONS_BY_CULTURE.chinese, api.CATALOG, 10).length
    + api.buildCelestialStarRenderData(api.CATALOG, 10, 1.04, 'chinese', 'zh-CN').filter((star) => star.label).length + 12;
  const leaves = Array.from({ length: count }, (_, i) => {
    const object = new THREE.Object3D();
    object.position.set(Math.sin(i), Math.cos(i), i * 0.01);
    parent.add(object);
    return object;
  });
  const value = { root, leaves };
  hierarchies.set(api, value);
  return value;
}
const workloads = [
  { name: 'Space horizon / shared world matrices', count: 100, run(api, index) {
    const { root, leaves } = hierarchy(api);
    root.rotation.y = index * 0.001;
    for (const leaf of leaves) { api.updateWorldMatrixForFrame(leaf, index); checksum += leaf.matrixWorld.elements[13]; }
  } },
  { name: 'projection / 10,000 points', count: 5, run(api, index) {
    const date = new Date(baseTime + index * 1000);
    for (let i = 0; i < 10000; i++) checksum += api.projectEquatorialCoordinate(i * 0.01, 0.4, 40, 116.4, date, 50).observerPosition[0];
  } },
  { name: 'annual trail / repeated year (361 samples)', count: 40, run(api) { checksum += api.buildAnnualSunEquatorialSamples(2026)[100].ra; } },
  { name: 'annual trail / cold year (361 samples)', count: 8, run(api, index) { checksum += api.buildAnnualSunEquatorialSamples(1800 + index)[100].ra; } },
  { name: 'diurnal path / advancing time (145 samples)', count: 8, run(api, index) {
    checksum += api.buildSunDiurnalArcSamples(new Date(baseTime + index * 137001), 40, 116.4, 10, 145)[0].point.x;
  } },
  { name: 'ecliptic / advancing time (181 samples)', count: 30, run(api, index) {
    checksum += api.buildEclipticSamples(new Date(baseTime + index * 137001), 40, 116.4, 10, 180)[0].point.x;
  } },
  { name: 'body positions / 5 observer changes', count: 20, run(api, index) {
    for (const latitude of [0, 10, 20, 30, 40]) checksum += api.buildProjectedSceneBodies({ currentTime: new Date(baseTime + index * 137001), latitude, longitude: 116.4, isCelestialFrame: false }).sun.activePosition[0];
  } },
  { name: 'Space playback / bodies + 7 markers', count: 40, run(api, index) {
    const date = new Date(baseTime + index * 137001);
    checksum += api.buildProjectedSceneBodies({ currentTime: date, latitude: 40, longitude: 116.4, isCelestialFrame: false }).sun.activePosition[0];
    for (const hour of [-9, -6, -3, 0, 3, 6, 9]) {
      const sampleDate = new Date(date.getTime() + hour * 3600000);
      const sun = api.getSunPosition(sampleDate);
      checksum += api.projectEquatorialCoordinate(sun.ra, sun.dec, 40, 116.4, sampleDate, 10).observerPosition[0];
    }
  } },
  { name: 'observer stars + lines / advancing time', count: 20, run(api, index) {
    const date = new Date(baseTime + index * 137001);
    checksum += api.buildObserverStarRenderData(api.CATALOG, 40, 116.4, date, 50, 1.04, 'chinese', 'zh-CN').length;
    checksum += api.buildObserverConstellationLines(api.CONSTELLATIONS_BY_CULTURE.chinese, api.CATALOG, 40, 116.4, date, 50).length;
  } },
];

try {
  let baseline;
  if (temp) {
    const files = execFileSync('git', ['ls-tree', '-r', '--name-only', baselineRef, '--', 'src', 'package.json'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
    for (const file of files) {
      await mkdir(path.dirname(path.join(temp, file)), { recursive: true });
      await writeFile(path.join(temp, file), execFileSync('git', ['show', `${baselineRef}:${file}`], { cwd: root }));
    }
    await symlink(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
    baseline = await load(temp);
  }
  const current = await load(root);
  const equivalence = baseline ? (compare(fixtures(current), fixtures(baseline)), 'passed (relative tolerance 1e-10)') : 'not requested';
  const rows = [];
  for (const workload of workloads) {
    const timings = { baseline: [], current: [] };
    for (const api of [baseline, current].filter(Boolean)) for (let i = 0; i < 5; i++) workload.run(api, 5000 + i);
    // Alternate measurement order to limit warming/order bias; every sample advances independently.
    for (let round = 0; round < 7; round++) {
      for (const label of round % 2 ? ['current', 'baseline'] : ['baseline', 'current']) {
        const api = label === 'current' ? current : baseline;
        if (!api) continue;
        const start = performance.now();
        for (let i = 0; i < workload.count; i++) workload.run(api, round * workload.count + i);
        timings[label].push((performance.now() - start) / workload.count);
      }
    }
    const median = (values) => values.length ? values.sort((a, b) => a - b)[Math.floor(values.length / 2)] : null;
    const before = median(timings.baseline);
    const after = median(timings.current);
    rows.push({ workload: workload.name, baselineMs: before, currentMs: after, speedup: before ? before / after : null });
  }
  const report = { node: process.version, cpu: cpus()[0]?.model, baseline: baselineRef ?? null, rounds: 7, horizonReaderCount: hierarchy(current).leaves.length,
    statistic: 'median milliseconds per workload invocation', equivalence,
    unchanged: 'All sample counts, stars, colors, sizes, coordinates, line segments and precision retained.',
    intentionalDataCorrections: labelCorrections,
    limitation: 'CPU microbenchmark only; no FPS, startup or GPU claim.', rows, checksum };
  console.log(JSON.stringify(report, null, 2));
  if (args.output) await writeFile(args.output, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await Promise.all(servers.map((server) => server.close()));
  if (temp) await rm(temp, { recursive: true, force: true });
}
