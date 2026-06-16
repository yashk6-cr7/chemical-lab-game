const playerParts = `
          {/* Head & Neck */}
          <group position={[0, 1.49, 0]}>
            {/* Neck */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.07, 0.12]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.13, 0]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Hair */}
            <mesh position={[0, 0.13, 0]}>
              <sphereGeometry args={[0.135, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            {/* Goggles */}
            {safetyGear.goggles && (
              <group position={[0, 0.15, 0.12]}>
                <mesh position={[-0.05, 0, 0]}>
                  <torusGeometry args={[0.045, 0.015, 8, 16]} />
                  <primitive object={goggleMat} attach="material" />
                </mesh>
                <mesh position={[0.05, 0, 0]}>
                  <torusGeometry args={[0.045, 0.015, 8, 16]} />
                  <primitive object={goggleMat} attach="material" />
                </mesh>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.06, 0.015, 0.015]} />
                  <primitive object={goggleMat} attach="material" />
                </mesh>
                <mesh position={[-0.05, 0, 0]}>
                  <circleGeometry args={[0.038, 16]} />
                  <primitive object={lensMat} attach="material" />
                </mesh>
                <mesh position={[0.05, 0, 0]}>
                  <circleGeometry args={[0.038, 16]} />
                  <primitive object={lensMat} attach="material" />
                </mesh>
              </group>
            )}
          </group>

          {/* Torso */}
          <group position={[0, 1.14, 0]}>
            <mesh>
              <boxGeometry args={[0.42, 0.52, 0.22]} />
              <primitive object={shirtMat} attach="material" />
            </mesh>
            {/* Lab Coat Overlay on Torso */}
            {safetyGear.coat && (
              <mesh position={[0, 0, 0.01]}>
                <boxGeometry args={[0.46, 0.54, 0.24]} />
                <primitive object={coatMat} attach="material" />
              </mesh>
            )}
          </group>

          {/* Hips */}
          <mesh position={[0, 0.84, 0]}>
            <boxGeometry args={[0.38, 0.18, 0.20]} />
            <primitive object={trousersMat} attach="material" />
          </mesh>

          {/* Left Arm (Pivot at shoulder y=1.37) */}
          <group ref={upperArmLRef} position={[-0.24, 1.37, 0]} rotation={[0, 0, 0.25]}>
            {/* Upper Arm */}
            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.30]} />
              <primitive object={safetyGear.coat ? coatMat : shirtMat} attach="material" />
            </mesh>
            {/* Lower Arm */}
            <mesh position={[0, -0.43, 0]} rotation={[0, 0, -0.10]}>
              <cylinderGeometry args={[0.06, 0.05, 0.28]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.59, 0]} rotation={[0, 0, -0.10]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <primitive object={safetyGear.gloves ? gloveMat : skinMat} attach="material" />
            </mesh>
          </group>

          {/* Right Arm */}
          <group ref={upperArmRRef} position={[0.24, 1.37, 0]} rotation={[0, 0, -0.25]}>
            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.30]} />
              <primitive object={safetyGear.coat ? coatMat : shirtMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.43, 0]} rotation={[0, 0, 0.10]}>
              <cylinderGeometry args={[0.06, 0.05, 0.28]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.59, 0]} rotation={[0, 0, 0.10]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <primitive object={safetyGear.gloves ? gloveMat : skinMat} attach="material" />
            </mesh>
          </group>

          {/* Left Leg (Pivot at hip y=0.75) */}
          <group ref={upperLegLRef} position={[-0.12, 0.75, 0]}>
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.09, 0.08, 0.38]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.57, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.36]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.73, 0.04]}>
              <boxGeometry args={[0.12, 0.08, 0.22]} />
              <primitive object={shoeMat} attach="material" />
            </mesh>
          </group>

          {/* Right Leg */}
          <group ref={upperLegRRef} position={[0.12, 0.75, 0]}>
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.09, 0.08, 0.38]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.57, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.36]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.73, 0.04]}>
              <boxGeometry args={[0.12, 0.08, 0.22]} />
              <primitive object={shoeMat} attach="material" />
            </mesh>
          </group>
`
