import { useRef, useEffect, useCallback } from 'react'

/**
 * Generic pre-allocated object pool (performance.md: zero GC during runtime)
 * 
 * Usage:
 *   const pool = useObjectPool(() => ({ x:0, y:0, active:false }), 100)
 *   const obj  = pool.acquire()   // get a free object
 *   pool.release(obj)             // return it to the pool
 */
export function useObjectPool(factory, size = 50) {
  const poolRef   = useRef([])
  const activeRef = useRef([])

  // Pre-allocate all objects once (performance.md: allocate at startup not runtime)
  useEffect(() => {
    poolRef.current = Array.from({ length: size }, () => ({
      ...factory(),
      _pooled: true,
      _inUse:  false,
    }))

    return () => {
      // Dispose on unmount if objects have dispose method
      poolRef.current.forEach(obj => {
        if (obj && typeof obj.dispose === 'function') obj.dispose()
      })
      poolRef.current = []
      activeRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  const acquire = useCallback(() => {
    const obj = poolRef.current.find(o => !o._inUse)
    if (!obj) return null   // Pool exhausted — caller handles gracefully
    obj._inUse = true
    activeRef.current.push(obj)
    return obj
  }, [])

  const release = useCallback((obj) => {
    if (!obj || !obj._pooled) return
    obj._inUse = false
    activeRef.current = activeRef.current.filter(o => o !== obj)
  }, [])

  const releaseAll = useCallback(() => {
    poolRef.current.forEach(obj => { obj._inUse = false })
    activeRef.current = []
  }, [])

  return { acquire, release, releaseAll, active: activeRef }
}
