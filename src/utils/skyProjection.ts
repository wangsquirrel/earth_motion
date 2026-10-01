import {
  equatorialToCartesian,
  getObserverRotation,
  rotateCelestialToObserver,
} from './astronomy';

export interface ProjectedCoordinate {
  celestialPosition: [number, number, number];
  observerPosition: [number, number, number];
  azimuth: number;
  altitude: number;
  isVisible: boolean;
}

export function projectEquatorialCoordinate(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  observerDate: Date,
  radius: number
): ProjectedCoordinate {
  const unitPosition = equatorialToCartesian(ra, dec, 1);
  const observerUnit = rotateCelestialToObserver(unitPosition, getObserverRotation(latitude, longitude, observerDate));
  const celestialPosition = [unitPosition[0] * radius, unitPosition[1] * radius, unitPosition[2] * radius] as [number, number, number];
  const observerPosition = [observerUnit[0] * radius, observerUnit[1] * radius, observerUnit[2] * radius] as [number, number, number];
  const horizontalLength = Math.hypot(observerUnit[0], observerUnit[2]);
  const altitude = Math.atan2(observerUnit[1], horizontalLength);
  const azimuth = horizontalLength < 1e-14
    ? 0
    : (Math.atan2(observerUnit[0], -observerUnit[2]) + 2 * Math.PI) % (2 * Math.PI);

  return {
    celestialPosition,
    observerPosition,
    azimuth,
    altitude,
    isVisible: altitude >= 0,
  };
}
