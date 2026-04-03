import * as THREE from 'three';
import { equatorialToHorizontal, horizontalToCartesian } from './astronomy';
import { getSunPosition } from './ephemeris';

const HALF_DAY_MS = 12 * 60 * 60 * 1000;

export interface VisibilitySample {
  point: THREE.Vector3;
  isVisible: boolean;
}

function getDiurnalSampleDate(baseDate: Date, normalizedOffset: number) {
  return new Date(baseDate.getTime() + normalizedOffset * HALF_DAY_MS);
}

export function splitPointSegments(
  samples: VisibilitySample[],
  isVisible: boolean
) {
  const segments: THREE.Vector3[][] = [];
  let currentSegment: THREE.Vector3[] = [];

  samples.forEach((sample) => {
    if (sample.isVisible === isVisible) {
      currentSegment.push(sample.point);
      return;
    }

    if (currentSegment.length > 1) {
      segments.push(currentSegment);
    }
    currentSegment = [];
  });

  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}

export function buildSunDiurnalArcSamples(
  currentTime: Date,
  latitude: number,
  radius: number,
  sampleCount: number
): VisibilitySample[] {
  return Array.from({ length: sampleCount }).map((_, index) => {
    const normalizedOffset = (index / (sampleCount - 1)) * 2 - 1;
    const sampleDate = getDiurnalSampleDate(currentTime, normalizedOffset);
    const { ra, dec } = getSunPosition(sampleDate);
    const { azimuth, altitude } = equatorialToHorizontal(ra, dec, latitude, 0, sampleDate);

    return {
      point: new THREE.Vector3(...horizontalToCartesian(azimuth, altitude, radius)),
      isVisible: altitude >= 0,
    };
  });
}
