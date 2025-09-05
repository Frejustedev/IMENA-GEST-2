import React, { useRef } from 'react';
import { Patient, Room, RoomId, PatientHistoryEntry, ExamConfiguration } from '../types'; 
import { ROOMS_CONFIG } from '../constants';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { calculateTimeDiff, formatDuration } from '../utils/delayUtils';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ThyroidScintigraphyDataView } from './forms/ThyroidScintigraphyDataView';
import { BoneScintigraphyDataView } from './forms/BoneScintigraphyDataView';
import { ParathyroidScintigraphyDataView } from './forms/ParathyroidScintigraphyDataView';
import { RenalDMSADataView } from './forms/RenalDMSADataView';
import { RenalDTPAMAG3DataView } from './forms/RenalDTPAMAG3DataView';
import { PrinterIcon } from './icons/PrinterIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';


interface PatientDetailViewProps {
  patient: Patient;
  onCloseDetailView: () => void;
  roomsConfig: Room[];
  onAttachDocument: (patientId: string, file: File) => void;
  examConfigurations: ExamConfiguration[];
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patient: Patient) => void;
}

// Helper function to format field keys for display
const formatFieldKey = (key: string): string => {
  const words = key.replace(/([A-Z])/g, ' $1').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// Helper to find the relevant history entry time
const findTimeFromHistory = (history: PatientHistoryEntry[], roomId: RoomId, type: 'entry' | 'exit', afterTimestamp?: string): string | undefined => {
  const relevantEntries = history.filter(entry => entry.roomId === roomId);
  if (type === 'entry') {
    const firstEntry = relevantEntries
        .filter(e => !afterTimestamp || new Date(e.entryDate) > new Date(afterTimestamp))
        .sort((a,b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())[0];
    return firstEntry?.entryDate;
  } else { // 'exit'
    const lastExit = relevantEntries
        .filter(e => e.exitDate && (!afterTimestamp || new Date(e.exitDate) > new Date(afterTimestamp)))
        .sort((a,b) => new Date(b.exitDate!).getTime() - new Date(a.exitDate!).getTime())[0];
    return lastExit?.exitDate;
  }
};


export const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, onCloseDetailView, roomsConfig, onAttachDocument, examConfigurations, onEditPatient, onDeletePatient }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const patientAgeDisplay = patient.age !== undefined ? ` (${patient.age} ans)` : '';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        onAttachDocument(patient.id, file);
        // Clear the input value to allow selecting the same file again
        event.target.value = '';
    }
  };


  const delaySegments = [
    { startRoom: RoomId.CONSULTATION, endRoom: RoomId.INJECTION, label: "Consultation → Injection" },
    { startRoom: RoomId.INJECTION, endRoom: RoomId.EXAMINATION, label: "Injection → Examen" },
    { startRoom: RoomId.EXAMINATION, endRoom: RoomId.REPORT, label: "Examen → Compte Rendu" },
    { startRoom: RoomId.REPORT, endRoom: RoomId.RETRAIT_CR_SORTIE, label: "Compte Rendu → Retrait CR" },
  ];

  const renderDelays = () => {
    let lastExitTime: string | undefined = undefined;
    return delaySegments.map(segment => {
      const startTime = findTimeFromHistory(patient.history, segment.startRoom, 'exit', lastExitTime);
      if (!startTime) return <div key={segment.label} className="text-xs text-slate-500">{segment.label}: En attente de sortie de {roomsConfig.find(r=>r.id === segment.startRoom)?.name || segment.startRoom}</div>;
      
      lastExitTime = startTime; // Update lastExitTime for the next segment's entry search
      const endTime = findTimeFromHistory(patient.history, segment.endRoom, 'entry', startTime);
      
      if (!endTime) return <div key={segment.label} className="text-xs text-slate-500">{segment.label}: En attente d'entrée à {roomsConfig.find(r=>r.id === segment.endRoom)?.name || segment.endRoom}</div>;

      const diff = calculateTimeDiff(startTime, endTime);
      lastExitTime = endTime; // Next segment's exit should be after this entry if relevant

      return (
        <div key={segment.label} className="flex justify-between text-xs">
          <span className="text-slate-600">{segment.label}:</span>
          <span className="font-medium text-sky-700">{diff !== null ? formatDuration(diff) : 'N/A'}</span>
        </div>
      );
    });
  };

  const timelineEntries = [...patient.history].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  const consultationData = patient.roomSpecificData?.[RoomId.CONSULTATION];
  const thyroidData = consultationData?.thyroidData;
  const boneData = consultationData?.boneData;
  const parathyroidData = consultationData?.parathyroidData;
  const renalDMSAData = consultationData?.renalDMSAData;
  const renalDTPAMAG3Data = consultationData?.renalDTPAMAG3Data;


  const renderSpecializedData = () => {
    if (thyroidData) return <ThyroidScintigraphyDataView data={thyroidData} />;
    if (boneData) return <BoneScintigraphyDataView data={boneData} />;
    if (parathyroidData) return <ParathyroidScintigraphyDataView data={parathyroidData} />;
    if (renalDMSAData) return <RenalDMSADataView data={renalDMSAData} />;
    if (renalDTPAMAG3Data) return <RenalDTPAMAG3DataView data={renalDTPAMAG3Data} />;
    return null; // No specialized data to render
  };
  const specializedDataComponent = renderSpecializedData();

  const renderCustomFields = (roomId: RoomId) => {
    const roomData = patient.roomSpecificData?.[roomId];
    if (!roomData) return null;

    const examConfig = examConfigurations.find(c => c.name === patient.roomSpecificData?.[RoomId.REQUEST]?.requestedExam);
    const customFields = (roomData as any).customFields;
    
    let fieldDefinitions: any[] = [];
    if (examConfig) {
        if(roomId === RoomId.REQUEST) fieldDefinitions = examConfig.fields.request;
        else if (roomId === RoomId.CONSULTATION) fieldDefinitions = examConfig.fields.consultation;
        else if (roomId === RoomId.REPORT) fieldDefinitions = examConfig.fields.report;
    }

    if (!examConfig || !customFields || Object.keys(customFields).length === 0) return null;
      
    return (
        <div className="mt-2">
            <h5 className="text-sm font-semibold text-slate-700 mb-1 border-t pt-2">Champs personnalisés</h5>
            <dl className="space-y-1 text-xs text-slate-600">
            {fieldDefinitions.map(field => {
                    const value = customFields[field.id];
                    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                        return null;
                    }
                    const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                    return (
                        <div key={field.id}>
                            <dt className="font-medium text-slate-500">{field.label}:</dt>
                            <dd className="ml-2 whitespace-pre-wrap">{displayValue}</dd>
                        </div>
                    );
            })}
            </dl>
        </div>
    );
  };
  
  const renderStandardFields = (roomId: RoomId) => {
      const roomData = patient.roomSpecificData?.[roomId];
      if (!roomData) return null;

      const fieldsToShow = Object.entries(roomData as Record<string, any>).filter(([key, value]) => {
          return value !== null && value !== undefined && value !== '' && typeof value !== 'object' && key !== 'customFields';
      });

      if (fieldsToShow.length === 0) return null;

      return (
         <dl className="space-y-1 text-xs text-slate-600">
          {fieldsToShow.map(([key, value]) => (
              <div key={key}>
                <dt className="font-medium text-slate-500">{formatFieldKey(key)}:</dt>
                <dd className="ml-2 whitespace-pre-wrap">{String(value)}</dd>
              </div>
            ))}
        </dl>
      )
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl animate-fadeIn printable-content">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="h-12 w-12 text-sky-600" />
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{patient.name}</h2>
            <p className="text-sm text-slate-500">ID: {patient.id} - Né(e) le: {patient.dateOfBirth}{patientAgeDisplay}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 no-print">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm transition-colors flex items-center"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Imprimer le dossier
            </button>
            {onEditPatient && (
              <button
                onClick={() => onEditPatient(patient)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm transition-colors flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier Patient
              </button>
            )}
            {onDeletePatient && (
              <button
                onClick={() => {
                  if (confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.name} ?\n\nCette action est irréversible.`)) {
                    onDeletePatient(patient);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm transition-colors flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Supprimer Patient
              </button>
            )}
            <button
              onClick={onCloseDetailView}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm transition-colors"
            >
              &larr; Retour
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg shadow-inner">
          <h3 className="text-lg font-semibold text-slate-700 mb-2 border-b pb-1">Informations Générales</h3>
          <dl className="space-y-1 text-sm text-slate-600">
            {patient.address && <div><dt className="font-medium text-slate-500 inline">Adresse: </dt><dd className="inline ml-2">{patient.address}</dd></div>}
            {patient.phone && <div><dt className="font-medium text-slate-500 inline">Téléphone: </dt><dd className="inline ml-2">{patient.phone}</dd></div>}
            {patient.email && <div><dt className="font-medium text-slate-500 inline">Email: </dt><dd className="inline ml-2">{patient.email}</dd></div>}
            {patient.referringEntity && (
              <div>
                <dt className="font-medium text-slate-500 inline">Référant: </dt>
                <dd className="inline ml-2">
                  {patient.referringEntity.name} ({patient.referringEntity.type})
                  {patient.referringEntity.contactNumber && ` - Tél: ${patient.referringEntity.contactNumber}`}
                  {patient.referringEntity.contactEmail && ` - Mail: ${patient.referringEntity.contactEmail}`}
                </dd>
              </div>
            )}
            <div><dt className="font-medium text-slate-500 inline">Patient Créé le: </dt><dd className="inline ml-2">{new Date(patient.creationDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</dd></div>
             {patient.roomSpecificData?.[RoomId.REQUEST]?.requestedExam && <div><dt className="font-medium text-slate-500 inline">Examen Demandé: </dt><dd className="inline ml-2 font-semibold">{patient.roomSpecificData[RoomId.REQUEST].requestedExam}</dd></div>}
          </dl>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg shadow-inner">
          <h3 className="text-lg font-semibold text-slate-700 mb-2 border-b pb-1">Statut Actuel</h3>
           <dl className="space-y-1 text-sm text-slate-600">
            <div><dt className="font-medium text-slate-500">Salle Actuelle:</dt><dd className="ml-2 font-semibold text-sky-700">{ROOMS_CONFIG.find(r => r.id === patient.currentRoomId)?.name || patient.currentRoomId}</dd></div>
            <div><dt className="font-medium text-slate-500">Statut dans la Salle:</dt><dd className="ml-2">{patient.statusInRoom}</dd></div>
          </dl>
          <h3 className="text-lg font-semibold text-slate-700 mt-3 mb-2 border-b pb-1">Délais du Parcours</h3>
          <div className="space-y-1">
            {renderDelays()}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Documents Attachés</h3>
        <div className="bg-slate-50 p-4 rounded-lg shadow-inner">
            <ul className="space-y-2">
                {(patient.documents || []).map(doc => (
                    <li key={doc.id} className="flex items-center justify-between p-2 bg-white rounded-md border">
                        <div className="flex items-center space-x-2">
                            <DocumentDuplicateIcon className="h-5 w-5 text-slate-500"/>
                            <a href={doc.dataUrl} download={doc.name} className="text-sm font-medium text-sky-600 hover:underline" title="Télécharger le document">
                                {doc.name}
                            </a>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</span>
                    </li>
                ))}
            </ul>
            {(!patient.documents || patient.documents.length === 0) && (
                <p className="text-sm text-slate-500 italic text-center">Aucun document attaché.</p>
            )}
            <div className="mt-4 text-center no-print">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-md text-sm transition-colors duration-150 shadow-sm"
                >
                    <PaperClipIcon className="h-5 w-5 mr-2" />
                    Attacher un fichier
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print-break-before">
        <div>
            <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Frise Chronologique du Parcours</h3>
            {timelineEntries.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Aucun historique disponible.</p>
            ) : (
                <div className="relative pl-4 border-l-2 border-slate-200">
                {timelineEntries.map((entry, index) => {
                    const room = roomsConfig.find(r => r.id === entry.roomId);
                    const Icon = room ? room.icon : DocumentTextIcon;

                    return (
                    <div key={index} className="mb-8 relative last:mb-0 print:break-inside-avoid">
                        <div className="absolute -left-[23px] top-1 flex items-center justify-center bg-white">
                        <span className="h-10 w-10 rounded-full bg-sky-500 text-white flex items-center justify-center ring-4 ring-white">
                            <Icon className="h-5 w-5" />
                        </span>
                        </div>
                        <div className="ml-8">
                        <p className="font-semibold text-md text-slate-800">{room?.name || entry.roomId}</p>
                        <p className="text-sm text-slate-600">{entry.statusMessage}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {new Date(entry.entryDate).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                            {entry.exitDate && ` → ${new Date(entry.exitDate).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`}
                        </p>
                        </div>
                    </div>
                    );
                })}
                </div>
            )}
        </div>

        <div>
            <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Données Spécifiques par Salle</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 print:max-h-full print:overflow-visible">
                {specializedDataComponent && (
                    <div className="p-4 bg-slate-100 rounded-lg shadow-inner print:break-inside-avoid">
                        <h4 className="text-md font-semibold text-gray-500 mb-2">Données cliniques (Ancien format)</h4>
                        {specializedDataComponent}
                    </div>
                )}

                {roomsConfig.map(room => {
                  const roomData = patient.roomSpecificData?.[room.id];
                  if (!roomData || Object.keys(roomData).length === 0) return null;

                  if (room.id === RoomId.REPORT) {
                      const { texteCompteRendu, conclusionCr } = roomData as { texteCompteRendu?: string; conclusionCr?: string; };
                      return (
                           <div key={room.id} className="p-4 bg-slate-50 rounded-lg shadow-inner print:break-inside-avoid">
                              <h4 className="text-md font-semibold text-sky-600 mb-2">{room.name}</h4>
                              {texteCompteRendu && (
                                  <div>
                                      <dt className="font-medium text-slate-500 text-sm">Texte du Compte Rendu:</dt>
                                      <div className="prose prose-sm max-w-none mt-1" dangerouslySetInnerHTML={{ __html: texteCompteRendu }} />
                                  </div>
                              )}
                              {conclusionCr && (
                                   <div className="mt-2">
                                      <dt className="font-medium text-slate-500 text-sm">Conclusion:</dt>
                                      <div className="prose prose-sm max-w-none mt-1" dangerouslySetInnerHTML={{ __html: conclusionCr }} />
                                  </div>
                              )}
                              {renderCustomFields(room.id as RoomId)}
                          </div>
                      );
                  }
                  
                  return (
                      <div key={room.id} className="p-4 bg-slate-50 rounded-lg shadow-inner print:break-inside-avoid">
                        <h4 className="text-md font-semibold text-sky-600 mb-2">{room.name}</h4>
                        {renderStandardFields(room.id as RoomId)}
                        {renderCustomFields(room.id as RoomId)}
                      </div>
                  );
                })}

                {(!patient.roomSpecificData || Object.values(patient.roomSpecificData).every(data => !data || Object.keys(data).length === 0)) && (
                    <p className="text-sm text-slate-500 italic">Aucune donnée spécifique enregistrée.</p>
                )}
            </div>
        </div>

      </div>

       <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};