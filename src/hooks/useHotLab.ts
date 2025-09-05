import { useCallback, useEffect } from 'react';
import { useHotLabStore } from '../stores/hotLabStore';
import { TracerLot, PreparationLog } from '../../types';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personnalisé pour la gestion du laboratoire chaud
 * Encapsule la logique métier et fournit une API simple aux composants
 */
export const useHotLab = () => {
  const {
    hotLabData,
    isLoading,
    error,
    safetyAlerts,
    addLot,
    updateLot,
    removeLot,
    addPreparation,
    updatePreparation,
    removePreparation,
    getAvailableLots,
    getLotById,
    getPreparationById,
    getCurrentActivity,
    getStatistics,
    refreshSafetyAlerts,
    validateLotData,
    validatePreparationData,
    clearError,
    loadHotLabData
  } = useHotLabStore();

  const { isAuthenticated } = useAuth();

  // Charger les données Hot Lab automatiquement si authentifié
  useEffect(() => {
    if (isAuthenticated) {
      loadHotLabData();
    }
  }, [isAuthenticated, loadHotLabData]);

  // Actions encapsulées avec validation
  const handleAddLot = useCallback(async (lotData: Omit<TracerLot, 'id'>) => {
    try {
      const validationErrors = validateLotData(lotData);
      
      if (validationErrors.length > 0) {
        return { 
          success: false, 
          errors: validationErrors 
        };
      }

      addLot(lotData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'] 
      };
    }
  }, [addLot, validateLotData]);

  const handleAddPreparation = useCallback(async (prepData: Omit<PreparationLog, 'id'>) => {
    try {
      const validationErrors = validatePreparationData(prepData);
      
      if (validationErrors.length > 0) {
        return { 
          success: false, 
          errors: validationErrors 
        };
      }

      addPreparation(prepData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'] 
      };
    }
  }, [addPreparation, validatePreparationData]);

  const handleRemoveLot = useCallback(async (lotId: string) => {
    try {
      // Vérifier s'il y a des préparations liées
      const linkedPreparations = hotLabData.preparations.filter(
        prep => prep.tracerLotId === lotId
      );
      
      if (linkedPreparations.length > 0) {
        return {
          success: false,
          errors: ['Impossible de supprimer ce lot car il a des préparations associées']
        };
      }

      removeLot(lotId);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Erreur lors de la suppression'] 
      };
    }
  }, [removeLot, hotLabData.preparations]);

  // Getters avec mémoisation
  const getAvailableLotsData = useCallback(() => {
    return getAvailableLots();
  }, [getAvailableLots, hotLabData.lots]);

  const getStatisticsData = useCallback(() => {
    return getStatistics();
  }, [getStatistics, hotLabData]);

  // Utilitaires avancés
  const getLotWithCurrentActivity = useCallback((lotId: string) => {
    const lot = getLotById(lotId);
    if (!lot) return null;
    
    return {
      ...lot,
      currentActivity: getCurrentActivity(lotId)
    };
  }, [getLotById, getCurrentActivity]);

  const getPreparationWithLotInfo = useCallback((prepId: string) => {
    const preparation = getPreparationById(prepId);
    if (!preparation) return null;
    
    const lot = getLotById(preparation.tracerLotId);
    const product = hotLabData.products.find(p => p.id === lot?.productId);
    
    return {
      ...preparation,
      lot,
      product
    };
  }, [getPreparationById, getLotById, hotLabData.products]);

  // Fonctions de recherche et filtrage
  const searchLots = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return hotLabData.lots;
    
    const term = searchTerm.toLowerCase();
    return hotLabData.lots.filter(lot => {
      const product = hotLabData.products.find(p => p.id === lot.productId);
      return (
        lot.lotNumber.toLowerCase().includes(term) ||
        product?.name.toLowerCase().includes(term) ||
        product?.isotope.toLowerCase().includes(term)
      );
    });
  }, [hotLabData.lots, hotLabData.products]);

  const searchPreparations = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return hotLabData.preparations;
    
    const term = searchTerm.toLowerCase();
    return hotLabData.preparations.filter(prep => {
      const lot = getLotById(prep.tracerLotId);
      const product = lot ? hotLabData.products.find(p => p.id === lot.productId) : null;
      
      return (
        prep.preparedBy.toLowerCase().includes(term) ||
        prep.patientId?.toLowerCase().includes(term) ||
        prep.examType?.toLowerCase().includes(term) ||
        lot?.lotNumber.toLowerCase().includes(term) ||
        product?.name.toLowerCase().includes(term)
      );
    });
  }, [hotLabData.preparations, getLotById, hotLabData.products]);

  // Alertes et sécurité
  const getHighPriorityAlerts = useCallback(() => {
    return safetyAlerts.filter(alert => alert.type === 'danger');
  }, [safetyAlerts]);

  const getAlertsByType = useCallback((type: 'warning' | 'danger' | 'info') => {
    return safetyAlerts.filter(alert => alert.type === type);
  }, [safetyAlerts]);

  return {
    // État
    hotLabData,
    isLoading,
    error,
    safetyAlerts,
    
    // Actions CRUD
    addLot: handleAddLot,
    updateLot,
    removeLot: handleRemoveLot,
    addPreparation: handleAddPreparation,
    updatePreparation,
    removePreparation,
    
    // Getters de base
    getLotById,
    getPreparationById,
    getCurrentActivity,
    getAvailableLots: getAvailableLotsData,
    
    // Getters avancés
    getLotWithCurrentActivity,
    getPreparationWithLotInfo,
    
    // Recherche et filtrage
    searchLots,
    searchPreparations,
    
    // Statistiques
    getStatistics: getStatisticsData,
    
    // Alertes
    getHighPriorityAlerts,
    getAlertsByType,
    refreshSafetyAlerts,
    
    // Validation
    validateLotData,
    validatePreparationData,
    
    // Utilitaires
    clearError,
    loadHotLabData
  };
};

/**
 * Hook pour un lot spécifique avec activité courante
 */
export const useLot = (lotId: string) => {
  const { getLotWithCurrentActivity } = useHotLab();
  return getLotWithCurrentActivity(lotId);
};

/**
 * Hook pour une préparation spécifique avec informations du lot
 */
export const usePreparation = (prepId: string) => {
  const { getPreparationWithLotInfo } = useHotLab();
  return getPreparationWithLotInfo(prepId);
};

/**
 * Hook pour les lots disponibles uniquement
 */
export const useAvailableLots = () => {
  const { getAvailableLots } = useHotLab();
  return getAvailableLots();
};

/**
 * Hook pour les alertes de sécurité critiques
 */
export const useSafetyAlerts = () => {
  const { safetyAlerts, getHighPriorityAlerts, getAlertsByType } = useHotLab();
  
  return {
    allAlerts: safetyAlerts,
    criticalAlerts: getHighPriorityAlerts(),
    warningAlerts: getAlertsByType('warning'),
    infoAlerts: getAlertsByType('info')
  };
};
