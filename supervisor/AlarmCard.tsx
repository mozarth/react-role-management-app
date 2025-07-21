import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Camera, 
  FileText, 
  QrCode 
} from 'lucide-react';
import { TimeDisplay } from './TimeDisplay';

interface AlarmCardProps {
  alarm: {
    id: number;
    alarmId: number;
    clientName: string;
    address: string;
    alarmType: string;
    status: string;
    createdAt: string;
    priority: string;
    completedAt?: string;
  };
  onAccept?: (id: number) => void;
  onComplete?: (id: number) => void;
  onCaptureEvidence?: (id: number) => void;
  onScanQR?: (id: number) => void;
  onViewReport?: (id: number) => void;
  onViewRoute?: (id: number) => void;
}

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onAccept,
  onComplete,
  onCaptureEvidence,
  onScanQR,
  onViewReport,
  onViewRoute
}) => {
  // Determinar el color del borde basado en el estado
  const getBorderColor = () => {
    switch (alarm.status) {
      case 'pending':
        return 'border-l-destructive';
      case 'in_progress':
        return 'border-l-secondary';
      case 'completed':
        return 'border-l-primary';
      default:
        return 'border-l-muted';
    }
  };
  
  // Badget de prioridad
  const getPriorityBadge = () => {
    const priorityMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      low: { variant: 'outline', label: 'Baja' },
      medium: { variant: 'secondary', label: 'Media' },
      high: { variant: 'default', label: 'Alta' },
      critical: { variant: 'destructive', label: 'Crítica' },
    };
    
    const priorityConfig = priorityMap[alarm.priority] || { variant: 'outline', label: alarm.priority };
    return (
      <Badge variant={priorityConfig.variant}>
        {priorityConfig.label}
      </Badge>
    );
  };
  
  // Badge de estado
  const getStatusBadge = () => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      pending: { variant: 'destructive', label: 'Pendiente' },
      in_progress: { variant: 'secondary', label: 'En Progreso' },
      completed: { variant: 'default', label: 'Completada' },
    };
    
    const statusConfig = statusMap[alarm.status] || { variant: 'outline', label: alarm.status };
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    );
  };
  
  // Renderizar botones según el estado
  const renderActionButtons = () => {
    if (alarm.status === 'pending') {
      return (
        <Button 
          className="flex-1" 
          onClick={() => onAccept?.(alarm.id)}
        >
          Aceptar
        </Button>
      );
    } else if (alarm.status === 'in_progress') {
      return (
        <>
          <Button 
            variant="outline"
            onClick={() => onCaptureEvidence?.(alarm.id)}
          >
            <Camera className="h-4 w-4 mr-2" />
            Evidencia
          </Button>
          <Button 
            variant="outline"
            onClick={() => onScanQR?.(alarm.id)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Escanear QR
          </Button>
          <Button 
            className="col-span-2 mt-2" 
            onClick={() => onComplete?.(alarm.id)}
          >
            Completar
          </Button>
        </>
      );
    } else if (alarm.status === 'completed') {
      return (
        <>
          <Button 
            variant="outline"
            onClick={() => onViewReport?.(alarm.id)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Reporte
          </Button>
          <Button 
            variant="outline"
            onClick={() => onViewRoute?.(alarm.id)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Ver Ruta
          </Button>
        </>
      );
    }
    
    return null;
  };
  
  return (
    <Card className={`overflow-hidden border-l-4 ${getBorderColor()}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {alarm.clientName}
          </CardTitle>
          <div className="flex gap-1">
            {getPriorityBadge()}
            {getStatusBadge()}
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
          {alarm.address}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
            <p className="font-medium">{alarm.alarmType}</p>
          </div>
          <TimeDisplay 
            timestamp={alarm.status === 'completed' ? (alarm.completedAt || alarm.createdAt) : alarm.createdAt} 
            label={alarm.status === 'completed' ? "Completada hace" : "Tiempo Transcurrido"} 
          />
        </div>
        
        <div className={`grid ${alarm.status === 'in_progress' ? 'grid-cols-2' : 'grid-cols-2'} gap-2 mt-4`}>
          {renderActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};