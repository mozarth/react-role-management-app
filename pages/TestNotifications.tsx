import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { NotificationTest } from '@/components/dispatch/NotificationTest';

export default function TestNotifications() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prueba de Notificaciones</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sistema de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Esta página te permite probar el sistema de notificaciones con alertas sonoras y visuales.
            Utiliza los botones a continuación para enviar diferentes tipos de notificaciones y verificar
            que funcionan correctamente.
          </p>
          
          <NotificationTest />
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Características implementadas:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Alertas visuales emergentes en la esquina superior derecha</li>
              <li>Alertas sonoras que reproduce un sonido cuando llega una nueva notificación</li>
              <li>Notificaciones por voz que anuncian el tipo de evento</li>
              <li>Sistema que detecta automáticamente cuando llegan nuevos eventos</li>
              <li>Diferentes estilos y colores según el tipo de notificación</li>
              <li>Botones de acción para navegar directamente a la página relacionada</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}