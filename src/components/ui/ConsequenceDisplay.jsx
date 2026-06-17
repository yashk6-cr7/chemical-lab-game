import { memo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

const CONSEQUENCE_CONTENT = {
  eye_exposure: {
    easy: {
      title: 'Your Eyes Were Exposed!',
      description: "A chemical splashed toward your eyes. You weren't wearing goggles.",
      realWorld: 'In a real lab, this could cause permanent blindness within seconds.',
      action: 'Always wear goggles before starting any experiment. Press [2] to put them on.',
    },
    moderate: {
      title: 'Ocular Chemical Exposure',
      description: 'Unprotected eyes contacted a corrosive substance. pH extremes denature corneal proteins rapidly.',
      realWorld: 'Immediate irrigation for 15–20 minutes required. Time-critical injury.',
      action: 'Goggles create a sealed barrier. Chemical splash goggles — not safety glasses.',
    },
    complex: {
      title: 'Ocular Chemical Burn — pH Injury',
      description: 'Corneal epithelial damage from alkaline or acid exposure. Protein denaturation at pH extremes disrupts cell membrane integrity.',
      realWorld: 'Alkali burns penetrate deeper than acid burns (saponification vs coagulation). Neutralisation not recommended — copious water irrigation only.',
      action: 'EN166 certified splash goggles for liquid chemical work. Face shield for large volume transfers.',
    }
  },
  skin_exposure: {
    easy: { title: 'Chemical on Your Skin!', description: 'Chemicals contacted your skin without glove protection.', realWorld: 'Chemical burns happen within seconds of contact with concentrated acids or bases.', action: 'Wear gloves for any chemical handling. Press [3] to put them on.' },
    moderate: { title: 'Dermal Chemical Exposure', description: 'Unprotected skin contacted a corrosive substance. Tissue damage begins immediately.', realWorld: 'Rinse with large amounts of water for 20 minutes. Remove contaminated clothing.', action: 'Chemical-resistant gloves (nitrile or neoprene) for acid/base handling.' },
    complex: { title: 'Chemical Skin Burn', description: 'Corrosive substance contact causing protein denaturation and cell membrane disruption. Penetration depth depends on concentration and exposure time.', realWorld: 'Acid causes coagulation necrosis (self-limiting). Alkali causes liquefaction necrosis (continues to penetrate). Alkali burns are typically more severe.', action: 'Nitrile gloves for aqueous chemicals. Neoprene for organic solvents. Check glove compatibility chart.' }
  },
  clothing_damage: {
    easy: { title: 'Your Clothes Got Stained!', description: 'Chemicals spilled on your clothing without a lab coat.', realWorld: 'Chemical spills can eat through fabric and reach your skin.', action: 'A lab coat protects your clothing and skin. Press [1] to put it on.' },
    moderate: { title: 'Chemical Spill on Clothing', description: 'Chemical permeated standard clothing fibres without a protective barrier.', realWorld: 'Some chemicals pass through fabric faster than skin — the fabric traps them against you.', action: 'Lab coat + cotton clothing underneath. Remove contaminated clothing immediately.' },
    complex: { title: 'Textile Chemical Permeation', description: 'Chemical permeation rate through fabric depends on fabric type, chemical polarity and concentration gradient. Cotton offers minimal protection.', realWorld: 'Fabric can increase exposure by trapping chemicals next to skin. Lab coats use cotton treated to resist permeation.', action: 'Lab coat rated to EN 13034 for liquid splash protection. Check COSHH assessment for chemical-specific PPE.' }
  },
  fire_hazard: {
    easy: { title: '🔥 Fire!', description: 'A flammable chemical caught fire! Use the fire extinguisher on the left wall.', realWorld: 'Lab fires spread rapidly. Knowing your escape route and extinguisher location is essential.', action: 'Pick up the CO₂ extinguisher and aim at the base of the flame. Press E near it.' },
    moderate: { title: 'Fire Hazard — Flammable Vapour', description: 'Flammable vapour ignited. Combustion reaction spreading rapidly.', realWorld: 'Alcohol fires cannot be extinguished with water — CO₂ or dry powder only.', action: 'Use CO₂ extinguisher. Aim at base of flame. PASS: Pull, Aim, Squeeze, Sweep.' },
    complex: { title: 'Class B Combustion Event', description: 'Exothermic oxidation reaction. Flammable liquid/vapour fire. Heat release accelerates vapour production.', realWorld: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O. CO₂ extinguisher displaces O₂ below 15% combustion threshold. Never water — spreads burning liquid.', action: 'CO₂ extinguisher for Class B. Dry powder for electrical. Halon alternatives for sensitive equipment.' }
  },
  air_quality_drop: {
    easy: { title: 'Bad Air!', description: 'Fumes from the chemical are building up in the air.', realWorld: 'Inhaling chemical vapours can cause dizziness, nausea, or lung damage.', action: 'Move volatile reactions to the fume hood — the ventilated cabinet on the left.' },
    moderate: { title: 'Vapour Accumulation', description: 'Volatile compound releasing vapour above safe exposure levels.', realWorld: 'Many chemical vapours are colourless and odourless. You may not notice until symptoms start.', action: 'Fume hood removes vapours at source. Always use for volatile chemicals.' },
    complex: { title: 'PEL Exceeded — Vapour Hazard', description: 'Volatile compound concentration approaching or exceeding Permissible Exposure Limit (OSHA) or STEL (Short-Term Exposure Limit).', realWorld: 'Chronic low-level exposure to many lab chemicals causes neurological damage, respiratory disease, or carcinogenesis.', action: 'Fume hood (0.5 m/s face velocity). Air monitoring recommended for chronic exposure work. RPE if fume hood unavailable.' }
  },
  beaker_crack: {
    easy: { title: 'The Beaker Cracked!', description: 'Sudden temperature change cracked the glass beaker.', realWorld: 'Broken glass causes cuts and spills chemicals everywhere.', action: 'Heat glass slowly. Never pour hot liquid into cold glassware.' },
    moderate: { title: 'Thermal Shock Fracture', description: 'Rapid temperature gradient exceeded the glass stress tolerance.', realWorld: 'Borosilicate glass handles moderate thermal shock but not extreme gradients.', action: 'Heat glassware gradually. Use borosilicate not soda-lime for heated experiments.' },
    complex: { title: 'Thermal Stress Failure', description: 'Thermal stress σ = EαΔT/(1-ν) exceeded material fracture strength. Borosilicate fails at ~40°C/second gradient.', realWorld: 'Tempered glass handles ΔT up to 150°C. Standard borosilicate ~80°C. Soda-lime ~40°C.', action: 'Pre-warm glassware. Use sand bath for gradual heating. Inspect for existing cracks before heating.' }
  },
  overflow: {
    easy: { title: 'Overflow!', description: 'You added too much and it overflowed!', realWorld: 'Chemical spills contaminate the bench and can splash on you.', action: 'Watch the volume level. Stop before the beaker is full.' },
    moderate: { title: 'Container Capacity Exceeded', description: 'Volume exceeded safe fill level. Chemical spillage on bench surface.', realWorld: 'Secondary containment trays are required for this reason.', action: 'Fill to maximum 80% capacity. Use secondary containment tray under beakers.' },
    complex: { title: 'Volumetric Overflow — Containment Breach', description: 'Volume exceeded container rated capacity. No secondary containment present.', realWorld: 'Lab protocol requires secondary containment for all liquid chemical operations.', action: 'EN 13274 secondary containment. 110% capacity for single containers, 25% for rack of containers.' }
  }
}

const SEVERITY_CONFIG = {
  1: { border: 'border-l-blue-400', glow: 'rgba(96,165,250,0.3)', icon: 'ℹ️', label: 'INFO', textColor: 'text-blue-200', bg: 'bg-blue-950/60' },
  2: { border: 'border-l-yellow-400', glow: 'rgba(250,204,21,0.3)', icon: '⚠️', label: 'CAUTION', textColor: 'text-yellow-200', bg: 'bg-yellow-950/60' },
  3: { border: 'border-l-orange-500', glow: 'rgba(249,115,22,0.3)', icon: '⚡', label: 'WARNING', textColor: 'text-orange-200', bg: 'bg-orange-950/60' },
  4: { border: 'border-l-red-500', glow: 'rgba(239,68,68,0.4)', icon: '🔴', label: 'DANGER', textColor: 'text-red-200', bg: 'bg-red-950/70' },
  5: { border: 'border-l-red-700', glow: 'rgba(185,28,28,0.6)', icon: '☠️', label: 'CRITICAL', textColor: 'text-red-100', bg: 'bg-red-950/90' },
}

function ConsequenceCard({ event, onDismiss }) {
  const severity = Math.min(5, Math.max(1, event.severity || 3))
  const config = SEVERITY_CONFIG[severity]
  // Open Everything — show moderate content, fall back to easy
  const content = CONSEQUENCE_CONTENT[event.type]?.moderate
    || CONSEQUENCE_CONTENT[event.type]?.easy
    || { title: 'Safety Event', description: event.message?.moderate || event.message?.easy || event.message || '', realWorld: '', action: '' }

  const requiresManualDismiss = severity >= 4

  const autoDismissDelay = severity <= 2 ? 4000 : severity === 3 ? 6000 : null
  useEffect(() => {
    if (!requiresManualDismiss && autoDismissDelay) {
      const t = setTimeout(onDismiss, autoDismissDelay)
      return () => clearTimeout(t)
    }
  }, [event.id, requiresManualDismiss, autoDismissDelay, onDismiss])

  const pulseAnim = severity === 5
    ? { boxShadow: ['0 0 0px rgba(185,28,28,0)', '0 0 25px rgba(185,28,28,0.8)', '0 0 0px rgba(185,28,28,0)'] }
    : {}
  const pulseTrans = severity === 5 ? { repeat: Infinity, duration: 1.5 } : {}

  return (
    <motion.div
      layout
      initial={{ x: 440, opacity: 0 }}
      animate={{ x: 0, opacity: 1, ...pulseAnim }}
      exit={{ x: 440, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, ...pulseTrans }}
      className={`w-full border-l-4 ${config.border} ${config.bg} backdrop-blur-lg rounded-l-2xl shadow-2xl overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <span className="text-3xl leading-none">{config.icon}</span>
        <div className="flex-1">
          <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${config.textColor} opacity-70`}>{config.label}</div>
          <h3 className="text-white font-bold text-base leading-tight mt-0.5">{content.title}</h3>
        </div>
        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all text-sm flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <div className="px-5 pb-3">
        <p className="text-gray-200 text-sm leading-relaxed">{content.description}</p>
      </div>

      {/* Real World */}
      {content.realWorld && (
        <div className="mx-5 mb-3 p-3 bg-black/30 rounded-xl border border-white/5">
          <div className="flex items-start gap-2">
            <span className="text-base mt-0.5 flex-shrink-0">🌍</span>
            <p className="text-gray-400 text-xs italic leading-relaxed">{content.realWorld}</p>
          </div>
        </div>
      )}

      {/* Action */}
      {content.action && (
        <div className="mx-5 mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-start gap-2">
            <span className={`text-sm font-bold ${config.textColor} flex-shrink-0 mt-0.5`}>→</span>
            <p className={`text-xs font-medium leading-relaxed ${config.textColor}`}>{content.action}</p>
          </div>
        </div>
      )}

      {/* Manual dismiss prompt */}
      {requiresManualDismiss && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="px-5 pb-4"
        >
          <button
            onClick={onDismiss}
            className={`w-full text-center text-xs font-bold py-2 rounded-lg border ${config.border} ${config.textColor} hover:bg-white/10 transition-colors`}
          >
            I understand — Dismiss
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

const ConsequenceDisplay = memo(function ConsequenceDisplay() {
  const consequenceQueue = useLabStore(state => state.consequenceQueue)
  const dismissConsequence = useLabStore(state => state.dismissConsequence)

  const handleDismiss = useCallback(() => {
    dismissConsequence()
  }, [dismissConsequence])

  const currentEvent = consequenceQueue[0] || null
  const queueLength = consequenceQueue.length

  return (
    <div className="fixed right-4 top-20 w-96 z-[60] pointer-events-none">
      <AnimatePresence mode="wait">
        {currentEvent && (
          <div key={currentEvent.id || currentEvent.type + currentEvent.severity} className="pointer-events-auto">
            <ConsequenceCard
              event={currentEvent}
              onDismiss={handleDismiss}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Queue indicator */}
      <AnimatePresence>
        {queueLength > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-center pointer-events-none"
          >
            <span className="text-[10px] text-white/30 bg-black/40 px-3 py-1 rounded-full">
              +{queueLength - 1} more incident{queueLength - 1 > 1 ? 's' : ''} queued
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default ConsequenceDisplay
