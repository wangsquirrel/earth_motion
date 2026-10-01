import { useCallback, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../../store/useAppStore';
import { projectEquatorialCoordinate } from '../../../utils/skyProjection';
import { SPHERE_RADIUS } from '../SpaceView.constants';
import { useViewportLayout } from '../../../hooks/useViewportLayout';
import {
  BODY_LABEL_ANCHOR_X,
  BODY_LABEL_ANCHOR_Y,
  BODY_LABEL_OUTLINE_COLOR,
  BODY_LABEL_SPECS,
  SCENE_LABEL_FONT_URL,
  getLocalizedBodyLabel,
} from '../sceneLabel.constants';
import { getMoonPhaseData, getMoonPosition, getPlanetPosition, PLANET_BODIES, type MoonPhaseData } from '../../../utils/ephemeris';
import type { AppLanguage } from '../../../utils/i18n';
import MoonPhaseDisc from '../MoonPhaseDisc';

/** Moon and planet meshes stay mounted while their layer is enabled. All positions
 * use the same frame clock as the Sun, without speed-dependent update gates. */
export default function SceneBodiesLayer({ simDateRef, language, showLabels = true }: {
  simDateRef: { current: Date };
  language: AppLanguage;
  showLabels?: boolean;
}) {
  const { isDesktop } = useViewportLayout();
  const labelScale = isDesktop ? 1 : 1.8;
  const { showMoon, showPlanets } = useAppStore(useShallow((state) => state.display));
  const moonGroup = useRef<THREE.Group>(null);
  const planets = useRef<Record<string, THREE.Group | null>>({});
  const phaseRef = useRef<MoonPhaseData>({ illuminatedFraction: 0, waxing: true });
  const sync = useCallback(() => {
    const { observer, scene } = useAppStore.getState();
    const date = simDateRef.current;
    const celestial = scene.referenceFrame === 'celestial';
    const project = (position: { ra: number; dec: number }) => projectEquatorialCoordinate(
      position.ra, position.dec, observer.latitude, observer.longitude, date, SPHERE_RADIUS,
    );
    if (showMoon && moonGroup.current) {
      const moon = project(getMoonPosition(date));
      moonGroup.current.position.set(...(celestial ? moon.celestialPosition : moon.observerPosition));
      moonGroup.current.visible = celestial || moon.isVisible;
      phaseRef.current = getMoonPhaseData(date);
    }
    if (showPlanets) for (const planet of PLANET_BODIES) {
      const group = planets.current[planet.name];
      if (!group) continue;
      const position = getPlanetPosition(planet.name, date);
      if (!position) { group.visible = false; continue; }
      const projected = project(position);
      group.position.set(...(celestial ? projected.celestialPosition : projected.observerPosition));
      group.visible = celestial || projected.isVisible;
    }
  }, [simDateRef, showMoon, showPlanets]);
  useLayoutEffect(sync, [sync]);
  useFrame(sync, -0.5);

  return (
    <>
      {showMoon && (
        <group ref={moonGroup} name="continuous-moon" visible={false}>
          <MoonPhaseDisc
            position={[0, 0, 0]}
            phaseRef={phaseRef}
            size={0.24}
          />

          {showLabels && (
            <Billboard position={BODY_LABEL_SPECS.moon.offset}>
              <Text
                color="#eaf2ff"
                font={SCENE_LABEL_FONT_URL}
                fontSize={BODY_LABEL_SPECS.moon.fontSize * labelScale}
                anchorX={BODY_LABEL_ANCHOR_X}
                anchorY={BODY_LABEL_ANCHOR_Y}
                fillOpacity={BODY_LABEL_SPECS.moon.fillOpacity}
                outlineWidth={BODY_LABEL_SPECS.moon.outlineWidth}
                outlineColor={BODY_LABEL_OUTLINE_COLOR}
              >
                {getLocalizedBodyLabel('Moon', language)}
              </Text>
            </Billboard>
          )}
        </group>
      )}

      {showPlanets && PLANET_BODIES.map((planet) => (
        <group key={planet.name} name={`continuous-planet-${planet.name}`} visible={false}
          ref={(group) => { planets.current[planet.name] = group; }}>
          <mesh>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshBasicMaterial color={planet.color} transparent opacity={0.9} />
          </mesh>

          {showLabels && (
            <Billboard position={BODY_LABEL_SPECS.planet.offset}>
              <Text
                color={planet.color}
                font={SCENE_LABEL_FONT_URL}
                fontSize={BODY_LABEL_SPECS.planet.fontSize * labelScale}
                anchorX={BODY_LABEL_ANCHOR_X}
                anchorY={BODY_LABEL_ANCHOR_Y}
                fillOpacity={BODY_LABEL_SPECS.planet.fillOpacity}
                outlineWidth={BODY_LABEL_SPECS.planet.outlineWidth}
                outlineColor={BODY_LABEL_OUTLINE_COLOR}
              >
                {getLocalizedBodyLabel(planet.name, language)}
              </Text>
            </Billboard>
          )}
        </group>
      ))}
    </>
  );
}
