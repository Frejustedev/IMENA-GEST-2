import { Patient, NewPatientData } from '../../types';
import authService from './authService';

/**
 * Service API pour les patients - communication avec le backend
 */
class PatientApiService {
  private readonly API_BASE = '/patients';

  /**
   * Récupère tous les patients depuis le backend
   */
  async getPatients(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    patients: Patient[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const url = queryParams.toString() ? `${this.API_BASE}?${queryParams}` : this.API_BASE;
      const response = await authService.authenticatedRequest(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des patients');
      }

      return data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      throw error;
    }
  }

  /**
   * Récupère un patient par son ID
   */
  async getPatient(id: string): Promise<Patient> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${id}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Patient non trouvé');
      }

      return data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du patient ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crée un nouveau patient
   */
  async createPatient(patientData: {
    patient_id: string;
    name: string;
    date_of_birth: string;
    gender?: string;
    email?: string;
    phone?: string;
    address?: string;
    referring_entity?: string;
    current_room_id?: string;
    status_in_room?: string;
    room_specific_data?: string;
    history?: Array<{
      roomId: string;
      entryDate: string;
      exitDate?: string;
      statusMessage?: string;
    }>;
  }): Promise<Patient> {
    try {
      const response = await authService.authenticatedRequest(this.API_BASE, {
        method: 'POST',
        body: JSON.stringify(patientData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la création du patient');
      }

      return data.data;
    } catch (error) {
      console.error('Erreur lors de la création du patient:', error);
      throw error;
    }
  }

  /**
   * Met à jour un patient
   */
  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la mise à jour du patient');
      }

      return data.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du patient ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un patient
   */
  async deletePatient(id: string): Promise<void> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression du patient');
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression du patient ${id}:`, error);
      throw error;
    }
  }

  /**
   * Déplace un patient vers une nouvelle salle
   */
  async movePatient(id: string, targetRoomId: string, statusMessage?: string): Promise<Patient> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${id}/move`, {
        method: 'POST',
        body: JSON.stringify({
          target_room_id: targetRoomId,
          status_message: statusMessage
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors du déplacement du patient');
      }

      return data.data;
    } catch (error) {
      console.error(`Erreur lors du déplacement du patient ${id}:`, error);
      throw error;
    }
  }

  /**
   * Traite un formulaire de patient et met à jour son statut
   */
  async processPatientForm(id: string, roomId: string, formData: any, statusMessage?: string): Promise<Patient> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${id}/process`, {
        method: 'POST',
        body: JSON.stringify({
          room_id: roomId,
          form_data: formData,
          status_message: statusMessage
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors du traitement du formulaire');
      }

      return data.data;
    } catch (error) {
      console.error(`Erreur lors du traitement du formulaire pour le patient ${id}:`, error);
      throw error;
    }
  }

  /**
   * Ajoute une entrée d'historique pour un patient
   */
  async addHistoryEntry(id: string, historyEntry: {
    room_id: string;
    entry_date: string;
    exit_date?: string;
    status_message?: string;
  }): Promise<any> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${id}/history`, {
        method: 'POST',
        body: JSON.stringify(historyEntry),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de l\'ajout de l\'historique');
      }

      return data.data;
    } catch (error) {
      console.error(`Erreur lors de l'ajout de l'historique pour le patient ${id}:`, error);
      throw error;
    }
  }
}

export const patientApiService = new PatientApiService();
export default patientApiService;
