export const UNLOCK_TIERS = [
  {
    reactionsRequired: 10,
    chemicals: [
      {
        id: 'phenol_red',
        name: 'Phenol Red',
        formula: 'C₁₉H₁₄O₅S',
        description: 'pH indicator, yellow below 6.8, red above 8.4',
        color: '#FF4444',
        easyDescription: 'Changes color to show how acidic a liquid is.',
        bottleColor: '#dddddd',
        labelColor: '#ff4444',
        state: 'liquid',
        liquidOpacity: 0.9,
        hazardLevel: 2,
        pH: 7.0,
      },
      {
        id: 'copper_nitrate',
        name: 'Copper Nitrate',
        formula: 'Cu(NO₃)₂',
        description: 'Blue crystalline salt, strong oxidizer',
        color: '#4444FF',
        easyDescription: 'A blue salt that can make flames turn green.',
        bottleColor: '#dddddd',
        labelColor: '#4444FF',
        state: 'solid',
        liquidOpacity: 1.0,
        hazardLevel: 3,
        pH: 4.0,
      },
      {
        id: 'silver_nitrate',
        name: 'Silver Nitrate',
        formula: 'AgNO₃',
        description: 'Reacts with chlorides to form white precipitate',
        color: '#DDDDDD',
        easyDescription: 'Creates thick white clouds when mixed with salt.',
        bottleColor: '#333333',
        labelColor: '#999999',
        state: 'liquid',
        liquidOpacity: 0.9,
        hazardLevel: 4,
        pH: 5.5,
      },
    ]
  }
]

export function checkUnlocks(store) {
  const { reactionsDiscovered, unlockedChemicals } = store.getState()
  
  for (const tier of UNLOCK_TIERS) {
    if (reactionsDiscovered >= tier.reactionsRequired) {
      const newChems = tier.chemicals.filter(c => !unlockedChemicals.find(u => u.id === c.id))
      if (newChems.length > 0) {
        store.setState(s => ({
          unlockedChemicals: [...s.unlockedChemicals, ...newChems]
        }))
        // Animation is handled inside ChemicalShelf via Spring/presence when array length changes
      }
    }
  }
}
