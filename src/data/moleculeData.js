// moleculeData.js — CPK sphere-and-stick molecule data for MoleculeViewer
// Atom positions are in Ångström-like units, scaled for display (1 unit ≈ bond length)
// CPK color standard; van der Waals radii scaled to display units

export const MOLECULE_DATA = {
  H2O: {
    name: 'Water',
    formula: 'H₂O',
    atoms: [
      { element: 'O', position: [0, 0, 0],       radius: 0.73, color: '#FF2020' },
      { element: 'H', position: [-0.96, -0.77, 0], radius: 0.40, color: '#FFFFFF' },
      { element: 'H', position: [ 0.96, -0.77, 0], radius: 0.40, color: '#FFFFFF' },
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }],
  },

  HCl: {
    name: 'Hydrochloric Acid',
    formula: 'HCl',
    atoms: [
      { element: 'Cl', position: [0, 0, 0],   radius: 0.88, color: '#1FEF1F' },
      { element: 'H',  position: [1.27, 0, 0], radius: 0.40, color: '#FFFFFF' },
    ],
    bonds: [{ from: 0, to: 1 }],
  },

  NaOH: {
    name: 'Sodium Hydroxide',
    formula: 'NaOH',
    atoms: [
      { element: 'Na', position: [-1.0, 0, 0], radius: 0.90, color: '#9933FF' },
      { element: 'O',  position: [0.5,  0, 0], radius: 0.73, color: '#FF2020' },
      { element: 'H',  position: [1.45, 0, 0], radius: 0.40, color: '#FFFFFF' },
    ],
    bonds: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
  },

  NaCl: {
    name: 'Sodium Chloride',
    formula: 'NaCl',
    atoms: [
      { element: 'Na', position: [-1.3, 0, 0], radius: 0.90, color: '#9933FF' },
      { element: 'Cl', position: [ 1.3, 0, 0], radius: 0.88, color: '#1FEF1F' },
    ],
    bonds: [{ from: 0, to: 1 }],
  },

  CO2: {
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    atoms: [
      { element: 'O', position: [-1.16, 0, 0], radius: 0.73, color: '#FF2020' },
      { element: 'C', position: [0,     0, 0], radius: 0.77, color: '#404040' },
      { element: 'O', position: [ 1.16, 0, 0], radius: 0.73, color: '#FF2020' },
    ],
    bonds: [{ from: 1, to: 0 }, { from: 1, to: 2 }],
  },

  H2: {
    name: 'Hydrogen Gas',
    formula: 'H₂',
    atoms: [
      { element: 'H', position: [-0.37, 0, 0], radius: 0.40, color: '#FFFFFF' },
      { element: 'H', position: [ 0.37, 0, 0], radius: 0.40, color: '#FFFFFF' },
    ],
    bonds: [{ from: 0, to: 1 }],
  },

  O2: {
    name: 'Oxygen Gas',
    formula: 'O₂',
    atoms: [
      { element: 'O', position: [-0.6, 0, 0], radius: 0.73, color: '#FF2020' },
      { element: 'O', position: [ 0.6, 0, 0], radius: 0.73, color: '#FF2020' },
    ],
    bonds: [{ from: 0, to: 1 }],
  },

  H2SO4: {
    name: 'Sulfuric Acid',
    formula: 'H₂SO₄',
    atoms: [
      { element: 'S',  position: [0,     0,     0],     radius: 1.02, color: '#FFFF20' },
      { element: 'O',  position: [0,     1.43,  0],     radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [0,    -1.43,  0],     radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [ 1.43, 0,     0],     radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [-1.43, 0,     0],     radius: 0.73, color: '#FF2020' },
      { element: 'H',  position: [ 2.33, 0,     0],     radius: 0.40, color: '#FFFFFF' },
      { element: 'H',  position: [-2.33, 0,     0],     radius: 0.40, color: '#FFFFFF' },
    ],
    bonds: [
      { from: 0, to: 1 }, { from: 0, to: 2 },
      { from: 0, to: 3 }, { from: 0, to: 4 },
      { from: 3, to: 5 }, { from: 4, to: 6 },
    ],
  },

  CuOH2: {
    name: 'Copper(II) Hydroxide',
    formula: 'Cu(OH)₂',
    atoms: [
      { element: 'Cu', position: [0,     0,     0],   radius: 1.28, color: '#1966FF' },
      { element: 'O',  position: [1.8,   0.5,   0],   radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [-1.8,  0.5,   0],   radius: 0.73, color: '#FF2020' },
      { element: 'H',  position: [2.7,   0.5,   0],   radius: 0.40, color: '#FFFFFF' },
      { element: 'H',  position: [-2.7,  0.5,   0],   radius: 0.40, color: '#FFFFFF' },
    ],
    bonds: [
      { from: 0, to: 1 }, { from: 0, to: 2 },
      { from: 1, to: 3 }, { from: 2, to: 4 },
    ],
  },

  NH3: {
    name: 'Ammonia',
    formula: 'NH₃',
    atoms: [
      { element: 'N', position: [0,     0.37,  0],   radius: 0.75, color: '#2040FF' },
      { element: 'H', position: [-0.94,-0.25,  0],   radius: 0.40, color: '#FFFFFF' },
      { element: 'H', position: [ 0.94,-0.25,  0],   radius: 0.40, color: '#FFFFFF' },
      { element: 'H', position: [0,    -0.25,  1.02], radius: 0.40, color: '#FFFFFF' },
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }],
  },

  CaCO3: {
    name: 'Calcium Carbonate',
    formula: 'CaCO₃',
    atoms: [
      { element: 'Ca', position: [-2.5, 0, 0],  radius: 1.40, color: '#999900' },
      { element: 'C',  position: [ 1.2, 0, 0],  radius: 0.77, color: '#404040' },
      { element: 'O',  position: [ 1.2, 1.28,0], radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [ 0.1,-0.93,0], radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [ 2.3,-0.93,0], radius: 0.73, color: '#FF2020' },
    ],
    bonds: [
      { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 }
    ],
  },

  HNO3: {
    name: 'Nitric Acid',
    formula: 'HNO₃',
    atoms: [
      { element: 'H', position: [2.15, 0.85,  0], radius: 0.40, color: '#FFFFFF' },
      { element: 'O', position: [1.25, 0.5,   0], radius: 0.73, color: '#FF2020' },
      { element: 'N', position: [0,    0,      0], radius: 0.75, color: '#2040FF' },
      { element: 'O', position: [-1.1, 0.75,  0], radius: 0.73, color: '#FF2020' },
      { element: 'O', position: [-0.6, -1.1,  0], radius: 0.73, color: '#FF2020' },
    ],
    bonds: [
      { from: 0, to: 1 }, { from: 1, to: 2 },
      { from: 2, to: 3 }, { from: 2, to: 4 },
    ],
  },

  KMnO4: {
    name: 'Potassium Permanganate',
    formula: 'KMnO₄',
    atoms: [
      { element: 'K',  position: [-2.5, 0, 0],    radius: 1.52, color: '#8B008B' },
      { element: 'Mn', position: [0,    0, 0],    radius: 1.17, color: '#9932CC' },
      { element: 'O',  position: [0,    1.5, 0],  radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [0,   -1.5, 0],  radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [1.5,  0,   0.6], radius: 0.73, color: '#FF2020' },
      { element: 'O',  position: [-1.5, 0,   0.6], radius: 0.73, color: '#FF2020' },
    ],
    bonds: [
      { from: 1, to: 2 }, { from: 1, to: 3 },
      { from: 1, to: 4 }, { from: 1, to: 5 },
    ],
  },
}
