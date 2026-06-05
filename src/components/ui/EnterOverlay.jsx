import { isMobileDevice } from '../../utils/isMobile'

export default function EnterOverlay({ onEnter }) {
  const handleClick = async () => {
    if (onEnter) onEnter()
    const canvas = document.querySelector('canvas')
    
    if (isMobileDevice()) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
        if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
          await window.screen.orientation.lock('landscape')
        }
      } catch (e) {
        console.warn('Fullscreen/Orientation lock failed:', e)
      }
    } else {
      // Request pointer lock on the canvas for desktop
      if (canvas) canvas.requestPointerLock()
    }
  }

  return (
    <div className="enter-overlay" onClick={handleClick}>
      <h2 className="enter-overlay__title">Chemistry Lab Simulator</h2>
      <h1 className="enter-overlay__cta">Click to Enter</h1>
      <p className="enter-overlay__hint">Headphones Recommended</p>
      
      <div className="enter-overlay__keys">
        <span className="key-badge mobile-hide">W A S D</span>
        <span className="key-badge mobile-hide">MOUSE</span>
        <span className="key-badge mobile-hide">ESC to pause</span>
        <span className="key-badge desktop-hide">Left: Move</span>
        <span className="key-badge desktop-hide">Right: Look</span>
      </div>
      
      <div className="ios-rotate-warning desktop-hide">
        Please rotate device to landscape
      </div>
    </div>
  )
}
