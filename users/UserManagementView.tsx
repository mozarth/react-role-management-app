import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { UserRole } from "@/lib/constants";
import { Search, Plus, RefreshCw, UserCog, UserMinus, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import UserForm from "./UserForm";
import CreateSupervisorForm from "./CreateSupervisorForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
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
import { getRoleDisplay } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

const UserManagementView: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSupervisorFormOpen, setIsSupervisorFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  
  // Verificar si el usuario actual es un despachador
  const isDispatcher = currentUser?.role === UserRole.DISPATCHER;
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente.",
      });
      
      setUserToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el usuario. Inténtelo de nuevo.",
      });
    }
  });
  
  // Filter users based on role and search
  const filteredUsers = users.filter(user => {
    // Si el usuario es despachador, solo mostrar supervisores
    if (isDispatcher && user.role !== UserRole.SUPERVISOR) {
      return false;
    }
    
    // Filtrado por búsqueda
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const searchLower = searchTerm.toLowerCase();
    
    return (
      user.username.toLowerCase().includes(searchLower) ||
      fullName.toLowerCase().includes(searchLower) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  });
  
  // Handle refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  };
  
  // Handle edit user
  const handleEditUser = (user: any) => {
    // Si el usuario actual es despachador y está intentando editar un supervisor, no permitir
    if (isDispatcher && user.role === UserRole.SUPERVISOR) {
      toast({
        variant: "destructive",
        title: "Acción no permitida",
        description: "No tiene permisos para editar supervisores.",
      });
      return;
    }
    
    setSelectedUser(user);
    setIsFormOpen(true);
  };
  
  // Handle new user
  const handleNewUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };
  
  // Handle new supervisor (solo para despachadores)
  const handleNewSupervisor = () => {
    setIsSupervisorFormOpen(true);
  };
  
  // Handle delete user
  const handleDeleteUser = (user: any) => {
    // Si el usuario actual es despachador y está intentando eliminar un supervisor, no permitir
    if (isDispatcher && user.role === UserRole.SUPERVISOR) {
      toast({
        variant: "destructive",
        title: "Acción no permitida",
        description: "No tiene permisos para eliminar supervisores.",
      });
      return;
    }
    
    setUserToDelete(user);
  };
  
  // Confirm delete user
  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral mb-2">Gestión de Usuarios</h1>
        <p className="text-gray-600">Administre los usuarios del sistema y sus permisos</p>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isDispatcher ? (
            <Button onClick={handleNewSupervisor} className="bg-green-600 hover:bg-green-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Registrar Supervisor
            </Button>
          ) : (
            <Button onClick={handleNewUser}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          )}
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-lg font-semibold text-neutral">Usuarios del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">#{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{fullName || "Sin nombre"}</TableCell>
                        <TableCell>{user.email || "Sin email"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                            user.role === UserRole.DIRECTOR ? 'bg-blue-100 text-blue-800' :
                            user.role === UserRole.ALARM_OPERATOR ? 'bg-red-100 text-red-800' :
                            user.role === UserRole.DISPATCHER ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getRoleDisplay(user.role)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* No mostrar botones de editar/eliminar para supervisores si el usuario es despachador */}
                            {!(isDispatcher && user.role === UserRole.SUPERVISOR) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  title="Editar usuario"
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteUser(user)}
                                  title="Eliminar usuario"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {/* Si es un supervisor y el usuario es despachador, mostrar mensaje */}
                            {isDispatcher && user.role === UserRole.SUPERVISOR && (
                              <span className="text-xs text-gray-500 italic">
                                Creado por despachador
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No hay usuarios que coincidan con la búsqueda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* User Form Modal */}
      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={selectedUser}
      />
      
      {/* Supervisor Form Modal (Usando componente especializado) */}
      {isDispatcher && (
        <CreateSupervisorForm
          isOpen={isSupervisorFormOpen}
          onClose={() => setIsSupervisorFormOpen(false)}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar al usuario <strong>{userToDelete?.username}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteUserMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementView;
