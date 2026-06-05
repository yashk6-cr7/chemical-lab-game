/* eslint-disable */
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// particles.md: 3 separate InstancedMesh layers with AdditiveBlending
// Pre-allocated dummy to avoid per-frame Object3D creation (r3f.md)
const _dummy = new THREE.Object3D()

// Layer definitions — matches particles.md fire/sparks pattern
const LAYERS = [
  { count: 15, color: '#ffff88', size: 0.03, speed: 0.15, spread: 0.02, opacity: 0.9 },  // inner core
  { count: 30, color: '#ff4400', size: 0.06, speed: 0.10, spread: 0.04, opacity: 0.7 },  // main flame
  { count: 20, color: '#880000', size: 0.10, speed: 0.06, spread: 0.08, opacity: 0.4 },  // outer glow
]

function FireLayer({ config, flameHeight, cameraRef }) {
  const { count, color, size, speed, spread, opacity } = config
  const meshRef = useRef()

  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x:        (Math.random() - 0.5) * spread * 2,
    z:        (Math.random() - 0.5) * spread * 2,
    y:        Math.random() * flameHeight,
    speed:    speed * (0.8 + Math.random() * 0.4),
    lifetime: 0.4 + Math.random() * 0.4,
    age:      Math.random() * 0.8,
    phase:    Math.random() * Math.PI * 2,
  })), [count, spread, flameHeight, speed])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    for (let i = 0; i < count; i++) {
      const p = particles[i]

      p.age += delta
      if (p.age >= p.lifetime) {
        p.age = 0
        p.x = (Math.random() - 0.5) * spread * 2
        p.z = (Math.random() - 0.5) * spread * 2
        p.y = 0
      }

      const progress = p.age / p.lifetime
      p.y += p.speed * delta
      p.phase += delta * 15
      const flicker = 0.8 + Math.sin(p.phase) * 0.2

      _dummy.position.set(p.x, p.y, p.z)
      _dummy.scale.setScalar(size * flicker * (1 - progress * 0.4))
      // particles.md: billboard each particle toward camera
      if (cameraRef?.current) _dummy.lookAt(cameraRef.current.position)
      _dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, _dummy.matrix)

      // Update instance color opacity
      meshRef.current.setColorAt(i, new THREE.Color(color).multiplyScalar(1 - progress * 0.6))
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  useEffect(() => {
    return () => {
      meshRef.current?.geometry?.dispose()
      meshRef.current?.material?.dispose()
    }
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      {/* particles.md: AdditiveBlending on all fire layers */}
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  )
}

export default function FireEffect({ position, intensity = 7 }) {
  const lightRef   = useRef()
  const timeRef    = useRef(0)
  const cameraRef  = useRef()

  const flameHeight = intensity < 7 ? 0.1 : intensity < 9 ? 0.2 : 0.4

  useFrame((state, delta) => {
    cameraRef.current = state.camera

    // Flickering point light
    if (lightRef.current) {
      timeRef.current += delta
      const flicker = 2 + Math.sin(timeRef.current * 12) * 0.8 + Math.sin(timeRef.current * 7.3) * 0.6
      lightRef.current.intensity = flicker
    }
  })

  return (
    <group position={position}>
      {LAYERS.map((layer, i) => (
        <FireLayer key={i} config={layer} flameHeight={flameHeight} cameraRef={cameraRef} />
      ))}

      {/* Flickering fire light — castShadow:false (performance.md) */}
      <pointLight
        ref={lightRef}
        color="#ff4400"
        intensity={2.5}
        distance={1.5}
        castShadow={false}
      />
    </group>
  )
}
