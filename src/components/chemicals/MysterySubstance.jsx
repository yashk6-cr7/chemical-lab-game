import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

function useMysteryLabelTexture(label) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 300
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 256, 300)

    ctx.strokeStyle = '#222222'
    ctx.lineWidth = 12
    ctx.strokeRect(6, 6, 244, 288)

    ctx.fillStyle = '#222222'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    
    // Large question mark
    ctx.font = 'bold 100px sans-serif'
    ctx.fillText('?', 128, 120)

    ctx.font = 'bold 28px sans-serif'
    ctx.fillText(label, 128, 220)

    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = 16
    return tex
  }, [label])

  useEffect(() => {
    return () => { texture?.dispose() }
  }, [texture])

  return texture
}

export function MysterySubstance() {
  const { isActive, label, revealedName } = useLabStore(state => state.mysterySubstance)
  const heldBottleId = useLabStore(state => state.heldBottleId)
  const setHoverTarget = useLabStore(state => state.setHoverTarget)
  const setHoverLight = useLabStore(state => state.setHoverLight)
  const pickupChemical = useLabStore(state => state.pickupChemical)
  
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef()

  const isHeld = heldBottleId === 'mystery'
  const displayLabel = revealedName || label

  const labelTexture = useMysteryLabelTexture(displayLabel)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const targetY = hovered ? 0.03 : 0
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 10 * delta
  })

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    setHovered(true)
    setHoverTarget('mystery')
    setHoverLight({ active: true, position: [-1.8, 0.4, -0.4], color: '#ffffff' })
  }, [setHoverTarget, setHoverLight])

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation()
    setHovered(false)
    setHoverTarget(null)
    setHoverLight({ active: false })
  }, [setHoverTarget, setHoverLight])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    // It mocks a standard chemical object structure so the rest of the game can hold it
    pickupChemical({
      id: 'mystery',
      name: displayLabel,
      bottleColor: '#1a1a2e',
      labelColor: '#222222',
      state: 'liquid',
      color: '#aaaaaa',
      liquidOpacity: 0.9,
      isMystery: true
    })
  }, [pickupChemical, displayLabel])

  if (!isActive) return null

  // Position mystery bottle on far left of shelf
  const position = [-1.8, 0.1, -0.4]

  return (
    <group
      position={position}
      visible={!isHeld}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <mesh castShadow receiveShadow position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.28, 16]} />
          <meshPhysicalMaterial
            color="#1a1a2e"
            envMapIntensity={1.0}
            roughness={0.1}
            metalness={0.1}
            transmission={0.6}
            thickness={0.5}
            ior={1.5}
            transparent={false}
          />
        </mesh>

        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
          <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.1} />
        </mesh>

        <mesh position={[0, 0.12, 0.068]}>
          <planeGeometry args={[0.1, 0.12]} />
          <meshStandardMaterial map={labelTexture} transparent roughness={0.8} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
