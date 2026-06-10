import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import useLabStore from './store/useLabStore'
import { initErrorTracking } from './systems/errorTracker'
import { loadSave, startAutoSave } from './systems/saveSystem'

// Phase 11 Init
initErrorTracking(useLabStore)
loadSave(useLabStore)
startAutoSave(useLabStore)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Phase 10: Register Service Worker for offline caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      // Silently fail — SW is a progressive enhancement
      console.warn('SW registration failed:', err)
    })
  })
}
