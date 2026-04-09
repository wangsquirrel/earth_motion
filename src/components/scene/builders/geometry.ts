import * as THREE from 'three';
import { getGMST } from '../../../utils/astronomy';
import { POINT_COUNT, SPHERE_RADIUS } from '../SpaceView.constants';

export function buildCirclePoints(radius: number) {
  return Array.from({ length: POINT_COUNT }).map((_, i) => [
    radius * Math.cos((i * Math.PI * 2) / (POINT_COUNT - 1)),
    0,
    radius * Math.sin((i * Math.PI * 2) / (POINT_COUNT - 1)),
  ] as [number, number, number]);
}

export function scalePoint(point: THREE.Vector3, radiusScale: number) {
  return point.clone().normalize().multiplyScalar(SPHERE_RADIUS * radiusScale);
}

export function buildObserverFrameBasis(latitude: number, date: Date) {
  const latRad = (latitude * Math.PI) / 180;
  const lst = getGMST(date);

  const east = new THREE.Vector3(
    -Math.sin(lst),
    0,
    -Math.cos(lst)
  );

  const up = new THREE.Vector3(
    Math.cos(latRad) * Math.cos(lst),
    Math.sin(latRad),
    -Math.cos(latRad) * Math.sin(lst)
  );

  const south = new THREE.Vector3(
    Math.sin(latRad) * Math.cos(lst),
    -Math.cos(latRad),
    -Math.sin(latRad) * Math.sin(lst)
  );

  return { east, up, south };
}

export function buildObserverFrameQuaternion(latitude: number, date: Date) {
  const { east, up, south } = buildObserverFrameBasis(latitude, date);
  const basis = new THREE.Matrix4().makeBasis(east, up, south);
  return new THREE.Quaternion().setFromRotationMatrix(basis);
}

export function buildCelestialToObserverQuaternion(latitude: number, date: Date) {
  return buildObserverFrameQuaternion(latitude, date).invert();
}
