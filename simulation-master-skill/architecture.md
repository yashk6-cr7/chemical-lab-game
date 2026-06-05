# Simulation Architecture

## 1. Scene Architecture
- **Root Layer:** `<App>` manages global state, routing, and UI overlays.
- **Canvas Layer:** `<Canvas>` contains only 3D objects, lighting, and effects. Set `style={{ position: 'absolute', inset: 0 }}`.
- **System Layer:** Simulation physics, thermodynamic engines, and consequence handlers run independently of the React render cycle, usually via Zustand stores or singleton managers.
- **Component Layer:** Break scenes into semantic groups (`<Environment>`, `<Equipment>`, `<Chemicals>`).

## 2. State Management
- **Zustand is mandatory** for cross-component and 3D/2D bridge state.
- **Avoid React Context** for rapidly changing 3D variables to prevent widespread re-renders.
- **Refs for high-frequency data:** Use `useRef` for positions, velocities, and rotations. Never put these in React state unless strictly required by a UI overlay.

## 3. Physics & Interaction
- Use `@react-three/rapier` for rigid body physics.
- Separate visual meshes from physics colliders (use simplified proxy colliders for complex meshes).
- Handle interactions via `onPointerOver/Out/Down` mapped to Zustand, and use `useFrame` for continuous manipulation (like dragging).

## 4. Asset Pipeline
- Preload critical assets using `useGLTF.preload()` and `useTexture.preload()`.
- Compress all textures (WebP, KTX2) and geometries (Draco).
- Use `useMemo` extensively for geometries and materials shared across multiple instances.

## 5. UI Layer
- Build 2D UI outside the `<Canvas>` using standard HTML/Tailwind/Framer Motion.
- Communicate with the 3D scene via Zustand.
- Use `@react-three/drei`'s `<Html>` only for world-space annotations (e.g., floating labels).

## 6. Optimization Layer
- Group static objects into `InstancedMesh` or `Merged` geometry.
- Disable shadows on small/insignificant objects.
- Cap particle limits dynamically based on device FPS.
