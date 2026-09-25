import { useRef, useState, type ReactNode } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Keep label geometry mounted; only visibility changes when its anchor crosses the horizon. */
export default function HorizonBillboard({ position, clipToHorizon = false, initialVisible = true, children }: {
  position: [number, number, number];
  clipToHorizon?: boolean;
  initialVisible?: boolean;
  children: ReactNode;
}) {
  const [revealed, setRevealed] = useState(initialVisible);
  const group = useRef<THREE.Group>(null);
  const [worldPosition] = useState(() => new THREE.Vector3());
  useFrame(() => {
    if (group.current && clipToHorizon) {
      group.current.getWorldPosition(worldPosition);
      group.current.visible = worldPosition.y >= 0;
      if (group.current.visible && !revealed) setRevealed(true);
    }
  });
  return <Billboard ref={group} position={position} visible={!clipToHorizon}>{(!clipToHorizon || revealed) && children}</Billboard>;
}
