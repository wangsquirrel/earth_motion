import { useCallback, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useViewportLayout } from '../../../hooks/useViewportLayout';
import { useAppStore } from '../../../store/useAppStore';
import { getSunPosition } from '../../../utils/ephemeris';
import { projectEquatorialCoordinate } from '../../../utils/skyProjection';
import type { AppLanguage } from '../../../utils/i18n';
import { SPHERE_RADIUS } from '../SpaceView.constants';
import {
  BODY_LABEL_ANCHOR_X, BODY_LABEL_ANCHOR_Y, BODY_LABEL_OUTLINE_COLOR,
  BODY_LABEL_SPECS, SCENE_LABEL_FONT_URL, getLocalizedBodyLabel,
} from '../sceneLabel.constants';

const RAY_POINTS: [number, number, number][] = [[0, 0, 0], [0, 0, SPHERE_RADIUS]];
const FORWARD = new THREE.Vector3(0, 0, 1);

/** The Sun follows the scene clock on every rendered frame, including at high speed.
 * Keep its geometry and text mounted across sunrise/sunset; only transforms and
 * visibility change. Neither React scheduling nor a wall-time throttle drives motion.
 */
export default function SpaceSunLayer({ simDateRef, language, showRay, showLabels = true }: {
  simDateRef: { current: Date }; language: AppLanguage; showRay: boolean; showLabels?: boolean;
}) {
  const sun = useRef<THREE.Group>(null);
  const ray = useRef<THREE.Group>(null);
  const direction = useRef(new THREE.Vector3());
  const { isDesktop } = useViewportLayout();
  const labelScale = isDesktop ? 1 : 1.8;
  const sync = useCallback(() => {
    const { observer, scene } = useAppStore.getState();
    const date = simDateRef.current;
    const position = getSunPosition(date);
    const projected = projectEquatorialCoordinate(
      position.ra, position.dec, observer.latitude, observer.longitude, date, SPHERE_RADIUS,
    );
    if (sun.current) {
      sun.current.position.set(...(scene.referenceFrame === 'celestial'
        ? projected.celestialPosition : projected.observerPosition));
      sun.current.visible = scene.referenceFrame === 'celestial' || projected.isVisible;
    }
    if (ray.current) {
      ray.current.quaternion.setFromUnitVectors(FORWARD, direction.current.set(...projected.observerPosition).normalize());
      ray.current.visible = showRay && projected.isVisible;
    }
  }, [simDateRef, showRay]);

  useLayoutEffect(sync, [sync]);
  // Clock (-2) and sky rotation (-1) have already updated for this exact frame.
  useFrame(sync, -0.5);

  return <>
    <group ref={sun} name="continuous-sun" visible={false}>
      <mesh>
        <sphereGeometry args={[0.18, 14, 14]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.98} />
        <pointLight intensity={1.6} distance={40} decay={2} />
      </mesh>
      <mesh scale={1.9}>
        <sphereGeometry args={[0.18, 14, 14]} />
        <meshBasicMaterial color="#ffe9a8" transparent opacity={0.12} />
      </mesh>
      {showLabels && <Billboard position={BODY_LABEL_SPECS.sun.offset}>
        <Text color="#fff1b8" font={SCENE_LABEL_FONT_URL}
          fontSize={BODY_LABEL_SPECS.sun.fontSize * labelScale}
          anchorX={BODY_LABEL_ANCHOR_X} anchorY={BODY_LABEL_ANCHOR_Y}
          fillOpacity={BODY_LABEL_SPECS.sun.fillOpacity}
          outlineWidth={BODY_LABEL_SPECS.sun.outlineWidth} outlineColor={BODY_LABEL_OUTLINE_COLOR}>
          {getLocalizedBodyLabel('Sun', language)}
        </Text>
      </Billboard>}
    </group>
    {showRay && <group ref={ray} name="continuous-sun-ray" visible={false}>
      <Line points={RAY_POINTS} color="#aebfd0" lineWidth={0.8} transparent opacity={0.16} dashed dashSize={0.22} gapSize={0.24} />
    </group>}
  </>;
}
