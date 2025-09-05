
import React from 'react';
import { Patient, TimelineEvent } from '../types';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { CameraIcon } from './icons/CameraIcon';

const eventVisuals = {
    appointment: { 
        icon: CalendarDaysIcon, 
        colorClasses: {
            border: 'border-blue-500',
            text: 'text-blue-600',
        },
        label: 'Rendez-vous' 
    },
    injection: { 
        icon: BeakerIcon, 
        colorClasses: {
            border: 'border-teal-500',
            text: 'text-teal-600',
        },
        label: 'Injection' 
    },
    examination: { 
        icon: CameraIcon, 
        colorClasses: {
            border: 'border-indigo-500',
            text: 'text-indigo-600',
        },
        label: 'Examen' 
    },
};

export const TimelineEventCard: React.FC<{ event: TimelineEvent; onViewPatientDetail: (patient: Patient) => void }> = ({ event, onViewPatientDetail }) => {
    
    const visuals = eventVisuals[event.type];
    const Icon = visuals.icon;

    return (
        <div className={`ml-4 mb-4 pl-4 border-l-4 ${visuals.colorClasses.border} bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow`}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center space-x-2">
                        <Icon className={`h-5 w-5 ${visuals.colorClasses.text}`} />
                        <span className="font-semibold text-sm text-slate-800">{visuals.label} à {event.time}</span>
                    </div>
                    <p className="mt-1 text-md font-bold text-sky-700">{event.patient.name}</p>
                    <p className="text-xs text-slate-500">{event.description}</p>
                </div>
                <button
                    onClick={() => onViewPatientDetail(event.patient)}
                    className="flex items-center bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium py-1 px-2 rounded-md text-xs transition-colors duration-150 shadow-sm ml-2 flex-shrink-0"
                    title={`Voir le dossier de ${event.patient.name}`}
                >
                    <IdentificationIcon className="h-4 w-4 mr-1" />
                    Dossier
                </button>
            </div>
        </div>
    );
};
