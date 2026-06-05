import chemicalsData from '../data/chemicals.json'

function getChemicalName(chemicalId) {
  const data = chemicalsData.find(c => c.id === chemicalId)
  return data ? data.name : chemicalId
}

export function recordDiscovery(reactionResult, beakerContents, depthMode, wasAccident) {
  const chemicalNames = beakerContents.map(c => getChemicalName(c.chemicalId))
  const namesStr = chemicalNames.length > 2 
    ? chemicalNames.slice(0, -1).join(", ") + " and " + chemicalNames[chemicalNames.length - 1]
    : chemicalNames.join(" and ")

  let discovery

  if (reactionResult.type === "acid_carbonate") {
    discovery = `You discovered that ${namesStr} produce carbon dioxide gas.`
  } else if (reactionResult.type === "neutralization_violent") {
    discovery = `You discovered that strong acids and strong bases neutralize each other with significant heat production.`
  } else if (reactionResult.type === "neutralization_gentle") {
    discovery = `You discovered that mixing ${namesStr} results in mild neutralization.`
  } else if (reactionResult.type === "catalytic_decomposition") {
    discovery = `You discovered the elephant toothpaste reaction — rapid oxygen release.`
  } else if (reactionResult.type === "acid_metal") {
    discovery = `You discovered that acids dissolve metals like ${namesStr}, releasing hydrogen gas.`
  } else if (reactionResult.type === "precipitation") {
    discovery = `You discovered that mixing ${namesStr} forms a solid precipitate.`
  } else if (reactionResult.type === "flammable_vapor") {
    discovery = `You discovered that heating ${namesStr} produces highly flammable vapors.`
  } else if (reactionResult.type === "dangerous_dilution") {
    discovery = `You discovered that adding water directly to strong acid causes a dangerous exothermic reaction.`
  } else if (reactionResult.type.includes("indicator")) {
    discovery = `You discovered that indicators change color to show if a liquid is acid or base.`
  } else {
    discovery = `You mixed ${namesStr} and found they are chemically compatible without a dramatic reaction.`
  }

  if (wasAccident) {
    discovery = "By accident, you discovered that " + discovery.toLowerCase().replace("you discovered that ", "")
  }

  const entry = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    chemicalsUsed: chemicalNames,
    reactionType: reactionResult.type,
    discovery,
    depthMode,
    wasAccident,
    temperature: reactionResult.temperatureChange,
    intensity: reactionResult.intensity
  }

  return entry
}
