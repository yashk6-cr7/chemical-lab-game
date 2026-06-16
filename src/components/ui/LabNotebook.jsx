import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

export const LabNotebook = memo(function LabNotebook() {
  const { show, pages, activePage } = useLabStore(state => state.labNotebook)
  const setShowNotebook = useLabStore(state => state.setShowNotebook)
  const addNotebookPage = useLabStore(state => state.addNotebookPage)
  const updateNotebookPage = useLabStore(state => state.updateNotebookPage)
  const setNotebookPages = useLabStore(state => state.setNotebookPages)

  const [localText, setLocalText] = useState('')
  const [activeId, setActiveId] = useState(null)
  
  // Drawing Canvas State
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef(null)
  const [penColor, setPenColor] = useState('#222222')
  const [isEraser, setIsEraser] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lab-notebook')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.length > 0) {
          setNotebookPages(parsed)
          setActiveId(parsed[0].id)
        }
      }
    } catch (e) {
      console.warn('Failed to load notebook', e)
    }
  }, [setNotebookPages])

  // Key press listener for 'N'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'n' && !e.target.matches('input, textarea')) {
        useLabStore.getState().setShowNotebook(!useLabStore.getState().labNotebook.show)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentPage = pages.find(p => p.id === activeId)

  // Load page data into UI when active page changes
  useEffect(() => {
    if (currentPage) {
      setLocalText(currentPage.text || '')
      if (canvasRef.current && currentPage.drawingDataUrl) {
        const ctx = canvasRef.current.getContext('2d')
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          ctx.drawImage(img, 0, 0)
        }
        img.src = currentPage.drawingDataUrl
      } else if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [currentPage])

  const createNewPage = () => {
    const newPage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      title: `Experiment — ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      text: '',
      drawingDataUrl: null
    }
    addNotebookPage(newPage)
    setActiveId(newPage.id)
  }

  // Debounced Auto-save
  const saveTimeout = useRef(null)
  const triggerAutoSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      if (!activeId) return
      
      let drawingDataUrl = null
      if (canvasRef.current) {
        drawingDataUrl = canvasRef.current.toDataURL('image/png')
      }
      
      updateNotebookPage(activeId, { text: localText, drawingDataUrl })
      
      // Save all to localStorage
      try {
        const allPages = useLabStore.getState().labNotebook.pages
        localStorage.setItem('lab-notebook', JSON.stringify(allPages.slice(-100))) // keep last 100
      } catch (e) {
        console.warn('Failed to save notebook', e)
      }
    }, 500)
  }, [activeId, localText, updateNotebookPage])

  // Canvas drawing handlers
  const handlePointerDown = useCallback((e) => {
    if (!canvasRef.current) return
    isDrawing.current = true
    const rect = canvasRef.current.getBoundingClientRect()
    lastPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const rect = canvasRef.current.getBoundingClientRect()
    const cur = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    
    if (isEraser) {
      ctx.clearRect(cur.x - 10, cur.y - 10, 20, 20)
    } else {
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(cur.x, cur.y)
      ctx.strokeStyle = penColor
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    lastPoint.current = cur
    triggerAutoSave()
  }, [isEraser, penColor, triggerAutoSave])

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false
  }, [])

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      triggerAutoSave()
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="w-full max-w-5xl h-[85vh] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col overflow-hidden text-stone-100"
      >
        {/* Header */}
        <div className="bg-black/20 border-b border-white/10 p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-3">
            <span className="text-2xl">📓</span> 
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Digital Lab Notebook</span>
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={createNewPage}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full font-semibold shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
            >
              + New Entry
            </button>
            <button 
              onClick={() => setShowNotebook(false)}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold border border-white/10 transition-all hover:scale-105"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Pages list */}
          <div className="w-64 bg-black/20 border-r border-white/10 overflow-y-auto p-3 flex flex-col gap-2">
            {pages.length === 0 ? (
              <div className="text-white/40 text-sm p-4 text-center italic">No entries yet.</div>
            ) : (
              [...pages].reverse().map(page => (
                <button
                  key={page.id}
                  onClick={() => setActiveId(page.id)}
                  className={`text-left px-4 py-3 rounded-xl text-sm transition-all ${
                    activeId === page.id ? 'bg-cyan-500/20 shadow-sm font-semibold text-cyan-100 border border-cyan-500/30' : 'hover:bg-white/5 text-white/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="truncate">{page.title}</div>
                  <div className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-wider">
                    {new Date(page.timestamp).toLocaleDateString()} {new Date(page.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col bg-black/40 overflow-y-auto">
            {!currentPage ? (
              <div className="flex-1 flex items-center justify-center text-white/40 italic">
                Select or create an entry to begin writing.
              </div>
            ) : (
              <div className="p-8 max-w-3xl mx-auto w-full flex flex-col gap-6">
                <input
                  type="text"
                  value={currentPage.title}
                  onChange={(e) => {
                    updateNotebookPage(activeId, { title: e.target.value })
                    triggerAutoSave()
                  }}
                  className="text-3xl font-bold tracking-wide text-white border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none bg-transparent transition-colors"
                />

                <textarea
                  value={localText}
                  onChange={(e) => {
                    setLocalText(e.target.value)
                    triggerAutoSave()
                  }}
                  placeholder="Observations and notes..."
                  className="w-full h-48 p-0 border-none outline-none resize-none font-sans text-white/80 leading-relaxed bg-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(transparent, transparent 27px, rgba(255,255,255,0.05) 28px)',
                    backgroundSize: '100% 28px',
                    lineHeight: '28px'
                  }}
                />

                {/* Drawing Area */}
                <div className="mt-4 border border-white/10 rounded-2xl overflow-hidden shadow-lg bg-black/20">
                  <div className="bg-black/40 p-3 border-b border-white/10 flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/50">Drawing</span>
                    
                    <div className="flex gap-2 border-r border-white/10 pr-4">
                      {['#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'].map(color => (
                        <button
                          key={color}
                          onClick={() => { setPenColor(color); setIsEraser(false); }}
                          className={`w-6 h-6 rounded-full border-2 ${penColor === color && !isEraser ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-110'} transition-all`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setIsEraser(true)}
                      className={`px-4 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${isEraser ? 'bg-white/20 font-bold text-white shadow-inner' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
                    >
                      <span>🧼</span> Eraser
                    </button>
                    
                    <button
                      onClick={clearCanvas}
                      className="px-4 py-1.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors ml-auto border border-red-500/20 hover:border-red-500/50"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="bg-white/5 relative">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={300}
                      className="w-full h-[300px] cursor-crosshair touch-none"
                      style={{ 
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerOut={handlePointerUp}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                   <span className="text-[10px] text-white/30 uppercase tracking-widest mt-2">Auto-saved</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
})

export default LabNotebook
