// Add custom session properties for Express
declare namespace Express {
  interface Request {
    session: {
      user?: {
        id: number;
        username: string;
        role: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        profileImageUrl?: string;
      };
      destroy: (callback: (err?: any) => void) => void;
    };
  }
}