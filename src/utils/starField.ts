import * as THREE from 'three';
import {
  equatorialToCartesian,
  getObserverRotation,
  rotateCelestialToObserver,
} from './astronomy';
import { getStarDisplayName, type Constellation, type SkyCulture, type StarData } from './stars';
import type { AppLanguage } from './i18n';
import { measurePerf } from './perf';
import { BoundedCache } from './boundedCache';

export interface RenderableStar {
  renderKey: string;
  id: string;
  label: string;
  color: string;
  position: [number, number, number];
  labelPosition: [number, number, number];
  size: number;
}

export interface RenderableConstellationLine {
  constellationId: string;
  points: [THREE.Vector3, THREE.Vector3];
}

// Catalog/constellation arrays are immutable inputs. Identity avoids collisions between
// equal-sized catalogs and same-ID constellations, while WeakMaps allow old data to collect.
const celestialStarRenderDataCache = new WeakMap<StarData[], BoundedCache<string, RenderableStar[]>>();
const celestialConstellationLinesCache = new WeakMap<StarData[], WeakMap<Constellation[], BoundedCache<number, RenderableConstellationLine[]>>>();
const canonicalStarIndexCache = new WeakMap<StarData[], Map<string, StarData>>();
const starCoordinateCache = new WeakMap<StarData, [number, number]>();

function starCoordinates(star: StarData): [number, number] {
  let coordinate = starCoordinateCache.get(star);
  if (!coordinate) {
    coordinate = [starRaToRadians(star), starDecToRadians(star)];
    starCoordinateCache.set(star, coordinate);
  }
  return coordinate;
}

function scalePoint(point: THREE.Vector3, sphereRadius: number, radiusScale: number) {
  return point.clone().normalize().multiplyScalar(sphereRadius * radiusScale);
}

function starRaToRadians(star: StarData) {
  return (((star.raHours + star.raMinutes / 60 + star.raSeconds / 3600) * 15) * Math.PI) / 180;
}

function starDecToRadians(star: StarData) {
  const hasNegativeDegrees = star.decDegrees < 0 || Object.is(star.decDegrees, -0);
  const hasArcComponent = star.decMinutes > 0 || star.decSeconds > 0;
  const sign = hasNegativeDegrees || (star.decDegrees === 0 && hasArcComponent && Object.is(star.decDegrees, -0))
    ? -1
    : 1;
  const absoluteDegrees = Math.abs(star.decDegrees) + star.decMinutes / 60 + star.decSeconds / 3600;
  return (sign * absoluteDegrees * Math.PI) / 180;
}

function starSize(star: StarData) {
  return star.id === 'star:bayer:alpha-umi'
    ? 0.10
    : Math.max(0.06, 0.11 - (star.magnitude + 1.5) * 0.012);
}

function buildConstellationStarIndex(catalog: StarData[]) {
  return buildCanonicalStarIndex(catalog);
}

function buildRenderableStarKey(star: StarData) {
  return star.id;
}

function mergeStarNames(catalog: StarData[], id: string) {
  const mergedNames: StarData['names'] = {};
  const valuesByKey = new Map<keyof StarData['names'], string[]>();
  const nameKeys: (keyof StarData['names'])[] = [
    'chineseAsterism',
    'westernProper',
    'westernDesignation',
    'westernSystemName',
  ];

  nameKeys.forEach((key) => {
    const values = [...new Set(
      catalog
        .map((star) => star.names[key])
        .filter((value): value is string => Boolean(value))
    )];

    if (values.length > 0) {
      valuesByKey.set(key, values);
      mergedNames[key] = values[0];
    }
  });

  if (id.startsWith('star:custom:')) {
    const token = id.slice('star:custom:'.length);
    const chineseNames = valuesByKey.get('chineseAsterism');
    if (chineseNames?.includes(token)) {
      mergedNames.chineseAsterism = token;
    }
  }

  return mergedNames;
}

function buildCanonicalStarIndex(catalog: StarData[]) {
  const cached = canonicalStarIndexCache.get(catalog);
  if (cached) return cached;
  const groupedStars = new Map<string, StarData[]>();

  catalog.forEach((star) => {
    const starsWithSameId = groupedStars.get(star.id);
    if (starsWithSameId) {
      starsWithSameId.push(star);
      return;
    }
    groupedStars.set(star.id, [star]);
  });

  const canonicalStarIndex = new Map<string, StarData>();
  groupedStars.forEach((starsWithSameId, id) => {
    const [baseStar] = starsWithSameId;
    canonicalStarIndex.set(id, {
      ...baseStar,
      names: mergeStarNames(starsWithSameId, id),
    });
  });

  canonicalStarIndexCache.set(catalog, canonicalStarIndex);
  return canonicalStarIndex;
}

export function buildCelestialStarRenderData(
  catalog: StarData[],
  sphereRadius: number,
  labelRadiusScale: number,
  culture: SkyCulture,
  language: AppLanguage
): RenderableStar[] {
  const cacheKey = [
    sphereRadius,
    labelRadiusScale,
    culture,
    language,
  ].join('|');
  let cache = celestialStarRenderDataCache.get(catalog);
  if (!cache) {
    cache = new BoundedCache<string, RenderableStar[]>(16);
    celestialStarRenderDataCache.set(catalog, cache);
  }
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const renderData = measurePerf('buildCelestialStarRenderData', () => catalog.map((star) => {
    const label = getStarDisplayName(star, culture, language);
    const position = new THREE.Vector3(
      ...equatorialToCartesian(...starCoordinates(star), sphereRadius)
    );
    const labelPosition = label
      ? scalePoint(position, sphereRadius, labelRadiusScale)
      : position;

    return {
      renderKey: buildRenderableStarKey(star),
      id: star.id,
      label,
      color: star.color,
      position: position.toArray() as [number, number, number],
      labelPosition: labelPosition.toArray() as [number, number, number],
      size: starSize(star),
    };
  }), { thresholdMs: 3 });

  cache.set(cacheKey, renderData);
  return renderData;
}

export function buildObserverStarRenderData(
  catalog: StarData[],
  latitude: number,
  longitude: number,
  date: Date,
  sphereRadius: number,
  labelRadiusScale: number,
  culture: SkyCulture,
  language: AppLanguage
): RenderableStar[] {
  const rotation = getObserverRotation(latitude, longitude, date);
  const stars = buildCelestialStarRenderData(catalog, sphereRadius, labelRadiusScale, culture, language);
  const visibleStars: RenderableStar[] = [];
  for (const star of stars) {
    const position = rotateCelestialToObserver(star.position, rotation);
    if (position[1] < 0) continue;
    visibleStars.push({
      ...star,
      position,
      labelPosition: rotateCelestialToObserver(star.labelPosition, rotation),
    });
  }
  return visibleStars;
}

export function buildCelestialConstellationLines(
  constellations: Constellation[],
  catalog: StarData[],
  sphereRadius: number
): RenderableConstellationLine[] {
  let catalogs = celestialConstellationLinesCache.get(catalog);
  if (!catalogs) {
    catalogs = new WeakMap();
    celestialConstellationLinesCache.set(catalog, catalogs);
  }
  let cache = catalogs.get(constellations);
  if (!cache) {
    cache = new BoundedCache<number, RenderableConstellationLine[]>(4);
    catalogs.set(constellations, cache);
  }
  const cached = cache.get(sphereRadius);
  if (cached) return cached;

  const starIndex = buildConstellationStarIndex(catalog);
  const positions = new Map<string, THREE.Vector3>();
  const positionFor = (star: StarData) => {
    let point = positions.get(star.id);
    if (!point) {
      point = new THREE.Vector3(...equatorialToCartesian(...starCoordinates(star), sphereRadius));
      positions.set(star.id, point);
    }
    return point;
  };

  const lines = measurePerf('buildCelestialConstellationLines', () => constellations.flatMap((constellation) =>
    constellation.lines.flatMap((line) => {
      const fromStar = starIndex.get(line.from);
      const toStar = starIndex.get(line.to);

      if (!fromStar || !toStar) {
        return [];
      }

      return [{
        constellationId: constellation.id,
        points: [
          positionFor(fromStar),
          positionFor(toStar),
        ] as [THREE.Vector3, THREE.Vector3],
      }];
    })
  ), { thresholdMs: 3 });

  cache.set(sphereRadius, lines);
  return lines;
}

export function buildObserverConstellationLines(
  constellations: Constellation[],
  catalog: StarData[],
  latitude: number,
  longitude: number,
  date: Date,
  sphereRadius: number
): RenderableConstellationLine[] {
  const rotation = getObserverRotation(latitude, longitude, date);
  const lines = buildCelestialConstellationLines(constellations, catalog, sphereRadius);
  const projectedPoints = new Map<THREE.Vector3, THREE.Vector3>();
  const project = (point: THREE.Vector3) => {
    let projected = projectedPoints.get(point);
    if (!projected) {
      projected = new THREE.Vector3(...rotateCelestialToObserver([point.x, point.y, point.z], rotation));
      projectedPoints.set(point, projected);
    }
    return projected;
  };
  const visibleLines: RenderableConstellationLine[] = [];
  for (const line of lines) {
    const from = project(line.points[0]);
    const to = project(line.points[1]);
    if (from.y < 0 || to.y < 0) continue;
    visibleLines.push({ constellationId: line.constellationId, points: [from, to] });
  }
  return visibleLines;
}
