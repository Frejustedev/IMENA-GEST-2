import { Asset, AssetFormData } from '../types';

const API_URL = '/api/v1/assets';

class AssetService {
  /**
   * Récupère la liste des actifs avec filtres
   */
  async getAssets(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    location?: string;
    roomId?: string;
    requiresMaintenance?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    assets: Asset[];
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
      throw new Error('Erreur lors de la récupération des actifs');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erreur lors de la récupération des assets');
    }

    // Mapper les données de la base vers le format frontend
    const mappedAssets = data.data.map((asset: any) => ({
      id: asset.asset_id || asset.id,
      designation: asset.designation,
      category: asset.category,
      acquisitionDate: asset.acquisition_date,
      acquisitionCost: asset.acquisition_cost,
      currentValue: asset.current_value,
      location: asset.location,
      status: asset.status,
      supplier: asset.supplier,
      serialNumber: asset.serial_number,
      model: asset.model,
      specifications: asset.specifications ? JSON.parse(asset.specifications) : {},
      isFunctional: asset.is_functional,
      currentAction: asset.current_action,
      responsiblePerson: asset.responsible_person,
      maintenanceCount: asset.maintenance_count || 0,
      lastMaintenance: asset.last_maintenance
    }));

    return { 
      assets: mappedAssets,
      pagination: data.pagination 
    };
  }

  /**
   * Récupère un actif par son ID
   */
  async getAsset(id: string): Promise<Asset> {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'actif');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Crée un nouvel actif
   */
  async createAsset(assetData: AssetFormData): Promise<Asset> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(assetData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création de l\'actif');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Met à jour un actif
   */
  async updateAsset(id: string, assetData: Partial<AssetFormData>): Promise<Asset> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(assetData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour de l\'actif');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Supprime (met au rebut) un actif
   */
  async deleteAsset(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'actif');
    }
  }

  /**
   * Enregistre une maintenance
   */
  async recordMaintenance(
    assetId: string,
    maintenanceData: {
      type: string;
      description: string;
      cost?: number;
      nextMaintenanceDate?: Date;
    }
  ): Promise<Asset> {
    const response = await fetch(`${API_URL}/${assetId}/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(maintenanceData)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'enregistrement de la maintenance');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Récupère les statistiques des actifs
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    maintenanceRequired: number;
    warrantyExpiringSoon: number;
    totalValue: number;
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
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
   * Recherche des actifs
   */
  async searchAssets(query: string): Promise<Asset[]> {
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
    return data.data.assets;
  }

  /**
   * Récupère les actifs nécessitant une maintenance
   */
  async getMaintenanceRequired(): Promise<Asset[]> {
    const params = new URLSearchParams({ requiresMaintenance: 'true' });
    const response = await fetch(`${API_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération');
    }

    const data = await response.json();
    return data.data.assets;
  }

  /**
   * Export des actifs en Excel
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

export default new AssetService();
