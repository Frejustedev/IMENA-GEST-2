import { useCallback, useEffect } from 'react';
import { usePatientStore } from '../stores/patientStore';
import { useAuth } from '../contexts/AuthContext';
import { RoomId, PatientDocument, NewPatientData } from '../../types';

/**
 * Hook personnalisé pour la gestion des patients
 * Encapsule la logique métier et fournit une API simple aux composants
 */
export const usePatients = () => {
  const {
    patients,
    selectedPatient,
    isLoading,
    error,
    loadPatients,
    addPatient,
    updatePatient,
    removePatient,
    movePatient,
    updatePatientRoomData,
    attachDocument,
    selectPatient,
    getPatientById,
    getPatientsByRoom,
    getPatientsBySearch,
    getStatistics,
    clearError
  } = usePatientStore();

  // Hook d'authentification
  const { isAuthenticated } = useAuth();

  // Charger les patients seulement si l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
  }, [isAuthenticated, loadPatients]);

  // Actions encapsulées avec gestion d'erreur
  const handleCreatePatient = useCallback(async (
    patientData: NewPatientData,
    requestData?: any
  ) => {
    try {
      addPatient(patientData, requestData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }, [addPatient]);

  const handleMovePatient = useCallback(async (
    patientId: string,
    targetRoomId: RoomId,
    statusMessage?: string
  ) => {
    try {
      await movePatient(patientId, targetRoomId, statusMessage);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors du déplacement' 
      };
    }
  }, [movePatient]);

  const handleUpdatePatientRoomData = useCallback(async (
    patientId: string,
    roomId: RoomId,
    formData: any
  ) => {
    try {
      const result = await updatePatientRoomData(patientId, roomId, formData);
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' 
      };
    }
  }, [updatePatientRoomData]);

  const handleAttachDocument = useCallback(async (
    patientId: string,
    file: File
  ) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (event.target && typeof event.target.result === 'string') {
            const document: PatientDocument = {
              id: `doc_${Date.now()}`,
              name: file.name,
              fileType: file.type,
              uploadDate: new Date().toISOString(),
              dataUrl: event.target.result
            };
            
            attachDocument(patientId, document);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Erreur lors de la lecture du fichier' });
          }
        } catch (error) {
          resolve({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Erreur lors de l\'attachement' 
          });
        }
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Erreur lors de la lecture du fichier' });
      };
      
      reader.readAsDataURL(file);
    });
  }, [attachDocument]);

  // Sélecteurs optimisés
  const getPatientsByRoomMemoized = useCallback((roomId: RoomId) => {
    return getPatientsByRoom(roomId);
  }, [getPatientsByRoom, patients]);

  const getPatientsBySearchMemoized = useCallback((searchTerm: string) => {
    return getPatientsBySearch(searchTerm);
  }, [getPatientsBySearch, patients]);

  const getStatisticsMemoized = useCallback(() => {
    return getStatistics();
  }, [getStatistics, patients]);

  return {
    // État
    patients,
    selectedPatient,
    isLoading,
    error,
    
    // Actions
    createPatient: handleCreatePatient,
    updatePatient,
    removePatient,
    movePatient: handleMovePatient,
    updatePatientRoomData: handleUpdatePatientRoomData,
    attachDocument: handleAttachDocument,
    selectPatient,
    
    // Getters
    getPatientById,
    getPatientsByRoom: getPatientsByRoomMemoized,
    getPatientsBySearch: getPatientsBySearchMemoized,
    getStatistics: getStatisticsMemoized,
    
    // Utilitaires
    clearError
  };
};

/**
 * Hook pour un patient spécifique
 */
export const usePatient = (patientId: string) => {
  const { getPatientById } = usePatients();
  return getPatientById(patientId);
};

/**
 * Hook pour les patients d'une salle spécifique
 */
export const useRoomPatients = (roomId: RoomId) => {
  const { getPatientsByRoom } = usePatients();
  return getPatientsByRoom(roomId);
};

/**
 * Hook pour la recherche de patients
 */
export const usePatientSearch = (searchTerm: string) => {
  const { getPatientsBySearch } = usePatients();
  return getPatientsBySearch(searchTerm);
};
