import { useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Line2 } from 'three-stdlib';
import type { Vector3 } from 'three';
import { CONSTELLATION_LINE_COLOR } from '../SpaceView.constants';
import { ABOVE_HORIZON_PLANES } from './horizon.constants';
import { updateWorldMatrixForFrame } from '../builders/frameWorldMatrix';

/** Clip crossing segments, and skip drawing segments entirely below the horizon. */
export default function HorizonConstellationLine({ points, clipToHorizon }: {
  points: [Vector3, Vector3];
  clipToHorizon: boolean;
}) {
  const line = useRef<Line2>(null);
  useFrame(({ clock }) => {
    if (!line.current) return;
    if (!clipToHorizon) {
      line.current.visible = true;
      return;
    }
    updateWorldMatrixForFrame(line.current, clock.elapsedTime);
    const e = line.current.matrixWorld.elements;
    const [a, b] = points;
    line.current.visible = e[1] * a.x + e[5] * a.y + e[9] * a.z + e[13] >= 0
      || e[1] * b.x + e[5] * b.y + e[9] * b.z + e[13] >= 0;
  });
  return <Line ref={line} points={points} color={CONSTELLATION_LINE_COLOR} lineWidth={0.7}
    transparent opacity={0.45} dashed dashSize={0.2} gapSize={0.15}
    clippingPlanes={clipToHorizon ? ABOVE_HORIZON_PLANES : null} />;
}
