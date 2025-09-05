import React from 'react';

export type Permission = 
  | 'view_patients'
  | 'edit_patients'
  | 'create_patients'
  | 'move_patients'
  | 'manage_appointments'
  | 'manage_users'
  | 'manage_roles'
  | 'view_hot_lab'
  | 'edit_hot_lab'
  | 'view_statistics';

export const ALL_PERMISSIONS: { id: Permission, label: string }[] = [
    { id: 'view_patients', label: 'Voir les patients' },
    { id: 'edit_patients', label: 'Modifier les patients' },
    { id: 'create_patients', label: 'Créer les patients' },
    { id: 'move_patients', label: 'Déplacer les patients' },
    { id: 'manage_appointments', label: 'Gérer les rendez-vous' },
    { id: 'manage_users', label: 'Gérer les utilisateurs' },
    { id: 'manage_roles', label: 'Gérer les rôles' },
    { id: 'view_hot_lab', label: 'Voir le labo chaud' },
    { id: 'edit_hot_lab', label: 'Modifier le labo chaud' },
    { id: 'view_statistics', label: 'Voir les statistiques' },
];

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export enum RoomId {
  REQUEST = 'DEMANDE',
  APPOINTMENT = 'RENDEZVOUS',
  CONSULTATION = 'CONSULTATION',
  GENERATOR = 'GENERATEUR', // Sera "Gestion Labo Chaud"
  INJECTION = 'INJECTION',
  EXAMINATION = 'EXAMEN',
  REPORT = 'COMPTE_RENDU',
  RETRAIT_CR_SORTIE = 'RETRAIT_CR_SORTIE',
  ARCHIVE = 'ARCHIVE',
}

export enum PatientStatusInRoom {
  WAITING = 'WAITING',
  SEEN = 'SEEN', 
}

export interface PatientHistoryEntry {
  roomId: RoomId;
  entryDate: string;
  exitDate?: string;
  statusMessage: string;
}

export type ScintigraphyExam = 
  | "Scintigraphie Osseuse"
  | "Scintigraphie Parathyroïdienne"
  | "Scintigraphie Rénale DMSA"
  | "Scintigraphie Rénale DTPA/MAG3"
  | "Scintigraphie Thyroïdienne";


export type ReferringEntityType = 'service' | 'center' | 'doctor';

export interface ReferringEntity {
  type: ReferringEntityType;
  name: string;
  contactNumber?: string;
  contactEmail?: string;
}

export type PeriodOption = 'today' | 'thisWeek' | 'thisMonth';

export type ActiveView = 'room' | 'search' | 'daily_worklist' | 'patient_detail' | 'rooms_overview' | 'activity_feed' | 'statistics' | 'hot_lab' | 'tracers_management' | 'preparations_management' | 'isotopes_management' | 'administration' | 'exam_settings' | 'database' | 'report_templates_settings' | 'patrimony_dashboard' | 'patrimony_inventory' | 'patrimony_stock' | 'patrimony_stock_detail' | 'patrimony_asset_status';

export type PaymentMethod = 'nonAssure' | 'assure' | 'priseEnCharge' | 'autres';

// FIX: Add NewPatientData interface for creating new patients to resolve spread operator type error.
export interface NewPatientData {
  name: string;
  dateOfBirth: string;
  address?: string;
  phone?: string;
  email?: string;
  referringEntity?: ReferringEntity;
}

// FIX: Add RequestIndications interface used in forms and patient data.
export interface RequestIndications {
  bilanExtensionInitial?: boolean;
  bilanRecidive?: boolean;
  bilanComparatif?: boolean;
  evaluation?: boolean;
  autres?: string;
}

// --- START: Exam Configuration Types ---
export type ConfigurableFieldType = 'text' | 'textarea' | 'select' | 'checkbox';

export interface ConfigurableField {
  id: string;
  label: string;
  type: ConfigurableFieldType;
  options?: string[]; // For 'select' and 'checkbox' types
}

export interface ExamConfiguration {
  id: string;
  name: string;
  fields: {
    request: ConfigurableField[];
    consultation: ConfigurableField[];
    report: ConfigurableField[];
  };
}
// --- END: Exam Configuration Types ---


// --- START: Bone Scintigraphy Form Data Types ---
export interface BoneScintigraphyData {
  formDate?: string;
  paymentMethod?: PaymentMethod;
  referringDoctor?: string;
  referringService?: string;
  nextAppointmentDate?: string;
  examiner?: string;

  clinicalExam?: {
    weight?: string;
    height?: string;
    imc?: string;
    ta?: string;
    pulse?: string;
    ddr?: string;
    isMenopausal?: boolean;
    isBreastfeeding?: boolean;
    hasContraception?: boolean;
    isPregnancyRisk?: boolean;
    hasIncontinence?: boolean;
    appealSigns?: string;
    paraneoplasticSyndrome?: string;
  };
  
  anatomoPathology?: {
    tumorSize?: string;
    ggInvasion?: string; 
    rStatus?: string; 
    histologicalType?: string;
    histoPrognosticGrade?: string;
    pTNMClassification?: string;
    gleasonScore?: string;
    isup?: string;
    immunohistochemistry?: {
      re?: string;
      rp?: string;
      her2?: string;
      ki67?: string;
    };
  };

  mskHistory?: {
    trauma?: string;
    surgery?: string;
    articularProsthesis?: string;
    buccodentalStatus?: string;
    boneBiopsy?: string;
    others?: string;
  };
  
  otherHistoryAndLifestyle?: {
    hta?: boolean;
    diabetes?: boolean;
    alcohol?: boolean;
  };
  
  imaging?: {
    tdm?: string;
    irm?: string;
    scintigraphy?: string;
  };

  laboratory?: {
    psa?: string;
    ca15_3?: string;
    ca125?: string;
    ca19_9?: string;
    ace?: string;
    afp?: string;
    pal?: string;
    ca?: string;
    thyroglobulin?: string;
    acAntiTg?: string;
    others?: string;
  };
  
  injectionDetails?: {
    coldMolecule?: string;
    prescribedActivity?: string;
    injectionTime?: string;
    injectedActivity?: string;
    technician?: string;
    injectionPoint?: string;
  };
  
  treatment?: {
    chrType?: string;
    chrDate?: string;
    cthType?: string;
    cthCureCount?: string;
    cthLastCureDate?: string;
    rthType?: string;
    rthSessionCount?: string;
    rthSite?: string;
    rthLastSessionDate?: string;
    hormonotherapy?: string;
    targetedTherapy?: string;
    bisphosphonate?: string;
    corticosteroid?: string;
    others?: string;
  };
  
  acquisitions?: {
    entryTime?: string;
    acquisitionTime?: string;
    exitTime?: string;
    threePhaseDynamic?: string;
    threePhaseEarly?: string;
    threePhaseStatic?: string;
    threePhaseWholeBody?: string;
    twoPhaseEarly?: string;
    twoPhaseStatic?: string;
    twoPhaseWholeBody?: string;
    wholeBody?: string;
    staticClichés?: string;
    spect?: string;
  };
  
  hotConsultation?: {
    examiner?: string;
    details?: string;
  };
  
  contextualAnalysis?: string;
  conclusion?: string;
}
// --- END: Bone Scintigraphy Form Data Types ---


// --- START: Parathyroid Scintigraphy Form Data Types ---
export interface ParathyroidScintigraphyData {
  formDate?: string;
  paymentMethod?: PaymentMethod;
  referringDoctor?: string;
  referringDoctorEmail?: string;
  referringService?: string;
  nextAppointmentDate?: string;
  examiner?: string;

  clinicalExam?: {
    weight?: string;
    height?: string;
    imc?: string;
    ddr?: string;
    isMenopausal?: boolean;
    hasContraception?: boolean;
    isPregnancyRisk?: boolean;
    appealSigns?: string;
    hasIncontinence?: boolean;
    comments?: string;
  };

  antecedents?: {
    medicalThyroidReins?: string;
    surgeryThyroidReinsDigestive?: string;
    cytoponctionThyroid?: string;
    others?: string;
  };
  
  indication?: {
    hptI?: boolean;
    hptII?: boolean;
    hptIII?: boolean;
    others?: string;
  };

  injectionDetails?: {
    technetiumFreeActivity?: string;
    mibiInjectedActivity?: string;
    injectionTime99mTc?: string;
    injectionTimeMIBI?: string;
    injectionPoint?: string;
    technician?: string;
  };
  
  treatment?: {
    ongoingATS?: boolean;
    ongoingThyroidHormone?: boolean;
    ongoingIodine?: boolean;
    ongoingIodinatedContrast?: boolean;
    dciOrCommercialName?: string;
    duration?: string;
    stopDate?: string;
    windowDuration?: string;
  };

  laboratory?: {
    pth?: string;
    calcemia?: string;
    phosphoremia?: string;
    calciuria?: string;
    phosphaturia?: string;
    vitaminD?: string;
    tshus?: string;
    t4l?: string;
    t3l?: string;
  };
  
  echographyImena?: string;
  echographyPrecedent?: string;
  tdm?: string;

  acquisitions?: {
    entryTime?: string;
    acquisitionTime?: string;
    exitTime?: string;
    protocolSubtraction?: boolean;
    protocolDoublePhase?: boolean;
    anteriorCervicalClichés?: string;
    mediastinalImage?: string;
    profile?: string;
    spect?: string;
    lateImage?: string;
  };

  hotConsultation?: {
    examiner?: string;
    details?: string;
  };
  
  contextualAnalysis?: string;
  conclusion?: string;
}
// --- END: Parathyroid Scintigraphy Form Data Types ---


// --- START: Renal DMSA Scintigraphy Form Data Types ---
export interface RenalDMSAScintigraphyData {
  formDate?: string;
  paymentMethod?: PaymentMethod;
  referringDoctor?: string;
  referringService?: string;
  nextAppointmentDate?: string;
  examiner?: string;
  antecedents?: string;

  clinicalExam?: {
    weight?: string;
    height?: string;
    imc?: string;
    ddr?: string;
    isMenopausal?: boolean;
    isBreastfeeding?: boolean;
    hasContraception?: boolean;
    isPregnancyRisk?: boolean;
    appealSigns?: {
        fever?: boolean;
        dysuria?: boolean;
        pollakiuria?: boolean;
        mictionalBurns?: boolean;
        urineTroubles?: boolean;
        hematuria?: boolean;
        lumbarAbdominalPain?: boolean;
    };
  };

  indication?: {
    side?: 'droit' | 'gauche';
    congenitalAnomaly?: {
        jpuSyndrome?: boolean;
        renalDysplasia?: boolean;
        rvu?: boolean;
        renalDuplication?: boolean;
        upValve?: boolean;
        ectopy?: boolean;
        megaureter?: boolean;
        refluxNephropathy?: boolean;
        ureterohydronephrosis?: boolean;
        hydronephrosis?: boolean;
        horseshoeKidney?: boolean;
        smallKidney?: boolean;
    };
    organDonation?: boolean;
    infectionOrOther?: {
        pna?: boolean;
        scarResearch?: boolean;
        sequelaeResearch?: boolean;
        urinaryInfection?: boolean;
    };
    surgicalEvaluation?: {
        preOperative?: boolean;
        postOperative?: boolean;
    };
    morphologicalLesion?: {
        abscess?: boolean;
        cyst?: boolean;
        corticalInfarction?: boolean;
        renalContusion?: boolean;
        renalTumor?: boolean;
    };
  };

  laboratory?: {
    urea?: string;
    creatinine?: string;
    dfg?: string;
    ecbu?: string;
    others?: string;
  };

  imaging?: {
    echography?: string;
    uroscanner?: string;
    uiv?: string;
    scintigraphy?: string;
  };
  
  injectionDetails?: {
    coldMolecule?: string;
    prescribedActivity?: string;
    injectionTime?: string;
    injectedActivity?: string;
    technician?: string;
  };

  treatment?: {
    ongoing?: string;
    medical?: {
        has: boolean;
        date?: string;
        which?: string;
    };
    surgical?: {
        has: boolean;
        date?: string;
        type?: string;
    };
    other?: string;
  };

  acquisitions?: {
    entryTime?: string;
    acquisitionTime?: string;
    exitTime?: string;
    staticViews?: string; // FA/FP/OAD/OPG...
    spect?: boolean;
    delayInjectionAcquisition?: '3H' | '4H' | '5H' | '6H' | 'sup6H';
    lateAcquisition24H?: boolean;
  };

  hotConsultation?: {
    examiner?: string;
    details?: string;
  };
  
  contextualAnalysis?: string;
  conclusion?: string;
}
// --- END: Renal DMSA Scintigraphy Form Data Types ---


// --- START: Renal DTPA/MAG3 Scintigraphy Form Data Types ---
export interface RenalDTPAMAG3ScintigraphyData {
  formDate?: string;
  paymentMethod?: PaymentMethod;
  referringDoctor?: string;
  referringService?: string;
  nextAppointmentDate?: string;
  examiner?: string;
  otherObservation?: string;

  clinicalExam?: {
    weight?: string;
    height?: string;
    imc?: string;
    ddr?: string;
    isMenopausal?: boolean;
    isBreastfeeding?: boolean;
    hasContraception?: boolean;
    isPregnancyRisk?: boolean;
    fever?: boolean;
    diarrhea?: boolean;
    vomiting?: boolean;
    dehydrationSigns?: boolean;
    urinaryLithiasis?: boolean;
    postDrinkPain?: boolean;
  };

  indication?: {
    side?: 'droit' | 'gauche';
    congenitalAnomaly?: {
        jpuSyndrome?: boolean;
        renalDysplasia?: boolean;
        rvu?: boolean;
        renalDuplication?: boolean;
        upValve?: boolean;
        ectopy?: boolean;
        megaureter?: boolean;
        horseshoeKidney?: boolean;
        ureterohydronephrosis?: boolean;
        hydronephrosis?: boolean;
    };
    organDonation?: boolean;
    surgicalEvaluation?: {
        preOperative?: boolean;
        postOperative?: boolean;
        dfg?: boolean;
        captoprilTest?: boolean;
    };
  };
  
  antecedents?: {
    antenatal?: string;
    postnatal?: string;
    malformation?: string;
  };

  laboratory?: {
    urea?: string;
    creatinine?: string;
    dfg?: string;
    ecbu?: string;
    others?: string;
  };

  imaging?: {
    echography?: string;
    uroscanner?: string;
    uiv?: string;
    scintigraphy?: string;
  };
  
  injectionDetails?: {
    coldMolecule?: string;
    prescribedActivity?: string;
    injectionTime?: string;
    injectedActivity?: string;
    technician?: string;
    injectionPoint?: string;
  };
  
  treatment?: {
    medical?: {
        has: boolean;
        date?: string;
        which?: string;
    };
    surgical?: {
        has: boolean;
        date?: string;
        type?: string;
    };
  };

  acquisitions?: {
    entryTime?: string;
    acquisitionTime?: string;
    exitTime?: string;
    dynamicAcquisition?: string;
    preMicturition?: boolean;
    postMicturitionEarly?: '15mn' | '30mn';
    postMicturitionLate?: '1H' | '2H' | '3H' | '4H';
  };
  
  hotConsultation?: {
    examiner?: string;
    details?: string;
  };
  
  contextualAnalysis?: string;
  conclusion?: string;
}
// --- END: Renal DTPA/MAG3 Scintigraphy Form Data Types ---


// --- START: Thyroid Scintigraphy Form Data Types ---
export interface ThyroidScintigraphyData {
  // Section en-tête
  formDate?: string;
  paymentMethod?: PaymentMethod;
  referringDoctor?: string;
  referringService?: string;
  nextAppointmentDate?: string;
  examiner?: string;

  // Section Examen Clinique
  clinicalExam?: {
    weight?: string;
    height?: string;
    imc?: string;
    ta?: string;
    pulse?: string;
    ddr?: string;
    isMenopausal?: boolean;
    isBreastfeeding?: boolean;
    hasContraception?: boolean;
    isPregnancyRisk?: boolean;
    hasExophthalmia?: boolean;
    hasAnteriorCervicalSwelling?: boolean;
    otherClinicalInfo?: string;
  };

  // Section Anamnèse
  indication?: {
    isHyperthyroidism?: boolean;
    isHyperthyroidismNodule?: boolean;
    isBasedow?: boolean;
    isAmiodarone?: boolean;
    isNoduleDiscovery?: boolean;
    isPreIratherapy?: boolean;
    isPostThyroidectomy?: boolean;
    isEctopyResearch?: boolean;
    isLingualThyr?: boolean;
    isInflammatory?: boolean;
    isSubacuteThyroiditis?: boolean;
    isGoiter?: boolean;
    isMultiNodularGoiter?: boolean;
    isToxicAdenoma?: boolean;
    otherIndication?: string;
  };

  antecedents?: {
    hasIodineDeficiency?: boolean;
    hasFamilialGoiter?: boolean;
    hasThyroidSurgery?: boolean;
    hasCervicalRadiotherapy?: boolean;
    biopsyCytopunction?: string;
    otherAntecedents?: string;
  };

  // Section Biologie
  laboratory?: {
    tshus?: string;
    t3l?: string;
    t4l?: string;
    acAntiTPO?: string;
    acAntiTG?: string;
    acAntiRTSH?: string;
    thyroglobulin?: string;
  };
  
  // Section Traitement
  treatment?: {
    ongoingATS?: boolean;
    ongoingHormone?: boolean;
    ongoingIodine?: boolean;
    dciOrCommercialName?: string;
    dose?: string;
    duration?: string;
    stopDate?: string;
    previousIratherapy?: string;
  };

  // Section Imagerie
  imaging?: {
    echography?: string;
    tdm?: string;
    irm?: string;
    otherImaging?: string;
  };

  // Section Technique et Synthèse
  injectionDetails?: {
    prescribedActivity?: string;
    injectedActivity?: string;
    injectionTime?: string;
    injectionSite?: string;
  };

  acquisitions?: {
    entryTime?: string;
    acquisitionTime?: string;
    exitTime?: string;
    fixation2H?: string;
    fixation24H?: string;
  };
  
  contextualAnalysis?: string;
  conclusion?: string;

}
// --- END: Thyroid Scintigraphy Form Data Types ---



// =================== PATIENT & ROOM CORE TYPES ===================

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  age?: number;
  address?: string;
  phone?: string;
  email?: string;
  referringEntity?: ReferringEntity;
  documents?: PatientDocument[];

  creationDate: string;
  currentRoomId: RoomId;
  statusInRoom: PatientStatusInRoom;
  history: PatientHistoryEntry[];

  // Data specific to each room, collected from forms
  roomSpecificData: {
    [key in RoomId]?: {
        [key: string]: any;
        // Specific detailed forms data can be nested here
        thyroidData?: ThyroidScintigraphyData;
        boneData?: BoneScintigraphyData;
        parathyroidData?: ParathyroidScintigraphyData;
        renalDMSAData?: RenalDMSAScintigraphyData;
        renalDTPAMAG3Data?: RenalDTPAMAG3ScintigraphyData;
    };
  };
}

export interface PatientDocument {
    id: string;
    name: string;
    fileType: string;
    uploadDate: string;
    dataUrl: string; // Base64 encoded string for the file
}

export interface Room {
  id: RoomId;
  name: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  allowedRoleIds: string[];
  nextRoomId: RoomId | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  roleId: string;
}

export interface ReportTemplate {
  id: string;
  examName: ScintigraphyExam;
  name: string;
  reportContent: string;
  conclusionContent: string;
}

// =================== HOT LAB TYPES ===================

export interface RadiopharmaceuticalProduct {
  id: string;
  name: string;
  isotope: string;
  unit: 'MBq' | 'mCi' | 'GBq';
}

export interface TracerLot {
  id: string;
  productId: string;
  lotNumber: string;
  expiryDate: string;
  calibrationDateTime?: string;
  initialActivity?: number;
  unit: 'MBq' | 'mCi' | 'GBq';
  receivedDate: string;
  quantityReceived: number;
  notes?: string;
}

export interface PreparationLog {
  id: string;
  tracerLotId: string;
  activityPrepared: number;
  unit: 'MBq' | 'mCi';
  preparationDateTime: string;
  preparedBy: string;
  patientId?: string;
  examType?: ScintigraphyExam;
  notes?: string;
}

export interface HotLabData {
  products: RadiopharmaceuticalProduct[];
  lots: TracerLot[];
  preparations: PreparationLog[];
}

// =================== TIMELINE TYPES ===================

export interface TimelineEvent {
    id: string;
    time: string; // "HH:MM"
    patient: Patient;
    type: 'appointment' | 'injection' | 'examination';
    description: string;
}

// =================== PATRIMONY TYPES ===================
export interface Asset {
  id: string;
  family: string;
  designation: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  acquisitionYear: number;
  acquisitionCost?: number;
  isFunctional: boolean;
  currentAction?: 'En service' | 'En réparation' | 'Réformé';
  fundingSource?: string;
  supplier?: string;
}

export type StockMovementType = 'Entrée' | 'Sortie' | 'Consommation' | 'Inventaire';

export interface StockMovement {
  id: string;
  date: string;
  type: StockMovementType;
  quantity: number;
  unitPrice: number;
  documentRef?: string; // N° Bon de commande/livraison
  destinationOrSource?: string;
  ordonnateur?: string; // For entries
}

export interface StockItem {
  id: string;
  designation: string;
  unit: string;
  budgetLine?: string;
  currentStock: number;
  unitPrice: number; // Last known unit price
  movements: StockMovement[];
}

// --- START: Patrimony Life Sheet Types ---
export interface LifeSheetMovementLot {
  id: string;
  date: string;
  nature: string;
  entryUnits?: number;
  entryAmount?: number;
  entryDestination?: string;
  exitUnits?: number;
  exitAmount?: number;
  exitDestination?: string;
}

export interface LifeSheetLot {
  id: string; // Corresponds to Asset ID
  designation: string;
  identificationCode: string; // e.g., Serial Number
  lotValue: number;
  unitValue: number;
  movements: LifeSheetMovementLot[];
}

export interface LifeSheetMovementUnit {
  id: string;
  date: string;
  nature: string;
  entryAmount?: number;
  entryState?: 'Bon' | 'Moyen' | 'Mauvais';
  entryDestination?: string;
  exitAmount?: number;
  exitState?: 'Vendu' | 'Réformé' | 'Transféré';
  exitDestination?: string;
}

export interface LifeSheetUnit {
  id: string; // Corresponds to Asset ID
  designation: string;
  identificationCode: string;
  movements: LifeSheetMovementUnit[];
}
// --- END: Patrimony Life Sheet Types ---
