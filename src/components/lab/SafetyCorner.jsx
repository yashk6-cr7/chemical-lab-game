// Safety Corner — left wall, near front
// Contains: fire extinguisher, eyewash station, emergency shower

import { useRef } from 'react'
import { useRefDisposal } from '../../utils/disposal'

function FireExtinguisher({ position }) {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)
  
  return (
    <group position={position}>
      {/* Wall bracket */}
      <mesh position={[0.06, 0, 0]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.08, 0.12, 0.14]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#888888" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Red cylinder body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.1, 0.1, 0.6, 20]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#cc1111" metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#cc1111" metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Valve / handle top — dark cylinder */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.035, 0.05, 0.1, 12]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#222222" roughness={0.6} />
      </mesh>
      {/* Handle bar */}
      <mesh position={[0, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.012, 0.012, 0.18, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#111111" roughness={0.5} />
      </mesh>
      {/* Nozzle hose */}
      <mesh position={[0.06, 0.3, 0.06]} rotation={[0.4, 0, 0.3]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.015, 0.015, 0.2, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#333333" roughness={0.8} />
      </mesh>
      {/* White label rectangle */}
      <mesh position={[0, 0.02, 0.101]}>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[0.14, 0.22]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f8f8f0" roughness={0.9} />
      </mesh>
    </group>
  )
}

function EyewashStation({ position }) {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  return (
    <group position={position}>
      {/* Main box body — yellow-green */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.35, 0.25, 0.18]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#8bc34a" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Two bowl shapes at front */}
      <mesh position={[-0.07, -0.06, 0.1]}>
        <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.055, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#cccccc" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.07, -0.06, 0.1]}>
        <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.055, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#cccccc" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Silver connecting pipe */}
      <mesh position={[0, -0.06, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.012, 0.012, 0.18, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#bbbbbb" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Emergency label — slightly emissive */}
      <mesh position={[0, 0.06, 0.092]}>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[0.28, 0.1]} />
        <meshStandardMaterial
          ref={el => matRefs.current.push(el)}
          color="#ffffff"
          emissive="#ccff00"
          emissiveIntensity={0.12}
          roughness={0.9}
        />
      </mesh>
    </group>
  )
}

function EmergencyShower({ position }) {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  return (
    <group position={position}>
      {/* Vertical chrome pipe floor to ceiling */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.025, 0.025, 3.5, 12]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d4d4d4" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Horizontal arm at top */}
      <mesh position={[0.15, 3.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.02, 0.02, 0.32, 12]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d4d4d4" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Shower head disk */}
      <mesh position={[0.3, 3.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.12, 0.12, 0.04, 20]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Pull handle at shoulder height (y≈1.5) */}
      <mesh position={[0.12, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.015, 0.015, 0.25, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d4d4d4" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Handle grip knobs */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.022, 8, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c0c0c0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0.25, 1.5, 0]}>
        <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.022, 8, 8]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c0c0c0" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  )
}

export default function SafetyCorner() {
  return (
    <group>
      {/* Fire extinguisher — left wall, near front, mounted at chest height */}
      <FireExtinguisher position={[-5.8, 1.2, 2.0]} />

      {/* Eyewash station — left wall, mounted at eye height */}
      <EyewashStation position={[-5.72, 1.55, 0.5]} />

      {/* Emergency shower — corner near left wall */}
      <EmergencyShower position={[-5.5, 0, 1.2]} />
    </group>
  )
}
