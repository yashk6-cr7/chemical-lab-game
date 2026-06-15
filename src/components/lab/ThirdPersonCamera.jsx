import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

// Pre-allocated — no allocations inside useFrame
const _target   = new THREE.Vector3()
const _camPos   = new THREE.Vector3()
const _lookAt   = new THREE.Vector3()
const _offset   = new THREE.Vector3()

const CAM_DISTANCE  = 4.0    // how far behind character
const CAM_HEIGHT    = 2.5    // how far above character
const CAM_LERP      = 8      // follow speed (higher = snappier)
const LOOK_HEIGHT   = 1.3    // character head height to look at

export default function ThirdPersonCamera() {
  const { camera } = useThree()
  const { rapier, world } = useRapier()
  const cameraYaw = useRef(0)  // independent camera orbit yaw

  // Store the camera orbit angle separately from character yaw
  // so camera can orbit while character faces forward
  const orbitYaw = useRef(Math.PI) // start behind character

  useFrame((_, delta) => {
    const { characterPos, cameraYaw, cameraPitch } = useLabStore.getState()

    // Character base position
    _target.set(characterPos.x, 0, characterPos.z)

    // "Over the shoulder" offset so the character isn't perfectly centered (blocking clicks)
    const rightAngle = cameraYaw - Math.PI / 2
    const rightOffset = 0.5 // shift look target 0.5 units right of character
    
    _lookAt.set(
      _target.x + Math.sin(rightAngle) * rightOffset,
      LOOK_HEIGHT,
      _target.z + Math.cos(rightAngle) * rightOffset
    )

    // Camera orbits the _lookAt position
    const angle = cameraYaw + Math.PI  // behind = +180°
    
    // Apply pitch using spherical coordinates
    const r = Math.cos(cameraPitch) * CAM_DISTANCE
    const yOffset = Math.sin(cameraPitch) * CAM_DISTANCE

    _offset.set(
      Math.sin(angle) * r,
      CAM_HEIGHT - yOffset,
      Math.cos(angle) * r,
    )

    // Target camera position without collision
    _camPos.copy(_lookAt).add(_offset)

    // Raycast to prevent clipping through walls
    const rayDir = _camPos.clone().sub(_lookAt).normalize()
    const maxDist = _lookAt.distanceTo(_camPos)
    
    const ray = new rapier.Ray(_lookAt, rayDir)
    // Cast ray against anything, returning timeOfImpact
    const hit = world.castRay(ray, maxDist, true)

    if (hit && hit.collider) {
      // Shorten the camera distance, leave a tiny margin
      const safeDist = Math.max(0.2, hit.timeOfImpact - 0.2)
      _camPos.copy(_lookAt).add(rayDir.multiplyScalar(safeDist))
    }

    // Smooth follow
    camera.position.lerp(_camPos, Math.min(1, delta * CAM_LERP))

    // Look at shoulder target
    camera.lookAt(_lookAt)
  })

  return (
    <Html center zIndexRange={[100, 100]} style={{ pointerEvents: 'none' }}>
      <div style={{
        width: 4, height: 4, background: 'rgba(255,255,255,0.8)',
        borderRadius: '50%', boxShadow: '0 0 2px rgba(0,0,0,0.8)',
        transform: 'translate(-50%, -50%)'
      }} />
    </Html>
  )
}
