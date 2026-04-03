import { Billboard, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CONSTELLATION_LINE_COLOR, SPHERE_RADIUS } from '../SpaceView.constants';
import { scalePoint } from '../builders/geometry';
import type {
  GridSegmentGroup,
  MonthLabelData,
} from '../spaceView.types';
import type { RenderableConstellationLine, RenderableStar } from '../../../utils/starField';
import EquatorialGridLayer from './EquatorialGridLayer';

export function ObserverReferenceLayer({
  prefix,
  quaternion,
  ringPoints,
  declinationGrid,
  hourGrid,
  equatorSegments,
  equatorLabelPosition,
  horizonLabels,
  observerAxisPoints,
}: {
  prefix: string;
  quaternion?: THREE.Quaternion;
  ringPoints: [number, number, number][];
  declinationGrid: GridSegmentGroup[];
  hourGrid: GridSegmentGroup[];
  equatorSegments: THREE.Vector3[][];
  equatorLabelPosition: [number, number, number] | null;
  horizonLabels: Array<{ label: string; position: [number, number, number] }>;
  observerAxisPoints: [number, number, number][];
}) {
  return (
    <group quaternion={quaternion}>
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color="#315980"
          transparent
          opacity={0.24}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS * 1.004, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color="#9fd6ff"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[SPHERE_RADIUS * 1.02, 96]} />
        <meshBasicMaterial
          color="#b9dcff"
          transparent
          opacity={0.34}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <ringGeometry args={[SPHERE_RADIUS * 0.82, SPHERE_RADIUS * 1.02, 96]} />
        <meshBasicMaterial
          color="#8dc8ff"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <Line
        points={ringPoints}
        color="#66b7ff"
        lineWidth={3}
        transparent
        opacity={0.98}
      />

      <EquatorialGridLayer
        prefix={prefix}
        declinationGrid={declinationGrid}
        hourGrid={hourGrid}
        equatorSegments={equatorSegments}
        equatorLabelPosition={equatorLabelPosition}
        declinationOpacity={0.11}
        hourOpacity={0.09}
        equatorOpacity={0.24}
      />

      {horizonLabels.map((item) => (
        <Billboard key={`${prefix}-horizon-${item.label}`} position={item.position}>
          <Text
            color="#d8ecff"
            fontSize={0.28}
            anchorX="center"
            anchorY="middle"
          >
            {item.label}
          </Text>
        </Billboard>
      ))}

      <Line
        points={[[-SPHERE_RADIUS, 0, 0], [SPHERE_RADIUS, 0, 0]]}
        color="#75b5e7"
        lineWidth={1}
        transparent
        opacity={0.35}
      />

      <Line
        points={[[0, 0, -SPHERE_RADIUS], [0, 0, SPHERE_RADIUS]]}
        color="#75b5e7"
        lineWidth={1}
        transparent
        opacity={0.35}
      />

      <Line
        points={[[0, -SPHERE_RADIUS, 0], [0, SPHERE_RADIUS, 0]]}
        color="#5f718a"
        lineWidth={1}
        dashed
        dashSize={0.5}
        gapSize={0.5}
        transparent
        opacity={0.6}
      />

      <Line
        points={observerAxisPoints}
        color="#75adff"
        lineWidth={1.8}
        dashed
        dashSize={0.45}
        gapSize={0.4}
        transparent
        opacity={0.8}
      />
    </group>
  );
}

export function CelestialReferenceLayer({
  ringPoints,
  declinationGrid,
  hourGrid,
  equatorSegments,
  equatorLabelPosition,
}: {
  ringPoints: [number, number, number][];
  declinationGrid: GridSegmentGroup[];
  hourGrid: GridSegmentGroup[];
  equatorSegments: THREE.Vector3[][];
  equatorLabelPosition: [number, number, number];
}) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS, 64, 64]} />
        <meshPhongMaterial
          color="#153252"
          emissive="#0a1a2f"
          emissiveIntensity={0.55}
          shininess={18}
          specular="#6ea8d9"
          transparent
          opacity={0.34}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS * 1.003, 64, 64]} />
        <meshPhongMaterial
          color="#2e5d88"
          emissive="#153252"
          emissiveIntensity={0.38}
          shininess={42}
          specular="#cfe9ff"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS * 1.018, 64, 64]} />
        <meshBasicMaterial
          color="#8ec8ff"
          transparent
          opacity={0.08}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[-0.45, -0.2, 0.55]}>
        <sphereGeometry args={[SPHERE_RADIUS * 0.985, 64, 64]} />
        <meshBasicMaterial
          color="#081527"
          transparent
          opacity={0.08}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      <Line
        points={ringPoints}
        color="#5f79ff"
        lineWidth={2.4}
        transparent
        opacity={0.88}
      />

      <EquatorialGridLayer
        prefix="celestial-grid"
        declinationGrid={declinationGrid}
        hourGrid={hourGrid}
        equatorSegments={equatorSegments}
        equatorLabelPosition={equatorLabelPosition}
        declinationOpacity={0.12}
        hourOpacity={0.08}
        equatorOpacity={0.34}
        equatorColor="#b8d8ff"
      />

      <Line
        points={[[0, -SPHERE_RADIUS, 0], [0, SPHERE_RADIUS, 0]]}
        color="#75adff"
        lineWidth={1.8}
        dashed
        dashSize={0.45}
        gapSize={0.4}
        transparent
        opacity={0.8}
      />
    </group>
  );
}

export function CelestialLightingRig() {
  return (
    <>
      <hemisphereLight
        args={['#9fd6ff', '#06111f', 0.7]}
        intensity={0.7}
      />
      <directionalLight
        position={[14, 10, 16]}
        color="#d9efff"
        intensity={1.1}
      />
      <directionalLight
        position={[-10, -4, 12]}
        color="#3c6fa3"
        intensity={0.45}
      />
    </>
  );
}

export function CelestialObserverOverlay({
  horizonPoints,
  zenithPosition,
  emphasis,
}: {
  horizonPoints: [number, number, number][];
  zenithPosition: [number, number, number];
  emphasis: number;
}) {
  const zenithLabelPosition = scalePoint(new THREE.Vector3(...zenithPosition), 1.06).toArray() as [number, number, number];
  const insetHorizonPoints = horizonPoints.map(([x, y, z]) => (
    new THREE.Vector3(x, y, z).normalize().multiplyScalar(SPHERE_RADIUS * 0.972).toArray() as [number, number, number]
  ));

  return (
    <group>
      <Line
        points={insetHorizonPoints}
        color="#d7ebff"
        lineWidth={1.05}
        transparent
        opacity={0.1 + emphasis * 0.16}
        dashed
        dashScale={10}
        dashSize={0.85}
        gapSize={0.55}
      />

      <Billboard position={zenithPosition}>
        <group>
          <mesh>
            <ringGeometry args={[0.055, 0.085, 24]} />
            <meshBasicMaterial
              color="#e7f4ff"
              transparent
              opacity={0.32 + emphasis * 0.44}
              side={THREE.DoubleSide}
            />
          </mesh>

          <Line
            points={[[-0.13, 0, 0], [0.13, 0, 0]]}
            color="#e7f4ff"
            lineWidth={1.1}
            transparent
            opacity={0.3 + emphasis * 0.42}
          />

          <Line
            points={[[0, -0.13, 0], [0, 0.13, 0]]}
            color="#e7f4ff"
            lineWidth={1.1}
            transparent
            opacity={0.3 + emphasis * 0.42}
          />
        </group>
      </Billboard>

      <Billboard position={zenithLabelPosition}>
        <Text
          color="#e7f4ff"
          fontSize={0.16}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.35 + emphasis * 0.55}
        >
          天顶
        </Text>
      </Billboard>
    </group>
  );
}

export function StarFieldLayer({
  prefix,
  stars,
  constellationLines,
  embedded = false,
}: {
  prefix: string;
  stars: RenderableStar[];
  constellationLines: RenderableConstellationLine[];
  embedded?: boolean;
}) {
  return (
    <>
      {stars.map((star) => {
        const normal = new THREE.Vector3(...star.position).normalize();
        const socketPosition = normal.clone().multiplyScalar(SPHERE_RADIUS * 0.988);
        const corePosition = normal.clone().multiplyScalar(SPHERE_RADIUS * 0.997);

        return (
          <group key={`${prefix}-star-${star.renderKey}`}>
            {embedded && (
              <mesh position={socketPosition.toArray()}>
                <sphereGeometry args={[star.size * 1.75, 12, 12]} />
                <meshBasicMaterial color="#091521" transparent opacity={0.24} />
              </mesh>
            )}

            <mesh position={(embedded ? corePosition : new THREE.Vector3(...star.position)).toArray()}>
              <sphereGeometry args={[embedded ? star.size * 0.82 : star.size, 12, 12]} />
              <meshBasicMaterial color={star.color} />
            </mesh>

            <mesh position={(embedded ? corePosition : new THREE.Vector3(...star.position)).toArray()} scale={embedded ? 1.35 : 1.8}>
              <sphereGeometry args={[star.size, 12, 12]} />
              <meshBasicMaterial color={star.color} transparent opacity={embedded ? 0.06 : 0.1} />
            </mesh>
          </group>
        );
      })}

      {stars.filter((star) => star.label).map((star) => (
        <Billboard key={`${prefix}-star-label-${star.renderKey}`} position={star.labelPosition}>
          <Text
            color={star.color}
            fontSize={0.16}
            anchorX="center"
            anchorY="middle"
          >
            {star.label}
          </Text>
        </Billboard>
      ))}

      {constellationLines.map((line, index) => (
        <Line
          key={`${prefix}-constellation-${line.constellationId}-${index}`}
          points={line.points}
          color={CONSTELLATION_LINE_COLOR}
          lineWidth={0.7}
          transparent
          opacity={0.45}
          dashed
          dashSize={0.2}
          gapSize={0.15}
        />
      ))}
    </>
  );
}

export function AnnualLayer({
  prefix,
  fullPath,
  fullPathDashed = false,
  hiddenSegments,
  visibleSegments,
  months,
}: {
  prefix: string;
  fullPath?: THREE.Vector3[];
  fullPathDashed?: boolean;
  hiddenSegments: THREE.Vector3[][];
  visibleSegments: THREE.Vector3[][];
  months: MonthLabelData[];
}) {
  return (
    <>
      {fullPath ? (
        <Line
          key={`${prefix}-ecliptic-full`}
          points={fullPath}
          color="#ffe066"
          lineWidth={2}
          transparent
          opacity={0.86}
          dashed={fullPathDashed}
          dashScale={10}
          dashSize={fullPathDashed ? 0.85 : 0}
          gapSize={fullPathDashed ? 0.55 : 0}
        />
      ) : (
        <>
          {hiddenSegments.map((segment, index) => (
            <Line
              key={`${prefix}-ecliptic-hidden-${index}`}
              points={segment}
              color="#8d7442"
              lineWidth={1.1}
              transparent
              opacity={0.24}
              dashed
              dashScale={10}
              dashSize={0.55}
              gapSize={0.4}
            />
          ))}

          {visibleSegments.map((segment, index) => (
            <Line
              key={`${prefix}-ecliptic-visible-${index}`}
              points={segment}
              color="#ffe066"
              lineWidth={1.9}
              transparent
              opacity={0.82}
              dashed
              dashScale={10}
              dashSize={1.1}
              gapSize={0.5}
            />
          ))}
        </>
      )}

      {months.filter((month) => month.isVisible ?? true).map((month) => (
        <Billboard key={`${prefix}-month-${month.label}`} position={month.position}>
          <Text
            color="#fff1a8"
            fontSize={0.22}
            anchorX="center"
            anchorY="middle"
          >
            {month.label}
          </Text>
        </Billboard>
      ))}
    </>
  );
}

export function DiurnalLayer({
  prefix,
  hiddenSegments,
  visibleSegments,
  markerPoints,
  rayPoint,
}: {
  prefix: string;
  hiddenSegments: THREE.Vector3[][];
  visibleSegments: THREE.Vector3[][];
  markerPoints: THREE.Vector3[];
  rayPoint: [number, number, number] | null;
}) {
  return (
    <>
      {hiddenSegments.map((segment, index) => (
        <Line
          key={`${prefix}-hidden-diurnal-${index}`}
          points={segment}
          color="#607186"
          lineWidth={0.9}
          transparent
          opacity={0.14}
          dashed
          dashSize={0.28}
          gapSize={0.34}
        />
      ))}

      {visibleSegments.map((segment, index) => (
        <Line
          key={`${prefix}-visible-diurnal-${index}`}
          points={segment}
          color="#b9c8d8"
          lineWidth={1.5}
          transparent
          opacity={0.5}
          dashed
          dashSize={0.4}
          gapSize={0.28}
        />
      ))}

      {markerPoints.map((point, index) => (
        <mesh key={`${prefix}-diurnal-marker-${index}`} position={point}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshBasicMaterial color="#d8e5f2" transparent opacity={0.45} />
        </mesh>
      ))}

      {rayPoint && (
        <Line
          points={[[0, 0, 0], rayPoint]}
          color="#aebfd0"
          lineWidth={0.8}
          transparent
          opacity={0.16}
          dashed
          dashSize={0.22}
          gapSize={0.24}
        />
      )}
    </>
  );
}

export { default as SceneBodiesLayer } from './SceneBodiesLayer';
