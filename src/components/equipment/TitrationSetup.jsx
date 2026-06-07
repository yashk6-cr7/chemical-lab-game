import { useMemo, useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpring, a } from '@react-spring/three'
import useLabStore from '../../store/useLabStore'
import { calculateReaction } from '../../systems/reactionEngine'
import { runCascade } from '../../systems/consequenceEngine'
import { checkViolations } from '../../systems/safetyManager'
import chemicalsData from '../../data/chemicals.json'

// Shared clipping plane for liquid fill
const localPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.6)

export function TitrationSetup() {
  const titration = useLabStore(state => state.titration)
  const updateTitration = useLabStore(state => state.updateTitration)
  const beakers = useLabStore(state => state.beakers)
  const setBeakers = useLabStore(state => state.setBeakers)
  const queueConsequence = useLabStore(state => state.queueConsequence)
  const activeSafetyViolations = useLabStore(state => state.activeSafetyViolations)
  const safetyGear = useLabStore(state => state.safetyGear)
  const inFumeHood = useLabStore(state => state.inFumeHood)

  const dropRef = useRef()
  const tapRef = useRef()

  const [dropState, setDropState] = useState({ active: false, y: 0.2 })

  // Find burette chemical properties
  const buretteChemical = useMemo(() => {
    return chemicalsData.find(c => c.id === titration.buretteChemicalId)
  }, [titration.buretteChemicalId])

  // Tap animation (90deg rotation when dropping)
  const { tapRotation } = useSpring({
    tapRotation: titration.dropMode || dropState.active ? Math.PI / 2 : 0,
    config: { tension: 300, friction: 20 }
  })

  // Keyboard shortcut listener for 'T'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 't') {
        const { heldBottleId, beakers, titration, setTitrationActive, updateTitration } = useLabStore.getState()
        if (titration.isActive) {
          // Toggle drop mode
          updateTitration({ dropMode: !titration.dropMode })
        } else if (heldBottleId && heldBottleId !== 'mystery') {
          // Activate titration with held chemical. Find nearest beaker under it.
          // Assuming burette is at x=0, z=0
          const targetBeaker = beakers.find(b => Math.abs(b.position[0]) < 0.2 && Math.abs(b.position[2]) < 0.2)
          if (targetBeaker) {
            setTitrationActive(heldBottleId, targetBeaker.id)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Wheel listener for drops
  useEffect(() => {
    const handleWheel = (e) => {
      const { titration, updateTitration } = useLabStore.getState()
      if (titration.isActive && !titration.dropMode) {
        if (e.deltaY > 0 && titration.volumeAdded < 50) {
          triggerDrop()
        }
      }
    }
    window.addEventListener('wheel', handleWheel)
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  const triggerDrop = () => {
    const { titration, updateTitration } = useLabStore.getState()
    if (titration.volumeAdded >= 50) return
    setDropState({ active: true, y: 0.2 })
    updateTitration({ volumeAdded: Math.min(50, titration.volumeAdded + 0.1) })
  }

  // Handle continuous drop mode and drop animation
  useFrame((_, delta) => {
    const { titration, updateTitration } = useLabStore.getState()

    if (titration.isActive && titration.dropMode && titration.volumeAdded < 50) {
      if (!dropState.active) triggerDrop()
    }

    if (dropState.active) {
      const newY = dropState.y - (delta * 1.5) // drop falls down
      if (newY < -0.3) {
        // Impact
        setDropState({ active: false, y: 0.2 })
        applyDropToBeaker()
      } else {
        setDropState(s => ({ ...s, y: newY }))
      }
    }
    
    // Update clipping plane height based on volume added (0 = full (y=0.6), 50 = empty (y=-0.5))
    const fillRatio = 1 - (titration.volumeAdded / 50)
    localPlane.constant = -0.5 + (fillRatio * 1.1)
  })

  const applyDropToBeaker = () => {
    const { titration, beakers, setBeakers, updateTitration } = useLabStore.getState()
    const beaker = beakers.find(b => b.id === titration.flaskBeakerId)
    if (!beaker || !buretteChemical) return

    const reactionResult = calculateReaction(beaker.contents, {
      ...buretteChemical,
      volume: 0.1 // 0.1 mL drop
    })

    const newColor = buretteChemical.color
    const updatedContents = [...beaker.contents, { chemicalId: buretteChemical.id, volume: 0.1 }]

    const updatedBeaker = {
      ...beaker,
      contents: updatedContents,
      totalVolume: beaker.totalVolume + 0.1,
      mixedColor: reactionResult.colorChange || newColor, // Simplified color blending
      reactionResult,
      temperature: beaker.temperature + (reactionResult.exothermic ? 1 : 0)
    }

    setBeakers(beakers.map(b => b.id === beaker.id ? updatedBeaker : b))

    // Check endpoint
    if (reactionResult.colorChange && !titration.endpointReached) {
      updateTitration({ endpointReached: true })
      // Could log to logbook automatically here if needed
    }

    // Safety checks
    const violations = checkViolations(reactionResult, beaker.temperature, safetyGear, inFumeHood)
    if (violations.length > 0 && activeSafetyViolations.length === 0) {
      runCascade(reactionResult, beaker, violations, queueConsequence)
    }
  }

  if (!titration.isActive) return null

  return (
    <group position={[0, 0.8, 0]}>
      {/* Burette Glass Tube */}
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 16, 1, true]} />
        <meshPhysicalMaterial
          transmission={0.9} roughness={0.05} thickness={0.1}
          color="#aaddff" transparent opacity={0.3} side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Liquid Fill inside Burette */}
      {buretteChemical && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 1.18, 16]} />
          <meshStandardMaterial
            color={buretteChemical.color}
            transparent={true}
            opacity={0.8}
            depthWrite={false}
            clippingPlanes={[localPlane]}
            clipIntersection={false}
          />
        </mesh>
      )}

      {/* Tap at bottom */}
      <a.group position={[0, -0.6, 0]} rotation-x={tapRotation}>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
        </mesh>
      </a.group>

      {/* Drop Particle */}
      {dropState.active && buretteChemical && (
        <mesh position={[0, dropState.y - 0.6, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={buretteChemical.color} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Simple Volume Markings (Instanced) */}
      <TitrationMarkings />
    </group>
  )
}

function TitrationMarkings() {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!meshRef.current) return
    for (let i = 0; i <= 50; i += 5) {
      const y = 0.5 - (i / 50)
      dummy.position.set(0, y, 0.06)
      dummy.scale.set(0.02, 0.002, 0.005)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i / 5, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [dummy])

  return (
    <instancedMesh ref={meshRef} args={[null, null, 11]}>
      <boxGeometry />
      <meshBasicMaterial color="#333333" />
    </instancedMesh>
  )
}
