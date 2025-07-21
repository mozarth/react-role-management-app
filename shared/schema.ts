import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  jsonb,
  index,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Roles Enum
export const UserRole = {
  ADMIN: "administrator",
  DIRECTOR: "director",
  ALARM_OPERATOR: "alarm_operator",
  DISPATCHER: "dispatcher",
  SUPERVISOR: "supervisor",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").$type<UserRoleType>().notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  profileImageUrl: text("profile_image_url"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  faceId: text("face_id"), // For facial recognition
  // Campos adicionales para supervisores
  identificationNumber: text("identification_number"),
  whatsappNumber: text("whatsapp_number"),
  motorcyclePlate: text("motorcycle_plate"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Clients Table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  clientCode: text("client_code").notNull().unique(),
  businessName: text("business_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  coordinates: text("coordinates"), // Stored as "lat,lng"
  qrCode: text("qr_code").unique(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Alarm Types Enum
export const AlarmType = {
  INTRUSION: "intrusion",
  FIRE: "fire",
  PANIC: "panic",
  REVISTA_PROGRAMADA: "revista_programada",
  REVISTA_RUTINA: "revista_rutina",
  OTHER: "other",
} as const;

export type AlarmTypeType = typeof AlarmType[keyof typeof AlarmType];

// Alarm Status Enum
export const AlarmStatus = {
  ACTIVE: "active",
  DISPATCHED: "dispatched",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CANCELED: "canceled",
} as const;

export type AlarmStatusType = typeof AlarmStatus[keyof typeof AlarmStatus];

// Alarms Table
export const alarms = pgTable("alarms", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => clients.id),
  accountNumber: varchar("account_number", { length: 50 }),
  clientName: varchar("client_name", { length: 255 }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  type: text("type").$type<AlarmTypeType>().notNull(),
  status: text("status").$type<AlarmStatusType>().notNull().default("active"),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  locationUrl: varchar("location_url", { length: 512 }),
  operatorName: varchar("operator_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  dispatchedAt: timestamp("dispatched_at"),
  resolvedAt: timestamp("resolved_at"),
  operatorId: integer("operator_id").references(() => users.id),
  dispatcherId: integer("dispatcher_id").references(() => users.id),
  supervisorId: integer("supervisor_id").references(() => users.id),
  notes: text("notes"),
});

export const insertAlarmSchema = createInsertSchema(alarms).omit({
  id: true,
  createdAt: true,
  dispatchedAt: true,
  resolvedAt: true,
}).extend({
  // Hacemos que ciertos campos sean opcionales para permitir la retrocompatibilidad
  accountNumber: z.string().optional(),
  clientName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  location: z.string().optional(),
  locationUrl: z.string().optional(),
  operatorName: z.string().optional(),
});

export type InsertAlarm = z.infer<typeof insertAlarmSchema>;
export type Alarm = typeof alarms.$inferSelect;

// Shift Status Enum
export const ShiftStatus = {
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELED: "canceled",
} as const;

export type ShiftStatusType = typeof ShiftStatus[keyof typeof ShiftStatus];

// Shift Type Enum
export const ShiftType = {
  MORNING_12H: "morning_12h", // 06:00 - 18:00
  MORNING_8H: "morning_8h",   // 06:00 - 14:00
  AFTERNOON_8H: "afternoon_8h", // 14:00 - 22:00
  NIGHT_12H: "night_12h",     // 18:00 - 06:00
} as const;

export type ShiftTypeType = typeof ShiftType[keyof typeof ShiftType];

// Absence Type Enum
export const AbsenceType = {
  REST: "rest",          // Descanso
  VACATION: "vacation",  // Vacaciones
  PERMISSION: "permission", // Permiso
  SUSPENSION: "suspension", // Suspensión
  SICK_LEAVE: "sick_leave", // Baja por enfermedad
} as const;

export type AbsenceTypeType = typeof AbsenceType[keyof typeof AbsenceType];

// Shifts Table
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  shiftType: text("shift_type").$type<ShiftTypeType>(),
  status: text("status").$type<ShiftStatusType>().notNull().default("scheduled"),
  absenceType: text("absence_type").$type<AbsenceTypeType>(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  notes: text("notes"),
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  createdBy: true, // Omitimos createdBy para evitar problemas con la clave externa
}).extend({
  // Hacemos que algunos campos sean opcionales o acepten más tipos
  shiftType: z.string().nullable().optional(),
  absenceType: z.string().nullable().optional(),
  status: z.string().default('scheduled'),
  notes: z.string().nullable().optional()
});

export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

// Patrol Status Enum
export const PatrolStatus = {
  AVAILABLE: "available",
  ASSIGNED: "assigned",
  EN_ROUTE: "en_route",
  ON_SITE: "on_site",
  RETURNING: "returning",
  OFF_DUTY: "off_duty",
} as const;

export type PatrolStatusType = typeof PatrolStatus[keyof typeof PatrolStatus];

// Patrols Table (Vehicles)
export const patrols = pgTable("patrols", {
  id: serial("id").primaryKey(),
  vehicleCode: text("vehicle_code").notNull().unique(),
  licensePlate: text("license_plate").notNull(),
  status: text("status").$type<PatrolStatusType>().notNull().default("available"),
  // La columna supervisor_id no existe en la base de datos actual
  // supervisorId: integer("supervisor_id"),
  // supervisorName: text("supervisor_name"),
  lastLocation: text("last_location"), // Stored as "lat,lng"
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
});

export const insertPatrolSchema = createInsertSchema(patrols).omit({
  id: true,
  lastUpdated: true,
});

export type InsertPatrol = z.infer<typeof insertPatrolSchema>;
export type Patrol = typeof patrols.$inferSelect;

// Patrol Assignments Table (Links patrols with supervisors and alarms)
export const patrolAssignments = pgTable("patrol_assignments", {
  id: serial("id").primaryKey(),
  patrolId: integer("patrol_id")
    .notNull()
    .references(() => patrols.id),
  supervisorId: integer("supervisor_id")
    .notNull()
    .references(() => users.id),
  alarmId: integer("alarm_id")
    .notNull()
    .references(() => alarms.id),
  dispatcherId: integer("dispatcher_id")
    .notNull()
    .references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  arrivedAt: timestamp("arrived_at"),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("assigned"),
  notes: text("notes"),
});

export const insertPatrolAssignmentSchema = createInsertSchema(patrolAssignments).omit({
  id: true,
  assignedAt: true,
  acceptedAt: true,
  arrivedAt: true,
  completedAt: true,
});

export type InsertPatrolAssignment = z.infer<typeof insertPatrolAssignmentSchema>;
export type PatrolAssignment = typeof patrolAssignments.$inferSelect;

// Reports and Evidence
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id")
    .notNull()
    .references(() => patrolAssignments.id),
  createdAt: timestamp("created_at").defaultNow(),
  description: text("description").notNull(),
  photos: text("photos").array(),
  videos: text("videos").array(),
  resolvedStatus: text("resolved_status"),
  responseTime: real("response_time"), // In minutes
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'alarm', 'assignment', 'system', etc.
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  relatedId: integer("related_id"), // ID of the related entity (alarm, patrol assignment, etc.)
  relatedType: text("related_type"), // Type of the related entity
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// SmartUrban - Asistencias Telefónicas
export const CallType = {
  TECHNICAL_SUPPORT: "technical_support",
  EMERGENCY: "emergency", 
  GENERAL_INQUIRY: "general_inquiry",
  COMPLAINT: "complaint",
  INFORMATION: "information",
  SERVICE_REQUEST: "service_request",
} as const;

export type CallTypeType = typeof CallType[keyof typeof CallType];

export const CallStatus = {
  RECEIVED: "received",
  IN_PROGRESS: "in_progress", 
  RESOLVED: "resolved",
  ESCALATED: "escalated",
  PENDING: "pending",
} as const;

export type CallStatusType = typeof CallStatus[keyof typeof CallStatus];

export const callAssistances = pgTable("call_assistances", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  operatorId: integer("operator_id").notNull().references(() => users.id),
  callType: varchar("call_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default(CallStatus.RECEIVED),
  callerName: varchar("caller_name", { length: 255 }),
  callerPhone: varchar("caller_phone", { length: 50 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  resolution: text("resolution"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  duration: integer("duration"), // en minutos
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCallAssistanceSchema = createInsertSchema(callAssistances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCallAssistance = z.infer<typeof insertCallAssistanceSchema>;
export type CallAssistance = typeof callAssistances.$inferSelect;
