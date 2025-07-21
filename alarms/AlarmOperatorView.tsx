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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { AlarmStatus, AlarmStatusColors, AlarmStatusLabels, AlarmType, AlarmTypeLabels } from "@/lib/constants";
import { Search, Plus, RefreshCw, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AlarmDetailsModal from "./AlarmDetailsModal";
import { Spinner } from "@/components/ui/spinner";
import { useSocket } from "@/hooks/useSocket";
import { MessageType } from "@/lib/constants";

const AlarmOperatorView: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const socket = useSocket();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [alarmTypeFilter, setAlarmTypeFilter] = useState<string>("");
  const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);
  const [isAlarmDetailsOpen, setIsAlarmDetailsOpen] = useState(false);
  
  // Fetch active alarms
  const { data: alarms = [], isLoading, isError } = useQuery({
    queryKey: ["/api/alarms"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Fetch clients for alarm creation
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Mutation for sending alarm to dispatch
  const dispatchMutation = useMutation({
    mutationFn: async (alarmId: number) => {
      return await apiRequest("POST", `/api/alarms/${alarmId}/dispatch`);
    },
    onSuccess: (_, alarmId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
      toast({
        title: "Alarma enviada a despacho",
        description: `La alarma #${alarmId} ha sido enviada al equipo de despacho.`,
      });
      
      // Notify via WebSocket
      if (socket.isConnected) {
        socket.sendMessage(MessageType.DISPATCH_REQUEST, { 
          alarmId 
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la alarma a despacho. Inténtelo de nuevo.",
      });
    }
  });

  // Filter alarms based on search and alarm type
  const filteredAlarms = alarms.filter(alarm => {
    const clientName = alarm.client?.businessName?.toLowerCase() || "";
    const clientAddress = alarm.client?.address?.toLowerCase() || "";
    const clientCode = alarm.client?.clientCode?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchLower) || 
      clientAddress.includes(searchLower) || 
      clientCode.includes(searchLower) ||
      alarm.id.toString().includes(searchLower);
      
    const matchesType = !alarmTypeFilter || alarm.type === alarmTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Handle sending alarm to dispatch
  const handleSendToDispatch = (alarmId: number) => {
    dispatchMutation.mutate(alarmId);
  };
  
  // Handle refreshing alarms
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
  };
  
  // Handle opening alarm details
  const handleOpenAlarmDetails = (alarm: any) => {
    setSelectedAlarm(alarm);
    setIsAlarmDetailsOpen(true);
  };

  // Handle creating new alarm
  const handleNewAlarm = () => {
    setSelectedAlarm(null);
    setIsAlarmDetailsOpen(true);
  };
  
  if (isError) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-red-600 mb-2">Error al cargar alarmas</h3>
        <p className="text-gray-500 mb-4">No se pudieron cargar las alarmas. Inténtelo de nuevo más tarde.</p>
        <Button onClick={handleRefresh}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral mb-2">Gestión de Alarmas</h1>
        <p className="text-gray-600">Panel de control para operadores de alarmas</p>
      </div>
      
      <Tabs defaultValue="active" className="mb-6">
        <TabsList>
          <TabsTrigger value="active">Alarmas Activas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoreo de Alarmas</TabsTrigger>
          <TabsTrigger value="vehicles">Monitoreo de Vehículos</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="shifts">Mi Turno</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
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
                value={alarmTypeFilter}
                onValueChange={setAlarmTypeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  <SelectItem value={AlarmType.INTRUSION}>{AlarmTypeLabels[AlarmType.INTRUSION]}</SelectItem>
                  <SelectItem value={AlarmType.FIRE}>{AlarmTypeLabels[AlarmType.FIRE]}</SelectItem>
                  <SelectItem value={AlarmType.PANIC}>{AlarmTypeLabels[AlarmType.PANIC]}</SelectItem>
                  <SelectItem value={AlarmType.TECHNICAL}>{AlarmTypeLabels[AlarmType.TECHNICAL]}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={handleNewAlarm}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Alerta
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Alarmas Activas</CardTitle>
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
                      <TableHead>ID Cliente</TableHead>
                      <TableHead>Razón Social</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Tipo</TableHead>
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
                          className={alarm.status === AlarmStatus.ACTIVE ? "hover:bg-red-50" : "hover:bg-gray-50"}
                        >
                          <TableCell>#{alarm.client?.clientCode || alarm.clientId}</TableCell>
                          <TableCell>{alarm.client?.businessName || "Cliente desconocido"}</TableCell>
                          <TableCell>{alarm.client?.address || "Dirección desconocida"}</TableCell>
                          <TableCell>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              alarm.type === AlarmType.INTRUSION ? 'bg-red-100 text-danger' :
                              alarm.type === AlarmType.FIRE ? 'bg-orange-100 text-orange-600' :
                              alarm.type === AlarmType.PANIC ? 'bg-purple-100 text-purple-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {AlarmTypeLabels[alarm.type as keyof typeof AlarmTypeLabels] || alarm.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            {alarm.createdAt ? format(new Date(alarm.createdAt), 'HH:mm:ss') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              AlarmStatusColors[alarm.status as keyof typeof AlarmStatusColors]
                            }`}>
                              {AlarmStatusLabels[alarm.status as keyof typeof AlarmStatusLabels] || alarm.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAlarmDetails(alarm)}
                              >
                                Ver
                              </Button>
                              
                              {alarm.status === AlarmStatus.ACTIVE && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSendToDispatch(alarm.id)}
                                  disabled={dispatchMutation.isPending}
                                >
                                  {dispatchMutation.isPending ? (
                                    <Spinner size="sm" className="mr-1" />
                                  ) : null}
                                  Enviar a Despacho
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No hay alarmas activas que coincidan con los filtros
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Integration Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <span className="material-icons text-green-600 mr-3">chat</span>
                <span className="font-medium">WhatsApp Web</span>
              </div>
              <ExternalLink className="h-5 w-5" />
            </Card>
            
            <Card className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <span className="material-icons text-red-600 mr-3">notifications_active</span>
                <span className="font-medium">Monitoreo de Alarmas</span>
              </div>
              <ExternalLink className="h-5 w-5" />
            </Card>
            
            <Card className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <span className="material-icons text-blue-600 mr-3">location_on</span>
                <span className="font-medium">Monitoreo de Vehículos</span>
              </div>
              <ExternalLink className="h-5 w-5" />
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Historial de Alarmas</h3>
            <p className="text-gray-600">
              Aquí podrá consultar el historial de alarmas atendidas y resueltas.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="monitoring">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Monitoreo de Alarmas</h3>
            <p className="text-gray-600">
              Interfaz integrada con el sistema de monitoreo de alarmas.
            </p>
            <Button variant="outline" className="mt-4">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Sistema de Monitoreo
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="vehicles">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Monitoreo de Vehículos</h3>
            <p className="text-gray-600">
              Interfaz integrada con el sistema de monitoreo de vehículos.
            </p>
            <Button variant="outline" className="mt-4">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Sistema de Monitoreo de Vehículos
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="whatsapp">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">WhatsApp Web</h3>
            <p className="text-gray-600">
              Acceso rápido a WhatsApp Web para comunicación con el equipo.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => window.open('https://web.whatsapp.com', '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir WhatsApp Web
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="shifts">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Mi Turno</h3>
            <p className="text-gray-600">
              Consulta de programación de turnos asignados.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Alarm Details Modal */}
      <AlarmDetailsModal 
        isOpen={isAlarmDetailsOpen} 
        onClose={() => setIsAlarmDetailsOpen(false)}
        alarm={selectedAlarm}
        clients={clients}
        onSendToDispatch={handleSendToDispatch}
      />
    </div>
  );
};

export default AlarmOperatorView;
