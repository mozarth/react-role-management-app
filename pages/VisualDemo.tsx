import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, MapPin, Clock, Camera, FileText, QrCode, 
  LogOut, AlertTriangle, RefreshCcw
} from 'lucide-react';
import { TimeDisplay } from '@/components/supervisor/TimeDisplay';
import { MapRoute } from '@/components/supervisor/MapRoute';

// Datos de ejemplo para la ruta
const mockRoutePoints = [
  { lat: 19.4326, lng: -99.1332, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { lat: 19.4327, lng: -99.1320, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { lat: 19.4315, lng: -99.1315, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { lat: 19.4310, lng: -99.1305, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { lat: 19.4300, lng: -99.1300, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
];

// Tiempos de ejemplo para demostración
const demoTimes = {
  reciente: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  medio: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  tardio: new Date(Date.now() - 40 * 60 * 1000).toISOString()
};

export default function VisualDemo() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("timeboxes");
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Función para actualizar los tiempos y forzar una nueva renderización
  const refreshTimes = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/navbar */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Demostración Visual</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={refreshTimes}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setLocation('/mobile/dashboard')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <Tabs defaultValue="timeboxes" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="timeboxes">
              Recuadros de Tiempo
            </TabsTrigger>
            <TabsTrigger value="maps">
              Visualización de Rutas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeboxes">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Indicadores de Tiempo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Los tiempos se muestran con diferentes colores según la duración:
                </p>
                
                <div className="space-y-6">
                  {/* Tiempo reciente (verde) */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-2">Tiempo Reciente (&lt;20 min)</h3>
                    <TimeDisplay 
                      key={`reciente-${refreshKey}`}
                      timestamp={demoTimes.reciente} 
                      label="Versión Completa" 
                    />
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Versión Compacta:</p>
                      <TimeDisplay 
                        key={`reciente-compact-${refreshKey}`}
                        timestamp={demoTimes.reciente} 
                        compact={true}
                      />
                    </div>
                  </div>
                  
                  {/* Tiempo medio (amarillo) */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-2">Tiempo Medio (20-30 min)</h3>
                    <TimeDisplay 
                      key={`medio-${refreshKey}`}
                      timestamp={demoTimes.medio} 
                      label="Versión Completa" 
                    />
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Versión Compacta:</p>
                      <TimeDisplay 
                        key={`medio-compact-${refreshKey}`}
                        timestamp={demoTimes.medio} 
                        compact={true}
                      />
                    </div>
                  </div>
                  
                  {/* Tiempo tardío (rojo) */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-2">Tiempo Tardío (&gt;30 min)</h3>
                    <TimeDisplay 
                      key={`tardio-${refreshKey}`}
                      timestamp={demoTimes.tardio} 
                      label="Versión Completa" 
                    />
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Versión Compacta:</p>
                      <TimeDisplay 
                        key={`tardio-compact-${refreshKey}`}
                        timestamp={demoTimes.tardio} 
                        compact={true}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={refreshTimes}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" /> Actualizar Tiempos
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    El botón actualiza la referencia de tiempo para mostrar el comportamiento en tiempo real
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tarjeta de Asignación con Tiempo</CardTitle>
              </CardHeader>
              <CardContent>
                <Card className="border-l-4 border-l-destructive">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Banco Nacional
                      </CardTitle>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Crítica</Badge>
                        <Badge className="bg-amber-500">Pendiente</Badge>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      Av. Principal 123, Zona Norte
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                        <p className="font-medium">Intrusión</p>
                      </div>
                      <TimeDisplay 
                        key={`card-time-${refreshKey}`}
                        timestamp={demoTimes.tardio} 
                        label="Tiempo Transcurrido" 
                      />
                    </div>
                    <div className="flex justify-between gap-2 mt-4">
                      <Button variant="outline" className="flex-1 gap-1">
                        <MapPin className="h-4 w-4" /> Mapa
                      </Button>
                      <Button className="flex-1 gap-1">
                        Atender
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maps">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Visualización de Ruta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  El mapa muestra la ruta recorrida por el supervisor con marcadores de inicio (verde) y fin (rojo).
                </p>
                
                <MapRoute 
                  points={mockRoutePoints}
                  startAddress="Base Central"
                  endAddress="Av. Principal 123, Zona Norte"
                  clientName="Banco Nacional"
                />
                
                <div className="mt-6">
                  <p className="text-xs text-muted-foreground text-center">
                    Nota: Para una visualización completa se requiere una clave API de Google Maps.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ejemplo de Reporte Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  El reporte final incluye:
                </p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>Tiempo total de respuesta</li>
                  <li>Ruta completa del supervisor</li>
                  <li>Evidencia recolectada (fotos, videos, audio)</li>
                  <li>Verificación por QR</li>
                  <li>Notas y observaciones</li>
                </ul>
                
                <Button 
                  onClick={() => setLocation('/mobile/dashboard')}
                  className="w-full"
                >
                  Ver Demo Completa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}