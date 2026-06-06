import { memo, useState, useCallback, Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { MOLECULE_DATA } from '../../data/moleculeData'

// ── Atom sphere ─────────────────────────────────────────────────────────
const Atom = memo(function Atom({ element, position, radius, color }) {
  const meshRef = useRef()
  useEffect(() => {
    return () => {
      meshRef.current?.geometry?.dispose()
      meshRef.current?.material?.dispose()
    }
  }, [])

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius * 0.4, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  )
})

// ── Bond cylinder ────────────────────────────────────────────────────────
const Bond = memo(function Bond({ fromPos, toPos }) {
  const meshRef = useRef()

  const [position, quaternion, length] = useMemo(() => {
    const start = new THREE.Vector3(...fromPos)
    const end = new THREE.Vector3(...toPos)
    const dir = new THREE.Vector3().subVectors(end, start)
    const len = dir.length()
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    )
    return [[mid.x, mid.y, mid.z], [q.x, q.y, q.z, q.w], len]
  }, [fromPos, toPos])

  useEffect(() => {
    return () => {
      meshRef.current?.geometry?.dispose()
      meshRef.current?.material?.dispose()
    }
  }, [])

  return (
    <mesh ref={meshRef} position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.07, 0.07, length, 8]} />
      <meshStandardMaterial color="#aaaaaa" roughness={0.6} metalness={0.2} />
    </mesh>
  )
})

// ── Auto-rotating molecule scene ─────────────────────────────────────────
const MoleculeScene = memo(function MoleculeScene({ moleculeKey }) {
  const groupRef = useRef()
  const data = MOLECULE_DATA[moleculeKey]

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  if (!data) return null

  return (
    <group ref={groupRef}>
      {data.atoms.map((atom, i) => (
        <Atom
          key={i}
          element={atom.element}
          position={atom.position}
          radius={atom.radius}
          color={atom.color}
        />
      ))}
      {data.bonds.map((bond, i) => (
        <Bond
          key={i}
          fromPos={data.atoms[bond.from].position}
          toPos={data.atoms[bond.to].position}
        />
      ))}
    </group>
  )
})

// ── Main exported component ──────────────────────────────────────────────
export const MoleculeViewer = memo(function MoleculeViewer({
  reactant1, reactant2, product1, product2
}) {
  const keysWithData = useMemo(() => 
    [
      reactant1 && MOLECULE_DATA[reactant1] ? reactant1 : null,
      reactant2 && MOLECULE_DATA[reactant2] ? reactant2 : null,
      product1  && MOLECULE_DATA[product1]  ? product1  : null,
      product2  && MOLECULE_DATA[product2]  ? product2  : null,
    ].filter(Boolean),
    [reactant1, reactant2, product1, product2]
  )

  const [activeKey, setActiveKey] = useState(keysWithData[0] || null)

  useEffect(() => {
    if (keysWithData.length > 0 && !keysWithData.includes(activeKey)) {
      setActiveKey(keysWithData[0])
    }
  }, [keysWithData])

  const labels = useMemo(() => ({
    [reactant1]: 'Reactant 1',
    [reactant2]: 'Reactant 2',
    [product1]:  'Product 1',
    [product2]:  'Product 2',
  }), [reactant1, reactant2, product1, product2])

  if (!activeKey || keysWithData.length === 0) return null

  const data = MOLECULE_DATA[activeKey]

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Molecules</div>

      {/* Mini Canvas — isolated, low-power */}
      <div className="w-full h-40 rounded-xl overflow-hidden bg-black/40 border border-white/5">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 40 }}
          gl={{ powerPreference: 'low-power', antialias: false, alpha: false }}
          frameloop="always"
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, -3, -5]} intensity={0.3} color="#88aaff" />

          <Suspense fallback={null}>
            <MoleculeScene moleculeKey={activeKey} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI * 3 / 4}
          />
        </Canvas>
      </div>

      {/* Name and formula */}
      <div className="text-center">
        <span className="text-xs text-white/60 font-medium">{data.name}</span>
        <span className="text-[10px] text-white/30 ml-1.5">{data.formula}</span>
      </div>

      {/* Toggle buttons */}
      {keysWithData.length > 1 && (
        <div className="flex gap-1 flex-wrap justify-center">
          {keysWithData.map(k => (
            <button
              key={k}
              onClick={() => setActiveKey(k)}
              className={`px-2 py-0.5 rounded-lg text-[10px] transition-colors ${
                activeKey === k
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {labels[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
