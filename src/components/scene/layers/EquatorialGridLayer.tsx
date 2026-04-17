import { Billboard, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useViewportLayout } from '../../../hooks/useViewportLayout';
import { SCENE_LABEL_FONT_URL } from '../sceneLabel.constants';
import type { GridSegmentGroup } from '../spaceView.types';

interface EquatorialGridLayerProps {
  prefix: string;
  declinationGrid: GridSegmentGroup[];
  hourGrid: GridSegmentGroup[];
  equatorSegments: THREE.Vector3[][];
  equatorLabelPosition: [number, number, number] | null;
  equatorLabel: string;
  declinationOpacity: number;
  hourOpacity: number;
  equatorOpacity: number;
  equatorColor?: string;
  equatorLineWidth?: number;
  showLabels?: boolean;
}

export default function EquatorialGridLayer({
  prefix,
  declinationGrid,
  hourGrid,
  equatorSegments,
  equatorLabelPosition,
  equatorLabel,
  declinationOpacity,
  hourOpacity,
  equatorOpacity,
  equatorColor = '#c5e4ff',
  equatorLineWidth = 1.35,
  showLabels = true,
}: EquatorialGridLayerProps) {
  const { isDesktop } = useViewportLayout();
  const labelScale = isDesktop ? 1 : 1.8;

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
          lineWidth={equatorLineWidth}
          transparent
          opacity={equatorOpacity}
        />
      ))}

      {showLabels && equatorLabelPosition && (
        <Billboard position={equatorLabelPosition}>
          <Text
            color="#d9ecff"
            fontSize={0.2 * labelScale}
            anchorX="center"
            anchorY="middle"
            font={SCENE_LABEL_FONT_URL}
          >
            {equatorLabel}
          </Text>
        </Billboard>
      )}
    </>
  );
}
