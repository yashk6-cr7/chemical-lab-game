/**
 * pointerLock.js — centralised pointer lock state
 *
 * Exports a simple subscribe/get API so that PlayerControls, ChemicalBottle,
 * and any other system can all read the SAME locked state without prop-drilling.
 *
 * Pattern: tiny Zustand-free observable so it can be read synchronously inside
 * useFrame without triggering re-renders.
 */

let _locked = false
const _listeners = new Set()

export function isPointerLocked() {
  return _locked
}

export function setPointerLocked(val) {
  _locked = val
  _listeners.forEach(fn => fn(val))
}

export function subscribePointerLock(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
