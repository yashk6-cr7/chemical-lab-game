import { useRef, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, a } from '@react-spring/three'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'
import { getHeatColor } from '../../systems/temperatureEngine'
import { useRefDisposal } from '../../utils/disposal'

// animation.md: useSpring for smooth dipping and reading
export default function Thermometer({ position = [1.5, 0.92, 0] }) {
  const thermometer = useLabStore(state => state.thermometer)
  const pickUpThermometer = useLabStore(state => state.pickUpThermometer)
  const putDownThermometer = useLabStore(state => state.putDownThermometer)
  const beakers = useLabStore(state => state.beakers)
  const setHoverTarget = useLabStore(state => state.setHoverTarget)
  const isHoldingBeaker = useLabStore(state => state.isHoldingBeaker)
  const updateThermometerReading = useLabStore(state => state.updateThermometerReading)

  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  const groupRef = useRef()

  // Target temperature for the liquid in the thermometer
  const targetReading = useMemo(() => {
    if (thermometer.isDipped && thermometer.dippedBeakerId) {
      const beaker = beakers.find(b => b.id === thermometer.dippedBeakerId)
      return beaker ? beaker.temperature : 22
    }
    return 22 // room temp
  }, [thermometer.isDipped, thermometer.dippedBeakerId, beakers])

  useFrame((_, delta) => {
    // Smooth reading interpolation
    if (Math.abs(thermometer.currentReading - targetReading) > 0.1) {
      const newReading = thermometer.currentReading + (targetReading - thermometer.currentReading) * delta * 5
      updateThermometerReading(newReading)
    }

    // Follow mouse when held (similar to ChemicalPickup)
    if (thermometer.isHeld && !thermometer.isDipped && groupRef.current) {
      // Very basic static holding position, actual mouse tracking would be complex without a global pointer tracking setup
      // Just keep it in front of the camera or off screen
    }
  })

  // animation.md: Spring for the red liquid bar inside
  const { barScaleY } = useSpring({
    barScaleY: Math.max(0.01, (thermometer.currentReading + 20) / 120), // -20 to 100 range roughly maps to 0 to 1 scale
    config: { mass: 1, tension: 120, friction: 14 }
  })

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (isHoldingBeaker) return
    if (thermometer.isHeld) {
      putDownThermometer()
    } else {
      pickUpThermometer()
    }
  }, [thermometer.isHeld, isHoldingBeaker, pickUpThermometer, putDownThermometer])

  const [hr, hg, hb] = getHeatColor(thermometer.currentReading)
  const redColor = new THREE.Color(Math.max(0.8, hr), hg * 0.2, hb * 0.2) // keep it reddish

  return (
    <group 
      ref={groupRef}
      position={thermometer.isHeld ? [0, 0, 100] : position} // Hide if held without mouse tracking for now
      onClick={handleClick}
      onPointerOver={() => setHoverTarget('thermometer')}
      onPointerOut={() => setHoverTarget(null)}
      rotation={thermometer.isHeld ? [0, 0, 0] : [Math.PI / 2, 0, Math.PI / 4]} // Lay flat on bench
    >
      {/* Outer Glass Tube */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.012, 0.012, 0.3, 16]} />
        <meshPhysicalMaterial 
          ref={el => matRefs.current.push(el)}
          color="#ffffff"
          transmission={0.95}
          roughness={0.05}
          thickness={0.01}
          transparent={false}
          ior={1.5}
        />
      </mesh>

      {/* Internal Red Liquid Bar (Animated) */}
      <a.group position={[0, -0.15, 0]} scale-y={barScaleY}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.003, 0.003, 0.3, 8]} />
          <meshBasicMaterial ref={el => matRefs.current.push(el)} color={redColor} />
        </mesh>
      </a.group>

      {/* Bulb at the bottom */}
      <mesh position={[0, -0.16, 0]}>
        <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.018, 16, 16]} />
        <meshPhysicalMaterial 
          ref={el => matRefs.current.push(el)}
          color={redColor}
          transmission={0.5}
          roughness={0.1}
          transparent
        />
      </mesh>

      {/* Markings */}
      {[...Array(10)].map((_, i) => (
        <mesh key={i} position={[0, -0.1 + i * 0.025, 0.012]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.01, 0.001, 0.002]} />
          <meshBasicMaterial ref={el => matRefs.current.push(el)} color="#000000" />
        </mesh>
      ))}
    </group>
  )
}
