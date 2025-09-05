import { Room, Role, RoomId, ScintigraphyExam, RadiopharmaceuticalProduct, HotLabData, Patient, PatientStatusInRoom, Permission, ExamConfiguration, ReportTemplate, Asset, StockItem } from './types';
import { ClipboardListIcon } from './components/icons/ClipboardListIcon';
import { CalendarDaysIcon } from './components/icons/CalendarDaysIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import { CubeIcon } from './components/icons/CubeIcon';
import { BeakerIcon } from './components/icons/BeakerIcon';
import { CameraIcon } from './components/icons/CameraIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { ArchiveBoxArrowDownIcon } from './components/icons/ArchiveBoxArrowDownIcon';
import { ArchiveBoxIcon } from './components/icons/ArchiveBoxIcon';

export const INITIAL_ROLES: Role[] = [
    {
        id: 'role_admin',
        name: 'Administrateur(trice)',
        permissions: [
            'view_patients', 'edit_patients', 'create_patients', 'move_patients', 
            'manage_appointments', 'manage_users', 'manage_roles', 'view_hot_lab', 
            'edit_hot_lab', 'view_statistics'
        ]
    },
    {
        id: 'role_doctor',
        name: 'Médecin',
        permissions: ['view_patients', 'edit_patients', 'view_statistics']
    },
    {
        id: 'role_technician',
        name: 'Technicien(ne)',
        permissions: ['view_patients', 'edit_patients', 'move_patients', 'view_hot_lab', 'edit_hot_lab']
    },
    {
        id: 'role_reception',
        name: 'Réceptionniste',
        permissions: ['view_patients', 'create_patients', 'manage_appointments']
    }
];

export const INITIAL_EXAM_CONFIGURATIONS: ExamConfiguration[] = [
    {
        id: 'exam_scinti_osseuse',
        name: 'Scintigraphie Osseuse',
        fields: {
            request: [
                { id: 'f_indic', label: 'Indications', type: 'checkbox', options: ["Bilan d'extension initial", "Bilan de récidive", "Bilan comparatif", "Évaluation"] },
                { id: 'f_indic_autres', label: 'Autres indications', type: 'textarea' },
                { id: 'f_atcd', label: 'Antécédents médicaux', type: 'textarea' },
                { id: 'f_hist_maladie', label: 'Histoire de la maladie', type: 'textarea' },
            ],
            consultation: [
                 { id: 'f_cons_poids', label: 'Poids (kg)', type: 'text' },
                 { id: 'f_cons_taille', label: 'Taille (cm)', type: 'text' },
                 { id: 'f_cons_atcd_msk', label: 'Antécédents MSK pertinents', type: 'textarea' },
            ],
            report: [
                 { id: 'f_cr_technique', label: 'Technique et Activité', type: 'text' },
                 { id: 'f_cr_motif', label: 'Motif de l\'examen', type: 'textarea' },
            ]
        },
    },
    {
        id: 'exam_scinti_parathyroid',
        name: 'Scintigraphie Parathyroïdienne',
        fields: {
            request: [
                { id: 'f_indic_para', label: 'Indications', type: 'checkbox', options: ['Hyperparathyroïdie primaire', 'Persistance / Récidive post-op'] },
                { id: 'f_atcd_para', label: 'Antécédents chirurgicaux (cervicale)', type: 'textarea' },
            ],
            consultation: [
                { id: 'f_cons_pth', label: 'Taux de PTH', type: 'text' },
                { id: 'f_cons_calcemie', label: 'Calcémie', type: 'text' },
            ],
            report: []
        },
    },
    {
        id: 'exam_scinti_renale_dmsa',
        name: 'Scintigraphie Rénale DMSA',
        fields: {
            request: [
                { id: 'f_indic_dmsa', label: 'Indications', type: 'checkbox', options: ['Recherche de cicatrice post PNA', 'Évaluation fonction relative', 'Anomalie morphologique'] },
                { id: 'f_atcd_dmsa', label: 'Antécédents urologiques', type: 'textarea' },
            ],
            consultation: [],
            report: []
        },
    },
    {
        id: 'exam_scinti_renale_dtpa',
        name: 'Scintigraphie Rénale DTPA/MAG3',
        fields: {
            request: [
                { id: 'f_indic_dtpa', label: 'Indications', type: 'checkbox', options: ['Recherche de syndrome obstructif', 'Évaluation fonction relative', 'Test au captopril'] },
                { id: 'f_atcd_dtpa', label: 'Antécédents urologiques', type: 'textarea' },
            ],
            consultation: [],
            report: []
        },
    },
    {
        id: 'exam_scinti_thyroid',
        name: 'Scintigraphie Thyroïdienne',
        fields: {
            request: [
                { id: 'f_indic_thyro', label: 'Indications', type: 'checkbox', options: ['Caractérisation de nodule', 'Bilan d\'hyperthyroïdie', 'Recherche d\'ectopie'] },
                { id: 'f_traitement_thyro', label: 'Traitements en cours (ATS, hormones...)', type: 'textarea' },
            ],
            consultation: [
                { id: 'f_cons_tsh', label: 'TSH', type: 'text' },
                { id: 'f_cons_t4l', label: 'T4L', type: 'text' },
                { id: 'f_cons_palpation', label: 'Palpation cervicale', type: 'textarea' },
            ],
            report: []
        },
    }
];

// FIX: Add list of scintigraphy exams for use in dropdowns.
export const SCINTIGRAPHY_EXAMS_LIST: ScintigraphyExam[] = [
    "Scintigraphie Osseuse",
    "Scintigraphie Parathyroïdienne",
    "Scintigraphie Rénale DMSA",
    "Scintigraphie Rénale DTPA/MAG3",
    "Scintigraphie Thyroïdienne"
];


export const RADIOPHARMACEUTICAL_PRODUCTS: RadiopharmaceuticalProduct[] = [
  { id: 'prod_tc99m_pertech', name: '99mTc-Pertechnetate (Éluat)', isotope: '99mTc', unit: 'GBq' },
  { id: 'prod_tc99m_mdp', name: '99mTc-MDP (Kit)', isotope: '99mTc', unit: 'MBq' },
  { id: 'prod_f18_fdg', name: '18F-FDG', isotope: '18F', unit: 'MBq' },
  { id: 'prod_ga68_dotatate', name: '68Ga-DOTATATE', isotope: '68Ga', unit: 'MBq' },
  { id: 'prod_i131_iodure', name: '131I-Iodure de Sodium', isotope: '131I', unit: 'MBq' },
];

export const INITIAL_HOT_LAB_DATA: HotLabData = {
  products: RADIOPHARMACEUTICAL_PRODUCTS,
  lots: [
    {
      id: 'lot_fdg_1',
      productId: 'prod_f18_fdg',
      lotNumber: 'FDG-202407A',
      expiryDate: '2024-12-31',
      calibrationDateTime: '2024-07-20T08:00:00',
      initialActivity: 5000,
      unit: 'MBq',
      receivedDate: '2024-07-20',
      quantityReceived: 1
    },
    {
      id: 'lot_mdp_1',
      productId: 'prod_tc99m_mdp',
      lotNumber: 'MDP-202407B',
      expiryDate: '2025-01-15',
      receivedDate: '2024-07-18',
      quantityReceived: 5,
      unit: 'MBq' // unit for kit
    }
  ],
  preparations: [
    {
      id: 'prep_1',
      tracerLotId: 'lot_fdg_1',
      patientId: 'PAT001', // Link to a patient
      // FIX: Changed "TEP-Scan Thoracique" to a valid ScintigraphyExam type.
      examType: 'Scintigraphie Osseuse',
      activityPrepared: 370,
      unit: 'MBq',
      preparationDateTime: new Date().toISOString(),
      preparedBy: 'Tech Principal'
    }
  ]
};

const additionalPatients: Patient[] = [
  // Stage: REQUEST
  {
    id: 'PAT004', name: 'Luc Martin', dateOfBirth: '1978-05-20', creationDate: '2024-07-22T08:10:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.WAITING,
    history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T08:10:00Z', statusMessage: 'Patient créé.' }],
    roomSpecificData: {}
  },
  {
    id: 'PAT005', name: 'Sophie Bernard', dateOfBirth: '1992-02-14', creationDate: '2024-07-22T08:15:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.SEEN,
    history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T08:15:00Z', statusMessage: 'Patient créé.' }, { roomId: RoomId.REQUEST, entryDate: '2024-07-22T08:25:00Z', statusMessage: 'Demande complétée pour Scintigraphie Osseuse. Prêt pour RDV.' }],
    roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} } }
  },
  // ... (9 more in REQUEST)
  { id: 'PAT006', name: 'Pierre Dubois', dateOfBirth: '1963-11-30', creationDate: '2024-07-22T09:00:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T09:00:00Z', statusMessage: 'Patient créé.' }], roomSpecificData: {} },
  { id: 'PAT007', name: 'Camille Robert', dateOfBirth: '1985-07-07', creationDate: '2024-07-22T09:05:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T09:05:00Z', statusMessage: 'Patient créé.' }], roomSpecificData: {} },
  { id: 'PAT008', name: 'Julien Moreau', dateOfBirth: '1995-01-12', creationDate: '2024-07-22T09:20:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.SEEN, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T09:20:00Z', statusMessage: 'Patient créé.' }, { roomId: RoomId.REQUEST, entryDate: '2024-07-22T09:30:00Z', statusMessage: 'Demande complétée pour Scintigraphie Rénale DMSA. Prêt pour RDV.' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Rénale DMSA', customFields: {} } } },
  { id: 'PAT009', name: 'Emma Laurent', dateOfBirth: '1971-09-18', creationDate: '2024-07-22T09:45:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T09:45:00Z', statusMessage: 'Patient créé.' }], roomSpecificData: {} },
  { id: 'PAT010', name: 'Nicolas Simon', dateOfBirth: '1988-03-25', creationDate: '2024-07-22T10:00:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T10:00:00Z', statusMessage: 'Patient créé.' }], roomSpecificData: {} },
  { id: 'PAT011', name: 'Léa Michel', dateOfBirth: '2000-06-01', creationDate: '2024-07-22T10:15:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.SEEN, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T10:15:00Z', statusMessage: 'Patient créé.' }, { roomId: RoomId.REQUEST, entryDate: '2024-07-22T10:25:00Z', statusMessage: 'Demande complétée pour Scintigraphie Thyroïdienne. Prêt pour RDV.' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Thyroïdienne', customFields: {} } } },
  { id: 'PAT012', name: 'Alexandre Leroy', dateOfBirth: '1959-12-05', creationDate: '2024-07-22T10:30:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T10:30:00Z', statusMessage: 'Patient créé.' }], roomSpecificData: {} },
  { id: 'PAT013', name: 'Manon Roux', dateOfBirth: '1999-08-22', creationDate: '2024-07-22T10:40:00Z', currentRoomId: RoomId.REQUEST, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-22T10:40:00Z', statusMessage: 'Patient créé.' }], roomSpecificData: {} },
  
  // Stage: APPOINTMENT
  {
    id: 'PAT014', name: 'Thomas David', dateOfBirth: '1981-04-11', creationDate: '2024-07-21T14:00:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.WAITING,
    history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T14:00:00Z', exitDate: '2024-07-21T14:10:00Z', statusMessage: 'Demande complétée pour Scintigraphie Osseuse.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T14:10:01Z', statusMessage: 'Entré dans Rendez-vous' }],
    roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} } }
  },
  // ... (9 more in APPOINTMENT)
  { id: 'PAT015', name: 'Chloé Bertrand', dateOfBirth: '1994-10-02', creationDate: '2024-07-21T14:30:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.SEEN, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T14:30:00Z', exitDate: '2024-07-21T14:40:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T14:40:01Z', statusMessage: 'RDV planifié.' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Thyroïdienne', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-25', heureRdv: '10:00' } } },
  { id: 'PAT016', name: 'Antoine Girard', dateOfBirth: '1975-03-19', creationDate: '2024-07-21T15:00:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T15:00:00Z', exitDate: '2024-07-21T15:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T15:10:01Z', statusMessage: 'Entré dans Rendez-vous' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Parathyroïdienne', customFields: {} } } },
  { id: 'PAT017', name: 'Pauline Bonnet', dateOfBirth: '1989-08-01', creationDate: '2024-07-21T15:20:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T15:20:00Z', exitDate: '2024-07-21T15:30:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T15:30:01Z', statusMessage: 'Entré dans Rendez-vous' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Rénale DTPA/MAG3', customFields: {} } } },
  { id: 'PAT018', name: 'Hugo Lefebvre', dateOfBirth: '2001-12-12', creationDate: '2024-07-21T15:45:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.SEEN, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T15:45:00Z', exitDate: '2024-07-21T15:55:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T15:55:01Z', statusMessage: 'RDV planifié.' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-26', heureRdv: '11:30' } } },
  { id: 'PAT019', name: 'Clara Fournier', dateOfBirth: '1968-06-28', creationDate: '2024-07-21T16:00:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T16:00:00Z', exitDate: '2024-07-21T16:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T16:10:01Z', statusMessage: 'Entré dans Rendez-vous' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} } } },
  { id: 'PAT020', name: 'Mathieu Andre', dateOfBirth: '1979-11-15', creationDate: '2024-07-21T16:30:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T16:30:00Z', exitDate: '2024-07-21T16:40:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T16:40:01Z', statusMessage: 'Entré dans Rendez-vous' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Thyroïdienne', customFields: {} } } },
  { id: 'PAT021', name: 'Juliette Mercier', dateOfBirth: '1996-05-09', creationDate: '2024-07-21T17:00:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.SEEN, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T17:00:00Z', exitDate: '2024-07-21T17:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T17:10:01Z', statusMessage: 'RDV planifié.' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-29', heureRdv: '09:00' } } },
  { id: 'PAT022', name: 'Romain Petit', dateOfBirth: '1984-02-17', creationDate: '2024-07-21T17:20:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T17:20:00Z', exitDate: '2024-07-21T17:30:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T17:30:01Z', statusMessage: 'Entré dans Rendez-vous' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Rénale DMSA', customFields: {} } } },
  { id: 'PAT023', name: 'Eva Durand', dateOfBirth: '1990-09-03', creationDate: '2024-07-21T17:45:00Z', currentRoomId: RoomId.APPOINTMENT, statusInRoom: PatientStatusInRoom.WAITING, history: [{ roomId: RoomId.REQUEST, entryDate: '2024-07-21T17:45:00Z', exitDate: '2024-07-21T17:55:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T17:55:01Z', statusMessage: 'Entré dans Rendez-vous' }], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Thyroïdienne', customFields: {} } } },

  // Stage: CONSULTATION
  {
    id: 'PAT024', name: 'Valentin Richard', dateOfBirth: '1976-10-10', creationDate: '2024-07-20T10:00:00Z', currentRoomId: RoomId.CONSULTATION, statusInRoom: PatientStatusInRoom.WAITING,
    history: [
      { roomId: RoomId.REQUEST, entryDate: '2024-07-20T10:00:00Z', exitDate: '2024-07-20T10:10:00Z', statusMessage: 'Demande complétée.' },
      { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T10:10:01Z', exitDate: '2024-07-22T08:29:59Z', statusMessage: 'RDV planifié.' },
      { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T08:30:00Z', statusMessage: 'Entré dans Consultation' },
    ],
    roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '08:30' } }
  },
  // ... (7 more in CONSULTATION)
  { id: 'PAT025', name: 'Alice Lambert', dateOfBirth: '1982-01-23', creationDate: '2024-07-20T11:00:00Z', currentRoomId: RoomId.CONSULTATION, statusInRoom: PatientStatusInRoom.SEEN, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-20T11:00:00Z', exitDate: '2024-07-20T11:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T11:10:01Z', exitDate: '2024-07-22T08:59:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T09:00:00Z', statusMessage: 'Consultation terminée.' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '09:00' }, [RoomId.CONSULTATION]: { resumeConsultation: 'Patient apte pour l\'examen.' } } },
  { id: 'PAT026', name: 'Théo Rousseau', dateOfBirth: '1993-07-14', creationDate: '2024-07-20T11:30:00Z', currentRoomId: RoomId.CONSULTATION, statusInRoom: PatientStatusInRoom.WAITING, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-20T11:30:00Z', exitDate: '2024-07-20T11:40:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T11:40:01Z', exitDate: '2024-07-22T09:29:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T09:30:00Z', statusMessage: 'Entré dans Consultation' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Thyroïdienne', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '09:30' } } },
  { id: 'PAT027', name: 'Laura Vincent', dateOfBirth: '1969-04-05', creationDate: '2024-07-20T12:00:00Z', currentRoomId: RoomId.CONSULTATION, statusInRoom: PatientStatusInRoom.WAITING, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-20T12:00:00Z', exitDate: '2024-07-20T12:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T12:10:01Z', exitDate: '2024-07-22T09:59:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T10:00:00Z', statusMessage: 'Entré dans Consultation' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Rénale DTPA/MAG3', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '10:00' } } },
  { id: 'PAT028', name: 'Quentin Muller', dateOfBirth: '1987-09-21', creationDate: '2024-07-20T12:30:00Z', currentRoomId: RoomId.CONSULTATION, statusInRoom: PatientStatusInRoom.SEEN, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-20T12:30:00Z', exitDate: '2024-07-20T12:40:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T12:40:01Z', exitDate: '2024-07-22T10:29:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T10:30:00Z', statusMessage: 'Consultation terminée.' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '10:30' }, [RoomId.CONSULTATION]: { resumeConsultation: 'Vérification des contre-indications.' } } },
  { id: 'PAT029', name: 'Sarah Gomez', dateOfBirth: '1998-11-11', creationDate: '2024-07-20T13:00:00Z', currentRoomId: RoomId.CONSULTATION, statusInRoom: PatientStatusInRoom.WAITING, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-20T13:00:00Z', exitDate: '2024-07-20T13:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T13:10:01Z', exitDate: '2024-07-22T10:59:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T11:00:00Z', statusMessage: 'Entré dans Consultation' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '11:00' } } },
  { id: 'PAT030', name: 'Maxime Brun', dateOfBirth: '1965-02-08', creationDate: '2024-07-20T13:30:00Z', currentRoomId: RoomId.CONSULTATION, statusInRoom: PatientStatusInRoom.WAITING, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-20T13:30:00Z', exitDate: '2024-07-20T13:40:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T13:40:01Z', exitDate: '2024-07-22T11:29:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T11:30:00Z', statusMessage: 'Entré dans Consultation' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Thyroïdienne', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '11:30' } } },
  { id: 'PAT031', name: 'Mélanie Henry', dateOfBirth: '1991-08-30', creationDate: '2024-07-20T14:00:00Z', currentRoomId: RoomId.CONSULTATION, statusInRoom: PatientStatusInRoom.SEEN, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-20T14:00:00Z', exitDate: '2024-07-20T14:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T14:10:01Z', exitDate: '2024-07-22T11:59:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T12:00:00Z', statusMessage: 'Consultation terminée.' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Rénale DMSA', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '12:00' }, [RoomId.CONSULTATION]: { resumeConsultation: 'Patient stable, prêt pour injection.' } } },
  
  // Stage: INJECTION
  {
    id: 'PAT032', name: 'Lucas Roy', dateOfBirth: '1980-05-15', creationDate: '2024-07-19T09:00:00Z', currentRoomId: RoomId.INJECTION, statusInRoom: PatientStatusInRoom.WAITING,
    history: [
        { roomId: RoomId.REQUEST, entryDate: '2024-07-19T09:00:00Z', exitDate: '2024-07-19T09:10:00Z', statusMessage: 'Demande complétée.' },
        { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-19T09:10:01Z', exitDate: '2024-07-22T08:59:59Z', statusMessage: 'RDV planifié.' },
        { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T09:00:00Z', exitDate: '2024-07-22T09:15:00Z', statusMessage: 'Consultation terminée.' },
        { roomId: RoomId.INJECTION, entryDate: '2024-07-22T09:15:01Z', statusMessage: 'Entré dans Injection' },
    ],
    roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '09:00' } }
  },
  // ... (2 more in INJECTION)
  { id: 'PAT033', name: 'Zoé Pichon', dateOfBirth: '1997-03-03', creationDate: '2024-07-19T10:00:00Z', currentRoomId: RoomId.INJECTION, statusInRoom: PatientStatusInRoom.SEEN, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-19T10:00:00Z', exitDate: '2024-07-19T10:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-19T10:10:01Z', exitDate: '2024-07-22T09:29:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T09:30:00Z', exitDate: '2024-07-22T09:45:00Z', statusMessage: 'Consultation terminée.' }, { roomId: RoomId.INJECTION, entryDate: '2024-07-22T09:45:01Z', statusMessage: 'Injection de 740 MBq (MDP) enregistrée.' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '09:30' }, [RoomId.INJECTION]: { produitInjecte: 'MDP', dose: '740 MBq', heureInjection: '09:40' } } },
  { id: 'PAT034', name: 'Gabriel Chevalier', dateOfBirth: '1973-12-24', creationDate: '2024-07-19T11:00:00Z', currentRoomId: RoomId.INJECTION, statusInRoom: PatientStatusInRoom.WAITING, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-19T11:00:00Z', exitDate: '2024-07-19T11:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-19T11:10:01Z', exitDate: '2024-07-22T09:59:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T10:00:00Z', exitDate: '2024-07-22T10:15:00Z', statusMessage: 'Consultation terminée.' }, { roomId: RoomId.INJECTION, entryDate: '2024-07-22T10:15:01Z', statusMessage: 'Entré dans Injection' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Thyroïdienne', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '10:00' } } },

  // Stage: EXAMINATION
  { id: 'PAT035', name: 'Inès Lemoine', dateOfBirth: '1960-01-01', creationDate: '2024-07-18T14:00:00Z', currentRoomId: RoomId.EXAMINATION, statusInRoom: PatientStatusInRoom.WAITING, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-18T14:00:00Z', exitDate: '2024-07-18T14:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-18T14:10:01Z', exitDate: '2024-07-22T10:29:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T10:30:00Z', exitDate: '2024-07-22T10:45:00Z', statusMessage: 'Consultation terminée.' }, { roomId: RoomId.INJECTION, entryDate: '2024-07-22T10:45:01Z', exitDate: '2024-07-22T10:50:00Z', statusMessage: 'Injection enregistrée.' }, { roomId: RoomId.EXAMINATION, entryDate: '2024-07-22T10:50:01Z', statusMessage: 'Entré dans Examen' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '10:30' } } },
  // ... (1 more in EXAMINATION)
  { id: 'PAT036', name: 'Adam Marchand', dateOfBirth: '1986-07-20', creationDate: '2024-07-18T15:00:00Z', currentRoomId: RoomId.EXAMINATION, statusInRoom: PatientStatusInRoom.SEEN, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-18T15:00:00Z', exitDate: '2024-07-18T15:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-18T15:10:01Z', exitDate: '2024-07-22T10:59:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T11:00:00Z', exitDate: '2024-07-22T11:15:00Z', statusMessage: 'Consultation terminée.' }, { roomId: RoomId.INJECTION, entryDate: '2024-07-22T11:15:01Z', exitDate: '2024-07-22T11:20:00Z', statusMessage: 'Injection enregistrée.' }, { roomId: RoomId.EXAMINATION, entryDate: '2024-07-22T11:20:01Z', statusMessage: 'Examen saisi (Qualité: Bonne).' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '11:00' }, [RoomId.EXAMINATION]: { qualiteImages: 'Bonne' } } },

  // Stage: REPORT
  { id: 'PAT037', name: 'Louise Garnier', dateOfBirth: '1955-04-12', creationDate: '2024-07-17T08:00:00Z', currentRoomId: RoomId.REPORT, statusInRoom: PatientStatusInRoom.WAITING, history: [ { roomId: RoomId.REQUEST, entryDate: '2024-07-17T08:00:00Z', exitDate: '2024-07-17T08:10:00Z', statusMessage: 'Demande complétée.' }, { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-17T08:10:01Z', exitDate: '2024-07-22T11:29:59Z', statusMessage: 'RDV planifié.' }, { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T11:30:00Z', exitDate: '2024-07-22T11:45:00Z', statusMessage: 'Consultation terminée.' }, { roomId: RoomId.INJECTION, entryDate: '2024-07-22T11:45:01Z', exitDate: '2024-07-22T11:50:00Z', statusMessage: 'Injection enregistrée.' }, { roomId: RoomId.EXAMINATION, entryDate: '2024-07-22T11:50:01Z', exitDate: '2024-07-22T12:20:00Z', statusMessage: 'Examen saisi.' }, { roomId: RoomId.REPORT, entryDate: '2024-07-22T12:20:01Z', statusMessage: 'Entré dans Compte Rendu' } ], roomSpecificData: { [RoomId.REQUEST]: { requestedExam: 'Scintigraphie Osseuse', customFields: {} }, [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '11:30' } } },
];


export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PAT001',
    name: 'Jean Dupont',
    dateOfBirth: '1965-08-15',
    creationDate: '2024-07-20T09:00:00Z',
    currentRoomId: RoomId.INJECTION,
    statusInRoom: PatientStatusInRoom.WAITING,
    history: [
      { roomId: RoomId.REQUEST, entryDate: '2024-07-20T09:00:00Z', exitDate: '2024-07-20T09:05:00Z', statusMessage: "Demande pour Scintigraphie Osseuse complétée." },
      { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-20T09:05:01Z', exitDate: '2024-07-22T08:00:00Z', statusMessage: "RDV planifié pour le 22/07 à 8h30." },
      { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T08:30:00Z', exitDate: '2024-07-22T08:45:00Z', statusMessage: "Consultation terminée. Patient apte." },
      { roomId: RoomId.INJECTION, entryDate: '2024-07-22T08:45:01Z', statusMessage: "Entré dans Injection." }
    ],
    roomSpecificData: {
      [RoomId.REQUEST]: { requestedExam: "Scintigraphie Osseuse", customFields: {} },
      [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '08:30' },
    }
  },
  {
    id: 'PAT002',
    name: 'Marie Curie',
    dateOfBirth: '1980-03-22',
    creationDate: '2024-07-21T11:00:00Z',
    currentRoomId: RoomId.EXAMINATION,
    statusInRoom: PatientStatusInRoom.SEEN,
    history: [
      { roomId: RoomId.REQUEST, entryDate: '2024-07-21T11:00:00Z', exitDate: '2024-07-21T11:10:00Z', statusMessage: "Demande pour Scintigraphie Thyroïdienne complétée." },
      { roomId: RoomId.APPOINTMENT, entryDate: '2024-07-21T11:10:01Z', exitDate: '2024-07-22T09:00:00Z', statusMessage: "RDV planifié pour le 22/07 à 9h00." },
      { roomId: RoomId.CONSULTATION, entryDate: '2024-07-22T09:00:00Z', exitDate: '2024-07-22T09:20:00Z', statusMessage: "Consultation terminée." },
      { roomId: RoomId.INJECTION, entryDate: '2024-07-22T09:20:01Z', exitDate: '2024-07-22T09:25:00Z', statusMessage: "Injection de 185 MBq de 99mTc-Pertechnetate enregistrée." },
      { roomId: RoomId.EXAMINATION, entryDate: '2024-07-22T09:45:00Z', statusMessage: "Examen saisi (Qualité: Excellente)." },
    ],
    roomSpecificData: {
      [RoomId.REQUEST]: { requestedExam: "Scintigraphie Thyroïdienne", customFields: {} },
      [RoomId.APPOINTMENT]: { dateRdv: '2024-07-22', heureRdv: '09:00' },
      [RoomId.EXAMINATION]: { qualiteImages: 'Excellente' },
    }
  },
  {
    id: 'PAT003',
    name: 'Pierre Bernard',
    dateOfBirth: '1955-11-10',
    creationDate: '2024-07-22T08:00:00Z',
    currentRoomId: RoomId.REQUEST,
    statusInRoom: PatientStatusInRoom.WAITING,
    history: [
      { roomId: RoomId.REQUEST, entryDate: '2024-07-22T08:00:00Z', statusMessage: "Patient créé." },
    ],
    roomSpecificData: {}
  },
  ...additionalPatients,
];

export const ROOMS_CONFIG: Room[] = [
  { 
    id: RoomId.REQUEST, 
    name: "Demande", 
    description: "Création et gestion des demandes d'examen initiales.",
    icon: ClipboardListIcon,
    allowedRoleIds: ['role_admin', 'role_reception'],
    nextRoomId: RoomId.APPOINTMENT,
  },
  { 
    id: RoomId.APPOINTMENT, 
    name: "Rendez-vous", 
    description: "Planification des rendez-vous pour les patients.",
    icon: CalendarDaysIcon,
    allowedRoleIds: ['role_admin', 'role_reception'],
    nextRoomId: RoomId.CONSULTATION,
  },
  { 
    id: RoomId.CONSULTATION, 
    name: "Consultation", 
    description: "Consultation médicale pré-injection.",
    icon: UsersIcon,
    allowedRoleIds: ['role_admin', 'role_doctor'],
    nextRoomId: RoomId.INJECTION,
  },
  { 
    id: RoomId.INJECTION, 
    name: "Injection", 
    description: "Salle d'injection du traceur radioactif.",
    icon: BeakerIcon,
    allowedRoleIds: ['role_admin', 'role_technician'],
    nextRoomId: RoomId.EXAMINATION,
  },
  { 
    id: RoomId.EXAMINATION, 
    name: "Examen", 
    description: "Réalisation de l'imagerie scintigraphique.",
    icon: CameraIcon,
    allowedRoleIds: ['role_admin', 'role_technician'],
    nextRoomId: RoomId.REPORT,
  },
  { 
    id: RoomId.REPORT, 
    name: "Compte Rendu", 
    description: "Rédaction et validation des comptes rendus.",
    icon: DocumentTextIcon,
    allowedRoleIds: ['role_admin', 'role_doctor'],
    nextRoomId: RoomId.RETRAIT_CR_SORTIE,
  },
  { 
    id: RoomId.RETRAIT_CR_SORTIE, 
    name: "Retrait CR / Sortie", 
    description: "Remise du compte rendu et finalisation du dossier.",
    icon: ArchiveBoxArrowDownIcon,
    allowedRoleIds: ['role_admin', 'role_reception'],
    nextRoomId: RoomId.ARCHIVE,
  },
  { 
    id: RoomId.ARCHIVE, 
    name: "Archive", 
    description: "Dossiers des patients terminés et archivés.",
    icon: ArchiveBoxIcon,
    allowedRoleIds: ['role_admin'],
    nextRoomId: null,
  },
];

export const INITIAL_REPORT_TEMPLATES: ReportTemplate[] = [
    {
      id: 'template_so_normal_1',
      examName: "Scintigraphie Osseuse",
      name: "Scintigraphie Osseuse - Normale",
      reportContent: `
        <p><b>Technique :</b></p>
        <p>Injection intraveineuse de 740 MBq de 99mTc-HMDP. Acquisition d'images corps entier et de clichés statiques 3 heures après l'injection.</p>
        <p><b>Résultats :</b></p>
        <p>L'examen met en évidence une distribution homogène du traceur sur l'ensemble du squelette, sans foyer d'hyperfixation pathologique suspect.</p>
        <ul>
            <li>Fixation symétrique des ceintures scapulaire et pelvienne.</li>
            <li>Rachis sans anomalie de fixation.</li>
            <li>Articulations périphériques présentant une fixation modérée et symétrique, en rapport avec des remaniements dégénératifs d'arthrose.</li>
        </ul>
        <p>Visualisation normale des reins et de la vessie (élimination urinaire).</p>
      `,
      conclusionContent: "<p>Absence d'anomalie de fixation osseuse TDM-scintigraphique suspecte d'une localisation secondaire.</p>"
    },
    {
      id: 'template_so_meta_1',
      examName: "Scintigraphie Osseuse",
      name: "Scintigraphie Osseuse - Métastases Multiples",
      reportContent: `
        <p><b>Technique :</b></p>
        <p>Injection intraveineuse de 740 MBq de 99mTc-HMDP. Acquisition d'images corps entier et de clichés statiques 3 heures après l'injection.</p>
        <p><b>Résultats :</b></p>
        <p>L'examen met en évidence de multiples foyers d'hyperfixation pathologique intense, de topographie non systématisée, disséminés sur l'ensemble du squelette, notamment au niveau :</p>
        <ul>
            <li>Du rachis dorsal et lombaire.</li>
            <li>Du bassin (ilium droit, sacrum).</li>
            <li>Des côtes (arcs postérieurs droits).</li>
            <li>Du fémur proximal gauche.</li>
        </ul>
        <p>Ces lésions sont très suspectes de localisations secondaires osseuses.</p>
      `,
      conclusionContent: "<p>Multiples foyers d'hyperfixation pathologique disséminés sur le squelette, fortement évocateurs de localisations secondaires multiples.</p>"
    },
    {
      id: 'template_st_normal_1',
      examName: "Scintigraphie Thyroïdienne",
      name: "Scintigraphie Thyroïdienne - Normale",
      reportContent: `
          <p><b>Technique :</b></p>
          <p>Injection intraveineuse de 185 MBq de 99mTc-Pertechnétate. Acquisition d'images statiques 20 minutes après l'injection.</p>
          <p><b>Résultats :</b></p>
          <p>La thyroïde est en position normale. La fixation du traceur est homogène sur l'ensemble des deux lobes, sans nodule hypo ou hyperfixant individualisable.</p>
          <p>Les contours sont réguliers, la taille de la glande est estimée normale.</p>
      `,
      conclusionContent: "<p>Scintigraphie thyroïdienne d'aspect normal.</p>"
    }
];

export const INITIAL_ASSETS: Asset[] = [
    { id: 'ASSET001', family: 'Informatique', designation: 'Switch SCISCO SG350-28P', serialNumber: 'DNI241806TQ', quantity: 1, acquisitionYear: 2022, isFunctional: true, currentAction: 'En service', acquisitionCost: 500 },
    { id: 'ASSET002', family: 'Mobilier', designation: 'Fauteuil de bureau', quantity: 5, acquisitionYear: 2015, isFunctional: true, currentAction: 'En service', acquisitionCost: 150 },
    { id: 'ASSET003', family: 'Climatisation', designation: 'Climatiseur 3CV NASCO', quantity: 1, acquisitionYear: 2015, isFunctional: false, currentAction: 'En réparation' },
    { id: 'ASSET004', family: 'Groupe électrogène', designation: 'Groupe électrogène CUMMINS 44KVA', serialNumber: 'C44D5C141204362', quantity: 1, acquisitionYear: 2015, isFunctional: true, currentAction: 'En service' },
];

export const INITIAL_STOCK_ITEMS: StockItem[] = [
    { 
        id: 'STOCK01', 
        designation: 'Ramette Papier A4', 
        unit: 'ramette',
        currentStock: 50, 
        unitPrice: 5, 
        movements: [
            { id: 'MVT01', date: '2024-07-01T10:00:00Z', type: 'Entrée', quantity: 100, unitPrice: 5, documentRef: 'BE-2024-001', ordonnateur: 'Admin Initial' },
            { id: 'MVT02', date: '2024-07-15T14:00:00Z', type: 'Sortie', quantity: 50, unitPrice: 5, documentRef: 'BC-2024-015', destinationOrSource: 'Service Radiologie' },
        ]
    },
    { 
        id: 'STOCK02', 
        designation: 'Cartouche encre Noire HP 953XL', 
        unit: 'pièce',
        currentStock: 10, 
        unitPrice: 45, 
        movements: [
            { id: 'MVT03', date: '2024-06-20T09:00:00Z', type: 'Entrée', quantity: 20, unitPrice: 45, documentRef: 'BE-2024-001', ordonnateur: 'Admin Initial' },
            { id: 'MVT04', date: '2024-07-20T11:00:00Z', type: 'Sortie', quantity: 10, unitPrice: 45, documentRef: 'BC-2024-018', destinationOrSource: 'Secrétariat' },
        ]
    },
    {
        id: 'STOCK03',
        designation: 'Seringue 5ml',
        unit: 'boîte',
        currentStock: 20,
        unitPrice: 15,
        movements: [
            { id: 'MVT05', date: '2024-07-10T09:00:00Z', type: 'Entrée', quantity: 20, unitPrice: 15, documentRef: 'BE-2024-002', ordonnateur: 'Admin Initial' }
        ]
    }
];
