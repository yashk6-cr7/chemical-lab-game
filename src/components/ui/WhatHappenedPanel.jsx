import { memo, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'
import { getDepthContent } from '../../systems/depthLayer'
import { MoleculeViewer } from './MoleculeViewer'
import { EnergyDiagram } from './EnergyDiagram'
import { RealWorldLink } from './RealWorldLink'
import { FollowUpQuestions } from './FollowUpQuestions'
import { DepthTransition } from './DepthTransition'

export const WhatHappenedPanel = memo(function WhatHappenedPanel() {
  const show = useLabStore(s => s.showWhatHappened)
  const reaction = useLabStore(s => s.whatHappenedReaction)

  const content = useMemo(() => {
    if (!reaction) return null
    return getDepthContent(reaction)
  }, [reaction])

  const handleClose = useCallback(() => {
    useLabStore.getState().setShowWhatHappened(false)
  }, [])

  return (
    <div className="pointer-events-none">
      <AnimatePresence>
        {show && reaction && content && (
          <>
            {/* Click trap behind panel */}
            <motion.div
              key="what-happened-trap"
              className="fixed inset-0 z-[38] pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Panel */}
            <motion.div
              key="what-happened-panel"
              className="fixed right-4 top-1/2 -translate-y-1/2 w-80 max-h-[85vh]
                         overflow-y-auto z-[39] pointer-events-auto
                         backdrop-blur-md bg-white/5 border border-white/10
                         rounded-2xl shadow-2xl shadow-black/50 p-4
                         flex flex-col gap-4"
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2">
                <span className="text-xl">🧪</span>
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    What just happened?
                  </div>
                  {reaction.type && (
                    <div className="text-[9px] text-white/20 capitalize mt-0.5">
                      {reaction.type.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Headline */}
              <DepthTransition depthKey="headline-all">
                <h3 className="text-sm font-bold text-white leading-snug">
                  {content.headline}
                </h3>
              </DepthTransition>

              {/* Body */}
              <DepthTransition depthKey="body-all">
                <p className="text-xs text-white/70 leading-relaxed">
                  {content.body}
                </p>
              </DepthTransition>

              {/* Equation */}
              {content.equation && (
                <DepthTransition depthKey="eq-all">
                  <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center">
                    <code className="text-cyan-300 text-xs font-mono leading-relaxed">
                      {content.equation}
                    </code>
                  </div>
                </DepthTransition>
              )}

              {/* Molecule Viewer */}
              {content.moleculeKeys && (
                <DepthTransition depthKey="molecule-all">
                  <MoleculeViewer
                    reactant1={content.moleculeKeys.reactant1}
                    reactant2={content.moleculeKeys.reactant2}
                    product1={content.moleculeKeys.product1}
                    product2={content.moleculeKeys.product2}
                  />
                </DepthTransition>
              )}

              {/* Energy Diagram */}
              {content.energyData && (
                <DepthTransition depthKey="energy-all">
                  <EnergyDiagram
                    deltaH={content.energyData.deltaH}
                    activationEnergy={content.energyData.activationEnergy}
                    isExothermic={content.energyData.isExothermic}
                  />
                </DepthTransition>
              )}

              {/* Mechanism Steps */}
              {content.mechanismSteps?.length > 0 && (
                <DepthTransition depthKey="mechanism-all">
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      Mechanism
                    </div>
                    {content.mechanismSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="text-white/30 font-mono flex-shrink-0 w-4">{i + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </DepthTransition>
              )}

              {/* Real-World Link */}
              {content.realWorldLink && (
                <DepthTransition depthKey="realworld-all">
                  <RealWorldLink text={content.realWorldLink} />
                </DepthTransition>
              )}

              {/* Fun fact */}
              {content.funFact && (
                <DepthTransition depthKey="funfact-all">
                  <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3">
                    <p className="text-amber-200 text-xs leading-relaxed">
                      💡 {content.funFact}
                    </p>
                  </div>
                </DepthTransition>
              )}

              {/* Divider */}
              <div className="h-px bg-white/10" />

              {/* Follow-up Questions */}
              <FollowUpQuestions
                questions={content.followUpQuestions}
                reactionResult={reaction}
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="w-full py-2 rounded-xl text-white/40 hover:text-white/70
                           text-xs font-medium transition-colors hover:bg-white/5 border
                           border-white/5 hover:border-white/10"
              >
                ✕ Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
})
