# Animation and Motion

## Framer Motion
- Use `framer-motion` for all 2D UI animations.
- Rely on `layoutId` for smooth shared-element transitions (e.g., expanding a card).
- Use `useScroll` and `useTransform` for scroll-linked animations instead of manual event listeners.

## Framer Motion 3D
- `@react-three/drei` provides some animation helpers, but `framer-motion-3d` can be used to seamlessly animate 3D properties using Spring physics.
- Prefer Spring physics over linear tweens for natural, physical movement.

## GSAP vs React Spring
- While GSAP is powerful, in the React ecosystem, prefer Zustand-driven `useFrame` interpolations or `@react-spring/three` to maintain declarative components.
- Standard pattern for R3F manual animation: `meshRef.current.position.lerp(targetPos, delta * speed)`.
