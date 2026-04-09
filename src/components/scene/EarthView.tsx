import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Billboard, Line, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import {
  getMoonPhaseData,
  getMoonPosition,
  getPlanetPosition,
  getSunPosition,
  PLANET_BODIES,
} from '../../utils/ephemeris';
import { equatorialToCartesian, horizontalToCartesian } from '../../utils/astronomy';
import { projectEquatorialCoordinate } from '../../utils/skyProjection';
import { CATALOG, CONSTELLATIONS_BY_CULTURE, type SkyCulture } from '../../utils/stars';
import {
  BODY_LABEL_ANCHOR_X,
  BODY_LABEL_ANCHOR_Y,
  BODY_LABEL_OUTLINE_COLOR,
  BODY_LABEL_SPECS,
  EARTH_STAR_LABEL_OFFSET,
  SCENE_LABEL_FONT_URL,
  getLocalizedBodyLabel,
} from './sceneLabel.constants';
import {
  buildCelestialConstellationLines,
  buildCelestialStarRenderData,
  type RenderableConstellationLine,
  type RenderableStar,
} from '../../utils/starField';
import MoonPhaseDisc from './MoonPhaseDisc';
import { useSimulationTime } from '../../hooks/useSimulationTime';
import { buildCelestialToObserverQuaternion } from './builders/geometry';
import {
  buildAnnualSunEquatorialSamples,
  buildCelestialReferenceLayerData,
} from './builders/sceneData';
import EquatorialGridLayer from './layers/EquatorialGridLayer';

const SKY_RADIUS = 50;
const SKY_OBJECT_RADIUS = SKY_RADIUS * 0.9;
const HORIZON_POINT_COUNT = 65;
const STAR_LABEL_RADIUS_SCALE = 1.04;

const SKY_ZENITH_COLOR = '#040711';
const SKY_MID_COLOR = '#050b1d';
const SKY_HORIZON_GLOW_COLOR = '#112a46';

const CONSTELLATION_LINE_COLOR = '#6fa3d6';

const EARTH_STAR_SIZE_SCALE = SKY_OBJECT_RADIUS / 10;
const EARTH_STAR_LABEL_FONT_SIZE = 0.7;
const EARTH_MOON_LABEL_OFFSET: [number, number, number] = [0.28, 0.15, 0];
const EARTH_PLANET_LABEL_OFFSET: [number, number, number] = [0.26, 0.14, 0];
const CAMERA_DISTANCE = 1.2;
const CAMERA_GROUND_OFFSET = 0.08;
const GROUND_RADIUS = 220;
const LOOK_SENSITIVITY = 0.0045;
const MIN_PITCH = 0.001;
const MAX_PITCH = Math.PI / 2 - 0.02;

const MOON_SPRITE_SIZE = 1.45;
const PLANET_SPRITE_SIZE = 0.95;

const STAR_CORE_SIZE_SCALE = 2.05;
const STAR_GLOW_SIZE_SCALE = 5.4;
const STAR_GLOW_OPACITY = 0.06;

const HORIZON_LINE_COLOR = '#888888';
const HORIZON_LINE_OPACITY = 1;

const HORIZON_RING_INNER_RADIUS = SKY_RADIUS * 0.965;
const HORIZON_RING_OUTER_RADIUS = SKY_RADIUS * 1.015;
const HORIZON_RING_OPACITY = 0.12;

const EARTH_FOG_COLOR = '#0f2844';
const EARTH_FOG_NEAR = 16;
const EARTH_FOG_FAR = 74;
const CELESTIAL_GRID_SCALE = SKY_OBJECT_RADIUS / 10;

const BODY_REBUILD_INTERVAL_MS = 16;

// ---------------------------------------------------------------------------
// Snapshot type - all time-dependent data computed once per rebuild cycle
// ---------------------------------------------------------------------------
interface EarthBodySnapshot {
  sunProjection: ReturnType<typeof projectEquatorialCoordinate>;
  moonProjection: ReturnType<typeof projectEquatorialCoordinate>;
  moonPhase: ReturnType<typeof getMoonPhaseData>;
  planetProjections: Array<{
    name: string;
    color: string;
    isVisible: boolean;
    observerPosition: [number, number, number];
  }>;
}

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
    gradient.addColorStop(0.18, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.38, 'rgba(255,255,255,0.42)');
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
  blending = THREE.NormalBlending,
  texture,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  opacity?: number;
  blending?: THREE.Blending;
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
        blending={blending}
        fog={false}
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
            opacity={STAR_GLOW_OPACITY}
            blending={THREE.AdditiveBlending}
            texture={spriteTexture}
          />
        </group>
      ))}

      {stars.filter((star) => star.label).map((star) => (
        <Billboard key={`earth-star-label-${star.renderKey}`} position={star.position}>
          <Text
            position={EARTH_STAR_LABEL_OFFSET}
            color={star.color}
            fontSize={EARTH_STAR_LABEL_FONT_SIZE}
            anchorX="left"
            anchorY="middle"
            font={SCENE_LABEL_FONT_URL}
            fillOpacity={0.82}
            outlineWidth={0.006}
            outlineColor={BODY_LABEL_OUTLINE_COLOR}
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
          opacity={0.22}
          dashed
          dashSize={0.26}
          gapSize={0.3}
          renderOrder={18}
        />
      ))}
    </>
  );
}

function EarthHorizonGlow() {
  const points = useMemo(
    () => Array.from({ length: HORIZON_POINT_COUNT }).map((_, i) => {
      const azimuth = i * Math.PI * 2 / (HORIZON_POINT_COUNT - 1);
      const [x, , z] = horizontalToCartesian(azimuth, 0, SKY_RADIUS + 0.55);
      return [x, 0.12, z] as [number, number, number];
    }),
    []
  );

  return (
    <Line
      points={points}
      color={SKY_HORIZON_GLOW_COLOR}
      lineWidth={3.6}
      transparent
      opacity={0.11}
      renderOrder={7}
    />
  );
}


function EarthCompassLabels({ skyCulture }: { skyCulture: SkyCulture }) {
  const labels = useMemo(() => (
    (skyCulture === 'western'
      ? [
        { label: 'N', azimuth: 0 },
        { label: 'E', azimuth: Math.PI / 2 },
        { label: 'S', azimuth: Math.PI },
        { label: 'W', azimuth: (3 * Math.PI) / 2 },
      ]
      : [
        { label: '\u5317', azimuth: 0 },
        { label: '\u4e1c', azimuth: Math.PI / 2 },
        { label: '\u5357', azimuth: Math.PI },
        { label: '\u897f', azimuth: (3 * Math.PI) / 2 },
      ]).map((item) => {
      const [x, , z] = horizontalToCartesian(item.azimuth, 0, SKY_RADIUS + 2.2);
      return {
        ...item,
        position: [x, 0.8, z] as [number, number, number],
      };
    })
  ), [skyCulture]);

  return (
    <>
      {labels.map((item) => (
        <Billboard key={`earth-direction-${item.label}`} position={item.position}>
          <Text
            color="#e3edf7"
            fontSize={1.9}
            anchorX="center"
            anchorY="middle"
            font={SCENE_LABEL_FONT_URL}
          >
            {item.label}
          </Text>
        </Billboard>
      ))}
    </>
  );
}

function EarthSkyDome() {
  const nightSkyMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uZenithColor: { value: new THREE.Color(SKY_ZENITH_COLOR) },
        uMidColor: { value: new THREE.Color(SKY_MID_COLOR) },
        uHorizonColor: { value: new THREE.Color(SKY_HORIZON_GLOW_COLOR) },
      },
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldDir;
        uniform vec3 uZenithColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        void main() {
          float up = clamp(vWorldDir.y, 0.0, 1.0);
          float horizonToMid = smoothstep(0.0, 0.28, up);
          float midToZenith = smoothstep(0.52, 1.0, up);

          vec3 col = mix(uHorizonColor, uMidColor, horizonToMid);
          col = mix(col, uZenithColor, midToZenith);

          float horizonGlow = pow(1.0 - horizonToMid, 2.0) * 0.34;
          col += horizonGlow * uHorizonColor;

          float n = hash(gl_FragCoord.xy) - 0.5;
          col += n * 0.02;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      toneMapped: false,
    });

    return material;
  }, []);

  useEffect(() => () => nightSkyMaterial.dispose(), [nightSkyMaterial]);

  return (
    <>
      <mesh renderOrder={1}>
        <sphereGeometry args={[SKY_RADIUS, 48, 48]} />
        <primitive attach="material" object={nightSkyMaterial} />
      </mesh>
    </>
  );
}

function EarthDynamicBodiesLayer({
  simDateRef,
  skyCulture,
  showMoon,
  showPlanets,
  spriteTexture,
}: {
  simDateRef: { current: Date };
  skyCulture: SkyCulture;
  showMoon: boolean;
  showPlanets: boolean;
  spriteTexture: THREE.Texture | null;
}) {
  const lastBodyUpdateRef = useRef(0);
  const lastMoonPhaseUpdateRef = useRef(0);
  const latitudeRef = useRef(useAppStore.getState().observer.latitude);
  const sunGroupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const planetGroupRefs = useRef<Record<string, THREE.Group | null>>({});
  const [moonPhase, setMoonPhase] = useState(() => getMoonPhaseData(simDateRef.current));

  const applySnapshot = useCallback((snapshot: EarthBodySnapshot) => {
    if (sunGroupRef.current) {
      sunGroupRef.current.visible = snapshot.sunProjection.isVisible;
      sunGroupRef.current.position.set(...snapshot.sunProjection.observerPosition);
    }

    if (moonGroupRef.current) {
      moonGroupRef.current.visible = showMoon && snapshot.moonProjection.isVisible;
      moonGroupRef.current.position.set(...snapshot.moonProjection.observerPosition);
    }

    PLANET_BODIES.forEach((planetBody) => {
      const planetGroup = planetGroupRefs.current[planetBody.name];
      if (!planetGroup) {
        return;
      }

      const planet = snapshot.planetProjections.find((item) => item.name === planetBody.name);
      planetGroup.visible = showPlanets && Boolean(planet?.isVisible);

      if (planet) {
        planetGroup.position.set(...planet.observerPosition);
      }
    });
  }, [showMoon, showPlanets]);

  useEffect(() => {
    const syncBodiesForLatitude = (latitude: number) => {
      latitudeRef.current = latitude;
      const snapshot = buildEarthBodySnapshot(simDateRef.current, latitude);
      lastBodyUpdateRef.current = performance.now();
      applySnapshot(snapshot);
      setMoonPhase(snapshot.moonPhase);
    };

    syncBodiesForLatitude(latitudeRef.current);

    const unsubscribe = useAppStore.subscribe((state, previousState) => {
      if (state.observer.latitude !== previousState.observer.latitude) {
        syncBodiesForLatitude(state.observer.latitude);
      }
    });

    return unsubscribe;
  }, [applySnapshot, simDateRef]);

  useEffect(() => {
    const snapshot = buildEarthBodySnapshot(simDateRef.current, latitudeRef.current);
    applySnapshot(snapshot);
  }, [applySnapshot, simDateRef]);

  useFrame(() => {
    const wallNow = performance.now();
    if (wallNow - lastBodyUpdateRef.current < BODY_REBUILD_INTERVAL_MS) {
      return;
    }
    lastBodyUpdateRef.current = wallNow;

    const snapshot = buildEarthBodySnapshot(simDateRef.current, latitudeRef.current);
    applySnapshot(snapshot);

    if (wallNow - lastMoonPhaseUpdateRef.current >= 1000) {
      lastMoonPhaseUpdateRef.current = wallNow;
      setMoonPhase(snapshot.moonPhase);
    }
  });

  return (
    <>
      <group ref={sunGroupRef} visible={false}>
        <SkySprite
          position={[0, 0, 0]}
          color="#ffd166"
          size={PLANET_SPRITE_SIZE * 4.4}
          texture={spriteTexture}
        />
        <SkySprite
          position={[0, 0, 0]}
          color="#ffe9a8"
          size={PLANET_SPRITE_SIZE * 6.8}
          opacity={0.075}
          blending={THREE.AdditiveBlending}
          texture={spriteTexture}
        />
        <Billboard position={[0, 0, 0]}>
          <Text
            position={BODY_LABEL_SPECS.sun.offset}
            color="#fff1b8"
            font={SCENE_LABEL_FONT_URL}
            fontSize={BODY_LABEL_SPECS.sun.fontSize}
            anchorX={BODY_LABEL_ANCHOR_X}
            anchorY={BODY_LABEL_ANCHOR_Y}
            fillOpacity={BODY_LABEL_SPECS.sun.fillOpacity}
            outlineWidth={BODY_LABEL_SPECS.sun.outlineWidth}
            outlineColor={BODY_LABEL_OUTLINE_COLOR}
          >
            {getLocalizedBodyLabel('Sun', skyCulture)}
          </Text>
        </Billboard>
      </group>

      <group ref={moonGroupRef} visible={false}>
        <MoonPhaseDisc
          position={[0, 0, 0]}
          illuminatedFraction={moonPhase.illuminatedFraction}
          waxing={moonPhase.waxing}
          size={MOON_SPRITE_SIZE}
        />
        <SkySprite
          position={[0, 0, 0]}
          color="#f4f4ff"
          size={MOON_SPRITE_SIZE * 1.35}
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          texture={spriteTexture}
        />
        <Billboard position={[0, 0, 0]}>
          <Text
            position={EARTH_MOON_LABEL_OFFSET}
            color="#eaf2ff"
            font={SCENE_LABEL_FONT_URL}
            fontSize={EARTH_STAR_LABEL_FONT_SIZE}
            anchorX={BODY_LABEL_ANCHOR_X}
            anchorY={BODY_LABEL_ANCHOR_Y}
            fillOpacity={BODY_LABEL_SPECS.moon.fillOpacity}
            outlineWidth={BODY_LABEL_SPECS.moon.outlineWidth}
            outlineColor={BODY_LABEL_OUTLINE_COLOR}
          >
            {getLocalizedBodyLabel('Moon', skyCulture)}
          </Text>
        </Billboard>
      </group>

      {PLANET_BODIES.map((planet) => (
        <group
          key={`earth-planet-${planet.name}`}
          ref={(node) => {
            planetGroupRefs.current[planet.name] = node;
          }}
          visible={false}
        >
          <SkySprite
            position={[0, 0, 0]}
            color={planet.color}
            size={PLANET_SPRITE_SIZE}
            texture={spriteTexture}
          />
          <SkySprite
            position={[0, 0, 0]}
            color={planet.color}
            size={PLANET_SPRITE_SIZE * 1.35}
            opacity={0.045}
            blending={THREE.AdditiveBlending}
            texture={spriteTexture}
          />
          <Billboard position={[0, 0, 0]}>
            <Text
              position={EARTH_PLANET_LABEL_OFFSET}
              color={planet.color}
              font={SCENE_LABEL_FONT_URL}
              fontSize={EARTH_STAR_LABEL_FONT_SIZE}
              anchorX={BODY_LABEL_ANCHOR_X}
              anchorY={BODY_LABEL_ANCHOR_Y}
              fillOpacity={BODY_LABEL_SPECS.planet.fillOpacity}
              outlineWidth={BODY_LABEL_SPECS.planet.outlineWidth}
              outlineColor={BODY_LABEL_OUTLINE_COLOR}
            >
              {getLocalizedBodyLabel(planet.name, skyCulture)}
            </Text>
          </Billboard>
        </group>
      ))}
    </>
  );
}

export default function EarthView() {
  const { camera, gl, size } = useThree();
  const isDraggingRef = useRef(false);
  const hasInitializedViewRef = useRef(false);
  const latitudeRef = useRef(useAppStore.getState().observer.latitude);
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

  // -----------------------------------------------------------------------
  // Performance fix: use imperative simulation time instead of store currentTime.
  // Scene data is rebuilt at ~7fps via useFrame throttle, NOT every React frame.
  // -----------------------------------------------------------------------
  const { simDateRef } = useSimulationTime();
  const rotatingSkyRef = useRef<THREE.Group>(null);

  const { skyCulture } = useAppStore((state) => state.scene);
  const displayYear = useAppStore((state) => state.clock.displayTime.getUTCFullYear());
  const {
    showAnnualTrail,
    showStars,
    showMoon,
    showPlanets,
  } = useAppStore((state) => state.display);

  const activeConstellations = useMemo(
    () => CONSTELLATIONS_BY_CULTURE[skyCulture],
    [skyCulture]
  );
  const spriteTexture = useRadialSpriteTexture();
  const celestialReferenceData = useMemo(
    () => buildCelestialReferenceLayerData(),
    []
  );
  const annualSunEquatorialSamples = useMemo(
    () => buildAnnualSunEquatorialSamples(displayYear),
    [displayYear]
  );
  const celestialStarField = useMemo(() => ({
    stars: buildCelestialStarRenderData(
      CATALOG,
      SKY_OBJECT_RADIUS,
      STAR_LABEL_RADIUS_SCALE,
      skyCulture
    ),
    constellationLines: buildCelestialConstellationLines(
      activeConstellations,
      CATALOG,
      SKY_OBJECT_RADIUS
    ),
  }), [activeConstellations, skyCulture]);
  const celestialEclipticPoints = useMemo(
    () => annualSunEquatorialSamples.map(({ ra, dec }) => (
      new THREE.Vector3(...equatorialToCartesian(ra, dec, SKY_OBJECT_RADIUS))
    )),
    [annualSunEquatorialSamples]
  );

  const horizonCirclePoints = useMemo(() => (
    Array.from({ length: HORIZON_POINT_COUNT }).map((_, i) => [
      SKY_RADIUS * Math.cos(i * Math.PI * 2 / (HORIZON_POINT_COUNT - 1)),
      0.1,
      SKY_RADIUS * Math.sin(i * Math.PI * 2 / (HORIZON_POINT_COUNT - 1)),
    ] as [number, number, number])
  ), []);

  // -----------------------------------------------------------------------
  useFrame(() => {
    if (rotatingSkyRef.current) {
      rotatingSkyRef.current.quaternion.copy(
        buildCelestialToObserverQuaternion(latitudeRef.current, simDateRef.current)
      );
    }
  });

  useEffect(() => {
    const syncSkyRotation = (latitude: number) => {
      latitudeRef.current = latitude;
      if (rotatingSkyRef.current) {
        rotatingSkyRef.current.quaternion.copy(
          buildCelestialToObserverQuaternion(latitude, simDateRef.current)
        );
      }
    };

    syncSkyRotation(latitudeRef.current);

    const unsubscribe = useAppStore.subscribe((state, previousState) => {
      if (state.observer.latitude !== previousState.observer.latitude) {
        syncSkyRotation(state.observer.latitude);
      }
    });

    return unsubscribe;
  }, [simDateRef]);
  const staticSkyLayer = (
    <>
      <EarthSkyDome />
      <EarthHorizonGlow />
      <EarthCompassLabels skyCulture={skyCulture} />
      <Billboard position={[0, SKY_RADIUS + 2, 0]}>
        <Text color="#cfd8e6" fontSize={1.1} anchorX="center" anchorY="middle" font={SCENE_LABEL_FONT_URL}>
          {skyCulture === 'western' ? 'Zenith' : '\u5929\u9876'}
        </Text>
      </Billboard>
    </>
  );
  const rotatingSkyLayer = useMemo(() => (
    <group ref={rotatingSkyRef}>
      <group scale={[CELESTIAL_GRID_SCALE, CELESTIAL_GRID_SCALE, CELESTIAL_GRID_SCALE]}>
        <EquatorialGridLayer
          prefix="earth-celestial-grid"
          declinationGrid={celestialReferenceData.declinationGrid}
          hourGrid={celestialReferenceData.hourGrid}
          equatorSegments={celestialReferenceData.equatorSegments}
          equatorLabelPosition={celestialReferenceData.equatorLabelPosition}
          declinationOpacity={0.11}
          hourOpacity={0.09}
          equatorOpacity={0.18}
          equatorLineWidth={1.35}
        />
      </group>

      {showStars && (
        <EarthSkyFieldLayer
          stars={celestialStarField.stars}
          constellationLines={celestialStarField.constellationLines}
          spriteTexture={spriteTexture}
        />
      )}

      {showAnnualTrail && (
        <Line
          points={celestialEclipticPoints}
          color="#ffe066"
          lineWidth={1.9}
          transparent
          opacity={0.82}
          dashed
          dashScale={10}
          dashSize={1.1}
          gapSize={0.5}
        />
      )}
    </group>
  ), [
    celestialEclipticPoints,
    celestialReferenceData.declinationGrid,
    celestialReferenceData.equatorLabelPosition,
    celestialReferenceData.equatorSegments,
    celestialReferenceData.hourGrid,
    celestialStarField.constellationLines,
    celestialStarField.stars,
    showAnnualTrail,
    showStars,
    spriteTexture,
  ]);

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

      camera.fov = 80;
      camera.near = 0.05;
      camera.far = 800;
      camera.clearViewOffset();
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

  return (
    <group>
      <fog attach="fog" args={[EARTH_FOG_COLOR, EARTH_FOG_NEAR, EARTH_FOG_FAR]} />

      <mesh
        position={[0, -CAMERA_GROUND_OFFSET, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        renderOrder={40}
      >
        <circleGeometry args={[GROUND_RADIUS, 96]} />
        <meshBasicMaterial
          color="#070b14"
          transparent
          opacity={1}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -CAMERA_GROUND_OFFSET + 0.002, 0]} renderOrder={7}>
        <ringGeometry args={[HORIZON_RING_INNER_RADIUS, HORIZON_RING_OUTER_RADIUS, 160]} />
        <meshBasicMaterial
          color={SKY_HORIZON_GLOW_COLOR}
          transparent
          opacity={HORIZON_RING_OPACITY}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <Line
        points={horizonCirclePoints}
        color={HORIZON_LINE_COLOR}
        lineWidth={2}
        opacity={HORIZON_LINE_OPACITY}
        renderOrder={41}
      />

      {/* Pass snapshot date instead of live currentTime */}
      {staticSkyLayer}
      {rotatingSkyLayer}
      <EarthDynamicBodiesLayer
        simDateRef={simDateRef}
        skyCulture={skyCulture}
        showMoon={showMoon}
        showPlanets={showPlanets}
        spriteTexture={spriteTexture}
      />

      <ambientLight intensity={0.06} />
      <hemisphereLight args={["#0d1d34", "#070b14", 0.065]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Pure helpers - keep slow-moving bodies separate from the rigidly rotating sky
// ---------------------------------------------------------------------------
function buildEarthBodySnapshot(
  date: Date,
  latitude: number,
): EarthBodySnapshot {
  const sun = getSunPosition(date);
  const sunProjection = projectEquatorialCoordinate(
    sun.ra, sun.dec, latitude, date, SKY_OBJECT_RADIUS
  );

  const moon = getMoonPosition(date);
  const moonProjection = projectEquatorialCoordinate(
    moon.ra, moon.dec, latitude, date, SKY_OBJECT_RADIUS
  );

  const moonPhase = getMoonPhaseData(date);

  const planetProjections = PLANET_BODIES.flatMap((planet) => {
    const position = getPlanetPosition(planet.name, date);
    if (!position) return [];
    return [{
      name: planet.name,
      color: planet.color,
      ...projectEquatorialCoordinate(
        position.ra, position.dec, latitude, date, SKY_OBJECT_RADIUS
      ),
    }];
  });

  return {
    sunProjection,
    moonProjection,
    moonPhase,
    planetProjections,
  };
}
