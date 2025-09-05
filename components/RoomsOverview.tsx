
import React, { useState } from 'react';
import { Room, Patient, PatientStatusInRoom, RoomId, HotLabData } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { Squares2X2Icon } from './icons/Squares2X2Icon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { ClockIcon } from './icons/ClockIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';

interface RoomsOverviewProps {
  visibleRooms: Room[];
  allPatients: Patient[];
  hotLabData: HotLabData;
  onSelectRoom: (roomId: RoomId) => void;
  onViewPatientDetail: (patient: Patient) => void;
  onMovePatient: (patientId: string, targetRoomId: RoomId) => void;
}

export const RoomsOverview: React.FC<RoomsOverviewProps> = ({ 
    visibleRooms, 
    allPatients, 
    hotLabData,
    onSelectRoom,
    onViewPatientDetail,
    onMovePatient 
}) => {
    const [draggedPatientInfo, setDraggedPatientInfo] = useState<{patientId: string, sourceRoomId: RoomId} | null>(null);
    const [dragOverRoomId, setDragOverRoomId] = useState<RoomId | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, patientId: string, sourceRoomId: RoomId) => {
      e.dataTransfer.effectAllowed = 'move';
      // Using JSON to pass multiple pieces of data
      e.dataTransfer.setData('application/json', JSON.stringify({ patientId, sourceRoomId }));
      setDraggedPatientInfo({ patientId, sourceRoomId });
    };
  
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); // Necessary to allow dropping
    };
  
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetRoomId: RoomId) => {
      e.preventDefault();
      if (draggedPatientInfo) {
        const sourceRoom = visibleRooms.find(r => r.id === draggedPatientInfo.sourceRoomId);
        // Highlight only if it's the correct next room
        if (sourceRoom?.nextRoomId === targetRoomId) {
          setDragOverRoomId(targetRoomId);
        }
      }
    };
  
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOverRoomId(null);
    };
  
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetRoomId: RoomId) => {
      e.preventDefault();
      if (dragOverRoomId === targetRoomId) { // Ensure drop happens on a valid, highlighted target
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { patientId, sourceRoomId } = data;
            const sourceRoom = visibleRooms.find(r => r.id === sourceRoomId);
            if (sourceRoom?.nextRoomId === targetRoomId) {
                onMovePatient(patientId, targetRoomId);
            }
        } catch(error) {
            console.error("Failed to parse drag-and-drop data", error);
        }
      }
      setDragOverRoomId(null);
      setDraggedPatientInfo(null);
    };

    const handleDragEnd = () => {
        // Clean up state regardless of drop success
        setDragOverRoomId(null);
        setDraggedPatientInfo(null);
    };

  if (visibleRooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-10 bg-white rounded-lg shadow-xl">
          <Squares2X2Icon className="h-16 w-16 text-sky-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Aucune salle disponible</h2>
          <p className="text-gray-500">Votre rôle actuel ne vous donne accès à aucune salle.</p>
        </div>
      </div>
    );
  }

  // KPI Calculations
  const totalWaiting = allPatients.filter(p => p.statusInRoom === PatientStatusInRoom.WAITING).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysAppointments = allPatients
      .filter(p => p.roomSpecificData?.[RoomId.APPOINTMENT]?.dateRdv === todayStr)
      .sort((a, b) => {
          const timeA = a.roomSpecificData?.[RoomId.APPOINTMENT]?.heureRdv || '23:59';
          const timeB = b.roomSpecificData?.[RoomId.APPOINTMENT]?.heureRdv || '23:59';
          return timeA.localeCompare(timeB);
      });

  const nonExpiredLots = hotLabData.lots.filter(lot => lot.expiryDate >= todayStr).length;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-3">
        <Squares2X2Icon className="h-8 w-8 text-sky-600" />
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Tableau de Bord</h2>
            <p className="text-sm text-slate-500">Aperçu rapide de l'activité du service.</p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4">
            <div className="p-3 rounded-full bg-amber-100">
                <ClockIcon className="h-8 w-8 text-amber-500" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Patients en Attente (Total)</p>
                <p className="text-3xl font-bold text-slate-800">{totalWaiting}</p>
            </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-lg">
            <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-green-100">
                    <CalendarDaysIcon className="h-8 w-8 text-green-500" />
                </div>
                <div>
                    <p className="text-sm text-slate-500">Rendez-vous Aujourd'hui</p>
                    <p className="text-3xl font-bold text-slate-800">{todaysAppointments.length}</p>
                </div>
            </div>
            {todaysAppointments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1">
                    <h4 className="font-semibold text-slate-600">Prochains RDVs:</h4>
                    {todaysAppointments.slice(0, 2).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-slate-500 hover:bg-slate-50 p-1 rounded">
                           <span>{p.roomSpecificData?.[RoomId.APPOINTMENT]?.heureRdv} - {p.name}</span>
                            <button onClick={() => onViewPatientDetail(p)} className="text-sky-500 hover:text-sky-700" title={`Voir dossier de ${p.name}`}>
                               <IdentificationIcon className="h-4 w-4"/>
                           </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4">
            <div className="p-3 rounded-full bg-sky-100">
                <BeakerIcon className="h-8 w-8 text-sky-500" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Lots Disponibles (Labo Chaud)</p>
                <p className="text-3xl font-bold text-slate-800">{nonExpiredLots}</p>
            </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-4">État des Salles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRooms.map(room => {
            const patientsInThisRoom = allPatients.filter(p => p.currentRoomId === room.id);
            const waitingCount = patientsInThisRoom.filter(p => p.statusInRoom === PatientStatusInRoom.WAITING).length;
            const seenCount = patientsInThisRoom.filter(p => p.statusInRoom === PatientStatusInRoom.SEEN).length;
            const totalCount = patientsInThisRoom.length;

            return (
                <div 
                    key={room.id} 
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, room.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, room.id)}
                    className={`bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col ${
                        dragOverRoomId === room.id ? 'ring-2 ring-sky-500 bg-sky-50' : ''
                    }`}
                    aria-label={`Salle ${room.name}, zone de dépôt`}
                >
                <div className="flex items-center space-x-3 mb-3 border-b border-slate-200 pb-3">
                    <room.icon className="h-7 w-7 text-sky-500 flex-shrink-0" />
                    <button 
                        onClick={() => onSelectRoom(room.id)}
                        className="text-xl font-semibold text-slate-700 hover:text-sky-600 hover:underline focus:outline-none text-left"
                        title={`Aller à la salle ${room.name}`}
                    >
                    {room.name}
                    </button>
                </div>
                
                <div className="space-y-2 mb-4 flex-grow">
                    <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-slate-600">
                        <InformationCircleIcon className="h-5 w-5 mr-2 text-amber-500" />
                        En attente:
                    </span>
                    <span className="font-semibold text-slate-800">{waitingCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-slate-600">
                        <CheckBadgeIcon className="h-5 w-5 mr-2 text-green-500" />
                        Action(s) terminée(s) (salle):
                    </span>
                    <span className="font-semibold text-slate-800">{seenCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-slate-600">
                        <UsersIcon className="h-5 w-5 mr-2 text-blue-500" />
                        Total patients (salle):
                    </span>
                    <span className="font-semibold text-slate-800">{totalCount}</span>
                    </div>
                </div>
                    
                {patientsInThisRoom.length > 0 && (
                    <div className="mt-auto pt-3 border-t border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-500 mb-1.5 uppercase">Patients Actuels:</h4>
                    <ul className="space-y-1 max-h-24 overflow-y-auto text-xs">
                        {patientsInThisRoom.slice(0, 5).map(p => { // Show up to 5 patients
                            const isMovable = p.statusInRoom === PatientStatusInRoom.SEEN && !!room.nextRoomId;
                            return (
                                <li 
                                    key={p.id}
                                    draggable={isMovable}
                                    onDragStart={isMovable ? (e) => handleDragStart(e, p.id, room.id) : undefined}
                                    onDragEnd={isMovable ? handleDragEnd : undefined}
                                    className={`flex justify-between items-center text-slate-600 hover:bg-slate-100 p-1 rounded ${isMovable ? 'cursor-move' : 'cursor-default'}`}
                                    title={isMovable ? `Déplacer ${p.name}` : p.name}
                                >
                                    <span>{p.name} ({p.statusInRoom})</span>
                                    <button 
                                        onClick={() => onViewPatientDetail(p)} 
                                        className="text-sky-500 hover:text-sky-700"
                                        title={`Voir dossier de ${p.name}`}
                                    >
                                        <IdentificationIcon className="h-4 w-4"/>
                                    </button>
                                </li>
                            );
                        })}
                        {patientsInThisRoom.length > 5 && <li className="text-slate-500 text-center">... et {patientsInThisRoom.length - 5} autres</li>}
                    </ul>
                    </div>
                )}
                {patientsInThisRoom.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center mt-auto pt-3 border-t border-slate-200">Aucun patient dans cette salle.</p>
                )}

                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};
