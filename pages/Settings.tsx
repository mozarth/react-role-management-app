import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User } from '@shared/schema';
import { UserRole } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Componente para la sección de tema
const ThemeSettings = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  // Cargar configuración inicial
  const { data: settingsData } = useQuery<{ theme: string }>({
    queryKey: ['/api/settings']
  });
  
  // Efecto para aplicar la configuración inicial
  useEffect(() => {
    if (settingsData?.theme && settingsData.theme !== theme) {
      handleThemeChange(settingsData.theme as 'light' | 'dark');
    }
  }, [settingsData]);

  // Mutación para guardar configuración de tema
  const saveThemeMutation = useMutation({
    mutationFn: async (newTheme: 'light' | 'dark') => {
      return await apiRequest('POST', '/api/settings/theme', { theme: newTheme });
    },
    onSuccess: () => {
      toast({
        title: "Tema actualizado",
        description: "La configuración de tema se ha guardado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al guardar configuración",
        description: `${error}`,
        variant: "destructive",
      });
    }
  });

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    
    // Aplicar tema al DOM
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Guardar en el servidor
    saveThemeMutation.mutate(newTheme);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Preferencias de tema</h3>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Tema oscuro</Label>
          <p className="text-sm text-muted-foreground">
            Cambia la apariencia de la aplicación a modo oscuro.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={theme === 'dark'}
            onCheckedChange={(checked) => handleThemeChange(checked ? 'dark' : 'light')}
          />
          <span className="text-sm">
            {theme === 'dark' ? 'Activado' : 'Desactivado'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Componente para la sección de notificaciones
const NotificationSettings = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Cargar configuración inicial
  const { data: settings } = useQuery<{
    notifications: {
      email: boolean;
      push: boolean;
      sound: boolean;
    }
  }>({
    queryKey: ['/api/settings']
  });
  
  // Efecto para aplicar la configuración inicial
  useEffect(() => {
    if (settings?.notifications) {
      setEmailNotifications(settings.notifications.email);
      setPushNotifications(settings.notifications.push);
      setSoundAlerts(settings.notifications.sound);
    }
  }, [settings]);

  // Mutación para guardar configuración de notificaciones
  const saveNotificationMutation = useMutation({
    mutationFn: async (notificationSettings: { email: boolean, push: boolean, sound: boolean }) => {
      return await apiRequest('POST', '/api/settings/notifications', notificationSettings);
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "Las preferencias de notificaciones han sido actualizadas",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al guardar configuración",
        description: `${error}`,
        variant: "destructive",
      });
    }
  });

  const saveNotificationSettings = () => {
    saveNotificationMutation.mutate({
      email: emailNotifications,
      push: pushNotifications,
      sound: soundAlerts
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Preferencias de notificaciones</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Notificaciones por correo</Label>
            <p className="text-sm text-muted-foreground">
              Recibe alertas y notificaciones por correo electrónico.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
            <span className="text-sm">
              {emailNotifications ? 'Activado' : 'Desactivado'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Notificaciones push</Label>
            <p className="text-sm text-muted-foreground">
              Recibe notificaciones emergentes en tiempo real.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
            <span className="text-sm">
              {pushNotifications ? 'Activado' : 'Desactivado'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Alertas sonoras</Label>
            <p className="text-sm text-muted-foreground">
              Reproduce un sonido cuando hay nuevas alertas importantes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={soundAlerts}
              onCheckedChange={setSoundAlerts}
            />
            <span className="text-sm">
              {soundAlerts ? 'Activado' : 'Desactivado'}
            </span>
          </div>
        </div>
        
        <Button 
          onClick={saveNotificationSettings} 
          className="mt-4"
          disabled={saveNotificationMutation.isPending}
        >
          {saveNotificationMutation.isPending ? 'Guardando...' : 'Guardar preferencias'}
        </Button>
      </div>
    </div>
  );
};

// Componente para la sección de gestión de usuarios
const UserManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState('');

  // Obtener la lista de usuarios
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: user?.role === UserRole.ADMIN,
  });

  // Mutación para restablecer contraseña
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number, password: string }) => {
      return await apiRequest('POST', `/api/users/${userId}/reset-password`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setResetPasswordUserId(null);
      setNewPassword('');
      setConfirmPassword('');
      setResetPasswordError('');
      toast({
        title: "Contraseña restablecida",
        description: "La contraseña ha sido actualizada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al restablecer contraseña",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar usuario
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDeleteUserId(null);
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado del sistema",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar usuario",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Manejar el restablecimiento de contraseña
  const handleResetPassword = () => {
    setResetPasswordError('');
    
    if (!newPassword || !confirmPassword) {
      setResetPasswordError('Por favor, complete todos los campos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setResetPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setResetPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (resetPasswordUserId) {
      resetPasswordMutation.mutate({ userId: resetPasswordUserId, password: newPassword });
    }
  };

  // Manejar la eliminación de usuario
  const handleDeleteUser = () => {
    if (deleteUserId) {
      deleteUserMutation.mutate(deleteUserId);
    }
  };

  // Verificar que el usuario actual es administrador
  if (user?.role !== UserRole.ADMIN) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acceso restringido</AlertTitle>
        <AlertDescription>
          Solo los administradores pueden acceder a la gestión de usuarios.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Gestión de usuarios</h3>
      
      {isLoading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.username}
                    </CardTitle>
                    <CardDescription>
                      {user.email} - {user.role}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={resetPasswordUserId === user.id} onOpenChange={(open) => {
                      if (!open) setResetPasswordUserId(null);
                      setNewPassword('');
                      setConfirmPassword('');
                      setResetPasswordError('');
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setResetPasswordUserId(user.id)}>
                          Restablecer contraseña
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Restablecer contraseña</DialogTitle>
                          <DialogDescription>
                            Ingrese la nueva contraseña para {user.username}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {resetPasswordError && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{resetPasswordError}</AlertDescription>
                            </Alert>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="new-password">Nueva contraseña</Label>
                            <Input 
                              id="new-password" 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                            <Input 
                              id="confirm-password" 
                              type="password" 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setResetPasswordUserId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleResetPassword}
                            disabled={resetPasswordMutation.isPending}
                          >
                            {resetPasswordMutation.isPending ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={deleteUserId === user.id} onOpenChange={(open) => {
                      if (!open) setDeleteUserId(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteUserId(user.id)}>
                          Eliminar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Eliminar usuario</DialogTitle>
                          <DialogDescription>
                            ¿Está seguro que desea eliminar a {user.username}?
                            Esta acción no se puede deshacer.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setDeleteUserId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleDeleteUser}
                            disabled={deleteUserMutation.isPending}
                          >
                            {deleteUserMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente principal de Configuración
export default function Settings() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-16rem)]">
        <p className="text-lg text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="theme">Tema</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          {user.role === UserRole.ADMIN && (
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          )}
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información de Perfil</CardTitle>
                <CardDescription>
                  Gestiona tu información personal y contraseña.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input id="username" value={user.username} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input 
                    id="name" 
                    value={`${user.firstName || ''} ${user.lastName || ''}`} 
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" value={user.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input id="role" value={user.role} disabled />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline">Cambiar contraseña</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Tema</CardTitle>
                <CardDescription>
                  Personaliza la apariencia del sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>
                  Configura cómo quieres recibir alertas y notificaciones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          {user.role === UserRole.ADMIN && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <CardDescription>
                    Administra los usuarios del sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}