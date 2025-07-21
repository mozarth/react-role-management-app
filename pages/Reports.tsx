import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Filter, Search, TrendingUp, Users, AlertTriangle, Shield, Clock, BarChart3, Activity } from "lucide-react";
import * as XLSX from 'xlsx';
import { useExcelExport } from "@/hooks/useExcelExport";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

// Colores para los gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];
const RADIAN = Math.PI / 180;

// Componente para mostrar etiquetas en el gráfico de sectores
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${name}: ${value}`}
    </text>
  );
};

// Componente del Dashboard Ejecutivo
function ExecutiveDashboard() {
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  // Consultas para el dashboard
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/dashboard/overview'],
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/dashboard/performance', dateRange],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange.to) params.append('endDate', dateRange.to.toISOString());
      return fetch(`/api/dashboard/performance?${params}`).then(res => res.json());
    }
  });

  if (overviewLoading || performanceLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overview = overviewData?.overview || {};
  const alarmsByType = overviewData?.alarmsByType || [];
  const alarmsByOperator = overviewData?.alarmsByOperator || [];
  const usersByRole = overviewData?.usersByRole || [];
  const callsByOperator = overviewData?.callsByOperator || [];
  const reportsByType = overviewData?.reportsByType || [];
  const alarmsByDate = performanceData?.alarmsByDate || [];
  const performanceBySupervisor = performanceData?.performanceBySupervisor || [];

  // Transformar datos para los gráficos
  const alarmTypeData = alarmsByType.map((item: any) => ({
    name: item.type === 'panic' ? 'Pánico' : 
          item.type === 'intrusion' ? 'Intrusión' : 
          item.type === 'fire' ? 'Incendio' :
          item.type === 'medical' ? 'Médica' : item.type,
    value: item.count,
    color: item.type === 'panic' ? '#FF6B6B' : 
           item.type === 'intrusion' ? '#4ECDC4' : 
           item.type === 'fire' ? '#FFE66D' : 
           item.type === 'medical' ? '#A8E6CF' : '#95A5A6'
  }));

  const roleData = usersByRole.map((item: any) => ({
    name: item.role === 'administrator' ? 'Administradores' :
          item.role === 'director' ? 'Directores' :
          item.role === 'operator' ? 'Operadores' :
          item.role === 'dispatcher' ? 'Despachadores' :
          item.role === 'supervisor' ? 'Supervisores' : item.role,
    value: item.count
  }));

  const reportsData = reportsByType.map((item: any) => ({
    name: item.type === 'revista' ? 'Revistas/Inspecciones' : 'Reportes de Incidentes',
    value: item.count,
    color: item.type === 'revista' ? '#10B981' : '#F59E0B'
  }));

  return (
    <div className="space-y-6">
      {/* Controles de fecha */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h2>
        <div className="flex items-center space-x-4">
          <Label>Rango de fechas:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y", { locale: es })
                  )
                ) : (
                  <span>Seleccionar rango</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alarmas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalAlarms || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeAlarms || 0} activas, {overview.resolvedAlarms || 0} resueltas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Total</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaciones</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Supervisores activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atenciones SmartUrban</CardTitle>
            <Activity className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalCallAssistances || 0}</div>
            <p className="text-xs text-muted-foreground">
              Llamadas atendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reportes</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              Revistas e incidentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.avgResponseTime || 0}min</div>
            <p className="text-xs text-muted-foreground">
              Tiempo de respuesta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alarmas por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Alarmas por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alarmTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alarmTypeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Personal por rol */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Personal por Rol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de alarmas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Tendencia de Alarmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={alarmsByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revistas e Incidentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Revistas e Incidentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportsData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alarmas por operador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Alarmas por Operador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={alarmsByOperator}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operator" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Atenciones SmartUrban por operador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Atenciones SmartUrban por Operador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={callsByOperator}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operator" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de rendimiento de supervisores */}
      {performanceBySupervisor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Rendimiento de Supervisores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Supervisor</th>
                    <th className="text-center p-2">Total Asignaciones</th>
                    <th className="text-center p-2">Completadas</th>
                    <th className="text-center p-2">Tasa de Éxito</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceBySupervisor.map((supervisor: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{supervisor.supervisor}</td>
                      <td className="text-center p-2">{supervisor.total}</td>
                      <td className="text-center p-2">{supervisor.completed}</td>
                      <td className="text-center p-2">
                        <Badge 
                          variant={supervisor.rate >= 80 ? "default" : supervisor.rate >= 60 ? "secondary" : "destructive"}
                        >
                          {supervisor.rate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast(); 
  const { exportSupervisorsReport } = useExcelExport();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("all");
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Consulta para obtener lista de supervisores
  const { data: supervisorsList = [], isLoading: isLoadingSupervisorsList } = useQuery({
    queryKey: ["/api/users/by-role/supervisor"],
    enabled: user && (user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR || user.role === UserRole.DISPATCHER)
  });

  // Consulta para obtener datos de despachadores
  const { data: dispatchersData, isLoading: isLoadingDispatchers } = useQuery({
    queryKey: ["/api/reports/dispatchers"],
    enabled: user && (user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR)
  });

  // Consulta para obtener datos de supervisores
  const { data: supervisorsData, isLoading: isLoadingSupervisors } = useQuery({
    queryKey: [
      "/api/reports/supervisors", 
      selectedSupervisorId !== "all" ? selectedSupervisorId : null,
      dateRange.startDate.toISOString(),
      dateRange.endDate.toISOString()
    ],
    enabled: user && (user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR || user.role === UserRole.DISPATCHER)
  });

  // Función para exportar datos a Excel
  const exportToExcel = (data: any, sheetName: string, fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generar el archivo y descargarlo
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Función para aplicar filtros
  const applyFilters = () => {
    setIsFiltering(true);
    toast({
      title: "Filtros aplicados",
      description: "Generando reporte con los filtros seleccionados."
    });
  };

  // Función para resetear filtros
  const resetFilters = () => {
    setSelectedSupervisorId("all");
    setDateRange({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date()
    });
    setIsFiltering(false);
    toast({
      title: "Filtros reseteados",
      description: "Se han restaurado los filtros a sus valores predeterminados."
    });
  };

  // Función para exportar los datos de supervisores con filtros aplicados
  const exportSupervisorsToExcel = () => {
    if (supervisorsData) {
      // Utilizar el hook para generar el informe con todos los detalles
      // Incluir información de filtros en la exportación
      exportSupervisorsReport(supervisorsData, {
        supervisorId: selectedSupervisorId !== "all" ? selectedSupervisorId : null,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
    }
  };

  // Función para exportar los datos de despachadores
  const exportDispatchersToExcel = () => {
    if (dispatchersData) {
      const data = [
        {
          'Total Despachadores': dispatchersData.dispatcherCount,
          'Total Despachos': dispatchersData.totalDispatches,
          'Tiempo Promedio de Despacho (min)': dispatchersData.avgDispatchTime
        }
      ];
      
      // Crear una hoja con el rendimiento individual
      const performanceData = dispatchersData.performance.map((item: any) => ({
        'Nombre': item.name,
        'Alarmas Despachadas': item.alarmasDespachadas,
        'Tiempo Promedio (min)': item.tiempoPromedio
      }));

      // Crear una hoja con los tiempos de despacho por día
      const dispatchTimeData = dispatchersData.dispatchTime.map((item: any) => ({
        'Día': item.name,
        'Tiempo (min)': item.tiempo
      }));

      // Crear una hoja con los tipos de alarma
      const alarmTypeData = dispatchersData.dispatchByType.map((item: any) => ({
        'Tipo': item.name,
        'Cantidad': item.value
      }));

      // Combinar todos los datos en un único workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Resumen');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(performanceData), 'Rendimiento');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dispatchTimeData), 'Tiempos por Día');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alarmTypeData), 'Tipos de Alarma');
      
      // Generar el archivo y descargarlo
      XLSX.writeFile(wb, `Reporte_Despachadores_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  if (isLoadingDispatchers || isLoadingSupervisors) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Panel de Informes</h1>
      
      <Tabs defaultValue="supervisores">
        <TabsList className="mb-6">
          {user && (user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR) && (
            <TabsTrigger value="dashboard">Dashboard Ejecutivo</TabsTrigger>
          )}
          <TabsTrigger value="supervisores">Supervisores</TabsTrigger>
          {user && (user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR) && (
            <TabsTrigger value="despachadores">Despachadores</TabsTrigger>
          )}
        </TabsList>
        
        {/* Dashboard Ejecutivo */}
        {user && (user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR) && (
          <TabsContent value="dashboard">
            <ExecutiveDashboard />
          </TabsContent>
        )}
        
        {/* Contenido para supervisores */}
        <TabsContent value="supervisores">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Filter size={18} className="text-primary-600" />
              Filtros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="supervisor-select" className="mb-2 block">Supervisor</Label>
                <Select
                  value={selectedSupervisorId}
                  onValueChange={(value) => setSelectedSupervisorId(value)}
                >
                  <SelectTrigger id="supervisor-select" className="w-full">
                    <SelectValue placeholder="Seleccionar supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los supervisores</SelectItem>
                    {supervisorsList && Array.isArray(supervisorsList) && supervisorsList.map((supervisor: any) => (
                      <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                        {`${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="from-date" className="mb-2 block">Desde</Label>
                <Popover open={fromDateOpen} onOpenChange={setFromDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="from-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.startDate ? format(dateRange.startDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.startDate}
                      onSelect={(date) => {
                        if (date) {
                          setDateRange(prev => ({ ...prev, startDate: date }));
                          setFromDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="to-date" className="mb-2 block">Hasta</Label>
                <Popover open={toDateOpen} onOpenChange={setToDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="to-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.endDate ? format(dateRange.endDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.endDate}
                      onSelect={(date) => {
                        if (date) {
                          setDateRange(prev => ({ ...prev, endDate: date }));
                          setToDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Resetear filtros
              </Button>
              <Button onClick={applyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {isFiltering && (
                <div className="flex items-center gap-2">
                  <span>Filtrando por: </span>
                  {selectedSupervisorId !== "all" && (
                    <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs">
                      Supervisor: {
                        supervisorsList && Array.isArray(supervisorsList) && 
                        (() => {
                          const sup = supervisorsList.find((s: any) => s.id.toString() === selectedSupervisorId);
                          return sup ? `${sup.firstName || ''} ${sup.lastName || ''}`.trim() || sup.username : '';
                        })()
                      }
                    </span>
                  )}
                  <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs">
                    Periodo: {format(dateRange.startDate, "dd/MM/yyyy", { locale: es })} - {format(dateRange.endDate, "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={exportSupervisorsToExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Exportar a Excel
            </Button>
          </div>
          {supervisorsData && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Tarjeta de resumen */}
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Resumen de Supervisores</CardTitle>
                  <CardDescription>Estadísticas generales del rendimiento de los supervisores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                      <p className="text-sm text-gray-500">Total Supervisores</p>
                      <p className="text-3xl font-bold text-primary-600">{supervisorsData.supervisorCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                      <p className="text-sm text-gray-500">Total Asignaciones</p>
                      <p className="text-3xl font-bold text-primary-600">{supervisorsData.totalAssignments}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                      <p className="text-sm text-gray-500">Tiempo Promedio de Respuesta</p>
                      <p className="text-3xl font-bold text-primary-600">{supervisorsData.avgResponseTime} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tiempos de respuesta por día */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Tiempos de Respuesta por Día</CardTitle>
                  <CardDescription>Tiempo promedio que toman los supervisores en responder a alarmas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={supervisorsData.responseTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="tiempo"
                        name="Tiempo de Respuesta (min)"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Estado de alarmas */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Alarmas</CardTitle>
                  <CardDescription>Distribución de alarmas por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={supervisorsData.alarmsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {supervisorsData.alarmsByStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Rendimiento de supervisores */}
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Rendimiento de Supervisores</CardTitle>
                  <CardDescription>Comparativa de rendimiento individual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={supervisorsData.performance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="alarmasRespondidas" name="Alarmas Respondidas" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="tiempoPromedio" name="Tiempo Promedio (min)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Contenido para operadores */}
        <TabsContent value="operadores">
          <OperatorPerformanceReport />
        </TabsContent>

        {/* Contenido para clientes */}
        <TabsContent value="clientes">
          <ClientAlarmsReport />
        </TabsContent>
        
        {/* Contenido para despachadores - solo visible para admin y director */}
        {user && (user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR) && (
          <TabsContent value="despachadores">
            <div className="flex justify-end mb-4">
              <Button
                onClick={exportDispatchersToExcel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Exportar a Excel
              </Button>
            </div>
            {dispatchersData && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Tarjeta de resumen */}
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>Resumen de Despachadores</CardTitle>
                    <CardDescription>Estadísticas generales del rendimiento de los despachadores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-white p-4 rounded-lg shadow text-center">
                        <p className="text-sm text-gray-500">Total Despachadores</p>
                        <p className="text-3xl font-bold text-primary-600">{dispatchersData.dispatcherCount}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center">
                        <p className="text-sm text-gray-500">Total Despachos</p>
                        <p className="text-3xl font-bold text-primary-600">{dispatchersData.totalDispatches}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center">
                        <p className="text-sm text-gray-500">Tiempo Promedio de Despacho</p>
                        <p className="text-3xl font-bold text-primary-600">{dispatchersData.avgDispatchTime} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tiempos de despacho por día */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Tiempos de Despacho por Día</CardTitle>
                    <CardDescription>Tiempo promedio que toman los despachadores en asignar alarmas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dispatchersData.dispatchTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="tiempo"
                          name="Tiempo de Despacho (min)"
                          stroke="#0088FE"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tipos de despacho */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tipos de Alarmas Despachadas</CardTitle>
                    <CardDescription>Distribución de alarmas por tipo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dispatchersData.dispatchByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dispatchersData.dispatchByType.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Rendimiento de despachadores */}
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>Rendimiento de Despachadores</CardTitle>
                    <CardDescription>Comparativa de rendimiento individual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={dispatchersData.performance}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="alarmasDespachadas" name="Alarmas Despachadas" fill="#0088FE" />
                        <Bar yAxisId="right" dataKey="tiempoPromedio" name="Tiempo Promedio (min)" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Reports;