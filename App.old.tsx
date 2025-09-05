import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RoomNavigation } from './components/RoomNavigation';
import { RoomView } from './components/RoomView';
import { PatientFormModal } from './components/PatientFormModal';
import { CreatePatientModal } from './components/CreatePatientModal';
import { GlobalSearchView } from './components/GlobalSearchView';
import { DailyWorklistView } from './components/DailyWorklistView';
import { PatientDetailView } from './components/PatientDetailView';
import { RoomsOverview } from './components/RoomsOverview';
import { ActivityFeedView } from './components/ActivityFeedView';
import { StatisticsView } from './components/StatisticsView';
import { HotLabView } from './components/HotLabView';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AdministrationView } from './components/AdministrationView';
import { ExamSettingsView } from './components/ExamSettingsView';
import { DatabaseView } from './components/DatabaseView';
import { ReportTemplatesSettingsView } from './components/ReportTemplatesSettingsView';
import { PatrimonyDashboardView } from './components/PatrimonyDashboardView';
import { PatrimonyInventoryView } from './components/PatrimonyInventoryView';
import { PatrimonyStockView } from './components/PatrimonyStockView';
import { StockEntryFormModal } from './components/StockEntryFormModal';
import { StockExitFormModal } from './components/StockExitFormModal';
import { StockItemDetailView } from './components/StockItemDetailView';
import { AssetFormModal } from './components/AssetFormModal';
import { StockItemFormModal } from './components/StockItemFormModal';
import { PatrimonyAssetStatusView } from './components/PatrimonyAssetStatusView';
import { Toast, ToastProps } from './components/Toast';
import { ConfirmationModal } from './components/ConfirmationModal';
import { 
  Patient, Room, RoomId, PatientStatusInRoom, PatientHistoryEntry, 
  PeriodOption, ActiveView, HotLabData, User, TracerLot, PreparationLog,
  ReferringEntity, RequestIndications, PatientDocument, Role, ExamConfiguration,
  NewPatientData,
  ReportTemplate,
  Asset, StockItem, StockMovement,
  LifeSheetLot, LifeSheetUnit
} from './types';
import { ROOMS_CONFIG, INITIAL_PATIENTS, INITIAL_HOT_LAB_DATA, INITIAL_ROLES, INITIAL_EXAM_CONFIGURATIONS, INITIAL_REPORT_TEMPLATES, INITIAL_ASSETS, INITIAL_STOCK_ITEMS } from './constants';
import { calculateAge } from './utils/dateUtils';

// --- Auth Service (simulated with localStorage) ---
const USERS_STORAGE_KEY = 'gestion_patient_mn_users';
const ROLES_STORAGE_KEY = 'gestion_patient_mn_roles';
const SESSION_STORAGE_KEY = 'gestion_patient_mn_session';
const EXAM_CONFIGS_STORAGE_KEY = 'gestion_patient_mn_exam_configs';
const REPORT_TEMPLATES_STORAGE_KEY = 'gestion_patient_mn_report_templates';
const ASSETS_STORAGE_KEY = 'gestion_patient_mn_assets';
const STOCK_ITEMS_STORAGE_KEY = 'gestion_patient_mn_stock_items';

// MOCK DATA for Life Sheets
const INITIAL_LIFE_SHEET_LOTS: LifeSheetLot[] = [
    {
        id: 'ASSET002', // Fauteuil de bureau
        designation: 'Fauteuil de bureau',
        identificationCode: 'LOT-FAUTEUIL-2015',
        lotValue: 750, // 5 * 150
        unitValue: 150,
        movements: [
            { id: 'MVT_L_1', date: '2015-01-10', nature: 'Acquisition Initiale', entryUnits: 5, entryAmount: 750, entryDestination: 'Bureau Admin' },
            { id: 'MVT_L_2', date: '2022-03-15', nature: 'Transfert', exitUnits: 2, exitAmount: 300, exitDestination: 'Salle de Consultation' },
        ]
    }
];

const INITIAL_LIFE_SHEET_UNITS: LifeSheetUnit[] = [
    {
        id: 'ASSET001', // Switch SCISCO
        designation: 'Switch SCISCO SG350-28P',
        identificationCode: 'DNI241806TQ',
        movements: [
            { id: 'MVT_U_1', date: '2022-02-20', nature: 'Acquisition', entryAmount: 500, entryState: 'Bon', entryDestination: 'Salle Serveur' },
        ]
    },
    {
        id: 'ASSET004', // Groupe électrogène
        designation: 'Groupe électrogène CUMMINS 44KVA',
        identificationCode: 'C44D5C141204362',
        movements: [
            { id: 'MVT_U_2', date: '2015-06-01', nature: 'Acquisition', entryAmount: 12000, entryState: 'Bon', entryDestination: 'Local Technique' },
            { id: 'MVT_U_3', date: '2023-11-10', nature: 'Maintenance', entryAmount: 350, entryState: 'Bon', entryDestination: 'Local Technique' },
        ]
    }
];

const getInitialUsers = (): User[] => {
  try {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedUsers) return JSON.parse(savedUsers);
    
    // Default admin user if none exist
    const initialAdmin: User = {
      id: 'admin_user_01',
      name: 'Admin Principal',
      email: 'admin@mn.com',
      passwordHash: 'admin123', // PLAIN TEXT for this simulation
      roleId: 'role_admin',
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([initialAdmin]));
    return [initialAdmin];
  } catch (error) {
    console.error("Erreur lors de l'initialisation des utilisateurs:", error);
    return [];
  }
};

const getInitialRoles = (): Role[] => {
    try {
        const savedRoles = localStorage.getItem(ROLES_STORAGE_KEY);
        if (savedRoles) return JSON.parse(savedRoles);
        localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(INITIAL_ROLES));
        return INITIAL_ROLES;
    } catch (error) {
        console.error("Erreur lors de l'initialisation des rôles:", error);
        return [];
    }
};

const getInitialExamConfigs = (): ExamConfiguration[] => {
    try {
        const saved = localStorage.getItem(EXAM_CONFIGS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        localStorage.setItem(EXAM_CONFIGS_STORAGE_KEY, JSON.stringify(INITIAL_EXAM_CONFIGURATIONS));
        return INITIAL_EXAM_CONFIGURATIONS;
    } catch (error) {
        console.error("Erreur lors de l'initialisation des configurations d'examen:", error);
        return [];
    }
};

const getInitialReportTemplates = (): ReportTemplate[] => {
    try {
        const saved = localStorage.getItem(REPORT_TEMPLATES_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        localStorage.setItem(REPORT_TEMPLATES_STORAGE_KEY, JSON.stringify(INITIAL_REPORT_TEMPLATES));
        return INITIAL_REPORT_TEMPLATES;
    } catch (error) {
        console.error("Erreur lors de l'initialisation des modèles de CR:", error);
        return [];
    }
};

const getInitialAssets = (): Asset[] => {
    try {
        const saved = localStorage.getItem(ASSETS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(INITIAL_ASSETS));
        return INITIAL_ASSETS;
    } catch (error) {
        console.error("Erreur lors de l'initialisation des actifs:", error);
        return [];
    }
};

const getInitialStockItems = (): StockItem[] => {
    try {
        const saved = localStorage.getItem(STOCK_ITEMS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        localStorage.setItem(STOCK_ITEMS_STORAGE_KEY, JSON.stringify(INITIAL_STOCK_ITEMS));
        return INITIAL_STOCK_ITEMS;
    } catch (error) {
        console.error("Erreur lors de l'initialisation des articles de stock:", error);
        return [];
    }
};


const sessionService = {
  login: (user: User) => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  },
  logout: () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },
  getCurrentUser: (): User | null => {
    try {
      const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error("Erreur lors de la récupération de la session:", error);
      return null;
    }
  }
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Main App Component ---
function App() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS.map(p => ({...p, age: calculateAge(p.dateOfBirth)})));
  const [activeRoomId, setActiveRoomId] = useState<RoomId | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('rooms_overview');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientFormModalOpen, setIsPatientFormModalOpen] = useState(false);
  const [isCreatePatientModalOpen, setIsCreatePatientModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<{ patientId: string; roomId: RoomId } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [hotLabData, setHotLabData] = useState<HotLabData>(INITIAL_HOT_LAB_DATA);

  // --- Auth & Roles State ---
  const [users, setUsers] = useState<User[]>(getInitialUsers);
  const [roles, setRoles] = useState<Role[]>(getInitialRoles);
  const [currentUser, setCurrentUser] = useState<User | null>(() => sessionService.getCurrentUser());
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  // --- Configuration State ---
  const [examConfigurations, setExamConfigurations] = useState<ExamConfiguration[]>(getInitialExamConfigs);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>(getInitialReportTemplates);

  // --- Patrimony State ---
  const [assets, setAssets] = useState<Asset[]>(getInitialAssets);
  const [stockItems, setStockItems] = useState<StockItem[]>(getInitialStockItems);
  const [isStockEntryModalOpen, setIsStockEntryModalOpen] = useState(false);
  const [isStockExitModalOpen, setIsStockExitModalOpen] = useState(false);
  const [isAssetFormModalOpen, setIsAssetFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [isStockItemFormModalOpen, setIsStockItemFormModalOpen] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  const [lifeSheetLots, setLifeSheetLots] = useState<LifeSheetLot[]>(INITIAL_LIFE_SHEET_LOTS);
  const [lifeSheetUnits, setLifeSheetUnits] = useState<LifeSheetUnit[]>(INITIAL_LIFE_SHEET_UNITS);

  // --- UI Feedback State ---
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onDismiss'>[]>([]);
  const [confirmationState, setConfirmationState] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: async () => {},
  });

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => Promise<void>) => {
      setConfirmationState({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmation = () => {
      setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: async () => {} });
  };


  // Persist data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem(EXAM_CONFIGS_STORAGE_KEY, JSON.stringify(examConfigurations));
  }, [examConfigurations]);

  useEffect(() => {
    localStorage.setItem(REPORT_TEMPLATES_STORAGE_KEY, JSON.stringify(reportTemplates));
  }, [reportTemplates]);

  useEffect(() => {
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem(STOCK_ITEMS_STORAGE_KEY, JSON.stringify(stockItems));
  }, [stockItems]);


  // --- Authentication Handlers ---
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    await sleep(300);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);
    if (user) {
      sessionService.login(user);
      setCurrentUser(user);
      return true;
    }
    return false;
  };
  
  const handleRegister = async (name: string, email: string, password: string, roleId: string): Promise<{ success: boolean; message?: string }> => {
    await sleep(400);
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: "Un utilisateur avec cet email existe déjà." };
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      passwordHash: password,
      roleId
    };
    setUsers(prev => [...prev, newUser]);
    sessionService.login(newUser);
    setCurrentUser(newUser);
    return { success: true };
  };
  
  const handleLogout = () => {
    sessionService.logout();
    setCurrentUser(null);
  };

  // --- User Management Handlers ---
  const handleSaveUser = async (userData: User | Omit<User, 'id'>) => {
    await sleep(300);
    let userName = '';
    setUsers(prevUsers => {
      if ('id' in userData && userData.id) {
        userName = userData.name;
        return prevUsers.map(u => u.id === userData.id ? { ...u, ...userData, passwordHash: userData.passwordHash || u.passwordHash } : u);
      } else {
        const newUser: User = {
          ...userData,
          id: `user_${Date.now()}`,
          passwordHash: userData.passwordHash || 'password',
          roleId: userData.roleId!
        };
        userName = newUser.name;
        return [...prevUsers, newUser];
      }
    });
    // FIX: Removed setIsUserModalOpen(false) as this state is managed
    // by the child component AdministrationView and this call causes an error.
    // The modal is closed by the AdministrationView component itself.
    addToast(`Utilisateur "${userName}" enregistré avec succès.`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (currentUser?.id === userId) {
      addToast("Vous ne pouvez pas supprimer votre propre compte.", "error");
      return;
    }
    
    showConfirmation(
      "Supprimer l'utilisateur",
      `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ? Cette action est irréversible.`,
      async () => {
        await sleep(300);
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        addToast(`L'utilisateur ${user.name} a été supprimé.`, 'success');
        closeConfirmation();
      }
    );
  };
  
  // --- Role Management Handlers ---
  const handleSaveRole = async (roleData: Role | Omit<Role, 'id'>) => {
    await sleep(300);
    setRoles(prevRoles => {
        if ('id' in roleData && roleData.id) {
            return prevRoles.map(r => r.id === roleData.id ? { ...r, ...roleData } : r);
        } else {
            const newRole: Role = {
                ...roleData,
                id: `role_${Date.now()}`,
                permissions: roleData.permissions || [],
            };
            return [...prevRoles, newRole];
        }
    });
    // FIX: Removed setIsRoleModalOpen(false) as this state is managed
    // by the child component AdministrationView and this call causes an error.
    // The modal is closed by the AdministrationView component itself.
    addToast(`Rôle "${roleData.name}" enregistré avec succès.`, 'success');
  };

  const handleDeleteRole = (role: Role) => {
    if (users.some(user => user.roleId === role.id)) {
        addToast("Ce rôle est assigné à des utilisateurs et ne peut pas être supprimé.", 'error');
        return;
    }
    showConfirmation(
      'Supprimer le rôle',
      `Êtes-vous sûr de vouloir supprimer le rôle "${role.name}" ? Cette action est irréversible.`,
      async () => {
          await sleep(300);
          setRoles(prevRoles => prevRoles.filter(r => r.id !== role.id));
          addToast(`Le rôle "${role.name}" a été supprimé.`, 'success');
          closeConfirmation();
      }
    );
  };
  
  // --- Exam Configuration Handlers ---
  const handleSaveExamConfiguration = async (configData: ExamConfiguration | Omit<ExamConfiguration, 'id'>) => {
    await sleep(300);
    setExamConfigurations(prev => {
        if ('id' in configData && configData.id) {
            return prev.map(c => c.id === configData.id ? { ...c, ...configData } : c);
        } else {
            const newConfig: ExamConfiguration = {
                ...configData,
                id: `exam_${Date.now()}`,
                fields: configData.fields || { request: [], consultation: [], report: [] }
            };
            return [...prev, newConfig];
        }
    });
    addToast(`Configuration "${configData.name}" enregistrée.`, 'success');
  };

  const handleDeleteExamConfiguration = (config: ExamConfiguration) => {
    const isUsed = patients.some(p => p.roomSpecificData?.[RoomId.REQUEST]?.requestedExam === config.name);
    if (isUsed) {
        addToast("Cette configuration est utilisée et ne peut être supprimée.", 'error');
        return;
    }
    showConfirmation(
      "Supprimer la configuration d'examen",
      `Êtes-vous sûr de vouloir supprimer "${config.name}" ?`,
      async () => {
        await sleep(300);
        setExamConfigurations(prev => prev.filter(c => c.id !== config.id));
        addToast(`Configuration "${config.name}" supprimée.`, 'success');
        closeConfirmation();
      }
    );
  };

  // --- Report Template Handlers ---
  const handleSaveReportTemplate = async (templateData: ReportTemplate | Omit<ReportTemplate, 'id'>) => {
    await sleep(300);
    setReportTemplates(prev => {
        if ('id' in templateData && templateData.id) {
            return prev.map(t => t.id === templateData.id ? { ...t, ...templateData } : t);
        } else {
            const newTemplate: ReportTemplate = {
                ...templateData,
                id: `template_${Date.now()}`,
            } as ReportTemplate;
            return [...prev, newTemplate];
        }
    });
    addToast(`Modèle "${templateData.name}" enregistré.`, 'success');
  };

  const handleDeleteReportTemplate = (template: ReportTemplate) => {
    showConfirmation(
      'Supprimer le modèle',
      `Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ?`,
      async () => {
          await sleep(300);
          setReportTemplates(prev => prev.filter(t => t.id !== template.id));
          addToast('Modèle supprimé.', 'success');
          closeConfirmation();
      }
    );
  };

  // --- Patrimony Handlers ---
  const handleAddNewStockEntry = async (entryData: {
    date: string;
    ordonnateur: string;
    service: string;
    documentRef: string;
    items: { stockItemId: string; quantity: number; unitPrice: number }[];
  }) => {
    await sleep(400);
    setStockItems(prevStockItems => {
        const newStockItems = JSON.parse(JSON.stringify(prevStockItems)); // Deep copy
        const docRef = entryData.documentRef || `BE-${Date.now().toString().slice(-6)}`;
        entryData.items.forEach((item, index) => {
            const stockItem = newStockItems.find((si: StockItem) => si.id === item.stockItemId);
            if (stockItem) {
                const newMovement: StockMovement = {
                    id: `MVT-${Date.now()}-${index}`,
                    date: new Date(entryData.date).toISOString(),
                    type: 'Entrée',
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    destinationOrSource: entryData.service,
                    documentRef: docRef,
                    ordonnateur: entryData.ordonnateur,
                };
                stockItem.movements.push(newMovement);
                stockItem.currentStock += item.quantity;
                stockItem.unitPrice = item.unitPrice;
            }
        });
        return newStockItems;
    });
    setIsStockEntryModalOpen(false);
    addToast('Entrée en stock enregistrée avec succès.', 'success');
  };

  const handleAddNewStockExit = async (exitData: {
    date: string;
    destinationOrSource: string;
    documentRef: string;
    items: { stockItemId: string; quantity: number }[];
    }) => {
        await sleep(400);
        setStockItems(prevStockItems => {
            const newStockItems = JSON.parse(JSON.stringify(prevStockItems)); // Deep copy
            exitData.items.forEach((item, index) => {
                const stockItem = newStockItems.find((si: StockItem) => si.id === item.stockItemId);
                if (stockItem && stockItem.currentStock >= item.quantity) {
                    const newMovement: StockMovement = {
                        id: `MVT-${Date.now()}-${index}`,
                        date: new Date(exitData.date).toISOString(),
                        type: 'Sortie',
                        quantity: item.quantity,
                        unitPrice: stockItem.unitPrice,
                        destinationOrSource: exitData.destinationOrSource,
                        documentRef: exitData.documentRef,
                    };
                    stockItem.movements.push(newMovement);
                    stockItem.currentStock -= item.quantity;
                } else {
                   addToast(`Stock insuffisant pour ${stockItem?.designation || 'cet article'}.`, 'error');
                }
            });
            return newStockItems;
        });
        setIsStockExitModalOpen(false);
        addToast('Sortie de stock enregistrée avec succès.', 'success');
  };

  const handleSaveAsset = async (assetData: Asset | Omit<Asset, 'id'>) => {
    await sleep(300);
    setAssets(prev => {
        if ('id' in assetData && assetData.id) {
            return prev.map(a => a.id === assetData.id ? { ...a, ...assetData } : a);
        } else {
            const newAsset: Asset = { id: `ASSET${Date.now()}`, ...assetData } as Asset;
            return [...prev, newAsset];
        }
    });
    setIsAssetFormModalOpen(false);
    addToast('Actif enregistré avec succès.', 'success');
  };

  const handleDeleteAsset = (asset: Asset) => {
      showConfirmation(
        'Supprimer l\'actif',
        `Êtes-vous sûr de vouloir supprimer "${asset.designation}" ?`,
        async () => {
            await sleep(300);
            setAssets(prev => prev.filter(a => a.id !== asset.id));
            addToast('Actif supprimé.', 'success');
            closeConfirmation();
        }
      );
  };
  
  const handleViewStockItemDetail = (item: StockItem) => {
    setSelectedStockItem(item);
    setActiveView('patrimony_stock_detail');
  };

  const handleCloseStockItemDetail = () => {
    setSelectedStockItem(null);
    setActiveView('patrimony_stock');
  };
  
  const handleSaveStockItem = async (itemData: Partial<Omit<StockItem, 'movements' | 'currentStock' | 'unitPrice'>>) => {
      await sleep(300);
      setStockItems(prev => {
          if (itemData.id) {
              return prev.map(item => item.id === itemData.id ? { ...item, ...itemData } : item);
          } else {
              const newItem: StockItem = {
                  id: `STOCK${Date.now()}`,
                  designation: itemData.designation!,
                  unit: itemData.unit!,
                  budgetLine: itemData.budgetLine,
                  currentStock: 0,
                  unitPrice: 0,
                  movements: [],
              };
              return [...prev, newItem];
          }
      });
      setIsStockItemFormModalOpen(false);
      addToast('Article de stock enregistré.', 'success');
  };

  const handleDeleteStockItem = (item: StockItem) => {
      if (item.movements.length > 0) {
          addToast("Cet article a des mouvements et ne peut être supprimé.", 'error');
          return;
      }
      showConfirmation(
        'Supprimer l\'article de stock',
        `Êtes-vous sûr de vouloir supprimer "${item.designation}" ? Cette action est irréversible.`,
        async () => {
          await sleep(300);
          setStockItems(prev => prev.filter(i => i.id !== item.id));
          addToast('Article supprimé.', 'success');
          closeConfirmation();
        }
      );
  };

  const handleSaveLifeSheet = async (updatedSheet: LifeSheetLot | LifeSheetUnit) => {
      await sleep(300);
      if ('lotValue' in updatedSheet) {
        setLifeSheetLots(prev => prev.map(sheet => sheet.id === updatedSheet.id ? updatedSheet : sheet));
      } else {
        setLifeSheetUnits(prev => prev.map(sheet => sheet.id === updatedSheet.id ? updatedSheet : sheet));
      }
      addToast('Fiche de vie enregistrée avec succès.', 'success');
  };


  // --- Patient & Room Handlers ---
  const handleCreatePatient = async (
    patientData: NewPatientData,
    requestData: { requestedExam?: string; customFields?: { [key: string]: any }; }
  ) => {
      await sleep(400);
      const newPatientId = `PAT${String(Date.now()).slice(-6)}`;
      const now = new Date().toISOString();
      const hasRequest = !!requestData.requestedExam;
      const newHistoryEntry: PatientHistoryEntry = {
        roomId: RoomId.REQUEST, entryDate: now, statusMessage: hasRequest ? 'Patient et demande créés.' : 'Patient créé.', exitDate: hasRequest ? now : undefined
      };
      const nextRoomId = hasRequest ? RoomId.APPOINTMENT : RoomId.REQUEST;
      const nextStatus = PatientStatusInRoom.WAITING;
      const history: PatientHistoryEntry[] = [newHistoryEntry];
      if (hasRequest) {
        history.push({ roomId: RoomId.APPOINTMENT, entryDate: new Date(Date.parse(now) + 1).toISOString(), statusMessage: `Entré dans Rendez-vous` });
      }
      const newPatient: Patient = {
        id: newPatientId, name: patientData.name, dateOfBirth: patientData.dateOfBirth, address: patientData.address, phone: patientData.phone, email: patientData.email, referringEntity: patientData.referringEntity, age: calculateAge(patientData.dateOfBirth), creationDate: now, currentRoomId: nextRoomId, statusInRoom: nextStatus, history: history, roomSpecificData: hasRequest ? { [RoomId.REQUEST]: requestData } : {},
      };
      setPatients(prev => [...prev, newPatient]);
      setIsCreatePatientModalOpen(false);
      addToast(`Patient ${newPatient.name} créé avec succès.`, 'success');
      handleSelectRoom(nextRoomId);
  };
  
  const handleSelectRoom = useCallback((roomId: RoomId) => {
    if (roomId === RoomId.GENERATOR) {
        setActiveView('hot_lab');
        setActiveRoomId(roomId);
    } else {
        setActiveView('room');
        setActiveRoomId(roomId);
    }
  }, []);
  
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term.trim() !== '') {
        setActiveView('search');
        setActiveRoomId(null);
    } else if (activeView === 'search') {
        setActiveView('rooms_overview');
    }
  };

  const handleOpenPatientFormModal = (patientId: string, roomId: RoomId) => {
    setModalContext({ patientId, roomId });
    setIsPatientFormModalOpen(true);
  };

  const handlePatientFormSubmit = async (patientId: string, roomId: RoomId, formData: any) => {
    await sleep(300);
    setPatients(prevPatients => {
        const newPatients = [...prevPatients];
        const patientIndex = newPatients.findIndex(p => p.id === patientId);
        if (patientIndex === -1) return prevPatients;
        const patient = { ...newPatients[patientIndex] };
        if (!patient.roomSpecificData) { patient.roomSpecificData = {}; }
        const currentRoomData = patient.roomSpecificData[roomId] ? { ...patient.roomSpecificData[roomId] } : {};
        patient.roomSpecificData = { ...patient.roomSpecificData, [roomId]: { ...currentRoomData, ...formData, }, };
        const currentRoomConfig = ROOMS_CONFIG.find(r => r.id === roomId);
        if (currentRoomConfig) {
            const now = new Date().toISOString();
            const lastHistoryIndex = patient.history.map(h => h.roomId).lastIndexOf(roomId);
            if(lastHistoryIndex !== -1) { patient.history[lastHistoryIndex].exitDate = now; }
            let statusMessage = 'Action complétée.';
             switch(roomId) {
                case RoomId.REQUEST: statusMessage = `Demande complétée pour ${formData.requestedExam}.`; break;
                case RoomId.APPOINTMENT: statusMessage = `RDV planifié pour le ${formData.dateRdv} à ${formData.heureRdv}.`; break;
                case RoomId.CONSULTATION: statusMessage = 'Consultation terminée.'; break;
                case RoomId.INJECTION: statusMessage = `Injection enregistrée.`; break;
                case RoomId.EXAMINATION: statusMessage = `Examen saisi (Qualité: ${formData.qualiteImages || 'N/A'}).`; break;
                case RoomId.REPORT: statusMessage = `Compte rendu rédigé.`; break;
                case RoomId.RETRAIT_CR_SORTIE: statusMessage = `CR retiré par ${formData.retirePar}. Dossier archivé.`; break;
            }
            patient.history.push({ roomId, entryDate: now, statusMessage });
            if (currentRoomConfig.nextRoomId) {
                patient.currentRoomId = currentRoomConfig.nextRoomId;
                patient.statusInRoom = PatientStatusInRoom.WAITING;
                patient.history.push({
                    roomId: currentRoomConfig.nextRoomId, entryDate: new Date(Date.parse(now) + 1).toISOString(), statusMessage: `Entré dans ${ROOMS_CONFIG.find(r => r.id === currentRoomConfig.nextRoomId)?.name}`
                });
            } else {
                 patient.statusInRoom = PatientStatusInRoom.SEEN;
            }
        }
        newPatients[patientIndex] = patient;
        return newPatients;
    });
    setIsPatientFormModalOpen(false);
    setModalContext(null);
    addToast('Action enregistrée avec succès.', 'success');
  };
  
  const handleMovePatient = (patientId: string, targetRoomId: RoomId) => {
    setPatients(prevPatients => {
        return prevPatients.map(p => {
            if (p.id === patientId) {
                const now = new Date().toISOString();
                const lastHistoryIndex = p.history.map(h => h.roomId).lastIndexOf(p.currentRoomId);
                if(lastHistoryIndex !== -1) { p.history[lastHistoryIndex].exitDate = now; }
                 p.history.push({ roomId: p.currentRoomId, entryDate: now, statusMessage: 'Déplacé manuellement.' });
                p.history.push({ roomId: targetRoomId, entryDate: new Date(Date.parse(now) + 1).toISOString(), statusMessage: `Entré dans ${ROOMS_CONFIG.find(r => r.id === targetRoomId)?.name}`});
                return { ...p, currentRoomId: targetRoomId, statusInRoom: PatientStatusInRoom.WAITING };
            }
            return p;
        });
    });
    addToast('Patient déplacé.', 'success');
  };

  const handleViewPatientDetail = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('patient_detail');
    setActiveRoomId(null);
  };

  const handleCloseDetailView = () => {
    setSelectedPatient(null);
    setActiveView('rooms_overview');
  };
  
  const handleAttachDocument = (patientId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
            const dataUrl = event.target.result;
            const newDocument: PatientDocument = {
                id: `doc_${Date.now()}`, name: file.name, fileType: file.type, uploadDate: new Date().toISOString(), dataUrl: dataUrl
            };
            setPatients(prev => prev.map(p => {
                if (p.id === patientId) {
                    const updatedDocuments = [...(p.documents || []), newDocument];
                    return { ...p, documents: updatedDocuments };
                }
                return p;
            }));
            if (selectedPatient?.id === patientId) {
                setSelectedPatient(prev => prev ? { ...prev, documents: [...(prev.documents || []), newDocument] } : null);
            }
            addToast('Document attaché avec succès.', 'success');
        }
    };
    reader.readAsDataURL(file);
  };
  
  // --- Hot Lab Handlers ---
  const handleAddTracerLot = async (newLot: Omit<TracerLot, 'id'>) => {
    await sleep(300);
    const lotWithId: TracerLot = { ...newLot, id: `lot_${Date.now()}` };
    setHotLabData(prev => ({ ...prev, lots: [...prev.lots, lotWithId] }));
    addToast('Nouveau lot ajouté.', 'success');
  };
  
  const handleAddPreparationLog = async (newPreparation: Omit<PreparationLog, 'id'>) => {
    await sleep(300);
    const prepWithId: PreparationLog = { ...newPreparation, id: `prep_${Date.now()}` };
    setHotLabData(prev => ({ ...prev, preparations: [...prev.preparations, prepWithId] }));
    addToast('Nouvelle préparation enregistrée.', 'success');
  };

  // --- View Management Callbacks ---
  const onShowDailyWorklist = () => { setActiveView('daily_worklist'); setActiveRoomId(null); };
  const onShowRoomsOverview = () => { setActiveView('rooms_overview'); setActiveRoomId(null); };
  const onShowActivityFeed = () => { setActiveView('activity_feed'); setActiveRoomId(null); };
  const onShowStatisticsView = () => { setActiveView('statistics'); setActiveRoomId(null); };
  const onShowAdministrationView = () => { setActiveView('administration'); setActiveRoomId(null); };
  const onShowExamSettingsView = () => { setActiveView('exam_settings'); setActiveRoomId(null); };
  const onShowDatabaseView = () => { setActiveView('database'); setActiveRoomId(null); };
  const onShowReportTemplatesSettingsView = () => { setActiveView('report_templates_settings'); setActiveRoomId(null); };
  const onShowPatrimonyDashboard = () => { setActiveView('patrimony_dashboard'); setActiveRoomId(null); };
  const onShowPatrimonyInventory = () => { setActiveView('patrimony_inventory'); setActiveRoomId(null); };
  const onShowPatrimonyStock = () => { setActiveView('patrimony_stock'); setActiveRoomId(null); };
  const onShowPatrimonyAssetStatus = () => { setActiveView('patrimony_asset_status'); setActiveRoomId(null); };


  // Derived state based on current user's role
  const currentUserRole = roles.find(r => r.id === currentUser?.roleId);
  const userPermissions = currentUserRole?.permissions || [];
  const visibleRooms = ROOMS_CONFIG.filter(room => 
      (currentUserRole?.name === 'Administrateur(trice)') || 
      room.allowedRoleIds.includes(currentUser?.roleId || '')
  );
  
  // --- Auth Gate ---
  if (!currentUser) {
    return authView === 'login' 
      ? <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
      : <RegisterPage onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} roles={roles} />;
  }

  // Derived state for rendering
  const activeRoom = activeRoomId ? ROOMS_CONFIG.find(r => r.id === activeRoomId) : null;
  const patientsInActiveRoom = activeRoomId ? patients.filter(p => p.currentRoomId === activeRoomId) : [];
  const searchResults = searchTerm.trim() !== '' ? patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];
  const modalPatient = modalContext ? patients.find(p => p.id === modalContext.patientId) : null;
  const modalRoom = modalContext ? ROOMS_CONFIG.find(r => r.id === modalContext.roomId) : null;

  // --- Main Render Logic ---
  const renderCurrentView = () => {
    if (activeView === 'search') {
      return <GlobalSearchView searchResults={searchResults} onViewPatientDetail={handleViewPatientDetail} searchTerm={searchTerm} />;
    }
    if (activeView === 'patient_detail' && selectedPatient) {
      return <PatientDetailView patient={selectedPatient} onCloseDetailView={handleCloseDetailView} roomsConfig={ROOMS_CONFIG} onAttachDocument={handleAttachDocument} examConfigurations={examConfigurations} />;
    }
    if (activeView === 'daily_worklist') {
        return <DailyWorklistView allPatients={patients} onViewPatientDetail={handleViewPatientDetail} />;
    }
    if (activeView === 'rooms_overview') {
        return <RoomsOverview visibleRooms={visibleRooms} allPatients={patients} hotLabData={hotLabData} onSelectRoom={handleSelectRoom} onViewPatientDetail={handleViewPatientDetail} onMovePatient={handleMovePatient} />;
    }
    if (activeView === 'activity_feed') {
        return <ActivityFeedView allPatients={patients} selectedPeriod={selectedPeriod} onViewPatientDetail={handleViewPatientDetail} roomsConfig={ROOMS_CONFIG} />;
    }
    if (activeView === 'statistics') {
        return <StatisticsView allPatients={patients} selectedPeriod={selectedPeriod} roomsConfig={ROOMS_CONFIG} />;
    }
    if (activeView === 'hot_lab') {
        return <HotLabView hotLabData={hotLabData} onAddTracerLot={handleAddTracerLot} onAddPreparationLog={handleAddPreparationLog} allPatients={patients} />;
    }
    if (activeView === 'administration') {
        return <AdministrationView users={users} roles={roles} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} onSaveRole={handleSaveRole} onDeleteRole={handleDeleteRole} />;
    }
    if (activeView === 'exam_settings') {
        return <ExamSettingsView examConfigurations={examConfigurations} onSave={handleSaveExamConfiguration} onDelete={handleDeleteExamConfiguration} />;
    }
    if (activeView === 'database') {
        return <DatabaseView allPatients={patients} roomsConfig={ROOMS_CONFIG} onViewPatientDetail={handleViewPatientDetail} />;
    }
     if (activeView === 'report_templates_settings') {
        return <ReportTemplatesSettingsView reportTemplates={reportTemplates} onSave={handleSaveReportTemplate} onDelete={handleDeleteReportTemplate} />;
    }
    if (activeView === 'patrimony_dashboard') {
        return <PatrimonyDashboardView assets={assets} stockItems={stockItems} onNavigateToInventory={onShowPatrimonyInventory} onNavigateToStock={onShowPatrimonyStock} onAddAsset={() => { setEditingAsset(null); setIsAssetFormModalOpen(true); }} onAddStockEntry={() => setIsStockEntryModalOpen(true)} />;
    }
    if (activeView === 'patrimony_inventory') {
        return <PatrimonyInventoryView assets={assets} onAddAsset={() => { setEditingAsset(null); setIsAssetFormModalOpen(true); }} onEditAsset={(asset) => { setEditingAsset(asset); setIsAssetFormModalOpen(true); }} onDeleteAsset={handleDeleteAsset} />;
    }
    if (activeView === 'patrimony_stock') {
        return <PatrimonyStockView stockItems={stockItems} onAddNewEntry={() => setIsStockEntryModalOpen(true)} onAddNewExit={() => setIsStockExitModalOpen(true)} onViewItemDetail={handleViewStockItemDetail} onAddStockItem={() => { setEditingStockItem(null); setIsStockItemFormModalOpen(true); }} onEditStockItem={(item) => { setEditingStockItem(item); setIsStockItemFormModalOpen(true); }} onDeleteStockItem={handleDeleteStockItem} />;
    }
    if (activeView === 'patrimony_stock_detail' && selectedStockItem) {
        return <StockItemDetailView stockItem={selectedStockItem} onClose={handleCloseStockItemDetail} />;
    }
    if (activeView === 'patrimony_asset_status') {
        return <PatrimonyAssetStatusView lifeSheetLots={lifeSheetLots} lifeSheetUnits={lifeSheetUnits} onSaveLifeSheet={handleSaveLifeSheet} />;
    }

    if (activeRoom) {
      return <RoomView 
                room={activeRoom} 
                patientsInRoom={patientsInActiveRoom} 
                allPatients={patients} 
                onOpenPatientFormModal={handleOpenPatientFormModal} 
                onMovePatient={handleMovePatient}
                onOpenCreatePatientModal={activeRoom.id === RoomId.REQUEST ? () => setIsCreatePatientModalOpen(true) : undefined}
                selectedPeriod={selectedPeriod}
                onViewPatientDetail={handleViewPatientDetail}
              />;
    }
    
    // Default to overview if no other view is active
    return <RoomsOverview visibleRooms={visibleRooms} allPatients={patients} hotLabData={hotLabData} onSelectRoom={handleSelectRoom} onViewPatientDetail={handleViewPatientDetail} onMovePatient={handleMovePatient} />;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100">
      <Navbar 
        currentUser={currentUser} 
        currentUserRoleName={currentUserRole?.name || 'N/A'}
        onLogout={handleLogout} 
        selectedPeriod={selectedPeriod} 
        onPeriodChange={setSelectedPeriod} 
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <div className="flex-grow flex overflow-hidden">
        <RoomNavigation 
          rooms={visibleRooms} 
          activeRoomId={activeRoomId} 
          currentView={activeView}
          onSelectRoom={handleSelectRoom} 
          onShowDailyWorklist={onShowDailyWorklist}
          onShowRoomsOverview={onShowRoomsOverview}
          onShowActivityFeed={onShowActivityFeed}
          onShowStatisticsView={onShowStatisticsView}
          onShowDatabaseView={onShowDatabaseView}
          isUserAdmin={currentUserRole?.name === 'Administrateur(trice)'}
          onShowAdministrationView={onShowAdministrationView}
          onShowExamSettingsView={onShowExamSettingsView}
          onShowReportTemplatesSettingsView={onShowReportTemplatesSettingsView}
          onShowPatrimonyDashboard={onShowPatrimonyDashboard}
          onShowPatrimonyInventory={onShowPatrimonyInventory}
          onShowPatrimonyStock={onShowPatrimonyStock}
          onShowPatrimonyAssetStatus={onShowPatrimonyAssetStatus}
        />
        <main className="flex-grow p-6 overflow-auto">
          {renderCurrentView()}
        </main>
      </div>
      {isPatientFormModalOpen && modalPatient && modalRoom && (
        <PatientFormModal 
          isOpen={isPatientFormModalOpen}
          onClose={() => setIsPatientFormModalOpen(false)}
          onSubmit={handlePatientFormSubmit}
          patient={modalPatient}
          room={modalRoom}
          examConfigurations={examConfigurations}
          reportTemplates={reportTemplates}
        />
      )}
       {isCreatePatientModalOpen && (
        <CreatePatientModal
          isOpen={isCreatePatientModalOpen}
          onClose={() => setIsCreatePatientModalOpen(false)}
          onCreatePatient={handleCreatePatient}
          allPatients={patients}
          examConfigurations={examConfigurations}
        />
      )}
      <StockEntryFormModal
        isOpen={isStockEntryModalOpen}
        onClose={() => setIsStockEntryModalOpen(false)}
        onSubmit={handleAddNewStockEntry}
        stockItems={stockItems}
      />
      <StockExitFormModal
        isOpen={isStockExitModalOpen}
        onClose={() => setIsStockExitModalOpen(false)}
        onSubmit={handleAddNewStockExit}
        stockItems={stockItems}
      />
       <AssetFormModal
        isOpen={isAssetFormModalOpen}
        onClose={() => setIsAssetFormModalOpen(false)}
        onSubmit={handleSaveAsset}
        initialData={editingAsset}
      />
      <StockItemFormModal
        isOpen={isStockItemFormModalOpen}
        onClose={() => setIsStockItemFormModalOpen(false)}
        onSubmit={handleSaveStockItem}
        initialData={editingStockItem}
      />

       {/* --- Global UI Feedback Components --- */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-full max-w-sm">
          {toasts.map(toast => (
              <Toast key={toast.id} {...toast} onDismiss={removeToast} />
          ))}
      </div>

      <ConfirmationModal
          isOpen={confirmationState.isOpen}
          title={confirmationState.title}
          message={confirmationState.message}
          onConfirm={confirmationState.onConfirm}
          onClose={closeConfirmation}
      />
    </div>
  );
}

export default App;
