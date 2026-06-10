import React, { memo, useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Link } from 'react-router-dom'

function loadTeacherData() {
  try {
    const logbook = JSON.parse(localStorage.getItem('chemlab_logbook') || '[]')
    const accidentLog = [] // Assuming we parse accidents from save later, or store them in a specific key.
    
    // For now, let's also pull accidents from lab-save-v1 if it exists
    const saveState = JSON.parse(localStorage.getItem('lab-save-v1') || '{}')
    const savedLogbook = saveState.logbookEntries || logbook

    const reactionCounts = {}
    savedLogbook.forEach(entry => {
      const type = entry.reactionType || 'unknown'
      reactionCounts[type] = (reactionCounts[type] || 0) + 1
    })

    const topReactions = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const pieData = Object.entries(reactionCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))

    return {
      totalReactions: savedLogbook.length,
      totalAccidents: accidentLog.length,
      reactionCounts,
      topReactions,
      pieData,
      rawLogbook: savedLogbook
    }
  } catch {
    return { totalReactions: 0, totalAccidents: 0, reactionCounts: {}, topReactions: [], pieData: [], rawLogbook: [] }
  }
}

const COLORS = ['#4ADE80', '#FBBF24', '#F87171', '#60A5FA', '#A78BFA', '#2DD4BF']

export default memo(function TeacherDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(loadTeacherData())
  }, [])

  const handleExport = () => {
    if (!data) return
    const exportData = JSON.stringify(data, null, 2)
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lab-report-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result)
        const local = JSON.parse(localStorage.getItem('chemlab_logbook') || '[]')
        const importedLogbook = imported.rawLogbook || imported.entries || []
        
        const merged = [...local, ...importedLogbook]
          .filter((entry, i, arr) => arr.findIndex(x => x.id === entry.id) === i)
          
        localStorage.setItem('chemlab_logbook', JSON.stringify(merged))
        window.location.reload()
      } catch {
        alert('Invalid import file.')
      }
    }
    reader.readAsText(file)
  }

  if (!data) return <div className="p-8 text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>🧪</span> Chemistry Lab — Teacher View
          </h1>
          <Link to="/" className="text-white/50 hover:text-white transition-colors">
            Back to Lab
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="text-5xl font-black text-green-400 mb-2">{data.totalReactions}</div>
            <div className="text-white/50 text-sm uppercase tracking-wider font-semibold">Total Discoveries</div>
          </div>
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="text-5xl font-black text-red-400 mb-2">{data.totalAccidents}</div>
            <div className="text-white/50 text-sm uppercase tracking-wider font-semibold">Accidents Logged</div>
          </div>
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center">
            <h3 className="text-white/80 font-bold mb-3 text-center">Top Reactions</h3>
            <ul className="text-sm text-white/60 flex flex-col gap-1">
              {data.topReactions.map(([name, count]) => (
                <li key={name} className="flex justify-between">
                  <span>{name.replace(/_/g, ' ')}</span>
                  <span className="text-white">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 h-80 flex flex-col">
            <h3 className="text-white/80 font-bold mb-4">Reaction Type Breakdown</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 h-80 flex flex-col">
            <h3 className="text-white/80 font-bold mb-4">Top Reaction Frequencies</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topReactions.map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))}>
                  <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#999', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} cursor={{ fill: '#ffffff10' }} />
                  <Bar dataKey="count" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4">
          <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors font-medium border border-white/20">
            Import Student Data JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleExport}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-6 py-3 rounded-xl transition-colors font-medium border border-blue-500/30"
          >
            Export Class Report
          </button>
        </div>

      </div>
    </div>
  )
})
