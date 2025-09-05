import React from 'react';
import { Patient, Room, RoomId, ExamConfiguration, ReportTemplate } from '../types';
// FIX: Import form data types to resolve casting errors.
import { RequestForm, RequestFormData } from './forms/RequestForm';
import { AppointmentForm, AppointmentFormData } from './forms/AppointmentForm';
import { ConsultationForm, ConsultationFormData } from './forms/ConsultationForm';
import { InjectionForm } from './forms/InjectionForm';
import { ExaminationForm, ExaminationFormData } from './forms/ExaminationForm';
import { ReportForm, ReportFormData } from './forms/ReportForm';
import { RetraitCRSortieForm, RetraitCRSortieFormData } from './forms/RetraitCRSortieForm';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patientId: string, roomId: RoomId, formData: any) => void;
  patient: Patient;
  room: Room;
  examConfigurations: ExamConfiguration[];
  reportTemplates: ReportTemplate[];
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
  room,
  examConfigurations,
  reportTemplates
}) => {
  if (!isOpen || !patient || !room) return null;

  // Dispatcher based on Room ID
  switch (room.id) {
    case RoomId.REQUEST:
      return (
        <RequestForm
          isOpen={isOpen}
          onClose={onClose}
          patient={patient}
          // FIX: Cast initialData to RequestFormData to resolve type mismatch.
          initialData={patient.roomSpecificData?.[RoomId.REQUEST] as RequestFormData}
          onSubmit={(data) => onSubmit(patient.id, room.id, data)}
          examConfigurations={examConfigurations}
        />
      );

    case RoomId.APPOINTMENT:
      return (
        <AppointmentForm
          isOpen={isOpen}
          onClose={onClose}
          patient={patient}
          // FIX: Cast initialData to AppointmentFormData to resolve type mismatch.
          initialData={patient.roomSpecificData?.[RoomId.APPOINTMENT] as AppointmentFormData}
          onSubmit={(data) => onSubmit(patient.id, room.id, data)}
        />
      );
    
    case RoomId.CONSULTATION:
        const examConfig = examConfigurations.find(c => c.name === patient.roomSpecificData?.[RoomId.REQUEST]?.requestedExam);
        if (!examConfig) {
             return (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6">
                      <h3 className="text-lg font-semibold">Erreur de Configuration</h3>
                      <p className="my-4">Aucune configuration d'examen trouvée pour "{patient.roomSpecificData?.[RoomId.REQUEST]?.requestedExam || 'Non spécifié'}".</p>
                      <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Fermer</button>
                  </div>
              </div>
          );
        }
        return (
            <ConsultationForm
                isOpen={isOpen}
                onClose={onClose}
                patient={patient}
                // FIX: Cast initialData to ConsultationFormData to resolve type mismatch.
                initialData={patient.roomSpecificData?.[RoomId.CONSULTATION] as ConsultationFormData}
                onSubmit={(data) => onSubmit(patient.id, room.id, data)}
                examConfiguration={examConfig}
            />
        );

    case RoomId.INJECTION:
        return (
            <InjectionForm
                isOpen={isOpen}
                onClose={onClose}
                patient={patient}
                onSubmit={(data) => onSubmit(patient.id, room.id, data)}
            />
        );

    case RoomId.EXAMINATION:
      return (
        <ExaminationForm
          isOpen={isOpen}
          onClose={onClose}
          patient={patient}
          // FIX: Cast initialData to ExaminationFormData to resolve type mismatch.
          initialData={patient.roomSpecificData?.[RoomId.EXAMINATION] as ExaminationFormData}
          onSubmit={(data) => onSubmit(patient.id, room.id, data)}
        />
      );

    case RoomId.REPORT:
      return (
        <ReportForm
          isOpen={isOpen}
          onClose={onClose}
          patient={patient}
          // FIX: Cast initialData to ReportFormData to resolve type mismatch.
          initialData={patient.roomSpecificData?.[RoomId.REPORT] as ReportFormData}
          onSubmit={(data) => onSubmit(patient.id, room.id, data)}
          examConfigurations={examConfigurations}
          reportTemplates={reportTemplates}
        />
      );
      
    case RoomId.RETRAIT_CR_SORTIE:
      return (
        <RetraitCRSortieForm
          isOpen={isOpen}
          onClose={onClose}
          patient={patient}
          // FIX: Cast initialData to RetraitCRSortieFormData to resolve type mismatch.
          initialData={patient.roomSpecificData?.[RoomId.RETRAIT_CR_SORTIE] as RetraitCRSortieFormData}
          onSubmit={(data) => onSubmit(patient.id, room.id, data)}
        />
      );

    default:
      // Render Generic Forms for other rooms
      return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold">Formulaire pour {room.name}</h3>
            <p className="my-4">Formulaire générique pour la salle actuelle. L'implémentation des champs spécifiques est requise.</p>
            <div className="flex justify-end space-x-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                 <button onClick={() => onSubmit(patient.id, room.id, {})} className="px-4 py-2 bg-sky-600 text-white rounded">Soumettre</button>
            </div>
          </div>
        </div>
      );
  }
};