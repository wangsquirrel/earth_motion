import { useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Line2 } from 'three-stdlib';
import type { Vector3 } from 'three';
import { CONSTELLATION_LINE_COLOR } from '../SpaceView.constants';
import { ABOVE_HORIZON_PLANES } from './horizon.constants';

/** Clip crossing segments, and skip drawing segments entirely below the horizon. */
export default function HorizonConstellationLine({ points, clipToHorizon }: {
  points: [Vector3, Vector3];
  clipToHorizon: boolean;
}) {
  const line = useRef<Line2>(null);
  useFrame(() => {
    if (!line.current) return;
    if (!clipToHorizon) {
      line.current.visible = true;
      return;
    }
    line.current.updateWorldMatrix(true, false);
    const e = line.current.matrixWorld.elements;
    line.current.visible = points.some((p) => e[1] * p.x + e[5] * p.y + e[9] * p.z + e[13] >= 0);
  });
  return <Line ref={line} points={points} color={CONSTELLATION_LINE_COLOR} lineWidth={0.7}
    transparent opacity={0.45} dashed dashSize={0.2} gapSize={0.15}
    clippingPlanes={clipToHorizon ? ABOVE_HORIZON_PLANES : null} />;
}
