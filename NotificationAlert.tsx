import React, { useState, useEffect } from 'react';
import { AlertCircle, Bell, X } from 'lucide-react';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface NotificationAlertProps {
  title: string;
  message: string;
  type?: 'alarm' | 'dispatch' | 'info';
  duration?: number;
  onClose?: () => void;
  onAction?: () => void;
  actionText?: string;
}

// Componente para mostrar una alerta de notificación con sonido
export function NotificationAlert({
  title,
  message,
  type = 'info',
  duration = 8000, // 8 segundos por defecto
  onClose,
  onAction,
  actionText = 'Ver detalles',
}: NotificationAlertProps) {
  const [visible, setVisible] = useState(true);
  const { play } = useNotificationSound({ volume: 0.7 });
  
  // Reproducir sonido cuando se muestra la alerta
  useEffect(() => {
    if (visible) {
      play();
      
      // También podemos reproducir una voz sintetizada
      const speech = new SpeechSynthesisUtterance(
        type === 'alarm' 
          ? 'Nueva alarma recibida' 
          : type === 'dispatch' 
            ? 'Nueva solicitud de despacho' 
            : 'Nueva notificación'
      );
      speech.lang = 'es-ES';
      window.speechSynthesis.speak(speech);
      
      // Temporizador para cerrar automáticamente si duration > 0
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [visible, type, play, duration]);
  
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };
  
  const handleAction = () => {
    if (onAction) onAction();
    handleClose();
  };
  
  if (!visible) return null;
  
  // Determinar el color según el tipo de notificación
  const getTypeStyles = () => {
    switch (type) {
      case 'alarm':
        return 'bg-red-500 text-white border-red-700';
      case 'dispatch':
        return 'bg-amber-500 text-white border-amber-700';
      default:
        return 'bg-blue-500 text-white border-blue-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce-in max-w-sm w-full">
      <Card className={`border-2 shadow-lg ${getTypeStyles()}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {type === 'alarm' ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Bell className="h-5 w-5" />
              )}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="text-white hover:text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-white/90 mt-1">
            {message}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2 flex justify-end gap-2">
          {onAction && (
            <Button 
              variant="secondary" 
              onClick={handleAction}
              className="text-xs bg-white/20 hover:bg-white/30 text-white"
            >
              {actionText}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}