/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

const CO2_COUNT = 80

export default function CO2SprayEffect({ nozzleRef }) {
  const isSpraying = useLabStore(state => state.isSpraying)
  const characterYaw = useLabStore(state => state.characterYaw)
  const meshRef = useRef()
  const particles = useRef([])

  // Initialize particles
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    particles.current = Array.from({ length: CO2_COUNT }, () => ({
      active: false,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0,
      scale: 0,
    }))
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const camera = state.camera

    // Emit new particles when spraying
    if (isSpraying) {
      const nozzlePos = nozzleRef?.current
        ? new THREE.Vector3().setFromMatrixPosition(nozzleRef.current.matrixWorld)
        : camera.position.clone().add(
            new THREE.Vector3(0.25, -0.15, -0.5).applyQuaternion(camera.quaternion)
          )

      // Spray direction = character forward
      const yaw = characterYaw + Math.PI
      const sprayDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)

      // Emit ~8 particles per frame
      let emitted = 0
      for (let i = 0; i < CO2_COUNT && emitted < 8; i++) {
        const p = particles.current[i]
        if (!p.active) {
          p.active = true
          p.position.copy(nozzlePos)
          p.life = 0
          p.maxLife = 0.4 + Math.random() * 0.5

          // Cone spread (0.25 radian cone)
          const spread = 0.25
          const angle = Math.random() * spread - spread / 2
          const angle2 = Math.random() * spread - spread / 2
          const vel = sprayDir.clone()
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
            .applyAxisAngle(new THREE.Vector3(1, 0, 0), angle2)
            .multiplyScalar(2.5 + Math.random() * 1.5)

          p.velocity.copy(vel)
          p.scale = 0.01
          emitted++
        }
      }
    }

    // Update all particles
    let anyActive = false
    for (let i = 0; i < CO2_COUNT; i++) {
      const p = particles.current[i]
      if (!p.active) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      p.life += delta
      if (p.life >= p.maxLife) {
        p.active = false
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      anyActive = true
      const t = p.life / p.maxLife

      // Move particle
      p.position.addScaledVector(p.velocity, delta)
      // Slight drag
      p.velocity.multiplyScalar(0.96)

        // Scale: grows as it expands, fades at end
      const growPhase = Math.min(1, t * 3)
      const fadePhase = Math.max(0, 1 - (t - 0.7) * 3)
      p.scale = growPhase * fadePhase * (0.04 + t * 0.08)

      dummy.position.copy(p.position)
      dummy.scale.setScalar(Math.max(0.001, p.scale))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.visible = anyActive || isSpraying
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, CO2_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent
        opacity={0.8}
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </instancedMesh>
  )
}
