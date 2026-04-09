import * as THREE from 'three';
import { eclipticToEquatorial, equatorialToHorizontal, horizontalToCartesian } from './astronomy';
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

  const getHorizonIntersection = (a: THREE.Vector3, b: THREE.Vector3) => {
    if (a.y === 0) return a.clone();
    if (b.y === 0) return b.clone();

    const denom = a.y - b.y;
    if (denom === 0) {
      return new THREE.Vector3(a.x, 0, a.z).normalize().multiplyScalar(a.length());
    }

    const t = a.y / denom;
    const p = a.clone().lerp(b, t);
    const radius = a.length();
    const onPlane = new THREE.Vector3(p.x, 0, p.z);

    if (onPlane.lengthSq() === 0) {
      return new THREE.Vector3(radius, 0, 0);
    }

    return onPlane.normalize().multiplyScalar(radius);
  };

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const prev = i > 0 ? samples[i - 1] : null;

    if (prev && prev.isVisible !== sample.isVisible) {
      const intersection = getHorizonIntersection(prev.point, sample.point);

      if (prev.isVisible === isVisible && currentSegment.length > 0) {
        currentSegment.push(intersection);
        if (currentSegment.length > 1) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }

      if (sample.isVisible === isVisible) {
        currentSegment = [intersection];
      }
    }

    if (sample.isVisible === isVisible) {
      currentSegment.push(sample.point);
    }
  }

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

// Build the true ecliptic great circle in the local horizon frame at the current time.
export function buildEclipticSamples(
  baseDate: Date,
  latitude: number,
  radius: number,
  sampleCount: number
): VisibilitySample[] {
  return Array.from({ length: sampleCount + 1 }).map((_, index) => {
    const eclipticLongitude = (index / sampleCount) * Math.PI * 2;
    const { ra, dec } = eclipticToEquatorial(eclipticLongitude, 0, baseDate);
    const { azimuth, altitude } = equatorialToHorizontal(ra, dec, latitude, 0, baseDate);

    return {
      point: new THREE.Vector3(...horizontalToCartesian(azimuth, altitude, radius)),
      isVisible: altitude >= 0,
    };
  });
}
