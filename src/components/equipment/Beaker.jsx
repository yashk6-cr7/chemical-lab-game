import { useRef, useCallback } from 'react'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'
import LiquidRenderer from '../chemicals/LiquidRenderer'

// physics.md: Use primitive colliders (CylinderCollider) instead of Trimesh/Hull for moving objects
// Beaker uses RigidBody type="fixed" when on bench, "dynamic" when held or knocked

export default function Beaker({ beaker }) {
  const meshRef = useRef()
  const rbRef   = useRef()

  const isHoldingBeaker = useLabStore(state => state.isHoldingBeaker)
  const heldBeakerId    = useLabStore(state => state.heldBeakerId)
  const setHoverTarget   = useLabStore(state => state.setHoverTarget)
  const pickUpBeaker     = useLabStore(state => state.pickUpBeaker)
  const queueConsequence = useLabStore(state => state.queueConsequence)
  
  const isHeld = isHoldingBeaker && heldBeakerId === beaker.id

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    setHoverTarget('beaker')
  }, [setHoverTarget])

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation()
    setHoverTarget(null)
  }, [setHoverTarget])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (!isHoldingBeaker) {
      pickUpBeaker(beaker.id)
    }
  }, [isHoldingBeaker, pickUpBeaker, beaker.id])

  // physics.md: Handle high-velocity impacts
  const handleCollision = useCallback(() => {
    if (!rbRef.current) return
    const velocity = rbRef.current.linvel()
    if (Math.abs(velocity.y) > 3 || Math.abs(velocity.x) > 3 || Math.abs(velocity.z) > 3) {
      // Hard impact — beaker crack risk
      queueConsequence({ type: 'beaker_crack', beakerId: beaker.id })
    }
  }, [beaker.id, queueConsequence])

  return (
    // physics.md: Wrap in RigidBody
    <RigidBody
      ref={rbRef}
      type={isHeld ? 'kinematicPosition' : 'fixed'} // Kinematic when held, fixed when on bench
      colliders={false}
      position={beaker.position}
      onCollisionEnter={handleCollision}
      userData={{ id: beaker.id, type: 'beaker' }}
    >
      <CylinderCollider args={[0.09, 0.07, 0.18]} position={[0, 0.09, 0]} />

      <group 
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        visible={!isHeld} // Hide the fixed body when held; a separate HeldBeaker component should render the held one
      >
        {/* Glass body */}
        <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.18, 32]} />
          <meshPhysicalMaterial 
            color="#ffffff"
            transmission={0.95}
            roughness={0.05}
            thickness={0.02}
            ior={1.52}
            transparent={false} // threejs.md: false when transmission > 0
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Liquid level */}
        <LiquidRenderer 
          fillLevel={beaker.totalVolume / 100} 
          color={beaker.mixedColor} 
          temperature={beaker.temperature}
        />

        {/* Volume markings */}
        {[...Array(4)].map((_, i) => (
          <mesh key={i} position={[0, 0.04 + i * 0.04, 0.071]}>
            <planeGeometry args={[0.02, 0.002]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}

        {/* Cracked visual overlay */}
        {beaker.isCracked && (
          <mesh position={[0, 0.09, 0.072]}>
            <planeGeometry args={[0.05, 0.1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} wireframe />
          </mesh>
        )}
      </group>
    </RigidBody>
  )
}
