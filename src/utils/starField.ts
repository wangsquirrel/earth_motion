import * as THREE from 'three';
import {
  equatorialToCartesian,
  equatorialToHorizontal,
  horizontalToCartesian,
} from './astronomy';
import { getStarDisplayName, type Constellation, type SkyCulture, type StarData } from './stars';

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

  return canonicalStarIndex;
}

export function buildCelestialStarRenderData(
  catalog: StarData[],
  sphereRadius: number,
  labelRadiusScale: number,
  culture: SkyCulture
): RenderableStar[] {
  return catalog.map((star) => {
    const position = new THREE.Vector3(
      ...equatorialToCartesian(starRaToRadians(star), starDecToRadians(star), sphereRadius)
    );
    const labelPosition = scalePoint(position, sphereRadius, labelRadiusScale);

    return {
      renderKey: buildRenderableStarKey(star),
      id: star.id,
      label: getStarDisplayName(star, culture),
      color: star.color,
      position: position.toArray() as [number, number, number],
      labelPosition: labelPosition.toArray() as [number, number, number],
      size: starSize(star),
    };
  });
}

export function buildObserverStarRenderData(
  catalog: StarData[],
  latitude: number,
  date: Date,
  sphereRadius: number,
  labelRadiusScale: number,
  culture: SkyCulture
): RenderableStar[] {
  return catalog.flatMap((star) => {
    const { azimuth, altitude } = equatorialToHorizontal(
      starRaToRadians(star),
      starDecToRadians(star),
      latitude,
      0,
      date
    );

    if (altitude < 0) {
      return [];
    }

    const position = new THREE.Vector3(...horizontalToCartesian(azimuth, altitude, sphereRadius));
    const labelPosition = scalePoint(position, sphereRadius, labelRadiusScale);

    return [{
      renderKey: buildRenderableStarKey(star),
      id: star.id,
      label: getStarDisplayName(star, culture),
      color: star.color,
      position: position.toArray() as [number, number, number],
      labelPosition: labelPosition.toArray() as [number, number, number],
      size: starSize(star),
    }];
  });
}

export function buildCelestialConstellationLines(
  constellations: Constellation[],
  catalog: StarData[],
  sphereRadius: number
): RenderableConstellationLine[] {
  const starIndex = buildConstellationStarIndex(catalog);

  return constellations.flatMap((constellation) =>
    constellation.lines.flatMap((line) => {
      const fromStar = starIndex.get(line.from);
      const toStar = starIndex.get(line.to);

      if (!fromStar || !toStar) {
        return [];
      }

      return [{
        constellationId: constellation.id,
        points: [
          new THREE.Vector3(...equatorialToCartesian(starRaToRadians(fromStar), starDecToRadians(fromStar), sphereRadius)),
          new THREE.Vector3(...equatorialToCartesian(starRaToRadians(toStar), starDecToRadians(toStar), sphereRadius)),
        ] as [THREE.Vector3, THREE.Vector3],
      }];
    })
  );
}

export function buildObserverConstellationLines(
  constellations: Constellation[],
  catalog: StarData[],
  latitude: number,
  date: Date,
  sphereRadius: number
): RenderableConstellationLine[] {
  const starIndex = buildConstellationStarIndex(catalog);

  return constellations.flatMap((constellation) =>
    constellation.lines.flatMap((line) => {
      const fromStar = starIndex.get(line.from);
      const toStar = starIndex.get(line.to);

      if (!fromStar || !toStar) {
        return [];
      }

      const fromHorizontal = equatorialToHorizontal(
        starRaToRadians(fromStar),
        starDecToRadians(fromStar),
        latitude,
        0,
        date
      );
      const toHorizontal = equatorialToHorizontal(
        starRaToRadians(toStar),
        starDecToRadians(toStar),
        latitude,
        0,
        date
      );

      if (fromHorizontal.altitude < 0 || toHorizontal.altitude < 0) {
        return [];
      }

      return [{
        constellationId: constellation.id,
        points: [
          new THREE.Vector3(...horizontalToCartesian(fromHorizontal.azimuth, fromHorizontal.altitude, sphereRadius)),
          new THREE.Vector3(...horizontalToCartesian(toHorizontal.azimuth, toHorizontal.altitude, sphereRadius)),
        ] as [THREE.Vector3, THREE.Vector3],
      }];
    })
  );
}
