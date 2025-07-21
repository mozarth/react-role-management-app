import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, MapPin, Clock, Camera, FileText, QrCode, LogOut, AlertTriangle } from 'lucide-react';
import { TimeDisplay } from '@/components/supervisor/TimeDisplay';
import { MapRoute } from '@/components/supervisor/MapRoute';
import { TimeBox } from '@/components/supervisor/TimeBox';

// Datos de ejemplo para demostraciones
const mockAssignments = [
  {
    id: 1,
    alarmId: 1001,
    clientName: 'Banco Nacional',
    address: 'Av. Principal 123, Zona Norte',
    alarmType: 'Intrusión',
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    priority: 'high'
  },
  {
    id: 2,
    alarmId: 1002,
    clientName: 'Supermercado Central',
    address: 'Calle Comercio 456, Zona Este',
    alarmType: 'Fuego',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    priority: 'critical'
  },
  {
    id: 3,
    alarmId: 1003,
    clientName: 'Residencial Las Palmas',
    address: 'Urbanización Las Palmas, Casa 78',
    alarmType: 'Pánico',
    status: 'completed',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    priority: 'medium'
  }
];

export default function MobileDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  // Consulta para obtener asignaciones
  const { data: assignments = mockAssignments, isLoading } = useQuery({
    queryKey: ['/api/supervisor/assignments'],
    // En producción, esto obtendría datos reales del servidor
    // queryFn: () => fetch('/api/supervisor/assignments').then(res => res.json()),
    enabled: true
  });

  // Comentados para evitar notificaciones automáticas constantes
  /*
  useEffect(() => {
    setTimeout(() => {
      addNotification({
        title: 'Bienvenido',
        message: 'Tienes 2 asignaciones pendientes de atención',
        type: 'info',
        duration: 5000
      });
    }, 1000);
  }, [addNotification]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      addNotification({
        title: 'Nueva Asignación',
        message: 'Alarma de Intrusión - Centro Comercial Plaza',
        type: 'alarm',
        duration: 10000
      });
      setUnreadNotifications(prev => prev + 1);
    }, 15000);
    
    return () => clearTimeout(timeout);
  }, [addNotification]);
  */

  const handleLogout = () => {
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente'
    });
    navigate('/mobile/login');
  };

  const handleAcceptAssignment = (assignmentId: number) => {
    toast({
      title: 'Asignación aceptada',
      description: 'Has aceptado la asignación #' + assignmentId
    });
    
    // Aquí iría el código para actualizar el estado en el backend
  };

  const handleCompleteAssignment = (assignmentId: number) => {
    toast({
      title: 'Asignación completada',
      description: 'Has marcado como completada la asignación #' + assignmentId
    });
    
    // Aquí iría el código para actualizar el estado en el backend
  };

  const handleCaptureEvidence = (assignmentId: number) => {
    toast({
      title: 'Captura de evidencia',
      description: 'Funcionalidad de captura de evidencia para asignación #' + assignmentId
    });
    
    // Aquí iría la navegación a la pantalla de captura
    navigate(`/mobile/evidence/${assignmentId}`);
  };

  const handleScanQR = (assignmentId: number) => {
    toast({
      title: 'Escaneo de QR',
      description: 'Funcionalidad de escaneo de QR para asignación #' + assignmentId
    });
    
    // Aquí iría la navegación a la pantalla de escaneo QR
    navigate(`/mobile/scan-qr/${assignmentId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      pending: { variant: 'destructive', label: 'Pendiente' },
      in_progress: { variant: 'secondary', label: 'En Progreso' },
      completed: { variant: 'default', label: 'Completada' },
    };
    
    const statusConfig = statusMap[status] || { variant: 'outline', label: status };
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      low: { variant: 'outline', label: 'Baja' },
      medium: { variant: 'secondary', label: 'Media' },
      high: { variant: 'default', label: 'Alta' },
      critical: { variant: 'destructive', label: 'Crítica' },
    };
    
    const priorityConfig = priorityMap[priority] || { variant: 'outline', label: priority };
    return (
      <Badge variant={priorityConfig.variant}>
        {priorityConfig.label}
      </Badge>
    );
  };

  const formatTimeDifference = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getTimeClassName = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 20) {
      return "text-green-600 font-medium";
    } else if (diffMins < 30) {
      return "text-amber-600 font-semibold";
    } else {
      return "text-red-600 font-bold";
    }
  };
  
  // Obtener el componente completo del tiempo transcurrido con recuadro
  const getTimeElement = (dateString: string) => {
    // Usamos directamente el componente TimeDisplay en su versión compacta
    return <TimeDisplay timestamp={dateString} compact={true} />;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Cargando asignaciones...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress');
  const completedAssignments = assignments.filter(a => a.status === 'completed');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/navbar */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground py-3 px-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Panel de Supervisor</h1>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative" 
              onClick={() => navigate('/mobile/notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        {pendingAssignments.length > 0 && (
          <Alert className="mb-4 border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Atención requerida</AlertTitle>
            <AlertDescription>
              Tienes {pendingAssignments.length} alarma{pendingAssignments.length !== 1 ? 's' : ''} pendiente{pendingAssignments.length !== 1 ? 's' : ''} de atención.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pending" className="mb-6">
          <TabsList className="grid grid-cols-3 mb-4 w-full">
            <TabsTrigger value="pending" className="relative">
              Pendientes
              {pendingAssignments.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {pendingAssignments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="inProgress">En Progreso</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            {pendingAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No hay asignaciones pendientes</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingAssignments.map(assignment => (
                  <Card key={assignment.id} className="overflow-hidden border-l-4 border-l-destructive">
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {assignment.clientName}
                        </CardTitle>
                        <div className="flex gap-1">
                          {getPriorityBadge(assignment.priority)}
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        {assignment.address}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                          <p className="font-medium">{assignment.alarmType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tiempo Transcurrido</p>
                          <p className={`font-medium ${getTimeClassName(assignment.createdAt)}`}>
                            {formatTimeDifference(assignment.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          className="flex-1" 
                          onClick={() => handleAcceptAssignment(assignment.id)}
                        >
                          Aceptar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="inProgress">
            {inProgressAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">No hay asignaciones en progreso</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {inProgressAssignments.map(assignment => (
                  <Card key={assignment.id} className="overflow-hidden border-l-4 border-l-secondary">
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {assignment.clientName}
                        </CardTitle>
                        <div className="flex gap-1">
                          {getPriorityBadge(assignment.priority)}
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        {assignment.address}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                          <p className="font-medium">{assignment.alarmType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tiempo Transcurrido</p>
                          <p className={`font-medium ${getTimeClassName(assignment.createdAt)}`}>
                            {formatTimeDifference(assignment.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => handleCaptureEvidence(assignment.id)}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Evidencia
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleScanQR(assignment.id)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Escanear QR
                        </Button>
                        <Button 
                          className="col-span-2 mt-2" 
                          onClick={() => handleCompleteAssignment(assignment.id)}
                        >
                          Completar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {completedAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">No hay asignaciones completadas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedAssignments.map(assignment => (
                  <Card key={assignment.id} className="opacity-80">
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {assignment.clientName}
                        </CardTitle>
                        <div className="flex gap-1">
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        {assignment.address}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                          <p className="font-medium">{assignment.alarmType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Completada hace</p>
                          <p className="font-medium">
                            {assignment.completedAt && formatTimeDifference(assignment.completedAt)}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => navigate(`/mobile/report/${assignment.id}`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Reporte
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}