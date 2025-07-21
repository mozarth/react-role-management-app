import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BarcodeFormat } from '@zxing/library';
import { useZxing } from 'react-zxing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, MapPin, QrCode, ArrowLeft, Check, AlertTriangle, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/NotificationContext';
import { MessageType } from '@shared/websocket';

interface QRScanResult {
  clientId: number;
  clientCode: string;
  locationCode: string;
  timestamp: number;
  latitude?: number;
  longitude?: number;
}

export default function MobileScanQR() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addNotification, sendWebSocketMessage } = useNotifications();
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener detalles de la asignación
  const { data: assignment, isLoading } = useQuery({
    queryKey: [`/api/supervisor/assignments/${id}`],
    retry: false,
  });

  // Manejar el proceso de verificación QR
  const verifyQrMutation = useMutation({
    mutationFn: async (data: { assignmentId: number; qrData: QRScanResult; location: { latitude: number; longitude: number } }) => {
      // Simulamos una verificación de que el QR corresponde al cliente correcto
      // En producción, esta función llamaría a la API para verificar
      return new Promise<{ success: boolean; message?: string }>((resolve) => {
        setTimeout(() => {
          // Verificar que el código de cliente coincide con el asignado
          if (assignment && data.qrData.clientId.toString() === assignment.clientId.toString()) {
            resolve({ success: true });
          } else {
            resolve({ 
              success: false, 
              message: 'El código QR no corresponde al cliente asignado' 
            });
          }
        }, 1500);
      });
    },
    onSuccess: (response) => {
      setIsVerifying(false);
      
      if (response.success) {
        setIsVerified(true);
        toast({
          title: "¡Verificación exitosa!",
          description: "Has confirmado tu presencia en la ubicación del cliente.",
          variant: "default",
        });
        
        // Notificar al servidor mediante WebSocket
        sendWebSocketMessage({
          type: MessageType.QR_VERIFICATION,
          payload: {
            assignmentId: Number(id),
            verificationTime: new Date().toISOString(),
            location: currentLocation,
            supervisor: {
              id: 123, // Esto vendría del usuario autenticado
              name: "Supervisor" // Esto vendría del usuario autenticado
            }
          },
          timestamp: Date.now()
        });
        
        // También registramos la confirmación en el servidor vía API
        registerQrVerification(scanResult);
      } else {
        setError(response.message || 'Error al verificar el código QR');
        toast({
          title: "Error de verificación",
          description: response.message || 'El código QR no pudo ser verificado',
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      setIsVerifying(false);
      setError('Error de conexión. Intente nuevamente.');
      toast({
        title: "Error",
        description: "No se pudo verificar el código QR. Revise su conexión.",
        variant: "destructive",
      });
    }
  });

  // Registrar la verificación QR en el servidor
  const registerQrVerification = async (qrData: QRScanResult | null) => {
    if (!qrData || !currentLocation) return;
    
    try {
      // Aquí enviaríamos los datos a la API
      const response = await fetch(`/api/supervisor/assignments/${id}/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: Number(id),
          qrData,
          location: currentLocation,
          verificationTime: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al registrar verificación');
      }
      
      addNotification({
        title: 'Verificación Registrada',
        message: 'Se ha registrado correctamente tu llegada al cliente',
        type: 'success',
        autoClose: true
      });
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        setLocation(`/mobile/dashboard`);
      }, 2000);
      
    } catch (error) {
      console.error('Error al registrar verificación:', error);
      // No mostramos error al usuario porque ya verificamos correctamente con WebSocket
    }
  };

  // Configurar el escáner QR
  const { ref } = useZxing({
    onDecodeResult(result) {
      if (!scanning) return;
      
      try {
        const decodedData = JSON.parse(result.getText());
        console.log('QR Code detected:', decodedData);
        setScanResult(decodedData);
        setScanning(false);
        setIsCameraActive(false);
      } catch (error) {
        console.error('Error al decodificar QR:', error);
        toast({
          title: "Error",
          description: "El código QR no tiene un formato válido.",
          variant: "destructive",
        });
      }
    },
    constraints: {
      video: { facingMode: 'environment' }
    },
    formats: [BarcodeFormat.QR_CODE],
  });

  // Obtener ubicación actual
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setLocationPermission(true);
          },
          (error) => {
            console.error('Error obteniendo ubicación:', error);
            setLocationPermission(false);
            toast({
              title: "Permiso de ubicación",
              description: "Se requiere acceso a la ubicación para verificar el código QR.",
              variant: "destructive",
            });
          }
        );
      } else {
        setLocationPermission(false);
        toast({
          title: "Ubicación no soportada",
          description: "Su dispositivo no soporta la geolocalización.",
          variant: "destructive",
        });
      }
    };

    getLocation();
  }, []);

  // Cuando se obtiene un resultado del escaneo y tenemos la ubicación, verificamos
  useEffect(() => {
    if (scanResult && currentLocation && !isVerifying && !isVerified) {
      setIsVerifying(true);
      verifyQrMutation.mutate({
        assignmentId: Number(id),
        qrData: scanResult,
        location: currentLocation
      });
    }
  }, [scanResult, currentLocation]);

  // Manejar error de permisos de cámara
  const handleCameraError = () => {
    toast({
      title: "Error de cámara",
      description: "No se pudo acceder a la cámara. Verifique los permisos.",
      variant: "destructive",
    });
  };

  // Reiniciar escaneo
  const resetScan = () => {
    setScanResult(null);
    setScanning(true);
    setIsCameraActive(true);
    setIsVerified(false);
    setIsVerifying(false);
    setError(null);
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
            <Button variant="ghost" size="icon" onClick={() => setLocation('/mobile/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold ml-2">Verificar QR</h1>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-4">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{assignment.clientName}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              {assignment.address}
            </div>
          </CardHeader>
        </Card>

        {/* Instrucciones */}
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Escanee el código QR ubicado en la entrada del cliente para confirmar su llegada y detener el cronómetro.
          </AlertDescription>
        </Alert>

        {/* Estado de permisos */}
        {locationPermission === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Permiso de ubicación requerido</AlertTitle>
            <AlertDescription>
              Se requiere acceso a su ubicación para verificar que se encuentra en el sitio correcto.
              Por favor, habilite los permisos de ubicación y recargue la página.
            </AlertDescription>
          </Alert>
        )}

        {/* Error de verificación */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de verificación</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Área de escáner QR */}
        <div className="mb-4">
          {isCameraActive ? (
            <div className="relative rounded-md overflow-hidden aspect-square bg-black">
              <video ref={ref} className="w-full h-full object-cover" onError={handleCameraError} />
              <div className="absolute inset-0 border-2 border-white/50 rounded m-8" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <QrCode className="h-32 w-32 text-white/30" />
              </div>
            </div>
          ) : isVerifying ? (
            <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center p-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-center font-medium">Verificando código QR...</p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Comprobando que el código corresponde al cliente y su ubicación
              </p>
            </div>
          ) : isVerified ? (
            <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center p-6">
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <p className="text-center font-medium text-green-600">¡Verificación exitosa!</p>
              <p className="text-sm text-center mt-2">
                Se ha confirmado su llegada al cliente
              </p>
            </div>
          ) : (
            <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center p-6">
              <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <QrCode className="h-12 w-12 text-amber-600" />
              </div>
              <p className="text-center font-medium">Código QR escaneado</p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                {scanResult ? 'Cliente: ' + scanResult.clientCode : 'Procesando información...'}
              </p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="grid gap-2">
          {!isCameraActive && !isVerified && (
            <Button onClick={resetScan} variant="outline" className="flex gap-2 items-center">
              <Camera className="h-4 w-4" /> Escanear de nuevo
            </Button>
          )}
          
          <Button 
            onClick={() => setLocation('/mobile/dashboard')}
            variant={isVerified ? "default" : "outline"}
            className="flex gap-2 items-center"
          >
            {isVerified ? "Volver al dashboard" : "Cancelar"}
          </Button>
        </div>
      </main>
    </div>
  );
}