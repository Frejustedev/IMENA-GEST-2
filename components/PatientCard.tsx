

import React, { useState } from 'react';
import { Patient, Room, RoomId, PatientStatusInRoom } from '../types';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ArrowRightCircleIcon } from './icons/ArrowRightCircleIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { ROOMS_CONFIG } from '../constants';
import { formatDuration } from '../utils/delayUtils';

interface PatientCardProps {
  patient: Patient;
  currentRoom: Room;
  onOpenPatientFormModal: (patientId: string, roomId: RoomId) => void;
  onViewPatientDetail: (patient: Patient) => void;
}

// Helper to get dynamic button text and modal title
const getActionDetailsForRoom = (roomId: RoomId) => {
  switch (roomId) {
    case RoomId.REQUEST:
      return { buttonText: "Compléter Demande", formTitle: "Compléter la demande d'examen", submitButtonText: "Enregistrer Demande" };
    case RoomId.APPOINTMENT:
      return { buttonText: "Planifier RDV", formTitle: "Planifier le Rendez-vous", submitButtonText: "Enregistrer RDV" };
    case RoomId.CONSULTATION:
      return { buttonText: "Démarrer Consultation", formTitle: "Saisir Données Consultation", submitButtonText: "Terminer Consultation" };
    case RoomId.INJECTION:
      return { buttonText: "Enregistrer Injection", formTitle: "Saisir Données Injection", submitButtonText: "Valider Injection" };
    case RoomId.EXAMINATION:
      return { buttonText: "Saisir Données Examen", formTitle: "Saisir Données Examen", submitButtonText: "Valider Données Examen" };
    case RoomId.REPORT:
      return { buttonText: "Rédiger CR", formTitle: "Rédiger le Compte Rendu", submitButtonText: "Finaliser Compte Rendu" };
    case RoomId.RETRAIT_CR_SORTIE:
      return { buttonText: "Finaliser Sortie", formTitle: "Enregistrer Retrait CR et Sortie", submitButtonText: "Valider Sortie" };
    default:
      return { buttonText: "Traiter", formTitle: "Formulaire de traitement", submitButtonText: "Soumettre" };
  }
};


export const PatientCard: React.FC<PatientCardProps> = ({ 
    patient, 
    currentRoom, 
    onOpenPatientFormModal, 
    onViewPatientDetail 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const actionDetails = getActionDetailsForRoom(currentRoom.id);
  const canBeProcessed = patient.statusInRoom === PatientStatusInRoom.WAITING && patient.currentRoomId === currentRoom.id;

  const patientAgeDisplay = patient.age !== undefined ? ` (${patient.age} ans)` : '';

  const isWaiting = patient.statusInRoom === PatientStatusInRoom.WAITING;
  let waitTimeMs: number | null = null;
  let waitTimeStr: string = '';
  let borderColorClass = 'border-l-4 border-transparent'; // Default transparent border

  if (isWaiting && patient.currentRoomId === currentRoom.id) {
      const lastEntryInRoom = patient.history
          .filter(h => h.roomId === currentRoom.id && h.statusMessage.toLowerCase().startsWith('entré dans'))
          .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())[0];

      if (lastEntryInRoom) {
          waitTimeMs = new Date().getTime() - new Date(lastEntryInRoom.entryDate).getTime();
          waitTimeStr = formatDuration(waitTimeMs);

          if (waitTimeMs > 7200000) { // > 2 hours is critical
              borderColorClass = 'border-l-4 border-red-500';
          } else if (waitTimeMs > 3600000) { // > 1 hour is warning
              borderColorClass = 'border-l-4 border-yellow-500';
          } else { // < 1 hour is normal
              borderColorClass = 'border-l-4 border-green-500';
          }
      }
  } else if(patient.statusInRoom === PatientStatusInRoom.SEEN) {
      borderColorClass = 'border-l-4 border-slate-300';
  }

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-150 ${borderColorClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="h-10 w-10 text-slate-500 flex-shrink-0" />
          <div className="flex-grow">
            <button
              onClick={() => onViewPatientDetail(patient)}
              className="text-lg font-semibold text-sky-700 hover:text-sky-500 hover:underline focus:outline-none text-left"
              title={`Voir les détails de ${patient.name}`}
            >
              {patient.name}
            </button>
            <p className="text-xs text-slate-500">ID: {patient.id} - Né(e) le: {patient.dateOfBirth}{patientAgeDisplay}</p>
             {currentRoom.id === RoomId.REQUEST && patient.roomSpecificData?.[RoomId.REQUEST]?.requestedExam && (
                <p className="text-xs text-slate-600 mt-0.5">Examen demandé: {patient.roomSpecificData[RoomId.REQUEST]?.requestedExam}</p>
            )}
          </div>
        </div>
        <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-slate-500 hover:text-sky-600 transition-colors flex-shrink-0"
            title={showDetails ? "Masquer détails" : "Afficher détails"}
            aria-expanded={showDetails}
            aria-controls={`patient-details-${patient.id}`}
        >
            {showDetails ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </button>
      </div>

      {showDetails && (
        <div id={`patient-details-${patient.id}`} className="mt-3 pt-3 border-t border-slate-200 space-y-3">
          <div>
            <h5 className="text-sm font-semibold text-slate-700 mb-1">Informations Patient :</h5>
            <div className="text-xs text-slate-600 space-y-0.5">
              {patient.address && <p><strong>Adresse:</strong> {patient.address}</p>}
              {patient.phone && <p><strong>Téléphone:</strong> {patient.phone}</p>}
              {patient.email && <p><strong>Email:</strong> {patient.email}</p>}
              {patient.referringEntity && (
                <p>
                  <strong>Référant:</strong> {patient.referringEntity.name} ({patient.referringEntity.type})
                  {patient.referringEntity.contactNumber && ` - Tél: ${patient.referringEntity.contactNumber}`}
                  {patient.referringEntity.contactEmail && ` - Mail: ${patient.referringEntity.contactEmail}`}
                </p>
              )}
              <p><strong>Créé le:</strong> {new Date(patient.creationDate).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-700 mb-1">Historique du parcours :</h5>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 max-h-32 overflow-y-auto pr-1">
              {patient.history.map((entry) => (
                <li key={`${entry.entryDate}-${entry.roomId}-${entry.statusMessage.slice(0,20)}`}>
                  <strong>{ROOMS_CONFIG.find(r => r.id === entry.roomId)?.name || entry.roomId}</strong>: {entry.statusMessage} 
                  <em> (Le {new Date(entry.entryDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'})})</em>
                  {entry.exitDate && <em> (Sortie: {new Date(entry.exitDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'})})</em>}
                </li>
              ))}
            </ul>
          </div>

           {patient.roomSpecificData && Object.keys(patient.roomSpecificData).length > 0 && (
            <div className="mt-2">
              <h5 className="text-sm font-semibold text-slate-700 mb-1">Données spécifiques aux salles :</h5>
              {Object.entries(patient.roomSpecificData).map(([roomId, data]) => {
                if (!data || Object.keys(data).length === 0) return null;
                const roomName = ROOMS_CONFIG.find(r => r.id === roomId)?.name || roomId;
                return (
                  <div key={roomId} className="text-xs text-slate-600 mb-1">
                    <strong>{roomName}:</strong>
                    <ul className="list-disc list-inside ml-4">
                    {Object.entries(data as Record<string, any>).map(([key, value]) => (
                        value && <li key={key}>{key}: {String(value)}</li>
                    ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
        {patient.statusInRoom === PatientStatusInRoom.WAITING && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800" aria-label={`Statut du patient: En attente`}>
            <InformationCircleIcon className="h-4 w-4 mr-1.5 text-amber-500" aria-hidden="true" />
            En attente {waitTimeStr && `(depuis ${waitTimeStr})`}
          </span>
        )}
         {patient.statusInRoom === PatientStatusInRoom.SEEN && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" aria-label={`Statut du patient: Traité(e)`}>
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-green-500" aria-hidden="true" />
            Traité(e)
          </span>
        )}

        {canBeProcessed && (
          <button
            onClick={() => onOpenPatientFormModal(patient.id, currentRoom.id)}
            className="flex items-center justify-center w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors duration-150 shadow-sm"
            title={actionDetails.formTitle}
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            {actionDetails.buttonText}
          </button>
        )}
      </div>
    </div>
  );
};