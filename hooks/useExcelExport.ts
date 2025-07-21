import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FilterOptions {
  supervisorId?: string | null;
  startDate?: Date;
  endDate?: Date;
}

// Función para traducir tipo de evento
const translateEventType = (type: string): string => {
  const translations: Record<string, string> = {
    'intrusion': 'Intrusión',
    'fire': 'Incendio',
    'panic': 'Pánico',
    'technical': 'Técnica',
    'revista_programada': 'Revista Programada',
    'revista_rutina': 'Revista de Rutina'
  };
  return translations[type] || type;
};

// Función para traducir estado
const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'accepted': 'Aceptada',
    'on_site': 'En Sitio',
    'completed': 'Completada',
    'canceled': 'Cancelada',
    'pending': 'Pendiente',
    'dispatched': 'Despachada',
    'active': 'Activa'
  };
  return translations[status] || status;
};

// Función para formatear fecha y hora
const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es });
  } catch (e) {
    return 'Fecha inválida';
  }
};

export function useExcelExport() {
  const { toast } = useToast();

  // Función para exportar los horarios de supervisores
  const exportSupervisorsSchedule = async (filters?: FilterOptions) => {
    try {
      // Construir query string para filtros si existen
      let queryParams = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.supervisorId) {
          params.append('supervisorId', filters.supervisorId);
        }
        if (filters.startDate) {
          params.append('startDate', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          params.append('endDate', filters.endDate.toISOString());
        }
        queryParams = params.toString() ? `?${params.toString()}` : '';
      }

      // Obtener todos los supervisores
      const supervisorsResponse = await fetch('/api/users/by-role/supervisor');
      if (!supervisorsResponse.ok) throw new Error('Error al obtener supervisores');
      let supervisors = await supervisorsResponse.json();
      
      // Aplicar filtro de supervisor si es necesario
      if (filters?.supervisorId && filters.supervisorId !== 'all') {
        supervisors = supervisors.filter((s: any) => s.id.toString() === filters.supervisorId);
      }
      
      // Obtener todos los turnos
      let shiftsUrl = '/api/shifts';
      // Si hay filtros, aplicarlos en la URL
      if (filters?.startDate || filters?.endDate || filters?.supervisorId) {
        const shiftParams = new URLSearchParams();
        
        // Usar un rango de fechas amplio si no se especifica
        if (filters.startDate) {
          shiftParams.append('startDate', filters.startDate.toISOString());
        } else {
          shiftParams.append('startDate', new Date('2023-01-01').toISOString());
        }
        
        if (filters.endDate) {
          shiftParams.append('endDate', filters.endDate.toISOString());
        } else {
          shiftParams.append('endDate', new Date('2030-01-01').toISOString());
        }
        
        if (filters.supervisorId && filters.supervisorId !== 'all') {
          shiftParams.append('userId', filters.supervisorId);
        }
        
        shiftsUrl = `${shiftsUrl}?${shiftParams.toString()}`;
      }
      
      const shiftsResponse = await fetch(shiftsUrl);
      if (!shiftsResponse.ok) throw new Error('Error al obtener turnos');
      const shifts = await shiftsResponse.json();
      
      if (shifts.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay turnos para exportar con los filtros seleccionados",
          variant: "default"
        });
        return null;
      }
      
      // Crear hoja de información de filtros
      const filterInfo = [
        {
          'Fecha de Generación': format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
          'Periodo': filters?.startDate && filters?.endDate
            ? `${format(filters.startDate, 'dd/MM/yyyy', { locale: es })} - ${format(filters.endDate, 'dd/MM/yyyy', { locale: es })}`
            : 'Todos los registros',
          'Supervisor': filters?.supervisorId && filters.supervisorId !== 'all'
            ? (() => {
                const supervisor = supervisors.find((s: any) => s.id.toString() === filters.supervisorId);
                return supervisor 
                  ? `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.username
                  : 'N/A';
              })()
            : 'Todos los supervisores'
        }
      ];
      
      // Traducir tipo de turno
      const translateShiftType = (type: string | null): string => {
        if (!type) return 'N/A';
        
        const translations: Record<string, string> = {
          'morning_8h': 'Mañana (06:00-14:00)',
          'afternoon_8h': 'Tarde (14:00-22:00)',
          'night_12h': 'Noche (18:00-06:00)',
          'morning_12h': 'Día (06:00-18:00)'
        };
        
        return translations[type] || type;
      };
      
      // Traducir tipo de ausencia
      const translateAbsenceType = (type: string | null): string => {
        if (!type) return 'N/A';
        
        const translations: Record<string, string> = {
          'vacation': 'Vacaciones',
          'sick_leave': 'Enfermedad',
          'rest': 'Descanso',
          'permission': 'Permiso',
          'suspension': 'Suspensión'
        };
        
        return translations[type] || type;
      };
      
      // Crear hoja de detalle de turnos
      const detailedShiftsData = shifts.map((shift: any) => {
        // Encontrar el supervisor relacionado
        const supervisor = supervisors.find((s: any) => s.id === shift.userId);
        const supervisorName = supervisor 
          ? `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.username
          : `ID: ${shift.userId}`;
        
        return {
          'ID': shift.id,
          'Supervisor': supervisorName,
          'Identificación': supervisor?.identificationNumber || 'N/A',
          'WhatsApp': supervisor?.whatsappNumber || 'N/A',
          'Placa Moto': supervisor?.motorcyclePlate || 'N/A',
          'Fecha Inicio': formatDateTime(shift.startTime),
          'Fecha Fin': formatDateTime(shift.endTime),
          'Estado': shift.status === 'scheduled' ? 'Programado' : (shift.status === 'absence' ? 'Ausencia' : shift.status),
          'Tipo de Turno': shift.status === 'scheduled' ? translateShiftType(shift.shiftType) : 'N/A',
          'Tipo de Ausencia': shift.status === 'absence' ? translateAbsenceType(shift.absenceType) : 'N/A',
          'Notas': shift.notes || 'N/A',
          'Creado Por': shift.createdBy || 'N/A',
          'Fecha Creación': formatDateTime(shift.createdAt)
        };
      });
      
      // Ordenar por fecha de inicio (más reciente primero)
      detailedShiftsData.sort((a: any, b: any) => {
        const dateA = new Date(a['Fecha Inicio']).getTime();
        const dateB = new Date(b['Fecha Inicio']).getTime();
        return dateB - dateA;
      });
      
      // Agrupar por supervisor para la hoja de resumen
      const shiftsBySupervisor: Record<string, any[]> = {};
      detailedShiftsData.forEach((shift: any) => {
        const supervisorName = shift['Supervisor'];
        if (!shiftsBySupervisor[supervisorName]) {
          shiftsBySupervisor[supervisorName] = [];
        }
        shiftsBySupervisor[supervisorName].push(shift);
      });
      
      // Crear resumen por supervisor
      const supervisorSummaryData = Object.entries(shiftsBySupervisor).map(([supervisorName, supervisorShifts]) => {
        // Contar tipos de turnos y ausencias
        let scheduledShifts = 0;
        let absences = 0;
        const shiftTypes: Record<string, number> = {};
        const absenceTypes: Record<string, number> = {};
        
        supervisorShifts.forEach((shift) => {
          if (shift['Estado'] === 'Programado') {
            scheduledShifts++;
            const shiftType = shift['Tipo de Turno'];
            shiftTypes[shiftType] = (shiftTypes[shiftType] || 0) + 1;
          } else if (shift['Estado'] === 'Ausencia') {
            absences++;
            const absenceType = shift['Tipo de Ausencia'];
            absenceTypes[absenceType] = (absenceTypes[absenceType] || 0) + 1;
          }
        });
        
        return {
          'Supervisor': supervisorName,
          'Total Turnos': supervisorShifts.length,
          'Turnos Programados': scheduledShifts,
          'Ausencias': absences,
          'Turnos Mañana': shiftTypes['Mañana (06:00-14:00)'] || 0,
          'Turnos Tarde': shiftTypes['Tarde (14:00-22:00)'] || 0,
          'Turnos Día': shiftTypes['Día (06:00-18:00)'] || 0,
          'Turnos Noche': shiftTypes['Noche (18:00-06:00)'] || 0,
          'Vacaciones': absenceTypes['Vacaciones'] || 0,
          'Enfermedad': absenceTypes['Enfermedad'] || 0,
          'Descanso': absenceTypes['Descanso'] || 0,
          'Permiso': absenceTypes['Permiso'] || 0,
          'Suspensión': absenceTypes['Suspensión'] || 0
        };
      });
      
      // Crear hoja de calendario semanal por supervisor
      const calendarData: any[] = [];
      
      // Agrupar turnos por semana y supervisor
      const shiftsByWeekAndSupervisor: Record<string, Record<string, any[]>> = {};
      
      shifts.forEach((shift: any) => {
        const startDate = new Date(shift.startTime);
        const supervisor = supervisors.find((s: any) => s.id === shift.userId);
        const supervisorName = supervisor 
          ? `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.username
          : `ID: ${shift.userId}`;
        
        // Obtener lunes de la semana actual
        const dayOfWeek = startDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Domingo = 0, Lunes = 1, etc.
        const monday = new Date(startDate);
        monday.setDate(monday.getDate() + mondayOffset);
        
        // Formato de fecha para la clave de la semana (YYYY-MM-DD del lunes)
        const weekKey = format(monday, 'yyyy-MM-dd');
        
        // Inicializar estructura si no existe
        if (!shiftsByWeekAndSupervisor[weekKey]) {
          shiftsByWeekAndSupervisor[weekKey] = {};
        }
        
        if (!shiftsByWeekAndSupervisor[weekKey][supervisorName]) {
          shiftsByWeekAndSupervisor[weekKey][supervisorName] = [];
        }
        
        // Agregar el turno al grupo correspondiente
        shiftsByWeekAndSupervisor[weekKey][supervisorName].push(shift);
      });
      
      // Generar datos de calendario por semana
      Object.entries(shiftsByWeekAndSupervisor).forEach(([weekKey, supervisors]) => {
        const mondayDate = new Date(weekKey);
        
        // Generar encabezado para esta semana
        const weekHeader = {
          'Semana': `${format(mondayDate, 'dd/MM/yyyy', { locale: es })} al ${
            format(new Date(mondayDate.getTime() + 6 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy', { locale: es })
          }`
        };
        
        calendarData.push(weekHeader);
        calendarData.push({}); // Fila vacía para separación
        
        // Agregar fila de días de la semana
        const daysRow: Record<string, string> = { 'Supervisor': '' };
        for (let i = 0; i < 7; i++) {
          const day = new Date(mondayDate);
          day.setDate(day.getDate() + i);
          daysRow[`Día ${i+1}`] = format(day, 'EEE dd/MM', { locale: es });
        }
        calendarData.push(daysRow);
        
        // Agregar fila por cada supervisor con sus turnos
        Object.entries(supervisors).forEach(([supervisorName, shifts]) => {
          const supervisorRow: Record<string, string> = { 'Supervisor': supervisorName };
          
          // Inicializar todos los días sin datos
          for (let i = 1; i <= 7; i++) {
            supervisorRow[`Día ${i}`] = '-';
          }
          
          // Llenar con los turnos existentes
          shifts.forEach((shift: any) => {
            const shiftDate = new Date(shift.startTime);
            const dayDiff = Math.floor((shiftDate.getTime() - mondayDate.getTime()) / (24 * 60 * 60 * 1000));
            
            if (dayDiff >= 0 && dayDiff < 7) {
              let shiftText = '';
              
              if (shift.status === 'scheduled' && shift.shiftType) {
                shiftText = translateShiftType(shift.shiftType);
              } else if (shift.status === 'absence' && shift.absenceType) {
                shiftText = translateAbsenceType(shift.absenceType);
              } else {
                shiftText = shift.status;
              }
              
              supervisorRow[`Día ${dayDiff + 1}`] = shiftText;
            }
          });
          
          calendarData.push(supervisorRow);
        });
        
        // Agregar filas vacías para separar entre semanas
        calendarData.push({});
        calendarData.push({});
      });
      
      // Fecha en el nombre del archivo
      const dateRangeStr = filters?.startDate && filters?.endDate
        ? `_${format(filters.startDate, 'yyyyMMdd', { locale: es })}_${format(filters.endDate, 'yyyyMMdd', { locale: es })}`
        : `_${format(new Date(), 'yyyyMMdd', { locale: es })}`;
      
      // Nombre del supervisor en el archivo si está filtrado
      const supervisorStr = filters?.supervisorId && filters.supervisorId !== 'all'
        ? `_${(() => {
            const supervisor = supervisors.find((s: any) => s.id.toString() === filters.supervisorId);
            return supervisor 
              ? `${supervisor.firstName || ''}_${supervisor.lastName || ''}`.trim().replace(/\s+/g, '_')
              : 'Supervisor';
          })()}`
        : '';
      
      // Crear workbook completo
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filterInfo), 'Información');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(supervisorSummaryData), 'Resumen por Supervisor');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedShiftsData), 'Detalle de Turnos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(calendarData), 'Calendario Semanal');
      
      // Generar archivo con nombre que incluye fecha y supervisor si aplica
      const fileName = `Horarios_Supervisores${supervisorStr}${dateRangeStr}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Reporte generado",
        description: "El reporte de horarios ha sido generado correctamente",
      });
      
      return fileName;
    } catch (error) {
      console.error("Error al generar reporte de horarios:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el reporte Excel",
        variant: "destructive"
      });
      return null;
    }
  };

  const exportSupervisorsReport = async (supervisorsData: any, filters?: FilterOptions) => {
    if (!supervisorsData) {
      toast({
        title: "Error",
        description: "No hay datos para exportar",
        variant: "destructive"
      });
      return;
    }

    try {
      // Construir query string para filtros si existen
      let queryParams = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.supervisorId) {
          params.append('supervisorId', filters.supervisorId);
        }
        if (filters.startDate) {
          params.append('startDate', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          params.append('endDate', filters.endDate.toISOString());
        }
        queryParams = params.toString() ? `?${params.toString()}` : '';
      }

      // Obtener todos los supervisores (filtrados si hay un ID específico)
      const supervisorsResponse = await fetch('/api/users/by-role/supervisor');
      if (!supervisorsResponse.ok) throw new Error('Error al obtener supervisores');
      let supervisors = await supervisorsResponse.json();
      
      // Aplicar filtro de supervisor si es necesario
      if (filters?.supervisorId && filters.supervisorId !== 'all') {
        supervisors = supervisors.filter((s: any) => s.id.toString() === filters.supervisorId);
      }
      
      // Obtener todas las asignaciones (con filtros aplicados)
      const assignmentsUrl = filters ? `/api/assignments/detailed${queryParams}` : '/api/assignments/detailed';
      const assignmentsResponse = await fetch(assignmentsUrl);
      if (!assignmentsResponse.ok) throw new Error('Error al obtener asignaciones');
      let assignments = await assignmentsResponse.json();
      
      // Obtener todas las alarmas para tener referencias
      const alarmsResponse = await fetch('/api/alarms');
      if (!alarmsResponse.ok) throw new Error('Error al obtener alarmas');
      const alarms = await alarmsResponse.json();
      
      // Obtener todos los clientes
      const clientsResponse = await fetch('/api/clients');
      if (!clientsResponse.ok) throw new Error('Error al obtener clientes');
      const clients = await clientsResponse.json();
      
      // Filtrar por fecha si es necesario
      if (filters?.startDate && filters?.endDate) {
        const startTimestamp = filters.startDate.getTime();
        const endTimestamp = filters.endDate.getTime();
        
        assignments = assignments.filter((assignment: any) => {
          if (!assignment.assignedAt) return false;
          const assignedTimestamp = new Date(assignment.assignedAt).getTime();
          return assignedTimestamp >= startTimestamp && assignedTimestamp <= endTimestamp;
        });
      }
      
      // Filtrar por supervisor si es necesario
      if (filters?.supervisorId && filters.supervisorId !== 'all') {
        assignments = assignments.filter((assignment: any) => 
          assignment.supervisorId === parseInt(filters.supervisorId as string)
        );
      }
      
      // Información de filtros para el encabezado del reporte
      const filterInfo = {
        'Fecha de Generación': format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        'Periodo': filters?.startDate && filters?.endDate
          ? `${format(filters.startDate, 'dd/MM/yyyy', { locale: es })} - ${format(filters.endDate, 'dd/MM/yyyy', { locale: es })}`
          : 'Todos los registros',
        'Supervisor': filters?.supervisorId && filters.supervisorId !== 'all'
          ? (() => {
              const supervisor = supervisors.find((s: any) => s.id.toString() === filters.supervisorId);
              return supervisor 
                ? `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.username
                : 'N/A';
            })()
          : 'Todos los supervisores'
      };
      
      // Crear hoja de resumen con información de filtros
      const summaryData = [
        {
          ...filterInfo,
          'Total Supervisores': supervisorsData.supervisorCount,
          'Total Asignaciones': supervisorsData.totalAssignments,
          'Tiempo Promedio de Respuesta (min)': supervisorsData.avgResponseTime
        }
      ];
      
      // Crear hoja de rendimiento individual
      const performanceData = supervisorsData.performance.map((item: any) => {
        // Encontrar el supervisor relacionado para obtener nombres completos
        const supervisor = supervisors.find((s: any) => 
          s.id === parseInt(item.id) || 
          s.id.toString() === item.id || 
          `${s.firstName} ${s.lastName}` === item.name
        );
        
        return {
          'ID': supervisor?.id || 'N/A',
          'Nombre': supervisor?.firstName || item.name.split(' ')[0] || 'N/A',
          'Apellido': supervisor?.lastName || (item.name.split(' ').length > 1 ? item.name.split(' ')[1] : '') || 'N/A',
          'Nombre Completo': supervisor ? `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() : item.name,
          'Identificación': supervisor?.identificationNumber || 'N/A',
          'WhatsApp': supervisor?.whatsappNumber || 'N/A',
          'Placa Moto': supervisor?.motorcyclePlate || 'N/A',
          'Alarmas Respondidas': item.alarmasRespondidas,
          'Tiempo Promedio (min)': item.tiempoPromedio
        };
      });
      
      // Crear hoja con asignaciones detalladas para cada supervisor
      const detailedAssignmentsData: any[] = [];
      
      // Procesar cada asignación con la información completa
      assignments.forEach((assignment: any) => {
        const supervisor = supervisors.find((s: any) => s.id === assignment.supervisorId);
        if (!supervisor) return; // Omitir si no se encuentra el supervisor
        
        const alarm = alarms.find((a: any) => a.id === assignment.alarmId);
        const client = alarm?.clientId ? clients.find((c: any) => c.id === alarm.clientId) : null;
        
        // Calcular tiempos
        let responseTime = null;
        if (assignment.acceptedAt && assignment.assignedAt) {
          responseTime = Math.round(
            (new Date(assignment.acceptedAt).getTime() - new Date(assignment.assignedAt).getTime()) / (1000 * 60)
          );
        }
        
        let arrivalTime = null;
        if (assignment.arrivedAt && assignment.acceptedAt) {
          arrivalTime = Math.round(
            (new Date(assignment.arrivedAt).getTime() - new Date(assignment.acceptedAt).getTime()) / (1000 * 60)
          );
        }
        
        let totalTime = null;
        if (assignment.completedAt && assignment.assignedAt) {
          totalTime = Math.round(
            (new Date(assignment.completedAt).getTime() - new Date(assignment.assignedAt).getTime()) / (1000 * 60)
          );
        }
        
        // Determinar tipo de evento
        let alarmType = alarm?.type || assignment.alarmType || 'N/A';
        const translatedAlarmType = translateEventType(alarmType);
        
        detailedAssignmentsData.push({
          'ID Asignación': assignment.id,
          'Supervisor': `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim(),
          'Identificación': supervisor.identificationNumber || 'N/A',
          'WhatsApp': supervisor.whatsappNumber || 'N/A',
          'Placa Moto': supervisor.motorcyclePlate || 'N/A',
          'ID Alarma': assignment.alarmId || 'N/A',
          'Número de Cuenta': client?.accountNumber || assignment.clientCode || 'N/A',
          'Razón Social': client?.businessName || assignment.clientName || 'N/A',
          'Tipo de Evento': translatedAlarmType,
          'Dirección': assignment.location || (client ? `${client.address || ''}, ${client.city || ''}`.trim() : 'N/A'),
          'Estado': translateStatus(assignment.status || 'N/A'),
          'Fecha/Hora Asignación': formatDateTime(assignment.assignedAt),
          'Fecha/Hora Aceptación': formatDateTime(assignment.acceptedAt),
          'Fecha/Hora Llegada': formatDateTime(assignment.arrivedAt),
          'Fecha/Hora Finalización': formatDateTime(assignment.completedAt),
          'Tiempo Respuesta (min)': responseTime !== null ? responseTime : 'N/A',
          'Tiempo Llegada (min)': arrivalTime !== null ? arrivalTime : 'N/A',
          'Tiempo Total (min)': totalTime !== null ? totalTime : 'N/A',
          'Notas': assignment.notes || ''
        });
      });
      
      // Crear hoja específica para revistas
      const reviewsData = detailedAssignmentsData.filter((item: any) => 
        item['Tipo de Evento'] === 'Revista Programada' || 
        item['Tipo de Evento'] === 'Revista de Rutina'
      );
      
      // Ordenar las asignaciones por fecha (más reciente primero)
      detailedAssignmentsData.sort((a, b) => {
        const dateA = a['Fecha/Hora Asignación'] !== 'N/A' ? 
          new Date(a['Fecha/Hora Asignación']).getTime() : 0;
        const dateB = b['Fecha/Hora Asignación'] !== 'N/A' ? 
          new Date(b['Fecha/Hora Asignación']).getTime() : 0;
        return dateB - dateA;
      });
      
      // Crear hoja de informe consolidado por supervisor
      // Agrupar asignaciones por supervisor
      const assignmentsBySupervisor: Record<string, any[]> = {};
      detailedAssignmentsData.forEach(assignment => {
        const supervisorName = assignment['Supervisor'];
        if (!assignmentsBySupervisor[supervisorName]) {
          assignmentsBySupervisor[supervisorName] = [];
        }
        assignmentsBySupervisor[supervisorName].push(assignment);
      });
      
      // Crear resumen por supervisor
      const supervisorSummaryData = Object.entries(assignmentsBySupervisor).map(([supervisorName, assignments]) => {
        // Calcular promedios de tiempo y totales
        let totalResponseTime = 0;
        let totalArrivalTime = 0;
        let assignmentsWithResponseTime = 0;
        let assignmentsWithArrivalTime = 0;
        
        const alarmTypes: Record<string, number> = {};
        const statuses: Record<string, number> = {};
        
        assignments.forEach(assignment => {
          // Contar tipos de alarma
          const alarmType = assignment['Tipo de Evento'];
          alarmTypes[alarmType] = (alarmTypes[alarmType] || 0) + 1;
          
          // Contar estados
          const status = assignment['Estado'];
          statuses[status] = (statuses[status] || 0) + 1;
          
          // Sumar tiempos
          if (assignment['Tiempo Respuesta (min)'] !== 'N/A') {
            totalResponseTime += parseInt(assignment['Tiempo Respuesta (min)']);
            assignmentsWithResponseTime++;
          }
          
          if (assignment['Tiempo Llegada (min)'] !== 'N/A') {
            totalArrivalTime += parseInt(assignment['Tiempo Llegada (min)']);
            assignmentsWithArrivalTime++;
          }
        });
        
        const avgResponseTime = assignmentsWithResponseTime > 0 
          ? Math.round((totalResponseTime / assignmentsWithResponseTime) * 10) / 10 
          : 'N/A';
        
        const avgArrivalTime = assignmentsWithArrivalTime > 0 
          ? Math.round((totalArrivalTime / assignmentsWithArrivalTime) * 10) / 10 
          : 'N/A';
        
        // Identificar la asignación más reciente y la más antigua
        const dateFormat = 'dd/MM/yyyy HH:mm:ss';
        
        return {
          'Supervisor': supervisorName,
          'Total Asignaciones': assignments.length,
          'Tiempo Promedio Respuesta (min)': avgResponseTime,
          'Tiempo Promedio Llegada (min)': avgArrivalTime,
          'Alarmas': alarmTypes['Intrusión'] || 0,
          'Incendios': alarmTypes['Incendio'] || 0,
          'Pánicos': alarmTypes['Pánico'] || 0,
          'Técnicas': alarmTypes['Técnica'] || 0,
          'Revistas Programadas': alarmTypes['Revista Programada'] || 0,
          'Revistas Rutina': alarmTypes['Revista de Rutina'] || 0,
          'Completadas': statuses['Completada'] || 0,
          'En Sitio': statuses['En Sitio'] || 0,
          'Canceladas': statuses['Cancelada'] || 0
        };
      });
      
      // Fecha en el nombre del archivo
      const dateRangeStr = filters?.startDate && filters?.endDate
        ? `_${format(filters.startDate, 'yyyyMMdd', { locale: es })}_${format(filters.endDate, 'yyyyMMdd', { locale: es })}`
        : `_${format(new Date(), 'yyyyMMdd', { locale: es })}`;
      
      // Nombre del supervisor en el archivo si está filtrado
      const supervisorStr = filters?.supervisorId && filters.supervisorId !== 'all'
        ? `_${(() => {
            const supervisor = supervisors.find((s: any) => s.id.toString() === filters.supervisorId);
            return supervisor 
              ? `${supervisor.firstName || ''}_${supervisor.lastName || ''}`.trim().replace(/\s+/g, '_')
              : 'Supervisor';
          })()}`
        : '';
      
      // Crear workbook completo
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Resumen');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(supervisorSummaryData), 'Por Supervisor');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(performanceData), 'Rendimiento');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedAssignmentsData), 'Detalle Asignaciones');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reviewsData), 'Revistas');
      
      // Generar archivo con nombre que incluye fecha y supervisor si aplica
      const fileName = `Reporte_Supervisores${supervisorStr}${dateRangeStr}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Reporte generado",
        description: "El reporte Excel ha sido generado correctamente con todos los detalles solicitados.",
      });
      
      return fileName;
    } catch (error) {
      console.error("Error al generar reporte detallado:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el reporte Excel",
        variant: "destructive"
      });
      return null;
    }
  };

  return { exportSupervisorsReport, exportSupervisorsSchedule };
}