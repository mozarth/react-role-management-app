import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MapPin, Clock, Camera, FileText, QrCode, LogOut, AlertTriangle } from 'lucide-react';
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
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    priority: 'medium'
  }
];

export default function MobileTimeBoxDemo() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("pending");

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

  const pendingAssignments = mockAssignments.filter(a => a.status === 'pending');
  const inProgressAssignments = mockAssignments.filter(a => a.status === 'in_progress');
  const completedAssignments = mockAssignments.filter(a => a.status === 'completed');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/navbar */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Demo de TimeBox</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => alert('Notificaciones')}>
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setLocation('/mobile/login')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="inProgress" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              En Progreso
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Completadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center">No hay asignaciones pendientes</p>
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
                          <TimeBox dateString={assignment.createdAt} />
                        </div>
                      </div>
                      <div className="flex justify-between gap-2 mt-4">
                        <Button variant="outline" className="flex-1 gap-1" onClick={() => alert('Ver en mapa')}>
                          <MapPin className="h-4 w-4" /> Mapa
                        </Button>
                        <Button className="flex-1 gap-1" onClick={() => alert('Atender')}>
                          Atender
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
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center">No hay asignaciones en progreso</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {inProgressAssignments.map(assignment => (
                  <Card key={assignment.id} className="overflow-hidden border-l-4 border-l-blue-500">
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
                          <TimeBox dateString={assignment.createdAt} />
                        </div>
                      </div>
                      <div className="flex justify-between gap-2 mt-4">
                        <Button variant="outline" className="flex-1 gap-1" onClick={() => alert('Evidencia')}>
                          <Camera className="h-4 w-4" /> Evidencia
                        </Button>
                        <Button variant="outline" className="flex-1 gap-1" onClick={() => alert('QR')}>
                          <QrCode className="h-4 w-4" /> Escanear QR
                        </Button>
                        <Button className="flex-1 gap-1" onClick={() => alert('Completar')}>
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
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center">No hay asignaciones completadas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedAssignments.map(assignment => (
                  <Card key={assignment.id} className="overflow-hidden border-l-4 border-l-green-500">
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
                          <TimeBox dateString={assignment.createdAt} />
                        </div>
                      </div>
                      <div className="flex justify-between gap-2 mt-4">
                        <Button variant="outline" className="flex-1 gap-1" onClick={() => alert('Ver Reporte')}>
                          <FileText className="h-4 w-4" /> Ver Reporte
                        </Button>
                        <Button variant="secondary" className="flex-1 gap-1" onClick={() => alert('Ver Ruta')}>
                          <MapPin className="h-4 w-4" /> Ver Ruta
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
      <nav className="sticky bottom-0 bg-background border-t pt-2 pb-6">
        <div className="grid grid-cols-4 gap-1 px-2">
          <Button variant="ghost" className="flex flex-col items-center h-auto py-2" onClick={() => {}}>
            <MapPin className="h-4 w-4 mb-1" />
            <span className="text-xs">Mapa</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center h-auto py-2" onClick={() => {}}>
            <Camera className="h-4 w-4 mb-1" />
            <span className="text-xs">Evidencia</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center h-auto py-2" onClick={() => {}}>
            <FileText className="h-4 w-4 mb-1" />
            <span className="text-xs">Reportes</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center h-auto py-2" onClick={() => {}}>
            <Bell className="h-4 w-4 mb-1" />
            <span className="text-xs">Notificaciones</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}