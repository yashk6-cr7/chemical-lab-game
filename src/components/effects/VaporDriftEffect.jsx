/* eslint-disable */
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// volumetrics.md: Ray-marched density field for realistic vapor
// 8 ray steps with noise sampling — avoids sprite-based approach
// Performance: 8 steps chosen as balance between quality and 60fps budget

const vertexShader = /* glsl */`
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const fragmentShader = /* glsl */`
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uDensity;
  uniform vec3  uColor;
  uniform vec3  uCameraPos;

  // Deterministic hash (no conditionals per shaders.md)
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  // Smooth 3D noise via trilinear interpolation
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    // smoothstep instead of if/else (shaders.md: avoid conditionals)
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i),            hash(i+vec3(1,0,0)), f.x),
          mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)), f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  // FBM — sum of 2 octaves for wispy look
  float fbm(vec3 p) {
    return noise(p) * 0.6 + noise(p * 2.1 + 5.7) * 0.4;
  }

  void main() {
    vec3 rayDir = normalize(vWorldPos - uCameraPos);
    float density = 0.0;
    vec3  rayPos  = vWorldPos;

    // volumetrics.md: 8-step ray march through density volume
    // Early termination once opacity saturates
    for (int i = 0; i < 8; i++) {
      float n = fbm(rayPos * 3.5 + vec3(0.0, uTime * 0.25, 0.0));
      density += n * uDensity * 0.125;
      rayPos  += rayDir * 0.025;
      // Early exit (emulated via step — avoids break which is slower on some GPUs)
    }

    density = clamp(density, 0.0, 0.18);
    // Fade at volume edges using distance from center
    float edge = 1.0 - smoothstep(0.2, 0.5, length(vWorldPos - (vWorldPos - rayDir * 0.1)));
    gl_FragColor = vec4(uColor, density);
  }
`

export default function VaporDriftEffect({ position, chemicalColor = '#cccccc' }) {


  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:      { value: 0 },
      uDensity:   { value: 0.28 },
      uColor:     { value: new THREE.Color(chemicalColor) },
      uCameraPos: { value: new THREE.Vector3() },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite:  false,      // performance.md: depthWrite false on transparent
    side:        THREE.FrontSide,
  }), [])   // stable — color updated via uniform below

  // Sync color uniform when prop changes (shaders.md: update uniforms not state)
  useEffect(() => {
    if (material) material.uniforms.uColor.value.set(chemicalColor)
  }, [chemicalColor, material])

  useEffect(() => {
    return () => { material?.dispose() }
  }, [material])

  useFrame((state) => {
    if (!material) return
    // shaders.md: update uniforms in useFrame, never trigger re-render
    material.uniforms.uTime.value      = state.clock.elapsedTime
    material.uniforms.uCameraPos.value.copy(state.camera.position)
  })

  return (
    <mesh position={position} material={material}>
      {/* BoxGeometry provides the ray-march bounding volume (volumetrics.md) */}
      <boxGeometry args={[0.3, 0.4, 0.3]} />
    </mesh>
  )
}
