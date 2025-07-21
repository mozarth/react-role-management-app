import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfWeek, subWeeks, addWeeks, eachDayOfInterval, isSameDay, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useExcelExport } from '@/hooks/useExcelExport';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  X,
  Save,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { ShiftType, ShiftTypeType, AbsenceType, AbsenceTypeType, UserRole } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { UserRole as UserRoleConst } from '@/lib/constants';

// Definimos los tipos de turnos específicos para operadores
const OperatorShiftType = {
  MORNING: 'morning_8h', // 6:00-14:00
  AFTERNOON: 'afternoon_8h', // 14:00-22:00
  NIGHT: 'night_12h', // 18:00-6:00
  DAY: 'morning_12h', // 6:00-18:00
};

type OperatorShiftTypeType = typeof OperatorShiftType[keyof typeof OperatorShiftType];

interface Operator {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface Shift {
  id: number;
  userId: number;
  startTime: string;
  endTime: string;
  status: string;
  shiftType?: string;
  absenceType?: string;
  notes?: string;
}

type FilterOptions = {
  startDate?: Date;
  endDate?: Date;
  operatorId?: string | null;
};

export default function OperatorShiftsStandalone() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { exportSupervisorsSchedule } = useExcelExport();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Estados para la UI
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Semana comienza en lunes
  });
  
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  
  // Estados para el diálogo de exportación
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(new Date());
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [exportOperatorId, setExportOperatorId] = useState<string>('all');
  
  // Estado para los turnos por día
  const [weekShifts, setWeekShifts] = useState<{
    [key: string]: ShiftTypeType | AbsenceTypeType | null;
  }>({});
  
  // Generar los días de la semana actual
  const daysOfWeek = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });
  
  // Comprobar si el usuario tiene permisos para crear turnos
  const canCreateShifts = user?.role === UserRoleConst.ADMIN || user?.role === UserRoleConst.DIRECTOR;
  
  // Obtener los operadores
  const { data: operators = [], isLoading: isLoadingOperators } = useQuery({
    queryKey: ['/api/users/by-role/alarm_operator'],
  });
  
  // Obtener todos los turnos con un rango amplio de fechas
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: [`/api/shifts?startDate=${new Date('2023-01-01').toISOString()}&endDate=${new Date('2030-01-01').toISOString()}`],
  });

  // Mutación para crear un nuevo turno
  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      try {
        const response = await fetch('/api/shifts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shiftData),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error en la solicitud POST:", response.status, errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error creando turno:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Turnos guardados",
        description: "Los turnos han sido asignados exitosamente",
      });
    },
    onError: (error: any) => {
      console.error("Error guardando turno:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el turno",
        variant: "destructive"
      });
    }
  });

  // Mutación para eliminar un turno
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      try {
        const response = await fetch(`/api/shifts/${shiftId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error en la eliminación:", response.status, errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        return true;
      } catch (error) {
        console.error("Error eliminando turno:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Turno eliminado",
        description: "El turno ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      console.error("Error eliminando turno:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el turno",
        variant: "destructive"
      });
    }
  });
  
  // Navegar entre semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(direction === 'prev' 
      ? subWeeks(currentWeekStart, 1) 
      : addWeeks(currentWeekStart, 1)
    );
    // Limpiar los turnos de la semana al cambiar de semana
    setWeekShifts({});
  };
  
  // Función para exportar los horarios a Excel
  const handleExportSchedule = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar un rango de fechas válido",
        variant: "destructive"
      });
      return;
    }
    
    // Si la fecha de fin es anterior a la fecha de inicio, intercambiarlas
    let startDate = exportStartDate;
    let endDate = exportEndDate;
    
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }
    
    // Configurar los filtros para la exportación
    const filters = {
      startDate,
      endDate,
      operatorId: exportOperatorId === 'all' ? null : exportOperatorId
    };
    
    // Ejecutar la exportación
    const fileName = await exportSupervisorsSchedule(filters); // Reusamos la misma función pero filtramos por operadores
    
    if (fileName) {
      // Cerrar el diálogo si la exportación fue exitosa
      setExportDialogOpen(false);
    }
  };
  
  // Obtener los turnos para un día específico y un operador específico
  const getShiftsForOperatorAndDate = (operatorId: number, date: Date) => {
    return shifts.filter((shift: Shift) => {
      const shiftStartDate = new Date(shift.startTime);
      return isSameDay(shiftStartDate, date) && shift.userId === operatorId;
    });
  };

  // Cargar los turnos existentes del operador seleccionado
  useEffect(() => {
    if (selectedOperator) {
      const newWeekShifts: { [key: string]: ShiftTypeType | AbsenceTypeType | null } = {};
      
      daysOfWeek.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const operatorShifts = getShiftsForOperatorAndDate(selectedOperator.id, day);
        
        if (operatorShifts.length > 0) {
          const shift = operatorShifts[0];
          if (shift.status === 'absence' && shift.absenceType) {
            newWeekShifts[dateKey] = shift.absenceType as AbsenceTypeType;
          } else if (shift.shiftType) {
            newWeekShifts[dateKey] = shift.shiftType as ShiftTypeType;
          }
        }
      });
      
      setWeekShifts(newWeekShifts);
    }
  }, [selectedOperator, shifts]);
  
  // Establecer un turno para un día específico
  const setShiftForDay = (day: Date, shiftType: ShiftTypeType | AbsenceTypeType | null) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    setWeekShifts(prev => ({
      ...prev,
      [dateKey]: shiftType
    }));
  };

  // Obtener el ID del turno para un operador y un día específico
  const getShiftId = (operatorId: number, date: Date) => {
    const operatorShifts = getShiftsForOperatorAndDate(operatorId, date);
    if (operatorShifts.length > 0) {
      return operatorShifts[0].id;
    }
    return null;
  };

  // Eliminar un turno existente
  const handleDeleteShift = (operatorId: number, day: Date) => {
    const shiftId = getShiftId(operatorId, day);
    if (shiftId && confirm('¿Estás seguro de eliminar este turno?')) {
      deleteShiftMutation.mutate(shiftId);
      // Actualizar también el estado local
      const dateKey = format(day, 'yyyy-MM-dd');
      setWeekShifts(prev => {
        const newShifts = { ...prev };
        delete newShifts[dateKey];
        return newShifts;
      });
    }
  };

  // Guardar todos los turnos asignados
  const saveAllShifts = () => {
    if (!selectedOperator) {
      toast({
        title: "Error",
        description: "Selecciona un operador para asignar turnos",
        variant: "destructive"
      });
      return;
    }

    const shiftsToCreate = [];

    for (const [dateKey, shiftValue] of Object.entries(weekShifts)) {
      const day = new Date(dateKey);
      const existingShiftId = getShiftId(selectedOperator.id, day);
      
      if (existingShiftId) {
        // Si ya existe un turno para este día, lo eliminamos primero
        deleteShiftMutation.mutate(existingShiftId);
      }

      let startHour, endHour, isAbsence = false;

      // Determinar si es un tipo de ausencia
      if (Object.values(AbsenceType).includes(shiftValue as AbsenceTypeType)) {
        isAbsence = true;
      } else {
        // Si no es ausencia, es un tipo de turno
        startHour = shiftValue === OperatorShiftType.MORNING ? 6 : // Mañana: 6-14
                    shiftValue === OperatorShiftType.AFTERNOON ? 14 : // Tarde: 14-22
                    shiftValue === OperatorShiftType.DAY ? 6 : // Día: 6-18
                    18; // Noche: 18-6
                        
        endHour = shiftValue === OperatorShiftType.MORNING ? 14 : 
                  shiftValue === OperatorShiftType.AFTERNOON ? 22 : 
                  shiftValue === OperatorShiftType.DAY ? 18 : 
                  6;
      }

      const startDate = new Date(day);
      if (!isAbsence) {
        startDate.setHours(startHour!, 0, 0);
      } else {
        startDate.setHours(0, 0, 0);
      }
      
      const endDate = new Date(day);
      if (!isAbsence) {
        if (shiftValue === OperatorShiftType.NIGHT) {
          // Para el turno nocturno, el fin es al día siguiente
          endDate.setDate(endDate.getDate() + 1);
        }
        endDate.setHours(endHour!, 0, 0);
      } else {
        endDate.setHours(23, 59, 59);
      }
      
      const shiftData = {
        userId: selectedOperator.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        status: isAbsence ? 'absence' : 'scheduled',
        shiftType: isAbsence ? null : shiftValue,
        absenceType: isAbsence ? shiftValue : null,
        notes: null
      };
      
      console.log("Preparando turno para enviar:", shiftData);
      
      shiftsToCreate.push(shiftData);
    }

    // Crear todos los turnos de una vez
    if (shiftsToCreate.length === 0) {
      toast({
        title: "Aviso",
        description: "No hay turnos para guardar. Asigna al menos un turno.",
        variant: "default"
      });
      return;
    }
    
    toast({
      title: "Guardando turnos...",
      description: "Procesando la asignación de turnos",
    });
    
    // Crear los turnos con fetch directo para tener mejor control de errores
    const createShiftsSequentially = async () => {
      const results = [];
      for (const shiftData of shiftsToCreate) {
        console.log("Enviando datos de turno:", shiftData);
        try {
          // Los datos ya vienen con fechas en formato ISO String
          const formattedShiftData = {
            userId: Number(shiftData.userId),
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            status: shiftData.status,
            shiftType: shiftData.shiftType,
            absenceType: shiftData.absenceType,
            notes: null
          };
          
          // Usar fetch directo para tener más control sobre la respuesta
          const response = await fetch('/api/shifts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedShiftData),
            credentials: 'include',
          });
          
          // Manejar errores más detalladamente
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error ${response.status}: ${errorText}`);
            toast({
              variant: "destructive",
              title: `Error al guardar turno`,
              description: `Código ${response.status}: Verifica los datos e intenta de nuevo.`,
            });
            results.push({ status: 'rejected', reason: new Error(errorText) });
          } else {
            const data = await response.json();
            results.push({ status: 'fulfilled', value: data });
          }
        } catch (error: any) {
          console.error("Error en la petición:", error);
          toast({
            variant: "destructive",
            title: "Error al guardar turno",
            description: error.message || "Error desconocido",
          });
          results.push({ status: 'rejected', reason: error });
        }
      }
      return results;
    };
    
    // Ejecutar las creaciones secuencialmente
    createShiftsSequentially()
      .then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
        
        if (failed === 0) {
          toast({
            title: "Turnos guardados",
            description: `Se han asignado ${successful} turnos para ${getOperatorName(selectedOperator)}`,
          });
        } else if (successful > 0) {
          toast({
            title: "Turnos guardados parcialmente",
            description: `Se asignaron ${successful} turnos, pero fallaron ${failed}`,
            variant: "default"
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo guardar ningún turno",
            variant: "destructive"
          });
        }
        
        // Mostrar errores en consola para debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Error en turno ${index}:`, (result as PromiseRejectedResult).reason);
          }
        });
      });
  };
  
  // Obtener el nombre del operador
  const getOperatorName = (operator: Operator) => {
    if (operator.firstName && operator.lastName) {
      return `${operator.firstName} ${operator.lastName}`;
    }
    return operator.username;
  };

  const shiftColors = {
    [OperatorShiftType.MORNING]: 'bg-blue-100 text-blue-800 border-blue-300',
    [OperatorShiftType.AFTERNOON]: 'bg-orange-100 text-orange-800 border-orange-300',
    [OperatorShiftType.NIGHT]: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    [OperatorShiftType.DAY]: 'bg-green-100 text-green-800 border-green-300',
    [AbsenceType.VACATION]: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    [AbsenceType.SICK_LEAVE]: 'bg-red-100 text-red-800 border-red-300',
    [AbsenceType.REST]: 'bg-gray-100 text-gray-800 border-gray-300',
    [AbsenceType.PERMISSION]: 'bg-violet-100 text-violet-800 border-violet-300',
    [AbsenceType.SUSPENSION]: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const shiftTypeText = {
    [OperatorShiftType.MORNING]: 'Mañana',
    [OperatorShiftType.AFTERNOON]: 'Tarde',
    [OperatorShiftType.NIGHT]: 'Noche',
    [OperatorShiftType.DAY]: 'Día',
    [AbsenceType.VACATION]: 'Vacaciones',
    [AbsenceType.SICK_LEAVE]: 'Enfermedad',
    [AbsenceType.REST]: 'Descanso',
    [AbsenceType.PERMISSION]: 'Permiso',
    [AbsenceType.SUSPENSION]: 'Suspensión',
  };

  // Renderizar la agenda semanal de todos los operadores
  const renderAllOperatorsSchedule = () => {
    // Si no hay datos, mostrar un mensaje
    if (isLoadingOperators || isLoadingShifts) {
      return <div className="text-center p-6">Cargando datos de turnos...</div>;
    }

    if (!operators || operators.length === 0) {
      return <div className="text-center p-6">No hay operadores disponibles</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operador
              </th>
              {daysOfWeek.map((day) => (
                <th 
                  key={format(day, 'yyyy-MM-dd')} 
                  scope="col" 
                  className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div>{format(day, 'EEE', { locale: es })}</div>
                  <div className="text-lg font-bold">{format(day, 'd', { locale: es })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operators.map((operator: any) => (
              <tr key={operator.id}>
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getOperatorName(operator)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {operator.role}
                      </div>
                    </div>
                  </div>
                </td>
                {daysOfWeek.map((day) => {
                  const operatorShifts = getShiftsForOperatorAndDate(operator.id, day);
                  
                  if (operatorShifts.length === 0) {
                    return (
                      <td 
                        key={format(day, 'yyyy-MM-dd')} 
                        className="p-4 whitespace-nowrap text-center text-sm"
                      >
                        -
                      </td>
                    );
                  }
                  
                  const shift = operatorShifts[0];
                  const shiftType = shift.status === 'absence' ? shift.absenceType : shift.shiftType;
                  
                  return (
                    <td 
                      key={format(day, 'yyyy-MM-dd')} 
                      className="p-4 whitespace-nowrap text-center text-sm"
                    >
                      <div 
                        className={`inline-flex min-w-20 px-2.5 py-1 rounded-full ${
                          shiftType && shiftColors[shiftType as ShiftTypeType | AbsenceTypeType]
                        }`}
                      >
                        {shiftType && shiftTypeText[shiftType as ShiftTypeType | AbsenceTypeType]}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar la agenda semanal para un operador específico
  const renderOperatorSchedule = () => {
    if (!selectedOperator) {
      return (
        <div className="text-center p-6">
          Selecciona un operador para ver y editar sus turnos
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {daysOfWeek.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const shiftType = weekShifts[dateKey];
            
            return (
              <div 
                key={dateKey} 
                className="border rounded-lg p-4 text-center"
              >
                <div className="mb-2">
                  <div className="font-medium">{format(day, 'EEEE', { locale: es })}</div>
                  <div className="text-2xl font-bold">{format(day, 'd', { locale: es })}</div>
                </div>
                
                <div className="h-20 flex items-center justify-center">
                  {shiftType ? (
                    <div 
                      className={`w-full px-3 py-2 rounded-lg ${shiftColors[shiftType]} hover:brightness-95 cursor-pointer`}
                      onClick={() => {
                        if (!canCreateShifts) return;
                        // Mostrar menú para cambiar el turno
                        const options = [
                          { label: 'Mañana (6:00-14:00)', value: OperatorShiftType.MORNING },
                          { label: 'Día (6:00-18:00)', value: OperatorShiftType.DAY },
                          { label: 'Tarde (14:00-22:00)', value: OperatorShiftType.AFTERNOON },
                          { label: 'Noche (18:00-6:00)', value: OperatorShiftType.NIGHT },
                          { label: 'Descanso', value: AbsenceType.REST },
                          { label: 'Vacaciones', value: AbsenceType.VACATION },
                          { label: 'Permiso', value: AbsenceType.PERMISSION },
                          { label: 'Eliminar', value: null },
                        ];
                        
                        // Crear un menú desplegable
                        const shiftDialog = document.createElement('div');
                        shiftDialog.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
                        shiftDialog.style.zIndex = '9999';
                        
                        const dialogContent = document.createElement('div');
                        dialogContent.className = 'bg-white rounded-lg p-4 max-w-sm w-full';
                        
                        // Título del diálogo
                        const title = document.createElement('h3');
                        title.className = 'font-semibold text-lg mb-3 flex justify-between items-center';
                        title.textContent = `Turno: ${format(day, 'EEEE dd/MM', { locale: es })}`;
                        
                        // Botón para cerrar
                        const closeButton = document.createElement('button');
                        closeButton.className = 'text-gray-500 hover:text-gray-700';
                        closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                        closeButton.onclick = () => document.body.removeChild(shiftDialog);
                        
                        title.appendChild(closeButton);
                        dialogContent.appendChild(title);
                        
                        // Opciones de turnos
                        const optionsContainer = document.createElement('div');
                        optionsContainer.className = 'space-y-2';
                        
                        options.forEach(option => {
                          if (option.value === null) return; // La opción "Eliminar" va aparte
                          
                          const optionButton = document.createElement('button');
                          optionButton.className = `w-full text-left px-3 py-2 rounded ${
                            option.value ? shiftColors[option.value as ShiftTypeType | AbsenceTypeType] : ''
                          } hover:brightness-95`;
                          optionButton.textContent = option.label;
                          optionButton.onclick = () => {
                            setShiftForDay(day, option.value as ShiftTypeType | AbsenceTypeType);
                            document.body.removeChild(shiftDialog);
                          };
                          optionsContainer.appendChild(optionButton);
                        });
                        
                        // Opción para eliminar
                        const deleteButton = document.createElement('button');
                        deleteButton.className = 'w-full text-left px-3 py-2 rounded bg-red-100 text-red-800 hover:brightness-95 mt-2 flex items-center';
                        deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Eliminar turno';
                        deleteButton.onclick = () => {
                          setShiftForDay(day, null);
                          document.body.removeChild(shiftDialog);
                        };
                        
                        dialogContent.appendChild(optionsContainer);
                        dialogContent.appendChild(deleteButton);
                        shiftDialog.appendChild(dialogContent);
                        
                        // Cerrar al hacer clic fuera del diálogo
                        shiftDialog.addEventListener('click', (e) => {
                          if (e.target === shiftDialog) {
                            document.body.removeChild(shiftDialog);
                          }
                        });
                        
                        document.body.appendChild(shiftDialog);
                      }}
                    >
                      <div className="font-medium">{shiftTypeText[shiftType]}</div>
                      {shiftType === OperatorShiftType.MORNING && <div className="text-xs">6:00 - 14:00</div>}
                      {shiftType === OperatorShiftType.AFTERNOON && <div className="text-xs">14:00 - 22:00</div>}
                      {shiftType === OperatorShiftType.NIGHT && <div className="text-xs">18:00 - 6:00</div>}
                      {shiftType === OperatorShiftType.DAY && <div className="text-xs">6:00 - 18:00</div>}
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="w-full h-full border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      onClick={() => {
                        if (!canCreateShifts) return;
                        
                        // Mostrar menú para asignar un turno
                        const options = [
                          { label: 'Mañana (6:00-14:00)', value: OperatorShiftType.MORNING },
                          { label: 'Día (6:00-18:00)', value: OperatorShiftType.DAY },
                          { label: 'Tarde (14:00-22:00)', value: OperatorShiftType.AFTERNOON },
                          { label: 'Noche (18:00-6:00)', value: OperatorShiftType.NIGHT },
                          { label: 'Descanso', value: AbsenceType.REST },
                          { label: 'Vacaciones', value: AbsenceType.VACATION },
                          { label: 'Permiso', value: AbsenceType.PERMISSION },
                        ];
                        
                        // Crear un menú desplegable
                        const shiftDialog = document.createElement('div');
                        shiftDialog.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
                        shiftDialog.style.zIndex = '9999';
                        
                        const dialogContent = document.createElement('div');
                        dialogContent.className = 'bg-white rounded-lg p-4 max-w-sm w-full';
                        
                        // Título del diálogo
                        const title = document.createElement('h3');
                        title.className = 'font-semibold text-lg mb-3 flex justify-between items-center';
                        title.textContent = `Asignar turno: ${format(day, 'EEEE dd/MM', { locale: es })}`;
                        
                        // Botón para cerrar
                        const closeButton = document.createElement('button');
                        closeButton.className = 'text-gray-500 hover:text-gray-700';
                        closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                        closeButton.onclick = () => document.body.removeChild(shiftDialog);
                        
                        title.appendChild(closeButton);
                        dialogContent.appendChild(title);
                        
                        // Opciones de turnos
                        const optionsContainer = document.createElement('div');
                        optionsContainer.className = 'space-y-2';
                        
                        options.forEach(option => {
                          const optionButton = document.createElement('button');
                          optionButton.className = `w-full text-left px-3 py-2 rounded ${
                            option.value ? shiftColors[option.value as ShiftTypeType | AbsenceTypeType] : ''
                          } hover:brightness-95`;
                          optionButton.textContent = option.label;
                          optionButton.onclick = () => {
                            setShiftForDay(day, option.value as ShiftTypeType | AbsenceTypeType);
                            document.body.removeChild(shiftDialog);
                          };
                          optionsContainer.appendChild(optionButton);
                        });
                        
                        dialogContent.appendChild(optionsContainer);
                        shiftDialog.appendChild(dialogContent);
                        
                        // Cerrar al hacer clic fuera del diálogo
                        shiftDialog.addEventListener('click', (e) => {
                          if (e.target === shiftDialog) {
                            document.body.removeChild(shiftDialog);
                          }
                        });
                        
                        document.body.appendChild(shiftDialog);
                      }}
                      disabled={!canCreateShifts}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-sm text-gray-500">Asignar turno</div>
                        <div className="text-lg">+</div>
                      </div>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {canCreateShifts && (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                // Limpiar todos los turnos de la semana
                setWeekShifts({});
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar semana
            </Button>
            <Button 
              onClick={saveAllShifts}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Establecer las opciones de exportación rápida
  const quickShiftOptions = [
    { label: "Mañana (6-14)", type: OperatorShiftType.MORNING, color: "bg-blue-100 text-blue-800" },
    { label: "Día (6-18)", type: OperatorShiftType.DAY, color: "bg-green-100 text-green-800" },
    { label: "Tarde (14-22)", type: OperatorShiftType.AFTERNOON, color: "bg-orange-100 text-orange-800" },
    { label: "Noche (18-6)", type: OperatorShiftType.NIGHT, color: "bg-indigo-100 text-indigo-800" },
    { label: "Descanso", type: AbsenceType.REST, color: "bg-gray-100 text-gray-800" },
    { label: "Vacaciones", type: AbsenceType.VACATION, color: "bg-cyan-100 text-cyan-800" },
  ];

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen bg-gray-50">
      <div className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/shift-scheduling')} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Gestión de Turnos de Operadores</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Control de Turnos</CardTitle>
              <CardDescription>
                Selecciona un operador y programa sus turnos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Operador</label>
                <Select
                  value={selectedOperator ? selectedOperator.id.toString() : ''}
                  onValueChange={(value) => {
                    const selected = operators.find((op: any) => op.id.toString() === value);
                    setSelectedOperator(selected || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator: any) => (
                      <SelectItem key={operator.id} value={operator.id.toString()}>
                        {getOperatorName(operator)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Semana</label>
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateWeek('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {format(currentWeekStart, 'dd/MM/yyyy')} - {format(addDays(currentWeekStart, 6), 'dd/MM/yyyy')}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateWeek('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {selectedOperator && canCreateShifts && (
                <div>
                  <label className="block text-sm font-medium mb-1">Asignación Rápida</label>
                  <div className="space-y-2">
                    {quickShiftOptions.map((option) => (
                      <Button 
                        key={option.type}
                        variant="outline"
                        className={`w-full justify-start ${option.color}`}
                        onClick={() => {
                          // Asignar este turno a toda la semana
                          daysOfWeek.forEach(day => {
                            setShiftForDay(day, option.type);
                          });
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setExportDialogOpen(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Turnos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedOperator 
                  ? `Turnos para ${getOperatorName(selectedOperator)}` 
                  : 'Programación de Turnos'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOperator ? renderOperatorSchedule() : renderAllOperatorsSchedule()}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Diálogo para exportar horarios */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Turnos a Excel</DialogTitle>
            <DialogDescription>
              Selecciona el rango de fechas y el operador para exportar sus turnos programados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de inicio</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {exportStartDate ? format(exportStartDate, 'dd/MM/yyyy') : 'Selecciona fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={exportStartDate}
                      onSelect={setExportStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {exportEndDate ? format(exportEndDate, 'dd/MM/yyyy') : 'Selecciona fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={exportEndDate}
                      onSelect={setExportEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Operador</label>
              <Select
                value={exportOperatorId}
                onValueChange={setExportOperatorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los operadores</SelectItem>
                  {operators.map((operator: any) => (
                    <SelectItem key={operator.id} value={operator.id.toString()}>
                      {getOperatorName(operator)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExportSchedule}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar a Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}