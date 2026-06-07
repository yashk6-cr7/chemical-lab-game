import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'
import chemicalsData from '../../data/chemicals.json'

// Confetti burst on correct answer (HTML CSS animation)
function ConfettiBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc'][Math.floor(Math.random() * 5)],
            left: '50%',
            top: '50%',
          }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: 0,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            scale: Math.random() * 1.5 + 0.5,
            rotate: Math.random() * 360
          }}
          transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
        />
      ))}
    </div>
  )
}

export const MysteryPanel = memo(function MysteryPanel() {
  const heldBottleId = useLabStore(state => state.heldBottleId)
  const mysterySubstance = useLabStore(state => state.mysterySubstance)
  const setMysteryHypothesis = useLabStore(state => state.setMysteryHypothesis)
  const solveMystery = useLabStore(state => state.solveMystery)

  const [isShake, setIsShake] = useState(false)

  const handleIdentify = () => {
    if (!mysterySubstance.hypothesis) return
    const correct = mysterySubstance.hypothesis === mysterySubstance.substanceId
    if (correct) {
      solveMystery(true)
    } else {
      setIsShake(true)
      setTimeout(() => setIsShake(false), 500)
    }
  }

  const show = heldBottleId === 'mystery' || mysterySubstance.isSolved

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1, x: isShake ? [-10, 10, -10, 10, 0] : 0 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-40 w-80 backdrop-blur-md bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl pointer-events-auto"
        >
          {mysterySubstance.isSolved && <ConfettiBurst />}

          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🔬 {mysterySubstance.revealedName ? chemicalsData.find(c => c.id === mysterySubstance.revealedName)?.name : 'Unknown Substance A'}
          </h2>

          <div className="bg-white/5 rounded-lg p-3">
            <h3 className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Tests performed:</h3>
            <ul className="text-sm text-gray-200 space-y-1">
              <li className="flex gap-2">
                <span className={mysterySubstance.testsPerformed.includes('pH') ? 'text-green-400' : 'text-gray-500'}>
                  {mysterySubstance.testsPerformed.includes('pH') ? '✓' : '○'}
                </span>
                <span>pH test {mysterySubstance.testResults.pH ? `→ ${mysterySubstance.testResults.pH}` : ''}</span>
              </li>
              <li className="flex gap-2">
                <span className={mysterySubstance.testsPerformed.includes('flame') ? 'text-green-400' : 'text-gray-500'}>
                  {mysterySubstance.testsPerformed.includes('flame') ? '✓' : '○'}
                </span>
                <span>Flame test {mysterySubstance.testResults.flame ? `→ ${mysterySubstance.testResults.flame}` : ''}</span>
              </li>
              <li className="flex gap-2">
                <span className={mysterySubstance.testsPerformed.includes('solubility') ? 'text-green-400' : 'text-gray-500'}>
                  {mysterySubstance.testsPerformed.includes('solubility') ? '✓' : '○'}
                </span>
                <span>Solubility test {mysterySubstance.testResults.solubility ? `→ ${mysterySubstance.testResults.solubility}` : ''}</span>
              </li>
            </ul>
          </div>

          {!mysterySubstance.isSolved && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Your hypothesis:</label>
                <select
                  value={mysterySubstance.hypothesis || ''}
                  onChange={(e) => setMysteryHypothesis(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>Select chemical ▾</option>
                  <option value="HCl">Hydrochloric Acid (HCl)</option>
                  <option value="NaOH">Sodium Hydroxide (NaOH)</option>
                  <option value="CuSO4">Copper Sulfate (CuSO4)</option>
                  <option value="NaCl">Sodium Chloride (NaCl)</option>
                  <option value="Ammonia">Ammonia (NH3)</option>
                  <option value="Na2S2O3">Sodium Thiosulfate</option>
                </select>
              </div>

              <button
                onClick={handleIdentify}
                disabled={!mysterySubstance.hypothesis}
                className="mt-2 w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white font-semibold transition-colors"
              >
                Identify →
              </button>
            </>
          )}

          {mysterySubstance.isSolved && (
            <div className="text-center text-green-400 font-bold bg-green-400/10 p-3 rounded-lg border border-green-400/20">
              Identification Correct! 🎉
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
})
