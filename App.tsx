import React, { Suspense, lazy, useState, useEffect } from 'react';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useApp } from './src/hooks/useApp';
import { usePatients } from './src/hooks/usePatients';
import { useHotLab } from './src/hooks/useHotLab';
import { useAuth } from './src/contexts/AuthContext';

// Import des composants de base
import { Navbar } from './components/Navbar';
import { RoomNavigation } from './components/RoomNavigation';
import { Breadcrumb } from './components/Breadcrumb';
import { Toast } from './components/Toast';
import { ConfirmationModal } from './components/ConfirmationModal';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { LoginCredentials, AuthResponse } from './src/services/authService';

// Lazy loading des vues principales
const RoomView = lazy(() => import('./components/RoomView').then(module => ({ default: module.RoomView })));
const RoomsOverview = lazy(() => import('./components/RoomsOverview').then(module => ({ default: module.RoomsOverview })));
const GlobalSearchView = lazy(() => import('./components/GlobalSearchView').then(module => ({ default: module.GlobalSearchView })));
const PatientDetailView = lazy(() => import('./components/PatientDetailView').then(module => ({ default: module.PatientDetailView })));
const DailyWorklistView = lazy(() => import('./components/DailyWorklistView').then(module => ({ default: module.DailyWorklistView })));
const ActivityFeedView = lazy(() => import('./components/ActivityFeedView').then(module => ({ default: module.ActivityFeedView })));
const StatisticsView = lazy(() => import('./components/StatisticsView').then(module => ({ default: module.StatisticsView })));
const HotLabView = lazy(() => import('./components/HotLabView').then(module => ({ default: module.HotLabView })));
const TracersManagementView = lazy(() => import('./components/TracersManagementView').then(module => ({ default: module.TracersManagementView })));
const PreparationsManagementView = lazy(() => import('./components/PreparationsManagementView').then(module => ({ default: module.PreparationsManagementView })));
const IsotopesManagementView = lazy(() => import('./components/IsotopesManagementView').then(module => ({ default: module.IsotopesManagementView })));
const AdministrationView = lazy(() => import('./components/AdministrationView').then(module => ({ default: module.AdministrationView })));
const ExamSettingsView = lazy(() => import('./components/ExamSettingsView').then(module => ({ default: module.ExamSettingsView })));
const DatabaseView = lazy(() => import('./components/DatabaseView').then(module => ({ default: module.DatabaseView })));
const ReportTemplatesSettingsView = lazy(() => import('./components/ReportTemplatesSettingsView').then(module => ({ default: module.ReportTemplatesSettingsView })));

// Lazy loading des vues patrimoine
const PatrimonyDashboardView = lazy(() => import('./components/PatrimonyDashboardView').then(module => ({ default: module.PatrimonyDashboardView })));
const PatrimonyInventoryView = lazy(() => import('./components/PatrimonyInventoryView').then(module => ({ default: module.PatrimonyInventoryView })));
const PatrimonyStockView = lazy(() => import('./components/PatrimonyStockView').then(module => ({ default: module.PatrimonyStockView })));
const PatrimonyAssetStatusView = lazy(() => import('./components/PatrimonyAssetStatusView').then(module => ({ default: module.PatrimonyAssetStatusView })));
const StockItemDetailView = lazy(() => import('./components/StockItemDetailView').then(module => ({ default: module.StockItemDetailView })));

// Lazy loading des modales
const PatientFormModal = lazy(() => import('./components/PatientFormModal').then(module => ({ default: module.PatientFormModal })));
const CreatePatientModal = lazy(() => import('./components/CreatePatientModal').then(module => ({ default: module.CreatePatientModal })));
const StockEntryFormModal = lazy(() => import('./components/StockEntryFormModal').then(module => ({ default: module.StockEntryFormModal })));
const StockExitFormModal = lazy(() => import('./components/StockExitFormModal').then(module => ({ default: module.StockExitFormModal })));
const AssetFormModal = lazy(() => import('./components/AssetFormModal').then(module => ({ default: module.AssetFormModal })));
const StockItemFormModal = lazy(() => import('./components/StockItemFormModal').then(module => ({ default: module.StockItemFormModal })));
const UserFormModal = lazy(() => import('./components/UserFormModal').then(module => ({ default: module.UserFormModal })));
const RoleFormModal = lazy(() => import('./components/RoleFormModal').then(module => ({ default: module.RoleFormModal })));
const ExamConfigFormModal = lazy(() => import('./components/ExamConfigFormModal').then(module => ({ default: module.ExamConfigFormModal })));
const ReportTemplateFormModal = lazy(() => import('./components/ReportTemplateFormModal').then(module => ({ default: module.ReportTemplateFormModal })));

// Imports des données et utilitaires
import { ROOMS_CONFIG, INITIAL_EXAM_CONFIGURATIONS, INITIAL_ASSETS, INITIAL_STOCK_ITEMS } from './constants';
import { User, Role } from './types';

/**
 * Composant de chargement réutilisable
 */
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Chargement...' }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
      <p className="text-slate-600">{message}</p>
    </div>
  </div>
);

/**
 * Composant principal de l'application refactorisé
 * Utilise les nouveaux hooks et stores pour une architecture modulaire
 */
function App() {
  // États locaux pour l'interface
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  // Hooks de gestion d'état
  const {
    activeView,
    activeRoomId,
    selectedPeriod,
    searchTerm,
    modals,
    toasts,
    confirmation,
    navigateToRoom,
    navigateToView,
    setSelectedPeriod,
    handleSearch,
    closeModal,
    removeToast,
    closeConfirmation,
    isCurrentView,
    getModalPatientId,
    getModalRoomId,
    getEditingAsset,
    getEditingStockItem,
    getSelectedStockItem,
    getEditingUser,
    getEditingRole,
    getEditingExamConfig,
    getEditingReportTemplate,
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
    showSuccess,
    showError
  } = useApp();

  const {
    patients,
    selectedPatient,
    selectPatient,
    createPatient,
    updatePatientRoomData,
    movePatient,
    attachDocument,
    getPatientsBySearch,
    getPatientById
  } = usePatients();

  const {
    hotLabData,
    addLot,
    addPreparation
  } = useHotLab();

  // Fermeture navigation mobile au redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsNavigationOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hook d'authentification
  const { user: currentUser, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const currentRole = currentUser?.role;

  // Charger les données depuis la base de données
  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        try {
          // Charger les configurations d'examen
          const { examConfigApiService } = await import('./src/services/examConfigApiService');
          const configs = await examConfigApiService.getExamConfigurations();
          setExamConfigurations(configs);
          
          // Charger les modèles de rapport
          const { reportTemplateApiService } = await import('./src/services/reportTemplateApiService');
          const templates = await reportTemplateApiService.getReportTemplates();
          
          // Parser les modèles pour extraire les données du contenu JSON
          const parsedTemplates = templates.map(template => {
            try {
              const contentData = JSON.parse(template.content);
              return {
                id: template.template_id,
                name: template.name,
                examName: contentData.examName || '',
                reportContent: contentData.reportContent || '',
                conclusionContent: contentData.conclusionContent || '',
                createdAt: template.created_at
              };
            } catch (error) {
              // Si le parsing échoue, utiliser les données directement
              return {
                id: template.template_id,
                name: template.name,
                examName: '',
                reportContent: template.content || '',
                conclusionContent: '',
                createdAt: template.created_at
              };
            }
          });
          
          setReportTemplates(parsedTemplates);
          
          // Charger les utilisateurs
          const { userApiService } = await import('./src/services/userApiService');
          const usersData = await userApiService.getUsers();
          setUsers(usersData);
          
          // Charger les rôles
          const { roleApiService } = await import('./src/services/roleApiService');
          const rolesData = await roleApiService.getRoles();
          setRoles(rolesData);
          
          // Charger les assets depuis l'API
          try {
            const assetsResponse = await fetch('http://localhost:3001/api/v1/assets', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
              }
            });
            if (assetsResponse.ok) {
              const assetsData = await assetsResponse.json();
              if (assetsData.success) {
                // Le backend retourne { data: [...] } directement pour assets
                console.log('Assets data received:', assetsData.data);
                setAssets(Array.isArray(assetsData.data) ? assetsData.data : []);
              }
            }
          } catch (error) {
            console.warn('Impossible de charger les assets:', error);
          }
          
          // Charger les articles de stock depuis l'API
          try {
            const stockResponse = await fetch('http://localhost:3001/api/v1/stock', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
              }
            });
            if (stockResponse.ok) {
              const stockData = await stockResponse.json();
              if (stockData.success) {
                // Le backend retourne { data: { items: [...] } }
                console.log('Stock data received:', stockData.data);
                setStockItems(Array.isArray(stockData.data.items) ? stockData.data.items : []);
              }
            }
          } catch (error) {
            console.warn('Impossible de charger les articles de stock:', error);
          }
          
        } catch (error) {
          console.warn('Impossible de charger certaines données depuis la base:', error);
          // Garder les données par défaut
        }
      };
      
      loadData();
    }
  }, [isAuthenticated]);
  
  // États temporaires pour la migration (seront supprimés progressivement)
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [authView] = React.useState<'login' | 'register'>('login');
  const [examConfigurations, setExamConfigurations] = React.useState([]);
  const [reportTemplates, setReportTemplates] = React.useState([]);
  const [assets, setAssets] = React.useState(INITIAL_ASSETS);
  const [stockItems, setStockItems] = React.useState(INITIAL_STOCK_ITEMS);

  // Handlers pour l'interface
  const handleToggleNavigation = () => {
    setIsNavigationOpen(!isNavigationOpen);
  };

  const handleCloseNavigation = () => {
    setIsNavigationOpen(false);
  };

  const handleEmergencyMode = () => {
    setEmergencyMode(!emergencyMode);
  };

  const handleBreadcrumbNavigation = (view: any, roomId?: any) => {
    if (roomId) {
      navigateToRoom(roomId);
    } else {
      navigateToView(view);
    }
    handleCloseNavigation();
  };

  // Handlers d'authentification
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleCreatePatient = async (patientData: any, requestData: any) => {
    const result = await createPatient(patientData, requestData);
    if (result.success) {
      closeModal('isCreatePatientOpen');
      // Recharger les patients pour s'assurer de la mise à jour
      setTimeout(async () => {
        try {
          // await loadPatients(); // Fonction non disponible dans ce contexte
        } catch (error) {
          console.warn('Erreur lors du rechargement des patients:', error);
        }
      }, 200);
      // Navigation gérée automatiquement par le service
    }
  };

  const handlePatientFormSubmit = async (patientId: string, roomId: any, formData: any) => {
    const result = await updatePatientRoomData(patientId, roomId, formData);
    if (result.success) {
      closeModal('isPatientFormOpen');
    }
  };

  const handleMovePatient = async (patientId: string, targetRoomId: any) => {
    await movePatient(patientId, targetRoomId);
  };

  const handleAttachDocument = async (patientId: string, file: File) => {
    await attachDocument(patientId, file);
  };

  const handleViewPatientDetail = (patient: any) => {
    selectPatient(patient);
    navigateToView('patient_detail');
  };

  const handleCloseDetailView = () => {
    selectPatient(null);
    navigateToView('rooms_overview');
  };

  const handleEditPatient = (patient: any) => {
    // Ouvrir le modal de modification patient avec les données pré-remplies
    openPatientForm(patient.id, 'DEMANDE'); // Utilise la salle DEMANDE pour modification
  };

  const handleDeletePatient = async (patient: any) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/patients/${patient.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Recharger la liste des patients
          window.location.reload(); // Solution simple pour recharger
          showSuccess(`Patient ${patient.name} supprimé avec succès`);
        } else {
          showError(`Erreur: ${data.message}`);
        }
      } else {
        showError('Erreur lors de la suppression du patient');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showError('Erreur de connexion lors de la suppression');
    }
  };

  const handleAddTracerLot = async (newLot: any) => {
    await addLot(newLot);
  };

  const handleAddPreparationLog = async (newPreparation: any) => {
    await addPreparation(newPreparation);
  };

  // Handlers pour les isotopes
  const handleSaveIsotope = async (isotopeData: any) => {
    try {
      // L'IsotopesManagementView gère déjà l'API
      console.log('Isotope sauvé:', isotopeData);
      showSuccess('Isotope sauvé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'isotope:', error);
      showError('Erreur lors de la sauvegarde de l\'isotope');
    }
  };

  const handleDeleteIsotope = async (isotope: any) => {
    try {
      // L'IsotopesManagementView gère déjà l'API
      console.log('Isotope supprimé:', isotope);
      showSuccess('Isotope supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'isotope:', error);
      showError('Erreur lors de la suppression de l\'isotope');
    }
  };

  // Handlers pour les configurations d'examen
  const handleSaveExamConfig = async (configData: any) => {
    try {
      const { examConfigApiService } = await import('./src/services/examConfigApiService');
      
      let savedConfig;
      if (configData.id || configData.config_id) {
        // Mise à jour d'une configuration existante
        const idToUse = configData.id || configData.config_id;
        savedConfig = await examConfigApiService.updateExamConfiguration(idToUse, {
          name: configData.name,
          fields: configData.fields || []
        });
      } else {
        // Création d'une nouvelle configuration
        const configId = `exam_${Date.now()}`;
        savedConfig = await examConfigApiService.createExamConfiguration({
          config_id: configId,
          name: configData.name,
          fields: configData.fields || []
        });
      }
      
      // Mettre à jour l'état local
      setExamConfigurations(prev => {
        const existing = prev.findIndex(c => c.config_id === savedConfig.config_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = savedConfig;
          return updated;
        } else {
          return [...prev, savedConfig];
        }
      });
      
      closeModal('isExamConfigFormOpen');
      
      // Ajouter une notification de succès
      showSuccess(`Configuration d'examen "${configData.name}" ${configData.id ? 'modifiée' : 'ajoutée'} avec succès et sauvegardée en base !`);
      
      // Forcer un rechargement des configurations depuis la base
      setTimeout(async () => {
        try {
          const { examConfigApiService } = await import('./src/services/examConfigApiService');
          const configs = await examConfigApiService.getExamConfigurations();
          setExamConfigurations(configs);
        } catch (error) {
          console.warn('Impossible de recharger les configurations:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration d\'examen:', error);
      showError('Erreur lors de la sauvegarde de la configuration d\'examen');
    }
  };

  // Handlers pour les modèles de rapport
  const handleSaveReportTemplate = async (templateData: any) => {
    try {
      const { reportTemplateApiService } = await import('./src/services/reportTemplateApiService');
      
      let savedTemplate;
      if (templateData.id || templateData.template_id) {
        // Mise à jour d'un modèle existant
        const content = JSON.stringify({
          reportContent: templateData.reportContent || '',
          conclusionContent: templateData.conclusionContent || '',
          examName: templateData.examName || ''
        });
        
        const idToUse = templateData.id || templateData.template_id;
        savedTemplate = await reportTemplateApiService.updateReportTemplate(idToUse, {
          name: templateData.name,
          content: content
        });
      } else {
        // Création d'un nouveau modèle
        const templateId = `template_${Date.now()}`;
        // Combiner reportContent et conclusionContent en un seul contenu
        const content = JSON.stringify({
          reportContent: templateData.reportContent || '',
          conclusionContent: templateData.conclusionContent || '',
          examName: templateData.examName || ''
        });
        
        savedTemplate = await reportTemplateApiService.createReportTemplate({
          template_id: templateId,
          name: templateData.name,
          content: content
        });
      }
      
      // Mettre à jour l'état local
      setReportTemplates(prev => {
        const existing = prev.findIndex(t => t.template_id === savedTemplate.template_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = savedTemplate;
          return updated;
        } else {
          return [...prev, savedTemplate];
        }
      });
      
      closeModal('isReportTemplateFormOpen');
      showSuccess(`Modèle de rapport "${templateData.name}" ${templateData.id ? 'modifié' : 'ajouté'} avec succès et sauvegardé en base !`);
      
      // Forcer un rechargement des modèles depuis la base
      setTimeout(async () => {
        try {
          const { reportTemplateApiService } = await import('./src/services/reportTemplateApiService');
          const templates = await reportTemplateApiService.getReportTemplates();
          
          // Parser les modèles comme au chargement initial
          const parsedTemplates = templates.map(template => {
            try {
              const contentData = JSON.parse(template.content);
              return {
                id: template.template_id,
                name: template.name,
                examName: contentData.examName || '',
                reportContent: contentData.reportContent || '',
                conclusionContent: contentData.conclusionContent || '',
                createdAt: template.created_at
              };
            } catch (error) {
              return {
                id: template.template_id,
                name: template.name,
                examName: '',
                reportContent: template.content || '',
                conclusionContent: '',
                createdAt: template.created_at
              };
            }
          });
          
          setReportTemplates(parsedTemplates);
        } catch (error) {
          console.warn('Impossible de recharger les modèles:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du modèle de rapport:', error);
      showError('Erreur lors de la sauvegarde du modèle de rapport');
    }
  };

  // Handlers pour les rôles
  const handleSaveRole = async (roleData: any) => {
    try {
      const { roleApiService } = await import('./src/services/roleApiService');
      
      let savedRole;
      if (roleData.id) {
        // Mise à jour d'un rôle existant
        savedRole = await roleApiService.updateRole(roleData.id, {
          name: roleData.name,
          displayName: roleData.displayName || roleData.name,
          permissions: roleData.permissions || []
        });
      } else {
        // Création d'un nouveau rôle
        const roleId = `role_${Date.now()}`;
        savedRole = await roleApiService.createRole({
          id: roleId,
          name: roleData.name,
          displayName: roleData.displayName || roleData.name,
          permissions: roleData.permissions || []
        });
      }
      
      closeModal('isRoleFormOpen');
      showSuccess(`Rôle "${roleData.name}" ${roleData.id ? 'modifié' : 'ajouté'} avec succès et sauvegardé en base !`);
      
      // Recharger la liste des rôles
      setTimeout(async () => {
        try {
          const { roleApiService } = await import('./src/services/roleApiService');
          const rolesData = await roleApiService.getRoles();
          setRoles(rolesData);
        } catch (error) {
          console.warn('Impossible de recharger les rôles:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rôle:', error);
      showError('Erreur lors de la sauvegarde du rôle: ' + error.message);
    }
  };

  // Handlers pour les utilisateurs
  const handleSaveUser = async (userData: any) => {
    try {
      const { userApiService } = await import('./src/services/userApiService');
      
      let savedUser;
      if (userData.id) {
        // Mise à jour d'un utilisateur existant
        savedUser = await userApiService.updateUser(userData.id, {
          name: userData.name,
          email: userData.email,
          roleId: userData.roleId,
          ...((userData.passwordHash || userData.password) && { password: userData.passwordHash || userData.password })
        });
      } else {
        // Création d'un nouvel utilisateur
        savedUser = await userApiService.createUser({
          name: userData.name,
          email: userData.email,
          password: userData.passwordHash || userData.password,
          roleId: userData.roleId
        });
      }
      
      closeModal('isUserFormOpen');
      showSuccess(`Utilisateur "${userData.name}" ${userData.id ? 'modifié' : 'créé'} avec succès et sauvegardé en base !`);
      
      // Recharger la liste des utilisateurs
      setTimeout(async () => {
        try {
          const { userApiService } = await import('./src/services/userApiService');
          const usersData = await userApiService.getUsers();
          setUsers(usersData);
        } catch (error) {
          console.warn('Impossible de recharger les utilisateurs:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
      showError('Erreur lors de la sauvegarde de l\'utilisateur: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { userApiService } = await import('./src/services/userApiService');
      await userApiService.deleteUser(userId);
      
      showSuccess('Utilisateur supprimé avec succès !');
      
      // Recharger la liste des utilisateurs
      setTimeout(async () => {
        try {
          const { userApiService } = await import('./src/services/userApiService');
          const usersData = await userApiService.getUsers();
          setUsers(usersData);
        } catch (error) {
          console.warn('Impossible de recharger les utilisateurs:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      showError('Erreur lors de la suppression de l\'utilisateur: ' + error.message);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      const { roleApiService } = await import('./src/services/roleApiService');
      await roleApiService.deleteRole(role.id);
      
      showSuccess('Rôle supprimé avec succès !');
      
      // Recharger la liste des rôles
      setTimeout(async () => {
        try {
          const { roleApiService } = await import('./src/services/roleApiService');
          const rolesData = await roleApiService.getRoles();
          setRoles(rolesData);
        } catch (error) {
          console.warn('Impossible de recharger les rôles:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      showError('Erreur lors de la suppression du rôle: ' + error.message);
    }
  };

  // Handlers pour les configurations d'examens
  const handleDeleteExamConfig = async (config: any) => {
    try {
      const { examConfigApiService } = await import('./src/services/examConfigApiService');
      await examConfigApiService.deleteExamConfiguration(config.config_id || config.id);
      
      showSuccess('Configuration d\'examen supprimée avec succès !');
      
      // Recharger la liste des configurations
      setTimeout(async () => {
        try {
          const { examConfigApiService } = await import('./src/services/examConfigApiService');
          const configs = await examConfigApiService.getExamConfigurations();
          setExamConfigurations(configs);
        } catch (error) {
          console.warn('Impossible de recharger les configurations:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la suppression de la configuration d\'examen:', error);
      
      // Si la configuration n'existe pas, on la supprime quand même de la liste locale
      if (error.message && error.message.includes('non trouvée')) {
        setExamConfigurations(prev => prev.filter(c => (c.config_id || c.id) !== (config.config_id || config.id)));
        showSuccess('Configuration d\'examen supprimée (déjà supprimée de la base de données)');
      } else {
        showError('Erreur lors de la suppression de la configuration d\'examen: ' + error.message);
      }
    }
  };

  // Handlers pour les modèles de rapports
  const handleDeleteReportTemplate = async (template: any) => {
    try {
      const { reportTemplateApiService } = await import('./src/services/reportTemplateApiService');
      await reportTemplateApiService.deleteReportTemplate(template.template_id || template.id);
      
      showSuccess('Modèle de rapport supprimé avec succès !');
      
      // Recharger la liste des modèles
      setTimeout(async () => {
        try {
          const { reportTemplateApiService } = await import('./src/services/reportTemplateApiService');
          const templates = await reportTemplateApiService.getReportTemplates();
          
          // Parser les modèles comme au chargement initial
          const parsedTemplates = templates.map(template => {
            try {
              const content = JSON.parse(template.content || '{}');
              return {
                ...template,
                examName: content.examName || '',
                reportContent: content.reportContent || '',
                conclusionContent: content.conclusionContent || ''
              };
            } catch (error) {
              console.warn('Erreur lors du parsing du contenu du modèle:', error);
              return {
                ...template,
                examName: '',
                reportContent: template.content || '',
                conclusionContent: ''
              };
            }
          });
          
          setReportTemplates(parsedTemplates);
        } catch (error) {
          console.warn('Impossible de recharger les modèles:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la suppression du modèle de rapport:', error);
      
      // Si le modèle n'existe pas, on le supprime quand même de la liste locale
      if (error.message && error.message.includes('non trouvé')) {
        setReportTemplates(prev => prev.filter(t => (t.template_id || t.id) !== (template.template_id || template.id)));
        showSuccess('Modèle de rapport supprimé (déjà supprimé de la base de données)');
      } else {
        showError('Erreur lors de la suppression du modèle de rapport: ' + error.message);
      }
    }
  };

  // Données dérivées avec authentification réelle
  const visibleRooms = ROOMS_CONFIG.filter(room => {
    if (!currentUser || !currentRole) return false;
    return (currentRole?.name === 'Administrateur(trice)') || 
           room.allowedRoleIds.includes(currentRole?.id || '');
  });
  const activeRoom = activeRoomId ? ROOMS_CONFIG.find(r => r.id === activeRoomId) : null;
  const patientsInActiveRoom = activeRoomId ? patients.filter(p => p.currentRoomId === activeRoomId) : [];
  const searchResults = searchTerm.trim() !== '' ? getPatientsBySearch(searchTerm) : [];
  const modalPatient = getModalPatientId() ? getPatientById(getModalPatientId()!) : null;
  const modalRoom = getModalRoomId() ? ROOMS_CONFIG.find(r => r.id === getModalRoomId()) : null;

  // Gestionnaire de navigation centralisé
  const navigationHandlers = {
    onShowDailyWorklist: () => navigateToView('daily_worklist'),
    onShowRoomsOverview: () => navigateToView('rooms_overview'),
    onShowActivityFeed: () => navigateToView('activity_feed'),
    onShowStatisticsView: () => navigateToView('statistics'),
    onShowDatabaseView: () => navigateToView('database'),
    onShowAdministrationView: () => navigateToView('administration'),
    onShowExamSettingsView: () => navigateToView('exam_settings'),
    onShowReportTemplatesSettingsView: () => navigateToView('report_templates_settings'),
    onShowHotLab: () => navigateToView('hot_lab'),
    onShowTracersManagement: () => navigateToView('tracers_management'),
    onShowPreparationsManagement: () => navigateToView('preparations_management'),
    onShowIsotopesManagement: () => navigateToView('isotopes_management'),
    onShowPatrimonyDashboard: () => navigateToView('patrimony_dashboard'),
    onShowPatrimonyInventory: () => navigateToView('patrimony_inventory'),
    onShowPatrimonyStock: () => navigateToView('patrimony_stock'),
    onShowPatrimonyAssetStatus: () => navigateToView('patrimony_asset_status')
  };

  /**
   * Rendu des vues avec lazy loading et error boundaries
   */
  const renderCurrentView = () => {
    const viewComponents = {
      search: () => (
        <GlobalSearchView
          searchResults={searchResults}
          onViewPatientDetail={handleViewPatientDetail}
          searchTerm={searchTerm}
        />
      ),
      patient_detail: () => selectedPatient && (
        <PatientDetailView
          patient={selectedPatient}
          onCloseDetailView={handleCloseDetailView}
          roomsConfig={ROOMS_CONFIG}
          onAttachDocument={handleAttachDocument}
          examConfigurations={examConfigurations}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
        />
      ),
      daily_worklist: () => (
        <DailyWorklistView
          allPatients={patients}
          onViewPatientDetail={handleViewPatientDetail}
        />
      ),
      rooms_overview: () => (
        <RoomsOverview
          visibleRooms={visibleRooms}
          allPatients={patients}
          hotLabData={hotLabData}
          onSelectRoom={navigateToRoom}
          onViewPatientDetail={handleViewPatientDetail}
          onMovePatient={handleMovePatient}
        />
      ),
      activity_feed: () => (
        <ActivityFeedView
          allPatients={patients}
          selectedPeriod={selectedPeriod}
          onViewPatientDetail={handleViewPatientDetail}
          roomsConfig={ROOMS_CONFIG}
        />
      ),
      statistics: () => (
        <StatisticsView
          allPatients={patients}
          selectedPeriod={selectedPeriod}
          roomsConfig={ROOMS_CONFIG}
        />
      ),
      hot_lab: () => (
        <HotLabView
          hotLabData={hotLabData}
          onAddTracerLot={handleAddTracerLot}
          onAddPreparationLog={handleAddPreparationLog}
          allPatients={patients}
        />
      ),
      tracers_management: () => (
        <TracersManagementView
          hotLabData={hotLabData}
          onAddTracerLot={handleAddTracerLot}
        />
      ),
      preparations_management: () => (
        <PreparationsManagementView
          hotLabData={hotLabData}
          allPatients={patients}
          onAddPreparationLog={handleAddPreparationLog}
        />
      ),
      isotopes_management: () => (
        <IsotopesManagementView
          onSave={handleSaveIsotope}
          onDelete={handleDeleteIsotope}
        />
      ),
      administration: () => (
        <AdministrationView
          users={users}
          roles={roles}
          onSaveUser={handleSaveUser}
          onDeleteUser={handleDeleteUser}
          onSaveRole={handleSaveRole}
          onDeleteRole={handleDeleteRole}
        />
      ),
      exam_settings: () => (
        <ExamSettingsView
          examConfigurations={examConfigurations}
          onSave={handleSaveExamConfig}
          onDelete={handleDeleteExamConfig}
        />
      ),
      database: () => (
        <DatabaseView
          allPatients={patients}
          roomsConfig={ROOMS_CONFIG}
          onViewPatientDetail={handleViewPatientDetail}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
        />
      ),
      report_templates_settings: () => (
        <ReportTemplatesSettingsView
          reportTemplates={reportTemplates}
          onSave={handleSaveReportTemplate}
          onDelete={handleDeleteReportTemplate}
        />
      ),
      patrimony_dashboard: () => (
        <PatrimonyDashboardView
          assets={assets}
          stockItems={stockItems}
          onNavigateToInventory={navigationHandlers.onShowPatrimonyInventory}
          onNavigateToStock={navigationHandlers.onShowPatrimonyStock}
          onAddAsset={openAssetForm}
          onAddStockEntry={openStockEntry}
        />
      ),
      patrimony_inventory: () => (
        <PatrimonyInventoryView
          assets={assets}
          onAddAsset={openAssetForm}
          onEditAsset={openAssetForm}
          onDeleteAsset={() => {}}
        />
      ),
      patrimony_stock: () => (
        <PatrimonyStockView
          stockItems={stockItems}
          onAddNewEntry={openStockEntry}
          onAddNewExit={openStockExit}
          onViewItemDetail={() => {}}
          onAddStockItem={openStockItemForm}
          onEditStockItem={openStockItemForm}
          onDeleteStockItem={() => {}}
        />
      ),
      patrimony_stock_detail: () => getSelectedStockItem() && (
        <StockItemDetailView
          stockItem={getSelectedStockItem()}
          onClose={() => navigateToView('patrimony_stock')}
        />
      ),
      patrimony_asset_status: () => (
        <PatrimonyAssetStatusView
          lifeSheetLots={[]}
          lifeSheetUnits={[]}
          onSaveLifeSheet={() => {}}
        />
      ),
      room: () => activeRoom && (
        <RoomView
          room={activeRoom}
          patientsInRoom={patientsInActiveRoom}
          allPatients={patients}
          onOpenPatientFormModal={openPatientForm}
          onMovePatient={handleMovePatient}
          onOpenCreatePatientModal={activeRoom.id === 'DEMANDE' ? openCreatePatient : undefined}
          selectedPeriod={selectedPeriod}
          onViewPatientDetail={handleViewPatientDetail}
        />
      )
    };

    const ViewComponent = viewComponents[activeView];
    if (!ViewComponent) {
      return (
        <RoomsOverview
          visibleRooms={visibleRooms}
          allPatients={patients}
          hotLabData={hotLabData}
          onSelectRoom={navigateToRoom}
          onViewPatientDetail={handleViewPatientDetail}
          onMovePatient={handleMovePatient}
        />
      );
    }

    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          {ViewComponent()}
        </Suspense>
      </ErrorBoundary>
    );
  };

  // Affichage pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Initialisation de l'application..." />
      </div>
    );
  }

  // Gate d'authentification
  if (!isAuthenticated || !currentUser) {
    const handleLogin = async (credentials: LoginCredentials): Promise<AuthResponse> => {
      try {
        return await login(credentials.email, credentials.password);
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Erreur de connexion'
        };
      }
    };

    return authView === 'login' 
      ? <LoginPage onLogin={handleLogin} onSwitchToRegister={() => {}} />
      : <RegisterPage onRegister={() => Promise.resolve({ success: true })} onSwitchToLogin={() => {}} roles={roles} />;
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-slate-50">
        {/* Navigation principale */}
        <Navbar
          currentUser={currentUser}
          currentUserRoleName={currentRole?.name || 'N/A'}
          onLogout={handleLogout}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          onToggleNavigation={handleToggleNavigation}
          isNavigationOpen={isNavigationOpen}
          onEmergencyMode={handleEmergencyMode}
          emergencyMode={emergencyMode}
        />

        <div className="flex-grow flex overflow-hidden">
          {/* Navigation latérale */}
          <RoomNavigation
            rooms={visibleRooms}
            activeRoomId={activeRoomId}
            currentView={activeView}
            onSelectRoom={(roomId) => {
              navigateToRoom(roomId);
              handleCloseNavigation();
            }}
            isUserAdmin={currentRole?.name === 'Administrateur(trice)'}
            isOpen={isNavigationOpen}
            onClose={handleCloseNavigation}
            {...navigationHandlers}
          />

          {/* Contenu principal */}
          <main className="flex-grow flex flex-col overflow-hidden">
            {/* Breadcrumb */}
            <Breadcrumb
              currentView={activeView}
              activeRoomId={activeRoomId}
              selectedPatientName={selectedPatient?.name}
              onNavigate={handleBreadcrumbNavigation}
            />

            {/* Contenu de la page */}
            <div className="flex-grow p-4 lg:p-6 overflow-auto bg-slate-50">
              {renderCurrentView()}
            </div>
          </main>
        </div>

        {/* Modales avec lazy loading */}
        <Suspense fallback={null}>
          {modals.isPatientFormOpen && modalPatient && modalRoom && (
            <PatientFormModal
              isOpen={modals.isPatientFormOpen}
              onClose={() => closeModal('isPatientFormOpen')}
              onSubmit={handlePatientFormSubmit}
              patient={modalPatient}
              room={modalRoom}
              examConfigurations={examConfigurations}
              reportTemplates={reportTemplates}
            />
          )}

          {modals.isCreatePatientOpen && (
            <CreatePatientModal
              isOpen={modals.isCreatePatientOpen}
              onClose={() => closeModal('isCreatePatientOpen')}
              onCreatePatient={handleCreatePatient}
              allPatients={patients}
              examConfigurations={examConfigurations}
            />
          )}

          {modals.isStockEntryOpen && (
            <StockEntryFormModal
              isOpen={modals.isStockEntryOpen}
              onClose={() => closeModal('isStockEntryOpen')}
              onSubmit={() => {}}
              stockItems={stockItems}
            />
          )}

          {modals.isStockExitOpen && (
            <StockExitFormModal
              isOpen={modals.isStockExitOpen}
              onClose={() => closeModal('isStockExitOpen')}
              onSubmit={() => {}}
              stockItems={stockItems}
            />
          )}

          {modals.isAssetFormOpen && (
            <AssetFormModal
              isOpen={modals.isAssetFormOpen}
              onClose={() => closeModal('isAssetFormOpen')}
              onSubmit={() => {}}
              initialData={getEditingAsset()}
            />
          )}

          {modals.isStockItemFormOpen && (
            <StockItemFormModal
              isOpen={modals.isStockItemFormOpen}
              onClose={() => closeModal('isStockItemFormOpen')}
              onSubmit={() => {}}
              initialData={getEditingStockItem()}
            />
          )}


          {modals.isRoleFormOpen && (
            <RoleFormModal
              isOpen={modals.isRoleFormOpen}
              onClose={() => closeModal('isRoleFormOpen')}
              onSubmit={handleSaveRole}
              initialData={getEditingRole()}
            />
          )}

          {modals.isUserFormOpen && (
            <UserFormModal
              isOpen={modals.isUserFormOpen}
              onClose={() => closeModal('isUserFormOpen')}
              onSubmit={handleSaveUser}
              initialData={getEditingUser()}
              roles={roles}
            />
          )}

          {modals.isExamConfigFormOpen && (
            <ExamConfigFormModal
              isOpen={modals.isExamConfigFormOpen}
              onClose={() => closeModal('isExamConfigFormOpen')}
              onSubmit={handleSaveExamConfig}
              initialData={getEditingExamConfig()}
            />
          )}

          {modals.isReportTemplateFormOpen && (
            <ReportTemplateFormModal
              isOpen={modals.isReportTemplateFormOpen}
              onClose={() => closeModal('isReportTemplateFormOpen')}
              onSubmit={handleSaveReportTemplate}
              initialData={getEditingReportTemplate()}
            />
          )}

        </Suspense>

        {/* Notifications toast */}
        <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-full max-w-sm">
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onDismiss={removeToast} />
          ))}
        </div>

        {/* Modal de confirmation */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onClose={closeConfirmation}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
