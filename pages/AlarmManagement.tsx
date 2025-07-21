import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlarmType, AlarmTypeLabels, AlarmStatus, AlarmStatusLabels, AlarmStatusColors } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { NewAlarmModal } from '@/components/alarms/NewAlarmModal';

export default function AlarmManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [isNewAlarmModalOpen, setIsNewAlarmModalOpen] = useState(false);
  const [elapsedTimes, setElapsedTimes] = useState<{[key: number]: number}>({});
  const [selectedAlarm, setSelectedAlarm] = useState<any>(null);

  // Obtener todas las alarmas
  const { data: alarms, isLoading } = useQuery({
    queryKey: ['/api/alarms'],
    staleTime: 30000, // 30 segundos
  });

  // Obtener todos los clientes para el formulario de nueva alarma
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
    staleTime: 300000, // 5 minutos
  });
  
  // Obtener las asignaciones de patrullas
  const { data: assignments } = useQuery({
    queryKey: ['/api/assignments'],
    staleTime: 30000, // 30 segundos
  });
  
  // Obtener las patrullas disponibles
  const { data: patrols } = useQuery({
    queryKey: ['/api/patrols'],
    staleTime: 60000, // 1 minuto
  });

  // Función para formatear el tiempo transcurrido
  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };
  
  // Efecto para calcular y actualizar tiempos transcurridos
  useEffect(() => {
    if (!alarms || !Array.isArray(alarms) || alarms.length === 0) return;
    
    // Inicializar tiempos transcurridos para cada alarma
    const newElapsedTimes: {[key: number]: number} = { ...elapsedTimes };
    
    alarms.forEach((alarm: any) => {
      if (!newElapsedTimes[alarm.id]) {
        const createdAt = new Date(alarm.createdAt);
        const now = new Date();
        const secondsElapsed = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
        newElapsedTimes[alarm.id] = secondsElapsed;
      }
    });
    
    setElapsedTimes(newElapsedTimes);
    
    // Actualizar los tiempos cada segundo (solo para alarmas activas o despachadas)
    const intervalId = setInterval(() => {
      setElapsedTimes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const alarmId = Number(key);
          // Buscar la alarma correspondiente
          const alarm = alarms.find((a: any) => a.id === alarmId);
          // Solo actualizar el tiempo si la alarma está activa o despachada
          if (alarm && (alarm.status === AlarmStatus.ACTIVE || alarm.status === AlarmStatus.DISPATCHED || alarm.status === AlarmStatus.IN_PROGRESS)) {
            updated[alarmId] += 1;
          }
        });
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [alarms]);

  // Mutación para actualizar el estado de una alarma
  const updateAlarmMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest('PATCH', `/api/alarms/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alarms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alarms/active'] });
      toast({
        title: 'Alarma actualizada',
        description: 'El estado de la alarma se ha actualizado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al actualizar la alarma: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Mutación para crear una nueva alarma
  const createAlarmMutation = useMutation({
    mutationFn: async (newAlarm: any) => {
      await apiRequest('POST', '/api/alarms', newAlarm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alarms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alarms/active'] });
      toast({
        title: 'Alarma creada',
        description: 'La alarma se ha creado correctamente',
      });
      // Cerrar modal o resetear formulario
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al crear la alarma: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Definimos tipo para las alarmas
  interface AlarmData {
    id: number;
    clientName: string;
    type: keyof typeof AlarmTypeLabels;
    status: keyof typeof AlarmStatusLabels;
    location: string;
    createdAt: string;
    address?: string;
    description?: string;
    accountNumber?: string;
    operatorId?: number;
    dispatcherId?: number;
    assignedPatrolId?: number;
    priority?: string;
    notes?: string;
  }
  
  // Filtrar alarmas según el estado seleccionado
  const filteredAlarms = alarms && Array.isArray(alarms)
    ? filterStatus === 'all'
      ? alarms
      : alarms.filter((alarm: AlarmData) => alarm.status === filterStatus)
    : [];

  // Usar nuestro hook para WebSocket
  const { sendMessage, MessageType } = useSocket();

  // Función para actualizar el estado de una alarma
  const handleUpdateAlarmStatus = (id: number, status: string) => {
    updateAlarmMutation.mutate({ id, status });
    
    // Si se está despachando una alarma, enviar notificación para despachadores
    if (status === AlarmStatus.DISPATCHED) {
      // Buscar los datos completos de la alarma
      const alarmToDispatch = alarms?.find((alarm: any) => alarm.id === id);
      
      if (alarmToDispatch) {
        console.log('🚨 Enviando alarma al panel de despachadores:', alarmToDispatch);
        
        // Enviar como solicitud de despacho
        sendMessage(MessageType.DISPATCH_REQUEST, {
          alarmId: alarmToDispatch.id,
          clientId: alarmToDispatch.clientId || 0,
          clientName: alarmToDispatch.clientName || 'Cliente sin nombre',
          requestedBy: user?.id || 0,
          priority: alarmToDispatch.priority || 'high',
          notes: `Despachado automáticamente por operador ${user?.firstName || ''} ${user?.lastName || ''}`
        });
        
        // También enviar como una actualización de alarma para asegurar que se actualice en todos lados
        sendMessage(MessageType.ALARM_UPDATE, {
          alarmId: alarmToDispatch.id,
          status: AlarmStatus.DISPATCHED,
          priority: alarmToDispatch.priority || 'high',
          clientId: alarmToDispatch.clientId || 0,
          clientName: alarmToDispatch.clientName || 'Cliente sin nombre',
          createdAt: alarmToDispatch.createdAt,
          location: alarmToDispatch.location,
          address: alarmToDispatch.address,
          description: alarmToDispatch.description,
        });
        
        // Enviar como notificación para mayor redundancia
        sendMessage(MessageType.NOTIFICATION, {
          title: '🚨 Nueva alarma para despacho',
          message: `Cliente: ${alarmToDispatch.clientName || 'Cliente sin nombre'} - Prioridad: ${alarmToDispatch.priority || 'alta'}`,
          targetRole: 'dispatcher',
          notificationType: 'alarm',
          entityId: alarmToDispatch.id,
          entityType: 'alarm',
        });
        
        // Mostrar confirmación adicional al operador
        toast({
          title: '¡Alarma despachada!',
          description: 'La alarma ha sido enviada al panel de despachadores',
          variant: 'default',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Alarmas</h1>
        <Button
          variant="default"
          onClick={() => setIsNewAlarmModalOpen(true)}
        >
          Nueva Alarma
        </Button>
      </div>

      {/* Filtros de alarmas */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            Todas
          </Button>
          <Button
            variant={filterStatus === AlarmStatus.ACTIVE ? 'default' : 'outline'}
            onClick={() => setFilterStatus(AlarmStatus.ACTIVE)}
            className="bg-red-500 hover:bg-red-600"
          >
            Activas
          </Button>
          <Button
            variant={filterStatus === AlarmStatus.DISPATCHED ? 'default' : 'outline'}
            onClick={() => setFilterStatus(AlarmStatus.DISPATCHED)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Despachadas
          </Button>
          <Button
            variant={filterStatus === AlarmStatus.IN_PROGRESS ? 'default' : 'outline'}
            onClick={() => setFilterStatus(AlarmStatus.IN_PROGRESS)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            En Progreso
          </Button>
          <Button
            variant={filterStatus === AlarmStatus.RESOLVED ? 'default' : 'outline'}
            onClick={() => setFilterStatus(AlarmStatus.RESOLVED)}
            className="bg-green-500 hover:bg-green-600"
          >
            Resueltas
          </Button>
          <Button
            variant={filterStatus === AlarmStatus.CANCELED ? 'default' : 'outline'}
            onClick={() => setFilterStatus(AlarmStatus.CANCELED)}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Canceladas
          </Button>
        </div>
      </div>

      {/* Tabla de alarmas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-gray-500">Cargando alarmas...</div>
          ) : filteredAlarms.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              No se encontraron alarmas con los filtros seleccionados
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiempo
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAlarms.map((alarm: any) => (
                  <tr 
                    key={alarm.id}
                    className={`cursor-pointer hover:brightness-95 text-xs ${
                      selectedAlarm?.id === alarm.id 
                        ? 'bg-primary/20' 
                        : (alarm.status === AlarmStatus.ACTIVE || alarm.status === AlarmStatus.DISPATCHED)
                          ? elapsedTimes[alarm.id] > 1800 // Más de 30 minutos (rojo)
                            ? 'bg-red-200 border-l-4 border-red-500' 
                            : elapsedTimes[alarm.id] > 1200 // Entre 20 y 30 minutos (naranja)
                              ? 'bg-orange-200 border-l-4 border-orange-500'
                              : 'bg-green-200 border-l-4 border-green-500' // Menos de 20 minutos (verde)
                          : 'hover:bg-accent'
                    }`}
                    onClick={() => {
                      // Si ya está seleccionada, quitamos la selección
                      if (selectedAlarm?.id === alarm.id) {
                        setSelectedAlarm(null);
                      } else {
                        setSelectedAlarm(alarm);
                      }
                    }}>
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      #{alarm.id}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                      {alarm.clientName}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                      {AlarmTypeLabels[alarm.type as keyof typeof AlarmTypeLabels] || alarm.type}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          AlarmStatusColors[alarm.status as keyof typeof AlarmStatusColors] || 'bg-gray-200'
                        } text-white`}
                      >
                        {AlarmStatusLabels[alarm.status as keyof typeof AlarmStatusLabels] || alarm.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                      {alarm.location}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                      {new Date(alarm.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className={`
                        inline-flex items-center px-1.5 py-0.5 rounded-md font-medium text-xs
                        ${
                          alarm.status === AlarmStatus.ACTIVE || alarm.status === AlarmStatus.DISPATCHED
                            ? elapsedTimes[alarm.id] > 1800 // Más de 30 minutos (rojo)
                              ? 'bg-red-200 text-red-900 border border-red-500 shadow-sm animate-heartbeat' 
                              : elapsedTimes[alarm.id] > 1200 // Entre 20 y 30 minutos (naranja)
                                ? 'bg-orange-200 text-orange-800 border border-orange-500' 
                                : 'bg-green-200 text-green-800 border border-green-500' // Menos de 20 minutos (verde)
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }
                      `}>
                        <svg 
                          className={`w-3 h-3 mr-0.5 ${alarm.status === AlarmStatus.ACTIVE && elapsedTimes[alarm.id] > 1200 ? 'animate-spin' : ''}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                        </svg>
                        {elapsedTimes[alarm.id] ? formatElapsedTime(elapsedTimes[alarm.id]) : "Calculando..."}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-right space-x-1">
                      {alarm.status === AlarmStatus.ACTIVE && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateAlarmStatus(alarm.id, AlarmStatus.DISPATCHED)}
                          className="h-6 w-6"
                          title="Despachar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </Button>
                      )}
                      {(() => {
                        // Verificar si la alarma es reciente (menos de 5 minutos)
                        const alarmDate = new Date(alarm.createdAt);
                        const now = new Date();
                        const timeDiff = (now.getTime() - alarmDate.getTime()) / 1000; // en segundos
                        const isRecent = timeDiff <= 300; // 5 minutos = 300 segundos
                        
                        // Mostrar el botón de cancelar solo si la alarma es activa o si es reciente (independientemente del estado)
                        if (alarm.status === AlarmStatus.ACTIVE || isRecent) {
                          return (
                            <Button
                              variant={isRecent ? "destructive" : "outline"}
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation(); // Evitar que se active el onClick del tr
                                handleUpdateAlarmStatus(alarm.id, AlarmStatus.CANCELED);
                              }}
                              className={`h-6 w-6 ${isRecent && alarm.status !== AlarmStatus.ACTIVE ? "animate-pulse border-red-500" : ""}`}
                              title={isRecent && alarm.status !== AlarmStatus.ACTIVE ? "Cancelar Emergencia" : "Cancelar"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </Button>
                          );
                        }
                        return null;
                      })()}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation(); // Evitar que se active el onClick del tr
                          setSelectedAlarm(alarm);
                        }}
                        className="h-6 w-6"
                        title="Ver detalles"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Panel de detalles de la alarma seleccionada */}
      {selectedAlarm && (
        <div className="mt-6 p-6 bg-amber-50 border border-amber-300 rounded-lg shadow-md transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Detalles de la Alarma #{selectedAlarm.id}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAlarm(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Información Principal
                </h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                    <dd className="mt-1 text-base font-semibold text-gray-900">{selectedAlarm.clientName || 'No especificado'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Número de Cuenta</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedAlarm.accountNumber || 'No especificado'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tipo de Alarma</dt>
                    <dd className="mt-1 text-sm text-gray-900">{AlarmTypeLabels[selectedAlarm.type]}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="mt-1">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${AlarmStatusColors[selectedAlarm.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {AlarmStatusLabels[selectedAlarm.status]}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Creada</dt>
                    <dd className="mt-1 text-sm text-gray-900">{new Date(selectedAlarm.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Operador</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedAlarm.operatorName || 'No asignado'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Ubicación
                </h4>
                <dl className="grid grid-cols-1 gap-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedAlarm.address || 'No especificada'}</dd>
                  </div>
                  {selectedAlarm.locationUrl && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Mapa</dt>
                      <dd className="mt-1">
                        <a 
                          href={selectedAlarm.locationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                          </svg>
                          Ver en Google Maps
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Detalles Adicionales
                </h4>
                <dl className="grid grid-cols-1 gap-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{selectedAlarm.description || 'Sin descripción'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Notas</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{selectedAlarm.notes || 'Sin notas adicionales'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Asignación
                </h4>
                {(() => {
                  // Buscar la asignación correspondiente a esta alarma
                  const assignment = Array.isArray(assignments) 
                    ? assignments.find((a: any) => a && a.alarmId === selectedAlarm.id)
                    : null;
                    
                  if (assignment) {
                    // Buscar los datos de la patrulla asignada
                    const assignedPatrol = Array.isArray(patrols)
                      ? patrols.find((p: any) => p && p.id === assignment.patrolId)
                      : null;
                      
                    // Extraer el nombre del supervisor de las notas
                    let supervisorName = "No especificado";
                    if (assignedPatrol && assignedPatrol.notes && assignedPatrol.notes.startsWith('Supervisor:')) {
                      supervisorName = assignedPatrol.notes.replace('Supervisor:', '').trim();
                    }
                      
                    return (
                      <dl className="grid grid-cols-1 gap-y-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Despachado por</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-medium">
                            {assignment.dispatcherId ? `ID: ${assignment.dispatcherId}` : 'No especificado'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Supervisor asignado</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-medium">
                            {supervisorName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Unidad / Placa</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {assignedPatrol 
                              ? `${assignedPatrol.vehicleCode} / ${assignedPatrol.licensePlate}` 
                              : 'No especificado'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Estado de la asignación</dt>
                          <dd className="mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${assignment.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                                assignment.status === 'en_route' ? 'bg-blue-100 text-blue-800' :
                                assignment.status === 'on_site' ? 'bg-green-100 text-green-800' :
                                assignment.status === 'returning' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {assignment.status === 'assigned' ? 'Asignada' :
                               assignment.status === 'en_route' ? 'En Camino' :
                               assignment.status === 'on_site' ? 'En el Sitio' :
                               assignment.status === 'returning' ? 'Retornando' :
                               assignment.status || 'Desconocido'}
                            </span>
                          </dd>
                        </div>
                        {assignment.assignedAt && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Hora de asignación</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(assignment.assignedAt).toLocaleString()}
                            </dd>
                          </div>
                        )}
                      </dl>
                    );
                  } else {
                    return (
                      <p className="text-sm text-gray-500 italic">Esta alarma aún no ha sido asignada a una patrulla.</p>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Nueva Alarma */}
      <NewAlarmModal 
        isOpen={isNewAlarmModalOpen} 
        onClose={() => setIsNewAlarmModalOpen(false)} 
      />
    </div>
  );
}