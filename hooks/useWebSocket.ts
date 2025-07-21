import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageType } from '@shared/websocket';

export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
  sender?: {
    userId: number;
    role: string;
  };
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Limpiar cualquier conexión existente
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Crear nueva conexión WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
      setReconnectAttempt(0);
      
      // Enviar mensaje de conexión
      if (socket.readyState === WebSocket.OPEN) {
        const connectMessage = {
          type: MessageType.CLIENT_CONNECTED,
          payload: {
            clientType: 'supervisor_mobile',
            timestamp: new Date().toISOString()
          },
          timestamp: Date.now()
        };
        socket.send(JSON.stringify(connectMessage));
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('WebSocket mensaje recibido:', message);
        setLastMessage(message);
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
      
      // Intentar reconectar con backoff exponencial
      const reconnectDelay = Math.min(1000 * (2 ** reconnectAttempt), 30000);
      console.log(`Intentando reconectar en ${reconnectDelay}ms (intento ${reconnectAttempt + 1})`);
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      reconnectTimerRef.current = setTimeout(() => {
        setReconnectAttempt(prev => prev + 1);
        connect();
      }, reconnectDelay);
    };

    socket.onerror = (error) => {
      console.error('Error de WebSocket:', error);
    };
  }, [reconnectAttempt]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está conectado');
    }
  }, []);

  // Conectar al montar el componente
  useEffect(() => {
    connect();

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);

  return { isConnected, lastMessage, sendMessage };
}