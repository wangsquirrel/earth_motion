import { Billboard, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GridSegmentGroup } from '../spaceView.types';

interface EquatorialGridLayerProps {
  prefix: string;
  declinationGrid: GridSegmentGroup[];
  hourGrid: GridSegmentGroup[];
  equatorSegments: THREE.Vector3[][];
  equatorLabelPosition: [number, number, number] | null;
  declinationOpacity: number;
  hourOpacity: number;
  equatorOpacity: number;
  equatorColor?: string;
}

export default function EquatorialGridLayer({
  prefix,
  declinationGrid,
  hourGrid,
  equatorSegments,
  equatorLabelPosition,
  declinationOpacity,
  hourOpacity,
  equatorOpacity,
  equatorColor = '#c5e4ff',
}: EquatorialGridLayerProps) {
  return (
    <>
      {declinationGrid.map((grid) => grid.segments.map((segment, index) => (
        <Line
          key={`${prefix}-${grid.key}-${index}`}
          points={segment}
          color="#d6ecff"
          lineWidth={0.8}
          transparent
          opacity={declinationOpacity}
        />
      )))}

      {hourGrid.map((grid) => grid.segments.map((segment, index) => (
        <Line
          key={`${prefix}-${grid.key}-${index}`}
          points={segment}
          color="#d6ecff"
          lineWidth={0.8}
          transparent
          opacity={hourOpacity}
        />
      )))}

      {equatorSegments.map((segment, index) => (
        <Line
          key={`${prefix}-equator-${index}`}
          points={segment}
          color={equatorColor}
          lineWidth={1.35}
          transparent
          opacity={equatorOpacity}
        />
      ))}

      {equatorLabelPosition && (
        <Billboard position={equatorLabelPosition}>
          <Text color="#d9ecff" fontSize={0.2} anchorX="center" anchorY="middle">
            天赤道
          </Text>
        </Billboard>
      )}
    </>
  );
}
