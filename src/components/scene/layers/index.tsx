import { useLayoutEffect, useRef } from 'react';
import { Billboard, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useViewportLayout } from '../../../hooks/useViewportLayout';
import { SCENE_LABEL_FONT_URL } from '../sceneLabel.constants';
import { SPHERE_RADIUS } from '../SpaceView.constants';
import { scalePoint } from '../builders/geometry';
import type {
  GridSegmentGroup,
  MonthLabelData,
} from '../spaceView.types';
import type { RenderableConstellationLine, RenderableStar } from '../../../utils/starField';
import EquatorialGridLayer from './EquatorialGridLayer';
import HorizonBillboard from './HorizonBillboard';
import HorizonConstellationLine from './HorizonConstellationLine';
import { ABOVE_HORIZON_PLANES, BELOW_HORIZON_PLANES } from './horizon.constants';

export function ObserverReferenceLayer({
  prefix,
  quaternion,
  declinationGrid,
  hourGrid,
  equatorSegments,
  equatorLabelPosition,
  equatorLabel,
  horizonLabels,
  observerAxisPoints,
  showLabels = true,
  showGrid = true,
}: {
  prefix: string;
  quaternion?: THREE.Quaternion;
  declinationGrid: GridSegmentGroup[];
  hourGrid: GridSegmentGroup[];
  equatorSegments: THREE.Vector3[][];
  equatorLabelPosition: [number, number, number] | null;
  equatorLabel: string;
  horizonLabels: Array<{ label: string; position: [number, number, number] }>;
  observerAxisPoints: [number, number, number][];
  showLabels?: boolean;
  showGrid?: boolean;
}) {
  const { isDesktop } = useViewportLayout();
  const labelScale = isDesktop ? 1 : 1.8;

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

      {showGrid && <EquatorialGridLayer
        prefix={prefix}
        declinationGrid={declinationGrid}
        hourGrid={hourGrid}
        equatorSegments={equatorSegments}
        equatorLabelPosition={equatorLabelPosition}
        equatorLabel={equatorLabel}
        declinationOpacity={0.11}
        hourOpacity={0.09}
        equatorOpacity={0.18}
        equatorLineWidth={1.8}
        showLabels={showLabels}
      />}

      {showLabels && horizonLabels.map((item) => (
        <Billboard key={`${prefix}-horizon-${item.label}`} position={item.position}>
          <Text
            color="#d8ecff"
            fontSize={0.28 * labelScale}
            anchorX="center"
            anchorY="middle"
            font={SCENE_LABEL_FONT_URL}
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
  declinationGrid,
  hourGrid,
  equatorSegments,
  equatorLabelPosition,
  equatorLabel,
  showLabels = true,
  showGrid = true,
}: {
  declinationGrid: GridSegmentGroup[];
  hourGrid: GridSegmentGroup[];
  equatorSegments: THREE.Vector3[][];
  equatorLabelPosition: [number, number, number];
  equatorLabel: string;
  showLabels?: boolean;
  showGrid?: boolean;
}) {
  return (
    <group>
      {/* 内部球体 - 扁平风格 */}
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#2a4a6a"
          transparent
          opacity={0.22}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 外部光晕 */}
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS * 1.004, 64, 64]} />
        <meshBasicMaterial
          color="#9fd6ff"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>


      {/* 赤道网格 - 统一配色和透明度 */}
      {showGrid && <EquatorialGridLayer
        prefix="celestial-grid"
        declinationGrid={declinationGrid}
        hourGrid={hourGrid}
        equatorSegments={equatorSegments}
        equatorLabelPosition={equatorLabelPosition}
        equatorLabel={equatorLabel}
        declinationOpacity={0.11}
        hourOpacity={0.09}
        equatorOpacity={0.18}
        equatorColor="#c5e4ff"
        equatorLineWidth={1.8}
        showLabels={showLabels}
      />}

      {/* 垂直轴线 */}
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
    </group>
  );
}

export function CelestialObserverOverlay({
  horizonPoints,
  zenithPosition,
  emphasis,
  zenithLabel,
  showLabels = true,
}: {
  horizonPoints: [number, number, number][];
  zenithPosition: [number, number, number];
  emphasis: number;
  zenithLabel: string;
  showLabels?: boolean;
}) {
  const { isDesktop } = useViewportLayout();
  const labelScale = isDesktop ? 1 : 1.8;
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

      <Line
        points={[[0, 0, 0], zenithPosition]}
        color="#dcefff"
        lineWidth={1.2}
        transparent
        opacity={0.12 + emphasis * 0.22}
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

      {showLabels && (
        <Billboard position={zenithLabelPosition}>
          <Text
            color="#e7f4ff"
            fontSize={0.16 * labelScale}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.35 + emphasis * 0.55}
            font={SCENE_LABEL_FONT_URL}
          >
            {zenithLabel}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function InstancedStarMeshes({
  prefix,
  stars,
  embedded,
  clipToHorizon,
}: {
  prefix: string;
  stars: RenderableStar[];
  embedded: boolean;
  clipToHorizon: boolean;
}) {
  const socketRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    const basePosition = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const socketPosition = new THREE.Vector3();
    const corePosition = new THREE.Vector3();
    const color = new THREE.Color();

    const setInstance = (
      mesh: THREE.InstancedMesh | null,
      index: number,
      position: THREE.Vector3,
      scale: number,
      instanceColor: THREE.Color | null
    ) => {
      if (!mesh) {
        return;
      }

      object.position.copy(position);
      object.rotation.set(0, 0, 0);
      object.scale.setScalar(scale);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      if (instanceColor) {
        mesh.setColorAt(index, instanceColor);
      }
    };

    stars.forEach((star, index) => {
      basePosition.set(...star.position);
      normal.copy(basePosition).normalize();
      socketPosition.copy(normal).multiplyScalar(SPHERE_RADIUS * 0.988);
      corePosition.copy(normal).multiplyScalar(SPHERE_RADIUS * 0.997);
      color.set(star.color);

      if (embedded) {
        setInstance(socketRef.current, index, socketPosition, star.size * 1.75, null);
      }
      setInstance(
        coreRef.current,
        index,
        embedded ? corePosition : basePosition,
        embedded ? star.size * 0.82 : star.size,
        color
      );
      setInstance(
        glowRef.current,
        index,
        embedded ? corePosition : basePosition,
        star.size * (embedded ? 1.35 : 1.8),
        color
      );
    });

    [socketRef.current, coreRef.current, glowRef.current].forEach((mesh) => {
      if (!mesh) {
        return;
      }
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      mesh.computeBoundingSphere();
    });
  }, [embedded, stars]);

  if (stars.length === 0) {
    return null;
  }

  return (
    <>
      {embedded && (
        <instancedMesh
          key={`${prefix}-star-sockets-${stars.length}`}
          ref={socketRef}
          args={[undefined, undefined, stars.length]}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial clippingPlanes={clipToHorizon ? ABOVE_HORIZON_PLANES : null} color="#091521" transparent opacity={0.24} />
        </instancedMesh>
      )}

      <instancedMesh
        key={`${prefix}-star-cores-${stars.length}`}
        ref={coreRef}
        args={[undefined, undefined, stars.length]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial clippingPlanes={clipToHorizon ? ABOVE_HORIZON_PLANES : null} />
      </instancedMesh>

      <instancedMesh
        key={`${prefix}-star-glows-${stars.length}`}
        ref={glowRef}
        args={[undefined, undefined, stars.length]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial clippingPlanes={clipToHorizon ? ABOVE_HORIZON_PLANES : null} transparent opacity={embedded ? 0.06 : 0.1} />
      </instancedMesh>
    </>
  );
}

export function StarFieldLayer({
  prefix,
  stars,
  constellationLines,
  embedded = false,
  showLabels = true,
  clipToHorizon = false,
  initialHorizonNormal,
}: {
  prefix: string;
  stars: RenderableStar[];
  constellationLines: RenderableConstellationLine[];
  embedded?: boolean;
  showLabels?: boolean;
  clipToHorizon?: boolean;
  initialHorizonNormal?: THREE.Vector3;
}) {
  const { isDesktop } = useViewportLayout();
  const labelScale = isDesktop ? 1 : 1.8;

  return (
    <>
      <InstancedStarMeshes prefix={prefix} stars={stars} embedded={embedded} clipToHorizon={clipToHorizon} />

      {showLabels && stars.filter((star) => star.label).map((star) => (
        <HorizonBillboard key={`${prefix}-star-label-${star.renderKey}`} position={star.labelPosition} clipToHorizon={clipToHorizon}
          initialVisible={!initialHorizonNormal || star.position[0] * initialHorizonNormal.x + star.position[1] * initialHorizonNormal.y + star.position[2] * initialHorizonNormal.z >= 0}>
          <Text
            color={star.color}
            fontSize={0.16 * labelScale}
            anchorX="center"
            anchorY="middle"
            font={SCENE_LABEL_FONT_URL}
          >
            {star.label}
          </Text>
        </HorizonBillboard>
      ))}

      {constellationLines.map((line, index) => (
        <HorizonConstellationLine key={`${prefix}-constellation-${line.constellationId}-${index}`}
          points={line.points} clipToHorizon={clipToHorizon} />
      ))}
    </>
  );
}

export function MilkyWayLayer({
  prefix,
  texture,
  radius,
  side,
  clipToHorizon = false,
}: {
  prefix: string;
  texture: THREE.Texture | null;
  radius: number;
  side: THREE.Side;
  clipToHorizon?: boolean;
}) {
  if (!texture) {
    return null;
  }

  return (
    <mesh renderOrder={6}>
      <sphereGeometry args={[radius, 96, 96]} />
      <meshBasicMaterial
        key={`${prefix}-milky-way`}
        map={texture}
        transparent
        opacity={1}
        side={side}
        depthWrite={false}
        clippingPlanes={clipToHorizon ? ABOVE_HORIZON_PLANES : null}
        toneMapped={false}
      />
    </mesh>
  );
}

export function AnnualLayer({
  prefix,
  fullPath,
  fullPathDashed = false,
  hiddenSegments,
  visibleSegments,
  months,
  showLabels = true,
  clipToHorizon = false,
  initialHorizonNormal,
}: {
  prefix: string;
  fullPath?: THREE.Vector3[];
  fullPathDashed?: boolean;
  hiddenSegments: THREE.Vector3[][];
  visibleSegments: THREE.Vector3[][];
  months: MonthLabelData[];
  showLabels?: boolean;
  clipToHorizon?: boolean;
  initialHorizonNormal?: THREE.Vector3;
}) {
  const { isDesktop } = useViewportLayout();
  const labelScale = isDesktop ? 1 : 1.8;

  return (
    <>
      {fullPath && clipToHorizon ? (
        <>
          <Line points={fullPath} color="#8d7442" lineWidth={1.1} transparent opacity={0.24}
            dashed dashScale={10} dashSize={0.55} gapSize={0.4} clippingPlanes={BELOW_HORIZON_PLANES} />
          <Line points={fullPath} color="#ffe066" lineWidth={1.9} transparent opacity={0.82}
            dashed dashScale={10} dashSize={1.1} gapSize={0.5} clippingPlanes={ABOVE_HORIZON_PLANES} />
        </>
      ) : fullPath ? (
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

      {showLabels && months.filter((month) => month.isVisible ?? true).map((month) => (
        <HorizonBillboard key={`${prefix}-month-${month.label}`} position={month.position} clipToHorizon={clipToHorizon}
          initialVisible={!initialHorizonNormal || month.position[0] * initialHorizonNormal.x + month.position[1] * initialHorizonNormal.y + month.position[2] * initialHorizonNormal.z >= 0}>
          <Text
            color="#fff1a8"
            fontSize={0.22 * labelScale}
            anchorX="center"
            anchorY="middle"
            font={SCENE_LABEL_FONT_URL}
          >
            {month.label}
          </Text>
        </HorizonBillboard>
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
