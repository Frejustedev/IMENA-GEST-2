import { StockItem, StockMovement, StockFormData } from '../types';

const API_URL = '/api/v1/stock';

class StockService {
  /**
   * Récupère la liste des articles en stock
   */
  async getStockItems(params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
    lowStock?: boolean;
    expired?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    items: StockItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_URL}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du stock');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Récupère un article par son ID
   */
  async getStockItem(id: string): Promise<StockItem> {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'article');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Crée un nouvel article
   */
  async createStockItem(itemData: StockFormData): Promise<StockItem> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(itemData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création de l\'article');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Met à jour un article
   */
  async updateStockItem(id: string, itemData: Partial<StockFormData>): Promise<StockItem> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(itemData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour de l\'article');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Supprime un article
   */
  async deleteStockItem(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'article');
    }
  }

  /**
   * Enregistre un mouvement de stock
   */
  async recordMovement(
    itemId: string,
    movementData: {
      type: 'in' | 'out' | 'adjustment';
      quantity: number;
      reason: string;
      notes?: string;
    }
  ): Promise<StockItem> {
    const response = await fetch(`${API_URL}/${itemId}/movement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(movementData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'enregistrement du mouvement');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Récupère les mouvements de stock
   */
  async getMovements(params?: {
    page?: number;
    limit?: number;
    itemId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    movements: StockMovement[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${API_URL}/movements?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des mouvements');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Récupère les statistiques du stock
   */
  async getStatistics(): Promise<{
    totalItems: number;
    lowStockItems: number;
    expiredItems: number;
    nearExpirationItems: number;
    totalValue: number;
    byCategory: Array<{ category: string; count: number }>;
    recentMovements: StockMovement[];
    alerts: {
      lowStock: boolean;
      expired: boolean;
      nearExpiration: boolean;
    };
  }> {
    const response = await fetch(`${API_URL}/statistics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Récupère les alertes de stock
   */
  async getAlerts(): Promise<{
    lowStock: StockItem[];
    expired: StockItem[];
    nearExpiration: StockItem[];
    totalAlerts: number;
  }> {
    const response = await fetch(`${API_URL}/alerts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des alertes');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Recherche des articles
   */
  async searchItems(query: string): Promise<StockItem[]> {
    const params = new URLSearchParams({ search: query });
    const response = await fetch(`${API_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la recherche');
    }

    const data = await response.json();
    return data.data.items;
  }

  /**
   * Effectue une entrée de stock
   */
  async stockEntry(itemId: string, quantity: number, reason: string, notes?: string): Promise<StockItem> {
    return this.recordMovement(itemId, {
      type: 'in',
      quantity,
      reason,
      notes
    });
  }

  /**
   * Effectue une sortie de stock
   */
  async stockExit(itemId: string, quantity: number, reason: string, notes?: string): Promise<StockItem> {
    return this.recordMovement(itemId, {
      type: 'out',
      quantity,
      reason,
      notes
    });
  }

  /**
   * Ajustement d'inventaire
   */
  async adjustInventory(itemId: string, newQuantity: number, reason: string): Promise<StockItem> {
    const item = await this.getStockItem(itemId);
    const difference = newQuantity - item.currentQuantity;
    
    if (difference === 0) {
      return item;
    }

    return this.recordMovement(itemId, {
      type: 'adjustment',
      quantity: Math.abs(difference),
      reason: `Ajustement inventaire: ${reason}`,
      notes: difference > 0 ? 'Ajustement positif' : 'Ajustement négatif'
    });
  }

  /**
   * Export du stock en Excel
   */
  async exportToExcel(filters?: any): Promise<Blob> {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'export');
    }

    return response.blob();
  }
}

export default new StockService();
