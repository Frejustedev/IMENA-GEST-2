import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Hook pour débouncer une valeur
 * Évite les appels excessifs lors de la saisie utilisateur
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook pour débouncer une fonction de callback
 * Utile pour les appels API ou les calculs coûteux
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useMemo(() => {
    return ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T;
  }, [callback, delay]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Hook pour la recherche déboucée
 * Spécialement optimisé pour les champs de recherche
 */
export const useDebouncedSearch = (
  initialValue: string = '',
  delay: number = 300
) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  // Marquer comme "en recherche" quand la valeur change
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    setSearchTerm,
    clearSearch: () => setSearchTerm('')
  };
};

/**
 * Hook pour débouncer les mises à jour d'état
 * Évite les re-renders excessifs
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void, boolean] => {
  const [value, setValue] = useState<T>(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const debouncedValue = useDebounce(value, delay);

  // Marquer comme "en mise à jour" quand la valeur change
  useEffect(() => {
    if (value !== debouncedValue) {
      setIsUpdating(true);
    } else {
      setIsUpdating(false);
    }
  }, [value, debouncedValue]);

  return [value, debouncedValue, setValue, isUpdating];
};

/**
 * Hook pour les appels API déboucés
 * Annule les requêtes précédentes automatiquement
 */
export const useDebouncedAPI = <T, U extends any[]>(
  apiFunction: (...args: U) => Promise<T>,
  delay: number = 500
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedCall = useDebouncedCallback(async (...args: U) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, delay);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    call: debouncedCall,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    }
  };
};

/**
 * Hook pour les validations déboucées
 * Évite de valider à chaque frappe
 */
export const useDebouncedValidation = <T>(
  value: T,
  validator: (value: T) => string | null,
  delay: number = 300
) => {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    if (value !== debouncedValue) {
      setIsValidating(true);
    } else {
      setIsValidating(false);
      const validationError = validator(debouncedValue);
      setError(validationError);
    }
  }, [value, debouncedValue, validator]);

  return {
    error,
    isValidating,
    isValid: !error && !isValidating
  };
};
