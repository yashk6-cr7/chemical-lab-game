/* eslint-disable */
import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// shaders.md: Full ShaderMaterial upgrade for liquid with Fresnel effect
export default function LiquidRenderer({ fillLevel, color, temperature, reactionIntensity = 0 }) {
  const liquidMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0.85 },
        uFillLevel: { value: fillLevel },
        uFresnelPower: { value: 2.0 },
        uBoilIntensity: { value: 0.0 },
        uReactionIntensity: { value: reactionIntensity }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;
        uniform float uTime;
        uniform float uBoilIntensity;
        uniform float uReactionIntensity;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          
          vec3 pos = position;
          // Wave displacement + boiling turbulence
          float waveX = sin(pos.x * 12.0 + uTime * (2.0 + uReactionIntensity)) * 0.002;
          float waveZ = sin(pos.z * 10.0 + uTime * (1.5 + uReactionIntensity)) * 0.002;
          
          float totalTurbulence = uBoilIntensity + (uReactionIntensity * 0.5);
          float boil = sin(pos.x * 30.0 + uTime * 15.0) * sin(pos.z * 25.0 + uTime * 12.0) * 0.004 * totalTurbulence;
          
          // Only displace the top surface (y > 0)
          if (pos.y > 0.0) {
            pos.y += waveX + waveZ + boil;
          }
          
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uFresnelPower;
        
        void main() {
          // Fresnel effect (brighter at edges)
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), uFresnelPower);
          
          vec3 finalColor = mix(uColor, uColor * 1.8, fresnel * 0.4);
          
          gl_FragColor = vec4(finalColor, uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false, // performance.md
      side: THREE.FrontSide
    })
  }, []) // Empty deps, update color via uniform

  // Update time uniform every frame (shaders.md)
  useFrame((state) => {
    if (liquidMaterial) {
      liquidMaterial.uniforms.uTime.value = state.clock.elapsedTime
      liquidMaterial.uniforms.uBoilIntensity.value = Math.max(0, (temperature - 80) / 40) // Start boiling effect at 80C
      // Smoothly approach the target reaction intensity
      liquidMaterial.uniforms.uReactionIntensity.value += (reactionIntensity - liquidMaterial.uniforms.uReactionIntensity.value) * 0.1
    }
  })

  // Update color when mixing happens
  useEffect(() => {
    if (liquidMaterial) {
      liquidMaterial.uniforms.uColor.value.set(color)
      liquidMaterial.uniforms.uFillLevel.value = fillLevel
    }
  }, [color, fillLevel, liquidMaterial])

  // Dispose on unmount
  useEffect(() => {
    return () => liquidMaterial.dispose()
  }, [liquidMaterial])

  if (fillLevel <= 0) return null

  // Calculate geometry size based on fill level
  const height = Math.max(0.01, fillLevel * 0.16)
  const yOffset = height / 2

  return (
    <mesh position={[0, yOffset + 0.01, 0]}>
      <cylinderGeometry args={[0.065, 0.065, height, 32]} />
      <primitive object={liquidMaterial} attach="material" />
    </mesh>
  )
}
