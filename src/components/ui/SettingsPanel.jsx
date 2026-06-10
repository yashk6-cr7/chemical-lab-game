import React, { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore, { useSettings } from '../../store/useLabStore'
import { getErrorLog, copyErrorLog } from '../../systems/errorTracker'

export const usePanelClass = () => {
  const { highContrast } = useSettings()
  return highContrast
    ? 'bg-black border-2 border-white rounded-2xl'
    : 'backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl'
}

const SettingsSlider = memo(function SettingsSlider({ label, value, min, max, step=0.01, format, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/60 text-sm w-32 shrink-0">{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-white"
        aria-label={label}
      />
      <span className="text-white/40 text-xs w-10 text-right tabular-nums">
        {format ? format(value) : value}
      </span>
    </div>
  )
})

export const SettingsPanel = memo(function SettingsPanel({ isOpen, onClose }) {
  const settings = useSettings()
  const errorLog = getErrorLog()
  const panelClass = usePanelClass()

  const handleUpdate = useCallback((patch) => {
    useLabStore.getState().updateSettings(patch)
  }, [])

  const handleGraphics = useCallback((quality) => {
    handleUpdate({ graphicsQuality: quality })
  }, [handleUpdate])

  const handleResetBeakers = useCallback(() => {
    useLabStore.setState({
      beakers: [
        { id: 'beaker_0', position: [-2, 0.92, 0],   contents: [], totalVolume: 0, mixedColor: '#ffffff', temperature: 22, reactionResult: null, isCracked: false },
        { id: 'beaker_1', position: [-0.7, 0.92, 0], contents: [], totalVolume: 0, mixedColor: '#ffffff', temperature: 22, reactionResult: null, isCracked: false },
        { id: 'beaker_2', position: [0.7, 0.92, 0],  contents: [], totalVolume: 0, mixedColor: '#ffffff', temperature: 22, reactionResult: null, isCracked: false },
        { id: 'beaker_3', position: [2, 0.92, 0],    contents: [], totalVolume: 0, mixedColor: '#ffffff', temperature: 22, reactionResult: null, isCracked: false },
      ],
      isFireActive: false,
      fireBeakerId: null,
      airQuality: 100,
      smokeVolume: 0,
    })
    onClose()
  }, [onClose])

  const handleResetSession = useCallback(() => {
    if (window.confirm('Reset everything? Logbook entries will be lost.')) {
      localStorage.removeItem('lab-logbook')
      localStorage.removeItem('lab-notebook')
      localStorage.removeItem('lab-save-v1')
      window.location.reload()
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-[480px] p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto ${panelClass}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⚙️</span> Settings
            </h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/80 transition-colors"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* GRAPHICS */}
            <section className="flex flex-col gap-3">
              <h3 className="text-white/80 text-xs font-bold tracking-wider uppercase">Graphics</h3>
              <div className="flex gap-2">
                {['auto', 'high', 'medium', 'low'].map(q => (
                  <button
                    key={q}
                    onClick={() => handleGraphics(q)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                      settings.graphicsQuality === q
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <SettingsSlider
                label="Field of view"
                value={settings.fov} min={60} max={100} step={1}
                onChange={v => handleUpdate({ fov: v })}
                format={v => `${v}°`}
              />
            </section>

            {/* CONTROLS */}
            <section className="flex flex-col gap-3">
              <h3 className="text-white/80 text-xs font-bold tracking-wider uppercase">Controls</h3>
              <SettingsSlider
                label="Mouse sensitivity"
                value={settings.mouseSensitivity} min={0.1} max={3.0} step={0.1}
                onChange={v => handleUpdate({ mouseSensitivity: v })}
                format={v => v.toFixed(1)}
              />
            </section>

            {/* SOUND */}
            <section className="flex flex-col gap-3">
              <h3 className="text-white/80 text-xs font-bold tracking-wider uppercase">Sound</h3>
              <SettingsSlider
                label="Master"
                value={settings.masterVolume} min={0} max={1}
                onChange={v => handleUpdate({ masterVolume: v })}
                format={v => `${Math.round(v * 100)}%`}
              />
              <SettingsSlider
                label="Effects"
                value={settings.effectsVolume} min={0} max={1}
                onChange={v => handleUpdate({ effectsVolume: v })}
                format={v => `${Math.round(v * 100)}%`}
              />
              <SettingsSlider
                label="Ambient"
                value={settings.ambientVolume} min={0} max={1}
                onChange={v => handleUpdate({ ambientVolume: v })}
                format={v => `${Math.round(v * 100)}%`}
              />
            </section>

            {/* ACCESSIBILITY */}
            <section className="flex flex-col gap-3">
              <h3 className="text-white/80 text-xs font-bold tracking-wider uppercase">Accessibility</h3>
              
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60 text-sm">Colorblind mode</span>
                <select
                  value={settings.colorblindMode}
                  onChange={e => handleUpdate({ colorblindMode: e.target.value })}
                  className="bg-black/40 border border-white/20 text-white/80 text-sm rounded px-2 py-1 outline-none"
                >
                  <option value="none">None</option>
                  <option value="deuteranopia">Deuteranopia</option>
                  <option value="protanopia">Protanopia</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60 text-sm">Reduce motion</span>
                <button
                  onClick={() => handleUpdate({ reduceMotion: !settings.reduceMotion })}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    settings.reduceMotion ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {settings.reduceMotion ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60 text-sm">High contrast</span>
                <button
                  onClick={() => handleUpdate({ highContrast: !settings.highContrast })}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    settings.highContrast ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {settings.highContrast ? 'ON' : 'OFF'}
                </button>
              </div>
            </section>

            {/* LAB ACTIONS */}
            <section className="flex flex-col gap-3 pt-2 border-t border-white/10">
              <div className="flex gap-2">
                <button
                  onClick={handleResetBeakers}
                  className="flex-1 py-2 text-sm font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl transition-colors"
                >
                  Reset Beakers
                </button>
                <button
                  onClick={handleResetSession}
                  className="flex-1 py-2 text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors"
                >
                  Reset Session
                </button>
              </div>
            </section>

            {/* ERROR TRACKING */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-white/40 text-xs">
                {errorLog.length} errors logged
              </span>
              {errorLog.length > 0 && (
                <button
                  onClick={copyErrorLog}
                  className="text-white/40 hover:text-white/70 text-xs transition-colors"
                >
                  Copy error log
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
})
