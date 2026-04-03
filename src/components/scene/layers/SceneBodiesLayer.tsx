import { OBSERVER_FRAME_SCALE } from '../SpaceView.constants';
import type { BodyRenderData } from '../spaceView.types';

function scalePositionForFrame(
  position: [number, number, number],
  isCelestialFrame: boolean
): [number, number, number] {
  if (isCelestialFrame) {
    return position;
  }
  return [
    position[0] * OBSERVER_FRAME_SCALE,
    position[1] * OBSERVER_FRAME_SCALE,
    position[2] * OBSERVER_FRAME_SCALE,
  ];
}

export default function SceneBodiesLayer({
  bodyRenderData,
  isCelestialFrame,
}: {
  bodyRenderData: BodyRenderData;
  isCelestialFrame: boolean;
}) {
  return (
    <>
      {bodyRenderData.sun.isVisible && (
        <>
          <mesh position={scalePositionForFrame(bodyRenderData.sun.position, isCelestialFrame)}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshBasicMaterial
              color={isCelestialFrame ? '#ffd166' : '#fff1c1'}
              transparent
              opacity={0.98}
            />
            <pointLight intensity={1.6} distance={40} decay={2} />
          </mesh>
          <mesh position={scalePositionForFrame(bodyRenderData.sun.position, isCelestialFrame)} scale={1.9}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshBasicMaterial
              color={isCelestialFrame ? '#ffe9a8' : '#fff4cf'}
              transparent
              opacity={0.12}
            />
          </mesh>
        </>
      )}

      {bodyRenderData.moon.isVisible && (
        <mesh position={scalePositionForFrame(bodyRenderData.moon.position, isCelestialFrame)}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial
            color={isCelestialFrame ? '#d0d0d0' : '#e8e8e8'}
            transparent
            opacity={0.95}
          />
        </mesh>
      )}

      {bodyRenderData.planets.map((planet) => (
        <mesh key={planet.name} position={scalePositionForFrame(planet.position, isCelestialFrame)}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color={planet.color} transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  );
}
