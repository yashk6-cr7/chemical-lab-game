# Performance & Web Quality

## Target: 60 FPS
- Always monitor draw calls. Keep them under 100 for optimal mobile performance.
- Use `<Stats>` from `@react-three/drei` during development to monitor frame rate and memory.

## Core Web Vitals
- **LCP (Largest Contentful Paint):** Ensure the 3D canvas loads and displays its first frame rapidly. Use a lightweight placeholder or loading screen while large GLTF assets load.
- **CLS (Cumulative Layout Shift):** Fix the aspect ratio and size of the canvas container. It should never resize unexpectedly.
- **INP (Interaction to Next Paint):** Debounce heavy logic running inside click handlers to ensure the UI feels responsive.

## Memory Leaks
- Dispose of geometries, materials, and textures immediately when they are no longer needed.
- Clear timeouts and cancel animation frames in `useEffect` cleanup functions.
- Monitor WebGL memory tab in Chrome DevTools to ensure textures aren't being duplicated.
