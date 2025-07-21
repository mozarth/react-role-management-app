import React from "react";
import StatsCard from "./StatsCard";
import IncidentsMap from "./IncidentsMap";
import IncidentsTable from "./IncidentsTable";
import AvailablePatrols from "./AvailablePatrols";
import ShiftsOverview from "./ShiftsOverview";
import SystemStatus from "./SystemStatus";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Timer, CheckCircle, Truck } from "lucide-react";

const DashboardView: React.FC = () => {
  // Fetch active alarms
  const { data: activeAlarms = [] } = useQuery({
    queryKey: ["/api/alarms"],
  });

  // Fetch patrols
  const { data: patrols = [] } = useQuery({
    queryKey: ["/api/patrols"],
  });

  // Fetch current shifts
  const { data: currentShifts = [] } = useQuery({
    queryKey: ["/api/shifts/current"],
  });

  // Calculate statistics
  const stats = {
    activeAlarms: activeAlarms.filter(a => ['active', 'dispatched', 'in_progress'].includes(a.status)).length,
    activePatrols: patrols.filter(p => p.status !== 'off_duty').length,
    availablePatrols: patrols.filter(p => p.status === 'available').length,
    avgResponseTime: "8.5 min", // Would be calculated from actual data
    resolvedIncidents: activeAlarms.filter(a => a.status === 'resolved').length,
  };

  return (
    <div>
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Alarmas Activas"
          value={stats.activeAlarms.toString()}
          icon={<AlertCircle className="text-danger" />}
          trend={{
            value: "+2",
            label: "en la última hora",
            direction: "up",
            color: "text-danger"
          }}
        />
        
        <StatsCard
          title="Patrullas en Servicio"
          value={stats.activePatrols.toString()}
          icon={<Truck className="text-secondary-500" />}
          detail={{
            value: stats.availablePatrols.toString(),
            label: "disponibles"
          }}
        />
        
        <StatsCard
          title="Tiempo Respuesta Promedio"
          value="8.5 min"
          icon={<Timer className="text-amber-500" />}
          trend={{
            value: "-1.2 min",
            label: "de ayer",
            direction: "down",
            color: "text-success"
          }}
        />
        
        <StatsCard
          title="Incidentes Resueltos (Hoy)"
          value={stats.resolvedIncidents.toString()}
          icon={<CheckCircle className="text-success" />}
          trend={{
            value: "92%",
            label: "tasa de resolución",
            direction: "up",
            color: "text-success"
          }}
        />
      </div>
      
      {/* Main Dashboard Content: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Incidents Map */}
          <IncidentsMap alarms={activeAlarms} patrols={patrols} />
          
          {/* Active Incidents Table */}
          <IncidentsTable incidents={activeAlarms} />
        </div>
        
        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Available Patrols */}
          <AvailablePatrols patrols={patrols} />
          
          {/* Today's Shifts */}
          <ShiftsOverview shifts={currentShifts} />
          
          {/* System Status */}
          <SystemStatus />
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
