import React, { useState, useEffect } from 'react';
import { Cog8ToothIcon } from './icons/Cog8ToothIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface AccessibilityToolbarProps {
  className?: string;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    darkMode: false,
    reduceMotion: false,
    focusVisible: true
  });

  // Appliquer les paramètres d'accessibilité
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (settings.largeText) {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '';
    }
    
    // Dark mode
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Reduce motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [settings]);

  // Raccourcis clavier accessibilité
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault();
            setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
            break;
          case 't':
            e.preventDefault();
            setSettings(prev => ({ ...prev, largeText: !prev.largeText }));
            break;
          case 'd':
            e.preventDefault();
            setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bouton accessibilité */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors touch-manipulation"
        title="Options d'accessibilité"
        aria-label="Ouvrir les options d'accessibilité"
        aria-expanded={isOpen}
      >
        <EyeIcon className="h-5 w-5" />
      </button>

      {/* Panel d'accessibilité */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <EyeIcon className="h-5 w-5 mr-2" />
                Accessibilité
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Personnalisez l'interface selon vos besoins
              </p>
            </div>

            {/* Options */}
            <div className="p-4 space-y-4">
              {/* Contraste élevé */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Contraste élevé
                  </label>
                  <p className="text-xs text-slate-500">Alt+C</p>
                </div>
                <button
                  onClick={() => toggleSetting('highContrast')}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.highContrast ? 'bg-blue-600' : 'bg-slate-200'}
                  `}
                  role="switch"
                  aria-checked={settings.highContrast}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.highContrast ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Texte agrandi */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Texte agrandi
                  </label>
                  <p className="text-xs text-slate-500">Alt+T</p>
                </div>
                <button
                  onClick={() => toggleSetting('largeText')}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.largeText ? 'bg-blue-600' : 'bg-slate-200'}
                  `}
                  role="switch"
                  aria-checked={settings.largeText}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.largeText ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Mode sombre */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Mode sombre
                  </label>
                  <p className="text-xs text-slate-500">Alt+D</p>
                </div>
                <button
                  onClick={() => toggleSetting('darkMode')}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-200'}
                  `}
                  role="switch"
                  aria-checked={settings.darkMode}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Réduire les animations */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Réduire animations
                  </label>
                  <p className="text-xs text-slate-500">Pour vertiges</p>
                </div>
                <button
                  onClick={() => toggleSetting('reduceMotion')}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.reduceMotion ? 'bg-blue-600' : 'bg-slate-200'}
                  `}
                  role="switch"
                  aria-checked={settings.reduceMotion}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
              <p className="text-xs text-slate-600">
                Utilise les préférences système quand disponibles.
                <br />
                Raccourcis : Alt+C/T/D pour contraste/texte/sombre.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
