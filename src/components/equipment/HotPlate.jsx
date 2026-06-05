/* eslint-disable */
import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { shallow } from 'zustand/shallow'
import useLabStore from '../../store/useLabStore'
import { getHeatColor, heatBeaker, coolBeaker, checkThermalShock } from '../../systems/temperatureEngine'

// shaders.md: cosine palette shader for heating coil emissive glow
const heatingCoilVert = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const heatingCoilFrag = /* glsl */`
  varying vec2 vUv;
  uniform float uTemperature; // 0.0 to 1.0 normalized
  uniform float uTime;

  // Cosine palette: black → dark red → orange → bright (shaders.md pattern)
  vec3 heatPalette(float t) {
    vec3 a = vec3(0.5, 0.0, 0.0);
    vec3 b = vec3(0.5, 0.0, 0.0);
    vec3 c = vec3(1.0, 1.0, 0.5);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return clamp(a + b * cos(6.28318 * (c * t + d)), 0.0, 1.0);
  }

  void main() {
    float glow = uTemperature * (0.85 + sin(uTime * 4.0 + vUv.x * 12.0) * 0.08);
    vec3 col   = heatPalette(glow);
    // Coil spiral pattern using UV
    float spiral = step(0.4, fract(vUv.x * 8.0 + vUv.y * 2.0));
    gl_FragColor = vec4(col * (0.6 + spiral * 0.4), 1.0);
  }
`

// Pre-allocated temp ref for useFrame (r3f.md: no allocations in loop)
const _dummy = new THREE.Object3D()

export default function HotPlate({ position = [-1.5, 0.955, 0] }) {
  const hotplate         = useLabStore(state => state.hotplate, shallow)
  const setHotplateTemp  = useLabStore(state => state.setHotplateTemp)
  const placeOnHotplate  = useLabStore(state => state.placeBeakerOnHotplate)
  const updateHotSurface = useLabStore(state => state.updateHotplateSurfaceTemp)
  const updateBeakerTemp = useLabStore(state => state.updateBeakerTemp)
  const beakers          = useLabStore(state => state.beakers, shallow)
  const setHoverTarget   = useLabStore(state => state.setHoverTarget)
  const queueConsequence = useLabStore(state => state.queueConsequence)
  const setShowHotplateUI= useLabStore(state => state.setShowHotplateUI)

  const coilMatRef     = useRef()
  const indicatorRef   = useRef()
  const dialRef        = useRef()
  const timeRef        = useRef(0)
  const tempUpdateTimer= useRef(0)

  // Heating coil shader material
  const coilMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTemperature: { value: 0 },
      uTime:        { value: 0 },
    },
    vertexShader:   heatingCoilVert,
    fragmentShader: heatingCoilFrag,
  }), [])

  useEffect(() => () => coilMaterial.dispose(), [coilMaterial])

  useFrame((_, delta) => {
    timeRef.current += delta
    tempUpdateTimer.current += delta

    if (!coilMaterial) return

    // Normalize temperature 0-1 for shader (shaders.md: update uniforms in useFrame)
    const normalized = Math.max(0, Math.min(1, hotplate.targetTemp / 500))
    coilMaterial.uniforms.uTemperature.value = normalized
    coilMaterial.uniforms.uTime.value = timeRef.current

    // Dial rotation: 0°C = 0 rad, 500°C = 2π rad
    if (dialRef.current) {
      dialRef.current.rotation.y = normalized * Math.PI * 2
    }

    // Power indicator color: green=off, red=hot (r3f.md: ref not state)
    if (indicatorRef.current) {
      const [r, g, b] = getHeatColor(hotplate.targetTemp)
      indicatorRef.current.material.color.setRGB(r || 0.1, g || 0.8, b || 0.1)
      indicatorRef.current.material.emissive.setRGB(r * 0.8, g * 0.5, b * 0.1)
      indicatorRef.current.material.emissiveIntensity = hotplate.isOn ? 1.5 : 0.3
    }

    // Throttle beaker temperature update to every 0.1s (not every frame)
    if (tempUpdateTimer.current < 0.1) return
    tempUpdateTimer.current = 0

    if (hotplate.beakerOnTop && hotplate.isOn) {
      const beaker = beakers.find(b => b.id === hotplate.beakerOnTop)
      if (beaker) {
        const newTemp = heatBeaker(
          beaker.temperature,
          hotplate.targetTemp,
          beaker.totalVolume,
          0.1
        )
        // Thermal shock check: cold beaker on max-hot plate
        if (checkThermalShock(beaker.temperature, hotplate.targetTemp) && hotplate.targetTemp > 200) {
          queueConsequence({ type: 'thermal_shock', beakerId: beaker.id })
        }
        updateBeakerTemp(beaker.id, newTemp)
      }
    }

    // Cool beakers NOT on hotplate toward room temp
    beakers.forEach(b => {
      if (b.id !== hotplate.beakerOnTop && b.temperature > 22.5) {
        const cooled = coolBeaker(b.temperature, 0.1)
        updateBeakerTemp(b.id, cooled)
      }
    })
  })

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    // Open temperature control UI (2D overlay)
    useLabStore.getState().setShowHotplateUI?.(true)
  }, [])

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    setHoverTarget('hotplate')
  }, [setHoverTarget])

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation()
    setHoverTarget(null)
  }, [setHoverTarget])

  const [hr, hg, hb] = getHeatColor(hotplate.targetTemp)

  return (
    <group position={position} onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>

      {/* Silver body */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.05, 32]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Black ceramic heating surface — cosine palette shader coil */}
      <mesh position={[0, 0.033, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.015, 32]} />
        <meshStandardMaterial
          color="#111111"
          roughness={0.7}
          emissive={new THREE.Color(hr, hg, hb)}
          emissiveIntensity={hotplate.isOn ? hotplate.targetTemp / 100 : 0}
        />
      </mesh>

      {/* Heating coil spiral — uses full cosine palette shader */}
      <mesh position={[0, 0.042, 0]} material={coilMaterial}>
        <cylinderGeometry args={[0.22, 0.22, 0.004, 32]} />
      </mesh>

      {/* Beaker zone highlight ring (shows when beaker is on top) */}
      {hotplate.beakerOnTop && (
        <mesh position={[0, 0.041, 0]}>
          <ringGeometry args={[0.07, 0.12, 32]} />
          <meshBasicMaterial color={new THREE.Color(hr, hg, hb)} transparent opacity={0.6} depthWrite={false} />
        </mesh>
      )}

      {/* Control panel — front face */}
      <group position={[0.14, 0.015, -0.2]} rotation={[0, Math.PI / 4, 0]}>
        {/* Digital display */}
        <mesh>
          <boxGeometry args={[0.1, 0.03, 0.06]} />
          <meshStandardMaterial
            color="#1a1a2e"
            emissive="#00ff88"
            emissiveIntensity={hotplate.isOn ? 0.5 : 0.1}
          />
        </mesh>

        {/* Temperature dial knob */}
        <mesh ref={dialRef} position={[-0.06, 0, 0.035]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Power indicator light */}
      <mesh ref={indicatorRef} position={[0.2, 0.035, 0.1]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial
          color={hotplate.isOn ? '#ff2200' : '#00cc44'}
          emissive={hotplate.isOn ? '#ff2200' : '#00cc44'}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Subtle heat glow from surface when very hot */}
      {hotplate.isOn && hotplate.targetTemp > 150 && (
        <pointLight
          position={[0, 0.1, 0]}
          color={new THREE.Color(hr * 2, hg, hb)}
          intensity={hotplate.targetTemp / 300}
          distance={0.6}
          castShadow={false}
        />
      )}
    </group>
  )
}
