import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CreateSupervisorFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSupervisorForm: React.FC<CreateSupervisorFormProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    identificationNumber: "",
    whatsappNumber: "",
    motorcyclePlate: ""
  });

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      identificationNumber: "",
      whatsappNumber: "",
      motorcyclePlate: ""
    });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (formData.username.length < 3) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de usuario debe tener al menos 3 caracteres",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    if (!formData.firstName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre es obligatorio",
      });
      return;
    }

    if (!formData.lastName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El apellido es obligatorio",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Usar la nueva API para crear supervisores
      const response = await fetch('/api/supervisors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "¡Éxito!",
          description: "Supervisor creado correctamente",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        resetForm();
        onClose();
      } else {
        throw new Error(result.message || "Error al crear supervisor");
      }
    } catch (error) {
      console.error("Error al crear supervisor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el supervisor",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Registrar Nuevo Supervisor
          </DialogTitle>
          <DialogDescription>
            Complete la información del supervisor para registrarlo en el sistema.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Nombre de Usuario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="supervisor123"
                required
                minLength={3}
                maxLength={50}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Juan"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Apellido <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Pérez"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="supervisor@ejemplo.com"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identificationNumber">
                Número de Identificación <span className="text-red-500">*</span>
              </Label>
              <Input
                id="identificationNumber"
                name="identificationNumber"
                value={formData.identificationNumber}
                onChange={handleChange}
                placeholder="123456789"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">
                Número de WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="motorcyclePlate">
              Placa de Motocicleta <span className="text-red-500">*</span>
            </Label>
            <Input
              id="motorcyclePlate"
              name="motorcyclePlate"
              value={formData.motorcyclePlate}
              onChange={handleChange}
              placeholder="ABC123"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Registrar Supervisor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSupervisorForm;