import authService from './authService';

/**
 * Service API pour les notifications - communication avec le backend
 */
class NotificationApiService {
  private readonly API_BASE = '/api/v1/notifications';

  /**
   * Récupère les notifications de l'utilisateur connecté
   */
  async getNotifications(params?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<any[]> {
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
        throw new Error(data.message || 'Erreur lors de la récupération des notifications');
      }

      return data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle notification
   */
  async createNotification(notificationData: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    userId?: string;
    urgent?: boolean;
    data?: any;
    expiresAt?: string;
  }): Promise<any> {
    try {
      const response = await authService.authenticatedRequest(this.API_BASE, {
        method: 'POST',
        body: JSON.stringify(notificationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la création de la notification');
      }

      return data.data;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await authService.authenticatedRequest(`${this.API_BASE}/${notificationId}/read`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la mise à jour de la notification');
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la notification ${notificationId}:`, error);
      throw error;
    }
  }
}

export const notificationApiService = new NotificationApiService();
export default notificationApiService;
