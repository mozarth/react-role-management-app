import React, { useState, useEffect } from 'react';
import { RealTimeMonitor } from '@/components/dispatch/RealTimeMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Bell, PhoneOutgoing, ClipboardList, Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlarmStatus, AlarmStatusType } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { MessageType } from '@shared/websocket';

// Importamos lo necesario para WebSocket
import { useSocket } from '@/hooks/useSocket';

export default function Dispatch() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [pendingAlarms, setPendingAlarms] = useState<any[]>([]);
  const [inProgressAlarms, setInProgressAlarms] = useState<any[]>([]);
  const [completedAlarms, setCompletedAlarms] = useState<any[]>([]);
  
  // Obtener las alarmas actuales desde la API
  const { data: alarmsData, isLoading } = useQuery({
    queryKey: ['/api/alarms'],
    enabled: !!user,
  });

  // Configurar WebSocket para recibir actualizaciones de alarmas en tiempo real
  const { socket, addMessageListener, MessageType, sendMessage } = useSocket();

  // Procesar las alarmas y clasificarlas
  useEffect(() => {
    if (alarmsData) {
      const alarms = Array.isArray(alarmsData) ? alarmsData : [];
      
      setPendingAlarms(alarms.filter(alarm => 
        alarm.status === "dispatched" || alarm.status === "active"
      ));
      
      setInProgressAlarms(alarms.filter(alarm => 
        alarm.status === "in_progress" 
      ));
      
      setCompletedAlarms(alarms.filter(alarm => 
        alarm.status === "resolved" || alarm.status === "canceled"
      ));
    }
  }, [alarmsData]);

  // Escuchar mensajes WebSocket para actualizaciones de alarmas
  useEffect(() => {
    if (!user || !addMessageListener) return;

    // Función para manejar nuevas solicitudes de despacho
    const handleDispatchRequest = (data: any) => {
      console.log('📨 Solicitud de despacho recibida:', data);
      
      // Asegurarnos de que estamos trabajando con la carga útil
      const payload = data.payload || data;
      
      // Verificar si ya existe la alarma
      const alarmExists = pendingAlarms.some(alarm => alarm.id === payload.alarmId);
      
      if (!alarmExists) {
        // Añadir la nueva alarma a las pendientes
        setPendingAlarms(prev => [
          ...prev, 
          {
            id: payload.alarmId,
            clientId: payload.clientId,
            clientName: payload.clientName,
            status: "dispatched", // Usamos string directamente para evitar problemas de tipos
            priority: payload.priority || 'high',
            location: payload.location || 'Sin ubicación',
            address: payload.address || 'Sin dirección',
            description: payload.notes || 'Solicitud de despacho',
            createdAt: new Date().toISOString(),
            operatorId: payload.requestedBy || 0,
            type: 'security_alarm',
            notes: payload.notes || ''
          }
        ]);
        
        // Mostrar notificación
        toast({
          title: '¡Nueva alarma para despachar!',
          description: `Cliente: ${payload.clientName || 'Sin nombre'} - ${payload.notes || 'Sin detalles'}`,
          variant: 'destructive',
        });
      }
    };
    
    // Función para manejar actualizaciones de alarmas
    const handleAlarmUpdate = (data: any) => {
      console.log('🔄 Actualización de alarma recibida:', data);
      
      // Asegurarnos de que estamos trabajando con la carga útil
      const payload = data.payload || data;
      
      // Buscamos la alarma por ID en todos los grupos
      const alarmId = payload.alarmId;
      
      // Verificar si existe en pendientes
      const pendingIndex = pendingAlarms.findIndex(a => a.id === alarmId);
      if (pendingIndex >= 0) {
        // Actualizar la alarma en pendientes
        const updatedAlarms = [...pendingAlarms];
        updatedAlarms[pendingIndex] = { 
          ...updatedAlarms[pendingIndex], 
          status: payload.status || updatedAlarms[pendingIndex].status,
          priority: payload.priority || updatedAlarms[pendingIndex].priority,
          description: payload.description || updatedAlarms[pendingIndex].description,
          notes: payload.notes || updatedAlarms[pendingIndex].notes,
          location: payload.location || updatedAlarms[pendingIndex].location,
          address: payload.address || updatedAlarms[pendingIndex].address
        };
        setPendingAlarms(updatedAlarms);
      } else if (payload.status === "dispatched") {
        // Si no existe y es una alarma despachada, añadirla
        setPendingAlarms(prev => [
          ...prev, 
          {
            id: payload.alarmId,
            clientId: payload.clientId,
            clientName: payload.clientName,
            status: "dispatched",
            priority: payload.priority || 'high',
            location: payload.location || 'Sin ubicación',
            address: payload.address || 'Sin dirección',
            description: payload.description || 'Solicitud de despacho',
            createdAt: new Date().toISOString(),
            operatorId: payload.operatorId || 0,
            type: 'security_alarm',
            notes: payload.notes || ''
          }
        ]);
      }
    };
    
    // Función para manejar notificaciones generales
    const handleNotification = (data: any) => {
      console.log('🔔 Notificación recibida:', data);
      
      // Asegurarnos de que estamos trabajando con la carga útil
      const payload = data.payload || data;
      
      // Mostrar notificación
      toast({
        title: payload.title || 'Nueva notificación',
        description: payload.message || '',
        variant: payload.notificationType === 'alarm' ? 'destructive' : 'default',
      });
    };

    // Registrar los listeners para los diferentes tipos de mensajes
    const unsubscribeDispatch = addMessageListener(MessageType.DISPATCH_REQUEST, handleDispatchRequest);
    const unsubscribeUpdate = addMessageListener(MessageType.ALARM_UPDATE, handleAlarmUpdate);
    const unsubscribeNotif = addMessageListener(MessageType.NOTIFICATION, handleNotification);
    
    // Limpieza al desmontar
    return () => {
      unsubscribeDispatch();
      unsubscribeUpdate();
      unsubscribeNotif();
    };
  }, [user, addMessageListener, pendingAlarms, toast]);

  // Filtrar alarmas según el texto de búsqueda
  const filteredPendingAlarms = filterText 
    ? pendingAlarms.filter(alarm => 
        (alarm.clientName && alarm.clientName.toLowerCase().includes(filterText.toLowerCase())) ||
        (alarm.address && alarm.address.toLowerCase().includes(filterText.toLowerCase())) ||
        (alarm.description && alarm.description.toLowerCase().includes(filterText.toLowerCase()))
      )
    : pendingAlarms;

  // Formatear tiempo transcurrido
  const getTimeElapsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'ahora mismo';
    if (diffMins === 1) return 'hace 1 minuto';
    return `hace ${diffMins} minutos`;
  };

  // Obtener el color según la prioridad
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Centro de Despacho</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </Button>
          <Button variant="default" size="sm">
            <PhoneOutgoing className="h-4 w-4 mr-2" />
            Nueva Alarma
          </Button>
        </div>
      </div>
      
      {/* Layout principal con columna lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs para diferentes tipos de alarmas */}
          <Tabs defaultValue="pendientes" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="pendientes" className="relative">
                Pendientes por Despachar
                {pendingAlarms.length > 0 && (
                  <Badge className="ml-2 bg-amber-500 hover:bg-amber-600">
                    {pendingAlarms.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="proceso" className="relative">
                En Proceso
                {inProgressAlarms.length > 0 && (
                  <Badge className="ml-2 bg-blue-500 hover:bg-blue-600">
                    {inProgressAlarms.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completadas">Atendidas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pendientes">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Alarmas Pendientes por Despachar</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder="Buscar alarma..." 
                        className="pl-8 h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredPendingAlarms.length > 0 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {filteredPendingAlarms.map(alarm => (
                        <div 
                          key={alarm.id} 
                          className={`p-4 border rounded-lg ${alarm.isNew ? 'border-amber-500 bg-amber-50/30' : ''} transition-all duration-300`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <div className={`h-3 w-3 rounded-full mr-2 ${getPriorityColor(alarm.priority)}`}></div>
                              <h3 className="font-medium">{alarm.clientName || 'Cliente sin nombre'}</h3>
                            </div>
                            <Badge variant={alarm.status === AlarmStatus.DISPATCHED ? 'secondary' : 'default'}>
                              {alarm.status === AlarmStatus.DISPATCHED ? 'Despachado' : 'Pendiente'}
                            </Badge>
                          </div>
                          
                          {alarm.description && (
                            <p className="text-sm text-gray-600 mb-2">{alarm.description}</p>
                          )}
                          
                          {alarm.address && (
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3 mr-1" />
                              {alarm.address}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {getTimeElapsed(alarm.createdAt)}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">Ver detalles</Button>
                              <Button size="sm" variant="default">Asignar patrulla</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Clock className="h-12 w-12 mb-2 opacity-20" />
                      <p>No hay alarmas pendientes de despacho</p>
                      <p className="text-sm">Las nuevas alarmas aparecerán aquí</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="proceso">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Alarmas En Proceso</CardTitle>
                </CardHeader>
                <CardContent>
                  {inProgressAlarms.length > 0 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {/* Contenido de alarmas en proceso */}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mb-2 opacity-20" />
                      <p>No hay alarmas en proceso actualmente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completadas">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Alarmas Atendidas</CardTitle>
                </CardHeader>
                <CardContent>
                  {completedAlarms.length > 0 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {/* Contenido de alarmas completadas */}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mb-2 opacity-20" />
                      <p>No hay alarmas atendidas en el día de hoy</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Columna lateral con monitoreo en tiempo real */}
        <div className="lg:col-span-1">
          <RealTimeMonitor />
        </div>
      </div>
    </div>
  );
}