import * as THREE from 'three';
import { equatorialToHorizontal, horizontalToCartesian } from './astronomy';

export interface ObserverGridSample {
  point: THREE.Vector3;
  isVisible: boolean;
}

export function buildObserverDeclinationGridSamples(
  radius: number,
  declinationDegrees: number,
  latitude: number,
  date: Date,
  sampleCount: number
): ObserverGridSample[] {
  const declination = (declinationDegrees * Math.PI) / 180;

  return Array.from({ length: sampleCount }).map((_, index) => {
    const ra = (index / (sampleCount - 1)) * Math.PI * 2;
    const { azimuth, altitude } = equatorialToHorizontal(ra, declination, latitude, 0, date);

    return {
      point: new THREE.Vector3(...horizontalToCartesian(azimuth, altitude, radius)),
      isVisible: altitude >= 0,
    };
  });
}

export function buildObserverHourGridSamples(
  radius: number,
  raHours: number,
  latitude: number,
  date: Date,
  sampleCount: number
): ObserverGridSample[] {
  const ra = (raHours / 24) * Math.PI * 2;

  return Array.from({ length: sampleCount }).map((_, index) => {
    const dec = (((index / (sampleCount - 1)) * 180) - 90) * (Math.PI / 180);
    const { azimuth, altitude } = equatorialToHorizontal(ra, dec, latitude, 0, date);

    return {
      point: new THREE.Vector3(...horizontalToCartesian(azimuth, altitude, radius)),
      isVisible: altitude >= 0,
    };
  });
}
