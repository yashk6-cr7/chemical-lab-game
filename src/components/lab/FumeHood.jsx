import { useRef } from 'react'
import { useRefDisposal } from '../../utils/disposal'

// Fume hood — back left corner, sitting on secondary bench
// Position: top of secondary bench at y=0.9, bench at x=-5.15, z=-2
// So fume hood base sits at y=0.9 from bench surface

export default function FumeHood() {
  const geoRefs = useRef([])
  const matRefs = useRef([])
  useRefDisposal(geoRefs, matRefs)

  // World position: on secondary bench, pushed toward back wall
  const bx = -5.15
  const bz = -2.8
  const by = 0.9 // top of secondary bench

  return (
    <group position={[bx, by, bz]}>
      {/* ── Frame back panel ── */}
      <mesh position={[0, 0.9, -0.48]} castShadow receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[2, 1.82, 0.04]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d0d0d0" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* ── Frame left side panel ── */}
      <mesh position={[-0.98, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.04, 1.82, 1]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d0d0d0" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* ── Frame right side panel ── */}
      <mesh position={[0.98, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.04, 1.82, 1]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d0d0d0" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* ── Frame top ── */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[2.08, 0.06, 1.04]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#c8c8c8" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* ── Exhaust duct box at top going into ceiling ── */}
      <mesh position={[0, 2.05, -0.2]} castShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.8, 0.5, 0.4]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#b8b8b8" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* ── Interior back wall (pale yellow) ── */}
      <mesh position={[0, 0.9, -0.44]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[1.9, 1.74, 0.01]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#fffde0" roughness={0.9} />
      </mesh>

      {/* ── Interior work surface (white) ── */}
      <mesh position={[0, 0.03, -0.1]} receiveShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[1.9, 0.04, 0.86]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#f8f8f8" roughness={0.6} />
      </mesh>

      {/* ── Interior left wall ── */}
      <mesh position={[-0.94, 0.9, 0]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.01, 1.74, 0.96]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#eeeecc" roughness={0.9} />
      </mesh>

      {/* ── Interior right wall ── */}
      <mesh position={[0.94, 0.9, 0]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[0.01, 1.74, 0.96]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#eeeecc" roughness={0.9} />
      </mesh>

      {/* ── Sash (front sliding transparent panel) ── */}
      <mesh position={[0, 0.9, 0.46]} castShadow>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[1.96, 1.5, 0.04]} />
        <meshPhysicalMaterial
          ref={el => matRefs.current.push(el)}
          color="#e8f4ff"
          transmission={0.7}
          roughness={0}
          transparent
          opacity={0.35}
          side={2}
        />
      </mesh>

      {/* ── Black sash handle bar ── */}
      <mesh position={[0, 0.38, 0.49]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[1.9, 0.05, 0.04]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#222222" roughness={0.6} />
      </mesh>

      {/* ── Sash top frame bar ── */}
      <mesh position={[0, 1.64, 0.47]}>
        <boxGeometry ref={el => geoRefs.current.push(el)} args={[2.0, 0.06, 0.05]} />
        <meshStandardMaterial ref={el => matRefs.current.push(el)} color="#d0d0d0" roughness={0.5} />
      </mesh>
    </group>
  )
}
