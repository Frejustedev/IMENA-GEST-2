import React, { memo, useMemo } from 'react';
import { RoomsOverview } from '../RoomsOverview';
import { Room, Patient, HotLabData, RoomId } from '../../../types';

/**
 * Props pour le composant RoomsOverview optimisé
 */
interface MemoizedRoomsOverviewProps {
  visibleRooms: Room[];
  allPatients: Patient[];
  hotLabData: HotLabData;
  onSelectRoom: (roomId: RoomId) => void;
  onViewPatientDetail: (patient: Patient) => void;
  onMovePatient: (patientId: string, targetRoomId: RoomId) => void;
}

/**
 * Version mémorisée de RoomsOverview pour éviter les re-renders inutiles
 */
const MemoizedRoomsOverviewComponent: React.FC<MemoizedRoomsOverviewProps> = ({
  visibleRooms,
  allPatients,
  hotLabData,
  onSelectRoom,
  onViewPatientDetail,
  onMovePatient
}) => {
  // Mémoriser les calculs coûteux
  const memoizedProps = useMemo(() => ({
    visibleRooms,
    allPatients,
    hotLabData,
    onSelectRoom,
    onViewPatientDetail,
    onMovePatient
  }), [visibleRooms, allPatients, hotLabData, onSelectRoom, onViewPatientDetail, onMovePatient]);

  return <RoomsOverview {...memoizedProps} />;
};

/**
 * Comparateur personnalisé pour React.memo
 */
const arePropsEqual = (
  prevProps: MemoizedRoomsOverviewProps,
  nextProps: MemoizedRoomsOverviewProps
): boolean => {
  // Comparaison shallow pour les arrays simples
  if (prevProps.visibleRooms.length !== nextProps.visibleRooms.length) return false;
  if (prevProps.allPatients.length !== nextProps.allPatients.length) return false;
  
  // Comparaison des IDs des patients pour détecter les changements
  const prevPatientIds = prevProps.allPatients.map(p => p.id).sort();
  const nextPatientIds = nextProps.allPatients.map(p => p.id).sort();
  
  if (prevPatientIds.join(',') !== nextPatientIds.join(',')) return false;
  
  // Comparaison des dernières modifications des patients
  const prevLastModified = Math.max(...prevProps.allPatients.map(p => 
    p.history.length > 0 ? new Date(p.history[p.history.length - 1].entryDate).getTime() : 0
  ));
  const nextLastModified = Math.max(...nextProps.allPatients.map(p => 
    p.history.length > 0 ? new Date(p.history[p.history.length - 1].entryDate).getTime() : 0
  ));
  
  if (prevLastModified !== nextLastModified) return false;
  
  // Comparaison des données Hot Lab
  if (prevProps.hotLabData.lots.length !== nextProps.hotLabData.lots.length) return false;
  if (prevProps.hotLabData.preparations.length !== nextProps.hotLabData.preparations.length) return false;
  
  return true;
};

export const MemoizedRoomsOverview = memo(MemoizedRoomsOverviewComponent, arePropsEqual);

// Export par défaut pour faciliter l'import
export default MemoizedRoomsOverview;
