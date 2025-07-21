import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { UserRole, ShiftStatus } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { format, isBefore, set, add } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

// Form schema for shift creation
const shiftSchema = z.object({
  userId: z.string().min(1, "Debe seleccionar un usuario"),
  date: z.date({
    required_error: "Debe seleccionar una fecha",
  }),
  startHour: z.string().min(1, "Debe seleccionar hora de inicio"),
  endHour: z.string().min(1, "Debe seleccionar hora de fin"),
  status: z.enum([
    ShiftStatus.SCHEDULED,
    ShiftStatus.ACTIVE,
    ShiftStatus.COMPLETED,
    ShiftStatus.CANCELED
  ]),
  notes: z.string().optional(),
})
.refine(
  (data) => {
    const startHourParts = data.startHour.split(":");
    const endHourParts = data.endHour.split(":");
    
    const startDate = set(data.date, {
      hours: parseInt(startHourParts[0]),
      minutes: parseInt(startHourParts[1]),
      seconds: 0,
      milliseconds: 0
    });
    
    const endDate = set(data.date, {
      hours: parseInt(endHourParts[0]),
      minutes: parseInt(endHourParts[1]),
      seconds: 0,
      milliseconds: 0
    });
    
    return isBefore(startDate, endDate);
  },
  {
    message: "La hora de fin debe ser posterior a la hora de inicio",
    path: ["endHour"],
  }
);

interface CreateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
}

const CreateShiftModal: React.FC<CreateShiftModalProps> = ({ 
  isOpen, 
  onClose, 
  users 
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Generate time options (15 minute intervals)
  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hours = Math.floor(i / 4).toString().padStart(2, "0");
    const minutes = ((i % 4) * 15).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  });
  
  // Prepare the form
  const form = useForm<z.infer<typeof shiftSchema>>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      userId: "",
      date: new Date(),
      startHour: "08:00",
      endHour: "16:00",
      status: ShiftStatus.SCHEDULED,
      notes: "",
    },
  });
  
  // Filter users by role
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const filteredUsers = users.filter(user => {
    if (roleFilter === "all") return true;
    return user.role === roleFilter;
  });
  
  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shiftSchema>) => {
      // Convert form data to API format
      const startHourParts = data.startHour.split(":");
      const endHourParts = data.endHour.split(":");
      
      const startTime = set(data.date, {
        hours: parseInt(startHourParts[0]),
        minutes: parseInt(startHourParts[1]),
        seconds: 0,
        milliseconds: 0
      });
      
      const endTime = set(data.date, {
        hours: parseInt(endHourParts[0]),
        minutes: parseInt(endHourParts[1]),
        seconds: 0,
        milliseconds: 0
      });
      
      // If end time is before start time, assume it's the next day
      const adjustedEndTime = isBefore(endTime, startTime) 
        ? add(endTime, { days: 1 }) 
        : endTime;
      
      const shiftData = {
        userId: parseInt(data.userId),
        startTime: startTime.toISOString(),
        endTime: adjustedEndTime.toISOString(),
        status: data.status,
        notes: data.notes,
      };
      
      return await apiRequest("POST", "/api/shifts", shiftData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      
      toast({
        title: "Turno creado",
        description: "El turno ha sido creado correctamente.",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el turno. Inténtelo de nuevo.",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof shiftSchema>) => {
    createShiftMutation.mutate(data);
  };
  
  // Get role options
  const roleOptions = [
    { value: "all", label: "Todos los roles" },
    { value: UserRole.ALARM_OPERATOR, label: "Operador de Alarmas" },
    { value: UserRole.DISPATCHER, label: "Despachador" },
    { value: UserRole.SUPERVISOR, label: "Supervisor Motorizado" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Crear Nuevo Turno
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium">Filtrar por rol</label>
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={createShiftMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredUsers.map((user) => {
                        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                        const displayName = fullName || user.username;
                        
                        return (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {displayName} ({user.role})
                          </SelectItem>
                        );
                      })}
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
                          className="pl-3 text-left font-normal"
                          disabled={createShiftMutation.isPending}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: require('date-fns/locale/es') })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={createShiftMutation.isPending}
                        locale={require('date-fns/locale/es')}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de inicio</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={createShiftMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar hora" />
                          <Clock className="h-4 w-4 opacity-50" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
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
                name="endHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de fin</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={createShiftMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar hora" />
                          <Clock className="h-4 w-4 opacity-50" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={createShiftMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ShiftStatus.SCHEDULED}>Programado</SelectItem>
                      <SelectItem value={ShiftStatus.ACTIVE}>Activo</SelectItem>
                      <SelectItem value={ShiftStatus.COMPLETED}>Completado</SelectItem>
                      <SelectItem value={ShiftStatus.CANCELED}>Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre el turno..."
                      className="resize-none"
                      {...field}
                      disabled={createShiftMutation.isPending}
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
                onClick={onClose}
                disabled={createShiftMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createShiftMutation.isPending}
              >
                {createShiftMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Crear Turno
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateShiftModal;
