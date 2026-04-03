import * as THREE from 'three';
import type { RenderableConstellationLine, RenderableStar } from '../../utils/starField';

export interface GridSegmentGroup {
  key: string;
  segments: THREE.Vector3[][];
}

export interface MonthLabelData {
  label: string;
  position: [number, number, number];
  isVisible?: boolean;
}

export interface EquatorialCoordinateSample {
  ra: number;
  dec: number;
}

export interface MonthlyEquatorialLabelSample extends EquatorialCoordinateSample {
  label: string;
}

export interface ProjectedFramePosition {
  celestialPosition: [number, number, number];
  observerPosition: [number, number, number];
  activePosition: [number, number, number];
  isVisible: boolean;
}

export interface ProjectedPlanetPosition extends ProjectedFramePosition {
  name: string;
  color: string;
}

export interface AnnualProjectionLayerData {
  fullPath?: THREE.Vector3[];
  fullPathDashed?: boolean;
  hiddenSegments: THREE.Vector3[][];
  visibleSegments: THREE.Vector3[][];
  months: MonthLabelData[];
}

export interface VisiblePlanetRenderData {
  name: string;
  color: string;
  position: [number, number, number];
}

export interface ProjectedSceneBodies {
  sun: ProjectedFramePosition;
  moon: ProjectedFramePosition;
  planets: ProjectedPlanetPosition[];
}

export interface BodyRenderData {
  sun: {
    position: [number, number, number];
    observerRayPoint: [number, number, number];
    isVisible: boolean;
    isAboveHorizon: boolean;
  };
  moon: {
    position: [number, number, number];
    isVisible: boolean;
  };
  planets: VisiblePlanetRenderData[];
}

export interface ReferenceLayerData {
  declinationGrid: GridSegmentGroup[];
  hourGrid: GridSegmentGroup[];
  equatorSegments: THREE.Vector3[][];
  equatorLabelPosition: [number, number, number] | null;
}

export interface CelestialObserverOverlayData {
  horizonPoints: [number, number, number][];
  zenithPosition: [number, number, number];
}

export interface StarFieldLayerData {
  stars: RenderableStar[];
  constellationLines: RenderableConstellationLine[];
}

export interface AnnualLayerRenderData extends AnnualProjectionLayerData {
  prefix: 'observer' | 'celestial';
}

export interface ObserverSceneData {
  referenceLayer: ReferenceLayerData;
  starField: StarFieldLayerData;
  annualLayer: AnnualLayerRenderData;
  diurnalLayer: {
    hiddenSegments: THREE.Vector3[][];
    visibleSegments: THREE.Vector3[][];
    markerPoints: THREE.Vector3[];
    rayPoint: [number, number, number] | null;
  };
}

export interface CelestialSceneData {
  referenceLayer: ReferenceLayerData;
  starField: StarFieldLayerData;
  annualLayer: AnnualLayerRenderData;
  observerOverlay: CelestialObserverOverlayData & {
    emphasis: number;
  };
}
