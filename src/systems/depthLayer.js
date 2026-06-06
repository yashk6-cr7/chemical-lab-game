// depthLayer.js — Phase 8 complete rewrite
// Pure function: getDepthContent(reactionResult, depthMode) → DepthContent

const REACTION_CONTENT = {

  // ─── Neutralization (violent) ───────────────────────────────────────
  neutralization_violent: {
    easy: {
      headline: "Acid and base crashed into each other and cancelled out!",
      body: "Think of it like mixing hot and cold water — they balance out. But these chemicals were so strong the mixture got really hot really fast!",
      funFact: "Stomach acid is neutralized by antacid tablets — same idea, just much gentler!",
      equation: '',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'NaOH', product1: 'NaCl', product2: 'H2O' },
      energyData: { deltaH: -57, activationEnergy: 8, isExothermic: true },
      followUpQuestions: ["What if you used a weaker acid instead?", "Why did the mixture get hot?", "What would the pH of the result be?"],
      realWorldLink: "Antacid tablets use this same reaction to neutralize excess stomach acid and cure heartburn.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Strong acid-base neutralization produced water and a salt",
      body: "HCl donates its H⁺ ion to the OH⁻ from NaOH, forming water. The Na⁺ and Cl⁻ ions remain dissolved as sodium chloride (table salt). This is a classic neutralization releasing 57 kJ/mol of energy as heat.",
      funFact: "The product NaCl is literally table salt — so in the right conditions, you could eat the result of this reaction!",
      equation: 'HCl + NaOH → NaCl + H₂O',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'NaOH', product1: 'NaCl', product2: 'H2O' },
      energyData: { deltaH: -57, activationEnergy: 8, isExothermic: true },
      followUpQuestions: ["What is the pH of the resulting solution?", "What happens if you add excess NaOH?", "Could you reverse this reaction?"],
      realWorldLink: "Water treatment plants use neutralization to balance the pH of wastewater before releasing it into rivers.",
      mechanismSteps: []
    },
    complex: {
      headline: "Strong acid–base proton transfer: H⁺(aq) + OH⁻(aq) → H₂O(l)",
      body: "This is a Brønsted–Lowry proton transfer. HCl fully dissociates (strong acid), as does NaOH. The net ionic equation eliminates spectator ions: H⁺ + OH⁻ → H₂O. ΔH = −57 kJ/mol. Le Chatelier's principle confirms this equilibrium strongly favours products (Kw = 10⁻¹⁴).",
      funFact: "The 57 kJ/mol enthalpy of neutralization is almost constant for all strong acid/strong base pairs — because the net reaction is always H⁺ + OH⁻ → H₂O.",
      equation: 'H⁺(aq) + OH⁻(aq) → H₂O(l)  ΔH = −57 kJ/mol',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'NaOH', product1: 'NaCl', product2: 'H2O' },
      energyData: { deltaH: -57, activationEnergy: 5, isExothermic: true },
      followUpQuestions: ["How does the enthalpy change with weak acids?", "Why is Kw = 10⁻¹⁴ at 25°C?", "What is the mechanism for water autoionisation?"],
      realWorldLink: "Buffer solutions in blood exploit acid-base chemistry to maintain pH 7.4, crucial for enzyme function.",
      mechanismSteps: [
        "HCl dissolves completely: HCl(g) → H⁺(aq) + Cl⁻(aq)",
        "NaOH dissolves completely: NaOH(s) → Na⁺(aq) + OH⁻(aq)",
        "H⁺ and OH⁻ collide and transfer a proton: H⁺ + :OH⁻ → H₂O",
        "Na⁺ and Cl⁻ remain as spectator ions in solution",
        "Net release of 57 kJ/mol as thermal energy"
      ]
    }
  },

  // ─── Neutralization (gentle) ────────────────────────────────────────
  neutralization_gentle: {
    easy: {
      headline: "A gentle mixing — they balanced each other out!",
      body: "These chemicals are mild, like mixing a tiny bit of lemon juice with baking soda. They meet in the middle and the result is nearly neutral — not too acidic, not too basic.",
      funFact: "Gentle neutralization is how fizzy antacid drinks work — they neutralize stomach acid with a satisfying fizz!",
      equation: '',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'NaOH', product1: 'NaCl', product2: 'H2O' },
      energyData: { deltaH: -30, activationEnergy: 12, isExothermic: true },
      followUpQuestions: ["What would happen with a stronger acid?", "How is this different from what happened before?", "Can you make the mixture fully neutral?"],
      realWorldLink: "This is exactly what happens when you gargle with a mild saltwater solution to soothe a sore throat.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Partial neutralization — one reactant is limiting",
      body: "The weaker concentration or partial dissociation means not all H⁺ and OH⁻ ions react. The resulting solution may be slightly acidic or basic depending on which reactant is in excess. A buffer may form if a weak acid/conjugate base pair is present.",
      funFact: "Buffering is how your blood maintains exactly pH 7.4 — small amounts of acid or base are neutralized without changing the overall pH significantly.",
      equation: 'HA + B → A⁻ + BH⁺',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'NaOH', product1: 'NaCl', product2: 'H2O' },
      energyData: { deltaH: -30, activationEnergy: 15, isExothermic: true },
      followUpQuestions: ["What is the resulting pH of this mixture?", "How does a buffer resist pH change?", "What would happen at the equivalence point?"],
      realWorldLink: "Buffer solutions maintain the pH of blood, cell culture media, and swimming pools.",
      mechanismSteps: []
    },
    complex: {
      headline: "Weak acid–base neutralization with possible buffer formation",
      body: "Partial proton transfer occurs between a weak acid (low Ka) and a base. At half-equivalence point, pH = pKa (Henderson–Hasselbalch). The reaction does not go to completion — equilibrium establishes a dynamic balance between protonated and deprotonated forms.",
      funFact: "The Henderson–Hasselbalch equation (pH = pKa + log([A⁻]/[HA])) was derived in 1908 and still underpins all clinical acid-base medicine.",
      equation: 'HA(aq) + OH⁻(aq) ⇌ A⁻(aq) + H₂O(l)',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'NaOH', product1: 'NaCl', product2: 'H2O' },
      energyData: { deltaH: -30, activationEnergy: 18, isExothermic: true },
      followUpQuestions: ["What is the Henderson–Hasselbalch equation?", "How does ionic strength affect Ka?", "What happens at the equivalence point?"],
      realWorldLink: "Bicarbonate buffering in blood: HCO₃⁻ + H⁺ ⇌ H₂CO₃ maintains physiological pH 7.4.",
      mechanismSteps: [
        "Weak acid partially dissociates: HA ⇌ H⁺ + A⁻ (Ka << 1)",
        "OH⁻ from base captures H⁺: H⁺ + OH⁻ → H₂O (fast, irreversible)",
        "Equilibrium shifts right, increasing A⁻ concentration",
        "At half-equivalence: [HA] = [A⁻], so pH = pKa",
        "Buffer region: pH changes minimally on addition of H⁺ or OH⁻"
      ]
    }
  },

  // ─── Acid + Carbonate ───────────────────────────────────────────────
  acid_carbonate: {
    easy: {
      headline: "The chemicals made bubbles — that's a gas being born!",
      body: "When acid meets a carbonate (like chalk or baking soda), they react to make carbon dioxide — the same fizzy gas in soda drinks. You can see it escape as bubbles!",
      funFact: "This exact reaction happens when you pour vinegar on baking soda — CO₂ makes the foam rise!",
      equation: '',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'CaCO3', product1: 'CO2', product2: 'H2O' },
      energyData: { deltaH: -15, activationEnergy: 25, isExothermic: true },
      followUpQuestions: ["What would happen if you heated the mixture?", "What if you used a stronger acid?", "Can you collect the gas?"],
      realWorldLink: "Limestone caves form over millions of years as rainwater (slightly acidic) slowly dissolves calcium carbonate rock using this reaction.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Acid reacts with carbonate to produce CO₂ gas and water",
      body: "The H⁺ from the acid attacks the carbonate ion (CO₃²⁻), first forming carbonic acid (H₂CO₃), which immediately decomposes to CO₂ and H₂O. The fizzing you see is CO₂ escaping from solution. The calcium or sodium ions remain dissolved.",
      funFact: "Geologists use dilute HCl to identify limestone in the field — if it fizzes, it contains carbonates.",
      equation: '2HCl + CaCO₃ → CaCl₂ + H₂O + CO₂↑',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'CaCO3', product1: 'CO2', product2: 'H2O' },
      energyData: { deltaH: -15, activationEnergy: 28, isExothermic: true },
      followUpQuestions: ["Why does the reaction stop if CO₂ can't escape?", "What happens if you use Na₂CO₃ instead?", "How is CO₂ gas collected over water?"],
      realWorldLink: "Antacid tablets (CaCO₃) react with stomach acid (HCl) using this exact mechanism, releasing CO₂ that causes burping.",
      mechanismSteps: []
    },
    complex: {
      headline: "Two-step carbonate decomposition: CO₃²⁻ → HCO₃⁻ → H₂CO₃ → CO₂ + H₂O",
      body: "Step 1: H⁺ + CO₃²⁻ → HCO₃⁻ (fast). Step 2: H⁺ + HCO₃⁻ → H₂CO₃ (fast). Step 3: H₂CO₃ → CO₂(g) + H₂O (rate-limiting, catalysed by carbonic anhydrase in biology). CO₂ equilibrium: CO₂(aq) ⇌ CO₂(g), driven by Henry's Law.",
      funFact: "Carbonic anhydrase enzyme accelerates the decomposition of H₂CO₃ by 10 million times — essential for CO₂ transport in blood.",
      equation: '2H⁺(aq) + CO₃²⁻(aq) → H₂O(l) + CO₂(g)',
      moleculeKeys: { reactant1: 'HCl', reactant2: 'CaCO3', product1: 'CO2', product2: 'H2O' },
      energyData: { deltaH: -15, activationEnergy: 22, isExothermic: true },
      followUpQuestions: ["What is the role of Henry's Law in CO₂ escape?", "How does pressure affect CO₂ solubility?", "Why does reaction rate increase with surface area?"],
      realWorldLink: "Ocean acidification: atmospheric CO₂ dissolves in seawater, forming H₂CO₃ which dissolves coral (CaCO₃ skeleton).",
      mechanismSteps: [
        "H⁺ attacks CO₃²⁻: H⁺ + CO₃²⁻ → HCO₃⁻ (very fast)",
        "Second proton transfer: H⁺ + HCO₃⁻ → H₂CO₃",
        "H₂CO₃ is unstable, decomposes: H₂CO₃ → CO₂(aq) + H₂O",
        "CO₂ exceeds solubility (Henry's Law) → nucleation on surface",
        "Bubbles form, grow, and escape — driving equilibrium forward"
      ]
    }
  },

  // ─── Acid + Metal ───────────────────────────────────────────────────
  acid_metal: {
    easy: {
      headline: "The acid ate the metal and made invisible hydrogen gas!",
      body: "Acids are powerful enough to dissolve some metals! When they do, they release hydrogen gas — which you can sometimes see as tiny bubbles. This is how rust forms inside pipes over time.",
      funFact: "Hydrogen gas is incredibly light — it's what made the Hindenburg airship float (and explode!).",
      equation: '',
      moleculeKeys: { reactant1: 'HCl', reactant2: null, product1: 'H2', product2: null },
      energyData: { deltaH: -80, activationEnergy: 40, isExothermic: true },
      followUpQuestions: ["What metals don't react with acids?", "Why does zinc react faster than iron?", "Could you use this to clean rust?"],
      realWorldLink: "Hydrochloric acid is used industrially to 'pickle' (clean) steel surfaces before galvanising — removing rust and oxide layers.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Single displacement: acid oxidises the metal, releasing H₂ gas",
      body: "Metals above hydrogen in the reactivity series displace H⁺ from acids. The metal is oxidised (loses electrons) and H⁺ is reduced (gains electrons). Zinc example: Zn → Zn²⁺ + 2e⁻ (oxidation). 2H⁺ + 2e⁻ → H₂ (reduction).",
      funFact: "Electrochemical cells use this same electron transfer principle — the metal oxidation drives electrical current in batteries.",
      equation: 'Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g)',
      moleculeKeys: { reactant1: 'HCl', reactant2: null, product1: 'H2', product2: null },
      energyData: { deltaH: -152, activationEnergy: 45, isExothermic: true },
      followUpQuestions: ["Why don't gold or platinum react with HCl?", "What is the reactivity series of metals?", "How is this used in galvanising steel?"],
      realWorldLink: "Car batteries contain lead plates in sulfuric acid — the same acid-metal redox chemistry provides the electrical current.",
      mechanismSteps: []
    },
    complex: {
      headline: "Oxidative dissolution: Zn⁰ → Zn²⁺ + 2e⁻; 2H⁺ + 2e⁻ → H₂",
      body: "This is a redox reaction. E°cell = E°cathode − E°anode = 0V − (−0.76V) = +0.76V, confirming spontaneity (ΔG = −nFE°). Rate depends on: acid concentration, metal surface area, temperature (Arrhenius), and inhibiting oxide layer. HNO₃ is an oxidising acid and does NOT produce H₂ — it produces NO or NO₂ instead.",
      funFact: "Aqua regia (3:1 HCl:HNO₃) dissolves even gold — something no single acid can do alone. It was used to dissolve Nobel Prize medals to hide them from Nazis.",
      equation: 'Zn(s) + 2H⁺(aq) → Zn²⁺(aq) + H₂(g)  E° = +0.76V',
      moleculeKeys: { reactant1: 'HCl', reactant2: null, product1: 'H2', product2: null },
      energyData: { deltaH: -152, activationEnergy: 40, isExothermic: true },
      followUpQuestions: ["What is the standard electrode potential for this reaction?", "Why does HNO₃ not produce H₂?", "How does the oxide layer affect reaction kinetics?"],
      realWorldLink: "Sacrificial anodes (zinc plates) on ship hulls corrode preferentially, protecting the steel hull — same electrochemistry.",
      mechanismSteps: [
        "Zn surface atoms undergo oxidation: Zn → Zn²⁺ + 2e⁻",
        "H⁺ ions migrate to metal surface and accept electrons",
        "2H⁺ + 2e⁻ → H₂ (at cathodic sites on metal surface)",
        "H₂ nucleates as nanobubbles on surface defects",
        "ZnCl₂ dissolves into solution; surface area decreases over time"
      ]
    }
  },

  // ─── Catalytic Decomposition (elephant toothpaste) ─────────────────
  catalytic_decomposition: {
    easy: {
      headline: "Elephant Toothpaste! Oxygen gas burst out instantly!",
      body: "A special helper chemical (the catalyst) ripped hydrogen peroxide apart, releasing all of its oxygen at once. The result? A foam explosion that looks like giant toothpaste squeezed out fast. No elephant was needed!",
      funFact: "The foam is hot because the reaction releases lots of energy very quickly. The foam is safe to touch (it's mostly soap and water).",
      equation: '',
      moleculeKeys: { reactant1: 'O2', reactant2: null, product1: 'H2O', product2: 'O2' },
      energyData: { deltaH: -100, activationEnergy: 10, isExothermic: true },
      followUpQuestions: ["What would happen with more catalyst?", "What if you used cold peroxide?", "Can you catch the oxygen gas?"],
      realWorldLink: "Catalytic converters in car exhausts use platinum and palladium catalysts to break down toxic gases at lower temperatures than would otherwise be needed.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Catalytic decomposition of H₂O₂ by KMnO₄ or MnO₂",
      body: "Manganese (in KMnO₄ or MnO₂) lowers the activation energy for H₂O₂ decomposition. 2H₂O₂ → 2H₂O + O₂↑. The catalyst is not consumed. O₂ fills soap film, creating foam. The large exotherm makes the foam hot.",
      funFact: "Your own blood cells use a similar enzyme (catalase) to decompose toxic H₂O₂ produced during metabolism — and the same fizzing happens if you pour hydrogen peroxide on a wound.",
      equation: '2H₂O₂(aq) → 2H₂O(l) + O₂(g)  [catalyst: MnO₂]',
      moleculeKeys: { reactant1: 'O2', reactant2: null, product1: 'H2O', product2: 'O2' },
      energyData: { deltaH: -196, activationEnergy: 15, isExothermic: true },
      followUpQuestions: ["What is activation energy and how does a catalyst lower it?", "Why isn't the catalyst used up?", "What enzyme does this reaction in living cells?"],
      realWorldLink: "Catalase enzyme in liver cells decomposes H₂O₂ 40 million times per second — if you put liver on hydrogen peroxide, it fizzes dramatically.",
      mechanismSteps: []
    },
    complex: {
      headline: "Mn-catalysed radical decomposition of H₂O₂: two-step redox cycle",
      body: "Step 1 (oxidation): Mn²⁺ + H₂O₂ → Mn⁴⁺ + 2OH⁻. Step 2 (reduction): Mn⁴⁺ + H₂O₂ → Mn²⁺ + O₂ + 2H⁺. Net: 2H₂O₂ → 2H₂O + O₂. Ea reduced from ~75 to ~15 kJ/mol. Rate = k[H₂O₂][catalyst].",
      funFact: "The world record elephant toothpaste reaction used 40% H₂O₂ and produced a foam column over 18 metres tall — in 2014 at Brigham Young University.",
      equation: '2H₂O₂ → 2H₂O + O₂  (Ea lowered from 75 → 15 kJ/mol)',
      moleculeKeys: { reactant1: 'O2', reactant2: null, product1: 'H2O', product2: 'O2' },
      energyData: { deltaH: -196, activationEnergy: 15, isExothermic: true },
      followUpQuestions: ["Why does catalyst concentration affect initial rate but not equilibrium?", "What is the Michaelis–Menten model for enzyme kinetics?", "How does temperature affect catalytic rate differently than uncatalysed?"],
      realWorldLink: "Industrial catalysis: Haber process uses Fe catalyst to convert N₂ + 3H₂ → 2NH₃ at economical temperatures. Same principle, different catalyst.",
      mechanismSteps: [
        "Mn²⁺ coordinates to H₂O₂, weakening O-O bond",
        "Electron transfer: Mn²⁺ → Mn⁴⁺, H₂O₂ → 2OH⁻",
        "Second H₂O₂ donates electrons to Mn⁴⁺ → Mn²⁺ restored",
        "O₂ released, Mn²⁺ available for next cycle (true catalyst)",
        "Foam forms as surfactant traps O₂ bubbles — thermal energy heats foam"
      ]
    }
  },

  // ─── Indicator change ───────────────────────────────────────────────
  indicator: {
    easy: {
      headline: "The colour changed! The chemical is telling us about itself!",
      body: "Some chemicals change colour depending on whether something is acidic or basic — like a mood ring for chemistry! This colour change is the chemical's way of sending a message.",
      funFact: "Red cabbage juice is a natural indicator — pour acid in and it turns pink, pour a base in and it turns green!",
      equation: '',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 0, activationEnergy: 5, isExothermic: false },
      followUpQuestions: ["What other natural indicators exist?", "What would happen at a neutral pH?", "Can you make a colour rainbow with pH?"],
      realWorldLink: "pH test strips use multiple chemical indicators to show the acidity of swimming pools, aquariums, and soil samples.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Acid-base indicator undergoes protonation state change",
      body: "Indicators like litmus or phenolphthalein are weak acids (HIn). In acid: HIn form (one colour). In base: OH⁻ removes H⁺ → In⁻ (conjugate base form, different colour). The colour transition spans roughly pKa ± 1 pH unit.",
      funFact: "Phenolphthalein, used in antacid laxatives for decades, was found to be carcinogenic in 1999 — a reminder that 'colourful' doesn't mean 'safe'.",
      equation: 'HIn(aq) + OH⁻(aq) ⇌ In⁻(aq) + H₂O(l)',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 0, activationEnergy: 5, isExothermic: false },
      followUpQuestions: ["What is the transition pH range for phenolphthalein?", "How is an indicator chosen for a specific titration?", "Why does universal indicator use multiple dyes?"],
      realWorldLink: "Titrations in chemical analysis use indicators to find the exact equivalence point when acid and base are perfectly neutralized.",
      mechanismSteps: []
    },
    complex: {
      headline: "Indicator protonation equilibrium: chromophore structural change",
      body: "Colour change arises from π-electron delocalisation change between HIn and In⁻ forms. The different electronic structures absorb different wavelengths. Ka(indicator) must be within 1 unit of titration endpoint pH. Mixed indicators (e.g. universal) are Hammett acidity function measurements across pH range.",
      funFact: "The Hammett acidity function H₀ extends pH measurement below 0 (superacids). Magic acid (SbF₅ + HF) has H₀ = −28, 10²⁸ times stronger than pure sulfuric acid.",
      equation: 'HIn ⇌ H⁺ + In⁻  Ka = [H⁺][In⁻]/[HIn]',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 0, activationEnergy: 3, isExothermic: false },
      followUpQuestions: ["How does indicator pKa relate to titration endpoint selection?", "What is a mixed indicator and why is it sharper?", "How does solvent polarity affect indicator colour?"],
      realWorldLink: "Blood oxygenation indicators (pulse oximeters) work on the same chromophore principle — oxyhaemoglobin and deoxyhaemoglobin absorb different wavelengths.",
      mechanismSteps: [
        "HIn acts as weak acid: HIn ⇌ H⁺ + In⁻ (Ka determines transition pH)",
        "Acid environment: [H⁺] high → equilibrium left → HIn dominates → colour A",
        "Base added: OH⁻ removes H⁺ → equilibrium shifts right → In⁻ dominates",
        "Chromophore in In⁻ has extended π-conjugation → absorbs different λ",
        "Sharp colour change occurs within ΔpH ≈ 2 around pKa(indicator)"
      ]
    }
  },

  // ─── Flammable vapour / fire ────────────────────────────────────────
  flammable_vapor: {
    easy: {
      headline: "Fire! The chemical vapour caught fire when it got too hot!",
      body: "Some chemicals make an invisible gas that can burn. When enough of that gas builds up and something hot gets near it, it ignites — just like natural gas in a kitchen igniting on a hob. Always use the fume hood!",
      funFact: "Ethanol (alcohol) burns with a nearly invisible blue flame — which is why alcohol fires on race tracks are so dangerous. You can't see the flame!",
      equation: '',
      moleculeKeys: { reactant1: null, reactant2: 'O2', product1: 'CO2', product2: 'H2O' },
      energyData: { deltaH: -1366, activationEnergy: 50, isExothermic: true },
      followUpQuestions: ["What is a flashpoint?", "Why does CO₂ extinguish fires?", "What chemicals should never be heated?"],
      realWorldLink: "Flash fires in restaurant kitchens happen when spilled alcohol near a burner suddenly ignites — the same vapour-ignition chemistry.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Flammable vapour ignited: combustion reaction",
      body: "Volatile compounds evaporate above their flash point. When vapour concentration reaches the Lower Explosive Limit (LEL) and an ignition source is present, rapid exothermic combustion occurs. CO₂ extinguisher works by displacing O₂ below the minimum combustion concentration (~15%).",
      funFact: "The LEL of ethanol in air is 3.3%. Above this concentration, any spark causes ignition. This is why labs must be spark-free when solvents are open.",
      equation: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O  ΔH = -1366 kJ/mol',
      moleculeKeys: { reactant1: null, reactant2: 'O2', product1: 'CO2', product2: 'H2O' },
      energyData: { deltaH: -1366, activationEnergy: 55, isExothermic: true },
      followUpQuestions: ["What is the difference between flash point and autoignition point?", "Why is CO₂ better than water for lab fires?", "What is the fire triangle?"],
      realWorldLink: "Lab fume hoods use spark-free (ATEX-rated) motors and fans, specifically to prevent ignition of flammable vapours.",
      mechanismSteps: []
    },
    complex: {
      headline: "Free-radical chain combustion above Lower Explosive Limit",
      body: "Combustion proceeds via radical chain mechanism. Initiation: RH + O₂ → R• + HO₂•. Propagation: R• + O₂ → ROO• → rapid chain. Termination: radical recombination. Rate controlled by radical chain length. Flammability limits (LEL-UEL) define explosive range. Below LEL: too lean. Above UEL: too rich. Inhibition: CO₂ dilutes O₂; halon (historical) terminates radical chain.",
      funFact: "Tetraethyllead (leaded petrol additive) worked as an antiknock agent by scavenging combustion radicals — the same radical chain chemistry.",
      equation: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O  (radical chain, ΔH = −1366 kJ/mol)',
      moleculeKeys: { reactant1: null, reactant2: 'O2', product1: 'CO2', product2: 'H2O' },
      energyData: { deltaH: -1366, activationEnergy: 50, isExothermic: true },
      followUpQuestions: ["What is the radical chain mechanism of hydrocarbon combustion?", "How does CO₂ suppression differ from halon suppression?", "What determines the Upper Explosive Limit?"],
      realWorldLink: "Diesel engines use compression ignition above the autoignition temperature (~257°C for diesel) — no spark plug needed because radical initiation occurs spontaneously.",
      mechanismSteps: [
        "Thermal initiation: RH → R• + H• (above autoignition temp or spark)",
        "Propagation: R• + O₂ → ROO• (very fast, exothermic)",
        "ROO• + RH → ROOH + R• (chain carried forward)",
        "Branching: ROOH → RO• + •OH (creates more radicals — accelerates exponentially)",
        "Termination: radical recombination or CO₂ dilution below O₂ threshold"
      ]
    }
  },

  // ─── Dangerous dilution (H₂SO₄ + water) ───────────────────────────
  dangerous_dilution: {
    easy: {
      headline: "Danger! Adding water to this acid was the wrong order!",
      body: "Always add acid to water — never add water to acid! When water hits concentrated acid, it can make so much heat so fast that the water boils and spits acid everywhere. Think of it like adding water to hot cooking oil — it explodes!",
      funFact: "The mnemonic lab scientists use is: 'Do as you oughter — add acid to water.' This rule has saved countless eyes!",
      equation: '',
      moleculeKeys: { reactant1: 'H2SO4', reactant2: 'H2O', product1: 'H2O', product2: null },
      energyData: { deltaH: -880, activationEnergy: 5, isExothermic: true },
      followUpQuestions: ["Why must you always add acid TO water?", "What would happen if concentrated H₂SO₄ spilled on skin?", "How do you safely dilute concentrated acids?"],
      realWorldLink: "Lab safety rule 101: always add acid to water. Car battery acid (H₂SO₄) is handled with extreme care for this exact reason.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Dangerous exotherm: H₂SO₄ hydration releases 880 kJ/mol",
      body: "Concentrated H₂SO₄ has extremely high affinity for water. When water is added to acid, the initial contact causes intense local heating (can exceed 100°C instantly), boiling water, and potential spattering. Correct method: add acid slowly to large volume of water to dissipate heat. Heat of dilution for H₂SO₄ is −880 kJ/mol.",
      funFact: "Concentrated H₂SO₄ is such a powerful dehydrating agent it can char (carbonise) sugar — C₁₂H₂₂O₁₁ + H₂SO₄ → 12C + 11H₂O, leaving a black carbon pillar.",
      equation: 'H₂SO₄(l) + H₂O(l) → H₃O⁺(aq) + HSO₄⁻(aq)  ΔH = -880 kJ/mol',
      moleculeKeys: { reactant1: 'H2SO4', reactant2: 'H2O', product1: 'H2O', product2: null },
      energyData: { deltaH: -880, activationEnergy: 3, isExothermic: true },
      followUpQuestions: ["What is the heat of hydration for H₂SO₄?", "Why does conc. H₂SO₄ char organic matter?", "What personal protective equipment is required for concentrated acids?"],
      realWorldLink: "Lead-acid car batteries contain H₂SO₄. If the battery casing cracks, water contact with acid can cause dangerous spattering.",
      mechanismSteps: []
    },
    complex: {
      headline: "H₂SO₄ hydration: proton transfer to bulk water, ΔH = −880 kJ/mol",
      body: "H₂SO₄ is a diprotic strong acid. First ionisation: H₂SO₄ + H₂O → H₃O⁺ + HSO₄⁻ (Ka1 >> 1, complete). Second ionisation: HSO₄⁻ + H₂O ⇌ H₃O⁺ + SO₄²⁻ (Ka2 = 0.012, partial). The massive heat of hydration (−880 kJ/mol) reflects the extraordinarily high charge density of H⁺ polarising water molecules. Water-to-acid addition creates local >100°C zones causing steam explosions and acid aerosol.",
      funFact: "Oleum (fuming sulfuric acid, H₂S₂O₇) contains dissolved SO₃ and reacts even more violently with water — it's used to make explosive precursors and dyes.",
      equation: 'H₂SO₄ + 2H₂O → 2H₃O⁺ + SO₄²⁻  ΔH = −880 kJ/mol',
      moleculeKeys: { reactant1: 'H2SO4', reactant2: 'H2O', product1: 'H2O', product2: null },
      energyData: { deltaH: -880, activationEnergy: 2, isExothermic: true },
      followUpQuestions: ["Why is the second ionisation of H₂SO₄ incomplete?", "What is oleum and why is it more reactive?", "How does charge density relate to hydration enthalpy?"],
      realWorldLink: "Industrial H₂SO₄ production (Contact Process) carefully manages the heat of absorption of SO₃ into 98% H₂SO₄ — direct water absorption would be too violent.",
      mechanismSteps: [
        "H₂SO₄ molecule inserts into H-bonded water network",
        "O-H bond in H₂SO₄ breaks heterolytically → H⁺ + HSO₄⁻",
        "H⁺ accepts electron pair from H₂O → H₃O⁺ forms (Eigen cation)",
        "Heat of solvation released as H₃O⁺ and HSO₄⁻ are stabilised",
        "Local temperature spike: can exceed 100°C, steam explosion risk"
      ]
    }
  },

  // ─── Precipitation (CuSO₄ + NaOH) ──────────────────────────────────
  precipitation: {
    easy: {
      headline: "A solid suddenly appeared out of nowhere — it's a precipitate!",
      body: "When two clear liquids meet, the chemicals inside them can team up in a new way that can't stay dissolved. They clump together and fall as a solid — like snowflakes forming in water! Here the blue colour tells us it contains copper.",
      funFact: "Gold is extracted from rivers using precipitation chemistry — chemicals make gold ions in the water 'fall out' as solid gold!",
      equation: '',
      moleculeKeys: { reactant1: 'H2O', reactant2: 'NaOH', product1: 'H2O', product2: null },
      energyData: { deltaH: -18, activationEnergy: 10, isExothermic: true },
      followUpQuestions: ["What colour is copper hydroxide?", "What would happen if you filtered the solid out?", "Can you make the solid dissolve again?"],
      realWorldLink: "Water treatment plants use precipitation to remove heavy metals (copper, lead, zinc) from industrial wastewater — the metals 'fall out' as solid hydroxides.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Copper(II) hydroxide precipitates from double displacement reaction",
      body: "Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s). The product Cu(OH)₂ has very low solubility (Ksp = 2×10⁻¹⁹). When [Cu²⁺][OH⁻]² exceeds Ksp, the solution is supersaturated and precipitate nucleates. The characteristic blue colour is Cu²⁺ in octahedral coordination with water and hydroxide ligands.",
      funFact: "Fehling's solution uses Cu(OH)₂ in alkaline solution to test for reducing sugars — glucose turns it from blue to brick-red, a classic biochemistry test.",
      equation: 'CuSO₄(aq) + 2NaOH(aq) → Cu(OH)₂(s) + Na₂SO₄(aq)',
      moleculeKeys: { reactant1: 'H2O', reactant2: 'NaOH', product1: 'H2O', product2: null },
      energyData: { deltaH: -18, activationEnergy: 12, isExothermic: true },
      followUpQuestions: ["What is the solubility product Ksp?", "What happens if you heat Cu(OH)₂?", "How is this used in water treatment?"],
      realWorldLink: "Bordeaux mixture (CuSO₄ + Ca(OH)₂) has been used since 1885 as an antifungal spray on grapevines — the Cu(OH)₂ precipitation is the active fungicide.",
      mechanismSteps: []
    },
    complex: {
      headline: "Precipitation via Ksp violation: Cu²⁺ + 2OH⁻ → Cu(OH)₂(s)",
      body: "Precipitation occurs when the ionic product Q > Ksp = 2×10⁻¹⁹. Nucleation theory: critical nucleus must exceed Gibbs energy barrier ΔG* = 16πγ³/3(ΔGv)². Primary nucleation (homogeneous) followed by crystal growth. Cu(OH)₂ is metastable — heating converts to CuO (black) + H₂O (dehydration). Excess NaOH redissolves precipitate as [Cu(OH)₄]²⁻ (tetrahydroxocuprate — dark blue).",
      funFact: "Excess NaOH dissolves Cu(OH)₂ to form a deep blue solution — this is why Fehling's solution is dark blue before sugar is added.",
      equation: 'Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s)  Ksp = 2×10⁻¹⁹',
      moleculeKeys: { reactant1: 'H2O', reactant2: 'NaOH', product1: 'H2O', product2: null },
      energyData: { deltaH: -18, activationEnergy: 8, isExothermic: true },
      followUpQuestions: ["What is the Ksp and how does it predict precipitation?", "How does excess NaOH redissolve Cu(OH)₂?", "What is the thermodynamics of nucleation?"],
      realWorldLink: "Chelation therapy removes toxic metals from blood by forming soluble complexes, dissolving precipitates — the reverse of precipitation.",
      mechanismSteps: [
        "Cu²⁺(aq) and OH⁻(aq) encounter in solution — no reaction if Q < Ksp",
        "As mixing proceeds, Q = [Cu²⁺][OH⁻]² exceeds Ksp = 2×10⁻¹⁹",
        "Supersaturation triggers homogeneous nucleation — critical cluster forms",
        "Cu(OH)₂ lattice grows by addition of Cu²⁺ and OH⁻ to nucleus",
        "Blue amorphous solid precipitates; heating → CuO (black) + H₂O"
      ]
    }
  },

  // ─── Volatile + Air quality drop ────────────────────────────────────
  volatile_exposure: {
    easy: {
      headline: "Invisible gas filled the air — that's why it smells!",
      body: "Some chemicals make a vapour that floats off into the air. You can't always see it, but you can smell it. Too much of it makes the air bad to breathe. That's why the fume hood is so important — it sucks the gas away before it can hurt you.",
      funFact: "Your nose can detect some chemicals at concentrations of just a few parts per billion — far more sensitive than most lab detectors!",
      equation: '',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 5, activationEnergy: 0, isExothermic: false },
      followUpQuestions: ["What is a fume hood and how does it work?", "Why can't you always smell dangerous gases?", "What does PEL mean?"],
      realWorldLink: "Hospital operating rooms have active ventilation systems to prevent anaesthetic gas buildup — the same principle as a lab fume hood.",
      mechanismSteps: []
    },
    moderate: {
      headline: "Vapour pressure exceeded — volatile compound degassing",
      body: "Above the flash point, the compound's vapour pressure is high enough to rapidly evaporate into the air. Vapour concentration builds if ventilation is insufficient. Many organic solvents are colourless and their vapours are denser than air, pooling at floor level — creating an invisible fire and health hazard.",
      funFact: "Chloroform (CHCl₃) vapour is so dense it settles in low areas. Victorian doctors used it as anaesthetic — not knowing it was causing liver damage in staff and patients.",
      equation: 'Volatile(l) → Volatile(g)  [rate ∝ vapour pressure]',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 5, activationEnergy: 0, isExothermic: false },
      followUpQuestions: ["What is vapour pressure and how does temperature affect it?", "Why are some vapours denser than air?", "What is the Short-Term Exposure Limit (STEL)?"],
      realWorldLink: "Petrol station pump nozzles have vapour recovery systems to prevent petrol fumes from escaping into the air — reducing both health risk and atmospheric pollution.",
      mechanismSteps: []
    },
    complex: {
      headline: "Vapour phase equilibrium: P = P°·exp(−ΔHvap/RT) via Clausius–Clapeyron",
      body: "Evaporation rate determined by Clausius–Clapeyron: ln(P₂/P₁) = −(ΔHvap/R)(1/T₂−1/T₁). Above OSHA PEL or ACGIH TLV, biological exposure limit is exceeded. Henry's Law governs dissolution back into aqueous phases. CNS toxicity from solvent vapours involves lipid membrane partitioning. Chronic low-level exposure to many organic solvents causes peripheral neuropathy and hepatotoxicity.",
      funFact: "n-Hexane (common solvent) causes a specific peripheral neuropathy called 'glue sniffer's neuropathy' — the metabolite 2,5-hexanedione attacks axonal proteins selectively.",
      equation: 'ln(P/P₀) = −ΔHvap/R × (1/T − 1/T₀)',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 5, activationEnergy: 0, isExothermic: false },
      followUpQuestions: ["What is the Clausius–Clapeyron equation?", "How do TLV-C (ceiling) and TLV-STEL differ?", "What molecular properties increase vapour pressure?"],
      realWorldLink: "Occupational health monitoring measures 8-hour time-weighted average (TWA) solvent exposure against OSHA PEL standards to prevent chronic occupational disease.",
      mechanismSteps: []
    }
  },

  // ─── No reaction ────────────────────────────────────────────────────
  mixing_only: {
    easy: {
      headline: "They mixed together but nothing special happened — yet!",
      body: "Not every chemical combination causes a dramatic reaction. Some chemicals just sit together and don't want to react. That's not a failure — it's a discovery! You've learned these two are chemically compatible.",
      funFact: "Gold and platinum are so unreactive they can be implanted in the human body as medical devices — they don't react with blood or tissue!",
      equation: '',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 0, activationEnergy: 200, isExothermic: false },
      followUpQuestions: ["What would happen if you heated the mixture?", "What could you add to trigger a reaction?", "Why do some chemicals not react?"],
      realWorldLink: "Mixing oils from different plants creates combinations (like moisturiser) that are intentionally non-reactive — stability is the goal.",
      mechanismSteps: []
    },
    moderate: {
      headline: "No observable reaction — chemical incompatibility or thermodynamic stability",
      body: "Absence of reaction can indicate: (1) insufficient activation energy at current temperature, (2) thermodynamically unfavourable ΔG > 0, (3) kinetic inhibition (very slow rate), or (4) genuinely incompatible functional groups. Record the observation — 'no reaction' is a valid and informative scientific result.",
      funFact: "Noble gases (He, Ne, Ar) were once called 'inert gases' because they appeared to react with nothing — until Neil Bartlett synthesised the first noble gas compound (XePtF₆) in 1962.",
      equation: 'A + B → no reaction  (ΔG > 0 or kinetically inhibited)',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 0, activationEnergy: 200, isExothermic: false },
      followUpQuestions: ["How does temperature affect activation energy barriers?", "What is the difference between thermodynamic and kinetic stability?", "How would a catalyst change this?"],
      realWorldLink: "Stainless steel is 'stable' in water and air due to a passive chromium oxide surface layer — kinetically protected even though thermodynamics would allow corrosion.",
      mechanismSteps: []
    },
    complex: {
      headline: "Thermodynamic or kinetic inhibition: ΔG > 0 or Ea >> kT",
      body: "Non-reaction interpreted via transition state theory (TST): rate k = A·exp(−Ea/RT). If Ea >> kT, rate is negligible at ambient T. Alternatively, ΔG = ΔH − TΔS > 0 means thermodynamically non-spontaneous. Pearson's HSAB theory: hard acids prefer hard bases — mismatched pairs show little affinity. Hammond's postulate: endothermic reactions have late, high-energy transition states.",
      funFact: "Diamond is thermodynamically unstable relative to graphite at STP (ΔG < 0 for diamond → graphite) but kinetically stable due to a massive Ea. Your diamond ring will be graphite in about a billion years.",
      equation: 'k = A·e^(−Ea/RT)  [very small k → no observable reaction]',
      moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
      energyData: { deltaH: 0, activationEnergy: 200, isExothermic: false },
      followUpQuestions: ["How does Pearson's HSAB theory predict reactivity?", "What conditions would make this reaction proceed?", "How is transition state theory used to calculate rate constants?"],
      realWorldLink: "Nitrogen (N₂) is essentially unreactive at room temperature despite being thermodynamically able to form oxides — kinetic stability of the N≡N triple bond is why the atmosphere is 78% N₂.",
      mechanismSteps: []
    }
  }
}

// Fallback for unknown reaction types
function makeFallback(reactionResult, depthMode) {
  const typeName = reactionResult?.type || 'unknown'
  return {
    headline: "A chemical reaction occurred",
    body: depthMode === 'complex'
      ? `Reaction type '${typeName}' resulted in changes to chemical composition and energy state.`
      : depthMode === 'moderate'
      ? `The chemicals interacted and produced a noticeable change.`
      : `Something happened when you mixed these chemicals!`,
    funFact: "Every chemical reaction either absorbs or releases energy — chemistry is really just about energy moving around.",
    equation: reactionResult?.equation || '',
    moleculeKeys: { reactant1: null, reactant2: null, product1: null, product2: null },
    energyData: { deltaH: reactionResult?.temperatureChange || 0, activationEnergy: 30, isExothermic: (reactionResult?.temperatureChange || 0) < 0 },
    followUpQuestions: ["What would happen if you changed the temperature?", "What would a stronger version of these chemicals do?", "Can this reaction be reversed?"],
    realWorldLink: "Chemical reactions power everything from your phone battery to the Sun itself.",
    mechanismSteps: []
  }
}

/**
 * Returns depth-appropriate content for a reaction result.
 * @param {object} reactionResult - Full ReactionResult from reactionEngine
 * @param {'easy'|'moderate'|'complex'} depthMode
 * @returns {object} DepthContent
 */
export function getDepthContent(reactionResult, depthMode) {
  if (!reactionResult) return makeFallback(null, depthMode)

  const type = reactionResult.type
  const modeContent = REACTION_CONTENT[type]?.[depthMode]
  
  if (!modeContent) {
    // Try other modes as fallback
    const fallbackContent = REACTION_CONTENT[type]?.easy || makeFallback(reactionResult, depthMode)
    return fallbackContent
  }

  return {
    headline: modeContent.headline,
    body: modeContent.body,
    funFact: modeContent.funFact,
    equation: modeContent.equation || '',
    moleculeKeys: modeContent.moleculeKeys || { reactant1: null, reactant2: null, product1: null, product2: null },
    energyData: modeContent.energyData || { deltaH: 0, activationEnergy: 30, isExothermic: false },
    followUpQuestions: modeContent.followUpQuestions || [],
    realWorldLink: modeContent.realWorldLink || '',
    mechanismSteps: modeContent.mechanismSteps || [],
  }
}

// Legacy export for backward compatibility
export function getDescription(reactionResult, depthMode) {
  const content = getDepthContent(reactionResult, depthMode)
  return content ? content.headline + ' ' + content.body : ''
}

export function getWhatHappenedContent(reactionResult, depthMode) {
  return getDepthContent(reactionResult, depthMode)
}
