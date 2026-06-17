/* eslint-disable */
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { Sparkles } from '@react-three/drei'

export default function SteamEffect({ position, intensity = 5, temperature = 100 }) {
  const count = Math.floor(20 + (intensity / 10) * 40)
  const isAcidFumes = temperature >= 200

  return (
    <group position={position}>
      <Sparkles
        count={count}
        scale={[0.2, 0.4, 0.2]}
        size={isAcidFumes ? 12 : 8}
        speed={isAcidFumes ? 0.6 : 0.4}
        opacity={isAcidFumes ? 0.4 : 0.25}
        color={isAcidFumes ? '#f0f8ff' : '#ffffff'}
        position={[0, 0.15, 0]}
      />
    </group>
  )
}
