import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Animated color change for the liquid surface/volume
export default function ColorShiftEffect({ position, fromColor, toColor, duration = 0.8, onComplete }) {
  const meshRef = useRef()
  const rippleRef = useRef()
  const timeRef = useRef(0)
  const phaseRef = useRef(0) // 0 = white flash, 1 = transition
  const doneRef = useRef(false)

  const from = new THREE.Color(fromColor || '#ffffff')
  const to = new THREE.Color(toColor || '#ffffff')
  const white = new THREE.Color('#ffffff')

  useEffect(() => {
    // Reset on new color change
    timeRef.current = 0
    phaseRef.current = 0
    doneRef.current = false
  }, [toColor])

  useFrame((_, delta) => {
    if (doneRef.current) return

    timeRef.current += delta

    if (!meshRef.current) return

    // Phase 0: brief white flash (0.1s)
    if (phaseRef.current === 0) {
      const flashT = Math.min(1, timeRef.current / 0.1)
      const col = new THREE.Color().copy(from).lerp(white, flashT)
      meshRef.current.material.color.copy(col)
      meshRef.current.material.opacity = 0.5 * flashT

      if (timeRef.current >= 0.1) {
        phaseRef.current = 1
        timeRef.current = 0
      }
    }

    // Phase 1: transition from white to target (duration)
    else {
      const t = Math.min(1, timeRef.current / duration)
      // ease in-out
      const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const col = new THREE.Color().copy(white).lerp(to, easedT)
      meshRef.current.material.color.copy(col)
      meshRef.current.material.opacity = 0.3 * (1 - t)

      // Ripple expansion
      if (rippleRef.current) {
        const rippleScale = t * 0.1
        rippleRef.current.scale.setScalar(rippleScale)
        rippleRef.current.material.opacity = (1 - t) * 0.4
      }

      if (t >= 1) {
        doneRef.current = true
        if (onComplete) onComplete()
      }
    }
  })

  return (
    <group position={position}>
      {/* Overlay flash plane on liquid surface */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.09, 24]} />
        <meshBasicMaterial
          color={toColor}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding ripple ring */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} scale={0}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshBasicMaterial
          color={toColor || '#ffffff'}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
