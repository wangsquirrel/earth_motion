import { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { buildPolePath, getEpochBasis, isPrecessionDateSupported } from '../../../utils/precession';
import { getPrecessionCopy } from '../../../utils/precessionCopy';
import { useAppStore } from '../../../store/useAppStore';
import { useViewportLayout } from '../../../hooks/useViewportLayout';
import { SCENE_LABEL_FONT_URL } from '../sceneLabel.constants';
import { ABOVE_HORIZON_PLANES } from './horizon.constants';

// Mounted inside the existing J2000 sky group in both views. Only this epoch
// basis rotates; stars never receive a second precession transform.
export default function PrecessionLayer({ simDateRef, radius, clipToHorizon = false }: {
  simDateRef: { current: Date }; radius: number; clipToHorizon?: boolean;
}) {
  const language = useAppStore(s => s.scene.language);
  const compare = useAppStore(s => s.display.showPrecessionToday);
  const { isDesktop } = useViewportLayout();
  const copy = getPrecessionCopy(language);
  const epoch = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const path = useMemo(buildPolePath, []);
  const today = useMemo(() => getEpochBasis(new Date())[1], []);
  const circle = useMemo(() => Array.from({ length: 129 }, (_, i) =>
    new THREE.Vector3(Math.cos(i * Math.PI / 64), 0, -Math.sin(i * Math.PI / 64))), []);
  const planes = clipToHorizon ? ABOVE_HORIZON_PLANES : null;
  const fontSize = 0.023 * (isDesktop ? 1 : 1.8);
  const sync = () => {
    if (!root.current || !epoch.current) return;
    root.current.visible = isPrecessionDateSupported(simDateRef.current);
    if (!root.current.visible) return;
    const [x, y, z] = getEpochBasis(simDateRef.current);
    matrix.set(x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, 0, 0, 0, 1);
    epoch.current.quaternion.setFromRotationMatrix(matrix);
  };
  useLayoutEffect(sync);
  useFrame(sync, -0.5);
  const label = (text: string, position: [number, number, number], color: string) => (
    <Billboard position={position}><Text font={SCENE_LABEL_FONT_URL} fontSize={fontSize}
      color={color} anchorX="left">{text}<meshBasicMaterial color={color} clippingPlanes={planes} /></Text></Billboard>
  );
  return <group ref={root} scale={radius}>
    <Line points={path.map(p => new THREE.Vector3(...p.point))} color="#67e8f9" lineWidth={2} clippingPlanes={planes} />
    {path.filter(p => p.year % 500 === 0).map(p => <group key={p.year}>
      {label(String(p.year), p.point.map(v => v * 1.025) as [number, number, number], '#67e8f9')}
    </group>)}
    {compare && <group>
      <mesh position={today}><sphereGeometry args={[0.009, 12, 12]} /><meshBasicMaterial color="#f9a8d4" clippingPlanes={planes} /></mesh>
      {label(copy.today, today.map(v => v * 1.065) as [number, number, number], '#f9a8d4')}
    </group>}
    <group ref={epoch}>
      <Line points={circle} color="#fbbf24" lineWidth={2} clippingPlanes={planes} />
      <Line points={[[0, 0, 0], [0, 1, 0]]} color="#fbbf24" lineWidth={1} clippingPlanes={planes} />
      <mesh position={[0, 1, 0]}><sphereGeometry args={[0.012, 12, 12]} /><meshBasicMaterial color="#fbbf24" clippingPlanes={planes} /></mesh>
      <mesh position={[1, 0, 0]}><sphereGeometry args={[0.012, 12, 12]} /><meshBasicMaterial color="#fbbf24" clippingPlanes={planes} /></mesh>
      {label(copy.pole, [0, 1.045, 0], '#fbbf24')}
      {label(copy.equinox, [1.045, 0, 0], '#fbbf24')}
      {label(copy.equator, [0, 0, -1.045], '#fbbf24')}
    </group>
  </group>;
}
