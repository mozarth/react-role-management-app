import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlarmStatusColors, AlarmStatusLabels, PatrolStatusColors, PatrolStatusLabels, MessageType } from "@/lib/constants";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Spinner } from "@/components/ui/spinner";
import AssignSupervisorModal from "./AssignSupervisorModal";
import { useSocket } from "@/hooks/useSocket";

const DispatcherView: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const socket = useSocket();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // Get alarms that need dispatch
  const { data: alarms = [], isLoading: isAlarmsLoading } = useQuery({
    queryKey: ["/api/alarms"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Get active patrol assignments
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ["/api/assignments"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Get available patrols
  const { data: patrols = [], isLoading: isPatrolsLoading } = useQuery({
    queryKey: ["/api/patrols"],
  });
  
  // Get supervisors
  const { data: supervisors = [], isLoading: isSupervisorsLoading } = useQuery({
    queryKey: ["/api/users/by-role/supervisor"],
  });
  
  // Listen for WebSocket messages
  React.useEffect(() => {
    if (!socket.isConnected) return;
    
    // Listen for dispatch requests
    const dispatchSubscription = socket.addListener(
      MessageType.DISPATCH_REQUEST,
      (data) => {
        // Play sound to notify of new dispatch request
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Error playing sound', e));
        
        // Update local state by invalidating queries
        queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
        
        toast({
          title: "Nueva solicitud de despacho",
          description: `Se ha recibido una nueva solicitud para la alarma #${data.alarm.id}.`,
        });
      }
    );
    
    // Listen for patrol status updates
    const statusSubscription = socket.addListener(
      MessageType.PATROL_STATUS_UPDATE,
      (data) => {
        queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      }
    );
    
    return () => {
      dispatchSubscription();
      statusSubscription();
    };
  }, [socket.isConnected, queryClient, toast]);
  
  // Filter pending alarms (active + dispatched)
  const pendingAlarms = alarms.filter(alarm => 
    (alarm.status === 'active' || alarm.status === 'dispatched') &&
    !assignments.some(a => a.alarmId === alarm.id)
  );
  
  // Filter alarms based on search and status
  const filteredAlarms = pendingAlarms.filter(alarm => {
    const clientName = alarm.client?.businessName?.toLowerCase() || "";
    const clientAddress = alarm.client?.address?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchLower) || 
      clientAddress.includes(searchLower) || 
      alarm.id.toString().includes(searchLower);
      
    const matchesStatus = !statusFilter || alarm.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Get client information
  const getClientInfo = (clientId: number) => {
    const alarm = alarms.find(a => a.client?.id === clientId);
    return alarm?.client || { businessName: "Cliente desconocido", address: "Dirección desconocida" };
  };
  
  // Get supervisor name
  const getSupervisorName = (supervisorId: number) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    return supervisor 
      ? `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.username
      : "Desconocido";
  };
  
  // Get patrol information
  const getPatrolInfo = (patrolId: number) => {
    const patrol = patrols.find(p => p.id === patrolId);
    return patrol || { vehicleCode: "Desconocido", licensePlate: "N/A" };
  };
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
    queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/patrols"] });
  };
  
  const handleAssignSupervisor = (alarm: any) => {
    setSelectedAlarm(alarm);
    setIsAssignModalOpen(true);
  };
  
  const isLoading = isAlarmsLoading || isAssignmentsLoading || isPatrolsLoading || isSupervisorsLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral mb-2">Despacho de Patrullas</h1>
        <p className="text-gray-600">Gestión y asignación de patrullas a alarmas activas</p>
      </div>
      
      <Tabs defaultValue="pending" className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Alarmas Pendientes</TabsTrigger>
          <TabsTrigger value="active-patrols">Patrullas en Servicio</TabsTrigger>
          <TabsTrigger value="patrol-map">Mapa de Patrullas</TabsTrigger>
          <TabsTrigger value="shifts">Turnos Supervisores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por ID, cliente o dirección..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="active">Alarma Activa</SelectItem>
                  <SelectItem value="dispatched">Despachada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
          
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Alarmas Pendientes de Asignación</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlarms.length > 0 ? (
                      filteredAlarms.map((alarm) => (
                        <TableRow 
                          key={alarm.id}
                          className={alarm.status === 'active' ? "hover:bg-red-50" : "hover:bg-gray-50"}
                        >
                          <TableCell className="font-medium">#{alarm.id}</TableCell>
                          <TableCell>{alarm.client?.businessName || "Cliente desconocido"}</TableCell>
                          <TableCell>{alarm.client?.address || "Dirección desconocida"}</TableCell>
                          <TableCell>
                            {alarm.createdAt 
                              ? format(new Date(alarm.createdAt), 'dd/MM HH:mm:ss') 
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              AlarmStatusColors[alarm.status]
                            }`}>
                              {AlarmStatusLabels[alarm.status] || alarm.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleAssignSupervisor(alarm)}
                            >
                              Asignar Supervisor
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No hay alarmas pendientes de asignación
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Active Assignments Table */}
          <Card className="mt-6">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Asignaciones Activas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Asignación</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Supervisor</TableHead>
                      <TableHead>Patrulla</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Tiempo transcurrido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.length > 0 ? (
                      assignments.map((assignment) => {
                        const alarm = alarms.find(a => a.id === assignment.alarmId);
                        const client = alarm?.client;
                        
                        return (
                          <TableRow key={assignment.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">#{assignment.id}</TableCell>
                            <TableCell>
                              {client?.businessName || "Cliente desconocido"}
                              <div className="text-xs text-gray-500">Alarma #{assignment.alarmId}</div>
                            </TableCell>
                            <TableCell>{getSupervisorName(assignment.supervisorId)}</TableCell>
                            <TableCell>
                              {getPatrolInfo(assignment.patrolId).vehicleCode}
                              <div className="text-xs text-gray-500">
                                {getPatrolInfo(assignment.patrolId).licensePlate}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                assignment.status === 'assigned' ? 'bg-amber-100 text-amber-600' :
                                assignment.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                                assignment.status === 'arrived' ? 'bg-green-100 text-success' :
                                assignment.status === 'completed' ? 'bg-green-100 text-success' : 
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {assignment.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {assignment.assignedAt ? 
                                formatTimeElapsed(assignment.assignedAt) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No hay asignaciones activas en este momento
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active-patrols">
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Patrullas en Servicio</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Actualización</TableHead>
                      <TableHead>Supervisor Asignado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patrols.length > 0 ? (
                      patrols.map((patrol) => {
                        const assignment = assignments.find(a => a.patrolId === patrol.id);
                        
                        return (
                          <TableRow key={patrol.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">#{patrol.id}</TableCell>
                            <TableCell>{patrol.vehicleCode}</TableCell>
                            <TableCell>{patrol.licensePlate}</TableCell>
                            <TableCell>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                PatrolStatusColors[patrol.status]
                              }`}>
                                {PatrolStatusLabels[patrol.status] || patrol.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {patrol.lastUpdated 
                                ? format(new Date(patrol.lastUpdated), 'dd/MM HH:mm:ss') 
                                : 'Nunca'
                              }
                            </TableCell>
                            <TableCell>
                              {assignment 
                                ? getSupervisorName(assignment.supervisorId)
                                : "No asignado"
                              }
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No hay patrullas registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="patrol-map">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Mapa de Patrullas</h3>
            <p className="text-gray-600 mb-4">
              Visualización en tiempo real de la ubicación de todas las patrullas.
            </p>
            
            <div className="h-96 bg-gray-200 rounded-lg relative">
              {/* Map will be implemented here with Google Maps */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">Cargando mapa de patrullas...</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="shifts">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Turnos de Supervisores</h3>
            <p className="text-gray-600">
              Gestión de turnos para supervisores motorizados.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Assignment Modal */}
      <AssignSupervisorModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        alarm={selectedAlarm}
        supervisors={supervisors}
        patrols={patrols.filter(p => p.status === 'available')}
      />
    </div>
  );
};

// Helper function to format elapsed time
function formatTimeElapsed(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "'Hace' m 'min'", { locale: es });
  } catch (error) {
    return "Desconocido";
  }
}

export default DispatcherView;
