import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Patient, RoomId, PatientDocument, NewPatientData } from '../../types';
import { PatientService } from '../services/patientService';
import { patientApiService } from '../services/patientApiService';
import { INITIAL_PATIENTS } from '../../constants';
import { calculateAge } from '../../utils/dateUtils';

/**
 * Interface pour le store des patients
 */
interface PatientState {
  // État
  patients: Patient[];
  selectedPatient: Patient | null;
  isLoading: boolean;
  error: string | null;

      // Actions CRUD
    loadPatients: () => Promise<void>;
    addPatient: (patientData: NewPatientData, requestData?: any) => Promise<void>;
    updatePatient: (patientId: string, updates: Partial<Patient>) => Promise<void>;
    removePatient: (patientId: string) => Promise<void>;
  
  // Actions spécialisées
  movePatient: (patientId: string, targetRoomId: RoomId, statusMessage?: string) => Promise<void>;
  updatePatientRoomData: (patientId: string, roomId: RoomId, formData: any) => Promise<{ success: boolean; error?: string }>;
  attachDocument: (patientId: string, document: PatientDocument) => void;
  
  // Sélection
  selectPatient: (patient: Patient | null) => void;
  
  // Getters
  getPatientById: (id: string) => Patient | undefined;
  getPatientsByRoom: (roomId: RoomId) => Patient[];
  getPatientsBySearch: (searchTerm: string) => Patient[];
  
  // Statistiques
  getStatistics: () => ReturnType<typeof PatientService.calculateStatistics>;
  
  // Gestion d'erreur
  clearError: () => void;
}

/**
 * Store Zustand pour la gestion des patients
 */
export const usePatientStore = create<PatientState>()(
  immer((set, get) => ({
    // État initial
    patients: INITIAL_PATIENTS.map(p => ({ ...p, age: calculateAge(p.dateOfBirth) })),
    selectedPatient: null,
    isLoading: false,
    error: null,

    // Actions CRUD
    loadPatients: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // Charger depuis l'API
        const result = await patientApiService.getPatients();
        
        set((state) => {
          state.patients = result.patients.map(p => ({ 
            ...p, 
            age: calculateAge(p.dateOfBirth) 
          }));
          state.isLoading = false;
        });
      } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
        // Fallback vers les données locales en cas d'erreur
        set((state) => {
          state.patients = INITIAL_PATIENTS.map(p => ({ 
            ...p, 
            age: calculateAge(p.dateOfBirth) 
          }));
          state.error = 'Connexion API échouée, utilisation des données locales';
          state.isLoading = false;
        });
      }
    },

    addPatient: async (patientData, requestData) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Créer le patient local avec les données spécifiques aux salles
        const localPatient = PatientService.createPatient(patientData, requestData);
        
        // Préparer les données pour l'API
        const apiPatientData = {
          patient_id: localPatient.id,
          name: patientData.name,
          date_of_birth: patientData.dateOfBirth,
          gender: patientData.gender,
          email: patientData.email,
          phone: patientData.phone,
          address: patientData.address,
          referring_entity: patientData.referringEntity,
          current_room_id: localPatient.currentRoomId,
          status_in_room: localPatient.statusInRoom,
          room_specific_data: JSON.stringify(localPatient.roomSpecificData),
          history: localPatient.history
        };

        // Créer le patient dans la base de données
        const backendPatient = await patientApiService.createPatient(apiPatientData);
        
        set((state) => {
          // Utiliser les données du backend qui incluent maintenant l'historique
          state.patients.push(backendPatient);
          state.isLoading = false;
          state.error = null;
        });
        
        // Recharger la liste complète pour s'assurer de la cohérence
        setTimeout(async () => {
          try {
            await get().loadPatients();
          } catch (error) {
            console.warn('Erreur lors du rechargement des patients:', error);
          }
        }, 100);
      } catch (error) {
        console.error('Erreur lors de la création du patient:', error);
        set((state) => {
          state.error = 'Erreur lors de la création du patient';
          state.isLoading = false;
        });
        throw error;
      }
    },

    updatePatient: (patientId, updates) => {
      set((state) => {
        const index = state.patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
          state.patients[index] = { ...state.patients[index], ...updates };
          
          // Mettre à jour le patient sélectionné si c'est le même
          if (state.selectedPatient?.id === patientId) {
            state.selectedPatient = state.patients[index];
          }
        }
        state.error = null;
      });
    },

    removePatient: (patientId) => {
      set((state) => {
        state.patients = state.patients.filter(p => p.id !== patientId);
        
        // Désélectionner si c'était le patient sélectionné
        if (state.selectedPatient?.id === patientId) {
          state.selectedPatient = null;
        }
        
        state.error = null;
      });
    },

    // Actions spécialisées
    movePatient: async (patientId, targetRoomId, statusMessage) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Déplacer le patient via l'API
        const updatedPatient = await patientApiService.movePatient(patientId, targetRoomId, statusMessage);
        
        set((state) => {
          const index = state.patients.findIndex(p => p.id === patientId);
          if (index !== -1) {
            state.patients[index] = updatedPatient;
          
            // Mettre à jour le patient sélectionné si c'est le même
            if (state.selectedPatient?.id === patientId) {
              state.selectedPatient = updatedPatient;
            }
          }
          state.isLoading = false;
          state.error = null;
        });
      } catch (error) {
        console.error('Erreur lors du déplacement du patient:', error);
        set((state) => {
          state.error = 'Erreur lors du déplacement du patient';
          state.isLoading = false;
        });
        throw error;
      }
    },

    updatePatientRoomData: async (patientId, roomId, formData) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Traiter le formulaire via l'API
        const updatedPatient = await patientApiService.processPatientForm(patientId, roomId, formData);
        
        set((state) => {
          const index = state.patients.findIndex(p => p.id === patientId);
          if (index !== -1) {
            state.patients[index] = updatedPatient;
            
            // Mettre à jour le patient sélectionné si c'est le même
            if (state.selectedPatient?.id === patientId) {
              state.selectedPatient = updatedPatient;
            }
          }
          state.isLoading = false;
          state.error = null;
        });

        return { success: true };
      } catch (error) {
        console.error('Erreur lors de la mise à jour des données patient:', error);
        set((state) => {
          state.error = 'Erreur lors de la mise à jour des données patient';
          state.isLoading = false;
        });
        return { success: false, error: error.message };
      }
    },

    attachDocument: (patientId, document) => {
      set((state) => {
        const index = state.patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
          if (!state.patients[index].documents) {
            state.patients[index].documents = [];
          }
          state.patients[index].documents!.push(document);
          
          // Mettre à jour le patient sélectionné si c'est le même
          if (state.selectedPatient?.id === patientId) {
            state.selectedPatient = state.patients[index];
          }
        }
        state.error = null;
      });
    },

    // Sélection
    selectPatient: (patient) => {
      set((state) => {
        state.selectedPatient = patient;
      });
    },

    // Getters
    getPatientById: (id) => {
      return get().patients.find(p => p.id === id);
    },

    getPatientsByRoom: (roomId) => {
      return PatientService.filterPatients.byRoom(get().patients, roomId);
    },

    getPatientsBySearch: (searchTerm) => {
      return PatientService.filterPatients.bySearch(get().patients, searchTerm);
    },

    // Statistiques
    getStatistics: () => {
      return PatientService.calculateStatistics(get().patients);
    },

    // Gestion d'erreur
    clearError: () => {
      set((state) => {
        state.error = null;
      });
    }
  }))
);

/**
 * Sélecteurs pour optimiser les re-renders
 */
export const selectPatients = (state: PatientState) => state.patients;
export const selectSelectedPatient = (state: PatientState) => state.selectedPatient;
export const selectIsLoading = (state: PatientState) => state.isLoading;
export const selectError = (state: PatientState) => state.error;
