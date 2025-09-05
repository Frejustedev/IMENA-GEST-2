import React, { useState, FormEvent } from 'react';
import { Patient, ExamConfiguration } from '../../types';
import { UsersIcon } from '../icons/UsersIcon';
import { DynamicFormField } from './DynamicFormField';

// FIX: Export interface for use in other components.
export interface ConsultationFormData {
  customFields?: { [key: string]: any };
}

interface ConsultationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConsultationFormData) => void;
  patient: Patient;
  initialData?: ConsultationFormData;
  examConfiguration: ExamConfiguration;
}

export const ConsultationForm: React.FC<ConsultationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
  initialData,
  examConfiguration,
}) => {
  const [formData, setFormData] = useState<ConsultationFormData>(initialData || { customFields: {} });

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [fieldId]: value,
      },
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4 bg-white rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <UsersIcon className="h-6 w-6 text-sky-600"/>
            <span>Saisir Données Consultation: {patient.name}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="p-6 flex-grow overflow-y-auto space-y-4">
                <div className="p-3 bg-sky-100 border border-sky-200 rounded-md text-sm">
                    <p><strong>Examen :</strong> {examConfiguration.name}</p>
                </div>

                {examConfiguration.fields.consultation.length > 0 ? (
                    <fieldset className="border p-3 rounded-md space-y-3 bg-white">
                        <legend className="text-md font-semibold px-1">Détails de la consultation</legend>
                        {examConfiguration.fields.consultation.map(field => (
                           <DynamicFormField
                             key={field.id}
                             field={field}
                             value={formData.customFields?.[field.id]}
                             onChange={handleCustomFieldChange}
                           />
                        ))}
                    </fieldset>
                ) : (
                    <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">Aucun champ personnalisé n'est configuré pour la consultation de cet examen.</p>
                        <p className="text-xs text-amber-600 mt-1">Vous pouvez ajouter des champs dans "Paramètres des Examens" ou valider pour continuer.</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-white rounded-b-lg flex justify-end space-x-3 mt-auto">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Terminer Consultation</button>
            </div>
        </form>
      </div>
    </div>
  );
};