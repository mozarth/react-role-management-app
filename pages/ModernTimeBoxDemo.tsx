import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import ModernTimeDisplay from '@/components/supervisor/ModernTimeDisplay';

const ModernTimeBoxDemo = () => {
  const [, setLocation] = useLocation();

  // Tiempos de ejemplo para mostrar los diferentes estados
  const timeExamples = [
    { minutes: 15, label: "Normal (menos de 20 min)" },
    { minutes: 25, label: "Atención (20-30 min)" },
    { minutes: 45, label: "Crítico (más de 30 min)" }
  ];

  // Variantes de estilo disponibles
  const variants = [
    { name: 'default', label: 'Estándar' },
    { name: 'fancy', label: 'Moderno con gradiente' },
    { name: 'minimal', label: 'Minimalista' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Visualización Moderna de Tiempo</h1>
        <p className="text-gray-500">Demostración de los diferentes estilos de recuadros de tiempo</p>
      </header>

      {variants.map((variant) => (
        <section key={variant.name} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{variant.label}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {timeExamples.map((example, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{example.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModernTimeDisplay
                    minutes={example.minutes}
                    label="Tiempo transcurrido"
                    variant={variant.name as 'default' | 'fancy' | 'minimal'}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Diferentes tamaños</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pequeño (sm)</CardTitle>
            </CardHeader>
            <CardContent>
              <ModernTimeDisplay
                minutes={15}
                size="sm"
                variant="fancy"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mediano (md)</CardTitle>
            </CardHeader>
            <CardContent>
              <ModernTimeDisplay
                minutes={15}
                size="md"
                variant="fancy"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grande (lg)</CardTitle>
            </CardHeader>
            <CardContent>
              <ModernTimeDisplay
                minutes={15}
                size="lg"
                variant="fancy"
              />
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Button onClick={() => setLocation('/mobile/dashboard')}>
        Volver al Dashboard
      </Button>
    </div>
  );
};

export default ModernTimeBoxDemo;