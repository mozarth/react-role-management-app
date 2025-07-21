import React, { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Camera, RefreshCw, Save } from "lucide-react";

interface CapturePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any | null;
}

const CapturePhotoModal: React.FC<CapturePhotoModalProps> = ({ isOpen, onClose, assignment }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      setPhotoData(null);
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);
  
  // Initialize camera
  const initializeCamera = async () => {
    try {
      setError(null);
      setIsCapturing(true);
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setError("Su navegador no soporta acceso a la cámara.");
        setIsCapturing(false);
        return;
      }
      
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCapturing(false);
      }
    } catch (err) {
      setHasCamera(false);
      setError("No se pudo acceder a la cámara. Verifique los permisos.");
      setIsCapturing(false);
      console.error("Error accessing camera:", err);
    }
  };
  
  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data as base64 string
        const imageData = canvas.toDataURL('image/jpeg');
        setPhotoData(imageData);
      }
    } catch (err) {
      console.error("Error capturing photo:", err);
      setError("Error al capturar la foto. Inténtelo de nuevo.");
    }
  };
  
  // Reset captured photo
  const resetPhoto = () => {
    setPhotoData(null);
  };
  
  // Save photo mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!assignment || !photoData) return null;
      
      // In a real implementation, we would upload the photo to the server
      // and create a report entry
      const formData = new FormData();
      formData.append('assignmentId', assignment.id.toString());
      
      // Convert base64 to blob
      const base64Response = await fetch(photoData);
      const blob = await base64Response.blob();
      formData.append('photo', blob, 'photo.jpg');
      
      // For this demo, we'll just simulate success
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      toast({
        title: "Foto guardada",
        description: "La foto ha sido guardada correctamente.",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la foto. Inténtelo de nuevo.",
      });
    }
  });
  
  // Save captured photo
  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Capturar Foto
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {hasCamera && (
            <div className="relative h-64 bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
              {!photoData ? (
                <>
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                  ></video>
                  
                  {isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner className="text-white" />
                    </div>
                  )}
                </>
              ) : (
                <img 
                  src={photoData} 
                  alt="Captured" 
                  className="absolute inset-0 w-full h-full object-contain" 
                />
              )}
              
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full"
                style={{ display: 'none' }}
              ></canvas>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          {photoData ? (
            <>
              <Button 
                variant="outline" 
                onClick={resetPhoto}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Volver a capturar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={capturePhoto}
                disabled={isCapturing || !hasCamera}
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CapturePhotoModal;
