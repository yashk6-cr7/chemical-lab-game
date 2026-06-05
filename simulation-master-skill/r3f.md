# React Three Fiber (R3F) Best Practices

## 1. `useFrame` Rules
- Never instantiate new objects (e.g., `new THREE.Vector3()`) inside `useFrame`.
- Pre-allocate reusable objects outside the loop using `useRef(new THREE.Vector3())`.
- Always verify ref existence: `if (!ref.current) return`.
- Use the `delta` argument for frame-rate independent movement: `position.x += speed * delta`.

## 2. Component Structure
- Separate logic from rendering. Compute physics/math early in the frame, apply transforms late in the frame.
- Use `memo` for complex static 3D components.

## 3. Materials and Geometries
- Do not declare `<meshStandardMaterial>` inline if it is reused across thousands of objects. Define it once and reference it, or use `InstancedMesh`.
- Be wary of `transparent={true}`. Only use it when necessary, and use `depthWrite={false}` to prevent z-fighting between overlapping transparent objects.

## 4. Disposing Resources
- R3F automatically disposes of standard JSX geometries and materials when they unmount.
- If you manually load textures or create raw Three.js objects outside of JSX, you MUST call `.dispose()` on unmount in a `useEffect` cleanup.

## 5. Event Handling
- Use `e.stopPropagation()` on 3D click/hover events to prevent raycaster penetration unless intended.
- Keep `onPointerMove` light. Do not run heavy calculations during hover events.
