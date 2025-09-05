import React, { useState, FormEvent, useRef } from 'react';
import { Patient, RoomId, RequestIndications, ScintigraphyExam, ExamConfiguration, ReportTemplate } from '../../types';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { BoneScintigraphyDataView } from './BoneScintigraphyDataView';
import { ParathyroidScintigraphyDataView } from './ParathyroidScintigraphyDataView';
import { RenalDMSADataView } from './RenalDMSADataView';
import { RenalDTPAMAG3DataView } from './RenalDTPAMAG3DataView';
import { ThyroidScintigraphyDataView } from './ThyroidScintigraphyDataView';
import RichTextEditor, { RichTextEditorRef } from '../RichTextEditor';
import { QUICK_PHRASES } from '../../reportConstants';
import { DynamicFormField } from './DynamicFormField';

// FIX: Export interface for use in other components.
export interface ReportFormData {
  texteCompteRendu?: string;
  conclusionCr?: string;
  customFields?: { [key: string]: any };
}

interface ReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportFormData) => void;
  patient: Patient;
  initialData?: ReportFormData;
  examConfigurations: ExamConfiguration[];
  reportTemplates: ReportTemplate[];
}

// Helper components for the context panel
const ContextSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <h4 className="text-md font-semibold text-slate-700 mb-2 border-b pb-1">{title}</h4>
    <div className="space-y-1 text-sm">{children}</div>
  </div>
);

const ContextItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <p>
      <strong className="text-slate-500 font-medium">{label}:</strong>
      <span className="text-slate-800 ml-2">{value}</span>
    </p>
  );
};

export const ReportForm: React.FC<ReportFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
  initialData,
  examConfigurations,
  reportTemplates,
}) => {
  const [formData, setFormData] = useState<ReportFormData>(initialData || { texteCompteRendu: '', conclusionCr: '', customFields: {} });

  const reportEditorRef = useRef<RichTextEditorRef>(null);
  const conclusionEditorRef = useRef<RichTextEditorRef>(null);
  
  const requestedExam = patient.roomSpecificData?.[RoomId.REQUEST]?.requestedExam;
  const examConfig = examConfigurations.find(c => c.name === requestedExam);
  
  const templatesForExam = requestedExam ? reportTemplates.filter(t => t.examName === requestedExam) : [];
  const phrasesForExam = requestedExam ? QUICK_PHRASES[requestedExam as ScintigraphyExam] : [];

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplateName = e.target.value;
    const template = templatesForExam?.find(t => t.name === selectedTemplateName);
    if (template) {
        reportEditorRef.current?.setContent(template.reportContent);
        conclusionEditorRef.current?.setContent(template.conclusionContent);
        setFormData(prev => ({ ...prev, texteCompteRendu: template.reportContent, conclusionCr: template.conclusionContent }));
    }
  };

  const handleInsertPhrase = (phrase: string) => {
      reportEditorRef.current?.insertHTML(`<span> ${phrase}</span>`);
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
    onSubmit({
      ...formData,
      texteCompteRendu: reportEditorRef.current?.getHTML(),
      conclusionCr: conclusionEditorRef.current?.getHTML(),
    });
  };

  const renderClinicalSummary = () => {
    const consultationData = patient.roomSpecificData?.[RoomId.CONSULTATION];

    switch (requestedExam) {
        case "Scintigraphie Osseuse":
            return consultationData?.boneData ? <BoneScintigraphyDataView data={consultationData.boneData} /> : null;
        case "Scintigraphie Parathyroïdienne":
            return consultationData?.parathyroidData ? <ParathyroidScintigraphyDataView data={consultationData.parathyroidData} /> : null;
        case "Scintigraphie Rénale DMSA":
            return consultationData?.renalDMSAData ? <RenalDMSADataView data={consultationData.renalDMSAData} /> : null;
        case "Scintigraphie Rénale DTPA/MAG3":
            return consultationData?.renalDTPAMAG3Data ? <RenalDTPAMAG3DataView data={consultationData.renalDTPAMAG3Data} /> : null;
        case "Scintigraphie Thyroïdienne":
            return consultationData?.thyroidData ? <ThyroidScintigraphyDataView data={consultationData.thyroidData} /> : null;
        default:
            return <p className="text-xs italic text-slate-500">Aucun résumé clinique spécialisé disponible pour cet examen.</p>;
    }
  };

  if (!isOpen) return null;
  
  const injectionData = patient.roomSpecificData?.[RoomId.INJECTION];
  const examinationData = patient.roomSpecificData?.[RoomId.EXAMINATION];


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="report-form-title">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4 bg-white rounded-t-lg flex-shrink-0">
          <h3 id="report-form-title" className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <DocumentTextIcon className="h-6 w-6 text-sky-600"/>
            <span>Poste de Rédaction de Compte Rendu: {patient.name}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="flex-grow p-6 overflow-hidden grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Panel: Context */}
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-inner overflow-y-auto border">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Résumé du Dossier</h3>
                    <ContextSection title="Patient"><ContextItem label="Nom" value={patient.name} /><ContextItem label="Âge" value={patient.age ? `${patient.age} ans` : 'N/A'} /><ContextItem label="ID" value={patient.id} /></ContextSection>
                    <ContextSection title="Détails de l'Examen"><ContextItem label="Examen demandé" value={requestedExam} /></ContextSection>
                    <ContextSection title="Données Techniques"><ContextItem label="Produit Injecté" value={injectionData?.produitInjecte} /><ContextItem label="Dose" value={injectionData?.dose} /><ContextItem label="Heure d'Injection" value={injectionData?.heureInjection} /><hr className="my-2"/><ContextItem label="Qualité des Images" value={examinationData?.qualiteImages} /><ContextItem label="Commentaires Technicien" value={examinationData?.commentairesTechnicien} /></ContextSection>
                    <ContextSection title="Résumé Clinique">{renderClinicalSummary()}</ContextSection>
                </div>

                {/* Right Panel: Editor */}
                <div className="lg:col-span-3 flex flex-col h-full space-y-4">
                    <div className="flex-shrink-0">
                        <label htmlFor="template-selector" className="block text-sm font-medium text-gray-700">Modèles</label>
                        <select id="template-selector" onChange={handleTemplateChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                            <option value="">Choisir un modèle...</option>
                            {templatesForExam?.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                        </select>
                    </div>

                    {examConfig && examConfig.fields.report.length > 0 && (
                        <fieldset className="border p-3 rounded-md bg-white space-y-3">
                            <legend className="text-md font-semibold px-1">Champs Structurés du CR</legend>
                            {examConfig.fields.report.map(field => (
                                <DynamicFormField
                                    key={field.id}
                                    field={field}
                                    value={formData.customFields?.[field.id]}
                                    onChange={handleCustomFieldChange}
                                />
                            ))}
                        </fieldset>
                    )}

                    <div className="flex-grow flex flex-col min-h-0">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Texte du Compte Rendu</label>
                        <RichTextEditor ref={reportEditorRef} initialValue={formData.texteCompteRendu} onChange={(html) => setFormData(p => ({...p, texteCompteRendu: html}))} />
                    </div>
                    
                    {phrasesForExam && phrasesForExam.length > 0 && (
                        <div className="flex-shrink-0 border p-3 rounded-md bg-white">
                            <p className="text-sm font-medium text-gray-700 mb-2">Phrases Types</p>
                            <div className="flex flex-wrap gap-2">
                                {phrasesForExam.flatMap(group => group.phrases).map((phrase, index) => (
                                    <button key={index} type="button" onClick={() => handleInsertPhrase(phrase)} className="px-2 py-1 bg-sky-100 text-sky-800 text-xs rounded-full hover:bg-sky-200 transition-colors">
                                        {phrase.replace('[LOCALISATION]', '...')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex-shrink-0 flex flex-col h-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion</label>
                        <RichTextEditor ref={conclusionEditorRef} initialValue={formData.conclusionCr} onChange={(html) => setFormData(p => ({...p, conclusionCr: html}))} />
                    </div>
                </div>
            </div>

            <div className="p-4 border-t bg-white rounded-b-lg flex justify-end space-x-3 mt-auto flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Finaliser Compte Rendu</button>
            </div>
        </form>
      </div>
    </div>
  );
};