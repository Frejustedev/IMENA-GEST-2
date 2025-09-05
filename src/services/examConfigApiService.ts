import authService from './authService';

/**
 * Service API pour les configurations d'examen
 */
class ExamConfigApiService {
  private readonly API_BASE = '/exam-configurations';

  /**
   * Récupère toutes les configurations d'examen
   */
  async getExamConfigurations(): Promise<any[]> {
    try {
      const response = await authService.authenticatedRequest(this.API_BASE);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des configurations');
      }

      return data.data.examConfigurations;
    } catch (error) {
      console.error('Erreur lors de la récupération des configurations d\'examen:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle configuration d'examen
   */
  async createExamConfiguration(configData: {
    config_id: string;
    name: string;
    fields: any[];
  }): Promise<any> {
    try {
      const response = await authService.authenticatedRequest(this.API_BASE, {
        method: 'POST',
        body: JSON.stringify(configData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la création de la configuration');
      }

      return data.data;
    } catch (error) {
      console.error('Erreur lors de la création de la configuration d\'examen:', error);
      throw error;
    }
  }

  /**
   * Met à jour une configuration d'examen
   */
  async updateExamConfiguration(id: string, updates: {
    name: string;
    fields: any[];
  }): Promise<any> {
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
        throw new Error(data.message || 'Erreur lors de la mise à jour de la configuration');
      }

      return data.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la configuration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprime une configuration d'examen
   */
  async deleteExamConfiguration(id: string): Promise<void> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Si l'élément n'existe pas (404), on considère que la suppression est réussie
        if (response.status === 404) {
          console.warn(`Configuration ${id} non trouvée, considérée comme déjà supprimée`);
          return;
        }
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression de la configuration');
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression de la configuration ${id}:`, error);
      throw error;
    }
  }
}

export const examConfigApiService = new ExamConfigApiService();
export default examConfigApiService;
