import { MessageType } from '@shared/websocket';

// Tipo para la función de escucha
type MessageListener = (data: any) => void;

// Tipo para la función que cancela la suscripción
type UnsubscribeFunction = () => void;

// Un mapa para almacenar los listeners
const listeners = new Map<string, Set<MessageListener>>();

// Variables para el websocket
let socket: WebSocket | null = null;
let connected = false;
let reconnectAttempts = 0;
let reconnectInterval: number | null = null;
let userId: number | null = null;
let userRole: string | null = null;

/**
 * Inicializa la conexión WebSocket
 */
export function initSocket(uid?: number, role?: string) {
  if (userId !== null && uid === undefined) {
    // Ya tenemos el ID de usuario, pero no se proporciona uno nuevo
    // Esto significa que estamos reconectando con las credenciales existentes
  } else if (uid !== undefined && role !== undefined) {
    // Actualizar las credenciales
    userId = uid;
    userRole = role;
  } else if (userId === null) {
    // No hay credenciales y no se proporcionan nuevas
    console.warn('No se puede inicializar el socket sin ID de usuario y rol');
    return;
  }
  
  // Limpiar cualquier intervalo de reconexión existente
  if (reconnectInterval !== null) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  
  // Cerrar cualquier socket existente
  if (socket !== null) {
    try {
      socket.close();
    } catch (e) {
      // Ignorar errores al cerrar
    }
  }
  
  try {
    // Crear un nuevo socket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Intentando conectar a WebSocket: ${wsUrl}`);
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket conectado correctamente');
      connected = true;
      reconnectAttempts = 0;
      
      // Enviar mensaje de autenticación
      if (userId !== null && userRole !== null) {
        // Normalizar el rol para coincidir con el servidor
        const normalizedRole = userRole.toLowerCase().trim();
        console.log('Enviando credenciales al WebSocket:', { userId, role: userRole });
        console.log('Rol original:', userRole, '→ Rol normalizado:', normalizedRole);
        
        // Pequeña pausa para asegurar que el socket esté completamente abierto
        setTimeout(() => {
          sendSocketMessage(MessageType.CLIENT_CONNECTED, {
            userId,
            role: normalizedRole
          });
          console.log('Credenciales enviadas al servidor WebSocket');
        }, 300);
      }
      
      // Notificar a los listeners que estamos conectados
      notifyListeners('connection_status', { connected: true });
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket mensaje recibido:', message);
        
        // Notificar a los listeners del tipo específico
        notifyListeners(message.type, message.payload);
        
        // También notificar a los listeners de 'all' para logging o debugging
        notifyListeners('all', message);
        
        // Reproducir sonido para ciertos tipos de mensajes
        if (message.type === MessageType.NEW_ALARM || 
            message.type === MessageType.NOTIFICATION) {
          // Disparar un evento personalizado que puede ser capturado por useNotificationSound
          const notificationEvent = new CustomEvent('websocket-notification', { 
            detail: { 
              type: message.type,
              payload: message.payload
            } 
          });
          window.dispatchEvent(notificationEvent);
        }
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };
    
    socket.onclose = (event) => {
      console.log('WebSocket desconectado', event.code, event.reason);
      connected = false;
      
      // Notificar a los listeners que estamos desconectados
      notifyListeners('connection_status', { connected: false });
      
      // Intentar reconectar con backoff exponencial
      reconnectAttempts++;
      const timeout = Math.min(30000, Math.pow(1.5, reconnectAttempts) * 1000);
      
      console.log(`Intentando reconectar en ${timeout/1000} segundos...`);
      reconnectInterval = window.setTimeout(() => {
        initSocket();
      }, timeout);
    };
    
    socket.onerror = (error) => {
      console.error('Error en WebSocket:', error);
      // No cerrar aquí, el evento onclose se disparará automáticamente
    };
  } catch (error) {
    console.error('Error al inicializar WebSocket:', error);
    connected = false;
    
    // Intentar reconectar después de un retraso
    reconnectInterval = window.setTimeout(() => {
      initSocket();
    }, 5000);
  }
}

/**
 * Notifica a todos los listeners registrados de un tipo específico
 */
function notifyListeners(type: string, data: any) {
  const listenersForType = listeners.get(type);
  if (listenersForType) {
    listenersForType.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error en callback de listener:', error);
      }
    });
  }
}

/**
 * Añade un listener para un tipo específico de mensaje
 */
export function addSocketListener(type: MessageType | string, callback: MessageListener): UnsubscribeFunction {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  
  const listenersSet = listeners.get(type);
  if (listenersSet) {
    listenersSet.add(callback);
  }
  
  // Devuelve una función para eliminar el listener
  return () => {
    const listenersForType = listeners.get(type);
    if (listenersForType) {
      listenersForType.delete(callback);
      
      if (listenersForType.size === 0) {
        listeners.delete(type);
      }
    }
  };
}

/**
 * Alias para mantener compatibilidad con código existente
 */
export const subscribe = addSocketListener;

/**
 * Lista de tipos de mensajes que requieren tratamiento especial (críticos)
 */
const CRITICAL_MESSAGE_TYPES = [
  MessageType.NEW_ALARM, 
  MessageType.DISPATCH_REQUEST, 
  MessageType.NOTIFICATION
];

/**
 * Envía un mensaje a través del WebSocket
 * Para mensajes críticos, implementa envío redundante y manejo especial
 */
export function sendSocketMessage(type: MessageType, payload: any) {
  if (!connected || socket === null || socket.readyState !== WebSocket.OPEN) {
    console.warn('⚠️ No se puede enviar mensaje, WebSocket no está conectado');
    // Programar reintento para mensajes críticos
    if (CRITICAL_MESSAGE_TYPES.includes(type)) {
      console.log('🔄 Mensaje crítico - Programando reintento en 2 segundos');
      setTimeout(() => {
        console.log('🔄 Reintentando envío de mensaje crítico');
        sendSocketMessage(type, payload);
      }, 2000);
    }
    return false;
  }
  
  try {
    const message = {
      type,
      payload,
      timestamp: Date.now()
    };
    
    // Verificar si es un mensaje de despacho para especial manejo
    if (type === MessageType.DISPATCH_REQUEST) {
      console.log('🚨 Enviando solicitud de despacho CRÍTICA');
      
      // Envío normal
      socket.send(JSON.stringify(message));
      
      // Para las solicitudes de despacho, también enviamos como NOTIFICATION
      // para aumentar probabilidad de entrega
      setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          const notificationMessage = {
            type: MessageType.NOTIFICATION,
            payload: {
              title: '🚨 DESPACHO URGENTE REQUERIDO',
              message: `Cliente: ${payload.clientName || 'Cliente ' + payload.clientId} - Requiere atención inmediata`,
              notificationType: 'dispatch',
              priority: 'critical',
              entityId: payload.alarmId,
              entityType: 'alarm'
            },
            timestamp: Date.now()
          };
          socket.send(JSON.stringify(notificationMessage));
          console.log('✅ Mensaje redundante de notificación enviado');
        }
      }, 500);
      
      // También intentar un mensaje dirigido específicamente a despachadores
      setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          const directMessage = {
            type: MessageType.NOTIFICATION,
            payload: {
              title: '🚨 PARA DESPACHADORES: ALERTA CRÍTICA',
              message: `Despacho pendiente para: ${payload.clientName || 'Cliente ' + payload.clientId}`,
              targetRole: 'dispatcher',
              notificationType: 'dispatch',
              priority: 'maximum',
              entityId: payload.alarmId,
              entityType: 'alarm'
            },
            timestamp: Date.now() + 100
          };
          socket.send(JSON.stringify(directMessage));
          console.log('✅ Mensaje dirigido a despachadores enviado');
        }
      }, 1000);
    } 
    // Para alarmas nuevas, asegurar que lleguen a todos
    else if (type === MessageType.NEW_ALARM) {
      console.log('🚨 Enviando nueva alarma');
      
      // Envío normal
      socket.send(JSON.stringify(message));
      
      // Envío como notificación general después de un breve retraso
      setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          const notificationMessage = {
            type: MessageType.NOTIFICATION,
            payload: {
              title: '🚨 NUEVA ALARMA REGISTRADA',
              message: `Cliente: ${payload.clientName || 'Cliente ' + payload.clientId} - ${payload.type || 'Alarma'}`,
              notificationType: 'alarm',
              priority: 'high',
              entityId: payload.id,
              entityType: 'alarm'
            },
            timestamp: Date.now()
          };
          socket.send(JSON.stringify(notificationMessage));
        }
      }, 700);
    }
    // Para el resto de mensajes, envío normal
    else {
      socket.send(JSON.stringify(message));
    }
    
    console.log(`✅ Mensaje enviado: ${type}`, payload);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar mensaje WebSocket:', error);
    
    // Reintento automático para mensajes críticos
    if (CRITICAL_MESSAGE_TYPES.includes(type)) {
      console.log('🔄 Reintentando mensaje crítico después de error');
      setTimeout(() => {
        sendSocketMessage(type, payload);
      }, 1500);
    }
    
    return false;
  }
}

/**
 * Devuelve el estado de conexión
 */
export function isSocketConnected(): boolean {
  return connected;
}

/**
 * Establece el ID de usuario y rol para la conexión WebSocket
 */
export function setUserCredentials(uid: number, role: string) {
  console.log('⚡ Actualizando credenciales de usuario:', uid, role);
  
  // Siempre actualizar las credenciales
  userId = uid;
  userRole = role;
  
  // Cerrar cualquier conexión existente para forzar una reconexión limpia
  if (socket) {
    console.log('🔄 Cerrando conexión existente para forzar reconexión con nuevas credenciales');
    
    try {
      // Cerrar el socket actual
      socket.close();
    } catch (e) {
      console.error('Error al cerrar socket:', e);
    }
    
    socket = null;
    connected = false;
  }
  
  // Iniciar una nueva conexión después de una breve pausa
  setTimeout(() => {
    console.log('🔌 Iniciando nueva conexión WebSocket con credenciales:', userId, userRole);
    initSocket();
    
    // Después de iniciar la conexión, verificar si se realizó correctamente
    setTimeout(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('✅ Conexión establecida. Enviando credenciales de nuevo para confirmar');
        
        // Normalizar el rol para evitar problemas de mayúsculas/minúsculas
        const normalizedRole = userRole?.toLowerCase().trim();
        
        sendSocketMessage(MessageType.CLIENT_CONNECTED, {
          userId,
          role: normalizedRole
        });
      } else {
        console.warn('⚠️ No se pudo establecer conexión WebSocket. Reintentando...');
        initSocket(); // Intentar una vez más
      }
    }, 1000);
  }, 500);
}

// Inicializar automáticamente (pero sin credenciales)
// Las credenciales se establecerán cuando el usuario inicie sesión
initSocket();