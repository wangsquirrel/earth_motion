import * as THREE from 'three';
import { getObserverRotation } from '../../../utils/astronomy';
import { POINT_COUNT, SPHERE_RADIUS } from '../SpaceView.constants';

const observerBasisMatrix = new THREE.Matrix4();

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

export function buildObserverFrameBasis(latitude: number, longitude: number, date: Date) {
  const quaternion = buildObserverFrameQuaternion(latitude, longitude, date);
  return {
    east: new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion),
    up: new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion),
    south: new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion),
  };
}

export function buildObserverFrameQuaternion(latitude: number, longitude: number, date: Date) {
  return setObserverFrameQuaternion(new THREE.Quaternion(), latitude, longitude, date);
}

export function buildCelestialToObserverQuaternion(latitude: number, longitude: number, date: Date) {
  return buildObserverFrameQuaternion(latitude, longitude, date).invert();
}

export function setObserverFrameQuaternion(
  target: THREE.Quaternion,
  latitude: number,
  longitude: number,
  date: Date
) {
  return setCelestialToObserverQuaternion(target, latitude, longitude, date).invert();
}

export function setCelestialToObserverQuaternion(
  target: THREE.Quaternion,
  latitude: number,
  longitude: number,
  date: Date
) {
  const r = getObserverRotation(latitude, longitude, date);
  observerBasisMatrix.set(
    r[0], r[1], r[2], 0,
    r[3], r[4], r[5], 0,
    r[6], r[7], r[8], 0,
    0, 0, 0, 1
  );
  return target.setFromRotationMatrix(observerBasisMatrix);
}
