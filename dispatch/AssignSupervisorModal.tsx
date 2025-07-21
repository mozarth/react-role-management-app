import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useSocket } from "@/hooks/useSocket";
import { MessageType } from "@/lib/constants";

interface AssignSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarm: any | null;
  supervisors: any[];
  patrols: any[];
}

const AssignSupervisorModal: React.FC<AssignSupervisorModalProps> = ({ 
  isOpen, 
  onClose, 
  alarm,
  supervisors,
  patrols
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const socket = useSocket();
  
  const [formData, setFormData] = useState({
    supervisorId: "",
    patrolId: "",
    notes: ""
  });
  
  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        supervisorId: "",
        patrolId: "",
        notes: ""
      });
    }
  }, [isOpen]);
  
  // Create assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/assignments", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patrols"] });
      
      toast({
        title: "Asignación creada",
        description: `La alarma ha sido asignada al supervisor correctamente.`,
      });
      
      // Notify via WebSocket
      if (socket.isConnected) {
        socket.sendMessage(MessageType.PATROL_ASSIGNMENT, {
          assignment: data,
          supervisorId: parseInt(formData.supervisorId)
        });
      }
      
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la asignación. Inténtelo de nuevo.",
      });
    }
  });
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = () => {
    // Basic validation
    if (!formData.supervisorId || !formData.patrolId) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Debe seleccionar un supervisor y una patrulla.",
      });
      return;
    }
    
    if (!alarm) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se ha seleccionado una alarma.",
      });
      return;
    }
    
    assignMutation.mutate({
      supervisorId: parseInt(formData.supervisorId),
      patrolId: parseInt(formData.patrolId),
      alarmId: alarm.id,
      notes: formData.notes
    });
  };
  
  // Get full name of supervisor
  const getSupervisorName = (supervisor: any) => {
    return `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.username;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Asignar Supervisor a Alarma #{alarm?.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {alarm && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="font-medium">
                {alarm.client?.businessName || "Cliente desconocido"}
              </h3>
              <p className="text-sm text-gray-600">
                {alarm.client?.address || "Dirección desconocida"}
              </p>
              {alarm.description && (
                <p className="text-sm mt-2 border-t border-gray-200 pt-2">
                  {alarm.description}
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="supervisor">Supervisor</Label>
              <Select
                value={formData.supervisorId}
                onValueChange={(value) => handleChange("supervisorId", value)}
                disabled={assignMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map(supervisor => (
                    <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                      {getSupervisorName(supervisor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patrol">Patrulla</Label>
              <Select
                value={formData.patrolId}
                onValueChange={(value) => handleChange("patrolId", value)}
                disabled={assignMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar patrulla" />
                </SelectTrigger>
                <SelectContent>
                  {patrols.map(patrol => (
                    <SelectItem key={patrol.id} value={patrol.id.toString()}>
                      {patrol.vehicleCode} - {patrol.licensePlate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {patrols.length === 0 && (
                <p className="text-sm text-red-500">
                  No hay patrullas disponibles en este momento.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas para el supervisor</Label>
              <Textarea
                placeholder="Instrucciones adicionales..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                disabled={assignMutation.isPending}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={assignMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={assignMutation.isPending || patrols.length === 0}
            onClick={handleSubmit}
          >
            {assignMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Asignar Supervisor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSupervisorModal;
