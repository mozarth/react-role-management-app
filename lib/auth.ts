import { UserRole } from "./constants";
import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  username?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export async function login(credentials: LoginCredentials) {
  try {
    console.log('Enviando credenciales:', credentials);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al iniciar sesión');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

export async function logout() {
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
      throw new Error('Error al cerrar sesión');
    }
    
    // Leer la respuesta del servidor
    const data = await response.json();
    
    // Usar la URL de redirección proporcionada por el servidor
    if (data.redirectTo) {
      // Importante: Redirigir a login con un parámetro que fuerza nueva sesión
      window.location.href = data.redirectTo;
    } else {
      // Fallback por si el servidor no proporciona redirectTo
      window.location.href = '/login?fresh=true';
    }
    
    return data;
  } catch (error) {
    console.error('Error en logout:', error);
    // Incluso en caso de error, redirigir para forzar una sesión limpia
    window.location.href = '/login?fresh=true';
    throw error;
  }
}

export function getFullName(user: AuthUser): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else if (user.firstName) {
    return user.firstName;
  } else if (user.username) {
    return user.username;
  } else if (user.email) {
    return user.email.split('@')[0];
  }
  return "Usuario";
}

export function getRoleDisplay(role: string): string {
  switch (role) {
    case UserRole.ADMIN:
      return "Administrador";
    case UserRole.DIRECTOR:
      return "Director";
    case UserRole.ALARM_OPERATOR:
      return "Operador de Alarmas";
    case UserRole.DISPATCHER:
      return "Despachador";
    case UserRole.SUPERVISOR:
      return "Supervisor Motorizado";
    default:
      return "Usuario";
  }
}