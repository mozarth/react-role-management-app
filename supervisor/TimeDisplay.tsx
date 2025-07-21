import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeDisplayProps {
  timestamp: string;
  label?: string;
  showIcon?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Componente que muestra el tiempo transcurrido con código de colores
 * Verde: < 20 min
 * Naranja: 20-30 min
 * Rojo: > 30 min
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({ 
  timestamp, 
  label = "Tiempo", 
  showIcon = true,
  compact = false,
  className = ""
}) => {
  // Formatear tiempo transcurrido
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

  // Obtener la duración en minutos
  const getDurationInMinutes = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / 60000);
  };

  // Calcular clases de estilo basadas en la duración
  const getTimeStyles = () => {
    const durationMins = getDurationInMinutes(timestamp);
    
    if (durationMins < 20) {
      return {
        container: 'bg-green-100 border-green-300',
        text: 'text-green-600',
        icon: 'text-green-600',
        pulse: ''
      };
    } else if (durationMins < 30) {
      return {
        container: 'bg-amber-100 border-amber-300',
        text: 'text-amber-600 font-medium',
        icon: 'text-amber-600',
        pulse: ''
      };
    } else {
      return {
        container: 'bg-red-100 border-red-300',
        text: 'text-red-600 font-semibold',
        icon: 'text-red-600',
        pulse: 'animate-pulse'
      };
    }
  };

  const styles = getTimeStyles();
  const formattedTime = formatTimeDifference(timestamp);

  // Determinar el ícono a mostrar
  const getIcon = () => {
    const durationMins = getDurationInMinutes(timestamp);
    if (durationMins >= 30) {
      return <AlertTriangle className={`h-4 w-4 ${styles.icon}`} />;
    }
    return <Clock className={`h-4 w-4 ${styles.icon}`} />;
  };

  if (compact) {
    // Versión compacta (solo muestra el tiempo en un recuadro pequeño)
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded border ${styles.container} ${styles.pulse} ${className}`}>
        {showIcon && getIcon()}
        <span className={`${styles.text} ${showIcon ? 'ml-1' : ''} text-sm`}>
          {formattedTime}
        </span>
      </div>
    );
  }

  // Versión completa (con etiqueta y más espaciado)
  return (
    <div className={className}>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <div className={`flex items-center px-3 py-2 mt-1 rounded border ${styles.container} ${styles.pulse}`}>
        {showIcon && <div className="mr-2">{getIcon()}</div>}
        <span className={`${styles.text}`}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
};