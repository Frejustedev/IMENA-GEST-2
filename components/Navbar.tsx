import React, { useState, useEffect } from 'react';
import { User, PeriodOption, ActiveView } from '../types';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { Cog8ToothIcon } from './icons/Cog8ToothIcon';
import { Bars3Icon } from './icons/Bars3Icon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { NotificationCenter } from './NotificationCenter';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface NavbarProps {
  currentUser: User;
  currentUserRoleName: string;
  onLogout: () => void;
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onToggleNavigation: () => void;
  isNavigationOpen: boolean;
  onEmergencyMode: () => void;
  emergencyMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentUser,
  currentUserRoleName,
  onLogout,
  selectedPeriod,
  onPeriodChange,
  searchTerm,
  onSearchChange,
  onToggleNavigation,
  isNavigationOpen,
  onEmergencyMode,
  emergencyMode,
}) => {

  // Gestion raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F1 - Mode urgence
      if (e.key === 'F1') {
        e.preventDefault();
        onEmergencyMode();
      }
      
      // Ctrl + M - Toggle menu navigation
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        onToggleNavigation();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onEmergencyMode, onToggleNavigation]);

  return (
    <header className={`
      ${emergencyMode ? 'bg-red-600' : 'bg-slate-800'} 
      text-white shadow-md transition-colors duration-300 no-print
      sticky top-0 z-[60]
    `}>
      {/* Barre d'urgence */}
      {emergencyMode && (
        <div className="bg-red-700 px-4 py-2 text-center text-sm font-medium animate-pulse">
          <ExclamationTriangleIcon className="h-4 w-4 inline mr-2" />
          MODE URGENCE ACTIVÉ - Appuyez sur F1 pour désactiver
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Menu mobile + Logo */}
          <div className="flex items-center space-x-3">
            {/* Bouton menu mobile */}
            <button
              onClick={onToggleNavigation}
              className="lg:hidden p-3 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isNavigationOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isNavigationOpen}
              style={{ color: 'white' }}
            >
              {isNavigationOpen ? (
                <XMarkIcon className="h-6 w-6 text-white stroke-white" style={{ color: 'white', stroke: 'white' }} />
              ) : (
                <Bars3Icon className="h-6 w-6 text-white stroke-white" style={{ color: 'white', stroke: 'white' }} />
              )}
            </button>

            {/* Logo */}
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
              IMENA-GEST
            </h1>
          </div>

          {/* Actions utilisateur + recherche */}
          <div className="flex items-center space-x-3">
            {/* Recherche intelligente - cachée sur très petit écran */}
            <div className="hidden sm:block relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="search"
                name="globalSearch"
                id="globalSearch"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher patient (ID, nom, date)..."
                className="block w-48 lg:w-64 bg-slate-700 border border-slate-600 rounded-md py-2 pl-9 pr-3 text-sm placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 touch-manipulation"
                aria-label="Rechercher un patient par ID, nom ou date"
                autoComplete="off"
                list="patient-suggestions"
              />
              
              {/* Auto-complétion */}
              {searchTerm.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  <div className="p-2 text-xs text-slate-500 border-b">
                    Suggestions (tapez 2+ caractères)
                  </div>
                  {/* Suggestions basiques - sera amélioré avec vraie recherche */}
                  <div className="p-2 hover:bg-slate-50 cursor-pointer text-slate-700 text-sm">
                    Aucune suggestion pour "{searchTerm}"
                  </div>
                </div>
              )}
            </div>

            {/* Centre de notifications */}
            <NotificationCenter emergencyMode={emergencyMode} />

            {/* Accessibilité */}
            <AccessibilityToolbar />

            {/* Mode urgence button */}
            <button
              onClick={onEmergencyMode}
              className={`
                p-2 rounded-md transition-colors touch-manipulation
                ${emergencyMode 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                }
              `}
              title="Mode urgence (F1)"
              aria-label="Activer/Désactiver le mode urgence"
            >
              <ExclamationTriangleIcon className="h-5 w-5" />
            </button>

            {/* Sélecteur période - caché sur mobile */}
            <div className="hidden md:block">
              <label htmlFor="period-filter" className="sr-only">Période:</label>
              <select
                id="period-filter"
                value={selectedPeriod}
                onChange={(e) => onPeriodChange(e.target.value as PeriodOption)}
                className="bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 touch-manipulation"
                aria-label="Sélectionner la période pour les statistiques"
              >
                <option value="today">Aujourd'hui</option>
                <option value="thisWeek">Cette Semaine</option>
                <option value="thisMonth">Ce Mois-ci</option>
              </select>
            </div>
            
            {/* Profil utilisateur */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-600">
              <div className="hidden sm:block text-right">
                <p className="font-semibold text-white text-sm truncate max-w-32" title={currentUser.name}>
                  {currentUser.name}
                </p>
                <p className="text-xs text-sky-300">{currentUserRoleName}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-md text-white hover:bg-slate-700 transition-colors touch-manipulation"
                title="Déconnexion"
                aria-label="Déconnexion"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        <div className="sm:hidden mt-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="search"
              name="globalSearchMobile"
              id="globalSearchMobile"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher patient..."
              className="block w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-9 pr-3 text-sm placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 touch-manipulation"
              aria-label="Rechercher un patient"
            />
          </div>
        </div>
      </div>
    </header>
  );
};