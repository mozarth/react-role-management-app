import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/context/NotificationContext';

export function NotificationTest() {
  const { addNotification } = useNotifications();

  const handleSendAlarmNotification = () => {
    const notification = {
      title: 'Nueva Alarma',
      message: 'Alarma de intrusión en Sector Norte - Cliente: Banco Nacional',
      type: 'alarm' as const,
      entityId: 1,
      entityType: 'alarm',
      duration: 10000
    };
    
    addNotification(notification);
  };

  const handleSendDispatchNotification = () => {
    const notification = {
      title: 'Despacho Asignado',
      message: 'Se ha asignado la patrulla P001 a la alarma #1234',
      type: 'dispatch' as const,
      entityId: 2,
      entityType: 'assignment',
      duration: 8000
    };
    
    addNotification(notification);
  };

  const handleSendInfoNotification = () => {
    const notification = {
      title: 'Información',
      message: 'El supervisor Juan Pérez ha iniciado su turno',
      type: 'info' as const,
      duration: 5000
    };
    
    addNotification(notification);
  };

  const handleSimulateVoiceAlarm = () => {
    // Simular una alarma que activará la notificación por voz
    const notification = {
      title: 'Alarma Urgente',
      message: 'Sensor de movimiento activado en Banco Central, Av. Principal 123',
      type: 'alarm' as const,
      entityId: 999,
      entityType: 'alarm',
      duration: 15000
    };
    
    addNotification(notification);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Prueba de Notificaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="destructive" 
            onClick={handleSendAlarmNotification}
          >
            Probar Notificación de Alarma
          </Button>
          
          <Button 
            variant="default" 
            onClick={handleSendDispatchNotification}
          >
            Probar Notificación de Despacho
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleSendInfoNotification}
          >
            Probar Notificación Informativa
          </Button>

          <Button
            variant="secondary"
            onClick={handleSimulateVoiceAlarm}
          >
            Simular Alarma con Voz
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}