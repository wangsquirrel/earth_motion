import { useRef, useState, type ReactNode } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { updateWorldMatrixForFrame } from '../builders/frameWorldMatrix';

/** Keep label geometry mounted; only visibility changes when its anchor crosses the horizon. */
export default function HorizonBillboard({ position, clipToHorizon = false, initialVisible = true, children }: {
  position: [number, number, number];
  clipToHorizon?: boolean;
  initialVisible?: boolean;
  children: ReactNode;
}) {
  const [revealed, setRevealed] = useState(initialVisible);
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current && clipToHorizon) {
      updateWorldMatrixForFrame(group.current, clock.elapsedTime);
      group.current.visible = group.current.matrixWorld.elements[13] >= 0;
      if (group.current.visible && !revealed) setRevealed(true);
    }
  });
  return <Billboard ref={group} position={position} visible={!clipToHorizon}>{(!clipToHorizon || revealed) && children}</Billboard>;
}
