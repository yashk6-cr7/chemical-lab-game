import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import useLabStore from './store/useLabStore'

import Lab from './Lab'
import TeacherDashboard from './pages/TeacherDashboard'

export default function App() {
  const reduceMotion = useLabStore(state => state.settings?.reduceMotion || false)

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <Router>
        <Routes>
          <Route path="/" element={<Lab />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
      </Router>
    </MotionConfig>
  )
}
