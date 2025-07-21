import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfWeek, subWeeks, addWeeks, eachDayOfInterval, isSameDay, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useExcelExport } from '@/hooks/useExcelExport';
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

export default function SupervisorShiftsNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { exportSupervisorsSchedule } = useExcelExport();
  
  // Estados para la UI
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Semana comienza en lunes
  });
  
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  
  // Estados para el diálogo de exportación
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(new Date());
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [exportSupervisorId, setExportSupervisorId] = useState<string>('all');
  
  // Estado para los turnos por día
  const [weekShifts, setWeekShifts] = useState<{
    [key: string]: ShiftTypeType | AbsenceTypeType | null;
  }>({});
  
  // Obtener los supervisores
  const { data: supervisors = [], isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ['/api/users/by-role/supervisor'],
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
      supervisorId: exportSupervisorId === 'all' ? null : exportSupervisorId
    };
    
    // Ejecutar la exportación
    const fileName = await exportSupervisorsSchedule(filters);
    
    if (fileName) {
      // Cerrar el diálogo si la exportación fue exitosa
      setExportDialogOpen(false);
    }
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

  // Renderizar la agenda semanal de todos los supervisores
  const renderAllSupervisorsSchedule = () => {
    // Si no hay datos, mostrar un mensaje
    if (isLoadingSupervisors || isLoadingShifts) {
      return <div className="text-center p-6">Cargando datos de turnos...</div>;
    }

    if (!supervisors || supervisors.length === 0) {
      return <div className="text-center p-6">No hay supervisores disponibles</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supervisor
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
            {supervisors.map((supervisor: Supervisor) => (
              <tr key={supervisor.id}>
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getSupervisorName(supervisor)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supervisor.role}
                      </div>
                    </div>
                  </div>
                </td>
                {daysOfWeek.map((day) => {
                  const supervisorShifts = getShiftsForSupervisorAndDate(supervisor.id, day);
                  const hasShift = supervisorShifts.length > 0;
                  const shift = hasShift ? supervisorShifts[0] : null;
                  const shiftType = shift?.status === 'absence' ? shift.absenceType : shift?.shiftType;
                  
                  return (
                    <td key={format(day, 'yyyy-MM-dd')} className="p-2 whitespace-nowrap text-center">
                      {hasShift ? (
                        <div className="flex flex-col justify-center items-center">
                          <Badge className={`py-1 px-2 ${shiftColors[shiftType || '']}`}>
                            {shiftNames[shiftType || '']}
                          </Badge>
                          {selectedSupervisor?.id === supervisor.id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 text-xs mt-1" 
                              onClick={() => handleDeleteShift(supervisor.id, day)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">-</div>
                      )}
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

  // Componente para el diálogo de exportación
  const ExportDialog = () => (
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Horarios a Excel</DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas y un supervisor para exportar sus horarios
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm" htmlFor="startDate">
              Fecha inicial
            </label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {exportStartDate ? (
                      format(exportStartDate, "dd/MM/yyyy")
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={exportStartDate}
                    onSelect={setExportStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm" htmlFor="endDate">
              Fecha final
            </label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {exportEndDate ? (
                      format(exportEndDate, "dd/MM/yyyy")
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm" htmlFor="supervisor">
              Supervisor
            </label>
            <div className="col-span-3">
              <Select
                value={exportSupervisorId}
                onValueChange={setExportSupervisorId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los supervisores</SelectItem>
                  {supervisors.map((supervisor: Supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                      {getSupervisorName(supervisor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExportSchedule} className="gap-1">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Turnos de Supervisores</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-1"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="h-4 w-4" />
            Exportar Horarios
          </Button>
          <Link to="/supervisors">
            <Button variant="outline" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Volver a Supervisores
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Semana: {format(currentWeekStart, 'd MMM', { locale: es })} - {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: es })}</CardTitle>
            <CardDescription>Vista de todos los supervisores</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderAllSupervisorsSchedule()}
        </CardContent>
      </Card>
      
      {/* Renderizar el diálogo de exportación */}
      <ExportDialog />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Asignar Turnos</CardTitle>
          <CardDescription>Selecciona un supervisor para asignar sus turnos semanales</CardDescription>
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Turnos para {getSupervisorName(selectedSupervisor)}</CardTitle>
            <CardDescription>Selecciona los turnos para cada día de la semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {daysOfWeek.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const hasShift = dateKey in weekShifts;
                const shiftType = weekShifts[dateKey];
                const existingShiftId = getShiftId(selectedSupervisor.id, day);
                
                return (
                  <div key={dateKey} className="border rounded-lg p-3 flex flex-col items-center">
                    <div className="text-sm font-medium mb-1">{format(day, 'EEE', { locale: es })}</div>
                    <div className="text-xl font-bold mb-2">{format(day, 'd', { locale: es })}</div>
                    <div className="flex flex-col gap-2 w-full">
                      {hasShift ? (
                        <div className="flex flex-col gap-1">
                          <Badge className={`flex justify-center items-center py-1 px-2 ${shiftColors[shiftType || '']}`}>
                            {shiftNames[shiftType || '']}
                          </Badge>
                          {existingShiftId && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 text-xs mt-1" 
                              onClick={() => handleDeleteShift(selectedSupervisor.id, day)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 text-center">Sin turno asignado</div>
                      )}
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <div className="font-medium text-xs mb-1 col-span-2">Turnos:</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs h-8 bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300" 
                          onClick={() => setShiftForDay(day, ShiftType.MORNING_8H)}
                        >
                          M
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300" 
                          onClick={() => setShiftForDay(day, ShiftType.AFTERNOON_8H)}
                        >
                          T
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 bg-green-100 text-green-800 hover:bg-green-200 border-green-300" 
                          onClick={() => setShiftForDay(day, ShiftType.MORNING_12H)}
                        >
                          D
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-300" 
                          onClick={() => setShiftForDay(day, ShiftType.NIGHT_12H)}
                        >
                          N
                        </Button>
                        <div className="font-medium text-xs mb-1 mt-2 col-span-2">Ausencias:</div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300" 
                          onClick={() => setShiftForDay(day, AbsenceType.REST)}
                        >
                          D
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-300" 
                          onClick={() => setShiftForDay(day, AbsenceType.VACATION)}
                        >
                          V
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 bg-red-100 text-red-800 hover:bg-red-200 border-red-300" 
                          onClick={() => setShiftForDay(day, AbsenceType.SICK_LEAVE)}
                        >
                          E
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300" 
                          onClick={() => setShiftForDay(day, AbsenceType.PERMISSION)}
                        >
                          P
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              onClick={saveAllShifts}
              disabled={Object.keys(weekShifts).length === 0}
              className="gap-1"
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