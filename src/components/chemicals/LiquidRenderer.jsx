/* eslint-disable */
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Renders visible colored liquid inside a beaker cylinder
export default function LiquidRenderer({ fillLevel, color, temperature, reactionIntensity = 0 }) {
  const liquidRef = useRef()
  const surfaceRef = useRef()
  const matRef = useRef()
  const surfaceMatRef = useRef()

  // Safely parse color — fallback to blue-tinted water if invalid
  const safeColor = (color && typeof color === 'string' && color.length > 2) ? color : '#b3e5fc'

  // Update color reactively
  useEffect(() => {
    if (matRef.current) {
      try { matRef.current.color.set(safeColor) } catch (e) {}
    }
    if (surfaceMatRef.current) {
      try { surfaceMatRef.current.color.set(safeColor) } catch (e) {}
    }
  }, [safeColor])

  // Animate surface wave & boiling
  useFrame((state) => {
    if (!surfaceRef.current) return
    const t = state.clock.elapsedTime
    const boil = Math.max(0, (temperature - 70) / 40)
    const wave = reactionIntensity * 0.3 + boil * 0.5
    surfaceRef.current.rotation.y = t * 0.5
    surfaceRef.current.position.y = Math.sin(t * (2 + wave * 4)) * (0.002 + wave * 0.006)
  })

  if (!fillLevel || fillLevel <= 0) return null

  const height = Math.max(0.005, fillLevel * 0.155)
  const yBase = 0.012  // sits just above beaker bottom
  const isBoiling = temperature > 85
  const isReacting = reactionIntensity > 0.3

  // Liquid opacity — more opaque for concentrated chemicals
  const opacity = Math.min(0.92, 0.55 + fillLevel * 0.35)

  return (
    <group>
      {/* Main liquid body — fills beaker from bottom to fill level */}
      <mesh ref={liquidRef} position={[0, yBase + height / 2, 0]}>
        <cylinderGeometry args={[0.063, 0.063, height, 24]} />
        <meshStandardMaterial
          ref={matRef}
          color={safeColor}
          transparent
          opacity={opacity}
          roughness={0.05}
          metalness={0.0}
          depthWrite={false}
        />
      </mesh>

      {/* Liquid surface — top face with animated shimmer */}
      <group ref={surfaceRef} position={[0, yBase + height, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.063, 24]} />
          <meshStandardMaterial
            ref={surfaceMatRef}
            color={safeColor}
            transparent
            opacity={Math.min(1, opacity + 0.1)}
            roughness={0.02}
            metalness={0.1}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Boiling bubbles */}
      {isBoiling && [0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[
            Math.cos(angle) * 0.03,
            yBase + height * 0.5,
            Math.sin(angle) * 0.03
          ]}>
            <sphereGeometry args={[0.004, 6, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
        )
      })}

      {/* Reaction glow — faint emissive ring at surface when reacting */}
      {isReacting && (
        <mesh position={[0, yBase + height + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.055, 0.068, 24]} />
          <meshBasicMaterial color={safeColor} transparent opacity={0.4 * reactionIntensity} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
