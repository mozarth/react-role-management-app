import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { 
  Bell, MapPin, Clock, Camera, FileText, QrCode, LogOut, Home, ArrowRight
} from 'lucide-react';
import { ModernTimeDisplay } from '@/components/supervisor/ModernTimeDisplay';
import { MapRoute } from '@/components/supervisor/MapRoute';

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
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
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

export default function ModernSupervisorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState("pending");

  // Obtener asignaciones del API
  const { data: assignments = mockAssignments, isLoading } = useQuery({
    queryKey: ['/api/supervisor/assignments'],
    retry: false,
  });

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

  // Filtrar asignaciones por estado
  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress');
  const completedAssignments = assignments.filter(a => a.status === 'completed');

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header/navbar */}
      <header className="sticky top-0 z-10 bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white mr-3">
              <MapPin className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Panel de Supervisor
            </h1>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setLocation('/mobile/notifications')}
              className="relative bg-white border-slate-200 shadow-sm"
            >
              <Bell className="h-4 w-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setLocation('/mobile/login')} className="bg-white border-slate-200 shadow-sm">
              <LogOut className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6 bg-white shadow-md p-1 rounded-xl">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-lg"
            >
              Pendientes {pendingAssignments.length > 0 && `(${pendingAssignments.length})`}
            </TabsTrigger>
            <TabsTrigger 
              value="inProgress" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg"
            >
              En Progreso {inProgressAssignments.length > 0 && `(${inProgressAssignments.length})`}
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-lg"
            >
              Completadas {completedAssignments.length > 0 && `(${completedAssignments.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingAssignments.length === 0 ? (
              <Card className="bg-white shadow-md">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">No hay asignaciones pendientes</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingAssignments.map(assignment => (
                  <Card key={assignment.id} className="overflow-hidden border-0 shadow-md bg-white">
                    <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-500"></div>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold">
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
                      {/* Tiempo destacado */}
                      <div className="mb-5 mt-2">
                        <ModernTimeDisplay 
                          timestamp={assignment.createdAt}
                          size="md"
                        />
                      </div>
                      
                      <div className="rounded-md bg-slate-50 p-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-amber-100 p-2 rounded-md">
                            <Bell className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Tipo de Alarma</p>
                            <p className="text-base font-semibold">{assignment.alarmType}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between gap-2 mt-5">
                        <Button variant="outline" className="flex-1 gap-1 border-slate-200 bg-white" onClick={() => alert('Ver en mapa')}>
                          <MapPin className="h-4 w-4" /> Mapa
                        </Button>
                        <Button 
                          className="flex-1 gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                          onClick={() => setLocation(`/mobile/assignment/${assignment.id}`)}
                        >
                          Atender <ArrowRight className="h-4 w-4 ml-1" />
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
              <Card className="bg-white shadow-md">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">No hay asignaciones en progreso</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {inProgressAssignments.map(assignment => (
                  <Card key={assignment.id} className="overflow-hidden border-0 shadow-md bg-white">
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-500"></div>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold">
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
                      {/* Tiempo destacado */}
                      <div className="mb-5 mt-2">
                        <ModernTimeDisplay 
                          timestamp={assignment.createdAt}
                          size="md"
                        />
                      </div>
                      
                      <div className="rounded-md bg-slate-50 p-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 p-2 rounded-md">
                            <Bell className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Tipo de Alarma</p>
                            <p className="text-base font-semibold">{assignment.alarmType}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between gap-2 mt-5">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-1 border-slate-200 bg-white" 
                          onClick={() => setLocation(`/mobile/evidence/${assignment.id}`)}
                        >
                          <Camera className="h-4 w-4" /> Evidencia
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 gap-1 border-slate-200 bg-white" 
                          onClick={() => setLocation(`/mobile/scan-qr/${assignment.id}`)}
                        >
                          <QrCode className="h-4 w-4" /> Escanear QR
                        </Button>
                        <Button 
                          className="flex-1 gap-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" 
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

          <TabsContent value="completed">
            {completedAssignments.length === 0 ? (
              <Card className="bg-white shadow-md">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">No hay asignaciones completadas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedAssignments.map(assignment => (
                  <Card key={assignment.id} className="overflow-hidden border-0 shadow-md bg-white">
                    <div className="h-2 bg-gradient-to-r from-green-400 to-green-500"></div>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold">
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
                      {/* Tiempo destacado */}
                      <div className="mb-5 mt-2">
                        <ModernTimeDisplay 
                          timestamp={assignment.createdAt}
                          size="md"
                        />
                      </div>
                      
                      <div className="rounded-md bg-slate-50 p-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 p-2 rounded-md">
                            <Bell className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Tipo de Alarma</p>
                            <p className="text-base font-semibold">{assignment.alarmType}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Alert className="mb-4 py-3 bg-green-50 border-green-200 text-green-800">
                        <AlertDescription className="text-sm">
                          Asignación completada exitosamente.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex justify-between gap-2">
                        <Button 
                          className="w-full gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                          onClick={() => setLocation(`/mobile/report/${assignment.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" /> Ver Reporte Completo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Navbar inferior para la navegación principal */}
      <nav className="sticky bottom-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pt-2 pb-6">
        <div className="grid grid-cols-4 gap-1 px-2">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center h-auto py-2 text-blue-600" 
            onClick={() => {}}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Inicio</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center h-auto py-2" 
            onClick={() => setLocation('/mobile/assignment/map')}
          >
            <MapPin className="h-5 w-5 mb-1" />
            <span className="text-xs">Mapa</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center h-auto py-2" 
            onClick={() => setLocation('/mobile/report/list')}
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-xs">Reportes</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center h-auto py-2 relative"
            onClick={() => setLocation('/mobile/notifications')}
          >
            <Bell className="h-5 w-5 mb-1" />
            <span className="text-xs">Alertas</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-6 h-2.5 w-2.5 rounded-full bg-red-500"></span>
            )}
          </Button>
        </div>
      </nav>
    </div>
  );
}