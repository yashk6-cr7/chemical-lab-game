import reactionsData from '../data/reactions.json'

export function getDescription(reactionResult, depthMode) {
  if (!reactionResult || !reactionResult.description) return ""
  
  if (depthMode === 'complex') return reactionResult.description.complex
  if (depthMode === 'moderate') return reactionResult.description.moderate
  return reactionResult.description.easy
}

export function getWhatHappenedContent(reactionResult, depthMode) {
  if (!reactionResult) return null

  // Find reference data if it exists
  const refData = reactionsData.find(r => r.rule === reactionResult.type)
  
  let title = "Chemical Reaction"
  let funFact = refData ? refData.funFact : null
  let realWorldLink = refData ? refData.realWorldExample : null
  
  if (reactionResult.type === "acid_carbonate") {
    title = "You made a gas!"
  } else if (reactionResult.type.includes("neutralization")) {
    title = "Neutralization Reaction"
  } else if (reactionResult.type === "catalytic_decomposition") {
    title = "Elephant Toothpaste"
  } else if (reactionResult.type === "precipitation") {
    title = "Precipitation (Solid Formed)"
  } else if (reactionResult.type === "dangerous_dilution") {
    title = "Dangerous Dilution!"
  } else if (reactionResult.type === "mixing_only") {
    title = "Just Mixing"
  }

  // Generate dynamic follow-up questions
  const followUpQuestions = []
  
  if (reactionResult.producesGas) {
    followUpQuestions.push("What happens if you use more of the solid?")
    followUpQuestions.push("Does it make more bubbles if you heat it?")
  }
  
  if (reactionResult.temperatureChange > 0) {
    followUpQuestions.push("Where did the heat come from?")
    if (reactionResult.intensity > 5) {
      followUpQuestions.push("What if you use a weaker chemical instead?")
    }
  }

  if (reactionResult.type === "mixing_only") {
    followUpQuestions.push("Why didn't anything dramatic happen?")
    followUpQuestions.push("What could you add to trigger a reaction?")
  }

  if (followUpQuestions.length < 3) {
    followUpQuestions.push("What happens if you change the temperature?")
  }

  return {
    title,
    description: getDescription(reactionResult, depthMode),
    equation: depthMode !== 'easy' ? reactionResult.equation : null,
    funFact,
    realWorldLink,
    followUpQuestions: followUpQuestions.slice(0, 3)
  }
}
