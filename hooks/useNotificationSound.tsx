import { useEffect, useState } from "react";
import { MessageType } from '../lib/constants';

// Sonidos de notificación
const NOTIFICATION_SOUNDS = {
  alarm: "/sounds/alarm.mp3",
  dispatch: "/sounds/dispatch.mp3",
  info: "/sounds/notification.mp3",
};

export function useNotificationSound() {
  const [sound, setSound] = useState<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Crear elementos de audio para cada tipo de notificación
    const alarmSound = new Audio(NOTIFICATION_SOUNDS.alarm);
    const dispatchSound = new Audio(NOTIFICATION_SOUNDS.dispatch);
    const infoSound = new Audio(NOTIFICATION_SOUNDS.info);
    
    // Precargar los sonidos
    alarmSound.load();
    dispatchSound.load();
    infoSound.load();
    
    // Manejar evento personalizado de notificación
    const handleCustomNotification = (event: CustomEvent) => {
      const { type, payload } = event.detail;
      
      console.log('Reproduciendo sonido para notificación:', type);
      
      if (type === MessageType.NEW_ALARM) {
        alarmSound.play().catch(e => console.error('Error reproduciendo sonido de alarma:', e));
      } else if (type === MessageType.DISPATCH_REQUEST) {
        dispatchSound.play().catch(e => console.error('Error reproduciendo sonido de despacho:', e));
      } else if (type === MessageType.NOTIFICATION) {
        // Verificar el tipo de notificación para reproducir el sonido apropiado
        if (payload?.notificationType === 'alarm') {
          alarmSound.play().catch(e => console.error('Error reproduciendo sonido de alarma:', e));
        } else if (payload?.notificationType === 'dispatch') {
          dispatchSound.play().catch(e => console.error('Error reproduciendo sonido de despacho:', e));
        } else {
          infoSound.play().catch(e => console.error('Error reproduciendo sonido de notificación:', e));
        }
      }
    };
    
    // También manejar el evento legacy 'notification' para compatibilidad
    const handleLegacyNotification = (event: CustomEvent) => {
      const { type } = event.detail;
      
      if (type === "alarm") {
        alarmSound.play().catch(e => console.error('Error reproduciendo sonido de alarma:', e));
      } else if (type === "dispatch") {
        dispatchSound.play().catch(e => console.error('Error reproduciendo sonido de despacho:', e));
      } else {
        infoSound.play().catch(e => console.error('Error reproduciendo sonido de notificación:', e));
      }
    };
    
    // Escuchar eventos de notificación
    window.addEventListener("websocket-notification", handleCustomNotification as EventListener);
    window.addEventListener("notification", handleLegacyNotification as EventListener);
    
    return () => {
      // Limpiar listeners cuando el componente se desmonte
      window.removeEventListener("websocket-notification", handleCustomNotification as EventListener);
      window.removeEventListener("notification", handleLegacyNotification as EventListener);
    };
  }, []);
  
  return sound;
}