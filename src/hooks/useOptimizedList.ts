import { useMemo, useState, useCallback, useRef, useEffect } from 'react';

/**
 * Interface pour les options de liste optimisée
 */
export interface OptimizedListOptions<T> {
  /** Fonction de filtre */
  filterFn?: (item: T, searchTerm: string) => boolean;
  /** Fonction de tri */
  sortFn?: (a: T, b: T) => number;
  /** Fonction de groupe */
  groupFn?: (item: T) => string;
  /** Taille de page pour la pagination virtuelle */
  pageSize?: number;
  /** Débounce pour la recherche en ms */
  searchDebounce?: number;
}

/**
 * Interface pour le résultat de la liste optimisée
 */
export interface OptimizedListResult<T> {
  /** Items filtrés et triés */
  items: T[];
  /** Items groupés */
  groupedItems: Record<string, T[]>;
  /** Terme de recherche actuel */
  searchTerm: string;
  /** Fonction pour changer le terme de recherche */
  setSearchTerm: (term: string) => void;
  /** Page actuelle */
  currentPage: number;
  /** Fonction pour changer de page */
  setCurrentPage: (page: number) => void;
  /** Nombre total de pages */
  totalPages: number;
  /** Items de la page actuelle */
  currentPageItems: T[];
  /** Indicateur de chargement pour le debounce */
  isSearching: boolean;
  /** Statistiques */
  stats: {
    total: number;
    filtered: number;
    visible: number;
  };
}

/**
 * Hook pour optimiser l'affichage de grandes listes
 * Inclut filtrage, tri, pagination et virtualisation
 */
export function useOptimizedList<T>(
  data: T[],
  options: OptimizedListOptions<T> = {}
): OptimizedListResult<T> {
  const {
    filterFn,
    sortFn,
    groupFn,
    pageSize = 50,
    searchDebounce = 300
  } = options;

  const [searchTerm, setSearchTermState] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // Debounce pour la recherche
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    setIsSearching(true);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(term);
      setIsSearching(false);
      setCurrentPage(0); // Reset à la première page
    }, searchDebounce);
  }, [searchDebounce]);

  // Cleanup du timeout
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Filtrage et tri optimisés avec memoization
  const filteredAndSortedItems = useMemo(() => {
    let result = [...data];

    // Filtrage
    if (filterFn && debouncedSearchTerm.trim()) {
      result = result.filter(item => filterFn(item, debouncedSearchTerm));
    }

    // Tri
    if (sortFn) {
      result.sort(sortFn);
    }

    return result;
  }, [data, filterFn, sortFn, debouncedSearchTerm]);

  // Groupement optimisé
  const groupedItems = useMemo(() => {
    if (!groupFn) return {};

    return filteredAndSortedItems.reduce((groups, item) => {
      const group = groupFn(item);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }, [filteredAndSortedItems, groupFn]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedItems.length / pageSize);
  }, [filteredAndSortedItems.length, pageSize]);

  const currentPageItems = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredAndSortedItems.slice(start, end);
  }, [filteredAndSortedItems, currentPage, pageSize]);

  // Statistiques
  const stats = useMemo(() => ({
    total: data.length,
    filtered: filteredAndSortedItems.length,
    visible: currentPageItems.length
  }), [data.length, filteredAndSortedItems.length, currentPageItems.length]);

  return {
    items: filteredAndSortedItems,
    groupedItems,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    currentPageItems,
    isSearching,
    stats
  };
}

/**
 * Hook pour la virtualisation de listes (pour de très grandes listes)
 */
export interface VirtualListOptions {
  /** Hauteur d'un item en pixels */
  itemHeight: number;
  /** Hauteur du conteneur en pixels */
  containerHeight: number;
  /** Buffer d'items avant/après la zone visible */
  buffer?: number;
}

export interface VirtualListResult {
  /** Index du premier item visible */
  startIndex: number;
  /** Index du dernier item visible */
  endIndex: number;
  /** Items à rendre */
  visibleItems: number[];
  /** Props pour le conteneur */
  containerProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  };
  /** Props pour la liste */
  listProps: {
    style: React.CSSProperties;
  };
  /** Fonction pour scroller vers un index */
  scrollToIndex: (index: number) => void;
}

export function useVirtualList(
  itemCount: number,
  options: VirtualListOptions
): VirtualListResult {
  const { itemHeight, containerHeight, buffer = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + buffer
  );

  const visibleItems = useMemo(() => {
    const items: number[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push(i);
    }
    return items;
  }, [startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight;
      containerRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    visibleItems,
    containerProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
      },
      onScroll: handleScroll,
    },
    listProps: {
      style: {
        height: totalHeight,
        position: 'relative',
        transform: `translateY(${offsetY}px)`,
      },
    },
    scrollToIndex,
  };
}

/**
 * Hook pour optimiser les re-renders avec React.memo
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef(deps);

  // Mettre à jour la callback si les dépendances changent
  if (!deps.every((dep, index) => dep === depsRef.current[index])) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return useCallback((...args) => callbackRef.current(...args), []) as T;
}

/**
 * Hook pour optimiser les calculs coûteux
 */
export function useExpensiveComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList,
  options: {
    /** Délai en ms avant de calculer (debounce) */
    delay?: number;
    /** Valeur par défaut pendant le calcul */
    defaultValue?: T;
  } = {}
): { value: T | undefined; isComputing: boolean } {
  const { delay = 0, defaultValue } = options;
  const [value, setValue] = useState<T | undefined>(defaultValue);
  const [isComputing, setIsComputing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsComputing(true);

    timeoutRef.current = setTimeout(() => {
      const result = computeFn();
      setValue(result);
      setIsComputing(false);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);

  return { value, isComputing };
}

/**
 * Hook pour gérer la mise en cache des données
 */
export function useDataCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    /** TTL en millisecondes */
    ttl?: number;
    /** Si on doit refetch au focus */
    refetchOnFocus?: boolean;
    /** Si on doit utiliser le cache local */
    useLocalStorage?: boolean;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, refetchOnFocus = false, useLocalStorage = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const cacheKey = `cache_${key}`;
  const timestampKey = `timestamp_${key}`;

  const loadFromCache = useCallback(() => {
    if (!useLocalStorage) return false;

    try {
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < ttl) {
          setData(JSON.parse(cached));
          setLastFetch(parseInt(timestamp));
          return true;
        }
      }
    } catch (e) {
      console.warn('Error loading from cache:', e);
    }
    
    return false;
  }, [cacheKey, timestampKey, ttl, useLocalStorage]);

  const saveToCache = useCallback((data: T) => {
    if (!useLocalStorage) return;

    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (e) {
      console.warn('Error saving to cache:', e);
    }
  }, [cacheKey, timestampKey, useLocalStorage]);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const isStale = now - lastFetch > ttl;

    if (!force && !isStale && data) {
      return data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setLastFetch(now);
      saveToCache(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, data, lastFetch, ttl, saveToCache]);

  // Charger depuis le cache au mount
  useEffect(() => {
    if (!loadFromCache()) {
      fetchData();
    }
  }, []);

  // Refetch au focus si activé
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      const now = Date.now();
      const isStale = now - lastFetch > ttl;
      if (isStale) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, lastFetch, ttl, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    isStale: Date.now() - lastFetch > ttl
  };
}
