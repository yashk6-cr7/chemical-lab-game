/**
 * temperatureEngine.js — complete thermodynamics system (Phase 6)
 * simulation-patterns.md: pure functions, no React imports
 * All calculations use real physics approximations
 */

const ROOM_TEMP = 22   // °C
const FRIDGE_TEMP = 4  // °C
const FREEZER_TEMP = -18 // °C

// Arrhenius-inspired rate multiplier: doubles every 10°C above room temp
export function getTempMultiplier(temperature) {
  return Math.pow(2, (temperature - ROOM_TEMP) / 10)
}

/**
 * Heat a beaker on the hotplate using thermal mass model.
 * Larger/fuller beakers heat slower — realistic physics.
 *
 * @param {number} currentTemp  - beaker current temperature °C
 * @param {number} targetTemp   - hotplate setting °C
 * @param {number} totalVolume  - mL of liquid in beaker (0-100)
 * @param {number} delta        - frame delta time seconds
 * @param {number} heatMultiplier - 1 for hotplate, 3 for Bunsen burner
 */
export function heatBeaker(currentTemp, targetTemp, totalVolume, delta, heatMultiplier = 1) {
  if (Math.abs(currentTemp - targetTemp) < 0.05) return targetTemp

  // Thermal mass: more liquid = slower heating (simulation-patterns.md: realistic physics)
  const thermalMass = Math.max(5, totalVolume * 0.8 + 20)
  const rate = ((targetTemp - currentTemp) / thermalMass) * delta * 60 * heatMultiplier

  const newTemp = currentTemp + rate
  // Clamp to target (don't overshoot)
  return targetTemp > currentTemp
    ? Math.min(newTemp, targetTemp)
    : Math.max(newTemp, targetTemp)
}

/**
 * Natural cooling toward room temperature when removed from heat source.
 * ~3 minutes to cool from 100°C to room temp (realistic lab behavior)
 */
export function coolBeaker(currentTemp, delta) {
  if (currentTemp <= ROOM_TEMP + 0.1) return ROOM_TEMP
  const coolingRate = (currentTemp - ROOM_TEMP) / 180 * delta * 60
  return Math.max(ROOM_TEMP, currentTemp - coolingRate)
}

/**
 * Cool beaker in fridge (faster than natural cooling)
 */
export function coolInFridge(currentTemp, delta) {
  if (Math.abs(currentTemp - FRIDGE_TEMP) < 0.1) return FRIDGE_TEMP
  const rate = (currentTemp - FRIDGE_TEMP) / 60 * delta * 60
  return currentTemp > FRIDGE_TEMP
    ? Math.max(FRIDGE_TEMP, currentTemp - rate)
    : Math.min(FRIDGE_TEMP, currentTemp + rate)
}

/**
 * Cool beaker in freezer (fastest cooling)
 */
export function coolInFreezer(currentTemp, delta) {
  if (Math.abs(currentTemp - FREEZER_TEMP) < 0.1) return FREEZER_TEMP
  const rate = (currentTemp - FREEZER_TEMP) / 30 * delta * 60
  return currentTemp > FREEZER_TEMP
    ? Math.max(FREEZER_TEMP, currentTemp - rate)
    : Math.min(FREEZER_TEMP, currentTemp + rate)
}

/**
 * Check temperature thresholds for a beaker and return triggered events.
 * Returns array of event objects consumed by consequence engine.
 */
export function checkTemperatureThresholds(beaker, chemicalsData) {
  const events = []
  const temp = beaker.temperature

  beaker.contents.forEach(item => {
    const chemData = chemicalsData.find(c => c.id === item.chemicalId)
    if (!chemData) return

    // BOILING
    if (chemData.boilingPoint && temp >= chemData.boilingPoint) {
      if (chemData.id === 'water') {
        events.push({
          type: 'boiling',
          chemicalId: chemData.id,
          effect: 'vigorous_bubbles_steam',
          description: {
            easy: 'The water is boiling! You can see it turning into steam.',
            moderate: 'Water molecules have enough energy to escape as vapor. Boiling point is 100°C at sea level.',
            complex: 'Phase transition at vapor pressure = atmospheric pressure. ΔHvap = 40.7 kJ/mol. Bubble nucleation at dissolved gas sites.',
          }
        })
      } else if (chemData.isFlammable) {
        events.push({
          type: 'boiling_flammable',
          chemicalId: chemData.id,
          effect: 'vapor_wisps',
          airQualityDrop: true,
          description: {
            easy: 'Alcohol is boiling — making flammable vapors. Be very careful.',
            complex: 'Vapor pressure exceeds flash point threshold. Le Chatelier: heating shifts equilibrium toward vapor phase.',
          }
        })
      } else if (chemData.id === 'hydrochloric_acid') {
        events.push({
          type: 'boiling_acid',
          chemicalId: chemData.id,
          effect: 'acid_vapor',
          airQualityDrop: true,
          severity: 3,
          description: {
            easy: 'The acid is boiling — making dangerous toxic gas.',
            complex: 'HCl(aq) → HCl(g)↑. Azeotrope at 20.2% HCl, 108.6°C. Highly toxic vapor.',
          }
        })
      }
    }

    // THERMAL DECOMPOSITION
    if (chemData.id === 'baking_soda' && temp >= 50) {
      events.push({
        type: 'thermal_decomposition',
        chemicalId: 'baking_soda',
        producesGas: true,
        gasType: 'CO2',
        effect: 'slow_bubbles',
        description: {
          easy: 'The baking soda is breaking down from the heat, making CO2.',
          complex: '2NaHCO₃ → Na₂CO₃ + H₂O + CO₂↑. Endothermic decomposition. Onset ~50°C.',
        }
      })
    }

    // H2O2 ACCELERATED DECOMPOSITION
    if (chemData.id === 'hydrogen_peroxide' && temp >= 40) {
      const decompRate = getTempMultiplier(temp)
      events.push({
        type: 'accelerated_decomposition',
        chemicalId: 'hydrogen_peroxide',
        rate: decompRate,
        effect: 'rapid_bubbles',
        description: {
          easy: 'Hydrogen peroxide breaks down faster when heated.',
          complex: `2H₂O₂ → 2H₂O + O₂↑. Rate ×${decompRate.toFixed(1)} vs room temp.`,
        }
      })
    }

    // CUSO4 DEHYDRATION
    if (chemData.id === 'cuso4' && temp >= 110) {
      events.push({
        type: 'dehydration',
        chemicalId: 'cuso4',
        colorChange: '#f5f5f0', // white/colorless anhydrous
        description: {
          easy: 'The blue color disappears when heated — the water is driven out.',
          complex: 'CuSO₄·5H₂O loses water of crystallization above 110°C forming anhydrous CuSO₄. Reversible — adding water restores blue color.',
        }
      })
    }

    // SUPERCOOLING — slow reactions
    if (temp <= 10) {
      events.push({
        type: 'supercooled',
        chemicalId: chemData.id,
        rateMultiplier: Math.max(0.05, getTempMultiplier(temp)),
        description: {
          easy: 'The cold is slowing the reaction down.',
        }
      })
    }

    // FREEZING
    if (temp <= 0 && chemData.id === 'water') {
      events.push({
        type: 'freezing',
        chemicalId: 'water',
        effect: 'ice_crystals',
        description: {
          easy: 'The water is starting to freeze!',
          complex: 'Phase transition: liquid → solid. ΔHfus = 6.01 kJ/mol.',
        }
      })
    }
  })

  return events
}

/**
 * Thermal shock detection — cold glass on hot surface = crack risk
 */
export function checkThermalShock(beakerTemp, surfaceTemp) {
  return Math.abs(surfaceTemp - beakerTemp) > 40
}

/**
 * Convert celsius to fahrenheit
 */
export function toFahrenheit(celsius) {
  return celsius * 9 / 5 + 32
}

/**
 * Map temperature to a normalized 0-1 value for visual effects
 * 0 = room temp, 1 = 500°C max
 */
export function normalizeTemp(temp, max = 500) {
  return Math.max(0, Math.min(1, (temp - ROOM_TEMP) / (max - ROOM_TEMP)))
}

/**
 * Cosine palette for heating element color (shaders.md: cosine palette pattern)
 * Returns [r, g, b] normalized 0-1 for a given temperature 0-500°C
 */
export function getHeatColor(temperature) {
  const t = normalizeTemp(temperature, 500)
  // Cosine palette: a + b * cos(2π(c*t + d))
  // Tuned for black → dark red → orange → bright orange-white
  const a = [0.5,  0.0,  0.0]
  const b = [0.5,  0.0,  0.0]
  const c = [1.0,  1.0,  0.5]
  const d = [0.0,  0.33, 0.67]
  return a.map((ai, i) => Math.max(0, Math.min(1,
    ai + b[i] * Math.cos(2 * Math.PI * (c[i] * t + d[i]))
  )))
}
