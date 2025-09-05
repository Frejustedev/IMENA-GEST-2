import { useMemo, useState, useEffect, useCallback } from 'react';

/**
 * Configuration pour la virtualisation
 */
interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Nombre d'éléments à rendre en plus (pour le smooth scrolling)
}

/**
 * Résultat de la virtualisation
 */
interface VirtualizationResult<T> {
  virtualizedItems: Array<{
    index: number;
    item: T;
    style: React.CSSProperties;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
}

/**
 * Hook pour la virtualisation de listes longues
 * Optimise les performances en ne rendant que les éléments visibles
 */
export const useVirtualization = <T>(
  items: T[],
  config: VirtualizationConfig
): VirtualizationResult<T> => {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  const [scrollTop, setScrollTop] = useState(0);

  // Calculer les indices des éléments visibles
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Générer les éléments virtualisés
  const virtualizedItems = useMemo(() => {
    const result = [];
    
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (items[i]) {
        result.push({
          index: i,
          item: items[i],
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          }
        });
      }
    }
    
    return result;
  }, [visibleRange, items, itemHeight]);

  // Hauteur totale de la liste
  const totalHeight = useMemo(() => {
    return items.length * itemHeight;
  }, [items.length, itemHeight]);

  // Fonction pour scroller vers un index spécifique
  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight;
    setScrollTop(targetScrollTop);
  }, [itemHeight]);

  return {
    virtualizedItems,
    totalHeight,
    scrollToIndex
  };
};

/**
 * Hook spécialisé pour la virtualisation des patients
 */
export const usePatientVirtualization = (
  patients: any[],
  containerHeight: number = 600,
  itemHeight: number = 80
) => {
  return useVirtualization(patients, {
    itemHeight,
    containerHeight,
    overscan: 3
  });
};

/**
 * Hook pour la virtualisation avec recherche et filtrage
 */
export const useSearchableVirtualization = <T>(
  items: T[],
  searchTerm: string,
  filterFn: (item: T, search: string) => boolean,
  config: VirtualizationConfig
) => {
  // Filtrer les éléments basé sur la recherche
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    return items.filter(item => filterFn(item, searchTerm));
  }, [items, searchTerm, filterFn]);

  // Appliquer la virtualisation sur les éléments filtrés
  const virtualization = useVirtualization(filteredItems, config);

  return {
    ...virtualization,
    filteredCount: filteredItems.length,
    totalCount: items.length
  };
};

/**
 * Interface pour les props du composant VirtualList
 */
export interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

/**
 * Fonction utilitaire pour créer un composant VirtualList
 * Note: À utiliser dans un composant React séparé pour éviter les erreurs TS
 */
export const createVirtualListConfig = <T>(
  items: T[],
  height: number,
  itemHeight: number
) => {
  return useVirtualization(items, {
    itemHeight,
    containerHeight: height
  });
};
