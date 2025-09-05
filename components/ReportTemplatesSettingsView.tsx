import React, { useState, useMemo } from 'react';
import { ReportTemplate, ScintigraphyExam } from '../types';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ReportTemplateFormModal } from './ReportTemplateFormModal';
import { SCINTIGRAPHY_EXAMS_LIST } from '../constants';

interface ReportTemplatesSettingsViewProps {
  reportTemplates: ReportTemplate[];
  onSave: (template: ReportTemplate | Omit<ReportTemplate, 'id'>) => Promise<void>;
  onDelete: (template: ReportTemplate) => void;
}

export const ReportTemplatesSettingsView: React.FC<ReportTemplatesSettingsViewProps> = ({ reportTemplates, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);

  const handleAdd = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };
  
  const handleSave = async (template: ReportTemplate | Omit<ReportTemplate, 'id'>) => {
      await onSave(template);
      setIsModalOpen(false);
  };

  const templatesByExam = useMemo(() => {
    const grouped: { [key in ScintigraphyExam]?: ReportTemplate[] } = {};
    for (const examName of SCINTIGRAPHY_EXAMS_LIST) {
        grouped[examName] = reportTemplates.filter(t => t.examName === examName);
    }
    return grouped;
  }, [reportTemplates]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
            <ClipboardDocumentListIcon className="h-8 w-8 text-sky-600" />
            <div>
            <h2 className="text-3xl font-bold text-slate-800">Paramètres des Modèles de CR</h2>
            <p className="text-sm text-slate-500">Gérez les modèles de comptes rendus pour chaque type d'examen.</p>
            </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-700">Modèles de Comptes Rendus</h3>
          <button onClick={handleAdd} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Ajouter un modèle
          </button>
        </div>
        <div className="space-y-6">
            {Object.entries(templatesByExam).map(([examName, templates]) => (
                <div key={examName}>
                    <h4 className="text-lg font-semibold text-slate-600 border-b pb-2 mb-3">{examName}</h4>
                    {templates && templates.length > 0 ? (
                        <ul className="space-y-2">
                           {templates.map(template => (
                               <li key={template.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border hover:bg-slate-100">
                                   <p className="text-sm font-medium text-slate-800">{template.name}</p>
                                   <div className="space-x-2">
                                       <button onClick={() => handleEdit(template)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Modifier"><PencilIcon className="h-5 w-5" /></button>
                                       <button onClick={() => onDelete(template)} className="text-red-600 hover:text-red-900 p-1" title="Supprimer"><TrashIcon className="h-5 w-5" /></button>
                                   </div>
                               </li>
                           ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500 italic">Aucun modèle pour cet examen.</p>
                    )}
                </div>
            ))}
        </div>
      </div>

      <ReportTemplateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={editingTemplate}
      />
    </div>
  );
};