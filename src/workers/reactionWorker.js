// Web Worker — runs entirely off the main thread
// NO React, NO Three.js imports allowed here
// Handles all chemistry calculations to prevent main thread blocking (simulation-patterns.md)

// ── Inline copy of chemical data (worker can't import JSON via static import) ──
// We receive chemicalsData via the first message instead of importing it
let chemicalsData = []

function getChemicalData(id) {
  return chemicalsData.find(c => c.id === id)
}


function calculateReaction(beakerContents, temperature, pressure, hasGoggles, hasGloves, hasCoat, inFumeHood) {
  let result = {
    type: 'none', intensity: 0,
    description: { easy: '', moderate: '', complex: '' },
    visualEffects: [], consequences: [],
    producesGas: false, gasType: null,
    colorChange: null, temperatureChange: 0,
    precipitateFormed: false, precipitateColor: null,
    isExplosive: false, isFire: false, isDangerous: false,
    safetyViolations: [], equation: null, logbookEntry: ''
  }

  let hasAcid = false, hasBase = false
  let strongAcid = null, strongBase = null, weakAcid = null, weakBase = null
  let hasCarbonate = false, hasMetal = false, hasOxidizer = false
  let hasCatalyst = false, hasIndicator = false, indicatorId = null
  let hasH2SO4 = false, hasWater = false, hasCuSO4 = false
  let flammableContent = null, volatileContent = null
  let totalVolume = 0, weightedPHSum = 0
  let reactants = []

  beakerContents.forEach(item => {
    const data = getChemicalData(item.chemicalId)
    if (!data) return
    reactants.push(data)
    totalVolume += item.amount
    weightedPHSum += (data.pH * item.amount)
    if (data.isAcid) { hasAcid = true; if (data.reactivityGroup === 'strong_acid') strongAcid = data; else weakAcid = data }
    if (data.isBase) { hasBase = true; if (data.reactivityGroup === 'strong_base') strongBase = data; else weakBase = data }
    if (data.reactivityGroup === 'carbonate') hasCarbonate = true
    if (data.reactivityGroup === 'metal') hasMetal = true
    if (data.isOxidizer) hasOxidizer = true
    if (data.reactivityGroup === 'catalyst') hasCatalyst = true
    if (data.reactivityGroup === 'indicator') { hasIndicator = true; indicatorId = data.id }
    if (data.id === 'sulfuric_acid') hasH2SO4 = true
    if (data.id === 'water') hasWater = true
    if (data.id === 'cuso4') hasCuSO4 = true
    if (data.isFlammable) flammableContent = data
    if (data.isVolatile) volatileContent = data
  })

  const weightedPH = totalVolume > 0 ? weightedPHSum / totalVolume : 7.0

  // RULE 1: ACID + BASE
  if (hasAcid && hasBase) {
    const acid = strongAcid || weakAcid
    const base = strongBase || weakBase
    const pHDiff = Math.abs(acid.pH - base.pH)
    result.intensity = pHDiff / 1.4
    if (strongAcid && strongBase) {
      result.type = 'neutralization_violent'
      result.intensity = Math.max(7, Math.min(9, result.intensity))
      result.temperatureChange = 18 + Math.random() * 17
      result.description.easy = 'The acid and base cancel each other out with a lot of heat produced.'
      result.description.complex = 'Exothermic neutralization. H⁺ + OH⁻ → H₂O. ΔH ≈ -57.3 kJ/mol.'
      result.equation = 'HCl + NaOH → NaCl + H₂O'
      result.colorChange = '#e8f4ff'
      result.visualEffects.push('heat_shimmer', 'steam_wisps')
      result.consequences.push('temperature_rise')
    } else {
      result.type = 'neutralization_gentle'
      result.intensity = Math.max(2, Math.min(4, result.intensity))
      result.temperatureChange = 5 + Math.random() * 7
      result.description.easy = 'Mild reaction — a little heat produced as they neutralize each other.'
      result.visualEffects.push('gentle_bubbles', 'color_shift')
    }
  }
  // RULE 2: ACID + CARBONATE
  else if (hasAcid && hasCarbonate) {
    result.type = 'acid_carbonate'
    result.intensity = strongAcid ? 8 : 4
    result.producesGas = true; result.gasType = 'CO2'
    result.temperatureChange = 2 + Math.random() * 6
    result.description.easy = 'Lots of bubbles! A gas is being made and escaping.'
    result.description.complex = 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑'
    result.equation = 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑'
    result.visualEffects.push('vigorous_bubbles', 'foam')
    if (strongAcid) result.visualEffects.push('fizz_overflow')
  }
  // RULE 3: ACID + METAL
  else if (hasAcid && hasMetal) {
    result.type = 'acid_metal'
    result.intensity = (strongAcid ? 5 : 2) * 1.5
    result.producesGas = true; result.gasType = 'H2'
    result.temperatureChange = 10 + Math.random() * 15
    result.description.easy = 'The metal is dissolving in the acid and making bubbles.'
    result.description.complex = 'Fe + 2HCl → FeCl₂ + H₂↑. Single displacement.'
    result.equation = 'Fe + 2HCl → FeCl₂ + H₂↑'
    result.visualEffects.push('rising_bubbles', 'metal_dissolving')
    result.colorChange = '#c8e6c9'
    if (!hasGoggles) result.safetyViolations.push('eye_exposure_risk')
  }
  // RULE 4: OXIDIZER + CATALYST
  else if (hasOxidizer && hasCatalyst) {
    result.type = 'catalytic_decomposition'
    result.intensity = 9; result.producesGas = true; result.gasType = 'O2'
    result.temperatureChange = 15
    result.description.easy = 'Massive foam explosion! Oxygen gas is being made very fast.'
    result.description.complex = '2H₂O₂ →(MnO₂) 2H₂O + O₂↑. Elephant toothpaste reaction.'
    result.equation = '2H₂O₂ → 2H₂O + O₂↑'
    result.visualEffects.push('foam_explosion', 'rapid_bubbles', 'steam')
    if (!hasGoggles) result.safetyViolations.push('splatter_risk')
  }
  // RULE 5: SULFURIC ACID + WATER
  else if (hasH2SO4 && hasWater) {
    result.type = 'dangerous_dilution'; result.intensity = 8
    result.temperatureChange = 40 + Math.random() * 20
    result.description.easy = 'Danger! Adding water to sulfuric acid creates enormous heat.'
    result.description.complex = 'H₂SO₄ hydration: ΔH = -880 kJ/mol. Always acid into water (AAW).'
    result.visualEffects.push('steam_explosion', 'heat_shimmer', 'splatter')
    if (!hasGoggles) result.safetyViolations.push('eye_acid_exposure')
    if (!hasGloves) result.safetyViolations.push('skin_acid_exposure')
    if (!hasCoat) result.safetyViolations.push('clothing_damage')
    result.isDangerous = true
  }
  // RULE 6: PRECIPITATION
  else if (hasCuSO4 && hasBase) {
    result.type = 'precipitation'; result.precipitateFormed = true
    result.precipitateColor = '#1e88e5'; result.intensity = 4
    result.description.easy = 'A solid is forming in the liquid and sinking to the bottom.'
    result.description.complex = 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄. Ksp = 2×10⁻¹⁹.'
    result.equation = 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄'
    result.visualEffects.push('precipitate_forming', 'color_change_blue')
  }
  // DEFAULT: NO REACTION
  else {
    result.type = 'mixing_only'; result.intensity = 0
    result.description.easy = 'The chemicals mixed together but nothing dramatic happened.'
    result.visualEffects.push('gentle_swirl')
  }

  // INDICATOR overlay
  if (hasIndicator) {
    if (indicatorId === 'litmus') {
      result.colorChange = weightedPH < 4.5 ? '#e53935' : weightedPH > 8.3 ? '#1e88e5' : '#9c27b0'
    } else if (indicatorId === 'universal_indicator') {
      if (weightedPH <= 2) result.colorChange = '#e53935'
      else if (weightedPH <= 4) result.colorChange = '#ef6c00'
      else if (weightedPH <= 6) result.colorChange = '#fdd835'
      else if (weightedPH <= 7.5) result.colorChange = '#43a047'
      else if (weightedPH <= 9.5) result.colorChange = '#1e88e5'
      else if (weightedPH <= 11.5) result.colorChange = '#5e35b1'
      else result.colorChange = '#6a1b9a'
    } else if (indicatorId === 'phenolphthalein') {
      result.colorChange = weightedPH < 8.2 ? '#ffffff' : weightedPH > 10 ? '#e91e63' : '#fce4ec'
    }
    result.type = 'indicator_response'; result.intensity = 2
    result.visualEffects.push('color_shift_dramatic')
  }

  // FLAMMABLE + HEAT
  if (flammableContent && temperature >= flammableContent.boilingPoint * 0.85) {
    result.type = 'flammable_vapor'; result.producesGas = true; result.gasType = 'vapor'
    result.description.easy = 'The liquid is evaporating and making flammable vapors.'
    result.visualEffects.push('vapor_wisps', 'shimmer')
    if (!inFumeHood) result.consequences.push('air_quality_drop', 'vapor_accumulation')
    if (temperature >= 365) { result.isFire = true; result.visualEffects.push('fire'); result.consequences.push('fire_hazard') }
  }

  // VOLATILE + OPEN AIR
  if (volatileContent && !inFumeHood) {
    if (result.type === 'mixing_only') result.type = 'volatile_exposure'
    result.intensity = Math.max(result.intensity, 3)
    result.consequences.push('air_quality_drop')
    result.visualEffects.push('vapor_drift')
  }

  const tempMultiplier = Math.pow(2, (temperature - 22) / 10)
  result.intensity = Math.min(10, result.intensity * tempMultiplier)
  if (result.temperatureChange) result.temperatureChange *= Math.min(tempMultiplier, 3)

  result.reactants = reactants
  return result
}

// ── Message handler ──
self.onmessage = function(e) {
  const { type, payload } = e.data

  switch (type) {
    case 'INIT_CHEMICALS':
      chemicalsData = payload.chemicalsData
      self.postMessage({ type: 'INIT_DONE' })
      break

    case 'CALCULATE_REACTION':
      try {
        const result = calculateReaction(
          payload.contents,
          payload.temperature,
          payload.pressure ?? 1.0,
          payload.hasGoggles,
          payload.hasGloves,
          payload.hasCoat,
          payload.inFumeHood
        )
        self.postMessage({ type: 'REACTION_RESULT', result, beakerId: payload.beakerId })
      } catch (err) {
        self.postMessage({ type: 'REACTION_ERROR', error: err.message, beakerId: payload.beakerId })
      }
      break

    default:
      break
  }
}
