import { Billboard, Text } from '@react-three/drei';
import { useViewportLayout } from '../../../hooks/useViewportLayout';
import {
  BODY_LABEL_ANCHOR_X,
  BODY_LABEL_ANCHOR_Y,
  BODY_LABEL_OUTLINE_COLOR,
  BODY_LABEL_SPECS,
  SCENE_LABEL_FONT_URL,
  getLocalizedBodyLabel,
} from '../sceneLabel.constants';
import type { MoonPhaseData } from '../../../utils/ephemeris';
import type { AppLanguage } from '../../../utils/i18n';
import MoonPhaseDisc from '../MoonPhaseDisc';
import type { BodyRenderData } from '../spaceView.types';

export default function SceneBodiesLayer({
  bodyRenderData,
  language,
  moonPhase,
  showLabels = true,
}: {
  bodyRenderData: BodyRenderData;
  language: AppLanguage;
  moonPhase: MoonPhaseData;
  showLabels?: boolean;
}) {
  const { isDesktop } = useViewportLayout();
  const labelScale = isDesktop ? 1 : 1.8;

  return (
    <>
      {bodyRenderData.sun.isVisible && (
        <group position={bodyRenderData.sun.position}>
          <mesh>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshBasicMaterial
              color="#ffd166"
              transparent
              opacity={0.98}
            />
            <pointLight intensity={1.6} distance={40} decay={2} />
          </mesh>
          <mesh scale={1.9}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshBasicMaterial
              color="#ffe9a8"
              transparent
              opacity={0.12}
            />
          </mesh>

          {showLabels && (
            <Billboard position={BODY_LABEL_SPECS.sun.offset}>
              <Text
                color="#fff1b8"
                font={SCENE_LABEL_FONT_URL}
                fontSize={BODY_LABEL_SPECS.sun.fontSize * labelScale}
                anchorX={BODY_LABEL_ANCHOR_X}
                anchorY={BODY_LABEL_ANCHOR_Y}
                fillOpacity={BODY_LABEL_SPECS.sun.fillOpacity}
                outlineWidth={BODY_LABEL_SPECS.sun.outlineWidth}
                outlineColor={BODY_LABEL_OUTLINE_COLOR}
              >
                {getLocalizedBodyLabel('Sun', language)}
              </Text>
            </Billboard>
          )}
        </group>
      )}

      {bodyRenderData.moon.isVisible && (
        <group position={bodyRenderData.moon.position}>
          <MoonPhaseDisc
            position={[0, 0, 0]}
            illuminatedFraction={moonPhase.illuminatedFraction}
            waxing={moonPhase.waxing}
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

      {bodyRenderData.planets.map((planet) => (
        <group key={planet.name} position={planet.position}>
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
