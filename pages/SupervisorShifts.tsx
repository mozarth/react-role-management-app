import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfWeek, subWeeks, addWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  X,
  Save
} from 'lucide-react';
import { ShiftType, ShiftTypeType, AbsenceType, AbsenceTypeType, UserRole } from '@shared/schema';

interface Supervisor {
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

export default function SupervisorShifts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para la UI
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Semana comienza en lunes
  });
  
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  
  // Estado para los turnos por día
  const [weekShifts, setWeekShifts] = useState<{
    [key: string]: ShiftTypeType | AbsenceTypeType | null;
  }>({});
  
  // Obtener los supervisores
  const { data: supervisors = [], isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ['/api/users/by-role/supervisor'],
  });
  
  // Obtener los turnos con fechas específicas para asegurar que obtengamos todos los turnos
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
  
  // Obtener los turnos para un día específico y un supervisor específico
  const getShiftsForSupervisorAndDate = (supervisorId: number, date: Date) => {
    return shifts.filter((shift: Shift) => {
      const shiftStartDate = new Date(shift.startTime);
      return isSameDay(shiftStartDate, date) && shift.userId === supervisorId;
    });
  };

  // Cargar los turnos existentes del supervisor seleccionado
  useEffect(() => {
    if (selectedSupervisor) {
      const newWeekShifts: { [key: string]: ShiftTypeType | AbsenceTypeType | null } = {};
      
      daysOfWeek.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const supervisorShifts = getShiftsForSupervisorAndDate(selectedSupervisor.id, day);
        
        if (supervisorShifts.length > 0) {
          const shift = supervisorShifts[0];
          if (shift.status === 'absence' && shift.absenceType) {
            newWeekShifts[dateKey] = shift.absenceType as AbsenceTypeType;
          } else if (shift.shiftType) {
            newWeekShifts[dateKey] = shift.shiftType as ShiftTypeType;
          }
        }
      });
      
      setWeekShifts(newWeekShifts);
    }
  }, [selectedSupervisor, shifts]);
  
  // Generar los días de la semana actual
  const daysOfWeek = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });

  // Establecer un turno para un día específico
  const setShiftForDay = (day: Date, shiftType: ShiftTypeType | AbsenceTypeType | null) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    setWeekShifts(prev => ({
      ...prev,
      [dateKey]: shiftType
    }));
  };

  // Obtener el ID del turno para un supervisor y un día específico
  const getShiftId = (supervisorId: number, date: Date) => {
    const supervisorShifts = getShiftsForSupervisorAndDate(supervisorId, date);
    if (supervisorShifts.length > 0) {
      return supervisorShifts[0].id;
    }
    return null;
  };

  // Eliminar un turno existente
  const handleDeleteShift = (supervisorId: number, day: Date) => {
    const shiftId = getShiftId(supervisorId, day);
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
    if (!selectedSupervisor) {
      toast({
        title: "Error",
        description: "Selecciona un supervisor para asignar turnos",
        variant: "destructive"
      });
      return;
    }

    const shiftsToCreate = [];

    for (const [dateKey, shiftValue] of Object.entries(weekShifts)) {
      const day = new Date(dateKey);
      const existingShiftId = getShiftId(selectedSupervisor.id, day);
      
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
        startHour = shiftValue === ShiftType.MORNING_8H ? 6 : // Mañana: 6-14
                    shiftValue === ShiftType.AFTERNOON_8H ? 14 : // Tarde: 14-22
                    shiftValue === ShiftType.MORNING_12H ? 6 : // Día: 6-18
                    18; // Noche: 18-6
                        
        endHour = shiftValue === ShiftType.MORNING_8H ? 14 : 
                  shiftValue === ShiftType.AFTERNOON_8H ? 22 : 
                  shiftValue === ShiftType.MORNING_12H ? 18 : 
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
        if (shiftValue === ShiftType.NIGHT_12H) {
          // Para el turno nocturno, el fin es al día siguiente
          endDate.setDate(endDate.getDate() + 1);
        }
        endDate.setHours(endHour!, 0, 0);
      } else {
        endDate.setHours(23, 59, 59);
      }
      
      const shiftData = {
        userId: selectedSupervisor.id,
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
            description: `Se han asignado ${successful} turnos para ${getSupervisorName(selectedSupervisor)}`,
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
  
  // Obtener el nombre del supervisor
  const getSupervisorName = (supervisor: Supervisor) => {
    if (supervisor.firstName && supervisor.lastName) {
      return `${supervisor.firstName} ${supervisor.lastName}`;
    }
    return supervisor.username;
  };

  const shiftColors = {
    [ShiftType.MORNING_8H]: 'bg-blue-100 text-blue-800 border-blue-300',
    [ShiftType.AFTERNOON_8H]: 'bg-orange-100 text-orange-800 border-orange-300',
    [ShiftType.NIGHT_12H]: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    [ShiftType.MORNING_12H]: 'bg-green-100 text-green-800 border-green-300',
    [AbsenceType.VACATION]: 'bg-pink-100 text-pink-800 border-pink-300',
    [AbsenceType.SICK_LEAVE]: 'bg-red-100 text-red-800 border-red-300',
    [AbsenceType.REST]: 'bg-purple-100 text-purple-800 border-purple-300',
    [AbsenceType.PERMISSION]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [AbsenceType.SUSPENSION]: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const shiftNames = {
    [ShiftType.MORNING_8H]: 'Mañana (06:00-14:00)',
    [ShiftType.AFTERNOON_8H]: 'Tarde (14:00-22:00)',
    [ShiftType.NIGHT_12H]: 'Noche (18:00-06:00)',
    [ShiftType.MORNING_12H]: 'Día (06:00-18:00)',
    [AbsenceType.VACATION]: 'Vacaciones',
    [AbsenceType.SICK_LEAVE]: 'Enfermedad',
    [AbsenceType.REST]: 'Descanso',
    [AbsenceType.PERMISSION]: 'Permiso',
    [AbsenceType.SUSPENSION]: 'Suspensión',
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Turnos de Supervisores</h1>
        <div className="flex items-center gap-2">
          <Link to="/supervisors">
            <Button variant="outline" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Volver a Supervisores
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Supervisor</CardTitle>
          <CardDescription>Elige el supervisor para asignar sus turnos semanales</CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedSupervisor ? selectedSupervisor.id.toString() : ''} 
            onValueChange={(value) => {
              const supervisor = supervisors.find((s: Supervisor) => s.id.toString() === value);
              setSelectedSupervisor(supervisor || null);
            }}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Seleccionar supervisor" />
            </SelectTrigger>
            <SelectContent>
              {supervisors.map((supervisor: Supervisor) => (
                <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                  {getSupervisorName(supervisor)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {selectedSupervisor && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Turnos para {getSupervisorName(selectedSupervisor)}</CardTitle>
                <CardDescription>
                  Asigna los turnos semanales. Selecciona un turno para cada día.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="py-2 px-4 border rounded-md bg-white">
                  {format(currentWeekStart, 'dd MMM', { locale: es })} - {format(addDays(currentWeekStart, 6), 'dd MMM yyyy', { locale: es })}
                </span>
                <Button variant="outline" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoadingShifts ? (
              <div className="flex justify-center p-4">
                <p>Cargando turnos...</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {daysOfWeek.map((day) => (
                        <th key={day.toISOString()} className="border p-2 bg-gray-50 text-center font-medium text-sm">
                          <div className="uppercase">{format(day, 'EEEE', { locale: es })}</div>
                          <div className="text-gray-600">{format(day, 'dd MMM', { locale: es })}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {daysOfWeek.map((day) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const currentShift = weekShifts[dateKey];
                        const existingShiftId = getShiftId(selectedSupervisor.id, day);
                        
                        return (
                          <td key={dateKey} className="border p-3 bg-white">
                            {currentShift ? (
                              <div className={`relative p-3 rounded border ${shiftColors[currentShift]}`}>
                                <div className="font-medium text-sm text-center mb-2">
                                  {shiftNames[currentShift]}
                                </div>
                                <button 
                                  className="absolute top-1 right-1 text-gray-500 hover:text-red-500"
                                  onClick={() => setShiftForDay(day, null)}
                                  title="Quitar turno"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                {existingShiftId && (
                                  <button
                                    className="text-red-500 hover:text-red-700 text-xs w-full"
                                    onClick={() => handleDeleteShift(selectedSupervisor.id, day)}
                                  >
                                    Eliminar turno guardado
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Seleccionar turno:</p>
                                <div className="grid grid-cols-2 gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-800 h-8 text-xs"
                                    onClick={() => setShiftForDay(day, ShiftType.MORNING_8H)}
                                  >
                                    Mañana
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-orange-50 hover:bg-orange-100 text-orange-800 h-8 text-xs"
                                    onClick={() => setShiftForDay(day, ShiftType.AFTERNOON_8H)}
                                  >
                                    Tarde
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-green-50 hover:bg-green-100 text-green-800 h-8 text-xs"
                                    onClick={() => setShiftForDay(day, ShiftType.MORNING_12H)}
                                  >
                                    Día
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 h-8 text-xs"
                                    onClick={() => setShiftForDay(day, ShiftType.NIGHT_12H)}
                                  >
                                    Noche
                                  </Button>
                                </div>
                                <p className="text-sm font-medium mt-2">Ausencias:</p>
                                <div className="grid grid-cols-2 gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-pink-50 hover:bg-pink-100 text-pink-800 h-8 text-xs"
                                    onClick={() => setShiftForDay(day, AbsenceType.VACATION)}
                                  >
                                    Vacaciones
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-50 hover:bg-red-100 text-red-800 h-8 text-xs"
                                    onClick={() => setShiftForDay(day, AbsenceType.SICK_LEAVE)}
                                  >
                                    Enfermedad
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-800 h-8 text-xs"
                                    onClick={() => setShiftForDay(day, AbsenceType.REST)}
                                  >
                                    Descanso
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 h-8 text-xs"
                                    onClick={() => setShiftForDay(day, AbsenceType.PERMISSION)}
                                  >
                                    Permiso
                                  </Button>
                                </div>
                                {existingShiftId && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="w-full text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50 text-xs mt-2"
                                    onClick={() => handleDeleteShift(selectedSupervisor.id, day)}
                                  >
                                    Eliminar turno guardado
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between items-center border-t p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div>
                <span className="text-xs">Mañana</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300"></div>
                <span className="text-xs">Tarde</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                <span className="text-xs">Día</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-300"></div>
                <span className="text-xs">Noche</span>
              </div>
            </div>
            <Button 
              onClick={saveAllShifts} 
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar Turnos
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}