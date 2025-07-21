import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, MapPin, Clock, Camera, FileText, QrCode, LogOut,
  ChevronRight, AlertTriangle, User, X
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import ModernTimeDisplay from '@/components/supervisor/ModernTimeDisplay';

// Panel de notificaciones simplificado para versión independiente
function SimpleNotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAsRead } = useNotifications();
  
  return (
    <Card className="w-full bg-black/60 backdrop-blur-md border border-blue-500/30 shadow-lg">
      <CardHeader className="pb-2 flex justify-between items-center">
        <CardTitle className="text-lg text-white">Notificaciones</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="p-3 border border-blue-500/20 rounded-md bg-blue-900/20 hover:bg-blue-900/30 cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between">
                  <h4 className="font-medium text-sm text-blue-200">{notification.title}</h4>
                  <span className="text-xs text-blue-300">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            <p>No hay notificaciones</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

export default function SupervisorStandaloneDashboard() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [, navigate] = useLocation();
  const { notifications, markAsRead } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Usar directamente los datos de ejemplo en lugar de hacer una consulta
  // Esto se podría cambiar para usar datos reales en producción
  const assignments = mockAssignments;
  const isLoading = false;

  const handleLogout = () => {
    fetch('/api/logout/mobile', {
      method: 'POST',
      credentials: 'include'
    }).then(() => {
      navigate('/mobile/login');
    });
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Fondo con gradiente y efectos visuales */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#001428] to-black z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
      </div>

      {/* Encabezado con título y notificaciones */}
      <header className="relative z-10 px-4 pt-4 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-white">
            Panel de Supervisor
          </h1>
          <p className="text-blue-400 text-sm">Control de asignaciones y patrullas</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="relative border border-blue-500/30 bg-blue-950/30 text-blue-300 hover:bg-blue-900/50 hover:text-blue-200"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            className="border border-blue-500/30 bg-blue-950/30 text-blue-300 hover:bg-blue-900/50 hover:text-blue-200"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Panel de notificaciones */}
      {notificationsOpen && (
        <div className="absolute top-16 right-4 z-20 w-80">
          <SimpleNotificationPanel
            onClose={() => setNotificationsOpen(false)}
          />
        </div>
      )}

      {/* Contenido principal */}
      <main className="relative z-10 px-4 py-6">
        <Card className="bg-black/40 border border-blue-500/20 shadow-lg backdrop-blur-sm mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-white flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-400" />
              Tiempo de respuesta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ModernTimeDisplay minutes={25} status="warning" variant="fancy" />
          </CardContent>
        </Card>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full bg-black/40 border border-blue-500/20 backdrop-blur-sm mb-4">
            <TabsTrigger value="pending" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200">
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex-1 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200">
              En Progreso
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-200">
              Completadas
            </TabsTrigger>
          </TabsList>

          {/* Asignaciones Pendientes */}
          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : assignments.filter(a => a.status === 'pending').length > 0 ? (
              assignments
                .filter(a => a.status === 'pending')
                .map(assignment => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment} 
                    status="pending" 
                  />
                ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No hay asignaciones pendientes
              </div>
            )}
          </TabsContent>

          {/* Asignaciones En Progreso */}
          <TabsContent value="progress" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : assignments.filter(a => a.status === 'in_progress').length > 0 ? (
              assignments
                .filter(a => a.status === 'in_progress')
                .map(assignment => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment} 
                    status="in_progress"
                  />
                ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No hay asignaciones en progreso
              </div>
            )}
          </TabsContent>

          {/* Asignaciones Completadas */}
          <TabsContent value="completed" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : assignments.filter(a => a.status === 'completed').length > 0 ? (
              assignments
                .filter(a => a.status === 'completed')
                .map(assignment => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment}
                    status="completed"
                  />
                ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No hay asignaciones completadas
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Botones de acción fijos en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 py-4 px-6 flex justify-around bg-gradient-to-t from-black via-black/90 to-transparent z-10">
        <Button 
          className="flex-1 mx-1 bg-blue-900/80 hover:bg-blue-800/80 text-white border border-blue-500/30"
          onClick={() => navigate('/mobile/scan')}
        >
          <QrCode className="mr-2 h-4 w-4" />
          Escanear QR
        </Button>
        
        <Button 
          className="flex-1 mx-1 bg-blue-900/80 hover:bg-blue-800/80 text-white border border-blue-500/30"
          onClick={() => navigate('/mobile/evidence/new')}
        >
          <Camera className="mr-2 h-4 w-4" />
          Evidencia
        </Button>
        
        <Button 
          className="flex-1 mx-1 bg-blue-900/80 hover:bg-blue-800/80 text-white border border-blue-500/30"
          onClick={() => navigate('/mobile/report')}
        >
          <FileText className="mr-2 h-4 w-4" />
          Informes
        </Button>
      </div>
    </div>
  );
}

// Componente de tarjeta de asignación
function AssignmentCard({ assignment, status }: { assignment: any, status: string }) {
  const [, navigate] = useLocation();
  
  // Color según estado y prioridad
  let cardBorderColor = "border-amber-500/30";
  let badgeColor = "";
  
  if (status === 'pending') {
    cardBorderColor = "border-amber-500/30";
    badgeColor = "bg-amber-500/20 text-amber-200 border-amber-500/30";
  } else if (status === 'in_progress') {
    cardBorderColor = "border-blue-500/30";
    badgeColor = "bg-blue-500/20 text-blue-200 border-blue-500/30";
  } else if (status === 'completed') {
    cardBorderColor = "border-green-500/30";
    badgeColor = "bg-green-500/20 text-green-200 border-green-500/30";
  }
  
  // Color adicional basado en prioridad
  if (assignment.priority === 'high') {
    badgeColor = "bg-orange-500/20 text-orange-200 border-orange-500/30";
  } else if (assignment.priority === 'critical') {
    badgeColor = "bg-red-500/20 text-red-200 border-red-500/30";
  }
  
  // Calcular tiempo transcurrido
  const createdAt = new Date(assignment.createdAt);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
  
  // Determinar color del tiempo según minutos transcurridos
  let timeColor = "text-green-400";
  if (diffMinutes > 30) {
    timeColor = "text-red-400";
  } else if (diffMinutes > 20) {
    timeColor = "text-orange-400";
  }
  
  return (
    <Card 
      className={`bg-black/40 ${cardBorderColor} shadow-lg backdrop-blur-sm hover:bg-black/60 transition-all`}
      onClick={() => navigate(`/mobile/assignment/${assignment.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-white">
            {assignment.clientName}
          </CardTitle>
          <Badge variant="outline" className={`${badgeColor} border`}>
            {assignment.alarmType}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center mb-2 text-gray-300 text-sm">
          <MapPin className="h-4 w-4 mr-1 text-blue-400 flex-shrink-0" />
          <span className="truncate">{assignment.address}</span>
        </div>
        
        <Separator className="my-2 bg-gray-700" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-blue-400" />
            <span className={`text-sm ${timeColor}`}>
              {diffMinutes < 60 
                ? `${diffMinutes} minutos` 
                : `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`}
            </span>
          </div>
          
          <div className="flex items-center">
            <Badge variant="outline" className="border-blue-500/30 bg-blue-900/20 text-blue-200">
              {assignment.clientId}
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          className="w-full border-blue-500/30 bg-blue-950/30 text-blue-300 hover:bg-blue-900/50 hover:text-blue-200"
        >
          Ver detalles
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}