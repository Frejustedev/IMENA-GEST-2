import React, { useState, useEffect } from 'react';
import { RadioprotectionService, DecayCalculation, QualityControl } from '../services/radioprotectionService';
import { AtomIcon } from './icons/AtomIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';

interface RadioprotectionViewProps {
  // Props peuvent être ajoutées selon les besoins
}

interface DosimetryRecord {
  id: string;
  date: string;
  isotope: string;
  activity: number;
  patientWeight: number;
  patientAge: number;
  calculatedDose: number;
  examType: string;
  technician: string;
}

interface SafetyAlert {
  id: string;
  type: 'exposure' | 'contamination' | 'waste' | 'maintenance';
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const RadioprotectionView: React.FC<RadioprotectionViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dosimetry' | 'safety' | 'waste'>('dashboard');
  const [dosimetryRecords, setDosimetryRecords] = useState<DosimetryRecord[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [selectedIsotope, setSelectedIsotope] = useState<string>('Tc-99m');
  const [currentActivity, setCurrentActivity] = useState<number>(1000);
  const [decayCalculation, setDecayCalculation] = useState<DecayCalculation | null>(null);

  // Simulation de données de dosimétrie
  useEffect(() => {
    const mockDosimetryRecords: DosimetryRecord[] = [
      {
        id: '1',
        date: '2024-01-15',
        isotope: 'Tc-99m',
        activity: 740,
        patientWeight: 70,
        patientAge: 45,
        calculatedDose: 4.2,
        examType: 'Scintigraphie osseuse',
        technician: 'Dr. Martin'
      },
      {
        id: '2',
        date: '2024-01-15',
        isotope: 'I-131',
        activity: 185,
        patientWeight: 65,
        patientAge: 52,
        calculatedDose: 12.5,
        examType: 'Thérapie thyroïde',
        technician: 'Dr. Dubois'
      }
    ];
    setDosimetryRecords(mockDosimetryRecords);

    const mockSafetyAlerts: SafetyAlert[] = [
      {
        id: '1',
        type: 'exposure',
        level: 'medium',
        message: 'Dépassement du seuil d\'exposition mensuel pour le technicien A',
        timestamp: '2024-01-15T10:30:00Z',
        resolved: false
      },
      {
        id: '2',
        type: 'waste',
        level: 'high',
        message: 'Container de déchets radioactifs à 90% de capacité',
        timestamp: '2024-01-15T09:15:00Z',
        resolved: false
      }
    ];
    setSafetyAlerts(mockSafetyAlerts);
  }, []);

  // Calcul de décroissance en temps réel
  useEffect(() => {
    if (selectedIsotope && currentActivity > 0) {
      try {
        const calculation = RadioprotectionService.calculateDecay(
          selectedIsotope,
          currentActivity,
          24 // 24 heures
        );
        setDecayCalculation(calculation);
      } catch (error) {
        console.error('Erreur calcul décroissance:', error);
        setDecayCalculation(null);
      }
    }
  }, [selectedIsotope, currentActivity]);

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'exposure': return <AtomIcon className="h-5 w-5" />;
      case 'contamination': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'waste': return <BeakerIcon className="h-5 w-5" />;
      case 'maintenance': return <CheckCircleIcon className="h-5 w-5" />;
      default: return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Calculateur de décroissance */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <AtomIcon className="h-6 w-6 text-blue-600 mr-2" />
          Calculateur de Décroissance Radioactive
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Isotope</label>
            <select
              value={selectedIsotope}
              onChange={(e) => setSelectedIsotope(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Tc-99m">Tc-99m</option>
              <option value="I-131">I-131</option>
              <option value="F-18">F-18</option>
              <option value="Ga-68">Ga-68</option>
              <option value="In-111">In-111</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Activité initiale (MBq)</label>
            <input
              type="number"
              value={currentActivity}
              onChange={(e) => setCurrentActivity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="10"
            />
          </div>
          
          <div className="flex items-end">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 mb-2">Activité après 24h</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium">
                {decayCalculation && decayCalculation.currentActivity !== undefined ? `${decayCalculation.currentActivity.toFixed(1)} MBq` : '0 MBq'}
              </div>
            </div>
          </div>
        </div>

        {decayCalculation && decayCalculation.decayFactor !== undefined && decayCalculation.currentActivity !== undefined && decayCalculation.originalActivity !== undefined && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Facteur de décroissance:</strong> {decayCalculation.decayFactor.toFixed(4)} | 
              <strong> Temps écoulé:</strong> {decayCalculation.timeElapsed}h |
              <strong> Pourcentage restant:</strong> {decayCalculation.percentRemaining.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Alertes de sécurité */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-2" />
          Alertes de Sécurité Actives ({safetyAlerts.filter(a => !a.resolved).length})
        </h3>
        
        <div className="space-y-3">
          {safetyAlerts.filter(alert => !alert.resolved).map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.level)}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm opacity-75 mt-1">
                    {new Date(alert.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSafetyAlerts(prev => 
                      prev.map(a => a.id === alert.id ? { ...a, resolved: true } : a)
                    );
                  }}
                  className="ml-2 px-3 py-1 text-sm bg-white border border-current rounded hover:bg-opacity-10"
                >
                  Résoudre
                </button>
              </div>
            </div>
          ))}
          
          {safetyAlerts.filter(a => !a.resolved).length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Aucune alerte de sécurité active</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDosimetry = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <ChartBarIcon className="h-6 w-6 text-green-600 mr-2" />
        Registre Dosimétrique
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Isotope</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activité (MBq)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dose (mSv)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Examen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Technicien</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {dosimetryRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {new Date(record.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {record.isotope}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {record.activity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {record.patientWeight}kg, {record.patientAge}ans
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {record.calculatedDose}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {record.examType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {record.technician}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <AtomIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-slate-800">Radioprotection</h1>
          </div>
          <p className="text-slate-600">
            Surveillance dosimétrique, calculs de décroissance et gestion de la sécurité radiologique
          </p>
        </div>

        {/* Navigation par onglets */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-slate-200">
            {[
              { id: 'dashboard', label: 'Tableau de Bord', icon: ChartBarIcon },
              { id: 'dosimetry', label: 'Dosimétrie', icon: AtomIcon },
              { id: 'safety', label: 'Sécurité', icon: ExclamationTriangleIcon },
              { id: 'waste', label: 'Déchets', icon: BeakerIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'dosimetry' && renderDosimetry()}
        {activeTab === 'safety' && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Gestion de la Sécurité</h3>
            <p className="text-slate-600">Module de sécurité radiologique en développement...</p>
          </div>
        )}
        {activeTab === 'waste' && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Gestion des Déchets Radioactifs</h3>
            <p className="text-slate-600">Module de gestion des déchets en développement...</p>
          </div>
        )}
      </div>
    </div>
  );
};
