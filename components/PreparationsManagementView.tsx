import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { UserIcon } from './icons/UserIcon';
import { apiService } from '../src/services/apiService';

interface PreparationsManagementViewProps {
  hotLabData?: any;
  allPatients?: any[]; // Liste des patients pour liaison
  onAddPreparationLog?: (newPrep: any) => void;
}

export const PreparationsManagementView: React.FC<PreparationsManagementViewProps> = ({ hotLabData, allPatients, onAddPreparationLog }) => {
  const [preparations, setPreparations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableTracers, setAvailableTracers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    tracerLotId: '',
    activityPreparedMbq: 0,
    volumeMl: 5.0, // Volume standard
    preparedBy: '',
    examType: '',
    injectionTime: new Date().toISOString().slice(0, 16),
    qualityChecks: {
      purity: true,
      pH: true,
      sterility: true
    },
    notes: ''
  });

  // Charger les préparations depuis l'API
  const loadPreparations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('imena_access_token');
      if (!token) {
        setError('Token d\'authentification manquant. Reconnectez-vous.');
        return;
      }

      const response = await apiService.get('/hotlab/preparation-logs');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreparations(data.data || []);
          setError(null);
        } else {
          setError(data.message || 'Erreur lors du chargement des préparations');
        }
      } else if (response.status === 401) {
        setError('Session expirée. Reconnectez-vous.');
      } else {
        setError(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préparations:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les traceurs disponibles
  const loadAvailableTracers = async () => {
    try {
      const token = localStorage.getItem('imena_access_token');
      if (!token) return;

      const response = await apiService.get('/hotlab/tracer-lots?status=active');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filtrer les traceurs non expirés
          const activeTracers = (data.data || []).filter((tracer: any) => {
            const expiryTime = new Date(tracer.expiry_time);
            return expiryTime > new Date();
          });
          setAvailableTracers(activeTracers);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des traceurs:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPreparations();
      loadAvailableTracers();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (preparation: any) => {
    setFormData({
      patientId: preparation.patient_id,
      tracerLotId: preparation.tracer_lot_id,
      activityPreparedMbq: preparation.activity_prepared_mbq,
      volumeMl: preparation.volume_ml,
      preparedBy: preparation.performed_by_name || '',
      examType: preparation.exam_type || '',
      injectionTime: preparation.preparation_time ? preparation.preparation_time.slice(0, 16) : new Date().toISOString().slice(0, 16),
      qualityChecks: {
        purity: true,
        pH: true,
        sterility: true
      },
      notes: preparation.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (preparation: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette préparation ?`)) {
      try {
        const response = await apiService.delete(`/hotlab/preparation-logs/${preparation.preparation_id || preparation.id}`);

        if (response.ok) {
          loadPreparations(); // Recharger la liste
        } else {
          alert('Erreur lors de la suppression de la préparation');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la préparation');
      }
    }
  };

  const getStatusColor = (preparation: any) => {
    switch (preparation.status) {
      case 'prepared': return 'text-blue-600 bg-blue-100';
      case 'injected': return 'text-green-600 bg-green-100';
      case 'disposed': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardListIcon className="h-8 w-8 text-sky-600" />
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Gestion des Préparations</h2>
              <p className="text-sm text-slate-500">Logs de préparation des doses pour les patients.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadPreparations}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Recharger
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span>Nouvelle Préparation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Affichage erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h4 className="text-red-800 font-medium">Erreur de chargement</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des préparations */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">
          Logs de Préparation ({preparations.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
            <p className="text-slate-500 mt-2">Chargement...</p>
          </div>
        ) : preparations.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardListIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucune préparation enregistrée</p>
            <p className="text-slate-400 text-sm mt-1">Les préparations seront chargées après connexion</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Traceur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Préparation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Préparé par</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {preparations.map((prep) => (
                  <tr key={prep.preparation_id || prep.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {prep.patient_name || 'Patient non trouvé'}
                          </div>
                          <div className="text-sm text-slate-500">
                            ID: {prep.patient_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{prep.tracer_name}</div>
                      <div className="text-sm text-slate-500">{prep.isotope}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{prep.activity_prepared_mbq} MBq</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(prep.preparation_time)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{prep.performed_by_name || 'Technicien'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prep)}`}>
                        {prep.status || 'Préparé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleEdit(prep)}
                        className="text-indigo-600 hover:text-indigo-900 p-1" 
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(prep)}
                        className="text-red-600 hover:text-red-900 p-1" 
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'ajout de préparation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <form onSubmit={(e) => {
              e.preventDefault();
              
              const newPrep = {
                patientId: formData.patientId || null,
                tracerLotId: formData.tracerLotId,
                preparationTime: new Date().toISOString(),
                activityPreparedMbq: formData.activityPreparedMbq,
                volumeMl: formData.volumeMl,
                preparedBy: formData.preparedBy, // ← AJOUT DU CHAMP MANQUANT
                qualityChecks: JSON.stringify({
                  purity: formData.qualityChecks.purity ? 'Conforme' : 'Non conforme',
                  pH: formData.qualityChecks.pH ? 'Normal' : 'Anormal', 
                  sterility: formData.qualityChecks.sterility ? 'Vérifié' : 'Non vérifié'
                }),
                notes: formData.notes
              };

              // Appel API direct
              apiService.post('/hotlab/preparation-logs', newPrep).then(response => {
                if (response.ok) {
                  setIsModalOpen(false);
                  loadPreparations();
                  setFormData({
                    patientId: '',
                    tracerLotId: '',
                    activityPreparedMbq: 0,
                    volumeMl: 0,
                    preparedBy: '',
                    notes: ''
                  });
                }
              });
            }} className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Nouvelle Préparation</h3>
              
              <div className="space-y-4">
                {/* Sélection du patient */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, patientId: e.target.value }));
                      // Auto-remplir le type d'examen depuis les données du patient
                      const patient = allPatients?.find(p => p.id === e.target.value);
                      if (patient?.roomSpecificData?.DEMANDE?.requestedExam) {
                        setFormData(prev => ({ ...prev, examType: patient.roomSpecificData.DEMANDE.requestedExam }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  >
                    <option value="">Sélectionner un patient...</option>
                    {(allPatients || []).map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} (ID: {patient.id}) - {patient.currentRoomId}
                      </option>
                    ))}
                  </select>
                  {formData.patientId && (
                    <p className="text-xs text-blue-600 mt-1">
                      Patient sélectionné pour préparation radioactive
                    </p>
                  )}
                </div>
                
                {/* Sélection du lot de traceur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lot de traceur <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tracerLotId}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, tracerLotId: e.target.value }));
                      // Auto-calculer l'activité recommandée selon le traceur
                      const tracer = availableTracers.find(t => t.lot_id === e.target.value);
                      if (tracer) {
                        let recommendedActivity = 0;
                        switch (tracer.tracer_name) {
                          case 'HMDP': recommendedActivity = 740; break;
                          case 'Pertechnetate': recommendedActivity = 185; break;
                          case 'MIBI': recommendedActivity = 925; break;
                          case 'DTPA': recommendedActivity = 185; break;
                          default: recommendedActivity = 370;
                        }
                        setFormData(prev => ({ ...prev, activityPreparedMbq: recommendedActivity }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  >
                    <option value="">Sélectionner un lot...</option>
                    {availableTracers.map(tracer => (
                      <option key={tracer.lot_id} value={tracer.lot_id}>
                        {tracer.tracer_name} ({tracer.isotope}) - {tracer.activity_mbq} MBq - Lot: {tracer.batch_number}
                      </option>
                    ))}
                  </select>
                  {formData.tracerLotId && (
                    <p className="text-xs text-green-600 mt-1">
                      Traceur sélectionné et vérifié conforme
                    </p>
                  )}
                </div>

                {/* Type d'examen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'examen</label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData(prev => ({ ...prev, examType: e.target.value }))}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="">Sélectionner un examen...</option>
                    <option value="Scintigraphie Osseuse">Scintigraphie Osseuse</option>
                    <option value="Scintigraphie Thyroïdienne">Scintigraphie Thyroïdienne</option>
                    <option value="Scintigraphie Rénale">Scintigraphie Rénale</option>
                    <option value="Scintigraphie Myocardique">Scintigraphie Myocardique</option>
                    <option value="Scintigraphie Parathyroïdienne">Scintigraphie Parathyroïdienne</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activité préparée (MBq) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.activityPreparedMbq}
                      onChange={(e) => setFormData(prev => ({ ...prev, activityPreparedMbq: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Activité au moment de la préparation</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume (ml)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.volumeMl}
                      onChange={(e) => setFormData(prev => ({ ...prev, volumeMl: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Volume de la seringue</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Préparé par <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.preparedBy}
                      onChange={(e) => setFormData(prev => ({ ...prev, preparedBy: e.target.value }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Sophie BERNARD">Sophie BERNARD (Technicienne senior)</option>
                      <option value="Marc DUBOIS">Marc DUBOIS (Technicien)</option>
                      <option value="Dr. Catherine MARTIN">Dr. Catherine MARTIN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure d'injection prévue</label>
                    <input
                      type="datetime-local"
                      value={formData.injectionTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, injectionTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Contrôles qualité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contrôles qualité</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="purity"
                        checked={formData.qualityChecks.purity}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          qualityChecks: { ...prev.qualityChecks, purity: e.target.checked }
                        }))}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                      <label htmlFor="purity" className="ml-2 text-sm text-gray-900">Pureté ✓</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="pH"
                        checked={formData.qualityChecks.pH}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          qualityChecks: { ...prev.qualityChecks, pH: e.target.checked }
                        }))}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                      <label htmlFor="pH" className="ml-2 text-sm text-gray-900">pH ✓</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sterility"
                        checked={formData.qualityChecks.sterility}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          qualityChecks: { ...prev.qualityChecks, sterility: e.target.checked }
                        }))}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sterility" className="ml-2 text-sm text-gray-900">Stérilité ✓</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes de préparation</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    rows={3}
                    placeholder="Conditions de préparation, observations..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md"
                >
                  Enregistrer Préparation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
