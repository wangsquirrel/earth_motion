import { useMemo, useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { getMoonPhaseData } from '../../utils/ephemeris';
import { useAppStore } from '../../store/useAppStore';
import { useSimulationTime } from '../../hooks/useSimulationTime';
import { useShallow } from 'zustand/react/shallow';
import { CATALOG, CONSTELLATIONS_BY_CULTURE } from '../../utils/stars';
import {
  buildCelestialConstellationLines,
  buildCelestialStarRenderData,
  buildObserverConstellationLines,
  buildObserverStarRenderData,
} from '../../utils/starField';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import {
  INITIAL_CAMERA_TARGET_X,
  INITIAL_CAMERA_TARGET_Y,
  INITIAL_CAMERA_Y,
  OBSERVER_FRAME_SCALE,
  SPHERE_RADIUS,
  VIEWPORT_LEFT_SHIFT_RATIO,
} from './SpaceView.constants';
import {
  buildObserverFrameQuaternion,
} from './builders/geometry';
import {
  buildAnnualProjectionLayerData,
  buildAnnualSunEquatorialSamples,
  buildBodyRenderData,
  buildCelestialObserverOverlayData,
  buildCelestialObserverOverlayEmphasis,
  buildCelestialReferenceLayerData,
  buildCelestialSceneData,
  buildDiurnalLayerData,
  buildHorizonLabels,
  buildMonthlySunEquatorialLabelSamples,
  buildObserverAxisPoints,
  buildObserverReferenceLayerData,
  buildObserverSceneData,
  buildProjectedSceneBodies,
} from './builders/sceneData';
import {
  AnnualLayer,
  CelestialObserverOverlay,
  CelestialReferenceLayer,
  DiurnalLayer,
  ObserverReferenceLayer,
  SceneBodiesLayer,
  StarFieldLayer,
} from './layers';
import type {
  CelestialSceneData,
  ObserverSceneData,
} from './spaceView.types';

/**
 * Throttled scene data snapshot, rebuilt from simDateRef at ~7fps inside useFrame.
 * This replaces the old pattern where every useMemo depended on `currentTime`
 * (which changed at 60fps and caused full React re-renders every frame).
 */
interface StaticSceneSnapshot {
  observerReferenceData: ReturnType<typeof buildObserverReferenceLayerData>;
  observerAxisPoints: ReturnType<typeof buildObserverAxisPoints>;
  diurnalLayerData: ObserverSceneData['diurnalLayer'];
  celestialObserverOverlayData: ReturnType<typeof buildCelestialObserverOverlayData>;
  observerFrameQuaternion: THREE.Quaternion;
}

interface BodySceneSnapshot {
  bodyRenderData: ReturnType<typeof buildBodyRenderData>;
  moonPhase: ReturnType<typeof getMoonPhaseData>;
}

interface AnnualSceneSnapshot {
  annualProjection: ReturnType<typeof buildAnnualProjectionLayerData>;
}

const BODY_REBUILD_INTERVAL_MS = 33;
const ANNUAL_REBUILD_INTERVAL_MS = 33;
const OBSERVER_STARFIELD_REBUILD_INTERVAL_MS = 24;
const STATIC_SCENE_REBUILD_INTERVAL_MS = 33;

function bodyInputsChanged(
  previous: { latitude: number; isCelestialFrame: boolean; showMoon: boolean; showPlanets: boolean },
  next: { latitude: number; isCelestialFrame: boolean; showMoon: boolean; showPlanets: boolean },
) {
  return previous.latitude !== next.latitude
    || previous.isCelestialFrame !== next.isCelestialFrame
    || previous.showMoon !== next.showMoon
    || previous.showPlanets !== next.showPlanets;
}

function annualInputsChanged(
  previous: { latitude: number; isCelestialFrame: boolean; year: number },
  next: { latitude: number; isCelestialFrame: boolean; year: number },
) {
  return previous.latitude !== next.latitude
    || previous.isCelestialFrame !== next.isCelestialFrame
    || previous.year !== next.year;
}

function observerStarFieldInputsChanged(
  previous: { latitude: number; skyCulture: 'western' | 'chinese' },
  next: { latitude: number; skyCulture: 'western' | 'chinese' },
) {
  return previous.latitude !== next.latitude || previous.skyCulture !== next.skyCulture;
}

function staticSceneInputsChanged(
  previous: { latitude: number; isCelestialFrame: boolean },
  next: { latitude: number; isCelestialFrame: boolean },
) {
  return previous.latitude !== next.latitude || previous.isCelestialFrame !== next.isCelestialFrame;
}

function buildSpaceBodySnapshot(
  currentTime: Date,
  latitude: number,
  isCelestialFrame: boolean,
  showMoon: boolean,
  showPlanets: boolean
): BodySceneSnapshot {
  const projectedBodies = buildProjectedSceneBodies({ currentTime, latitude, isCelestialFrame });

  return {
    bodyRenderData: buildBodyRenderData({
      projectedBodies,
      isCelestialFrame,
      showMoon,
      showPlanets,
    }),
    moonPhase: getMoonPhaseData(currentTime),
  };
}

function buildStaticSceneSnapshot(
  currentTime: Date,
  latitude: number,
  isCelestialFrame: boolean,
  bodySnapshot: BodySceneSnapshot
): StaticSceneSnapshot {
  const observerFrameQuaternion = buildObserverFrameQuaternion(latitude, currentTime);
  const diurnalLayerData = buildDiurnalLayerData(currentTime, latitude);

  return {
    observerReferenceData: buildObserverReferenceLayerData(latitude, currentTime),
    observerAxisPoints: buildObserverAxisPoints(latitude),
    diurnalLayerData: {
      ...diurnalLayerData,
      rayPoint: bodySnapshot.bodyRenderData.sun.isAboveHorizon
        ? bodySnapshot.bodyRenderData.sun.observerRayPoint
        : null,
    },
    celestialObserverOverlayData: buildCelestialObserverOverlayData(observerFrameQuaternion),
    observerFrameQuaternion,
  };
}

function buildAnnualSceneSnapshot(
  currentTime: Date,
  latitude: number,
  isCelestialFrame: boolean,
): AnnualSceneSnapshot {
  const annualSunEquatorialSamples = buildAnnualSunEquatorialSamples(currentTime.getUTCFullYear());
  const monthLabels = buildMonthlySunEquatorialLabelSamples(currentTime.getUTCFullYear());

  return {
    annualProjection: buildAnnualProjectionLayerData({
      samples: annualSunEquatorialSamples,
      monthLabels,
      latitude,
      observerDate: currentTime,
      isCelestialFrame,
    }),
  };
}

export default function SpaceView() {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const hasInitializedCameraRef = useRef(false);
  const lastReferenceFrameRef = useRef<'observer' | 'celestial'>('observer');
  const lastCelestialObserverQuaternionRef = useRef<THREE.Quaternion | null>(null);
  const savedObserverViewRef = useRef<{
    position: THREE.Vector3;
    up: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const initialLatitudeRef = useRef(useAppStore.getState().observer.latitude);

  // Non-time-dependent store state
  const { isPlaying, timeSpeed } = useAppStore(
    useShallow((state) => ({
      isPlaying: state.clock.isPlaying,
      timeSpeed: state.clock.timeSpeed,
    }))
  );
  const { referenceFrame, skyCulture } = useAppStore(useShallow((state) => state.scene));
  const {
    showDiurnalArc,
    showAnnualTrail,
    showStars,
    showCelestialObserverOverlay,
    showMoon,
    showPlanets,
  } = useAppStore(
    useShallow((state) => ({
      showDiurnalArc: state.display.showDiurnalArc,
      showAnnualTrail: state.display.showAnnualTrail,
      showStars: state.display.showStars,
      showCelestialObserverOverlay: state.display.showCelestialObserverOverlay,
      showMoon: state.display.showMoon,
      showPlanets: state.display.showPlanets,
    }))
  );

  const isCelestialFrame = referenceFrame === 'celestial';

  // --- Simulation time (imperative, drives useFrame) ---
  const { simDateRef } = useSimulationTime();

  // --- Scene snapshot: rebuilt at ~7fps, triggers React re-render ---
  const lastBodyRebuildRef = useRef(0);
  const lastAnnualRebuildRef = useRef(0);
  const lastObserverStarfieldRebuildRef = useRef(0);
  const lastStaticRebuildRef = useRef(0);
  const lastBodyInputsRef = useRef({
    latitude: initialLatitudeRef.current,
    isCelestialFrame,
    showMoon,
    showPlanets,
  });
  const lastAnnualInputsRef = useRef({
    latitude: initialLatitudeRef.current,
    isCelestialFrame,
    year: simDateRef.current.getUTCFullYear(),
  });
  const lastObserverStarFieldInputsRef = useRef({
    latitude: initialLatitudeRef.current,
    skyCulture,
  });
  const lastStaticInputsRef = useRef({
    latitude: initialLatitudeRef.current,
    isCelestialFrame,
  });
  const activeConstellations = useMemo(
    () => CONSTELLATIONS_BY_CULTURE[skyCulture],
    [skyCulture]
  );
  const [bodySnapshot, setBodySnapshot] = useState<BodySceneSnapshot>(() => {
    const now = new Date();
    return buildSpaceBodySnapshot(now, initialLatitudeRef.current, isCelestialFrame, showMoon, showPlanets);
  });
  const [staticSnapshot, setStaticSnapshot] = useState<StaticSceneSnapshot>(() => {
    const now = new Date();
    const initialBodySnapshot = buildSpaceBodySnapshot(now, initialLatitudeRef.current, isCelestialFrame, showMoon, showPlanets);
    return buildStaticSceneSnapshot(now, initialLatitudeRef.current, isCelestialFrame, initialBodySnapshot);
  });
  const [annualSnapshot, setAnnualSnapshot] = useState<AnnualSceneSnapshot>(() => {
    const now = new Date();
    return buildAnnualSceneSnapshot(now, initialLatitudeRef.current, isCelestialFrame);
  });
  const [observerStarField, setObserverStarField] = useState(() => ({
    stars: buildObserverStarRenderData(
      CATALOG,
      initialLatitudeRef.current,
      new Date(),
      SPHERE_RADIUS,
      1.04,
      skyCulture
    ),
    constellationLines: buildObserverConstellationLines(
      activeConstellations,
      CATALOG,
      initialLatitudeRef.current,
      new Date(),
      SPHERE_RADIUS
    ),
  }));

  // --- Static data (no time dependency) ---
  const celestialReferenceData = useMemo(
    () => buildCelestialReferenceLayerData(),
    []
  );

  const horizonLabels = useMemo(() => buildHorizonLabels(), []);

  const celestialObserverOverlayEmphasis = useMemo(
    () => buildCelestialObserverOverlayEmphasis(isPlaying, timeSpeed),
    [isPlaying, timeSpeed]
  );

  const celestialStarField = useMemo(() => {
    return {
      stars: buildCelestialStarRenderData(CATALOG, SPHERE_RADIUS, 1.04, skyCulture),
      constellationLines: buildCelestialConstellationLines(activeConstellations, CATALOG, SPHERE_RADIUS),
    };
  }, [activeConstellations, skyCulture]);

  // --- useFrame: throttled scene data rebuild ---
  useFrame(() => {
    const now = performance.now();
    const currentDate = simDateRef.current;
    const state = useAppStore.getState();
    const lat = state.observer.latitude;
    const frame = state.scene.referenceFrame;
    const culture = state.scene.skyCulture;
    const isCelestial = frame === 'celestial';
    const display = state.display;
    const nextBodyInputs = {
      latitude: lat,
      isCelestialFrame: isCelestial,
      showMoon: display.showMoon,
      showPlanets: display.showPlanets,
    };
    const nextAnnualInputs = {
      latitude: lat,
      isCelestialFrame: isCelestial,
      year: currentDate.getUTCFullYear(),
    };
    const nextObserverStarFieldInputs = {
      latitude: lat,
      skyCulture: culture,
    };
    const nextStaticInputs = {
      latitude: lat,
      isCelestialFrame: isCelestial,
    };

    let latestBodySnapshot: BodySceneSnapshot | null = null;

    if (
      bodyInputsChanged(lastBodyInputsRef.current, nextBodyInputs)
      || now - lastBodyRebuildRef.current >= BODY_REBUILD_INTERVAL_MS
    ) {
      lastBodyRebuildRef.current = now;
      lastBodyInputsRef.current = nextBodyInputs;
      latestBodySnapshot = buildSpaceBodySnapshot(
        currentDate,
        lat,
        isCelestial,
        display.showMoon,
        display.showPlanets
      );
      setBodySnapshot(latestBodySnapshot);
    }

    if (
      annualInputsChanged(lastAnnualInputsRef.current, nextAnnualInputs)
      || now - lastAnnualRebuildRef.current >= ANNUAL_REBUILD_INTERVAL_MS
    ) {
      lastAnnualRebuildRef.current = now;
      lastAnnualInputsRef.current = nextAnnualInputs;
      setAnnualSnapshot(
        buildAnnualSceneSnapshot(
          currentDate,
          lat,
          isCelestial
        )
      );
    }

    if (
      observerStarFieldInputsChanged(lastObserverStarFieldInputsRef.current, nextObserverStarFieldInputs)
      || now - lastObserverStarfieldRebuildRef.current >= OBSERVER_STARFIELD_REBUILD_INTERVAL_MS
    ) {
      lastObserverStarfieldRebuildRef.current = now;
      lastObserverStarFieldInputsRef.current = nextObserverStarFieldInputs;
      setObserverStarField({
        stars: buildObserverStarRenderData(
          CATALOG,
          lat,
          currentDate,
          SPHERE_RADIUS,
          1.04,
          culture
        ),
        constellationLines: buildObserverConstellationLines(
          CONSTELLATIONS_BY_CULTURE[culture],
          CATALOG,
          lat,
          currentDate,
          SPHERE_RADIUS
        ),
      });
    }

    if (
      staticSceneInputsChanged(lastStaticInputsRef.current, nextStaticInputs)
      || now - lastStaticRebuildRef.current >= STATIC_SCENE_REBUILD_INTERVAL_MS
    ) {
      lastStaticRebuildRef.current = now;
      lastStaticInputsRef.current = nextStaticInputs;
      const bodyForStatic = latestBodySnapshot ?? buildSpaceBodySnapshot(
        currentDate,
        lat,
        isCelestial,
        display.showMoon,
        display.showPlanets
      );
      setStaticSnapshot(
        buildStaticSceneSnapshot(
          currentDate,
          lat,
          isCelestial,
          bodyForStatic
        )
      );
    }
  });

  // --- Camera setup ---
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.setViewOffset(
        Math.round(size.width),
        Math.round(size.height),
        Math.round(size.width * VIEWPORT_LEFT_SHIFT_RATIO),
        0,
        Math.round(size.width),
        Math.round(size.height)
      );
      camera.updateProjectionMatrix();
    }
    return () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.clearViewOffset();
        camera.updateProjectionMatrix();
      }
    };
  }, [camera, size.height, size.width]);

  useEffect(() => {
    if (hasInitializedCameraRef.current) return;
    camera.up.set(0, 1, 0);
    camera.position.set(16, INITIAL_CAMERA_Y, 18);
    camera.lookAt(INITIAL_CAMERA_TARGET_X, INITIAL_CAMERA_TARGET_Y, 0);
    controlsRef.current?.object.up.set(0, 1, 0);
    controlsRef.current?.target.set(INITIAL_CAMERA_TARGET_X, INITIAL_CAMERA_TARGET_Y, 0);
    controlsRef.current?.update();
    hasInitializedCameraRef.current = true;
  }, [camera]);

  // --- Reference frame switch ---
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const previousFrame = lastReferenceFrameRef.current;
    if (previousFrame === referenceFrame) return;

    const quat = buildObserverFrameQuaternion(useAppStore.getState().observer.latitude, simDateRef.current);

    if (referenceFrame === 'celestial') {
      savedObserverViewRef.current = {
        position: camera.position.clone(),
        up: camera.up.clone(),
        target: controls.target.clone(),
      };
      camera.position.applyQuaternion(quat);
      camera.up.applyQuaternion(quat);
      controls.target.applyQuaternion(quat);
      camera.lookAt(controls.target);
      controls.update();
      lastCelestialObserverQuaternionRef.current = quat.clone();
    } else if (savedObserverViewRef.current) {
      camera.position.copy(savedObserverViewRef.current.position);
      camera.up.copy(savedObserverViewRef.current.up);
      controls.target.copy(savedObserverViewRef.current.target);
      camera.lookAt(controls.target);
      controls.update();
      lastCelestialObserverQuaternionRef.current = null;
    }

    lastReferenceFrameRef.current = referenceFrame;
  }, [camera, referenceFrame, simDateRef]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const syncCelestialCameraForLatitude = (nextLatitude: number) => {
      if (lastReferenceFrameRef.current !== 'celestial') {
        return;
      }

      const nextQuat = buildObserverFrameQuaternion(nextLatitude, simDateRef.current);
      const previousQuat = lastCelestialObserverQuaternionRef.current;

      if (!previousQuat) {
        lastCelestialObserverQuaternionRef.current = nextQuat.clone();
        return;
      }

      const deltaQuat = nextQuat.clone().multiply(previousQuat.clone().invert());
      camera.position.applyQuaternion(deltaQuat);
      camera.up.applyQuaternion(deltaQuat);
      controls.target.applyQuaternion(deltaQuat);
      camera.lookAt(controls.target);
      controls.update();
      lastCelestialObserverQuaternionRef.current = nextQuat.clone();
    };

    const unsubscribe = useAppStore.subscribe((state, previousState) => {
      if (state.observer.latitude !== previousState.observer.latitude) {
        syncCelestialCameraForLatitude(state.observer.latitude);
      }
    });

    return unsubscribe;
  }, [camera, simDateRef]);

  // --- Derived flags ---
  const showObserverDiurnalArc = showDiurnalArc && !isCelestialFrame;
  const showAnnualLayer = showAnnualTrail;

  // Build scene data wrappers (using snapshot + static data)
  const observerSceneData = useMemo<ObserverSceneData>(() => {
    return buildObserverSceneData({
      referenceLayer: staticSnapshot.observerReferenceData,
      starField: {
        stars: observerStarField.stars,
        constellationLines: observerStarField.constellationLines,
      },
      annualLayer: annualSnapshot.annualProjection,
      diurnalLayer: staticSnapshot.diurnalLayerData,
    });
  }, [annualSnapshot, observerStarField, staticSnapshot]);

  const celestialSceneData = useMemo<CelestialSceneData>(() => {
    return buildCelestialSceneData({
      referenceLayer: celestialReferenceData,
      starField: {
        stars: celestialStarField.stars,
        constellationLines: celestialStarField.constellationLines,
      },
      annualLayer: annualSnapshot.annualProjection,
      observerOverlay: staticSnapshot.celestialObserverOverlayData,
      observerOverlayEmphasis: celestialObserverOverlayEmphasis,
    });
  }, [annualSnapshot, staticSnapshot, celestialStarField, celestialReferenceData, celestialObserverOverlayEmphasis]);

  const observerFrameLayer = useMemo(() => {
    if (isCelestialFrame) {
      return null;
    }

    return (
      <group>
        <ObserverReferenceLayer
          prefix="observer"
          declinationGrid={observerSceneData.referenceLayer.declinationGrid}
          hourGrid={observerSceneData.referenceLayer.hourGrid}
          equatorSegments={observerSceneData.referenceLayer.equatorSegments}
          equatorLabelPosition={observerSceneData.referenceLayer.equatorLabelPosition}
          horizonLabels={horizonLabels}
          observerAxisPoints={staticSnapshot.observerAxisPoints}
        />

        {showStars && (
          <StarFieldLayer
            prefix="observer"
            stars={observerSceneData.starField.stars}
            constellationLines={observerSceneData.starField.constellationLines}
          />
        )}

        {showAnnualLayer && (
          <AnnualLayer
            prefix={observerSceneData.annualLayer.prefix}
            fullPath={observerSceneData.annualLayer.fullPath}
            fullPathDashed={observerSceneData.annualLayer.fullPathDashed}
            hiddenSegments={observerSceneData.annualLayer.hiddenSegments}
            visibleSegments={observerSceneData.annualLayer.visibleSegments}
            months={observerSceneData.annualLayer.months}
          />
        )}

        {showObserverDiurnalArc && (
          <DiurnalLayer
            prefix="observer"
            hiddenSegments={observerSceneData.diurnalLayer.hiddenSegments}
            visibleSegments={observerSceneData.diurnalLayer.visibleSegments}
            markerPoints={observerSceneData.diurnalLayer.markerPoints}
            rayPoint={observerSceneData.diurnalLayer.rayPoint}
          />
        )}
      </group>
    );
  }, [
    horizonLabels,
    isCelestialFrame,
    observerSceneData,
    showAnnualLayer,
    showObserverDiurnalArc,
    showStars,
    staticSnapshot.observerAxisPoints,
  ]);

  const celestialFrameLayer = useMemo(() => {
    if (!isCelestialFrame) {
      return null;
    }

    return (
      <group>
        <CelestialReferenceLayer
          declinationGrid={celestialSceneData.referenceLayer.declinationGrid}
          hourGrid={celestialSceneData.referenceLayer.hourGrid}
          equatorSegments={celestialSceneData.referenceLayer.equatorSegments}
          equatorLabelPosition={celestialSceneData.referenceLayer.equatorLabelPosition}
        />

        {showCelestialObserverOverlay && (
          <CelestialObserverOverlay
            horizonPoints={celestialSceneData.observerOverlay.horizonPoints}
            zenithPosition={celestialSceneData.observerOverlay.zenithPosition}
            emphasis={celestialSceneData.observerOverlay.emphasis}
          />
        )}

        {showStars && (
          <StarFieldLayer
            prefix="celestial"
            stars={celestialSceneData.starField.stars}
            constellationLines={celestialSceneData.starField.constellationLines}
            embedded
          />
        )}

        {showAnnualLayer && (
          <AnnualLayer
            prefix={celestialSceneData.annualLayer.prefix}
            fullPath={celestialSceneData.annualLayer.fullPath}
            fullPathDashed={celestialSceneData.annualLayer.fullPathDashed}
            hiddenSegments={celestialSceneData.annualLayer.hiddenSegments}
            visibleSegments={celestialSceneData.annualLayer.visibleSegments}
            months={celestialSceneData.annualLayer.months}
          />
        )}
      </group>
    );
  }, [
    celestialSceneData,
    isCelestialFrame,
    showAnnualLayer,
    showCelestialObserverOverlay,
    showStars,
  ]);

  return (
    <group>
      <fog attach="fog" args={['#17314f', 24, 52]} />
      <Stars
        radius={80}
        depth={30}
        count={3200}
        factor={3.2}
        saturation={0.2}
        fade
        speed={0.15}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableZoom
        enablePan={false}
        minDistance={8}
        maxDistance={34}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2 - 0.04}
      />

      <group scale={isCelestialFrame ? 1 : OBSERVER_FRAME_SCALE}>
        <mesh>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshBasicMaterial color="#b8dcff" />
        </mesh>

        {observerFrameLayer}
        {celestialFrameLayer}

        <SceneBodiesLayer
          bodyRenderData={bodySnapshot.bodyRenderData}
          skyCulture={skyCulture}
          moonPhase={bodySnapshot.moonPhase}
        />
      </group>
    </group>
  );
}
