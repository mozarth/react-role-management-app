import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(true);
  
  // Verificar si venimos de un cierre de sesión con parámetro fresh=true
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('fresh') === 'true') {
      // Forzar una limpieza completa de la sesión
      console.log('Sesión nueva requerida, ignorando redirecciones automáticas');
      setShowLoginForm(true);
      // Limpiar la URL para evitar problemas en recargas
      window.history.replaceState({}, document.title, '/login');
      return;
    }
    
    // Solo redirigir automáticamente si el usuario ya estaba autenticado al cargar la página
    // No redirigir durante el proceso de login manual para evitar interrupciones
    if (isAuthenticated && !isLoggingIn && !params.get('fresh')) {
      setShowLoginForm(false);
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoggingIn, navigate, search]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    // Usamos username como email para mantener compatibilidad con el backend
    login(data.username, data.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/assets/control-center-bg.png')" }}>
      <div className="max-w-md w-full p-8 bg-black/70 backdrop-blur-sm rounded-lg shadow-xl border border-blue-400/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Centro de Despacho</h1>
          <p className="text-blue-300 mt-2">Inicia sesión para acceder al sistema</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-blue-300">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              {...register('username')}
              className="mt-1 block w-full rounded-md border border-blue-500/30 bg-black/60 text-white px-3 py-2 shadow-sm focus:border-blue-400 focus:ring-blue-400 placeholder-gray-500"
              placeholder="Tu nombre de usuario"
              disabled={isLoggingIn}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-blue-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border border-blue-500/30 bg-black/60 text-white px-3 py-2 shadow-sm focus:border-blue-400 focus:ring-blue-400 placeholder-gray-500"
              placeholder="Tu contraseña"
              disabled={isLoggingIn}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center py-2 px-4 border border-blue-500/50 rounded-md shadow-lg text-sm font-medium text-white bg-blue-600/80 hover:bg-blue-500/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 backdrop-blur-sm transition-colors"
            >
              {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}