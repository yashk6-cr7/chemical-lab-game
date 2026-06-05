export default function EnterOverlay({ onEnter }) {
  const handleClick = () => {
    if (onEnter) onEnter()
    // Request pointer lock on the canvas so movement starts immediately
    const canvas = document.querySelector('canvas')
    if (canvas) canvas.requestPointerLock()
  }

  return (
    <div className="enter-overlay" onClick={handleClick}>
      <h2 className="enter-overlay__title">Chemistry Lab Simulator</h2>
      <h1 className="enter-overlay__cta">Click to Enter</h1>
      <p className="enter-overlay__hint">Headphones Recommended</p>
      
      <div className="enter-overlay__keys">
        <span className="key-badge">W A S D</span>
        <span className="key-badge">MOUSE</span>
        <span className="key-badge">ESC to pause</span>
      </div>
    </div>
  )
}
