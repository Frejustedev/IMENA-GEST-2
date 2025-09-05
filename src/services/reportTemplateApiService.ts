import authService from './authService';

/**
 * Service API pour les modèles de rapport
 */
class ReportTemplateApiService {
  private readonly API_BASE = '/report-templates';

  /**
   * Récupère tous les modèles de rapport
   */
  async getReportTemplates(): Promise<any[]> {
    try {
      const response = await authService.authenticatedRequest(this.API_BASE);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des modèles');
      }

      return data.data.reportTemplates;
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles de rapport:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau modèle de rapport
   */
  async createReportTemplate(templateData: {
    template_id: string;
    name: string;
    content: string;
  }): Promise<any> {
    try {
      const response = await authService.authenticatedRequest(this.API_BASE, {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la création du modèle');
      }

      return data.data;
    } catch (error) {
      console.error('Erreur lors de la création du modèle de rapport:', error);
      throw error;
    }
  }

  /**
   * Met à jour un modèle de rapport
   */
  async updateReportTemplate(id: string, updates: {
    name: string;
    content: string;
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
        throw new Error(data.message || 'Erreur lors de la mise à jour du modèle');
      }

      return data.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du modèle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un modèle de rapport
   */
  async deleteReportTemplate(id: string): Promise<void> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Si l'élément n'existe pas (404), on considère que la suppression est réussie
        if (response.status === 404) {
          console.warn(`Modèle ${id} non trouvé, considéré comme déjà supprimé`);
          return;
        }
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression du modèle');
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression du modèle ${id}:`, error);
      throw error;
    }
  }
}

export const reportTemplateApiService = new ReportTemplateApiService();
export default reportTemplateApiService;
