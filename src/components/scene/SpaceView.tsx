import { useMemo, useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useViewportLayout } from '../../hooks/useViewportLayout';
import { buildMilkyWayTexture } from '../../utils/milkyWay';
import { useAppStore } from '../../store/useAppStore';
import { useSimulationTime } from '../../hooks/useSimulationTime';
import { warmupSceneText } from '../../utils/sceneTextPreload';
import { CATALOG, CONSTELLATIONS_BY_CULTURE } from '../../utils/stars';
import { getDirectionLabels, getLanguageCopy, getMonthLabels } from '../../utils/i18n';
import { buildCelestialConstellationLines, buildCelestialStarRenderData } from '../../utils/starField';
import {
  INITIAL_CAMERA_TARGET_X, INITIAL_CAMERA_TARGET_Y, INITIAL_CAMERA_Y,
  OBSERVER_FRAME_SCALE, SPHERE_RADIUS, VIEWPORT_LEFT_SHIFT_RATIO,
} from './SpaceView.constants';
import { SCENE_LABEL_FONT_URL } from './sceneLabel.constants';
import { buildCelestialToObserverQuaternion, buildObserverFrameQuaternion, setCelestialToObserverQuaternion } from './builders/geometry';
import {
  buildAnnualProjectionLayerData, buildAnnualSunEquatorialSamples,
  buildCelestialObserverOverlayData,
  buildCelestialReferenceLayerData, buildHorizonLabels,
  buildMonthlySunEquatorialLabelSamples, buildObserverAxisPoints,
} from './builders/sceneData';
import { AnnualLayer, CelestialObserverOverlay, CelestialReferenceLayer, MilkyWayLayer, ObserverReferenceLayer, StarFieldLayer } from './layers';
import PrecessionLayer from './layers/PrecessionLayer';
import EquatorialGridLayer from './layers/EquatorialGridLayer';
import SpaceDynamicLayers from './layers/SpaceDynamicLayers';
import CultureHighlightLayer from './layers/CultureHighlightLayer';

const IDENTITY_QUATERNION = new THREE.Quaternion();
const MILKY_WAY_RADIUS = SPHERE_RADIUS * 1.002;

/** Keep the observer equator label at the highest visible part of the stable great circle. */
function ObserverEquatorLabel({ skyRef, label }: { skyRef: React.RefObject<THREE.Group>; label: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const { isDesktop } = useViewportLayout();
  const [normal] = useState(() => new THREE.Vector3());
  useFrame(() => {
    if (!skyRef.current || !groupRef.current) return;
    normal.set(0, 1, 0).applyQuaternion(skyRef.current.quaternion);
    const position = groupRef.current.position.set(0, 1, 0).addScaledVector(normal, -normal.y);
    if (position.lengthSq() < 1e-12) position.set(0, 0, 1);
    position.normalize().multiplyScalar(SPHERE_RADIUS * 1.04);
  }, -0.5);
  return (
    <group ref={groupRef}>
      <Billboard>
        <Text color="#d9ecff" fontSize={0.2 * (isDesktop ? 1 : 1.8)} anchorX="center" anchorY="middle" font={SCENE_LABEL_FONT_URL}>
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

export default function SpaceView() {
  const { camera, size } = useThree();
  const { isDesktop } = useViewportLayout();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const hasInitializedCameraRef = useRef(false);
  const lastReferenceFrameRef = useRef<'observer' | 'celestial'>('observer');
  const lastCelestialObserverQuaternionRef = useRef<THREE.Quaternion | null>(null);
  const savedObserverViewRef = useRef<{ position: THREE.Vector3; up: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const { referenceFrame, skyCulture, language } = useAppStore(useShallow((state) => state.scene));
  const { latitude, longitude } = useAppStore(useShallow((state) => state.observer));
  const { showDiurnalArc, showAnnualTrail, showMilkyWay, showStars, showCelestialObserverOverlay, showPrecession } = useAppStore(useShallow((state) => state.display));
  const { simDateRef } = useSimulationTime();
  // Subscribe to year rollover, but initialize from the exact synchronized scene time.
  useAppStore((state) => state.clock.displayTime.getUTCFullYear());
  const displayYear = simDateRef.current.getUTCFullYear();
  const isCelestialFrame = referenceFrame === 'celestial';
  const copy = getLanguageCopy(language);
  const rotatingSkyRef = useRef<THREE.Group>(null);
  const observerOverlayRef = useRef<THREE.Group>(null);
  const [initialSkyQuaternion] = useState(() => buildCelestialToObserverQuaternion(latitude, longitude, simDateRef.current));
  const [initialOverlayQuaternion] = useState(() => initialSkyQuaternion.clone().invert());
  const [initialHorizonNormal] = useState(() => new THREE.Vector3(0, 1, 0).applyQuaternion(initialOverlayQuaternion));
  const [frameQuaternion] = useState(() => initialSkyQuaternion.clone());
  const [celestialReferenceData] = useState(buildCelestialReferenceLayerData);
  const [observerOverlayData] = useState(() => buildCelestialObserverOverlayData(IDENTITY_QUATERNION));
  const horizonLabels = useMemo(() => buildHorizonLabels(getDirectionLabels(language)), [language]);
  const observerAxisPoints = useMemo(() => buildObserverAxisPoints(latitude), [latitude]);
  const celestialStars = useMemo(() => showStars
    ? buildCelestialStarRenderData(CATALOG, SPHERE_RADIUS, 1.04, skyCulture, language) : [], [showStars, skyCulture, language]);
  const celestialConstellationLines = useMemo(() => showStars
    ? buildCelestialConstellationLines(CONSTELLATIONS_BY_CULTURE[skyCulture], CATALOG, SPHERE_RADIUS) : [], [showStars, skyCulture]);
  const annualData = useMemo(() => showAnnualTrail ? buildAnnualProjectionLayerData({
    samples: buildAnnualSunEquatorialSamples(displayYear),
    monthLabels: buildMonthlySunEquatorialLabelSamples(displayYear, getMonthLabels(language)),
    latitude: 0, longitude: 0, observerDate: new Date(Date.UTC(displayYear, 0, 1)), isCelestialFrame: true,
  }) : null, [showAnnualTrail, displayYear, language]);
  const milkyWayTexture = useMemo(() => showMilkyWay ? buildMilkyWayTexture() : null, [showMilkyWay]);
  useEffect(() => () => milkyWayTexture?.dispose(), [milkyWayTexture]);
  useEffect(() => { void warmupSceneText(); }, []);

  // Only transforms change with time. Geometry and instance buffers stay mounted.
  useFrame(() => {
    const observer = useAppStore.getState().observer;
    setCelestialToObserverQuaternion(frameQuaternion, observer.latitude, observer.longitude, simDateRef.current);
    if (rotatingSkyRef.current) {
      rotatingSkyRef.current.quaternion.copy(isCelestialFrame ? IDENTITY_QUATERNION : frameQuaternion);
      rotatingSkyRef.current.updateWorldMatrix(true, false);
    }
    if (observerOverlayRef.current) {
      observerOverlayRef.current.quaternion.copy(frameQuaternion).invert();
      observerOverlayRef.current.updateWorldMatrix(true, false);
    }
  }, -1);
  // --- Camera setup ---
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      if (isDesktop) {
        camera.setViewOffset(
          Math.round(size.width),
          Math.round(size.height),
          Math.round(size.width * VIEWPORT_LEFT_SHIFT_RATIO),
          0,
          Math.round(size.width),
          Math.round(size.height)
        );
      } else {
        camera.clearViewOffset();
      }
      camera.updateProjectionMatrix();
    }
    return () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.clearViewOffset();
        camera.updateProjectionMatrix();
      }
    };
  }, [camera, isDesktop, size.height, size.width]);

  useEffect(() => {
    if (hasInitializedCameraRef.current) return;
    camera.up.set(0, 1, 0);
    if (isDesktop) {
      camera.position.set(16, INITIAL_CAMERA_Y, 18);
    } else {
      camera.position.set(24, INITIAL_CAMERA_Y + 1.6, 28);
    }
    camera.lookAt(INITIAL_CAMERA_TARGET_X, INITIAL_CAMERA_TARGET_Y, 0);
    controlsRef.current?.object.up.set(0, 1, 0);
    controlsRef.current?.target.set(INITIAL_CAMERA_TARGET_X, INITIAL_CAMERA_TARGET_Y, 0);
    controlsRef.current?.update();
    hasInitializedCameraRef.current = true;
  }, [camera, isDesktop]);

  // --- Reference frame switch ---
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const previousFrame = lastReferenceFrameRef.current;
    if (previousFrame === referenceFrame) return;

    const observer = useAppStore.getState().observer;
    const quat = buildObserverFrameQuaternion(
      observer.latitude,
      observer.longitude,
      simDateRef.current
    );

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

    const syncCelestialCameraForLocation = (nextLatitude: number, nextLongitude: number) => {
      if (lastReferenceFrameRef.current !== 'celestial') {
        return;
      }

      const nextQuat = buildObserverFrameQuaternion(
        nextLatitude,
        nextLongitude,
        simDateRef.current
      );
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
      if (
        state.observer.latitude !== previousState.observer.latitude
        || state.observer.longitude !== previousState.observer.longitude
      ) {
        syncCelestialCameraForLocation(
          state.observer.latitude,
          state.observer.longitude
        );
      }
    });

    return unsubscribe;
  }, [camera, simDateRef]);

  return (
    <group>
      <fog attach="fog" args={['#17314f', 24, 52]} />
      {showStars && <Stars radius={80} depth={30} count={3200} factor={3.2} saturation={0.2} fade speed={0.15} />}
      <OrbitControls ref={controlsRef} makeDefault enableZoom enablePan={false} minDistance={8} maxDistance={34}
        minPolarAngle={0.35} maxPolarAngle={Math.PI / 2 - 0.04} />
      <group scale={isCelestialFrame ? 1 : OBSERVER_FRAME_SCALE}>
        <mesh><sphereGeometry args={[0.12, 24, 24]} /><meshBasicMaterial color="#b8dcff" /></mesh>
        {isCelestialFrame ? (
          <CelestialReferenceLayer {...celestialReferenceData} equatorLabel={`${copy.scene.celestialEquator} (J2000)`} showGrid={false} />
        ) : (
          <ObserverReferenceLayer prefix="observer" {...celestialReferenceData} equatorLabel={`${copy.scene.celestialEquator} (J2000)`}
            horizonLabels={horizonLabels} observerAxisPoints={observerAxisPoints} showGrid={false} />
        )}
        <group ref={rotatingSkyRef} quaternion={isCelestialFrame ? IDENTITY_QUATERNION : initialSkyQuaternion}>
          {showPrecession && <PrecessionLayer simDateRef={simDateRef} radius={SPHERE_RADIUS} clipToHorizon={!isCelestialFrame} />}
          {showStars && <CultureHighlightLayer stars={celestialStars} radius={SPHERE_RADIUS} clipToHorizon={!isCelestialFrame} />}
          <EquatorialGridLayer prefix="space-grid" {...celestialReferenceData} equatorLabel={`${copy.scene.celestialEquator} (J2000)`}
            declinationOpacity={0.11} hourOpacity={0.09} equatorOpacity={0.18} equatorLineWidth={1.8}
            showLabels={isCelestialFrame} clipToHorizon={!isCelestialFrame} />
          {showMilkyWay && <MilkyWayLayer prefix="space" texture={milkyWayTexture} radius={MILKY_WAY_RADIUS}
            side={THREE.DoubleSide} clipToHorizon={!isCelestialFrame} />}
          {showStars && <StarFieldLayer prefix="space" stars={celestialStars} constellationLines={celestialConstellationLines}
            embedded={isCelestialFrame} clipToHorizon={!isCelestialFrame} initialHorizonNormal={initialHorizonNormal} />}
          {annualData && <AnnualLayer prefix={referenceFrame} {...annualData} clipToHorizon={!isCelestialFrame} initialHorizonNormal={initialHorizonNormal} />}
        </group>
        {!isCelestialFrame && <ObserverEquatorLabel skyRef={rotatingSkyRef} label={`${copy.scene.celestialEquator} (J2000)`} />}
        {isCelestialFrame && showCelestialObserverOverlay && (
          <group ref={observerOverlayRef} quaternion={initialOverlayQuaternion}>
            <CelestialObserverOverlay {...observerOverlayData} emphasis={1} zenithLabel={copy.scene.zenith} />
          </group>
        )}
        <SpaceDynamicLayers simDateRef={simDateRef}
          language={language} showDiurnalArc={showDiurnalArc && !isCelestialFrame} />
      </group>
    </group>
  );
}
