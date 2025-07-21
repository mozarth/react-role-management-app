import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PatrolStatus, PatrolStatusLabels, PatrolStatusColors } from '@/lib/constants';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SupervisorPanel from './SupervisorPanel';

export default function Supervisors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSupervisor, setSelectedSupervisor] = useState<any>(null);

  // Obtener supervisores con patrullas asignadas
  const { data: supervisors = [], isLoading: supervisorsLoading } = useQuery<any[]>({
    queryKey: ['/api/supervisors'],
    staleTime: 30000, // 30 segundos
  });

  // Obtener asignaciones activas por supervisor
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<any[]>({
    queryKey: ['/api/patrol-assignments/supervisor', selectedSupervisor?.id],
    staleTime: 30000, // 30 segundos
    enabled: !!selectedSupervisor?.id,
  });

  // Filtro para ver patrullas según estado
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Filtrar patrullas según el estado seleccionado
  const filteredSupervisors = statusFilter === 'all' 
    ? supervisors 
    : supervisors.filter((supervisor: any) => supervisor.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Supervisores Motorizados</h1>
        <Link href="/supervisor-shifts">
          <Button>
            Asignar Turnos
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="lista">Lista de Supervisores</TabsTrigger>
          <TabsTrigger value="panel">Panel de Supervisor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="space-y-6">
          {/* Filtros de estado */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === PatrolStatus.AVAILABLE ? 'default' : 'outline'}
                onClick={() => setStatusFilter(PatrolStatus.AVAILABLE)}
                className="bg-green-500 hover:bg-green-600"
              >
                Disponibles
              </Button>
              <Button
                variant={statusFilter === PatrolStatus.ASSIGNED ? 'default' : 'outline'}
                onClick={() => setStatusFilter(PatrolStatus.ASSIGNED)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Asignados
              </Button>
              <Button
                variant={statusFilter === PatrolStatus.EN_ROUTE ? 'default' : 'outline'}
                onClick={() => setStatusFilter(PatrolStatus.EN_ROUTE)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                En Camino
              </Button>
              <Button
                variant={statusFilter === PatrolStatus.ON_SITE ? 'default' : 'outline'}
                onClick={() => setStatusFilter(PatrolStatus.ON_SITE)}
                className="bg-purple-500 hover:bg-purple-600"
              >
                En Sitio
              </Button>
            </div>
          </div>

          {/* Grid de supervisores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supervisorsLoading ? (
              <div className="col-span-full py-20 text-center text-gray-500">Cargando supervisores...</div>
            ) : filteredSupervisors.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-500">
                No se encontraron supervisores con el filtro seleccionado
              </div>
            ) : (
              filteredSupervisors.map((supervisor: any) => (
                <div
                  key={supervisor.id}
                  className={`bg-white rounded-lg shadow overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedSupervisor?.id === supervisor.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSupervisor(supervisor)}
                >
                  <div className="relative">
                    {/* Imagen o avatar del supervisor */}
                    <div className="h-32 bg-gray-200 flex items-center justify-center">
                      {supervisor.profileImageUrl ? (
                        <img
                          src={supervisor.profileImageUrl}
                          alt={supervisor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-white text-2xl font-bold">
                          {supervisor.firstName?.[0] || 'S'}
                        </div>
                      )}
                    </div>
                    
                    {/* Badge de estado */}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PatrolStatusColors[supervisor.status as keyof typeof PatrolStatusColors] || 'bg-gray-500'} text-white`}>
                        {PatrolStatusLabels[supervisor.status as keyof typeof PatrolStatusLabels] || supervisor.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-lg">{supervisor.firstName} {supervisor.lastName}</h3>
                    <p className="text-sm text-gray-500">ID: {supervisor.id}</p>
                    <p className="text-sm text-gray-500">Unidad: {supervisor.patrolId || 'No asignada'}</p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {supervisor.lastUpdated ? 
                          `Última actualización: ${new Date(supervisor.lastUpdated).toLocaleTimeString()}` : 
                          'Sin actualización reciente'}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast({
                            title: 'Ubicación actual',
                            description: 'La visualización de la ubicación se implementará próximamente',
                          });
                        }}
                      >
                        Ver ubicación
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel de detalle del supervisor seleccionado */}
          {selectedSupervisor && (
            <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h2 className="text-lg font-medium">Detalle del Supervisor: {selectedSupervisor.firstName} {selectedSupervisor.lastName}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSupervisor(null)}
                >
                  Cerrar
                </Button>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium mb-3">Información Personal</h3>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Nombre:</span> {selectedSupervisor.firstName} {selectedSupervisor.lastName}</p>
                      <p className="text-sm"><span className="font-medium">Email:</span> {selectedSupervisor.email || 'No disponible'}</p>
                      <p className="text-sm"><span className="font-medium">Teléfono:</span> {selectedSupervisor.phone || 'No disponible'}</p>
                      <p className="text-sm"><span className="font-medium">Estado:</span> {PatrolStatusLabels[selectedSupervisor.status as keyof typeof PatrolStatusLabels] || selectedSupervisor.status}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-3">Información de Patrulla</h3>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">ID de Patrulla:</span> {selectedSupervisor.patrolId || 'No asignada'}</p>
                      <p className="text-sm"><span className="font-medium">Vehículo:</span> {selectedSupervisor.vehicleId || 'No asignado'}</p>
                      <p className="text-sm"><span className="font-medium">Última ubicación:</span> {selectedSupervisor.lastLocation || 'No disponible'}</p>
                      <p className="text-sm"><span className="font-medium">Turno actual:</span> {selectedSupervisor.currentShift || 'Sin turno asignado'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Asignaciones del supervisor */}
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-3">Asignaciones Activas</h3>
                  
                  {assignmentsLoading ? (
                    <div className="py-6 text-center text-gray-500">Cargando asignaciones...</div>
                  ) : assignments.length === 0 ? (
                    <div className="py-6 text-center text-gray-500">No hay asignaciones activas para este supervisor</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {assignments.map((assignment: any) => (
                            <tr key={assignment.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{assignment.id}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{assignment.clientName}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{assignment.location}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 
                                  assignment.status === 'en_route' ? 'bg-yellow-100 text-yellow-800' :
                                  assignment.status === 'on_site' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {assignment.status === 'assigned' ? 'Asignado' :
                                   assignment.status === 'en_route' ? 'En camino' :
                                   assignment.status === 'on_site' ? 'En sitio' :
                                   assignment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {new Date(assignment.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="panel">
          <SupervisorPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}