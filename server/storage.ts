import {
  users,
  type User,
  type InsertUser,
  type UpsertUser,
  clients,
  type Client,
  type InsertClient,
  alarms,
  type Alarm,
  type InsertAlarm,
  shifts,
  type Shift,
  type InsertShift,
  patrols,
  type Patrol,
  type InsertPatrol,
  patrolAssignments,
  type PatrolAssignment,
  type InsertPatrolAssignment,
  reports,
  type Report,
  type InsertReport,
  notifications,
  type Notification,
  type InsertNotification,
  callAssistances,
  type CallAssistance,
  type InsertCallAssistance,
  AlarmStatus,
  PatrolStatus,
  ShiftStatus,
  UserRole,
} from "@shared/schema";

import { db } from "./db";
import { eq, and, desc, gte, lte, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByCode(code: string): Promise<Client | undefined>;
  getClientByQrCode(qrCode: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;

  // Alarm operations
  getAlarm(id: number): Promise<Alarm | undefined>;
  getAlarms(): Promise<Alarm[]>;
  getAlarmsByStatus(status: string): Promise<Alarm[]>;
  getActiveAlarms(): Promise<Alarm[]>;
  createAlarm(alarm: InsertAlarm): Promise<Alarm>;
  updateAlarm(id: number, alarm: Partial<Alarm>): Promise<Alarm | undefined>;
  getClientAlarms(clientId: number): Promise<Alarm[]>;
  getAlarmsByDateRange(startDate?: Date, endDate?: Date): Promise<Alarm[]>;

  // Shift operations
  getShift(id: number): Promise<Shift | undefined>;
  getUserShifts(userId: number): Promise<Shift[]>;
  getActiveShifts(): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<Shift>): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;
  getShiftsByDateRange(startDate?: Date, endDate?: Date): Promise<Shift[]>;
  getCurrentShifts(): Promise<Shift[]>;

  // Patrol operations
  getPatrol(id: number): Promise<Patrol | undefined>;
  getAvailablePatrols(): Promise<Patrol[]>;
  createPatrol(patrol: InsertPatrol): Promise<Patrol>;
  updatePatrol(id: number, patrol: Partial<Patrol>): Promise<Patrol | undefined>;
  getAllPatrols(): Promise<Patrol[]>;

  // Patrol Assignment operations
  getPatrolAssignment(id: number): Promise<PatrolAssignment | undefined>;
  getActiveAssignments(): Promise<PatrolAssignment[]>;
  getSupervisorAssignments(supervisorId: number): Promise<PatrolAssignment[]>;
  getAlarmAssignment(alarmId: number): Promise<PatrolAssignment | undefined>;
  createPatrolAssignment(assignment: InsertPatrolAssignment): Promise<PatrolAssignment>;
  updatePatrolAssignment(id: number, assignment: Partial<PatrolAssignment>): Promise<PatrolAssignment | undefined>;
  getPatrolAssignmentsByDateRange(startDate?: Date, endDate?: Date): Promise<PatrolAssignment[]>;

  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getAssignmentReports(assignmentId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUserUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllUserNotificationsAsRead(userId: number): Promise<boolean>;

  // Call Assistance operations (SmartUrban)
  getCallAssistance(id: number): Promise<CallAssistance | undefined>;
  getCallAssistances(): Promise<CallAssistance[]>;
  getCallAssistancesByClient(clientId: number): Promise<CallAssistance[]>;
  getCallAssistancesByOperator(operatorId: number): Promise<CallAssistance[]>;
  getCallAssistancesByStatus(status: string): Promise<CallAssistance[]>;
  getCallAssistancesByDateRange(startDate?: Date, endDate?: Date): Promise<CallAssistance[]>;
  createCallAssistance(callAssistance: InsertCallAssistance): Promise<CallAssistance>;
  updateCallAssistance(id: number, callAssistance: Partial<CallAssistance>): Promise<CallAssistance | undefined>;
  deleteCallAssistance(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      if (!id || isNaN(id)) {
        console.warn(`Valor inválido de ID: ${id}`);
        return undefined;
      }
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log("Insertando usuario en DB:", {
        ...insertUser,
        password: "***OCULTA***"
      });
      
      // Verifica que todos los campos requeridos estén presentes
      if (!insertUser.username || !insertUser.password || !insertUser.role) {
        throw new Error("Faltan campos obligatorios para crear usuario");
      }
      
      const [user] = await db.insert(users).values({
        username: insertUser.username,
        password: insertUser.password,
        firstName: insertUser.firstName || null,
        lastName: insertUser.lastName || null,
        role: insertUser.role,
        email: insertUser.email || null,
        phone: insertUser.phone || null,
        profileImageUrl: insertUser.profileImageUrl || null,
        active: true,
        createdBy: insertUser.createdBy || null
      }).returning();
      
      console.log("Usuario creado con éxito:", {
        id: user.id,
        username: user.username,
        role: user.role
      });
      
      return user;
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deletedUser] = await db
      .update(users)
      .set({ active: false })
      .where(eq(users.id, id))
      .returning();
    return !!deletedUser;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.active, true));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.active, true), eq(users.role, role)));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, createdAt: new Date() },
      })
      .returning();
    return user;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByCode(code: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.clientCode, code));
    return client;
  }

  async getClientByQrCode(qrCode: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.qrCode, qrCode));
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients);
  }

  // Alarm operations
  async getAlarm(id: number): Promise<Alarm | undefined> {
    const [alarm] = await db.select().from(alarms).where(eq(alarms.id, id));
    return alarm;
  }

  async getAlarmsByStatus(status: string): Promise<Alarm[]> {
    return db.select().from(alarms).where(eq(alarms.status, status));
  }
  
  async getAlarms(): Promise<Alarm[]> {
    return db.select().from(alarms);
  }

  async getActiveAlarms(): Promise<Alarm[]> {
    return db
      .select()
      .from(alarms)
      .where(
        or(
          eq(alarms.status, "active"), 
          eq(alarms.status, "dispatched"), 
          eq(alarms.status, "in_progress")
        )
      )
      .orderBy(desc(alarms.createdAt));
  }

  async createAlarm(insertAlarm: InsertAlarm): Promise<Alarm> {
    const [alarm] = await db.insert(alarms).values(insertAlarm).returning();
    return alarm;
  }

  async updateAlarm(id: number, alarmData: Partial<Alarm>): Promise<Alarm | undefined> {
    const [updatedAlarm] = await db
      .update(alarms)
      .set(alarmData)
      .where(eq(alarms.id, id))
      .returning();
    return updatedAlarm;
  }

  async getClientAlarms(clientId: number): Promise<Alarm[]> {
    return db
      .select()
      .from(alarms)
      .where(eq(alarms.clientId, clientId))
      .orderBy(desc(alarms.createdAt));
  }

  // Shift operations
  async getShift(id: number): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift;
  }

  async getUserShifts(userId: number): Promise<Shift[]> {
    return db
      .select()
      .from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.startTime));
  }

  async getActiveShifts(): Promise<Shift[]> {
    return db.select().from(shifts).where(eq(shifts.status, "active"));
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    console.log("Guardando shift en la base de datos:", JSON.stringify(insertShift));
    try {
      // Crear un nuevo objeto explícitamente solo con los campos que necesitamos
      // para evitar cualquier campo problemático como 'createdBy'
      const shiftToInsert = {
        userId: insertShift.userId,
        startTime: insertShift.startTime,
        endTime: insertShift.endTime,
        status: insertShift.status || "scheduled",
        shiftType: insertShift.shiftType,
        absenceType: insertShift.absenceType,
        notes: insertShift.notes
        // Explícitamente no incluimos createdBy
      };

      console.log("Objeto shift preparado para inserción:", JSON.stringify(shiftToInsert));
      
      // Ejecutar la consulta de inserción con los campos específicos
      const [shift] = await db.insert(shifts).values(shiftToInsert).returning();
      
      console.log("Shift guardado correctamente:", shift);
      return shift;
    } catch (error) {
      console.error("Error al insertar shift en la base de datos:", error);
      throw error;
    }
  }

  async updateShift(id: number, shiftData: Partial<Shift>): Promise<Shift | undefined> {
    const [updatedShift] = await db
      .update(shifts)
      .set(shiftData)
      .where(eq(shifts.id, id))
      .returning();
    return updatedShift;
  }
  
  async deleteShift(id: number): Promise<boolean> {
    const result = await db
      .delete(shifts)
      .where(eq(shifts.id, id));
    
    return result.rowCount > 0;
  }

  async getShiftsByDateRange(startDate?: Date, endDate?: Date): Promise<Shift[]> {
    try {
      console.log(`Solicitando turnos en storage.getShiftsByDateRange - startDate: ${startDate}, endDate: ${endDate}`);
      
      // Consulta SQL directa para depuración
      const sqlQuery = "SELECT * FROM shifts ORDER BY start_time ASC";
      console.log(`Ejecutando consulta SQL directa: ${sqlQuery}`);
      
      try {
        const { rows } = await pool.query(sqlQuery);
        console.log(`Resultados obtenidos directamente: ${rows.length} turnos`);
        
        // Transformar resultados a formato Shift
        const shiftResults = rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          startTime: row.start_time,
          endTime: row.end_time,
          status: row.status,
          shiftType: row.shift_type,
          absenceType: row.absence_type,
          createdAt: row.created_at,
          createdBy: row.created_by,
          notes: row.notes,
        }));
        
        console.log(`Turnos convertidos: ${shiftResults.length}`);
        return shiftResults;
      } catch (sqlError) {
        console.error('Error en consulta SQL directa:', sqlError);
      }
      
      // Si la consulta directa falla, intentamos con Drizzle
      let query = db.select().from(shifts);
      
      if (startDate && endDate) {
        query = query.where(
          and(
            gte(shifts.startTime, startDate),
            lte(shifts.startTime, endDate)
          )
        );
      } else if (startDate) {
        query = query.where(gte(shifts.startTime, startDate));
      } else if (endDate) {
        query = query.where(lte(shifts.startTime, endDate));
      }
      
      const results = await query.orderBy(shifts.startTime);
      console.log(`Resultados obtenidos con Drizzle: ${results.length} turnos`);
      return results;
    } catch (error) {
      console.error('Error getting shifts by date range:', error);
      return [];
    }
  }
  
  async getAlarmsByDateRange(startDate?: Date, endDate?: Date): Promise<Alarm[]> {
    try {
      let query = db.select().from(alarms);
      
      if (startDate && endDate) {
        query = query.where(
          and(
            gte(alarms.createdAt, startDate),
            lte(alarms.createdAt, endDate)
          )
        );
      } else if (startDate) {
        query = query.where(gte(alarms.createdAt, startDate));
      } else if (endDate) {
        query = query.where(lte(alarms.createdAt, endDate));
      }
      
      return await query.orderBy(alarms.createdAt);
    } catch (error) {
      console.error('Error getting alarms by date range:', error);
      return [];
    }
  }
  
  async getPatrolAssignmentsByDateRange(startDate?: Date, endDate?: Date): Promise<PatrolAssignment[]> {
    try {
      let query = db.select().from(patrolAssignments);
      
      if (startDate && endDate) {
        query = query.where(
          and(
            gte(patrolAssignments.createdAt, startDate),
            lte(patrolAssignments.createdAt, endDate)
          )
        );
      } else if (startDate) {
        query = query.where(gte(patrolAssignments.createdAt, startDate));
      } else if (endDate) {
        query = query.where(lte(patrolAssignments.createdAt, endDate));
      }
      
      return await query.orderBy(patrolAssignments.createdAt);
    } catch (error) {
      console.error('Error getting patrol assignments by date range:', error);
      return [];
    }
  }

  async getCurrentShifts(): Promise<Shift[]> {
    const now = new Date();
    return db
      .select()
      .from(shifts)
      .where(
        and(
          lte(shifts.startTime, now),
          gte(shifts.endTime, now),
          eq(shifts.status, "active")
        )
      );
  }

  // Patrol operations
  async getPatrol(id: number): Promise<Patrol | undefined> {
    const [patrol] = await db.select().from(patrols).where(eq(patrols.id, id));
    return patrol;
  }

  async getAvailablePatrols(): Promise<Patrol[]> {
    return db.select().from(patrols).where(eq(patrols.status, "available"));
  }

  async createPatrol(insertPatrol: InsertPatrol): Promise<Patrol> {
    const [patrol] = await db.insert(patrols).values(insertPatrol).returning();
    return patrol;
  }

  async updatePatrol(id: number, patrolData: Partial<Patrol>): Promise<Patrol | undefined> {
    const [updatedPatrol] = await db
      .update(patrols)
      .set({ ...patrolData, lastUpdated: new Date() })
      .where(eq(patrols.id, id))
      .returning();
    return updatedPatrol;
  }

  async getAllPatrols(): Promise<Patrol[]> {
    return db.select().from(patrols);
  }

  // Patrol Assignment operations
  async getPatrolAssignment(id: number): Promise<PatrolAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(patrolAssignments)
      .where(eq(patrolAssignments.id, id));
    return assignment;
  }

  async getActiveAssignments(): Promise<PatrolAssignment[]> {
    return db
      .select()
      .from(patrolAssignments)
      .where(
        or(
          eq(patrolAssignments.status, "assigned"),
          eq(patrolAssignments.status, "accepted")
        )
      )
      .orderBy(desc(patrolAssignments.assignedAt));
  }

  async getSupervisorAssignments(supervisorId: number): Promise<PatrolAssignment[]> {
    return db
      .select()
      .from(patrolAssignments)
      .where(eq(patrolAssignments.supervisorId, supervisorId))
      .orderBy(desc(patrolAssignments.assignedAt));
  }

  async getAlarmAssignment(alarmId: number): Promise<PatrolAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(patrolAssignments)
      .where(eq(patrolAssignments.alarmId, alarmId));
    return assignment;
  }

  async createPatrolAssignment(insertAssignment: InsertPatrolAssignment): Promise<PatrolAssignment> {
    const [assignment] = await db
      .insert(patrolAssignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async updatePatrolAssignment(
    id: number,
    assignmentData: Partial<PatrolAssignment>
  ): Promise<PatrolAssignment | undefined> {
    const [updatedAssignment] = await db
      .update(patrolAssignments)
      .set(assignmentData)
      .where(eq(patrolAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getAssignmentReports(assignmentId: number): Promise<Report[]> {
    return db
      .select()
      .from(reports)
      .where(eq(reports.assignmentId, assignmentId));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUserUnreadNotifications(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return !!updatedNotification;
  }

  async markAllUserNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return true;
  }

  // Call Assistance operations (SmartUrban)
  async getCallAssistance(id: number): Promise<CallAssistance | undefined> {
    const [callAssistance] = await db
      .select()
      .from(callAssistances)
      .where(eq(callAssistances.id, id));
    return callAssistance;
  }

  async getCallAssistances(): Promise<CallAssistance[]> {
    return db
      .select()
      .from(callAssistances)
      .orderBy(desc(callAssistances.createdAt));
  }

  async getCallAssistancesByClient(clientId: number): Promise<CallAssistance[]> {
    return db
      .select()
      .from(callAssistances)
      .where(eq(callAssistances.clientId, clientId))
      .orderBy(desc(callAssistances.createdAt));
  }

  async getCallAssistancesByOperator(operatorId: number): Promise<CallAssistance[]> {
    return db
      .select()
      .from(callAssistances)
      .where(eq(callAssistances.operatorId, operatorId))
      .orderBy(desc(callAssistances.createdAt));
  }

  async getCallAssistancesByStatus(status: string): Promise<CallAssistance[]> {
    return db
      .select()
      .from(callAssistances)
      .where(eq(callAssistances.status, status))
      .orderBy(desc(callAssistances.createdAt));
  }

  async getCallAssistancesByDateRange(startDate?: Date, endDate?: Date): Promise<CallAssistance[]> {
    let query = db.select().from(callAssistances);
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(callAssistances.createdAt, startDate),
          lte(callAssistances.createdAt, endDate)
        )
      );
    } else if (startDate) {
      query = query.where(gte(callAssistances.createdAt, startDate));
    } else if (endDate) {
      query = query.where(lte(callAssistances.createdAt, endDate));
    }
    
    return query.orderBy(desc(callAssistances.createdAt));
  }

  async createCallAssistance(insertCallAssistance: InsertCallAssistance): Promise<CallAssistance> {
    const [callAssistance] = await db
      .insert(callAssistances)
      .values(insertCallAssistance)
      .returning();
    return callAssistance;
  }

  async updateCallAssistance(id: number, callAssistanceData: Partial<CallAssistance>): Promise<CallAssistance | undefined> {
    const [callAssistance] = await db
      .update(callAssistances)
      .set({ ...callAssistanceData, updatedAt: new Date() })
      .where(eq(callAssistances.id, id))
      .returning();
    return callAssistance;
  }

  async deleteCallAssistance(id: number): Promise<boolean> {
    try {
      await db.delete(callAssistances).where(eq(callAssistances.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting call assistance:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
