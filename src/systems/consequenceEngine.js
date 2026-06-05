export function runCascade(reactionResult, beakerState, safetyState, environmentState) {
  let events = []

  // 1. Check safety violations from the reaction engine directly
  if (reactionResult.safetyViolations.includes("eye_exposure_risk") && !safetyState.gogglesOn) {
    events.push({
      id: Date.now() + Math.random(),
      type: "eye_exposure",
      severity: 5,
      visualEffect: "blur_vignette_red",
      message: {
        easy: "Your eyes were exposed to chemicals. In real life: immediate blindness risk. Always wear goggles.",
        moderate: "Chemical splash to unprotected eyes. Corneal damage within seconds. Eyewash station required immediately.",
        complex: "Ocular chemical burn. pH extremes cause protein denaturation in corneal tissue. Flush with water 15-20 min. Time critical — permanent damage likely."
      },
      screenEffect: "blur_vignette_red",
      duration: 3
    })
  }

  if (reactionResult.safetyViolations.includes("eye_acid_exposure") && !safetyState.gogglesOn) {
    events.push({
      id: Date.now() + Math.random(),
      type: "eye_exposure",
      severity: 5,
      visualEffect: "blur_vignette_red",
      message: {
        easy: "Acid splashed in your eyes! Never add water to strong acid without protection.",
        moderate: "Severe acid splash to unprotected eyes. Immediate flush required.",
        complex: "Ocular acid burn causing immediate coagulation necrosis."
      },
      screenEffect: "blur_vignette_red",
      duration: 3
    })
  }

  if (reactionResult.safetyViolations.includes("skin_acid_exposure") && !safetyState.glovesOn) {
    events.push({
      id: Date.now() + Math.random(),
      type: "skin_exposure",
      severity: 4,
      visualEffect: "hand_highlight_red",
      message: {
        easy: "Chemical got on your hands. In real life this would burn your skin. Always wear gloves.",
        moderate: "Corrosive chemical skin contact. Acid denatures skin proteins. Rinse immediately with water.",
        complex: "Chemical burn. Acid disrupts peptide bonds in skin proteins. Severity depends on concentration and contact time. pH < 2 or > 12 causes immediate tissue damage."
      },
      screenEffect: "hand_highlight_red",
      duration: 2
    })
  }

  if (reactionResult.safetyViolations.includes("clothing_damage") && !safetyState.coatOn) {
    events.push({
      id: Date.now() + Math.random(),
      type: "clothing_damage",
      severity: 2,
      visualEffect: "clothing_indicator",
      message: {
        easy: "Your clothes got chemicals on them. A lab coat protects your clothing and skin underneath.",
        moderate: "Chemical spill on clothing. Remove affected garments immediately.",
        complex: "Chemical permeation of standard textiles. Lab coat required as barrier."
      },
      screenEffect: "clothing_indicator",
      duration: 2
    })
  }

  // 2. Check reaction intensity
  if (reactionResult.intensity > 7 && reactionResult.temperatureChange > 40) {
    events.push({
      id: Date.now() + Math.random(),
      type: "beaker_crack",
      severity: 3,
      visualEffect: "crack_sound_visual",
      message: {
        easy: "The beaker cracked from sudden temperature change. Heat glass slowly to avoid this.",
        moderate: "Thermal shock fracture. Rapid temperature gradient exceeds borosilicate stress tolerance.",
        complex: "Thermal stress: σ = EαΔT/(1-ν). Borosilicate fails at ~40°C/second temperature gradient. Tempered glass handles ΔT up to 150°C."
      },
      screenEffect: "crack_sound_visual",
      duration: 1
    })
  }

  // 3. Check gas production
  if (reactionResult.producesGas && !environmentState.inFumeHood) {
    if (reactionResult.gasType === "vapor" || reactionResult.type === "volatile_exposure") {
      events.push({
        id: Date.now() + Math.random(),
        type: "air_quality_drop",
        severity: 3,
        visualEffect: "vignette_yellow_pulse",
        message: {
          easy: "The air is getting bad. You should use the fume hood for chemicals like this.",
          moderate: "Volatile vapor accumulation. Fume hood required.",
          complex: "Vapor accumulation exceeding PEL (Permissible Exposure Limit). Mechanical ventilation required."
        },
        screenEffect: "vignette_yellow_pulse",
        duration: 3
      })
    }
  }

  // 4. Check fire conditions
  if (reactionResult.isFire) {
    events.push({
      id: Date.now() + Math.random(),
      type: "fire_hazard",
      severity: 5,
      visualEffect: "fire_overlay_edges",
      message: {
        easy: "Fire! The flammable chemical caught fire. Use the fire extinguisher on the left wall.",
        moderate: "Ethanol vapor ignited. Combustion reaction. Remove fuel source and use CO₂ extinguisher.",
        complex: "Exothermic combustion: C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O. Class B fire — use CO₂ or dry powder. Never water on alcohol fires."
      },
      screenEffect: "fire_overlay_edges",
      duration: 5
    })
  }

  // 5. Check overflow
  if (beakerState.totalVolume > 100) {
    events.push({
      id: Date.now() + Math.random(),
      type: "overflow",
      severity: 2,
      visualEffect: "spill_on_bench",
      message: {
        easy: "The beaker overflowed! Pay attention to how much you're adding.",
        moderate: "Volume exceeded container capacity. Containment breach.",
        complex: "Volumetric overflow. Standard protocol requires secondary containment tray."
      },
      screenEffect: "spill_on_bench",
      duration: 2
    })
  }

  return events
}
