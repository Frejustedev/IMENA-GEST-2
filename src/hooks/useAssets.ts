import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import assetService from '../services/assetService';
import { Asset, AssetFormData } from '../types';

// Store Zustand pour les assets
interface AssetState {
  assets: Asset[];
  selectedAsset: Asset | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    type?: string;
    status?: string;
    location?: string;
    roomId?: string;
    requiresMaintenance?: boolean;
  };
  statistics: {
    total: number;
    active: number;
    maintenanceRequired: number;
    warrantyExpiringSoon: number;
    totalValue: number;
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  } | null;

  // Actions
  setAssets: (assets: Asset[]) => void;
  setSelectedAsset: (asset: Asset | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: any) => void;
  setFilters: (filters: any) => void;
  setStatistics: (statistics: any) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
}

const useAssetStore = create<AssetState>()(
  immer((set) => ({
    assets: [],
    selectedAsset: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0
    },
    filters: {},
    statistics: null,

    setAssets: (assets) => set((state) => {
      state.assets = assets;
    }),
    
    setSelectedAsset: (asset) => set((state) => {
      state.selectedAsset = asset;
    }),
    
    setLoading: (loading) => set((state) => {
      state.loading = loading;
    }),
    
    setError: (error) => set((state) => {
      state.error = error;
    }),
    
    setPagination: (pagination) => set((state) => {
      state.pagination = pagination;
    }),
    
    setFilters: (filters) => set((state) => {
      state.filters = filters;
    }),
    
    setStatistics: (statistics) => set((state) => {
      state.statistics = statistics;
    }),
    
    updateAsset: (id, updates) => set((state) => {
      const index = state.assets.findIndex(a => a.id === id);
      if (index !== -1) {
        Object.assign(state.assets[index], updates);
      }
      if (state.selectedAsset?.id === id) {
        Object.assign(state.selectedAsset, updates);
      }
    }),
    
    removeAsset: (id) => set((state) => {
      state.assets = state.assets.filter(a => a.id !== id);
      if (state.selectedAsset?.id === id) {
        state.selectedAsset = null;
      }
    })
  }))
);

// Hook principal
export function useAssets() {
  const store = useAssetStore();

  // Charger les assets
  const loadAssets = useCallback(async (page = 1) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const result = await assetService.getAssets({
        page,
        limit: store.pagination.limit,
        ...store.filters
      });
      
      store.setAssets(result.assets);
      store.setPagination(result.pagination);
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors du chargement des actifs');
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Charger un asset spécifique
  const loadAsset = useCallback(async (id: string) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const asset = await assetService.getAsset(id);
      store.setSelectedAsset(asset);
      return asset;
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors du chargement de l\'actif');
      return null;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Créer un asset
  const createAsset = useCallback(async (assetData: AssetFormData) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const newAsset = await assetService.createAsset(assetData);
      store.setAssets([newAsset, ...store.assets]);
      return { success: true, asset: newAsset };
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de la création de l\'actif');
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Mettre à jour un asset
  const updateAsset = useCallback(async (id: string, assetData: Partial<AssetFormData>) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const updatedAsset = await assetService.updateAsset(id, assetData);
      store.updateAsset(id, updatedAsset);
      return { success: true, asset: updatedAsset };
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de la mise à jour de l\'actif');
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Supprimer un asset
  const deleteAsset = useCallback(async (id: string) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      await assetService.deleteAsset(id);
      store.removeAsset(id);
      return { success: true };
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de la suppression de l\'actif');
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Enregistrer une maintenance
  const recordMaintenance = useCallback(async (
    assetId: string,
    maintenanceData: {
      type: string;
      description: string;
      cost?: number;
      nextMaintenanceDate?: Date;
    }
  ) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const updatedAsset = await assetService.recordMaintenance(assetId, maintenanceData);
      store.updateAsset(assetId, updatedAsset);
      return { success: true, asset: updatedAsset };
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de l\'enregistrement de la maintenance');
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Charger les statistiques
  const loadStatistics = useCallback(async () => {
    try {
      const statistics = await assetService.getStatistics();
      store.setStatistics(statistics);
      return statistics;
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors du chargement des statistiques');
      return null;
    }
  }, [store]);

  // Rechercher des assets
  const searchAssets = useCallback(async (query: string) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const assets = await assetService.searchAssets(query);
      store.setAssets(assets);
      return assets;
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de la recherche');
      return [];
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Charger au montage
  useEffect(() => {
    if (store.assets.length === 0 && !store.loading) {
      loadAssets();
    }
  }, []);

  return {
    // État
    assets: store.assets,
    selectedAsset: store.selectedAsset,
    loading: store.loading,
    error: store.error,
    pagination: store.pagination,
    filters: store.filters,
    statistics: store.statistics,

    // Actions
    loadAssets,
    loadAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    recordMaintenance,
    loadStatistics,
    searchAssets,
    setFilters: store.setFilters,
    selectAsset: store.setSelectedAsset,
    clearError: () => store.setError(null)
  };
}

export default useAssets;
