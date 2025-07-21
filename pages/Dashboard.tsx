import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Users, 
  ShieldAlert, 
  Car, 
  Activity,
  RefreshCw
} from 'lucide-react';
import { 
  StatCard, 
  StatusDoughnutChart,
  BarChart,
  AlarmsTable
} from '@/components/dashboard';
import { 
  AlarmStatus, 
  AlarmStatusLabels, 
  AlarmStatusColors, 
  PatrolStatus,
  AlarmTypeLabels
} from '@/lib/constants';
import { Button } from '@/components/ui/button';

// Interfaz para usuario
interface UserInfo {
  id: number | string;
  name: string;
}

// Interfaz para patrullas
interface PatrolInfo {
  id: number;
  patrolId?: string;
  status: string;
  assignedUserName: string | null;
}

// Interfaz para las estadísticas del dashboard
interface DashboardStats {
  kpi: {
    totalAlarms: number;
    availablePatrols: number;
    patrullajeEfficiency: number;
    totalPersonnel: number;
    alarmsByStatus: Record<string, number>;
    shiftsByRole: Record<string, number>;
    patrolsByStatus?: Record<string, number>;
    // Datos con nombres de usuarios
    operatorUsers: UserInfo[];
    dispatcherUsers: UserInfo[];
    supervisorUsers: UserInfo[];
    patrolDetails: PatrolInfo[];
  }
}

// Interfaz para las alarmas
interface Alarm {
  id: number;
  clientId?: number;
  clientName?: string;
  clientAddress?: string;
  clientCoordinates?: string;
  type: string;
  status: string;
  createdAt: string | Date;
  description?: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [refreshTime, setRefreshTime] = useState(new Date());
  
  // Consulta para obtener estadísticas del dashboard
  const { 
    data: dashboardStats, 
    isLoading: statsLoading,
    refetch: refetchStats
  } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 60000, // 1 minuto
  });
  
  // Consulta para obtener alarmas activas y despachadas
  const { 
    data: activeAlarms, 
    isLoading: alarmsLoading,
    refetch: refetchAlarms
  } = useQuery<Alarm[]>({
    queryKey: ['/api/alarms/active-and-dispatched'],
    staleTime: 30000, // 30 segundos
  });
  
  // Intervalo para actualizar automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchAlarms();
      setRefreshTime(new Date());
    }, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [refetchStats, refetchAlarms]);
  
  // Preparar datos para gráficos
  // Valores predeterminados para las estadísticas en caso de que no estén disponibles
  const defaultStats: DashboardStats = {
    kpi: {
      totalAlarms: 0,
      availablePatrols: 0,
      patrullajeEfficiency: 0,
      totalPersonnel: 0,
      alarmsByStatus: {},
      shiftsByRole: {},
      patrolsByStatus: {},
      operatorUsers: [],
      dispatcherUsers: [],
      supervisorUsers: [],
      patrolDetails: []
    }
  };

  // Preparar datos para gráficos usando valores predeterminados si los datos no están disponibles
  const stats = dashboardStats || defaultStats;
  
  // Gráfico de estados de alarmas
  const alarmStatusChartData = stats.kpi.alarmsByStatus ? 
    Object.entries(stats.kpi.alarmsByStatus).map(([status, count]) => ({
      name: AlarmStatusLabels[status as keyof typeof AlarmStatusLabels] || status,
      value: count as number,
      color: AlarmStatusColors[status as keyof typeof AlarmStatusColors]?.replace('bg-', '') || '#6b7280'
    })) : [];
    
  // Calcular estadísticas para eventos de revista programada y revista rutina
  const alarmsByType: Record<string, number> = {};
  
  if (activeAlarms && activeAlarms.length > 0) {
    activeAlarms.forEach(alarm => {
      if (!alarmsByType[alarm.type]) {
        alarmsByType[alarm.type] = 0;
      }
      alarmsByType[alarm.type]++;
    });
  }
  
  // Crear datos para el gráfico de tipos de alarmas
  const alarmTypesChartData = Object.entries(alarmsByType).map(([type, count]) => ({
    name: type === 'revista_programada' ? 'Revista Programada' :
          type === 'revista_rutina' ? 'Revista Rutina' :
          AlarmTypeLabels[type as keyof typeof AlarmTypeLabels] || type,
    value: count,
    color: type === 'panic' ? '#ef4444' : 
           type === 'fire' ? '#f97316' : 
           type === 'intrusion' ? '#eab308' : 
           type === 'revista_programada' ? '#3b82f6' : 
           type === 'revista_rutina' ? '#22c55e' : 
           '#6b7280'
  }));
  
  // Crear datos para gráficos separados de revista programada y revista rutina
  const revistasProgramadasData = activeAlarms ? 
    activeAlarms
      .filter(alarm => alarm.type === 'revista_programada')
      .map((alarm, index) => ({
        name: alarm.clientName || `Cliente #${alarm.clientId || index + 1}`,
        value: 1,
        color: '#3b82f6'
      })) : [];
      
  const revistasRutinaData = activeAlarms ? 
    activeAlarms
      .filter(alarm => alarm.type === 'revista_rutina')
      .map((alarm, index) => ({
        name: alarm.clientName || `Cliente #${alarm.clientId || index + 1}`,
        value: 1,
        color: '#22c55e'
      })) : [];
  
  const shiftsByRoleData = stats.kpi.shiftsByRole ?
    Object.entries(stats.kpi.shiftsByRole).map(([role, count]) => ({
      name: role === 'alarm_operator' ? 'Operadores' : 
            role === 'dispatcher' ? 'Despachadores' : 
            role === 'supervisor' ? 'Supervisores' : role,
      value: count as number,
      color: role === 'alarm_operator' ? '#60a5fa' : 
             role === 'dispatcher' ? '#34d399' : 
             role === 'supervisor' ? '#f59e0b' : '#6b7280'
    })) : [];
  
  // Función para manejar la actualización manual
  const handleRefresh = () => {
    refetchStats();
    refetchAlarms();
    setRefreshTime(new Date());
  };
  
  // Función para ver los detalles de una alarma
  const handleViewAlarm = (alarmId: number) => {
    setLocation(`/alarms/${alarmId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard de Operaciones</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Actualizado: {refreshTime.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas principales (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Alarmas Activas"
          value={stats.kpi.totalAlarms}
          description="Alarmas que requieren atención"
          loading={statsLoading}
          icon={<AlertCircle className="h-5 w-5" />}
          className="bg-card"
        />
        
        <StatCard
          title="Patrullas Disponibles"
          value={stats.kpi.availablePatrols}
          description="Unidades listas para asignar"
          loading={statsLoading}
          icon={<Car className="h-5 w-5" />}
          className="bg-card"
          nameList={stats.kpi.patrolDetails
            .filter(p => p.status === 'available')
            .map(p => ({ 
              id: p.id, 
              name: p.patrolId || `Patrulla #${p.id}` 
            }))}
        />
        
        <StatCard
          title="Eficiencia de Patrullaje"
          value={`${stats.kpi.patrullajeEfficiency}%`}
          description="Patrullas asignadas vs. disponibles"
          loading={statsLoading}
          icon={<TrendingUp className="h-5 w-5" />}
          className="bg-card"
        />
        
        <StatCard
          title="Despachadores"
          value={stats.kpi.shiftsByRole?.dispatcher || 0}
          description="Despachadores activos"
          loading={statsLoading}
          icon={<Clock className="h-5 w-5" />}
          className="bg-card"
          trend={stats.kpi.shiftsByRole?.dispatcher > 0 ? {
            value: 100,
            direction: 'up'
          } : undefined}
          nameList={stats.kpi.dispatcherUsers}
        />
        
        <StatCard
          title="Operadores en Turno"
          value={stats.kpi.shiftsByRole?.alarm_operator || 0}
          description="Operadores activos"
          loading={statsLoading}
          icon={<Users className="h-5 w-5" />}
          className="bg-card"
          nameList={stats.kpi.operatorUsers}
        />
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusDoughnutChart
          title="Alarmas por Estado"
          description="Distribución de alarmas según su estado actual"
          data={alarmStatusChartData}
          loading={statsLoading}
        />
        
        <StatusDoughnutChart
          title="Personal por Rol"
          description="Distribución del personal por tipo de rol"
          data={shiftsByRoleData}
          loading={statsLoading}
        />
      </div>
      
      {/* Gráficos para tipos de alarmas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusDoughnutChart
          title="Distribución por Tipo de Alarma"
          description="Tipos de alarmas activas"
          data={alarmTypesChartData}
          loading={alarmsLoading}
        />
        
        <StatusDoughnutChart
          title="Revistas Programadas"
          description="Distribución de revistas programadas por cliente"
          data={revistasProgramadasData}
          loading={alarmsLoading}
        />
        
        <StatusDoughnutChart
          title="Revistas Rutina"
          description="Distribución de revistas rutina por cliente"
          data={revistasRutinaData}
          loading={alarmsLoading}
        />
      </div>

      {/* Tabla de alarmas activas */}
      <AlarmsTable
        title="Alarmas Activas y Despachadas"
        description="Listado de alarmas que requieren atención"
        alarms={activeAlarms ?? []}
        loading={alarmsLoading}
        onViewAlarm={handleViewAlarm}
      />

      {/* Mapa de ubicaciones */}
      <div className="bg-card rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">Mapa de Operaciones</h2>
        </div>
        <div className="p-6">
          <div className="bg-muted h-80 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Mapa no disponible - Implementación pendiente</p>
          </div>
        </div>
      </div>
    </div>
  );
}