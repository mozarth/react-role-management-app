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
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  X,
  Save,
  Download,
  FileSpreadsheet,
  Clock4,
  Moon,
  Sun,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole as UserRoleConst } from '@/lib/constants';
import { AbsenceType, AbsenceTypeType, UserRole } from '@shared/schema';

// Definimos los tipos de turno específicos para operadores
const OperatorShiftType = {
  MORNING: 'morning',
  DAY: 'day',
  AFTERNOON: 'afternoon',
  NIGHT: 'night'
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
  shiftType?: string;
  absenceType?: string;
  status: string;
  notes?: string;
}

// Componente para gestionar turnos de operadores sin menú lateral
export default function OperatorShiftsNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { exportOperatorsSchedule } = useExcelExport();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Verificar permisos basados en el rol del usuario
  const canCreateShifts = user?.role === UserRoleConst.ADMIN || 
                          user?.role === UserRoleConst.DIRECTOR || 
                          user?.role === UserRoleConst.DISPATCHER;
  
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
    [key: string]: OperatorShiftTypeType | AbsenceTypeType | null;
  }>({});
  
  // Obtener los operadores de alarmas - usamos una ruta específica para evitar errores
  const { data: operators = [], isLoading: isLoadingOperators } = useQuery({
    queryKey: ['/api/users/by-role/alarm_operator'],
  });
  
  // Obtener todos los turnos
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: [`/api/shifts`],
  });

  // Query for shifts summary with special hours
  const { data: shiftsSummary } = useQuery({
    queryKey: ['/api/shifts/summary'],
  });

  // Mutación para crear un nuevo turno
  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      try {
        console.log("Enviando datos del turno:", shiftData);
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
    const fileName = await exportOperatorsSchedule(filters);
    
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
      const newWeekShifts: { [key: string]: OperatorShiftTypeType | AbsenceTypeType | null } = {};
      
      daysOfWeek.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const operatorShifts = getShiftsForOperatorAndDate(selectedOperator.id, day);
        
        if (operatorShifts.length > 0) {
          const shift = operatorShifts[0];
          if (shift.status === 'absence' && shift.absenceType) {
            newWeekShifts[dateKey] = shift.absenceType as AbsenceTypeType;
          } else if (shift.shiftType) {
            newWeekShifts[dateKey] = shift.shiftType as OperatorShiftTypeType;
          }
        }
      });
      
      setWeekShifts(newWeekShifts);
    }
  }, [selectedOperator, shifts]);
  
  // Generar los días de la semana actual
  const daysOfWeek = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });

  // Establecer un turno para un día específico
  const setShiftForDay = (day: Date, shiftType: OperatorShiftTypeType | AbsenceTypeType | null) => {
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
    
    // Verificar si el usuario tiene permisos para guardar
    if (!canCreateShifts) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para crear o modificar turnos",
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

      let isAbsence = false;

      // Determinar si es un tipo de ausencia
      if (Object.values(AbsenceType).includes(shiftValue as AbsenceTypeType)) {
        isAbsence = true;
      }
      
      let startHour, endHour;

      // Determinar si es un tipo de ausencia
      if (!isAbsence) {
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
        startDate.setHours(startHour || 0, 0, 0);
      } else {
        startDate.setHours(0, 0, 0);
      }
      
      const endDate = new Date(day);
      if (!isAbsence) {
        if (shiftValue === OperatorShiftType.NIGHT) {
          // Para el turno nocturno, el fin es al día siguiente
          endDate.setDate(endDate.getDate() + 1);
        }
        endDate.setHours(endHour || 0, 0, 0);
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
        notes: ""
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
    
    // Crear los turnos secuencialmente
    const createShiftsSequentially = async () => {
      const results = [];
      for (const shiftData of shiftsToCreate) {
        console.log("Enviando datos de turno:", shiftData);
        try {
          const formattedShiftData = {
            userId: Number(shiftData.userId),
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            status: shiftData.status,
            shiftType: shiftData.shiftType,
            absenceType: shiftData.absenceType,
            notes: shiftData.notes || ""
          };
          
          const response = await fetch('/api/shifts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedShiftData),
            credentials: 'include',
          });
          
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

  // Colores para los diferentes tipos de turno
  const shiftColors = {
    [OperatorShiftType.MORNING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [OperatorShiftType.DAY]: 'bg-blue-100 text-blue-800 border-blue-300',
    [OperatorShiftType.AFTERNOON]: 'bg-orange-100 text-orange-800 border-orange-300',
    [OperatorShiftType.NIGHT]: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    [AbsenceType.REST]: 'bg-gray-100 text-gray-800 border-gray-300',
    [AbsenceType.VACATION]: 'bg-green-100 text-green-800 border-green-300',
    [AbsenceType.PERMISSION]: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  // Etiquetas para los tipos de turno
  const shiftLabels = {
    [OperatorShiftType.MORNING]: 'Mañana (6:00 - 14:00)',
    [OperatorShiftType.DAY]: 'Día (6:00 - 18:00)',
    [OperatorShiftType.AFTERNOON]: 'Tarde (14:00 - 22:00)',
    [OperatorShiftType.NIGHT]: 'Noche (18:00 - 6:00)',
    [AbsenceType.REST]: 'Descanso',
    [AbsenceType.VACATION]: 'Vacaciones',
    [AbsenceType.PERMISSION]: 'Permiso',
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Programación de Turnos para Operadores</h1>
        </div>
        
        <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar a Excel
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de selección */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Selección de Operador</CardTitle>
            <CardDescription>
              Selecciona un operador para programar sus turnos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Operador</label>
                <Select 
                  value={selectedOperator ? selectedOperator.id.toString() : ''} 
                  onValueChange={(value) => {
                    const operator = operators.find((op: any) => op.id.toString() === value);
                    setSelectedOperator(operator || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator: any) => (
                      <SelectItem key={operator.id} value={operator.id.toString()}>
                        {operator.firstName && operator.lastName 
                          ? `${operator.firstName} ${operator.lastName}` 
                          : operator.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Semana</label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex-1 text-center text-sm">
                    {format(currentWeekStart, "dd 'de' MMMM", { locale: es })} - {format(addDays(currentWeekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="text-sm font-semibold mb-2">Tipos de Turno</h3>
                <div className="space-y-2">
                  <Badge className={shiftColors[OperatorShiftType.MORNING]}>
                    Mañana (6:00 - 14:00)
                  </Badge>
                  <Badge className={shiftColors[OperatorShiftType.DAY]}>
                    Día (6:00 - 18:00)
                  </Badge>
                  <Badge className={shiftColors[OperatorShiftType.AFTERNOON]}>
                    Tarde (14:00 - 22:00)
                  </Badge>
                  <Badge className={shiftColors[OperatorShiftType.NIGHT]}>
                    Noche (18:00 - 6:00)
                  </Badge>
                </div>
              </div>
              
              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-2">Tipos de Ausencia</h3>
                <div className="space-y-2">
                  <Badge className={shiftColors[AbsenceType.REST]}>
                    Descanso
                  </Badge>
                  <Badge className={shiftColors[AbsenceType.VACATION]}>
                    Vacaciones
                  </Badge>
                  <Badge className={shiftColors[AbsenceType.PERMISSION]}>
                    Permiso
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={saveAllShifts}
              disabled={!selectedOperator || Object.keys(weekShifts).length === 0}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" /> Guardar Todos los Turnos
            </Button>
          </CardFooter>
        </Card>
        
        {/* Panel de programación */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedOperator 
                ? `Turnos para ${getOperatorName(selectedOperator)}` 
                : 'Programación de Turnos'}
            </CardTitle>
            <CardDescription>
              Haz clic en un día para asignar o modificar un turno
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedOperator ? (
              <div className="p-8 text-center text-gray-500">
                Selecciona un operador para comenzar la asignación de turnos
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Cabeceras de los días */}
                {daysOfWeek.map((day) => (
                  <div key={day.toString()} className="text-center">
                    <div className="font-semibold">{format(day, 'EEEE', { locale: es })}</div>
                    <div>{format(day, 'dd/MM')}</div>
                  </div>
                ))}
                
                {/* Celdas de turnos */}
                {daysOfWeek.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const shiftType = weekShifts[dateKey];
                  const hasShift = !!shiftType;
                  
                  return (
                    <div 
                      key={dateKey}
                      className={`
                        p-2 min-h-20 border rounded-md
                        ${hasShift ? shiftColors[shiftType] : 'border-dashed border-gray-300 hover:border-gray-400'}
                        cursor-pointer transition-colors duration-200
                      `}
                      onClick={() => {
                        // Abrir un menú contextual o alguna forma de seleccionar el tipo de turno
                        if (!hasShift) {
                          // Si no hay turno, asignar uno por defecto (por ejemplo, turno de mañana)
                          setShiftForDay(day, OperatorShiftType.MORNING);
                        } else {
                          // Si ya hay un turno, eliminarlo para poder seleccionar otro
                          setShiftForDay(day, null);
                        }
                      }}
                    >
                      {hasShift ? (
                        <div className="flex flex-col h-full">
                          <div className="text-sm font-semibold">
                            {shiftLabels[shiftType]}
                          </div>
                          <div className="mt-auto flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteShift(selectedOperator.id, day);
                              }}
                              disabled={!canCreateShifts}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 text-sm h-full flex items-center justify-center">
                          Asignar turno
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch">
            {selectedOperator && (
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="col-span-2 text-sm font-semibold mb-1">Asignación Rápida</div>
                
                {/* Botones para turnos */}
                <Button 
                  variant="outline"
                  className={shiftColors[OperatorShiftType.MORNING]}
                  onClick={() => {
                    // Asignar turnos por la mañana a toda la semana
                    daysOfWeek.forEach(day => {
                      setShiftForDay(day, OperatorShiftType.MORNING);
                    });
                  }}
                  disabled={!canCreateShifts}
                >
                  Mañanas (6:00-14:00)
                </Button>
                
                <Button 
                  variant="outline"
                  className={shiftColors[OperatorShiftType.DAY]}
                  onClick={() => {
                    // Asignar turnos de día a toda la semana
                    daysOfWeek.forEach(day => {
                      setShiftForDay(day, OperatorShiftType.DAY);
                    });
                  }}
                  disabled={!canCreateShifts}
                >
                  Días (6:00-18:00)
                </Button>
                
                <Button 
                  variant="outline"
                  className={shiftColors[OperatorShiftType.AFTERNOON]}
                  onClick={() => {
                    // Asignar turnos de tarde a toda la semana
                    daysOfWeek.forEach(day => {
                      setShiftForDay(day, OperatorShiftType.AFTERNOON);
                    });
                  }}
                  disabled={!canCreateShifts}
                >
                  Tardes (14:00-22:00)
                </Button>
                
                <Button 
                  variant="outline"
                  className={shiftColors[OperatorShiftType.NIGHT]}
                  onClick={() => {
                    // Asignar turnos nocturnos a toda la semana
                    daysOfWeek.forEach(day => {
                      setShiftForDay(day, OperatorShiftType.NIGHT);
                    });
                  }}
                  disabled={!canCreateShifts}
                >
                  Noches (18:00-6:00)
                </Button>
                
                {/* Botones para ausencias */}
                <Button 
                  variant="outline"
                  className={shiftColors[AbsenceType.REST]}
                  onClick={() => {
                    // Asignar descansos a toda la semana
                    daysOfWeek.forEach(day => {
                      setShiftForDay(day, AbsenceType.REST);
                    });
                  }}
                  disabled={!canCreateShifts}
                >
                  Descansos
                </Button>
                
                <Button 
                  variant="outline"
                  className={shiftColors[AbsenceType.VACATION]}
                  onClick={() => {
                    // Asignar vacaciones a toda la semana
                    daysOfWeek.forEach(day => {
                      setShiftForDay(day, AbsenceType.VACATION);
                    });
                  }}
                  disabled={!canCreateShifts}
                >
                  Vacaciones
                </Button>
              </div>
            )}
            
            {/* Botón para guardar todos los turnos */}
            {selectedOperator && (
              <div className="mt-4 w-full">
                <Button 
                  onClick={saveAllShifts} 
                  className="w-full"
                  disabled={!canCreateShifts}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Turnos
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Diálogo para exportación a Excel */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Horarios a Excel</DialogTitle>
            <DialogDescription>
              Selecciona el rango de fechas y el operador para exportar los horarios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operador</label>
              <Select 
                value={exportOperatorId} 
                onValueChange={setExportOperatorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los operadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los operadores</SelectItem>
                  {operators.map((operator: any) => (
                    <SelectItem key={operator.id} value={operator.id.toString()}>
                      {operator.firstName && operator.lastName 
                        ? `${operator.firstName} ${operator.lastName}` 
                        : operator.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {exportStartDate ? format(exportStartDate, 'PP', { locale: es }) : "Seleccionar fecha"}
                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={exportStartDate}
                      onSelect={setExportStartDate}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {exportEndDate ? format(exportEndDate, 'PP', { locale: es }) : "Seleccionar fecha"}
                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={exportEndDate}
                      onSelect={setExportEndDate}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExportSchedule}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}