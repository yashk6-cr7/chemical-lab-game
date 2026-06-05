/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

export default function SpatterEffect({ position, color = '#ffffff', onComplete }) {
  const count = 30
  const meshRefs = useRef([])
  const stainRefs = useRef([])
  const doneRef = useRef(false)
  const timeRef = useRef(0)

  const droplets = useMemo(() => Array.from({ length: count }, () => {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 0.5 // upper hemisphere
    const speed = 0.3 + Math.random() * 0.5
    return {
      velX: Math.sin(phi) * Math.cos(theta) * speed,
      velY: Math.cos(phi) * speed + 0.2,
      velZ: Math.sin(phi) * Math.sin(theta) * speed,
      x: 0, y: 0, z: 0,
      size: 0.005 + Math.random() * 0.01,
      settled: false,
      settledY: -0.15, // bench surface offset from beaker
    }
  }), [])

  useFrame((_, delta) => {
    if (doneRef.current) return
    timeRef.current += delta

    let allSettled = true
    droplets.forEach((d, i) => {
      const mesh = meshRefs.current[i]
      if (!mesh) return

      if (!d.settled) {
        allSettled = false
        d.velY -= 2.5 * delta // gravity
        d.x += d.velX * delta
        d.y += d.velY * delta
        d.z += d.velZ * delta

        if (d.y <= d.settledY) {
          d.y = d.settledY
          d.settled = true
          // Create stain
          const stain = stainRefs.current[i]
          if (stain) {
            const stainSize = 0.02 + Math.random() * 0.03
            stain.scale.setScalar(stainSize * 100)
            stain.visible = true
          }
        }

        mesh.position.set(d.x, d.y, d.z)
        mesh.scale.setScalar(d.size * 100)
      } else {
        // Make droplet invisible when settled
        mesh.scale.setScalar(0)
      }
    })

    if (allSettled && timeRef.current > 0.5) {
      doneRef.current = true
      if (onComplete) onComplete()
    }
  })

  return (
    <group position={position}>
      {droplets.map((_, i) => (
        <mesh key={`drop-${i}`} ref={el => meshRefs.current[i] = el}>
          <sphereGeometry args={[0.01, 5, 5]} />
          <meshStandardMaterial color={color} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Surface stains */}
      {droplets.map((d, i) => (
        <mesh
          key={`stain-${i}`}
          ref={el => stainRefs.current[i] = el}
          position={[d.x, d.settledY + 0.001, d.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0}
          visible={false}
        >
          <circleGeometry args={[0.01, 8]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.4}
            roughness={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
