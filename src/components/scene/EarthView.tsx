import { useEffect, useMemo, useRef } from 'react';
import { Billboard, Line, Sky, Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { getMoonPosition, getPlanetPosition, PLANET_BODIES } from '../../utils/ephemeris';
import { horizontalToCartesian } from '../../utils/astronomy';
import {
  buildObserverDeclinationGridSamples,
  buildObserverHourGridSamples,
} from '../../utils/observerGrid';
import { projectEquatorialCoordinate } from '../../utils/skyProjection';
import { buildSunDiurnalArcSamples, splitPointSegments } from '../../utils/sunPaths';
import { CATALOG, CONSTELLATIONS_BY_CULTURE } from '../../utils/stars';
import {
  buildObserverConstellationLines,
  buildObserverStarRenderData,
  type RenderableConstellationLine,
  type RenderableStar,
} from '../../utils/starField';

const SKY_RADIUS = 50;
const SKY_OBJECT_RADIUS = SKY_RADIUS * 0.9;
const DIURNAL_SAMPLE_COUNT = 145;
const HORIZON_POINT_COUNT = 65;
const STAR_LABEL_RADIUS_SCALE = 1.04;
const CONSTELLATION_LINE_COLOR = '#6eb5ff';
const EARTH_STAR_SIZE_SCALE = SKY_OBJECT_RADIUS / 10;
const CAMERA_DISTANCE = 1.2;
const CAMERA_GROUND_OFFSET = 0.08;
const GROUND_RADIUS = 220;
const LOOK_SENSITIVITY = 0.0045;
const MIN_PITCH = 0.001;
const MAX_PITCH = Math.PI / 2 - 0.02;
const MOON_SPRITE_SIZE = 1.45;
const PLANET_SPRITE_SIZE = 0.95;
const STAR_CORE_SIZE_SCALE = 2.4;
const STAR_GLOW_SIZE_SCALE = 4.4;
const NEUTRAL_SKY_SUN_POSITION: [number, number, number] = [0, -1, 0];
const SHELL_OPACITY = 0.038;
const DECLINATION_GRID_OPACITY = 0.055;
const HOUR_GRID_OPACITY = 0.075;
const SKY_GRID_DECLINATIONS = [-15, 15, 45];
const SKY_GRID_HOURS = [0, 6, 12, 18];
const EARTH_SKY_GRID_SAMPLE_COUNT = 145;

function useRadialSpriteTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.92)');
    gradient.addColorStop(0.72, 'rgba(255,255,255,0.34)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    context.clearRect(0, 0, 128, 128);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function SkySprite({
  position,
  color,
  size,
  opacity = 1,
  texture,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  opacity?: number;
  texture: THREE.Texture | null;
}) {
  if (!texture) {
    return null;
  }

  return (
    <sprite position={position} scale={[size, size, 1]} renderOrder={30}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthTest={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </sprite>
  );
}

function EarthSkyFieldLayer({
  stars,
  constellationLines,
  spriteTexture,
}: {
  stars: RenderableStar[];
  constellationLines: RenderableConstellationLine[];
  spriteTexture: THREE.Texture | null;
}) {
  return (
    <>
      {stars.map((star) => (
        <group key={`earth-star-${star.renderKey}`}>
          <SkySprite
            position={star.position}
            color={star.color}
            size={star.size * EARTH_STAR_SIZE_SCALE * STAR_CORE_SIZE_SCALE}
            texture={spriteTexture}
          />
          <SkySprite
            position={star.position}
            color={star.color}
            size={star.size * EARTH_STAR_SIZE_SCALE * STAR_GLOW_SIZE_SCALE}
            opacity={0.12}
            texture={spriteTexture}
          />
        </group>
      ))}

      {stars.filter((star) => star.label).map((star) => (
        <Billboard key={`earth-star-label-${star.renderKey}`} position={star.labelPosition}>
          <Text
            color={star.color}
            fontSize={0.7}
            anchorX="center"
            anchorY="middle"
          >
            {star.label}
          </Text>
        </Billboard>
      ))}

      {constellationLines.map((line, index) => (
        <Line
          key={`earth-constellation-${line.constellationId}-${index}`}
          points={line.points}
          color={CONSTELLATION_LINE_COLOR}
          lineWidth={1}
          transparent
          opacity={0.45}
          dashed
          dashSize={0.35}
          gapSize={0.22}
        />
      ))}
    </>
  );
}

function EarthCompassLabels() {
  const labels = useMemo(() => (
    [
      { label: '北', azimuth: 0 },
      { label: '东', azimuth: Math.PI / 2 },
      { label: '南', azimuth: Math.PI },
      { label: '西', azimuth: (3 * Math.PI) / 2 },
    ].map((item) => {
      const [x, , z] = horizontalToCartesian(item.azimuth, 0, SKY_RADIUS + 2.2);
      return {
        ...item,
        position: [x, 0.8, z] as [number, number, number],
      };
    })
  ), []);

  return (
    <>
      {labels.map((item) => (
        <Billboard key={`earth-direction-${item.label}`} position={item.position}>
          <Text
            color="#f4fbff"
            fontSize={2}
            anchorX="center"
            anchorY="middle"
          >
            {item.label}
          </Text>
        </Billboard>
      ))}
    </>
  );
}

function EarthSkyReferenceLayer({
  latitude,
  date,
}: {
  latitude: number;
  date: Date;
}) {
  const movingDeclinationRings = useMemo(
    () => SKY_GRID_DECLINATIONS.map((declination) => ({
      declination,
      segments: splitPointSegments(
        buildObserverDeclinationGridSamples(
          SKY_RADIUS,
          declination,
          latitude,
          date,
          EARTH_SKY_GRID_SAMPLE_COUNT
        ),
        true
      ),
    })),
    [date, latitude]
  );

  const movingHourArcs = useMemo(
    () => SKY_GRID_HOURS.map((hour) => ({
      hour,
      segments: splitPointSegments(
        buildObserverHourGridSamples(
          SKY_RADIUS,
          hour,
          latitude,
          date,
          EARTH_SKY_GRID_SAMPLE_COUNT
        ),
        true
      ),
    })),
    [date, latitude]
  );

  return (
    <>
      <mesh renderOrder={2}>
        <sphereGeometry args={[SKY_RADIUS, 40, 40]} />
        <meshBasicMaterial
          color="#9ec8ff"
          side={THREE.BackSide}
          transparent
          opacity={SHELL_OPACITY}
          depthWrite={false}
        />
      </mesh>

      {movingDeclinationRings.map((ring) =>
        ring.segments.map((segment, index) => (
          <Line
            key={`earth-sky-declination-${ring.declination}-${index}`}
            points={segment}
            color="#a8cfff"
            lineWidth={1}
            transparent
            opacity={DECLINATION_GRID_OPACITY}
          />
        ))
      )}

      {movingHourArcs.map((arc) =>
        arc.segments.map((segment, index) => (
          <Line
            key={`earth-sky-hour-${arc.hour}-${index}`}
            points={segment}
            color="#b6d8ff"
            lineWidth={1}
            transparent
            opacity={HOUR_GRID_OPACITY}
          />
        ))
      )}
    </>
  );
}

export default function EarthView() {
  const { camera, gl, size } = useThree();
  const isDraggingRef = useRef(false);
  const hasInitializedViewRef = useRef(false);
  const yawRef = useRef(0);
  const pitchRef = useRef(0.24);
  const initialPerspectiveRef = useRef<{
    fov: number;
    near: number;
    far: number;
    hasViewOffset: boolean;
    fullWidth?: number;
    fullHeight?: number;
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
  } | null>(null);
  const { currentTime } = useAppStore((state) => state.clock);
  const { latitude } = useAppStore((state) => state.observer);
  const { skyCulture } = useAppStore((state) => state.scene);
  const {
    showDiurnalArc,
    showStars,
    showMoon,
    showPlanets,
  } = useAppStore((state) => state.display);

  const activeConstellations = useMemo(
    () => CONSTELLATIONS_BY_CULTURE[skyCulture],
    [skyCulture]
  );
  const spriteTexture = useRadialSpriteTexture();

  const horizonCirclePoints = useMemo(() => (
    Array.from({ length: HORIZON_POINT_COUNT }).map((_, i) => [
      SKY_RADIUS * Math.cos(i * Math.PI * 2 / (HORIZON_POINT_COUNT - 1)),
      0.1,
      SKY_RADIUS * Math.sin(i * Math.PI * 2 / (HORIZON_POINT_COUNT - 1)),
    ] as [number, number, number])
  ), []);

  useEffect(() => {
    const updateCameraOrientation = () => {
      const direction = new THREE.Vector3(
        Math.sin(yawRef.current) * Math.cos(pitchRef.current),
        Math.sin(pitchRef.current),
        -Math.cos(yawRef.current) * Math.cos(pitchRef.current),
      );
      camera.lookAt(camera.position.clone().add(direction));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      isDraggingRef.current = true;
      gl.domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      yawRef.current -= event.movementX * LOOK_SENSITIVITY;
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current + event.movementY * LOOK_SENSITIVITY,
        MIN_PITCH,
        MAX_PITCH,
      );
      updateCameraOrientation();
    };

    const stopDragging = () => {
      isDraggingRef.current = false;
      gl.domElement.style.cursor = 'grab';
    };

    gl.domElement.style.cursor = 'grab';
    gl.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    window.addEventListener('blur', stopDragging);

    return () => {
      gl.domElement.style.cursor = '';
      gl.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      window.removeEventListener('blur', stopDragging);
    };
  }, [camera, gl]);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      if (!initialPerspectiveRef.current) {
        initialPerspectiveRef.current = {
          fov: camera.fov,
          near: camera.near,
          far: camera.far,
          hasViewOffset: Boolean(camera.view?.enabled),
          fullWidth: camera.view?.fullWidth,
          fullHeight: camera.view?.fullHeight,
          offsetX: camera.view?.offsetX,
          offsetY: camera.view?.offsetY,
          width: camera.view?.width,
          height: camera.view?.height,
        };
      }

      camera.fov = 92;
      camera.near = 0.05;
      camera.far = 800;
      camera.setViewOffset(
        Math.round(size.width),
        Math.round(size.height * 1.24),
        0,
        0,
        Math.round(size.width),
        Math.round(size.height),
      );
      camera.updateProjectionMatrix();
    }
    return () => {
      const initialPerspective = initialPerspectiveRef.current;
      if (!(camera instanceof THREE.PerspectiveCamera) || !initialPerspective) {
        return;
      }

      camera.fov = initialPerspective.fov;
      camera.near = initialPerspective.near;
      camera.far = initialPerspective.far;

      if (initialPerspective.hasViewOffset) {
        camera.setViewOffset(
          initialPerspective.fullWidth ?? Math.round(size.width),
          initialPerspective.fullHeight ?? Math.round(size.height),
          initialPerspective.offsetX ?? 0,
          initialPerspective.offsetY ?? 0,
          initialPerspective.width ?? Math.round(size.width),
          initialPerspective.height ?? Math.round(size.height),
        );
      } else {
        camera.clearViewOffset();
      }

      camera.updateProjectionMatrix();
    };
  }, [camera, size.height, size.width]);

  useEffect(() => {
    if (hasInitializedViewRef.current) {
      return;
    }

    camera.up.set(0, 1, 0);
    camera.position.set(0, 0, CAMERA_DISTANCE);
    yawRef.current = 0;
    pitchRef.current = 0.24;
    const direction = new THREE.Vector3(
      Math.sin(yawRef.current) * Math.cos(pitchRef.current),
      Math.sin(pitchRef.current),
      -Math.cos(yawRef.current) * Math.cos(pitchRef.current),
    );
    camera.lookAt(camera.position.clone().add(direction));
    hasInitializedViewRef.current = true;
  }, [camera]);

  const moonProjection = useMemo(() => {
    const moon = getMoonPosition(currentTime);
    return projectEquatorialCoordinate(
      moon.ra,
      moon.dec,
      latitude,
      currentTime,
      SKY_OBJECT_RADIUS
    );
  }, [currentTime, latitude]);

  const planetProjections = useMemo(() => {
    return PLANET_BODIES.flatMap((planet) => {
      const position = getPlanetPosition(planet.name, currentTime);
      if (!position) {
        return [];
      }

      return [{
        name: planet.name,
        color: planet.color,
        ...projectEquatorialCoordinate(
          position.ra,
          position.dec,
          latitude,
          currentTime,
          SKY_OBJECT_RADIUS
        ),
      }];
    });
  }, [currentTime, latitude]);

  const diurnalArcSamples = useMemo(() => {
    return buildSunDiurnalArcSamples(currentTime, latitude, SKY_OBJECT_RADIUS, DIURNAL_SAMPLE_COUNT);
  }, [currentTime, latitude]);

  const visibleDiurnalSegments = useMemo(
    () => splitPointSegments(diurnalArcSamples, true),
    [diurnalArcSamples]
  );

  const observerStars = useMemo(() => {
    return buildObserverStarRenderData(
      CATALOG,
      latitude,
      currentTime,
      SKY_OBJECT_RADIUS,
      STAR_LABEL_RADIUS_SCALE,
      skyCulture
    );
  }, [currentTime, latitude, skyCulture]);

  const observerConstellationLines = useMemo(() => {
    return buildObserverConstellationLines(
      activeConstellations,
      CATALOG,
      latitude,
      currentTime,
      SKY_OBJECT_RADIUS
    );
  }, [activeConstellations, currentTime, latitude]);

  return (
    <group>
      <mesh
        position={[0, -CAMERA_GROUND_OFFSET, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        renderOrder={20}
      >
        <circleGeometry args={[GROUND_RADIUS, 96]} />
        <meshStandardMaterial color="#1a3320" roughness={0.82} depthWrite />
      </mesh>

      <Line
        points={horizonCirclePoints}
        color="#888888"
        lineWidth={2}
      />

      <EarthSkyReferenceLayer latitude={latitude} date={currentTime} />

      <EarthCompassLabels />

      <Billboard position={[0, SKY_RADIUS + 2, 0]}>
        <Text color="#c8d6e8" fontSize={1.15} anchorX="center" anchorY="middle">
          天顶
        </Text>
      </Billboard>

      {showStars && (
        <EarthSkyFieldLayer
          stars={observerStars}
          constellationLines={observerConstellationLines}
          spriteTexture={spriteTexture}
        />
      )}

      {showMoon && moonProjection.isVisible && (
        <group position={moonProjection.observerPosition}>
          <SkySprite position={[0, 0, 0]} color="#e8e8e8" size={MOON_SPRITE_SIZE} texture={spriteTexture} />
          <SkySprite position={[0, 0, 0]} color="#f4f4ff" size={MOON_SPRITE_SIZE * 1.25} opacity={0.1} texture={spriteTexture} />
        </group>
      )}

      {showPlanets && planetProjections.filter((planet) => planet.isVisible).map((planet) => (
        <group key={`earth-planet-${planet.name}`} position={planet.observerPosition}>
          <SkySprite position={[0, 0, 0]} color={planet.color} size={PLANET_SPRITE_SIZE} texture={spriteTexture} />
          <SkySprite position={[0, 0, 0]} color={planet.color} size={PLANET_SPRITE_SIZE * 1.2} opacity={0.08} texture={spriteTexture} />
        </group>
      ))}

      {showDiurnalArc && visibleDiurnalSegments.map((segment, index) => (
        <Line
          key={`earth-diurnal-${index}`}
          points={segment}
          color="#ffaa00"
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      ))}

      <ambientLight intensity={0.1} />

      <Sky
        distance={450000}
        sunPosition={NEUTRAL_SKY_SUN_POSITION}
        turbidity={2}
        rayleigh={0.18}
        mieCoefficient={0.002}
        mieDirectionalG={0.72}
      />
    </group>
  );
}
