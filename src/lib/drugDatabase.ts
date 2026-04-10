import { DrugInteraction, Medication } from '@/types';

interface DrugInfo {
  name: string;
  aliases: string[];
  category: string;
  ingredients: string[];
}

export const drugDatabase: DrugInfo[] = [
  { name: 'Warfarin', aliases: ['Coumadin', 'Jantoven'], category: 'Anticoagulant', ingredients: ['warfarin sodium'] },
  { name: 'Aspirin', aliases: ['Bayer', 'Ecotrin', 'Bufferin'], category: 'NSAID', ingredients: ['acetylsalicylic acid'] },
  { name: 'Ibuprofen', aliases: ['Advil', 'Motrin', 'Nurofen'], category: 'NSAID', ingredients: ['ibuprofen'] },
  { name: 'Metformin', aliases: ['Glucophage', 'Fortamet', 'Riomet'], category: 'Antidiabetic', ingredients: ['metformin hydrochloride'] },
  { name: 'Lisinopril', aliases: ['Prinivil', 'Zestril'], category: 'ACE Inhibitor', ingredients: ['lisinopril'] },
  { name: 'Atorvastatin', aliases: ['Lipitor'], category: 'Statin', ingredients: ['atorvastatin calcium'] },
  { name: 'Amlodipine', aliases: ['Norvasc'], category: 'Calcium Channel Blocker', ingredients: ['amlodipine besylate'] },
  { name: 'Omeprazole', aliases: ['Prilosec', 'Losec'], category: 'PPI', ingredients: ['omeprazole'] },
  { name: 'Metoprolol', aliases: ['Lopressor', 'Toprol-XL'], category: 'Beta Blocker', ingredients: ['metoprolol tartrate', 'metoprolol succinate'] },
  { name: 'Losartan', aliases: ['Cozaar'], category: 'ARB', ingredients: ['losartan potassium'] },
  { name: 'Simvastatin', aliases: ['Zocor'], category: 'Statin', ingredients: ['simvastatin'] },
  { name: 'Gabapentin', aliases: ['Neurontin', 'Gralise'], category: 'Anticonvulsant', ingredients: ['gabapentin'] },
  { name: 'Hydrocodone', aliases: ['Vicodin', 'Norco', 'Lortab'], category: 'Opioid', ingredients: ['hydrocodone bitartrate'] },
  { name: 'Tramadol', aliases: ['Ultram', 'ConZip'], category: 'Opioid', ingredients: ['tramadol hydrochloride'] },
  { name: 'Sertraline', aliases: ['Zoloft'], category: 'SSRI', ingredients: ['sertraline hydrochloride'] },
  { name: 'Fluoxetine', aliases: ['Prozac', 'Sarafem'], category: 'SSRI', ingredients: ['fluoxetine hydrochloride'] },
  { name: 'Citalopram', aliases: ['Celexa'], category: 'SSRI', ingredients: ['citalopram hydrobromide'] },
  { name: 'Paroxetine', aliases: ['Paxil', 'Pexeva'], category: 'SSRI', ingredients: ['paroxetine hydrochloride'] },
  { name: 'Diazepam', aliases: ['Valium'], category: 'Benzodiazepine', ingredients: ['diazepam'] },
  { name: 'Alprazolam', aliases: ['Xanax'], category: 'Benzodiazepine', ingredients: ['alprazolam'] },
  { name: 'Clopidogrel', aliases: ['Plavix'], category: 'Antiplatelet', ingredients: ['clopidogrel bisulfate'] },
  { name: 'Prednisone', aliases: ['Deltasone', 'Rayos'], category: 'Corticosteroid', ingredients: ['prednisone'] },
  { name: 'Amoxicillin', aliases: ['Amoxil', 'Trimox'], category: 'Antibiotic', ingredients: ['amoxicillin'] },
  { name: 'Azithromycin', aliases: ['Zithromax', 'Z-Pack'], category: 'Antibiotic', ingredients: ['azithromycin'] },
  { name: 'Ciprofloxacin', aliases: ['Cipro'], category: 'Antibiotic', ingredients: ['ciprofloxacin'] },
  { name: 'Levothyroxine', aliases: ['Synthroid', 'Levoxyl', 'Tirosint'], category: 'Thyroid', ingredients: ['levothyroxine sodium'] },
  { name: 'Digoxin', aliases: ['Lanoxin', 'Digitalis'], category: 'Cardiac Glycoside', ingredients: ['digoxin'] },
  { name: 'Furosemide', aliases: ['Lasix'], category: 'Diuretic', ingredients: ['furosemide'] },
  { name: 'Spironolactone', aliases: ['Aldactone'], category: 'Diuretic', ingredients: ['spironolactone'] },
  { name: 'Potassium Chloride', aliases: ['K-Dur', 'Klor-Con'], category: 'Electrolyte', ingredients: ['potassium chloride'] },
  { name: 'Naproxen', aliases: ['Aleve', 'Naprosyn'], category: 'NSAID', ingredients: ['naproxen sodium', 'naproxen'] },
  { name: 'Diclofenac', aliases: ['Voltaren', 'Cataflam'], category: 'NSAID', ingredients: ['diclofenac sodium'] },
  { name: 'Meloxicam', aliases: ['Mobic'], category: 'NSAID', ingredients: ['meloxicam'] },
  { name: 'Celecoxib', aliases: ['Celebrex'], category: 'NSAID', ingredients: ['celecoxib'] },
  { name: 'Sildenafil', aliases: ['Viagra', 'Revatio'], category: 'PDE5 Inhibitor', ingredients: ['sildenafil citrate'] },
  { name: 'Tadalafil', aliases: ['Cialis', 'Adcirca'], category: 'PDE5 Inhibitor', ingredients: ['tadalafil'] },
  { name: 'Nitroglycerin', aliases: ['Nitrostat', 'Tridil'], category: 'Nitrate', ingredients: ['nitroglycerin'] },
  { name: 'Isosorbide Mononitrate', aliases: ['Imdur'], category: 'Nitrate', ingredients: ['isosorbide mononitrate'] },
];

const drugInteractions: Array<{
  drug1: string[];
  drug2: string[];
  severity: 'safe' | 'caution' | 'danger';
  description: string;
  recommendation: string;
}> = [
  {
    drug1: ['Warfarin'],
    drug2: ['Aspirin', 'Ibuprofen', 'Naproxen', 'Diclofenac', 'Meloxicam', 'Celecoxib'],
    severity: 'danger',
    description: 'NSAIDs can increase the anticoagulant effect of Warfarin and increase the risk of bleeding.',
    recommendation: 'Avoid this combination. Consult your doctor for alternative pain relief options.',
  },
  {
    drug1: ['Warfarin'],
    drug2: ['Fluconazole', 'Metronidazole', 'Azithromycin', 'Ciprofloxacin'],
    severity: 'danger',
    description: 'These antibiotics can significantly increase Warfarin levels, increasing bleeding risk.',
    recommendation: 'Monitor closely and adjust Warfarin dose if needed. More frequent INR testing recommended.',
  },
  {
    drug1: ['Metformin'],
    drug2: ['Ciprofloxacin'],
    severity: 'caution',
    description: 'Ciprofloxacin may affect blood glucose levels when taken with Metformin.',
    recommendation: 'Monitor blood glucose more frequently. Report any unusual levels to your doctor.',
  },
  {
    drug1: ['Lisinopril', 'Losartan'],
    drug2: ['Potassium Chloride', 'Spironolactone'],
    severity: 'danger',
    description: 'ACE inhibitors/ARBs combined with potassium-sparing agents can cause dangerous hyperkalemia.',
    recommendation: 'Avoid this combination unless specifically directed by your doctor. Get potassium levels checked.',
  },
  {
    drug1: ['Simvastatin', 'Atorvastatin'],
    drug2: ['Azithromycin', 'Ciprofloxacin'],
    severity: 'caution',
    description: 'These antibiotics may increase statin levels, increasing risk of muscle problems.',
    recommendation: 'Consider temporary statin dose reduction. Monitor for muscle pain or weakness.',
  },
  {
    drug1: ['Sertraline', 'Fluoxetine', 'Citalopram', 'Paroxetine'],
    drug2: ['Tramadol'],
    severity: 'danger',
    description: 'Combining SSRIs with Tramadol increases risk of serotonin syndrome and seizures.',
    recommendation: 'Do not combine these medications. Talk to your doctor about alternatives.',
  },
  {
    drug1: ['Sertraline', 'Fluoxetine', 'Citalopram', 'Paroxetine'],
    drug2: ['Aspirin', 'Ibuprofen', 'Naproxen', 'Diclofenac'],
    severity: 'caution',
    description: 'SSRIs combined with NSAIDs may increase the risk of bleeding, especially in the stomach.',
    recommendation: 'Take with food. Consider a stomach-protecting medication. Report any unusual bruising or bleeding.',
  },
  {
    drug1: ['Diazepam', 'Alprazolam'],
    drug2: ['Hydrocodone', 'Tramadol'],
    severity: 'danger',
    description: 'Combining benzodiazepines with opioids increases the risk of severe respiratory depression and death.',
    recommendation: 'This combination requires careful monitoring by your doctor. Do not combine without medical supervision.',
  },
  {
    drug1: ['Digoxin'],
    drug2: ['Amiodarone', 'Azithromycin', 'Ciprofloxacin'],
    severity: 'danger',
    description: 'These medications can increase Digoxin levels to toxic amounts.',
    recommendation: 'Digoxin dose may need adjustment. Watch for nausea, vision changes, or irregular heartbeat.',
  },
  {
    drug1: ['Clopidogrel'],
    drug2: ['Omeprazole'],
    severity: 'caution',
    description: 'Omeprazole may reduce the effectiveness of Clopidogrel.',
    recommendation: 'Consider an alternative stomach acid reducer like Famotidine. Discuss with your doctor.',
  },
  {
    drug1: ['Levothyroxine'],
    drug2: ['Omeprazole', 'Lisinopril'],
    severity: 'caution',
    description: 'These medications may reduce Levothyroxine absorption.',
    recommendation: 'Take Levothyroxine on an empty stomach, at least 30-60 minutes before other medications.',
  },
  {
    drug1: ['Nitroglycerin', 'Isosorbide Mononitrate'],
    drug2: ['Sildenafil', 'Tadalafil'],
    severity: 'danger',
    description: 'Combining nitrates with PDE5 inhibitors can cause severe, life-threatening hypotension.',
    recommendation: 'Never combine these medications. If you need both, discuss alternatives with your doctor.',
  },
  {
    drug1: ['Furosemide', 'Spironolactone'],
    drug2: ['Lisinopril', 'Losartan'],
    severity: 'caution',
    description: 'This combination can cause low blood pressure and affect kidney function.',
    recommendation: 'Rise slowly from sitting/lying position. Report dizziness or swelling to your doctor.',
  },
  {
    drug1: ['Metoprolol', 'Amlodipine'],
    drug2: ['Digoxin'],
    severity: 'caution',
    description: 'Both can slow heart rate. Combined effect may be too strong.',
    recommendation: 'Monitor heart rate regularly. Report excessive slowing, dizziness, or fatigue.',
  },
  {
    drug1: ['Prednisone'],
    drug2: ['Ibuprofen', 'Naproxen', 'Diclofenac', 'Aspirin'],
    severity: 'danger',
    description: 'Both increase bleeding risk. Corticosteroids also reduce stomach protection from NSAIDs.',
    recommendation: 'Avoid this combination. Consider Acetaminophen for pain instead.',
  },
  {
    drug1: ['Amoxicillin'],
    drug2: ['Methotrexate'],
    severity: 'caution',
    description: 'Amoxicillin may increase Methotrexate levels.',
    recommendation: 'Monitor for signs of Methotrexate toxicity. Stay well hydrated.',
  },
  {
    drug1: ['Azithromycin'],
    drug2: ['Warfarin'],
    severity: 'caution',
    description: 'Azithromycin may increase Warfarin effect and bleeding risk.',
    recommendation: 'More frequent INR monitoring recommended. Report any unusual bruising or bleeding.',
  },
];

export function findDrug(name: string): DrugInfo | undefined {
  const lowerName = name.toLowerCase();
  return drugDatabase.find(
    drug =>
      drug.name.toLowerCase() === lowerName ||
      drug.aliases.some(alias => alias.toLowerCase() === lowerName)
  );
}

export function searchDrugs(query: string): DrugInfo[] {
  const lowerQuery = query.toLowerCase();
  return drugDatabase.filter(
    drug =>
      drug.name.toLowerCase().includes(lowerQuery) ||
      drug.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))
  );
}

export function checkDrugInteractions(
  drugNames: string[],
  userAllergies: string[] = []
): { safe: boolean; interactions: DrugInteraction[]; allergyAlerts: string[] } {
  const interactions: DrugInteraction[] = [];
  const allergyAlerts: string[] = [];

  for (let i = 0; i < drugNames.length; i++) {
    for (let j = i + 1; j < drugNames.length; j++) {
      const drug1 = findDrug(drugNames[i]);
      const drug2 = findDrug(drugNames[j]);

      if (!drug1 || !drug2) continue;

      for (const interaction of drugInteractions) {
        const drug1Matches =
          interaction.drug1.includes(drug1.name) ||
          interaction.drug1.some(d => drug1.aliases.includes(d));
        const drug2Matches =
          interaction.drug2.includes(drug2.name) ||
          interaction.drug2.some(d => drug2.aliases.includes(d));
        const reverseDrug1Matches =
          interaction.drug2.includes(drug1.name) ||
          interaction.drug2.some(d => drug1.aliases.includes(d));
        const reverseDrug2Matches =
          interaction.drug1.includes(drug2.name) ||
          interaction.drug1.some(d => drug2.aliases.includes(d));

        if ((drug1Matches && drug2Matches) || (reverseDrug1Matches && reverseDrug2Matches)) {
          interactions.push({
            drug1: drug1.name,
            drug2: drug2.name,
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation,
          });
        }
      }
    }
  }

  drugNames.forEach(drugName => {
    const drug = findDrug(drugName);
    if (drug) {
      userAllergies.forEach(allergy => {
        const allergyLower = allergy.toLowerCase();
        if (
          drug.ingredients.some(ing => ing.toLowerCase().includes(allergyLower)) ||
          drug.name.toLowerCase().includes(allergyLower)
        ) {
          allergyAlerts.push(
            `You have listed "${allergy}" as an allergy. ${drug.name} contains ${drug.ingredients.join(', ')}. Please consult your doctor.`
          );
        }
      });
    }
  });

  const hasDanger = interactions.some(i => i.severity === 'danger');
  const hasCaution = interactions.some(i => i.severity === 'caution');

  return {
    safe: !hasDanger && !hasCaution && allergyAlerts.length === 0,
    interactions,
    allergyAlerts,
  };
}

export function createMedicationFromDrug(drugName: string, dosage: string): Omit<Medication, 'id'> {
  const drug = findDrug(drugName);
  return {
    name: drug?.name || drugName,
    genericName: drug?.aliases[0],
    dosage,
    frequency: 'daily',
    times: ['morning'],
    startDate: new Date().toISOString(),
  };
}
