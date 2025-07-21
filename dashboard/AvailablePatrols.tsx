import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PatrolStatus, PatrolStatusColors, PatrolStatusLabels } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

interface AvailablePatrolsProps {
  patrols: any[];
}

const AvailablePatrols: React.FC<AvailablePatrolsProps> = ({ patrols }) => {
  // Get supervisors for patrols
  const { data: supervisors = [] } = useQuery({
    queryKey: ["/api/users/by-role/supervisor"],
    enabled: patrols.length > 0,
  });

  // Filter available patrols
  const availablePatrols = patrols.filter(
    patrol => patrol.status === PatrolStatus.AVAILABLE
  ).slice(0, 3);

  // Get supervisor name for a patrol
  const getSupervisorName = (patrolId: number) => {
    const assignment = supervisors.find(s => s.patrolId === patrolId);
    return assignment ? `${assignment.firstName || ''} ${assignment.lastName || ''}`.trim() : 'Sin asignar';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral">Patrullas Disponibles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availablePatrols.length > 0 ? (
          availablePatrols.map(patrol => (
            <div 
              key={patrol.id} 
              className="flex items-center p-2 border border-gray-100 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center text-white mr-3">
                <span className="material-icons">directions_car</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral">Patrulla #{patrol.id}</p>
                <p className="text-xs text-gray-500">
                  {getSupervisorName(patrol.id)} • {patrol.licensePlate}
                </p>
              </div>
              <div className={`text-xs font-medium ${PatrolStatusColors[patrol.status as keyof typeof PatrolStatusColors]}`}>
                {PatrolStatusLabels[patrol.status as keyof typeof PatrolStatusLabels]}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            No hay patrullas disponibles en este momento
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          asChild
        >
          <Link to="/dispatch">
            Ver todas las patrullas
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AvailablePatrols;
