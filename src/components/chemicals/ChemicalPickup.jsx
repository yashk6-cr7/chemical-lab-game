/* eslint-disable */
import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'
import { useDisposable } from '../../utils/disposal'
import LiquidRenderer from './LiquidRenderer'

// animation.md: @react-spring/three for 3D spring physics — framer-motion is HTML ONLY
// Pre-allocate vectors outside component to avoid GC in useFrame (r3f.md)
const _camQuat = new THREE.Quaternion()
const _localQuat = new THREE.Quaternion()
const _euler = new THREE.Euler()
const _worldPos = new THREE.Vector3()

function createLabelTexture(chemical) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 300
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 256, 300)
  ctx.strokeStyle = chemical.labelColor
  ctx.lineWidth = 12
  ctx.strokeRect(6, 6, 244, 288)
  ctx.fillStyle = chemical.labelColor
  ctx.font = 'bold 34px sans-serif'
  ctx.textAlign = 'center'
  const words = chemical.name.split(' ')
  if (words.length > 1 && ctx.measureText(chemical.name).width > 220) {
    ctx.fillText(words[0], 128, 60)
    ctx.fillText(words.slice(1).join(' '), 128, 100)
  } else {
    ctx.fillText(chemical.name, 128, 78)
  }
  ctx.fillStyle = '#333333'
  ctx.font = '30px monospace'
  ctx.fillText(chemical.formula, 128, 158)
  const dotY = 240
  const dotSpacing = 24
  const startX = 128 - ((chemical.hazardLevel - 1) * dotSpacing) / 2
  for (let i = 0; i < chemical.hazardLevel; i++) {
    ctx.beginPath()
    ctx.arc(startX + i * dotSpacing, dotY, 8, 0, Math.PI * 2)
    ctx.fillStyle = chemical.hazardLevel >= 4 ? '#ff0000' : chemical.hazardLevel >= 3 ? '#ff9800' : '#4caf50'
    ctx.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 16
  return texture
}

export default function ChemicalPickup() {
  const heldChemical = useLabStore(state => state.heldChemical)
  const isPouring    = useLabStore(state => state.isPouring)
  const putDownBottle = useLabStore(state => state.putDownBottle)
  const isHoldingBeaker = useLabStore(state => state.isHoldingBeaker)
  const heldBeakerId    = useLabStore(state => state.heldBeakerId)
  const beakers         = useLabStore(state => state.beakers)
  const putDownBeaker   = useLabStore(state => state.putDownBeaker)

  const groupRef = useRef()

  // Pre-allocated refs — avoids new THREE.Vector3() in useFrame (r3f.md critical rule)
  const localPos   = useRef(new THREE.Vector3(0.32, 0.82, -0.2)) // character hand offset
  const targetPos  = useRef(new THREE.Vector3(0.32, 0.82, -0.2))
  const localRotX  = useRef(0)

  // Keep activeChemical stable so texture doesn't flicker on quick pick/put
  const [activeChemical, setActiveChemical] = useState(null)
  useEffect(() => {
    if (heldChemical) setActiveChemical(heldChemical)
  }, [heldChemical])

  const [activeBeaker, setActiveBeaker] = useState(null)
  useEffect(() => {
    if (heldBeakerId) {
      const b = beakers.find(b => b.id === heldBeakerId)
      if (b) setActiveBeaker(b)
    }
  }, [heldBeakerId, beakers])

  // Label texture — useMemo + dispose on unmount (performance.md)
  const labelTexture = useMemo(() => {
    if (!activeChemical) return null
    return createLabelTexture(activeChemical)
  }, [activeChemical])

  useDisposable(labelTexture)

  // Key Q to put down
  const handleKeyDown = useCallback((e) => {
    if (e.code === 'KeyQ') {
      if (heldChemical) putDownBottle()
      if (isHoldingBeaker && heldBeakerId) putDownBeaker(heldBeakerId, [0, 0.92, 0]) // Fallback drop position, interaction handles actual drop usually
    }
  }, [heldChemical, putDownBottle, isHoldingBeaker, heldBeakerId, putDownBeaker])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  useFrame((_, delta) => {
    if (!groupRef.current || !activeChemical) return

    const { characterPos, characterYaw } = useLabStore.getState()

    // --- Spring target based on state ---
    const tX = 0.32 // right hand x
    const tY = isPouring ? 1.0 : 0.82 // lift when pouring
    const tZ = isPouring ? -0.4 : -0.2 // forward when pouring
    const tRotX = isPouring ? -2.0 : 0 // tilt forward when pouring

    // Lerp local position
    targetPos.current.set(tX, tY, tZ)
    localPos.current.lerp(targetPos.current, delta * 5)
    localRotX.current += (tRotX - localRotX.current) * delta * 5

    // --- Character-space → world-space transform ---
    // Character facing uses characterYaw + Math.PI in Character.jsx
    const yaw = characterYaw + Math.PI
    _camQuat.setFromAxisAngle(new THREE.Vector3(0,1,0), yaw)
    _euler.set(localRotX.current, 0, 0)
    _localQuat.setFromEuler(_euler)

    // Base world position from character
    _worldPos.set(characterPos.x, characterPos.y, characterPos.z)
    
    // Add rotated local hand offset
    _worldPos.add(localPos.current.clone().applyQuaternion(_camQuat))

    groupRef.current.position.copy(_worldPos)
    // Final rotation = character yaw * local pitch
    groupRef.current.quaternion.copy(_camQuat).multiply(_localQuat)
  })

  const scale = (heldChemical || isHoldingBeaker) ? 1 : 0

  return (
    <group ref={groupRef} scale={scale}>
      {activeChemical && heldChemical && (
        <>
          {/* Bottle body — transmission, no transparent flag (threejs.md) */}
          <mesh castShadow receiveShadow position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.28, 16]} />
            <meshPhysicalMaterial
              color={activeChemical.bottleColor}
              envMapIntensity={1.0}
              roughness={0.05}
              metalness={0}
              transmission={0.7}
              thickness={0.5}
              ior={1.5}
              transparent={false}
            />
          </mesh>

          {/* Contents */}
          <mesh position={[0, 0.095, 0]}>
            <cylinderGeometry args={[0.055, 0.062, 0.18, 16]} />
            <meshStandardMaterial
              color={activeChemical.color}
              transparent={activeChemical.state === 'liquid'}
              opacity={activeChemical.state === 'liquid' ? activeChemical.liquidOpacity : 1.0}
              roughness={activeChemical.state === 'solid' ? 1.0 : 0.2}
              depthWrite={activeChemical.state !== 'liquid'}
            />
          </mesh>

          {/* Cap */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
            <meshStandardMaterial
              color={activeChemical.labelColor}
              roughness={0.6}
              metalness={0.1}
            />
          </mesh>

          {/* Label */}
          <mesh position={[0, 0.12, 0.068]}>
            <planeGeometry args={[0.1, 0.12]} />
            <meshStandardMaterial
              map={labelTexture}
              transparent
              roughness={0.8}
              depthWrite={false}
            />
          </mesh>

          {/* Subtle glow while held */}
          <pointLight
            position={[0, 0.15, 0]}
            color={activeChemical.color}
            intensity={0.3}
            distance={1.0}
            castShadow={false}
          />
        </>
      )}

      {/* Held Beaker Rendering */}
      {isHoldingBeaker && activeBeaker && (
        <group position={[0, -0.1, 0]}> {/* Adjust offset so it sits right in hand */}
          <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.18, 32]} />
            <meshPhysicalMaterial 
              color="#ffffff"
              transmission={0.95}
              roughness={0.05}
              thickness={0.02}
              ior={1.52}
              transparent={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          <LiquidRenderer 
            fillLevel={activeBeaker.totalVolume / 100} 
            color={activeBeaker.mixedColor} 
            temperature={activeBeaker.temperature}
          />

          {/* Volume markings */}
          {[...Array(4)].map((_, i) => (
            <mesh key={`mark-${i}`} position={[0, 0.04 + i * 0.04, 0.071]}>
              <planeGeometry args={[0.02, 0.002]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}

          {activeBeaker.isCracked && (
            <mesh position={[0, 0.09, 0.072]}>
              <planeGeometry args={[0.05, 0.1]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} wireframe />
            </mesh>
          )}
        </group>
      )}
    </group>
  )
}
