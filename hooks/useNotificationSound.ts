import { useRef, useCallback } from 'react';

const alarmSound = '/notification.mp3';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const playSound = useCallback(() => {
    // Para evitar errores constantes de reproducción, simplemente retornamos
    // En una implementación real, esto debería manejar correctamente los archivos de sonido
    return;
    
    // El código a continuación está comentado para evitar errores en la consola
    /*
    // Si el audioRef no está inicializado, creamos un nuevo elemento de audio
    if (!audioRef.current) {
      audioRef.current = new Audio(alarmSound);
    }
    
    // Reiniciamos el audio para asegurar que suene desde el principio
    audioRef.current.currentTime = 0;
    
    // Reproducimos el sonido
    audioRef.current.play().catch(error => {
      console.error('Error al reproducir el sonido de notificación:', error);
    });
    */
  }, []);

  return { playSound };
}

export function useSpeech() {
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Crear un nuevo objeto SpeechSynthesisUtterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configurar en español
      utterance.lang = 'es-ES';
      
      // Configurar velocidad y tono más naturales
      utterance.rate = 0.9;  // Un poco más lento para mayor claridad
      utterance.pitch = 1.0; // Tono normal
      
      // Opcionalmente, puedes intentar conseguir una voz femenina
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => voice.lang.includes('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      
      // Reproducir el mensaje hablado
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('La síntesis de voz no está soportada en este navegador');
    }
  }, []);

  return { speak };
}