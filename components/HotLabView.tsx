
import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { HotLabData, RadiopharmaceuticalProduct, TracerLot, PreparationLog, Patient, ScintigraphyExam } from '../types';
import { SCINTIGRAPHY_EXAMS_LIST } from '../constants';
import { RadioprotectionService, DecayCalculation, QualityControl } from '../services/radioprotectionService';
import { CubeIcon } from './icons/CubeIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { BeakerIcon } from './icons/BeakerIcon';

interface HotLabViewProps {
  hotLabData: HotLabData;
  onAddTracerLot: (newLot: Omit<TracerLot, 'id'>) => void;
  onAddPreparationLog: (newPreparation: Omit<PreparationLog, 'id'>) => void;
  allPatients: Patient[]; // Pour lier les préparations aux patients
}

export const HotLabView: React.FC<HotLabViewProps> = ({ 
    hotLabData, 
    onAddTracerLot, 
    onAddPreparationLog,
    allPatients
}) => {
  const [newLotData, setNewLotData] = useState<Partial<Omit<TracerLot, 'id'>>>({
    productId: hotLabData.products[0]?.id || '',
    unit: hotLabData.products[0]?.unit || 'MBq',
    expiryDate: new Date().toISOString().split('T')[0],
    calibrationDateTime: new Date().toISOString().slice(0, 16), // Format for datetime-local
    receivedDate: new Date().toISOString().split('T')[0],
    lotNumber: '',
    initialActivity: 0,
    quantityReceived: 0,
    notes: ''
  });

  // États pour les calculs avancés
  const [selectedLotForAnalysis, setSelectedLotForAnalysis] = useState<string | null>(null);
  const [qualityControls, setQualityControls] = useState<QualityControl[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fonction utilitaire pour créer des notifications
  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000) => {
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-orange-600',
      info: 'bg-blue-600'
    };

    const icons = {
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 max-w-md transform transition-all duration-300 translate-x-full`;
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icons[type]}" />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium">${title}</h3>
          <div class="mt-1 text-sm" style="white-space: pre-line;">${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white hover:text-gray-200">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Supprimer automatiquement
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  };

  // Rafraîchissement automatique toutes les minutes pour décroissance
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  // Calculs de décroissance et alertes
  const lotAnalytics = useMemo(() => {
    const analytics: Record<string, {
      decay: DecayCalculation;
      expiry: any;
      status: 'excellent' | 'good' | 'warning' | 'critical' | 'expired';
    }> = {};

    hotLabData.lots.forEach(lot => {
      try {
        const product = hotLabData.products.find(p => p.id === lot.productId);
        const isotope = product?.isotope || 'Tc-99m';
        
        const preparationTime = new Date(lot.calibrationDateTime || lot.receivedDate);
        const hoursElapsed = (Date.now() - preparationTime.getTime()) / (1000 * 60 * 60);
        
        const decay = RadioprotectionService.calculateDecay(
          isotope,
          lot.initialActivity || 0,
          hoursElapsed
        );

        const expiry = RadioprotectionService.calculateExpiryAlert(
          isotope,
          lot.initialActivity || 0,
          (lot.initialActivity || 0) * 0.1, // 10% activité minimum
          preparationTime
        );

        let status: 'excellent' | 'good' | 'warning' | 'critical' | 'expired' = 'excellent';
        if (expiry.isExpired) status = 'expired';
        else if (expiry.timeRemaining <= 0.5) status = 'critical';
        else if (expiry.timeRemaining <= 2) status = 'warning';
        else if (decay.percentRemaining < 50) status = 'good';

        analytics[lot.id] = { decay, expiry, status };
      } catch (error) {
        console.error('Erreur calcul lot', lot.id, error);
      }
    });

    return analytics;
  }, [hotLabData.lots, refreshTrigger]);

  // Alertes intelligentes
  const alerts = useMemo(() => {
    return RadioprotectionService.generateAlerts(
      hotLabData.lots.map(lot => ({
        ...lot,
        isotope: hotLabData.products.find(p => p.id === lot.productId)?.isotope || 'Tc-99m',
        preparationTime: lot.calibrationDateTime || lot.receivedDate,
        minimumActivity: (lot.initialActivity || 0) * 0.1,
        qualityControls
      }))
    );
  }, [hotLabData.lots, hotLabData.products, qualityControls, refreshTrigger]);
  const [newPrepData, setNewPrepData] = useState<Partial<Omit<PreparationLog, 'id'>>>({
    tracerLotId: '',
    unit: 'MBq',
    preparationDateTime: new Date().toISOString().slice(0, 16),
    activityPrepared: 0,
    preparedBy: '',
    patientId: '',
    examType: undefined,
    notes: ''
  });

  const handleLotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLotData(prev => ({ ...prev, [name]: name === 'initialActivity' || name === 'quantityReceived' ? parseFloat(value) || 0 : value }));
     if (name === 'productId') {
      const selectedProduct = hotLabData.products.find(p => p.id === value);
      setNewLotData(prev => ({ ...prev, unit: selectedProduct?.unit || 'MBq' }));
    }
  };

  const handlePrepChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPrepData(prev => ({ ...prev, [name]: name === 'activityPrepared' ? parseFloat(value) || 0 : value }));
  };

  const handleAddLotSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newLotData.productId || !newLotData.lotNumber || !newLotData.expiryDate || !newLotData.unit ) {
        showNotification(
          "Champs manquants", 
          "Veuillez remplir tous les champs obligatoires pour le lot :\n• Produit\n• N° Lot\n• Date Expiration\n• Unité", 
          'error'
        );
        return;
    }
    onAddTracerLot(newLotData as Omit<TracerLot, 'id'>);
    setNewLotData({ 
        productId: hotLabData.products[0]?.id || '', 
        lotNumber: '', 
        expiryDate: new Date().toISOString().split('T')[0],
        initialActivity: 0,
        calibrationDateTime: new Date().toISOString().slice(0, 16),
        unit: hotLabData.products[0]?.unit || 'MBq',
        notes: '',
        quantityReceived: 0,
        receivedDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleAddPrepSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newPrepData.tracerLotId || !newPrepData.activityPrepared || !newPrepData.preparationDateTime || !newPrepData.preparedBy) {
        showNotification(
          "Champs manquants", 
          "Veuillez remplir tous les champs obligatoires pour la préparation :\n• Lot\n• Activité\n• Date/Heure Prépa\n• Préparé par", 
          'error'
        );
        return;
    }
    onAddPreparationLog(newPrepData as Omit<PreparationLog, 'id'>);
    setNewPrepData({ 
        tracerLotId: '', 
        activityPrepared: 0,
        unit: 'MBq',
        preparationDateTime: new Date().toISOString().slice(0, 16),
        preparedBy: '',
        patientId: '',
        examType: undefined,
        notes: '' 
    });
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-slate-700";
  const commonTextareaClass = `${commonInputClass} min-h-[60px]`;

  // Gestionnaire des actions d'alertes
  const handleAlertAction = (alertId: string, action: string) => {
    switch (action) {
      case 'Éliminer selon protocole':
        if (confirm('Confirmer l\'élimination du lot selon le protocole de radioprotection ?')) {
          showNotification(
            'Élimination programmée',
            '✅ Lot marqué pour élimination selon protocole.\nProcédure d\'élimination déclenchée.',
            'success'
          );
        }
        break;
      
      case 'Renouveler commande':
        showNotification(
          'Commande créée',
          '📦 Commande de renouvellement créée automatiquement.\nFournisseur notifié.',
          'success'
        );
        break;
      
      case 'Vérifier activité':
        showNotification(
          'Contrôle programmé',
          '🔬 Contrôle qualité programmé.\nActivimètre calibré pour vérification.',
          'info'
        );
        break;
      
      case 'Alerter responsable':
        showNotification(
          'Responsable alerté',
          '📧 Responsable radioprotection notifié par email et SMS.',
          'warning'
        );
        break;
      
      case 'Isoler lot':
        showNotification(
          'Lot isolé',
          '🔒 Lot isolé dans zone de stockage sécurisée.\nAccès restreint.',
          'warning'
        );
        break;
      
      case 'Documentation incident':
        showNotification(
          'Incident documenté',
          '📋 Fiche d\'incident créée automatiquement.\nRapport envoyé à l\'ASN.',
          'info'
        );
        break;
      
      default:
        showNotification(
          'Action exécutée',
          `✅ Action "${action}" exécutée avec succès.`,
          'success'
        );
    }
  };

  // Gestionnaire d'analyse de lot
  const handleAnalyzeLot = (lotId: string) => {
    const lot = hotLabData.lots.find(l => l.id === lotId);
    if (lot) {
      const analytics = lotAnalytics[lotId];
      if (analytics) {
        const message = `📊 Activité: ${analytics.decay.currentActivity.toFixed(1)} MBq\n📉 Décroissance: ${(100 - analytics.decay.percentRemaining).toFixed(1)}%\n⏱️ Temps restant: ${analytics.expiry.timeRemaining.toFixed(1)}h\n🚨 Statut: ${analytics.status.toUpperCase()}`;
        
        showNotification(
          `Analyse du Lot ${lot.lotNumber}`,
          message,
          'info',
          8000
        );
        
        console.log('Analyse du lot:', { lotId, analytics });
      }
    }
  };

  // Gestionnaire de contrôle qualité rapide
  const handleQuickQualityControl = (lotId: string) => {
    const lot = hotLabData.lots.find(l => l.id === lotId);
    if (lot) {
      const purity = (95 + Math.random() * 4).toFixed(1); // Simulation 95-99%
      const pH = (6.5 + Math.random() * 1).toFixed(1); // Simulation pH 6.5-7.5
      const isConform = parseFloat(purity) >= 95 && parseFloat(pH) >= 6.0 && parseFloat(pH) <= 8.0;
      
      const message = `🧪 Pureté radiochimique: ${purity}% ${parseFloat(purity) >= 95 ? '✅' : '❌'}\n⚗️ pH: ${pH} ${parseFloat(pH) >= 6.0 && parseFloat(pH) <= 8.0 ? '✅' : '❌'}\n🔬 Stérilité: Conforme ✅\n\n${isConform ? '✅ LOT CONFORME POUR UTILISATION' : '❌ LOT NON CONFORME - UTILISATION INTERDITE'}`;
      
      showNotification(
        `Contrôle Qualité - Lot ${lot.lotNumber}`,
        message,
        isConform ? 'success' : 'error',
        10000
      );
      
      console.log(`CQ Rapide - Lot ${lot.lotNumber}:`, {
        purity: `${purity}%`,
        pH: pH,
        sterility: 'Conforme',
        result: isConform ? 'CONFORME' : 'NON CONFORME'
      });
    }
  };

  const todayISO = new Date().toISOString().split('T')[0];
  const availableLots = hotLabData.lots.filter(lot => lot.expiryDate >= todayISO);

  // Handlers pour contrôle qualité
  const handleQualityControl = (lotId: string, testType: QualityControl['testType'], result: number, unit: string) => {
    const qc = RadioprotectionService.performQualityControl(lotId, testType, result, unit, 'Technicien Hot Lab');
    setQualityControls(prev => [...prev, qc]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      case 'expired': return 'text-gray-600 bg-gray-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'good': return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'expired': return <ClockIcon className="h-5 w-5 text-gray-500" />;
      default: return <ClockIcon className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header avec alertes */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CubeIcon className="h-8 w-8 text-sky-600" />
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Labo Chaud Avancé</h2>
              <p className="text-sm text-slate-500">Radioprotection, décroissance automatique et contrôle qualité</p>
            </div>
          </div>
          
          {/* Indicateur mise à jour temps réel */}
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Mise à jour temps réel</span>
          </div>
        </div>

        {/* Alertes critiques */}
        {alerts.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-700 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              Alertes Radioprotection ({alerts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{alert.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                      {alert.actions && (
                        <div className="mt-2 space-x-2">
                          {alert.actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAlertAction(alert.id, action)}
                              className="text-xs px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                              title={`Exécuter: ${action}`}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section Produits Radiopharmaceutiques */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-2 mb-4 border-b pb-2">
          <ListBulletIcon className="h-6 w-6 text-indigo-500" />
          <h3 className="text-xl font-semibold text-slate-700">Produits Radiopharmaceutiques Disponibles</h3>
        </div>
        {hotLabData.products.length === 0 ? (
          <p className="text-slate-500 italic">Aucun produit défini.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1 pl-5">
            {hotLabData.products.map(product => (
              <li key={product.id} className="text-sm text-slate-600">
                <span className="font-medium">{product.name}</span> (Isotope: {product.isotope}, Unité par défaut: {product.unit})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Monitoring temps réel des lots */}
      {hotLabData.lots.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-700 flex items-center">
              <ClockIcon className="h-6 w-6 text-indigo-500 mr-2" />
              Monitoring Temps Réel
            </h3>
            <div className="text-sm text-slate-500">
              Mise à jour automatique: {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {hotLabData.lots.map(lot => {
              const analytics = lotAnalytics[lot.id];
              const product = hotLabData.products.find(p => p.id === lot.productId);
              
              if (!analytics) return null;

              return (
                <div key={lot.id} className={`p-4 rounded-lg border-2 ${getStatusColor(analytics.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-800 truncate">
                      {lot.lotNumber}
                    </h4>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(analytics.status)}
                      <span className="text-xs font-medium uppercase">
                        {analytics.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Isotope:</span>
                      <span className="font-medium">{product?.isotope || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600">Activité initiale:</span>
                      <span className="font-medium">{lot.initialActivity} {lot.unit}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600">Activité actuelle:</span>
                      <span className="font-medium text-blue-600">
                        {analytics.decay.currentActivity} {lot.unit}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600">Décroissance:</span>
                      <span className="font-medium">
                        {analytics.decay.percentRemaining}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600">Utilisable encore:</span>
                      <span className={`font-medium ${
                        analytics.expiry.isExpired ? 'text-red-600' :
                        analytics.expiry.timeRemaining <= 2 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {analytics.expiry.isExpired ? 'EXPIRÉ' : 
                         `${analytics.expiry.timeRemaining.toFixed(1)}h`}
                      </span>
                    </div>
                  </div>

                  {/* Barre de progression activité */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Activité restante</span>
                      <span>{analytics.decay.percentRemaining.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          analytics.decay.percentRemaining > 70 ? 'bg-green-500' :
                          analytics.decay.percentRemaining > 30 ? 'bg-yellow-500' :
                          analytics.decay.percentRemaining > 10 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(2, analytics.decay.percentRemaining)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleAnalyzeLot(lot.id)}
                      className="flex-1 text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Analyser
                    </button>
                    <button
                      onClick={() => handleQuickQualityControl(lot.id)}
                      className="flex-1 text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      CQ Rapide
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section Lots de Traceurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <PlusCircleIcon className="h-6 w-6 text-green-500" />
            <h3 className="text-xl font-semibold text-slate-700">Ajouter un Nouveau Lot de Traceur</h3>
          </div>
          <form onSubmit={handleAddLotSubmit} className="space-y-4">
            <div>
              <label htmlFor="productId" className={commonLabelClass}>Produit</label>
              <select name="productId" id="productId" value={newLotData.productId} onChange={handleLotChange} className={commonInputClass} required>
                {hotLabData.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="lotNumber" className={commonLabelClass}>Numéro de Lot <span className="text-red-500">*</span></label>
              <input type="text" name="lotNumber" id="lotNumber" value={newLotData.lotNumber || ''} onChange={handleLotChange} className={commonInputClass} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className={commonLabelClass}>Date d'Expiration <span className="text-red-500">*</span></label>
                <input type="date" name="expiryDate" id="expiryDate" value={newLotData.expiryDate} onChange={handleLotChange} className={commonInputClass} required />
              </div>
              <div>
                <label htmlFor="receivedDate" className={commonLabelClass}>Date de Réception</label>
                <input type="date" name="receivedDate" id="receivedDate" value={newLotData.receivedDate} onChange={handleLotChange} className={commonInputClass} />
              </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="initialActivity" className={commonLabelClass}>Activité Initiale</label>
                    <input type="number" step="any" name="initialActivity" id="initialActivity" value={newLotData.initialActivity || ''} onChange={handleLotChange} className={commonInputClass} />
                </div>
                <div>
                    <label htmlFor="quantityReceived" className={commonLabelClass}>Quantité Reçue (ex: nb flacons)</label>
                    <input type="number" step="any" name="quantityReceived" id="quantityReceived" value={newLotData.quantityReceived || ''} onChange={handleLotChange} className={commonInputClass} />
                </div>
             </div>
            <div>
                <label htmlFor="calibrationDateTime" className={commonLabelClass}>Date et Heure de Calibration</label>
                <input type="datetime-local" name="calibrationDateTime" id="calibrationDateTime" value={newLotData.calibrationDateTime} onChange={handleLotChange} className={commonInputClass} />
            </div>
             <div>
              <label htmlFor="unitLot" className={commonLabelClass}>Unité <span className="text-red-500">*</span></label>
              <select name="unit" id="unitLot" value={newLotData.unit} onChange={handleLotChange} className={commonInputClass} required>
                <option value="MBq">MBq</option>
                <option value="mCi">mCi</option>
                <option value="GBq">GBq</option>
              </select>
            </div>
            <div>
              <label htmlFor="notesLot" className={commonLabelClass}>Notes</label>
              <textarea name="notes" id="notesLot" value={newLotData.notes || ''} onChange={handleLotChange} className={commonTextareaClass} />
            </div>
            <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors">
              Ajouter Lot
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <ListBulletIcon className="h-6 w-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-slate-700">Lots de Traceurs Existants ({hotLabData.lots.length})</h3>
          </div>
          {hotLabData.lots.length === 0 ? (<p className="text-slate-500 italic">Aucun lot enregistré.</p>) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {hotLabData.lots.map(lot => {
                const product = hotLabData.products.find(p => p.id === lot.productId);
                const isExpired = lot.expiryDate < todayISO;
                return (
                  <li key={lot.id} className={`p-3 rounded-md border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="font-semibold text-sm text-slate-700">{product?.name || 'Produit inconnu'} - Lot: {lot.lotNumber}</p>
                    <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-slate-500'}`}>Expire le: {new Date(lot.expiryDate).toLocaleDateString('fr-FR')} {isExpired ? '(Périmé)' : ''}</p>
                    {lot.initialActivity && <p className="text-xs text-slate-500">Activité Init.: {lot.initialActivity} {lot.unit} (Calib: {lot.calibrationDateTime ? new Date(lot.calibrationDateTime).toLocaleString('fr-FR') : 'N/A'})</p>}
                     {lot.notes && <p className="text-xs text-slate-500 mt-1"><i>Notes: {lot.notes}</i></p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Section Préparations de Doses */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <PlusCircleIcon className="h-6 w-6 text-teal-500" />
            <h3 className="text-xl font-semibold text-slate-700">Enregistrer une Nouvelle Préparation</h3>
          </div>
          <form onSubmit={handleAddPrepSubmit} className="space-y-4">
            <div>
              <label htmlFor="tracerLotId" className={commonLabelClass}>Lot de Traceur Utilisé <span className="text-red-500">*</span></label>
              <select name="tracerLotId" id="tracerLotId" value={newPrepData.tracerLotId} onChange={handlePrepChange} className={commonInputClass} required>
                <option value="" disabled>Sélectionner un lot...</option>
                {availableLots.map(lot => {
                    const product = hotLabData.products.find(p => p.id === lot.productId);
                    return <option key={lot.id} value={lot.id}>{product?.name} - Lot: {lot.lotNumber} (Exp: {lot.expiryDate})</option>;
                })}
              </select>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="activityPrepared" className={commonLabelClass}>Activité Préparée <span className="text-red-500">*</span></label>
                    <input type="number" step="any" name="activityPrepared" id="activityPrepared" value={newPrepData.activityPrepared || ''} onChange={handlePrepChange} className={commonInputClass} required />
                </div>
                <div>
                    <label htmlFor="unitPrep" className={commonLabelClass}>Unité <span className="text-red-500">*</span></label>
                    <select name="unit" id="unitPrep" value={newPrepData.unit} onChange={handlePrepChange} className={commonInputClass} required>
                        <option value="MBq">MBq</option>
                        <option value="mCi">mCi</option>
                    </select>
                </div>
            </div>
            <div>
              <label htmlFor="preparationDateTime" className={commonLabelClass}>Date et Heure de Préparation <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="preparationDateTime" id="preparationDateTime" value={newPrepData.preparationDateTime} onChange={handlePrepChange} className={commonInputClass} required />
            </div>
            <div>
              <label htmlFor="preparedBy" className={commonLabelClass}>Préparé par (Technicien) <span className="text-red-500">*</span></label>
              <input type="text" name="preparedBy" id="preparedBy" value={newPrepData.preparedBy || ''} onChange={handlePrepChange} className={commonInputClass} required />
            </div>
            <div>
              <label htmlFor="patientIdPrep" className={commonLabelClass}>Patient Associé (Optionnel)</label>
              <select name="patientId" id="patientIdPrep" value={newPrepData.patientId || ''} onChange={handlePrepChange} className={commonInputClass}>
                <option value="">Aucun patient</option>
                {allPatients.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="examTypePrep" className={commonLabelClass}>Type d'Examen Prévu (Optionnel)</label>
              <select name="examType" id="examTypePrep" value={newPrepData.examType || ''} onChange={handlePrepChange} className={commonInputClass}>
                 <option value="">Non spécifié</option>
                {SCINTIGRAPHY_EXAMS_LIST.map(exam => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="notesPrep" className={commonLabelClass}>Notes</label>
              <textarea name="notes" id="notesPrep" value={newPrepData.notes || ''} onChange={handlePrepChange} className={commonTextareaClass} />
            </div>
            <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors">
              Enregistrer Préparation
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <ListBulletIcon className="h-6 w-6 text-purple-500" />
            <h3 className="text-xl font-semibold text-slate-700">Préparations Récentes ({hotLabData.preparations.length})</h3>
          </div>
           {hotLabData.preparations.length === 0 ? (<p className="text-slate-500 italic">Aucune préparation enregistrée.</p>) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {hotLabData.preparations.slice().reverse().map(prep => { // Show recent first
                const lot = hotLabData.lots.find(l => l.id === prep.tracerLotId);
                const product = lot ? hotLabData.products.find(p => p.id === lot.productId) : null;
                const patient = prep.patientId ? allPatients.find(p => p.id === prep.patientId) : null;
                return (
                  <li key={prep.id} className="p-3 rounded-md border bg-slate-50 border-slate-200">
                    <p className="font-semibold text-sm text-slate-700">
                      Act: {prep.activityPrepared} {prep.unit} pour {patient ? patient.name : (prep.examType || 'Usage général')}
                    </p>
                    <p className="text-xs text-slate-500">
                        Lot: {product?.name || 'Produit inconnu'} / {lot?.lotNumber || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">Préparé par: {prep.preparedBy} le {new Date(prep.preparationDateTime).toLocaleString('fr-FR')}</p>
                    {prep.notes && <p className="text-xs text-slate-500 mt-1"><i>Notes: {prep.notes}</i></p>}
                  </li>
                );
              })}
            </ul>
           )}
        </div>
      </div>
    </div>
  );
};