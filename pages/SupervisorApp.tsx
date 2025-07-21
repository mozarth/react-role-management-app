import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { useSocket } from '@/hooks/useSocket';
import { UserRole } from '@shared/schema';
import { MessageType } from '@shared/websocket';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  AlertTriangle, MapPin, Clock, ChevronRight, LogOut, Camera, User, Bell, Settings, FileText, Home,
  X, Video, Mic, Square
} from 'lucide-react';

// Componente de autenticación con reconocimiento facial
function FaceRecognition({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Inicializar la cámara
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraActive]);

  // Iniciar la cámara
  const startCamera = async () => {
    try {
      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Usar cámara frontal
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      videoRef.current.srcObject = stream;
      setErrorMessage(null);
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      setErrorMessage('No se pudo acceder a la cámara. Por favor, asegúrate de dar permiso para usar la cámara.');
      setIsCameraActive(false);
    }
  };

  // Detener la cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Capturar imagen para verificación
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir imagen a base64
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    verifyFace(imageDataUrl);
  };

  // Verificar rostro con el servidor
  const verifyFace = async (imageData: string) => {
    setIsVerifying(true);
    try {
      // En producción, aquí se enviaría la imagen al servidor para verificación
      const response = await apiRequest('POST', '/api/auth/verify-face', { 
        faceImage: imageData 
      });

      // Simular verificación exitosa para propósitos de demostración
      setTimeout(() => {
        toast({
          title: 'Verificación exitosa',
          description: 'Tu identidad ha sido verificada correctamente',
        });
        setIsVerifying(false);
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error al verificar rostro:', error);
      toast({
        title: 'Error de verificación',
        description: 'No se pudo verificar tu identidad. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md flex items-center gap-2 mb-2">
          <AlertTriangle size={16} />
          {errorMessage}
        </div>
      )}

      <div className="relative w-full max-w-md aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {!isCameraActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Camera size={48} className="text-gray-400 mb-2" />
            <Button 
              onClick={() => setIsCameraActive(true)}
              className="mt-4"
            >
              Activar cámara
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-primary-500 m-6 pointer-events-none rounded-md">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-600"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-600"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-600"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-600"></div>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="flex space-x-2 w-full max-w-md">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={captureImage}
          disabled={!isCameraActive || isVerifying}
          className="flex-1"
        >
          {isVerifying ? 'Verificando...' : 'Verificar identidad'}
        </Button>
      </div>

      <p className="text-sm text-gray-500 mt-2 text-center">
        Posiciona tu rostro dentro del marco y haz clic en verificar
      </p>
    </div>
  );
}

// Componente de autenticación
function SupervisorLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Simulación de autenticación
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest('POST', '/api/auth/login', credentials);
    },
    onSuccess: () => {
      // Si el login es exitoso, mostrar verificación facial
      setShowFaceVerification(true);
      setErrorMsg('');
    },
    onError: (error: any) => {
      setErrorMsg(error.message || 'Credenciales incorrectas');
      toast({
        title: 'Error de autenticación',
        description: error.message || 'No se pudo iniciar sesión. Verifica tus credenciales.',
        variant: 'destructive'
      });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Por favor ingresa usuario y contraseña');
      return;
    }
    
    loginMutation.mutate({ username, password });
  };
  
  // Completar el proceso de login después de verificación facial
  const handleFaceVerificationSuccess = () => {
    // Establecer la sesión con duración máxima de 12 horas
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 12);
    localStorage.setItem('sessionExpiry', expiryTime.toISOString());
    
    toast({
      title: 'Sesión iniciada',
      description: 'Has iniciado sesión con éxito. Tu sesión expirará en 12 horas.',
    });
    
    // Redirigir al dashboard
    setLocation('/supervisor-dashboard');
    
    // Recargar datos del usuario
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Acceso de Supervisores</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!showFaceVerification ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
                  {errorMsg}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Usuario
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          ) : (
            <FaceRecognition 
              onSuccess={handleFaceVerificationSuccess}
              onCancel={() => setShowFaceVerification(false)}
            />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center text-xs text-gray-500">
          Sistema de Patrullas v2.0 &copy; {new Date().getFullYear()}
        </CardFooter>
      </Card>
    </div>
  );
}

// Componente para visualizar y gestionar una asignación específica
function AssignmentDetail({ 
  assignment, 
  onClose, 
  onUpdate 
}: { 
  assignment: any, 
  onClose: () => void,
  onUpdate: (updatedAssignment: any) => void 
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState(assignment.status);
  const [notes, setNotes] = useState(assignment.notes || '');
  const [loading, setLoading] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [elapsedTime, setElapsedTime] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [locationData, setLocationData] = useState<{lat: number, lng: number} | null>(null);
  const [audioRecording, setAudioRecording] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  
  // Calcular el tiempo transcurrido desde que se asignó la alarma
  useEffect(() => {
    if (!assignment.assignedAt) return;
    
    const calculateElapsedTime = () => {
      const assignedTime = new Date(assignment.assignedAt).getTime();
      const now = Date.now();
      const diffMs = now - assignedTime;
      
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      
      let color = 'text-green-600';
      if (minutes >= 20 && minutes < 30) {
        color = 'text-amber-600';
      } else if (minutes >= 30) {
        color = 'text-red-600';
      }
      
      setElapsedTime(`${minutes}m ${seconds}s`);
      return color;
    };
    
    // Actualizar cada segundo
    calculateElapsedTime();
    const intervalId = setInterval(calculateElapsedTime, 1000);
    
    return () => clearInterval(intervalId);
  }, [assignment.assignedAt]);
  
  // Obtener la ubicación actual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          toast({
            title: 'Error de ubicación',
            description: 'No se pudo obtener tu ubicación actual',
            variant: 'destructive'
          });
        }
      );
    } else {
      toast({
        title: 'Geolocalización no soportada',
        description: 'Tu navegador no soporta geolocalización',
        variant: 'destructive'
      });
    }
  };
  
  // Inicializar cámara
  const startCamera = async () => {
    try {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Usar cámara trasera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: mediaType === 'video'
        });
        
        videoRef.current.srcObject = stream;
        cameraStreamRef.current = stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast({
        title: 'Error de cámara',
        description: 'No se pudo acceder a la cámara. Verifica los permisos.',
        variant: 'destructive'
      });
      setShowCamera(false);
    }
  };
  
  // Detener cámara
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
  
  // Iniciar grabación de video
  const startVideoRecording = () => {
    if (!cameraStreamRef.current) return;
    
    mediaChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(cameraStreamRef.current);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        mediaChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(mediaChunksRef.current, { type: 'video/webm' });
      
      // Aquí enviaríamos el video al servidor
      // Por ahora, simulamos la subida
      toast({
        title: 'Video grabado',
        description: `Video de ${recordingTime}s grabado correctamente`,
      });
      
      // Resetear contador
      setRecordingTime(0);
      setIsRecording(false);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    
    // Iniciar contador de tiempo
    let seconds = 0;
    const countInterval = setInterval(() => {
      seconds++;
      setRecordingTime(seconds);
      
      if (seconds >= 30) {
        clearInterval(countInterval);
        stopVideoRecording();
      }
    }, 1000);
  };
  
  // Detener grabación de video
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Capturar foto
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convertir a base64
      const photoData = canvas.toDataURL('image/jpeg');
      
      // Aquí enviaríamos la foto al servidor
      // Por ahora, simulamos la subida
      toast({
        title: 'Foto capturada',
        description: 'Imagen guardada correctamente',
      });
    }
  };
  
  // Manejar escaneo de QR
  const handleQrScan = (data: string) => {
    if (!data) return;
    
    // Obtener ubicación para verificar dónde se escaneó el QR
    getCurrentLocation();
    
    toast({
      title: 'Código QR escaneado',
      description: 'Verificación de ubicación completada',
    });
    
    // Ocultar el escáner
    setShowQrScanner(false);
    
    // Actualizar el estado de la asignación
    updateAssignmentStatus('verified');
  };
  
  // Manejar grabación de audio
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(mediaChunksRef.current, { type: 'audio/webm' });
        
        // Aquí enviaríamos el audio al servidor
        // Por ahora, simulamos la subida
        toast({
          title: 'Audio grabado',
          description: 'Nota de voz guardada correctamente',
        });
        
        // Detener todos los tracks del stream
        stream.getTracks().forEach(track => track.stop());
        setAudioRecording(false);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setAudioRecording(true);
    } catch (error) {
      console.error('Error al grabar audio:', error);
      toast({
        title: 'Error de grabación',
        description: 'No se pudo acceder al micrófono',
        variant: 'destructive'
      });
    }
  };
  
  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && audioRecording) {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Actualizar estado de la asignación
  const updateAssignmentStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      // Enviar actualización al servidor
      const response = await fetch(`/api/assignments/${assignment.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          notes,
          location: locationData
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }
      
      const updatedAssignment = await response.json();
      
      // Actualizar el estado local
      setStatus(newStatus);
      
      // Notificar al componente padre
      onUpdate(updatedAssignment);
      
      toast({
        title: 'Estado actualizado',
        description: 'La asignación ha sido actualizada correctamente',
      });
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Efectos para manejar la cámara
  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [showCamera, mediaType]);
  
  // Manejar limpieza al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
      if (isRecording) {
        stopVideoRecording();
      }
      if (audioRecording) {
        stopAudioRecording();
      }
    };
  }, [isRecording, audioRecording]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Detalles de la Asignación</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Información del cliente y alarma */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className={`px-2 py-1 text-xs rounded-full ${
                assignment.priority === 'high' ? 'bg-red-100 text-red-800' : 
                assignment.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 
                'bg-blue-100 text-blue-800'
              }`}>
                {assignment.priority === 'high' ? 'Alta Prioridad' : 
                 assignment.priority === 'medium' ? 'Media Prioridad' : 'Baja Prioridad'}
              </div>
              <div className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                {assignment.alarmType === 'intrusion' ? 'Intrusión' :
                 assignment.alarmType === 'fire' ? 'Incendio' :
                 assignment.alarmType === 'panic' ? 'Pánico' : 
                 assignment.alarmType === 'medical' ? 'Médica' : 'Alarma'}
              </div>
            </div>
            
            <h3 className="text-xl font-bold">{assignment.clientName}</h3>
            <p className="text-sm text-gray-600">Cuenta: #{assignment.alarmDetails?.clientId || 'N/A'}</p>
            
            <div className="flex items-center text-gray-700">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm">{assignment.clientAddress}</span>
            </div>
            
            <div className="flex items-center text-gray-700">
              <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm">Tiempo transcurrido: <span className={
                elapsedTime.startsWith('0') || parseInt(elapsedTime) < 20 ? 'text-green-600' :
                parseInt(elapsedTime) < 30 ? 'text-amber-600' : 'text-red-600'
              }>{elapsedTime || '0m 0s'}</span></span>
            </div>
          </div>
          
          {/* Estado actual */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Estado actual:</span>
              <span className={`text-sm font-bold ${
                status === 'assigned' ? 'text-blue-600' :
                status === 'accepted' ? 'text-indigo-600' :
                status === 'arrived' ? 'text-amber-600' :
                status === 'verified' ? 'text-teal-600' :
                status === 'completed' ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {status === 'assigned' ? 'Asignado' :
                 status === 'accepted' ? 'Aceptado' :
                 status === 'arrived' ? 'En sitio' :
                 status === 'verified' ? 'Verificado' :
                 status === 'completed' ? 'Completado' :
                 status}
              </span>
            </div>
          </div>
          
          {/* Acciones basadas en el estado */}
          <div className="space-y-3">
            {status === 'assigned' && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={() => updateAssignmentStatus('accepted')}
                disabled={loading}
              >
                Aceptar Asignación
              </Button>
            )}
            
            {status === 'accepted' && (
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700" 
                onClick={() => {
                  getCurrentLocation();
                  updateAssignmentStatus('arrived');
                }}
                disabled={loading}
              >
                Registrar Llegada
              </Button>
            )}
            
            {status === 'arrived' && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => setShowQrScanner(true)}
                disabled={loading}
              >
                Escanear QR de Verificación
              </Button>
            )}
            
            {status === 'verified' && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => updateAssignmentStatus('completed')}
                disabled={loading}
              >
                Completar Asignación
              </Button>
            )}
          </div>
          
          {/* Sección de documentación y evidencias */}
          {(status === 'arrived' || status === 'verified') && (
            <div className="space-y-3">
              <h3 className="text-md font-semibold">Documentación</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    setMediaType('photo');
                    setShowCamera(true);
                  }}
                >
                  <Camera className="h-4 w-4" />
                  <span>Tomar Foto</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    setMediaType('video');
                    setShowCamera(true);
                  }}
                >
                  <Video className="h-4 w-4" />
                  <span>Grabar Video</span>
                </Button>
              </div>
              
              {/* Notas de texto */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas:</label>
                <Textarea
                  placeholder="Escribe detalles de la inspección..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              {/* Notas de voz */}
              <Button 
                variant={audioRecording ? "destructive" : "outline"}
                className="w-full flex items-center justify-center gap-2"
                onClick={audioRecording ? stopAudioRecording : startAudioRecording}
              >
                {audioRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    <span>Detener Grabación</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    <span>Grabar Nota de Voz</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        {/* Cámara */}
        {showCamera && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-black text-white">
              <h3>{mediaType === 'photo' ? 'Tomar Foto' : 'Grabar Video'}</h3>
              <Button variant="ghost" size="sm" className="text-white" onClick={() => setShowCamera(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center">
                  <span className="animate-pulse mr-2">●</span>
                  <span>{recordingTime}s / 30s</span>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-black">
              {mediaType === 'photo' ? (
                <Button 
                  className="w-full bg-white text-black hover:bg-gray-200"
                  onClick={capturePhoto}
                >
                  Capturar Foto
                </Button>
              ) : (
                <Button 
                  className={`w-full ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-white text-black hover:bg-gray-200'}`}
                  onClick={isRecording ? stopVideoRecording : startVideoRecording}
                >
                  {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Escáner QR */}
        {showQrScanner && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-black text-white">
              <h3>Escanear Código QR</h3>
              <Button variant="ghost" size="sm" className="text-white" onClick={() => setShowQrScanner(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              {/* Aquí integraríamos un escáner de QR */}
              <div className="text-white text-center p-6">
                <p>Simulación de escáner QR</p>
                <Button 
                  className="mt-4 bg-white text-black hover:bg-gray-200"
                  onClick={() => handleQrScan('cliente-123')}
                >
                  Simular Escaneo Exitoso
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard del Supervisor
function SupervisorDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const { speak } = useSpeech();
  const { addListener, removeListener } = useSocket();
  
  // Verificar sesión al cargar
  useEffect(() => {
    const checkSessionExpiry = () => {
      const expiryTimeStr = localStorage.getItem('sessionExpiry');
      if (!expiryTimeStr) {
        // No hay información de expiración, redirigir al login
        logout();
        return;
      }
      
      const expiryTime = new Date(expiryTimeStr);
      if (expiryTime <= new Date()) {
        // Sesión expirada
        toast({
          title: 'Sesión expirada',
          description: 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.',
        });
        logout();
      }
    };
    
    checkSessionExpiry();
    
    // Verificar la expiración cada minuto
    const intervalId = setInterval(checkSessionExpiry, 60000);
    return () => clearInterval(intervalId);
  }, []);
  
  // Configurar sesión de 12 horas al iniciar
  useEffect(() => {
    if (user?.id) {
      // Llamar al endpoint para establecer duración de sesión
      fetch('/api/auth/set-session-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 12 * 60 * 60 * 1000 }) // 12 horas en ms
      })
      .then(res => {
        if (res.ok) {
          console.log('Sesión configurada para 12 horas');
        }
      })
      .catch(err => console.error('Error al configurar sesión:', err));
    }
  }, [user]);
  
  // Configurar listeners para WebSocket
  useEffect(() => {
    // Manejar notificaciones de nuevas asignaciones
    const handleAssignment = (data: any) => {
      // Verificar si la asignación es para este supervisor
      if (data.supervisorId === user?.id) {
        // Mostrar notificación
        toast({
          title: 'Nueva Asignación',
          description: `Has sido asignado a una alarma en ${data.clientName || 'Cliente'}`,
        });
        
        // Reproducir mensaje de voz
        speak(`Has recibido una nueva asignación. Alarma de ${data.alarmType || 'tipo desconocido'} en ${data.clientName || 'Cliente'}`);
        
        // Refrescar datos
        queryClient.invalidateQueries({ queryKey: ['/api/assignments/active'] });
      }
    };
    
    // Registrar listener
    const unsubscribe = addListener('PATROL_ASSIGNMENT', handleAssignment);
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, addListener, speak]);
  
  // Función de cierre de sesión
  const logout = () => {
    localStorage.removeItem('sessionExpiry');
    setLocation('/supervisor-app/login');
    // Llamar al endpoint de logout
    fetch('/api/auth/logout', { method: 'POST' })
      .catch(err => console.error('Error en logout:', err));
  };

  // Cargar asignaciones activas del supervisor
  const { data: activeAssignments = [], isLoading: loadingAssignments, refetch } = useQuery({
    queryKey: ['/api/assignments/active', user?.id],
    enabled: !!user?.id
  });
  
  // Manejar actualización de asignación
  const handleAssignmentUpdate = (updatedAssignment: any) => {
    // Cerrar el detalle
    setSelectedAssignment(null);
    
    // Refrescar la lista de asignaciones
    refetch();
    
    // Mostrar mensaje de confirmación
    toast({
      title: 'Asignación actualizada',
      description: 'El estado de la asignación ha sido actualizado correctamente',
    });
  };

  // Verificar si el usuario está autenticado y es supervisor
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || user.role !== UserRole.SUPERVISOR) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Acceso no autorizado</h1>
        <p className="text-gray-600 mb-6 text-center">
          Debes ser un supervisor para acceder a esta página.
        </p>
        <Button onClick={() => setLocation('/supervisor-app/login')}>
          Ir a inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Hola, {user.firstName || user.username}
          </h1>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="home" className="space-y-4 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Estado Actual</CardTitle>
                <CardDescription>Resumen de tus actividades del día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-600 mr-2" />
                      <span>Tiempo en servicio</span>
                    </div>
                    <span className="font-semibold">8h 30m</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-green-600 mr-2" />
                      <span>Alarmas atendidas</span>
                    </div>
                    <span className="font-semibold">
                      {Array.isArray(activeAssignments) ? 
                        activeAssignments.filter(a => a.status === 'completed').length : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="font-semibold text-lg mt-6 mb-3">Asignaciones activas</h2>
            
            {loadingAssignments ? (
              <div className="text-center py-6 text-gray-500">Cargando asignaciones...</div>
            ) : !Array.isArray(activeAssignments) || activeAssignments.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-lg shadow">
                No tienes asignaciones activas en este momento
              </div>
            ) : (
              <div className="space-y-3">
                {activeAssignments.map((assignment: any) => (
                  <Card 
                    key={assignment.id} 
                    className="overflow-hidden cursor-pointer"
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <div className={`h-2 ${
                      assignment.priority === 'high' ? 'bg-red-500' : 
                      assignment.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{assignment.clientName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              assignment.status === 'accepted' ? 'bg-indigo-100 text-indigo-800' :
                              assignment.status === 'arrived' ? 'bg-amber-100 text-amber-800' :
                              assignment.status === 'verified' ? 'bg-teal-100 text-teal-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {assignment.status === 'assigned' ? 'Asignado' :
                               assignment.status === 'accepted' ? 'Aceptado' :
                               assignment.status === 'arrived' ? 'En sitio' :
                               assignment.status === 'verified' ? 'Verificado' :
                               assignment.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(assignment.assignedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {assignment.clientAddress}
                          </p>
                        </div>
                        <Button size="sm" className="flex items-center gap-1">
                          Ver <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Mis Informes</CardTitle>
                <CardDescription>Reportes creados y pendientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-amber-800 mb-2 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Informes pendientes
                    </h3>
                    <p className="text-sm text-amber-700">
                      Tienes 2 alarmas atendidas que requieren completar informe
                    </p>
                    <Button className="mt-3 bg-amber-600 hover:bg-amber-700 text-sm">
                      Completar informes
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Informes recientes</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center justify-between">
                        <span>Alarma en Banco Central - 15/05/2023</span>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Alarma en Supermercado Norte - 12/05/2023</span>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>Preferencias de la aplicación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Notificaciones</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm">Alertas de voz</span>
                        <p className="text-xs text-gray-500">Escuchar alertas por voz al recibir asignaciones</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm">Vibración</span>
                        <p className="text-xs text-gray-500">Vibrar al recibir notificaciones importantes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Aplicación</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm">Modo oscuro</span>
                        <p className="text-xs text-gray-500">Cambiar entre tema claro y oscuro</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm">Usar ubicación en segundo plano</span>
                        <p className="text-xs text-gray-500">Permitir reportar ubicación mientras la app está en segundo plano</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <h3 className="text-sm font-medium">Información de contacto</h3>
                    <p className="text-sm">Para soporte técnico:</p>
                    <p className="text-sm text-gray-500">soporte@patrullasapp.com</p>
                    <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Barra de navegación inferior */}
      <nav className="bg-white border-t border-gray-200 flex items-center justify-around p-2 pt-3 pb-6">
        <Button 
          variant={activeTab === 'home' ? 'default' : 'ghost'} 
          className="flex-col items-center gap-1 h-auto py-2"
          onClick={() => setActiveTab('home')}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Inicio</span>
        </Button>
        
        <Button 
          variant={activeTab === 'reports' ? 'default' : 'ghost'} 
          className="flex-col items-center gap-1 h-auto py-2"
          onClick={() => setActiveTab('reports')}
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs">Informes</span>
        </Button>
        
        <Button 
          variant={activeTab === 'settings' ? 'default' : 'ghost'} 
          className="flex-col items-center gap-1 h-auto py-2"
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">Ajustes</span>
        </Button>
      </nav>
      
      {/* Modal de detalle de asignación */}
      {selectedAssignment && (
        <AssignmentDetail 
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onUpdate={handleAssignmentUpdate}
        />
      )}
    </div>
  );
}

// Componente principal que decide qué vista mostrar
export default function SupervisorApp() {
  const [match, params] = useRoute('/supervisor-app/:view');
  const view = match ? params.view : 'login';
  
  switch (view) {
    case 'dashboard':
      return <SupervisorDashboard />;
    case 'login':
    default:
      return <SupervisorLogin />;
  }
}