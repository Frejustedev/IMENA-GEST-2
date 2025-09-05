import { ScintigraphyExam } from './types';

export const QUICK_PHRASES: { [key in ScintigraphyExam]?: { group: string, phrases: string[] }[] } = {
  "Scintigraphie Osseuse": [
    {
        group: "Résultats Normaux",
        phrases: [
            "Absence de foyer d'hyperfixation pathologique suspect.",
            "Distribution homogène du traceur sur l'ensemble du squelette.",
            "Fixation symétrique des ceintures scapulaire et pelvienne.",
            "Visualisation normale des reins et de la vessie (élimination urinaire)."
        ]
    },
    {
        group: "Lésions Douteuses",
        phrases: [
            "Foyer d'hyperfixation modérée au niveau de [LOCALISATION], non spécifique, à corréler aux données morphologiques.",
            "Multiples foyers d'hyperfixation d'allure dégénérative arthrosique."
        ]
    },
    {
        group: "Lésions Suspectes",
        phrases: [
            "Foyer d'hyperfixation intense et focalisé au niveau de [LOCALISATION], suspect de localisation secondaire.",
            "Multiples foyers d'hyperfixation pathologique disséminés, évocateurs de localisations secondaires."
        ]
    }
  ],
   "Scintigraphie Thyroïdienne": [
    {
        group: "Aspects",
        phrases: [
            "La thyroïde est en position normale.",
            "La fixation du traceur est homogène.",
            "Absence de nodule hypo ou hyperfixant individualisable."
        ]
    },
    {
        group: "Pathologies",
        phrases: [
            "Goitre multinodulaire avec nodules de tailles variables, certains hypo et d'autres hyperfixants.",
            "Nodule unique, froid, du lobe [droit/gauche], à explorer par échographie.",
            "Hyperfixation intense et diffuse compatible avec une maladie de Basedow."
        ]
    }
  ]
};
