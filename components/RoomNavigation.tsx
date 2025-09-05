import React, { useState, useEffect } from 'react';
import { Room, RoomId, ActiveView } from '../types';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { Squares2X2Icon } from './icons/Squares2X2Icon'; 
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { CalendarClockIcon } from './icons/CalendarClockIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';
import { Cog8ToothIcon } from './icons/Cog8ToothIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { CubeIcon } from './icons/CubeIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { AtomIcon } from './icons/AtomIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { HomeIcon } from './icons/HomeIcon';


interface RoomNavigationProps {
  rooms: Room[];
  activeRoomId: RoomId | null;
  currentView: ActiveView;
  onSelectRoom: (roomId: RoomId) => void;
  onShowDailyWorklist: () => void;
  onShowRoomsOverview: () => void;
  onShowActivityFeed: () => void;
  onShowStatisticsView: () => void;
  onShowDatabaseView: () => void;
  isUserAdmin: boolean;
  onShowAdministrationView: () => void;
  onShowExamSettingsView: () => void;
  onShowReportTemplatesSettingsView: () => void;
  onShowHotLab: () => void;
  onShowTracersManagement: () => void;
  onShowPreparationsManagement: () => void;
  onShowIsotopesManagement: () => void;
  onShowPatrimonyDashboard: () => void;
  onShowPatrimonyInventory: () => void;
  onShowPatrimonyStock: () => void;
  onShowPatrimonyAssetStatus: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RoomNavigation: React.FC<RoomNavigationProps> = ({ 
  rooms, 
  activeRoomId, 
  currentView,
  onSelectRoom,
  onShowDailyWorklist,
  onShowRoomsOverview,
  onShowActivityFeed,
  onShowStatisticsView,
  onShowDatabaseView,
  isUserAdmin,
  onShowAdministrationView,
  onShowExamSettingsView,
  onShowReportTemplatesSettingsView,
  onShowHotLab,
  onShowTracersManagement,
  onShowPreparationsManagement,
  onShowIsotopesManagement,
  onShowPatrimonyDashboard,
  onShowPatrimonyInventory,
  onShowPatrimonyStock,
  onShowPatrimonyAssetStatus,
  isOpen,
  onClose,
}) => {
  const [isPatrimonyOpen, setIsPatrimonyOpen] = useState(true);
  const [isHotLabOpen, setIsHotLabOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Gestion raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        const keyMap: Record<string, () => void> = {
          '1': onShowRoomsOverview,
          '2': onShowDailyWorklist,
          '3': onShowActivityFeed,
          '4': onShowStatisticsView,
          '5': onShowDatabaseView,
          '6': () => onSelectRoom(RoomId.REQUEST),
          '7': () => onSelectRoom(RoomId.APPOINTMENT),
          '8': () => onSelectRoom(RoomId.CONSULTATION),
          '9': () => onSelectRoom(RoomId.INJECTION),
        };

        if (keyMap[e.key]) {
          e.preventDefault();
          keyMap[e.key]();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onShowRoomsOverview, onShowDailyWorklist, onShowActivityFeed, onShowStatisticsView, onShowDatabaseView, onSelectRoom]);

  const baseButtonClass = `
    w-full flex items-center transition-all duration-200 text-left 
    ${isCollapsed ? 'justify-center p-2' : 'space-x-3 p-3'} 
    rounded-lg touch-manipulation
  `;
  const activeClass = "bg-sky-600 text-white shadow-md";
  const inactiveClass = "hover:bg-slate-600 hover:text-white focus:bg-slate-600 focus:text-white";
  const activeIconClass = "text-white";
  const inactiveIconClass = "text-sky-300";

  const navItems = [
    { 
      id: 'rooms_overview', 
      label: "Vue d'ensemble", 
      shortLabel: "Accueil",
      icon: HomeIcon, 
      action: onShowRoomsOverview,
      viewType: 'rooms_overview' as ActiveView,
      shortcut: 'Ctrl+1'
    },
    { 
      id: 'daily_worklist', 
      label: "Vacation du Jour", 
      shortLabel: "Vacation",
      icon: CalendarClockIcon, 
      action: onShowDailyWorklist,
      viewType: 'daily_worklist' as ActiveView,
      shortcut: 'Ctrl+2'
    },
    { 
      id: 'activity_feed', 
      label: "Flux d'activités", 
      shortLabel: "Activités",
      icon: ArchiveBoxIcon, 
      action: onShowActivityFeed,
      viewType: 'activity_feed' as ActiveView,
      shortcut: 'Ctrl+3'
    },
    { 
      id: 'statistics', 
      label: "Statistiques", 
      shortLabel: "Stats",
      icon: ChartBarIcon, 
      action: onShowStatisticsView,
      viewType: 'statistics' as ActiveView,
      shortcut: 'Ctrl+4'
    },
     { 
      id: 'database', 
      label: "Base de Données", 
      shortLabel: "Base",
      icon: DatabaseIcon, 
      action: onShowDatabaseView,
      viewType: 'database' as ActiveView,
      shortcut: 'Ctrl+5'
    },
  ];

  const isPatrimonyView = currentView.startsWith('patrimony_');

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Navigation sidebar */}
      <aside 
        className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 
          ${isCollapsed ? 'w-16' : 'w-72'} 
          bg-slate-700 text-slate-200 overflow-y-auto 
          transition-all duration-300 ease-in-out no-print
          flex flex-col
        `}
      >
        {/* Header avec toggle collapse */}
        <div className="p-4 border-b border-slate-600">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h2 className="text-lg font-semibold text-white">Navigation</h2>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1 rounded hover:bg-slate-600 transition-colors"
              title={isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
              aria-label={isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 rotate-90" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation principale */}
        <div className="flex-1 p-4 space-y-2">
          {!isCollapsed && (
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
              Menu Principal
            </h3>
          )}
          
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={item.action}
              className={`${baseButtonClass} ${currentView === item.viewType ? activeClass : inactiveClass}`}
              aria-current={currentView === item.viewType ? 'page' : undefined}
              title={isCollapsed ? `${item.label} (${item.shortcut})` : item.shortcut}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${currentView === item.viewType ? activeIconClass : inactiveIconClass}`} />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                  <span className="block text-xs opacity-75">{item.shortcut}</span>
                </div>
              )}
            </button>
          ))}
          
          {/* Séparateur */}
          {rooms.length > 0 && !isCollapsed && (
            <div className="border-t border-slate-600 my-4"></div>
          )}

          {/* Section Parcours Patient */}
          {rooms.length > 0 && (
            <>
              {!isCollapsed && (
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                  Parcours Patient
                </h3>
              )}
              
              {rooms.map((room, index) => (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className={`${baseButtonClass} 
                    ${currentView === 'room' && activeRoomId === room.id 
                      ? activeClass 
                      : inactiveClass
                    }
                  `}
                  aria-current={currentView === 'room' && activeRoomId === room.id ? 'page' : undefined}
                  title={isCollapsed ? `${room.name} (Ctrl+${index + 6})` : `Ctrl+${index + 6}`}
                >
                  <room.icon className={`h-5 w-5 flex-shrink-0 ${currentView === 'room' && activeRoomId === room.id ? activeIconClass : inactiveIconClass}`} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{room.name}</span>
                      <span className="block text-xs opacity-75">Ctrl+{index + 6}</span>
                    </div>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Séparateur */}
          {!isCollapsed && (
            <div className="border-t border-slate-600 my-4"></div>
          )}

          {/* Section Modules */}
          {!isCollapsed && (
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
              Modules Avancés
            </h3>
          )}

          {/* Module Labo Chaud avec sous-menu */}
          <button
            onClick={() => setIsHotLabOpen(!isHotLabOpen)}
            className={`${baseButtonClass} ${currentView === 'hot_lab' || currentView === 'isotopes_management' ? 'text-white bg-slate-600' : ''} ${inactiveClass} ${!isCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className={`flex items-center ${!isCollapsed ? 'space-x-3' : ''}`}>
              <CubeIcon className={`h-5 w-5 flex-shrink-0 ${currentView === 'hot_lab' || currentView === 'isotopes_management' ? activeIconClass : inactiveIconClass}`} />
              {!isCollapsed && <span className="truncate">Gestion Labo Chaud</span>}
            </div>
            {!isCollapsed && (
              isHotLabOpen ? <ChevronDownIcon className="h-4 w-4"/> : <ChevronRightIcon className="h-4 w-4"/>
            )}
          </button>

          {/* Sous-menu Labo Chaud */}
          {isHotLabOpen && !isCollapsed && (
            <div className="ml-6 mt-2 space-y-1 border-l-2 border-slate-600 pl-4">
              <button
                onClick={onShowHotLab}
                className={`w-full flex items-center space-x-3 p-2 rounded text-left transition-colors touch-manipulation ${currentView === 'hot_lab' ? activeClass : inactiveClass}`}
              >
                <ChartBarIcon className={`h-4 w-4 flex-shrink-0 ${currentView === 'hot_lab' ? activeIconClass : inactiveIconClass}`} />
                <span className="truncate text-sm">Tableau de Bord</span>
              </button>
              <button
                onClick={onShowIsotopesManagement}
                className={`w-full flex items-center space-x-3 p-2 rounded text-left transition-colors touch-manipulation ${currentView === 'isotopes_management' ? activeClass : inactiveClass}`}
              >
                <AtomIcon className={`h-4 w-4 flex-shrink-0 ${currentView === 'isotopes_management' ? activeIconClass : inactiveIconClass}`} />
                <span className="truncate text-sm">Gestion Isotopes</span>
              </button>
              <button
                onClick={onShowTracersManagement}
                className={`w-full flex items-center space-x-3 p-2 rounded text-left transition-colors touch-manipulation ${currentView === 'tracers_management' ? activeClass : inactiveClass}`}
              >
                <BeakerIcon className={`h-4 w-4 flex-shrink-0 ${currentView === 'tracers_management' ? activeIconClass : inactiveIconClass}`} />
                <span className="truncate text-sm">Gestion des Traceurs</span>
              </button>
              <button
                onClick={onShowPreparationsManagement}
                className={`w-full flex items-center space-x-3 p-2 rounded text-left transition-colors touch-manipulation ${currentView === 'preparations_management' ? activeClass : inactiveClass}`}
              >
                <ClipboardListIcon className={`h-4 w-4 flex-shrink-0 ${currentView === 'preparations_management' ? activeIconClass : inactiveIconClass}`} />
                <span className="truncate text-sm">Gestion des Préparations</span>
              </button>
            </div>
          )}

          {/* Module Patrimoine */}
          <button
            onClick={() => setIsPatrimonyOpen(!isPatrimonyOpen)}
            className={`${baseButtonClass} ${isPatrimonyView ? 'text-white bg-slate-600' : ''} ${inactiveClass} ${!isCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className={`flex items-center ${!isCollapsed ? 'space-x-3' : ''}`}>
              <BuildingOfficeIcon className={`h-5 w-5 flex-shrink-0 ${isPatrimonyView ? activeIconClass : inactiveIconClass}`} />
              {!isCollapsed && <span className="truncate">Gestion de Patrimoine</span>}
            </div>
            {!isCollapsed && (
              isPatrimonyOpen ? <ChevronDownIcon className="h-4 w-4"/> : <ChevronRightIcon className="h-4 w-4"/>
            )}
          </button>
          
          {/* Sous-menu Patrimoine */}
          {isPatrimonyOpen && !isCollapsed && (
            <div className="ml-6 mt-2 space-y-1 border-l-2 border-slate-600 pl-4">
              <button
                onClick={onShowPatrimonyDashboard}
                className={`w-full flex items-center space-x-3 p-2 rounded text-left transition-colors touch-manipulation ${currentView === 'patrimony_dashboard' ? activeClass : inactiveClass}`}
              >
                <ChartBarIcon className={`h-4 w-4 flex-shrink-0 ${currentView === 'patrimony_dashboard' ? activeIconClass : inactiveIconClass}`} />
                    <span className="truncate text-sm">Tableau de bord</span>
                </button>
                <button
                    onClick={onShowPatrimonyInventory}
                    className={`${baseButtonClass} ${currentView === 'patrimony_inventory' ? activeClass : inactiveClass}`}
                >
                    <ArchiveBoxIcon className={`h-5 w-5 flex-shrink-0 ${currentView === 'patrimony_inventory' ? activeIconClass : inactiveIconClass}`} />
                    <span className="truncate text-sm">Inventaire</span>
                </button>
                <button
                    onClick={onShowPatrimonyStock}
                    className={`${baseButtonClass} ${currentView === 'patrimony_stock' || currentView === 'patrimony_stock_detail' ? activeClass : inactiveClass}`}
                >
                    <CubeIcon className={`h-5 w-5 flex-shrink-0 ${currentView === 'patrimony_stock' || currentView === 'patrimony_stock_detail' ? activeIconClass : inactiveIconClass}`} />
                    <span className="truncate text-sm">Stock</span>
                </button>
                 <button
                    onClick={onShowPatrimonyAssetStatus}
                    className={`${baseButtonClass} ${currentView === 'patrimony_asset_status' ? activeClass : inactiveClass}`}
                >
                    <ClipboardDocumentListIcon className={`h-5 w-5 flex-shrink-0 ${currentView === 'patrimony_asset_status' ? activeIconClass : inactiveIconClass}`} />
                    <span className="truncate text-sm">État du Patrimoine</span>
                </button>
            </div>
          )}
        </div>

      {isUserAdmin && (
          <div className="pt-2 mt-2 border-t border-slate-600">
            <h3 className="text-md font-semibold text-slate-100 mb-2">Configuration</h3>
            
            <button
                onClick={onShowExamSettingsView}
                className={`${baseButtonClass} ${currentView === 'exam_settings' ? activeClass : inactiveClass}`}
                aria-current={currentView === 'exam_settings' ? 'page' : undefined}
            >
                <WrenchScrewdriverIcon className={`h-5 w-5 flex-shrink-0 ${currentView === 'exam_settings' ? activeIconClass : inactiveIconClass}`} />
                <span className="truncate">Paramètres des Examens</span>
            </button>
            
            <button
                onClick={onShowReportTemplatesSettingsView}
                className={`${baseButtonClass} ${currentView === 'report_templates_settings' ? activeClass : inactiveClass}`}
                aria-current={currentView === 'report_templates_settings' ? 'page' : undefined}
            >
                <ClipboardDocumentListIcon className={`h-5 w-5 flex-shrink-0 ${currentView === 'report_templates_settings' ? activeIconClass : inactiveIconClass}`} />
                <span className="truncate">Modèles de CR</span>
            </button>

            <button
                onClick={onShowAdministrationView}
                className={`${baseButtonClass} ${currentView === 'administration' ? activeClass : inactiveClass}`}
                aria-current={currentView === 'administration' ? 'page' : undefined}
            >
                <Cog8ToothIcon className={`h-5 w-5 flex-shrink-0 ${currentView === 'administration' ? activeIconClass : inactiveIconClass}`} />
                <span className="truncate">Administration</span>
            </button>
          </div>
      )}
    </aside>
    </>
  );
};