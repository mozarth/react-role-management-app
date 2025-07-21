import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, AlertTriangle, Info, MapPin, CheckCircle2, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'alarm' | 'dispatch' | 'info';
  read: boolean;
  createdAt: string;
  relatedId?: number;
  relatedType?: string;
}

export default function MobileNotifications() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta para obtener notificaciones
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    // En una implementación real, esto obtendría los datos del servidor
    queryFn: async () => {
      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Retornar datos simulados
      return [
        {
          id: 1,
          title: 'Nueva alarma asignada',
          message: 'Alarma de intrusión en Banco Central',
          type: 'alarm',
          read: false,
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
          relatedId: 1001,
          relatedType: 'alarm'
        },
        {
          id: 2,
          title: 'Completar reporte',
          message: 'Recuerde completar el reporte de la alarma #1002',
          type: 'info',
          read: false,
          createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
          relatedId: 1002,
          relatedType: 'assignment'
        },
        {
          id: 3,
          title: 'Actualización de turno',
          message: 'Su turno ha sido actualizado para la próxima semana',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString()
        },
        {
          id: 4,
          title: 'Alarma cancelada',
          message: 'La alarma #1003 ha sido cancelada por el cliente',
          type: 'alarm',
          read: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
          relatedId: 1003,
          relatedType: 'alarm'
        },
        {
          id: 5,
          title: 'Mantenimiento programado',
          message: 'El sistema estará en mantenimiento el día 25/05 de 2:00 a 4:00',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString()
        }
      ];
    }
  });

  // Mutación para marcar notificación como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      // En una implementación real, esto enviaría los datos al servidor
      // return await apiRequest('PATCH', `/api/notifications/${id}/read`, {});
      
      // Simulamos una petición exitosa con un retraso
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 300);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Mutación para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // En una implementación real, esto enviaría los datos al servidor
      // return await apiRequest('POST', '/api/notifications/mark-all-read', {});
      
      // Simulamos una petición exitosa con un retraso
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Notificaciones leídas',
        description: 'Todas las notificaciones han sido marcadas como leídas',
      });
    }
  });

  // Mutación para eliminar notificación
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      // En una implementación real, esto enviaría los datos al servidor
      // return await apiRequest('DELETE', `/api/notifications/${id}`, {});
      
      // Simulamos una petición exitosa con un retraso
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 300);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Notificación eliminada',
        description: 'La notificación ha sido eliminada correctamente',
      });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navegar a la página relacionada basada en el tipo
    if (notification.relatedType === 'alarm' && notification.relatedId) {
      navigate(`/mobile/dashboard`);
    } else if (notification.relatedType === 'assignment' && notification.relatedId) {
      navigate(`/mobile/report/${notification.relatedId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteNotificationMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Hoy, ' + format(date, 'HH:mm', { locale: es });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer, ' + format(date, 'HH:mm', { locale: es });
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alarm':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'dispatch':
        return <MapPin className="h-5 w-5 text-blue-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationClass = (read: boolean) => {
    return read ? 'opacity-70' : '';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground py-3 px-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/mobile/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold ml-2">
              Notificaciones
            </h1>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-25" />
              <p className="text-muted-foreground">No tiene notificaciones</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {unreadCount > 0 && (
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="px-3 py-1">
                  {unreadCount} sin leer
                </Badge>
              </div>
            )}
            
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${getNotificationClass(notification.read)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="mt-1">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                    {!notification.read && (
                      <div className="absolute top-3 right-4 h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}