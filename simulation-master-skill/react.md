# React Best Practices

## Component Architecture
- Favor composition over inheritance.
- Use Custom Hooks to extract heavy logical operations away from JSX rendering.

## Strict Render Control
- Do not let 3D components re-render unless their fundamental props change. Use `React.memo()`.
- Objects stored in React state will trigger re-renders. Only store data in `useState` if the DOM needs to update based on it.
- For constantly changing simulation values (temperature, position), store them in a `useRef` or a `Zustand` store (accessed via transient updates or selectors).

## Next.js Integration (if applicable)
- Mark components containing 3D canvas or browser-specific logic with `"use client"`.
- Offload static geometry generation or complex mathematical pre-computations to the server if possible.
