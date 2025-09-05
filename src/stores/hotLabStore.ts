import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { HotLabData, TracerLot, PreparationLog, RadiopharmaceuticalProduct } from '../../types';
import { HotLabService } from '../services/hotLabService';
import { INITIAL_HOT_LAB_DATA } from '../../constants';

/**
 * Interface pour le store du laboratoire chaud
 */
interface HotLabState {
  // État
  hotLabData: HotLabData;
  isLoading: boolean;
  error: string | null;
  safetyAlerts: Array<{
    type: 'warning' | 'danger' | 'info';
    message: string;
    lotId?: string;
    prepId?: string;
  }>;

  // Actions pour les lots
  addLot: (lotData: Omit<TracerLot, 'id'>) => void;
  updateLot: (lotId: string, updates: Partial<TracerLot>) => void;
  removeLot: (lotId: string) => void;
  
  // Actions pour les préparations
  addPreparation: (prepData: Omit<PreparationLog, 'id'>) => void;
  updatePreparation: (prepId: string, updates: Partial<PreparationLog>) => void;
  removePreparation: (prepId: string) => void;
  
  // Getters
  getAvailableLots: () => TracerLot[];
  getLotById: (id: string) => TracerLot | undefined;
  getPreparationById: (id: string) => PreparationLog | undefined;
  getCurrentActivity: (lotId: string) => number;
  
  // Statistiques et alertes
  getStatistics: () => ReturnType<typeof HotLabService.calculateStatistics>;
  refreshSafetyAlerts: () => void;
  
  // Utilitaires
  validateLotData: (lotData: Partial<TracerLot>) => string[];
  validatePreparationData: (prepData: Partial<PreparationLog>) => string[];
  
  // Gestion d'erreur
  clearError: () => void;
  
  // Chargement initial
  loadHotLabData: () => void;
}

/**
 * Store Zustand pour la gestion du laboratoire chaud
 */
export const useHotLabStore = create<HotLabState>()(
  immer((set, get) => ({
    // État initial
    hotLabData: INITIAL_HOT_LAB_DATA,
    isLoading: false,
    error: null,
    safetyAlerts: [],

    // Actions pour les lots
    addLot: async (lotData) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const validationErrors = HotLabService.validateLotData(lotData);
        
        if (validationErrors.length > 0) {
          set((state) => {
            state.error = validationErrors.join(', ');
            state.isLoading = false;
          });
          return;
        }

        // Mapper les données du frontend vers le format API SQLite
        const product = INITIAL_HOT_LAB_DATA.products.find(p => p.id === lotData.productId);
        const tracerName = product?.name || 'Traceur inconnu';
        const isotope = product?.isotope || 'Tc-99m';
        
        // Envoyer vers l'API SQLite
        const response = await fetch('http://localhost:3001/api/v1/hotlab/tracer-lots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
          },
          body: JSON.stringify({
            tracerName: tracerName,
            isotope: isotope,
            activityMbq: lotData.initialActivity || 0,
            calibrationTime: lotData.calibrationDateTime ? new Date(lotData.calibrationDateTime).toISOString() : new Date().toISOString(),
            expiryTime: lotData.expiryDate ? new Date(lotData.expiryDate + 'T23:59:59').toISOString() : new Date().toISOString(),
            supplier: 'CIS bio international',
            batchNumber: lotData.lotNumber || 'LOT' + Date.now()
          })
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la création du lot en base');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message);
        }

        // Recharger les données Hot Lab
        await get().loadHotLabData();
        
        set((state) => {
          state.isLoading = false;
          state.error = null;
        });
        
        // Rafraîchir les alertes après ajout
        get().refreshSafetyAlerts();
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du lot';
          state.isLoading = false;
        });
      }
    },

    updateLot: (lotId, updates) => {
      set((state) => {
        const index = state.hotLabData.lots.findIndex(lot => lot.id === lotId);
        if (index !== -1) {
          state.hotLabData.lots[index] = { ...state.hotLabData.lots[index], ...updates };
        }
        state.error = null;
      });
      
      get().refreshSafetyAlerts();
    },

    removeLot: (lotId) => {
      set((state) => {
        // Vérifier s'il y a des préparations liées à ce lot
        const hasLinkedPreparations = state.hotLabData.preparations.some(
          prep => prep.tracerLotId === lotId
        );
        
        if (hasLinkedPreparations) {
          state.error = 'Impossible de supprimer ce lot car il a des préparations associées';
          return;
        }
        
        state.hotLabData.lots = state.hotLabData.lots.filter(lot => lot.id !== lotId);
        state.error = null;
      });
      
      get().refreshSafetyAlerts();
    },

    // Actions pour les préparations
    addPreparation: (prepData) => {
      try {
        const validationErrors = HotLabService.validatePreparationData(prepData);
        
        if (validationErrors.length > 0) {
          set((state) => {
            state.error = validationErrors.join(', ');
          });
          return;
        }

        const newPreparation = HotLabService.createPreparation(prepData);
        
        set((state) => {
          state.hotLabData.preparations.push(newPreparation);
          state.error = null;
        });
        
        // Rafraîchir les alertes après ajout
        get().refreshSafetyAlerts();
      } catch (error) {
        set((state) => {
          state.error = 'Erreur lors de l\'ajout de la préparation';
        });
      }
    },

    updatePreparation: (prepId, updates) => {
      set((state) => {
        const index = state.hotLabData.preparations.findIndex(prep => prep.id === prepId);
        if (index !== -1) {
          state.hotLabData.preparations[index] = { 
            ...state.hotLabData.preparations[index], 
            ...updates 
          };
        }
        state.error = null;
      });
    },

    removePreparation: (prepId) => {
      set((state) => {
        state.hotLabData.preparations = state.hotLabData.preparations.filter(
          prep => prep.id !== prepId
        );
        state.error = null;
      });
    },

    // Getters
    getAvailableLots: () => {
      return HotLabService.getAvailableLots(get().hotLabData.lots);
    },

    getLotById: (id) => {
      return get().hotLabData.lots.find(lot => lot.id === id);
    },

    getPreparationById: (id) => {
      return get().hotLabData.preparations.find(prep => prep.id === id);
    },

    getCurrentActivity: (lotId) => {
      const lot = get().getLotById(lotId);
      const product = get().hotLabData.products.find(p => p.id === lot?.productId);
      
      if (!lot || !product) {
        return 0;
      }
      
      return HotLabService.getCurrentActivity(lot, product);
    },

    // Statistiques et alertes
    getStatistics: () => {
      return HotLabService.calculateStatistics(get().hotLabData);
    },

    refreshSafetyAlerts: () => {
      const alerts = HotLabService.generateSafetyAlerts(
        get().hotLabData,
        get().hotLabData.products
      );
      
      set((state) => {
        state.safetyAlerts = alerts;
      });
    },

    // Utilitaires
    validateLotData: (lotData) => {
      return HotLabService.validateLotData(lotData);
    },

    validatePreparationData: (prepData) => {
      return HotLabService.validatePreparationData(prepData);
    },

    // Gestion d'erreur
    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    // Chargement initial
    loadHotLabData: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // Charger les lots de traceurs depuis SQLite
        const tracerLotsResponse = await fetch('http://localhost:3001/api/v1/hotlab/tracer-lots', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
          }
        });

        // Charger les logs de préparation depuis SQLite
        const preparationLogsResponse = await fetch('http://localhost:3001/api/v1/hotlab/preparation-logs', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
          }
        });

        if (tracerLotsResponse.ok && preparationLogsResponse.ok) {
          const tracerLotsData = await tracerLotsResponse.json();
          const preparationLogsData = await preparationLogsResponse.json();

          if (tracerLotsData.success && preparationLogsData.success) {
            set((state) => {
              // Mapper les données SQLite vers le format attendu par l'interface
              const mappedLots = (tracerLotsData.data || []).map((lot: any) => ({
                id: lot.lot_id || lot.id,
                productId: 'tc99m_hmdp', // Default product
                lotNumber: lot.batch_number || lot.lot_id,
                expiryDate: lot.expiry_time ? lot.expiry_time.split('T')[0] : new Date().toISOString().split('T')[0],
                calibrationDateTime: lot.calibration_time ? lot.calibration_time.slice(0, 16) : new Date().toISOString().slice(0, 16),
                receivedDate: lot.created_at ? lot.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                initialActivity: lot.activity_mbq || 0,
                quantityReceived: 1,
                unit: 'MBq',
                notes: `${lot.tracer_name} - ${lot.supplier || 'CIS bio'}`
              }));

              const mappedPreparations = (preparationLogsData.data || []).map((prep: any) => ({
                id: prep.preparation_id || prep.id,
                tracerLotId: prep.tracer_lot_id,
                patientId: prep.patient_id,
                preparationDateTime: prep.preparation_time ? prep.preparation_time.slice(0, 16) : new Date().toISOString().slice(0, 16),
                activityPrepared: prep.activity_prepared_mbq || 0,
                unit: 'MBq',
                preparedBy: 'Technicien',
                examType: 'Scintigraphie',
                notes: prep.notes || ''
              }));

              state.hotLabData = {
                lots: mappedLots,
                preparations: mappedPreparations,
                products: INITIAL_HOT_LAB_DATA.products, // Garder les produits constants
                radiopharmaceuticals: INITIAL_HOT_LAB_DATA.radiopharmaceuticals,
                safetyProtocols: INITIAL_HOT_LAB_DATA.safetyProtocols
              };
              state.isLoading = false;
            });
          } else {
            throw new Error('Erreur dans la réponse de l\'API');
          }
        } else {
          throw new Error('Erreur de connexion à l\'API');
        }
        
        // Générer les alertes initiales
        get().refreshSafetyAlerts();
      } catch (error) {
        console.error('Erreur lors du chargement Hot Lab depuis SQLite:', error);
        // Fallback vers les données initiales
        set((state) => {
          state.hotLabData = INITIAL_HOT_LAB_DATA;
          state.error = 'Connexion API échouée, utilisation des données locales';
          state.isLoading = false;
        });
        
        // Générer les alertes initiales
        get().refreshSafetyAlerts();
      }
    }
  }))
);

/**
 * Sélecteurs pour optimiser les re-renders
 */
export const selectHotLabData = (state: HotLabState) => state.hotLabData;
export const selectAvailableLots = (state: HotLabState) => state.getAvailableLots();
export const selectSafetyAlerts = (state: HotLabState) => state.safetyAlerts;
export const selectIsLoading = (state: HotLabState) => state.isLoading;
export const selectError = (state: HotLabState) => state.error;
