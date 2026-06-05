// Centralized disposal utilities (performance.md: dispose geometries and materials on unmount)
// All components should use these helpers to prevent WebGL memory leaks

import { useEffect } from 'react'

/**
 * Recursively dispose a Three.js object and all its children.
 * Handles geometry, material, and nested textures.
 */
export function disposeObject(obj) {
  if (!obj) return

  // Dispose geometry
  if (obj.geometry) {
    obj.geometry.dispose()
  }

  // Dispose material(s)
  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach(m => disposeMaterial(m))
    } else {
      disposeMaterial(obj.material)
    }
  }

  // Recurse into children
  if (obj.children && obj.children.length > 0) {
    obj.children.forEach(child => disposeObject(child))
  }
}

/**
 * Dispose a material and all its texture properties.
 */
export function disposeMaterial(material) {
  if (!material) return
  material.dispose()
  // Dispose any texture maps on the material
  Object.values(material).forEach(value => {
    if (value && value.isTexture) {
      value.dispose()
    }
  })
}

/**
 * React hook — disposes any number of Three.js disposable items on unmount.
 * Usage: useDisposable(geometry, material, texture)
 */
export function useDisposable(...items) {
  useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item && typeof item.dispose === 'function') {
          item.dispose()
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * React hook — disposes arrays of geometries and materials separately.
 * Designed to be used with ref arrays built via JSX ref callbacks.
 * Usage:
 *   const geoRefs = useRef([])
 *   const matRefs = useRef([])
 *   useRefDisposal(geoRefs, matRefs)
 */
export function useRefDisposal(geoRefsRef, matRefsRef) {
  useEffect(() => {
    const geos = geoRefsRef?.current
    const mats = matRefsRef?.current
    return () => {
      if (geos) {
        geos.forEach(g => g?.dispose?.())
      }
      if (mats) {
        mats.forEach(m => m?.dispose?.())
      }
    }
  }, [geoRefsRef, matRefsRef])
}
