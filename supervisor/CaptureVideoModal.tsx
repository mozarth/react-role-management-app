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
import { Video, Square, Save, Timer } from "lucide-react";

interface CaptureVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any | null;
}

const CaptureVideoModal: React.FC<CaptureVideoModalProps> = ({ isOpen, onClose, assignment }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const MAX_RECORDING_SECONDS = 30; // Maximum 30 seconds for recording
  
  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      setVideoData(null);
      setIsRecording(false);
      setRecordingDuration(0);
      stopCamera();
    }
    
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
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
      
      // Get camera access with audio
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" },
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Setup MediaRecorder
        try {
          const mediaRecorder = new MediaRecorder(stream);
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              videoChunksRef.current.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(videoBlob);
            setVideoData(videoUrl);
            
            // Reset chunks for next recording
            videoChunksRef.current = [];
            
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
            
            setIsRecording(false);
          };
          
          mediaRecorderRef.current = mediaRecorder;
        } catch (err) {
          console.error("Error setting up MediaRecorder:", err);
          setError("No se pudo inicializar la grabación de video.");
        }
        
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
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };
  
  // Start recording
  const startRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    try {
      // Clear existing video data if any
      setVideoData(null);
      setRecordingDuration(0);
      
      // Start recording
      videoChunksRef.current = [];
      mediaRecorderRef.current.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
      
      // Setup timer to track duration and stop at max
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          
          // Stop recording at max duration
          if (newDuration >= MAX_RECORDING_SECONDS && mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
          }
          
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Error al iniciar la grabación. Inténtelo de nuevo.");
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };
  
  // Format seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Save video mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!assignment || !videoData) return null;
      
      // In a real implementation, we would upload the video to the server
      // and create a report entry
      const formData = new FormData();
      formData.append('assignmentId', assignment.id.toString());
      
      // Fetch video data and convert to blob
      const response = await fetch(videoData);
      const blob = await response.blob();
      formData.append('video', blob, 'video.webm');
      
      // For this demo, we'll just simulate success
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      toast({
        title: "Video guardado",
        description: "El video ha sido guardado correctamente.",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el video. Inténtelo de nuevo.",
      });
    }
  });
  
  // Save captured video
  const handleSave = () => {
    saveMutation.mutate();
  };
  
  // Reset video and back to recording mode
  const resetVideo = () => {
    setVideoData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Grabar Video (máx. 30 segundos)
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {hasCamera && (
            <div className="relative h-64 bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
              {!videoData ? (
                <>
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted // Mute preview to avoid feedback
                  ></video>
                  
                  {isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner className="text-white" />
                    </div>
                  )}
                  
                  {isRecording && (
                    <div className="absolute top-2 right-2 flex items-center bg-red-500 text-white px-2 py-1 rounded-md text-sm">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                      {formatDuration(recordingDuration)} / {formatDuration(MAX_RECORDING_SECONDS)}
                    </div>
                  )}
                </>
              ) : (
                <video 
                  ref={videoPlaybackRef}
                  src={videoData}
                  className="absolute inset-0 w-full h-full object-contain"
                  controls
                  autoPlay
                ></video>
              )}
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          {videoData ? (
            <>
              <Button 
                variant="outline" 
                onClick={resetVideo}
              >
                <Video className="h-4 w-4 mr-2" />
                Grabar de nuevo
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                <Save className="h-4 w-4 mr-2" />
                Guardar Video
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              
              {isRecording ? (
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Detener ({MAX_RECORDING_SECONDS - recordingDuration}s)
                </Button>
              ) : (
                <Button 
                  onClick={startRecording}
                  disabled={isCapturing || !hasCamera}
                  variant="default"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Iniciar Grabación
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CaptureVideoModal;
