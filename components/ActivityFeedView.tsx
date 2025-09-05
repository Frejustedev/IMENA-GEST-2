
import React from 'react';
import { Patient, PatientHistoryEntry, PeriodOption, Room } from '../types';
import { isDateInPeriod } from '../utils/dateUtils';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';


interface ActivityFeedViewProps {
  allPatients: Patient[];
  selectedPeriod: PeriodOption;
  onViewPatientDetail: (patient: Patient) => void;
  roomsConfig: Room[];
}

interface FormattedHistoryEntry extends PatientHistoryEntry {
  patientId: string;
  patientName: string;
}

export const ActivityFeedView: React.FC<ActivityFeedViewProps> = ({ 
    allPatients, 
    selectedPeriod,
    onViewPatientDetail,
    roomsConfig 
}) => {
  const activityFeed: FormattedHistoryEntry[] = allPatients
    .flatMap(patient => 
      patient.history.map(entry => ({
        ...entry,
        patientId: patient.id,
        patientName: patient.name,
      }))
    )
    .filter(entry => isDateInPeriod(entry.entryDate, selectedPeriod))
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  const getRoomName = (roomId: string) => {
    return roomsConfig.find(r => r.id === roomId)?.name || roomId;
  }

  const periodLabel = selectedPeriod === 'today' ? "Aujourd'hui" 
                    : selectedPeriod === 'thisWeek' ? "Cette Semaine" 
                    : "Ce Mois-ci";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-3">
        <ArchiveBoxIcon className="h-8 w-8 text-sky-600" />
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Flux d'Activités</h2>
            <p className="text-sm text-slate-500">Historique des événements importants pour la période: <span className="font-semibold">{periodLabel}</span></p>
        </div>
      </div>

      {activityFeed.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-xl">
          <ArchiveBoxIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucune activité à afficher</h2>
          <p className="text-gray-500">Il n'y a pas d'activité enregistrée pour la période sélectionnée.</p>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <ul className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {activityFeed.map((entry, index) => (
              <li key={`${entry.patientId}-${index}-${entry.entryDate}`} className="p-3 bg-slate-50 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-grow mb-2 sm:mb-0">
                    <p className="text-sm text-slate-700">
                      <button 
                        onClick={() => {
                            const patient = allPatients.find(p => p.id === entry.patientId);
                            if (patient) onViewPatientDetail(patient);
                        }}
                        className="font-semibold text-sky-600 hover:underline focus:outline-none"
                        title={`Voir dossier de ${entry.patientName}`}
                      >
                        {entry.patientName}
                      </button>
                      <span className="text-slate-500"> (ID: {entry.patientId})</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <span className="font-medium">Salle:</span> {getRoomName(entry.roomId)}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <span className="font-medium">Action:</span> {entry.statusMessage}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 text-left sm:text-right flex-shrink-0">
                    <p>{new Date(entry.entryDate).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    {entry.exitDate && isDateInPeriod(entry.exitDate, selectedPeriod) && (
                       <p className="text-rose-500">Sortie: {new Date(entry.exitDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
