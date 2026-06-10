import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib'
import useLabStore from '../../store/useLabStore'

// Initialize RectAreaLight uniforms once at module level (not inside component)
RectAreaLightUniformsLib.init()

// Pure function — no allocations on every call
const _color = new THREE.Color()
const stops = [
  { t: 0,    r: 1.000, g: 0.702, b: 0.278 }, // #FFB347 dawn
  { t: 0.25, r: 1.000, g: 0.957, b: 0.839 }, // #FFF4D6 morning
  { t: 0.5,  r: 1.000, g: 1.000, b: 1.000 }, // #FFFFFF noon
  { t: 0.75, r: 1.000, g: 0.973, b: 0.941 }, // #FFF8F0 afternoon
  { t: 1.0,  r: 1.000, g: 0.549, b: 0.259 }, // #FF8C42 dusk
]

function getLightColor(t) {
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      const f = (t - stops[i].t) / (stops[i + 1].t - stops[i].t)
      _color.setRGB(
        stops[i].r + (stops[i + 1].r - stops[i].r) * f,
        stops[i].g + (stops[i + 1].g - stops[i].g) * f,
        stops[i].b + (stops[i + 1].b - stops[i].b) * f,
      )
      return _color
    }
  }
  return _color.set('#FFFFFF')
}

// performance.md: Only 2 of 4 fluorescent panels cast shadows (1024x1024)
// The other 2 are shadow-free fill lights — halves shadow map GPU cost
function FluorescentPanel({ position, castsShadow = false }) {
  return (
    <group position={position}>
      {/* RectAreaLight — soft fluorescent quality. Does NOT support castShadow */}
      <rectAreaLight
        width={2}
        height={0.1}
        intensity={8}
        color="#ffffff"
        rotation={[Math.PI / 2, 0, 0]}
      />
      {/* Paired SpotLight for shadow casting — only on 2 of 4 panels */}
      <spotLight
        color="#fffef0"
        intensity={1.2}
        angle={0.6}
        penumbra={0.4}
        castShadow={castsShadow}
        shadow-mapSize-width={castsShadow ? 1024 : 512}
        shadow-mapSize-height={castsShadow ? 1024 : 512}
        shadow-bias={-0.001}
        shadow-normalBias={0.02}
        position={[0, 0.01, 0]}
        target-position={[0, -5, 0]}
      />
    </group>
  )
}

// Window directional light that reacts to time-of-day
function TimeOfDayLight() {
  const lightRef = useRef()

  useFrame((_, delta) => {
    if (!lightRef.current) return
    // Advance time — read/write via getState to avoid re-renders
    const store = useLabStore.getState()
    const next = (store.timeOfDay + delta / 1200) % 1  // 20 min cycle
    store.setTimeOfDay(next)

    const color = getLightColor(next)
    lightRef.current.color.copy(color)
    // dim at dawn/dusk, bright at noon
    lightRef.current.intensity = 0.3 + Math.sin(next * Math.PI) * 1.2
  })

  return (
    <directionalLight
      ref={lightRef}
      color="#fff4d0"
      intensity={1.5}
      position={[-2, 4, -5]}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.5}
      shadow-camera-far={20}
      shadow-camera-left={-8}
      shadow-camera-right={8}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
    />
  )
}

export default function Lighting() {
  return (
    <>
      {/* === AMBIENT === */}
      <ambientLight intensity={0.35} color="#fff5e0" />

      {/* === FLUORESCENT CEILING PANELS ===
          performance.md: 2 panels cast shadows (1024x1024), 2 are fill-only
          Total shadow budget: 1 directional (2048) + 2 spot (1024) + 0 point = optimal */}
      <FluorescentPanel position={[-3, 3.48, -3]} castsShadow={true} />
      <FluorescentPanel position={[3, 3.48, -3]}  castsShadow={true} />
      <FluorescentPanel position={[-3, 3.48, 1]}  castsShadow={false} />
      <FluorescentPanel position={[3, 3.48, 1]}   castsShadow={false} />

      {/* === WINDOW SUNLIGHT — time-of-day driven === */}
      <TimeOfDayLight />

      {/* Secondary fill directional — no shadows (performance.md: secondary = no shadow) */}
      <directionalLight
        color="#fff4d0"
        intensity={0.8}
        position={[2, 4, -5]}
        castShadow={false}
      />

      {/* === BENCH TASK LIGHT — above hotplate area ===
          performance.md: point lights NEVER cast shadows (cubemap = 6x cost) */}
      <pointLight
        color="#ffffff"
        intensity={1.8}
        position={[-1.5, 2.2, 0]}
        distance={4}
        decay={2}
        castShadow={false}
      />

      {/* === FUME HOOD INTERIOR LIGHT === */}
      <pointLight
        color="#ffffee"
        intensity={0.8}
        position={[-4.8, 2.0, -3.2]}
        distance={2}
        decay={2}
        castShadow={false}
      />
    </>
  )
}
