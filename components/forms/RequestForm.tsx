
import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Patient, ExamConfiguration } from '../../types';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { DynamicFormField } from './DynamicFormField';

// FIX: Export interface for use in other components.
export interface RequestFormData {
  requestedExam?: string;
  customFields?: { [key: string]: any };
}

interface RequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RequestFormData) => void;
  patient: Patient;
  initialData?: RequestFormData;
  examConfigurations: ExamConfiguration[];
}

export const RequestForm: React.FC<RequestFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
  initialData,
  examConfigurations,
}) => {
  const [formData, setFormData] = useState<RequestFormData>(initialData || {});

  const selectedExamConfig = examConfigurations.find(c => c.name === formData.requestedExam);

  // Reset custom fields if the selected exam changes
  useEffect(() => {
    if (initialData?.requestedExam) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleExamChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      requestedExam: e.target.value,
      customFields: {}, // Reset custom fields on exam change
    });
  };

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
    if (!formData.requestedExam) {
        alert("Veuillez sélectionner un examen demandé.");
        return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4 bg-white rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <ClipboardListIcon className="h-6 w-6 text-sky-600"/>
            <span>Compléter la demande d'examen: {patient.name}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="p-6 flex-grow overflow-y-auto space-y-4">
                <div>
                    <label htmlFor="requestedExam" className={commonLabelClass}>Examen demandé <span className="text-red-500">*</span></label>
                    <select name="requestedExam" id="requestedExam" value={formData.requestedExam || ''} onChange={handleExamChange} className={commonInputClass} required>
                        <option value="" disabled>Sélectionner un examen...</option>
                        {examConfigurations.map(exam => ( <option key={exam.id} value={exam.name}>{exam.name}</option>))}
                    </select>
                </div>

                {selectedExamConfig && (
                    <fieldset className="border p-3 rounded-md space-y-3">
                        <legend className="text-md font-semibold px-1">Détails de l'examen</legend>
                        {/* FIX: Use selectedExamConfig.fields.request.map as fields is an object */}
                        {selectedExamConfig.fields.request.map(field => (
                           <DynamicFormField
                             key={field.id}
                             field={field}
                             value={formData.customFields?.[field.id]}
                             onChange={handleCustomFieldChange}
                           />
                        ))}
                    </fieldset>
                )}

            </div>

            <div className="p-4 border-t bg-white rounded-b-lg flex justify-end space-x-3 mt-auto">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Enregistrer Demande</button>
            </div>
        </form>
      </div>
    </div>
  );
};