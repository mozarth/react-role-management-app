import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';

// Definición de tipos para puntos GPS
interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
}

// Props del componente
interface MapRouteProps {
  points: RoutePoint[];
  startAddress?: string;
  endAddress?: string;
  clientName?: string;
  className?: string;
}

export const MapRoute: React.FC<MapRouteProps> = ({ 
  points, 
  startAddress, 
  endAddress,
  clientName,
  className
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [path, setPath] = useState<google.maps.Polyline | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Cargar la API de Google Maps
  useEffect(() => {
    // Verificar si la API de Google Maps ya está cargada
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Cargar la API de Google Maps dinámicamente
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error('Error al cargar Google Maps API');
      setIsLoading(false);
      setIsError(true);
    };
    document.head.appendChild(script);

    return () => {
      // Limpiar marcadores y path al desmontar
      if (markers.length > 0) {
        markers.forEach(marker => marker.setMap(null));
      }
      if (path) {
        path.setMap(null);
      }
    };
  }, []);

  // Cuando cambian los puntos, actualizar la ruta
  useEffect(() => {
    if (map && points.length > 0) {
      drawRoute();
    }
  }, [map, points]);

  // Inicializar el mapa
  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      // Crear mapa centrado en el primer punto o en una ubicación por defecto
      const defaultCenter = { lat: 0, lng: 0 };
      const center = points.length > 0 ? points[0] : defaultCenter;
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: points.length > 0 ? 14 : 2,
        center: center,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
      
      setMap(mapInstance);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
      setIsLoading(false);
      setIsError(true);
    }
  };

  // Dibujar la ruta en el mapa
  const drawRoute = () => {
    if (!map) return;
    
    // Limpiar marcadores y path existentes
    if (markers.length > 0) {
      markers.forEach(marker => marker.setMap(null));
    }
    if (path) {
      path.setMap(null);
    }
    
    // Crear nuevo path
    const routePath = new window.google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 1.0,
      strokeWeight: 4
    });
    
    routePath.setMap(map);
    setPath(routePath);
    
    // Crear marcadores para inicio y fin
    const newMarkers: google.maps.Marker[] = [];
    
    if (points.length > 0) {
      // Marcador de inicio (verde)
      const startMarker = new window.google.maps.Marker({
        position: points[0],
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#34A853',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        },
        title: 'Inicio'
      });
      newMarkers.push(startMarker);
      
      // Agregar ventana de información para inicio
      if (startAddress) {
        const startInfo = new window.google.maps.InfoWindow({
          content: `<div style="font-weight:500">Inicio</div><div>${startAddress}</div><div style="font-size:0.8em;color:#666">${new Date(points[0].timestamp).toLocaleString()}</div>`
        });
        
        startMarker.addListener('click', () => {
          startInfo.open(map, startMarker);
        });
      }
      
      // Marcador de fin (rojo)
      const endPoint = points[points.length - 1];
      const endMarker = new window.google.maps.Marker({
        position: endPoint,
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        },
        title: 'Fin'
      });
      newMarkers.push(endMarker);
      
      // Agregar ventana de información para fin
      const endInfo = new window.google.maps.InfoWindow({
        content: `<div style="font-weight:500">${clientName || 'Destino'}</div><div>${endAddress || ''}</div><div style="font-size:0.8em;color:#666">${new Date(endPoint.timestamp).toLocaleString()}</div>`
      });
      
      endMarker.addListener('click', () => {
        endInfo.open(map, endMarker);
      });
      
      // Ajustar el mapa para mostrar todos los puntos
      const bounds = new window.google.maps.LatLngBounds();
      points.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);
      
      // Si solo hay un punto, hacer zoom
      if (points.length === 1) {
        map.setZoom(16);
      }
    }
    
    setMarkers(newMarkers);
  };

  // Si los puntos están vacíos, mostrar mensaje
  if (points.length === 0 && !isLoading && !isError) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ruta del Supervisor</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-6">
          <MapPin className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-center">No hay datos de ruta disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Si hay error al cargar Google Maps
  if (isError) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ruta del Supervisor</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-6">
          <div className="text-destructive mb-2">Error al cargar el mapa</div>
          <p className="text-muted-foreground text-center">No se pudo cargar la API de Google Maps</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ruta del Supervisor</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Cargando mapa...</p>
          </div>
        ) : (
          <div 
            ref={mapRef} 
            className="w-full h-[300px] md:h-[400px]"
            aria-label="Mapa mostrando la ruta del supervisor"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MapRoute;