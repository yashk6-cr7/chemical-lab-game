# Simulation Architecture Patterns

## The "Engine" Pattern
- **Definition:** Isolate scientific logic (chemistry, physics, thermodynamics) entirely from rendering logic.
- **Implementation:** Create pure functions in `/systems/` that accept a state snapshot and return a consequence or new state. The React layer calls these engines and applies the results.

## The "Consequence Cascade"
- **Definition:** User actions trigger primary events, which may trigger secondary environmental events.
- **Implementation:** A queue system in the Zustand store (`pendingConsequences`). The UI consumes these one by one to show alerts, while the 3D scene immediately renders the visual results.

## The "Discovery" Philosophy
- **Definition:** Do not force tutorials. Let the user experiment, fail, and learn through visual feedback.
- **Implementation:** Provide realistic physical limitations (e.g., glass cracking at extreme temps) rather than invisible walls. Log discoveries dynamically based on actions achieved.
