import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { AlarmStatus, AlarmStatusColors, AlarmStatusLabels } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@shared/schema";

interface IncidentsTableProps {
  incidents: any[];
}

const IncidentsTable: React.FC<IncidentsTableProps> = ({ incidents }) => {
  const { user } = useAuth();
  const sortedIncidents = [...incidents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate the elapsed time since the incident was created
  const getElapsedTime = (timestamp: string) => {
    if (!timestamp) return "N/A";
    
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Check if user can assign incidents
  const canAssign = user && (
    user.role === UserRole.DISPATCHER || 
    user.role === UserRole.ADMIN || 
    user.role === UserRole.DIRECTOR
  );

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-neutral">Incidentes Recientes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIncidents.length > 0 ? (
              sortedIncidents.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">#{incident.id}</TableCell>
                  <TableCell>{incident.client?.businessName || "Cliente desconocido"}</TableCell>
                  <TableCell>{incident.client?.address || "Dirección desconocida"}</TableCell>
                  <TableCell>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${AlarmStatusColors[incident.status as keyof typeof AlarmStatusColors]}`}>
                      {AlarmStatusLabels[incident.status as keyof typeof AlarmStatusLabels] || incident.status}
                    </span>
                  </TableCell>
                  <TableCell>{getElapsedTime(incident.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="link"
                      size="sm"
                      asChild
                      className="mr-2"
                    >
                      <Link to={`/alarms/${incident.id}`}>
                        Ver
                      </Link>
                    </Button>
                    
                    {canAssign && incident.status === AlarmStatus.ACTIVE && (
                      <Button
                        variant="link"
                        size="sm"
                        asChild
                      >
                        <Link to={`/dispatch?alarmId=${incident.id}`}>
                          Asignar
                        </Link>
                      </Button>
                    )}
                    
                    {incident.status !== AlarmStatus.ACTIVE && (
                      <span className="text-gray-400 text-sm">
                        {incident.status === AlarmStatus.RESOLVED ? "Resuelto" : "Asignado"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No hay incidentes recientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="border-t border-gray-200 p-4 flex justify-center">
        <Button variant="link" asChild>
          <Link to="/alarms" className="text-sm text-primary-700 hover:text-primary-900 flex items-center">
            Ver todos los incidentes
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IncidentsTable;
