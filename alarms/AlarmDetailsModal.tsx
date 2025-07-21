import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlarmType, AlarmTypeLabels, AlarmStatus, AlarmStatusLabels } from "@/lib/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { MapPin, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import { MessageType } from "@/lib/constants";
import { Spinner } from "@/components/ui/spinner";

interface AlarmDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarm: any | null;
  clients: any[];
  onSendToDispatch: (alarmId: number) => void;
}

const AlarmDetailsModal: React.FC<AlarmDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  alarm,
  clients,
  onSendToDispatch
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const socket = useSocket();

  const [formData, setFormData] = useState({
    clientId: "",
    type: AlarmType.INTRUSION,
    description: "",
    status: AlarmStatus.ACTIVE
  });

  // Reset form when modal opens
  useEffect(() => {
    if (alarm) {
      setFormData({
        clientId: alarm.clientId?.toString(),
        type: alarm.type || AlarmType.INTRUSION,
        description: alarm.description || "",
        status: alarm.status || AlarmStatus.ACTIVE
      });
    } else {
      setFormData({
        clientId: "",
        type: AlarmType.INTRUSION,
        description: "",
        status: AlarmStatus.ACTIVE
      });
    }
  }, [alarm, isOpen]);

  // Creation/Update mutation
  const alarmMutation = useMutation({
    mutationFn: async (data: any) => {
      if (alarm) {
        // Update existing alarm
        return await apiRequest("PUT", `/api/alarms/${alarm.id}`, data);
      } else {
        // Create new alarm
        return await apiRequest("POST", "/api/alarms", data);
      }
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
      
      toast({
        title: alarm ? "Alarma actualizada" : "Alarma creada",
        description: alarm 
          ? `La alarma #${alarm.id} ha sido actualizada correctamente.`
          : `Nueva alarma creada con ID #${data.id}.`,
      });
      
      // Notify via WebSocket for new alarms
      if (!alarm && socket.isConnected) {
        socket.sendMessage(MessageType.NEW_ALARM, data);
      } else if (alarm && socket.isConnected) {
        socket.sendMessage(MessageType.ALARM_UPDATE, data);
      }
      
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo ${alarm ? "actualizar" : "crear"} la alarma. Inténtelo de nuevo.`,
      });
    }
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.clientId) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Debe seleccionar un cliente.",
      });
      return;
    }

    alarmMutation.mutate({
      ...formData,
      clientId: parseInt(formData.clientId)
    });
  };

  const getGoogleMapsLink = () => {
    if (!alarm || !alarm.client || !alarm.client.coordinates) return "#";
    
    const [lat, lng] = alarm.client.coordinates.split(',');
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const getModalTitle = () => {
    if (!alarm) return "Nueva Alarma";
    return `Alarma #${alarm.id} - ${alarm.client?.businessName || "Cliente"}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{getModalTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {alarm && alarm.client && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{alarm.client.businessName}</h3>
                  <p className="text-sm text-gray-600">{alarm.client.address}</p>
                  <p className="text-sm text-gray-600">Contacto: {alarm.client.contactName || "No especificado"}</p>
                  {alarm.client.contactPhone && (
                    <p className="text-sm text-gray-600">Teléfono: {alarm.client.contactPhone}</p>
                  )}
                </div>
                
                <a 
                  href={getGoogleMapsLink()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary-700 text-sm hover:underline"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Ver en mapa
                </a>
              </div>
              
              {alarm.createdAt && (
                <div className="mt-2 border-t border-gray-200 pt-2 text-sm text-gray-500">
                  Creada: {format(new Date(alarm.createdAt), "dd/MM/yyyy HH:mm:ss")}
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            {!alarm && (
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => handleChange("clientId", value)}
                  disabled={!!alarm}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.businessName} - {client.clientCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Alarma</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
                disabled={alarmMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AlarmType.INTRUSION}>{AlarmTypeLabels[AlarmType.INTRUSION]}</SelectItem>
                  <SelectItem value={AlarmType.FIRE}>{AlarmTypeLabels[AlarmType.FIRE]}</SelectItem>
                  <SelectItem value={AlarmType.PANIC}>{AlarmTypeLabels[AlarmType.PANIC]}</SelectItem>
                  <SelectItem value={AlarmType.TECHNICAL}>{AlarmTypeLabels[AlarmType.TECHNICAL]}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {alarm && (
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                  disabled={alarmMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AlarmStatus.ACTIVE}>{AlarmStatusLabels[AlarmStatus.ACTIVE]}</SelectItem>
                    <SelectItem value={AlarmStatus.DISPATCHED}>{AlarmStatusLabels[AlarmStatus.DISPATCHED]}</SelectItem>
                    <SelectItem value={AlarmStatus.IN_PROGRESS}>{AlarmStatusLabels[AlarmStatus.IN_PROGRESS]}</SelectItem>
                    <SelectItem value={AlarmStatus.RESOLVED}>{AlarmStatusLabels[AlarmStatus.RESOLVED]}</SelectItem>
                    <SelectItem value={AlarmStatus.FALSE}>{AlarmStatusLabels[AlarmStatus.FALSE]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción / Notas</Label>
              <Textarea
                placeholder="Detalles de la alarma..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                disabled={alarmMutation.isPending}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          {alarm && (
            <Button 
              variant="outline" 
              onClick={() => {
                window.open(getGoogleMapsLink(), '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Maps
            </Button>
          )}
          
          <div className="flex gap-2">
            {alarm && alarm.status === AlarmStatus.ACTIVE && (
              <Button
                variant="default"
                onClick={() => {
                  onSendToDispatch(alarm.id);
                  onClose();
                }}
              >
                Enviar a Despacho
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={alarmMutation.isPending}
              onClick={handleSubmit}
            >
              {alarmMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              {alarm ? "Actualizar" : "Crear Alarma"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlarmDetailsModal;
