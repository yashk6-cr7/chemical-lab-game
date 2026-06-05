# Prompt Guide for Simulations

Use these prompt structures when initializing new simulation tasks to ensure the AI follows the master skill architecture.

## 1. Chemistry Simulations
> "Generate a new chemical reaction for [Chemical A] and [Chemical B]. Follow the Engine Pattern: Define the logical outcome in `reactionEngine.js`, map the visual effect in `EffectsManager.jsx`, and ensure the interaction follows the R3F Best Practices (no `useFrame` allocations). Ensure 60fps performance using `InstancedMesh` if particles are required."

## 2. Physics Simulations
> "Implement a physics interaction for [Object]. Use `@react-three/rapier`. Do not use trimesh colliders. Ensure the visual mesh is separated from the physical collider. Follow the Rapier guidelines in the master skill."

## 3. Biology / Fluid Simulations
> "Create a visual representation of [Fluid/Cellular process]. Use custom GLSL shaders. Avoid `if/else` inside the fragment shader. Utilize `useFrame` to update uniform time without triggering React re-renders."

## 4. Educational UI
> "Build an interactive UI overlay for [Tool]. Use Framer Motion for layout transitions and Tailwind for styling. Render this outside the `<Canvas>`. It must read its state from the Zustand store."

## 5. Optimization Pass
> "Review the current scene. Apply the Performance checklist from the master skill: Compress textures, merge static geometries, implement LODs, and ensure draw calls remain under 100."
