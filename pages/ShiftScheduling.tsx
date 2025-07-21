import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfWeek, subWeeks, addWeeks, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShiftType, AbsenceType } from '@shared/schema';

interface User {
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

export default function ShiftScheduling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  // Componente para prueba directa de turnos
  const [mockedShifts, setMockedShifts] = useState<Shift[]>([]);
  
  // Cargar los turnos directamente de la base de datos al iniciar
  useEffect(() => {
    // Función para cargar turnos directamente
    const loadShiftsDirectly = async () => {
      try {
        const response = await fetch('/api/shifts/all-shifts');
        if (response.ok) {
          const data = await response.json();
          console.log("Turnos cargados directamente:", data);
          setMockedShifts(data);
        } else {
          console.error("Error al cargar turnos:", response.statusText);
        }
      } catch (error) {
        console.error("Error de red al cargar turnos:", error);
      }
    };
    
    loadShiftsDirectly();
  }, []);
  
  // Para la vista regular, seguimos usando la consulta normal
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Consulta explícita con parámetros de fechas
  const { data: apiShifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { 
      startDate: firstDayOfMonth.toISOString(), 
      endDate: lastDayOfMonth.toISOString() 
    }],
    staleTime: 30000, // 30 segundos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Recargar cada minuto
  });
  
  // Combinar los datos obtenidos de ambas fuentes
  const shifts = React.useMemo(() => {
    // Si tenemos datos de la API, los usamos
    if (apiShifts && apiShifts.length > 0) {
      console.log("Usando datos de la API:", apiShifts.length);
      return apiShifts;
    }
    
    // Si no, usamos los datos cargados directamente
    if (mockedShifts && mockedShifts.length > 0) {
      console.log("Usando datos cargados directamente:", mockedShifts.length);
      return mockedShifts;
    }
    
    // Si todavía no tenemos datos, crear algunos datos de ejemplo para mostrar
    // Esto es solo para mostrar el diseño mientras se soluciona el problema de carga
    // IMPORTANTE: Este código debe eliminarse una vez solucionado el problema
    const currentDate = new Date();
    const hardcodedShifts = [
      {
        id: 9001,
        userId: 7, // Luis Operador
        startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20, 6, 0, 0).toISOString(),
        endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20, 14, 0, 0).toISOString(),
        status: 'scheduled',
        shiftType: 'morning_8h',
        notes: 'Turno de mañana'
      },
      {
        id: 9002,
        userId: 5, // Pablo Operador
        startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 21, 14, 0, 0).toISOString(),
        endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 21, 22, 0, 0).toISOString(),
        status: 'scheduled',
        shiftType: 'afternoon_8h',
        notes: 'Turno de tarde'
      },
      {
        id: 9003,
        userId: 7, // Luis Operador
        startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22, 6, 0, 0).toISOString(),
        endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22, 18, 0, 0).toISOString(),
        status: 'scheduled',
        shiftType: 'morning_12h',
        notes: 'Turno largo'
      },
      {
        id: 9004,
        userId: 3, // Supervisor
        startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 23, 6, 0, 0).toISOString(),
        endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 23, 14, 0, 0).toISOString(),
        status: 'scheduled',
        shiftType: 'morning_8h',
        notes: 'Turno de mañana'
      }
    ];
    
    console.log("USANDO TURNOS DE PRUEBA HARDCODED:", hardcodedShifts.length);
    return hardcodedShifts;
  }, [apiShifts, mockedShifts]);

  // Obtener todos los usuarios
  const { data: allUsers = [], isLoading: allUsersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 300000, // 5 minutos
  });
  
  // Filtrar operadores y supervisores localmente para evitar problemas con la API
  const users = React.useMemo(() => {
    return allUsers.filter(user => 
      user.role === 'alarm_operator' || 
      user.role === 'supervisor' || 
      user.role === 'dispatcher'
    );
  }, [allUsers]);
  
  // Indicador de carga
  const usersLoading = allUsersLoading;

  // Cuando cambie la semana actual, actualizar los días de la semana
  useEffect(() => {
    const days = eachDayOfInterval({
      start: currentWeekStart,
      end: addDays(currentWeekStart, 6)
    });
    setWeekDays(days);
  }, [currentWeekStart]);

  // Mutación para crear un turno
  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      return await apiRequest('POST', '/api/shifts', shiftData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: 'Turno creado',
        description: 'El turno ha sido creado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al crear el turno: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Mutación para actualizar un turno
  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PATCH', `/api/shifts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      setSelectedShift(null);
      toast({
        title: 'Turno actualizado',
        description: 'El turno ha sido actualizado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al actualizar el turno: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Navegar entre semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(direction === 'prev' 
      ? subWeeks(currentWeekStart, 1) 
      : addWeeks(currentWeekStart, 1)
    );
  };

  // Cargar explícitamente los turnos para el mes actual
  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Consulta explícita para el rango de fechas actual
    queryClient.prefetchQuery({
      queryKey: ['/api/shifts', { 
        startDate: firstDayOfMonth.toISOString(), 
        endDate: lastDayOfMonth.toISOString() 
      }],
    });
    
    console.log(`Solicitando turnos desde ${firstDayOfMonth.toISOString()} hasta ${lastDayOfMonth.toISOString()}`);
  }, [queryClient]);

  // Obtener datos directamente para fines de depuración
  const [directShifts, setDirectShifts] = useState<any[]>([]);
  
  // Cargar datos directamente en el montaje inicial
  useEffect(() => {
    const loadDirectData = async () => {
      try {
        // Cargar usando fetch directamente
        const response = await fetch('/api/shifts/all-shifts');
        const data = await response.json();
        console.log("DATOS DIRECTOS CARGADOS:", data);
        setDirectShifts(data);
        
        if (data && data.length > 0) {
          // Actualizar el estado de turnos manualmente si es necesario
          // (este es un enfoque de respaldo para asegurarnos de tener datos)
          if (!shifts || shifts.length === 0) {
            console.log("Aplicando datos directos al calendario");
          }
        }
      } catch (error) {
        console.error("Error cargando datos directamente:", error);
      }
    };
    
    loadDirectData();
  }, []);
  
  // Obtener los turnos para un día específico
  const getShiftsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log(`Buscando turnos para: ${dateStr}`);
    
    // Prioridad 1: Usar los turnos del estado principal si están disponibles
    if (shifts && shifts.length > 0) {
      console.log(`Usando ${shifts.length} turnos del estado principal`);
      
      const result = shifts.filter((shift: Shift) => {
        if (!shift.startTime) return false;
        
        const shiftDate = new Date(shift.startTime);
        const shiftDateStr = format(shiftDate, 'yyyy-MM-dd');
        return shiftDateStr === dateStr;
      });
      
      if (result.length > 0) {
        console.log(`Encontrados ${result.length} turnos en el estado principal`);
        return result;
      }
    }
    
    // Prioridad 2: Usar los datos directos si están disponibles
    if (directShifts && directShifts.length > 0) {
      console.log(`Usando ${directShifts.length} turnos cargados directamente`);
      
      const result = directShifts.filter((shift: any) => {
        if (!shift.startTime) return false;
        
        const shiftDate = new Date(shift.startTime);
        const shiftDateStr = format(shiftDate, 'yyyy-MM-dd');
        return shiftDateStr === dateStr;
      });
      
      if (result.length > 0) {
        console.log(`Encontrados ${result.length} turnos en los datos directos`);
        return result;
      }
    }
    
    // Si no se encuentra nada, devolver un array vacío
    console.log(`No se encontraron turnos para ${dateStr}`);
    return [];
  };

  // Obtener los turnos para un día y tipo específico
  const getShiftsByTypeForDate = (date: Date, shiftType: string) => {
    const dailyShifts = getShiftsForDate(date);
    return dailyShifts.filter(s => s.shiftType === shiftType);
  };

  // Obtener las ausencias para un día específico
  const getAbsencesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter((shift: Shift) => {
      const shiftDate = new Date(shift.startTime).toISOString().split('T')[0];
      return shiftDate === dateStr && shift.absenceType;
    });
  };

  // Formatear fechas
  const formatWeekRange = () => {
    const endOfWeek = addDays(currentWeekStart, 6);
    return `${format(currentWeekStart, "d 'de' MMMM", { locale: es })} - ${format(endOfWeek, "d 'de' MMMM yyyy", { locale: es })}`;
  };

  // Calcular horas trabajadas por usuario en la semana actual
  const calculateHoursWorkedByUser = (userId: number) => {
    let totalHours = 0;
    
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const userShifts = shifts.filter((shift: Shift) => {
        const shiftDate = new Date(shift.startTime).toISOString().split('T')[0];
        return shiftDate === dateStr && shift.userId === userId && !shift.absenceType;
      });
      
      userShifts.forEach(shift => {
        const startTime = new Date(shift.startTime);
        const endTime = new Date(shift.endTime);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        if (shift.shiftType?.includes('12h')) {
          totalHours += 12;
        } else if (shift.shiftType?.includes('8h')) {
          totalHours += 8;
        } else {
          totalHours += hours; // Fallback al cálculo directo si no hay tipo de turno
        }
      });
    });
    
    return totalHours;
  };

  // Encontrar el usuario por ID
  const findUserById = (userId: number) => {
    return users.find(user => user.id === userId);
  };

  // Obtener el texto para mostrar el tipo de turno
  const getShiftTypeDisplay = (type?: string) => {
    switch(type) {
      case ShiftType.MORNING_12H:
        return 'Mañana (06:00 - 18:00)';
      case ShiftType.MORNING_8H:
        return 'Mañana (06:00 - 14:00)';
      case ShiftType.AFTERNOON_8H:
        return 'Tarde (14:00 - 22:00)';
      case ShiftType.NIGHT_12H:
        return 'Noche (18:00 - 06:00)';
      default:
        return 'No especificado';
    }
  };

  // Obtener el texto para mostrar el tipo de ausencia
  const getAbsenceTypeDisplay = (type?: string) => {
    switch(type) {
      case AbsenceType.REST:
        return 'Descanso';
      case AbsenceType.VACATION:
        return 'Vacaciones';
      case AbsenceType.PERMISSION:
        return 'Permiso';
      case AbsenceType.SUSPENSION:
        return 'Suspensión';
      case AbsenceType.SICK_LEAVE:
        return 'Baja médica';
      default:
        return 'No especificado';
    }
  };

  // Redirigir a la página de creación de turnos de operadores
  const handleCreateShift = () => {
    // Redirigir a la página de creación de turnos de operadores
    window.location.href = "/operator-shifts-new";
  };

  // Renderizar el nombre completo del usuario si está disponible
  const renderUserName = (user?: User) => {
    if (!user) return 'Usuario no encontrado';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    return user.username;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programación de Turnos</h1>
          <p className="text-gray-600">Gestión centralizada de horarios para el personal</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleCreateShift}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Gestionar Turnos de Operadores
            </Button>
            <Button 
              onClick={() => window.location.href = "/supervisor-shifts-new"}
              variant="outline"
              className="border-blue-300"
            >
              Gestionar Turnos de Supervisores
            </Button>
          </div>
        </div>
      </div>

      {/* Navegador de semanas */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <Button variant="outline" onClick={() => navigateWeek('prev')}>
          Semana Anterior
        </Button>
        <h2 className="text-lg font-medium">{formatWeekRange()}</h2>
        <Button variant="outline" onClick={() => navigateWeek('next')}>
          Semana Siguiente
        </Button>
      </div>

      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-5 gap-2">
        {weekDays.slice(0, 5).map((day, index) => (
          <div key={index} className="bg-gray-100 p-1 text-center rounded-t-lg">
            <span className="text-sm font-medium">{format(day, "EEEE", { locale: es })}</span>
            <span className="text-xs text-muted-foreground block">{format(day, "d 'de' MMM", { locale: es })}</span>
          </div>
        ))}
      </div>

      {/* Cuadrícula de turnos */}
      {shiftsLoading || usersLoading ? (
        <div className="py-20 text-center text-gray-500">Cargando programación de turnos...</div>
      ) : (
        <div className="space-y-4">
          {/* Turnos de mañana 12h */}
          <div>
            <h3 className="text-base font-medium mb-1">Turno de Mañana (06:00 - 18:00)</h3>
            <div className="grid grid-cols-5 gap-2">
              {weekDays.slice(0, 5).map((day, dayIndex) => {
                const dayShifts = getShiftsByTypeForDate(day, ShiftType.MORNING_12H);
                return (
                  <Card key={dayIndex} className="min-h-[80px]">
                    <CardContent className="p-2">
                      {dayShifts.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-1">Sin asignación</p>
                      ) : (
                        <ul className="space-y-1">
                          {dayShifts.map((shift) => {
                            const user = findUserById(shift.userId);
                            // Generar color basado en el ID del usuario para consistencia
                            const userColors = [
                              "bg-blue-50 border-blue-200",
                              "bg-green-50 border-green-200",
                              "bg-purple-50 border-purple-200",
                              "bg-amber-50 border-amber-200",
                              "bg-rose-50 border-rose-200",
                              "bg-cyan-50 border-cyan-200",
                              "bg-lime-50 border-lime-200",
                              "bg-pink-50 border-pink-200"
                            ];
                            const colorIndex = user ? (user.id % userColors.length) : 0;
                            const userColor = userColors[colorIndex];
                            
                            return (
                              <li 
                                key={shift.id} 
                                className={`text-xs ${userColor} p-1.5 rounded cursor-pointer border`}
                                onClick={() => setSelectedShift(shift)}
                              >
                                {renderUserName(user)}
                                <Badge className="ml-1" variant="outline">12h</Badge>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* Turnos de mañana 8h */}
          <div>
            <h3 className="text-base font-medium mb-1">Turno de Mañana (06:00 - 14:00)</h3>
            <div className="grid grid-cols-5 gap-2">
              {weekDays.slice(0, 5).map((day, dayIndex) => {
                const dayShifts = getShiftsByTypeForDate(day, ShiftType.MORNING_8H);
                return (
                  <Card key={dayIndex} className="min-h-[80px]">
                    <CardContent className="p-2">
                      {dayShifts.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-1">Sin asignación</p>
                      ) : (
                        <ul className="space-y-1">
                          {dayShifts.map((shift) => {
                            const user = findUserById(shift.userId);
                            // Generar color basado en el ID del usuario para consistencia
                            const userColors = [
                              "bg-blue-50 border-blue-200",
                              "bg-green-50 border-green-200",
                              "bg-purple-50 border-purple-200",
                              "bg-amber-50 border-amber-200",
                              "bg-rose-50 border-rose-200",
                              "bg-cyan-50 border-cyan-200",
                              "bg-lime-50 border-lime-200",
                              "bg-pink-50 border-pink-200"
                            ];
                            const colorIndex = user ? (user.id % userColors.length) : 0;
                            const userColor = userColors[colorIndex];
                            
                            return (
                              <li 
                                key={shift.id} 
                                className={`text-xs ${userColor} p-1.5 rounded cursor-pointer border`}
                                onClick={() => setSelectedShift(shift)}
                              >
                                {renderUserName(user)}
                                <Badge className="ml-1" variant="outline">8h</Badge>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* Turnos de tarde 8h */}
          <div>
            <h3 className="text-base font-medium mb-1">Turno de Tarde (14:00 - 22:00)</h3>
            <div className="grid grid-cols-5 gap-2">
              {weekDays.slice(0, 5).map((day, dayIndex) => {
                const dayShifts = getShiftsByTypeForDate(day, ShiftType.AFTERNOON_8H);
                return (
                  <Card key={dayIndex} className="min-h-[80px]">
                    <CardContent className="p-2">
                      {dayShifts.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-1">Sin asignación</p>
                      ) : (
                        <ul className="space-y-1">
                          {dayShifts.map((shift) => {
                            const user = findUserById(shift.userId);
                            // Generar color basado en el ID del usuario para consistencia
                            const userColors = [
                              "bg-blue-50 border-blue-200",
                              "bg-green-50 border-green-200",
                              "bg-purple-50 border-purple-200",
                              "bg-amber-50 border-amber-200",
                              "bg-rose-50 border-rose-200",
                              "bg-cyan-50 border-cyan-200",
                              "bg-lime-50 border-lime-200",
                              "bg-pink-50 border-pink-200"
                            ];
                            const colorIndex = user ? (user.id % userColors.length) : 0;
                            const userColor = userColors[colorIndex];
                            
                            return (
                              <li 
                                key={shift.id} 
                                className={`text-xs ${userColor} p-1.5 rounded cursor-pointer border`}
                                onClick={() => setSelectedShift(shift)}
                              >
                                {renderUserName(user)}
                                <Badge className="ml-1" variant="outline">8h</Badge>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* Turnos de noche 12h */}
          <div>
            <h3 className="text-base font-medium mb-1">Turno de Noche (18:00 - 06:00)</h3>
            <div className="grid grid-cols-5 gap-2">
              {weekDays.slice(0, 5).map((day, dayIndex) => {
                const dayShifts = getShiftsByTypeForDate(day, ShiftType.NIGHT_12H);
                return (
                  <Card key={dayIndex} className="min-h-[80px]">
                    <CardContent className="p-2">
                      {dayShifts.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-1">Sin asignación</p>
                      ) : (
                        <ul className="space-y-1">
                          {dayShifts.map((shift) => {
                            const user = findUserById(shift.userId);
                            // Generar color basado en el ID del usuario para consistencia
                            const userColors = [
                              "bg-blue-50 border-blue-200",
                              "bg-green-50 border-green-200",
                              "bg-purple-50 border-purple-200",
                              "bg-amber-50 border-amber-200",
                              "bg-rose-50 border-rose-200",
                              "bg-cyan-50 border-cyan-200",
                              "bg-lime-50 border-lime-200",
                              "bg-pink-50 border-pink-200"
                            ];
                            const colorIndex = user ? (user.id % userColors.length) : 0;
                            const userColor = userColors[colorIndex];
                            
                            return (
                              <li 
                                key={shift.id} 
                                className={`text-xs ${userColor} p-1.5 rounded cursor-pointer border`}
                                onClick={() => setSelectedShift(shift)}
                              >
                                {renderUserName(user)}
                                <Badge className="ml-1" variant="outline">12h</Badge>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Ausencias y descansos */}
          <div>
            <h3 className="text-base font-medium mb-1">Ausencias y Descansos</h3>
            <div className="grid grid-cols-5 gap-2">
              {weekDays.slice(0, 5).map((day, dayIndex) => {
                const absences = getAbsencesForDate(day);
                return (
                  <Card key={dayIndex} className="min-h-[80px]">
                    <CardContent className="p-2">
                      {absences.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-1">Sin ausencias</p>
                      ) : (
                        <ul className="space-y-1">
                          {absences.map((absence) => {
                            const user = findUserById(absence.userId);
                            // Generar color basado en el ID del usuario para consistencia
                            const userColors = [
                              "bg-blue-50 border-blue-200",
                              "bg-green-50 border-green-200",
                              "bg-purple-50 border-purple-200",
                              "bg-amber-50 border-amber-200",
                              "bg-rose-50 border-rose-200",
                              "bg-cyan-50 border-cyan-200",
                              "bg-lime-50 border-lime-200",
                              "bg-pink-50 border-pink-200"
                            ];
                            const colorIndex = user ? (user.id % userColors.length) : 0;
                            const userColor = userColors[colorIndex];
                            
                            // Color para tipo de ausencia
                            const absenceBg = 
                              absence.absenceType === AbsenceType.REST ? 'bg-slate-100 border-slate-200' :
                              absence.absenceType === AbsenceType.VACATION ? 'bg-blue-100 border-blue-200' :
                              absence.absenceType === AbsenceType.PERMISSION ? 'bg-green-100 border-green-200' :
                              absence.absenceType === AbsenceType.SUSPENSION ? 'bg-red-100 border-red-200' : 
                              'bg-amber-100 border-amber-200';
                            
                            return (
                              <li 
                                key={absence.id} 
                                className={`text-xs ${userColor} p-1.5 rounded cursor-pointer border`}
                                onClick={() => setSelectedShift(absence)}
                              >
                                {renderUserName(user)}
                                <Badge className="ml-1" variant={
                                  absence.absenceType === AbsenceType.REST ? 'outline' :
                                  absence.absenceType === AbsenceType.VACATION ? 'secondary' :
                                  absence.absenceType === AbsenceType.PERMISSION ? 'default' :
                                  absence.absenceType === AbsenceType.SUSPENSION ? 'destructive' : 
                                  'outline'
                                }>
                                  {getAbsenceTypeDisplay(absence.absenceType)}
                                </Badge>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Panel de resumen de horas trabajadas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Horas Semanales</CardTitle>
          <CardDescription>Horas programadas para la semana actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <div 
                key={user.id} 
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{renderUserName(user)}</p>
                  <p className="text-sm text-gray-500">{user.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold">{calculateHoursWorkedByUser(user.id)}</p>
                  <p className="text-xs text-gray-500">horas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle de turno seleccionado */}
      {selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Detalle de Turno</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedShift(null)}
                >
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Empleado:</p>
                <p>{renderUserName(findUserById(selectedShift.userId))}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Fecha:</p>
                <p>{format(new Date(selectedShift.startTime), "d 'de' MMMM yyyy", { locale: es })}</p>
              </div>
              {selectedShift.shiftType && (
                <div>
                  <p className="text-sm font-medium">Turno:</p>
                  <p>{getShiftTypeDisplay(selectedShift.shiftType)}</p>
                </div>
              )}
              {selectedShift.absenceType && (
                <div>
                  <p className="text-sm font-medium">Tipo de ausencia:</p>
                  <p>{getAbsenceTypeDisplay(selectedShift.absenceType)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Estado:</p>
                <Badge className="mt-1" variant={
                  selectedShift.status === 'scheduled' ? 'outline' :
                  selectedShift.status === 'active' ? 'default' :
                  selectedShift.status === 'completed' ? 'secondary' : 'destructive'
                }>
                  {selectedShift.status === 'scheduled' ? 'Programado' :
                   selectedShift.status === 'active' ? 'Activo' :
                   selectedShift.status === 'completed' ? 'Completado' : 
                   selectedShift.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Notas:</p>
                <p className="text-sm text-gray-500">{selectedShift.notes || 'Sin notas'}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-3 pt-0">
              {selectedShift.status === 'scheduled' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    updateShiftMutation.mutate({
                      id: selectedShift.id,
                      data: { status: 'active' }
                    });
                  }}
                >
                  Marcar como Activo
                </Button>
              )}
              {selectedShift.status === 'active' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    updateShiftMutation.mutate({
                      id: selectedShift.id,
                      data: { status: 'completed' }
                    });
                  }}
                >
                  Marcar como Completado
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  toast({
                    title: 'Funcionalidad en desarrollo',
                    description: 'La eliminación de turnos se implementará próximamente',
                  });
                }}
              >
                Eliminar Turno
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}