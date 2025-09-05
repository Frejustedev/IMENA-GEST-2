import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useApp } from './hooks/useApp';
import { usePatients } from './hooks/usePatients';
import { useHotLab } from './hooks/useHotLab';
import { useAuth } from './contexts/AuthContext';

// Import des composants de base
import { Navbar } from './components/Navbar';
import { RoomNavigation } from './components/RoomNavigation';
import { Toast } from './components/Toast';
import { ConfirmationModal } from './components/ConfirmationModal';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';

// Lazy loading des vues principales
const RoomView = lazy(() => import('./components/RoomView').then(module => ({ default: module.RoomView })));
const RoomsOverview = lazy(() => import('./components/RoomsOverview').then(module => ({ default: module.RoomsOverview })));
const GlobalSearchView = lazy(() => import('./components/GlobalSearchView').then(module => ({ default: module.GlobalSearchView })));
const PatientDetailView = lazy(() => import('./components/PatientDetailView').then(module => ({ default: module.PatientDetailView })));
const DailyWorklistView = lazy(() => import('./components/DailyWorklistView').then(module => ({ default: module.DailyWorklistView })));
const ActivityFeedView = lazy(() => import('./components/ActivityFeedView').then(module => ({ default: module.ActivityFeedView })));
const StatisticsView = lazy(() => import('./components/StatisticsView').then(module => ({ default: module.StatisticsView })));
const HotLabView = lazy(() => import('./components/HotLabView').then(module => ({ default: module.HotLabView })));
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

// Imports des données et utilitaires
import { ROOMS_CONFIG } from './constants';
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
    getSelectedStockItem
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

  // Hook d'authentification
  const { user: currentUser, logout, isAuthenticated } = useAuth();
  
  // États temporaires pour la migration (seront supprimés progressivement)
  const [users] = React.useState<User[]>([]);
  const [roles] = React.useState<Role[]>([]);
  const [authView] = React.useState<'login' | 'register'>('login');
  const [examConfigurations] = React.useState([]);
  const [reportTemplates] = React.useState([]);
  const [assets] = React.useState([]);
  const [stockItems] = React.useState([]);

  // Handler de logout connecté
  const handleLogout = async () => {
    await logout();
  };

  const handleCreatePatient = async (patientData: any, requestData: any) => {
    const result = await createPatient(patientData, requestData);
    if (result.success) {
      closeModal('isCreatePatientOpen');
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

  const handleAddTracerLot = async (newLot: any) => {
    await addLot(newLot);
  };

  const handleAddPreparationLog = async (newPreparation: any) => {
    await addPreparation(newPreparation);
  };

  // Données dérivées
  const currentUserRole = roles.find(r => r.id === currentUser?.roleId);
  const visibleRooms = ROOMS_CONFIG.filter(room => 
    (currentUserRole?.name === 'Administrateur(trice)') || 
    room.allowedRoleIds.includes(currentUser?.roleId || '')
  );
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
      administration: () => (
        <AdministrationView
          users={users}
          roles={roles}
          onSaveUser={() => {}}
          onDeleteUser={() => {}}
          onSaveRole={() => {}}
          onDeleteRole={() => {}}
        />
      ),
      exam_settings: () => (
        <ExamSettingsView
          examConfigurations={examConfigurations}
          onSave={() => {}}
          onDelete={() => {}}
        />
      ),
      database: () => (
        <DatabaseView
          allPatients={patients}
          roomsConfig={ROOMS_CONFIG}
          onViewPatientDetail={handleViewPatientDetail}
        />
      ),
      report_templates_settings: () => (
        <ReportTemplatesSettingsView
          reportTemplates={reportTemplates}
          onSave={() => {}}
          onDelete={() => {}}
        />
      ),
      patrimony_dashboard: () => (
        <PatrimonyDashboardView
          assets={assets}
          stockItems={stockItems}
          onNavigateToInventory={navigationHandlers.onShowPatrimonyInventory}
          onNavigateToStock={navigationHandlers.onShowPatrimonyStock}
          onAddAsset={() => {}}
          onAddStockEntry={() => {}}
        />
      ),
      patrimony_inventory: () => (
        <PatrimonyInventoryView
          assets={assets}
          onAddAsset={() => {}}
          onEditAsset={() => {}}
          onDeleteAsset={() => {}}
        />
      ),
      patrimony_stock: () => (
        <PatrimonyStockView
          stockItems={stockItems}
          onAddNewEntry={() => {}}
          onAddNewExit={() => {}}
          onViewItemDetail={() => {}}
          onAddStockItem={() => {}}
          onEditStockItem={() => {}}
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
          onOpenPatientFormModal={() => {}}
          onMovePatient={handleMovePatient}
          onOpenCreatePatientModal={activeRoom.id === 'DEMANDE' ? () => {} : undefined}
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

  // Gate d'authentification
  if (!currentUser) {
    return authView === 'login' 
      ? <LoginPage onLogin={() => Promise.resolve(true)} onSwitchToRegister={() => {}} />
      : <RegisterPage onRegister={() => Promise.resolve({ success: true })} onSwitchToLogin={() => {}} roles={roles} />;
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-slate-100">
        {/* Navigation principale */}
        <Navbar
          currentUser={currentUser}
          currentUserRoleName={currentUserRole?.name || 'N/A'}
          onLogout={handleLogout}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
        />

        <div className="flex-grow flex overflow-hidden">
          {/* Navigation latérale */}
          <RoomNavigation
            rooms={visibleRooms}
            activeRoomId={activeRoomId}
            currentView={activeView}
            onSelectRoom={navigateToRoom}
            isUserAdmin={currentUserRole?.name === 'Administrateur(trice)'}
            {...navigationHandlers}
          />

          {/* Contenu principal */}
          <main className="flex-grow p-6 overflow-auto">
            {renderCurrentView()}
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
