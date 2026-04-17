import * as THREE from 'three';
import milkyWayGeoJsonSource from '../data/mw.min.geojson?raw';
import { measurePerf } from './perf';

interface GeoJsonFeatureCollection {
  features: Array<{
    geometry: {
      type: 'MultiPolygon';
      coordinates: number[][][][];
    };
  }>;
}

let milkyWayGeoJson: GeoJsonFeatureCollection | null = null;

const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = 1024;
const WIDE_GLOW_BLUR_PX = 22;
const NARROW_GLOW_BLUR_PX = 10;

function getMilkyWayGeoJson() {
  if (milkyWayGeoJson) {
    return milkyWayGeoJson;
  }

  milkyWayGeoJson = JSON.parse(milkyWayGeoJsonSource) as GeoJsonFeatureCollection;
  return milkyWayGeoJson;
}

function longitudeToTextureX(longitude: number) {
  return ((longitude + 180) / 360) * TEXTURE_WIDTH;
}

function latitudeToTextureY(latitude: number) {
  return ((90 - latitude) / 180) * TEXTURE_HEIGHT;
}

function traceRing(
  context: CanvasRenderingContext2D,
  ring: number[][],
  offsetX = 0,
) {
  if (ring.length === 0) {
    return;
  }

  const [firstLongitude, firstLatitude] = ring[0];
  context.moveTo(longitudeToTextureX(firstLongitude) + offsetX, latitudeToTextureY(firstLatitude));

  for (let index = 1; index < ring.length; index += 1) {
    const [longitude, latitude] = ring[index];
    context.lineTo(longitudeToTextureX(longitude) + offsetX, latitudeToTextureY(latitude));
  }

  context.closePath();
}

function drawWrappedMilkyWayPath(context: CanvasRenderingContext2D) {
  const { features } = getMilkyWayGeoJson();

  [-TEXTURE_WIDTH, 0, TEXTURE_WIDTH].forEach((offsetX) => {
    features.forEach(({ geometry }) => {
      if (geometry.type !== 'MultiPolygon') {
        return;
      }

      geometry.coordinates.forEach((polygon) => {
        context.beginPath();
        polygon.forEach((ring) => {
          traceRing(context, ring, offsetX);
        });
        context.fill('evenodd');
      });
    });
  });
}

export function buildMilkyWayTexture() {
  return measurePerf('buildMilkyWayTexture', () => {
    const canvas = document.createElement('canvas');
    canvas.width = TEXTURE_WIDTH;
    canvas.height = TEXTURE_HEIGHT;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.filter = `blur(${WIDE_GLOW_BLUR_PX}px)`;
    context.fillStyle = 'rgba(86, 122, 164, 0.12)';
    drawWrappedMilkyWayPath(context);
    context.restore();

    context.save();
    context.filter = `blur(${NARROW_GLOW_BLUR_PX}px)`;
    context.fillStyle = 'rgba(126, 169, 214, 0.14)';
    drawWrappedMilkyWayPath(context);
    context.restore();

    context.save();
    context.fillStyle = 'rgba(226, 239, 255, 0.1)';
    drawWrappedMilkyWayPath(context);
    context.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
  }, { thresholdMs: 5 });
}
