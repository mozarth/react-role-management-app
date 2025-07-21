import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Phone, Plus, Search, Filter, Eye, Edit, Trash2, Clock, User, Building } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CallAssistance {
  id: number;
  clientId: number;
  operatorId: number;
  callType: string;
  status: string;
  callerName?: string;
  callerPhone?: string;
  subject: string;
  description?: string;
  resolution?: string;
  priority: string;
  duration?: number;
  startTime: string;
  endTime?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: number;
  name: string;
  code: string;
}

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  username: string;
}

const callTypeLabels = {
  technical_support: 'Soporte Técnico',
  emergency: 'Emergencia',
  general_inquiry: 'Consulta General',
  complaint: 'Queja',
  information: 'Información',
  service_request: 'Solicitud de Servicio'
};

const statusLabels = {
  received: 'Recibida',
  in_progress: 'En Progreso',
  resolved: 'Resuelta',
  escalated: 'Escalada',
  pending: 'Pendiente'
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'received': return 'bg-amber-100 text-amber-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'escalated': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function SmartUrban() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedAssistance, setSelectedAssistance] = useState<CallAssistance | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewAssistanceOpen, setIsNewAssistanceOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch call assistances
  const { data: callAssistances = [], isLoading } = useQuery({
    queryKey: ['/api/call-assistances'],
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Fetch operators for dropdown
  const { data: operators = [] } = useQuery({
    queryKey: ['/api/users/by-role/alarm_operator'],
  });

  // Create call assistance mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/call-assistances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create call assistance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/call-assistances'] });
      toast({ title: 'Éxito', description: 'Asistencia telefónica creada correctamente' });
      setIsNewAssistanceOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al crear la asistencia telefónica', variant: 'destructive' });
    }
  });

  // Update call assistance mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/call-assistances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update call assistance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/call-assistances'] });
      toast({ title: 'Éxito', description: 'Asistencia telefónica actualizada correctamente' });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Error al actualizar la asistencia telefónica', variant: 'destructive' });
    }
  });

  // Filter assistances
  const filteredAssistances = callAssistances.filter((assistance: CallAssistance) => {
    const matchesSearch = assistance.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assistance.callerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assistance.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assistance.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || assistance.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group assistances by client
  const assistancesByClient = filteredAssistances.reduce((acc: any, assistance: CallAssistance) => {
    const clientId = assistance.clientId;
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(assistance);
    return acc;
  }, {});

  // Statistics
  const totalAssistances = callAssistances.length;
  const activeAssistances = callAssistances.filter((a: CallAssistance) => a.status === 'in_progress').length;
  const resolvedToday = callAssistances.filter((a: CallAssistance) => 
    a.status === 'resolved' && 
    new Date(a.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const handleNewAssistance = (formData: FormData) => {
    const data = {
      clientId: parseInt(formData.get('clientId') as string),
      operatorId: parseInt(formData.get('operatorId') as string),
      callType: formData.get('callType'),
      status: 'received',
      callerName: formData.get('callerName'),
      callerPhone: formData.get('callerPhone'),
      subject: formData.get('subject'),
      description: formData.get('description'),
      priority: formData.get('priority') || 'medium'
    };
    
    createMutation.mutate(data);
  };

  const handleUpdateStatus = (id: number, status: string) => {
    updateMutation.mutate({ 
      id, 
      data: { 
        status,
        endTime: status === 'resolved' ? new Date().toISOString() : null
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando asistencias telefónicas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Phone className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SmartUrban</h1>
            <p className="text-gray-600">Gestión de Asistencias Telefónicas</p>
          </div>
        </div>
        
        <Dialog open={isNewAssistanceOpen} onOpenChange={setIsNewAssistanceOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Asistencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Asistencia Telefónica</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleNewAssistance(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Cliente</Label>
                  <Select name="clientId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: Client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} ({client.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="operatorId">Operador</Label>
                  <Select name="operatorId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((operator: User) => (
                        <SelectItem key={operator.id} value={operator.id.toString()}>
                          {operator.firstName} {operator.lastName} ({operator.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="callType">Tipo de Llamada</Label>
                  <Select name="callType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de llamada" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(callTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="callerName">Nombre del Solicitante</Label>
                  <Input name="callerName" placeholder="Nombre completo" />
                </div>
                
                <div>
                  <Label htmlFor="callerPhone">Teléfono del Solicitante</Label>
                  <Input name="callerPhone" placeholder="Número de teléfono" />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Asunto</Label>
                <Input name="subject" placeholder="Resumen breve del asunto" required />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea name="description" placeholder="Descripción detallada de la consulta o problema" rows={3} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsNewAssistanceOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear Asistencia'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asistencias</p>
                <p className="text-2xl font-bold text-gray-900">{totalAssistances}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600">{activeAssistances}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resueltas Hoy</p>
                <p className="text-2xl font-bold text-green-600">{resolvedToday}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por asunto, solicitante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assistances List */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Vista Lista</TabsTrigger>
          <TabsTrigger value="client">Por Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredAssistances.map((assistance: CallAssistance) => (
            <Card key={assistance.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{assistance.subject}</h3>
                      <Badge className={getStatusColor(assistance.status)}>
                        {statusLabels[assistance.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge className={getPriorityColor(assistance.priority)}>
                        {priorityLabels[assistance.priority as keyof typeof priorityLabels]}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Solicitante:</span> {assistance.callerName || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span> {callTypeLabels[assistance.callType as keyof typeof callTypeLabels]}
                      </div>
                      <div>
                        <span className="font-medium">Teléfono:</span> {assistance.callerPhone || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {format(new Date(assistance.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                    </div>
                    
                    {assistance.description && (
                      <p className="text-gray-700 mt-2">{assistance.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssistance(assistance);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {assistance.status !== 'resolved' && (
                      <Select
                        value={assistance.status}
                        onValueChange={(status) => handleUpdateStatus(assistance.id, status)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredAssistances.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asistencias telefónicas</h3>
                <p className="text-gray-600">No se encontraron asistencias que coincidan con los filtros seleccionados.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="client" className="space-y-4">
          {Object.entries(assistancesByClient).map(([clientId, clientAssistances]: [string, any]) => {
            const client = clients.find((c: Client) => c.id === parseInt(clientId));
            return (
              <Card key={clientId}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>{client?.name || `Cliente ${clientId}`}</span>
                    <Badge variant="secondary">{clientAssistances.length} asistencias</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {clientAssistances.map((assistance: CallAssistance) => (
                    <div key={assistance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{assistance.subject}</span>
                          <Badge className={getStatusColor(assistance.status)}>
                            {statusLabels[assistance.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {format(new Date(assistance.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssistance(assistance);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Asistencia Telefónica</DialogTitle>
          </DialogHeader>
          
          {selectedAssistance && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedAssistance.status)}>
                      {statusLabels[selectedAssistance.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(selectedAssistance.priority)}>
                      {priorityLabels[selectedAssistance.priority as keyof typeof priorityLabels]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label>Asunto</Label>
                <p className="mt-1 text-gray-900">{selectedAssistance.subject}</p>
              </div>

              <div>
                <Label>Descripción</Label>
                <p className="mt-1 text-gray-700">{selectedAssistance.description || 'Sin descripción'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Solicitante</Label>
                  <p className="mt-1">{selectedAssistance.callerName || 'N/A'}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="mt-1">{selectedAssistance.callerPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Inicio</Label>
                  <p className="mt-1">{format(new Date(selectedAssistance.startTime), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                </div>
                {selectedAssistance.endTime && (
                  <div>
                    <Label>Fecha de Finalización</Label>
                    <p className="mt-1">{format(new Date(selectedAssistance.endTime), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                  </div>
                )}
              </div>

              {selectedAssistance.resolution && (
                <div>
                  <Label>Resolución</Label>
                  <p className="mt-1 text-gray-700">{selectedAssistance.resolution}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cerrar
                </Button>
                {selectedAssistance.status !== 'resolved' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedAssistance.id, 'resolved')}
                    disabled={updateMutation.isPending}
                  >
                    Marcar como Resuelta
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}