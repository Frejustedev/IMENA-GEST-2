import React, { useState, useMemo } from 'react';
import { Patient, Room, RoomId, PatientStatusInRoom, PeriodOption } from '../types';
import { PatientCard } from './PatientCard';
import { Pagination } from './Pagination';
import { UsersIcon } from './icons/UsersIcon'; 
import { CheckBadgeIcon } from './icons/CheckBadgeIcon'; 
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { ArrowRightCircleIcon } from './icons/ArrowRightCircleIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon'; 
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { isDateInPeriod } from '../utils/dateUtils'; 
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';

interface RoomViewProps {
  room: Room;
  patientsInRoom: Patient[];
  allPatients: Patient[]; 
  onOpenPatientFormModal: (patientId: string, roomId: RoomId) => void;
  onMovePatient: (patientId: string, targetRoomId: RoomId) => void;
  onOpenCreatePatientModal?: () => void; 
  selectedPeriod: PeriodOption;
  onViewPatientDetail: (patient: Patient) => void;
}

const ITEMS_PER_PAGE = 10;
const ARCHIVE_ITEMS_PER_PAGE = 15;

// Helper to get dynamic statistic label for processed actions
const getProcessedActionLabel = (roomId: RoomId): string => {
  switch (roomId) {
    case RoomId.APPOINTMENT:
      return "RDVs Planifiés";
    case RoomId.CONSULTATION:
      return "Consultations Terminées";
    case RoomId.INJECTION:
      return "Injections Enregistrées";
    case RoomId.EXAMINATION:
      return "Examens Saisis";
    case RoomId.REPORT:
      return "CR Rédigés";
    case RoomId.RETRAIT_CR_SORTIE:
      return "Retraits CR Effectués";
    default:
      return "Actions terminées";
  }
};

export const RoomView: React.FC<RoomViewProps> = ({ 
  room, 
  patientsInRoom, 
  allPatients, 
  onOpenPatientFormModal, 
  onMovePatient,
  onOpenCreatePatientModal,
  selectedPeriod,
  onViewPatientDetail
}) => {
  const [activeTab, setActiveTab] = useState<'waiting' | 'seen' | 'history'>('waiting');
  const [waitingPage, setWaitingPage] = useState(1);
  const [seenPage, setSeenPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'time_asc' | 'alpha_asc'>('time_asc');

  // State for Archive View
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [archiveCurrentPage, setArchiveCurrentPage] = useState(1);

  if (room.id === RoomId.ARCHIVE) {
    const filteredArchivedPatients = useMemo(() => {
        return patientsInRoom.filter(p => 
            p.name.toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(archiveSearchTerm.toLowerCase())
        ).sort((a,b) => {
            const lastEntryA = (a.history && a.history.length > 0) ? a.history[a.history.length-1].entryDate : '0';
            const lastEntryB = (b.history && b.history.length > 0) ? b.history[b.history.length-1].entryDate : '0';
            return new Date(lastEntryB).getTime() - new Date(lastEntryA).getTime();
        });
    }, [patientsInRoom, archiveSearchTerm]);

    const totalPages = Math.ceil(filteredArchivedPatients.length / ARCHIVE_ITEMS_PER_PAGE);
    const paginatedPatients = filteredArchivedPatients.slice(
        (archiveCurrentPage - 1) * ARCHIVE_ITEMS_PER_PAGE,
        archiveCurrentPage * ARCHIVE_ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3 mb-1">
                    <room.icon className="h-8 w-8 text-sky-600" />
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">{room.name}</h2>
                        <p className="text-sm text-slate-500">{room.description}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-700">Dossiers Archivés ({filteredArchivedPatients.length})</h3>
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="search"
                            value={archiveSearchTerm}
                            onChange={(e) => { setArchiveSearchTerm(e.target.value); setArchiveCurrentPage(1); }}
                            placeholder="Rechercher par nom ou ID..."
                            className="block w-full bg-slate-50 border border-slate-300 rounded-md py-2 pl-10 pr-3 text-sm"
                        />
                    </div>
                </div>
                {paginatedPatients.length === 0 ? (
                    <p className="text-slate-500 italic text-center py-8 flex-grow">Aucun dossier archivé trouvé.</p>
                ) : (
                    <div className="space-y-3 overflow-y-auto flex-grow pr-2">
                        {paginatedPatients.map(patient => (
                            <div key={patient.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <UsersIcon className="h-8 w-8 text-slate-400 flex-shrink-0" />
                                    <div>
                                        <button onClick={() => onViewPatientDetail(patient)} className="text-md font-semibold text-sky-700 hover:underline focus:outline-none text-left">
                                            {patient.name}
                                        </button>
                                        <p className="text-xs text-slate-500">ID: {patient.id} - Archivé le: {
                                            (patient.history && patient.history.length > 0) 
                                                ? new Date(patient.history[patient.history.length-1].entryDate).toLocaleDateString('fr-FR')
                                                : 'Date inconnue'
                                        }</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <Pagination
                    currentPage={archiveCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setArchiveCurrentPage}
                />
            </div>
        </div>
    );
  }

  const waitingPatients = useMemo(() => {
    const filtered = patientsInRoom.filter(p => p.statusInRoom === PatientStatusInRoom.WAITING);
    
    return filtered.sort((a, b) => {
        if (sortOrder === 'alpha_asc') {
            return a.name.localeCompare(b.name);
        }
        // Default to 'time_asc'
        else {
            const getEntryDate = (patient: Patient) => {
                if (!patient.history || !Array.isArray(patient.history)) {
                    return new Date(patient.creationDate).getTime();
                }
                const lastEntry = patient.history
                    .filter(h => h.roomId === room.id)
                    .sort((h1, h2) => new Date(h2.entryDate).getTime() - new Date(h1.entryDate).getTime())[0];
                return lastEntry ? new Date(lastEntry.entryDate).getTime() : new Date(patient.creationDate).getTime();
            };
            return getEntryDate(a) - getEntryDate(b);
        }
    });
  }, [patientsInRoom, sortOrder, room.id]);


  // New logic for "seen" tab: show patients who had an action completed in this room during the period.
  const seenPatientIdsInPeriod = new Set<string>();
  allPatients.forEach(patient => {
      // Vérifier que patient.history existe et n'est pas vide
      if (!patient.history || !Array.isArray(patient.history)) {
          return;
      }
      
      const hasCompletedAction = patient.history.some(entry => 
          entry.roomId === room.id &&
          entry.statusMessage &&
          !entry.statusMessage.startsWith('Entré dans') &&
          !entry.statusMessage.startsWith('Patient créé') &&
          isDateInPeriod(entry.entryDate, selectedPeriod)
      );
      if(hasCompletedAction) {
          seenPatientIdsInPeriod.add(patient.id);
      }
  });
  const seenPatients = allPatients
    .filter(p => seenPatientIdsInPeriod.has(p.id))
    .sort((a,b) => {
        const lastActionA = (a.history && Array.isArray(a.history)) 
            ? a.history.filter(h => h.roomId === room.id && h.statusMessage && !h.statusMessage.startsWith('Entré dans')).pop()?.entryDate || '0'
            : '0';
        const lastActionB = (b.history && Array.isArray(b.history))
            ? b.history.filter(h => h.roomId === room.id && h.statusMessage && !h.statusMessage.startsWith('Entré dans')).pop()?.entryDate || '0'
            : '0';
        return new Date(lastActionB).getTime() - new Date(lastActionA).getTime();
    });


  const roomHistoryInPeriod = allPatients
    .flatMap(p => 
      (p.history && Array.isArray(p.history) ? p.history : [])
        .filter(hEntry => 
          hEntry.roomId === room.id && 
          isDateInPeriod(hEntry.entryDate, selectedPeriod)
        )
        .map(hEntry => ({ ...hEntry, patientName: p.name, patientId: p.id }))
    )
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  // Pagination logic
  const totalWaitingPages = Math.ceil(waitingPatients.length / ITEMS_PER_PAGE);
  const paginatedWaitingPatients = waitingPatients.slice((waitingPage - 1) * ITEMS_PER_PAGE, waitingPage * ITEMS_PER_PAGE);

  const totalSeenPages = Math.ceil(seenPatients.length / ITEMS_PER_PAGE);
  const paginatedSeenPatients = seenPatients.slice((seenPage - 1) * ITEMS_PER_PAGE, seenPage * ITEMS_PER_PAGE);

  const totalHistoryPages = Math.ceil(roomHistoryInPeriod.length / ITEMS_PER_PAGE);
  const paginatedHistory = roomHistoryInPeriod.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);
  
  // Statistics calculation
  const totalPatientsInRoom = patientsInRoom.length; 
  const waitingInRoomCount = waitingPatients.length;

  const sentInPeriodPatientIds = new Set<string>();
  allPatients.forEach(patient => {
    if (patient.history && Array.isArray(patient.history) && patient.history.some(
      histEntry =>
        histEntry.roomId === room.id &&
        histEntry.exitDate && 
        isDateInPeriod(histEntry.exitDate, selectedPeriod)
    )) {
      sentInPeriodPatientIds.add(patient.id);
    }
  });
  const sentInPeriodCount = sentInPeriodPatientIds.size;

  const processedInPeriodPatientIds = new Set<string>();
  allPatients.forEach(patient => {
    if (!patient.history || !Array.isArray(patient.history)) return;
    
    patient.history.forEach(histEntry => {
      if (
        histEntry.roomId === room.id &&
        (
          histEntry.statusMessage.toLowerCase().includes('complété') || 
          histEntry.statusMessage.toLowerCase().includes('effectué') || 
          histEntry.statusMessage.toLowerCase().includes('planifié') || 
          histEntry.statusMessage.toLowerCase().includes('enregistré') ||
          histEntry.statusMessage.toLowerCase().includes('saisi') || // for examen
          histEntry.statusMessage.toLowerCase().includes('rédigé') || 
          histEntry.statusMessage.toLowerCase().includes('terminée') ||
          histEntry.statusMessage.toLowerCase().includes('retiré') || // for retrait CR
          histEntry.statusMessage.toLowerCase().includes('archivé') || // for archive
          histEntry.statusMessage.toLowerCase().includes('action complétée') 
        ) &&
        isDateInPeriod(histEntry.entryDate, selectedPeriod)
      ) {
        processedInPeriodPatientIds.add(patient.id);
      }
    });
  });
  const processedInPeriodCount = processedInPeriodPatientIds.size;

  const createdInPeriodCount = room.id === RoomId.REQUEST 
    ? allPatients.filter(p => isDateInPeriod(p.creationDate, selectedPeriod)).length
    : 0;

  const demandsCreatedInPeriodCount = room.id === RoomId.REQUEST
    ? processedInPeriodPatientIds.size // This is now equivalent to completed demands in period
    : 0;

  const processedActionLabel = getProcessedActionLabel(room.id);
  
  const handleHistoryPatientClick = (patientId: string) => {
    const patient = allPatients.find(p => p.id === patientId);
    if (patient) {
      onViewPatientDetail(patient);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 mb-1">
            <room.icon className="h-8 w-8 text-sky-600" />
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{room.name}</h2>
              <p className="text-sm text-slate-500">{room.description}</p>
            </div>
          </div>
          {room.id === RoomId.REQUEST && onOpenCreatePatientModal && (
            <button
              onClick={onOpenCreatePatientModal}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150"
              title="Ajouter un nouveau patient"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Ajouter Patient
            </button>
          )}
        </div>
      </div>

      {/* Statistics Bar */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${room.id === RoomId.REQUEST ? 'lg:grid-cols-4' : 'lg:grid-cols-4'} gap-4 mb-6`}>
        {room.id === RoomId.REQUEST && (
          <>
            <div className="bg-slate-50 p-4 rounded-lg shadow-md flex items-center space-x-3 hover:shadow-lg transition-shadow">
              <UsersIcon className="h-8 w-8 text-cyan-500" />
              <div>
                <p className="text-sm text-slate-500">Patients Créés</p>
                <p className="text-2xl font-semibold text-slate-700">{createdInPeriodCount}</p>
              </div>
            </div>
             <div className="bg-slate-50 p-4 rounded-lg shadow-md flex items-center space-x-3 hover:shadow-lg transition-shadow">
              <ClipboardListIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-slate-500">Demandes Créées</p>
                <p className="text-2xl font-semibold text-slate-700">{demandsCreatedInPeriodCount}</p>
              </div>
            </div>
          </>
        )}
        {room.id !== RoomId.REQUEST && ( 
           <div className="bg-slate-50 p-4 rounded-lg shadow-md flex items-center space-x-3 hover:shadow-lg transition-shadow">
             <UsersIcon className="h-8 w-8 text-sky-500" />
             <div>
               <p className="text-sm text-slate-500">Total Patients (salle)</p>
               <p className="text-2xl font-semibold text-slate-700">{totalPatientsInRoom}</p>
             </div>
           </div>
        )}
        <div className="bg-slate-50 p-4 rounded-lg shadow-md flex items-center space-x-3 hover:shadow-lg transition-shadow">
          <InformationCircleIcon className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-sm text-slate-500">En attente (salle)</p>
            <p className="text-2xl font-semibold text-slate-700">{waitingInRoomCount}</p>
          </div>
        </div>
        {room.id !== RoomId.REQUEST && ( 
          <div className="bg-slate-50 p-4 rounded-lg shadow-md flex items-center space-x-3 hover:shadow-lg transition-shadow">
            <CheckBadgeIcon className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-slate-500">{processedActionLabel}</p>
              <p className="text-2xl font-semibold text-slate-700">{processedInPeriodCount}</p>
            </div>
          </div>
        )}
        <div className="bg-slate-50 p-4 rounded-lg shadow-md flex items-center space-x-3 hover:shadow-lg transition-shadow">
          <ArrowRightCircleIcon className="h-8 w-8 text-indigo-500" />
          <div>
            <p className="text-sm text-slate-500">Envoyés</p>
            <p className="text-2xl font-semibold text-slate-700">{sentInPeriodCount}</p>
          </div>
        </div>
      </div>

      {/* Unified Tabbed View */}
      <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col min-h-[500px]">
        <div className="border-b border-gray-200 flex-shrink-0">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('waiting')}
                    className={`flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'waiting'
                            ? 'border-sky-500 text-sky-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                    aria-current={activeTab === 'waiting' ? 'page' : undefined}
                >
                    <InformationCircleIcon className="h-5 w-5 mr-2 text-amber-500" />
                    En attente ({waitingPatients.length})
                </button>
                <button
                    onClick={() => setActiveTab('seen')}
                    className={`flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'seen'
                            ? 'border-sky-500 text-sky-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                    aria-current={activeTab === 'seen' ? 'page' : undefined}
                >
                    <CheckBadgeIcon className="h-5 w-5 mr-2 text-green-500" />
                    Action(s) Terminée(s) ({seenPatients.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'history'
                            ? 'border-sky-500 text-sky-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                    aria-current={activeTab === 'history' ? 'page' : undefined}
                >
                    <ListBulletIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Historique ({roomHistoryInPeriod.length})
                </button>
            </nav>
        </div>
        <div className="mt-5 flex-grow overflow-hidden flex flex-col">
            {activeTab === 'waiting' && (
                <>
                    {waitingPatients.length > 0 && (
                        <div className="flex justify-end mb-4 pr-2">
                            <label htmlFor="sort-order" className="text-sm font-medium text-slate-600 mr-2 self-center">Trier par :</label>
                            <select
                                id="sort-order"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'time_asc' | 'alpha_asc')}
                                className="bg-white border border-slate-300 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
                                aria-label="Trier les patients en attente"
                            >
                                <option value="time_asc">Plus ancien d'abord</option>
                                <option value="alpha_asc">Ordre alphabétique</option>
                            </select>
                        </div>
                    )}
                    {paginatedWaitingPatients.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-4 flex-grow">Aucun patient en attente.</p>
                    ) : (
                       <div className="space-y-4 overflow-y-auto flex-grow pr-2">
                            {paginatedWaitingPatients.map(patient => (
                                <PatientCard
                                    key={patient.id}
                                    patient={patient}
                                    currentRoom={room}
                                    onOpenPatientFormModal={onOpenPatientFormModal}
                                    onViewPatientDetail={onViewPatientDetail}
                                />
                            ))}
                        </div>
                    )}
                    <Pagination 
                      currentPage={waitingPage} 
                      totalPages={totalWaitingPages} 
                      onPageChange={setWaitingPage} 
                    />
                </>
            )}
            {activeTab === 'seen' && (
                <>
                    {paginatedSeenPatients.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-4 flex-grow">Aucun patient avec action terminée dans cette salle pour la période.</p>
                    ) : (
                        <div className="space-y-4 overflow-y-auto flex-grow pr-2">
                            {paginatedSeenPatients.map(patient => (
                                <PatientCard
                                    key={patient.id}
                                    patient={patient}
                                    currentRoom={room}
                                    onOpenPatientFormModal={onOpenPatientFormModal}
                                    onViewPatientDetail={onViewPatientDetail}
                                />
                            ))}
                        </div>
                    )}
                    <Pagination 
                      currentPage={seenPage} 
                      totalPages={totalSeenPages} 
                      onPageChange={setSeenPage} 
                    />
                </>
            )}
            {activeTab === 'history' && (
                <>
                    {paginatedHistory.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-4 flex-grow">Aucune activité enregistrée pour cette salle pendant cette période.</p>
                    ) : (
                        <ul className="space-y-2 overflow-y-auto pr-2 flex-grow">
                            {paginatedHistory.map((entry, index) => (
                                <li key={`${entry.patientId}-${index}-${entry.entryDate}`} className="text-sm text-slate-600 p-2 bg-slate-100 rounded-md">
                                <button 
                                    onClick={() => handleHistoryPatientClick(entry.patientId)}
                                    className="font-semibold text-sky-700 hover:underline focus:outline-none"
                                    title={`Voir dossier de ${entry.patientName}`}
                                >
                                    {entry.patientName}
                                </button>: {entry.statusMessage}
                                <div className="text-xs text-slate-500 mt-1">
                                    <span>Date: {new Date(entry.entryDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short'})}, Heure: {new Date(entry.entryDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                                    {entry.exitDate && isDateInPeriod(entry.exitDate, selectedPeriod) && (
                                    <span className="ml-2">Sortie: {new Date(entry.exitDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                                    )}
                                </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Pagination 
                        currentPage={historyPage} 
                        totalPages={totalHistoryPages} 
                        onPageChange={setHistoryPage} 
                    />
                </>
            )}
        </div>
      </div>
    </div>
  );
};