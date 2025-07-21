import { UserRole } from "./constants";

export const navigationItems = [
  {
    name: "Gestión de Alarmas",
    path: "/alarms",
    icon: "notifications_active",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.ALARM_OPERATOR]
  },
  {
    name: "Despacho",
    path: "/dispatch",
    icon: "directions_car",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DISPATCHER]
  },
  {
    name: "Supervisores",
    path: "/supervisors",
    icon: "security",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DISPATCHER]
  },
  {
    name: "Usuarios",
    path: "/user-management",
    icon: "people",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DISPATCHER]
  },
  {
    name: "Programación de Turnos",
    path: "/shift-scheduling",
    icon: "schedule",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR]
  },
  {
    name: "Turnos de Supervisores",
    path: "/supervisor-shifts",
    icon: "schedule",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DISPATCHER]
  },
  {
    name: "Turnos de Operadores",
    path: "/operator-shifts-new",
    icon: "schedule",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DISPATCHER, UserRole.ALARM_OPERATOR]
  },
  {
    name: "Reportes",
    path: "/reports",
    icon: "assessment",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DISPATCHER, UserRole.SUPERVISOR]
  },
  {
    name: "SmartUrban",
    path: "/smart-urban",
    icon: "phone",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.ALARM_OPERATOR]
  },
  {
    name: "Configuración",
    path: "/settings",
    icon: "settings",
    roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.ALARM_OPERATOR, UserRole.DISPATCHER, UserRole.SUPERVISOR]
  }
];