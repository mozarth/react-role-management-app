import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, SlidersHorizontal } from "lucide-react";

// Define props type for the component
interface IncidentsMapProps {
  alarms: any[];
  patrols: any[];
}

const IncidentsMap: React.FC<IncidentsMapProps> = ({ alarms, patrols }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Initialize the map
  useEffect(() => {
    // Load Google Maps script dynamically
    const loadGoogleMaps = () => {
      if (!window.google || !window.google.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY || 'key'}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    // Initialize the map instance
    const initializeMap = () => {
      if (mapRef.current && !map) {
        // Default to Santiago, Chile coordinates
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: -33.4489, lng: -70.6693 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        setMap(mapInstance);
      }
    };

    loadGoogleMaps();

    return () => {
      // Clean up markers when component unmounts
      if (markers.length) {
        markers.forEach(marker => marker.setMap(null));
        setMarkers([]);
      }
    };
  }, []);

  // Update markers when alarms or patrols change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Add alarm markers
    alarms.forEach(alarm => {
      if (alarm.client?.coordinates) {
        const [lat, lng] = alarm.client.coordinates.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Determine marker color based on alarm status
          let icon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#DC2626', // Default red for active alarms
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 8
          };

          if (alarm.status === 'in_progress') {
            icon.fillColor = '#F59E0B'; // Amber for in progress
          } else if (alarm.status === 'resolved') {
            icon.fillColor = '#15803D'; // Green for resolved
          }

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            icon,
            title: `Alarm #${alarm.id}: ${alarm.client?.businessName || 'Unknown'}`
          });

          // Add click event to show info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-bold">${alarm.client?.businessName || 'Unknown Client'}</h3>
                <p>${alarm.client?.address || 'No address'}</p>
                <p>Estado: ${alarm.status}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        }
      }
    });

    // Add patrol markers
    patrols.forEach(patrol => {
      if (patrol.lastLocation) {
        const [lat, lng] = patrol.lastLocation.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor: '#0D9488', // Teal color for patrols
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: '#ffffff',
              scale: 6,
              rotation: Math.random() * 360 // Random rotation for demo
            },
            title: `Patrol #${patrol.id}: ${patrol.vehicleCode}`
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-bold">Patrulla ${patrol.vehicleCode}</h3>
                <p>Placa: ${patrol.licensePlate}</p>
                <p>Estado: ${patrol.status}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        }
      }
    });

    setMarkers(newMarkers);

    // Auto-center map if we have markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      map.fitBounds(bounds);
    }
  }, [map, alarms, patrols]);

  const handleRefresh = () => {
    // This will trigger refetching of data in the parent component
    // by invalidating the query cache
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-neutral">Incidentes Activos</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            Filtrar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="h-96 w-full bg-gray-200 rounded-lg overflow-hidden"
        ></div>
        
        {/* Map Legend */}
        <div className="flex flex-wrap items-center justify-start mt-3 gap-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-2"></span>
            <span className="text-xs">Alarma activa</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
            <span className="text-xs">En proceso</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-600 mr-2"></span>
            <span className="text-xs">Resuelto</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-teal-600 mr-2"></span>
            <span className="text-xs">Patrulla</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentsMap;
