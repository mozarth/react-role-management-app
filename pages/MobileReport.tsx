import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, MapPin, Clock, Camera, FileText, 
  ArrowLeft, CheckCircle, AlertTriangle, Image as ImageIcon,
  Video, Mic, Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TimeDisplay } from '@/components/supervisor/TimeDisplay';
import { MapRoute } from '@/components/supervisor/MapRoute';

// Datos de ejemplo para la ruta
const mockRoutePoints = [
  { lat: 19.4326, lng: -99.1332, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { lat: 19.4327, lng: -99.1320, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { lat: 19.4315, lng: -99.1315, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { lat: 19.4310, lng: -99.1305, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { lat: 19.4300, lng: -99.1300, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
];

export default function MobileReport() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Obtener detalles del reporte
  const { data: report, isLoading } = useQuery({
    queryKey: [`/api/supervisor/reports/${id}`],
    retry: false,
  });

  // Obtener detalles de la asignación
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: [`/api/supervisor/assignments/${id}`],
    enabled: !!report,
    retry: false,
  });

  // Función para descargar el reporte
  const downloadReport = () => {
    toast({
      title: "Descargando reporte",
      description: "El reporte se está descargando en formato PDF.",
      variant: "default",
    });
  };

  // Formatear la fecha
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener duración de asignación
  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutos`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours} hora${hours > 1 ? 's' : ''} ${mins > 0 ? `y ${mins} minutos` : ''}`;
    }
  };

  if (isLoading || isLoadingAssignment) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando reporte...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report || !assignment) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-medium mb-2">Error al cargar la información</p>
            <p className="text-muted-foreground text-center">No se pudo encontrar el reporte solicitado</p>
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

  // Para este ejemplo, usaremos datos mockeados
  const mockReport = {
    id: id,
    assignmentId: id,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    supervisorName: "Juan Pérez",
    clientName: "Banco Nacional",
    address: "Av. Principal 123, Zona Norte",
    alarmType: "Intrusión",
    notes: "Se verificó la alarma. No se encontraron signos de intrusión. Se identificó un problema con el sensor de movimiento que estaba generando falsas alarmas.",
    startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    qrVerified: true,
    evidence: {
      photos: [
        { url: "https://picsum.photos/400/300?random=1", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { url: "https://picsum.photos/400/300?random=2", timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
      ],
      video: { url: "https://example.com/video.mp4", timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
      audio: { url: "https://example.com/audio.mp3", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    },
    status: "completed",
    routePoints: mockRoutePoints
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
            <h1 className="text-lg font-bold ml-2">Reporte de Asignación</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={downloadReport}
          >
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-4">
        {/* Resumen del reporte */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{mockReport.clientName}</CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                Completado
              </Badge>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              {mockReport.address}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                <p className="font-medium">{mockReport.alarmType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supervisor</p>
                <p className="font-medium">{mockReport.supervisorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inicio</p>
                <p className="font-medium">{formatDateTime(mockReport.startTime)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fin</p>
                <p className="font-medium">{formatDateTime(mockReport.endTime)}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Duración total</p>
              <TimeDisplay 
                timestamp={mockReport.startTime}
                label=""
                className="mt-1"
              />
              <p className="text-sm font-medium mt-1">
                {getDuration(mockReport.startTime, mockReport.endTime)}
              </p>
            </div>
            
            {mockReport.notes && (
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-1">Notas del supervisor</p>
                <Alert>
                  <AlertDescription>
                    {mockReport.notes}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapa con la ruta */}
        <MapRoute 
          points={mockReport.routePoints}
          startAddress="Punto de partida"
          endAddress={mockReport.address}
          clientName={mockReport.clientName}
          className="mb-4"
        />

        {/* Evidencia recolectada */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evidencia Recolectada</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="photos" className="w-full">
              <TabsList className="w-full grid grid-cols-3 m-4">
                <TabsTrigger value="photos">
                  <Camera className="h-4 w-4 mr-1" /> Fotos ({mockReport.evidence.photos.length})
                </TabsTrigger>
                <TabsTrigger value="video">
                  <Video className="h-4 w-4 mr-1" /> Video
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Mic className="h-4 w-4 mr-1" /> Audio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photos" className="p-4 pt-0">
                {mockReport.evidence.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {mockReport.evidence.photos.map((photo, index) => (
                      <div key={index} className="rounded-md overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={`Evidencia ${index + 1}`} 
                          className="w-full aspect-[4/3] object-cover"
                        />
                        <p className="text-xs text-muted-foreground p-1 bg-muted">
                          {new Date(photo.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6">
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center">No hay fotos en este reporte</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="video" className="p-4 pt-0">
                {mockReport.evidence.video ? (
                  <div className="rounded-md overflow-hidden">
                    <div className="bg-muted aspect-video flex items-center justify-center">
                      <Video className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground p-2 bg-muted">
                      Video capturado el {new Date(mockReport.evidence.video.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6">
                    <Video className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center">No hay videos en este reporte</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="audio" className="p-4 pt-0">
                {mockReport.evidence.audio ? (
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex items-center justify-center p-4">
                      <Mic className="h-8 w-8 text-primary" />
                    </div>
                    <audio 
                      controls 
                      className="w-full mt-2"
                      src={mockReport.evidence.audio.url}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Audio grabado el {new Date(mockReport.evidence.audio.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6">
                    <Mic className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center">No hay audios en este reporte</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Estados de verificación */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estados de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 border border-green-300">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Llegada verificada con código QR</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(mockReport.startTime)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 border border-green-300">
                  <Camera className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Evidencia fotográfica recolectada</p>
                  <p className="text-xs text-muted-foreground">
                    {mockReport.evidence.photos.length} fotos
                  </p>
                </div>
              </div>
              
              {mockReport.evidence.video && (
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 border border-green-300">
                    <Video className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Video capturado</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(mockReport.evidence.video.timestamp)}
                    </p>
                  </div>
                </div>
              )}
              
              {mockReport.evidence.audio && (
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 border border-green-300">
                    <Mic className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Audio grabado</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(mockReport.evidence.audio.timestamp)}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 border border-green-300">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Reporte completado</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(mockReport.endTime)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}