import React from 'react';
import { ActiveView, RoomId } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { HomeIcon } from './icons/HomeIcon';

interface BreadcrumbProps {
  currentView: ActiveView;
  activeRoomId: RoomId | null;
  selectedPatientName?: string;
  onNavigate: (view: ActiveView, roomId?: RoomId) => void;
}

interface BreadcrumbItem {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  isActive?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  currentView, 
  activeRoomId, 
  selectedPatientName,
  onNavigate 
}) => {
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: 'Accueil',
        icon: <HomeIcon className="h-4 w-4" />,
        action: () => onNavigate('rooms_overview')
      }
    ];

    switch (currentView) {
      case 'rooms_overview':
        items[0].isActive = true;
        break;

      case 'daily_worklist':
        items.push({
          label: 'Vacation du Jour',
          isActive: true
        });
        break;

      case 'activity_feed':
        items.push({
          label: 'Flux d\'activités',
          isActive: true
        });
        break;

      case 'statistics':
        items.push({
          label: 'Statistiques',
          isActive: true
        });
        break;

      case 'database':
        items.push({
          label: 'Base de Données',
          isActive: true
        });
        break;

      case 'hot_lab':
        items.push({
          label: 'Laboratoire Chaud',
          isActive: true
        });
        break;

      case 'tracers_management':
        items.push({
          label: 'Gestion des Traceurs',
          isActive: true
        });
        break;

      case 'preparations_management':
        items.push({
          label: 'Gestion des Préparations',
          isActive: true
        });
        break;

      case 'isotopes_management':
        items.push({
          label: 'Gestion des Isotopes',
          isActive: true
        });
        break;

      case 'radioprotection':
        items.push({
          label: 'Radioprotection',
          isActive: true
        });
        break;

      case 'radioprotection_dosimetry':
        items.push({
          label: 'Radioprotection',
          action: () => onNavigate('radioprotection')
        });
        items.push({
          label: 'Dosimétrie',
          isActive: true
        });
        break;

      case 'radioprotection_safety':
        items.push({
          label: 'Radioprotection',
          action: () => onNavigate('radioprotection')
        });
        items.push({
          label: 'Sécurité',
          isActive: true
        });
        break;

      case 'radioprotection_waste':
        items.push({
          label: 'Radioprotection',
          action: () => onNavigate('radioprotection')
        });
        items.push({
          label: 'Gestion des Déchets',
          isActive: true
        });
        break;

      case 'administration':
        items.push({
          label: 'Administration',
          isActive: true
        });
        break;

      case 'exam_settings':
        items.push({
          label: 'Configuration Examens',
          isActive: true
        });
        break;

      case 'report_templates_settings':
        items.push({
          label: 'Templates Rapports',
          isActive: true
        });
        break;

      case 'room':
        if (activeRoomId) {
          const roomNames: Record<RoomId, string> = {
            [RoomId.REQUEST]: 'Demande',
            [RoomId.APPOINTMENT]: 'Rendez-vous',
            [RoomId.CONSULTATION]: 'Consultation',
            [RoomId.GENERATOR]: 'Labo Chaud',
            [RoomId.INJECTION]: 'Injection',
            [RoomId.EXAMINATION]: 'Examen',
            [RoomId.REPORT]: 'Compte Rendu',
            [RoomId.RETRAIT_CR_SORTIE]: 'Retrait / Sortie',
            [RoomId.ARCHIVE]: 'Archive'
          };
          
          items.push({
            label: 'Parcours Patient',
            action: () => onNavigate('rooms_overview')
          });
          
          items.push({
            label: roomNames[activeRoomId] || 'Salle Inconnue',
            isActive: true
          });
        }
        break;

      case 'patient_detail':
        items.push({
          label: 'Patients',
          action: () => onNavigate('database')
        });
        
        items.push({
          label: selectedPatientName || 'Détail Patient',
          isActive: true
        });
        break;

      case 'patrimony_dashboard':
        items.push({
          label: 'Patrimoine',
          action: () => onNavigate('patrimony_dashboard')
        });
        items.push({
          label: 'Tableau de bord',
          isActive: true
        });
        break;

      case 'patrimony_inventory':
        items.push({
          label: 'Patrimoine',
          action: () => onNavigate('patrimony_dashboard')
        });
        items.push({
          label: 'Inventaire',
          isActive: true
        });
        break;

      case 'patrimony_stock':
        items.push({
          label: 'Patrimoine',
          action: () => onNavigate('patrimony_dashboard')
        });
        items.push({
          label: 'Stock',
          isActive: true
        });
        break;

      case 'patrimony_stock_detail':
        items.push({
          label: 'Patrimoine',
          action: () => onNavigate('patrimony_dashboard')
        });
        items.push({
          label: 'Stock',
          action: () => onNavigate('patrimony_stock')
        });
        items.push({
          label: 'Détail Article',
          isActive: true
        });
        break;

      case 'patrimony_asset_status':
        items.push({
          label: 'Patrimoine',
          action: () => onNavigate('patrimony_dashboard')
        });
        items.push({
          label: 'Statut Équipements',
          isActive: true
        });
        break;

      case 'search':
        items.push({
          label: 'Recherche',
          isActive: true
        });
        break;

      default:
        break;
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  if (breadcrumbItems.length <= 1) {
    return null; // Pas de breadcrumb pour la page d'accueil seule
  }

  return (
    <nav 
      aria-label="Fil d'Ariane" 
      className="bg-white border-b border-slate-200 px-6 py-3 hidden sm:block"
    >
      <ol className="flex items-center space-x-1 text-sm">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-slate-400 mx-2" />
            )}
            
            {item.isActive ? (
              <span 
                className="flex items-center space-x-1 text-slate-900 font-medium"
                aria-current="page"
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            ) : (
              <button
                onClick={item.action}
                className="flex items-center space-x-1 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:rounded px-1 py-0.5"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
