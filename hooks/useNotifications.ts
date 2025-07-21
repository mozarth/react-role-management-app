import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  relatedId?: number;
  relatedType?: string;
}

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Obtener notificaciones no leídas
  const { 
    data: notifications = [],
    isLoading, 
    error 
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/unread'],
    staleTime: 60000, // 1 minuto
  });

  // Mutación para marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PATCH', `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  // Mutación para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notifications/mark-all-read', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  // Actualizar contador de no leídas cuando cambien las notificaciones
  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.length);
    }
  }, [notifications]);

  // Simulación de actualización periódica en lugar de WebSocket
  useEffect(() => {
    // Actualizar periódicamente las notificaciones (cada 30 segundos)
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    }, 30000);
    
    // Limpiar interval cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [queryClient]);

  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Función para mostrar una notificación (sin depender de WebSocket)
  const showNotification = (notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>) => {
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
    
    // Actualizar notificaciones después de mostrar una nueva
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    showNotification
  };
}