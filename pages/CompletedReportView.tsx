import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  MapPin,
  Clock,
  User,
  Car,
  MessageSquare,
  AlarmClock,
  CheckSquare,
  Headphones,
  Camera,
  Download,
  Printer,
  Share2,
  QrCode
} from "lucide-react";

// Componente de imagen con ampliación
const ImageGallery = ({ images }: { images: string[] }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No hay imágenes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl w-full">
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="w-full object-contain max-h-[80vh]"
            />
            <Button
              variant="outline"
              className="mt-4 bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <img
              src={image}
              alt={`Evidencia ${index + 1}`}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de reproductor de audio
const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  return (
    <div className="flex items-center p-3 bg-gray-50 rounded-md mb-2">
      <Headphones className="h-5 w-5 mr-2 text-gray-500" />
      <audio controls className="w-full max-w-md">
        <source src={audioUrl} type="audio/mpeg" />
        Tu navegador no soporta el elemento de audio.
      </audio>
    </div>
  );
};

// Componente de reproductor de video
const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
  return (
    <div className="mb-4">
      <video
        controls
        className="w-full rounded-md"
        style={{ maxHeight: "400px" }}
      >
        <source src={videoUrl} type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  );
};

// Componente para mostrar la cronología
const TimelineEvent = ({
  time,
  title,
  description,
  icon,
}: {
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex mb-4">
      <div className="mr-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{time}</p>
        <h4 className="text-base font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

// Componente para mostrar tiempos de respuesta
const ResponseTimeDisplay = ({ minutes }: { minutes: number }) => {
  const getColor = (time: number) => {
    if (time <= 20) return "text-green-600";
    if (time <= 40) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <span className={`font-bold ${getColor(minutes)}`}>
      {minutes} minutos
    </span>
  );
};

// Componente para mostrar mapa pequeño
const MiniMap = ({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
  return (
    <div className="rounded-md overflow-hidden border mb-4">
      <div className="h-48 bg-gray-100 relative">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
        ></iframe>
      </div>
      <div className="p-3 text-sm flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
        <span>{address}</span>
      </div>
    </div>
  );
};

// Datos simulados para desarrollo
const mockReport = {
  id: 1,
  assignmentId: 1,
  description: "Se verificó la alarma activada en el establecimiento. Se encontró una ventana abierta en la parte trasera del edificio. Se contactó al cliente y se realizó inspección completa.",
  photos: [
    "https://via.placeholder.com/600x400?text=Evidencia+1",
    "https://via.placeholder.com/600x400?text=Evidencia+2",
    "https://via.placeholder.com/600x400?text=Evidencia+3",
  ],
  videos: [
    "https://example.com/video1.mp4",
  ],
  audio: [
    "https://example.com/audio1.mp3",
    "https://example.com/audio2.mp3",
  ],
  resolvedStatus: "Solucionado",
  responseTime: 18,
  createdAt: "2023-09-18T15:30:00Z",
  contactPerson: "Juan Pérez",
  contactRole: "Gerente de Seguridad",
  contactPhone: "+52 555 123 4567",
  observations: "El cliente solicitó reforzar vigilancia nocturna en la zona trasera.",
  recommendations: "Se recomienda instalar sensores adicionales en las ventanas traseras y mejorar iluminación exterior."
};

const mockAssignment = {
  id: 1,
  patrolId: 3,
  supervisorId: 995,
  alarmId: 5,
  dispatcherId: 44,
  assignedAt: "2023-09-18T14:45:00Z",
  acceptedAt: "2023-09-18T14:47:00Z",
  arrivedAt: "2023-09-18T15:05:00Z",
  completedAt: "2023-09-18T15:30:00Z",
  status: "completed",
  notes: "Asignación completada exitosamente",
  alarmType: "intrusion",
  priority: "high",
  clientName: "Banco Nacional - Sucursal Centro",
  clientId: 23,
  clientCode: "BN-001",
  address: "Av. Constitución 1050, Centro, Monterrey, NL",
  coordinates: {
    lat: 25.6714, 
    lng: -100.3092
  }
};

const mockSupervisor = {
  id: 995,
  username: "supervisor1",
  firstName: "Carlos",
  lastName: "Rodríguez",
  role: "supervisor",
  profileImageUrl: "https://i.pravatar.cc/150?img=68"
};

const mockPatrol = {
  id: 3,
  vehicleCode: "PAT-003",
  licensePlate: "ABC-1234",
  status: "available"
};

export default function CompletedReportView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Obtener reporte
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: [`/api/reports/assignment/${id}`],
    // enabled: !!id,
    // El backend aún no tiene implementada esta ruta, usamos mockReport por ahora
  });

  // Obtener detalles de la asignación
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: [`/api/supervisor/assignments/${id}`],
    // enabled: !!id,
    // El backend aún no tiene implementada esta ruta correctamente, usamos mockAssignment por ahora
  });

  // Obtener detalles del supervisor
  const { data: supervisor, isLoading: isLoadingSupervisor } = useQuery({
    queryKey: [`/api/users/${mockAssignment.supervisorId}`],
    // enabled: !!assignment?.supervisorId,
    // El backend aún no tiene implementada esta ruta, usamos mockSupervisor por ahora
  });

  // Obtener detalles de la patrulla
  const { data: patrol, isLoading: isLoadingPatrol } = useQuery({
    queryKey: [`/api/patrols/${mockAssignment.patrolId}`],
    // enabled: !!assignment?.patrolId,
    // El backend aún no tiene implementada esta ruta, usamos mockPatrol por ahora
  });

  // Usamos datos simulados mientras el backend está listo
  const reportData = report || mockReport;
  const assignmentData = assignment || mockAssignment;
  const supervisorData = supervisor || mockSupervisor;
  const patrolData = patrol || mockPatrol;

  const isLoading = isLoadingReport || isLoadingAssignment || isLoadingSupervisor || isLoadingPatrol;

  // Función para descargar el reporte
  const downloadReport = () => {
    toast({
      title: "Descargando reporte",
      description: "El reporte se está descargando en formato PDF.",
    });
    // Lógica para descargar PDF
  };

  // Función para compartir el reporte
  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: `Reporte de asignación #${id}`,
        text: `Reporte de la asignación #${id} - ${assignmentData.clientName}`,
        url: window.location.href,
      }).catch(error => console.log('Error compartiendo', error));
    } else {
      toast({
        title: "Compartir no disponible",
        description: "Tu navegador no soporta la funcionalidad de compartir.",
        variant: "destructive",
      });
    }
  };

  // Función para imprimir el reporte
  const printReport = () => {
    window.print();
  };

  // Calcular tiempos
  const calculateResponseTime = () => {
    if (!assignmentData.acceptedAt || !assignmentData.assignedAt) return null;
    const acceptedTime = new Date(assignmentData.acceptedAt).getTime();
    const assignedTime = new Date(assignmentData.assignedAt).getTime();
    return Math.round((acceptedTime - assignedTime) / (1000 * 60));
  };

  const calculateTravelTime = () => {
    if (!assignmentData.arrivedAt || !assignmentData.acceptedAt) return null;
    const arrivedTime = new Date(assignmentData.arrivedAt).getTime();
    const acceptedTime = new Date(assignmentData.acceptedAt).getTime();
    return Math.round((arrivedTime - acceptedTime) / (1000 * 60));
  };

  const calculateTotalTime = () => {
    if (!assignmentData.completedAt || !assignmentData.assignedAt) return null;
    const completedTime = new Date(assignmentData.completedAt).getTime();
    const assignedTime = new Date(assignmentData.assignedAt).getTime();
    return Math.round((completedTime - assignedTime) / (1000 * 60));
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: es });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-32 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-32 w-full mb-6" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center mr-4 mb-4 sm:mb-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => setLocation('/supervisor-panel')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Reporte de Asignación #{id}</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={downloadReport}
          >
            <Download className="h-4 w-4" /> Descargar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={printReport}
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={shareReport}
          >
            <Share2 className="h-4 w-4" /> Compartir
          </Button>
          <a 
            href="/qr-scanner.html" 
            target="_self"
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-green-50 text-green-700 hover:bg-green-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <QrCode className="h-4 w-4" /> Escanear QR
          </a>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Resumen de la asignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlarmClock className="h-5 w-5 text-amber-500" />
                Asignación #{assignmentData.id}
              </CardTitle>
              <CardDescription>
                Creada el {formatDateTime(assignmentData.assignedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <h3 className="text-sm text-muted-foreground">Cliente</h3>
                  <p className="font-medium">{assignmentData.clientName}</p>
                  <p className="text-sm">{assignmentData.clientCode}</p>
                </div>
                <div>
                  <h3 className="text-sm text-muted-foreground">Tipo de Alarma</h3>
                  <Badge variant={assignmentData.alarmType === 'intrusion' ? 'destructive' : 'default'}>
                    {assignmentData.alarmType === 'intrusion' 
                      ? 'Intrusión' 
                      : assignmentData.alarmType === 'fire' 
                        ? 'Incendio'
                        : assignmentData.alarmType === 'panic'
                          ? 'Pánico'
                          : assignmentData.alarmType}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm text-muted-foreground">Prioridad</h3>
                  <Badge variant={
                    assignmentData.priority === 'high' 
                      ? 'destructive' 
                      : assignmentData.priority === 'medium'
                        ? 'default'
                        : 'outline'
                  }>
                    {assignmentData.priority === 'high' 
                      ? 'Alta' 
                      : assignmentData.priority === 'medium'
                        ? 'Media'
                        : 'Baja'}
                  </Badge>
                </div>
              </div>

              {/* Mapa */}
              {assignmentData.coordinates && (
                <MiniMap 
                  lat={assignmentData.coordinates.lat} 
                  lng={assignmentData.coordinates.lng}
                  address={assignmentData.address}
                />
              )}

              {/* Línea de tiempo */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="font-medium mb-3">Cronología</h3>
                <TimelineEvent
                  time={formatTime(assignmentData.assignedAt)}
                  title="Asignación Creada"
                  description="Se creó la asignación para atender la alarma."
                  icon={<FileText className="h-5 w-5" />}
                />
                {assignmentData.acceptedAt && (
                  <TimelineEvent
                    time={formatTime(assignmentData.acceptedAt)}
                    title="Asignación Aceptada"
                    description="El supervisor aceptó la asignación y comenzó a desplazarse."
                    icon={<CheckSquare className="h-5 w-5" />}
                  />
                )}
                {assignmentData.arrivedAt && (
                  <TimelineEvent
                    time={formatTime(assignmentData.arrivedAt)}
                    title="Llegada al Sitio"
                    description="El supervisor llegó al sitio y comenzó la verificación."
                    icon={<MapPin className="h-5 w-5" />}
                  />
                )}
                {assignmentData.completedAt && (
                  <TimelineEvent
                    time={formatTime(assignmentData.completedAt)}
                    title="Asignación Completada"
                    description="La asignación fue completada y el reporte generado."
                    icon={<CheckSquare className="h-5 w-5" />}
                  />
                )}
              </div>

              {/* Tiempos de respuesta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {calculateResponseTime() !== null && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h3 className="text-sm text-blue-700 mb-1">Tiempo de Aceptación</h3>
                    <ResponseTimeDisplay minutes={calculateResponseTime()!} />
                  </div>
                )}
                {calculateTravelTime() !== null && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h3 className="text-sm text-blue-700 mb-1">Tiempo de Traslado</h3>
                    <ResponseTimeDisplay minutes={calculateTravelTime()!} />
                  </div>
                )}
                {calculateTotalTime() !== null && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h3 className="text-sm text-blue-700 mb-1">Tiempo Total</h3>
                    <ResponseTimeDisplay minutes={calculateTotalTime()!} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pestañas de evidencia */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="description">Descripción</TabsTrigger>
              <TabsTrigger value="photos">Fotos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="bg-white rounded-md p-4 border">
              <h3 className="font-medium mb-2">Descripción del Reporte</h3>
              <p className="text-muted-foreground mb-4">{reportData.description}</p>
              
              {reportData.observations && (
                <>
                  <h3 className="font-medium mb-2">Observaciones</h3>
                  <p className="text-muted-foreground mb-4">{reportData.observations}</p>
                </>
              )}
              
              {reportData.recommendations && (
                <>
                  <h3 className="font-medium mb-2">Recomendaciones</h3>
                  <p className="text-muted-foreground mb-4">{reportData.recommendations}</p>
                </>
              )}
              
              {reportData.contactPerson && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <h3 className="font-medium mb-2">Contacto en Sitio</h3>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">{reportData.contactPerson}</p>
                      <p className="text-sm text-muted-foreground">{reportData.contactRole}</p>
                      {reportData.contactPhone && (
                        <p className="text-sm">{reportData.contactPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="photos" className="bg-white rounded-md border">
              <ImageGallery images={reportData.photos || []} />
            </TabsContent>
            
            <TabsContent value="audio" className="bg-white rounded-md p-4 border">
              {reportData.audio && reportData.audio.length > 0 ? (
                <div className="space-y-2">
                  {reportData.audio.map((audio, index) => (
                    <AudioPlayer key={index} audioUrl={audio} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-4">No hay grabaciones de audio disponibles</p>
              )}
            </TabsContent>
            
            <TabsContent value="video" className="bg-white rounded-md p-4 border">
              {reportData.videos && reportData.videos.length > 0 ? (
                <div className="space-y-4">
                  {reportData.videos.map((video, index) => (
                    <VideoPlayer key={index} videoUrl={video} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-4">No hay grabaciones de video disponibles</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Columna secundaria */}
        <div className="space-y-6">
          {/* Información del supervisor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supervisor Asignado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={supervisorData.profileImageUrl} alt={`${supervisorData.firstName} ${supervisorData.lastName}`} />
                  <AvatarFallback>{`${supervisorData.firstName?.charAt(0)}${supervisorData.lastName?.charAt(0)}`}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{`${supervisorData.firstName} ${supervisorData.lastName}`}</h3>
                  <p className="text-sm text-muted-foreground">{supervisorData.username}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la patrulla */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehículo Asignado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium">{patrolData.vehicleCode}</h3>
                  <p className="text-sm text-muted-foreground">Placa: {patrolData.licensePlate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado y resultado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado y Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <h3 className="text-sm text-muted-foreground mb-1">Estado</h3>
                <Badge 
                  variant="success" 
                  className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800"
                >
                  Completado
                </Badge>
              </div>
              {reportData.resolvedStatus && (
                <div className="mb-3">
                  <h3 className="text-sm text-muted-foreground mb-1">Resultado</h3>
                  <Badge variant="outline">{reportData.resolvedStatus}</Badge>
                </div>
              )}
              <Separator className="my-3" />
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Notas Adicionales</h3>
                <p className="text-sm">{assignmentData.notes || "No hay notas adicionales."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}