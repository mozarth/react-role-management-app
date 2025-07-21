import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Shield, Truck } from 'lucide-react';

// Datos simulados para demostración
const mockSupervisors = [
  { id: 1, name: 'Carlos Mendoza', status: 'active', location: 'Zona Norte', lastUpdate: '2 min' },
  { id: 2, name: 'Ana Gómez', status: 'busy', location: 'Zona Centro', lastUpdate: '5 min' },
  { id: 3, name: 'Roberto Suárez', status: 'inactive', location: 'Sin conexión', lastUpdate: '35 min' },
];

const mockPatrols = [
  { id: 'P001', vehicle: 'Toyota Hilux', status: 'available', location: 'Zona Norte', lastUpdate: '3 min' },
  { id: 'P002', vehicle: 'Ford Ranger', status: 'assigned', location: 'En camino - Banco Nacional', lastUpdate: '1 min' },
  { id: 'P003', vehicle: 'Nissan Frontier', status: 'maintenance', location: 'Taller central', lastUpdate: '45 min' },
];

export function RealTimeMonitor() {
  const [supervisors, setSupervisors] = useState(mockSupervisors);
  const [patrols, setPatrols] = useState(mockPatrols);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simular actualizaciones periódicas de los datos
  useEffect(() => {
    const interval = setInterval(() => {
      // Actualizar timestamp
      setLastUpdate(new Date());

      // Simular cambios aleatorios en ubicaciones y tiempos
      const updateSupervisors = supervisors.map(s => ({
        ...s,
        lastUpdate: Math.random() > 0.7 ? `${Math.floor(Math.random() * 10) + 1} min` : s.lastUpdate
      }));
      
      const updatePatrols = patrols.map(p => ({
        ...p,
        lastUpdate: Math.random() > 0.7 ? `${Math.floor(Math.random() * 10) + 1} min` : p.lastUpdate
      }));
      
      setSupervisors(updateSupervisors);
      setPatrols(updatePatrols);
    }, 30000); // Actualizar cada 30 segundos
    
    return () => clearInterval(interval);
  }, [supervisors, patrols]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      active: { variant: 'default', label: 'Activo' },
      busy: { variant: 'secondary', label: 'Ocupado' },
      inactive: { variant: 'destructive', label: 'Inactivo' },
      available: { variant: 'default', label: 'Disponible' },
      assigned: { variant: 'secondary', label: 'Asignado' },
      maintenance: { variant: 'outline', label: 'Mantenimiento' },
    };
    
    const statusConfig = statusMap[status] || { variant: 'outline', label: status };
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-lg">
          <span>Monitor en Tiempo Real</span>
          <span className="text-xs text-muted-foreground">
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="supervisors">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="supervisors">
              <Shield className="h-4 w-4 mr-2" />
              Supervisores
            </TabsTrigger>
            <TabsTrigger value="patrols">
              <Truck className="h-4 w-4 mr-2" />
              Patrullas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="supervisors" className="space-y-4 h-[calc(100vh-20rem)] overflow-auto">
            {supervisors.map(supervisor => (
              <div key={supervisor.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{supervisor.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {supervisor.location}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(supervisor.status)}
                  </div>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Última actualización: {supervisor.lastUpdate}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="patrols" className="space-y-4 h-[calc(100vh-20rem)] overflow-auto">
            {patrols.map(patrol => (
              <div key={patrol.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{patrol.id}: {patrol.vehicle}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {patrol.location}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(patrol.status)}
                  </div>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Última actualización: {patrol.lastUpdate}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}