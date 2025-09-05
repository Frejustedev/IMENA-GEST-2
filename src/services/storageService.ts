/**
 * Service de gestion du stockage local
 * Centralise toutes les opérations de persistance
 */

// Clés de stockage centralisées
export const STORAGE_KEYS = {
  USERS: 'gestion_patient_mn_users',
  ROLES: 'gestion_patient_mn_roles',
  SESSION: 'gestion_patient_mn_session',
  EXAM_CONFIGS: 'gestion_patient_mn_exam_configs',
  REPORT_TEMPLATES: 'gestion_patient_mn_report_templates',
  ASSETS: 'gestion_patient_mn_assets',
  STOCK_ITEMS: 'gestion_patient_mn_stock_items',
  PATIENTS: 'gestion_patient_mn_patients',
  HOT_LAB: 'gestion_patient_mn_hot_lab',
} as const;

/**
 * Interface générique pour les opérations de stockage
 */
interface StorageService<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

/**
 * Implémentation localStorage avec gestion d'erreurs
 */
class LocalStorageService<T> implements StorageService<T> {
  get(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error);
      return null;
    }
  }

  set(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key}:`, error);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erreur lors du nettoyage du localStorage:', error);
    }
  }
}

/**
 * Implémentation sessionStorage avec gestion d'erreurs
 */
class SessionStorageService<T> implements StorageService<T> {
  get(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error);
      return null;
    }
  }

  set(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key}:`, error);
    }
  }

  remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
    }
  }

  clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Erreur lors du nettoyage du sessionStorage:', error);
    }
  }
}

// Instances de service exportées
export const localStorageService = new LocalStorageService();
export const sessionStorageService = new SessionStorageService();

/**
 * Utilitaires pour la migration de données
 */
export const migrateData = () => {
  // Logique de migration entre versions si nécessaire
  console.log('Vérification des migrations de données...');
};

/**
 * Validation des données lors du chargement
 */
export const validateStoredData = <T>(data: unknown, validator: (data: unknown) => data is T): T | null => {
  if (validator(data)) {
    return data;
  }
  console.warn('Données stockées invalides détectées');
  return null;
};
