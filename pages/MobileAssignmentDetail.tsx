import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, MapPin, Clock, Camera, FileText, QrCode, 
  ArrowLeft, CheckCircle, AlertTriangle, Phone, Navigation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { MessageType } from '@shared/websocket';
import { TimeBox } from '@/components/supervisor/TimeBox';

export default function MobileAssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addNotification, sendWebSocketMessage } = useNotifications();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptedTime, setAcceptedTime] = useState<string | null>(null);
  
  // Obtener detalles de la asignación
  const { data: assignment, isLoading, refetch } = useQuery({
    queryKey: [`/api/supervisor/assignments/${id}`],
    retry: false,
  });

  // Aceptar la asignación
  const acceptAssignment = async () => {
    setIsAccepting(true);
    
    try {
      // Llamar a la API para aceptar la asignación
      const response = await fetch(`/api/supervisor/assignments/${id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acceptedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al aceptar la asignación');
      }
      
      // Registrar el tiempo de aceptación
      const acceptTime = new Date().toISOString();
      setAcceptedTime(acceptTime);
      
      // Notificar a través de WebSocket
      sendWebSocketMessage({
        type: MessageType.PATROL_STATUS_UPDATE,
        payload: {
          assignmentId: Number(id),
          status: 'accepted',
          acceptedAt: acceptTime,
          supervisor: {
            id: 123, // Esto vendría del usuario autenticado
            name: "Supervisor" // Esto vendría del usuario autenticado
          }
        },
        timestamp: Date.now()
      });
      
      // Notificar al usuario
      toast({
        title: "Asignación aceptada",
        description: "Has aceptado la asignación. El cronómetro ha comenzado.",
        variant: "default",
      });
      
      // Actualizar datos
      refetch();
      
    } catch (error) {
      console.error('Error al aceptar asignación:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar la asignación. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Abrir navegación en Google Maps
  const openGoogleMaps = () => {
    if (assignment && assignment.latitude && assignment.longitude) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${assignment.latitude},${assignment.longitude}`;
      window.open(mapsUrl, '_blank');
    } else if (assignment && assignment.address) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(assignment.address)}`;
      window.open(mapsUrl, '_blank');
    } else {
      toast({
        title: "Error",
        description: "No hay información de ubicación disponible.",
        variant: "destructive",
      });
    }
  };

  // Llamar al cliente
  const callClient = () => {
    if (assignment && assignment.clientPhone) {
      window.location.href = `tel:${assignment.clientPhone}`;
    } else {
      toast({
        title: "Error",
        description: "No hay número de teléfono disponible.",
        variant: "destructive",
      });
    }
  };

  // Determinar si se puede escanear el QR (solo en estado aceptado y en progreso)
  const canScanQr = () => {
    return assignment && 
      (assignment.status === 'accepted' || assignment.status === 'in_progress') &&
      acceptedTime;
  };

  // Determinar si se puede recopilar evidencia (solo en estados avanzados)
  const canCollectEvidence = () => {
    return assignment && 
      (assignment.status === 'in_progress' || assignment.status === 'qr_verified');
  };

  // Formatear la prioridad
  const getPriorityLabel = (priority: string) => {
    switch(priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return 'Normal';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando información...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-medium mb-2">Error al cargar la información</p>
            <p className="text-muted-foreground text-center">No se pudo encontrar la asignación solicitada</p>
            <Button 
              className="mt-4" 
              onClick={() => setLocation('/mobile/dashboard')}
            >
              Volver al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determinar qué timer mostrar basado en el estado
  const getTimerDate = () => {
    // Si está aceptada, usar el tiempo de aceptación
    if (acceptedTime || assignment.acceptedAt) {
      return acceptedTime || assignment.acceptedAt;
    }
    // De lo contrario, usar el tiempo de creación
    return assignment.createdAt;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Cabecera */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/mobile/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold ml-2">Detalle de Asignación</h1>
          </div>
          <div className="flex items-center">
            <TimeBox dateString={getTimerDate()} />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-4">
        {/* Información del cliente */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{assignment.clientName}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  {assignment.address}
                </div>
              </div>
              <Badge 
                className={`
                  ${assignment.priority === 'low' ? 'bg-blue-500' : ''}
                  ${assignment.priority === 'medium' ? 'bg-amber-500' : ''}
                  ${assignment.priority === 'high' ? 'bg-orange-500' : ''}
                  ${assignment.priority === 'critical' ? 'bg-red-500' : ''}
                `}
              >
                {getPriorityLabel(assignment.priority)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Nº de Cuenta</p>
                <p className="font-medium">{assignment.clientCode || assignment.clientId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                <p className="font-medium">{assignment.alarmType}</p>
              </div>
            </div>
            
            {assignment.notes && (
              <Alert className="mt-3 mb-2">
                <AlertTitle>Notas adicionales</AlertTitle>
                <AlertDescription>
                  {assignment.notes}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between gap-2 mt-4">
              {assignment.clientPhone && (
                <Button 
                  variant="outline" 
                  className="flex-1 gap-1" 
                  onClick={callClient}
                >
                  <Phone className="h-4 w-4" /> Llamar
                </Button>
              )}
              <Button 
                variant="outline" 
                className="flex-1 gap-1" 
                onClick={openGoogleMaps}
              >
                <Navigation className="h-4 w-4" /> Navegación
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado actual */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estado de la Asignación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3
                  ${assignment.status === 'pending' ? 'bg-amber-100 text-amber-600 border border-amber-300' : 'bg-green-100 text-green-600 border border-green-300'}`}
                >
                  {assignment.status !== 'pending' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Asignación Recibida</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(assignment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3
                  ${!acceptedTime && assignment.status === 'pending' ? 'bg-muted text-muted-foreground border border-muted' : 
                    (assignment.status === 'accepted' || assignment.status === 'in_progress' || assignment.status === 'qr_verified' || assignment.status === 'completed' ? 
                    'bg-green-100 text-green-600 border border-green-300' : 
                    'bg-amber-100 text-amber-600 border border-amber-300')}`}
                >
                  {(acceptedTime || assignment.status === 'accepted' || assignment.status === 'in_progress' || assignment.status === 'qr_verified' || assignment.status === 'completed') ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${!acceptedTime && assignment.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                    Asignación Aceptada
                  </p>
                  {(acceptedTime || assignment.acceptedAt) && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(acceptedTime || assignment.acceptedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3
                  ${assignment.status === 'qr_verified' || assignment.status === 'completed' ? 
                    'bg-green-100 text-green-600 border border-green-300' : 
                    'bg-muted text-muted-foreground border border-muted'}`}
                >
                  {assignment.status === 'qr_verified' || assignment.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${assignment.status !== 'qr_verified' && assignment.status !== 'completed' ? 'text-muted-foreground' : ''}`}>
                    QR Verificado
                  </p>
                  {assignment.qrVerifiedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(assignment.qrVerifiedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3
                  ${assignment.status === 'completed' ? 
                    'bg-green-100 text-green-600 border border-green-300' : 
                    'bg-muted text-muted-foreground border border-muted'}`}
                >
                  {assignment.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${assignment.status !== 'completed' ? 'text-muted-foreground' : ''}`}>
                    Evidencia Recolectada
                  </p>
                  {assignment.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(assignment.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="grid gap-2">
          {assignment.status === 'pending' && (
            <Button 
              onClick={acceptAssignment}
              disabled={isAccepting}
              className="w-full flex gap-2 items-center justify-center"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 
                  Aceptando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> 
                  Aceptar Asignación
                </>
              )}
            </Button>
          )}
          
          {canScanQr() && (
            <Button 
              onClick={() => setLocation(`/mobile/scan-qr/${id}`)}
              variant={assignment.status === 'accepted' ? "default" : "outline"}
              className="w-full flex gap-2 items-center justify-center"
            >
              <QrCode className="h-4 w-4" /> 
              Verificar Código QR
            </Button>
          )}
          
          {canCollectEvidence() && (
            <Button 
              onClick={() => setLocation(`/mobile/evidence/${id}`)}
              variant={assignment.status === 'qr_verified' ? "default" : "outline"}
              className="w-full flex gap-2 items-center justify-center"
            >
              <Camera className="h-4 w-4" /> 
              Recolectar Evidencia
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}