import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

function buildExperimentSetup(question, reactionResult) {
  return {
    suggestion: question,
    chemical1Id: reactionResult?.chemical1Id || null,
    chemical2Id: reactionResult?.chemical2Id || null,
  }
}

export const FollowUpQuestions = memo(function FollowUpQuestions({ questions, reactionResult }) {
  if (!questions?.length) return null

  const handleQuestion = useCallback((question) => {
    const setup = buildExperimentSetup(question, reactionResult)
    useLabStore.getState().setPendingExperimentSetup(setup)
    useLabStore.getState().setShowWhatHappened(false)
  }, [reactionResult])

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
        Try next...
      </div>
      {questions.map((q, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07, duration: 0.2 }}
          onClick={() => handleQuestion(q)}
          className="text-left px-3 py-2.5 rounded-xl bg-white/5 border border-white/10
                     hover:bg-white/10 hover:border-white/20 transition-all
                     text-white/70 hover:text-white text-xs leading-relaxed
                     flex items-start gap-2 group"
        >
          <span className="text-cyan-400 font-bold flex-shrink-0 mt-0.5 group-hover:text-cyan-300 transition-colors">→</span>
          <span>{q}</span>
        </motion.button>
      ))}
    </div>
  )
})
