import { useEffect, useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function createMoonPhaseTexture(
  illuminatedFraction: number,
  waxing: boolean,
  resolution = 256
) {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const image = ctx.createImageData(resolution, resolution);
  const data = image.data;
  const radius = resolution * 0.42;
  const cx = resolution / 2;
  const cy = resolution / 2;
  const phase = clamp01(illuminatedFraction);
  const lightZ = 2 * phase - 1;
  const lightX = Math.sqrt(Math.max(0, 1 - lightZ * lightZ)) * (waxing ? 1 : -1);

  const lit = { r: 237, g: 241, b: 252 };
  const dark = { r: 17, g: 24, b: 38 };

  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const dx = (x + 0.5 - cx) / radius;
      const dy = (cy - (y + 0.5)) / radius;
      const rr = dx * dx + dy * dy;
      const index = (y * resolution + x) * 4;

      if (rr > 1) {
        data[index + 3] = 0;
        continue;
      }

      const nz = Math.sqrt(1 - rr);
      const isLit = lightX * dx + lightZ * nz >= 0;
      const base = isLit ? lit : dark;
      const shade = isLit ? 0.9 + 0.1 * nz : 0.72 + 0.16 * nz;
      const alpha = clamp01((1 - Math.sqrt(rr)) / 0.03);

      data[index] = Math.round(base.r * shade);
      data[index + 1] = Math.round(base.g * shade);
      data[index + 2] = Math.round(base.b * shade);
      data[index + 3] = Math.round(255 * alpha);
    }
  }

  ctx.putImageData(image, 0, 0);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = Math.max(2, resolution * 0.014);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function MoonPhaseDisc({
  position,
  illuminatedFraction,
  waxing,
  size,
}: {
  position: [number, number, number];
  illuminatedFraction: number;
  waxing: boolean;
  size: number;
}) {
  const texture = useMemo(
    () => createMoonPhaseTexture(illuminatedFraction, waxing),
    [illuminatedFraction, waxing]
  );

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!texture) {
    return null;
  }

  return (
    <Billboard position={position}>
      <sprite scale={[size, size, 1]} renderOrder={31}>
        <spriteMaterial
          map={texture}
          transparent
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </sprite>
    </Billboard>
  );
}
