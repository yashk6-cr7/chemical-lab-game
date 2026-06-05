import { useMemo } from 'react'
import ChemicalBottle from './ChemicalBottle'
import chemicalsData from '../../data/chemicals.json'
import useLabStore from '../../store/useLabStore'

const upperShelfIds = [
  'water', 'hcl', 'naoh', 'vinegar', 'baking_soda', 
  'h2o2', 'ethanol', 'cuso4', 'nacl', 'litmus'
]
const lowerShelfIds = [
  'phenolphthalein', 'sulfuric_acid', 'ammonia', 'iron_filings', 'calcium_carbonate', 
  'manganese_dioxide', 'universal_indicator', 'sodium_thiosulfate', 'potassium_permanganate', 'iodine_solution'
]

export default function ChemicalShelf() {
  const setSelectedChemical = useLabStore(state => state.setSelectedChemical)
  const pickUpBottle = useLabStore(state => state.pickUpBottle)

  // Shelf parameters from Phase 1:
  // Upper shelf y: 2.2, Lower shelf y: 1.7
  // Width: 5, center x: 0.5, z: -4.35
  const shelfX = 0.5
  const shelfZ = -4.35
  
  const upperChemicals = useMemo(() =>
    upperShelfIds.map(id => chemicalsData.find(c => c.id === id)).filter(Boolean),
  [])
  const lowerChemicals = useMemo(() =>
    lowerShelfIds.map(id => chemicalsData.find(c => c.id === id)).filter(Boolean),
  [])

  // Calculate positions: centered on the shelf, 0.28 spacing
  const spacing = 0.28
  
  const getPositions = (count, y) => {
    const totalWidth = (count - 1) * spacing
    const startX = shelfX - (totalWidth / 2)
    return Array.from({ length: count }).map((_, i) => [
      startX + (i * spacing),
      y + 0.02, // slightly above the shelf surface (shelf thickness is 0.04, y is center, so +0.02)
      shelfZ + 0.05 // slightly pull forward from back wall
    ])
  }

  const upperPositions = getPositions(upperChemicals.length, 2.2)
  const lowerPositions = getPositions(lowerChemicals.length, 1.7)

  return (
    <group>
      {/* Upper Shelf Bottles */}
      {upperChemicals.map((chem, i) => (
        <ChemicalBottle 
          key={chem.id} 
          chemical={chem} 
          position={upperPositions[i]} 
          onSelect={(c) => { setSelectedChemical(c); pickUpBottle(c); }}
        />
      ))}
      
      {/* Lower Shelf Bottles */}
      {lowerChemicals.map((chem, i) => (
        <ChemicalBottle 
          key={chem.id} 
          chemical={chem} 
          position={lowerPositions[i]} 
          onSelect={(c) => { setSelectedChemical(c); pickUpBottle(c); }}
        />
      ))}
    </group>
  )
}
