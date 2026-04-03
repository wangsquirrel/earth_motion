import {
  equatorialToCartesian,
  equatorialToHorizontal,
  horizontalToCartesian,
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
  observerDate: Date,
  radius: number
): ProjectedCoordinate {
  const celestialPosition = equatorialToCartesian(ra, dec, radius);
  const { azimuth, altitude } = equatorialToHorizontal(ra, dec, latitude, 0, observerDate);
  const observerPosition = horizontalToCartesian(azimuth, altitude, radius);

  return {
    celestialPosition,
    observerPosition,
    azimuth,
    altitude,
    isVisible: altitude >= 0,
  };
}
