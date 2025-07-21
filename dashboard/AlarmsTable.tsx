import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from 'lucide-react';
import { AlarmStatus, AlarmStatusColors, AlarmStatusLabels } from '@/lib/constants';

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

interface AlarmTableProps {
  title: string;
  description?: string;
  alarms: Alarm[];
  loading?: boolean;
  className?: string;
  onViewAlarm?: (alarmId: number) => void;
}

export function AlarmsTable({
  title,
  description,
  alarms,
  loading = false,
  className,
  onViewAlarm
}: AlarmTableProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando alarmas...</div>
        ) : alarms.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No hay alarmas activas en este momento</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tiempo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alarms.map((alarm) => (
                  <tr key={alarm.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      #{alarm.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {alarm.clientName || `Cliente #${alarm.clientId}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {alarm.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={AlarmStatusColors[alarm.status as keyof typeof AlarmStatusColors]}>
                        {AlarmStatusLabels[alarm.status as keyof typeof AlarmStatusLabels]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(alarm.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Button variant="ghost" size="sm" onClick={() => onViewAlarm && onViewAlarm(alarm.id)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}