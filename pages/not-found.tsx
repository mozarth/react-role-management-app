import React from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-2xl font-medium text-gray-600">Página no encontrada</p>
        <p className="mt-2 text-gray-500">Lo sentimos, la página que estás buscando no existe.</p>
        <Link href="/">
          <a className="mt-6 inline-block px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Volver al inicio
          </a>
        </Link>
      </div>
    </div>
  );
}