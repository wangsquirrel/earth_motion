import { useEffect, useLayoutEffect, useState } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MoonPhaseData } from '../../utils/ephemeris';

function createMoonPhaseMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uLight: { value: new THREE.Vector2(0, 1) } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec2 uLight;
      void main() {
        // Keep the original disc's radius, colors and soft edge.
        vec2 p = (vUv - 0.5) / 0.42;
        float radius = length(p);
        float edge = max(fwidth(radius), 0.004);
        if (radius > 1.0 + edge) discard;
        float nz = sqrt(max(0.0, 1.0 - dot(p, p)));
        float light = uLight.x * p.x + uLight.y * nz;
        float lit = step(0.0, light);
        vec3 base = mix(vec3(17.0, 24.0, 38.0), vec3(237.0, 241.0, 252.0), lit) / 255.0;
        float shade = mix(0.72 + 0.16 * nz, 0.9 + 0.1 * nz, lit);
        float alpha = clamp((1.0 - radius) / 0.03, 0.0, 1.0);
        float rim = (1.0 - smoothstep(0.007, 0.007 + edge, abs(radius - 1.0))) * 0.2;
        vec3 rgb = mix(base * shade, vec3(1.0), rim);
        // The previous CanvasTexture encoded these values in sRGB.
        gl_FragColor = vec4(sRGBTransferEOTF(vec4(rgb, 1.0)).rgb, max(alpha, rim));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
}

function updateMoonPhaseMaterial(material: THREE.ShaderMaterial, phase: MoonPhaseData) {
  const lightZ = 2 * THREE.MathUtils.clamp(phase.illuminatedFraction, 0, 1) - 1;
  material.uniforms.uLight.value.set(
    Math.sqrt(Math.max(0, 1 - lightZ * lightZ)) * (phase.waxing ? 1 : -1),
    lightZ
  );
}

export default function MoonPhaseDisc({
  position, illuminatedFraction = 0, waxing = true, phaseRef, size,
}: {
  position: [number, number, number];
  illuminatedFraction?: number;
  waxing?: boolean;
  /** Live phase is applied after the scene's body update, without a React commit. */
  phaseRef?: { current: MoonPhaseData };
  size: number;
}) {
  const [material] = useState(createMoonPhaseMaterial);
  useLayoutEffect(() => {
    updateMoonPhaseMaterial(material, phaseRef?.current ?? { illuminatedFraction, waxing });
  }, [illuminatedFraction, waxing, phaseRef, material]);
  useFrame(() => {
    if (phaseRef) updateMoonPhaseMaterial(material, phaseRef.current);
  });
  useEffect(() => () => material.dispose(), [material]);

  return (
    <Billboard position={position}>
      <mesh scale={[size, size, 1]} renderOrder={31}>
        <planeGeometry args={[1, 1]} />
        <primitive attach="material" object={material} />
      </mesh>
    </Billboard>
  );
}
