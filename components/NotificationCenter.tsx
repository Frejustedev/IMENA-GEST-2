import React, { useState, useEffect } from 'react';
import { BellIcon } from './icons/BellIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { apiService } from '../src/services/apiService';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  urgent?: boolean;
}

interface NotificationCenterProps {
  emergencyMode?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ emergencyMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les notifications depuis SQLite
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/notifications?limit=20');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const mappedNotifications = data.data.map((notif: any) => ({
            id: notif.notification_id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            timestamp: new Date(notif.created_at),
            read: notif.read_status,
            urgent: notif.urgent
          }));
          setNotifications(mappedNotifications);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les notifications au montage
  useEffect(() => {
    loadNotifications();
  }, []);

  // Simuler notifications temps réel (maintenant stockées en SQLite)
  useEffect(() => {
    const interval = setInterval(async () => {
      // Créer notification exemple toutes les 30 secondes
      if (Math.random() > 0.8) {
        try {
          await apiService.post('/notifications', {
            type: Math.random() > 0.7 ? 'warning' : 'info',
            title: 'Activité Système',
            message: 'Nouveau patient en attente en salle ' + ['Demande', 'RDV', 'Consultation'][Math.floor(Math.random() * 3)],
            urgent: emergencyMode
          });
          
          // Recharger les notifications
          loadNotifications();
        } catch (error) {
          console.error('Erreur lors de la création de notification:', error);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [emergencyMode]);

  // Notification d'urgence si mode urgence activé
  useEffect(() => {
    if (emergencyMode) {
      const urgentNotification: Notification = {
        id: 'emergency-' + Date.now(),
        type: 'error',
        title: 'MODE URGENCE ACTIVÉ',
        message: 'Le système est maintenant en mode urgence. Priorité aux interventions critiques.',
        timestamp: new Date(),
        read: false,
        urgent: true
      };
      
      setNotifications(prev => [urgentNotification, ...prev]);
    }
  }, [emergencyMode]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await apiService.put(`/notifications/${id}/read`);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Bouton notifications */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-md transition-colors touch-manipulation
          ${emergencyMode 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'hover:bg-slate-700 text-slate-300 hover:text-white'
          }
        `}
        title="Centre de notifications"
        aria-label="Centre de notifications"
      >
        <BellIcon className="h-5 w-5" />
        
        {/* Badge nombre notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel notifications */}
      {isOpen && (
        <>
          {/* Overlay mobile */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                  >
                    Tout marquer lu
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Liste notifications */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Aucune notification
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`
                      p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer
                      ${!notification.read ? 'bg-blue-50' : ''}
                      ${notification.urgent ? 'border-l-4 border-red-500' : ''}
                    `}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {notification.timestamp.toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
