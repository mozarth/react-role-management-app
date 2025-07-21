import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { MessageType } from '@shared/websocket';
import { useSocket } from '@/hooks/useSocket';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function VoiceNotificationTest() {
  const [customMessage, setCustomMessage] = useState('');
  const [alarmMessage, setAlarmMessage] = useState('Se ha detectado una alarma de intrusión en Banco Central');
  const [clientName, setClientName] = useState('Banco Central');
  const [alarmType, setAlarmType] = useState('intrusion');
  const [priority, setPriority] = useState('high');
  const [testMode, setTestMode] = useState('direct');
  
  const { speak, stop, speaking } = useSpeech();
  const { toast } = useToast();
  const { sendMessage } = useSocket();
  
  // Función para probar la síntesis de voz directamente
  const handleTestDirectVoice = () => {
    if (customMessage.trim()) {
      speak(customMessage);
      toast({
        title: 'Notificación de voz',
        description: 'Reproduciendo mensaje directo'
      });
    } else {
      toast({
        title: 'Error',
        description: 'Por favor, ingrese un mensaje para reproducir',
        variant: 'destructive'
      });
    }
  };
  
  // Función para detener la síntesis de voz
  const handleStopVoice = () => {
    stop();
    toast({
      title: 'Síntesis de voz detenida',
      description: 'Se ha detenido la reproducción de voz'
    });
  };
  
  // Función para simular una alarma que activará la notificación por voz
  const handleSimulateAlarm = () => {
    // Enviar mensaje de alarma a través de WebSocket
    sendMessage({
      type: MessageType.NEW_ALARM,
      payload: {
        id: 999,
        clientName: clientName,
        clientId: 123,
        type: alarmType,
        address: "Av. Principal 123",
        description: "Sensor de movimiento activado",
        status: "active",
        priority: priority
      },
      timestamp: Date.now()
    });
    
    toast({
      title: 'Alarma simulada',
      description: 'Se ha enviado una alarma simulada que debería activar una notificación de voz'
    });
  };
  
  // Función para probar la notificación directamente a través del WebSocket
  const handleSendNotification = () => {
    if (customMessage.trim()) {
      sendMessage({
        type: MessageType.NOTIFICATION,
        payload: {
          title: 'Notificación de prueba',
          message: customMessage,
          targetRole: 'all',
          notificationType: 'info'
        },
        timestamp: Date.now()
      });
      
      toast({
        title: 'Notificación enviada',
        description: 'Se ha enviado una notificación a través de WebSocket'
      });
    } else {
      toast({
        title: 'Error',
        description: 'Por favor, ingrese un mensaje para la notificación',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prueba de Notificaciones de Voz</h1>
        <div className="flex items-center space-x-2">
          <Label htmlFor="test-mode">Modo de prueba:</Label>
          <Select value={testMode} onValueChange={setTestMode}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Voz directa</SelectItem>
              <SelectItem value="alarm">Simulación de alarma</SelectItem>
              <SelectItem value="notification">Notificación WebSocket</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {testMode === 'direct' && (
        <Card>
          <CardHeader>
            <CardTitle>Prueba de Voz Directa</CardTitle>
            <CardDescription>
              Ingrese un mensaje y el sistema lo leerá en voz alta utilizando la síntesis de voz del navegador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-message">Mensaje a reproducir</Label>
              <Textarea
                id="custom-message"
                placeholder="Ingrese el mensaje que desea reproducir..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleTestDirectVoice}
                disabled={speaking}
                className="flex-1"
              >
                Reproducir mensaje
              </Button>
              <Button 
                onClick={handleStopVoice}
                variant="outline"
                disabled={!speaking}
              >
                Detener
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {testMode === 'alarm' && (
        <Card>
          <CardHeader>
            <CardTitle>Simulación de Alarma</CardTitle>
            <CardDescription>
              Simula una alarma para activar la notificación de voz a través del sistema de notificaciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nombre del cliente</Label>
                <Input
                  id="client-name"
                  placeholder="Nombre del cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alarm-type">Tipo de alarma</Label>
                <Select value={alarmType} onValueChange={setAlarmType}>
                  <SelectTrigger id="alarm-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intrusion">Intrusión</SelectItem>
                    <SelectItem value="fire">Incendio</SelectItem>
                    <SelectItem value="medical">Médica</SelectItem>
                    <SelectItem value="panic">Pánico</SelectItem>
                    <SelectItem value="technical">Técnica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleSimulateAlarm}
              className="w-full"
            >
              Simular Alarma
            </Button>
          </CardContent>
        </Card>
      )}
      
      {testMode === 'notification' && (
        <Card>
          <CardHeader>
            <CardTitle>Notificación por WebSocket</CardTitle>
            <CardDescription>
              Envía una notificación a través del WebSocket que podría activar una alerta de voz si está configurado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-message">Mensaje de notificación</Label>
              <Textarea
                id="notification-message"
                placeholder="Ingrese el mensaje de notificación..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={handleSendNotification}
              className="w-full"
            >
              Enviar Notificación
            </Button>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Esta página permite probar diferentes aspectos del sistema de notificaciones por voz:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Voz directa:</strong> Prueba la API de síntesis de voz del navegador directamente.</li>
            <li><strong>Simulación de alarma:</strong> Envía un mensaje de alarma simulada a través de WebSocket que activará la notificación de voz configurada en el sistema.</li>
            <li><strong>Notificación WebSocket:</strong> Envía una notificación general a través de WebSocket.</li>
          </ul>
          <p className="text-sm text-gray-500 italic">Nota: La síntesis de voz depende del navegador y puede variar en calidad y soporte entre diferentes navegadores.</p>
        </CardContent>
      </Card>
    </div>
  );
}