import React from 'react';
import { Clock } from 'lucide-react';

interface TimeBoxProps {
  dateString: string;
}

// Componente simple que solo muestra el tiempo en un recuadro coloreado
export const TimeBox = ({ dateString }: TimeBoxProps) => {
  const formatTimeDifference = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Determinar colores y estilos basados en el tiempo transcurrido
  const getTimeStyles = () => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 20) {
      return {
        bg: 'bg-green-100',
        border: 'border-green-300',
        text: 'text-green-600 font-medium',
        animate: ''
      };
    } else if (diffMins < 30) {
      return {
        bg: 'bg-amber-100',
        border: 'border-amber-300',
        text: 'text-amber-600 font-semibold',
        animate: ''
      };
    } else {
      return {
        bg: 'bg-red-100',
        border: 'border-red-300',
        text: 'text-red-600 font-bold',
        animate: 'animate-pulse'
      };
    }
  };

  const styles = getTimeStyles();

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded border ${styles.bg} ${styles.border} ${styles.animate}`}>
      <Clock className={`h-4 w-4 mr-1 ${styles.text}`} />
      <span className={styles.text}>
        {formatTimeDifference(dateString)}
      </span>
    </div>
  );
};