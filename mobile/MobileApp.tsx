import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Spinner } from "@/components/ui/spinner";
import { useSocket } from "@/hooks/useSocket";
import { MessageType } from "@/lib/constants";
import {
  Camera,
  Video,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  LogOut,
  User,
  Menu,
  Bell,
  Info,
  QrCode,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const MobileApp: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [timer, setTimer] = useState<{ startTime: number; elapsed: string } | null>(null);
  
  // Fetch supervisor assignments
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
  
  // Find active assignment
  useEffect(() => {
    const active = assignments.find(a => 
      a.status === 'assigned' || 
      a.status === 'accepted' || 
      a.status === 'arrived'
    );
    
    if (active) {
      setActiveAssignment(active);
      
      // Start timer if arrived
      if (active.status === 'arrived' && active.arrivedAt) {
        const startTime = new Date(active.arrivedAt).getTime();
        setTimer({
          startTime,
          elapsed: "00:00"
        });
      } else {
        setTimer(null);
      }
    } else {
      setActiveAssignment(null);
      setTimer(null);
    }
  }, [assignments]);
  
  // Handle timer
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
  
  // Update assignment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: number; status: string }) => {
      return await apiRequest("PUT", `/api/assignments/${assignmentId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
    },
    onError: (error) => {
      console.error("Error updating assignment status:", error);
    }
  });
  
  // Handle accepting an assignment
  const handleAcceptAssignment = (assignmentId: number) => {
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
  
  // Handle arriving at location (simulated QR scan)
  const handleSimulateQRScan = (assignmentId: number) => {
    // In a real app, this would open the camera to scan a QR code
    // Here we'll just simulate a successful scan
    
    // Find the assignment and related alarm
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;
    
    const alarm = alarms.find(a => a.id === assignment.alarmId);
    if (!alarm || !alarm.client) return;
    
    // Simulate QR code from client
    const simulatedQrCode = `CLIENT_${alarm.clientId}`;
    
    // Call the API to verify QR
    verifyQRMutation.mutate({ assignmentId, qrCode: simulatedQrCode });
  };
  
  // QR code verification mutation
  const verifyQRMutation = useMutation({
    mutationFn: async ({ assignmentId, qrCode }: { assignmentId: number; qrCode: string }) => {
      return await apiRequest("POST", `/api/assignments/${assignmentId}/verify-qr`, { qrCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      // Start timer for response time
      if (activeAssignment) {
        setTimer({
          startTime: Date.now(),
          elapsed: "00:00"
        });
      }
    },
    onError: (error) => {
      console.error("Error verifying QR code:", error);
    }
  });
  
  // Complete assignment mutation
  const completeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return await apiRequest("PUT", `/api/assignments/${assignmentId}/status`, { status: "completed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      setTimer(null);
    },
    onError: (error) => {
      console.error("Error completing assignment:", error);
    }
  });
  
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
  
  // Handle photo and video capture (simulated)
  const handleSimulateCapture = (type: 'photo' | 'video') => {
    alert(`Capturing ${type}... (simulated in this demo)`);
    // In a real app, this would open the camera/video recording interface
  };
  
  // Get alarm details for assignment
  const getAlarmForAssignment = (assignmentId: number) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return null;
    
    return alarms.find(a => a.id === assignment.alarmId);
  };
  
  // Format assignment time
  const formatAssignmentTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'HH:mm:ss');
  };
  
  // Loading state
  const isLoading = isAssignmentsLoading || isAlarmsLoading;
  
  // Get active alarm
  const activeAlarm = activeAssignment 
    ? getAlarmForAssignment(activeAssignment.id)
    : null;
  
  // Get history assignments (completed)
  const historyAssignments = assignments.filter(a => a.status === 'completed');

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Mobile App Header */}
      <header className="bg-primary-800 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white mr-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">SeguriPatrol App</h1>
              <p className="text-xs opacity-80">Supervisor Motorizado</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="h-6 w-6" />
          </div>
        </div>
      </header>
      
      {/* Side Menu (shown when isMenuOpen is true) */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="w-64 h-full bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-800 rounded-full flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-600">Supervisor Motorizado</p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                    <Home className="h-5 w-5 mr-2" />
                    Inicio
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                    <Info className="h-5 w-5 mr-2" />
                    Información
                  </Button>
                </li>
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
          
          <div 
            className="flex-1" 
            onClick={() => setIsMenuOpen(false)}
          ></div>
        </div>
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
          </div>
        ) : (
          <Tabs defaultValue="active" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Asignación Activa</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="h-full">
              {activeAssignment ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="bg-blue-50 pb-2">
                      <CardTitle className="text-lg">
                        Asignación #{activeAssignment.id}
                      </CardTitle>
                      <CardDescription>
                        Estado: <span className="font-medium capitalize">{activeAssignment.status}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {activeAlarm && activeAlarm.client && (
                        <>
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold mb-1">Cliente:</h3>
                            <p className="text-sm">{activeAlarm.client.businessName}</p>
                          </div>
                          
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold mb-1">Dirección:</h3>
                            <p className="text-sm">{activeAlarm.client.address}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div>
                              <h3 className="text-sm font-semibold mb-1">Tipo de Alarma:</h3>
                              <p className="text-sm capitalize">{activeAlarm.type}</p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-semibold mb-1">Hora de Alarma:</h3>
                              <p className="text-sm">{formatAssignmentTime(activeAlarm.createdAt)}</p>
                            </div>
                          </div>
                          
                          {timer && (
                            <div className="bg-blue-50 p-3 rounded-md flex items-center mb-4">
                              <Clock className="h-5 w-5 text-blue-500 mr-2" />
                              <div>
                                <p className="text-sm font-medium">Tiempo en sitio:</p>
                                <p className="text-lg font-bold">{timer.elapsed}</p>
                              </div>
                            </div>
                          )}
                          
                          {activeAlarm.description && (
                            <div className="mb-4">
                              <h3 className="text-sm font-semibold mb-1">Descripción:</h3>
                              <p className="text-sm">{activeAlarm.description}</p>
                            </div>
                          )}
                          
                          <div className="flex justify-center mb-2">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeAlarm.client.address)}`, '_blank')}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Ver en Google Maps
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                    <CardFooter className={`${
                      activeAssignment.status === 'arrived' ? 'grid grid-cols-2 gap-2' : 'flex'
                    }`}>
                      {activeAssignment.status === 'assigned' && (
                        <Button 
                          className="w-full"
                          onClick={() => handleAcceptAssignment(activeAssignment.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          {updateStatusMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                          Aceptar Asignación
                        </Button>
                      )}
                      
                      {activeAssignment.status === 'accepted' && (
                        <Button 
                          className="w-full"
                          onClick={() => handleSimulateQRScan(activeAssignment.id)}
                          disabled={verifyQRMutation.isPending}
                        >
                          {verifyQRMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                          <QrCode className="h-4 w-4 mr-2" />
                          Escanear QR
                        </Button>
                      )}
                      
                      {activeAssignment.status === 'arrived' && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => handleSimulateCapture('photo')}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Foto
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => handleSimulateCapture('video')}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Video
                          </Button>
                          
                          <Button 
                            className="w-full col-span-2 mt-2"
                            onClick={() => handleCompleteAssignment(activeAssignment.id)}
                            disabled={completeAssignmentMutation.isPending}
                          >
                            {completeAssignmentMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completar
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <div className="bg-blue-100 p-4 rounded-full mb-4">
                    <Info className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral mb-2">Sin Asignaciones Activas</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Actualmente no tiene asignaciones pendientes. Las nuevas asignaciones aparecerán aquí.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history">
              {historyAssignments.length > 0 ? (
                <div className="space-y-4">
                  {historyAssignments.map(assignment => {
                    const alarm = getAlarmForAssignment(assignment.id);
                    
                    return (
                      <Card key={assignment.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>Asignación #{assignment.id}</span>
                            <span className="text-sm font-normal px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              Completada
                            </span>
                          </CardTitle>
                          <CardDescription>
                            {alarm?.client?.businessName || "Cliente desconocido"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2 pb-2">
                          <div className="text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-500">Fecha:</span>
                              <span>{assignment.completedAt ? format(new Date(assignment.completedAt), 'dd/MM/yyyy') : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Hora:</span>
                              <span>{assignment.completedAt ? format(new Date(assignment.completedAt), 'HH:mm') : 'N/A'}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button variant="outline" size="sm" className="w-full">
                            Ver Detalles
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <AlertTriangle className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral mb-2">Sin Historial</h3>
                  <p className="text-gray-500 text-center">
                    No hay asignaciones completadas en su historial.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      {/* Mobile App Footer */}
      <footer className="bg-white p-2 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${socket.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {socket.isConnected ? "Conectado" : "Desconectado"}
          </div>
          <div className="text-xs text-gray-500">
            v1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MobileApp;
