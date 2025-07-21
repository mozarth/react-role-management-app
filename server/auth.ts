import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import { Express, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';

// Create session store
const PgSession = connectPgSimple(session);
const sessionStore = new PgSession({
  pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

// Configure session
export const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'patrol-dispatch-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    secure: false 
  }
});

// Authentication middleware
export const isAuthenticated = (req: any, res: Response, next: NextFunction) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Role-based authorization middleware
export const hasRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (req.session && req.session.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
  };
};

// Login function
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    const passwordMatch = await bcrypt.compare(String(password), user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    // Don't include password in session
    const { password: _, ...userWithoutPassword } = user;
    
    // Store user in session
    (req as any).session.user = {
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
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Logout function
export const logoutUser = (req: Request, res: Response) => {
  (req as any).session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: "Logout successful" });
  });
};

// Get current user
export const getCurrentUser = (req: Request, res: Response) => {
  res.status(200).json((req as any).session.user || null);
};