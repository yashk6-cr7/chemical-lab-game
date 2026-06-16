import chemicalsData from '../data/chemicals.json'

// simulation-patterns.md: wrap main-thread reaction calls with worker
let _worker = null
const _pendingCallbacks = new Map()

function getWorker() {
  if (_worker) return _worker
  _worker = new Worker(
    new URL('../workers/reactionWorker.js', import.meta.url),
    { type: 'classic' }
  )
  _worker.postMessage({ type: 'INIT_CHEMICALS', payload: { chemicalsData } })
  _worker.onmessage = (e) => {
    const { type, result, beakerId, error } = e.data
    if (type === 'REACTION_RESULT' || type === 'REACTION_ERROR') {
      const cb = _pendingCallbacks.get(beakerId)
      if (cb) {
        _pendingCallbacks.delete(beakerId)
        if (type === 'REACTION_RESULT') cb(null, result)
        else cb(new Error(error), null)
      }
    }
  }
  _worker.onerror = (err) => console.error('[ReactionWorker] error:', err)
  return _worker
}

export function terminateReactionWorker() {
  if (_worker) { _worker.terminate(); _worker = null; _pendingCallbacks.clear() }
}

export function calculateReactionAsync(payload, onResult) {
  const worker = getWorker()
  _pendingCallbacks.set(payload.beakerId, onResult)
  worker.postMessage({ type: 'CALCULATE_REACTION', payload })
}

// ── Synchronous version (fallback + direct calls) ──────────────────────────
import chemicalsDataRaw from '../data/chemicals.json'
function getChemicalData(id) { return chemicalsDataRaw.find(c => c.id === id) }

export function calculateReaction(beakerContents, temperature, pressure = 1.0, hasGoggles = false, hasGloves = false, hasCoat = false, inFumeHood = false) {
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

  // ── Classify all chemicals in the beaker ─────────────────────────────────
  let hasAcid = false, hasBase = false
  let strongAcid = null, weakAcid = null, strongBase = null, weakBase = null
  let hasCarbonate = false, hasMetal = false, hasOxidizer = false
  let hasCatalyst = false, hasIndicator = false, indicatorId = null
  let hasH2SO4 = false, hasHCl = false, hasNaOH = false, hasWater = false
  let hasCuSO4 = false, hasKMnO4 = false, hasH2O2 = false
  let hasEthanol = false, hasNaCl = false, hasBakingSoda = false
  let hasAmmonia = false, hasIronFilings = false, hasNa2S2O3 = false
  let flammableContent = null, volatileContent = null
  let totalVolume = 0, weightedPHSum = 0

  beakerContents.forEach(item => {
    const d = getChemicalData(item.chemicalId)
    if (!d) return
    totalVolume += item.amount
    weightedPHSum += (d.pH * item.amount)
    if (d.isAcid) { hasAcid = true; if (d.reactivityGroup === 'strong_acid') strongAcid = d; else weakAcid = d }
    if (d.isBase) { hasBase = true; if (d.reactivityGroup === 'strong_base') strongBase = d; else weakBase = d }
    if (d.reactivityGroup === 'carbonate') hasCarbonate = true
    if (d.reactivityGroup === 'metal') hasMetal = true
    if (d.isOxidizer) hasOxidizer = true
    if (d.reactivityGroup === 'catalyst') hasCatalyst = true
    if (d.reactivityGroup === 'indicator') { hasIndicator = true; indicatorId = d.id }
    if (d.id === 'sulfuric_acid') hasH2SO4 = true
    if (d.id === 'hcl') hasHCl = true
    if (d.id === 'naoh') hasNaOH = true
    if (d.id === 'water') hasWater = true
    if (d.id === 'cuso4') hasCuSO4 = true
    if (d.id === 'potassium_permanganate') hasKMnO4 = true
    if (d.id === 'h2o2') hasH2O2 = true
    if (d.id === 'ethanol') hasEthanol = true
    if (d.id === 'nacl') hasNaCl = true
    if (d.id === 'baking_soda') hasBakingSoda = true
    if (d.id === 'ammonia') hasAmmonia = true
    if (d.id === 'iron_filings') hasIronFilings = true
    if (d.id === 'sodium_thiosulfate') hasNa2S2O3 = true
    if (d.isFlammable) flammableContent = d
    if (d.isVolatile) volatileContent = d
  })

  const pH = totalVolume > 0 ? weightedPHSum / totalVolume : 7.0

  // ── REACTION PRIORITY (most dangerous / most specific first) ─────────────

  // 1. WATER INTO CONCENTRATED SULFURIC ACID — most dangerous lab reaction
  if (hasH2SO4 && hasWater) {
    result.type = 'dangerous_dilution'
    result.intensity = 10
    result.temperatureChange = 80 + Math.random() * 40  // 337°C boiling point, can boil water violently
    result.isDangerous = true
    result.isFire = temperature > 200  // at high temps, dense H₂SO₄ fumes oxidize organics → fire
    result.producesGas = true
    result.gasType = 'SO3_steam'
    result.colorChange = '#fff8dc'
    result.description.easy = '🔥 DANGER! Water in sulfuric acid causes a violent steam explosion! Acid splashes everywhere!'
    result.description.moderate = 'H₂SO₄ is highly exothermic when diluted. Water instantly boils and sprays superheated acid droplets.'
    result.description.complex = 'Concentrated H₂SO₄ (density 1.84 g/mL) + H₂O → extremely exothermic. ΔH ≈ -880 kJ/mol. Water boils instantly. Rule: always add acid to water, NEVER water to acid!'
    result.equation = 'H₂SO₄(conc) + H₂O → H₃O⁺ + HSO₄⁻  [VIOLENT, ΔH = -880 kJ/mol]'
    result.visualEffects.push('steam_explosion', 'acid_splatter', 'heat_shimmer', 'violent_boiling')
    result.consequences.push('temperature_rise', 'acid_spray', 'fire_hazard')
    if (!hasGoggles) result.safetyViolations.push('eye_acid_exposure')
    if (!hasGloves) result.safetyViolations.push('skin_acid_burn')
    if (!hasCoat) result.safetyViolations.push('clothing_damage')
  }

  // 2. ELEPHANT TOOTHPASTE — H₂O₂ + MnO₂ catalyst
  else if (hasH2O2 && hasCatalyst) {
    result.type = 'catalytic_decomposition'
    result.intensity = 9
    result.producesGas = true
    result.gasType = 'O2'
    result.temperatureChange = 20 + Math.random() * 15
    result.colorChange = '#ffffff'
    result.description.easy = '🫧 MASSIVE foam explosion! Oxygen gas is being released so fast it makes a huge foam pillar!'
    result.description.moderate = 'MnO₂ catalyzes rapid H₂O₂ decomposition. Oxygen is released much faster than it can dissolve — forming foam.'
    result.description.complex = '2H₂O₂ → 2H₂O + O₂↑. MnO₂ lowers activation energy from ~75 kJ/mol to ~58 kJ/mol. Heterogeneous catalysis. Rate ∝ [H₂O₂]. Heat generated: ΔH = -98 kJ/mol'
    result.equation = '2H₂O₂(aq) →[MnO₂] 2H₂O + O₂↑'
    result.visualEffects.push('foam_explosion', 'rapid_bubbles', 'steam')
    if (!hasGoggles) result.safetyViolations.push('splatter_risk')
  }

  // 3. STRONG ACID + STRONG BASE — violent neutralization
  else if (strongAcid && strongBase) {
    result.type = 'neutralization_violent'
    result.intensity = 8
    result.temperatureChange = 18 + Math.random() * 12  // ΔH = -57.3 kJ/mol → raises ~12-18°C for typical volumes
    result.colorChange = '#e8f4ff'
    result.description.easy = '💥 Hot! The acid and base react explosively. The liquid heats up fast — steam wisps appear!'
    result.description.moderate = 'Strong acid + strong base = rapid neutralization. The heat released can raise temperature by 20°C. NaCl and water form.'
    result.description.complex = 'H⁺ + OH⁻ → H₂O. ΔH_neutralization = -57.3 kJ/mol. Enthalpy is liberated as kinetic energy. Strong electrolytes fully dissociate. Salt + water formed.'
    result.equation = hasH2SO4 ? 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O' : 'HCl + NaOH → NaCl + H₂O'
    result.visualEffects.push('heat_shimmer', 'steam_wisps', 'vigorous_bubbles')
    result.consequences.push('temperature_rise')
    if (!hasGoggles) result.safetyViolations.push('splash_risk')
  }

  // 4. STRONG ACID + CARBONATE (fizzing)
  else if (strongAcid && hasCarbonate) {
    result.type = 'acid_carbonate_strong'
    result.intensity = 8
    result.producesGas = true
    result.gasType = 'CO2'
    result.temperatureChange = -3 + Math.random() * 2  // slightly endothermic overall
    result.colorChange = '#f8f8f8'
    result.description.easy = '🌊 BIG fizz! CO₂ bubbles everywhere — the solid is dissolving and the foam might overflow!'
    result.description.moderate = 'Strong acid aggressively attacks carbonate. CO₂ released rapidly. Can overflow if too much acid added.'
    result.description.complex = 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑. H₂SO₄ reaction is self-limiting: CaSO₄ (insoluble) coats solid, slowing reaction. HCl reacts fully.'
    result.equation = 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑'
    result.visualEffects.push('vigorous_bubbles', 'foam', 'fizz_overflow')
  }

  // 5. WEAK ACID + CARBONATE (gentle fizzing)
  else if (weakAcid && hasCarbonate) {
    result.type = 'acid_carbonate_gentle'
    result.intensity = 4
    result.producesGas = true
    result.gasType = 'CO2'
    result.temperatureChange = -1
    result.colorChange = '#fafff8'
    result.description.easy = '🫧 Gentle fizzing! CO₂ bubbles slowly. This is the classic vinegar + baking soda reaction!'
    result.description.moderate = 'Weak acid reacts with carbonate more slowly. Steady CO₂ bubbles, no overflow risk.'
    result.description.complex = 'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂↑. Rate limited by weak acid dissociation equilibrium. Ka = 1.8×10⁻⁵.'
    result.equation = 'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂↑'
    result.visualEffects.push('gentle_bubbles', 'slow_foam')
  }

  // 6. ACID + IRON — hydrogen gas production
  else if (hasAcid && hasIronFilings) {
    const acidStrength = strongAcid ? 1.5 : 0.6
    result.type = 'acid_metal'
    result.intensity = strongAcid ? 7 : 3
    result.producesGas = true
    result.gasType = 'H2'
    result.temperatureChange = 15 * acidStrength + Math.random() * 10
    result.colorChange = '#c8e6c9'
    result.description.easy = '⚗️ The iron is dissolving! Hydrogen bubbles are rising. The solution turns green.'
    result.description.moderate = 'Iron displaced from acid. H₂ gas produced. Solution turns green (Fe²⁺ ions).'
    result.description.complex = 'Fe + 2HCl → FeCl₂ + H₂↑. Fe²⁺ gives pale green color. With H₂SO₄: Fe + H₂SO₄ → FeSO₄ + H₂↑. H₂ is flammable — careful with Bunsen burners!'
    result.equation = 'Fe + 2HCl → FeCl₂ + H₂↑'
    result.visualEffects.push('rising_bubbles', 'metal_dissolving', 'color_shift')
    if (!hasGoggles) result.safetyViolations.push('eye_exposure_risk')
    if (result.intensity > 5) result.consequences.push('flammable_gas_H2')
  }

  // 7. CuSO₄ + NaOH — blue precipitate (copper hydroxide)
  else if (hasCuSO4 && hasBase) {
    result.type = 'precipitation'
    result.precipitateFormed = true
    result.precipitateColor = '#1e88e5'
    result.intensity = 5
    result.colorChange = '#1565c0'
    result.description.easy = '🔵 A vivid blue solid appears! Copper hydroxide precipitates out of solution.'
    result.description.moderate = 'Cu²⁺ ions react with OH⁻ to form an insoluble blue solid. The solution clears as the precipitate sinks.'
    result.description.complex = 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄. Cu(OH)₂ is bright blue, insoluble. If heated above 80°C, decomposes: Cu(OH)₂ → CuO + H₂O (black powder).'
    result.equation = 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄'
    result.visualEffects.push('precipitate_forming', 'color_change_blue', 'cloudiness')
    if (temperature > 80) {
      result.colorChange = '#111111'
      result.description.easy += ' At this heat, the blue solid turns BLACK — copper oxide is forming!'
      result.description.complex += ' Above 80°C: Cu(OH)₂ → CuO (black) + H₂O'
      result.visualEffects.push('color_darkening')
    }
  }

  // 8. HCl + Ammonia — white smoke (ammonium chloride)
  else if (hasHCl && hasAmmonia) {
    result.type = 'smoke_reaction'
    result.intensity = 6
    result.producesGas = true
    result.gasType = 'NH4Cl_smoke'
    result.colorChange = '#f5f5f5'
    result.description.easy = '💨 Dense white smoke! HCl and ammonia gases combine in mid-air to form white particles.'
    result.description.moderate = 'HCl fumes + ammonia vapor → white solid particles of NH₄Cl. Dense white smoke with no flame.'
    result.description.complex = 'NH₃(g) + HCl(g) → NH₄Cl(s)↓. Reaction occurs in gas phase above liquid. White crystalline deposit on glass. Kp is very large.'
    result.equation = 'NH₃ + HCl → NH₄Cl (white smoke)'
    result.visualEffects.push('white_smoke', 'dense_vapor', 'fumes')
    if (!inFumeHood) result.consequences.push('air_quality_drop')
    if (!hasGoggles) result.safetyViolations.push('irritant_vapor')
  }

  // 9. Na₂S₂O₃ + HCl — iodine clock / sulfur precipitation (turns milky)
  else if (hasNa2S2O3 && hasAcid) {
    result.type = 'clock_reaction'
    result.intensity = 3
    result.precipitateFormed = true
    result.precipitateColor = '#ffff99'
    result.colorChange = '#ffffcc'
    result.description.easy = '⏱️ The solution slowly goes cloudy/milky. This is the "disappearing cross" reaction — rate depends on temperature!'
    result.description.moderate = 'Sulfur precipitates as tiny particles, scattering light and making the solution cloudy. Rate increases sharply with temperature.'
    result.description.complex = 'Na₂S₂O₃ + 2HCl → 2NaCl + SO₂↑ + S↓ + H₂O. Colloidal sulfur forms. Rate ∝ [H⁺][S₂O₃²⁻]. Doubling T ≈ halves reaction time (Arrhenius). Classic kinetics demo.'
    result.equation = 'Na₂S₂O₃ + 2HCl → 2NaCl + S↓ + SO₂↑ + H₂O'
    result.visualEffects.push('cloudiness', 'slow_precipitation', 'milky_haze')
    if (!inFumeHood) result.consequences.push('air_quality_drop')  // SO₂ produced
  }

  // 10. KMnO₄ in acid — strong oxidizer decolorizes
  else if (hasKMnO4 && hasAcid) {
    result.type = 'oxidation_decolorize'
    result.intensity = 6
    result.colorChange = '#c8e6c9'  // purple → nearly colorless in strong acid
    result.description.easy = '🟣➡️🟢 The vivid purple fades! Permanganate is being used up as a powerful oxidizer.'
    result.description.moderate = 'MnO₄⁻ (purple) reduced to Mn²⁺ (colorless/pale pink) in acid. Dramatic color loss signals the oxidizer is exhausted.'
    result.description.complex = 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O. E° = +1.51V. In neutral/basic: MnO₂ (brown precipitate). In strong acid: Mn²⁺ (colorless). Used in titrations.'
    result.equation = '2KMnO₄ + 5H₂O₂ + 3H₂SO₄ → 2MnSO₄ + K₂SO₄ + 5O₂ + 8H₂O'
    result.visualEffects.push('color_fade_dramatic', 'decolorization')
  }

  // 11. GENTLE ACID-BASE (weak + weak)
  else if (hasAcid && hasBase) {
    result.type = 'neutralization_gentle'
    result.intensity = 3
    result.temperatureChange = 4 + Math.random() * 5
    result.description.easy = '🌡️ Mild warmth as weak acid and weak base slowly cancel each other out.'
    result.description.moderate = 'Partial neutralization. Weak electrolytes partially dissociate — buffer system may form.'
    result.description.complex = 'Buffer equilibrium: HA + B ⇌ A⁻ + BH⁺. Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA]).'
    result.equation = 'CH₃COOH + NH₃ → CH₃COONH₄'
    result.visualEffects.push('gentle_bubbles', 'color_shift')
  }

  // 12. ETHANOL HEATED — vapors, fire risk
  else if (hasEthanol && temperature >= 78) {
    result.type = 'flammable_vapor'
    result.intensity = 6
    result.producesGas = true
    result.gasType = 'ethanol_vapor'
    result.description.easy = '🔥 Ethanol is boiling! Flammable vapor is filling the air. Any spark will ignite it!'
    result.description.moderate = 'Ethanol boils at 78°C. Vapor density is heavier than air. Flash point 13°C — already exceeded.'
    result.description.complex = 'C₂H₅OH → C₂H₅OH(g). Flash point 13°C, auto-ignition 365°C. Vapor disperses and forms explosive mixture with air (LEL 3.3%, UEL 19%).'
    result.visualEffects.push('vapor_wisps', 'shimmer', 'fumes')
    if (!inFumeHood) result.consequences.push('air_quality_drop', 'vapor_accumulation')
    if (temperature >= 200) {
      result.isFire = true
      result.intensity = 10
      result.visualEffects.push('fire', 'explosion_risk')
      result.consequences.push('fire_hazard')
    }
  }

  // 13. NO REACTION — just mixing
  else {
    result.type = 'mixing_only'
    result.intensity = 0
    result.description.easy = 'The chemicals mixed but nothing interesting happened.'
    result.description.moderate = 'No reactive groups present. Dissolution or dilution only.'
    result.description.complex = 'No redox, acid-base, or precipitation reaction possible between these reactants.'
    result.visualEffects.push('gentle_swirl')
  }

  // ── INDICATOR OVERRIDE (always applied if present) ────────────────────────
  if (hasIndicator) {
    if (indicatorId === 'litmus') {
      result.colorChange = pH < 4.5 ? '#e53935' : pH > 8.3 ? '#1e88e5' : '#9c27b0'
    } else if (indicatorId === 'universal_indicator') {
      if (pH <= 2) result.colorChange = '#e53935'
      else if (pH <= 4) result.colorChange = '#ef6c00'
      else if (pH <= 6) result.colorChange = '#fdd835'
      else if (pH <= 7.5) result.colorChange = '#43a047'
      else if (pH <= 9.5) result.colorChange = '#1e88e5'
      else result.colorChange = '#5e35b1'
    } else if (indicatorId === 'phenolphthalein') {
      result.colorChange = pH < 8.2 ? '#ffffff' : pH > 10 ? '#e91e63' : '#fce4ec'
    }
    if (result.type === 'mixing_only') {
      result.type = 'indicator_response'
      result.intensity = 2
      result.description.easy = 'The indicator changed color to show the pH of the solution!'
    }
    result.visualEffects.push('color_shift_dramatic')
  }

  // ── TEMPERATURE EFFECTS ON REACTIONS (Arrhenius multiplier) ──────────────
  // Rate approximately doubles every 10°C (Arrhenius approximation)
  const tempMultiplier = Math.pow(2, (temperature - 22) / 10)
  result.intensity = Math.min(10, result.intensity * tempMultiplier)
  if (result.temperatureChange) result.temperatureChange *= Math.min(tempMultiplier, 3)

  // ── VOLATILE CONTENT AIR QUALITY ──────────────────────────────────────────
  if (volatileContent && !inFumeHood && result.type === 'mixing_only') {
    result.type = 'volatile_exposure'
    result.intensity = Math.max(result.intensity, 3)
    result.consequences.push('air_quality_drop')
    result.visualEffects.push('vapor_drift')
  }

  return result
}
