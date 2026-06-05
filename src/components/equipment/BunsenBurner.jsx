/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRefDisposal } from '../../utils/disposal'

// particles.md: InstancedMesh pattern for stateless particles
// Pre-allocated dummy object to avoid per-frame GC (r3f.md)
const _dummy = new THREE.Object3D()

const BunsenBurnerEffect = ({ position, flameIntensity = 1.0 }) => {
  const meshRef = useRef()
  const cameraRef = useRef()

  const count = 30
  // Pre-calculate all particle data (particles.md)
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 0.02,
    z: (Math.random() - 0.5) * 0.02,
    y: Math.random() * 0.15,
    speed: 0.2 + Math.random() * 0.1,
    size: 0.02 + Math.random() * 0.015,
    lifetime: 0.2 + Math.random() * 0.2,
    age: Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
  })), [count])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    cameraRef.current = state.camera

    for (let i = 0; i < count; i++) {
      const p = particles[i]

      p.age += delta
      if (p.age >= p.lifetime) {
        p.age = 0
        p.x = (Math.random() - 0.5) * 0.02
        p.z = (Math.random() - 0.5) * 0.02
        p.y = 0
      }

      const progress = p.age / p.lifetime
      p.y += p.speed * delta * flameIntensity
      p.phase += delta * 15
      const flicker = 0.8 + Math.sin(p.phase) * 0.2

      _dummy.position.set(p.x, p.y, p.z)
      _dummy.scale.setScalar(p.size * flicker * (1 - progress * 0.2) * flameIntensity)
      if (cameraRef.current) _dummy.lookAt(cameraRef.current.position)
      _dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, _dummy.matrix)

      // Color transition from blue base to yellow tip
      const color = flameIntensity > 0.8 
        ? (progress < 0.3 ? '#2266ff' : progress < 0.7 ? '#44aaff' : '#ffaa00')
        : (progress < 0.5 ? '#ffff88' : '#ff6600') // Yellow/orange flame when airflow closed
        
      meshRef.current.setColorAt(i, new THREE.Color(color).multiplyScalar(1 - progress * 0.5))
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  // performance.md: disposal
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[1, 1]} />
        <meshBasicMaterial
          ref={el => matRefs.current.push(el)}
          color="#ffffff"
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      {/* Light source */}
      <pointLight 
        position={[0, 0.1, 0]} 
        color={flameIntensity > 0.8 ? "#44aaff" : "#ffaa00"} 
        intensity={flameIntensity * 1.5} 
        distance={1.5} 
        castShadow={false} // performance.md: no shadow
      />
    </group>
  )
}

export default function BunsenBurner({ position }) {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.06, 0.08, 0.02, 32]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#444" metalness={0.8} roughness={0.4} />
      </mesh>
      
      {/* Barrel */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.015, 0.015, 0.1, 16]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#ccc" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Airflow collar */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.018, 0.018, 0.02, 16]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#aaa" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Gas tube connection */}
      <mesh position={[0.03, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.01, 0.01, 0.04, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#a87a4b" metalness={0.9} roughness={0.2} />
      </mesh>
      
      {/* Rubber tubing */}
      <mesh position={[0.07, 0.01, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.012, 0.012, 0.08, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#222" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Flame effect */}
      <BunsenBurnerEffect position={[0, 0.12, 0]} flameIntensity={1.0} />
    </group>
  )
}
