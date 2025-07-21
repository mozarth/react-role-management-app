import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { useSocket } from "@/hooks/useSocket";
import { MessageType } from "@/lib/constants";
import QRScannerModal from "./QRScannerModal";
import CapturePhotoModal from "./CapturePhotoModal";
import CaptureVideoModal from "./CaptureVideoModal";
import { Camera, Clock, CheckCircle, Video, QrCode } from "lucide-react";

const SupervisorView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const socket = useSocket();
  
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [timer, setTimer] = useState<{ assignmentId: number; startTime: number; elapsed: string } | null>(null);
  
  // Get supervisor assignments
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ["/api/assignments", { supervisorId: user?.id }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assignments?supervisorId=${user?.id}`);
      return await res.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    enabled: !!user,
  });
  
  // Get alarms for these assignments
  const { data: alarms = [], isLoading: isAlarmsLoading } = useQuery({
    queryKey: ["/api/alarms"],
    enabled: assignments.length > 0,
  });
  
  // Get reports for these assignments
  const { data: reports = [], isLoading: isReportsLoading } = useQuery({
    queryKey: ["/api/reports"],
    enabled: false, // We'll load reports individually
  });
  
  // Update assignment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: number; status: string }) => {
      return await apiRequest("PUT", `/api/assignments/${assignmentId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      toast({
        title: "Estado actualizado",
        description: "El estado de la asignación ha sido actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado. Inténtelo de nuevo.",
      });
    }
  });
  
  // Complete assignment mutation
  const completeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return await apiRequest("PUT", `/api/assignments/${assignmentId}/status`, { status: "completed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      // Stop timer if running
      if (timer) {
        setTimer(null);
      }
      
      toast({
        title: "Asignación completada",
        description: "La asignación ha sido marcada como completada.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar la asignación. Inténtelo de nuevo.",
      });
    }
  });
  
  // QR code verification mutation
  const verifyQRMutation = useMutation({
    mutationFn: async ({ assignmentId, qrCode }: { assignmentId: number; qrCode: string }) => {
      return await apiRequest("POST", `/api/assignments/${assignmentId}/verify-qr`, { qrCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      toast({
        title: "QR verificado",
        description: "Código QR verificado correctamente. Se ha registrado su llegada.",
      });
      
      // Start timer for response time
      if (selectedAssignment) {
        setTimer({
          assignmentId: selectedAssignment.id,
          startTime: Date.now(),
          elapsed: "00:00"
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error de verificación",
        description: "El código QR no corresponde a este cliente. Verifique que está en la ubicación correcta.",
      });
    }
  });
  
  // Listen for WebSocket messages
  useEffect(() => {
    if (!socket.isConnected || !user) return;
    
    // Listen for new assignments
    const assignmentSubscription = socket.addListener(
      MessageType.PATROL_ASSIGNMENT,
      (data) => {
        if (data.supervisorId === user.id) {
          // Play sound to notify of new assignment
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Error playing sound', e));
          
          queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
          
          toast({
            title: "Nueva asignación",
            description: `Se le ha asignado una nueva alarma para atender.`,
          });
        }
      }
    );
    
    return () => {
      assignmentSubscription();
    };
  }, [socket.isConnected, user, queryClient, toast]);
  
  // Handle timer for response time
  useEffect(() => {
    if (!timer) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
      const seconds = (elapsed % 60).toString().padStart(2, "0");
      
      setTimer(prev => {
        if (!prev) return null;
        return { ...prev, elapsed: `${minutes}:${seconds}` };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer]);
  
  // Get alarm details for an assignment
  const getAlarmForAssignment = (assignmentId: number) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return null;
    
    return alarms.find(a => a.id === assignment.alarmId);
  };
  
  // Handle accepting an assignment
  const handleAcceptAssignment = (assignmentId: number) => {
    setSelectedAssignment(assignments.find(a => a.id === assignmentId));
    updateStatusMutation.mutate({ assignmentId, status: "accepted" });
    
    // Notify via WebSocket
    if (socket.isConnected && user) {
      socket.sendMessage(MessageType.PATROL_STATUS_UPDATE, {
        assignmentId,
        status: "accepted",
        supervisorId: user.id
      });
    }
  };
  
  // Handle arriving at location
  const handleArrived = (assignmentId: number) => {
    setSelectedAssignment(assignments.find(a => a.id === assignmentId));
    setIsQRScannerOpen(true);
  };
  
  // Handle QR code scan result
  const handleQRScanResult = (qrCode: string) => {
    if (!selectedAssignment) return;
    
    verifyQRMutation.mutate({ 
      assignmentId: selectedAssignment.id, 
      qrCode 
    });
    
    setIsQRScannerOpen(false);
  };
  
  // Handle completing an assignment
  const handleCompleteAssignment = (assignmentId: number) => {
    completeAssignmentMutation.mutate(assignmentId);
    
    // Notify via WebSocket
    if (socket.isConnected && user) {
      socket.sendMessage(MessageType.PATROL_STATUS_UPDATE, {
        assignmentId,
        status: "completed",
        supervisorId: user.id
      });
    }
  };
  
  // Handle taking a photo
  const handleTakePhoto = (assignmentId: number) => {
    setSelectedAssignment(assignments.find(a => a.id === assignmentId));
    setIsPhotoModalOpen(true);
  };
  
  // Handle recording video
  const handleRecordVideo = (assignmentId: number) => {
    setSelectedAssignment(assignments.find(a => a.id === assignmentId));
    setIsVideoModalOpen(true);
  };
  
  const getAssignmentActionButtons = (assignment: any) => {
    switch (assignment.status) {
      case "assigned":
        return (
          <Button onClick={() => handleAcceptAssignment(assignment.id)}>
            Aceptar Asignación
          </Button>
        );
      
      case "accepted":
        return (
          <Button onClick={() => handleArrived(assignment.id)}>
            Verificar Llegada (QR)
          </Button>
        );
      
      case "arrived":
        return (
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleTakePhoto(assignment.id)}>
                <Camera className="h-4 w-4 mr-2" />
                Foto
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleRecordVideo(assignment.id)}>
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
            </div>
            <Button onClick={() => handleCompleteAssignment(assignment.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Completar
            </Button>
          </div>
        );
      
      case "completed":
        return (
          <span className="text-success font-medium">Completado</span>
        );
      
      default:
        return null;
    }
  };
  
  const isLoading = isAssignmentsLoading || isAlarmsLoading || isReportsLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral mb-2">Supervisor Motorizado</h1>
        <p className="text-gray-600">Gestión de asignaciones y verificación en sitio</p>
      </div>
      
      <Tabs defaultValue="active" className="mb-6">
        <TabsList>
          <TabsTrigger value="active">Asignaciones Activas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="shifts">Mis Turnos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Asignaciones Pendientes</CardTitle>
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
                      <TableHead>Estado</TableHead>
                      <TableHead>Tiempo</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.filter(a => a.status !== "completed").length > 0 ? (
                      assignments
                        .filter(a => a.status !== "completed")
                        .map((assignment) => {
                          const alarm = getAlarmForAssignment(assignment.id);
                          const client = alarm?.client;
                          
                          return (
                            <TableRow key={assignment.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">#{assignment.id}</TableCell>
                              <TableCell>
                                {client?.businessName || "Cliente desconocido"}
                                <div className="text-xs text-gray-500">Alarma #{assignment.alarmId}</div>
                              </TableCell>
                              <TableCell>{client?.address || "Dirección desconocida"}</TableCell>
                              <TableCell>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  assignment.status === 'assigned' ? 'bg-amber-100 text-amber-600' :
                                  assignment.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                                  assignment.status === 'arrived' ? 'bg-green-100 text-success' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {assignment.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {assignment.assignedAt ? 
                                  format(new Date(assignment.assignedAt), 'HH:mm') : 'N/A'}
                                {timer && timer.assignmentId === assignment.id && (
                                  <div className="flex items-center text-sm text-primary-700 mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {timer.elapsed}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {getAssignmentActionButtons(assignment)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No tiene asignaciones pendientes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Recently Completed Assignments */}
          <Card className="mt-6">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Completadas Recientemente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Spinner size="md" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Completada</TableHead>
                      <TableHead>Tiempo de Respuesta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.filter(a => a.status === "completed").length > 0 ? (
                      assignments
                        .filter(a => a.status === "completed")
                        .slice(0, 5)
                        .map((assignment) => {
                          const alarm = getAlarmForAssignment(assignment.id);
                          const client = alarm?.client;
                          
                          // Calculate response time
                          const responseTime = assignment.arrivedAt && assignment.acceptedAt
                            ? formatResponseTime(new Date(assignment.acceptedAt), new Date(assignment.arrivedAt))
                            : "N/A";
                          
                          return (
                            <TableRow key={assignment.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">#{assignment.id}</TableCell>
                              <TableCell>
                                {client?.businessName || "Cliente desconocido"}
                              </TableCell>
                              <TableCell>
                                {assignment.completedAt ? 
                                  format(new Date(assignment.completedAt), 'dd/MM HH:mm') : 'N/A'}
                              </TableCell>
                              <TableCell>{responseTime}</TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No hay asignaciones completadas recientemente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Historial de Asignaciones</h3>
            <p className="text-gray-600">
              Consulte su historial completo de asignaciones y reportes.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="shifts">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Mis Turnos</h3>
            <p className="text-gray-600">
              Visualización de turnos asignados.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScanResult}
      />
      
      {/* Capture Photo Modal */}
      <CapturePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        assignment={selectedAssignment}
      />
      
      {/* Capture Video Modal */}
      <CaptureVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        assignment={selectedAssignment}
      />
    </div>
  );
};

// Helper function to format response time
function formatResponseTime(startDate: Date, endDate: Date): string {
  const diffInMs = endDate.getTime() - startDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInSeconds = Math.floor((diffInMs % (1000 * 60)) / 1000);
  
  return `${diffInMinutes} min ${diffInSeconds} seg`;
}

export default SupervisorView;
