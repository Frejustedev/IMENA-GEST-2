import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Patient } from '../../types';
import { BeakerIcon } from '../icons/BeakerIcon';

// This will contain the fields for the injection details. It will be a union of all possible fields.
type InjectionDetails = {
    [key: string]: any;
};

interface InjectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InjectionDetails) => void;
  patient: Patient;
}

export const InjectionForm: React.FC<InjectionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
}) => {
  const [formData, setFormData] = useState<InjectionDetails>({});
  const [availablePreparations, setAvailablePreparations] = useState<any[]>([]);
  const [selectedPreparation, setSelectedPreparation] = useState<any>(null);

  const requestedExam = patient.roomSpecificData?.DEMANDE?.requestedExam;

  // Charger les préparations disponibles pour ce patient
  const loadPatientPreparations = async () => {
    try {
      const token = localStorage.getItem('imena_access_token');
      if (!token) {
        console.log('❌ Token manquant pour charger préparations');
        return;
      }

      console.log(`🔍 Recherche préparations pour patient: ${patient.id}`);
      
      const response = await fetch(`http://localhost:3001/api/v1/hotlab/preparation-logs?patientId=${patient.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`📡 Réponse API: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Données reçues:', data);
        
        if (data.success) {
          // Filtrer les préparations prêtes pour injection
          const allPreps = data.data || [];
          console.log(`📋 Toutes préparations trouvées: ${allPreps.length}`);
          
          const readyPreps = allPreps.filter((prep: any) => prep.status === 'prepared' || !prep.status);
          console.log(`✅ Préparations prêtes: ${readyPreps.length}`);
          
          setAvailablePreparations(readyPreps);
          
          // Auto-sélectionner la préparation la plus récente
          if (readyPreps.length > 0) {
            const latestPrep = readyPreps[0];
            console.log('🎯 Préparation sélectionnée:', latestPrep);
            setSelectedPreparation(latestPrep);
            setFormData(prev => ({
              ...prev,
              injectedActivity: latestPrep.activity_prepared_mbq,
              tracerLotId: latestPrep.tracer_lot_id,
              preparationId: latestPrep.preparation_id
            }));
          } else {
            console.log('⚠️ Aucune préparation prête trouvée');
          }
        } else {
          console.log('❌ Erreur API:', data.message);
        }
      } else {
        console.log(`❌ Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des préparations:', error);
    }
  };

  // Load initial data when the component mounts or patient changes
  useEffect(() => {
    if (!isOpen) return;
    
    // Charger les préparations du patient
    loadPatientPreparations();
    
    let initialData = {};
    const consultationData = patient.roomSpecificData?.CONSULTATION;
    if (consultationData) {
        switch(requestedExam) {
            case "Scintigraphie Thyroïdienne": initialData = consultationData.thyroidData?.injectionDetails || {}; break;
            case "Scintigraphie Osseuse": initialData = consultationData.boneData?.injectionDetails || {}; break;
            case "Scintigraphie Parathyroïdienne": initialData = consultationData.parathyroidData?.injectionDetails || {}; break;
            case "Scintigraphie Rénale DMSA": initialData = consultationData.renalDMSAData?.injectionDetails || {}; break;
            case "Scintigraphie Rénale DTPA/MAG3": initialData = consultationData.renalDTPAMAG3Data?.injectionDetails || {}; break;
        }
    }
    setFormData(prev => ({ ...prev, ...initialData }));
  }, [isOpen, patient, requestedExam]);


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Mettre à jour le statut de la préparation à "injecté"
    if (selectedPreparation) {
      try {
        await fetch(`http://localhost:3001/api/v1/hotlab/preparation-logs/${selectedPreparation.preparation_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
          },
          body: JSON.stringify({
            status: 'injected',
            injectionTime: formData.injectionTime,
            injectedBy: formData.technician
          })
        });
      } catch (error) {
        console.error('Erreur mise à jour statut préparation:', error);
      }
    }
    
    // Ajouter les données de traçabilité Hot Lab
    const enrichedFormData = {
      ...formData,
      hotLabData: selectedPreparation ? {
        preparationId: selectedPreparation.preparation_id,
        tracerLotId: selectedPreparation.tracer_lot_id,
        tracerName: selectedPreparation.tracer_name,
        isotope: selectedPreparation.isotope,
        batchNumber: selectedPreparation.batch_number,
        preparedBy: selectedPreparation.performed_by_name,
        preparationTime: selectedPreparation.preparation_time
      } : null
    };
    
    onSubmit(enrichedFormData);
  };

  if (!isOpen) return null;

  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";

  // Section préparations Hot Lab
  const renderHotLabSection = () => (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
        🧪 Préparations Hot Lab pour {patient.name}
      </h4>
      
      {availablePreparations.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-orange-600 font-medium">⚠️ Aucune préparation prête pour {patient.name}</p>
          <p className="text-sm text-orange-500 mt-1">
            Patient ID: {patient.id} - Veuillez préparer la dose en Hot Lab avant injection
          </p>
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
            💡 Workflow: Hot Lab → Gestion Préparations → Sélectionner ce patient → Créer préparation
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-2">Préparation à injecter :</label>
          <select
            value={selectedPreparation?.preparation_id || ''}
            onChange={(e) => {
              const prep = availablePreparations.find(p => p.preparation_id === e.target.value);
              setSelectedPreparation(prep);
              if (prep) {
                setFormData(prev => ({
                  ...prev,
                  injectedActivity: prep.activity_prepared_mbq,
                  tracerName: prep.tracer_name,
                  lotNumber: prep.batch_number,
                  preparationId: prep.preparation_id,
                  volumeInjected: prep.volume_ml || 5
                }));
              }
            }}
            className="w-full px-3 py-2 bg-white text-slate-900 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {availablePreparations.map(prep => (
              <option key={prep.preparation_id} value={prep.preparation_id}>
                {prep.tracer_name} - {prep.activity_prepared_mbq} MBq - Préparé à {new Date(prep.preparation_time).toLocaleTimeString('fr-FR')}
              </option>
            ))}
          </select>
          
          {selectedPreparation && (
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Traceur :</span> {selectedPreparation.tracer_name}
              </div>
              <div>
                <span className="font-medium text-blue-700">Isotope :</span> {selectedPreparation.isotope}
              </div>
              <div>
                <span className="font-medium text-blue-700">Activité :</span> {selectedPreparation.activity_prepared_mbq} MBq
              </div>
              <div>
                <span className="font-medium text-blue-700">Préparé par :</span> {selectedPreparation.performed_by_name}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderFormFields = () => {
      // Common fields avec intégration Hot Lab
      const commonFields = (
          <>
              {renderHotLabSection()}
              <div><label className={commonLabelClass}>Heure d'injection</label><input type="time" name="injectionTime" value={formData.injectionTime || new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})} onChange={handleInputChange} className={commonInputClass} required/></div>
              <div><label className={commonLabelClass}>Activité injectée (MBq)</label><input type="number" step="0.1" name="injectedActivity" value={formData.injectedActivity || ''} onChange={handleInputChange} className={commonInputClass} required/></div>
              <div><label className={commonLabelClass}>Volume injecté (ml)</label><input type="number" step="0.1" name="volumeInjected" value={formData.volumeInjected || '5'} onChange={handleInputChange} className={commonInputClass}/></div>
              <div><label className={commonLabelClass}>Infirmier / Technicien</label><input type="text" name="technician" value={formData.technician || ''} onChange={handleInputChange} className={commonInputClass}/></div>
              <div><label className={commonLabelClass}>Point d'injection</label><input type="text" name={ requestedExam === "Scintigraphie Thyroïdienne" ? "injectionSite" : "injectionPoint"} value={formData.injectionSite || formData.injectionPoint || 'Veine antécubitale droite'} onChange={handleInputChange} className={commonInputClass}/></div>
              {selectedPreparation && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-700">
                    ✅ <strong>Traçabilité :</strong> Lot {selectedPreparation.batch_number} - Préparation {selectedPreparation.preparation_id}
                  </p>
                </div>
              )}
          </>
      );
      
      // Formulaire STANDARDISÉ pour TOUS les examens - plus de switch
      return (
        <div className="space-y-6">
          {/* Section Hot Lab intégrée */}
          {renderHotLabSection()}
          
          {/* Informations d'injection standardisées */}
          <div className="bg-white p-4 border border-slate-200 rounded-lg">
            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              💉 Injection - {requestedExam}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={commonLabelClass}>
                  Heure d'injection <span className="text-red-500">*</span>
                </label>
                <input 
                  type="time" 
                  name="injectionTime" 
                  value={formData.injectionTime || new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})} 
                  onChange={handleInputChange} 
                  className={commonInputClass} 
                  required
                />
              </div>
              
              <div>
                <label className={commonLabelClass}>
                  Activité injectée (MBq) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  name="injectedActivity" 
                  value={formData.injectedActivity || ''} 
                  onChange={handleInputChange} 
                  className={commonInputClass} 
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Activité corrigée pour décroissance</p>
              </div>
              
              <div>
                <label className={commonLabelClass}>Volume injecté (ml)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  name="volumeInjected" 
                  value={formData.volumeInjected || '5'} 
                  onChange={handleInputChange} 
                  className={commonInputClass}
                />
              </div>
              
              <div>
                <label className={commonLabelClass}>Point d'injection</label>
                <select 
                  name="injectionPoint" 
                  value={formData.injectionPoint || formData.injectionSite || ''} 
                  onChange={handleInputChange} 
                  className={commonInputClass}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Veine antécubitale droite">Veine antécubitale droite</option>
                  <option value="Veine antécubitale gauche">Veine antécubitale gauche</option>
                  <option value="Veine céphalique droite">Veine céphalique droite</option>
                  <option value="Veine céphalique gauche">Veine céphalique gauche</option>
                  <option value="Voie centrale">Voie centrale</option>
                </select>
              </div>
              
              <div>
                <label className={commonLabelClass}>Infirmier / Technicien</label>
                <select 
                  name="technician" 
                  value={formData.technician || ''} 
                  onChange={handleInputChange} 
                  className={commonInputClass}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Sophie BERNARD">Sophie BERNARD (Technicienne senior)</option>
                  <option value="Marc DUBOIS">Marc DUBOIS (Technicien)</option>
                  <option value="Dr. Catherine MARTIN">Dr. Catherine MARTIN</option>
                </select>
              </div>
            </div>
            
            {/* Notes d'injection */}
            <div className="mt-4">
              <label className={commonLabelClass}>Notes d'injection</label>
              <textarea 
                name="injectionNotes" 
                value={formData.injectionNotes || ''} 
                onChange={handleInputChange} 
                className={`${commonInputClass} min-h-[80px]`}
                placeholder="Observations, difficultés d'injection, réactions patient..."
              />
            </div>
            
            {/* Traçabilité Hot Lab */}
            {selectedPreparation && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <h5 className="font-semibold text-green-700 mb-2">✅ Traçabilité Hot Lab</h5>
                <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                  <div><strong>Lot :</strong> {selectedPreparation.batch_number}</div>
                  <div><strong>Préparation :</strong> {selectedPreparation.preparation_id}</div>
                  <div><strong>Préparé par :</strong> {selectedPreparation.performed_by_name}</div>
                  <div><strong>Heure préparation :</strong> {new Date(selectedPreparation.preparation_time).toLocaleString('fr-FR')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4 bg-white rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <BeakerIcon className="h-6 w-6 text-sky-600"/>
            <span>Enregistrer l'injection: {patient.name}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="p-6 flex-grow overflow-y-auto space-y-4">
                <div className="p-3 bg-sky-100 border border-sky-200 rounded-md text-sm">
                    <p><strong>Examen :</strong> {requestedExam || 'Non spécifié'}</p>
                </div>
                {renderFormFields()}
            </div>
            <div className="p-4 border-t bg-white rounded-b-lg flex justify-end space-x-3 mt-auto">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Valider Injection</button>
            </div>
        </form>
      </div>
    </div>
  );
};