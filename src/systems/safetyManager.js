export function checkViolations(reactionResult, safetyState) {
  let violations = []

  if (reactionResult.isDangerous && !safetyState.gogglesOn) {
    violations.push("eye_exposure")
  }

  const isCorrosive = reactionResult.type.includes("acid") || reactionResult.type.includes("base")
  if (isCorrosive && reactionResult.intensity > 3 && !safetyState.glovesOn) {
    violations.push("skin_exposure")
  }

  if (reactionResult.producesGas && !safetyState.inFumeHood) {
    violations.push("vapor_exposure")
  }

  if (reactionResult.isFire) {
    violations.push("fire_hazard")
  }

  return violations
}

export function updateAirQuality(activeReactions, inFumeHood, currentAirQuality, deltaTime) {
  let reduction = 0

  activeReactions.forEach(reaction => {
    if (reaction.producesGas || reaction.type === "volatile_exposure") {
      reduction += reaction.intensity * 0.5 * deltaTime
    }
  })

  if (inFumeHood) {
    reduction *= 0.05
  }

  let newAirQuality = currentAirQuality - reduction

  if (activeReactions.length === 0) {
    const recovery = 2 * deltaTime
    newAirQuality += recovery
  }

  return Math.max(0, Math.min(100, newAirQuality))
}
