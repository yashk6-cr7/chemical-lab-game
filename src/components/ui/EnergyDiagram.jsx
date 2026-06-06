import { memo, useMemo } from 'react'

export const EnergyDiagram = memo(function EnergyDiagram({ deltaH = -57, activationEnergy = 30, isExothermic = true }) {
  const svgData = useMemo(() => {
    const svgH = 150
    const svgW = 280
    const margin = { top: 24, right: 24, bottom: 32, left: 44 }
    const plotH = svgH - margin.top - margin.bottom
    const plotW = svgW - margin.left - margin.right

    const absDeltaH = Math.abs(deltaH)
    const maxE = absDeltaH + activationEnergy + 30

    const toY = (e) => margin.top + plotH * (1 - e / maxE)

    const reactantE = absDeltaH * 0.4 + 20
    const productE = isExothermic ? reactantE - absDeltaH : reactantE + absDeltaH
    const peakE = reactantE + activationEnergy

    const rY = toY(reactantE)
    const pY = toY(productE)
    const pkY = toY(peakE)

    const x0 = margin.left
    const x1 = margin.left + plotW * 0.28
    const x2 = margin.left + plotW * 0.5
    const x3 = margin.left + plotW * 0.72
    const x4 = margin.left + plotW

    const path = [
      `M ${x0} ${rY}`,
      `L ${x1} ${rY}`,
      `C ${x1 + 18} ${rY} ${x2 - 12} ${pkY} ${x2} ${pkY}`,
      `C ${x2 + 12} ${pkY} ${x3 - 18} ${pY} ${x3} ${pY}`,
      `L ${x4} ${pY}`,
    ].join(' ')

    const arrowColor = isExothermic ? '#F59E0B' : '#60A5FA'
    const deltaLabel = `ΔH = ${deltaH > 0 ? '+' : ''}${deltaH} kJ/mol`

    return { path, rY, pY, pkY, x0, x1, x2, x3, x4, arrowColor, deltaLabel, margin, svgH, svgW, plotW }
  }, [deltaH, activationEnergy, isExothermic])

  const { path, rY, pY, pkY, x0, x1, x2, x3, x4, arrowColor, deltaLabel, margin, svgH, svgW } = svgData

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Energy Diagram</div>
      <div className="bg-black/30 rounded-xl p-2 border border-white/5">
        <svg
          width="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: 'block' }}
          aria-label="Energy level diagram"
        >
          {/* Axes */}
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={svgH - margin.bottom}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <line x1={margin.left} y1={svgH - margin.bottom} x2={svgW - margin.right} y2={svgH - margin.bottom}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

          {/* Y axis label */}
          <text
            x={8} y={svgH / 2}
            fill="rgba(255,255,255,0.3)"
            fontSize="7"
            textAnchor="middle"
            transform={`rotate(-90, 8, ${svgH / 2})`}
          >Energy</text>

          {/* X axis label */}
          <text
            x={(svgW + margin.left) / 2}
            y={svgH - 3}
            fill="rgba(255,255,255,0.3)"
            fontSize="7"
            textAnchor="middle"
          >Reaction coordinate →</text>

          {/* Energy curve */}
          <path d={path} fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />

          {/* Reactants dotted line */}
          <line x1={x0} y1={rY} x2={x1} y2={rY}
            stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3,3" />
          <text x={x0 + 2} y={rY - 4} fill="rgba(255,255,255,0.4)" fontSize="7">Reactants</text>

          {/* Products dotted line */}
          <line x1={x3} y1={pY} x2={x4} y2={pY}
            stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3,3" />
          <text x={x4 + 2} y={pY + 3} fill="rgba(255,255,255,0.4)" fontSize="7" textAnchor="start">Products</text>

          {/* Peak Ea label */}
          <text x={x2} y={pkY - 8} fill="rgba(255,255,255,0.5)" fontSize="7" textAnchor="middle">
            {`Eₐ=${activationEnergy}`}
          </text>

          {/* ΔH double-headed arrow */}
          {Math.abs(rY - pY) > 10 && (
            <g>
              <defs>
                <marker id="arrowhead-up" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <polygon points="0 4 2 0 4 4" fill={arrowColor} />
                </marker>
                <marker id="arrowhead-down" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto-start-reverse">
                  <polygon points="0 4 2 0 4 4" fill={arrowColor} />
                </marker>
              </defs>
              <line
                x1={x3 + 14} y1={rY}
                x2={x3 + 14} y2={pY}
                stroke={arrowColor} strokeWidth="1.5"
                markerStart="url(#arrowhead-down)"
                markerEnd="url(#arrowhead-up)"
              />
            </g>
          )}

          {/* ΔH label */}
          <text
            x={x3 + 18}
            y={(rY + pY) / 2 + 3}
            fill={arrowColor}
            fontSize="6.5"
            textAnchor="start"
            fontWeight="600"
          >{deltaLabel}</text>
        </svg>
      </div>
      <div className={`text-[9px] text-center font-medium ${isExothermic ? 'text-amber-400' : 'text-blue-400'}`}>
        {isExothermic ? '🔥 Exothermic — releases energy as heat' : '❄️ Endothermic — absorbs energy from surroundings'}
      </div>
    </div>
  )
})
