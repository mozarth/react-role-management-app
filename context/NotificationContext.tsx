import React, { createContext, useContext, useEffect, useReducer } from 'react';

// Tipo para cada notificación
export type NotificationType = 'alarm' | 'assignment' | 'shift' | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: NotificationType;
  entityId?: number;
}

// Estado de las notificaciones
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

// Acciones disponibles
type NotificationAction = 
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

// Contexto para las notificaciones
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  sendWebSocketMessage?: (message: any) => void; // Hacemos esta propiedad opcional para evitar errores
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Función para el sonido de notificación
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.play();
  } catch (error) {
    console.log('No se pudo reproducir sonido de notificación');
  }
};

// Reducer para las notificaciones
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotification: Notification = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
        ...action.payload
      };
      
      // Reproducir sonido cuando se añade una notificación
      playNotificationSound();
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
      
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => 
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
        unreadCount: state.unreadCount - 1 < 0 ? 0 : state.unreadCount - 1
      };
      
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({ ...notification, read: true })),
        unreadCount: 0
      };
      
    case 'REMOVE_NOTIFICATION':
      const notificationToRemove = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
        unreadCount: notificationToRemove && !notificationToRemove.read
          ? state.unreadCount - 1 < 0 ? 0 : state.unreadCount - 1
          : state.unreadCount
      };
      
    default:
      return state;
  }
}

// Proveedor de notificaciones
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    unreadCount: 0
  });

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  // Función simulada para enviar mensajes por websocket
  const sendWebSocketMessage = (message: any) => {
    console.log('Enviando mensaje por WebSocket:', message);
    // En una implementación real, aquí enviaríamos el mensaje al servidor
  };

  useEffect(() => {
    // Ejemplo de notificación inicial
    setTimeout(() => {
      if (state.notifications.length === 0) {
        addNotification({
          title: "Bienvenido al Panel de Supervisores",
          message: "Aquí verás notificaciones importantes sobre alarmas, asignaciones y turnos.",
          type: "info"
        });
      }
    }, 2000);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        sendWebSocketMessage
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Hook para usar el contexto de notificaciones
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
  }
  return context;
};