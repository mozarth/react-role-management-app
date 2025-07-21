import React, { useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, MapPin, Camera, Video, Mic, FileText, 
  ArrowLeft, CheckCircle, AlertTriangle, X, Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { MessageType } from '@shared/websocket';
import { TimeBox } from '@/components/supervisor/TimeBox';

export default function MobileEvidence() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addNotification, sendWebSocketMessage } = useNotifications();
  
  // Referencias a los elementos multimedia
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Estados para seguimiento de la interfaz
  const [activeTab, setActiveTab] = useState('photo');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ 
    photos: string[], 
    video: string | null,
    audio: string | null,
    notes: string
  }>({
    photos: [],
    video: null,
    audio: null,
    notes: ''
  });
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [videoBlobs, setVideoBlobs] = useState<Blob[]>([]);

  // Obtener detalles de la asignación
  const { data: assignment, isLoading } = useQuery({
    queryKey: [`/api/supervisor/assignments/${id}`],
    retry: false,
  });

  // Mutación para guardar evidencia
  const saveEvidenceMutation = useMutation({
    mutationFn: async (evidenceData: {
      assignmentId: number;
      photos: string[];
      video: string | null;
      audio: string | null;
      notes: string;
    }) => {
      // Simular una llamada a la API
      return new Promise<{ success: boolean; message?: string }>((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1500);
      });
    },
    onSuccess: () => {
      toast({
        title: "Evidencia guardada",
        description: "La evidencia se ha registrado correctamente.",
        variant: "default",
      });
      
      // Notificar al servidor mediante WebSocket
      sendWebSocketMessage({
        type: MessageType.PATROL_STATUS_UPDATE,
        payload: {
          assignmentId: Number(id),
          status: 'evidence_collected',
          evidenceTime: new Date().toISOString(),
          supervisor: {
            id: 123, // Esto vendría del usuario autenticado
            name: "Supervisor" // Esto vendría del usuario autenticado
          }
        },
        timestamp: Date.now()
      });
      
      // Redirigir al dashboard después de un momento
      setTimeout(() => {
        setLocation('/mobile/dashboard');
      }, 2000);
    },
    onError: () => {
      setIsSaving(false);
      toast({
        title: "Error",
        description: "No se pudo guardar la evidencia. Intente nuevamente.",
        variant: "destructive",
      });
    }
  });

  // Iniciar captura de foto
  const startPhotoCapture = async () => {
    try {
      if (mediaStream) {
        stopMediaStream();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCapturing(true);
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifique los permisos.",
        variant: "destructive",
      });
    }
  };

  // Capturar foto
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && mediaStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar el frame en el canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir a base64 y guardar
        const photoData = canvas.toDataURL('image/jpeg');
        setCapturedMedia(prev => ({
          ...prev,
          photos: [...prev.photos, photoData]
        }));
        
        toast({
          title: "Foto capturada",
          description: `Foto ${capturedMedia.photos.length + 1} guardada.`,
          variant: "default",
        });
      }
    }
  };

  // Eliminar una foto
  const deletePhoto = (index: number) => {
    setCapturedMedia(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Iniciar grabación de video
  const startVideoRecording = async () => {
    try {
      if (mediaStream) {
        stopMediaStream();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: true
      });
      
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Configurar el MediaRecorder para video
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const videoChunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.push(event.data);
          setVideoBlobs([...videoChunks]);
        }
      };
      
      recorder.onstop = () => {
        const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        
        setCapturedMedia(prev => ({
          ...prev,
          video: videoUrl
        }));
        
        clearInterval(recordingInterval as NodeJS.Timeout);
        setRecordingInterval(null);
        setRecordingTime(0);
      };
      
      // Iniciar grabación
      recorder.start(200);
      setIsCapturing(true);
      
      // Temporizador para controlar la duración (máximo 30 segundos)
      const interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 30) {
            stopRecording();
            return 30;
          }
          return newTime;
        });
      }, 1000);
      
      setRecordingInterval(interval);
      
    } catch (error) {
      console.error('Error al acceder a la cámara o micrófono:', error);
      toast({
        title: "Error de dispositivo",
        description: "No se pudo acceder a la cámara o micrófono. Verifique los permisos.",
        variant: "destructive",
      });
    }
  };

  // Iniciar grabación de audio
  const startAudioRecording = async () => {
    try {
      if (mediaStream) {
        stopMediaStream();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      
      // Configurar el MediaRecorder para audio
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const audioChunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          setAudioBlobs([...audioChunks]);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setCapturedMedia(prev => ({
          ...prev,
          audio: audioUrl
        }));
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
        
        clearInterval(recordingInterval as NodeJS.Timeout);
        setRecordingInterval(null);
        setRecordingTime(0);
      };
      
      // Iniciar grabación
      recorder.start(200);
      setIsCapturing(true);
      
      // Temporizador para controlar la duración
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setRecordingInterval(interval);
      
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      toast({
        title: "Error de micrófono",
        description: "No se pudo acceder al micrófono. Verifique los permisos.",
        variant: "destructive",
      });
    }
  };

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    stopMediaStream();
    setIsCapturing(false);
  };

  // Detener stream de medios
  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
  };

  // Actualizar notas de texto
  const updateNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCapturedMedia(prev => ({
      ...prev,
      notes: e.target.value
    }));
  };

  // Guardar toda la evidencia recolectada
  const saveEvidence = () => {
    setIsSaving(true);
    saveEvidenceMutation.mutate({
      assignmentId: Number(id),
      photos: capturedMedia.photos,
      video: capturedMedia.video,
      audio: capturedMedia.audio,
      notes: capturedMedia.notes
    });
  };

  // Formatear tiempo de grabación (mm:ss)
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Salir sin guardar
  const exitWithoutSaving = () => {
    if (capturedMedia.photos.length > 0 || capturedMedia.video || capturedMedia.audio || capturedMedia.notes) {
      if (confirm('¿Está seguro que desea salir sin guardar la evidencia recolectada?')) {
        stopMediaStream();
        setLocation('/mobile/dashboard');
      }
    } else {
      stopMediaStream();
      setLocation('/mobile/dashboard');
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Cabecera */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={exitWithoutSaving}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold ml-2">Recolectar Evidencia</h1>
          </div>
          {!isCapturing && (
            <div className="flex items-center">
              <TimeBox dateString={assignment.createdAt} />
            </div>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-4">
        {/* Información del cliente */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{assignment.clientName}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              {assignment.address}
            </div>
          </CardHeader>
        </Card>

        {/* Panel de captura de evidencia */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="photo" disabled={isCapturing && activeTab !== 'photo'}>
              <Camera className="h-4 w-4 mr-1" /> Foto
            </TabsTrigger>
            <TabsTrigger value="video" disabled={isCapturing && activeTab !== 'video'}>
              <Video className="h-4 w-4 mr-1" /> Video
            </TabsTrigger>
            <TabsTrigger value="audio" disabled={isCapturing && activeTab !== 'audio'}>
              <Mic className="h-4 w-4 mr-1" /> Audio
            </TabsTrigger>
            <TabsTrigger value="notes" disabled={isCapturing}>
              <FileText className="h-4 w-4 mr-1" /> Notas
            </TabsTrigger>
          </TabsList>

          {/* Captura de fotos */}
          <TabsContent value="photo">
            <div className="space-y-4">
              {isCapturing ? (
                <div className="relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-auto rounded-md bg-black"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="rounded-full w-16 h-16 bg-white/80 hover:bg-white flex items-center justify-center"
                      onClick={capturePhoto}
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-primary" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {capturedMedia.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {capturedMedia.photos.map((photo, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden aspect-square">
                          <img 
                            src={photo} 
                            alt={`Evidencia ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500/80"
                            onClick={() => deletePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-md">
                      <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">No hay fotos capturadas</p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={startPhotoCapture}
                    className="w-full flex gap-2 items-center justify-center"
                  >
                    <Camera className="h-4 w-4" /> Capturar Foto
                  </Button>
                </div>
              )}
              
              {isCapturing && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCapturing(false)}
                    className="flex gap-2 items-center"
                  >
                    <X className="h-4 w-4" /> Detener captura
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Grabación de video */}
          <TabsContent value="video">
            <div className="space-y-4">
              {isCapturing ? (
                <div className="relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-auto rounded-md bg-black"
                  />
                  
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm font-mono">
                    {formatRecordingTime(recordingTime)} / 00:30
                  </div>
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button 
                      variant="destructive" 
                      className="rounded-full px-8 py-2 animate-pulse"
                      onClick={stopRecording}
                    >
                      Detener Grabación
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {capturedMedia.video ? (
                    <div className="relative rounded-md overflow-hidden">
                      <video 
                        src={capturedMedia.video} 
                        controls 
                        className="w-full h-auto rounded-md bg-black"
                      />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => setCapturedMedia(prev => ({ ...prev, video: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-md">
                      <Video className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay video grabado (máximo 30 segundos)
                      </p>
                    </div>
                  )}
                  
                  {!capturedMedia.video && (
                    <Button 
                      onClick={startVideoRecording}
                      className="w-full flex gap-2 items-center justify-center"
                    >
                      <Video className="h-4 w-4" /> Grabar Video
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Grabación de audio */}
          <TabsContent value="audio">
            <div className="space-y-4">
              {isCapturing ? (
                <div className="flex flex-col items-center justify-center p-8 bg-black rounded-md">
                  <Mic className="h-20 w-20 text-white mb-4 animate-pulse" />
                  <p className="text-white text-center mb-6">Grabando audio...</p>
                  <p className="text-white text-xl font-mono mb-8">
                    {formatRecordingTime(recordingTime)}
                  </p>
                  
                  <Button 
                    variant="destructive" 
                    className="rounded-full px-8 py-2"
                    onClick={stopRecording}
                  >
                    Detener Grabación
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {capturedMedia.audio ? (
                    <div className="relative p-4 bg-muted rounded-md">
                      <audio 
                        ref={audioRef}
                        src={capturedMedia.audio} 
                        controls 
                        className="w-full"
                      />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => setCapturedMedia(prev => ({ ...prev, audio: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-md">
                      <Mic className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay audio grabado
                      </p>
                    </div>
                  )}
                  
                  {!capturedMedia.audio && (
                    <Button 
                      onClick={startAudioRecording}
                      className="w-full flex gap-2 items-center justify-center"
                    >
                      <Mic className="h-4 w-4" /> Grabar Audio
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notas de texto */}
          <TabsContent value="notes">
            <div className="space-y-4">
              <Textarea 
                placeholder="Escriba sus observaciones aquí... (opcional)"
                rows={10}
                className="w-full"
                value={capturedMedia.notes}
                onChange={updateNotes}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Resumen de la evidencia recolectada */}
        {!isCapturing && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Resumen de evidencia:</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center">
                <Camera className="h-4 w-4 mr-2" /> 
                {capturedMedia.photos.length} fotos capturadas
              </li>
              <li className="flex items-center">
                <Video className="h-4 w-4 mr-2" /> 
                {capturedMedia.video ? "1 video grabado" : "Sin videos"}
              </li>
              <li className="flex items-center">
                <Mic className="h-4 w-4 mr-2" /> 
                {capturedMedia.audio ? "1 audio grabado" : "Sin audios"}
              </li>
              <li className="flex items-center">
                <FileText className="h-4 w-4 mr-2" /> 
                {capturedMedia.notes ? "Notas agregadas" : "Sin notas"}
              </li>
            </ul>
          </div>
        )}

        {/* Botones de acción */}
        {!isCapturing && (
          <div className="mt-6 grid gap-2">
            <Button 
              onClick={saveEvidence}
              disabled={isSaving || (
                capturedMedia.photos.length === 0 && 
                !capturedMedia.video && 
                !capturedMedia.audio && 
                !capturedMedia.notes
              )}
              className="w-full flex gap-2 items-center justify-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> 
                  Guardar Evidencia
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={exitWithoutSaving}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}