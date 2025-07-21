import { useState } from 'react';
import LeafletMap from '@/components/map/LeafletMap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Layers, Maximize, Minimize, Navigation } from 'lucide-react';
import { Link } from 'wouter';

// Ubicaciones simuladas de patrullas
const patrolLocations = [
  {
    position: [25.674, -100.309] as [number, number],
    title: 'Patrulla 001',
    popupContent: 'En ruta a emergencia. ETA: 5 min.',
  },
  {
    position: [25.680, -100.320] as [number, number],
    title: 'Patrulla 002',
    popupContent: 'Disponible para asignación.',
  },
  {
    position: [25.665, -100.295] as [number, number],
    title: 'Patrulla 003',
    popupContent: 'En inspección programada.',
  },
];

// Ubicaciones simuladas de clientes con alarmas
const alarmLocations = [
  {
    position: [25.672, -100.315] as [number, number],
    title: 'Banco Nacional',
    popupContent: 'Alarma de intrusión activa. Prioridad: Alta',
  },
  {
    position: [25.685, -100.305] as [number, number],
    title: 'Centro Comercial Este',
    popupContent: 'Alarma de pánico. Prioridad: Crítica',
  },
];

export default function StandaloneMapView() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [center, setCenter] = useState<[number, number]>([25.674, -100.309]);
  const [markers, setMarkers] = useState([...patrolLocations, ...alarmLocations]);
  
  // Función para mostrar solo patrullas
  const showOnlyPatrols = () => {
    setMarkers(patrolLocations);
  };
  
  // Función para mostrar solo alarmas
  const showOnlyAlarms = () => {
    setMarkers(alarmLocations);
  };
  
  // Función para mostrar todo
  const showAll = () => {
    setMarkers([...patrolLocations, ...alarmLocations]);
  };
  
  // Función para alternar el modo pantalla completa
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  // Función para alternar la capa de tráfico
  const toggleTraffic = () => {
    setShowTraffic(!showTraffic);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between bg-background">
        <Link href="/supervisor-panel">
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2" 
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
        </Link>
        
        <h1 className="text-xl font-semibold">Mapa Operacional</h1>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={showTraffic ? 'bg-blue-50' : ''}
            onClick={toggleTraffic}
          >
            <Layers className="h-4 w-4 mr-2" />
            Tráfico
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFullScreen}
          >
            {isFullScreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="relative flex-1">
        <div className={`${!isFullScreen ? 'absolute inset-x-4 top-4 z-10' : 'hidden'}`}>
          <Card className="p-3 shadow-md">
            <div className="flex justify-between space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 h-auto py-1 text-xs"
                onClick={showAll}
              >
                Todo
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 h-auto py-1 text-xs"
                onClick={showOnlyPatrols}
              >
                Patrullas
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 h-auto py-1 text-xs"
                onClick={showOnlyAlarms}
              >
                Alarmas
              </Button>
            </div>
          </Card>
        </div>
        
        <div className={`${!isFullScreen ? 'absolute bottom-4 right-4 z-10' : 'hidden'}`}>
          <Button 
            className="rounded-full w-12 h-12 bg-primary shadow-lg flex items-center justify-center"
            onClick={() => navigator.geolocation.getCurrentPosition(
              (position) => setCenter([position.coords.latitude, position.coords.longitude]),
              (error) => console.error('Error obteniendo ubicación:', error)
            )}
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div>
        
        <LeafletMap 
          center={center}
          zoom={13}
          markers={markers}
          showTraffic={showTraffic}
          fullScreen={isFullScreen}
          height={isFullScreen ? '100vh' : 'calc(100vh - 140px)'}
        />
      </div>
    </div>
  );
}