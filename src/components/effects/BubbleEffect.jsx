/* eslint-disable */
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// particles.md: InstancedMesh pattern — 200 instances, single draw call
// Pre-allocate dummy Object3D outside component to avoid GC (r3f.md)
const _dummy = new THREE.Object3D()

const COUNT_BY_INTENSITY = { low: 40, mid: 100, high: 200 }

export default function BubbleEffect({ position, intensity = 5, color = '#ffffff', foamMode = false }) {
  const meshRef    = useRef()
  const foamScale  = useRef(0)

  const count = useMemo(() => {
    if (intensity <= 3) return COUNT_BY_INTENSITY.low
    if (intensity <= 6) return COUNT_BY_INTENSITY.mid
    return COUNT_BY_INTENSITY.high
  }, [intensity])

  // particles.md: pre-calculate all bubble data in useMemo — no per-frame allocation
  const bubbles = useMemo(() => Array.from({ length: count }, () => ({
    x:     (Math.random() - 0.5) * 0.14,
    z:     (Math.random() - 0.5) * 0.14,
    y:     Math.random() * 0.12,
    speed: 0.04 + Math.random() * 0.08,
    size:  0.004 + Math.random() * 0.008,
    phase: Math.random() * Math.PI * 2,
    driftX:(Math.random() - 0.5) * 0.02,
    driftZ:(Math.random() - 0.5) * 0.02,
  })), [count])

  useFrame((_, delta) => {
    if (!meshRef.current) return

    const liquidTop = 0.12 + (foamMode ? foamScale.current * 0.3 : 0)

    for (let i = 0; i < count; i++) {
      const b = bubbles[i]

      // Move up
      b.y += b.speed * delta * (intensity / 5)
      b.phase += delta * 2

      const wobbleX = Math.sin(b.phase) * 0.008
      const wobbleZ = Math.cos(b.phase * 0.7) * 0.008

      // Pool reset — move to bottom when it "pops" (particles.md: no allocation)
      if (b.y > liquidTop) {
        b.y = 0
        b.x = (Math.random() - 0.5) * 0.14
        b.z = (Math.random() - 0.5) * 0.14
      }

      const scalePulse = 0.9 + Math.sin(b.phase * 3) * 0.1

      _dummy.position.set(
        position[0] + b.x + wobbleX,
        position[1] + b.y,
        position[2] + b.z + wobbleZ
      )
      _dummy.scale.setScalar(b.size * scalePulse * 100)
      _dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, _dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true

    // Foam growth
    if (foamMode && foamScale.current < 1) {
      foamScale.current = Math.min(1, foamScale.current + delta * 0.5)
    }
  })

  // performance.md: dispose geometry + material on unmount
  useEffect(() => {
    const mesh = meshRef.current
    return () => {
      mesh?.geometry?.dispose()
      if (mesh?.material) {
        Array.isArray(mesh.material)
          ? mesh.material.forEach(m => m.dispose())
          : mesh.material.dispose()
      }
    }
  }, [])

  return (
    <group>
      {/* Single InstancedMesh = 1 draw call for all bubbles (particles.md) */}
      <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
        <sphereGeometry args={[0.01, 6, 6]} />
        {/* MeshPhysicalMaterial gives glass/soap bubble look */}
        <meshPhysicalMaterial
          color={color}
          transmission={0.9}
          roughness={0}
          metalness={0}
          opacity={0.5}
          transparent
          thickness={0.1}
          ior={1.33}
          depthWrite={false}  // performance.md: depthWrite false on all transparent mats
        />
      </instancedMesh>

      {/* Foam blob for elephant toothpaste */}
      {foamMode && foamScale.current > 0 && (
        <mesh
          position={[position[0], position[1] + 0.18, position[2]]}
          scale={[foamScale.current, foamScale.current, foamScale.current]}
        >
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color="#f0f8ff" roughness={0.9} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
