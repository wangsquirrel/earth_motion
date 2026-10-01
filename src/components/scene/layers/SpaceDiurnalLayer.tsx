import { useLayoutEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib';
import { useAppStore } from '../../../store/useAppStore';
import { getSunPosition } from '../../../utils/ephemeris';
import { projectEquatorialCoordinate } from '../../../utils/skyProjection';
import { buildDiurnalLayerData } from '../builders/sceneData';
import { DIURNAL_SAMPLE_COUNT, SPHERE_RADIUS } from '../SpaceView.constants';

const HOUR_MS = 3600000;
const MARKER_OFFSETS = [-9, -6, -3, 0, 3, 6, 9].map((hours) => hours * HOUR_MS);
// A contiguous segment has at most all samples plus its horizon intersections.
// Keep enough storage for those intersections without changing the sample count.
const SEGMENT_CAPACITY = DIURNAL_SAMPLE_COUNT + 1;

function createLine(visible: boolean, width: number, height: number) {
  const geometry = new LineGeometry();
  geometry.setPositions(new Float32Array((SEGMENT_CAPACITY + 1) * 3));
  const material = new LineMaterial({
    linewidth: visible ? 1.5 : 0.9,
    transparent: true,
    opacity: visible ? 0.5 : 0.14,
    dashed: true,
    dashSize: visible ? 0.4 : 0.28,
    gapSize: visible ? 0.28 : 0.34,
    resolution: new THREE.Vector2(width, height),
  });
  // Color.set follows the same color-management path as R3F's color prop.
  material.color.set(visible ? '#b9c8d8' : '#607186');
  const line = new Line2(geometry, material);
  line.computeLineDistances();
  return line;
}

function updateLine(line: Line2, points: THREE.Vector3[]) {
  const geometry = line.geometry;
  const positions = (geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute).data;
  const distances = (geometry.getAttribute('instanceDistanceStart') as THREE.InterleavedBufferAttribute).data;
  const positionArray = positions.array;
  const distanceArray = distances.array;
  const edgeCount = points.length - 1;
  if (edgeCount > SEGMENT_CAPACITY) throw new Error('Diurnal segment exceeds its full-sample capacity');

  for (let edge = 0; edge < SEGMENT_CAPACITY; edge++) {
    // The inactive tail repeats the actual endpoint, so it cannot alter bounds.
    // instanceCount excludes the tail from drawing, including its line caps.
    const start = points[Math.min(edge, edgeCount)];
    const end = points[Math.min(edge + 1, edgeCount)];
    const p = edge * 6;
    positionArray[p] = start.x;
    positionArray[p + 1] = start.y;
    positionArray[p + 2] = start.z;
    positionArray[p + 3] = end.x;
    positionArray[p + 4] = end.y;
    positionArray[p + 5] = end.z;

    // Match Line2.computeLineDistances exactly: distances use Float32 endpoints
    // and each accumulated step is rounded through the Float32 distance buffer.
    const dx = positionArray[p] - positionArray[p + 3];
    const dy = positionArray[p + 1] - positionArray[p + 4];
    const dz = positionArray[p + 2] - positionArray[p + 5];
    const d = edge * 2;
    distanceArray[d] = edge === 0 ? 0 : distanceArray[d - 1];
    distanceArray[d + 1] = distanceArray[d] + Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  geometry.instanceCount = edgeCount;
  positions.needsUpdate = true;
  distances.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  line.visible = true;
}

/** Stable Three objects; exported so exact geometry and frame behavior can be tested. */
export class SpaceDiurnalObjects {
  readonly group = new THREE.Group();
  readonly hiddenLines: Line2[] = [];
  readonly visibleLines: Line2[] = [];
  readonly markers: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly hiddenGroup = new THREE.Group();
  private readonly visibleGroup = new THREE.Group();
  private lastTime = NaN;
  private lastLatitude = NaN;
  private lastLongitude = NaN;

  constructor(private width: number, private height: number) {
    this.group.add(this.hiddenGroup, this.visibleGroup);
  }

  setResolution(width: number, height: number) {
    this.width = width;
    this.height = height;
    for (const line of [...this.hiddenLines, ...this.visibleLines]) {
      line.material.resolution.set(width, height);
    }
  }

  private updateSegments(segments: THREE.Vector3[][], visible: boolean) {
    const pool = visible ? this.visibleLines : this.hiddenLines;
    const group = visible ? this.visibleGroup : this.hiddenGroup;
    segments.forEach((segment, index) => {
      if (!pool[index]) {
        pool[index] = createLine(visible, this.width, this.height);
        group.add(pool[index]);
      }
      updateLine(pool[index], segment);
    });
    for (let index = segments.length; index < pool.length; index++) pool[index].visible = false;
  }

  update(date: Date, latitude: number, longitude: number, visible: boolean) {
    this.group.visible = visible;
    // Hidden layers never solve. Identical exact time/location can reuse the last
    // result (e.g. a paused camera drag); no wall-clock or speed threshold exists.
    if (!visible) return false;
    const time = date.getTime();
    if (time === this.lastTime && latitude === this.lastLatitude && longitude === this.lastLongitude) return false;

    const path = buildDiurnalLayerData(date, latitude, longitude);
    this.updateSegments(path.hiddenSegments, false);
    this.updateSegments(path.visibleSegments, true);
    MARKER_OFFSETS.forEach((offset, index) => {
      let marker = this.markers[index];
      if (!marker) {
        marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 10, 10),
          new THREE.MeshBasicMaterial({ color: '#d8e5f2', transparent: true, opacity: 0.45 }),
        );
        this.markers[index] = marker;
        this.group.add(marker);
      }
      const sampleDate = new Date(time + offset);
      const sun = getSunPosition(sampleDate);
      const projection = projectEquatorialCoordinate(sun.ra, sun.dec, latitude, longitude, sampleDate, SPHERE_RADIUS);
      marker.position.set(...projection.observerPosition);
      marker.visible = projection.isVisible;
    });

    this.lastTime = time;
    this.lastLatitude = latitude;
    this.lastLongitude = longitude;
    return true;
  }

  dispose() {
    for (const object of [...this.hiddenLines, ...this.visibleLines, ...this.markers]) {
      object.geometry.dispose();
      object.material.dispose();
    }
  }
}

export default function SpaceDiurnalLayer({ simDateRef }: { simDateRef: { current: Date } }) {
  const size = useThree((state) => state.size);
  const [objects] = useState(() => {
    const result = new SpaceDiurnalObjects(size.width, size.height);
    const { observer, display } = useAppStore.getState();
    result.update(simDateRef.current, observer.latitude, observer.longitude, display.showDiurnalArc);
    return result;
  });

  useLayoutEffect(() => {
    // This is the same CSS-size initialization/resize used by Drei's Line.
    // Line2.onBeforeRender additionally synchronizes the actual renderer viewport.
    objects.setResolution(size.width, size.height);
  }, [objects, size.width, size.height]);
  useLayoutEffect(() => () => objects.dispose(), [objects]);

  useFrame(() => {
    const { observer, display } = useAppStore.getState();
    // useSimulationTime runs at priority -2, before this default-priority frame.
    objects.update(simDateRef.current, observer.latitude, observer.longitude, display.showDiurnalArc);
  });

  return <primitive object={objects.group} dispose={null} />;
}
