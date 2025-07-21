import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { login as loginApi, logout as logoutApi } from "@/lib/auth";
import { useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { setUserCredentials } from "@/lib/socket";

interface AuthUser {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Obtener usuario actual
  const { 
    data: user, 
    isLoading, 
    error 
  } = useQuery<AuthUser | null>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.status === 401) {
          return null; // Usuario no autenticado
        }
        
        if (!response.ok) {
          throw new Error('Error al obtener información del usuario');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error en queryFn de auth:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });
  
  // Inicializar WebSocket cuando el usuario está autenticado
  useEffect(() => {
    if (user && user.id) {
      console.log('Inicializando WebSocket con credenciales de usuario:', user.id, user.role);
      setUserCredentials(user.id, user.role);
    }
  }, [user]);

  // Mutación para iniciar sesión
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await loginApi(credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: 'Sesión iniciada',
        description: 'Has iniciado sesión correctamente',
      });
      // Cambio de ruta según el rol será manejado por useEffect en App.tsx
    },
    onError: (error: Error) => {
      toast({
        title: 'Error de autenticación',
        description: error.message || 'Error al iniciar sesión',
        variant: 'destructive',
      });
    },
  });

  // Mutación para cerrar sesión
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await logoutApi();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Limpiar caché de todas las consultas de API
      queryClient.clear();
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      });
      navigate('/login');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al cerrar sesión',
        variant: 'destructive',
      });
    },
  });

  // Función para iniciar sesión
  const login = useCallback((username: string, password: string) => {
    loginMutation.mutate({ username, password });
  }, [loginMutation]);

  // Función para cerrar sesión
  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}