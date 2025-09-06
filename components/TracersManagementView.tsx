import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { apiService } from '../src/services/apiService';

interface TracersManagementViewProps {
  hotLabData?: any;
  onAddTracerLot?: (newLot: any) => void;
}

export const TracersManagementView: React.FC<TracersManagementViewProps> = ({ hotLabData, onAddTracerLot }) => {
  const [tracers, setTracers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTracer, setEditingTracer] = useState<any>(null);
  const [formData, setFormData] = useState({
    tracerName: '',
    isotope: 'Tc-99m',
    activityMbq: 0,
    calibrationTime: new Date().toISOString().slice(0, 16),
    expiryTime: new Date(Date.now() + 24*60*60*1000).toISOString().slice(0, 16),
    supplier: 'CIS bio international',
    batchNumber: '',
    qualityControlPassed: true,
    notes: ''
  });

  // Charger les traceurs depuis l'API
  const loadTracers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('imena_access_token');
      if (!token) {
        setError('Token d\'authentification manquant. Reconnectez-vous.');
        return;
      }

      const response = await apiService.get('/hotlab/tracer-lots');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTracers(data.data || []);
          setError(null);
        } else {
          setError(data.message || 'Erreur lors du chargement des traceurs');
        }
      } else if (response.status === 401) {
        setError('Session expirée. Reconnectez-vous.');
      } else {
        setError(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des traceurs:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTracers();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (tracer: any) => {
    setEditingTracer(tracer);
    setFormData({
      tracerName: tracer.tracer_name,
      isotope: tracer.isotope,
      activityMbq: tracer.activity_mbq,
      calibrationTime: tracer.calibration_time ? tracer.calibration_time.slice(0, 16) : new Date().toISOString().slice(0, 16),
      expiryTime: tracer.expiry_time ? tracer.expiry_time.slice(0, 16) : new Date().toISOString().slice(0, 16),
      supplier: tracer.supplier || 'CIS bio international',
      batchNumber: tracer.batch_number,
      qualityControlPassed: tracer.quality_control_passed !== false,
      notes: tracer.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (tracer: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le lot ${tracer.batch_number} ?`)) {
      try {
        const response = await apiService.delete(`/hotlab/tracer-lots/${tracer.lot_id || tracer.id}`);

        if (response.ok) {
          loadTracers(); // Recharger la liste
        } else {
          alert('Erreur lors de la suppression du traceur');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du traceur');
      }
    }
  };

  const handleAdd = () => {
    setEditingTracer(null);
    setFormData({
      tracerName: '',
      isotope: 'Tc-99m',
      activityMbq: 0,
      calibrationTime: new Date().toISOString().slice(0, 16),
      expiryTime: new Date(Date.now() + 24*60*60*1000).toISOString().slice(0, 16),
      supplier: 'CIS bio international',
      batchNumber: '',
      qualityControlPassed: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const getStatusColor = (tracer: any) => {
    const now = new Date();
    const expiry = new Date(tracer.expiry_time);
    
    if (expiry < now) return 'text-red-600 bg-red-100';
    if (expiry.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusLabel = (tracer: any) => {
    const now = new Date();
    const expiry = new Date(tracer.expiry_time);
    
    if (expiry < now) return 'Expiré';
    if (expiry.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'Expire bientôt';
    return 'Actif';
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
            <BeakerIcon className="h-8 w-8 text-sky-600" />
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Gestion des Traceurs</h2>
              <p className="text-sm text-slate-500">Lots de traceurs radioactifs et gestion des stocks.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadTracers}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Recharger
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span>Ajouter Traceur</span>
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

      {/* Liste des traceurs */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">
          Lots de Traceurs ({tracers.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
            <p className="text-slate-500 mt-2">Chargement...</p>
          </div>
        ) : tracers.length === 0 ? (
          <div className="text-center py-8">
            <BeakerIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucun traceur configuré</p>
            <p className="text-slate-400 text-sm mt-1">Les traceurs seront chargés après connexion</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Traceur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Isotope</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Calibration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expiration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {tracers.map((tracer) => (
                  <tr key={tracer.lot_id || tracer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BeakerIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{tracer.tracer_name}</div>
                          <div className="text-sm text-slate-500">Lot: {tracer.batch_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tracer.isotope}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tracer.activity_mbq} MBq</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(tracer.calibration_time)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(tracer.expiry_time)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tracer)}`}>
                        {getStatusLabel(tracer)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleEdit(tracer)}
                        className="text-indigo-600 hover:text-indigo-900 p-1" 
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(tracer)}
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

      {/* Modal d'ajout de traceur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              try {
                const lotData = {
                  tracerName: formData.tracerName,
                  isotope: formData.isotope,
                  activityMbq: formData.activityMbq,
                  calibrationTime: formData.calibrationTime,
                  expiryTime: formData.expiryTime,
                  supplier: formData.supplier,
                  batchNumber: formData.batchNumber
                };

                const response = editingTracer 
                  ? await apiService.put(`/hotlab/tracer-lots/${editingTracer.lot_id || editingTracer.id}`, lotData)
                  : await apiService.post('/hotlab/tracer-lots', lotData);

                if (response.ok) {
                  setIsModalOpen(false);
                  setEditingTracer(null);
                  loadTracers();
                  alert(`✅ Traceur ${editingTracer ? 'modifié' : 'ajouté'} avec succès !`);
                } else {
                  const errorData = await response.json();
                  alert(`❌ Erreur: ${errorData.message || 'Erreur inconnue'}`);
                }
              } catch (error) {
                console.error('Erreur:', error);
                alert('❌ Erreur de connexion au serveur');
              }
            }} className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingTracer ? 'Modifier le Traceur' : 'Ajouter un Nouveau Traceur'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du traceur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tracerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, tracerName: e.target.value }))}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    placeholder="ex: HMDP, MIBI, Pertechnetate"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Isotope</label>
                    <select
                      value={formData.isotope}
                      onChange={(e) => setFormData(prev => ({ ...prev, isotope: e.target.value }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value="Tc-99m">Tc-99m (6h)</option>
                      <option value="F-18">F-18 (1.8h)</option>
                      <option value="I-131">I-131 (8j)</option>
                      <option value="Ga-68">Ga-68 (1.1h)</option>
                      <option value="In-111">In-111 (2.8j)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activité (MBq) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.activityMbq}
                      onChange={(e) => setFormData(prev => ({ ...prev, activityMbq: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de lot <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                      placeholder="ex: LOT240115"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                      placeholder="ex: CIS bio international"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date/Heure calibration</label>
                    <input
                      type="datetime-local"
                      value={formData.calibrationTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, calibrationTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date/Heure expiration</label>
                    <input
                      type="datetime-local"
                      value={formData.expiryTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    rows={3}
                    placeholder="Notes sur le lot, conditions de stockage..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="qualityControl"
                    checked={formData.qualityControlPassed}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualityControlPassed: e.target.checked }))}
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                  />
                  <label htmlFor="qualityControl" className="ml-2 block text-sm text-gray-900">
                    Contrôle qualité passé
                  </label>
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
                  {editingTracer ? 'Modifier Traceur' : 'Ajouter Traceur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
