/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Precipitate particles sink downward (opposite of bubbles)
export default function PrecipitateEffect({ position, precipitateColor = '#1e88e5', amount = 0 }) {
  const count = Math.floor(60 + (amount / 100) * 140)
  const meshRef = useRef()
  const dummy = useRef(new THREE.Object3D())

  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 0.14,
    z: (Math.random() - 0.5) * 0.14,
    y: Math.random() * 0.15, // start anywhere in liquid volume
    speed: 0.02 + Math.random() * 0.03,
    size: 0.003 + Math.random() * 0.003,
    phase: Math.random() * Math.PI * 2,
    settled: false,
  })), [count])

  // Layer of settled precipitate at bottom
  const settledScale = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return

    let settledCount = 0

    particles.forEach((p, i) => {
      p.phase += delta
      const drift = Math.sin(p.phase) * 0.001

      if (!p.settled) {
        p.y -= p.speed * delta
        if (p.y <= 0.005) {
          p.y = 0.005
          p.settled = true
        }
      } else {
        settledCount++
      }

      dummy.current.position.set(p.x + drift, p.y, p.z)
      dummy.current.scale.setScalar(p.size * 1000)
      dummy.current.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.current.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true

    // Grow settled layer
    const targetScale = Math.min(1, settledCount / count)
    settledScale.current += (targetScale - settledScale.current) * delta * 2
  })

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[null, null, count]}>
        <sphereGeometry args={[0.001, 5, 5]} />
        <meshStandardMaterial
          color={precipitateColor}
          roughness={0.8}
          opacity={1}
        />
      </instancedMesh>

      {/* Settled layer at bottom of beaker */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[settledScale.current * 0.08, settledScale.current * 0.08, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshStandardMaterial color={precipitateColor} roughness={0.9} />
      </mesh>
    </group>
  )
}
