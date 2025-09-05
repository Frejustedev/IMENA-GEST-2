import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface Isotope {
  id?: number;
  isotope_id?: string;
  symbol: string;
  name: string;
  half_life_hours: number;
  decay_constant: number;
  energy_kev: number;
  dose_rate_factor: number;
  usage_type?: string;
  safety_class?: string;
  regulatory_notes?: string;
  active?: boolean;
}

interface IsotopesManagementViewProps {
  onSave?: (isotope: Isotope) => Promise<void>;
  onDelete?: (isotope: Isotope) => Promise<void>;
}

export const IsotopesManagementView: React.FC<IsotopesManagementViewProps> = ({ onSave, onDelete }) => {
  const [isotopes, setIsotopes] = useState<Isotope[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIsotope, setEditingIsotope] = useState<Isotope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Isotope>>({
    symbol: '',
    name: '',
    half_life_hours: 0,
    decay_constant: 0,
    energy_kev: 0,
    dose_rate_factor: 0,
    usage_type: 'diagnostic',
    safety_class: 'medium',
    regulatory_notes: ''
  });

  // Charger les isotopes depuis l'API
  const loadIsotopes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('imena_access_token');
      if (!token) {
        setError('Token d\'authentification manquant. Reconnectez-vous.');
        return;
      }

      const response = await fetch('http://localhost:3001/api/v1/isotopes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsotopes(data.data);
          setError(null);
        } else {
          setError(data.message || 'Erreur lors du chargement des isotopes');
        }
      } else if (response.status === 401) {
        setError('Session expirée. Reconnectez-vous.');
      } else {
        setError(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des isotopes:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Délai pour s'assurer que l'authentification est prête
    const timer = setTimeout(() => {
      loadIsotopes();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleAdd = () => {
    setEditingIsotope(null);
    setFormData({
      symbol: '',
      name: '',
      half_life_hours: 0,
      decay_constant: 0,
      energy_kev: 0,
      dose_rate_factor: 0,
      usage_type: 'diagnostic',
      safety_class: 'medium',
      regulatory_notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (isotope: Isotope) => {
    setEditingIsotope(isotope);
    setFormData({
      symbol: isotope.symbol,
      name: isotope.name,
      half_life_hours: isotope.half_life_hours,
      decay_constant: isotope.decay_constant,
      energy_kev: isotope.energy_kev,
      dose_rate_factor: isotope.dose_rate_factor,
      usage_type: isotope.usage_type,
      safety_class: isotope.safety_class,
      regulatory_notes: isotope.regulatory_notes
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingIsotope ? 'PUT' : 'POST';
      const url = editingIsotope 
        ? `http://localhost:3001/api/v1/isotopes/${editingIsotope.isotope_id || editingIsotope.id}`
        : 'http://localhost:3001/api/v1/isotopes';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
        },
        body: JSON.stringify({
          symbol: formData.symbol,
          name: formData.name,
          halfLifeHours: formData.half_life_hours,
          decayConstant: formData.decay_constant,
          energyKeV: formData.energy_kev,
          doseRateFactor: formData.dose_rate_factor,
          usageType: formData.usage_type,
          safetyClass: formData.safety_class,
          regulatoryNotes: formData.regulatory_notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsModalOpen(false);
          loadIsotopes(); // Recharger la liste
          if (onSave) {
            await onSave(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (isotope: Isotope) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'isotope ${isotope.symbol} ?`)) {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/isotopes/${isotope.isotope_id || isotope.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('imena_access_token')}`
          }
        });

        if (response.ok) {
          loadIsotopes(); // Recharger la liste
          if (onDelete) {
            await onDelete(isotope);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getSafetyClassColor = (safetyClass: string) => {
    switch (safetyClass) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUsageTypeIcon = (usageType: string) => {
    switch (usageType) {
      case 'diagnostic': return '🔍';
      case 'therapeutic': return '💊';
      case 'both': return '🔬';
      default: return '📊';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BeakerIcon className="h-8 w-8 text-sky-600" />
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Gestion des Isotopes</h2>
              <p className="text-sm text-slate-500">Configuration des isotopes radioactifs et leurs propriétés physiques.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadIsotopes}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Recharger
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span>Ajouter Isotope</span>
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
              <button
                onClick={() => {
                  setError(null);
                  loadIsotopes();
                }}
                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des isotopes */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">
          Isotopes Configurés ({isotopes.length})
          {error && <span className="text-red-500 text-sm ml-2">(Erreur de chargement)</span>}
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
            <p className="text-slate-500 mt-2">Chargement...</p>
          </div>
        ) : isotopes.length === 0 ? (
          <div className="text-center py-8">
            <BeakerIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucun isotope configuré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Symbole</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Demi-vie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Énergie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sécurité</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {isotopes.map((isotope) => (
                  <tr key={isotope.isotope_id || isotope.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-900">{isotope.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{isotope.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {isotope.half_life_hours < 24 
                        ? `${isotope.half_life_hours.toFixed(2)}h`
                        : `${(isotope.half_life_hours / 24).toFixed(1)}j`
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{isotope.energy_kev} keV</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center text-sm">
                        {getUsageTypeIcon(isotope.usage_type || 'diagnostic')} {isotope.usage_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSafetyClassColor(isotope.safety_class || 'medium')}`}>
                        {isotope.safety_class}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleEdit(isotope)} 
                        className="text-indigo-600 hover:text-indigo-900 p-1" 
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(isotope)} 
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

      {/* Modal d'ajout/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingIsotope ? 'Modifier' : 'Ajouter'} un Isotope
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Symbole */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symbole <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.symbol || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                    placeholder="ex: Tc-99m, F-18"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex: Technétium-99m"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>

                {/* Demi-vie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Demi-vie (heures) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.half_life_hours || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, half_life_hours: parseFloat(e.target.value) || 0 }))}
                    placeholder="ex: 6.02"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>

                {/* Constante de décroissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Constante de décroissance (h⁻¹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.decay_constant || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, decay_constant: parseFloat(e.target.value) || 0 }))}
                    placeholder="ex: 0.1151"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>

                {/* Énergie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Énergie (keV) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.energy_kev || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, energy_kev: parseFloat(e.target.value) || 0 }))}
                    placeholder="ex: 140"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>

                {/* Facteur de dose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facteur de dose (mSv/h/GBq à 1m) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.dose_rate_factor || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dose_rate_factor: parseFloat(e.target.value) || 0 }))}
                    placeholder="ex: 0.0017"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>

                {/* Type d'usage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'usage</label>
                  <select
                    value={formData.usage_type || 'diagnostic'}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="diagnostic">Diagnostic</option>
                    <option value="therapeutic">Thérapeutique</option>
                    <option value="both">Diagnostic et Thérapeutique</option>
                  </select>
                </div>

                {/* Classe de sécurité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe de sécurité</label>
                  <select
                    value={formData.safety_class || 'medium'}
                    onChange={(e) => setFormData(prev => ({ ...prev, safety_class: e.target.value }))}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                  </select>
                </div>
              </div>

              {/* Notes réglementaires */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes réglementaires</label>
                <textarea
                  value={formData.regulatory_notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, regulatory_notes: e.target.value }))}
                  placeholder="Notes sur la réglementation, précautions spéciales..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* Aide aux calculs */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Aide aux calculs</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Constante de décroissance :</strong> λ = ln(2) / t₁/₂ = 0.693 / {formData.half_life_hours || 'demi-vie'}</p>
                  <p><strong>Résultat calculé :</strong> {formData.half_life_hours ? (0.693 / formData.half_life_hours).toFixed(4) : 'N/A'} h⁻¹</p>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors"
                >
                  {editingIsotope ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
