import { create } from 'zustand'

import { calculateReaction } from '../systems/reactionEngine'
import { runCascade } from '../systems/consequenceEngine'
import { checkViolations } from '../systems/safetyManager'
import { recordReaction } from '../systems/logbook'

// Load initial logbook
const savedLogbook = localStorage.getItem('chemlab_logbook')
const initialLogbook = savedLogbook ? JSON.parse(savedLogbook) : []

const useLabStore = create((set, get) => ({
  depthMode: 'easy', // 'easy' | 'moderate' | 'complex'
  setDepthMode: (mode) => set({ depthMode: mode }),

  showLogbook: false,
  setShowLogbook: (show) => set({ showLogbook: show }),
  showWhatHappened: false,
  setShowWhatHappened: (show) => set({ showWhatHappened: show }),
  whatHappenedReaction: null,

  showHotplateUI: false,
  setShowHotplateUI: (show) => set({ showHotplateUI: show }),
  lastReactionResult: null,

  // --- Logbook additional ---
  logbookSearch: '',
  setLogbookSearch: (s) => set({ logbookSearch: s }),
  logbookFilter: 'all',
  setLogbookFilter: (f) => set({ logbookFilter: f }),

  // --- Follow-up experiment ---
  pendingExperimentSetup: null,
  setPendingExperimentSetup: (setup) => set({ pendingExperimentSetup: setup }),

  // --- Held items ---
  heldChemical: null,
  heldBottleId: null,
  isHoldingBottle: false,
  isHoldingBeaker: false,
  heldBeakerId: null,
  isPouring: false,
  hoverTarget: null,

  selectedChemical: null,
  setSelectedChemical: (chemical) => set({ selectedChemical: chemical }),

  // --- Shared hover light (performance.md: 1 light instead of 20) ---
  hoverLight: { active: false, position: [0, 0, 0], color: '#ffffff' },
  setHoverLight: (data) => set({ hoverLight: data }),

  // --- Safety & Environment ---
  safetyGear: {
    coat: false,
    goggles: false,
    gloves: false,
    coatEquippedCount: 0,
    gogglesEquippedCount: 0,
    glovesEquippedCount: 0
  },
  
  toggleCoat: () => set(state => ({
    safetyGear: { ...state.safetyGear, coat: !state.safetyGear.coat, coatEquippedCount: !state.safetyGear.coat ? state.safetyGear.coatEquippedCount + 1 : state.safetyGear.coatEquippedCount }
  })),
  toggleGoggles: () => set(state => ({
    safetyGear: { ...state.safetyGear, goggles: !state.safetyGear.goggles, gogglesEquippedCount: !state.safetyGear.goggles ? state.safetyGear.gogglesEquippedCount + 1 : state.safetyGear.gogglesEquippedCount }
  })),
  toggleGloves: () => set(state => ({
    safetyGear: { ...state.safetyGear, gloves: !state.safetyGear.gloves, glovesEquippedCount: !state.safetyGear.gloves ? state.safetyGear.glovesEquippedCount + 1 : state.safetyGear.glovesEquippedCount }
  })),

  inFumeHood: false,
  setInFumeHood: (value) => set({ inFumeHood: value }),

  airQuality: 100,
  airQualityHistory: [],
  setAirQuality: (value) => set({ airQuality: value }),

  // --- Consequence System ---
  consequenceQueue: [],
  activeConsequences: [],
  addConsequence: (event) => set(state => ({
    consequenceQueue: [...state.consequenceQueue.slice(-4), event]
  })),
  dismissConsequence: () => set(state => ({
    consequenceQueue: state.consequenceQueue.slice(1)
  })),

  // --- Emergency States ---
  isFireActive: false,
  fireBeakerId: null,
  fireIntensity: 0,
  eyeExposureActive: false,
  setFireActive: (beakerId, intensity) => set({ isFireActive: true, fireBeakerId: beakerId, fireIntensity: intensity }),
  extinguishFire: () => set({ isFireActive: false, fireIntensity: 0 }),
  setEyeExposure: (bool) => set({ eyeExposureActive: bool }),

  // --- Extinguisher ---
  isHoldingExtinguisher: false,
  extinguisherCharge: 100,
  isSpraying: false,
  pickUpExtinguisher: () => set({ isHoldingExtinguisher: true, isHoldingBottle: false, isHoldingBeaker: false }),
  putDownExtinguisher: () => set({ isHoldingExtinguisher: false, isSpraying: false }),
  sprayExtinguisher: () => set({ isSpraying: true }),
  stopSpray: () => set({ isSpraying: false }),
  updateExtinguisherCharge: (amount) => set(state => ({ extinguisherCharge: Math.max(0, state.extinguisherCharge - amount) })),

  // --- Safety Stats & Dashboard ---
  safetyStats: {
    reactionsWithGoggles: 0,
    reactionsWithoutGoggles: 0,
    reactionsWithGloves: 0,
    reactionsWithoutGloves: 0,
    reactionsWithCoat: 0,
    reactionsWithoutCoat: 0,
    totalReactions: 0,
    accidentsTotal: 0,
    fireCount: 0,
    eyeExposureCount: 0
  },
  showSafetyDashboard: false,
  accidentLog: [],
  toggleSafetyDashboard: () => set(state => ({ showSafetyDashboard: !state.showSafetyDashboard })),
  recordReaction: (hadGoggles, hadGloves, hadCoat) => set(state => ({
    safetyStats: {
      ...state.safetyStats,
      totalReactions: state.safetyStats.totalReactions + 1,
      reactionsWithGoggles: state.safetyStats.reactionsWithGoggles + (hadGoggles ? 1 : 0),
      reactionsWithoutGoggles: state.safetyStats.reactionsWithoutGoggles + (!hadGoggles ? 1 : 0),
      reactionsWithGloves: state.safetyStats.reactionsWithGloves + (hadGloves ? 1 : 0),
      reactionsWithoutGloves: state.safetyStats.reactionsWithoutGloves + (!hadGloves ? 1 : 0),
      reactionsWithCoat: state.safetyStats.reactionsWithCoat + (hadCoat ? 1 : 0),
      reactionsWithoutCoat: state.safetyStats.reactionsWithoutCoat + (!hadCoat ? 1 : 0),
    }
  })),
  recordAccident: (type, chemical, missingGear) => set(state => ({
    safetyStats: {
      ...state.safetyStats,
      accidentsTotal: state.safetyStats.accidentsTotal + 1,
      fireCount: type === 'fire_hazard' ? state.safetyStats.fireCount + 1 : state.safetyStats.fireCount,
      eyeExposureCount: type === 'eye_exposure' ? state.safetyStats.eyeExposureCount + 1 : state.safetyStats.eyeExposureCount
    },
    accidentLog: [...state.accidentLog, { type, chemical, missingGear, timestamp: Date.now() }]
  })),

  // --- Phase 6: Temperature equipment state ---
  hotplate: {
    isOn: false,
    targetTemp: 0,
    currentSurfaceTemp: 22,
    beakerOnTop: null
  },
  bunsenBurner: {
    gasOn: false,
    isLit: false,
    airflowOpen: false,
    flameIntensity: 0
  },
  fridge: {
    isOpen: false,
    beakersInside: []
  },
  freezer: {
    isOpen: false,
    beakersInside: []
  },
  thermometer: {
    isHeld: false,
    isDipped: false,
    dippedBeakerId: null,
    currentReading: 22
  },
  roomTemperature: 22,
  smokeVolume: 0,

  // Hotplate actions
  setHotplateTemp: (temp) => set(state => ({
    hotplate: { ...state.hotplate, targetTemp: Math.max(0, Math.min(500, temp)), isOn: temp > 0 }
  })),
  toggleHotplate: () => set(state => ({
    hotplate: { ...state.hotplate, isOn: !state.hotplate.isOn, targetTemp: state.hotplate.isOn ? 0 : state.hotplate.targetTemp }
  })),
  placeBeakerOnHotplate: (beakerId) => set(state => ({
    hotplate: { ...state.hotplate, beakerOnTop: beakerId }
  })),
  removeBeakerFromHotplate: () => set(state => ({
    hotplate: { ...state.hotplate, beakerOnTop: null }
  })),
  updateHotplateSurfaceTemp: (temp) => set(state => ({
    hotplate: { ...state.hotplate, currentSurfaceTemp: temp }
  })),

  // Bunsen burner actions
  lightBunsen: () => set(state => ({
    bunsenBurner: { ...state.bunsenBurner, isLit: true, flameIntensity: state.bunsenBurner.airflowOpen ? 1.0 : 0.6 }
  })),
  extinguishBunsen: () => set(state => ({
    bunsenBurner: { ...state.bunsenBurner, isLit: false, flameIntensity: 0 }
  })),
  toggleGas: () => set(state => ({
    bunsenBurner: { ...state.bunsenBurner, gasOn: !state.bunsenBurner.gasOn, isLit: state.bunsenBurner.gasOn ? false : state.bunsenBurner.isLit }
  })),
  setAirflow: (isOpen) => set(state => ({
    bunsenBurner: { ...state.bunsenBurner, airflowOpen: isOpen, flameIntensity: isOpen ? 1.0 : 0.6 }
  })),

  // Cold storage actions
  openFridge: () => set(state => ({ fridge: { ...state.fridge, isOpen: true } })),
  closeFridge: () => set(state => ({ fridge: { ...state.fridge, isOpen: false } })),
  placeBeakerInFridge: (beakerId) => set(state => ({
    fridge: { ...state.fridge, beakersInside: [...state.fridge.beakersInside, beakerId] }
  })),
  removeBeakerFromFridge: (beakerId) => set(state => ({
    fridge: { ...state.fridge, beakersInside: state.fridge.beakersInside.filter(id => id !== beakerId) }
  })),
  openFreezer: () => set(state => ({ freezer: { ...state.freezer, isOpen: true } })),
  closeFreezer: () => set(state => ({ freezer: { ...state.freezer, isOpen: false } })),
  placeBeakerInFreezer: (beakerId) => set(state => ({
    freezer: { ...state.freezer, beakersInside: [...state.freezer.beakersInside, beakerId] }
  })),
  removeBeakerFromFreezer: (beakerId) => set(state => ({
    freezer: { ...state.freezer, beakersInside: state.freezer.beakersInside.filter(id => id !== beakerId) }
  })),

  // Thermometer actions
  pickUpThermometer: () => set(state => ({
    thermometer: { ...state.thermometer, isHeld: true }
  })),
  putDownThermometer: () => set(state => ({
    thermometer: { ...state.thermometer, isHeld: false, isDipped: false, dippedBeakerId: null }
  })),
  dipThermometer: (beakerId) => set(state => ({
    thermometer: { ...state.thermometer, isDipped: true, dippedBeakerId: beakerId }
  })),
  undipThermometer: () => set(state => ({
    thermometer: { ...state.thermometer, isDipped: false, dippedBeakerId: null }
  })),
  updateThermometerReading: (temp) => set(state => ({
    thermometer: { ...state.thermometer, currentReading: temp }
  })),

  // Update beaker temperature
  updateBeakerTemp: (beakerId, temp) => set(state => ({
    beakers: state.beakers.map(b => b.id === beakerId ? { ...b, temperature: temp } : b)
  })),

  // --- Queues & Trackers ---
  pendingConsequences: [],
  activeSafetyViolations: [],
  currentReactions: [],
  logbookEntries: initialLogbook,

  // --- Phase 9: Mystery Substance & Advanced Lab ---
  mysterySubstance: {
    isActive: false,
    substanceId: null,
    label: 'Unknown A',
    testsPerformed: [],
    testResults: {},
    hypothesis: null,
    isSolved: false,
    revealedName: null,
  },
  spawnMysterySubstance: () => {
    const candidates = ['HCl', 'NaOH', 'CuSO4', 'NaCl', 'Ammonia', 'Na2S2O3']
    const substanceId = candidates[Math.floor(Math.random() * candidates.length)]
    set({
      mysterySubstance: {
        isActive: true, substanceId, label: 'Unknown A',
        testsPerformed: [], testResults: {}, hypothesis: null,
        isSolved: false, revealedName: null,
      }
    })
  },
  performMysteryTest: (testType, result) => set(s => ({
    mysterySubstance: {
      ...s.mysterySubstance,
      testsPerformed: [...s.mysterySubstance.testsPerformed, testType],
      testResults: { ...s.mysterySubstance.testResults, [testType]: result },
    }
  })),
  setMysteryHypothesis: (chemId) => set(s => ({
    mysterySubstance: { ...s.mysterySubstance, hypothesis: chemId }
  })),
  solveMystery: (correct) => set(s => ({
    mysterySubstance: { ...s.mysterySubstance, isSolved: true,
      revealedName: correct ? s.mysterySubstance.substanceId : null }
  })),

  flameTestActive: false,
  flameTestChemicalId: null,
  setFlameTest: (chemId) => set({ flameTestActive: !!chemId, flameTestChemicalId: chemId }),

  titration: {
    isActive: false,
    buretteChemicalId: null,
    flaskBeakerId: null,
    volumeAdded: 0,
    dropMode: false,
    endpointReached: false,
  },
  setTitrationActive: (buretteChemId, flaskBeakerId) => set({
    titration: { isActive: true, buretteChemicalId: buretteChemId,
                 flaskBeakerId, volumeAdded: 0, dropMode: false, endpointReached: false }
  }),
  updateTitration: (updates) => set(s => ({
    titration: { ...s.titration, ...updates }
  })),

  isPipetteActive: false,
  pipetteContents: null, // { chemicalId, volume, color }
  setPipetteActive: (v) => set({ isPipetteActive: v }),
  setPipetteContents: (contents) => set({ pipetteContents: contents }),

  unlockedChemicals: [],
  reactionsDiscovered: 0,

  labNotebook: {
    show: false,
    pages: [],
    activePage: null,
  },
  setShowNotebook: (v) => set(s => ({ labNotebook: { ...s.labNotebook, show: v } })),
  setNotebookPages: (pages) => set(s => ({ labNotebook: { ...s.labNotebook, pages } })),
  addNotebookPage: (page) => set(s => ({
    labNotebook: { ...s.labNotebook, pages: [...s.labNotebook.pages, page] }
  })),
  updateNotebookPage: (id, updates) => set(s => ({
    labNotebook: {
      ...s.labNotebook,
      pages: s.labNotebook.pages.map(p => p.id === id ? { ...p, ...updates } : p)
    }
  })),

  queueConsequence: (event) => set(state => ({ pendingConsequences: [...state.pendingConsequences, event] })),
  processNextConsequence: () => set(state => ({ pendingConsequences: state.pendingConsequences.slice(1) })),
  clearConsequences: () => set({ pendingConsequences: [] }),

  addActiveReaction: (beakerId, reaction) => set(state => ({
    currentReactions: [...state.currentReactions.filter(r => r.beakerId !== beakerId), { beakerId, ...reaction }]
  })),
  removeActiveReaction: (beakerId) => set(state => ({
    currentReactions: state.currentReactions.filter(r => r.beakerId !== beakerId)
  })),

  // --- Beakers ---
  beakers: [
    { id: 'beaker_0', position: [-2, 0.92, 0],   contents: [], totalVolume: 0, mixedColor: '#ffffff', temperature: 22, reactionResult: null, isCracked: false },
    { id: 'beaker_1', position: [-0.7, 0.92, 0], contents: [], totalVolume: 0, mixedColor: '#ffffff', temperature: 22, reactionResult: null, isCracked: false },
    { id: 'beaker_2', position: [0.7, 0.92, 0],  contents: [], totalVolume: 0, mixedColor: '#ffffff', temperature: 22, reactionResult: null, isCracked: false },
    { id: 'beaker_3', position: [2, 0.92, 0],    contents: [], totalVolume: 0, mixedColor: '#ffffff', temperature: 22, reactionResult: null, isCracked: false },
  ],

  // --- Actions ---
  setHoverTarget: (target) => set({ hoverTarget: target }),

  pickUpBottle: (chemical) => set({
    heldChemical: chemical,
    heldBottleId: chemical.id,
    isHoldingBottle: true,
    isHoldingBeaker: false,
    heldBeakerId: null
  }),
  putDownBottle: () => set({ heldChemical: null, heldBottleId: null, isHoldingBottle: false }),

  pickUpBeaker: (beakerId) => set({
    isHoldingBeaker: true,
    heldBeakerId: beakerId,
    isHoldingBottle: false,
    heldBottleId: null,
    heldChemical: null
  }),
  putDownBeaker: (beakerId, newPosition) => set((state) => ({
    isHoldingBeaker: false,
    heldBeakerId: null,
    beakers: state.beakers.map(b => b.id === beakerId ? { ...b, position: newPosition } : b)
  })),

  pourIntoBeaker: (beakerId, chemical, amount, newColor) => {
    const state = get()
    const beakerIndex = state.beakers.findIndex(b => b.id === beakerId)
    if (beakerIndex === -1) return
    const beaker = state.beakers[beakerIndex]

    const existingVolume = beaker.totalVolume
    const newVolume = Math.min(100, existingVolume + amount)
    const newContents = [...beaker.contents, { chemicalId: chemical.id, amount, color: chemical.color }]

    const safetyState = { 
      gogglesOn: state.safetyGear.goggles, 
      glovesOn: state.safetyGear.gloves, 
      coatOn: state.safetyGear.coat 
    }
    const envState    = { inFumeHood: state.inFumeHood, airQuality: state.airQuality }

    // reaction engine runs synchronously for now; Phase 4 worker wraps this
    const reactionResult = calculateReaction(
      newContents, beaker.temperature, 1.0,
      safetyState.gogglesOn, safetyState.glovesOn, safetyState.coatOn,
      envState.inFumeHood
    )

    const simulatedBeakerState = { ...beaker, totalVolume: newVolume, contents: newContents }
    const consequenceEvents = runCascade(reactionResult, simulatedBeakerState, safetyState, envState)
    const violations = checkViolations(reactionResult, safetyState)

    // Phase 7: Track reaction stats and queue consequences
    state.recordReaction(safetyState.gogglesOn, safetyState.glovesOn, safetyState.coatOn)
    
    if (consequenceEvents.length > 0) {
      consequenceEvents.forEach(event => {
        state.addConsequence(event)
        // Extract missing gear for the accident log
        let missing = []
        if (!safetyState.gogglesOn && event.id === 'eye_exposure') missing.push('Goggles')
        if (!safetyState.glovesOn && event.id.includes('skin')) missing.push('Gloves')
        if (!safetyState.coatOn && (event.id.includes('clothing') || event.id.includes('body'))) missing.push('Lab Coat')
        
        state.recordAccident(event.id, chemical.name, missing)
      })
    }

    const wasAccident = consequenceEvents.length > 0
    // Record reaction and trigger WhatHappened panel
    recordReaction(reactionResult, newContents, { getState: get, setState: set })
    set({
      showWhatHappened: true,
      whatHappenedReaction: reactionResult,
    })

    const finalColor = reactionResult.colorChange || newColor || beaker.mixedColor

    set(state => {
      const updatedBeakers = [...state.beakers]
      updatedBeakers[beakerIndex] = {
        ...beaker,
        totalVolume: newVolume,
        mixedColor: finalColor,
        contents: newContents,
        reactionResult
      }
      return {
        beakers: updatedBeakers,
        pendingConsequences: [...state.pendingConsequences, ...consequenceEvents],
        activeSafetyViolations: [...new Set([...state.activeSafetyViolations, ...violations])],
        lastReactionResult: reactionResult,
        currentReactions: reactionResult.intensity > 0
          ? [...state.currentReactions.filter(r => r.beakerId !== beakerId), { beakerId, ...reactionResult }]
          : state.currentReactions
      }
    })
  },

  rinseBeaker: (beakerId) => set((state) => ({
    beakers: state.beakers.map(b =>
      b.id === beakerId
        ? { ...b, contents: [], totalVolume: 0, mixedColor: '#ffffff', reactionResult: null, temperature: 22 }
        : b
    ),
    currentReactions: state.currentReactions.filter(r => r.beakerId !== beakerId)
  })),

  setIsPouring: (pouring) => set({ isPouring: pouring }),
}))

export default useLabStore

// --- Pre-bound selectors ---
export const useBeakers     = () => useLabStore(state => state.beakers)
export const useSafetyGear  = () => useLabStore(state => state.safetyGear)
export const useActiveEffects = () => useLabStore(state => state.currentReactions)
export const useHotplate      = () => useLabStore(state => state.hotplate)
export const useFridge        = () => useLabStore(state => state.fridge)
export const useFreezer       = () => useLabStore(state => state.freezer)
export const useThermometer   = () => useLabStore(state => state.thermometer)
export const useHoverLight    = () => useLabStore(state => state.hoverLight)

// Phase 9 selectors
export const useMysterySubstance = () => useLabStore(s => s.mysterySubstance)
export const useTitration = () => useLabStore(s => s.titration)
export const useLabNotebook = () => useLabStore(s => s.labNotebook)
export const useUnlocked = () => useLabStore(s => s.unlockedChemicals)

// Phase 8 selectors
export const useDepthMode = () => useLabStore(s => s.depthMode)
export const useWhatHappened = () => useLabStore(s => s.whatHappenedReaction)
export const useLogbook = () => useLabStore(s => s.logbookEntries)
export const usePendingSetup = () => useLabStore(s => s.pendingExperimentSetup)
