import { useState, useCallback } from 'react';

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  
  const speak = useCallback((text: string, options: SpeechSynthesisUtterance | {
    lang?: string;
    volume?: number;
    rate?: number;
    pitch?: number;
  } = {}) => {
    // Verificar si el navegador soporta síntesis de voz
    if (!('speechSynthesis' in window)) {
      console.error('La síntesis de voz no es soportada por este navegador.');
      return false;
    }
    
    // Cancelar cualquier mensaje hablado anterior
    window.speechSynthesis.cancel();
    
    // Crear nueva instancia de utterance
    const utterance = options instanceof SpeechSynthesisUtterance 
      ? options 
      : new SpeechSynthesisUtterance(text);
    
    // Si se proporcionaron opciones como objeto, configurar la utterance
    if (options && !(options instanceof SpeechSynthesisUtterance)) {
      // Configurar idioma (español por defecto)
      utterance.lang = options.lang || 'es-ES';
      
      // Otras configuraciones opcionales
      if (options.volume !== undefined) utterance.volume = options.volume;
      if (options.rate !== undefined) utterance.rate = options.rate;
      if (options.pitch !== undefined) utterance.pitch = options.pitch;
      
      // Si no se pasó el texto como parte de las opciones, establecerlo
      if (!utterance.text) {
        utterance.text = text;
      }
    }
    
    // Gestionar eventos
    utterance.onstart = () => {
      setSpeaking(true);
    };
    
    utterance.onend = () => {
      setSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Error en síntesis de voz:', event);
      setSpeaking(false);
    };
    
    // Iniciar la síntesis
    window.speechSynthesis.speak(utterance);
    
    return true;
  }, []);
  
  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);
  
  return {
    speak,
    cancel,
    speaking
  };
}