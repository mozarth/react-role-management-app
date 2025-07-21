import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Spinner } from "@/components/ui/spinner";
import { Calendar, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ShiftStatus, UserRole } from "@shared/schema";
import CreateShiftModal from "./CreateShiftModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const ShiftSchedulingView: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<any | null>(null);
  
  // Calculate the start and end dates for the current week
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Week starts on Monday
  const endOfCurrentWeek = addDays(startOfCurrentWeek, 6); // End on Sunday
  
  // Fetch shifts
  const { data: shifts = [], isLoading: isShiftsLoading } = useQuery({
    queryKey: ["/api/shifts", { 
      startDate: format(startOfCurrentWeek, 'yyyy-MM-dd'),
      endDate: format(endOfCurrentWeek, 'yyyy-MM-dd')
    }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/shifts?startDate=${format(startOfCurrentWeek, 'yyyy-MM-dd')}&endDate=${format(endOfCurrentWeek, 'yyyy-MM-dd')}`);
      return await res.json();
    }
  });
  
  // Fetch users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      return await apiRequest("DELETE", `/api/shifts/${shiftId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      
      toast({
        title: "Turno eliminado",
        description: "El turno ha sido eliminado correctamente.",
      });
      
      setShiftToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el turno. Inténtelo de nuevo.",
      });
    }
  });
  
  // Get user by ID
  const getUserById = (userId: number) => {
    return users.find(user => user.id === userId);
  };
  
  // Get user display name
  const getUserDisplayName = (userId: number) => {
    const user = getUserById(userId);
    
    if (!user) return "Usuario desconocido";
    
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.username;
  };
  
  // Filter shifts by role
  const filteredShifts = shifts.filter(shift => {
    if (selectedRole === "all") return true;
    
    const user = getUserById(shift.userId);
    return user && user.role === selectedRole;
  });
  
  // Group shifts by day
  const shiftsByDay = new Array(7).fill(null).map((_, index) => {
    const date = addDays(startOfCurrentWeek, index);
    
    return {
      date,
      shifts: filteredShifts.filter(shift => 
        isSameDay(new Date(shift.startTime), date)
      )
    };
  });
  
  // Handle refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
  };
  
  // Handle new shift
  const handleNewShift = () => {
    setIsCreateModalOpen(true);
  };
  
  // Handle delete shift
  const handleDeleteShift = (shift: any) => {
    setShiftToDelete(shift);
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case ShiftStatus.SCHEDULED:
        return "bg-blue-100 text-blue-800";
      case ShiftStatus.ACTIVE:
        return "bg-green-100 text-green-800";
      case ShiftStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case ShiftStatus.CANCELED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Format time
  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'HH:mm');
  };
  
  // Get role options
  const roleOptions = [
    { value: "all", label: "Todos los roles" },
    { value: UserRole.ALARM_OPERATOR, label: "Operador de Alarmas" },
    { value: UserRole.DISPATCHER, label: "Despachador" },
    { value: UserRole.SUPERVISOR, label: "Supervisor Motorizado" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral mb-2">Programación de Turnos</h1>
        <p className="text-gray-600">Gestión de turnos para el personal</p>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <span className="font-medium">
              {format(startOfCurrentWeek, "dd 'de' MMMM", { locale: es })} - {format(endOfCurrentWeek, "dd 'de' MMMM, yyyy", { locale: es })}
            </span>
          </div>
          
          <Select
            value={selectedRole}
            onValueChange={setSelectedRole}
          >
            <SelectTrigger className="w-[200px]">
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
        
        <div className="flex items-center gap-2">
          <Button onClick={handleNewShift}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Turno
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="week" className="mb-6">
        <TabsList>
          <TabsTrigger value="week">Vista Semanal</TabsTrigger>
          <TabsTrigger value="list">Vista de Lista</TabsTrigger>
        </TabsList>
        
        <TabsContent value="week">
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Horario Semanal</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isShiftsLoading || isUsersLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="grid grid-cols-7 border-b">
                  {/* Day headers */}
                  {shiftsByDay.map((day, index) => (
                    <div 
                      key={index} 
                      className={`p-2 text-center font-medium border-r ${
                        isSameDay(day.date, new Date()) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div>{format(day.date, 'EEE', { locale: es })}</div>
                      <div className="text-sm">{format(day.date, 'dd/MM')}</div>
                    </div>
                  ))}
                  
                  {/* Shift grid */}
                  {shiftsByDay.map((day, dayIndex) => (
                    <div
                      key={`shifts-${dayIndex}`}
                      className={`p-2 border-r min-h-48 ${
                        isSameDay(day.date, new Date()) ? 'bg-blue-50' : ''
                      }`}
                    >
                      {day.shifts.length > 0 ? (
                        <div className="space-y-2">
                          {day.shifts.map((shift) => {
                            const user = getUserById(shift.userId);
                            
                            return (
                              <div
                                key={shift.id}
                                className={`p-2 rounded-md text-xs ${
                                  user?.role === UserRole.ALARM_OPERATOR ? 'bg-red-100' :
                                  user?.role === UserRole.DISPATCHER ? 'bg-amber-100' :
                                  user?.role === UserRole.SUPERVISOR ? 'bg-green-100' :
                                  'bg-gray-100'
                                }`}
                              >
                                <div className="font-medium">{getUserDisplayName(shift.userId)}</div>
                                <div className="text-gray-700">
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                    getStatusBadgeColor(shift.status)
                                  }`}>
                                    {shift.status}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteShift(shift)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <span className="text-gray-400 text-xs">Sin turnos</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Lista de Turnos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isShiftsLoading || isUsersLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShifts.length > 0 ? (
                      filteredShifts.map((shift) => {
                        const user = getUserById(shift.userId);
                        
                        return (
                          <TableRow key={shift.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">#{shift.id}</TableCell>
                            <TableCell>{getUserDisplayName(shift.userId)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  user?.role === UserRole.ALARM_OPERATOR ? 'bg-red-100 text-red-800 border-red-200' :
                                  user?.role === UserRole.DISPATCHER ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                  user?.role === UserRole.SUPERVISOR ? 'bg-green-100 text-green-800 border-green-200' :
                                  'bg-gray-100'
                                }
                              >
                                {user?.role ? user.role : "Desconocido"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(shift.startTime), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell>
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                getStatusBadgeColor(shift.status)
                              }`}>
                                {shift.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteShift(shift)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No hay turnos programados para el período seleccionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Shift Modal */}
      <CreateShiftModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        users={users}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!shiftToDelete} onOpenChange={() => setShiftToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar este turno?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => shiftToDelete && deleteShiftMutation.mutate(shiftToDelete.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteShiftMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShiftSchedulingView;
