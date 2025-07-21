import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export default function Logout() {
  const [, navigate] = useLocation();
  const [message, setMessage] = useState<string>('Cerrando sesión...');

  // Realizar la limpieza de sesión
  useEffect(() => {
    const cleanSession = async () => {
      try {
        // Primero hacemos la petición al servidor para cerrar la sesión
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          setMessage('Error al cerrar sesión. Intentando redireccionar...');
        } else {
          setMessage('Sesión cerrada correctamente. Redireccionando...');
        }
        
        // Esperar 2 segundos antes de redirigir para asegurar que la sesión se limpió
        setTimeout(() => {
          // Limpiar cualquier estado que pueda estar en localStorage/sessionStorage
          localStorage.clear();
          sessionStorage.clear();
          
          // Redirigir a la página de login con un flag que evita redirecciones automáticas
          navigate('/login?fresh=true');
        }, 2000);
      } catch (error) {
        console.error('Error en logout:', error);
        setMessage('Error al cerrar sesión. Intentando redireccionar...');
        
        // Incluso en caso de error, intentar redirigir
        setTimeout(() => {
          navigate('/login?fresh=true');
        }, 2000);
      }
    };

    cleanSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Sesión finalizada</h1>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="mt-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}