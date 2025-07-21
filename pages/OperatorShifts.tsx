import React from 'react';
import Layout from '@/components/layout/Layout';
import ShiftViewOperator from '@/components/shifts/ShiftViewOperator';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function OperatorShifts() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Turnos de Operadores</h1>
            <p className="text-gray-600">Consulta los horarios de los operadores de alarmas</p>
          </div>
          <Link href="/operator-shifts-new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Vista Mejorada de Turnos
            </Button>
          </Link>
        </div>
        <ShiftViewOperator />
      </div>
    </Layout>
  );
}