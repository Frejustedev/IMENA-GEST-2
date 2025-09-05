import { ScintigraphyExam } from './types';

export interface ReportTemplate {
  name: string;
  report: string;
  conclusion: string;
}

export const REPORT_TEMPLATES: { [key in ScintigraphyExam]?: ReportTemplate[] } = {
  "Scintigraphie Osseuse": [
    {
      name: "Scintigraphie Osseuse - Normale",
      report: `
        <p><b>Technique :</b></p>
        <p>Injection intraveineuse de 740 MBq de 99mTc-HMDP. Acquisition d'images corps entier et de clichés statiques 3 heures après l'injection.</p>
        <p><b>Résultats :</b></p>
        <p>L'examen met en évidence une distribution homogène du traceur sur l'ensemble du squelette, sans foyer d'hyperfixation pathologique suspect.</p>
        <ul>
            <li>Fixation symétrique des ceintures scapulaire et pelvienne.</li>
            <li>Rachis sans anomalie de fixation.</li>
            <li>Articulations périphériques présentant une fixation modérée et symétrique, en rapport avec des remaniements dégénératifs d'arthrose.</li>
        </ul>
        <p>Visualisation normale des reins et de la vessie (élimination urinaire).</p>
      `,
      conclusion: "<p>Absence d'anomalie de fixation osseuse TDM-scintigraphique suspecte d'une localisation secondaire.</p>"
    },
    {
      name: "Scintigraphie Osseuse - Métastases Multiples",
      report: `
        <p><b>Technique :</b></p>
        <p>Injection intraveineuse de 740 MBq de 99mTc-HMDP. Acquisition d'images corps entier et de clichés statiques 3 heures après l'injection.</p>
        <p><b>Résultats :</b></p>
        <p>L'examen met en évidence de multiples foyers d'hyperfixation pathologique intense, de topographie non systématisée, disséminés sur l'ensemble du squelette, notamment au niveau :</p>
        <ul>
            <li>Du rachis dorsal et lombaire.</li>
            <li>Du bassin (ilium droit, sacrum).</li>
            <li>Des côtes (arcs postérieurs droits).</li>
            <li>Du fémur proximal gauche.</li>
        </ul>
        <p>Ces lésions sont très suspectes de localisations secondaires osseuses.</p>
      `,
      conclusion: "<p>Multiples foyers d'hyperfixation pathologique disséminés sur le squelette, fortement évocateurs de localisations secondaires multiples.</p>"
    }
  ],
  "Scintigraphie Thyroïdienne": [
    {
        name: "Scintigraphie Thyroïdienne - Normale",
        report: `
            <p><b>Technique :</b></p>
            <p>Injection intraveineuse de 185 MBq de 99mTc-Pertechnétate. Acquisition d'images statiques 20 minutes après l'injection.</p>
            <p><b>Résultats :</b></p>
            <p>La thyroïde est en position normale. La fixation du traceur est homogène sur l'ensemble des deux lobes, sans nodule hypo ou hyperfixant individualisable.</p>
            <p>Les contours sont réguliers, la taille de la glande est estimée normale.</p>
        `,
        conclusion: "<p>Scintigraphie thyroïdienne d'aspect normal.</p>"
    },
    {
        name: "Scintigraphie Thyroïdienne - Basedow",
        report: `
            <p><b>Technique :</b></p>
            <p>Injection intraveineuse de 185 MBq de 99mTc-Pertechnétate. Acquisition d'images statiques 20 minutes après l'injection.</p>
            <p><b>Résultats :</b></p>
            <p>La thyroïde est en position normale, de taille augmentée.</p>
            <p>La fixation du traceur est intense et diffuse sur l'ensemble des deux lobes, sans nodule individualisable. Cet aspect est typique d'une maladie de Basedow.</p>
        `,
        conclusion: "<p>Goitre vasculaire hyperfixant de manière intense et homogène, compatible avec une maladie de Basedow dans le contexte clinique et biologique.</p>"
    }
  ]
};

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
