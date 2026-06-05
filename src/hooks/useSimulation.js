import { useCallback } from 'react'
import { shallow } from 'zustand/shallow'
import useLabStore, { useBeakers, useSafetyGear } from '../store/useLabStore'

/**
 * useSimulation — master simulation hook (simulation-patterns.md)
 * All components use this instead of direct store + engine imports.
 * Provides a clean interface to pour, describe, and query beaker state.
 */
export function useSimulation() {
  const beakers     = useBeakers()
  const safetyGear  = useSafetyGear()
  const depthMode   = useLabStore(state => state.depthMode)
  const pourIntoBeaker   = useLabStore(state => state.pourIntoBeaker)
  const hotplate         = useLabStore(state => state.hotplate, shallow)

  // Stable pour action — wraps store action (useCallback for referential stability)
  const pour = useCallback((fromChemical, toBeakerId, amount) => {
    const beaker = beakers.find(b => b.id === toBeakerId)
    if (!beaker) return

    // Blend color for mixed state
    const newColor = fromChemical.color

    // Delegate to store — store handles reaction engine + consequence cascade
    pourIntoBeaker(toBeakerId, fromChemical, amount, newColor)
  }, [beakers, pourIntoBeaker])

  // Get human-readable description at current depth mode
  const getDescription = useCallback((reactionResult) => {
    if (!reactionResult) return ''
    return reactionResult.description?.[depthMode] || reactionResult.description?.easy || ''
  }, [depthMode])

  // Get beaker by ID
  const getBeaker = useCallback((id) => {
    return beakers.find(b => b.id === id) ?? null
  }, [beakers])

  // Check if a beaker is on the hotplate
  const isBeakerOnHotplate = useCallback((id) => {
    return hotplate.beakerOnTop === id
  }, [hotplate.beakerOnTop])

  return {
    beakers,
    safetyGear,
    pour,
    getDescription,
    getBeaker,
    isBeakerOnHotplate,
    hotplate,
  }
}
