
import React from 'react';
import { Patient } from '../types';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';

interface GlobalSearchViewProps {
  searchResults: Patient[];
  onViewPatientDetail: (patient: Patient) => void;
  searchTerm: string;
}

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ searchResults, onViewPatientDetail, searchTerm }) => {
  if (searchTerm.trim() === '') {
    return (
      <div className="text-center p-10 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Recherche de Patient</h2>
        <p className="text-gray-500">Veuillez entrer un terme dans la barre de recherche ci-dessus.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Résultats de recherche pour: "<span className="text-sky-600">{searchTerm}</span>"
      </h2>
      {searchResults.length === 0 ? (
        <p className="text-slate-500 italic text-center py-4">Aucun patient trouvé pour "{searchTerm}".</p>
      ) : (
        <div className="space-y-4">
          {searchResults.map(patient => (
            <div key={patient.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-150 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-10 w-10 text-slate-500 flex-shrink-0" />
                <div>
                  <p className="text-lg font-semibold text-sky-700">{patient.name}</p>
                  <p className="text-xs text-slate-500">ID: {patient.id} - Né(e) le: {patient.dateOfBirth} {patient.age ? `(${patient.age} ans)` : ''}</p>
                </div>
              </div>
              <button
                onClick={() => onViewPatientDetail(patient)}
                className="flex items-center bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-3 rounded-md text-sm transition-colors duration-150 shadow-sm"
                title={`Voir le dossier de ${patient.name}`}
              >
                <IdentificationIcon className="h-5 w-5 mr-2" />
                Voir Dossier
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
