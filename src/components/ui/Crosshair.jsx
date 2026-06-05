import useLabStore from '../../store/useLabStore'
import { isMobileDevice } from '../../utils/isMobile'

export default function Crosshair() {
  const hoverTarget = useLabStore(state => state.hoverTarget)

  if (isMobileDevice()) return null;

  let icon = <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
  let borderColor = "border-white/30"

  if (hoverTarget === 'bottle') {
    icon = <div className="text-white font-bold text-xs">+</div>
    borderColor = "border-white/60"
  } else if (hoverTarget === 'beaker') {
    icon = <div className="text-white font-bold text-[10px]">↓</div>
    borderColor = "border-white/60"
  } else if (hoverTarget === 'sink') {
    icon = <div className="text-blue-300 font-bold text-[10px]">♒</div>
    borderColor = "border-blue-400/60"
  } else if (hoverTarget === 'too_far') {
    icon = <div className="text-red-500 font-bold text-[10px]">✕</div>
    borderColor = "border-red-500/60"
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
      <div className={`w-8 h-8 rounded-full border-2 ${borderColor} flex items-center justify-center transition-colors duration-200`}>
        {icon}
      </div>
      {hoverTarget === 'too_far' && (
        <div className="absolute mt-12 text-xs font-bold text-red-400 bg-black/60 px-2 py-1 rounded">
          Move closer
        </div>
      )}
    </div>
  )
}
