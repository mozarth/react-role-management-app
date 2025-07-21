import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, Clock, User, Truck } from 'lucide-react';

export function SimplifiedRealTimeMonitor() {
  // Datos simulados para mostrar la interfaz
  const mockAssignments = [
    {
      id: 1,
      status: 'assigned',
      clientName: 'Corporación Nacional',
      supervisorName: 'Carlos Vega',
      assignedAt: new Date(Date.now() - 10 * 60000).toISOString() // 10 minutos atrás
    },
    {
      id: 2,
      status: 'arrived',
      clientName: 'Banco Central',
      supervisorName: 'Ana Martínez',
      assignedAt: new Date(Date.now() - 25 * 60000).toISOString() // 25 minutos atrás
    }
  ];

  const mockActivities = [
    {
      id: 'activity-1',
      type: 'patrol_update',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      payload: {
        supervisorName: 'Ana Martínez',
        status: 'arrived',
        clientName: 'Banco Central',
        clientAddress: 'Av. Principal #123'
      }
    },
    {
      id: 'activity-2',
      type: 'patrol_update',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      payload: {
        supervisorName: 'Carlos Vega',
        status: 'assigned',
        clientName: 'Corporación Nacional',
        clientAddress: 'Calle Comercio #456',
        notes: 'En camino, tráfico moderado'
      }
    }
  ];

  // Obtener texto de estado para mostrar
  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Asignado';
      case 'accepted': return 'Aceptado';
      case 'arrived': return 'En sitio';
      case 'verified': return 'Verificado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };
  
  // Obtener color de estado para mostrar
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-indigo-100 text-indigo-800';
      case 'arrived': return 'bg-amber-100 text-amber-800';
      case 'verified': return 'bg-teal-100 text-teal-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Calcular tiempo transcurrido desde que se asignó
  const getElapsedTime = (assignment: any) => {
    if (!assignment.assignedAt) return 'N/A';
    
    const assignedTime = new Date(assignment.assignedAt).getTime();
    const now = Date.now();
    const diffMs = now - assignedTime;
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    let className = '';
    if (minutes >= 30) {
      className = 'text-red-600 font-bold';
    } else if (minutes >= 20) {
      className = 'text-amber-600 font-bold';
    } else {
      className = 'text-green-600';
    }
    
    return (
      <span className={className}>
        {minutes}m {seconds}s
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Monitoreo en Tiempo Real</CardTitle>
          <CardDescription>
            Seguimiento de actividades de supervisores y patrullas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asignaciones activas */}
          <div>
            <h3 className="text-sm font-medium mb-3">Asignaciones Activas ({mockAssignments.length})</h3>
            
            {mockAssignments.length === 0 ? (
              <Alert>
                <AlertTitle>Sin asignaciones activas</AlertTitle>
                <AlertDescription>
                  No hay supervisores con asignaciones activas en este momento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {mockAssignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="p-2 rounded-md border flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusText(assignment.status)}
                        </Badge>
                        <span className="text-sm font-medium">{assignment.clientName}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <User className="h-3 w-3 mr-1" />
                        {assignment.supervisorName || 'Sin asignar'}
                      </div>
                    </div>
                    <div className="text-xs flex flex-col items-end">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {getElapsedTime(assignment)}
                      </div>
                      <div className="text-gray-500 mt-1">
                        {new Date(assignment.assignedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Actividad reciente */}
          <div>
            <h3 className="text-sm font-medium mb-3">Actividad Reciente</h3>
            
            {mockActivities.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No hay actividad reciente para mostrar
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {mockActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="p-2 rounded-md border bg-gray-50"
                  >
                    {activity.type === 'patrol_update' && (
                      <div>
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 mr-1 text-blue-600" />
                            <span className="text-sm font-medium">{activity.payload.supervisorName}</span>
                          </div>
                          <Badge className={getStatusColor(activity.payload.status)}>
                            {getStatusText(activity.payload.status)}
                          </Badge>
                        </div>
                        
                        <div className="mt-1">
                          <div className="text-xs text-gray-700 flex items-start">
                            <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{activity.payload.clientName} - {activity.payload.clientAddress}</span>
                          </div>
                        </div>
                        
                        {activity.payload.notes && (
                          <div className="mt-1 text-xs italic text-gray-600">
                            "{activity.payload.notes}"
                          </div>
                        )}
                        
                        <div className="text-right text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}