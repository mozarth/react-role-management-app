import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, parseISO, setHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Search, X, Plus, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

const shiftTypes: Record<string, string> = {
  morning: 'Mañana (06:00-14:00)',
  day: 'Día (06:00-18:00)',
  afternoon: 'Tarde (14:00-22:00)',
  night: 'Noche (18:00-06:00)'
};

const shiftColors: Record<string, string> = {
  morning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  day: 'bg-blue-100 border-blue-300 text-blue-800',
  afternoon: 'bg-orange-100 border-orange-300 text-orange-800',
  night: 'bg-indigo-100 border-indigo-300 text-indigo-800',
  rest: 'bg-gray-100 border-gray-300 text-gray-800',
  vacation: 'bg-green-100 border-green-300 text-green-800',
  permission: 'bg-purple-100 border-purple-300 text-purple-800'
};

interface ShiftViewProps {
  viewOnly?: boolean;
}

interface Shift {
  id: number;
  userId: number;
  date: string;
  type: string;
  status: string;
  absenceType?: string;
  notes?: string;
}

// Esquema de validación para el formulario de nuevo turno
const newShiftSchema = z.object({
  userId: z.string().min(1, { message: "Por favor seleccione un operador" }),
  date: z.date({ required_error: "Por favor seleccione una fecha" }),
  type: z.string().min(1, { message: "Por favor seleccione un tipo de turno" }),
  status: z.string().default("active"),
  absenceType: z.string().optional(),
  notes: z.string().optional(),
});

type NewShiftFormValues = z.infer<typeof newShiftSchema>;

export const ShiftViewOperator: React.FC<ShiftViewProps> = ({ viewOnly = false }) => {
  // Estado para mostrar un formulario simple interno en lugar del Dialog que causa problemas
  const [showSimpleForm, setShowSimpleForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [isNewShiftDialogOpen, setIsNewShiftDialogOpen] = useState(false);
  
  // Formulario para nuevo turno
  const form = useForm<NewShiftFormValues>({
    resolver: zodResolver(newShiftSchema),
    defaultValues: {
      userId: "",
      date: new Date(),
      type: "",
      status: "active",
      absenceType: "",
      notes: ""
    }
  });
  
  // Reiniciar formulario cuando se abre el diálogo o el formulario simple
  useEffect(() => {
    if (isNewShiftDialogOpen || showSimpleForm) {
      form.reset({
        userId: "",
        date: new Date(),
        type: "",
        status: "active",
        absenceType: "",
        notes: ""
      });
    }
  }, [isNewShiftDialogOpen, showSimpleForm, form]);

  // Mutación para crear un nuevo turno
  const createShiftMutation = useMutation({
    mutationFn: async (values: NewShiftFormValues) => {
      // Formatear fecha para enviar al servidor
      const formattedDate = format(values.date, 'yyyy-MM-dd');
      
      // Determinar si es un tipo de ausencia o un turno regular
      const isAbsence = values.type === 'absence';
      
      // Crear el objeto con los datos del turno
      let shiftData: any = {
        userId: parseInt(values.userId),
        date: formattedDate,
        status: values.status,
        notes: values.notes || ""
      };
      
      // Asignar tipo según si es ausencia o turno regular
      if (isAbsence) {
        shiftData.absenceType = values.absenceType;
        shiftData.type = ""; // Campo tipo vacío para ausencias
      } else {
        shiftData.type = values.type; // Tipo normal para turnos regulares
        shiftData.absenceType = ""; // No hay tipo de ausencia
      }
      
      console.log("Datos de turno a crear:", shiftData);
      
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shiftData),
      });
      
      if (!response.ok) {
        throw new Error('Error al crear el turno');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Cerrar el diálogo y reiniciar el formulario
      setIsNewShiftDialogOpen(false);
      form.reset();
      
      // Invalidar la consulta para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      
      // Mostrar notificación de éxito
      toast({
        title: "Turno creado",
        description: "El turno ha sido creado exitosamente",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error al crear turno:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el turno. Intente nuevamente.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: NewShiftFormValues) => {
    createShiftMutation.mutate(values);
    // También cerrar el formulario simple
    setShowSimpleForm(false);
  };
  
  // Filtros de fecha adicionales
  const [useCustomDateRange, setUseCustomDateRange] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(weekStart);
  const [endDate, setEndDate] = useState<Date | undefined>(weekEnd);
  const [isStartDateOpen, setIsStartDateOpen] = useState<boolean>(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState<boolean>(false);

  // Estados para manejar las fechas seleccionadas vs. aplicadas
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(weekStart);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(weekEnd);
  
  // Actualizar fechas de consulta cuando cambia la semana
  useEffect(() => {
    if (!useCustomDateRange) {
      setStartDate(weekStart);
      setEndDate(weekEnd);
      setAppliedStartDate(weekStart);
      setAppliedEndDate(weekEnd);
    }
  }, [weekStart, weekEnd, useCustomDateRange]);

  // Determinar qué fechas usar para la consulta
  const queryStartDate = useCustomDateRange ? appliedStartDate : weekStart;
  const queryEndDate = useCustomDateRange ? appliedEndDate : weekEnd;
  
  // Función para aplicar el filtro de fechas
  const applyDateFilter = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  // Obtener todos los turnos
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: ['/api/shifts', format(queryStartDate || new Date(), 'yyyy-MM-dd'), format(queryEndDate || new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/shifts?startDate=${format(queryStartDate || new Date(), 'yyyy-MM-dd')}&endDate=${format(queryEndDate || new Date(), 'yyyy-MM-dd')}`);
        if (!response.ok) {
          console.error('Error al cargar los turnos:', response.status);
          return [];
        }
        
        // Asegurarnos de que los turnos tengan el formato correcto
        const data = await response.json();
        return Array.isArray(data) ? data.map(shift => ({
          ...shift,
          // Asegurarnos de que date sea una cadena válida
          date: typeof shift.date === 'string' ? shift.date : 
                shift.startTime ? shift.startTime.split('T')[0] : 
                format(new Date(), 'yyyy-MM-dd')
        })) : [];
      } catch (error) {
        console.error('Error al obtener turnos:', error);
        return [];
      }
    }
  });

  // Obtener los operadores (mostramos solo usuario actual para operadores)
  const { user } = useAuth();
  const isAlarmOperator = user?.role === 'alarm_operator';
  
  // Datos de operadores simulados (fallback) para demostración
  const mockOperators = [
    { id: 1001, firstName: "Juan", lastName: "Pérez", role: "alarm_operator" },
    { id: 1002, firstName: "María", lastName: "González", role: "alarm_operator" },
    { id: 1003, firstName: "Carlos", lastName: "Rodríguez", role: "alarm_operator" }
  ];
  
  // Si es operador de alarmas, solo mostrar al propio operador
  const { data: operators = mockOperators, isLoading: isLoadingOperators } = useQuery({
    queryKey: ['/api/users/by-role/alarm_operator'],
    queryFn: async () => {
      // Si es un operador de alarmas, solo se muestra a sí mismo
      if (isAlarmOperator && user) {
        return [user];
      }
      
      // Para administradores y directores, mostramos todos los operadores
      try {
        const response = await fetch('/api/users/by-role/alarm_operator');
        if (!response.ok) {
          console.error('Error al cargar operadores:', response.status);
          console.log('Usando datos de operadores de prueba para demostración');
          return mockOperators;
        }
        return await response.json();
      } catch (error) {
        console.error('Error al obtener operadores:', error);
        console.log('Usando datos de operadores de prueba para demostración');
        return mockOperators;
      }
    }
  });

  // Generar los días de la semana
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Cambiar a la semana anterior
  const previousWeek = () => {
    setWeekStart(subWeeks(weekStart, 1));
  };

  // Cambiar a la semana siguiente
  const nextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1));
  };

  // Volver a la semana actual
  const currentWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Filtrar turnos por operador
  const filteredShifts = operatorFilter === 'all' 
    ? shifts 
    : shifts.filter((shift: Shift) => shift.userId.toString() === operatorFilter);

  // Organizar turnos por día y usuario
  const shiftsByDay = weekDays.reduce((acc: Record<string, Record<string, Shift[]>>, day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    acc[dateStr] = {};
    
    // Agrupar turnos por operador para este día
    filteredShifts.forEach((shift: Shift) => {
      const shiftDate = format(parseISO(shift.date), 'yyyy-MM-dd');
      if (shiftDate === dateStr) {
        if (!acc[dateStr][shift.userId]) {
          acc[dateStr][shift.userId] = [];
        }
        acc[dateStr][shift.userId].push(shift);
      }
    });
    
    return acc;
  }, {});

  if (isLoadingShifts || isLoadingOperators) {
    return <div className="flex justify-center p-8">Cargando turnos...</div>;
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Turnos de Operadores
          </CardTitle>
          <div className="flex space-x-2">
            {!viewOnly && (
              <Button 
                variant="default" 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                onClick={() => setShowSimpleForm(!showSimpleForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Turno
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={previousWeek} disabled={useCustomDateRange}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={currentWeek} disabled={useCustomDateRange}>
              Semana Actual
            </Button>
            <Button variant="outline" size="sm" onClick={nextWeek} disabled={useCustomDateRange}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {useCustomDateRange 
            ? `${startDate ? format(startDate, "dd/MM/yyyy") : ''} - ${endDate ? format(endDate, "dd/MM/yyyy") : ''}`
            : `${format(weekStart, "dd 'de' MMMM", { locale: es })} - ${format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: es })}`}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="operatorFilter">Filtrar por Operador</Label>
            <Select value={operatorFilter} onValueChange={setOperatorFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los operadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los operadores</SelectItem>
                {operators.map((operator: any) => (
                  <SelectItem key={operator.id} value={operator.id.toString()}>
                    {operator.firstName} {operator.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Filtrar por Fechas</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setUseCustomDateRange(!useCustomDateRange);
                  if (useCustomDateRange) {
                    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
                  }
                }}
                className="text-xs"
              >
                {useCustomDateRange ? "Volver a vista semanal" : "Personalizar fechas"}
              </Button>
            </div>
            
            {useCustomDateRange && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="startDate">Fecha Inicial</Label>
                    <div className="relative">
                      <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {startDate ? format(startDate, 'dd/MM/yyyy') : 'Seleccionar fecha'}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setStartDate(date);
                              setIsStartDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">Fecha Final</Label>
                    <div className="relative">
                      <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {endDate ? format(endDate, 'dd/MM/yyyy') : 'Seleccionar fecha'}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              setEndDate(date);
                              setIsEndDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <Button 
                    variant="default" 
                    onClick={applyDateFilter} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!startDate || !endDate}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Aplicar Filtro
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 overflow-x-auto">
        {/* Formulario simple para crear turnos (reemplaza al dialog) */}
        {showSimpleForm && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-md shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nuevo Turno</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSimpleForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Operador</Label>
                <select
                  className="w-full p-2 border rounded mt-1"
                  value={form.watch("userId")}
                  onChange={(e) => form.setValue("userId", e.target.value)}
                >
                  <option value="">Seleccionar operador</option>
                  {operators.map((op: any) => (
                    <option key={op.id} value={op.id.toString()}>
                      {op.firstName} {op.lastName}
                    </option>
                  ))}
                </select>
                {form.formState.errors.userId && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.userId.message?.toString()}</p>
                )}
              </div>
              
              <div>
                <Label>Fecha</Label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded mt-1"
                  value={form.watch("date") ? format(form.watch("date"), "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      form.setValue("date", new Date(e.target.value));
                    }
                  }}
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.date.message?.toString()}</p>
                )}
              </div>
              
              <div>
                <Label>Tipo</Label>
                <select 
                  className="w-full p-2 border rounded mt-1"
                  value={form.watch("type")}
                  onChange={(e) => form.setValue("type", e.target.value)}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="morning">Mañana (6:00 - 14:00)</option>
                  <option value="day">Día (6:00 - 18:00)</option>
                  <option value="afternoon">Tarde (14:00 - 22:00)</option>
                  <option value="night">Noche (18:00 - 6:00)</option>
                  <option value="absence">Ausencia</option>
                </select>
                {form.formState.errors.type && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.type.message?.toString()}</p>
                )}
              </div>
              
              {form.watch("type") === "absence" && (
                <div>
                  <Label>Tipo de Ausencia</Label>
                  <select 
                    className="w-full p-2 border rounded mt-1"
                    value={form.watch("absenceType")}
                    onChange={(e) => form.setValue("absenceType", e.target.value)}
                  >
                    <option value="">Seleccionar tipo de ausencia</option>
                    <option value="rest">Día de descanso</option>
                    <option value="permission">Permiso</option>
                    <option value="vacation">Vacaciones</option>
                  </select>
                  {form.formState.errors.absenceType && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.absenceType.message?.toString()}</p>
                  )}
                </div>
              )}
              
              <div>
                <Label>Notas</Label>
                <textarea 
                  className="w-full p-2 border rounded mt-1 resize-none"
                  placeholder="Notas adicionales sobre este turno"
                  value={form.watch("notes") || ""}
                  onChange={(e) => form.setValue("notes", e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="pt-2 flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowSimpleForm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={createShiftMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createShiftMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="min-w-max">
          {/* Encabezado con los días */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="font-semibold text-center p-2 bg-gray-100 rounded">Operador</div>
            {weekDays.map((day) => (
              <div 
                key={day.toString()} 
                className={`font-semibold text-center p-2 rounded ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-200' : 'bg-gray-100'}`}
              >
                <div>{format(day, 'EEEE', { locale: es })}</div>
                <div>{format(day, 'dd/MM')}</div>
              </div>
            ))}
          </div>

          {/* Filas de operadores */}
          {operators
            .filter((operator: any) => operatorFilter === 'all' || operator.id.toString() === operatorFilter)
            .map((operator: any) => (
              <div key={operator.id} className="grid grid-cols-8 gap-2 mb-2">
                <div className="font-medium p-2 bg-gray-50 rounded flex items-center">
                  {operator.firstName} {operator.lastName}
                </div>
                
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const operatorShifts = shiftsByDay[dateStr]?.[operator.id] || [];
                  
                  return (
                    <div 
                      key={day.toString()} 
                      className={`p-2 rounded border ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50' : ''}`}
                    >
                      {operatorShifts.length > 0 ? (
                        <div className="space-y-1">
                          {operatorShifts.map((shift: Shift) => (
                            <div 
                              key={shift.id} 
                              className={`text-xs p-1 rounded border ${shiftColors[shift.type || 'day']}`}
                            >
                              {shift.absenceType 
                                ? `${shift.absenceType === 'rest' ? 'Descanso' : shift.absenceType === 'vacation' ? 'Vacaciones' : 'Permiso'}`
                                : shiftTypes[shift.type || 'day']}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </CardContent>

      {/* Diálogo para crear un nuevo turno */}
      <Dialog open={isNewShiftDialogOpen} onOpenChange={setIsNewShiftDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Turno de Operador</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operador</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un operador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {operators.map((operator: any) => (
                          <SelectItem key={operator.id} value={operator.id.toString()}>
                            {operator.firstName} {operator.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Seleccione una fecha</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Resetear el tipo de ausencia si se selecciona un tipo de turno
                        if (value !== 'absence') {
                          form.setValue('absenceType', '');
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo de turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Mañana (06:00-14:00)</SelectItem>
                        <SelectItem value="day">Día (06:00-18:00)</SelectItem>
                        <SelectItem value="afternoon">Tarde (14:00-22:00)</SelectItem>
                        <SelectItem value="night">Noche (18:00-06:00)</SelectItem>
                        <SelectItem value="absence">Ausencia (Descanso/Permiso/Vacaciones)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('type') === 'absence' && (
                <FormField
                  control={form.control}
                  name="absenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ausencia</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo de ausencia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rest">Descanso</SelectItem>
                          <SelectItem value="permission">Permiso</SelectItem>
                          <SelectItem value="vacation">Vacaciones</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ingrese notas adicionales" 
                        className="resize-none h-20" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewShiftDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={createShiftMutation.isPending}
                >
                  {createShiftMutation.isPending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Turno
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ShiftViewOperator;