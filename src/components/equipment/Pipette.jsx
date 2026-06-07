import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpring, a } from '@react-spring/three'
import useLabStore from '../../store/useLabStore'

export function Pipette() {
  const isPipetteActive = useLabStore(state => state.isPipetteActive)
  const setPipetteActive = useLabStore(state => state.setPipetteActive)
  const pipetteContents = useLabStore(state => state.pipetteContents)
  const setHoverTarget = useLabStore(state => state.setHoverTarget)
  const dropBottle = useLabStore(state => state.dropBottle)

  const groupRef = useRef()
  const { camera } = useThree()

  // Squeeze animation state
  const [isSqueezed, setIsSqueezed] = useState(false)

  const { squeezeScale } = useSpring({
    squeezeScale: isSqueezed ? 0.6 : 1,
    config: { tension: 400, friction: 15 }
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'p') {
        const { isPipetteActive, setPipetteActive, heldBottleId, dropBottle } = useLabStore.getState()
        if (!isPipetteActive && heldBottleId) {
          dropBottle() // drop any held chemical first
        }
        setPipetteActive(!isPipetteActive)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Position pipette in front of camera
  useFrame(() => {
    if (!groupRef.current || !isPipetteActive) return
    const targetPos = new THREE.Vector3(0.3, -0.2, -0.6)
    targetPos.applyMatrix4(camera.matrixWorld)
    
    groupRef.current.position.lerp(targetPos, 0.2)
    groupRef.current.quaternion.slerp(camera.quaternion, 0.2)
    
    // Tilt the pipette slightly
    groupRef.current.rotateX(-Math.PI / 6)
  })

  // We expose a global function or effect for beaker click to trigger pipette squeeze
  useEffect(() => {
    // If beaker is clicked while pipette active, handle pipette action
    // This is handled in LabStore or useSimulation usually, but we can just listen to the store's hover/click state
    // Actually, Beaker.jsx handles clicks. We need to modify Beaker.jsx or handle it through store.
    // For now, let's just animate squeeze when contents change.
  }, [pipetteContents])

  // Temporarily trigger squeeze when contents change
  const previousContents = useRef(pipetteContents)
  useEffect(() => {
    if (pipetteContents !== previousContents.current) {
      setIsSqueezed(true)
      setTimeout(() => setIsSqueezed(false), 150)
      previousContents.current = pipetteContents
    }
  }, [pipetteContents])

  if (!isPipetteActive) return null

  return (
    <group ref={groupRef}>
      {/* Pipette Tube */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.015, 0.005, 0.3, 16]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.9}
          roughness={0.05}
          thickness={0.02}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Liquid inside */}
      {pipetteContents && (
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.01, 0.004, 0.1, 16]} />
          <meshStandardMaterial
            color={pipetteContents.color}
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Rubber Bulb (Squeezable) */}
      <a.mesh position={[0, 0.02, 0]} scale-y={squeezeScale} scale-x={squeezeScale.to(s => 1 + (1 - s) * 0.5)} scale-z={squeezeScale.to(s => 1 + (1 - s) * 0.5)}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#dd4444" roughness={0.7} />
      </a.mesh>
    </group>
  )
}
