import React, { useMemo } from 'react';
import { Patient, RoomId, TimelineEvent } from '../types';
import { TimelineEventCard } from './TimelineEventCard';
import { CalendarClockIcon } from './icons/CalendarClockIcon';
import { PrinterIcon } from './icons/PrinterIcon';

export const DailyWorklistView: React.FC<{ allPatients: Patient[]; onViewPatientDetail: (patient: Patient) => void; }> = ({ allPatients, onViewPatientDetail }) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const timelineEvents = useMemo(() => {
        const events: TimelineEvent[] = [];

        allPatients.forEach(patient => {
            const appointmentData = patient.roomSpecificData?.[RoomId.APPOINTMENT];
            // Only consider patients with an appointment today for the timeline
            if (appointmentData?.dateRdv === todayStr && appointmentData.heureRdv) {
                // Add Appointment Event
                events.push({
                    id: `${patient.id}-appointment`,
                    time: appointmentData.heureRdv,
                    patient,
                    type: 'appointment',
                    description: `Consultation pré-examen.`
                });

                // Add Injection Event if data exists
                const injectionData = patient.roomSpecificData?.[RoomId.INJECTION];
                if (injectionData?.heureInjection) {
                    events.push({
                        id: `${patient.id}-injection`,
                        time: injectionData.heureInjection,
                        patient,
                        type: 'injection',
                        description: `Produit: ${injectionData.produitInjecte || 'N/A'}`
                    });

                    // Infer Examination time, e.g., 1 hour after injection
                    const [h, m] = injectionData.heureInjection.split(':').map(Number);
                    if (!isNaN(h) && !isNaN(m)) {
                        const injectionDate = new Date(`${todayStr}T${injectionData.heureInjection}`);
                        injectionDate.setHours(injectionDate.getHours() + 1); // Add 1 hour
                        
                        const examHour = injectionDate.getHours().toString().padStart(2, '0');
                        const examMinute = injectionDate.getMinutes().toString().padStart(2, '0');
                        const examTime = `${examHour}:${examMinute}`;

                        events.push({
                            id: `${patient.id}-examination`,
                            time: examTime,
                            patient,
                            type: 'examination',
                            description: `Début estimé post-injection.`
                        });
                    }
                }
            }
        });

        return events.sort((a, b) => a.time.localeCompare(b.time));
    }, [allPatients, todayStr]);

    const hours = Array.from({ length: 13 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 07:00 to 19:00

    const eventsByHour: { [hour: string]: TimelineEvent[] } = useMemo(() => {
        const grouped: { [hour: string]: TimelineEvent[] } = {};
        hours.forEach(hour => grouped[hour.substring(0, 2)] = []);
        timelineEvents.forEach(event => {
            const eventHour = event.time.substring(0, 2);
            if (grouped[eventHour]) {
                grouped[eventHour].push(event);
            }
        });
        return grouped;
    }, [timelineEvents, hours]);

    return (
        <div className="bg-slate-50 p-4 sm:p-6 rounded-xl shadow-lg printable-content">
            <div className="flex items-center justify-between mb-6 print:mb-4">
                <div className="flex items-center space-x-3">
                    <CalendarClockIcon className="h-8 w-8 text-sky-600" />
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Ligne du Temps de la Journée</h2>
                        <p className="text-sm text-slate-500">Visualisation des événements pour le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="no-print flex items-center bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
                    title="Imprimer la vacation du jour"
                >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Imprimer la vacation
                </button>
            </div>
            
            {timelineEvents.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-inner">
                    <CalendarClockIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-4 text-slate-500 italic">Aucun événement planifié pour aujourd'hui.</p>
                </div>
            ) : (
                <div className="space-y-0 max-h-[70vh] overflow-y-auto pr-2 print:max-h-full print:overflow-visible">
                    {hours.map(hour => {
                        const hourKey = hour.substring(0, 2);
                        const currentHourEvents = eventsByHour[hourKey] || [];
                        const hasEvents = currentHourEvents.length > 0;
                        
                        return (
                            <div key={hour} className="flex items-start print:break-inside-avoid">
                                <div className="w-20 text-right pr-4 flex-shrink-0 pt-1">
                                    <span className={`font-mono text-sm ${hasEvents ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>{hour}</span>
                                </div>
                                <div className="relative w-full border-l-2 border-slate-200">
                                    <div className={`absolute -left-[5px] top-2 h-2 w-2 rounded-full ${hasEvents ? 'bg-sky-500' : 'bg-slate-300'}`}></div>
                                    <div className="pl-2 pt-1 pb-4">
                                        {hasEvents ? (
                                            currentHourEvents.map(event => (
                                                <TimelineEventCard key={event.id} event={event} onViewPatientDetail={onViewPatientDetail} />
                                            ))
                                        ) : (
                                            <div className="h-4"></div> // Placeholder for empty slots to maintain spacing
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};