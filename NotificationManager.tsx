import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscribe, setUserCredentials } from '@/lib/socket';
import { MessageType } from '@/lib/constants';
import { NotificationAlert } from './NotificationAlert';
import { useLocation } from 'wouter';
import { useNotificationSound } from '@/hooks/useNotificationSound';

// Interfaces para los mensajes
interface NotificationMessage {
  type: string;
  payload: {
    title: string;
    message: string;
    targetUserId?: number;
    targetRole?: string;
    notificationType?: 'alarm' | 'dispatch' | 'info';
    entityId?: number;
    entityType?: string;
  };
  timestamp: number;
  sender?: {
    userId: number;
    role: string;
  };
}

interface DispatchRequestMessage {
  type: string;
  payload: {
    alarmId: number;
    clientId: number;
    clientName?: string;
    requestedBy: number;
    priority: string;
    notes?: string;
  };
  timestamp: number;
  sender?: {
    userId: number;
    role: string;
  };
}

interface AlarmMessage {
  type: string;
  payload: {
    alarmId: number;
    clientId: number;
    clientName?: string;
    status: string;
    priority: string;
    createdAt: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
  };
  timestamp: number;
  sender?: {
    userId: number;
    role: string;
  };
}

// Componente para gestionar notificaciones de WebSocket
export function NotificationManager() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'alarm' | 'dispatch' | 'info';
    entityId?: number;
    entityType?: string;
  }>>([]);
  const [_, navigate] = useLocation();
  
  // Usar el hook de sonido de notificaciones
  useNotificationSound();

  // Inicializar WebSocket cuando el usuario está autenticado
  useEffect(() => {
    if (!user) return;

    // Inicializar conexión WebSocket
    console.log('NotificationManager: Configurando WebSocket para usuario:', user.id, user.role);
    setUserCredentials(user.id, user.role);

    return () => {
      // La limpieza se maneja internamente en el módulo socket
    };
  }, [user]);

  // Manejar notificaciones directas
  useEffect(() => {
    if (!user) return;

    // Suscribirse a mensajes de notificación
    const unsubscribeNotification = subscribe(MessageType.NOTIFICATION, (message: NotificationMessage) => {
      // Verificar si la notificación es para este usuario o para su rol
      if (
        message.payload.targetUserId === user.id ||
        message.payload.targetRole === user.role ||
        (!message.payload.targetUserId && !message.payload.targetRole)
      ) {
        const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        setNotifications(prev => [
          ...prev,
          {
            id: notificationId,
            title: message.payload.title,
            message: message.payload.message,
            type: message.payload.notificationType || 'info',
            entityId: message.payload.entityId,
            entityType: message.payload.entityType
          }
        ]);
      }
    });

    return () => {
      unsubscribeNotification();
    };
  }, [user]);

  // Manejar solicitudes de despacho (especial para despachadores)
  useEffect(() => {
    if (!user || user.role !== 'dispatcher') return;

    const unsubscribeDispatch = subscribe(MessageType.DISPATCH_REQUEST, (message: DispatchRequestMessage) => {
      const notificationId = `dispatch-${message.payload.alarmId}-${Date.now()}`;
      
      setNotifications(prev => [
        ...prev,
        {
          id: notificationId,
          title: '¡Nueva solicitud de despacho!',
          message: `Cliente: ${message.payload.clientName || message.payload.clientId}. Prioridad: ${message.payload.priority}`,
          type: 'dispatch',
          entityId: message.payload.alarmId,
          entityType: 'alarm'
        }
      ]);
    });

    return () => {
      unsubscribeDispatch();
    };
  }, [user]);

  // Manejar nuevas alarmas (para operadores y despachadores)
  useEffect(() => {
    if (!user) return;

    // Para los despachadores, escuchamos las alarmas nuevas creadas por los operadores
    if (user.role === 'dispatcher') {
      console.log('NotificationManager: Despachador suscrito a nuevas alarmas');
      const unsubscribeAlarm = subscribe(MessageType.NEW_ALARM, (message: AlarmMessage) => {
        console.log('NotificationManager: Despachador recibió nueva alarma:', message);
        const notificationId = `alarm-${message.payload.alarmId || Date.now()}-${Date.now()}`;
        
        setNotifications(prev => [
          ...prev,
          {
            id: notificationId,
            title: '¡Nueva alarma activada!',
            message: `Cliente: ${message.payload.clientName || message.payload.clientId || 'Sin nombre'}. Prioridad: ${message.payload.priority || 'Alta'}`,
            type: 'alarm',
            entityId: message.payload.alarmId,
            entityType: 'alarm'
          }
        ]);
      });

      return () => {
        unsubscribeAlarm();
      };
    }
    
    // Para los directores y administradores, recibir notificaciones generales
    if (user.role === 'director' || user.role === 'administrator') {
      const unsubscribeAlarm = subscribe(MessageType.NEW_ALARM, (message: AlarmMessage) => {
        const notificationId = `alarm-${message.payload.alarmId || Date.now()}-${Date.now()}`;
        
        setNotifications(prev => [
          ...prev,
          {
            id: notificationId,
            title: '¡Nueva alarma activada!',
            message: `Cliente: ${message.payload.clientName || message.payload.clientId || 'Sin nombre'}. Prioridad: ${message.payload.priority || 'Alta'}`,
            type: 'alarm',
            entityId: message.payload.alarmId,
            entityType: 'alarm'
          }
        ]);
      });

      return () => {
        unsubscribeAlarm();
      };
    }
  }, [user]);

  // Eliminar una notificación específica
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Manejar acción cuando se hace clic en una notificación
  const handleNotificationAction = (notification: {
    id: string;
    entityId?: number;
    entityType?: string;
  }) => {
    // Navegar a la página correspondiente según el tipo de entidad
    if (notification.entityType === 'alarm' && notification.entityId) {
      navigate(`/dispatch?alarmId=${notification.entityId}`);
    }

    // Eliminar la notificación después de manejarla
    removeNotification(notification.id);
  };

  return (
    <>
      {notifications.map(notification => (
        <NotificationAlert
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
          onAction={notification.entityId ? () => handleNotificationAction(notification) : undefined}
          actionText={notification.type === 'dispatch' ? 'Ir a despacho' : 'Ver detalles'}
        />
      ))}
    </>
  );
}