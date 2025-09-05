import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import stockService from '../services/stockService';
import { StockItem, StockMovement, StockFormData } from '../types';

// Store Zustand pour le stock
interface StockState {
  items: StockItem[];
  selectedItem: StockItem | null;
  movements: StockMovement[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    category?: string;
    location?: string;
    lowStock?: boolean;
    expired?: boolean;
  };
  statistics: {
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
  } | null;
  alerts: {
    lowStock: StockItem[];
    expired: StockItem[];
    nearExpiration: StockItem[];
    totalAlerts: number;
  } | null;

  // Actions
  setItems: (items: StockItem[]) => void;
  setSelectedItem: (item: StockItem | null) => void;
  setMovements: (movements: StockMovement[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: any) => void;
  setFilters: (filters: any) => void;
  setStatistics: (statistics: any) => void;
  setAlerts: (alerts: any) => void;
  updateItem: (id: string, updates: Partial<StockItem>) => void;
  removeItem: (id: string) => void;
}

const useStockStore = create<StockState>()(
  immer((set) => ({
    items: [],
    selectedItem: null,
    movements: [],
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
    alerts: null,

    setItems: (items) => set((state) => {
      state.items = items;
    }),
    
    setSelectedItem: (item) => set((state) => {
      state.selectedItem = item;
    }),
    
    setMovements: (movements) => set((state) => {
      state.movements = movements;
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
    
    setAlerts: (alerts) => set((state) => {
      state.alerts = alerts;
    }),
    
    updateItem: (id, updates) => set((state) => {
      const index = state.items.findIndex(i => i.id === id);
      if (index !== -1) {
        Object.assign(state.items[index], updates);
      }
      if (state.selectedItem?.id === id) {
        Object.assign(state.selectedItem, updates);
      }
    }),
    
    removeItem: (id) => set((state) => {
      state.items = state.items.filter(i => i.id !== id);
      if (state.selectedItem?.id === id) {
        state.selectedItem = null;
      }
    })
  }))
);

// Hook principal
export function useStock() {
  const store = useStockStore();

  // Charger les articles
  const loadItems = useCallback(async (page = 1) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const result = await stockService.getStockItems({
        page,
        limit: store.pagination.limit,
        ...store.filters
      });
      
      store.setItems(result.items);
      store.setPagination(result.pagination);
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors du chargement du stock');
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Charger un article spécifique
  const loadItem = useCallback(async (id: string) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const item = await stockService.getStockItem(id);
      store.setSelectedItem(item);
      return item;
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors du chargement de l\'article');
      return null;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Créer un article
  const createItem = useCallback(async (itemData: StockFormData) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const newItem = await stockService.createStockItem(itemData);
      store.setItems([newItem, ...store.items]);
      return { success: true, item: newItem };
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de la création de l\'article');
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Mettre à jour un article
  const updateItem = useCallback(async (id: string, itemData: Partial<StockFormData>) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const updatedItem = await stockService.updateStockItem(id, itemData);
      store.updateItem(id, updatedItem);
      return { success: true, item: updatedItem };
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de la mise à jour de l\'article');
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Supprimer un article
  const deleteItem = useCallback(async (id: string) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      await stockService.deleteStockItem(id);
      store.removeItem(id);
      return { success: true };
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de la suppression de l\'article');
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Enregistrer un mouvement
  const recordMovement = useCallback(async (
    itemId: string,
    movementData: {
      type: 'in' | 'out' | 'adjustment';
      quantity: number;
      reason: string;
      notes?: string;
    }
  ) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const updatedItem = await stockService.recordMovement(itemId, movementData);
      store.updateItem(itemId, updatedItem);
      
      // Recharger les statistiques et alertes
      await Promise.all([
        loadStatistics(),
        loadAlerts()
      ]);
      
      return { success: true, item: updatedItem };
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de l\'enregistrement du mouvement');
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Charger les mouvements
  const loadMovements = useCallback(async (params?: any) => {
    try {
      const result = await stockService.getMovements(params);
      store.setMovements(result.movements);
      return result;
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors du chargement des mouvements');
      return null;
    }
  }, [store]);

  // Charger les statistiques
  const loadStatistics = useCallback(async () => {
    try {
      const statistics = await stockService.getStatistics();
      store.setStatistics(statistics);
      return statistics;
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors du chargement des statistiques');
      return null;
    }
  }, [store]);

  // Charger les alertes
  const loadAlerts = useCallback(async () => {
    try {
      const alerts = await stockService.getAlerts();
      store.setAlerts(alerts);
      return alerts;
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors du chargement des alertes');
      return null;
    }
  }, [store]);

  // Rechercher des articles
  const searchItems = useCallback(async (query: string) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const items = await stockService.searchItems(query);
      store.setItems(items);
      return items;
    } catch (error: any) {
      store.setError(error.message || 'Erreur lors de la recherche');
      return [];
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Actions rapides
  const stockEntry = useCallback(async (itemId: string, quantity: number, reason: string, notes?: string) => {
    return recordMovement(itemId, { type: 'in', quantity, reason, notes });
  }, [recordMovement]);

  const stockExit = useCallback(async (itemId: string, quantity: number, reason: string, notes?: string) => {
    return recordMovement(itemId, { type: 'out', quantity, reason, notes });
  }, [recordMovement]);

  const adjustInventory = useCallback(async (itemId: string, newQuantity: number, reason: string) => {
    const item = store.items.find(i => i.id === itemId) || store.selectedItem;
    if (!item) return { success: false, error: 'Article non trouvé' };
    
    const difference = newQuantity - item.currentQuantity;
    if (difference === 0) return { success: true, item };
    
    return recordMovement(itemId, {
      type: 'adjustment',
      quantity: Math.abs(difference),
      reason,
      notes: difference > 0 ? 'Ajustement positif' : 'Ajustement négatif'
    });
  }, [store, recordMovement]);

  // Charger au montage
  useEffect(() => {
    if (store.items.length === 0 && !store.loading) {
      loadItems();
      loadStatistics();
      loadAlerts();
    }
  }, []);

  return {
    // État
    items: store.items,
    selectedItem: store.selectedItem,
    movements: store.movements,
    loading: store.loading,
    error: store.error,
    pagination: store.pagination,
    filters: store.filters,
    statistics: store.statistics,
    alerts: store.alerts,

    // Actions
    loadItems,
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    recordMovement,
    loadMovements,
    loadStatistics,
    loadAlerts,
    searchItems,
    stockEntry,
    stockExit,
    adjustInventory,
    setFilters: store.setFilters,
    selectItem: store.setSelectedItem,
    clearError: () => store.setError(null)
  };
}

export default useStock;
