import { useLayoutEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../../store/useAppStore';
import { getMoonPhaseData, getSunPosition, type MoonPhaseData } from '../../../utils/ephemeris';
import { projectEquatorialCoordinate } from '../../../utils/skyProjection';
import type { AppLanguage } from '../../../utils/i18n';
import { buildBodyRenderData, buildDiurnalLayerData, buildProjectedSceneBodies } from '../builders/sceneData';
import { SPHERE_RADIUS } from '../SpaceView.constants';
import SceneBodiesLayer from './SceneBodiesLayer';
import { DiurnalLayer } from './index';

const EMPTY_PHASE: MoonPhaseData = { illuminatedFraction: 0, waxing: true };
const EMPTY_MARKERS: THREE.Vector3[] = [];
const RAY_POINTS: [number, number, number][] = [[0, 0, 0], [0, 0, SPHERE_RADIUS]];
const FORWARD = new THREE.Vector3(0, 0, 1);
const HOUR_MS = 3600000;
const MARKER_OFFSETS = [-9, -6, -3, 0, 3, 6, 9].map((hours) => hours * HOUR_MS);

type SimulationDateRef = { current: Date };

function buildBodySnapshot(date: Date, phase?: MoonPhaseData) {
  const { observer, scene, display } = useAppStore.getState();
  const isCelestialFrame = scene.referenceFrame === 'celestial';
  return {
    bodyRenderData: buildBodyRenderData({
      projectedBodies: buildProjectedSceneBodies({ currentTime: date, ...observer, isCelestialFrame, ...display }),
      isCelestialFrame, showMoon: display.showMoon, showPlanets: display.showPlanets,
    }),
    moonPhase: display.showMoon ? phase ?? getMoonPhaseData(date) : EMPTY_PHASE,
  };
}

function SunRay({ position, visible }: { position: [number, number, number]; visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const [direction] = useState(() => new THREE.Vector3());
  useLayoutEffect(() => {
    if (group.current) group.current.quaternion.setFromUnitVectors(FORWARD, direction.set(...position).normalize());
  }, [position, direction]);
  return <group ref={group} visible={visible}>
    <Line points={RAY_POINTS} color="#aebfd0" lineWidth={0.8} transparent opacity={0.16} dashed dashSize={0.22} gapSize={0.24} />
  </group>;
}

function SpaceBodyLayer({ simDateRef, language, showRay }: { simDateRef: SimulationDateRef; language: AppLanguage; showRay: boolean }) {
  const { showMoon, showPlanets } = useAppStore(useShallow((state) => state.display));
  const [snapshot, setSnapshot] = useState(() => buildBodySnapshot(simDateRef.current));
  const latestSnapshot = useRef(snapshot);
  const lastUpdate = useRef(0);
  const lastSimTime = useRef(simDateRef.current.getTime());
  const lastPhaseTime = useRef(lastSimTime.current);
  const lastInputs = useRef(useAppStore.getState());

  useFrame(() => {
    const state = useAppStore.getState();
    const previous = lastInputs.current;
    const time = simDateRef.current.getTime();
    const now = performance.now();
    const changed = state.observer !== previous.observer
      || state.scene.referenceFrame !== previous.scene.referenceFrame
      || state.clock.currentTime !== previous.clock.currentTime
      || state.display.showMoon !== previous.display.showMoon
      || state.display.showPlanets !== previous.display.showPlanets;
    const interval = state.scene.referenceFrame === 'observer' && state.clock.timeSpeed <= 3600 ? 16 : 33;
    if (!changed && (time === lastSimTime.current || now - lastUpdate.current < interval)) return;
    const refreshPhase = changed || Math.abs(time - lastPhaseTime.current) >= 60000;
    const next = buildBodySnapshot(simDateRef.current, refreshPhase ? undefined : latestSnapshot.current.moonPhase);
    lastInputs.current = state;
    lastUpdate.current = now;
    lastSimTime.current = time;
    if (refreshPhase) lastPhaseTime.current = time;
    latestSnapshot.current = next;
    setSnapshot(next);
  });

  // Display props also subscribe directly so a paused toggle always causes a frame.
  const bodies = {
    ...snapshot.bodyRenderData,
    moon: { ...snapshot.bodyRenderData.moon, isVisible: showMoon && snapshot.bodyRenderData.moon.isVisible },
    planets: showPlanets ? snapshot.bodyRenderData.planets : [],
  };
  return <>
    <SceneBodiesLayer bodyRenderData={bodies} moonPhase={snapshot.moonPhase} language={language} />
    {showRay && <SunRay position={bodies.sun.observerRayPoint} visible={bodies.sun.isAboveHorizon} />}
  </>;
}

function buildMarkerPositions(date: Date) {
  const { latitude, longitude } = useAppStore.getState().observer;
  return MARKER_OFFSETS.map((offset) => {
    const sampleDate = new Date(date.getTime() + offset);
    const sun = getSunPosition(sampleDate);
    return projectEquatorialCoordinate(sun.ra, sun.dec, latitude, longitude, sampleDate, SPHERE_RADIUS);
  });
}

function SpaceDiurnalLayer({ simDateRef }: { simDateRef: SimulationDateRef }) {
  const [path, setPath] = useState(() => {
    const { latitude, longitude } = useAppStore.getState().observer;
    return buildDiurnalLayerData(simDateRef.current, latitude, longitude);
  });
  const [initialMarkers] = useState(() => buildMarkerPositions(simDateRef.current));
  const markers = useRef<Array<THREE.Mesh | null>>([]);
  const lastInputs = useRef(useAppStore.getState());
  const lastPathTime = useRef(simDateRef.current.getTime());
  const lastPathWallTime = useRef(0);
  const lastMarkerTime = useRef(simDateRef.current.getTime());

  useFrame(() => {
    const state = useAppStore.getState();
    const time = simDateRef.current.getTime();
    const now = performance.now();
    const inputChanged = state.observer !== lastInputs.current.observer
      || state.clock.currentTime !== lastInputs.current.clock.currentTime;
    // The path's shape changes slowly; preserve continuously moving markers separately.
    if (inputChanged || (Math.abs(time - lastPathTime.current) >= HOUR_MS && now - lastPathWallTime.current >= 100)) {
      setPath(buildDiurnalLayerData(simDateRef.current, state.observer.latitude, state.observer.longitude));
      lastPathTime.current = time;
      lastPathWallTime.current = now;
    }
    if (inputChanged || time !== lastMarkerTime.current) {
      buildMarkerPositions(simDateRef.current).forEach((marker, index) => {
        const mesh = markers.current[index];
        if (mesh) {
          mesh.position.set(...marker.observerPosition);
          mesh.visible = marker.isVisible;
        }
      });
      lastMarkerTime.current = time;
    }
    lastInputs.current = state;
  });

  return <>
    <DiurnalLayer prefix="observer" hiddenSegments={path.hiddenSegments} visibleSegments={path.visibleSegments}
      markerPoints={EMPTY_MARKERS} rayPoint={null} />
    {initialMarkers.map((marker, index) => <mesh key={index} position={marker.observerPosition} visible={marker.isVisible}
      ref={(node) => { markers.current[index] = node; }}>
      <sphereGeometry args={[0.055, 10, 10]} />
      <meshBasicMaterial color="#d8e5f2" transparent opacity={0.45} />
    </mesh>)}
  </>;
}

export default function SpaceDynamicLayers({ simDateRef, language, showDiurnalArc }: {
  simDateRef: SimulationDateRef; language: AppLanguage; showDiurnalArc: boolean;
}) {
  return <>
    <SpaceBodyLayer simDateRef={simDateRef} language={language} showRay={showDiurnalArc} />
    {showDiurnalArc && <SpaceDiurnalLayer simDateRef={simDateRef} />}
  </>;
}
