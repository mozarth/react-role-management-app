// Datos de prueba para permitir que el panel de despacho funcione mientras solucionamos los problemas de API

export const mockAlarms = [
  {
    id: 5,
    clientId: 1,
    accountNumber: "9904",
    clientName: "Casa Juan Vasquez",
    type: "panic",
    status: "dispatched",
    description: "Alarma pánico",
    address: "Calle 20 sur n 36-191",
    city: "Medellín",
    state: "Antioquia",
    location: "Calle 20 sur n 36-191, Medellín, Antioquia",
    locationUrl: "https://www.google.com/maps/search/?api=1&query=calle20%20sur%20%20n%2036-191%2C%20medelin%2C%20antioquia",
    operatorName: "Administrador Sistema",
    createdAt: new Date(),
    dispatchedAt: new Date()
  }
];

export const mockPatrols = [
  {
    id: 1,
    vehicleCode: "P001",
    licensePlate: "ABC123",
    status: "available"
  },
  {
    id: 2,
    vehicleCode: "P002",
    licensePlate: "XYZ789",
    status: "available"
  }
];

export const mockAssignments = [];