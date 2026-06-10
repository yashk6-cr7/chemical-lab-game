import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

const LABEL_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`
const LABEL_FRAG = `
uniform sampler2D uTex;
uniform float uWear;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p); vec2 f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}
void main() {
  vec4 col = texture2D(uTex, vUv);
  float w = uWear * noise(vUv * 15.0 + 0.3);
  float smudge = smoothstep(0.4, 0.6, w);
  col.a *= (1.0 - smudge * 0.5);
  col.rgb = mix(col.rgb, vec3(0.85), smudge * 0.3);
  gl_FragColor = col;
}
`

// performance.md: label texture in useMemo with stable deps
function useLabelTexture(chemical) {
  const texture = useMemo(() => {
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

    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = 16
    return tex
  }, [chemical.name, chemical.formula, chemical.labelColor, chemical.hazardLevel])

  useEffect(() => {
    return () => { texture?.dispose() }
  }, [texture])

  return texture
}

export default function ChemicalBottle({ chemical, position, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef()                    // useRef, never useState for 3D refs (r3f.md)
  const labelMatRef = useRef()

  const selectedChemical = useLabStore(state => state.selectedChemical)
  const heldBottleId     = useLabStore(state => state.heldBottleId)
  const setHoverTarget   = useLabStore(state => state.setHoverTarget)
  const setHoverLight    = useLabStore(state => state.setHoverLight)  // shared light (performance.md)
  const pendingSetup     = useLabStore(state => state.pendingExperimentSetup)
  const useCount         = useLabStore(state => state.bottleUseCounts[chemical.id] || 0)

  const wearLevel = useMemo(() => Math.min(useCount / 20, 1.0), [useCount])

  const isSelected = selectedChemical?.id === chemical.id
  const isHeld     = heldBottleId === chemical.id
  const isPending  = pendingSetup?.chemical1Id === chemical.id || pendingSetup?.chemical2Id === chemical.id

  const labelTexture = useLabelTexture(chemical)

  // Wear shader material — update uWear uniform when wearLevel changes
  const labelMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: LABEL_VERT,
    fragmentShader: LABEL_FRAG,
    uniforms: { uTex: { value: null }, uWear: { value: 0 } },
    transparent: true,
    depthWrite: false,
  }), [])

  useEffect(() => {
    labelMat.uniforms.uTex.value = labelTexture
    return () => labelMat.dispose()
  }, [labelMat, labelTexture])

  useEffect(() => {
    labelMat.uniforms.uWear.value = wearLevel
  }, [labelMat, wearLevel])

  // Hover float animation — lerp in useFrame, no Three.js allocations inside loop (r3f.md)
  useFrame((_, delta) => {
    if (!groupRef.current) return
    const targetY = hovered ? 0.03 : 0
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 10 * delta
  })

  // r3f.md: always stopPropagation on all 3D pointer events
  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    setHovered(true)
    setHoverTarget('bottle')
    // performance.md: update shared hover light position instead of spawning a new PointLight
    setHoverLight({ active: true, position: [position[0], position[1] + 0.3, position[2] + 0.1], color: chemical.labelColor })
  }, [position, chemical.labelColor, setHoverTarget, setHoverLight])

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation()
    setHovered(false)
    setHoverTarget(null)
    setHoverLight({ active: false })
  }, [setHoverTarget, setHoverLight])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    onSelect && onSelect(chemical)
  }, [onSelect, chemical])

  return (
    <group
      position={position}
      visible={!isHeld}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        {/* Bottle Body
            threejs.md: transmission + thickness pair, envMapIntensity, transparent:false when transmission>0 */}
        <mesh castShadow receiveShadow position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.28, 16]} />
          <meshPhysicalMaterial
            color={chemical.bottleColor}
            envMapIntensity={1.0}
            roughness={0.05}
            metalness={0}
            transmission={0.7}
            thickness={0.5}
            ior={1.5}
            transparent={false}
          />
        </mesh>

        {/* Liquid/Solid contents */}
        <mesh position={[0, 0.095, 0]}>
          <cylinderGeometry args={[0.055, 0.062, 0.18, 16]} />
          <meshStandardMaterial
            color={chemical.color}
            transparent={chemical.state === 'liquid'}
            opacity={chemical.state === 'liquid' ? chemical.liquidOpacity : 1.0}
            roughness={chemical.state === 'solid' ? 1.0 : 0.2}
            depthWrite={chemical.state !== 'liquid'}
          />
        </mesh>

        {/* Bottle Cap */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
          <meshStandardMaterial
            color={chemical.labelColor}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* Label — wear shader */}
        <mesh position={[0, 0.12, 0.068]}>
          <planeGeometry args={[0.1, 0.12]} />
          <primitive object={labelMat} attach="material" />
        </mesh>

        {/* High-hazard warning diamond */}
        {chemical.hazardLevel >= 3 && (
          <mesh position={[0, 0.21, 0.066]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.03, 0.03]} />
            <meshStandardMaterial
              color={chemical.hazardLevel >= 4 ? '#ff0000' : '#ff9800'}
              roughness={0.8}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Selected glow — no extra PointLight; use emissive on a disc instead */}
        {isSelected && (
          <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial
              color={chemical.labelColor}
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Pending Experiment Glow */}
        {isPending && !isSelected && (
          <mesh position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.09, 16]} />
            <meshBasicMaterial
              color="#06b6d4" // cyan-500
              transparent
              opacity={0.6}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* HTML Tooltip — framer-motion is correct here: HTML element (animation.md) */}
        <Html
          position={[0, 0.35, 0]}
          center
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="w-64 p-3 rounded-lg shadow-2xl backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(26, 26, 26, 0.9)',
                  borderTop: `3px solid ${chemical.labelColor}`
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white font-bold text-lg leading-tight">{chemical.name}</h3>
                  <span className="text-gray-300 font-mono text-sm bg-black/30 px-1.5 py-0.5 rounded">
                    {chemical.formula}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2 text-xs text-gray-300">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: chemical.pH < 7 ? '#ef4444' : chemical.pH > 7 ? '#3b82f6' : '#22c55e' }}
                    />
                    pH {chemical.pH}
                  </div>
                  <span>•</span>
                  <span className="capitalize">{chemical.state}</span>
                </div>

                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < chemical.hazardLevel ? 'opacity-100' : 'opacity-20'}`}
                      style={{ backgroundColor: chemical.hazardLevel >= 4 ? '#ef4444' : chemical.hazardLevel >= 3 ? '#f97316' : '#22c55e' }}
                    />
                  ))}
                </div>

                <p className="text-gray-300 text-xs italic leading-snug mb-2">
                  {chemical.easyDescription}
                </p>

                {isPending && (
                  <div className="bg-cyan-950/50 border border-cyan-500/30 rounded p-2 mt-2 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">⭐</span>
                    <p className="text-cyan-200 text-[10px] font-medium leading-tight">
                      {pendingSetup.suggestion}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Html>
      </group>
    </group>
  )
}
