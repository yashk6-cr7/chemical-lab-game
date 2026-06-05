/* eslint-disable */
import { useRef, useCallback, useEffect } from 'react'
import { useSpring, a } from '@react-spring/three'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'
import { coolInFridge, coolInFreezer } from '../../systems/temperatureEngine'
import { useFrame } from '@react-three/fiber'
import { useRefDisposal } from '../../utils/disposal'

// volumetrics.md: Simple mist effect for freezer when opened
function ColdMist({ position, isOpen }) {
  const meshRef = useRef()
  const timeRef = useRef(0)

  const material = useRef(new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#e0f0ff') },
      uOpacity: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;

      // Simple noise
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        float n = noise(vUv * 5.0 + vec2(0.0, -uTime * 0.5));
        float mask = 1.0 - smoothstep(0.0, 0.5, length(vUv - 0.5));
        gl_FragColor = vec4(uColor, n * mask * uOpacity * 0.5);
      }
    `,
    transparent: true,
    depthWrite: false, // performance.md
    blending: THREE.AdditiveBlending
  }))

  useEffect(() => () => material.current.dispose(), [])

  useFrame((_, delta) => {
    timeRef.current += delta
    if (material.current) {
      material.current.uniforms.uTime.value = timeRef.current
      // Smoothly fade in/out mist based on door
      const targetOpacity = isOpen ? 1.0 : 0.0
      const currentOpacity = material.current.uniforms.uOpacity.value
      material.current.uniforms.uOpacity.value += (targetOpacity - currentOpacity) * delta * 2
    }
  })

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material.current} attach="material" />
    </mesh>
  )
}

export default function Fridge({ position, rotation = [0, 0, 0] }) {
  const fridge = useLabStore(state => state.fridge)
  const freezer = useLabStore(state => state.freezer)
  const openFridge = useLabStore(state => state.openFridge)
  const closeFridge = useLabStore(state => state.closeFridge)
  const openFreezer = useLabStore(state => state.openFreezer)
  const closeFreezer = useLabStore(state => state.closeFreezer)
  const setHoverTarget = useLabStore(state => state.setHoverTarget)
  const beakers = useLabStore(state => state.beakers)
  const updateBeakerTemp = useLabStore(state => state.updateBeakerTemp)

  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  // animation.md: useSpring for door animations
  const { fridgeAngle } = useSpring({
    fridgeAngle: fridge.isOpen ? Math.PI / 2 : 0,
    config: { mass: 2, tension: 150, friction: 25 }
  })

  const { freezerAngle } = useSpring({
    freezerAngle: freezer.isOpen ? Math.PI / 2 : 0,
    config: { mass: 2, tension: 150, friction: 25 }
  })

  const handleFridgeClick = useCallback((e) => {
    e.stopPropagation()
    fridge.isOpen ? closeFridge() : openFridge()
  }, [fridge.isOpen, openFridge, closeFridge])

  const handleFreezerClick = useCallback((e) => {
    e.stopPropagation()
    freezer.isOpen ? closeFreezer() : openFreezer()
  }, [freezer.isOpen, openFreezer, closeFreezer])

  // Cooling logic in useFrame
  useFrame((_, delta) => {
    fridge.beakersInside.forEach(id => {
      const beaker = beakers.find(b => b.id === id)
      if (beaker) {
        const newTemp = coolInFridge(beaker.temperature, delta)
        updateBeakerTemp(id, newTemp)
      }
    })

    freezer.beakersInside.forEach(id => {
      const beaker = beakers.find(b => b.id === id)
      if (beaker) {
        const newTemp = coolInFreezer(beaker.temperature, delta)
        updateBeakerTemp(id, newTemp)
      }
    })
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Fridge Body (White Enamel) */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.8, 1.8, 0.6]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f0f0f0" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Splitter between fridge and freezer */}
      <mesh position={[0, 1.2, 0.28]} castShadow receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.78, 0.04, 0.04]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#e0e0e0" roughness={0.4} />
      </mesh>

      {/* Animated Freezer Door (Top) */}
      <group position={[-0.4, 1.5, 0.3]} rotation-y={freezerAngle}>
        <mesh 
          position={[0.4, 0, 0]} 
          onClick={handleFreezerClick}
          onPointerOver={() => setHoverTarget('freezer')}
          onPointerOut={() => setHoverTarget(null)}
          castShadow
        >
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.8, 0.58, 0.06]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f5f5f5" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.7, 0, 0.04]} castShadow>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.02, 0.3, 0.04]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#cccccc" metalness={0.8} />
        </mesh>
      </group>

      {/* Animated Fridge Door (Bottom) */}
      <group position={[-0.4, 0.6, 0.3]} rotation-y={fridgeAngle}>
        <mesh 
          position={[0.4, 0, 0]} 
          onClick={handleFridgeClick}
          onPointerOver={() => setHoverTarget('fridge')}
          onPointerOut={() => setHoverTarget(null)}
          castShadow
        >
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.8, 1.18, 0.06]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f5f5f5" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.7, 0.3, 0.04]} castShadow>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.02, 0.4, 0.04]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#cccccc" metalness={0.8} />
        </mesh>
      </group>

      {/* Mist effect from freezer when open */}
      <ColdMist position={[0, 1.4, 0.35]} isOpen={freezer.isOpen} />
    </group>
  )
}
