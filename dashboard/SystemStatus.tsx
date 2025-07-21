import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWebSocketStatus } from "@/lib/socket";
import { useSocket } from "@/hooks/useSocket";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

const SystemStatus: React.FC = () => {
  const socket = useSocket();
  const [status, setStatus] = useState({
    alarmConnection: true,
    mapService: true,
    mobileApp: socket.isConnected,
    vehicleMonitoring: false
  });

  // Check WebSocket status regularly
  useEffect(() => {
    setStatus(prev => ({
      ...prev,
      mobileApp: socket.isConnected
    }));
    
    const interval = setInterval(() => {
      const wsStatus = getWebSocketStatus();
      setStatus(prev => ({
        ...prev,
        mobileApp: wsStatus === 'connected'
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [socket.isConnected]);

  const getStatusIcon = (isOperational: boolean) => {
    if (isOperational) {
      return <CheckCircle className="text-success h-5 w-5 mr-2" />;
    } else {
      return <AlertCircle className="text-amber-500 h-5 w-5 mr-2" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral">Estado del Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(status.alarmConnection)}
            <span className="text-sm">Conexión a alarmas</span>
          </div>
          <span className={`text-xs ${status.alarmConnection ? 'text-success' : 'text-amber-500'}`}>
            {status.alarmConnection ? 'Operativo' : 'Inestable'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(status.mapService)}
            <span className="text-sm">Servicio de mapas</span>
          </div>
          <span className={`text-xs ${status.mapService ? 'text-success' : 'text-amber-500'}`}>
            {status.mapService ? 'Operativo' : 'Inestable'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(status.mobileApp)}
            <span className="text-sm">App móvil</span>
          </div>
          <span className={`text-xs ${status.mobileApp ? 'text-success' : 'text-amber-500'}`}>
            {status.mobileApp ? 'Operativo' : 'Desconectado'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Info className="text-amber-500 h-5 w-5 mr-2" />
            <span className="text-sm">Monitoreo de vehículos</span>
          </div>
          <span className="text-xs text-amber-500">Mantenimiento</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
