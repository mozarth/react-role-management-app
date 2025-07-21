import React from 'react';
import SupervisorLayout from '@/components/layout/SupervisorLayout';
import SupervisorPanel from './SupervisorPanel';

// Página especial para acceso directo de supervisores móviles
export default function SupervisorDirectAccess() {
  return (
    <SupervisorLayout>
      <SupervisorPanel />
    </SupervisorLayout>
  );
}