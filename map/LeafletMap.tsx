import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Solucionar el problema de íconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title: string;
    popupContent?: string;
  }>;
  showTraffic?: boolean;
  fullScreen?: boolean;
  height?: string;
  withControls?: boolean;
}

// Componente para actualizar la vista del mapa cuando cambian las props
function MapUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

// Componente de capa de tráfico para OpenStreetMap
function TrafficLayer() {
  const map = useMap();
  
  useEffect(() => {
    // Añadir capa de tráfico de Thunderforest (no requiere API key para uso básico)
    const trafficTileLayer = L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38', {
      attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 22,
      opacity: 0.7
    });
    
    trafficTileLayer.addTo(map);
    
    return () => {
      map.removeLayer(trafficTileLayer);
    };
  }, [map]);
  
  return null;
}

export default function LeafletMap({
  center = [25.674, -100.309], // Monterrey, Mexico como ubicación predeterminada
  zoom = 13,
  markers = [],
  showTraffic = true,
  fullScreen = false,
  height = '500px',
  withControls = true
}: MapProps) {
  const mapRef = useRef(null);
  const [mapStyle, setMapStyle] = useState({
    height: height,
    width: '100%',
    borderRadius: '8px',
    zIndex: 1
  });

  useEffect(() => {
    if (fullScreen) {
      setMapStyle({
        ...mapStyle,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        borderRadius: '0',
        zIndex: 999
      } as any);
    } else {
      setMapStyle({
        ...mapStyle,
        height: height,
        position: 'relative',
        borderRadius: '8px',
      } as any);
    }
  }, [fullScreen, height]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={mapStyle}
      zoomControl={withControls}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {showTraffic && <TrafficLayer />}
      
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position}>
          <Popup>
            <div>
              <h3 className="font-medium text-base">{marker.title}</h3>
              {marker.popupContent && <p className="text-sm">{marker.popupContent}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
      
      <MapUpdater center={center} zoom={zoom} />
    </MapContainer>
  );
}