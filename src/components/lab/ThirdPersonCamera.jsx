import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
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
  const cameraYaw = useRef(0)  // independent camera orbit yaw

  // Store the camera orbit angle separately from character yaw
  // so camera can orbit while character faces forward
  const orbitYaw = useRef(Math.PI) // start behind character

  useFrame((_, delta) => {
    const { characterPos, characterYaw } = useLabStore.getState()

    // Character world position
    _target.set(characterPos.x, 0, characterPos.z)

    // Camera orbits at `orbitYaw` angle around character
    // (by default matches character facing direction from behind)
    const angle = characterYaw + Math.PI  // behind = +180°
    _offset.set(
      Math.sin(angle) * CAM_DISTANCE,
      CAM_HEIGHT,
      Math.cos(angle) * CAM_DISTANCE,
    )

    // Target camera position
    _camPos.copy(_target).add(_offset)

    // Smooth follow
    camera.position.lerp(_camPos, Math.min(1, delta * CAM_LERP))

    // Look at character's head
    _lookAt.set(characterPos.x, LOOK_HEIGHT, characterPos.z)
    camera.lookAt(_lookAt)

    // Ensure no roll ever (lookAt can introduce it)
    camera.rotation.z = 0
  })

  return null
}
