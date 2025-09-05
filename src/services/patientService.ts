import { Patient, PatientHistoryEntry, RoomId, PatientStatusInRoom } from '../../types';
import { calculateAge } from '../../utils/dateUtils';
import { ROOMS_CONFIG } from '../../constants';

/**
 * Service de gestion des patients
 * Centralise toute la logique métier liée aux patients
 */

export class PatientService {
  /**
   * Déplace un patient vers une nouvelle salle
   */
  static movePatient(
    patient: Patient,
    targetRoomId: RoomId,
    statusMessage?: string
  ): Patient {
    const now = new Date().toISOString();
    
    // Fermer l'historique de la salle actuelle
    const updatedHistory = [...patient.history];
    const lastHistoryIndex = updatedHistory.map(h => h.roomId).lastIndexOf(patient.currentRoomId);
    
    if (lastHistoryIndex !== -1) {
      updatedHistory[lastHistoryIndex].exitDate = now;
    }

    // Ajouter l'entrée de sortie
    updatedHistory.push({
      roomId: patient.currentRoomId,
      entryDate: now,
      statusMessage: statusMessage || 'Déplacé manuellement.',
      exitDate: now
    });

    // Ajouter l'entrée dans la nouvelle salle
    const targetRoom = ROOMS_CONFIG.find(r => r.id === targetRoomId);
    updatedHistory.push({
      roomId: targetRoomId,
      entryDate: new Date(Date.parse(now) + 1).toISOString(),
      statusMessage: `Entré dans ${targetRoom?.name || targetRoomId}`
    });

    return {
      ...patient,
      currentRoomId: targetRoomId,
      statusInRoom: PatientStatusInRoom.WAITING,
      history: updatedHistory
    };
  }

  /**
   * Met à jour les données spécifiques d'une salle pour un patient
   */
  static updateRoomData(
    patient: Patient,
    roomId: RoomId,
    formData: any
  ): Patient {
    const now = new Date().toISOString();
    
    // Mettre à jour les données de la salle
    const updatedRoomData = {
      ...patient.roomSpecificData,
      [roomId]: {
        ...patient.roomSpecificData?.[roomId],
        ...formData
      }
    };

    // Mettre à jour l'historique
    const updatedHistory = [...patient.history];
    const lastHistoryIndex = updatedHistory.map(h => h.roomId).lastIndexOf(roomId);
    
    if (lastHistoryIndex !== -1) {
      updatedHistory[lastHistoryIndex].exitDate = now;
    }

    // Ajouter une entrée d'historique pour l'action
    const currentRoom = ROOMS_CONFIG.find(r => r.id === roomId);
    let statusMessage = 'Action complétée.';
    
    // Messages spécifiques par salle
    switch (roomId) {
      case RoomId.REQUEST:
        statusMessage = `Demande complétée pour ${formData.requestedExam}.`;
        break;
      case RoomId.APPOINTMENT:
        statusMessage = `RDV planifié pour le ${formData.dateRdv} à ${formData.heureRdv}.`;
        break;
      case RoomId.CONSULTATION:
        statusMessage = 'Consultation terminée.';
        break;
      case RoomId.INJECTION:
        statusMessage = 'Injection enregistrée.';
        break;
      case RoomId.EXAMINATION:
        statusMessage = `Examen saisi (Qualité: ${formData.qualiteImages || 'N/A'}).`;
        break;
      case RoomId.REPORT:
        statusMessage = 'Compte rendu rédigé.';
        break;
      case RoomId.RETRAIT_CR_SORTIE:
        statusMessage = `CR retiré par ${formData.retirePar || 'inconnu'} le ${formData.dateRetrait || 'date inconnue'} à ${formData.heureRetrait || 'heure inconnue'}. Dossier archivé.`;
        break;
    }

    updatedHistory.push({
      roomId,
      entryDate: now,
      statusMessage
    });

    // Déterminer la prochaine salle et le statut
    let nextRoomId = patient.currentRoomId;
    let nextStatus = patient.statusInRoom;

    if (currentRoom?.nextRoomId) {
      nextRoomId = currentRoom.nextRoomId;
      nextStatus = PatientStatusInRoom.WAITING;
      
      // Ajouter l'entrée dans la nouvelle salle
      updatedHistory.push({
        roomId: currentRoom.nextRoomId,
        entryDate: new Date(Date.parse(now) + 1).toISOString(),
        statusMessage: `Entré dans ${ROOMS_CONFIG.find(r => r.id === currentRoom.nextRoomId)?.name}`
      });
    } else {
      nextStatus = PatientStatusInRoom.SEEN;
    }

    return {
      ...patient,
      currentRoomId: nextRoomId,
      statusInRoom: nextStatus,
      history: updatedHistory,
      roomSpecificData: updatedRoomData
    };
  }

  /**
   * Crée un nouveau patient
   */
  static createPatient(
    patientData: {
      name: string;
      dateOfBirth: string;
      address?: string;
      phone?: string;
      email?: string;
      referringEntity?: any;
    },
    requestData?: {
      requestedExam?: string;
      customFields?: { [key: string]: any };
    }
  ): Patient {
    const now = new Date().toISOString();
    const patientId = `PAT${String(Date.now()).slice(-6)}`;
    
    const hasRequest = !!requestData?.requestedExam;
    
    // Créer l'historique initial
    const initialHistory: PatientHistoryEntry[] = [{
      roomId: RoomId.REQUEST,
      entryDate: now,
      statusMessage: hasRequest ? 'Patient et demande créés.' : 'Patient créé.',
      exitDate: hasRequest ? now : undefined
    }];

    // Si une demande est créée, passer directement au rendez-vous
    if (hasRequest) {
      initialHistory.push({
        roomId: RoomId.APPOINTMENT,
        entryDate: new Date(Date.parse(now) + 1).toISOString(),
        statusMessage: 'Entré dans Rendez-vous'
      });
    }

    const nextRoomId = hasRequest ? RoomId.APPOINTMENT : RoomId.REQUEST;
    const roomSpecificData = hasRequest ? { [RoomId.REQUEST]: requestData } : {};

    return {
      id: patientId,
      name: patientData.name,
      dateOfBirth: patientData.dateOfBirth,
      age: calculateAge(patientData.dateOfBirth),
      address: patientData.address,
      phone: patientData.phone,
      email: patientData.email,
      referringEntity: patientData.referringEntity,
      creationDate: now,
      currentRoomId: nextRoomId,
      statusInRoom: PatientStatusInRoom.WAITING,
      history: initialHistory,
      roomSpecificData,
      documents: []
    };
  }

  /**
   * Filtre les patients selon différents critères
   */
  static filterPatients = {
    byRoom: (patients: Patient[], roomId: RoomId) =>
      patients.filter(p => p.currentRoomId === roomId),
    
    byStatus: (patients: Patient[], status: PatientStatusInRoom) =>
      patients.filter(p => p.statusInRoom === status),
    
    bySearch: (patients: Patient[], searchTerm: string) =>
      patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    
    byPeriod: (patients: Patient[], period: 'today' | 'thisWeek' | 'thisMonth') => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      switch (period) {
        case 'today':
          return patients.filter(p => p.creationDate.startsWith(todayStr));
        case 'thisWeek':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          return patients.filter(p => new Date(p.creationDate) >= weekStart);
        case 'thisMonth':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return patients.filter(p => new Date(p.creationDate) >= monthStart);
        default:
          return patients;
      }
    }
  };

  /**
   * Valide les données d'un patient
   */
  static validatePatientData(patient: Partial<Patient>): string[] {
    const errors: string[] = [];
    
    if (!patient.name?.trim()) {
      errors.push('Le nom du patient est requis');
    }
    
    if (!patient.dateOfBirth) {
      errors.push('La date de naissance est requise');
    } else {
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        errors.push('La date de naissance ne peut pas être dans le futur');
      }
    }
    
    if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
      errors.push('Format d\'email invalide');
    }
    
    return errors;
  }

  /**
   * Calcule les statistiques des patients
   */
  static calculateStatistics(patients: Patient[]) {
    const totalPatients = patients.length;
    const waitingPatients = patients.filter(p => p.statusInRoom === PatientStatusInRoom.WAITING).length;
    const seenPatients = patients.filter(p => p.statusInRoom === PatientStatusInRoom.SEEN).length;
    
    const roomDistribution = ROOMS_CONFIG.reduce((acc, room) => {
      acc[room.id] = patients.filter(p => p.currentRoomId === room.id).length;
      return acc;
    }, {} as Record<RoomId, number>);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysPatients = patients.filter(p => p.creationDate.startsWith(todayStr)).length;
    
    return {
      total: totalPatients,
      waiting: waitingPatients,
      seen: seenPatients,
      roomDistribution,
      todaysCount: todaysPatients
    };
  }
}
