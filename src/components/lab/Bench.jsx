import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'
import { useRefDisposal } from '../../utils/disposal'
import HotPlate from '../equipment/HotPlate'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import PourStream from '../effects/PourStream'

// ─── Bench Damage: canvas texture compositing ───────────────────────────────
function useDamageTexture() {
  const canvasRef = useRef(null)
  const textureRef = useRef(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    canvasRef.current = canvas
    textureRef.current = new THREE.CanvasTexture(canvas)
    return () => { textureRef.current?.dispose() }
  }, [])

  const paintStain = useCallback(({ x, z, radius, color, opacity }) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    // world: bench x ∈ [-3,3], z ∈ [-0.5,0.5] → UV [0,1]
    const u = (x + 3) / 6
    const v = (z + 0.5) / 1.0
    const px = u * 512, py = v * 512
    const r = (radius / 6) * 512
    const hex = Math.round(opacity * 255).toString(16).padStart(2, '0')
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r)
    grad.addColorStop(0, color + hex)
    grad.addColorStop(1, color + '00')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
    if (textureRef.current) textureRef.current.needsUpdate = true
  }, [])

  const paintScorch = useCallback(({ x, z, radius }) => {
    paintStain({ x, z, radius, color: '#1a1000', opacity: 0.85 })
  }, [paintStain])

  return { textureRef, paintStain, paintScorch }
}

// Cracks rendered as thin cylinder InstancedMesh
function BenchCracks({ cracks }) {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!meshRef.current || !cracks.length) return
    cracks.forEach((c, i) => {
      const dx = c.x2 - c.x1, dz = c.z2 - c.z1
      const len = Math.sqrt(dx * dx + dz * dz)
      const mx = (c.x1 + c.x2) / 2
      const mz = (c.z1 + c.z2) / 2
      dummy.position.set(mx, 0.931, mz)
      dummy.rotation.set(-Math.PI / 2, 0, Math.atan2(dx, dz))
      dummy.scale.set(1, len / 0.003, 1)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    // Hide unused slots
    for (let i = cracks.length; i < 5; i++) {
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    return () => {
      meshRef.current?.geometry?.dispose()
      meshRef.current?.material?.dispose()
    }
  }, [cracks, dummy])

  if (!cracks.length) return null
  return (
    <instancedMesh ref={meshRef} args={[null, null, 5]}>
      <cylinderGeometry args={[0.003, 0.003, 1, 4]} />
      <meshBasicMaterial color="#111111" />
    </instancedMesh>
  )
}

// Damage overlay plane sitting just above bench top
function BenchDamageLayer({ textureRef }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    opacity: 1,
  }), [])

  useEffect(() => {
    if (textureRef.current) mat.map = textureRef.current
    return () => mat.dispose()
  }, [mat, textureRef])

  return (
    <mesh position={[0, 0.932, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[6, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// Cabinet door handle (tiny silver bar)
function CabinetHandle({ position }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.06, 0.012, 0.012]} />
      <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

// Panel line on cabinet face (groove/shadow suggestion)
function PanelLine({ position, width, height }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, 0.002]} />
      <meshStandardMaterial color="#e0e0e0" roughness={0.9} />
    </mesh>
  )
}

// Sink assembly — stainless basin + chrome tap
function Sink({ position }) {
  const setHoverTarget = useLabStore(state => state.setHoverTarget)
  const isHoldingBeaker = useLabStore(state => state.isHoldingBeaker)
  const rinseBeaker = useLabStore(state => state.rinseBeaker)
  const pourIntoBeaker = useLabStore(state => state.pourIntoBeaker)
  const setIsPouring = useLabStore(state => state.setIsPouring)
  const heldBeakerId = useLabStore(state => state.heldBeakerId)

  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHoverTarget('sink')
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHoverTarget(null)
  }

  const handleBasinClick = (e) => {
    e.stopPropagation()
    if (!useLabStore.getState().nearBench) return
    if (isHoldingBeaker && heldBeakerId) {
      rinseBeaker(heldBeakerId)
    }
  }

  const [tapRunning, setTapRunning] = useState(false)

  const handleTapClick = (e) => {
    e.stopPropagation()
    if (!useLabStore.getState().nearBench) return
    if (isHoldingBeaker && heldBeakerId && !tapRunning) {
      setTapRunning(true)
      setTimeout(() => {
        pourIntoBeaker(heldBeakerId, { id: 'water', name: 'Water', color: '#e0f7fa' }, 20, '#e0f7fa')
        setTapRunning(false)
      }, 1000)
    }
  }

  return (
    <group 
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Basin group — click to empty */}
      <group onClick={handleBasinClick}>
        {/* Basin cutout illusion — inset dark plane */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.55, 0.04, 0.4]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#b0b0b0" metalness={0.8} />
        </mesh>
        {/* Basin inner bottom */}
        <mesh position={[0, -0.07, 0]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.48, 0.01, 0.35]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#999999" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Basin walls — 4 sides */}
        <mesh position={[0, -0.035, 0.175]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.48, 0.07, 0.01]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#aaaaaa" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.035, -0.175]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.48, 0.07, 0.01]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#aaaaaa" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0.24, -0.035, 0]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.01, 0.07, 0.35]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#aaaaaa" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[-0.24, -0.035, 0]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.01, 0.07, 0.35]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#aaaaaa" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Drain */}
        <mesh position={[0, -0.072, 0]}>
          <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.03, 0.03, 0.01, 16]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#666666" metalness={1.0} roughness={0.1} />
        </mesh>
      </group>

      {/* Tap group — click to add water */}
      <group onClick={handleTapClick}>
        {/* Chrome tap — vertical body */}
        <mesh position={[0, 0.18, -0.12]}>
          <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.018, 0.022, 0.22, 12]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#e0e0e0" metalness={1.0} roughness={0.1} />
        </mesh>
        {/* Tap spout — curved horizontal */}
        <mesh position={[0, 0.28, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.012, 0.016, 0.2, 12]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#e0e0e0" metalness={1.0} roughness={0.1} />
        </mesh>
        {/* Tap handles — left and right knobs */}
        <mesh position={[-0.07, 0.19, -0.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.01, 0.01, 0.06, 8]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#dddddd" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.07, 0.19, -0.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.01, 0.01, 0.06, 8]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#dddddd" metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Water Stream Visual */}
        <group position={[0, 0.28, 0.08]}>
          <PourStream active={tapRunning} color="#e0f7fa" startPos={{x:0, y:0, z:0}} endY={-0.35} />
        </group>
      </group>
    </group>
  )
}

export default function Bench() {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)
  const isHoldingBeaker = useLabStore(state => state.isHoldingBeaker)
  const putDownBeaker = useLabStore(state => state.putDownBeaker)
  const heldBeakerId = useLabStore(state => state.heldBeakerId)
  const benchDamage = useLabStore(state => state.benchDamage)

  const { textureRef, paintStain, paintScorch } = useDamageTexture()

  // Paint new stains/scorches when store changes
  const prevStainCount = useRef(0)
  const prevScorchCount = useRef(0)
  useEffect(() => {
    const newStains = benchDamage.stains.slice(prevStainCount.current)
    newStains.forEach(paintStain)
    prevStainCount.current = benchDamage.stains.length

    const newScorches = benchDamage.scorchMarks.slice(prevScorchCount.current)
    newScorches.forEach(paintScorch)
    prevScorchCount.current = benchDamage.scorchMarks.length
  }, [benchDamage.stains, benchDamage.scorchMarks, paintStain, paintScorch])

  const handleBenchClick = (e) => {
    e.stopPropagation()
    if (!useLabStore.getState().nearBench) return
    if (isHoldingBeaker && heldBeakerId) {
      // Clamp Z so it doesn't hang off the edge
      const z = Math.max(-0.35, Math.min(0.35, e.point.z))
      putDownBeaker(heldBeakerId, [e.point.x, 0.92, z])
    }
  }

  return (
    <group>
      {/* ====================================================
          MAIN LAB BENCH — center of room
          6w × 1d × 0.9h, centred at z=0
      ==================================================== */}
      <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
        {/* Main bench top surface */}
        <CuboidCollider args={[3.0, 0.05, 0.5]} position={[0, 0.93, 0]} />
        {/* Bench body */}
        <CuboidCollider args={[3.0, 0.45, 0.5]} position={[0, 0.45, 0]} />
        {/* Bench top surface */}
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow onClick={handleBenchClick}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[6, 0.06, 1]} />
          <meshStandardMaterial
            ref={el => matRefs.current.push(el)}
            color="#2a2a2a"
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
        {/* Stainless edge trim — front */}
        <mesh position={[0, 0.898, 0.5]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[6.04, 0.05, 0.02]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c0c0c0" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Stainless edge trim — back */}
        <mesh position={[0, 0.898, -0.5]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[6.04, 0.05, 0.02]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c0c0c0" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Cabinet base body — white melamine */}
        <mesh position={[0, 0.44, 0]} receiveShadow castShadow>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[6, 0.88, 1]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f5f5f5" roughness={0.6} />
        </mesh>

        {/* Cabinet panel lines — vertical dividers */}
        {[-2, -0.67, 0.67, 2].map((x, i) => (
          <PanelLine key={i} position={[x, 0.44, 0.501]} width={0.015} height={0.85} />
        ))}
        {/* Horizontal mid-line */}
        <PanelLine position={[0, 0.44, 0.501]} width={6} height={0.012} />

        {/* Cabinet handles — 5 pairs */}
        {[-2.5, -1.33, 0, 1.33, 2.5].map((x, i) => (
          <CabinetHandle key={i} position={[x, 0.55, 0.515]} />
        ))}
        {[-2.5, -1.33, 0, 1.33, 2.5].map((x, i) => (
          <CabinetHandle key={i} position={[x, 0.32, 0.515]} />
        ))}

        {/* Bench leg supports — 4 corners, structural grey */}
        {[-2.9, 2.9].map((x) =>
          [-0.45, 0.45].map((z, j) => (
            <mesh key={`${x}-${j}`} position={[x, 0.15, z]}>
              <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.06, 0.3, 0.06]} />
              <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#dddddd" roughness={0.5} metalness={0.2} />
            </mesh>
          ))
        )}

        {/* SINK — right end of main bench */}
        <Sink position={[2.6, 0.92, 0]} />

        {/* HOTPLATE — left area of main bench */}
        <HotPlate position={[-1.5, 0.955, 0]} />

        {/* Damage layers — canvas stains + crack instances */}
        <BenchDamageLayer textureRef={textureRef} />
        <BenchCracks cracks={benchDamage.cracks} />
      </RigidBody>

      {/* ====================================================
          SECONDARY BENCH — left wall, along wall
          4w × 0.7d × 0.9h
      ==================================================== */}
      <RigidBody type="fixed" colliders={false} position={[-5.15, 0, -2]}>
        <CuboidCollider args={[2, 0.05, 0.35]} position={[0, 0.93, 0]} />
        <CuboidCollider args={[2, 0.45, 0.35]} position={[0, 0.45, 0]} />
        {/* Secondary bench top */}
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[4, 0.06, 0.7]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#2a2a2a" roughness={0.4} metalness={0.05} />
        </mesh>
        {/* Edge trim front */}
        <mesh position={[0, 0.898, 0.35]}>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[4.04, 0.05, 0.02]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c0c0c0" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Cabinet base — white melamine */}
        <mesh position={[0, 0.44, 0]} receiveShadow castShadow>
          <boxGeometry ref={el => geoRefs.current.push(el)} args={[4, 0.88, 0.7]} />
          <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f5f5f5" roughness={0.6} />
        </mesh>
        {/* Panel lines */}
        {[-1.33, 0, 1.33].map((x, i) => (
          <PanelLine key={i} position={[x, 0.44, 0.351]} width={0.015} height={0.85} />
        ))}
        {/* Handles */}
        {[-2, -0.67, 0.67, 2].map((x, i) => (
          <CabinetHandle key={i} position={[x, 0.55, 0.365]} />
        ))}
      </RigidBody>
    </group>
  )
}
