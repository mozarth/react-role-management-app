import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Calendar, CheckCheck, Clock, ExternalLink, Shield, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/context/NotificationContext';

interface NotificationProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationProps) {
  const { notifications, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(true);

  // Datos de ejemplo para alarmas
  const mockAlarms = [
    {
      id: 1001,
      clientName: 'Banco Nacional',
      address: 'Calle Comercial 789, Centro',
      type: 'intrusion',
      status: 'active',
      priority: 'high',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 1002,
      clientName: 'Residencial Las Palmas',
      address: 'Avenida Principal 234, Zona Sur',
      type: 'panic',
      status: 'active',
      priority: 'critical',
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    }
  ];
  
  // Datos de ejemplo para asignaciones
  const mockPendingAssignments = [
    {
      id: 1,
      clientName: 'Banco Nacional',
      address: 'Av. Principal 123, Zona Norte',
      status: 'pending',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      clientName: 'Supermercado Central',
      address: 'Calle Comercio 456, Zona Este',
      status: 'in_progress',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    }
  ];

  // Datos de ejemplo para turnos
  const mockShifts = [
    {
      id: 501,
      type: 'regular',
      status: 'active',
      startTime: '08:00',
      endTime: '16:00',
      date: new Date().toISOString().split('T')[0],
      updatedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString()
    },
    {
      id: 505,
      type: 'special',
      status: 'pending',
      startTime: '07:00',
      endTime: '16:00',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ];
  
  // Usar los datos de ejemplo directamente
  const alarms = mockAlarms;
  const alarmsLoading = false;
  const assignments = mockPendingAssignments;
  const assignmentsLoading = false;
  const shifts = mockShifts;
  const shiftsLoading = false;

  useEffect(() => {
    return () => {
      // Limpiar al desmontar
    };
  }, []);

  // Manejar el cierre del panel
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300); // Tiempo para la animación de salida
  };

  // Calcular el número de notificaciones por tipo
  const alarmsCount = alarms?.length || 0;
  const assignmentsCount = assignments?.length || 0;
  const shiftsCount = shifts?.length || 0;
  const appNotificationsCount = notifications.length;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div 
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-card shadow-lg border-l transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notificaciones
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="notificaciones" className="w-full">
          <TabsList className="grid grid-cols-4 p-2">
            <TabsTrigger value="notificaciones" className="relative">
              App
              {appNotificationsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-white">
                  {appNotificationsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alarmas" className="relative">
              Alarmas
              {alarmsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-amber-500 text-white">
                  {alarmsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="asignaciones" className="relative">
              Asig.
              {assignmentsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-white">
                  {assignmentsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="turnos" className="relative">
              Turnos
              {shiftsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-500 text-white">
                  {shiftsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab de notificaciones de la app */}
          <TabsContent value="notificaciones" className="pt-2">
            {notifications.length > 0 ? (
              <>
                <div className="flex justify-end px-4 pb-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs flex items-center" 
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Marcar todas como leídas
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-170px)]">
                  <div className="p-4 space-y-3">
                    {notifications.map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={`p-3 transition-all hover:shadow-md ${
                          notification.type === 'alarm'
                            ? 'border-l-4 border-l-amber-500'
                            : notification.type === 'assignment'
                            ? 'border-l-4 border-l-blue-500'
                            : notification.type === 'shift'
                            ? 'border-l-4 border-l-green-500'
                            : 'border-l-4 border-l-gray-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`rounded-full p-2 ${
                            notification.type === 'alarm'
                              ? 'bg-amber-100 text-amber-700'
                              : notification.type === 'assignment'
                              ? 'bg-blue-100 text-blue-700'
                              : notification.type === 'shift'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {notification.type === 'alarm' ? (
                              <Shield className="h-4 w-4" />
                            ) : notification.type === 'assignment' ? (
                              <ExternalLink className="h-4 w-4" />
                            ) : notification.type === 'shift' ? (
                              <Calendar className="h-4 w-4" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              <span className="text-muted-foreground text-xs flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(notification.timestamp).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-170px)] text-muted-foreground">
                <Bell className="h-10 w-10 mb-2 opacity-20" />
                <p>No tienes notificaciones</p>
              </div>
            )}
          </TabsContent>

          {/* Tab de alarmas */}
          <TabsContent value="alarmas" className="pt-2">
            {alarmsLoading ? (
              <div className="p-4">Cargando alarmas...</div>
            ) : alarms?.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-170px)]">
                <div className="p-4 space-y-3">
                  {alarms.map((alarm) => (
                    <Card 
                      key={alarm.id} 
                      className={`p-3 transition-all hover:shadow-md border-l-4 ${
                        alarm.priority === 'critical'
                          ? 'border-l-red-600 bg-red-50'
                          : 'border-l-amber-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{alarm.clientName}</h4>
                        <Badge variant={alarm.priority === 'critical' ? 'destructive' : 'outline'} className={alarm.priority === 'critical' ? '' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}>
                          {alarm.priority === 'critical' ? 'Crítica' : 'Alta'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alarm.address}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                          {alarm.type === 'intrusion' ? 'Intrusión' : 'Pánico'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alarm.createdAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-170px)] text-muted-foreground">
                <Shield className="h-10 w-10 mb-2 opacity-20" />
                <p>No hay alarmas activas</p>
              </div>
            )}
          </TabsContent>

          {/* Tab de asignaciones */}
          <TabsContent value="asignaciones" className="pt-2">
            {assignmentsLoading ? (
              <div className="p-4">Cargando asignaciones...</div>
            ) : mockPendingAssignments?.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-170px)]">
                <div className="p-4 space-y-3">
                  {mockPendingAssignments.map((assignment) => (
                    <Card 
                      key={assignment.id} 
                      className={`p-3 transition-all hover:shadow-md border-l-4 ${
                        assignment.status === 'pending'
                          ? 'border-l-amber-500'
                          : 'border-l-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{assignment.clientName}</h4>
                        <Badge variant={assignment.status === 'pending' ? 'outline' : 'default'}>
                          {assignment.status === 'pending' ? 'Pendiente' : 'En progreso'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment.address}
                      </p>
                      <div className="flex justify-end items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(assignment.createdAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-170px)] text-muted-foreground">
                <ExternalLink className="h-10 w-10 mb-2 opacity-20" />
                <p>No hay asignaciones pendientes</p>
              </div>
            )}
          </TabsContent>

          {/* Tab de turnos */}
          <TabsContent value="turnos" className="pt-2">
            {shiftsLoading ? (
              <div className="p-4">Cargando turnos...</div>
            ) : shifts?.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-170px)]">
                <div className="p-4 space-y-3">
                  {shifts.map((shift) => (
                    <Card 
                      key={shift.id} 
                      className={`p-3 transition-all hover:shadow-md border-l-4 ${
                        shift.status === 'pending'
                          ? 'border-l-amber-500'
                          : 'border-l-green-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">
                          {shift.type === 'regular' ? 'Turno Regular' : 'Turno Especial'}
                        </h4>
                        <Badge variant={shift.status === 'pending' ? 'outline' : 'default'} className={shift.status === 'pending' ? '' : 'bg-green-100 text-green-700'}>
                          {shift.status === 'pending' ? 'Pendiente' : 'Activo'}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Fecha:</span> {new Date(shift.date).toLocaleDateString('es-ES')}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Horario:</span> {shift.startTime} - {shift.endTime}
                      </p>
                      <div className="flex justify-end items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          Actualizado: {new Date(shift.updatedAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-170px)] text-muted-foreground">
                <Calendar className="h-10 w-10 mb-2 opacity-20" />
                <p>No hay turnos programados</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}