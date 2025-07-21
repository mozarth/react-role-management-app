import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth, getYear, getMonth, setMonth, setYear } from "date-fns";
import { es } from "date-fns/locale";
import { Spinner } from "@/components/ui/spinner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  DownloadCloud, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2 
} from "lucide-react";

const ReportsView: React.FC = () => {
  const [dateRange, setDateRange] = useState("last7days");
  const [reportType, setReportType] = useState("alarms");
  
  // Estados para la comparación de periodos
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonType, setComparisonType] = useState<"month" | "year">("month"); 
  const [period1, setPeriod1] = useState(() => {
    const date = new Date();
    return comparisonType === "month" 
      ? getMonth(date) 
      : getYear(date);
  });
  const [period2, setPeriod2] = useState(() => {
    const date = new Date();
    return comparisonType === "month" 
      ? getMonth(date) === 0 ? 11 : getMonth(date) - 1 
      : getYear(date) - 1;
  });
  
  // Función para obtener los datos para el período de comparación
  const getComparisonDateRanges = () => {
    const currentYear = getYear(new Date());
    
    if (comparisonType === "month") {
      // Comparación de meses
      const year1 = currentYear;
      const year2 = period2 > period1 ? currentYear - 1 : currentYear;
      
      const month1Start = new Date(year1, period1, 1);
      const month1End = endOfMonth(month1Start);
      
      const month2Start = new Date(year2, period2, 1);
      const month2End = endOfMonth(month2Start);
      
      return {
        period1: {
          name: format(month1Start, 'MMMM yyyy', { locale: es }),
          startDate: month1Start,
          endDate: month1End
        },
        period2: {
          name: format(month2Start, 'MMMM yyyy', { locale: es }),
          startDate: month2Start,
          endDate: month2End
        }
      };
    } else {
      // Comparación de años
      const year1Start = new Date(period1, 0, 1);
      const year1End = new Date(period1, 11, 31);
      
      const year2Start = new Date(period2, 0, 1);
      const year2End = new Date(period2, 11, 31);
      
      return {
        period1: {
          name: `${period1}`,
          startDate: year1Start,
          endDate: year1End
        },
        period2: {
          name: `${period2}`,
          startDate: year2Start,
          endDate: year2End
        }
      };
    }
  };
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    
    switch (dateRange) {
      case "last7days":
        return {
          startDate: subDays(today, 7),
          endDate: today
        };
      case "last15days":
        return {
          startDate: subDays(today, 15),
          endDate: today
        };
      case "last30days":
        return {
          startDate: subDays(today, 30),
          endDate: today
        };
      case "thisMonth":
        return {
          startDate: startOfMonth(today),
          endDate: today
        };
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(today), 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth)
        };
      default:
        return {
          startDate: subDays(today, 7),
          endDate: today
        };
    }
  };
  
  const { startDate, endDate } = getDateRange();
  
  // Fetch report stats for date range
  const { data: reportStats, isLoading: isReportStatsLoading } = useQuery({
    queryKey: ["/api/reports/stats", { 
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      type: reportType
    }],
    refetchOnWindowFocus: false,
  });
  
  // Fetch alarms for details table
  const { data: alarms = [], isLoading: isAlarmsLoading } = useQuery({
    queryKey: ["/api/alarms", { 
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }],
    refetchOnWindowFocus: false,
  });
  
  // Fetch patrol assignments for details table
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ["/api/patrol-assignments", { 
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }],
    refetchOnWindowFocus: false,
  });
  
  // Función para generar datos de comparación entre dos periodos
  const getComparisonChartData = () => {
    const { period1, period2 } = getComparisonDateRanges();
    
    if (reportType === "alarms") {
      return {
        alarmComparison: [
          { 
            name: "Alarmas Ingresadas", 
            [period1.name]: 15, 
            [period2.name]: 10 
          },
          { 
            name: "Alarmas Despachadas", 
            [period1.name]: 22, 
            [period2.name]: 18 
          },
          { 
            name: "Alarmas Resueltas", 
            [period1.name]: 48, 
            [period2.name]: 36 
          },
          { 
            name: "Tiempo de Respuesta (min)", 
            [period1.name]: 18, 
            [period2.name]: 21 
          }
        ],
        responseTimeComparison: [
          { 
            name: "Tiempo Despacho (min)", 
            [period1.name]: 6, 
            [period2.name]: 8 
          },
          { 
            name: "Tiempo Llegada (min)", 
            [period1.name]: 12, 
            [period2.name]: 15 
          },
          { 
            name: "Tiempo Resolución (min)", 
            [period1.name]: 24, 
            [period2.name]: 28 
          }
        ]
      };
    } else if (reportType === "performance") {
      return {
        performanceComparison: [
          { 
            name: "Alarmas Atendidas", 
            [period1.name]: 25, 
            [period2.name]: 18 
          },
          { 
            name: "Tiempo Promedio (min)", 
            [period1.name]: 15, 
            [period2.name]: 19 
          },
          { 
            name: "Satisfacción Cliente (%)", 
            [period1.name]: 92, 
            [period2.name]: 85 
          }
        ]
      };
    }
    
    return {};
  };
  
  // Función para obtener datos placeholder cuando no hay respuesta del servidor
  const getPlaceholderChartData = () => {
    if (reportType === "alarms") {
      return {
        alarmsByType: [
          { name: "Intrusión", value: 45 },
          { name: "Incendio", value: 15 },
          { name: "Pánico", value: 25 },
          { name: "Otras", value: 15 }
        ],
        alarmsByStatus: [
          { name: "Activas", value: 10 },
          { name: "Despachadas", value: 18 },
          { name: "En Proceso", value: 22 },
          { name: "Resueltas", value: 45 },
          { name: "Canceladas", value: 5 }
        ],
        alarmsByDay: [
          { name: "Lunes", Alarmas: 12 },
          { name: "Martes", Alarmas: 19 },
          { name: "Miércoles", Alarmas: 15 },
          { name: "Jueves", Alarmas: 22 },
          { name: "Viernes", Alarmas: 28 },
          { name: "Sábado", Alarmas: 14 },
          { name: "Domingo", Alarmas: 10 }
        ],
        totalAlarms: 100,
        resolvedAlarms: 45,
        avgResponseTime: 8.2
      };
    } else if (reportType === "response") {
      return {
        responseTimeByDay: [
          { name: "Lunes", "Tiempo (min)": 7.2 },
          { name: "Martes", "Tiempo (min)": 8.5 },
          { name: "Miércoles", "Tiempo (min)": 6.8 },
          { name: "Jueves", "Tiempo (min)": 9.3 },
          { name: "Viernes", "Tiempo (min)": 10.1 },
          { name: "Sábado", "Tiempo (min)": 8.7 },
          { name: "Domingo", "Tiempo (min)": 7.5 }
        ],
        responseTimeBySupervisor: [
          { name: "Juan Pérez", "Tiempo (min)": 6.5 },
          { name: "María González", "Tiempo (min)": 7.8 },
          { name: "Pedro Alvarado", "Tiempo (min)": 9.2 },
          { name: "Ana Vidal", "Tiempo (min)": 8.0 },
          { name: "Roberto Soto", "Tiempo (min)": 7.2 }
        ],
        avgResponseTime: 8.2
      };
    } else if (reportType === "performance") {
      return {
        supervisorPerformance: [
          { name: "Juan Pérez", Asignaciones: 28, Completadas: 26 },
          { name: "María González", Asignaciones: 32, Completadas: 31 },
          { name: "Pedro Alvarado", Asignaciones: 24, Completadas: 21 },
          { name: "Ana Vidal", Asignaciones: 30, Completadas: 28 },
          { name: "Roberto Soto", Asignaciones: 22, Completadas: 20 }
        ],
        totalAssignments: 136,
        completedAssignments: 126
      };
    }
    
    return {};
  };
  
  // Prepare data for charts based on report type and actual data
  const getChartData = () => {
    // Si no hay datos de reportes, usamos datos de ejemplo
    if (!reportStats) {
      return getPlaceholderChartData();
    }
    
    if (reportType === "alarms") {
      // Estadísticas de las alarmas desde los datos reales
      const { alarmStats } = reportStats || { alarmStats: { byType: {}, byStatus: {}, byDay: {}, total: 0 } };
      
      if (!alarmStats) {
        return {
          alarmsByType: [],
          alarmsByStatus: [],
          alarmsByDay: [],
          totalAlarms: 0,
          resolvedAlarms: 0,
          avgResponseTime: 0
        };
      }
      
      // Preparar datos para gráfico por tipo
      const alarmsByType = Object.entries(alarmStats.byType || {}).map(
        ([type, count]) => ({
          name: type,
          value: count
        })
      );
      
      // Preparar datos para gráfico por estado
      const alarmsByStatus = Object.entries(alarmStats.byStatus || {}).map(
        ([status, count]) => ({
          name: status,
          value: count
        })
      );
      
      // Preparar datos para gráfico por día
      const alarmsByDay = Object.entries(alarmStats.byDay || {}).map(
        ([day, count]) => ({
          name: day,
          Alarmas: count
        })
      );
      
      return {
        alarmsByType: alarmsByType || [],
        alarmsByStatus: alarmsByStatus || [],
        alarmsByDay: alarmsByDay || [],
        totalAlarms: alarmStats.total || 0,
        resolvedAlarms: alarmStats.byStatus?.completed || 0,
        avgResponseTime: alarmStats.averageResponseTime || 0
      };
    } else if (reportType === "response") {
      const { performanceStats } = reportStats || { performanceStats: { bySupervisor: {}, averageResponseTime: 0 } };
      
      if (!performanceStats) {
        return {
          responseTimeBySupervisor: [],
          responseTimeByDay: [],
          avgResponseTime: 0
        };
      }
      
      // Obtener supervisores y su tiempo de respuesta promedio
      const supervisorIds = Object.keys(performanceStats.bySupervisor || {});
      const responseTimeBySupervisor = supervisorIds.map(id => {
        const supervisor = performanceStats.bySupervisor[id] || { avgResponseTime: 0 };
        return {
          name: `Supervisor #${id}`,
          "Tiempo (min)": supervisor.avgResponseTime || 0,
        };
      });
      
      // Simular tiempos por día (esto podría mejorarse con datos reales)
      const dayOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const responseTimeByDay = dayOfWeek.map(day => ({
        name: day,
        "Tiempo (min)": Math.round((Math.random() * 2 + (performanceStats.averageResponseTime || 0)) * 10) / 10
      }));
      
      return {
        responseTimeBySupervisor: responseTimeBySupervisor || [],
        responseTimeByDay: responseTimeByDay || [],
        avgResponseTime: performanceStats.averageResponseTime || 0
      };
    } else if (reportType === "performance") {
      const { performanceStats } = reportStats || { performanceStats: { bySupervisor: {}, totalAssignments: 0, completedAssignments: 0 } };
      
      if (!performanceStats) {
        return {
          supervisorPerformance: [],
          totalAssignments: 0,
          completedAssignments: 0
        };
      }
      
      // Obtener supervisores y sus estadísticas
      const supervisorIds = Object.keys(performanceStats.bySupervisor || {});
      const supervisorPerformance = supervisorIds.map(id => {
        const supervisor = performanceStats.bySupervisor[id] || { total: 0, completed: 0 };
        return {
          name: `Supervisor #${id}`,
          Asignaciones: supervisor.total || 0,
          Completadas: supervisor.completed || 0
        };
      });
      
      return {
        supervisorPerformance: supervisorPerformance || [],
        totalAssignments: performanceStats.totalAssignments || 0,
        completedAssignments: performanceStats.completedAssignments || 0
      };
    }
    
    return {};
  };
  
  const chartData = getChartData();
  
  // COLORS for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Loading state
  const isLoading = isAlarmsLoading || isAssignmentsLoading || isReportStatsLoading;
  
  // Get date range text
  const getDateRangeText = () => {
    return `${format(startDate, "dd 'de' MMMM", { locale: es })} - ${format(endDate, "dd 'de' MMMM, yyyy", { locale: es })}`;
  };
  
  // Handle export to PDF/Excel (mock function)
  const handleExport = (format: string) => {
    alert(`Exportando reporte en formato ${format}...`);
    // In a real app, this would trigger a download of the report
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral mb-2">Reportes</h1>
        <p className="text-gray-600">Análisis y estadísticas de operaciones</p>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <span className="font-medium">{getDateRangeText()}</span>
          </div>
          
          <Select
            value={dateRange}
            onValueChange={setDateRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rango de fechas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Últimos 7 días</SelectItem>
              <SelectItem value="last15days">Últimos 15 días</SelectItem>
              <SelectItem value="last30days">Últimos 30 días</SelectItem>
              <SelectItem value="thisMonth">Este mes</SelectItem>
              <SelectItem value="lastMonth">Mes anterior</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={reportType}
            onValueChange={setReportType}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de reporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alarms">Alarmas</SelectItem>
              <SelectItem value="response">Tiempos de respuesta</SelectItem>
              <SelectItem value="performance">Rendimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
          >
            <DownloadCloud className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
          >
            <DownloadCloud className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="charts" className="mb-6">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="comparison">Comparativa</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {reportType === "alarms" && (
                <>
                  {/* Alarms Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Total Alarmas</p>
                            <p className="text-3xl font-bold text-neutral mt-1">
                              {chartData.totalAlarms || 0}
                            </p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-blue-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Alarmas Resueltas</p>
                            <p className="text-3xl font-bold text-neutral mt-1">
                              {chartData.resolvedAlarms || 0}
                            </p>
                          </div>
                          <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle2 className="h-6 w-6 text-green-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                            <p className="text-3xl font-bold text-neutral mt-1">
                              {chartData.avgResponseTime ? 
                                `${chartData.avgResponseTime.toFixed(1)} min` : 
                                "N/A"}
                            </p>
                          </div>
                          <div className="bg-amber-100 p-3 rounded-full">
                            <Clock className="h-6 w-6 text-amber-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Alarms Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-neutral">Alarmas por Tipo</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.alarmsByType || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {(chartData.alarmsByType || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-neutral">Alarmas por Estado</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.alarmsByStatus || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {(chartData.alarmsByStatus || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-neutral">Alarmas por Fecha</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.alarmsByDay || []}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Alarmas" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {reportType === "response" && (
                <>
                  {/* Response Time Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Tiempo Promedio de Respuesta</p>
                            <p className="text-3xl font-bold text-neutral mt-1">
                              {chartData.avgResponseTime ? 
                                `${chartData.avgResponseTime.toFixed(1)} min` : 
                                "N/A"}
                            </p>
                          </div>
                          <div className="bg-amber-100 p-3 rounded-full">
                            <Clock className="h-6 w-6 text-amber-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-neutral">Tiempo de Respuesta por Fecha</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData.responseTimeByDay || []}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Tiempo (min)" stroke="#3B82F6" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-neutral">Tiempo de Respuesta por Supervisor</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.responseTimeBySupervisor || []}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 25,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Tiempo (min)" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {reportType === "performance" && (
                <>
                  {/* Performance Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Total Asignaciones</p>
                            <p className="text-3xl font-bold text-neutral mt-1">
                              {chartData.totalAssignments || 0}
                            </p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-blue-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Asignaciones Completadas</p>
                            <p className="text-3xl font-bold text-neutral mt-1">
                              {chartData.completedAssignments || 0}
                              {chartData.totalAssignments > 0 && (
                                <span className="text-base ml-2 text-green-500">
                                  ({Math.round((chartData.completedAssignments / chartData.totalAssignments) * 100)}%)
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle2 className="h-6 w-6 text-green-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-neutral">Rendimiento de Supervisores</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.supervisorPerformance || []}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 25,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Asignaciones" fill="#3B82F6" />
                          <Bar dataKey="Completadas" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="comparison">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="w-full md:w-1/3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-neutral">Configuración de Comparativa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Tipo de Comparación</label>
                        <Select 
                          value={comparisonType} 
                          onValueChange={(value) => setComparisonType(value as "month" | "year")}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="month">Por Mes</SelectItem>
                            <SelectItem value="year">Por Año</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {comparisonType === "month" ? (
                        <>
                          <div>
                            <label className="text-sm font-medium">Primer Mes</label>
                            <Select 
                              value={period1.toString()} 
                              onValueChange={(value) => setPeriod1(parseInt(value))}
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Seleccionar mes" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Enero</SelectItem>
                                <SelectItem value="1">Febrero</SelectItem>
                                <SelectItem value="2">Marzo</SelectItem>
                                <SelectItem value="3">Abril</SelectItem>
                                <SelectItem value="4">Mayo</SelectItem>
                                <SelectItem value="5">Junio</SelectItem>
                                <SelectItem value="6">Julio</SelectItem>
                                <SelectItem value="7">Agosto</SelectItem>
                                <SelectItem value="8">Septiembre</SelectItem>
                                <SelectItem value="9">Octubre</SelectItem>
                                <SelectItem value="10">Noviembre</SelectItem>
                                <SelectItem value="11">Diciembre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Segundo Mes</label>
                            <Select 
                              value={period2.toString()} 
                              onValueChange={(value) => setPeriod2(parseInt(value))}
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Seleccionar mes" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Enero</SelectItem>
                                <SelectItem value="1">Febrero</SelectItem>
                                <SelectItem value="2">Marzo</SelectItem>
                                <SelectItem value="3">Abril</SelectItem>
                                <SelectItem value="4">Mayo</SelectItem>
                                <SelectItem value="5">Junio</SelectItem>
                                <SelectItem value="6">Julio</SelectItem>
                                <SelectItem value="7">Agosto</SelectItem>
                                <SelectItem value="8">Septiembre</SelectItem>
                                <SelectItem value="9">Octubre</SelectItem>
                                <SelectItem value="10">Noviembre</SelectItem>
                                <SelectItem value="11">Diciembre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm font-medium">Primer Año</label>
                            <Select 
                              value={period1.toString()} 
                              onValueChange={(value) => setPeriod1(parseInt(value))}
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Seleccionar año" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                                <SelectItem value="2022">2022</SelectItem>
                                <SelectItem value="2021">2021</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Segundo Año</label>
                            <Select 
                              value={period2.toString()} 
                              onValueChange={(value) => setPeriod2(parseInt(value))}
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Seleccionar año" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                                <SelectItem value="2022">2022</SelectItem>
                                <SelectItem value="2021">2021</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      
                      <div className="pt-2">
                        <Button 
                          className="w-full" 
                          onClick={() => setShowComparison(true)}
                        >
                          Generar Comparativa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="w-full md:w-2/3">
                {showComparison ? (
                  <>
                    {reportType === "alarms" ? (
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-neutral">
                              Comparativa de Alarmas: {getComparisonDateRanges().period1.name} vs {getComparisonDateRanges().period2.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="90%">
                              <BarChart
                                data={getComparisonChartData().alarmComparison.filter(item => 
                                  item.name !== "Tiempo de Respuesta (min)"
                                )}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar 
                                  dataKey={getComparisonDateRanges().period1.name} 
                                  fill="#8884d8" 
                                  name={getComparisonDateRanges().period1.name}
                                />
                                <Bar 
                                  dataKey={getComparisonDateRanges().period2.name} 
                                  fill="#82ca9d" 
                                  name={getComparisonDateRanges().period2.name}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                            <div className="text-center text-sm text-muted-foreground pt-2">
                              Comparativa de volumen de alarmas por estado
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-neutral">
                              Comparativa de Tiempos de Respuesta
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="h-80">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {/* Primera gráfica - Tiempo respuesta general */}
                              <div>
                                <ResponsiveContainer width="100%" height={200}>
                                  <BarChart
                                    data={getComparisonChartData().alarmComparison.filter(item => 
                                      item.name === "Tiempo de Respuesta (min)"
                                    )}
                                    margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar 
                                      dataKey={getComparisonDateRanges().period1.name} 
                                      fill="#8884d8" 
                                      name={getComparisonDateRanges().period1.name}
                                    />
                                    <Bar 
                                      dataKey={getComparisonDateRanges().period2.name} 
                                      fill="#82ca9d" 
                                      name={getComparisonDateRanges().period2.name}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                                <div className="text-center text-sm text-muted-foreground pt-2">
                                  Tiempo de Respuesta Promedio (min)
                                </div>
                              </div>
                              
                              {/* Segunda gráfica - Tiempos de respuesta detallados */}
                              <div>
                                <ResponsiveContainer width="100%" height={200}>
                                  <BarChart
                                    data={getComparisonChartData().responseTimeComparison}
                                    margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar 
                                      dataKey={getComparisonDateRanges().period1.name} 
                                      fill="#8884d8" 
                                      name={getComparisonDateRanges().period1.name}
                                    />
                                    <Bar 
                                      dataKey={getComparisonDateRanges().period2.name} 
                                      fill="#82ca9d" 
                                      name={getComparisonDateRanges().period2.name}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                                <div className="text-center text-sm text-muted-foreground pt-2">
                                  Tiempo por Etapa del Proceso (min)
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-neutral">
                            Comparativa de Rendimiento: {getComparisonDateRanges().period1.name} vs {getComparisonDateRanges().period2.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                          <ResponsiveContainer width="100%" height="90%">
                            <BarChart
                              data={getComparisonChartData().performanceComparison}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar 
                                dataKey={getComparisonDateRanges().period1.name} 
                                fill="#8884d8" 
                                name={getComparisonDateRanges().period1.name}
                              />
                              <Bar 
                                dataKey={getComparisonDateRanges().period2.name} 
                                fill="#82ca9d" 
                                name={getComparisonDateRanges().period2.name}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                          <div className="text-center text-sm text-muted-foreground pt-2">
                            Indicadores clave de rendimiento comparados entre períodos
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center p-8">
                      <p className="text-muted-foreground mb-2">
                        Configure los parámetros y haga clic en "Generar Comparativa" para visualizar el análisis comparativo.
                      </p>
                      <div className="mt-4">
                        <img 
                          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMSAxMkgzIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTMgMTJ2OWgxOHYtOSIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik02IDE1SDhhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDAgMS0xIDFINmExIDEgMCAwIDEtMS0xdi0yYTEgMSAwIDAgMSAxLTF6IiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTE2IDE1aDF2NCIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg=="
                          alt="Chart icon"
                          className="w-24 h-24 mx-auto opacity-30"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-neutral">Datos del Reporte</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Los datos detallados del reporte se mostrarán aquí y podrán ser exportados a formatos como CSV, Excel o PDF.
                </p>
                <Button variant="outline" onClick={() => handleExport('excel')}>
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Exportar Datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsView;
