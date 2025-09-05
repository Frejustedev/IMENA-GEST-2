import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Patient } from '../../types';
import { CameraIcon } from '../icons/CameraIcon';

// FIX: Export interface for use in other components.
export interface ExaminationFormData {
  parametresExamen?: string;
  commentairesTechnicien?: string;
  qualiteImages?: 'Excellente' | 'Bonne' | 'Moyenne' | 'Médiocre' | '';
}

interface ExaminationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExaminationFormData) => void;
  patient: Patient;
  initialData?: ExaminationFormData;
}

export const ExaminationForm: React.FC<ExaminationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
  initialData,
}) => {
  const [formData, setFormData] = useState<ExaminationFormData>(
    initialData || {
      parametresExamen: '',
      commentairesTechnicien: '',
      qualiteImages: '',
    }
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
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
            <CameraIcon className="h-6 w-6 text-sky-600"/>
            <span>Saisir Données Examen: {patient.name}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="p-6 flex-grow overflow-y-auto space-y-4">
                 <div className="p-3 bg-sky-100 border border-sky-200 rounded-md text-sm">
                    <p><strong>Examen :</strong> {requestedExam}</p>
                </div>
                <div>
                    <label htmlFor="qualiteImages" className={commonLabelClass}>Qualité des Images</label>
                    <select
                        name="qualiteImages"
                        id="qualiteImages"
                        value={formData.qualiteImages || ''}
                        onChange={handleInputChange}
                        className={commonInputClass}
                    >
                        <option value="" disabled>Sélectionner une qualité...</option>
                        <option value="Excellente">Excellente</option>
                        <option value="Bonne">Bonne</option>
                        <option value="Moyenne">Moyenne</option>
                        <option value="Médiocre">Médiocre</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="parametresExamen" className={commonLabelClass}>Paramètres de l'Examen</label>
                    <textarea
                        name="parametresExamen"
                        id="parametresExamen"
                        value={formData.parametresExamen || ''}
                        onChange={handleInputChange}
                        className={commonTextareaClass}
                        placeholder="Ex: Type de collimateur, matrice, temps par image..."
                    />
                </div>
                 <div>
                    <label htmlFor="commentairesTechnicien" className={commonLabelClass}>Commentaires du Technicien</label>
                    <textarea
                        name="commentairesTechnicien"
                        id="commentairesTechnicien"
                        value={formData.commentairesTechnicien || ''}
                        onChange={handleInputChange}
                        className={commonTextareaClass}
                        placeholder="Ex: Patient agité, artéfacts, etc."
                    />
                </div>
            </div>
            <div className="p-4 border-t bg-white rounded-b-lg flex justify-end space-x-3 mt-auto">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Valider Données Examen</button>
            </div>
        </form>
      </div>
    </div>
  );
};