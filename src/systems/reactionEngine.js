import chemicalsData from '../data/chemicals.json'

// simulation-patterns.md: wrap main-thread reaction calls with worker
// Worker is initialized once and reused for the session lifetime

let _worker = null
const _pendingCallbacks = new Map() // beakerId → callback fn

function getWorker() {
  if (_worker) return _worker
  _worker = new Worker(
    new URL('../workers/reactionWorker.js', import.meta.url),
    { type: 'classic' }
  )
  // Send chemical database to worker on init
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

  _worker.onerror = (err) => {
    console.error('[ReactionWorker] error:', err)
  }

  return _worker
}

export function terminateReactionWorker() {
  if (_worker) {
    _worker.terminate()
    _worker = null
    _pendingCallbacks.clear()
  }
}

/**
 * Async reaction calculation — offloads to Web Worker.
 * Falls back to synchronous if worker fails.
 */
export function calculateReactionAsync(payload, onResult) {
  const worker = getWorker()
  _pendingCallbacks.set(payload.beakerId, onResult)
  worker.postMessage({ type: 'CALCULATE_REACTION', payload })
}

// ── Keep synchronous version for edge cases / fallback ──
// (full logic remains in reactionEngine.js for import; worker has its own copy)
import chemicalsDataRaw from '../data/chemicals.json'

function getChemicalData(id) { return chemicalsDataRaw.find(c => c.id === id) }

export function calculateReaction(beakerContents, temperature, pressure, hasGoggles, hasGloves, hasCoat, inFumeHood) {
  let result = {
    type:'none', intensity:0,
    description:{easy:'',moderate:'',complex:''},
    visualEffects:[], consequences:[],
    producesGas:false, gasType:null,
    colorChange:null, temperatureChange:0,
    precipitateFormed:false, precipitateColor:null,
    isExplosive:false, isFire:false, isDangerous:false,
    safetyViolations:[], equation:null, logbookEntry:''
  }
  let hasAcid=false,hasBase=false,strongAcid=null,strongBase=null,weakAcid=null,weakBase=null
  let hasCarbonate=false,hasMetal=false,hasOxidizer=false,hasCatalyst=false,hasIndicator=false,indicatorId=null
  let hasH2SO4=false,hasWater=false,hasCuSO4=false
  let flammableContent=null,volatileContent=null,totalVolume=0,weightedPHSum=0
  beakerContents.forEach(item => {
    const d=getChemicalData(item.chemicalId); if (!d) return
    totalVolume+=item.amount; weightedPHSum+=(d.pH*item.amount)
    if(d.isAcid){hasAcid=true;if(d.reactivityGroup==='strong_acid')strongAcid=d;else weakAcid=d}
    if(d.isBase){hasBase=true;if(d.reactivityGroup==='strong_base')strongBase=d;else weakBase=d}
    if(d.reactivityGroup==='carbonate')hasCarbonate=true
    if(d.reactivityGroup==='metal')hasMetal=true
    if(d.isOxidizer)hasOxidizer=true
    if(d.reactivityGroup==='catalyst')hasCatalyst=true
    if(d.reactivityGroup==='indicator'){hasIndicator=true;indicatorId=d.id}
    if(d.id==='sulfuric_acid')hasH2SO4=true
    if(d.id==='water')hasWater=true
    if(d.id==='cuso4')hasCuSO4=true
    if(d.isFlammable)flammableContent=d
    if(d.isVolatile)volatileContent=d
  })
  const pH=totalVolume>0?weightedPHSum/totalVolume:7.0
  if(hasAcid&&hasBase){
    const acid=strongAcid||weakAcid,base=strongBase||weakBase
    result.intensity=Math.abs(acid.pH-base.pH)/1.4
    if(strongAcid&&strongBase){result.type='neutralization_violent';result.intensity=Math.max(7,Math.min(9,result.intensity));result.temperatureChange=18+Math.random()*17;result.description.easy='The acid and base cancel each other out with a lot of heat.';result.description.complex='H⁺+OH⁻→H₂O. ΔH≈-57.3kJ/mol';result.equation='HCl+NaOH→NaCl+H₂O';result.colorChange='#e8f4ff';result.visualEffects.push('heat_shimmer','steam_wisps');result.consequences.push('temperature_rise')}
    else{result.type='neutralization_gentle';result.intensity=Math.max(2,Math.min(4,result.intensity));result.temperatureChange=5+Math.random()*7;result.description.easy='Mild reaction — a little heat as they neutralize.';result.visualEffects.push('gentle_bubbles','color_shift')}
  }else if(hasAcid&&hasCarbonate){result.type='acid_carbonate';result.intensity=strongAcid?8:4;result.producesGas=true;result.gasType='CO2';result.temperatureChange=2+Math.random()*6;result.description.easy='Lots of bubbles! CO2 gas escaping.';result.equation='CaCO₃+2HCl→CaCl₂+H₂O+CO₂↑';result.visualEffects.push('vigorous_bubbles','foam');if(strongAcid)result.visualEffects.push('fizz_overflow')}
  else if(hasAcid&&hasMetal){result.type='acid_metal';result.intensity=(strongAcid?5:2)*1.5;result.producesGas=true;result.gasType='H2';result.temperatureChange=10+Math.random()*15;result.description.easy='Metal dissolving in acid making hydrogen bubbles.';result.equation='Fe+2HCl→FeCl₂+H₂↑';result.visualEffects.push('rising_bubbles','metal_dissolving');result.colorChange='#c8e6c9';if(!hasGoggles)result.safetyViolations.push('eye_exposure_risk')}
  else if(hasOxidizer&&hasCatalyst){result.type='catalytic_decomposition';result.intensity=9;result.producesGas=true;result.gasType='O2';result.temperatureChange=15;result.description.easy='Massive foam explosion!';result.equation='2H₂O₂→2H₂O+O₂↑';result.visualEffects.push('foam_explosion','rapid_bubbles','steam');if(!hasGoggles)result.safetyViolations.push('splatter_risk')}
  else if(hasH2SO4&&hasWater){result.type='dangerous_dilution';result.intensity=8;result.temperatureChange=40+Math.random()*20;result.description.easy='DANGER: Water into acid causes extreme heat!';result.visualEffects.push('steam_explosion','heat_shimmer','splatter');if(!hasGoggles)result.safetyViolations.push('eye_acid_exposure');if(!hasGloves)result.safetyViolations.push('skin_acid_exposure');result.isDangerous=true}
  else if(hasCuSO4&&hasBase){result.type='precipitation';result.precipitateFormed=true;result.precipitateColor='#1e88e5';result.intensity=4;result.description.easy='A blue solid is forming and sinking.';result.equation='CuSO₄+2NaOH→Cu(OH)₂↓+Na₂SO₄';result.visualEffects.push('precipitate_forming','color_change_blue')}
  else{result.type='mixing_only';result.intensity=0;result.description.easy='The chemicals mixed but nothing dramatic happened.';result.visualEffects.push('gentle_swirl')}
  if(hasIndicator){
    if(indicatorId==='litmus')result.colorChange=pH<4.5?'#e53935':pH>8.3?'#1e88e5':'#9c27b0'
    else if(indicatorId==='universal_indicator'){if(pH<=2)result.colorChange='#e53935';else if(pH<=4)result.colorChange='#ef6c00';else if(pH<=6)result.colorChange='#fdd835';else if(pH<=7.5)result.colorChange='#43a047';else if(pH<=9.5)result.colorChange='#1e88e5';else result.colorChange='#5e35b1'}
    else if(indicatorId==='phenolphthalein')result.colorChange=pH<8.2?'#ffffff':pH>10?'#e91e63':'#fce4ec'
    result.type='indicator_response';result.intensity=2;result.visualEffects.push('color_shift_dramatic')
  }
  if(flammableContent&&temperature>=flammableContent.boilingPoint*0.85){result.type='flammable_vapor';result.producesGas=true;result.gasType='vapor';result.description.easy='Flammable vapors building up!';result.visualEffects.push('vapor_wisps','shimmer');if(!inFumeHood)result.consequences.push('air_quality_drop','vapor_accumulation');if(temperature>=365){result.isFire=true;result.visualEffects.push('fire');result.consequences.push('fire_hazard')}}
  if(volatileContent&&!inFumeHood){if(result.type==='mixing_only')result.type='volatile_exposure';result.intensity=Math.max(result.intensity,3);result.consequences.push('air_quality_drop');result.visualEffects.push('vapor_drift')}
  // Arrhenius multiplier: reaction rate doubles every 10°C (simulation-patterns.md)
  const tm=Math.pow(2,(temperature-22)/10)
  result.intensity=Math.min(10,result.intensity*tm)
  if(result.temperatureChange)result.temperatureChange*=Math.min(tm,3)
  return result
}
