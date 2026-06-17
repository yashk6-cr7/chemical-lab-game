/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function PourStream({ active, color, startPos, endY }) {
  const groupRef = useRef()
  const splashGroupRef = useRef()
  
  // 8 particles for the splash at the bottom
  const splashCount = 8
  const splashParticles = useMemo(() => {
    return Array.from({ length: splashCount }).map(() => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        Math.random() * 0.2 + 0.05,
        (Math.random() - 0.5) * 0.15
      ),
      life: Math.random()
    }))
  }, [])

  const splashRefs = useRef([])
  const streamMeshRef = useRef()
  const materialRef = useRef()

  useFrame((_, delta) => {
    if (!active) {
      if (groupRef.current) groupRef.current.visible = false
      if (splashGroupRef.current) splashGroupRef.current.visible = false
      return
    }

    if (groupRef.current) groupRef.current.visible = true
    if (splashGroupRef.current) splashGroupRef.current.visible = true

    // Animate stream thickness/wobble slightly
    if (streamMeshRef.current) {
      const wobble = 1.0 + Math.sin(Date.now() * 0.02) * 0.1
      streamMeshRef.current.scale.set(wobble, 1, wobble)
    }

    // Animate splash bouncing
    splashParticles.forEach((sp, i) => {
      const mesh = splashRefs.current[i]
      if (mesh) {
        sp.life -= delta * 4 // Splash lifespan
        if (sp.life <= 0) {
          // Reset splash particle
          sp.life = 1.0
          mesh.position.set(0, 0, 0)
          sp.velocity.set(
            (Math.random() - 0.5) * 0.15,
            Math.random() * 0.2 + 0.05,
            (Math.random() - 0.5) * 0.15
          )
        } else {
          // Apply gravity and move
          sp.velocity.y -= 0.8 * delta // gravity
          mesh.position.addScaledVector(sp.velocity, delta)
          // Scale down based on life
          const s = Math.max(0, sp.life)
          mesh.scale.set(s, s, s)
        }
      }
    })
  })

  // Handle arrays, objects, or undefined
  const sX = startPos?.x ?? startPos?.[0] ?? 0
  const sY = startPos?.y ?? startPos?.[1] ?? 0
  const sZ = startPos?.z ?? startPos?.[2] ?? 0
  const finalEndY = endY ?? -1

  const distance = Math.max(0.01, sY - finalEndY)

  return (
    <group>
      {/* Continuous Stream */}
      <group ref={groupRef} position={[sX, sY, sZ]}>
        <mesh ref={streamMeshRef} position={[0, -distance / 2, 0]}>
          {/* Cylinder stretching from startPos to endY */}
          <cylinderGeometry args={[0.005, 0.003, distance, 8]} />
          <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Splash at the bottom */}
      <group ref={splashGroupRef} position={[sX, finalEndY, sZ]}>
        {splashParticles.map((_, i) => (
          <mesh 
            key={`splash-${i}`}
            ref={el => splashRefs.current[i] = el}
          >
            <sphereGeometry args={[0.003, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
