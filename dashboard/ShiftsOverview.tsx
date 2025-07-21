import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { ShiftStatus } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface ShiftsOverviewProps {
  shifts: any[];
}

const ShiftsOverview: React.FC<ShiftsOverviewProps> = ({ shifts }) => {
  // Get all users for the shifts
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: shifts.length > 0,
  });

  // Get current time to determine active shift
  const now = new Date();

  // Group shifts by time period (morning, afternoon, night)
  const shiftGroups = useMemo(() => {
    // Create shift time periods
    const periods = [
      { name: "Turno Mañana", times: "6:00 - 14:00", startHour: 6, endHour: 14 },
      { name: "Turno Tarde", times: "14:00 - 22:00", startHour: 14, endHour: 22 },
      { name: "Turno Noche", times: "22:00 - 6:00", startHour: 22, endHour: 6 }
    ];

    // Initialize result with time periods
    const result = periods.map(period => ({
      ...period,
      isActive: (now.getHours() >= period.startHour && now.getHours() < period.endHour) ||
                (period.startHour > period.endHour && (now.getHours() >= period.startHour || now.getHours() < period.endHour)),
      shifts: []
    }));

    // Group shifts into time periods
    shifts.forEach(shift => {
      if (shift.status === ShiftStatus.ACTIVE) {
        const startTime = new Date(shift.startTime);
        const startHour = startTime.getHours();
        
        // Find the right period for this shift
        const periodIndex = periods.findIndex(period => 
          (period.startHour <= period.endHour && startHour >= period.startHour && startHour < period.endHour) ||
          (period.startHour > period.endHour && (startHour >= period.startHour || startHour < period.endHour))
        );
        
        if (periodIndex !== -1) {
          const user = users.find(u => u.id === shift.userId);
          if (user) {
            result[periodIndex].shifts.push({
              ...shift,
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
              role: user.role
            });
          }
        }
      }
    });

    return result;
  }, [shifts, users, now]);

  // Group users by role in each shift
  const getUsersByRole = (shiftUsers: any[]) => {
    const roleGroups: Record<string, number> = {};
    
    shiftUsers.forEach(user => {
      if (user.role) {
        roleGroups[user.role] = (roleGroups[user.role] || 0) + 1;
      }
    });
    
    return Object.entries(roleGroups).map(([role, count]) => ({
      role, 
      count
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral">Turnos de Hoy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shiftGroups.map((group, index) => (
          <div 
            key={index} 
            className={`p-2 ${group.isActive 
              ? 'bg-blue-50 border-l-2 border-primary-700' 
              : 'bg-gray-50'} rounded-md`}
          >
            <h3 className="text-sm font-medium text-neutral mb-2">{group.name} ({group.times})</h3>
            
            {group.shifts.length > 0 ? (
              <div className="space-y-1">
                {/* Display individual operators/dispatchers */}
                {group.shifts
                  .filter(shift => shift.role === 'alarm_operator' || shift.role === 'dispatcher')
                  .map((shift, idx) => (
                    <div key={idx} className="flex items-center text-xs">
                      <span className="material-icons text-gray-500 text-sm mr-2">person</span>
                      <span>{shift.userName} - {getRoleDisplay(shift.role)}</span>
                    </div>
                  ))
                }
                
                {/* Group supervisors */}
                {(() => {
                  const supervisors = group.shifts.filter(shift => shift.role === 'supervisor');
                  if (supervisors.length > 0) {
                    return (
                      <div className="flex items-center text-xs">
                        <span className="material-icons text-gray-500 text-sm mr-2">person</span>
                        <span>{supervisors.length} Supervisores Motorizados</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No hay personal asignado</div>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          asChild
        >
          <Link to="/shift-scheduling">
            Gestionar programación
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Helper function to display user-friendly role names
function getRoleDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    'administrator': 'Administrador',
    'director': 'Director',
    'alarm_operator': 'Operador de Alarmas',
    'dispatcher': 'Despachador',
    'supervisor': 'Supervisor Motorizado'
  };
  
  return roleMap[role] || role;
}

export default ShiftsOverview;
