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
      } else if (chemData.id === 'hcl') {
        events.push({
          type: 'boiling_acid',
          chemicalId: chemData.id,
          effect: 'acid_vapor',
          airQualityDrop: true,
          severity: 4,
          description: {
            easy: '☠️ HCl is boiling! Invisible toxic fumes fill the air. Can cause severe lung damage.',
            moderate: 'HCl forms an azeotrope at 20.2% concentration, boiling at 108.6°C. Toxic HCl gas released.',
            complex: 'HCl(aq) → HCl(g)↑. Azeotrope at 20.2% HCl, 108.6°C. IDLH = 50 ppm. Highly toxic — corrosive to respiratory tract.',
          }
        })
      }
    }

    // SULFURIC ACID HEATING — fuming, dehydrating, dangerous
    if (chemData.id === 'sulfuric_acid') {
      if (temp >= 150 && temp < 300) {
        events.push({
          type: 'acid_fuming',
          chemicalId: 'sulfuric_acid',
          effect: 'acid_fumes',
          airQualityDrop: true,
          severity: 5,
          description: {
            easy: '☠️ Sulfuric acid is fuming! Toxic SO₃ gas is being released. Extremely dangerous — clear the area!',
            moderate: 'Above 150°C, H₂SO₄ releases SO₃ fumes. Fuming sulfuric acid (oleum) is formed. Very corrosive vapor.',
            complex: 'H₂SO₄ → SO₃(g) + H₂O at high temp. SO₃ is a lung irritant. If moisture is present: SO₃ + H₂O → H₂SO₄ mist (acid rain mechanism). IDLH SO₃ = 10 ppm.',
          }
        })
      } else if (temp >= 300) {
        events.push({
          type: 'acid_decomposing',
          chemicalId: 'sulfuric_acid',
          effect: 'dense_fumes',
          airQualityDrop: true,
          severity: 5,
          description: {
            easy: '💀 CRITICAL! Sulfuric acid is decomposing at this temperature. Dense toxic gas clouds everywhere!',
            moderate: 'Near boiling point (337°C). Concentrated SO₃ and H₂SO₄ vapors form a dense toxic mist.',
            complex: 'H₂SO₄ boiling point = 337°C. Above 300°C near-complete decomposition to SO₃ + H₂O. Dehydrating agent attacks organic material. Contact with skin causes deep chemical burns.',
          }
        })
      }
    }

    // POTASSIUM PERMANGANATE HEATING — decomposes releasing oxygen
    if (chemData.id === 'potassium_permanganate' && temp >= 240) {
      events.push({
        type: 'kmno4_decomposition',
        chemicalId: 'potassium_permanganate',
        producesGas: true,
        gasType: 'O2',
        colorChange: '#4e342e', // turns from purple to brown MnO2
        description: {
          easy: '🔴 The purple crystals are decomposing! They turn brown and release oxygen gas. Fire hazard with organics!',
          moderate: 'KMnO₄ decomposes above 240°C. Oxygen released. Brown MnO₂ residue forms.',
          complex: '2KMnO₄ → K₂MnO₄ + MnO₂ + O₂↑. Onset ~240°C. Released O₂ acts as strong oxidizer — can ignite nearby combustibles spontaneously.',
        }
      })
    }

    // NaCl HEATED — flame test (for educational display)
    if (chemData.id === 'nacl' && temp >= 200) {
      events.push({
        type: 'flame_test_sodium',
        chemicalId: 'nacl',
        effect: 'yellow_flame',
        description: {
          easy: '🟡 Yellow-orange glow! Sodium ions emit characteristic yellow light when heated.',
          moderate: 'Flame test: Na⁺ ions are excited by heat and emit yellow light (589 nm) as electrons fall back to ground state.',
          complex: 'Na+ 3s¹ → 3p¹ excitation at 589.0 nm and 589.6 nm (sodium D-lines). Atomic emission spectroscopy.',
        }
      })
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
