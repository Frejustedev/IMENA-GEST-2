import React, { useState } from 'react';
import { RadioprotectionService, QualityControl } from '../services/radioprotectionService';
import { BeakerIcon } from './icons/BeakerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface QualityControlPanelProps {
  lotId: string;
  lotNumber: string;
  onQualityControlAdded: (qc: QualityControl) => void;
  existingControls: QualityControl[];
}

const QC_TESTS = [
  {
    type: 'radiochemical_purity' as const,
    label: 'Pureté Radiochimique',
    unit: '%',
    criteria: { min: 95.0 },
    defaultValue: 98.5,
    description: 'Pourcentage du traceur sous forme désirée'
  },
  {
    type: 'radionuclidic_purity' as const,
    label: 'Pureté Radionuclidique',
    unit: '%',
    criteria: { min: 99.0 },
    defaultValue: 99.8,
    description: 'Pourcentage de l\'isotope désiré'
  },
  {
    type: 'pH' as const,
    label: 'pH',
    unit: '',
    criteria: { min: 4.5, max: 7.5, target: 6.0 },
    defaultValue: 6.2,
    description: 'Acidité de la solution'
  },
  {
    type: 'sterility' as const,
    label: 'Stérilité',
    unit: 'CFU/ml',
    criteria: { min: 0, max: 0 },
    defaultValue: 0,
    description: 'Absence de contamination microbienne'
  }
];

export const QualityControlPanel: React.FC<QualityControlPanelProps> = ({
  lotId,
  lotNumber,
  onQualityControlAdded,
  existingControls
}) => {
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testValue, setTestValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isPerforming, setIsPerforming] = useState(false);

  const handlePerformTest = async () => {
    if (!selectedTest || !testValue) return;

    setIsPerforming(true);
    
    try {
      const testConfig = QC_TESTS.find(t => t.type === selectedTest);
      if (!testConfig) return;

      const qc = RadioprotectionService.performQualityControl(
        lotId,
        selectedTest as QualityControl['testType'],
        parseFloat(testValue),
        testConfig.unit,
        'Technicien QC'
      );

      // Ajouter les notes personnalisées
      if (notes.trim()) {
        qc.notes = `${qc.notes} - ${notes.trim()}`;
      }

      onQualityControlAdded(qc);

      // Reset form
      setSelectedTest('');
      setTestValue('');
      setNotes('');
    } catch (error) {
      console.error('Erreur CQ:', error);
    } finally {
      setIsPerforming(false);
    }
  };

  const getTestStatus = (testType: string) => {
    const existing = existingControls.find(qc => qc.testType === testType);
    if (!existing) return 'not_done';
    return existing.passed ? 'passed' : 'failed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed': return <XMarkIcon className="h-5 w-5 text-red-500" />;
      default: return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'border-green-200 bg-green-50';
      case 'failed': return 'border-red-200 bg-red-50';
      default: return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-700 flex items-center">
          <BeakerIcon className="h-6 w-6 text-indigo-500 mr-2" />
          Contrôle Qualité - Lot {lotNumber}
        </h3>
        <div className="text-sm text-slate-500">
          {existingControls.length}/{QC_TESTS.length} tests effectués
        </div>
      </div>

      {/* État des tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {QC_TESTS.map(test => {
          const status = getTestStatus(test.type);
          const existing = existingControls.find(qc => qc.testType === test.type);

          return (
            <div
              key={test.type}
              className={`p-4 rounded-lg border-2 ${getStatusColor(status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800">{test.label}</h4>
                {getStatusIcon(status)}
              </div>
              
              <p className="text-sm text-slate-600 mb-2">{test.description}</p>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Critères:</span>
                <span className="font-medium">
                  {test.criteria.min !== undefined && `≥${test.criteria.min}`}
                  {test.criteria.max !== undefined && test.criteria.min !== undefined && ' et '}
                  {test.criteria.max !== undefined && `≤${test.criteria.max}`}
                  {test.unit && ` ${test.unit}`}
                </span>
              </div>

              {existing && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Résultat:</span>
                    <span className={`font-medium ${existing.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {existing.result} {existing.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Effectué:</span>
                    <span>{existing.timestamp.toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Formulaire nouveau test */}
      <div className="border-t border-slate-200 pt-6">
        <h4 className="font-semibold text-slate-700 mb-4">Effectuer un nouveau test</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type de test
            </label>
            <select
              value={selectedTest}
              onChange={(e) => {
                setSelectedTest(e.target.value);
                const test = QC_TESTS.find(t => t.type === e.target.value);
                if (test) {
                  setTestValue(test.defaultValue.toString());
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un test</option>
              {QC_TESTS.map(test => (
                <option key={test.type} value={test.type}>
                  {test.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Valeur mesurée
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Résultat"
              />
              {selectedTest && (
                <span className="absolute right-3 top-2 text-sm text-slate-500">
                  {QC_TESTS.find(t => t.type === selectedTest)?.unit}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePerformTest}
              disabled={!selectedTest || !testValue || isPerforming}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isPerforming ? 'Enregistrement...' : 'Effectuer Test'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observations, conditions particulières..."
          />
        </div>
      </div>

      {/* Critères conformité */}
      {selectedTest && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          {(() => {
            const test = QC_TESTS.find(t => t.type === selectedTest);
            if (!test) return null;

            return (
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Critères d'acceptation</h5>
                <p className="text-sm text-blue-700">
                  {test.description}
                  <br />
                  <strong>Limites:</strong> 
                  {test.criteria.min !== undefined && ` Minimum ${test.criteria.min}${test.unit}`}
                  {test.criteria.max !== undefined && test.criteria.min !== undefined && ' • '}
                  {test.criteria.max !== undefined && ` Maximum ${test.criteria.max}${test.unit}`}
                  {test.criteria.target !== undefined && ` • Cible ${test.criteria.target}${test.unit}`}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
