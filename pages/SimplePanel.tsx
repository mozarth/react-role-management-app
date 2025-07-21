import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock, User } from 'lucide-react';

export default function SimplePanel() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/navbar */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <User className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-bold">Panel de Supervisor</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Panel de Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tiempo Transcurrido</p>
              <div className="flex items-center border rounded-md p-2 bg-green-100 border-green-300">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                <div>
                  <p className="font-medium text-green-600">15 min</p>
                  <p className="text-xs text-gray-500">Normal</p>
                </div>
              </div>
            </div>
            
            <Button className="mt-4" onClick={() => setLocation('/mobile/dashboard')}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}