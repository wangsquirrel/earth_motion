import { Plane, Vector3 } from 'three';

export const ABOVE_HORIZON_PLANES = [new Plane(new Vector3(0, 1, 0), 0)];
export const BELOW_HORIZON_PLANES = [new Plane(new Vector3(0, -1, 0), 0)];
