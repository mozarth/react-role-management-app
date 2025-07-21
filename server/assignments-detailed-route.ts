import { storage } from "./storage";
import { isAuthenticated } from "./simple-auth";
import { Request, Response } from "express";

// Ruta que devuelve asignaciones con datos detallados para reportes Excel
export async function getDetailedAssignments(req: Request, res: Response) {
  try {
    // Parsear filtros de la URL
    const { supervisorId, startDate, endDate } = req.query;
    
    // Obtener asignaciones según filtros de fecha
    let assignments;
    if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      assignments = await storage.getPatrolAssignmentsByDateRange(startDateObj, endDateObj);
    } else {
      assignments = await storage.getPatrolAssignmentsByDateRange();
    }
    
    // Filtrar por supervisor si se especifica
    if (supervisorId && supervisorId !== 'all' && typeof supervisorId === 'string') {
      assignments = assignments.filter(assignment => 
        assignment.supervisorId === parseInt(supervisorId)
      );
    }
    
    // Para cada asignación, obtener información detallada
    const detailedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        // Obtener detalles de la alarma
        const alarm = assignment.alarmId ? await storage.getAlarm(assignment.alarmId) : null;
        
        // Obtener detalles del cliente
        const client = alarm?.clientId ? await storage.getClient(alarm.clientId) : null;
        
        // Obtener detalles del supervisor
        const supervisor = assignment.supervisorId ? await storage.getUser(assignment.supervisorId) : null;
        
        // Calcular tiempos de respuesta si hay timestamps disponibles
        let responseTime = null;
        if (assignment.acceptedAt && assignment.assignedAt) {
          responseTime = Math.round((new Date(assignment.acceptedAt).getTime() - 
                                    new Date(assignment.assignedAt).getTime()) / (1000 * 60));
        }
        
        let arrivalTime = null;
        if (assignment.arrivedAt && assignment.acceptedAt) {
          arrivalTime = Math.round((new Date(assignment.arrivedAt).getTime() - 
                                   new Date(assignment.acceptedAt).getTime()) / (1000 * 60));
        }
        
        let onSiteTime = null;
        if (assignment.completedAt && assignment.arrivedAt) {
          onSiteTime = Math.round((new Date(assignment.completedAt).getTime() - 
                                  new Date(assignment.arrivedAt).getTime()) / (1000 * 60));
        }
        
        let totalTime = null;
        if (assignment.completedAt && assignment.assignedAt) {
          totalTime = Math.round((new Date(assignment.completedAt).getTime() - 
                                 new Date(assignment.assignedAt).getTime()) / (1000 * 60));
        }
        
        return {
          ...assignment,
          // Información del cliente
          clientName: client?.businessName || client?.contactName || alarm?.clientName || 'Cliente no disponible',
          accountNumber: client?.clientCode || alarm?.accountNumber || 'N/A',
          businessName: client?.businessName || 'N/A',
          clientCode: client?.clientCode || 'N/A',
          clientAddress: client?.address || alarm?.address || 'Dirección no disponible',
          clientCity: client?.city || alarm?.city || '',
          location: client ? `${client.address || ''}, ${client.city || ''}`.trim() : alarm?.location || 'Ubicación no disponible',
          
          // Información de la alarma
          alarmType: alarm?.type || 'No especificado',
          operatorName: alarm?.operatorName || 'No especificado',
          
          // Información del supervisor
          supervisorName: supervisor 
            ? `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.username 
            : 'N/A',
          supervisorId: supervisor?.id || 'N/A',
          identificationNumber: supervisor?.identificationNumber || 'N/A',
          whatsappNumber: supervisor?.whatsappNumber || 'N/A',
          motorcyclePlate: supervisor?.motorcyclePlate || 'N/A',
          
          // Tiempos calculados
          responseTime,
          arrivalTime,
          onSiteTime,
          totalTime,
          
          // Fechas formateadas para el reporte
          assignedAtFormatted: assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : 'No disponible',
          acceptedAtFormatted: assignment.acceptedAt ? new Date(assignment.acceptedAt).toLocaleString() : 'No disponible',
          arrivedAtFormatted: assignment.arrivedAt ? new Date(assignment.arrivedAt).toLocaleString() : 'No disponible',
          completedAtFormatted: assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : 'No disponible'
        };
      })
    );
    
    res.json(detailedAssignments);
  } catch (error) {
    console.error("Error al obtener asignaciones detalladas:", error);
    res.status(500).json({ message: "Error al obtener las asignaciones detalladas" });
  }
}

// Ruta para implementar en routes.ts
export function registerDetailedAssignmentsRoute(app: any) {
  app.get("/api/assignments/detailed", isAuthenticated, getDetailedAssignments);
}