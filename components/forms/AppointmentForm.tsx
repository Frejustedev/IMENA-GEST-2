import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Patient } from '../../types';
import { CalendarDaysIcon } from '../icons/CalendarDaysIcon';

// FIX: Export interface for use in other components.
export interface AppointmentFormData {
  dateRdv?: string;
  heureRdv?: string;
  consignesSpecifiques?: string;
}

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => void;
  patient: Patient;
  initialData?: AppointmentFormData;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
  initialData,
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>(
    initialData || {
      dateRdv: new Date().toISOString().split('T')[0], // Default to today
      heureRdv: '',
      consignesSpecifiques: '',
    }
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.dateRdv || !formData.heureRdv) {
      alert("Veuillez renseigner la date et l'heure du rendez-vous.");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";
  const commonTextareaClass = `${commonInputClass} min-h-[100px]`;

  const requestedExam = patient.roomSpecificData?.DEMANDE?.requestedExam || 'Non spécifié';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4 bg-white rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <CalendarDaysIcon className="h-6 w-6 text-sky-600"/>
            <span>Planifier Rendez-vous: {patient.name}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="p-6 flex-grow overflow-y-auto space-y-4">
                <div className="p-3 bg-sky-100 border border-sky-200 rounded-md text-sm">
                    <p><strong>Examen demandé :</strong> {requestedExam}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dateRdv" className={commonLabelClass}>Date du Rendez-vous <span className="text-red-500">*</span></label>
                        <input type="date" name="dateRdv" id="dateRdv" value={formData.dateRdv || ''} onChange={handleInputChange} className={commonInputClass} required />
                    </div>
                    <div>
                        <label htmlFor="heureRdv" className={commonLabelClass}>Heure du Rendez-vous <span className="text-red-500">*</span></label>
                        <input type="time" name="heureRdv" id="heureRdv" value={formData.heureRdv || ''} onChange={handleInputChange} className={commonInputClass} required />
                    </div>
                </div>

                <div>
                    <label htmlFor="consignesSpecifiques" className={commonLabelClass}>Consignes Spécifiques</label>
                    <textarea 
                        name="consignesSpecifiques" 
                        id="consignesSpecifiques" 
                        value={formData.consignesSpecifiques || ''} 
                        onChange={handleInputChange} 
                        className={commonTextareaClass}
                        placeholder="Ex: Être à jeun, apporter les anciens examens..."
                    />
                </div>
            </div>

            <div className="p-4 border-t bg-white rounded-b-lg flex justify-end space-x-3 mt-auto">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Enregistrer RDV</button>
            </div>
        </form>
      </div>
    </div>
  );
};