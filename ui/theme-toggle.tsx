import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { setTheme } from '@/lib/theme';
import axios from 'axios';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Cargar tema inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkTheme(savedTheme === 'dark');
  }, []);

  const toggleTheme = async () => {
    const newTheme = isDarkTheme ? 'light' : 'dark';
    setTheme(newTheme);
    setIsDarkTheme(!isDarkTheme);
    
    // Guardar en el servidor
    try {
      await axios.post('/api/settings/theme', { theme: newTheme });
    } catch (error) {
      console.error('Error al guardar preferencia de tema:', error);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Sun className="h-5 w-5 text-orange-500" />
      <Switch 
        checked={isDarkTheme} 
        onCheckedChange={toggleTheme} 
        id="theme-mode"
      />
      <Moon className="h-5 w-5 text-blue-500" />
      <Label htmlFor="theme-mode" className="ml-1">
        {isDarkTheme ? 'Modo Oscuro' : 'Modo Claro'}
      </Label>
    </div>
  );
}

export function ThemeToggleButton() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Cargar tema inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkTheme(savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark';
    setTheme(newTheme);
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <Button 
      variant="outline" 
      size="icon"
      onClick={toggleTheme}
      title={isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDarkTheme ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}