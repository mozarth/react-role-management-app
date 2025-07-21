import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Client connection types
type ClientConnection = {
  userId: number;
  role: string;
  socket: WebSocket;
};

// Message types
export enum MessageType {
  NEW_ALARM = 'NEW_ALARM',
  ALARM_UPDATE = 'ALARM_UPDATE',
  DISPATCH_REQUEST = 'DISPATCH_REQUEST',
  PATROL_ASSIGNMENT = 'PATROL_ASSIGNMENT',
  PATROL_STATUS_UPDATE = 'PATROL_STATUS_UPDATE',
  SUPERVISOR_LOCATION = 'SUPERVISOR_LOCATION',
  QR_VERIFICATION = 'QR_VERIFICATION',
  NOTIFICATION = 'NOTIFICATION',
  CLIENT_CONNECTED = 'CLIENT_CONNECTED',
  CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED',
}

type WebSocketMessage = {
  type: MessageType;
  payload: any;
  timestamp: number;
  sender?: {
    userId: number;
    role: string;
  };
};

// Maintain active connections
const clients: Map<number, ClientConnection> = new Map();
// Group connections by role for easy broadcasting
const roleGroups: Map<string, Set<number>> = new Map();

export const setupWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    // Connection is established, but user is not authenticated yet
    let clientConnection: ClientConnection | null = null;

    // Listen for messages from client
    socket.on('message', (message: string) => {
      try {
        const parsedMessage = JSON.parse(message) as WebSocketMessage;
        
        // Handle authentication message
        if (parsedMessage.type === MessageType.CLIENT_CONNECTED && !clientConnection) {
          const { userId, role } = parsedMessage.payload;
          
          if (!userId || !role) {
            socket.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Authentication failed. Missing userId or role.' }
            }));
            return;
          }
          
          // Register the client
          clientConnection = { userId, role, socket };
          clients.set(userId, clientConnection);
          
          console.log(`Usuario registrado: ${userId} con rol ${role}`);
          console.log(`Total de clientes conectados: ${clients.size}`);
          
          // Add to role group - asegurarnos de que el rol esté normalizado
          const normalizedRole = role.toLowerCase().trim();
          console.log(`Normalizando rol del usuario. Original: "${role}", Normalizado: "${normalizedRole}"`);
          
          if (!roleGroups.has(normalizedRole)) {
            roleGroups.set(normalizedRole, new Set());
          }
          roleGroups.get(normalizedRole)?.add(userId);
          
          // Confirm connection
          socket.send(JSON.stringify({
            type: MessageType.CLIENT_CONNECTED,
            payload: { 
              userId, 
              role,
              message: 'Successfully connected to WebSocket server' 
            },
            timestamp: Date.now()
          }));
          
          console.log(`WebSocket client connected: ${userId} (${role})`);
          return;
        }
        
        // For all other messages, client must be authenticated
        if (!clientConnection) {
          socket.send(JSON.stringify({
            type: 'ERROR',
            payload: { message: 'Not authenticated. Send CLIENT_CONNECTED message first.' }
          }));
          return;
        }
        
        // Add sender info to the message
        const enrichedMessage: WebSocketMessage = {
          ...parsedMessage,
          sender: {
            userId: clientConnection.userId,
            role: clientConnection.role
          },
          timestamp: Date.now()
        };
        
        // Process the message based on its type
        handleMessage(enrichedMessage);
        
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        socket.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Invalid message format' }
        }));
      }
    });

    // Handle client disconnection
    socket.on('close', () => {
      if (clientConnection) {
        const { userId, role } = clientConnection;
        
        // Remove from clients map
        clients.delete(userId);
        
        // Remove from role group
        roleGroups.get(role)?.delete(userId);
        if (roleGroups.get(role)?.size === 0) {
          roleGroups.delete(role);
        }
        
        console.log(`WebSocket client disconnected: ${userId} (${role})`);
        
        // Notify other clients about the disconnection
        broadcastToAll({
          type: MessageType.CLIENT_DISCONNECTED,
          payload: { userId, role },
          timestamp: Date.now()
        });
      }
    });
  });

  return wss;
};

// Handle different message types
const handleMessage = (message: WebSocketMessage) => {
  console.log('🔍 Procesando mensaje WebSocket:', message.type, 'payload:', message.payload);
  
  switch (message.type) {
    case MessageType.NEW_ALARM:
      // Broadcast to dispatchers, alarm operators, directors, administrators
      console.log('📢 Enviando alarma a despachadores y otros roles...');
      
      // SOLUCIÓN CRÍTICA: Para alarmas nuevas, enviar siempre a TODOS
      console.log('⚠️ ALARMA NUEVA - Enviando a TODOS los clientes por su criticidad');
      
      // 1. Primero intento dirigido a roles específicos
      broadcastToRoles(['dispatcher', 'alarm_operator', 'director', 'administrator'], message);
      
      // 2. Segundo intento a TODOS para garantizar entrega (redundante pero necesario)
      broadcastToAll(message);
      
      break;
    
    case MessageType.ALARM_UPDATE:
      // Broadcast to all roles
      console.log('📢 Enviando actualización de alarma a todos los roles...');
      
      // Primer intento con mensaje original
      broadcastToAll(message);
      
      // Garantizar que llegue a despachadores con mensaje específico
      const dispatcherAlarmUpdate: WebSocketMessage = {
        ...message,
        payload: {
          ...message.payload,
          targetRole: 'dispatcher',
          priority: 'high'
        }
      };
      
      // Envío directo a despachadores
      console.log('🎯 Enviando actualización directo a despachadores');
      broadcastToRoles(['dispatcher', 'despachador', 'despacho', 'despachadores'], dispatcherAlarmUpdate);
      
      break;
    
    case MessageType.DISPATCH_REQUEST:
      // From alarm operator to dispatchers
      console.log('🚨 SOLICITUD DE DESPACHO CRÍTICA 🚨');
      console.log('🔖 Detalles del despacho:', JSON.stringify(message.payload));
      
      // INTERVENCIÓN DE EMERGENCIA: Este es el mensaje más crítico del sistema,
      // debe llegar a los despachadores a toda costa
      
      // 1. Primera estrategia: Broadcast global SIN filtros
      console.log('🌐 Enviando a TODOS los clientes conectados (estrategia 1)');
      broadcastToAll(message);
      
      // 2. Segunda estrategia: Notificación general con formato de alerta
      const dispatchNotification: WebSocketMessage = {
        type: MessageType.NOTIFICATION,
        payload: {
          title: '🚨 DESPACHO URGENTE REQUERIDO 🚨',
          message: `Cliente: ${message.payload.clientName || 'Cliente ' + message.payload.clientId} - Requiere atención inmediata`,
          // Sin targetRole para que llegue a todos
          notificationType: 'dispatch',
          priority: 'critical',
          entityId: message.payload.alarmId,
          entityType: 'alarm'
        },
        timestamp: Date.now()
      };
      
      console.log('🔔 Enviando como notificación general (estrategia 2)');
      broadcastToAll(dispatchNotification);
      
      // 3. Tercera estrategia: Intento dirigido específicamente a despachadores
      const dispatcherNotification: WebSocketMessage = {
        type: MessageType.NOTIFICATION,
        payload: {
          title: '🚨 ALERTA EXCLUSIVA PARA DESPACHADORES 🚨',
          message: `Despacho pendiente para: ${message.payload.clientName || 'Cliente ' + message.payload.clientId}`,
          targetRole: 'dispatcher',
          notificationType: 'dispatch',
          priority: 'maximum',
          entityId: message.payload.alarmId,
          entityType: 'alarm'
        },
        timestamp: Date.now() + 100
      };
      
      console.log('🎯 Enviando notificación dirigida a despachadores (estrategia 3)');
      broadcastToRoles(['dispatcher', 'despachador', 'despacho', 'despachadores'], dispatcherNotification);
      
      // 4. Cuarta estrategia: Enviar notificaciones individuales a cada cliente
      console.log('👤 Enviando notificaciones individuales a cada cliente (estrategia 4)');
      clients.forEach((client, userId) => {
        if (client.socket && client.socket.readyState === WebSocket.OPEN) {
          try {
            // Crear una versión personalizada para cada cliente
            const personalizedNotification: WebSocketMessage = {
              type: MessageType.NOTIFICATION,
              payload: {
                title: client.role.toLowerCase().includes('dispatch') ? 
                  '🚨 ATENCIÓN DESPACHADOR: DESPACHO PENDIENTE 🚨' : 
                  '⚠️ Solicitud de despacho en curso',
                message: `Cliente: ${message.payload.clientName || 'Cliente ' + message.payload.clientId} - ${client.role.toLowerCase().includes('dispatch') ? 'REQUIERE SU ATENCIÓN INMEDIATA' : 'En proceso de despacho'}`,
                notificationType: 'direct',
                priority: 'maximum',
                entityId: message.payload.alarmId,
                entityType: 'alarm'
              },
              timestamp: Date.now() + 200
            };
            
            client.socket.send(JSON.stringify(personalizedNotification));
            console.log(`✉️ Mensaje personalizado enviado a usuario ${userId} (${client.role})`);
          } catch (error) {
            console.error(`❌ Error al enviar mensaje personalizado a cliente ${userId}:`, error);
          }
        }
      });
      
      break;
    
    case MessageType.PATROL_ASSIGNMENT:
      // From dispatcher to specific supervisor
      if (message.payload.supervisorId) {
        sendToUser(message.payload.supervisorId, message);
      }
      // Also inform director and admin
      broadcastToRoles(['director', 'administrator'], message);
      break;
    
    case MessageType.PATROL_STATUS_UPDATE:
      // From supervisor to dispatcher and others
      broadcastToRoles(['dispatcher', 'director', 'administrator', 'alarm_operator'], message);
      break;
    
    case MessageType.SUPERVISOR_LOCATION:
      // Update from supervisor about their location
      broadcastToRoles(['dispatcher', 'director', 'administrator'], message);
      break;
    
    case MessageType.QR_VERIFICATION:
      // QR code verification result
      if (message.sender?.userId) {
        // Acknowledge back to the supervisor
        sendToUser(message.sender.userId, {
          type: MessageType.QR_VERIFICATION,
          payload: { verified: true, ...message.payload },
          timestamp: Date.now()
        });
        // Also inform dispatcher
        broadcastToRoles(['dispatcher', 'director', 'administrator'], message);
      }
      break;
    
    case MessageType.NOTIFICATION:
      // Handle general notifications
      console.log('Procesando notificación, targetRole:', message.payload.targetRole, 'targetUserId:', message.payload.targetUserId);
      console.log('Contenido completo de la notificación:', JSON.stringify(message.payload));
      
      if (message.payload.targetUserId) {
        // Send to specific user
        console.log('Enviando notificación a usuario específico:', message.payload.targetUserId);
        sendToUser(message.payload.targetUserId, message);
      } else if (message.payload.targetRole) {
        // Send to specific role
        console.log('Enviando notificación a rol específico:', message.payload.targetRole);
        
        // Verificar si hay clientes con este rol
        const userIds = roleGroups.get(message.payload.targetRole);
        if (userIds && userIds.size > 0) {
          console.log(`Encontrados ${userIds.size} usuarios con rol ${message.payload.targetRole}: ${Array.from(userIds).join(', ')}`);
        } else {
          console.log(`⚠️ NO SE ENCONTRARON USUARIOS con rol ${message.payload.targetRole}`);
          
          // Si el rol es dispatcher y no hay usuarios conectados, intentar enviar a todos los roles
          if (message.payload.targetRole === 'dispatcher') {
            console.log('Intentando enviar a todos los roles en su lugar');
            // Imprimir todos los roles disponibles
            console.log('Roles disponibles:', Array.from(roleGroups.keys()).join(', '));
            broadcastToAll(message);
            break; // Salir después de hacer broadcast a todos
          }
        }
        
        // Continuar con el envío normal al rol específico
        broadcastToRoles([message.payload.targetRole], message);
      } else {
        // Broadcast to all
        console.log('Enviando notificación a todos los usuarios');
        broadcastToAll(message);
      }
      break;
    
    default:
      console.log(`Unhandled message type: ${message.type}`);
  }
};

// Send a message to a specific user
const sendToUser = (userId: number, message: WebSocketMessage): boolean => {
  const client = clients.get(userId);
  if (client && client.socket.readyState === WebSocket.OPEN) {
    try {
      client.socket.send(JSON.stringify(message));
      console.log(`Mensaje enviado con éxito al usuario ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error al enviar mensaje al usuario ${userId}:`, error);
      return false;
    }
  } else {
    if (!client) {
      console.log(`Usuario ${userId} no está conectado`);
    } else if (client.socket.readyState !== WebSocket.OPEN) {
      console.log(`Socket del usuario ${userId} no está abierto. Estado actual: ${client.socket.readyState}`);
    }
    return false;
  }
};

// Broadcast a message to users with specific roles
const broadcastToRoles = (roles: string[], message: WebSocketMessage) => {
  console.log(`Intentando enviar mensaje a roles: ${roles.join(', ')}`);
  
  // Imprimir el estado actual de todos los grupos de roles
  console.log('Estado actual de roleGroups:');
  roleGroups.forEach((users, role) => {
    console.log(`- Rol: ${role}, Usuarios: ${Array.from(users).join(', ')}`);
  });
  
  // Enviar mensaje a cada rol
  let messagesSent = 0;
  let foundAnyRoles = false;
  
  // Primero validar todos los roles
  const roleMappings: Record<string, string[]> = {
    // Mapear variantes de nombres de roles (español/inglés)
    'dispatcher': ['despachador', 'despacho'],
    'despachador': ['dispatcher', 'despacho'],
    'alarm_operator': ['operador', 'operator', 'alarm operator', 'operador_alarma', 'operador_de_alarma'],
    'operador': ['alarm_operator', 'operator', 'operador_alarma'],
    'supervisor': ['motorizado', 'motorized', 'supervisor_motorizado'],
    'administrator': ['admin', 'administrador'],
    'administrador': ['administrator', 'admin'],
    'director': ['director', 'manager', 'gerente']
  };
  
  roles.forEach(originalRole => {
    // Normalizar el rol
    const role = originalRole.toLowerCase().trim();
    console.log(`Procesando rol: ${originalRole} → normalizado a: ${role}`);
    
    // Intentar obtener usuarios con el rol normalizado
    const userIds = roleGroups.get(role);
    if (userIds && userIds.size > 0) {
      foundAnyRoles = true;
      console.log(`✓ Encontrados ${userIds.size} usuarios con rol ${role}`);
      userIds.forEach(userId => {
        const sent = sendToUser(userId, message);
        if (sent) {
          messagesSent++;
        }
      });
    } else {
      console.log(`⚠️ No se encontraron usuarios con rol: ${role}`);
      
      // Buscar alternativas en las variantes mapeadas
      const alternativeRoles = roleMappings[role] || [];
      if (alternativeRoles.length > 0) {
        console.log(`Buscando en ${alternativeRoles.length} variantes alternativas para ${role}...`);
        
        alternativeRoles.forEach(altRole => {
          const altUserIds = roleGroups.get(altRole);
          if (altUserIds && altUserIds.size > 0) {
            foundAnyRoles = true;
            console.log(`✓ Encontrados ${altUserIds.size} usuarios con rol alternativo ${altRole}`);
            altUserIds.forEach(userId => {
              const sent = sendToUser(userId, message);
              if (sent) {
                messagesSent++;
              }
            });
          }
        });
      }
      
      // Si aún no encontramos nada, buscar por coincidencia parcial
      if (!foundAnyRoles) {
        console.log(`Buscando coincidencias parciales para ${role}...`);
        
        // Obtener todos los roles disponibles
        const availableRoles = Array.from(roleGroups.keys());
        
        availableRoles.forEach(availableRole => {
          if (availableRole.includes(role) || role.includes(availableRole)) {
            console.log(`🔍 Encontrada coincidencia parcial: ${availableRole}`);
            const partialUsers = roleGroups.get(availableRole);
            if (partialUsers && partialUsers.size > 0) {
              foundAnyRoles = true;
              console.log(`✓ Enviando a ${partialUsers.size} usuarios con rol parcialmente coincidente ${availableRole}`);
              partialUsers.forEach(userId => {
                const sent = sendToUser(userId, message);
                if (sent) messagesSent++;
              });
            }
          }
        });
      }
    }
  });
  
  if (messagesSent > 0) {
    console.log(`✅ Mensajes enviados: ${messagesSent}`);
  } else {
    console.log(`❌ No se pudo enviar ningún mensaje. Roles solicitados: ${roles.join(', ')}`);
    
    // Como último recurso, si es un mensaje crítico, enviarlo a todos
    if (message.type === MessageType.DISPATCH_REQUEST || 
        message.type === MessageType.NEW_ALARM || 
        (message.type === MessageType.NOTIFICATION && message.payload.notificationType === 'alarm')) {
      console.log(`🚨 Mensaje crítico no entregado. Enviando a todos los usuarios conectados como respaldo.`);
      broadcastToAll(message);
    }
  }
  
  return messagesSent > 0;
};

// Broadcast a message to all connected clients
const broadcastToAll = (message: WebSocketMessage) => {
  let sentCount = 0;
  
  console.log(`Enviando mensaje a todos los clientes conectados (${clients.size} clientes totales)`);
  
  // Comprobar especialmente si hay despachadores conectados para mensajes críticos
  if (message.type === MessageType.DISPATCH_REQUEST || 
      message.type === MessageType.NEW_ALARM ||
      (message.type === MessageType.NOTIFICATION && message.payload?.priority === 'critical')) {
        
    // Verificar si algún despachador está conectado
    let dispatcherFound = false;
    clients.forEach((client, _) => {
      if (client.role.toLowerCase().includes('dispatch') && client.socket.readyState === WebSocket.OPEN) {
        dispatcherFound = true;
      }
    });
    
    if (!dispatcherFound) {
      console.log('⚠️ ADVERTENCIA: No hay despachadores conectados para recibir mensaje crítico');
    }
  }
  
  // Primer intento - con el mensaje original
  clients.forEach((client, userId) => {
    if (client.socket && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify(message));
        console.log(`✅ Mensaje enviado a usuario ${userId} (${client.role})`);
        sentCount++;
      } catch (error) {
        console.error(`❌ Error al enviar mensaje a usuario ${userId}:`, error);
      }
    } else {
      console.log(`❌ Socket del usuario ${userId} no disponible (estado: ${client.socket?.readyState})`);
    }
  });
  
  // CRÍTICO: Verificar si el mensaje se envió a despachadores
  const dispatcherRoles = ['dispatcher', 'despachador', 'despacho', 'despachadores'];
  const sentToDispatcher = Array.from(clients.values()).some(client => 
    dispatcherRoles.some(role => client.role.toLowerCase().includes(role)) && 
    client.socket.readyState === WebSocket.OPEN && 
    sentCount > 0
  );
  
  // Si es un mensaje crítico y no se envió a despachadores, hacer segundo intento
  if (!sentToDispatcher && (
      message.type === MessageType.NOTIFICATION || 
      message.type === MessageType.DISPATCH_REQUEST || 
      message.type === MessageType.NEW_ALARM || 
      message.type === MessageType.ALARM_UPDATE
  )) {
    console.log('⚠️ MENSAJE CRÍTICO NO LLEGÓ A DESPACHADORES - EJECUTANDO PROTOCOLOS ALTERNATIVOS');
    
    // Crear versión de alta prioridad del mensaje
    const criticalMessage: WebSocketMessage = {
      ...message,
      payload: {
        ...message.payload,
        title: message.payload.title ? `🚨 URGENTE: ${message.payload.title}` : '🚨 ALERTA CRÍTICA DEL SISTEMA',
        message: `${message.payload.message || ''} [MÁXIMA PRIORIDAD - REQUIERE ATENCIÓN INMEDIATA]`,
        priority: 'critical',
        // Eliminar targetRole para que llegue a todos
        targetRole: undefined
      },
      timestamp: Date.now()
    };
    
    console.log('🔄 Ejecutando segundo intento con mensaje modificado de prioridad crítica');
    
    // Segunda pasada con mensaje crítico a TODOS los clientes
    let secondAttemptCount = 0;
    clients.forEach((client, userId) => {
      if (client.socket && client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(JSON.stringify(criticalMessage));
          console.log(`✅ Mensaje CRÍTICO enviado a usuario ${userId} (${client.role})`);
          secondAttemptCount++;
        } catch (error) {
          console.error(`❌ Error en segundo intento a usuario ${userId}:`, error);
        }
      }
    });
    
    console.log(`🔄 Segundo intento: ${secondAttemptCount} mensajes enviados`);
    
    // Notificar al sistema sobre el problema de comunicación
    console.log('📝 Registrando problema de comunicación con despachadores en el sistema');
  }
  
  console.log(`📊 Resumen: ${sentCount} de ${clients.size} mensajes entregados correctamente`);
  return sentCount;
};

// Public API for sending messages from other parts of the server
export const sendWebSocketMessage = (message: WebSocketMessage) => {
  handleMessage(message);
};
