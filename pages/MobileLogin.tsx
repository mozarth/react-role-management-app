import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

export default function MobileLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest('POST', '/api/login/mobile', credentials);
    },
    onSuccess: (data) => {
      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Redirigiendo al panel de supervisor',
      });
      // Redirigir a la nueva página de acceso directo para supervisores
      window.location.href = '/supervisor-direct';
    },
    onError: (error: any) => {
      toast({
        title: 'Error de inicio de sesión',
        description: error.message || 'Credenciales inválidas. Por favor, inténtelo de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 relative bg-black">
      {/* Imagen de fondo con overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-90" 
        style={{ backgroundImage: "url('/assets/supervisor-login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </div>
      
      {/* Contenido */}
      <div className="z-10 w-full max-w-md px-4">
        <Card className="w-full backdrop-blur-md bg-black/50 shadow-2xl border border-blue-500/30">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center mb-2">
              <div className="h-16 w-16 rounded-full bg-blue-900/70 flex items-center justify-center border border-blue-400/50">
                <User className="h-8 w-8 text-blue-300" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Supervisores Motorizados</CardTitle>
            <CardDescription className="text-blue-300">
              Panel de control para gestión de patrullas y asignaciones
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-blue-300">Nombre de usuario</Label>
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Ingrese su nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-black/50 border-blue-500/30 text-white placeholder:text-gray-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-300">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/50 border-blue-500/30 text-white placeholder:text-gray-500"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full bg-blue-600/80 hover:bg-blue-500/80 text-white border border-blue-500/50 shadow-lg backdrop-blur-sm transition-colors" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
              
              <div className="text-sm text-center text-blue-300/80">
                Acceso restringido a supervisores autorizados
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}