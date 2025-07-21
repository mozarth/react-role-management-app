import React from 'react';
import SupervisorPanel from './SupervisorPanel';

// Esta página es un wrapper que muestra directamente el panel de supervisor
// sin el menú lateral ni otras pestañas cuando los supervisores inician sesión
export default function SupervisorOnlyPanel() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#001428] to-black">
      {/* Contenedor principal sin barra lateral ni encabezado */}
      <div className="w-full">
        <SupervisorPanel />
      </div>
    </div>
  );
}