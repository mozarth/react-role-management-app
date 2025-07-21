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
import { UserRole } from "@/lib/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

// Form schema solo para supervisores
const supervisorSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  email: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
  phone: z.string().optional(),
});

interface SupervisorFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupervisorForm: React.FC<SupervisorFormProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Prepare the form
  const form = useForm<z.infer<typeof supervisorSchema>>({
    resolver: zodResolver(supervisorSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });
  
  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      form.reset({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      });
    }
  }, [isOpen, form]);
  
  // Create supervisor mutation
  const supervisorMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supervisorSchema>) => {
      // Añadir el rol de supervisor
      const supervisorData = {
        ...data,
        role: UserRole.SUPERVISOR,
      };
      
      return await apiRequest("POST", "/api/users", supervisorData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "Supervisor registrado",
        description: "El supervisor ha sido registrado correctamente.",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el supervisor. Verifique los datos e inténtelo de nuevo.",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof supervisorSchema>) => {
    supervisorMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Registrar Nuevo Supervisor
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
                        placeholder="supervisor123" 
                        {...field} 
                        disabled={supervisorMutation.isPending}
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        disabled={supervisorMutation.isPending}
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
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Juan" 
                        {...field} 
                        disabled={supervisorMutation.isPending}
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
                        disabled={supervisorMutation.isPending}
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
                        placeholder="supervisor@ejemplo.com" 
                        {...field} 
                        disabled={supervisorMutation.isPending}
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
                        disabled={supervisorMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={supervisorMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={supervisorMutation.isPending}
              >
                {supervisorMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Registrar Supervisor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorForm;