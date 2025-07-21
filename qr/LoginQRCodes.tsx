import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

const LoginQRCodes: React.FC = () => {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto p-8 gap-8">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Centro de Despacho</h1>
        <p className="text-blue-300 text-lg">
          Selecciona el tipo de acceso que necesitas
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Acceso principal */}
        <Card className="bg-black/60 border-blue-500/30 backdrop-blur-md shadow-xl flex flex-col">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Acceso General</CardTitle>
            <CardDescription className="text-blue-300">
              Para operadores, despachadores, directores y administradores
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-start p-6 flex-grow pt-2">
            <div className="w-40 h-40 relative flex items-center justify-center mt-0">
              {/* Círculo exterior con animación */}
              <div className="absolute w-full h-full rounded-full border-4 border-blue-400/30 animate-pulse"></div>
              
              {/* Círculo principal */}
              <div className="w-36 h-36 bg-gradient-to-br from-blue-800/80 to-blue-600/50 rounded-full flex items-center justify-center shadow-lg">
                {/* Círculo interior */}
                <div className="w-28 h-28 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-blue-300/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Destellos decorativos */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button 
              className="bg-blue-600/80 hover:bg-blue-500/80 border border-blue-500/50 w-full py-6 text-lg"
              onClick={() => navigate('/login')}
            >
              Ir al Login Principal
            </Button>
          </CardFooter>
        </Card>
        
        {/* Acceso de supervisores */}
        <Card className="bg-black/60 border-blue-500/30 backdrop-blur-md shadow-xl flex flex-col">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Acceso de Supervisores</CardTitle>
            <CardDescription className="text-blue-300">
              Exclusivo para supervisores motorizados
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 flex-grow">
            <div className="mb-2"></div> {/* Espacio adicional arriba (reducido) */}
            <div className="w-40 h-40 relative flex items-center justify-center">
              {/* Círculo exterior con animación */}
              <div className="absolute w-full h-full rounded-full border-4 border-blue-400/30 animate-pulse"></div>
              
              {/* Círculo principal */}
              <div className="w-36 h-36 bg-gradient-to-br from-blue-800/80 to-blue-600/50 rounded-full flex items-center justify-center shadow-lg">
                {/* Círculo interior */}
                <div className="w-28 h-28 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-blue-300/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              
              {/* Destellos decorativos */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button 
              className="bg-blue-600/80 hover:bg-blue-500/80 border border-blue-500/50 w-full py-6 text-lg"
              onClick={() => navigate('/mobile/login')}
            >
              Ir al Login de Supervisores
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginQRCodes;