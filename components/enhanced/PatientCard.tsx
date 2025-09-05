import React, { memo, useState } from 'react';
import { Patient, PatientStatusInRoom, RoomId } from '../../types';
import { ROOMS_CONFIG } from '../../constants';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { IdentificationIcon } from '../icons/IdentificationIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/**
 * Props du composant PatientCard amélioré
 */
export interface EnhancedPatientCardProps {
  /** Données du patient */
  patient: Patient;
  /** Si la carte est interactive */
  interactive?: boolean;
  /** Si la carte est sélectionnée */
  selected?: boolean;
  /** Si la carte est en mode compact */
  compact?: boolean;
  /** Actions disponibles */
  actions?: {
    onView?: (patient: Patient) => void;
    onEdit?: (patient: Patient) => void;
    onMove?: (patient: Patient) => void;
    onMarkSeen?: (patient: Patient) => void;
  };
  /** États de chargement pour les actions */
  loading?: {
    view?: boolean;
    edit?: boolean;
    move?: boolean;
    markSeen?: boolean;
  };
  /** Classes CSS personnalisées */
  className?: string;
  /** Si les informations sensibles doivent être masquées */
  hideDetails?: boolean;
}

/**
 * Fonction utilitaire pour calculer l'âge
 */
const calculateAge = (dateOfBirth: string): number => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Fonction pour formater la durée depuis une date
 */
const formatTimeSince = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}min`;
  return 'maintenant';
};

/**
 * Classes CSS pour les statuts de patient
 */
const statusClasses = {
  [PatientStatusInRoom.WAITING]: 'bg-warning-50 text-warning-700 border-warning-200',
  [PatientStatusInRoom.SEEN]: 'bg-success-50 text-success-700 border-success-200'
};

/**
 * Icônes pour les statuts de patient
 */
const statusIcons = {
  [PatientStatusInRoom.WAITING]: <ClockIcon className="w-4 h-4" />,
  [PatientStatusInRoom.SEEN]: <CheckCircleIcon className="w-4 h-4" />
};

/**
 * Composant PatientCard amélioré avec design system
 */
export const EnhancedPatientCard = memo<EnhancedPatientCardProps>(({
  patient,
  interactive = true,
  selected = false,
  compact = false,
  actions,
  loading = {},
  className = '',
  hideDetails = false
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Calculer l'âge
  const age = calculateAge(patient.dateOfBirth);
  
  // Obtenir la salle actuelle
  const currentRoom = ROOMS_CONFIG.find(room => room.id === patient.currentRoomId);
  
  // Obtenir la dernière entrée dans l'historique
  const lastEntry = patient.history[patient.history.length - 1];
  const timeSinceLastAction = lastEntry ? formatTimeSince(lastEntry.entryDate) : '';
  
  // Obtenir l'examen demandé
  const requestedExam = patient.roomSpecificData?.[RoomId.REQUEST]?.requestedExam;

  // Classes pour la carte
  const cardClassName = `
    transition-all duration-200 ease-in-out
    ${interactive ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
    ${compact ? 'max-w-sm' : 'max-w-lg'}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <Card
      variant="default"
      size={compact ? 'sm' : 'md'}
      interactive={interactive}
      selected={selected}
      className={cardClassName}
    >
      <CardHeader
        title={
          <div className="flex items-center gap-3">
            {/* Avatar/Photo du patient */}
            <div className="relative">
              {!imageError ? (
                <img
                  src={`/api/patients/${patient.id}/photo`}
                  alt={`Photo de ${patient.name}`}
                  className="w-12 h-12 rounded-full object-cover bg-slate-100"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserCircleIcon className="w-8 h-8 text-slate-400" />
                </div>
              )}
              
              {/* Indicateur de statut */}
              <div className={`
                absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                ${patient.statusInRoom === PatientStatusInRoom.WAITING ? 'bg-warning-500' : 'bg-success-500'}
              `} />
            </div>

            {/* Informations principales */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {hideDetails ? `Patient ${patient.id.slice(-4)}` : patient.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>{age} ans</span>
                {!hideDetails && patient.phone && (
                  <>
                    <span>•</span>
                    <span className="truncate">{patient.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-1">
            {/* Statut badge */}
            <span className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
              ${statusClasses[patient.statusInRoom]}
            `}>
              {statusIcons[patient.statusInRoom]}
              {patient.statusInRoom}
            </span>
          </div>
        }
      />

      <CardContent noPadding={false}>
        {/* Informations détaillées */}
        <div className="space-y-3">
          {/* Salle actuelle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentRoom && <currentRoom.icon className="w-5 h-5 text-slate-500" />}
              <span className="text-sm font-medium text-slate-700">
                {currentRoom?.name || patient.currentRoomId}
              </span>
            </div>
            {timeSinceLastAction && (
              <span className="text-xs text-slate-500">
                {timeSinceLastAction}
              </span>
            )}
          </div>

          {/* Examen demandé */}
          {requestedExam && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Examen:</span>
              <span className="text-sm font-medium text-primary-600">
                {requestedExam}
              </span>
            </div>
          )}

          {/* Informations supplémentaires en mode non compact */}
          {!compact && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600">ID:</span>
                <span className="ml-1 font-mono">{patient.id}</span>
              </div>
              <div>
                <span className="text-slate-600">Créé:</span>
                <span className="ml-1">
                  {new Date(patient.creationDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          )}

          {/* Entité référante */}
          {patient.referringEntity && !hideDetails && (
            <div className="text-sm">
              <span className="text-slate-600">Référant:</span>
              <span className="ml-1">{patient.referringEntity.name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
            {actions.onView && (
              <Button
                size="sm"
                variant="ghost"
                leftIcon={loading.view ? undefined : <IdentificationIcon className="w-4 h-4" />}
                loading={loading.view}
                onClick={() => actions.onView?.(patient)}
                className="flex-1"
              >
                {loading.view ? 'Chargement...' : 'Voir'}
              </Button>
            )}

            {actions.onEdit && (
              <Button
                size="sm"
                variant="outline"
                loading={loading.edit}
                onClick={() => actions.onEdit?.(patient)}
                className="flex-1"
              >
                {loading.edit ? 'Chargement...' : 'Modifier'}
              </Button>
            )}

            {actions.onMove && patient.statusInRoom === PatientStatusInRoom.SEEN && (
              <Button
                size="sm"
                variant="primary"
                loading={loading.move}
                onClick={() => actions.onMove?.(patient)}
                className="flex-1"
              >
                {loading.move ? 'Déplacement...' : 'Déplacer'}
              </Button>
            )}

            {actions.onMarkSeen && patient.statusInRoom === PatientStatusInRoom.WAITING && (
              <Button
                size="sm"
                variant="success"
                loading={loading.markSeen}
                onClick={() => actions.onMarkSeen?.(patient)}
                className="flex-1"
              >
                {loading.markSeen ? 'Traitement...' : 'Marquer vu'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

EnhancedPatientCard.displayName = 'EnhancedPatientCard';

/**
 * Composant de liste de cartes patients avec virtualisation
 */
export interface PatientCardListProps {
  /** Liste des patients */
  patients: Patient[];
  /** Actions pour chaque carte */
  actions?: EnhancedPatientCardProps['actions'];
  /** États de chargement */
  loading?: { [patientId: string]: EnhancedPatientCardProps['loading'] };
  /** Si les cartes doivent être compactes */
  compact?: boolean;
  /** Fonction de filtrage */
  filter?: (patient: Patient) => boolean;
  /** Fonction de tri */
  sorter?: (a: Patient, b: Patient) => number;
  /** Classes CSS */
  className?: string;
  /** Message quand aucun patient */
  emptyMessage?: string;
  /** Si on affiche un skeleton pendant le chargement */
  showSkeleton?: boolean;
  /** Nombre de skeletons à afficher */
  skeletonCount?: number;
}

export const PatientCardList: React.FC<PatientCardListProps> = ({
  patients,
  actions,
  loading = {},
  compact = false,
  filter,
  sorter,
  className = '',
  emptyMessage = 'Aucun patient trouvé',
  showSkeleton = false,
  skeletonCount = 3
}) => {
  // Appliquer le filtre et le tri
  let processedPatients = patients;
  
  if (filter) {
    processedPatients = processedPatients.filter(filter);
  }
  
  if (sorter) {
    processedPatients = [...processedPatients].sort(sorter);
  }

  // Afficher skeleton si en chargement
  if (showSkeleton) {
    return (
      <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'} ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Card key={`skeleton-${index}`} className="animate-pulse">
            <CardHeader
              title={
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              }
            />
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Message si aucun patient
  if (processedPatients.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCircleIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'} ${className}`}>
      {processedPatients.map(patient => (
        <EnhancedPatientCard
          key={patient.id}
          patient={patient}
          compact={compact}
          actions={actions}
          loading={loading[patient.id]}
        />
      ))}
    </div>
  );
};

/**
 * Hook pour gérer les actions sur les patients
 */
export const usePatientActions = () => {
  const [loadingStates, setLoadingStates] = useState<{ [patientId: string]: { [action: string]: boolean } }>({});

  const setLoading = (patientId: string, action: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [patientId]: {
        ...prev[patientId],
        [action]: loading
      }
    }));
  };

  const executeAction = async (
    patientId: string,
    action: string,
    asyncFn: () => Promise<void>
  ) => {
    try {
      setLoading(patientId, action, true);
      await asyncFn();
    } finally {
      setLoading(patientId, action, false);
    }
  };

  return {
    loadingStates,
    executeAction
  };
};
