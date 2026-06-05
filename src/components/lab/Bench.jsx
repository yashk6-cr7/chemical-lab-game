import { useRef } from 'react'
import useLabStore from '../../store/useLabStore'
import { useRefDisposal } from '../../utils/disposal'
import HotPlate from '../equipment/HotPlate'

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

  const handleClick = (e) => {
    e.stopPropagation()
    if (isHoldingBeaker && heldBeakerId) {
      rinseBeaker(heldBeakerId)
    }
  }

  return (
    <group 
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
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

  const handleBenchClick = (e) => {
    e.stopPropagation()
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
      <group position={[0, 0, 0]}>
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
      </group>

      {/* ====================================================
          SECONDARY BENCH — left wall, along wall
          4w × 0.7d × 0.9h
      ==================================================== */}
      <group position={[-5.15, 0, -2]}>
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
      </group>
    </group>
  )
}
