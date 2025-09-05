import React, { useState, useMemo } from 'react';
import { Patient, Room, RoomId } from '../types';
import { Pagination } from './Pagination';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { SCINTIGRAPHY_EXAMS_LIST } from '../constants';

const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);
const ArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

interface DatabaseViewProps {
  allPatients: Patient[];
  roomsConfig: Room[];
  onViewPatientDetail: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patient: Patient) => void;
}

type SortKey = 'name' | 'age' | 'exam' | 'room';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

export const DatabaseView: React.FC<DatabaseViewProps> = ({ allPatients, roomsConfig, onViewPatientDetail, onEditPatient, onDeletePatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState<RoomId | 'all'>('all');
  const [examFilter, setExamFilter] = useState<string | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let data = [...allPatients];
    
    // Filtering
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      data = data.filter(p => 
        p.name.toLowerCase().includes(lowerSearchTerm) || 
        p.id.toLowerCase().includes(lowerSearchTerm)
      );
    }
    if (roomFilter !== 'all') {
      data = data.filter(p => p.currentRoomId === roomFilter);
    }
    if (examFilter !== 'all') {
      data = data.filter(p => p.roomSpecificData?.[RoomId.REQUEST]?.requestedExam === examFilter);
    }

    // Sorting
    data.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortConfig.key) {
        case 'age':
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        case 'exam':
          aValue = a.roomSpecificData?.[RoomId.REQUEST]?.requestedExam || '';
          bValue = b.roomSpecificData?.[RoomId.REQUEST]?.requestedExam || '';
          break;
        case 'room':
          aValue = roomsConfig.find(r => r.id === a.currentRoomId)?.name || '';
          bValue = roomsConfig.find(r => r.id === b.currentRoomId)?.name || '';
          break;
        default: // 'name'
          aValue = a.name;
          bValue = b.name;
      }
      
      const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [allPatients, searchTerm, roomFilter, examFilter, sortConfig, roomsConfig]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <span className="text-slate-300">↑↓</span>;
    return sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline text-sky-600" /> : <ArrowDownIcon className="h-3 w-3 inline text-sky-600" />;
  };

  const getRoomName = (roomId: RoomId) => roomsConfig.find(r => r.id === roomId)?.name || roomId;
  const roomsForFilter = roomsConfig.filter(r => r.nextRoomId !== null || r.id === RoomId.ARCHIVE);


  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3 mb-1">
            <DatabaseIcon className="h-8 w-8 text-sky-600" />
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Base de Données Patients</h2>
                <p className="text-sm text-slate-500">Consulter, rechercher et filtrer tous les patients du système ({filteredData.length} résultats).</p>
            </div>
        </div>
      </div>

       <div className="bg-white p-5 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input type="search" placeholder="Rechercher par Nom, ID..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 pl-10 pr-3 text-sm"/>
            </div>
            <select value={examFilter} onChange={e => {setExamFilter(e.target.value); setCurrentPage(1);}} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-sm">
                <option value="all">Tous les examens</option>
                {SCINTIGRAPHY_EXAMS_LIST.map(exam => <option key={exam} value={exam}>{exam}</option>)}
            </select>
            <select value={roomFilter} onChange={e => {setRoomFilter(e.target.value as RoomId | 'all'); setCurrentPage(1);}} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-sm">
                <option value="all">Toutes les salles</option>
                {roomsForFilter.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><button onClick={() => requestSort('name')} className="flex items-center space-x-1 hover:text-slate-800"><span>Nom</span> {getSortIcon('name')}</button></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><button onClick={() => requestSort('age')} className="flex items-center space-x-1 hover:text-slate-800"><span>Âge</span> {getSortIcon('age')}</button></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><button onClick={() => requestSort('exam')} className="flex items-center space-x-1 hover:text-slate-800"><span>Examen demandé</span> {getSortIcon('exam')}</button></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><button onClick={() => requestSort('room')} className="flex items-center space-x-1 hover:text-slate-800"><span>Salle Actuelle</span> {getSortIcon('room')}</button></th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {paginatedData.map(patient => (
                        <tr key={patient.id} className="hover:bg-sky-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{patient.name}<br/><span className="text-xs text-slate-400">ID: {patient.id}</span></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{patient.age} ans</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{patient.roomSpecificData?.[RoomId.REQUEST]?.requestedExam || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{getRoomName(patient.currentRoomId)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewPatientDetail(patient);
                                        }}
                                        className="text-sky-600 hover:text-sky-900 p-1"
                                        title="Voir le dossier"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </button>
                                    {onEditPatient && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditPatient(patient);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 p-1"
                                            title="Modifier le patient"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                    {onDeletePatient && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.name} ?`)) {
                                                    onDeletePatient(patient);
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-900 p-1"
                                            title="Supprimer le patient"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {paginatedData.length === 0 && <p className="text-center text-slate-500 py-4">Aucun résultat trouvé.</p>}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
       </div>
    </div>
  );
};
