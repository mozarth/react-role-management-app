import React, { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { QrCode } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (qrCode: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize QR scanner when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      initializeScanner();
    } else {
      setManualCode("");
      setIsScanning(false);
      stopScanner();
    }
  }, [isOpen]);
  
  // Initialize camera and QR scanner
  const initializeScanner = async () => {
    try {
      setError(null);
      
      // Check if QR scanner library is available and browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setError("Su navegador no soporta acceso a la cámara. Ingrese el código manualmente.");
        return;
      }
      
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Start scanning once video is ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            scanQRCode();
          }
        };
      }
    } catch (err) {
      setHasCamera(false);
      setError("No se pudo acceder a la cámara. Verifique los permisos o ingrese el código manualmente.");
      console.error("Error accessing camera:", err);
    }
  };
  
  // Clean up scanner resources
  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  // Scan for QR codes
  const scanQRCode = async () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;
    
    try {
      // In a real implementation, we'd import a QR scanning library like jsQR
      // For this demo, we'll just simulate finding a QR code after a few seconds
      if (isScanning) {
        setTimeout(() => {
          if (isScanning) {
            // Create a simulated QR code result
            const mockQrCode = `CLIENT_${Math.floor(Math.random() * 1000)}`;
            onScan(mockQrCode);
          }
        }, 3000);
      }
      
      // In a real implementation, this would be the scanning loop:
      // 1. Capture frame from video
      // const context = canvasRef.current.getContext('2d');
      // context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      // const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // 2. Process with QR library
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // 3. If code found, call onScan(code.data)
      // if (code) {
      //   onScan(code.data);
      //   return;
      // }
      
      // 4. Request next frame
      // requestAnimationFrame(scanQRCode);
    } catch (err) {
      console.error("Error scanning QR code:", err);
      setError("Error al escanear el código QR. Inténtelo de nuevo o ingrese el código manualmente.");
    }
  };
  
  // Handle manual code submission
  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Escanear Código QR del Cliente
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {hasCamera && (
            <div className="relative h-64 bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
              ></video>
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full"
                style={{ display: 'none' }}
              ></canvas>
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary-500 w-32 h-32 rounded-lg opacity-70"></div>
                  <Spinner className="text-white absolute" />
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              {hasCamera ? 
                "Si el escáner no funciona, puede ingresar el código manualmente:" :
                "Ingrese el código QR manualmente:"}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Ingrese el código QR"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <Button onClick={handleManualSubmit}>
                <QrCode className="h-4 w-4 mr-2" />
                Verificar
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerModal;
