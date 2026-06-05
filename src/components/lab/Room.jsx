import { useRef } from 'react'
import { useRefDisposal } from '../../utils/disposal'

// Room dimensions
const W = 12   // width  x
const D = 9    // depth  z
const H = 3.5  // height y

// Recessed light housing boxes in ceiling
function CeilingLightHousing({ position, geoRefs, matRefs }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry ref={el => geoRefs.current.push(el)} args={[2.1, 0.06, 0.35]} />
      <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#e8e8e8" roughness={0.5} metalness={0.1} />
    </mesh>
  )
}

// Window pane with frame + glass + outside view
function Window({ position, geoRefs, matRefs }) {
  return (
    <group position={position}>
      {/* Window frame — painted white box, deep sill */}
      <mesh castShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[1.28, 1.48, 0.22]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f0f0ee" roughness={0.8} />
      </mesh>
      {/* Deep sill surface */}
      <mesh position={[0, -0.74, 0.1]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[1.28, 0.06, 0.22]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#e8e6e2" roughness={0.6} />
      </mesh>
      {/* Glass — 2x2 panes (4 total) */}
      {/* Top-left */}
      <mesh position={[-0.31, 0.21, 0.06]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.55, 0.62, 0.05]} />
        <meshPhysicalMaterial
          ref={el => matRefs.current.push(el)}
          color="#c8e8ff"
          transmission={0.95}
          roughness={0}
          thickness={0.05}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Top-right */}
      <mesh position={[0.31, 0.21, 0.06]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.55, 0.62, 0.05]} />
        <meshPhysicalMaterial
          ref={el => matRefs.current.push(el)}
          color="#c8e8ff"
          transmission={0.95}
          roughness={0}
          thickness={0.05}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Bottom-left */}
      <mesh position={[-0.31, -0.31, 0.06]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.55, 0.62, 0.05]} />
        <meshPhysicalMaterial
          ref={el => matRefs.current.push(el)}
          color="#c8e8ff"
          transmission={0.95}
          roughness={0}
          thickness={0.05}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Bottom-right */}
      <mesh position={[0.31, -0.31, 0.06]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.55, 0.62, 0.05]} />
        <meshPhysicalMaterial
          ref={el => matRefs.current.push(el)}
          color="#c8e8ff"
          transmission={0.95}
          roughness={0}
          thickness={0.05}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Divider bars — horizontal & vertical */}
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[1.2, 0.04, 0.04]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#e8e6e2" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.04, 1.38, 0.04]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#e8e6e2" roughness={0.7} />
      </mesh>
    </group>
  )
}

// Door on right wall
function Door({ geoRefs, matRefs }) {
  return (
    <group position={[W / 2 - 0.05, 1.05, 1.5]}>
      {/* Dark wood frame */}
      <mesh>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.12, 2.22, 1.02]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#5c3d1e" roughness={0.8} />
      </mesh>
      {/* Door panel — rotated to face into room */}
      <mesh position={[-0.04, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.9, 2.1, 0.06]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#8b6340" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Brass handle — cylinder body */}
      <mesh position={[-0.1, 0, -0.32]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry ref={el => geoRefs.current.push(el)} args={[0.015, 0.015, 0.12, 12]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8a832" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Brass handle — knob sphere */}
      <mesh position={[-0.1, 0, -0.4]}>
        <sphereGeometry ref={el => geoRefs.current.push(el)} args={[0.025, 12, 12]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8a832" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

// Hazard notice poster on wall
function HazardNotice({ position, rotation, geoRefs, matRefs }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry ref={el => geoRefs.current.push(el)} args={[0.45, 0.6]} />
      <meshStandardMaterial
        ref={el => matRefs.current.push(el)}
        color="#f8f8f0"
        emissive="#ffe080"
        emissiveIntensity={0.08}
        roughness={0.9}
      />
    </mesh>
  )
}

export default function Room() {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)
  return (
    <group>
      {/* ===================== FLOOR ===================== */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[W, D, 24, 18]} />
        <meshStandardMaterial
          ref={el => matRefs.current.push(el)}
          color="#e8e6e0"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Floor tile grout grid overlay */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        receiveShadow={false}
      >
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[W, D]} />
        <meshBasicMaterial
          ref={el => matRefs.current.push(el)}
          color="#cccac4"
          wireframe={false}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Anti-fatigue mat in front of main bench */}
      <mesh position={[0, 0.011, 1.1]} receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[5, 0.02, 0.6]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#222222" roughness={1.0} />
      </mesh>

      {/* ===================== CEILING ===================== */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, H, 0]}
        receiveShadow
      >
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[W, D]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Recessed ceiling light housings */}
      <CeilingLightHousing position={[-3, H - 0.031, -3]} geoRefs={geoRefs} matRefs={matRefs} />
      <CeilingLightHousing position={[3, H - 0.031, -3]} geoRefs={geoRefs} matRefs={matRefs} />
      <CeilingLightHousing position={[-3, H - 0.031, 1]} geoRefs={geoRefs} matRefs={matRefs} />
      <CeilingLightHousing position={[3, H - 0.031, 1]} geoRefs={geoRefs} matRefs={matRefs} />

      {/* ===================== BACK WALL (z = -D/2) ===================== */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow castShadow>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[W, H]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f0eeeb" roughness={0.8} />
      </mesh>

      {/* Chair rail stripe on back wall */}
      <mesh position={[0, 1.0, -D / 2 + 0.01]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[W, 0.04, 0.01]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d8d5d0" roughness={0.9} />
      </mesh>

      {/* Baseboard on back wall */}
      <mesh position={[0, 0.04, -D / 2 + 0.01]} receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[W, 0.08, 0.02]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8c5c0" roughness={0.7} />
      </mesh>

      {/* Windows on back wall */}
      <Window position={[-2.2, 2.0, -D / 2 + 0.12]} geoRefs={geoRefs} matRefs={matRefs} />
      <Window position={[2.2, 2.0, -D / 2 + 0.12]} geoRefs={geoRefs} matRefs={matRefs} />

      {/* Sky plane visible through windows */}
      <mesh position={[0, 2.8, -D / 2 - 0.5]} rotation={[0, 0, 0]}>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[10, 5]} />
        <meshBasicMaterial ref={el => matRefs.current.push(el)} color="#b0d4f0" />
      </mesh>
      {/* Green ground plane outside */}
      <mesh position={[0, 0.5, -D / 2 - 0.5]} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[10, 3]} />
        <meshBasicMaterial ref={el => matRefs.current.push(el)} color="#7ab648" />
      </mesh>

      {/* Hazard notices near windows */}
      <HazardNotice position={[0.5, 1.6, -D / 2 + 0.02]} rotation={[0, 0, 0]} geoRefs={geoRefs} matRefs={matRefs} />

      {/* ===================== LEFT WALL (x = -W/2) ===================== */}
      <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[D, H]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f0eeeb" roughness={0.8} />
      </mesh>

      {/* Chair rail left */}
      <mesh position={[-W / 2 + 0.01, 1.0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[D, 0.04, 0.01]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d8d5d0" roughness={0.9} />
      </mesh>

      {/* Baseboard left */}
      <mesh position={[-W / 2 + 0.01, 0.04, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[D, 0.08, 0.02]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8c5c0" roughness={0.7} />
      </mesh>

      {/* ===================== RIGHT WALL (x = W/2) ===================== */}
      <mesh position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow castShadow>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[D, H]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f0eeeb" roughness={0.8} />
      </mesh>

      {/* Baseboard right */}
      <mesh position={[W / 2 - 0.01, 0.04, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[D, 0.08, 0.02]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8c5c0" roughness={0.7} />
      </mesh>

      {/* Door gap in right wall */}
      <Door geoRefs={geoRefs} matRefs={matRefs} />

      {/* Hazard notice near sink */}
      <HazardNotice position={[W / 2 - 0.02, 1.6, -0.5]} rotation={[0, -Math.PI / 2, 0]} geoRefs={geoRefs} matRefs={matRefs} />

      {/* ===================== FRONT WALL (z = D/2) ===================== */}
      <mesh position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]} receiveShadow castShadow>
        <planeGeometry ref={el => geoRefs.current.push(el)} args={[W, H]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f0eeeb" roughness={0.8} />
      </mesh>

      {/* Baseboard front */}
      <mesh position={[0, 0.04, D / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[W, 0.08, 0.02]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8c5c0" roughness={0.7} />
      </mesh>

      {/* ===================== WALL SHELVING (back wall) ===================== */}
      {/* Upper shelf y=2.2 */}
      <mesh position={[0.5, 2.2, -D / 2 + 0.15]} castShadow receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[5, 0.04, 0.25]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8a97a" roughness={0.7} />
      </mesh>
      {/* Upper shelf metal brackets */}
      {[-2, -0.5, 1, 2.5].map((x, i) => (
        <group key={i} position={[x, 2.12, -D / 2 + 0.15]}>
          <mesh>
            <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.03, 0.16, 0.22]} />
            <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#aaaaaa" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Lower shelf y=1.7 */}
      <mesh position={[0.5, 1.7, -D / 2 + 0.15]} castShadow receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[5, 0.04, 0.25]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8a97a" roughness={0.7} />
      </mesh>
      {/* Lower shelf brackets */}
      {[-2, -0.5, 1, 2.5].map((x, i) => (
        <group key={i} position={[x, 1.62, -D / 2 + 0.15]}>
          <mesh>
            <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.03, 0.16, 0.22]} />
            <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#aaaaaa" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
