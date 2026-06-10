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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="w-full max-w-5xl h-[85vh] bg-stone-100 rounded-xl shadow-2xl flex flex-col overflow-hidden text-stone-800"
      >
        {/* Header */}
        <div className="bg-stone-200 border-b border-stone-300 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2">
            📔 Student Lab Notebook
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={createNewPage}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium shadow-sm transition-colors"
            >
              + New Page
            </button>
            <button 
              onClick={() => setShowNotebook(false)}
              className="px-4 py-1.5 bg-stone-300 hover:bg-stone-400 text-stone-800 rounded font-bold transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Pages list */}
          <div className="w-64 bg-stone-200/50 border-r border-stone-300 overflow-y-auto p-2 flex flex-col gap-1">
            {pages.length === 0 ? (
              <div className="text-stone-500 text-sm p-4 text-center italic">No pages yet.</div>
            ) : (
              [...pages].reverse().map(page => (
                <button
                  key={page.id}
                  onClick={() => setActiveId(page.id)}
                  className={`text-left px-3 py-2 rounded text-sm transition-colors ${
                    activeId === page.id ? 'bg-white shadow-sm font-bold text-cyan-800 border border-stone-200' : 'hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  <div className="truncate">{page.title}</div>
                  <div className="text-xs font-mono text-stone-400 mt-0.5">
                    {new Date(page.timestamp).toLocaleDateString()} {new Date(page.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col bg-white overflow-y-auto">
            {!currentPage ? (
              <div className="flex-1 flex items-center justify-center text-stone-400 italic">
                Select or create a page to begin writing.
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
                  className="text-3xl font-serif font-bold text-stone-800 border-b border-transparent hover:border-stone-200 focus:border-stone-300 outline-none bg-transparent"
                />

                <textarea
                  value={localText}
                  onChange={(e) => {
                    setLocalText(e.target.value)
                    triggerAutoSave()
                  }}
                  placeholder="Observations and notes..."
                  className="w-full h-48 p-0 border-none outline-none resize-none font-sans text-stone-700 leading-relaxed bg-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(transparent, transparent 27px, #e5e5e5 28px)',
                    backgroundSize: '100% 28px',
                    lineHeight: '28px'
                  }}
                />

                {/* Drawing Area */}
                <div className="mt-4 border border-stone-300 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-stone-100 p-2 border-b border-stone-300 flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Drawing</span>
                    
                    <div className="flex gap-1 border-r border-stone-300 pr-4">
                      {['#222222', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea'].map(color => (
                        <button
                          key={color}
                          onClick={() => { setPenColor(color); setIsEraser(false); }}
                          className={`w-6 h-6 rounded-full border-2 ${penColor === color && !isEraser ? 'border-stone-600 scale-110' : 'border-transparent hover:scale-110'} transition-transform`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setIsEraser(true)}
                      className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition-colors ${isEraser ? 'bg-stone-300 font-bold' : 'hover:bg-stone-200'}`}
                    >
                      <span>🧼</span> Eraser
                    </button>
                    
                    <button
                      onClick={clearCanvas}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors ml-auto"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="bg-white relative">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={300}
                      className="w-full h-[300px] cursor-crosshair touch-none"
                      style={{ 
                        backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
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
                   <span className="text-xs text-stone-400 italic mt-2">Auto-saved</span>
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
