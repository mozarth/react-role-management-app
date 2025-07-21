import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

// Initialize connect-pg-simple session store
const PgSession = connectPgSimple(session);

// Add type for user session
declare module 'express-session' {
  interface SessionData {
    user: {
      id: number;
      username: string;
      role: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImageUrl?: string;
    };
  }
}

// Create session configuration
export function getSessionConfig() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use PostgreSQL session store
  const sessionStore = new PgSession({
    pool,
    tableName: 'sessions', // We already have this table in our schema
    createTableIfMissing: true,
  });
  
  // Simple session config to avoid type issues
  return {
    secret: process.env.SESSION_SECRET || 'patrol-dispatch-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: sessionTtl,
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: false,
    },
  };
}