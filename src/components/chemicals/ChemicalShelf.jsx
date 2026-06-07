import { useMemo } from 'react'
import { useSpring, a } from '@react-spring/three'
import ChemicalBottle from './ChemicalBottle'
import chemicalsData from '../../data/chemicals.json'
import useLabStore from '../../store/useLabStore'
import { UNLOCK_TIERS } from '../../systems/unlockSystem'

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
  const unlockedIds = useLabStore(state => state.unlockedChemicals)

  // Shelf parameters from Phase 1:
  // Upper shelf y: 2.2, Lower shelf y: 1.7
  // Width: 5, center x: 0.5, z: -4.35
  const shelfX = 0.5
  const shelfZ = -4.35
  
  const upperChemicals = useMemo(() =>
    upperShelfIds.map(id => chemicalsData.find(c => c.id === id)).filter(Boolean),
  [])
  const lowerChemicals = useMemo(() =>
    [...lowerShelfIds, ...unlockedIds].map(id => {
      // Check base chemicals first
      let chem = chemicalsData.find(c => c.id === id)
      // Check unlock tiers if not found
      if (!chem) {
        for (const tier of UNLOCK_TIERS) {
          chem = tier.chemicals.find(c => c.id === id)
          if (chem) break
        }
      }
      return chem
    }).filter(Boolean),
  [unlockedIds])

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
        <UnlockedAnimatedBottle 
          key={chem.id} 
          chemical={chem} 
          position={lowerPositions[i]} 
          onSelect={(c) => { setSelectedChemical(c); pickUpBottle(c); }}
          isUnlocked={unlockedIds.includes(chem.id)}
        />
      ))}
    </group>
  )
}

function UnlockedAnimatedBottle({ chemical, position, onSelect, isUnlocked }) {
  // If it's a freshly unlocked bottle, animate scale from 0 to 1 with a spring
  const { scale } = useSpring({
    from: { scale: isUnlocked ? 0 : 1 },
    to: { scale: 1 },
    config: { tension: 180, friction: 12 },
    reset: false,
  })

  return (
    <a.group position={position} scale={scale}>
      <ChemicalBottle 
        chemical={chemical} 
        position={[0, 0, 0]} // Position handled by parent group
        onSelect={onSelect}
      />
    </a.group>
  )
}
