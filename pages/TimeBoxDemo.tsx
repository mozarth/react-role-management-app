import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';

const TimeBoxDemo = () => {
  const [, setLocation] = useLocation();

  // Crear ejemplos de tiempos
  const timeExamples = [
    { 
      label: "Normal (menos de 20 min)", 
      time: "15 min", 
      status: "normal", 
      bgColor: "bg-green-100", 
      borderColor: "border-green-300", 
      textColor: "text-green-600",
      icon: <Clock className="h-5 w-5 mr-2 text-green-600" />
    },
    { 
      label: "Atención (20-30 min)", 
      time: "25 min", 
      status: "warning", 
      bgColor: "bg-amber-100", 
      borderColor: "border-amber-300", 
      textColor: "text-amber-600",
      icon: <Clock className="h-5 w-5 mr-2 text-amber-600" />
    },
    { 
      label: "Crítico (más de 30 min)", 
      time: "45 min", 
      status: "critical", 
      bgColor: "bg-red-100", 
      borderColor: "border-red-300", 
      textColor: "text-red-600",
      icon: <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />,
      animation: "animate-pulse"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-6">Demostración de Recuadros de Tiempo</h1>
      
      <div className="grid gap-6">
        {timeExamples.map((example, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{example.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center border rounded-md p-3 ${example.bgColor} ${example.borderColor} ${example.animation || ''}`}>
                {example.icon}
                <div>
                  <p className={`font-medium ${example.textColor}`}>{example.time}</p>
                  <p className="text-xs text-gray-500">{example.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button className="mt-6" onClick={() => setLocation('/mobile/dashboard')}>
        Volver al Dashboard
      </Button>
    </div>
  );
};

export default TimeBoxDemo;