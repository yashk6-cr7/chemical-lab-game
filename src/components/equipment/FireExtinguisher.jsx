/* eslint-disable */
import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'
import CO2SprayEffect from '../effects/CO2SprayEffect'

// Wall-mount position
const EXTINGUISHER_POS = [-5.2, 1.2, -1.5]
const HELD_OFFSET = new THREE.Vector3(-0.35, -0.2, -0.55)

export default function FireExtinguisher() {
  const isHoldingExtinguisher = useLabStore(state => state.isHoldingExtinguisher)
  const pickUpExtinguisher = useLabStore(state => state.pickUpExtinguisher)
  const putDownExtinguisher = useLabStore(state => state.putDownExtinguisher)
  const isSpraying = useLabStore(state => state.isSpraying)
  const sprayExtinguisher = useLabStore(state => state.sprayExtinguisher)
  const stopSpray = useLabStore(state => state.stopSpray)
  const extinguisherCharge = useLabStore(state => state.extinguisherCharge)
  const updateExtinguisherCharge = useLabStore(state => state.updateExtinguisherCharge)
  const isFireActive = useLabStore(state => state.isFireActive)
  const extinguishFire = useLabStore(state => state.extinguishFire)
  const addConsequence = useLabStore(state => state.addConsequence)
  const hoverTarget = useLabStore(state => state.hoverTarget)
  const setHoverTarget = useLabStore(state => state.setHoverTarget)
  const characterPos = useLabStore(state => state.characterPos)
  const characterYaw = useLabStore(state => state.characterYaw)

  const groupRef = useRef()
  const nozzleRef = useRef()
  const needleRef = useRef()

  const [pinPulled, setPinPulled] = useState(false)

  // Use refs for math to avoid GC
  const _camQuat = useRef(new THREE.Quaternion()).current
  const _localQuat = useRef(new THREE.Quaternion()).current
  const _euler = useRef(new THREE.Euler()).current
  const _worldPos = useRef(new THREE.Vector3()).current

  // Handle E key interactions
  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (isHoldingExtinguisher) {
      // Calculate hand position relative to character
      const yaw = characterYaw + Math.PI
      _camQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
      
      // Pitch slightly upward for aiming
      _euler.set(0.2, 0, 0)
      _localQuat.setFromEuler(_euler)

      _worldPos.set(characterPos.x, characterPos.y, characterPos.z)
      // Offset: right side, waist height, forward
      _worldPos.add(new THREE.Vector3(0.4, 0.7, -0.4).applyQuaternion(_camQuat))

      groupRef.current.position.lerp(_worldPos, 0.25)
      groupRef.current.quaternion.slerp(_camQuat.clone().multiply(_localQuat), 0.25)

      // Deplete charge while spraying
      if (isSpraying && extinguisherCharge > 0) {
        updateExtinguisherCharge(8 * delta) // 12.5 seconds to empty

        // Check if suppressing fire
        if (isFireActive) {
          extinguishFire()
          addConsequence({
            id: Date.now(),
            type: 'fire_extinguished',
            severity: 1,
            message: {
              easy: 'Fire extinguished! CO₂ smothers flames by removing oxygen.',
              moderate: 'Class B fire suppressed. CO₂ displaces O₂ below 15% combustion threshold.',
              complex: 'CO₂ inerting — O₂ concentration reduced below lower flammable limit. Exothermic reaction terminated.'
            }
          })
        }
      }

      // Rotate pressure gauge needle based on charge
      if (needleRef.current) {
        const targetAngle = ((extinguisherCharge / 100) - 0.5) * Math.PI * 0.8
        needleRef.current.rotation.z += (targetAngle - needleRef.current.rotation.z) * 0.1
      }
    } else {
      // On wall
      groupRef.current.position.lerp(new THREE.Vector3(...EXTINGUISHER_POS), 0.15)
      groupRef.current.quaternion.slerp(new THREE.Quaternion(), 0.15)
    }
  })

  // Hover detection
  const handlePointerEnter = () => {
    if (!isHoldingExtinguisher) setHoverTarget('extinguisher')
  }
  const handlePointerLeave = () => {
    if (hoverTarget === 'extinguisher') setHoverTarget(null)
  }

  // Pickup / Put down on click
  const handleClick = () => {
    if (isHoldingExtinguisher) {
      stopSpray()
      putDownExtinguisher()
    } else {
      // If empty, automatically refill it when picked up again
      if (extinguisherCharge <= 0) {
        updateExtinguisherCharge(-100)
      }
      setPinPulled(true)
      pickUpExtinguisher()
    }
  }

  // Spray toggle on right click
  const handleContextMenu = (e) => {
    e.nativeEvent.preventDefault()
    if (!isHoldingExtinguisher) return
    if (isSpraying) stopSpray()
    else if (pinPulled && extinguisherCharge > 0) sprayExtinguisher()
  }

  const isEmpty = extinguisherCharge <= 0
  const bodyColor = isEmpty ? '#555555' : '#cc1111'

  return (
    <group ref={groupRef} position={EXTINGUISHER_POS}>
      <group
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {/* === Body === */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.095, 0.52, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.45} roughness={0.2} />
        </mesh>

        {/* Label band */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.097, 0.097, 0.14, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0} roughness={0.8} />
        </mesh>

        {/* Top cap / valve */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.04, 0.075, 0.08, 12]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.2} />
        </mesh>

        {/* Pressure gauge face */}
        <mesh position={[0.055, 0.28, 0.04]} rotation={[0, -0.6, 0]}>
          <circleGeometry args={[0.022, 12]} />
          <meshStandardMaterial color="#eeeeee" emissive="#ffffff" emissiveIntensity={0.15} />
        </mesh>

        {/* Gauge needle */}
        <mesh ref={needleRef} position={[0.055, 0.28, 0.06]} rotation={[0, -0.6, isEmpty ? -1.2 : 0.4]}>
          <boxGeometry args={[0.003, 0.018, 0.002]} />
          <meshStandardMaterial color={isEmpty ? '#f44336' : '#22c55e'} />
        </mesh>

        {/* Handle grip left */}
        <mesh position={[-0.025, 0.33, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.008, 0.008, 0.09, 8]} />
          <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Handle grip right */}
        <mesh position={[0.025, 0.33, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.008, 0.008, 0.09, 8]} />
          <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Hose */}
        <mesh position={[0.06, 0.22, 0]} rotation={[0, 0, -0.8]}>
          <cylinderGeometry args={[0.01, 0.01, 0.18, 8]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>

        {/* Nozzle */}
        <mesh ref={nozzleRef} position={[0.13, 0.14, 0]} rotation={[0, 0, -0.9]}>
          <coneGeometry args={[0.018, 0.06, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
        </mesh>

        {/* Pin (shown when not pulled) */}
        {!pinPulled && (
          <mesh position={[0, 0.35, 0.045]}>
            <torusGeometry args={[0.012, 0.003, 6, 12]} />
            <meshStandardMaterial color="#dddd00" metalness={0.8} roughness={0.2} />
          </mesh>
        )}

        {/* Bottom base */}
        <mesh position={[0, -0.27, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
          <meshStandardMaterial color="#880000" metalness={0.3} roughness={0.4} />
        </mesh>

        {/* Hover interaction hint — only when not held */}
        {!isHoldingExtinguisher && hoverTarget === 'extinguisher' && (
          <mesh position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.001]} />
            {/* Hint rendered in 2D via store hoverTarget */}
          </mesh>
        )}
      </group>

      {/* CO2 spray particles — only when held and spraying */}
      {isHoldingExtinguisher && isSpraying && extinguisherCharge > 0 && (
        <CO2SprayEffect nozzleRef={nozzleRef} />
      )}

      {/* Charge indicator glow when active */}
      {isHoldingExtinguisher && (
        <pointLight
          position={[0, 0.3, 0]}
          color={isSpraying ? '#aaddff' : '#ffffff'}
          intensity={isSpraying ? 0.5 : 0.1}
          distance={1.5}
          castShadow={false}
        />
      )}
    </group>
  )
}
