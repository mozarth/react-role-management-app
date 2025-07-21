import session from 'express-session';
import { pool } from './db';
import connectPgSimple from 'connect-pg-simple';
import { storage } from './storage';
import bcrypt from 'bcrypt';
import { Express, Request, Response, NextFunction } from 'express';

// Usuarios mock para desarrollo
const mockUsers = {
  admin: {
    id: 999,
    username: 'admin',
    password: 'admin123',
    role: 'administrator',
    firstName: 'Administrador',
    lastName: 'Sistema',
    email: 'admin@sistema.com'
  },
  director: {
    id: 998,
    username: 'director',
    password: 'director123',
    role: 'director',
    firstName: 'Director',
    lastName: 'Principal',
    email: 'director@sistema.com'
  },
  operador: {
    id: 997,
    username: 'operador',
    password: 'operador123',
    role: 'alarm_operator',
    firstName: 'Operador',
    lastName: 'Alarmas',
    email: 'operador@sistema.com'
  },
  despachador: {
    id: 996,
    username: 'despachador',
    password: 'despachador123',
    role: 'dispatcher',
    firstName: 'Despachador',
    lastName: 'Principal',
    email: 'despachador@sistema.com'
  },
  supervisor: {
    id: 995,
    username: 'supervisor',
    password: 'supervisor123',
    role: 'supervisor',
    firstName: 'Supervisor',
    lastName: 'Principal',
    email: 'supervisor@sistema.com'
  }
};

// Función auxiliar para manejar inicio de sesión con usuarios mock
function handleMockUserLogin(mockUser: any, req: Request, res: Response) {
  // Asignar user a session
  (req.session as any).user = {
    id: mockUser.id,
    username: mockUser.username,
    role: mockUser.role,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    email: mockUser.email,
    profileImageUrl: mockUser.profileImageUrl
  };
  
  // Quitar la contraseña del objeto user para la respuesta
  const { password: _, ...userWithoutPassword } = mockUser;
  
  return res.status(200).json({ 
    message: "Login successful",
    user: userWithoutPassword
  });
}

// Set up the session store
const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

// Export the session middleware
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'patrol-dispatch-platform-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};

// Authentication middleware
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && (req.session as any).user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Role-based authorization middleware
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session && (req.session as any).user && 
        roles.includes((req.session as any).user.role)) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
  };
};

// Login handler
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Verificar si las credenciales son para un usuario mock predefinido
    if (
      (username === 'admin' && password === 'admin123') ||
      (username === 'director' && password === 'director123') ||
      (username === 'operador' && password === 'operador123') ||
      (username === 'despachador' && password === 'despachador123') ||
      (username === 'supervisor' && password === 'supervisor123')
    ) {
      console.log(`Autenticación exitosa con credenciales fijas para ${username}`);
      
      // Obtener el usuario mock correspondiente
      const mockUser = mockUsers[username as keyof typeof mockUsers];
      
      // Asignar el usuario mock para la sesión
      return handleMockUserLogin(mockUser, req, res);
    } else {
      // Si no es una cuenta predefinida, verificar en la base de datos
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log("Verificando contraseña para el usuario:", username);
      try {
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
          console.log("Contraseña incorrecta para el usuario:", username);
          return res.status(401).json({ message: "Invalid username or password" });
        }
        console.log("Contraseña correcta para el usuario:", username);
        
        // Don't include password in session
        const { password: _, ...userWithoutPassword } = user;
        
        // Store user in session
        (req.session as any).user = {
          id: user.id,
          username: user.username,
          role: user.role,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          email: user.email || undefined,
          profileImageUrl: user.profileImageUrl || undefined
        };
        
        return res.status(200).json({ 
          message: "Login successful",
          user: userWithoutPassword
        });
      } catch (error) {
        console.error("Error al comparar contraseñas:", error);
        return res.status(401).json({ message: "Authentication error" });
      }
    }
    
    // Este código nunca se alcanzará porque ya retornamos dentro del bloque else
    // Lo mantengo comentado para referencia
    // const { password: _, ...userWithoutPassword } = user;
    
    // Este código nunca se ejecutará porque ya retornamos en las condiciones anteriores
    // Lo dejamos comentado para evitar errores
    /*
    (req.session as any).user = {
      id: user.id,
      username: user.username,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      email: user.email || undefined,
      profileImageUrl: user.profileImageUrl || undefined
    };
    
    return res.status(200).json({ 
      message: "Login successful",
      user: userWithoutPassword
    });
    */
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Logout handler
export const logout = (req: Request, res: Response) => {
  // Asegurarse de limpiar completamente la sesión
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    
    // Limpiar la cookie de sesión
    res.clearCookie('connect.sid');
    
    // Forzar una limpieza completa de la caché del navegador para la sesión
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Responder con éxito
    return res.status(200).json({ 
      message: "Logout successful",
      redirectTo: "/login?fresh=true"  // Indicar al cliente que debe redirigir a login con parámetro fresh
    });
  });
};

// Get current user
export const getCurrentUser = (req: Request, res: Response) => {
  if ((req.session as any).user) {
    res.status(200).json((req.session as any).user);
  } else {
    res.status(200).json(null);
  }
};