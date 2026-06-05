import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib'

// Initialize RectAreaLight uniforms once at module level (not inside component)
RectAreaLightUniformsLib.init()

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

      {/* === WINDOW SUNLIGHT (primary directional — max 2048x2048 per performance.md) ===
          shadow.normalBias prevents shadow acne on flat surfaces */}
      <directionalLight
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
