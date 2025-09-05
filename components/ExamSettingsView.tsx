import React, { useState } from 'react';
import { ExamConfiguration } from '../types';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ExamConfigFormModal } from './ExamConfigFormModal';

interface ExamSettingsViewProps {
  examConfigurations: ExamConfiguration[];
  onSave: (config: ExamConfiguration | Omit<ExamConfiguration, 'id'>) => Promise<void>;
  onDelete: (config: ExamConfiguration) => void;
}

export const ExamSettingsView: React.FC<ExamSettingsViewProps> = ({ examConfigurations, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ExamConfiguration | null>(null);

  const handleAdd = () => {
    setEditingConfig(null);
    setIsModalOpen(true);
  };

  const handleEdit = (config: ExamConfiguration) => {
    setEditingConfig(config);
    setIsModalOpen(true);
  };
  
  const handleSave = async (config: ExamConfiguration | Omit<ExamConfiguration, 'id'>) => {
      await onSave(config);
      setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
            <WrenchScrewdriverIcon className="h-8 w-8 text-sky-600" />
            <div>
            <h2 className="text-3xl font-bold text-slate-800">Paramètres des Examens</h2>
            <p className="text-sm text-slate-500">Configurez les types d'examens et les champs de formulaire associés.</p>
            </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-700">Types d'examens configurés</h3>
          <button onClick={handleAdd} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Ajouter un type d'examen
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom de l'examen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Champs configurés</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {(examConfigurations || []).map(config => {
                // Gestion sécurisée des champs selon le format
                let fieldsCount = 0;
                if (config.fields) {
                  if (Array.isArray(config.fields)) {
                    fieldsCount = config.fields.length;
                  } else if (typeof config.fields === 'object') {
                    const requestFields = config.fields.request?.length || 0;
                    const consultationFields = config.fields.consultation?.length || 0;
                    const reportFields = config.fields.report?.length || 0;
                    fieldsCount = requestFields + consultationFields + reportFields;
                  }
                }

                return (
                  <tr key={config.id || config.config_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{config.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{fieldsCount} champ(s)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleEdit(config)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Modifier"><PencilIcon className="h-5 w-5" /></button>
                      <button onClick={() => onDelete(config)} className="text-red-600 hover:text-red-900 p-1" title="Supprimer"><TrashIcon className="h-5 w-5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ExamConfigFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={editingConfig}
      />
    </div>
  );
};