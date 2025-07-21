import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, MapPin, Clock, Camera, FileText, QrCode, LogOut,
  ChevronRight, AlertTriangle, User
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import NotificationPanel from '@/components/notification/NotificationPanel';
import ModernTimeDisplay from '@/components/supervisor/ModernTimeDisplay';

// Datos de ejemplo para asignaciones
const mockAssignments = [
  {
    id: 1,
    alarmId: 1001,
    clientName: 'Banco Nacional',
    address: 'Av. Principal 123, Zona Norte',
    alarmType: 'Intrusión',
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    priority: 'high',
    clientId: 'C12345'
  },
  {
    id: 2,
    alarmId: 1002,
    clientName: 'Supermercado Central',
    address: 'Calle Comercio 456, Zona Este',
    alarmType: 'Fuego',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    priority: 'critical',
    clientId: 'C23456'
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
    priority: 'medium',
    clientId: 'C34567'
  }
];

export default function SupervisorPanel() {
  const [, setLocation] = useLocation();
  const { unreadCount, addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState("pendientes");
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Añadir algunas notificaciones de ejemplo al cargar el componente
  useEffect(() => {
    // Solo añadir notificaciones si no hay ninguna
    if (unreadCount === 0) {
      // Simular una alarma nueva
      addNotification({
        title: "Nueva alarma activada",
        message: "Se ha activado una alarma en el cliente Residencial Las Palmas",
        type: "alarm",
        entityId: 1002
      });
      
      // Simular un cambio de turno
      setTimeout(() => {
        addNotification({
          title: "Cambio en tu horario",
          message: "Se ha actualizado tu turno para mañana de 7:00 AM a 4:00 PM",
          type: "shift",
          entityId: 505
        });
      }, 1500);
    }
  }, []);

  // Obtener asignaciones del API
  const { data: assignments = mockAssignments, isLoading } = useQuery({
    queryKey: ['/api/supervisor/assignments'],
    retry: false,
  });

  // Formatear tiempo transcurrido
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

  // Determinar el estado del tiempo según los minutos transcurridos
  const getTimeStatus = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 20) {
      return { 
        color: 'green', 
        label: 'Normal',
        bgClass: 'bg-green-100 border-green-300',
        textClass: 'text-green-600',
        pulse: false 
      };
    } else if (diffMins < 30) {
      return { 
        color: 'amber', 
        label: 'Atención',
        bgClass: 'bg-amber-100 border-amber-300',
        textClass: 'text-amber-600 font-medium',
        pulse: false 
      };
    } else {
      return { 
        color: 'red', 
        label: 'Crítico',
        bgClass: 'bg-red-100 border-red-300',
        textClass: 'text-red-600 font-semibold',
        pulse: true 
      };
    }
  };

  // Función para obtener la insignia de prioridad
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Baja</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Media</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Alta</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-bold">Crítica</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  // Función para obtener la insignia de estado
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-amber-500">Pendiente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">En Progreso</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completada</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  // Componente moderno de recuadro de tiempo
  const TimeBox = ({ timestamp }: { timestamp: string }) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    return (
      <ModernTimeDisplay 
        minutes={diffMins}
        label="Tiempo transcurrido"
        variant="fancy" // Usando el estilo con gradiente
        size="md"
      />
    );
  };

  // Filtrar asignaciones por estado
  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress');
  const completedAssignments = assignments.filter(a => a.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Cargando asignaciones...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Panel de notificaciones */}
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
      
      {/* Header/navbar */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <User className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-bold">Panel de Supervisor</h1>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.location.href = '/logout'}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <Tabs defaultValue="pendientes" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 p-1 bg-gray-100 rounded-lg">
            <TabsTrigger 
              value="pendientes" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
            >
              Pendientes {pendingAssignments.length > 0 && (
                <span className="ml-1 bg-white text-amber-600 text-xs rounded-full px-2 py-0.5">{pendingAssignments.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="enProgreso" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
            >
              En Progreso {inProgressAssignments.length > 0 && (
                <span className="ml-1 bg-white text-blue-600 text-xs rounded-full px-2 py-0.5">{inProgressAssignments.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="completadas" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
            >
              Completadas {completedAssignments.length > 0 && (
                <span className="ml-1 bg-white text-green-600 text-xs rounded-full px-2 py-0.5">{completedAssignments.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="pendientes"
            className="data-[state=active]:animate-fadeIn data-[state=inactive]:animate-fadeOut"
          >
            {pendingAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">No hay asignaciones pendientes</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 animate-slideInUp">
                {pendingAssignments.map(assignment => (
                  <Card 
                    key={assignment.id} 
                    className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold text-gray-800">
                          {assignment.clientName}
                        </CardTitle>
                        <div className="flex gap-1">
                          {getPriorityBadge(assignment.priority)}
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0 text-amber-500" />
                        {assignment.address}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {/* Tiempo resaltado */}
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground mb-1">Tiempo Transcurrido</p>
                          <TimeBox timestamp={assignment.createdAt} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                          <p className="font-medium">{assignment.alarmType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ID Cliente</p>
                          <p className="font-medium">{assignment.clientId}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button 
                          className="gap-1" 
                          onClick={() => setLocation(`/mobile/assignment/${assignment.id}`)}
                        >
                          Atender <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent 
            value="enProgreso"
            className="data-[state=active]:animate-fadeIn data-[state=inactive]:animate-fadeOut"
          >
            {inProgressAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">No hay asignaciones en progreso</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 animate-slideInUp">
                {inProgressAssignments.map(assignment => (
                  <Card 
                    key={assignment.id} 
                    className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold text-gray-800">
                          {assignment.clientName}
                        </CardTitle>
                        <div className="flex gap-1">
                          {getPriorityBadge(assignment.priority)}
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0 text-blue-500" />
                        {assignment.address}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {/* Tiempo resaltado */}
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground mb-1">Tiempo Transcurrido</p>
                          <TimeBox timestamp={assignment.createdAt} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                          <p className="font-medium">{assignment.alarmType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ID Cliente</p>
                          <p className="font-medium">{assignment.clientId}</p>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-1" 
                          onClick={() => setLocation(`/mobile/evidence/${assignment.id}`)}
                        >
                          <Camera className="h-4 w-4" /> Evidencia
                        </Button>
                        <a 
                          href="/qr-scanner.html"
                          target="_self" 
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-1"
                        >
                          <QrCode className="h-4 w-4" /> Escanear QR
                        </a>
                        <Button 
                          className="flex-1 gap-1" 
                          onClick={() => setLocation(`/mobile/assignment/${assignment.id}`)}
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

          <TabsContent 
            value="completadas"
            className="data-[state=active]:animate-fadeIn data-[state=inactive]:animate-fadeOut"
          >
            {completedAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">No hay asignaciones completadas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 animate-slideInUp">
                {completedAssignments.map(assignment => (
                  <Card 
                    key={assignment.id} 
                    className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold text-gray-800">
                          {assignment.clientName}
                        </CardTitle>
                        <div className="flex gap-1">
                          {getPriorityBadge(assignment.priority)}
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0 text-green-500" />
                        {assignment.address}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                          <p className="font-medium">{assignment.alarmType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ID Cliente</p>
                          <p className="font-medium">{assignment.clientId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tiempo Total</p>
                          <p className="font-medium text-green-600">
                            {formatTimeDifference(assignment.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Completado</p>
                          <p className="font-medium">
                            {assignment.completedAt ? new Date(assignment.completedAt).toLocaleTimeString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-center mt-2">
                        <a 
                          href={`/report-tabs.html?id=${assignment.id}`} 
                          target="_self" 
                          className="w-full"
                        >
                          <Button 
                            variant="outline" 
                            className="w-full gap-1"
                          >
                            <FileText className="h-4 w-4" /> Ver Reporte
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer navigation */}
      <footer className="sticky bottom-0 bg-background border-t p-2 pb-8">
        <div className="flex justify-around">
          <Button variant="ghost" className="flex flex-col items-center h-auto py-1 relative" onClick={() => setShowNotifications(true)}>
            <Bell className="h-5 w-5 mb-1" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                {unreadCount}
              </span>
            )}
            <span className="text-xs">Alertas</span>
          </Button>
          <a href="/map.html" target="_self">
            <Button variant="ghost" className="flex flex-col items-center h-auto py-1">
              <MapPin className="h-5 w-5 mb-1" />
              <span className="text-xs">Mapa</span>
            </Button>
          </a>
          <a href="/qr-scanner.html" target="_self" className="flex flex-col items-center h-auto py-1 px-3 text-gray-500 hover:text-gray-900">
            <QrCode className="h-5 w-5 mb-1" />
            <span className="text-xs">Escanear</span>
          </a>
          <Button variant="ghost" className="flex flex-col items-center h-auto py-1" onClick={() => setLocation('/mobile/profile')}>
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Perfil</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}