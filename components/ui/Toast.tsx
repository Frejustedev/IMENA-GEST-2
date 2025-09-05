import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from '../icons/ExclamationTriangleIcon';
import { InformationCircleIcon } from '../icons/InformationCircleIcon';
import { XMarkIcon } from '../icons/XMarkIcon';

/**
 * Types de toast disponibles
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Positions possibles pour les toasts
 */
export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

/**
 * Durées prédéfinies pour les toasts
 */
export const TOAST_DURATIONS = {
  short: 3000,    // 3 secondes
  medium: 5000,   // 5 secondes
  long: 8000,     // 8 secondes
  persistent: 0   // Ne se ferme pas automatiquement
} as const;

/**
 * Interface pour un toast
 */
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

/**
 * Props du composant ToastItem
 */
export interface ToastItemProps extends Toast {
  /** Si le toast est visible (pour animation) */
  visible: boolean;
  /** Fonction appelée quand le toast doit être supprimé */
  onRemove: (id: string) => void;
  /** Position du toast */
  position: ToastPosition;
}

/**
 * Classes CSS pour les types de toast
 */
const typeClasses: Record<ToastType, string> = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error: 'bg-error-50 border-error-200 text-error-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  info: 'bg-info-50 border-info-200 text-info-800'
};

/**
 * Icônes pour les types de toast
 */
const typeIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon className="w-5 h-5 text-success-500" />,
  error: <ExclamationTriangleIcon className="w-5 h-5 text-error-500" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />,
  info: <InformationCircleIcon className="w-5 h-5 text-info-500" />
};

/**
 * Classes d'animation selon la position
 */
const animationClasses: Record<ToastPosition, { enter: string; exit: string }> = {
  'top-left': {
    enter: 'animate-slide-in-left',
    exit: 'animate-slide-out-left'
  },
  'top-center': {
    enter: 'animate-slide-in-top',
    exit: 'animate-slide-out-top'
  },
  'top-right': {
    enter: 'animate-slide-in-right',
    exit: 'animate-slide-out-right'
  },
  'bottom-left': {
    enter: 'animate-slide-in-left',
    exit: 'animate-slide-out-left'
  },
  'bottom-center': {
    enter: 'animate-slide-in-bottom',
    exit: 'animate-slide-out-bottom'
  },
  'bottom-right': {
    enter: 'animate-slide-in-right',
    exit: 'animate-slide-out-right'
  }
};

/**
 * Composant ToastItem individuel
 */
export const ToastItem: React.FC<ToastItemProps> = ({
  id,
  type,
  title,
  message,
  duration = TOAST_DURATIONS.medium,
  persistent = false,
  action,
  onClose,
  onRemove,
  visible,
  position
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Gestion de la fermeture automatique
  useEffect(() => {
    if (persistent || duration === 0) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return Math.max(0, newProgress);
      });
    }, 100);

    const timeout = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [duration, persistent, id]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setIsExiting(true);
    setTimeout(() => {
      onRemove(id);
    }, 300); // Durée de l'animation de sortie
  };

  const typeClass = typeClasses[type];
  const icon = typeIcons[type];
  const animations = animationClasses[position];

  const toastClasses = `
    relative max-w-sm w-full bg-white border rounded-lg shadow-lg overflow-hidden
    transform transition-all duration-300 ease-in-out
    ${typeClass}
    ${visible && !isExiting ? animations.enter : animations.exit}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div
      className={toastClasses}
      role="alert"
      aria-live="polite"
    >
      {/* Barre de progression */}
      {!persistent && duration > 0 && (
        <div className="absolute top-0 left-0 h-1 bg-current opacity-20">
          <div 
            className="h-full bg-current transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icône */}
          <div className="flex-shrink-0 pt-0.5">
            {icon}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold">
              {title}
            </h4>
            {message && (
              <p className="mt-1 text-sm opacity-90">
                {message}
              </p>
            )}

            {/* Action */}
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>

          {/* Bouton fermeture */}
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-current hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded"
              aria-label="Fermer la notification"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Props du conteneur de toasts
 */
export interface ToastContainerProps {
  /** Liste des toasts à afficher */
  toasts: Toast[];
  /** Position des toasts */
  position?: ToastPosition;
  /** Fonction pour supprimer un toast */
  onRemove: (id: string) => void;
  /** Nombre maximum de toasts visibles */
  maxToasts?: number;
  /** Classes CSS personnalisées */
  className?: string;
}

/**
 * Classes de positionnement pour le conteneur
 */
const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4'
};

/**
 * Conteneur de toasts
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  onRemove,
  maxToasts = 5,
  className = ''
}) => {
  const [visibleToasts, setVisibleToasts] = useState<Set<string>>(new Set());

  // Gérer la visibilité des nouveaux toasts
  useEffect(() => {
    toasts.forEach(toast => {
      if (!visibleToasts.has(toast.id)) {
        setTimeout(() => {
          setVisibleToasts(prev => new Set([...prev, toast.id]));
        }, 50);
      }
    });
  }, [toasts, visibleToasts]);

  // Limiter le nombre de toasts affichés
  const displayedToasts = toasts.slice(0, maxToasts);

  const containerClasses = `
    fixed z-50 flex flex-col space-y-2
    ${positionClasses[position]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  if (displayedToasts.length === 0) {
    return null;
  }

  return (
    <div className={containerClasses}>
      {displayedToasts.map(toast => (
        <ToastItem
          key={toast.id}
          {...toast}
          visible={visibleToasts.has(toast.id)}
          position={position}
          onRemove={(id) => {
            setVisibleToasts(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
            onRemove(id);
          }}
        />
      ))}
    </div>
  );
};

/**
 * Hook pour gérer les toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = React.useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      ...toastData
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  // Méthodes de raccourci
  const toast = React.useMemo(() => ({
    success: (title: string, message?: string, options?: Partial<Toast>) =>
      addToast({ type: 'success', title, message, ...options }),
    
    error: (title: string, message?: string, options?: Partial<Toast>) =>
      addToast({ type: 'error', title, message, duration: TOAST_DURATIONS.long, ...options }),
    
    warning: (title: string, message?: string, options?: Partial<Toast>) =>
      addToast({ type: 'warning', title, message, ...options }),
    
    info: (title: string, message?: string, options?: Partial<Toast>) =>
      addToast({ type: 'info', title, message, ...options }),

    promise: async <T>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ) => {
      const loadingId = addToast({
        type: 'info',
        title: messages.loading,
        persistent: true
      });

      try {
        const result = await promise;
        removeToast(loadingId);
        
        const successMessage = typeof messages.success === 'function' 
          ? messages.success(result) 
          : messages.success;
        
        addToast({
          type: 'success',
          title: successMessage
        });
        
        return result;
      } catch (error) {
        removeToast(loadingId);
        
        const errorMessage = typeof messages.error === 'function' 
          ? messages.error(error as Error) 
          : messages.error;
        
        addToast({
          type: 'error',
          title: errorMessage,
          duration: TOAST_DURATIONS.long
        });
        
        throw error;
      }
    }
  }), [addToast, removeToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    toast
  };
};

/**
 * Classes d'animation CSS (à ajouter au CSS global)
 */
export const toastAnimations = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes slide-in-left {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out-left {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

@keyframes slide-in-top {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-out-top {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

@keyframes slide-in-bottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-out-bottom {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}

.animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
.animate-slide-out-right { animation: slide-out-right 0.3s ease-in; }
.animate-slide-in-left { animation: slide-in-left 0.3s ease-out; }
.animate-slide-out-left { animation: slide-out-left 0.3s ease-in; }
.animate-slide-in-top { animation: slide-in-top 0.3s ease-out; }
.animate-slide-out-top { animation: slide-out-top 0.3s ease-in; }
.animate-slide-in-bottom { animation: slide-in-bottom 0.3s ease-out; }
.animate-slide-out-bottom { animation: slide-out-bottom 0.3s ease-in; }
`;
