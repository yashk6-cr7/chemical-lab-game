# Physics Simulation

## Rapier Implementation
- Use `@react-three/rapier` for rigid body dynamics.
- **Colliders:** Do not use `hull` or `trimesh` colliders for dynamic (moving) objects unless absolutely necessary. Use primitive colliders (`cuboid`, `ball`, `cylinder`) to save CPU cycles.
- **Instanced Physics:** Use `<InstancedRigidBodies>` for high-count object physics (like hundreds of falling pills or debris).

## Physics Loops
- Never apply forces inside standard React `useEffect` or timeouts.
- Use the `useFixedFrame` or Rapier-specific physics hooks for applying impulses/forces to ensure determinism.
- For kinematically driven objects (e.g., player hands), use `RigidBody` type `kinematicPosition` and update via `ref.current.setNextKinematicTranslation()`.

## Collision Events
- Handle collisions carefully using the `onIntersectionEnter` or `onCollisionEnter` events. Ensure these functions do not trigger massive React state updates. Debounce them if necessary.
