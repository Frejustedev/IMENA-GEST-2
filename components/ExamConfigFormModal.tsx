import React, { useState, FormEvent, useEffect } from 'react';
import { ExamConfiguration, ConfigurableField, ConfigurableFieldType } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface ExamConfigFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ExamConfiguration | Omit<ExamConfiguration, 'id'>) => void;
  initialData?: ExamConfiguration | null;
}

type ConfigTab = 'request' | 'consultation' | 'report';

export const ExamConfigFormModal: React.FC<ExamConfigFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [config, setConfig] = useState<Partial<ExamConfiguration>>({ name: '', fields: { request: [], consultation: [], report: [] } });
  const [activeTab, setActiveTab] = useState<ConfigTab>('request');
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      const initialFields = initialData?.fields || { request: [], consultation: [], report: [] };
      // Deep copy to prevent state mutation issues
      setConfig(initialData ? { ...JSON.parse(JSON.stringify(initialData)), fields: initialFields } : { name: '', fields: { request: [], consultation: [], report: [] } });
      setActiveTab('request');
    }
  }, [isOpen, initialData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, name: e.target.value }));
  };

  const handleFieldChange = (index: number, fieldData: Partial<ConfigurableField>) => {
    setConfig(prev => {
      const newFields = [...(prev.fields?.[activeTab] || [])];
      newFields[index] = { ...newFields[index], ...fieldData };
      return { 
        ...prev, 
        fields: {
          ...prev.fields,
          [activeTab]: newFields,
        }
      };
    });
  };

  const addField = () => {
    const newField: ConfigurableField = { id: `field_${Date.now()}`, label: '', type: 'text', options: [] };
    setConfig(prev => ({ 
        ...prev, 
        fields: {
            ...prev.fields,
            [activeTab]: [...(prev.fields?.[activeTab] || []), newField]
        }
    }));
  };

  const removeField = (index: number) => {
    setConfig(prev => ({ 
        ...prev, 
        fields: {
            ...prev.fields,
            [activeTab]: (prev.fields?.[activeTab] || []).filter((_, i) => i !== index) 
        }
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!config.name) {
      alert("Le nom de l'examen est obligatoire.");
      return;
    }
    onSubmit(config as ExamConfiguration | Omit<ExamConfiguration, 'id'>);
    onClose();
  };
  
  const TabButton: React.FC<{tabId: ConfigTab, label: string}> = ({tabId, label}) => (
      <button
        type="button"
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
          activeTab === tabId
            ? 'border-b-2 border-sky-500 text-sky-600 bg-white'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {label}
      </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Modifier' : 'Ajouter'} un type d'examen</h3>
             <div>
              <label className="block text-sm font-medium text-gray-700 mt-4">Nom de l'examen <span className="text-red-500">*</span></label>
              <input type="text" value={config.name || ''} onChange={handleNameChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
            </div>
          </div>
           <div className="border-b border-gray-200 bg-slate-50">
            <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                <TabButton tabId="request" label="Demande" />
                <TabButton tabId="consultation" label="Consultation" />
                <TabButton tabId="report" label="Compte Rendu" />
            </nav>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
            <fieldset className="border p-3 rounded-md">
              <legend className="text-md font-semibold px-1">Champs du formulaire pour: <span className="capitalize text-sky-700">{activeTab}</span></legend>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 mt-2">
                {(config.fields?.[activeTab] || []).map((field, index) => (
                  <div key={field.id} className="p-3 bg-slate-50 rounded-md border space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm text-slate-600">Champ {index + 1}</p>
                      <button type="button" onClick={() => removeField(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Libellé</label>
                        <input type="text" value={field.label} onChange={(e) => handleFieldChange(index, { label: e.target.value })} className="mt-1 block w-full text-sm px-2 py-1 border border-gray-300 rounded-md" placeholder="Ex: Indications" required />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Type de champ</label>
                        <select value={field.type} onChange={(e) => handleFieldChange(index, { type: e.target.value as ConfigurableFieldType })} className="mt-1 block w-full text-sm px-2 py-1 border border-gray-300 rounded-md">
                          <option value="text">Texte court</option>
                          <option value="textarea">Zone de texte</option>
                          <option value="select">Liste déroulante</option>
                          <option value="checkbox">Cases à cocher</option>
                        </select>
                      </div>
                    </div>
                    {(field.type === 'select' || field.type === 'checkbox') && (
                      <div>
                        <label className="text-xs text-gray-600">Options (une par ligne)</label>
                        <textarea value={(field.options || []).join('\n')} onChange={(e) => handleFieldChange(index, { options: e.target.value.split('\n') })} className="mt-1 block w-full text-sm px-2 py-1 border border-gray-300 rounded-md" rows={3} placeholder="Option 1\nOption 2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addField} className="mt-3 flex items-center text-sm text-sky-600 hover:text-sky-800">
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Ajouter un champ
              </button>
            </fieldset>
          </div>
          <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md">{isEditing ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};