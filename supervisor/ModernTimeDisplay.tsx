import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ModernTimeDisplayProps {
  minutes: number;
  status?: 'normal' | 'warning' | 'critical';
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'fancy' | 'minimal';
}

export const ModernTimeDisplay: React.FC<ModernTimeDisplayProps> = ({
  minutes,
  status,
  label = 'Tiempo transcurrido',
  showLabel = true,
  size = 'md',
  variant = 'default',
}) => {
  // Determinar el estado automáticamente si no se proporciona
  const timeStatus = status || (
    minutes < 20 ? 'normal' : 
    minutes < 30 ? 'warning' : 
    'critical'
  );

  // Configuración según el estado
  const config: Record<string, {
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
    icon: React.ReactNode;
    gradient: string;
    shadow: string;
    animation?: string;
  }> = {
    normal: {
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      textColor: 'text-green-600',
      iconColor: 'text-green-600',
      icon: <Clock />,
      gradient: 'from-green-400 to-emerald-600',
      shadow: 'shadow-green-200',
    },
    warning: {
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-600',
      iconColor: 'text-amber-600',
      icon: <Clock />,
      gradient: 'from-amber-400 to-orange-600',
      shadow: 'shadow-amber-200',
    },
    critical: {
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      textColor: 'text-red-600',
      iconColor: 'text-red-600',
      icon: <AlertTriangle />,
      gradient: 'from-red-500 to-rose-700',
      shadow: 'shadow-red-200',
      animation: 'animate-pulse',
    },
  };

  // Tamaños
  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'h-4 w-4 mr-1.5',
      text: 'text-sm',
      label: 'text-xs',
    },
    md: {
      container: 'p-3',
      icon: 'h-5 w-5 mr-2',
      text: 'text-base',
      label: 'text-xs',
    },
    lg: {
      container: 'p-4',
      icon: 'h-6 w-6 mr-2.5',
      text: 'text-lg',
      label: 'text-sm',
    },
  };

  // Formato del tiempo
  const formatTime = (mins: number) => {
    if (mins < 60) {
      return `${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}min`;
  };

  // Variantes de estilo
  const renderVariant = () => {
    const currentConfig = config[timeStatus];
    const currentSize = sizeClasses[size];
    
    switch (variant) {
      case 'fancy':
        return (
          <div 
            className={`relative rounded-lg ${currentSize.container} ${currentConfig.animation || ''} shadow-lg ${currentConfig.shadow}`}
          >
            <div className={`absolute inset-0 rounded-lg bg-gradient-to-r opacity-90 ${currentConfig.gradient}`}></div>
            <div className="relative flex items-center z-10">
              <div className={`${currentSize.icon} text-white`}>{currentConfig.icon}</div>
              <div>
                <p className={`font-bold text-white ${currentSize.text}`}>
                  {formatTime(minutes)}
                </p>
                {showLabel && (
                  <p className={`text-white/90 ${currentSize.label}`}>{label}</p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'minimal':
        return (
          <div className={`flex items-center ${currentConfig.animation || ''}`}>
            <div className={`${currentSize.icon} ${currentConfig.iconColor}`}>{currentConfig.icon}</div>
            <p className={`font-medium ${currentConfig.textColor} ${currentSize.text}`}>
              {formatTime(minutes)}
            </p>
          </div>
        );
        
      default: // default
        return (
          <div 
            className={`flex items-center border rounded-md ${currentSize.container} ${currentConfig.bgColor} ${currentConfig.borderColor} ${currentConfig.animation || ''}`}
          >
            <div className={`${currentSize.icon} ${currentConfig.iconColor}`}>{currentConfig.icon}</div>
            <div>
              <p className={`font-medium ${currentConfig.textColor} ${currentSize.text}`}>
                {formatTime(minutes)}
              </p>
              {showLabel && (
                <p className={`text-gray-500 ${currentSize.label}`}>{label}</p>
              )}
            </div>
          </div>
        );
    }
  };

  return renderVariant();
};

export default ModernTimeDisplay;