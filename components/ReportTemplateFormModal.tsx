import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { ReportTemplate, ScintigraphyExam } from '../types';
import { SCINTIGRAPHY_EXAMS_LIST } from '../constants';
import RichTextEditor, { RichTextEditorRef } from './RichTextEditor';

interface ReportTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (template: ReportTemplate | Omit<ReportTemplate, 'id'>) => void;
  initialData?: ReportTemplate | null;
}

export const ReportTemplateFormModal: React.FC<ReportTemplateFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<ReportTemplate>>({ 
      examName: SCINTIGRAPHY_EXAMS_LIST[0], 
      name: '', 
      reportContent: '', 
      conclusionContent: '' 
  });
  
  const reportEditorRef = useRef<RichTextEditorRef>(null);
  const conclusionEditorRef = useRef<RichTextEditorRef>(null);
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
          setFormData(initialData);
      } else {
          setFormData({ 
              examName: SCINTIGRAPHY_EXAMS_LIST[0], 
              name: '', 
              reportContent: '', 
              conclusionContent: '' 
          });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.examName) {
      alert("Le nom de l'examen et le nom du modèle sont obligatoires.");
      return;
    }
    onSubmit({
      ...formData,
      reportContent: reportEditorRef.current?.getHTML() || '',
      conclusionContent: conclusionEditorRef.current?.getHTML() || '',
    } as ReportTemplate | Omit<ReportTemplate, 'id'>);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Modifier' : 'Ajouter'} un Modèle de CR</h3>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type d'examen <span className="text-red-500">*</span></label>
                    <select name="examName" value={formData.examName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        {SCINTIGRAPHY_EXAMS_LIST.map(exam => <option key={exam} value={exam}>{exam}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nom du modèle <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            
            <div className="flex-grow flex flex-col min-h-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du Compte Rendu</label>
                <RichTextEditor ref={reportEditorRef} initialValue={formData.reportContent} onChange={(html) => setFormData(p => ({...p, reportContent: html}))} />
            </div>

            <div className="flex-shrink-0 flex flex-col h-48 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu de la Conclusion</label>
                <RichTextEditor ref={conclusionEditorRef} initialValue={formData.conclusionContent} onChange={(html) => setFormData(p => ({...p, conclusionContent: html}))} />
            </div>
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
