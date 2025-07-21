import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { MessageType } from '@shared/websocket';
import * as socketService from '@/lib/socket';

/**
 * Hook personalizado para trabajar con WebSockets
 * Provee una interfaz sencilla para enviar y recibir mensajes
 */
export function useSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  
  // Inicializar la conexión WebSocket cuando se carga el usuario
  useEffect(() => {
    if (user) {
      console.log('Inicializando WebSocket con credenciales de usuario:', user.id, user.role);
      socketService.setUserCredentials(user.id, user.role);
      
      // Suscribirse a cambios de estado de conexión
      const unsubscribe = socketService.addSocketListener('connection_status', (status) => {
        setIsConnected(status.connected);
      });
      
      // Comprobación inicial del estado
      setIsConnected(socketService.isSocketConnected());
      
      return () => {
        unsubscribe();
      };
    }
  }, [user]);
  
  // Función para enviar mensajes a través del WebSocket
  const sendMessage = useCallback((type: MessageType, payload: any) => {
    if (!user) {
      console.warn('No se puede enviar mensaje: Usuario no autenticado');
      return false;
    }
    
    return socketService.sendSocketMessage(type, payload);
  }, [user]);
  
  // Función para suscribirse a mensajes específicos
  const addMessageListener = useCallback((messageType: MessageType, callback: (data: any) => void) => {
    return socketService.addSocketListener(messageType, callback);
  }, []);
  
  return {
    isConnected,
    socket: socketService,
    sendMessage,
    addMessageListener,
    MessageType,
  };
}