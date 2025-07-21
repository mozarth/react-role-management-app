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

export const UserRole = {
  ADMIN: "administrator",
  DIRECTOR: "director",
  ALARM_OPERATOR: "alarm_operator",
  DISPATCHER: "dispatcher",
  SUPERVISOR: "supervisor",
};

export const AlarmType = {
  INTRUSION: "intrusion",
  FIRE: "fire",
  PANIC: "panic",
  TECHNICAL: "technical",
  REVISTA_PROGRAMADA: "revista_programada",
  REVISTA_RUTINA: "revista_rutina",
};

export const AlarmTypeLabels = {
  intrusion: "Intrusión",
  fire: "Incendio",
  panic: "Pánico",
  technical: "Técnica",
  revista_programada: "Revista Programada",
  revista_rutina: "Revista Rutina",
};

export const AlarmStatus = {
  ACTIVE: "active",
  DISPATCHED: "dispatched",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CANCELED: "canceled",
};

export const AlarmStatusLabels = {
  active: "Activa",
  dispatched: "Despachada",
  in_progress: "En progreso",
  resolved: "Resuelta",
  canceled: "Cancelada",
};

export const AlarmStatusColors = {
  active: "bg-red-500",
  dispatched: "bg-orange-500",
  in_progress: "bg-yellow-500",
  resolved: "bg-green-500",
  canceled: "bg-gray-500",
};

export const PatrolStatus = {
  AVAILABLE: "available",
  ASSIGNED: "assigned",
  EN_ROUTE: "en_route",
  ON_SITE: "on_site",
  RETURNING: "returning",
  OFF_DUTY: "off_duty",
};

export const PatrolStatusLabels = {
  available: "Disponible",
  assigned: "Asignado",
  en_route: "En camino",
  on_site: "En sitio",
  returning: "Regresando",
  off_duty: "Fuera de servicio",
};

export const PatrolStatusColors = {
  available: "bg-green-500",
  assigned: "bg-blue-500",
  en_route: "bg-yellow-500",
  on_site: "bg-purple-500",
  returning: "bg-indigo-500",
  off_duty: "bg-gray-500",
};

export const AlarmTypeColors = {
  intrusion: "bg-red-500",
  fire: "bg-orange-500",
  panic: "bg-yellow-500",
  technical: "bg-blue-500",
  revista_programada: "bg-green-500",
  revista_rutina: "bg-indigo-500",
};