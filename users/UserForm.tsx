import React, { useState, useEffect } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { UserRole } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

// Form schema for user creation/update
const userSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
  role: z.enum([
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.ALARM_OPERATOR,
    UserRole.DISPATCHER,
    UserRole.SUPERVISOR
  ]),
  phone: z.string().optional(),
});

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
}

const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, user }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditMode] = useState(!!user);
  
  // Prepare the form
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      role: UserRole.SUPERVISOR,
      phone: "",
    },
  });
  
  // Load user data when editing
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        password: "", // Don't prefill password
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role,
        phone: user.phone || "",
      });
    } else {
      form.reset({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        email: "",
        role: UserRole.SUPERVISOR,
        phone: "",
      });
    }
  }, [user, form, isOpen]);
  
  // Create/Update user mutation
  const userMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userSchema>) => {
      if (isEditMode) {
        // Update existing user
        // If password is empty, remove it from the data
        if (!data.password) {
          const { password, ...dataWithoutPassword } = data;
          return await apiRequest("PUT", `/api/users/${user.id}`, dataWithoutPassword);
        }
        return await apiRequest("PUT", `/api/users/${user.id}`, data);
      } else {
        // Create new user
        return await apiRequest("POST", "/api/users", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: isEditMode ? "Usuario actualizado" : "Usuario creado",
        description: isEditMode
          ? "El usuario ha sido actualizado correctamente."
          : "El usuario ha sido creado correctamente.",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditMode
          ? "No se pudo actualizar el usuario. Verifique los datos e inténtelo de nuevo."
          : "No se pudo crear el usuario. Verifique los datos e inténtelo de nuevo.",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof userSchema>) => {
    userMutation.mutate(data);
  };
  
  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Administrador";
      case UserRole.DIRECTOR:
        return "Director";
      case UserRole.ALARM_OPERATOR:
        return "Operador de Alarmas";
      case UserRole.DISPATCHER:
        return "Despachador de Patrullas";
      case UserRole.SUPERVISOR:
        return "Supervisor Motorizado";
      default:
        return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditMode ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="usuario123" 
                        {...field} 
                        disabled={isEditMode || userMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? "Nueva Contraseña" : "Contraseña"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={isEditMode ? "Dejar en blanco para mantener" : "••••••••"} 
                        {...field} 
                        disabled={userMutation.isPending}
                      />
                    </FormControl>
                    {isEditMode && (
                      <FormDescription>
                        Dejar en blanco para mantener la contraseña actual.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Juan" 
                        {...field} 
                        disabled={userMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Pérez" 
                        {...field} 
                        disabled={userMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="usuario@ejemplo.com" 
                        {...field} 
                        disabled={userMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 234 567 890" 
                        {...field} 
                        disabled={userMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={userMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>{getRoleLabel(UserRole.ADMIN)}</SelectItem>
                      <SelectItem value={UserRole.DIRECTOR}>{getRoleLabel(UserRole.DIRECTOR)}</SelectItem>
                      <SelectItem value={UserRole.ALARM_OPERATOR}>{getRoleLabel(UserRole.ALARM_OPERATOR)}</SelectItem>
                      <SelectItem value={UserRole.DISPATCHER}>{getRoleLabel(UserRole.DISPATCHER)}</SelectItem>
                      <SelectItem value={UserRole.SUPERVISOR}>{getRoleLabel(UserRole.SUPERVISOR)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={userMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={userMutation.isPending}
              >
                {userMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                {isEditMode ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
