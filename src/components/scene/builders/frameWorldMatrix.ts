import type { Object3D } from 'three';

const updatedAncestors = new WeakMap<Object3D, number>();

function updateAncestor(object: Object3D, frame: number) {
  if (updatedAncestors.get(object) === frame) return;
  if (object.parent) updateAncestor(object.parent, frame);
  object.updateWorldMatrix(false, false);
  updatedAncestors.set(object, frame);
}

/**
 * For horizon readers at useFrame priority 0: shared sky/ancestor animation must
 * finish at negative priorities (SpaceView/EarthView already rotate at -1).
 * The leaf is always refreshed, preserving per-label Billboard orientation.
 * Only its stable-for-this-frame ancestors are shared across sibling readers.
 * Use R3F's clock.elapsedTime as the frame token, not the simulation timestamp:
 * paused camera drags still need fresh world matrices.
 */
export function updateWorldMatrixForFrame(object: Object3D, frame: number) {
  if (object.parent) updateAncestor(object.parent, frame);
  object.updateWorldMatrix(false, false);
}
