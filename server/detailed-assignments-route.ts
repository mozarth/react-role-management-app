// Ruta para obtener asignaciones detalladas para reportes
export const detailedAssignmentsRoute = `
  // Obtener asignaciones detalladas para reportes
  app.get("/api/assignments/detailed", isAuthenticated, async (req, res) => {
    try {
      // Obtener todas las asignaciones
      const assignments = await storage.getPatrolAssignmentsByDateRange();
      
      // Para cada asignación, obtener información detallada
      const detailedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          // Obtener detalles de la alarma
          const alarm = assignment.alarmId ? await storage.getAlarm(assignment.alarmId) : null;
          
          // Obtener detalles del cliente
          const client = alarm?.clientId ? await storage.getClient(alarm.clientId) : null;
          
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
            clientName: client?.name || 'Cliente no disponible',
            accountNumber: client?.accountNumber || 'N/A',
            businessName: client?.businessName || 'N/A',
            clientAddress: client?.address || 'Dirección no disponible',
            clientCity: client?.city || '',
            location: client ? \`\${client.address || ''}, \${client.city || ''}\`.trim() : 'Ubicación no disponible',
            alarmType: alarm?.type || 'No especificado',
            responseTime,
            arrivalTime,
            onSiteTime,
            totalTime,
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
  });
`;