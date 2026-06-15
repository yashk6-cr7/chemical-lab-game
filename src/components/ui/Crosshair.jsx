import { isMobileDevice } from '../../utils/isMobile'

export default function Crosshair() {
  if (isMobileDevice()) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40" aria-hidden="true">
      <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
    </div>
  )
}
