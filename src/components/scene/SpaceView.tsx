import { useMemo, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { CATALOG, CONSTELLATIONS_BY_CULTURE } from '../../utils/stars';
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
  buildCirclePoints,
  buildObserverFrameBasis,
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
  buildStarFieldLayerData,
} from './builders/sceneData';
import {
  AnnualLayer,
  CelestialLightingRig,
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

export default function SpaceView() {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const hasInitializedCameraRef = useRef(false);
  const lastReferenceFrameRef = useRef<'observer' | 'celestial'>('observer');
  const savedObserverViewRef = useRef<{
    position: THREE.Vector3;
    up: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const { currentTime, isPlaying, timeSpeed } = useAppStore((state) => state.clock);
  const { latitude } = useAppStore((state) => state.observer);
  const { referenceFrame, skyCulture } = useAppStore((state) => state.scene);
  const {
    showDiurnalArc,
    showAnnualTrail,
    showStars,
    showCelestialObserverOverlay,
    showMoon,
    showPlanets,
  } = useAppStore((state) => state.display);

  const activeConstellations = useMemo(
    () => CONSTELLATIONS_BY_CULTURE[skyCulture],
    [skyCulture]
  );

  const ringPoints = useMemo(() => buildCirclePoints(SPHERE_RADIUS), []);
  const observerReferenceData = useMemo(
    () => buildObserverReferenceLayerData(latitude, currentTime),
    [currentTime, latitude]
  );
  const celestialReferenceData = useMemo(
    () => buildCelestialReferenceLayerData(),
    []
  );
  const horizonLabels = useMemo(() => buildHorizonLabels(), []);
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
    if (hasInitializedCameraRef.current) {
      return;
    }

    camera.up.set(0, 1, 0);
    camera.position.set(16, INITIAL_CAMERA_Y, 18);
    camera.lookAt(INITIAL_CAMERA_TARGET_X, INITIAL_CAMERA_TARGET_Y, 0);
    controlsRef.current?.object.up.set(0, 1, 0);
    controlsRef.current?.target.set(INITIAL_CAMERA_TARGET_X, INITIAL_CAMERA_TARGET_Y, 0);
    controlsRef.current?.update();
    hasInitializedCameraRef.current = true;
  }, [camera]);

  const isCelestialFrame = referenceFrame === 'celestial';
  const showObserverDiurnalArc = showDiurnalArc && referenceFrame === 'observer';
  const showAnnualLayer = showAnnualTrail;
  const observerFrameQuaternion = useMemo(() => {
    const { east, up, south } = buildObserverFrameBasis(latitude, currentTime);
    const basis = new THREE.Matrix4().makeBasis(east, up, south);
    return new THREE.Quaternion().setFromRotationMatrix(basis);
  }, [currentTime, latitude]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const previousFrame = lastReferenceFrameRef.current;

    if (previousFrame === referenceFrame) {
      return;
    }

    if (referenceFrame === 'celestial') {
      savedObserverViewRef.current = {
        position: camera.position.clone(),
        up: camera.up.clone(),
        target: controls.target.clone(),
      };

      camera.position.applyQuaternion(observerFrameQuaternion);
      camera.up.applyQuaternion(observerFrameQuaternion);
      controls.target.applyQuaternion(observerFrameQuaternion);
      camera.lookAt(controls.target);
      controls.update();
    } else if (savedObserverViewRef.current) {
      camera.position.copy(savedObserverViewRef.current.position);
      camera.up.copy(savedObserverViewRef.current.up);
      controls.target.copy(savedObserverViewRef.current.target);
      camera.lookAt(controls.target);
      controls.update();
    }

    lastReferenceFrameRef.current = referenceFrame;
  }, [camera, observerFrameQuaternion, referenceFrame]);

  const observerAxisPoints = useMemo(() => buildObserverAxisPoints(latitude), [latitude]);

  const celestialObserverOverlayData = useMemo(
    () => buildCelestialObserverOverlayData(observerFrameQuaternion),
    [observerFrameQuaternion]
  );

  const celestialObserverOverlayEmphasis = useMemo(
    () => buildCelestialObserverOverlayEmphasis(isPlaying, timeSpeed),
    [isPlaying, timeSpeed]
  );

  const projectedBodies = useMemo(
    () => buildProjectedSceneBodies({ currentTime, latitude, isCelestialFrame }),
    [currentTime, latitude, isCelestialFrame]
  );

  const bodyRenderData = useMemo(() => (
    buildBodyRenderData({
      projectedBodies,
      isCelestialFrame,
      showMoon,
      showPlanets,
    })
  ), [isCelestialFrame, projectedBodies, showMoon, showPlanets]);

  const diurnalLayerData = useMemo(() => {
    const diurnalLayer = buildDiurnalLayerData(currentTime, latitude);
    return {
      ...diurnalLayer,
      rayPoint: bodyRenderData.sun.isAboveHorizon ? bodyRenderData.sun.observerRayPoint : null,
    };
  }, [bodyRenderData.sun.isAboveHorizon, bodyRenderData.sun.observerRayPoint, currentTime, latitude]);

  const annualSunEquatorialSamples = useMemo(
    () => buildAnnualSunEquatorialSamples(),
    []
  );
  const currentYear = currentTime.getUTCFullYear();
  const monthlySunLabelSamples = useMemo(
    () => buildMonthlySunEquatorialLabelSamples(currentYear),
    [currentYear]
  );
  const annualProjection = useMemo(() => {
    return buildAnnualProjectionLayerData({
      samples: annualSunEquatorialSamples,
      monthLabels: monthlySunLabelSamples,
      latitude,
      observerDate: currentTime,
      isCelestialFrame,
    });
  }, [annualSunEquatorialSamples, currentTime, isCelestialFrame, latitude, monthlySunLabelSamples]);

  const starFieldLayerData = useMemo(() => {
    return buildStarFieldLayerData({
      catalog: CATALOG,
      activeConstellations,
      latitude,
      currentTime,
      skyCulture,
    });
  }, [activeConstellations, currentTime, latitude, skyCulture]);

  const observerSceneData = useMemo<ObserverSceneData>(() => {
    return buildObserverSceneData({
      referenceLayer: observerReferenceData,
      starField: {
        stars: starFieldLayerData.observer.stars,
        constellationLines: starFieldLayerData.observer.constellationLines,
      },
      annualLayer: annualProjection,
      diurnalLayer: {
        ...diurnalLayerData,
      },
    });
  }, [
    annualProjection,
    diurnalLayerData,
    observerReferenceData,
    starFieldLayerData,
  ]);

  const celestialSceneData = useMemo<CelestialSceneData>(() => {
    return buildCelestialSceneData({
      referenceLayer: celestialReferenceData,
      starField: {
        stars: starFieldLayerData.celestial.stars,
        constellationLines: starFieldLayerData.celestial.constellationLines,
      },
      annualLayer: annualProjection,
      observerOverlay: celestialObserverOverlayData,
      observerOverlayEmphasis: celestialObserverOverlayEmphasis,
    });
  }, [
    annualProjection,
    starFieldLayerData,
    celestialObserverOverlayData,
    celestialObserverOverlayEmphasis,
    celestialReferenceData,
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

      <group>
        <mesh>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshBasicMaterial color="#b8dcff" />
        </mesh>

        {!isCelestialFrame && (
          <group scale={OBSERVER_FRAME_SCALE}>
            <ObserverReferenceLayer
              prefix="observer"
              ringPoints={ringPoints}
              declinationGrid={observerSceneData.referenceLayer.declinationGrid}
              hourGrid={observerSceneData.referenceLayer.hourGrid}
              equatorSegments={observerSceneData.referenceLayer.equatorSegments}
              equatorLabelPosition={observerSceneData.referenceLayer.equatorLabelPosition}
              horizonLabels={horizonLabels}
              observerAxisPoints={observerAxisPoints}
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
        )}

        {isCelestialFrame && (
          <group>
            <CelestialLightingRig />

            {/* Reference scaffolding intentionally differs between frames; shared data prep
                happens above, while the visual shell stays frame-specific here. */}
            <CelestialReferenceLayer
              ringPoints={ringPoints}
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
        )}

        <SceneBodiesLayer bodyRenderData={bodyRenderData} isCelestialFrame={isCelestialFrame} />
      </group>
    </group>
  );
}
