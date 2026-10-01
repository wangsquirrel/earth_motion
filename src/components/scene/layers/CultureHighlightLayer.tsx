import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../../store/useAppStore';
import { selectCultureReferenceStars } from '../../../utils/cultureHighlights';
import type { RenderableStar } from '../../../utils/starField';
import HorizonBillboard from './HorizonBillboard';
import { ABOVE_HORIZON_PLANES } from './horizon.constants';

/** A small opt-in overlay: original stars, line art, labels and camera remain untouched. */
export default function CultureHighlightLayer({ stars, radius, clipToHorizon = false }: {
  stars: RenderableStar[];
  radius: number;
  clipToHorizon?: boolean;
}) {
  const selectedId = useAppStore((state) => state.selectedCultureEntryId);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => { invalidate(); }, [selectedId, invalidate]);
  const selectedStars = useMemo(() => selectCultureReferenceStars(stars, selectedId), [selectedId, stars]);
  return <group name="culture-reference-highlights">
    {selectedStars.map((star) => <HorizonBillboard key={star.id} position={star.position} clipToHorizon={clipToHorizon}>
      <mesh renderOrder={25}>
        <ringGeometry args={[radius * 0.016, radius * 0.02, 40]} />
        <meshBasicMaterial color="#fcd34d" transparent opacity={0.85} side={THREE.DoubleSide}
          depthWrite={false} depthTest={false} toneMapped={false} clippingPlanes={clipToHorizon ? ABOVE_HORIZON_PLANES : null} />
      </mesh>
    </HorizonBillboard>)}
  </group>;
}
