import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Interface pour les préférences d'accessibilité
 */
export interface AccessibilityPreferences {
  /** Réduction des mouvements/animations */
  reduceMotion: boolean;
  /** Contraste élevé */
  highContrast: boolean;
  /** Taille de police augmentée */
  largeFonts: boolean;
  /** Lecteur d'écran actif */
  screenReader: boolean;
  /** Navigation au clavier uniquement */
  keyboardNavigation: boolean;
  /** Thème sombre */
  darkMode: boolean;
  /** Espacement augmenté */
  increasedSpacing: boolean;
  /** Focus visible renforcé */
  enhancedFocus: boolean;
  /** Dysfonctions visuelles */
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  /** Langue de l'interface */
  language: string;
  /** Niveau de zoom */
  zoomLevel: number;
}

/**
 * Interface pour le contexte d'accessibilité
 */
export interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  resetPreferences: () => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  isKeyboardUser: boolean;
  focusManagement: {
    trapFocus: (element: HTMLElement) => () => void;
    restoreFocus: (element: HTMLElement | null) => void;
    skipToContent: () => void;
    skipToNavigation: () => void;
  };
}

/**
 * Préférences par défaut
 */
const defaultPreferences: AccessibilityPreferences = {
  reduceMotion: false,
  highContrast: false,
  largeFonts: false,
  screenReader: false,
  keyboardNavigation: false,
  darkMode: false,
  increasedSpacing: false,
  enhancedFocus: false,
  colorBlindness: 'none',
  language: 'fr',
  zoomLevel: 1
};

/**
 * Contexte d'accessibilité
 */
const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

/**
 * Props du provider d'accessibilité
 */
interface AccessibilityProviderProps {
  children: ReactNode;
}

/**
 * Provider d'accessibilité global
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);

  // Charger les préférences depuis localStorage au montage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('accessibility-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.warn('Erreur lors du chargement des préférences d\'accessibilité:', error);
      }
    }

    // Détecter les préférences système
    detectSystemPreferences();
  }, []);

  // Sauvegarder les préférences dans localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
    applyPreferencesToDOM();
  }, [preferences]);

  // Détecter l'utilisation du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  /**
   * Détecter les préférences système
   */
  const detectSystemPreferences = () => {
    const updates: Partial<AccessibilityPreferences> = {};

    // Détecter prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updates.reduceMotion = true;
    }

    // Détecter prefers-contrast
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      updates.highContrast = true;
    }

    // Détecter prefers-color-scheme
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      updates.darkMode = true;
    }

    // Détecter la langue du navigateur
    updates.language = navigator.language.split('-')[0] || 'fr';

    // Détecter si un lecteur d'écran est utilisé
    updates.screenReader = detectScreenReader();

    if (Object.keys(updates).length > 0) {
      setPreferences(prev => ({ ...prev, ...updates }));
    }
  };

  /**
   * Détecter la présence d'un lecteur d'écran
   */
  const detectScreenReader = (): boolean => {
    // Méthodes de détection de lecteur d'écran
    const hasScreenReader = 
      // Vérifier les API spécifiques
      'speechSynthesis' in window ||
      // Vérifier les préférences système
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      // Vérifier les variables d'environnement
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('WindowEyes') ||
      navigator.userAgent.includes('VoiceOver');

    return hasScreenReader;
  };

  /**
   * Appliquer les préférences au DOM
   */
  const applyPreferencesToDOM = () => {
    const root = document.documentElement;
    
    // Réduction des mouvements
    if (preferences.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Contraste élevé
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Grandes polices
    if (preferences.largeFonts) {
      root.classList.add('large-fonts');
      root.style.fontSize = '120%';
    } else {
      root.classList.remove('large-fonts');
      root.style.fontSize = '';
    }

    // Thème sombre
    if (preferences.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Espacement augmenté
    if (preferences.increasedSpacing) {
      root.classList.add('increased-spacing');
      root.style.setProperty('--spacing-multiplier', '1.5');
    } else {
      root.classList.remove('increased-spacing');
      root.style.removeProperty('--spacing-multiplier');
    }

    // Focus renforcé
    if (preferences.enhancedFocus) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Daltonisme
    if (preferences.colorBlindness !== 'none') {
      root.classList.add(`colorblind-${preferences.colorBlindness}`);
    } else {
      root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia', 'colorblind-achromatopsia');
    }

    // Navigation clavier
    if (preferences.keyboardNavigation || isKeyboardUser) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }

    // Niveau de zoom
    if (preferences.zoomLevel !== 1) {
      root.style.zoom = preferences.zoomLevel.toString();
    } else {
      root.style.zoom = '';
    }
  };

  /**
   * Mettre à jour une préférence
   */
  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));

    // Annoncer le changement
    announceToScreenReader(`Préférence ${key} mise à jour`);
  };

  /**
   * Réinitialiser les préférences
   */
  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('accessibility-preferences');
    announceToScreenReader('Préférences d\'accessibilité réinitialisées');
  };

  /**
   * Annoncer un message au lecteur d'écran
   */
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Créer un élément live region temporaire
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    
    // Ajouter le message après un court délai pour que le lecteur d'écran le détecte
    setTimeout(() => {
      announcement.textContent = message;
      
      // Nettoyer après 1 seconde
      setTimeout(() => {
        if (announcement.parentNode) {
          announcement.parentNode.removeChild(announcement);
        }
      }, 1000);
    }, 100);
  };

  /**
   * Piéger le focus dans un élément
   */
  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    
    // Focus sur le premier élément
    if (firstElement) {
      firstElement.focus();
    }

    // Retourner une fonction de nettoyage
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  };

  /**
   * Restaurer le focus sur un élément
   */
  const restoreFocus = (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus();
    }
  };

  /**
   * Aller au contenu principal
   */
  const skipToContent = () => {
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
      announceToScreenReader('Navigation vers le contenu principal');
    }
  };

  /**
   * Aller à la navigation
   */
  const skipToNavigation = () => {
    const navigation = document.getElementById('main-navigation') || document.querySelector('nav');
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView({ behavior: 'smooth' });
      announceToScreenReader('Navigation vers le menu principal');
    }
  };

  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreference,
    resetPreferences,
    announceToScreenReader,
    isKeyboardUser,
    focusManagement: {
      trapFocus,
      restoreFocus,
      skipToContent,
      skipToNavigation
    }
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte d'accessibilité
 */
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility doit être utilisé dans un AccessibilityProvider');
  }
  return context;
};

/**
 * Hook pour gérer le focus
 */
export const useFocusManagement = () => {
  const { focusManagement } = useAccessibility();
  return focusManagement;
};

/**
 * Hook pour les annonces au lecteur d'écran
 */
export const useScreenReaderAnnouncement = () => {
  const { announceToScreenReader } = useAccessibility();
  return announceToScreenReader;
};

/**
 * HOC pour rendre un composant accessible
 */
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AccessibleComponent(props: P) {
    const { preferences } = useAccessibility();
    
    return (
      <div 
        className={`
          ${preferences.highContrast ? 'high-contrast' : ''}
          ${preferences.largeFonts ? 'large-fonts' : ''}
          ${preferences.increasedSpacing ? 'increased-spacing' : ''}
          ${preferences.enhancedFocus ? 'enhanced-focus' : ''}
        `}
      >
        <Component {...props} />
      </div>
    );
  };
}

/**
 * Composant de liens d'évitement
 */
export const SkipLinks: React.FC = () => {
  const { focusManagement } = useAccessibility();

  return (
    <div className="skip-links">
      <button
        className="skip-link"
        onClick={focusManagement.skipToContent}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            focusManagement.skipToContent();
          }
        }}
      >
        Aller au contenu principal
      </button>
      <button
        className="skip-link"
        onClick={focusManagement.skipToNavigation}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            focusManagement.skipToNavigation();
          }
        }}
      >
        Aller à la navigation
      </button>
    </div>
  );
};
