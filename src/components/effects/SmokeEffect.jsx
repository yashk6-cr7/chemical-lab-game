/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { Sparkles, Cloud } from '@react-three/drei'

export default function SmokeEffect({ position, intensity = 5, color = '#777777' }) {
  const count = Math.floor(30 + (intensity / 10) * 50)
  
  return (
    <group position={position}>
      {/* Heavy smoke particles using Sparkles scaled up */}
      <Sparkles
        count={count}
        scale={[0.3, 0.6, 0.3]}
        size={8}
        speed={0.4}
        opacity={0.3}
        color={color}
        position={[0, 0.2, 0]}
      />
      
      {/* Tiny embers/ash rising */}
      {intensity > 5 && (
        <Sparkles
          count={Math.floor(count / 2)}
          scale={[0.2, 0.8, 0.2]}
          size={2}
          speed={0.8}
          opacity={0.8}
          color="#ffaa00"
          position={[0, 0.3, 0]}
        />
      )}
    </group>
  )
}
