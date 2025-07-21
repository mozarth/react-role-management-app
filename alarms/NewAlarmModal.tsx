import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlarmType, AlarmTypeLabels, MessageType } from '@/lib/constants';
import { sendSocketMessage } from '@/lib/socket';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// Schema de validación para el formulario
const formSchema = z.object({
  accountNumber: z.string().min(1, { message: 'El número de cuenta es requerido' }),
  clientName: z.string().min(1, { message: 'La razón social es requerida' }),
  address: z.string().min(1, { message: 'La dirección es requerida' }),
  city: z.string().min(1, { message: 'La ciudad es requerida' }),
  state: z.string().min(1, { message: 'El departamento es requerido' }),
  type: z.string().min(1, { message: 'El tipo de alarma es requerido' }),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewAlarmModal({ isOpen, onClose }: NewAlarmModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Obtener todos los clientes para autocompletar
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
    staleTime: 300000, // 5 minutos
  });

  // Configuración del formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountNumber: '',
      clientName: '',
      address: '',
      city: '',
      state: '',
      type: '',
      description: '',
    },
  });

  // Mutación para crear una nueva alarma
  const createAlarmMutation = useMutation({
    mutationFn: async (newAlarm: any) => {
      return await apiRequest('POST', '/api/alarms', newAlarm);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/alarms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alarms/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      console.log('Alarma creada con éxito:', data);
      
      // Verificamos que data contenga la alarma creada
      if (data && typeof data === 'object') {
        // Enviar notificación SIN targetRole para asegurar la entrega a TODOS los usuarios
        console.log('🚨 Enviando notificación global de alarma - sin filtro de rol');
        
        // Mejorar el mensaje de la notificación con información más detallada
        const clientInfo = data.clientName || data.accountNumber || 'Cliente sin identificar';
        const alarmType = data.type || 'Alarma';
        const locationInfo = data.address || data.location || '';
        
        // Primera notificación sin targetRole para envío global
        sendSocketMessage(MessageType.NOTIFICATION, {
          title: '🚨 ALARMA URGENTE - REQUIERE ATENCIÓN INMEDIATA',
          message: `${clientInfo} - ${alarmType} - ${locationInfo}`,
          // Sin targetRole = envío a todos
          notificationType: 'alarm',
          entityId: data.id,
          entityType: 'alarm'
        });
        
        // Enviar también como mensaje DISPATCH_REQUEST para mayor visibilidad
        console.log('Enviando como solicitud de despacho para aumentar prioridad');
        sendSocketMessage(MessageType.DISPATCH_REQUEST, {
          alarmId: data.id,
          clientId: data.clientId,
          clientName: clientInfo,
          requestedBy: user?.id || 0,
          priority: 'alta',
          notes: `${alarmType} - ${locationInfo}`
        });
        
        // Esperar un momento y luego enviar una segunda notificación para asegurar recepción
        setTimeout(() => {
          console.log('Enviando segunda notificación de refuerzo - global');
          sendSocketMessage(MessageType.NOTIFICATION, {
            title: '⚠️ RECORDATORIO: ALARMA SIN ATENDER',
            message: `Alarma de ${clientInfo} aún requiere atención urgente`,
            // Sin targetRole = envío a todos
            notificationType: 'alarm',
            entityId: data.id,
            entityType: 'alarm'
          });
          
          // También enviamos una específica a despachadores como respaldo
          console.log('Enviando notificación específica a despachadores como respaldo');
          sendSocketMessage(MessageType.NOTIFICATION, {
            title: '🔔 Atención Despachadores',
            message: `Se requiere asignar patrulla a: ${clientInfo}`,
            targetRole: 'dispatcher',
            notificationType: 'alarm',
            entityId: data.id,
            entityType: 'alarm'
          });
        }, 2000);
        
        // Luego enviar la alarma completa con toda la información
        console.log('Enviando alarma completa a través de WebSocket');
        setTimeout(() => {
          sendSocketMessage(MessageType.NEW_ALARM, {
            ...data,
            priority: 'high',
            createdAt: new Date().toISOString()
          });
          
          // También enviar como DISPATCH_REQUEST para asegurar que llegue al despachador
          sendSocketMessage(MessageType.DISPATCH_REQUEST, {
            alarmId: data.id,
            clientId: data.clientId,
            clientName: data.clientName || clientInfo,
            requestedBy: user?.id || 0,
            priority: 'high',
            notes: data.description || ''
          });
        }, 500);
      }
      
      toast({
        title: 'Alarma creada',
        description: 'La alarma se ha creado correctamente',
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al crear la alarma: ${error.message || error}`,
        variant: 'destructive',
      });
    },
  });

  // Función para manejar ingreso forzado
  const handleForcedEntry = () => {
    const formValues = form.getValues();
    
    // Validar campos mínimos requeridos para ingreso forzado
    if (!formValues.accountNumber || !formValues.clientName || !formValues.address || !formValues.city) {
      toast({
        title: 'Campos requeridos',
        description: 'Para crear una alarma de ingreso forzado, complete al menos: Número de cuenta, Razón social, Dirección y Ciudad.',
        variant: 'destructive',
      });
      return;
    }

    // Crear datos de ingreso forzado con tipo específico
    const forcedEntryData = {
      ...formValues,
      type: 'intrusion', // Tipo específico para ingreso forzado
      description: `🚨 INGRESO FORZADO - ${formValues.description || 'Alarma de alta prioridad'}`,
      priority: 'critical'
    };

    // Usar la función onSubmit existente pero con datos de ingreso forzado
    onSubmitInternal(forcedEntryData);
  };

  // Función para manejar el envío del formulario
  function onSubmit(data: FormValues) {
    onSubmitInternal(data);
  }

  // Función interna para procesar el envío
  function onSubmitInternal(data: FormValues & { priority?: string }) {
    // Construcción de la ubicación completa
    const fullAddress = `${data.address}, ${data.city}, ${data.state}`;
    
    // Generar enlace de Google Maps
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    
    // Buscar el ID del cliente existente si está presente
    const client = (clients && Array.isArray(clients)) 
      ? (clients as ClientType[]).find(c => c.accountNumber === data.accountNumber) 
      : null;
      
    // Preparar datos para enviar al servidor
    const newAlarm = {
      clientId: client?.id || 1, // Usamos el ID del cliente recién creado como fallback
      accountNumber: data.accountNumber,
      clientName: data.clientName,
      address: data.address,
      city: data.city,
      state: data.state,
      type: data.type,
      status: 'active', // Estado inicial de la alarma
      description: data.description || '',
      location: fullAddress,
      locationUrl: mapsUrl,
      operatorId: user?.id, // ID del operador que crea la alarma
      operatorName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username, // Nombre del operador
      priority: (data as any).priority || 'normal', // Prioridad (crítica para ingreso forzado)
    };

    createAlarmMutation.mutate(newAlarm);
  }

  // Definir un tipo para los clientes
  interface ClientType {
    id: number;
    accountNumber: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  }
  
  // Buscar cliente por número de cuenta
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const accountNumber = e.target.value;
    form.setValue('accountNumber', accountNumber);
    
    if (!clients || !Array.isArray(clients)) return;
    
    // Buscar cliente que coincida con el número de cuenta
    const client = (clients as ClientType[]).find(c => c.accountNumber === accountNumber);
    if (client) {
      form.setValue('clientName', client.name);
      form.setValue('address', client.address || '');
      form.setValue('city', client.city || '');
      form.setValue('state', client.state || '');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Alarma</DialogTitle>
          <DialogDescription>
            Complete la información de la alarma. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Cuenta *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        onChange={handleAccountNumberChange}
                        placeholder="Ej. AC12345" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dirección completa" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ciudad" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Departamento" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Alarma *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo de alarma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(AlarmType).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {AlarmTypeLabels[value as keyof typeof AlarmTypeLabels] || value}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Detalles adicionales sobre la alarma" 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <div className="flex justify-between items-center w-full">
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={() => handleForcedEntry()}
                  disabled={createAlarmMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  🚨 Ingreso Forzado
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    disabled={createAlarmMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAlarmMutation.isPending}
                  >
                    {createAlarmMutation.isPending ? 'Guardando...' : 'Guardar Alarma'}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}