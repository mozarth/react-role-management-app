import bcrypt from 'bcrypt';
import { UserRole } from '../shared/schema';
import { storage } from './storage';

/**
 * Controlador para crear un supervisor desde un despachador
 */
async function createSupervisor(req, res) {
  try {
    console.log('Intento de creación de supervisor:', {
      ...req.body,
      password: '[OCULTA]'
    });

    // Verifica que sea un despachador quien hace la solicitud
    const requestingUserRole = req.session?.user?.role;
    if (requestingUserRole !== UserRole.DISPATCHER) {
      return res.status(403).json({
        success: false,
        message: 'Solo los despachadores pueden usar esta función'
      });
    }

    // Validar datos de entrada
    const { 
      username, 
      password, 
      firstName, 
      lastName, 
      email, 
      phone, 
      identificationNumber,
      whatsappNumber,
      motorcyclePlate
    } = req.body;

    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de usuario debe tener al menos 3 caracteres'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña debe tener al menos 6 caracteres'
      });
    }

    if (!firstName) {
      return res.status(400).json({
        success: false,
        message: 'Nombre es obligatorio'
      });
    }

    if (!lastName) {
      return res.status(400).json({
        success: false,
        message: 'Apellido es obligatorio'
      });
    }
    
    if (!identificationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de identificación es obligatorio'
      });
    }
    
    if (!whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de WhatsApp es obligatorio'
      });
    }
    
    if (!motorcyclePlate) {
      return res.status(400).json({
        success: false,
        message: 'Placa de motocicleta es obligatoria'
      });
    }

    // Comprobar si el usuario ya existe
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el supervisor
    const creatorId = req.session?.user?.id;
    const newSupervisor = await storage.createUser({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      role: UserRole.SUPERVISOR,
      createdBy: creatorId,
      identificationNumber,
      whatsappNumber,
      motorcyclePlate
    });

    console.log('Supervisor creado exitosamente:', {
      id: newSupervisor.id,
      username: newSupervisor.username
    });

    // No devolver la contraseña
    const { password: _, ...supervisorWithoutPassword } = newSupervisor;

    return res.status(201).json({
      success: true,
      message: 'Supervisor creado exitosamente',
      data: supervisorWithoutPassword
    });
  } catch (error) {
    console.error('Error al crear supervisor:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear supervisor: ' + (error.message || 'Error desconocido')
    });
  }
}

module.exports = {
  createSupervisor
};