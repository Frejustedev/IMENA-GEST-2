import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { ActiveView, RoomId, PeriodOption } from '../../types';

/**
 * Hook personnalisé pour la gestion de l'état global de l'application
 * Centralise la navigation, les modales et les notifications
 */
export const useApp = () => {
  const {
    activeView,
    activeRoomId,
    selectedPeriod,
    searchTerm,
    modals,
    modalContext,
    toasts,
    confirmation,
    setActiveView,
    setActiveRoom,
    setSelectedPeriod,
    setSearchTerm,
    openModal,
    closeModal,
    closeAllModals,
    addToast,
    removeToast,
    clearToasts,
    showConfirmation,
    closeConfirmation,
    resetApp
  } = useAppStore();

  // Navigation avec logique métier
  const navigateToRoom = useCallback((roomId: RoomId) => {
    setActiveRoom(roomId);
    
    // Vues spécialisées pour certaines salles
    if (roomId === 'GENERATEUR') { // ID du Hot Lab
      setActiveView('hot_lab');
    } else {
      setActiveView('room');
    }
  }, [setActiveRoom, setActiveView]);

  const navigateToView = useCallback((view: ActiveView) => {
    setActiveView(view);
    // L'activeRoomId sera automatiquement réinitialisé si nécessaire
  }, [setActiveView]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    // La vue basculera automatiquement vers 'search' si le terme n'est pas vide
  }, [setSearchTerm]);

  // Gestion des modales avec contexte
  const openPatientForm = useCallback((patientId: string, roomId: RoomId) => {
    openModal('isPatientFormOpen', { patientId, roomId });
  }, [openModal]);

  const openCreatePatient = useCallback(() => {
    openModal('isCreatePatientOpen');
  }, [openModal]);

  const openStockEntry = useCallback(() => {
    openModal('isStockEntryOpen');
  }, [openModal]);

  const openStockExit = useCallback(() => {
    openModal('isStockExitOpen');
  }, [openModal]);

  const openAssetForm = useCallback((editingAsset?: any) => {
    openModal('isAssetFormOpen', { editingAsset });
  }, [openModal]);

  const openStockItemForm = useCallback((editingStockItem?: any) => {
    openModal('isStockItemFormOpen', { editingStockItem });
  }, [openModal]);

  const openUserForm = useCallback((editingUser?: any) => {
    openModal('isUserFormOpen', { editingUser });
  }, [openModal]);

  const openRoleForm = useCallback((editingRole?: any) => {
    openModal('isRoleFormOpen', { editingRole });
  }, [openModal]);

  const openExamConfigForm = useCallback((editingExamConfig?: any) => {
    openModal('isExamConfigFormOpen', { editingExamConfig });
  }, [openModal]);

  const openReportTemplateForm = useCallback((editingReportTemplate?: any) => {
    openModal('isReportTemplateFormOpen', { editingReportTemplate });
  }, [openModal]);

  // Notifications avec types prédéfinis
  const showSuccess = useCallback((message: string) => {
    addToast(message, 'success');
  }, [addToast]);

  const showError = useCallback((message: string) => {
    addToast(message, 'error');
  }, [addToast]);

  const showWarning = useCallback((message: string) => {
    addToast(message, 'warning');
  }, [addToast]);

  const showInfo = useCallback((message: string) => {
    addToast(message, 'info');
  }, [addToast]);

  // Confirmation avec templates prédéfinis
  const confirmDelete = useCallback((itemName: string, onConfirm: () => Promise<void>) => {
    showConfirmation(
      'Supprimer l\'élément',
      `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`,
      onConfirm
    );
  }, [showConfirmation]);

  const confirmAction = useCallback((
    title: string,
    message: string,
    onConfirm: () => Promise<void>
  ) => {
    showConfirmation(title, message, onConfirm);
  }, [showConfirmation]);

  // Utilitaires pour les vues spéciales
  const isCurrentView = useCallback((view: ActiveView) => {
    return activeView === view;
  }, [activeView]);

  const isCurrentRoom = useCallback((roomId: RoomId) => {
    return activeRoomId === roomId && activeView === 'room';
  }, [activeRoomId, activeView]);

  const isModalOpen = useCallback((modalName: keyof typeof modals) => {
    return modals[modalName];
  }, [modals]);

  // Getters pour le contexte des modales
  const getModalPatientId = useCallback(() => {
    return modalContext.patientId;
  }, [modalContext.patientId]);

  const getModalRoomId = useCallback(() => {
    return modalContext.roomId;
  }, [modalContext.roomId]);

  const getEditingAsset = useCallback(() => {
    return modalContext.editingAsset;
  }, [modalContext.editingAsset]);

  const getEditingStockItem = useCallback(() => {
    return modalContext.editingStockItem;
  }, [modalContext.editingStockItem]);

  const getSelectedStockItem = useCallback(() => {
    return modalContext.selectedStockItem;
  }, [modalContext.selectedStockItem]);

  const getEditingUser = useCallback(() => {
    return modalContext.editingUser;
  }, [modalContext.editingUser]);

  const getEditingRole = useCallback(() => {
    return modalContext.editingRole;
  }, [modalContext.editingRole]);

  const getEditingExamConfig = useCallback(() => {
    return modalContext.editingExamConfig;
  }, [modalContext.editingExamConfig]);

  const getEditingReportTemplate = useCallback(() => {
    return modalContext.editingReportTemplate;
  }, [modalContext.editingReportTemplate]);

  // État dérivé pour l'UI
  const hasActiveToasts = toasts.length > 0;
  const isConfirmationOpen = confirmation.isOpen;
  const hasAnyModalOpen = Object.values(modals).some(isOpen => isOpen);

  return {
    // État de navigation
    activeView,
    activeRoomId,
    selectedPeriod,
    searchTerm,
    
    // Actions de navigation
    navigateToRoom,
    navigateToView,
    setSelectedPeriod,
    handleSearch,
    
    // État des modales
    modals,
    modalContext,
    
    // Actions de modales
    openPatientForm,
    openCreatePatient,
    openStockEntry,
    openStockExit,
    openAssetForm,
    openStockItemForm,
    openUserForm,
    openRoleForm,
    openExamConfigForm,
    openReportTemplateForm,
    closeModal,
    closeAllModals,
    
    // Getters de contexte modal
    getModalPatientId,
    getModalRoomId,
    getEditingAsset,
    getEditingStockItem,
    getSelectedStockItem,
    getEditingUser,
    getEditingRole,
    getEditingExamConfig,
    getEditingReportTemplate,
    
    // État des notifications
    toasts,
    hasActiveToasts,
    
    // Actions de notifications
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearToasts,
    
    // État de confirmation
    confirmation,
    isConfirmationOpen,
    
    // Actions de confirmation
    confirmDelete,
    confirmAction,
    closeConfirmation,
    
    // Utilitaires
    isCurrentView,
    isCurrentRoom,
    isModalOpen,
    hasAnyModalOpen,
    resetApp
  };
};

/**
 * Hook pour la navigation spécialisée
 */
export const useNavigation = () => {
  const { 
    activeView, 
    activeRoomId, 
    navigateToRoom, 
    navigateToView, 
    isCurrentView, 
    isCurrentRoom 
  } = useApp();

  return {
    activeView,
    activeRoomId,
    navigateToRoom,
    navigateToView,
    isCurrentView,
    isCurrentRoom
  };
};

/**
 * Hook pour les notifications uniquement
 */
export const useNotifications = () => {
  const {
    toasts,
    hasActiveToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearToasts
  } = useApp();

  return {
    toasts,
    hasActiveToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearToasts
  };
};

/**
 * Hook pour les modales uniquement
 */
export const useModals = () => {
  const {
    modals,
    modalContext,
    hasAnyModalOpen,
    openPatientForm,
    openCreatePatient,
    openStockEntry,
    openStockExit,
    openAssetForm,
    openStockItemForm,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalPatientId,
    getModalRoomId,
    getEditingAsset,
    getEditingStockItem,
    getSelectedStockItem
  } = useApp();

  return {
    modals,
    modalContext,
    hasAnyModalOpen,
    openPatientForm,
    openCreatePatient,
    openStockEntry,
    openStockExit,
    openAssetForm,
    openStockItemForm,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalPatientId,
    getModalRoomId,
    getEditingAsset,
    getEditingStockItem,
    getSelectedStockItem
  };
};
