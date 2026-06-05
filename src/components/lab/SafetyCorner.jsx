// Safety Corner — left wall
// Phase 7: Eyewash + Emergency Shower are now fully interactive

import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRefDisposal } from '../../utils/disposal'
import useLabStore from '../../store/useLabStore'

// ─── Eyewash Station ───────────────────────────────────────────────────────────
function EyewashStation({ position }) {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  const eyeExposureActive = useLabStore(state => state.eyeExposureActive)
  const setEyeExposure    = useLabStore(state => state.setEyeExposure)
  const addConsequence    = useLabStore(state => state.addConsequence)
  const depthMode         = useLabStore(state => state.depthMode)
  const hoverTarget       = useLabStore(state => state.hoverTarget)
  const setHoverTarget    = useLabStore(state => state.setHoverTarget)

  const [isUsing, setIsUsing]   = useState(false)
  const [isFlowing, setIsFlowing] = useState(false)
  const glowRef   = useRef()
  const { camera } = useThree()

  // Pulse glow when eye exposure is active
  useFrame((state) => {
    if (!glowRef.current) return
    const t = state.clock.elapsedTime
    if (eyeExposureActive) {
      glowRef.current.intensity = 0.3 + Math.sin(t * 4) * 0.25
    } else {
      glowRef.current.intensity *= 0.9
    }
  })

  const handleClick = () => {
    // Proximity check — must be within 2 units
    const eyewashWorldPos = new THREE.Vector3(...position)
    const dist = camera.position.distanceTo(eyewashWorldPos)
    if (dist > 2.5) return

    if (!isUsing) {
      setIsUsing(true)
      setIsFlowing(true)

      // Clear eye exposure after 3 seconds of use
      setTimeout(() => {
        setEyeExposure(false)
        addConsequence({
          id: Date.now(),
          type: 'eyewash_used',
          severity: 1,
          message: {
            easy: 'Eyes rinsed at the eyewash station. Injury mitigated. Great instinct!',
            moderate: 'Ocular irrigation performed. 15+ minutes recommended. Injury severity reduced.',
            complex: 'Copious water irrigation initiated. Dilutes and mechanically removes chemical from corneal surface. pH normalization key objective.'
          }
        })
        setIsUsing(false)
        setIsFlowing(false)
      }, 3000)
    }
  }

  const isNearby = hoverTarget === 'eyewash'

  return (
    <group position={position}>
      {/* Eyewash emergency pulse light */}
      <pointLight
        ref={glowRef}
        color="#44ff88"
        intensity={0}
        distance={2}
        castShadow={false}
      />

      <group
        onClick={handleClick}
        onPointerEnter={() => setHoverTarget('eyewash')}
        onPointerLeave={() => { if (hoverTarget === 'eyewash') setHoverTarget(null) }}
      >
        {/* Main box body */}
        <mesh castShadow>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.35, 0.25, 0.18]} />
          <meshStandardMaterial
            ref={el => matRefs.current.push(el)}
            color={eyeExposureActive ? '#6bff88' : '#8bc34a'}
            emissive={eyeExposureActive ? '#004422' : '#000000'}
            emissiveIntensity={eyeExposureActive ? 0.4 : 0}
            roughness={0.5} metalness={0.1}
          />
        </mesh>

        {/* Two bowls */}
        {[-0.07, 0.07].map((x, i) => (
          <mesh key={i} position={[x, -0.06, 0.1]}>
            <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.055, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#cccccc" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}

        {/* Connecting pipe */}
        <mesh position={[0, -0.06, 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.012, 0.012, 0.18, 8]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#bbbbbb" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Emergency label */}
        <mesh position={[0, 0.06, 0.092]}>
          <planeGeometry ref={el => geoRefs.current.push(el)} args={[0.28, 0.1]} />
          <meshStandardMaterial
            ref={el => matRefs.current.push(el)}
            color="#ffffff"
            emissive="#ccff00"
            emissiveIntensity={eyeExposureActive ? 0.5 : 0.12}
            roughness={0.9}
          />
        </mesh>
      </group>

      {/* Water streams when in use */}
      {isFlowing && [-0.07, 0.07].map((x, i) => (
        <mesh key={`stream-${i}`} position={[x, -0.13, 0.1]} rotation={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.003, 0.12, 6]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.7} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Emergency Shower ──────────────────────────────────────────────────────────
function EmergencyShower({ position }) {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  const addConsequence = useLabStore(state => state.addConsequence)
  const hoverTarget    = useLabStore(state => state.hoverTarget)
  const setHoverTarget = useLabStore(state => state.setHoverTarget)
  const { camera } = useThree()

  const [isRunning, setIsRunning] = useState(false)
  const showerLightRef = useRef()

  useFrame((state) => {
    if (!showerLightRef.current) return
    const t = state.clock.elapsedTime
    showerLightRef.current.intensity = isRunning
      ? 0.6 + Math.sin(t * 8) * 0.2
      : 0
  })

  const handleClick = () => {
    const showerWorldPos = new THREE.Vector3(...position)
    const dist = camera.position.distanceTo(showerWorldPos)
    if (dist > 2.5) return

    if (!isRunning) {
      setIsRunning(true)
      setTimeout(() => {
        addConsequence({
          id: Date.now(),
          type: 'shower_used',
          severity: 1,
          message: {
            easy: 'Emergency shower activated! Chemical exposure reduced. A new lab coat is ready.',
            moderate: 'Full-body decontamination performed. Shower for minimum 15 minutes per ANSI Z358.1.',
            complex: 'Deluge shower: 75.7+ L/min for minimum 15 min. Removes chemical from skin, hair, and clothing. New PPE required before re-entering work area.'
          }
        })
        setTimeout(() => setIsRunning(false), 5000)
      }, 500)
    }
  }

  return (
    <group position={position}>
      <pointLight ref={showerLightRef} color="#88ccff" intensity={0} distance={2} castShadow={false} />

      {/* Vertical pipe */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.025, 0.025, 3.5, 12]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d4d4d4" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Horizontal arm */}
      <mesh position={[0.15, 3.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.02, 0.02, 0.32, 12]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d4d4d4" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Shower head — interactive */}
      <group onClick={handleClick}
        onPointerEnter={() => setHoverTarget('shower')}
        onPointerLeave={() => { if (hoverTarget === 'shower') setHoverTarget(null) }}>
        <mesh position={[0.3, 3.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.12, 0.12, 0.04, 20]} />
          <meshStandardMaterial
            ref={el => matRefs.current.push(el)}
            color={isRunning ? '#aaddff' : '#c0c0c0'}
            metalness={0.8} roughness={0.2}
            emissive={isRunning ? '#003355' : '#000000'}
            emissiveIntensity={isRunning ? 0.5 : 0}
          />
        </mesh>
      </group>

      {/* Pull handle */}
      <mesh position={[0.12, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.015, 0.015, 0.25, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#ffcc00" metalness={0.5} roughness={0.3} />
      </mesh>
      {[0, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0]}>
          <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.022, 8, 8]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#ffcc00" metalness={0.6} roughness={0.2} />
        </mesh>
      ))}

      {/* Water curtain when running */}
      {isRunning && Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const r = 0.08
        return (
          <mesh key={`drop-${i}`} position={[0.3 + Math.cos(angle) * r, 2.5, Math.sin(angle) * r]}>
            <cylinderGeometry args={[0.004, 0.002, 1.8, 4]} />
            <meshStandardMaterial color="#aaddff" transparent opacity={0.55} roughness={1} />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── Safety Corner Root ────────────────────────────────────────────────────────
export default function SafetyCorner() {
  return (
    <group>
      {/* Eyewash station — left wall, at eye height */}
      <EyewashStation position={[-5.72, 1.55, 0.5]} />

      {/* Emergency shower — corner near left wall */}
      <EmergencyShower position={[-5.5, 0, 1.2]} />
    </group>
  )
}
