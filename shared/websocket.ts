// Tipos de mensajes para WebSocket
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

// Interfaces para diferentes tipos de mensajes
export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
  sender?: {
    userId: number;
    role: string;
  };
}

export interface AlarmMessage extends WebSocketMessage {
  type: MessageType.NEW_ALARM | MessageType.ALARM_UPDATE;
  payload: {
    alarmId: number;
    clientId: number;
    clientName?: string;
    status: string;
    priority: string;
    createdAt: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
  };
}

export interface DispatchRequestMessage extends WebSocketMessage {
  type: MessageType.DISPATCH_REQUEST;
  payload: {
    alarmId: number;
    clientId: number;
    clientName?: string;
    requestedBy: number;
    priority: string;
    notes?: string;
  };
}

export interface PatrolAssignmentMessage extends WebSocketMessage {
  type: MessageType.PATROL_ASSIGNMENT;
  payload: {
    assignmentId: number;
    alarmId: number;
    patrolId: number;
    supervisorId: number;
    status: string;
    dispatchedAt: string;
  };
}

export interface NotificationMessage extends WebSocketMessage {
  type: MessageType.NOTIFICATION;
  payload: {
    title: string;
    message: string;
    targetUserId?: number;
    targetRole?: string;
    notificationType?: 'alarm' | 'dispatch' | 'info';
    entityId?: number;
    entityType?: string;
  };
}