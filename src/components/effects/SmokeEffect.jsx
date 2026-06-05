/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function SmokeEffect({ position, intensity = 5, color = '#777777' }) {
  const count = useMemo(() => Math.floor(30 + (intensity / 10) * 50), [intensity])
  const meshRefs = useRef([])

  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 0.2,
    z: (Math.random() - 0.5) * 0.2,
    y: Math.random() * 0.5,
    speed: 0.03 + Math.random() * 0.03,
    size: 0.06 + Math.random() * 0.14,
    lifetime: 3 + Math.random() * 2,
    age: Math.random() * 4,
    phase: Math.random() * Math.PI * 2,
    driftX: (Math.random() - 0.5) * 0.04,
    driftZ: (Math.random() - 0.5) * 0.04,
    opacity: 0.15 + Math.random() * 0.2,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.5,
  })), [count])

  useFrame((_, delta) => {
    particles.forEach((p, i) => {
      const mesh = meshRefs.current[i]
      if (!mesh) return

      p.age += delta
      if (p.age >= p.lifetime) {
        p.age = 0
        p.x = (Math.random() - 0.5) * 0.2
        p.z = (Math.random() - 0.5) * 0.2
        p.y = 0
      }

      const progress = p.age / p.lifetime
      p.y += p.speed * delta
      p.phase += delta
      const drift = Math.sin(p.phase * 0.8) * 0.01

      const growScale = p.size * (1 + progress * 2)
      mesh.position.set(p.x + drift + p.driftX * p.age, p.y, p.z + p.driftZ * p.age)
      mesh.scale.setScalar(growScale * 100)
      mesh.rotation.z = p.rot + p.rotSpeed * p.age

      if (mesh.material) {
        mesh.material.opacity = (1 - progress) * p.opacity
      }
    })
  })

  return (
    <group position={position}>
      {particles.map((p, i) => (
        <mesh key={i} ref={el => meshRefs.current[i] = el}>
          <planeGeometry args={[0.01, 0.01]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={p.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}
