import * as THREE from 'three';
import {
  equatorialToCartesian,
  equatorialToHorizontal,
  horizontalToCartesian,
} from '../../../utils/astronomy';
import {
  getMoonPosition,
  getPlanetPosition,
  getSunPosition,
  PLANET_BODIES,
} from '../../../utils/ephemeris';
import { projectEquatorialCoordinate } from '../../../utils/skyProjection';
import {
  buildObserverDeclinationGridSamples,
  buildObserverHourGridSamples,
} from '../../../utils/observerGrid';
import { buildSunDiurnalArcSamples, splitPointSegments } from '../../../utils/sunPaths';
import {
  buildCelestialConstellationLines,
  buildCelestialStarRenderData,
  buildObserverConstellationLines,
  buildObserverStarRenderData,
} from '../../../utils/starField';
import type { Constellation, SkyCulture, StarData } from '../../../utils/stars';
import {
  DIURNAL_MARKER_INTERVAL,
  DIURNAL_SAMPLE_COUNT,
  HORIZON_LABEL_RADIUS,
  HORIZON_SAMPLE_COUNT,
  LOW_SPEED_TIME_THRESHOLD,
  MONTH_LABEL_RADIUS_SCALE,
  MONTH_LABELS,
  SPHERE_RADIUS,
  STAR_LABEL_RADIUS_SCALE,
  YEAR_MS,
} from '../SpaceView.constants';
import { scalePoint } from './geometry';
import type {
  AnnualProjectionLayerData,
  BodyRenderData,
  CelestialObserverOverlayData,
  CelestialSceneData,
  EquatorialCoordinateSample,
  MonthLabelData,
  MonthlyEquatorialLabelSample,
  ObserverSceneData,
  ProjectedFramePosition,
  ProjectedPlanetPosition,
  ProjectedSceneBodies,
  ReferenceLayerData,
  StarFieldLayerData,
  VisiblePlanetRenderData,
} from '../spaceView.types';

export function buildAnnualSunEquatorialSamples() {
  const startDate = new Date('2024-03-20T00:00:00Z');

  return Array.from({ length: 361 }).map((_, index) => {
    const sampleDate = new Date(startDate.getTime() + (index / 360) * YEAR_MS);
    return getSunPosition(sampleDate);
  });
}

function projectEquatorialSamplesToObserverFrame(
  samples: EquatorialCoordinateSample[],
  latitude: number,
  observerDate: Date,
  radius: number
) {
  return samples.map(({ ra, dec }) => {
    const { azimuth, altitude } = equatorialToHorizontal(ra, dec, latitude, 0, observerDate);
    return {
      point: new THREE.Vector3(...horizontalToCartesian(azimuth, altitude, radius)),
      isVisible: altitude >= 0,
    };
  });
}

export function buildMonthlySunEquatorialLabelSamples(year: number): MonthlyEquatorialLabelSample[] {
  return MONTH_LABELS.map((label, monthIndex) => {
    const sampleDate = new Date(Date.UTC(year, monthIndex, 15, 12, 0, 0));
    const { ra, dec } = getSunPosition(sampleDate);
    return { label, ra, dec };
  });
}

export function projectEquatorialCoordinateToFrame(
  ra: number,
  dec: number,
  latitude: number,
  observerDate: Date,
  radius: number,
  isCelestialFrame: boolean
): ProjectedFramePosition {
  const projection = projectEquatorialCoordinate(ra, dec, latitude, observerDate, radius);

  return {
    celestialPosition: projection.celestialPosition,
    observerPosition: projection.observerPosition,
    activePosition: isCelestialFrame ? projection.celestialPosition : projection.observerPosition,
    isVisible: projection.isVisible,
  };
}

function projectMonthLabelsToObserverFrame(
  samples: MonthlyEquatorialLabelSample[],
  latitude: number,
  observerDate: Date
): MonthLabelData[] {
  return samples.map(({ label, ra, dec }) => {
    const { azimuth, altitude } = equatorialToHorizontal(ra, dec, latitude, 0, observerDate);
    const point = new THREE.Vector3(...horizontalToCartesian(azimuth, altitude, SPHERE_RADIUS));

    return {
      label,
      position: scalePoint(point, MONTH_LABEL_RADIUS_SCALE).toArray() as [number, number, number],
      isVisible: altitude >= 0,
    };
  });
}

export function buildAnnualProjectionLayerData({
  samples,
  monthLabels,
  latitude,
  observerDate,
  isCelestialFrame,
}: {
  samples: EquatorialCoordinateSample[];
  monthLabels: MonthlyEquatorialLabelSample[];
  latitude: number;
  observerDate: Date;
  isCelestialFrame: boolean;
}): AnnualProjectionLayerData {
  if (isCelestialFrame) {
    return {
      fullPath: samples.map(({ ra, dec }) => (
        new THREE.Vector3(...equatorialToCartesian(ra, dec, SPHERE_RADIUS))
      )),
      fullPathDashed: true,
      hiddenSegments: [],
      visibleSegments: [],
      months: monthLabels.map(({ label, ra, dec }) => {
        const point = new THREE.Vector3(...equatorialToCartesian(ra, dec, SPHERE_RADIUS));
        return {
          label,
          position: scalePoint(point, MONTH_LABEL_RADIUS_SCALE).toArray() as [number, number, number],
        };
      }),
    };
  }

  const observerPoints = projectEquatorialSamplesToObserverFrame(
    samples,
    latitude,
    observerDate,
    SPHERE_RADIUS
  );

  return {
    fullPath: undefined,
    fullPathDashed: false,
    hiddenSegments: splitPointSegments(observerPoints, false),
    visibleSegments: splitPointSegments(observerPoints, true),
    months: projectMonthLabelsToObserverFrame(monthLabels, latitude, observerDate),
  };
}

export function buildObserverReferenceLayerData(
  latitude: number,
  date: Date
): ReferenceLayerData {
  const declinationGrid = [-60, -30, 30, 60].map((declination) => ({
    key: `dec-${declination}`,
    segments: splitPointSegments(
      buildObserverDeclinationGridSamples(SPHERE_RADIUS, declination, latitude, date, 181),
      true
    ),
  }));
  const equatorSegments = splitPointSegments(
    buildObserverDeclinationGridSamples(SPHERE_RADIUS, 0, latitude, date, 181),
    true
  );
  const hourGrid = [0, 3, 6, 9, 12, 15, 18, 21].map((hour) => ({
    key: `hour-${hour}`,
    segments: splitPointSegments(
      buildObserverHourGridSamples(SPHERE_RADIUS, hour, latitude, date, 181),
      true
    ),
  }));
  const longestSegment = equatorSegments.reduce<THREE.Vector3[] | null>((longest, segment) => {
    if (!longest || segment.length > longest.length) {
      return segment;
    }
    return longest;
  }, null);

  return {
    declinationGrid,
    hourGrid,
    equatorSegments,
    equatorLabelPosition: longestSegment && longestSegment.length > 0
      ? scalePoint(longestSegment[Math.floor(longestSegment.length / 2)], 1.04).toArray() as [number, number, number]
      : null,
  };
}

export function buildCelestialReferenceLayerData(): ReferenceLayerData {
  return {
    declinationGrid: [-60, -30, 30, 60].flatMap((declination) => (
      buildEquatorialDeclinationGridSegments(SPHERE_RADIUS, declination)
    )),
    equatorSegments: buildEquatorialDeclinationGridSegments(SPHERE_RADIUS, 0)[0].segments,
    hourGrid: [0, 3, 6, 9, 12, 15, 18, 21].flatMap((hour) => (
      buildEquatorialHourGridSegments(SPHERE_RADIUS, hour)
    )),
    equatorLabelPosition: (() => {
      const point = new THREE.Vector3(...equatorialToCartesian((330 * Math.PI) / 180, 0, SPHERE_RADIUS));
      return scalePoint(point, 1.06).toArray() as [number, number, number];
    })(),
  };
}

export function buildCelestialObserverOverlayData(
  observerFrameQuaternion: THREE.Quaternion
): CelestialObserverOverlayData {
  const horizonPoints = Array.from({ length: HORIZON_SAMPLE_COUNT }).map((_, index) => {
    const azimuth = (index / (HORIZON_SAMPLE_COUNT - 1)) * Math.PI * 2;
    const localPoint = new THREE.Vector3(...horizontalToCartesian(azimuth, 0, SPHERE_RADIUS));
    return localPoint.applyQuaternion(observerFrameQuaternion).toArray() as [number, number, number];
  });
  const localZenith = new THREE.Vector3(0, SPHERE_RADIUS, 0);

  return {
    horizonPoints,
    zenithPosition: localZenith.applyQuaternion(observerFrameQuaternion).toArray() as [number, number, number],
  };
}

export function buildObserverAxisPoints(latitude: number): [number, number, number][] {
  const northPole = horizontalToCartesian(0, (latitude * Math.PI) / 180, SPHERE_RADIUS);
  const southPole = horizontalToCartesian(Math.PI, (-latitude * Math.PI) / 180, SPHERE_RADIUS);
  return [southPole, northPole] as [number, number, number][];
}

export function buildHorizonLabels() {
  return [
    { label: '北', position: [0, 0.2, -HORIZON_LABEL_RADIUS] as [number, number, number] },
    { label: '东', position: [HORIZON_LABEL_RADIUS, 0.2, 0] as [number, number, number] },
    { label: '南', position: [0, 0.2, HORIZON_LABEL_RADIUS] as [number, number, number] },
    { label: '西', position: [-HORIZON_LABEL_RADIUS, 0.2, 0] as [number, number, number] },
  ];
}

export function buildCelestialObserverOverlayEmphasis(isPlaying: boolean, timeSpeed: number) {
  if (!isPlaying || timeSpeed <= LOW_SPEED_TIME_THRESHOLD) {
    return 1;
  }
  return 0.35;
}

export function buildProjectedSceneBodies({
  currentTime,
  latitude,
  isCelestialFrame,
}: {
  currentTime: Date;
  latitude: number;
  isCelestialFrame: boolean;
}): ProjectedSceneBodies {
  const sun = getSunPosition(currentTime);
  const moon = getMoonPosition(currentTime);
  const projectedSun = projectEquatorialCoordinateToFrame(
    sun.ra,
    sun.dec,
    latitude,
    currentTime,
    SPHERE_RADIUS,
    isCelestialFrame
  );
  const projectedMoon = projectEquatorialCoordinateToFrame(
    moon.ra,
    moon.dec,
    latitude,
    currentTime,
    SPHERE_RADIUS,
    isCelestialFrame
  );
  const planets = PLANET_BODIES.flatMap((planet) => {
    const position = getPlanetPosition(planet.name, currentTime);
    if (!position) {
      return [];
    }

    return [{
      name: planet.name,
      color: planet.color,
      ...projectEquatorialCoordinateToFrame(
        position.ra,
        position.dec,
        latitude,
        currentTime,
        SPHERE_RADIUS,
        isCelestialFrame
      ),
    }];
  }) as ProjectedPlanetPosition[];

  return {
    sun: projectedSun,
    moon: projectedMoon,
    planets,
  };
}

export function buildBodyRenderData({
  projectedBodies,
  isCelestialFrame,
  showMoon,
  showPlanets,
}: {
  projectedBodies: ProjectedSceneBodies;
  isCelestialFrame: boolean;
  showMoon: boolean;
  showPlanets: boolean;
}): BodyRenderData {
  const visiblePlanets: VisiblePlanetRenderData[] = projectedBodies.planets
    .filter((planet) => isCelestialFrame || planet.isVisible)
    .map((planet) => ({
      name: planet.name,
      color: planet.color,
      position: planet.activePosition,
    }));

  return {
    sun: {
      position: projectedBodies.sun.activePosition,
      observerRayPoint: projectedBodies.sun.observerPosition,
      isVisible: isCelestialFrame || projectedBodies.sun.isVisible,
      isAboveHorizon: projectedBodies.sun.isVisible,
    },
    moon: {
      position: projectedBodies.moon.activePosition,
      isVisible: showMoon && (isCelestialFrame || projectedBodies.moon.isVisible),
    },
    planets: showPlanets ? visiblePlanets : [],
  };
}

export function buildDiurnalLayerData(currentTime: Date, latitude: number): ObserverSceneData['diurnalLayer'] {
  const diurnalArcSamples = buildSunDiurnalArcSamples(
    currentTime,
    latitude,
    SPHERE_RADIUS,
    DIURNAL_SAMPLE_COUNT
  );

  return {
    hiddenSegments: splitPointSegments(diurnalArcSamples, false),
    visibleSegments: splitPointSegments(diurnalArcSamples, true),
    markerPoints: diurnalArcSamples
      .filter((sample, index) => (
        sample.isVisible
        && index > 0
        && index < diurnalArcSamples.length - 1
        && index % DIURNAL_MARKER_INTERVAL === 0
      ))
      .map((sample) => sample.point),
    rayPoint: null,
  };
}

export function buildStarFieldLayerData({
  catalog,
  activeConstellations,
  latitude,
  currentTime,
  skyCulture,
}: {
  catalog: StarData[];
  activeConstellations: Constellation[];
  latitude: number;
  currentTime: Date;
  skyCulture: SkyCulture;
}): {
  celestial: StarFieldLayerData;
  observer: StarFieldLayerData;
} {
  return {
    celestial: {
      stars: buildCelestialStarRenderData(catalog, SPHERE_RADIUS, STAR_LABEL_RADIUS_SCALE, skyCulture),
      constellationLines: buildCelestialConstellationLines(activeConstellations, catalog, SPHERE_RADIUS),
    },
    observer: {
      stars: buildObserverStarRenderData(
        catalog,
        latitude,
        currentTime,
        SPHERE_RADIUS,
        STAR_LABEL_RADIUS_SCALE,
        skyCulture
      ),
      constellationLines: buildObserverConstellationLines(
        activeConstellations,
        catalog,
        latitude,
        currentTime,
        SPHERE_RADIUS
      ),
    },
  };
}

export function buildObserverSceneData({
  referenceLayer,
  starField,
  annualLayer,
  diurnalLayer,
}: {
  referenceLayer: ReferenceLayerData;
  starField: StarFieldLayerData;
  annualLayer: AnnualProjectionLayerData;
  diurnalLayer: ObserverSceneData['diurnalLayer'];
}): ObserverSceneData {
  return {
    referenceLayer,
    starField,
    annualLayer: {
      prefix: 'observer',
      ...annualLayer,
    },
    diurnalLayer,
  };
}

export function buildCelestialSceneData({
  referenceLayer,
  starField,
  annualLayer,
  observerOverlay,
  observerOverlayEmphasis,
}: {
  referenceLayer: ReferenceLayerData;
  starField: StarFieldLayerData;
  annualLayer: AnnualProjectionLayerData;
  observerOverlay: CelestialObserverOverlayData;
  observerOverlayEmphasis: number;
}): CelestialSceneData {
  return {
    referenceLayer,
    starField,
    annualLayer: {
      prefix: 'celestial',
      ...annualLayer,
    },
    observerOverlay: {
      ...observerOverlay,
      emphasis: observerOverlayEmphasis,
    },
  };
}

function buildEquatorialDeclinationGridSegments(
  radius: number,
  declinationDegrees: number
) {
  const declination = (declinationDegrees * Math.PI) / 180;
  const ringRadius = radius * Math.cos(declination);
  const y = radius * Math.sin(declination);

  return [{
    key: `dec-${declinationDegrees}`,
    segments: [Array.from({ length: 181 }).map((_, index) => {
      const ra = (index / 180) * Math.PI * 2;
      return new THREE.Vector3(
        ringRadius * Math.cos(ra),
        y,
        -ringRadius * Math.sin(ra)
      );
    })],
  }];
}

function buildEquatorialHourGridSegments(radius: number, raHours: number) {
  const ra = (raHours / 24) * Math.PI * 2;

  return [{
    key: `hour-${raHours}`,
    segments: [Array.from({ length: 181 }).map((_, index) => {
      const dec = (((index / 180) * 180) - 90) * (Math.PI / 180);
      return new THREE.Vector3(...equatorialToCartesian(ra, dec, radius));
    })],
  }];
}
