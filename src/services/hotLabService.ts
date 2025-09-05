import { HotLabData, TracerLot, PreparationLog, RadiopharmaceuticalProduct } from '../../types';

/**
 * Service de gestion du laboratoire chaud
 * Centralise toute la logique métier liée aux produits radiopharmaceutiques
 */

export class HotLabService {
  /**
   * Calcule la décroissance radioactive
   */
  static calculateRadioactiveDecay(
    initialActivity: number,
    halfLife: number, // en heures
    elapsedTime: number // en heures
  ): number {
    return initialActivity * Math.pow(0.5, elapsedTime / halfLife);
  }

  /**
   * Vérifie si un lot est expiré
   */
  static isLotExpired(lot: TracerLot): boolean {
    const today = new Date().toISOString().split('T')[0];
    return lot.expiryDate < today;
  }

  /**
   * Obtient les lots disponibles (non expirés)
   */
  static getAvailableLots(lots: TracerLot[]): TracerLot[] {
    return lots.filter(lot => !this.isLotExpired(lot));
  }

  /**
   * Calcule l'activité actuelle d'un lot en tenant compte de la décroissance
   */
  static getCurrentActivity(lot: TracerLot, product: RadiopharmaceuticalProduct): number {
    if (!lot.initialActivity || !lot.calibrationDateTime) {
      return 0;
    }

    // Temps de demi-vie par isotope (en heures)
    const halfLives: Record<string, number> = {
      '99mTc': 6.01,
      '18F': 1.83,
      '68Ga': 1.13,
      '131I': 192.8, // ~8 jours
      '123I': 13.2,
      '111In': 67.3 // ~2.8 jours
    };

    const halfLife = halfLives[product.isotope];
    if (!halfLife) {
      console.warn(`Temps de demi-vie inconnu pour l'isotope ${product.isotope}`);
      return lot.initialActivity;
    }

    const calibrationTime = new Date(lot.calibrationDateTime).getTime();
    const currentTime = new Date().getTime();
    const elapsedHours = (currentTime - calibrationTime) / (1000 * 60 * 60);

    return this.calculateRadioactiveDecay(lot.initialActivity, halfLife, elapsedHours);
  }

  /**
   * Valide les données d'un nouveau lot
   */
  static validateLotData(lotData: Partial<TracerLot>): string[] {
    const errors: string[] = [];

    if (!lotData.productId) {
      errors.push('Le produit est requis');
    }

    if (!lotData.lotNumber?.trim()) {
      errors.push('Le numéro de lot est requis');
    }

    if (!lotData.expiryDate) {
      errors.push('La date d\'expiration est requise');
    } else {
      const expiryDate = new Date(lotData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate < today) {
        errors.push('La date d\'expiration ne peut pas être dans le passé');
      }
    }

    if (lotData.initialActivity && lotData.initialActivity <= 0) {
      errors.push('L\'activité initiale doit être positive');
    }

    if (lotData.quantityReceived && lotData.quantityReceived <= 0) {
      errors.push('La quantité reçue doit être positive');
    }

    return errors;
  }

  /**
   * Valide les données d'une nouvelle préparation
   */
  static validatePreparationData(prepData: Partial<PreparationLog>): string[] {
    const errors: string[] = [];

    if (!prepData.tracerLotId) {
      errors.push('Le lot de traceur est requis');
    }

    if (!prepData.activityPrepared || prepData.activityPrepared <= 0) {
      errors.push('L\'activité préparée doit être positive');
    }

    if (!prepData.preparationDateTime) {
      errors.push('La date et heure de préparation sont requises');
    } else {
      const prepDate = new Date(prepData.preparationDateTime);
      const now = new Date();
      
      if (prepDate > now) {
        errors.push('La date de préparation ne peut pas être dans le futur');
      }
    }

    if (!prepData.preparedBy?.trim()) {
      errors.push('Le nom du préparateur est requis');
    }

    return errors;
  }

  /**
   * Crée un nouveau lot avec ID généré
   */
  static createLot(lotData: Omit<TracerLot, 'id'>): TracerLot {
    return {
      ...lotData,
      id: `lot_${Date.now()}`
    };
  }

  /**
   * Crée une nouvelle préparation avec ID généré
   */
  static createPreparation(prepData: Omit<PreparationLog, 'id'>): PreparationLog {
    return {
      ...prepData,
      id: `prep_${Date.now()}`
    };
  }

  /**
   * Calcule les statistiques du laboratoire chaud
   */
  static calculateStatistics(hotLabData: HotLabData) {
    const totalLots = hotLabData.lots.length;
    const availableLots = this.getAvailableLots(hotLabData.lots).length;
    const expiredLots = totalLots - availableLots;
    
    const totalPreparations = hotLabData.preparations.length;
    
    // Préparations du jour
    const today = new Date().toISOString().split('T')[0];
    const todaysPreparations = hotLabData.preparations.filter(prep =>
      prep.preparationDateTime.startsWith(today)
    ).length;

    // Activité totale préparée aujourd'hui
    const todaysTotalActivity = hotLabData.preparations
      .filter(prep => prep.preparationDateTime.startsWith(today))
      .reduce((total, prep) => total + prep.activityPrepared, 0);

    return {
      totalLots,
      availableLots,
      expiredLots,
      totalPreparations,
      todaysPreparations,
      todaysTotalActivity
    };
  }

  /**
   * Génère des alertes de sécurité pour le laboratoire chaud
   */
  static generateSafetyAlerts(hotLabData: HotLabData, products: RadiopharmaceuticalProduct[]) {
    const alerts: Array<{
      type: 'warning' | 'danger' | 'info';
      message: string;
      lotId?: string;
      prepId?: string;
    }> = [];

    // Vérifier les lots qui expirent bientôt
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    hotLabData.lots.forEach(lot => {
      if (!this.isLotExpired(lot) && lot.expiryDate <= threeDaysStr) {
        alerts.push({
          type: 'warning',
          message: `Le lot ${lot.lotNumber} expire dans moins de 3 jours`,
          lotId: lot.id
        });
      }
    });

    // Vérifier les activités importantes
    const today = new Date().toISOString().split('T')[0];
    hotLabData.preparations.forEach(prep => {
      if (prep.preparationDateTime.startsWith(today) && prep.activityPrepared > 1000) {
        alerts.push({
          type: 'info',
          message: `Préparation d'activité élevée : ${prep.activityPrepared} ${prep.unit}`,
          prepId: prep.id
        });
      }
    });

    // Vérifier les lots avec activité résiduelle faible
    hotLabData.lots.forEach(lot => {
      const product = products.find(p => p.id === lot.productId);
      if (product && lot.initialActivity) {
        const currentActivity = this.getCurrentActivity(lot, product);
        const percentageRemaining = (currentActivity / lot.initialActivity) * 100;
        
        if (percentageRemaining < 10 && percentageRemaining > 0) {
          alerts.push({
            type: 'warning',
            message: `Activité résiduelle faible pour le lot ${lot.lotNumber} (${percentageRemaining.toFixed(1)}%)`,
            lotId: lot.id
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Calcule la dose à administrer basée sur le poids du patient
   */
  static calculateDoseByWeight(
    baseActivity: number, // MBq
    patientWeight: number, // kg
    standardWeight: number = 70 // kg
  ): number {
    return (baseActivity * patientWeight) / standardWeight;
  }

  /**
   * Convertit les unités d'activité
   */
  static convertActivity(value: number, fromUnit: string, toUnit: string): number {
    // Conversion vers MBq comme unité de base
    const toMBq: Record<string, number> = {
      'MBq': 1,
      'mCi': 37,
      'GBq': 1000,
      'Ci': 37000
    };

    // Conversion depuis MBq
    const fromMBq: Record<string, number> = {
      'MBq': 1,
      'mCi': 1/37,
      'GBq': 1/1000,
      'Ci': 1/37000
    };

    const mbqValue = value * toMBq[fromUnit];
    return mbqValue * fromMBq[toUnit];
  }
}
