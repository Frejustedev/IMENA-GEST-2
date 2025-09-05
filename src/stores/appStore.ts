import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ActiveView, RoomId, PeriodOption } from '../../types';

/**
 * Interface pour le store global de l'application
 */
interface AppState {
  // Navigation et vues
  activeView: ActiveView;
  activeRoomId: RoomId | null;
  selectedPeriod: PeriodOption;
  searchTerm: string;
  
  // Modales et UI
  modals: {
    isPatientFormOpen: boolean;
    isCreatePatientOpen: boolean;
    isStockEntryOpen: boolean;
    isStockExitOpen: boolean;
    isAssetFormOpen: boolean;
    isStockItemFormOpen: boolean;
    isUserFormOpen: boolean;
    isRoleFormOpen: boolean;
    isExamConfigFormOpen: boolean;
    isReportTemplateFormOpen: boolean;
  };
  
  // Contexte des modales
  modalContext: {
    patientId?: string;
    roomId?: RoomId;
    editingAsset?: any;
    editingStockItem?: any;
    selectedStockItem?: any;
    editingUser?: any;
    editingRole?: any;
    editingExamConfig?: any;
    editingReportTemplate?: any;
  };
  
  // Notifications
  toasts: Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>;
  
  // Confirmation
  confirmation: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  };

  // Actions de navigation
  setActiveView: (view: ActiveView) => void;
  setActiveRoom: (roomId: RoomId | null) => void;
  setSelectedPeriod: (period: PeriodOption) => void;
  setSearchTerm: (term: string) => void;
  
  // Actions de modales
  openModal: (modalName: keyof AppState['modals'], context?: Partial<AppState['modalContext']>) => void;
  closeModal: (modalName: keyof AppState['modals']) => void;
  closeAllModals: () => void;
  
  // Actions de notifications
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: number) => void;
  clearToasts: () => void;
  
  // Actions de confirmation
  showConfirmation: (title: string, message: string, onConfirm: () => Promise<void>) => void;
  closeConfirmation: () => void;
  
  // Utilitaires
  resetApp: () => void;
}

/**
 * État initial des modales
 */
const initialModals: AppState['modals'] = {
  isPatientFormOpen: false,
  isCreatePatientOpen: false,
  isStockEntryOpen: false,
  isStockExitOpen: false,
  isAssetFormOpen: false,
  isStockItemFormOpen: false,
  isUserFormOpen: false,
  isRoleFormOpen: false,
  isExamConfigFormOpen: false,
  isReportTemplateFormOpen: false,
};

/**
 * État initial de la confirmation
 */
const initialConfirmation: AppState['confirmation'] = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: async () => {},
};

/**
 * Store Zustand pour l'état global de l'application
 */
export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    // État initial
    activeView: 'rooms_overview',
    activeRoomId: null,
    selectedPeriod: 'today',
    searchTerm: '',
    modals: initialModals,
    modalContext: {},
    toasts: [],
    confirmation: initialConfirmation,

    // Actions de navigation
    setActiveView: (view) => {
      set((state) => {
        state.activeView = view;
        
        // Si on change de vue, fermer toutes les modales
        state.modals = { ...initialModals };
        state.modalContext = {};
        
        // Si ce n'est pas une vue de salle, réinitialiser activeRoomId
        if (view !== 'room') {
          state.activeRoomId = null;
        }
      });
    },

    setActiveRoom: (roomId) => {
      set((state) => {
        state.activeRoomId = roomId;
        
        // Si on sélectionne une salle, passer en vue "room"
        if (roomId) {
          state.activeView = 'room';
        }
      });
    },

    setSelectedPeriod: (period) => {
      set((state) => {
        state.selectedPeriod = period;
      });
    },

    setSearchTerm: (term) => {
      set((state) => {
        state.searchTerm = term;
        
        // Si on recherche, passer en vue de recherche
        if (term.trim() !== '') {
          state.activeView = 'search';
          state.activeRoomId = null;
        } else if (state.activeView === 'search') {
          state.activeView = 'rooms_overview';
        }
      });
    },

    // Actions de modales
    openModal: (modalName, context = {}) => {
      set((state) => {
        state.modals[modalName] = true;
        state.modalContext = { ...state.modalContext, ...context };
      });
    },

    closeModal: (modalName) => {
      set((state) => {
        state.modals[modalName] = false;
        
        // Nettoyer le contexte si toutes les modales sont fermées
        const anyModalOpen = Object.values(state.modals).some(isOpen => isOpen);
        if (!anyModalOpen) {
          state.modalContext = {};
        }
      });
    },

    closeAllModals: () => {
      set((state) => {
        state.modals = { ...initialModals };
        state.modalContext = {};
      });
    },

    // Actions de notifications
    addToast: (message, type = 'success') => {
      const id = Date.now();
      
      set((state) => {
        state.toasts.push({ id, message, type });
      });

      // Auto-suppression après 5 secondes
      setTimeout(() => {
        get().removeToast(id);
      }, 5000);
    },

    removeToast: (id) => {
      set((state) => {
        state.toasts = state.toasts.filter(toast => toast.id !== id);
      });
    },

    clearToasts: () => {
      set((state) => {
        state.toasts = [];
      });
    },

    // Actions de confirmation
    showConfirmation: (title, message, onConfirm) => {
      set((state) => {
        state.confirmation = {
          isOpen: true,
          title,
          message,
          onConfirm
        };
      });
    },

    closeConfirmation: () => {
      set((state) => {
        state.confirmation = { ...initialConfirmation };
      });
    },

    // Utilitaires
    resetApp: () => {
      set((state) => {
        state.activeView = 'rooms_overview';
        state.activeRoomId = null;
        state.selectedPeriod = 'today';
        state.searchTerm = '';
        state.modals = { ...initialModals };
        state.modalContext = {};
        state.toasts = [];
        state.confirmation = { ...initialConfirmation };
      });
    }
  }))
);

/**
 * Sélecteurs pour optimiser les re-renders
 */
export const selectActiveView = (state: AppState) => state.activeView;
export const selectActiveRoomId = (state: AppState) => state.activeRoomId;
export const selectSearchTerm = (state: AppState) => state.searchTerm;
export const selectModals = (state: AppState) => state.modals;
export const selectToasts = (state: AppState) => state.toasts;
export const selectConfirmation = (state: AppState) => state.confirmation;
