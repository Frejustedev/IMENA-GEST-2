/**
 * Service de radioprotection avancé pour IMENA-GEST
 * Calculs dosimétriques, décroissance et contrôle qualité
 */

export interface IsotopeData {
  symbol: string;
  halfLife: number; // en heures
  decayConstant: number;
  energyKeV: number;
  doseRateFactor: number; // mSv/h par GBq à 1m
}

export interface DecayCalculation {
  originalActivity: number;
  currentActivity: number;
  decayFactor: number;
  timeElapsed: number; // en heures
  halfLivesElapsed: number;
  percentRemaining: number;
}

export interface DosimetryCalculation {
  patientDose: number; // mSv
  organDoses: Record<string, number>;
  effectiveDose: number;
  isWithinLimits: boolean;
  warnings: string[];
}

export interface QualityControl {
  id: string;
  lotId: string;
  testType: 'radiochemical_purity' | 'radionuclidic_purity' | 'pH' | 'sterility';
  result: number;
  unit: string;
  acceptanceCriteria: {
    min?: number;
    max?: number;
    target?: number;
  };
  passed: boolean;
  performedBy: string;
  timestamp: Date;
  notes?: string;
}

export class RadioprotectionService {
  // Base de données isotopes couramment utilisés
  private static isotopes: Record<string, IsotopeData> = {
    'Tc-99m': {
      symbol: 'Tc-99m',
      halfLife: 6.02, // heures
      decayConstant: 0.1151, // h⁻¹
      energyKeV: 140,
      doseRateFactor: 0.0017 // mSv/h par GBq à 1m
    },
    '99mTc': { // Alias pour Tc-99m
      symbol: 'Tc-99m',
      halfLife: 6.02,
      decayConstant: 0.1151,
      energyKeV: 140,
      doseRateFactor: 0.0017
    },
    'I-131': {
      symbol: 'I-131',
      halfLife: 192.96, // heures (8.04 jours)
      decayConstant: 0.00359,
      energyKeV: 364,
      doseRateFactor: 0.047
    },
    'F-18': {
      symbol: 'F-18',
      halfLife: 1.83, // heures (109.8 min)
      decayConstant: 0.3788,
      energyKeV: 511,
      doseRateFactor: 0.013
    },
    '18F': { // Alias pour F-18
      symbol: 'F-18',
      halfLife: 1.83,
      decayConstant: 0.3788,
      energyKeV: 511,
      doseRateFactor: 0.013
    },
    'Ga-68': {
      symbol: 'Ga-68',
      halfLife: 1.13, // heures (67.7 min)
      decayConstant: 0.6134,
      energyKeV: 511,
      doseRateFactor: 0.013
    },
    'In-111': {
      symbol: 'In-111',
      halfLife: 67.3, // heures (2.8 jours)
      decayConstant: 0.0103,
      energyKeV: 245,
      doseRateFactor: 0.0085
    }
  };

  /**
   * Calcule la décroissance radioactive
   */
  static calculateDecay(
    isotope: string,
    initialActivity: number,
    timeElapsed: number, // en heures
    unit: 'MBq' | 'mCi' | 'GBq' = 'MBq'
  ): DecayCalculation {
    const isotopeData = this.isotopes[isotope];
    if (!isotopeData) {
      throw new Error(`Isotope ${isotope} non supporté`);
    }

    const decayConstant = isotopeData.decayConstant;
    const halfLife = isotopeData.halfLife;
    
    // Formule de décroissance : A(t) = A₀ × e^(-λt)
    const decayFactor = Math.exp(-decayConstant * timeElapsed);
    const currentActivity = initialActivity * decayFactor;
    const halfLivesElapsed = timeElapsed / halfLife;
    const percentRemaining = decayFactor * 100;

    return {
      originalActivity: initialActivity,
      currentActivity: Math.round(currentActivity * 1000) / 1000,
      decayFactor: Math.round(decayFactor * 10000) / 10000,
      timeElapsed,
      halfLivesElapsed: Math.round(halfLivesElapsed * 100) / 100,
      percentRemaining: Math.round(percentRemaining * 100) / 100
    };
  }

  /**
   * Calcule la dosimétrie patient
   */
  static calculatePatientDosimetry(
    isotope: string,
    activity: number, // MBq
    examType: string,
    patientWeight: number, // kg
    patientAge: number, // années
    isPregnant: boolean = false
  ): DosimetryCalculation {
    const warnings: string[] = [];
    
    // Facteurs de dose par examen (mSv/MBq)
    const doseFactor = this.getDoseFactorByExam(examType, isotope);
    
    // Correction pédiatrique
    let weightFactor = 1;
    if (patientAge < 18) {
      weightFactor = Math.max(0.3, patientWeight / 70); // Minimum 30% dose adulte
      warnings.push('Dose pédiatrique appliquée');
    }
    
    // Dose effective
    const effectiveDose = activity * doseFactor * weightFactor;
    
    // Doses organes spécifiques
    const organDoses = this.calculateOrganDoses(isotope, examType, effectiveDose);
    
    // Vérification limites
    const limits = this.getDoseLimits(patientAge, isPregnant);
    const isWithinLimits = effectiveDose <= limits.effectiveDose;
    
    if (!isWithinLimits) {
      warnings.push(`Dose supérieure à la limite (${limits.effectiveDose} mSv)`);
    }
    
    if (isPregnant) {
      warnings.push('ATTENTION: Patiente enceinte - Évaluation spécialisée requise');
    }

    return {
      patientDose: Math.round(effectiveDose * 1000) / 1000,
      organDoses,
      effectiveDose: Math.round(effectiveDose * 1000) / 1000,
      isWithinLimits,
      warnings
    };
  }

  /**
   * Vérifie les critères de contrôle qualité
   */
  static performQualityControl(
    lotId: string,
    testType: QualityControl['testType'],
    result: number,
    unit: string,
    performedBy: string
  ): QualityControl {
    const criteria = this.getQualityCriteria(testType);
    
    let passed = true;
    if (criteria.min !== undefined && result < criteria.min) passed = false;
    if (criteria.max !== undefined && result > criteria.max) passed = false;
    
    return {
      id: `qc_${Date.now()}`,
      lotId,
      testType,
      result,
      unit,
      acceptanceCriteria: criteria,
      passed,
      performedBy,
      timestamp: new Date(),
      notes: passed ? 'Conforme' : 'Non conforme aux critères'
    };
  }

  /**
   * Calcule quand un lot expire ou devient inutilisable
   */
  static calculateExpiryAlert(
    isotope: string,
    initialActivity: number,
    minimumUsableActivity: number,
    preparedTime: Date
  ): {
    expiryTime: Date;
    timeRemaining: number; // heures
    isExpired: boolean;
    usabilityPercent: number;
  } {
    const isotopeData = this.isotopes[isotope];
    if (!isotopeData) {
      throw new Error(`Isotope ${isotope} non supporté`);
    }

    const now = new Date();
    const hoursElapsed = (now.getTime() - preparedTime.getTime()) / (1000 * 60 * 60);
    
    // Calculer quand l'activité tombera sous le seuil minimum
    const decayConstant = isotopeData.decayConstant;
    const timeToMinimum = Math.log(initialActivity / minimumUsableActivity) / decayConstant;
    
    const expiryTime = new Date(preparedTime.getTime() + timeToMinimum * 60 * 60 * 1000);
    const timeRemaining = Math.max(0, timeToMinimum - hoursElapsed);
    
    const currentDecay = this.calculateDecay(isotope, initialActivity, hoursElapsed);
    const usabilityPercent = (currentDecay.currentActivity / minimumUsableActivity) * 100;

    return {
      expiryTime,
      timeRemaining: Math.round(timeRemaining * 100) / 100,
      isExpired: timeRemaining <= 0,
      usabilityPercent: Math.min(100, Math.round(usabilityPercent * 100) / 100)
    };
  }

  /**
   * Génère des alertes intelligentes
   */
  static generateAlerts(lots: any[]): Array<{
    id: string;
    type: 'expiry' | 'quality' | 'safety' | 'regulatory';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    lotId?: string;
    actions?: string[];
  }> {
    const alerts = [];
    const now = new Date();

    for (const lot of lots) {
      try {
        // Alerte expiration
        const expiry = this.calculateExpiryAlert(
          lot.isotope || 'Tc-99m',
          lot.initialActivity || 0,
          lot.minimumActivity || lot.initialActivity * 0.1,
          new Date(lot.preparationTime || lot.receivedDate)
        );

        if (expiry.timeRemaining <= 1 && !expiry.isExpired) {
          alerts.push({
            id: `expiry_${lot.id}`,
            type: 'expiry',
            severity: 'high',
            title: 'Expiration Imminente',
            message: `Lot ${lot.lotNumber} expire dans ${expiry.timeRemaining.toFixed(1)}h`,
            lotId: lot.id,
            actions: ['Utiliser immédiatement', 'Marquer comme périmé']
          });
        } else if (expiry.isExpired) {
          alerts.push({
            id: `expired_${lot.id}`,
            type: 'expiry',
            severity: 'critical',
            title: 'Lot Expiré',
            message: `Lot ${lot.lotNumber} inutilisable - Activité insuffisante`,
            lotId: lot.id,
            actions: ['Éliminer selon protocole']
          });
        }

        // Alerte qualité manquante
        if (!lot.qualityControls || lot.qualityControls.length === 0) {
          alerts.push({
            id: `quality_${lot.id}`,
            type: 'quality',
            severity: 'medium',
            title: 'Contrôle Qualité Manquant',
            message: `Lot ${lot.lotNumber} - Effectuer CQ obligatoire`,
            lotId: lot.id,
            actions: ['Programmer CQ', 'Bloquer utilisation']
          });
        }

      } catch (error) {
        console.error('Erreur génération alerte pour lot', lot.id, error);
      }
    }

    return alerts;
  }

  // Méthodes privées utilitaires
  private static getDoseFactorByExam(examType: string, isotope: string): number {
    // Facteurs de dose en mSv/MBq selon type d'examen
    const factors: Record<string, Record<string, number>> = {
      'Scintigraphie Osseuse': { 'Tc-99m': 0.0063 },
      'Scintigraphie Thyroïdienne': { 'Tc-99m': 0.0011, 'I-131': 0.062 },
      'Scintigraphie Parathyroïdienne': { 'Tc-99m': 0.0063 },
      'Scintigraphie Rénale DMSA': { 'Tc-99m': 0.0067 },
      'Scintigraphie Rénale DTPA/MAG3': { 'Tc-99m': 0.0011 },
      'TEP-FDG': { 'F-18': 0.019 },
      'TEP-DOTATATE': { 'Ga-68': 0.021 }
    };

    return factors[examType]?.[isotope] || 0.005; // Valeur par défaut
  }

  private static calculateOrganDoses(
    isotope: string,
    examType: string,
    effectiveDose: number
  ): Record<string, number> {
    // Facteurs de distribution par organe selon l'examen
    const distributions: Record<string, Record<string, number>> = {
      'Scintigraphie Osseuse': {
        'Os': 0.8,
        'Reins': 0.1,
        'Vessie': 0.05,
        'Moelle osseuse': 0.05
      },
      'Scintigraphie Thyroïdienne': {
        'Thyroïde': 0.9,
        'Estomac': 0.05,
        'Reins': 0.03,
        'Vessie': 0.02
      }
    };

    const distribution = distributions[examType] || { 'Corps entier': 1.0 };
    const organDoses: Record<string, number> = {};

    for (const [organ, factor] of Object.entries(distribution)) {
      organDoses[organ] = Math.round(effectiveDose * factor * 1000) / 1000;
    }

    return organDoses;
  }

  private static getDoseLimits(age: number, isPregnant: boolean) {
    if (isPregnant) {
      return { effectiveDose: 1.0 }; // 1 mSv max grossesse
    } else if (age < 18) {
      return { effectiveDose: 10.0 }; // 10 mSv max pédiatrique
    } else {
      return { effectiveDose: 20.0 }; // 20 mSv max adulte
    }
  }

  private static getQualityCriteria(testType: QualityControl['testType']) {
    const criteria = {
      'radiochemical_purity': { min: 95.0, unit: '%' },
      'radionuclidic_purity': { min: 99.0, unit: '%' },
      'pH': { min: 4.5, max: 7.5, target: 6.0 },
      'sterility': { min: 0, max: 0, unit: 'CFU/ml' }
    };

    return criteria[testType] || { min: 0 };
  }
}
