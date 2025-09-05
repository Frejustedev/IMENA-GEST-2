import React, { useState, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';

// Icons
import { 
  EyeIcon,
  EyeSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '../icons';

/**
 * Props de la barre d'outils d'accessibilité
 */
interface AccessibilityToolbarProps {
  /** Position de la barre d'outils */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  /** Si la barre d'outils est réduite par défaut */
  collapsed?: boolean;
  /** Classes CSS personnalisées */
  className?: string;
}

/**
 * Barre d'outils d'accessibilité complète
 */
export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  position = 'floating',
  collapsed = false,
  className = ''
}) => {
  const { preferences, updatePreference, resetPreferences, announceToScreenReader } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  /**
   * Toggle l'expansion de la barre d'outils
   */
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    announceToScreenReader(
      isExpanded ? 'Barre d\'outils d\'accessibilité réduite' : 'Barre d\'outils d\'accessibilité étendue'
    );
  };

  /**
   * Ouvrir/fermer un panneau
   */
  const togglePanel = (panelName: string) => {
    setActivePanel(activePanel === panelName ? null : panelName);
    announceToScreenReader(`Panneau ${panelName} ${activePanel === panelName ? 'fermé' : 'ouvert'}`);
  };

  /**
   * Ajuster le niveau de zoom
   */
  const adjustZoom = (direction: 'in' | 'out' | 'reset') => {
    let newZoom = preferences.zoomLevel;
    
    switch (direction) {
      case 'in':
        newZoom = Math.min(2, newZoom + 0.1);
        break;
      case 'out':
        newZoom = Math.max(0.5, newZoom - 0.1);
        break;
      case 'reset':
        newZoom = 1;
        break;
    }
    
    updatePreference('zoomLevel', newZoom);
    announceToScreenReader(`Niveau de zoom: ${Math.round(newZoom * 100)}%`);
  };

  /**
   * Classes CSS selon la position
   */
  const getPositionClasses = () => {
    const baseClasses = 'accessibility-toolbar transition-all duration-300 ease-in-out z-50';
    
    switch (position) {
      case 'top':
        return `${baseClasses} fixed top-0 left-0 right-0 bg-white border-b shadow-sm`;
      case 'bottom':
        return `${baseClasses} fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm`;
      case 'left':
        return `${baseClasses} fixed top-0 left-0 h-full bg-white border-r shadow-sm`;
      case 'right':
        return `${baseClasses} fixed top-0 right-0 h-full bg-white border-l shadow-sm`;
      case 'floating':
      default:
        return `${baseClasses} fixed top-4 right-4 bg-white rounded-lg shadow-lg border`;
    }
  };

  return (
    <div
      ref={toolbarRef}
      className={`${getPositionClasses()} ${className}`}
      role="toolbar"
      aria-label="Options d'accessibilité"
      aria-expanded={isExpanded}
    >
      {/* Bouton toggle principal */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-semibold text-slate-900">
          Accessibilité
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          aria-label={isExpanded ? 'Réduire les options' : 'Étendre les options'}
          className="ml-2"
        >
          {isExpanded ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
        </Button>
      </div>

      {/* Contenu principal */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Contrôles rapides */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Contrôles rapides
            </h4>
            
            {/* Zoom */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Zoom ({Math.round(preferences.zoomLevel * 100)}%)</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => adjustZoom('out')}
                  aria-label="Diminuer le zoom"
                  disabled={preferences.zoomLevel <= 0.5}
                >
                  <MagnifyingGlassMinusIcon className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => adjustZoom('reset')}
                  aria-label="Réinitialiser le zoom"
                >
                  100%
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => adjustZoom('in')}
                  aria-label="Augmenter le zoom"
                  disabled={preferences.zoomLevel >= 2}
                >
                  <MagnifyingGlassPlusIcon className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Thème */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Thème</span>
              <div className="flex gap-1">
                <Button
                  variant={!preferences.darkMode ? 'primary' : 'ghost'}
                  size="xs"
                  onClick={() => updatePreference('darkMode', false)}
                  aria-label="Thème clair"
                  aria-pressed={!preferences.darkMode}
                >
                  <SunIcon className="w-3 h-3" />
                </Button>
                <Button
                  variant={preferences.darkMode ? 'primary' : 'ghost'}
                  size="xs"
                  onClick={() => updatePreference('darkMode', true)}
                  aria-label="Thème sombre"
                  aria-pressed={preferences.darkMode}
                >
                  <MoonIcon className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Contraste élevé */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Contraste élevé</span>
              <Button
                variant={preferences.highContrast ? 'primary' : 'ghost'}
                size="xs"
                onClick={() => updatePreference('highContrast', !preferences.highContrast)}
                aria-label={preferences.highContrast ? 'Désactiver le contraste élevé' : 'Activer le contraste élevé'}
                aria-pressed={preferences.highContrast}
              >
                {preferences.highContrast ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
              </Button>
            </div>

            {/* Grandes polices */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Grandes polices</span>
              <Button
                variant={preferences.largeFonts ? 'primary' : 'ghost'}
                size="xs"
                onClick={() => updatePreference('largeFonts', !preferences.largeFonts)}
                aria-label={preferences.largeFonts ? 'Désactiver les grandes polices' : 'Activer les grandes polices'}
                aria-pressed={preferences.largeFonts}
              >
                Aa
              </Button>
            </div>

            {/* Réduction des mouvements */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Réduire les animations</span>
              <Button
                variant={preferences.reduceMotion ? 'primary' : 'ghost'}
                size="xs"
                onClick={() => updatePreference('reduceMotion', !preferences.reduceMotion)}
                aria-label={preferences.reduceMotion ? 'Activer les animations' : 'Réduire les animations'}
                aria-pressed={preferences.reduceMotion}
              >
                {preferences.reduceMotion ? <SpeakerXMarkIcon className="w-3 h-3" /> : <SpeakerWaveIcon className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Panneau avancé */}
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel('advanced')}
              className="w-full justify-between"
              aria-expanded={activePanel === 'advanced'}
            >
              <span>Options avancées</span>
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
            </Button>

            {activePanel === 'advanced' && (
              <Card className="mt-2">
                <CardContent noPadding={false}>
                  <div className="space-y-3">
                    {/* Espacement augmenté */}
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Espacement augmenté</span>
                      <input
                        type="checkbox"
                        checked={preferences.increasedSpacing}
                        onChange={(e) => updatePreference('increasedSpacing', e.target.checked)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        aria-describedby="spacing-help"
                      />
                    </label>
                    <p id="spacing-help" className="text-xs text-slate-600">
                      Augmente l'espacement entre les éléments
                    </p>

                    {/* Focus renforcé */}
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Focus renforcé</span>
                      <input
                        type="checkbox"
                        checked={preferences.enhancedFocus}
                        onChange={(e) => updatePreference('enhancedFocus', e.target.checked)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        aria-describedby="focus-help"
                      />
                    </label>
                    <p id="focus-help" className="text-xs text-slate-600">
                      Améliore la visibilité du focus clavier
                    </p>

                    {/* Navigation clavier */}
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Navigation clavier</span>
                      <input
                        type="checkbox"
                        checked={preferences.keyboardNavigation}
                        onChange={(e) => updatePreference('keyboardNavigation', e.target.checked)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        aria-describedby="keyboard-help"
                      />
                    </label>
                    <p id="keyboard-help" className="text-xs text-slate-600">
                      Optimise l'interface pour la navigation au clavier
                    </p>

                    {/* Daltonisme */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Adaptation daltonisme
                      </label>
                      <select
                        value={preferences.colorBlindness}
                        onChange={(e) => updatePreference('colorBlindness', e.target.value as any)}
                        className="w-full text-sm border border-slate-300 rounded-md px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
                        aria-describedby="colorblind-help"
                      >
                        <option value="none">Aucune</option>
                        <option value="protanopia">Protanopie (rouge)</option>
                        <option value="deuteranopia">Deutéranopie (vert)</option>
                        <option value="tritanopia">Tritanopie (bleu)</option>
                        <option value="achromatopsia">Achromatopsie (total)</option>
                      </select>
                      <p id="colorblind-help" className="text-xs text-slate-600 mt-1">
                        Adapte les couleurs pour différents types de daltonisme
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-3 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetPreferences}
              className="w-full"
            >
              Réinitialiser les préférences
            </Button>
            
            <div className="text-xs text-slate-500 text-center">
              Conformité WCAG 2.1 AA
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Bouton d'accessibilité flottant simple
 */
export const AccessibilityButton: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className = '' }) => {
  const [showToolbar, setShowToolbar] = useState(false);

  const handleClick = () => {
    setShowToolbar(!showToolbar);
    onClick?.();
  };

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        onClick={handleClick}
        className={`fixed bottom-4 left-4 rounded-full shadow-lg ${className}`}
        aria-label="Ouvrir les options d'accessibilité"
        aria-expanded={showToolbar}
      >
        <AdjustmentsHorizontalIcon className="w-6 h-6" />
      </Button>

      {showToolbar && (
        <AccessibilityToolbar
          position="floating"
          collapsed={false}
        />
      )}
    </>
  );
};

/**
 * Panneau de préférences d'accessibilité complet
 */
export const AccessibilityPreferencesPanel: React.FC<{
  onClose?: () => void;
}> = ({ onClose }) => {
  const { preferences, updatePreference, resetPreferences } = useAccessibility();

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader
        title="Préférences d'accessibilité"
        subtitle="Personnalisez l'interface selon vos besoins"
        actions={
          onClose && (
            <Button variant="ghost" onClick={onClose} aria-label="Fermer">
              ×
            </Button>
          )
        }
      />
      
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vision */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Vision</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Contraste élevé</span>
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(e) => updatePreference('highContrast', e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span>Grandes polices</span>
                <input
                  type="checkbox"
                  checked={preferences.largeFonts}
                  onChange={(e) => updatePreference('largeFonts', e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Niveau de zoom: {Math.round(preferences.zoomLevel * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={preferences.zoomLevel}
                  onChange={(e) => updatePreference('zoomLevel', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Motricité */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Motricité</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Réduire les animations</span>
                <input
                  type="checkbox"
                  checked={preferences.reduceMotion}
                  onChange={(e) => updatePreference('reduceMotion', e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span>Espacement augmenté</span>
                <input
                  type="checkbox"
                  checked={preferences.increasedSpacing}
                  onChange={(e) => updatePreference('increasedSpacing', e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <span>Focus renforcé</span>
                <input
                  type="checkbox"
                  checked={preferences.enhancedFocus}
                  onChange={(e) => updatePreference('enhancedFocus', e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={resetPreferences}
            className="w-full"
          >
            Réinitialiser toutes les préférences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessibilityToolbar;
