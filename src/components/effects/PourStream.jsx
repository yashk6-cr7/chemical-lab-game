/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function PourStream({ active, color, startPos, endY }) {
  const groupRef = useRef()
  const splashGroupRef = useRef()
  
  // 12 particles for the stream
  const particleCount = 12
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      yOffset: Math.random() * 0.4, // Stagger starting y
      xOffset: (Math.random() - 0.5) * 0.005,
      zOffset: (Math.random() - 0.5) * 0.005,
      speed: 1.5 + Math.random() * 0.5
    }))
  }, [])

  // 8 particles for the splash at the bottom
  const splashCount = 8
  const splashParticles = useMemo(() => {
    return Array.from({ length: splashCount }).map(() => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.3 + 0.1,
        (Math.random() - 0.5) * 0.2
      ),
      life: Math.random()
    }))
  }, [])

  const particleRefs = useRef([])
  const splashRefs = useRef([])

  // Store material so we can fade it
  const materialRef = useRef()

  useFrame((_, delta) => {
    if (!active) {
      if (groupRef.current) groupRef.current.visible = false
      if (splashGroupRef.current) splashGroupRef.current.visible = false
      return
    }

    if (groupRef.current) groupRef.current.visible = true
    if (splashGroupRef.current) splashGroupRef.current.visible = true

    // Animate stream falling
    particles.forEach((p, i) => {
      const mesh = particleRefs.current[i]
      if (mesh) {
        p.yOffset -= p.speed * delta
        // Reset to top when it reaches bottom
        // Top is around 0 relative to group, bottom is distance to endY
        const distance = startPos.y - endY
        if (p.yOffset < -distance) {
          p.yOffset = 0
          p.xOffset = (Math.random() - 0.5) * 0.005
          p.zOffset = (Math.random() - 0.5) * 0.005
        }
        mesh.position.set(p.xOffset, p.yOffset, p.zOffset)
      }
    })

    // Animate splash bouncing
    splashParticles.forEach((sp, i) => {
      const mesh = splashRefs.current[i]
      if (mesh) {
        sp.life -= delta * 3 // Splash lifespan
        if (sp.life <= 0) {
          // Reset splash particle
          sp.life = 1.0
          mesh.position.set(0, 0, 0)
          sp.velocity.set(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.3 + 0.1,
            (Math.random() - 0.5) * 0.2
          )
        } else {
          // Apply gravity and move
          sp.velocity.y -= 0.8 * delta // gravity
          mesh.position.addScaledVector(sp.velocity, delta)
          // Scale down based on life
          const s = sp.life
          mesh.scale.set(s, s, s)
        }
      }
    })
  })

  return (
    <group>
      {/* Stream */}
      <group ref={groupRef} position={startPos}>
        {particles.map((_, i) => (
          <mesh 
            key={`stream-${i}`} 
            ref={el => particleRefs.current[i] = el}
          >
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshBasicMaterial ref={materialRef} color={color} />
          </mesh>
        ))}
      </group>

      {/* Splash at the bottom */}
      <group ref={splashGroupRef} position={[startPos.x, endY, startPos.z]}>
        {splashParticles.map((_, i) => (
          <mesh 
            key={`splash-${i}`}
            ref={el => splashRefs.current[i] = el}
          >
            <sphereGeometry args={[0.004, 6, 6]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
