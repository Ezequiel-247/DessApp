const { validateUserData } = require('../src/middlewares/userMiddleware');
const validator = require('validator');

// Mock de la librería validator
jest.mock('validator', () => ({
  isEmail: jest.fn(),
}));

describe('Middleware de Usuario - validateUserData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, method: 'POST' }; // Por defecto a POST para pruebas de creación
    res = {
      status: jest.fn().mockReturnThis(), // Permite encadenar res.status().json()
      json: jest.fn(),
    };
    next = jest.fn(); // Mock de la función next()
    jest.clearAllMocks();

    // Mock por defecto para isEmail que retorne true para correos válidos
    validator.isEmail.mockReturnValue(true);
  });

  // --- Condiciones exitosas (POST - Crear Usuario) ---
  describe('POST /user (Crear Usuario)', () => {
    it('debería llamar a next() si todos los campos obligatorios son válidos', () => {
      req.body = {
        email: 'test@example.com',
        password: 'securepassword',
        name: 'John',
        lastname: 'Doe',
        is_active: true,
        role: 'student',
      };

      validateUserData(req, res, next);

      expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('debería llamar a next() si se omiten role y is_active (por defecto es student)', () => {
      req.body = {
        email: 'test@example.com',
        password: 'securepassword',
        name: 'John',
        lastname: 'Doe',
      };

      validateUserData(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // --- Condiciones exitosas (PUT - Actualizar Usuario) ---
  describe('PUT /user/:id (Actualizar Usuario)', () => {
    beforeEach(() => {
      req.method = 'PUT'; // Configurar método en PUT para las pruebas de actualización
    });

    it('debería llamar a next() si todos los campos son válidos', () => {
      req.body = {
        email: 'updated@example.com',
        password: 'newsecurepassword',
        name: 'Jane',
        lastname: 'Smith',
        is_active: false,
        role: 'admin',
      };

      validateUserData(req, res, next);

      expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('debería llamar a next() si se omite la contraseña', () => {
      req.body = {
        email: 'updated@example.com',
        name: 'Jane',
        lastname: 'Smith',
      };

      validateUserData(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería llamar a next() si solo se proporcionan algunos campos (actualización parcial)', () => {
      req.body = {
        name: 'Jane',
      };
      // Mock de isEmail en true incluso si email no está en el body, ya que no es obligatorio en PUT
      // (El controlador obtendría el email existente en caso de no enviarse)
      validator.isEmail.mockReturnValue(true); 

      validateUserData(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // --- Condiciones de error ---

  describe('Validación de Email', () => {
    it('debería retornar 400 si falta el email', () => {
      req.body = { password: 'securepassword', name: 'John', lastname: 'Doe' };
      validator.isEmail.mockReturnValue(false); // Forzar que isEmail falle explícitamente

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Valid email is required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si el email es inválido', () => {
      req.body = { email: 'invalid-email', password: 'securepassword', name: 'John', lastname: 'Doe' };
      validator.isEmail.mockReturnValue(false);

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Valid email is required' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Validación de Contraseña', () => {
    it('debería retornar 400 si falta la contraseña para POST (crear)', () => {
      req.body = { email: 'test@example.com', name: 'John', lastname: 'Doe' };

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Password is required and must be at least 6 characters long' });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si la contraseña es muy corta para POST (crear)', () => {
      req.body = { email: 'test@example.com', password: 'short', name: 'John', lastname: 'Doe' };

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Password is required and must be at least 6 characters long' });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si la contraseña es muy corta en PUT (actualizar) cuando se proporciona', () => {
      req.method = 'PUT';
      req.body = { email: 'test@example.com', password: 'short', name: 'John', lastname: 'Doe' };

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Password must be at least 6 characters long if provided' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Validación del Nombre (name)', () => {
    it('debería retornar 400 si falta el nombre (name)', () => {
      req.body = { email: 'test@example.com', password: 'securepassword', lastname: 'Doe' };

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Name is required and must be at least 2 characters long' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if name is too short', () => {
      req.body = { email: 'test@example.com', password: 'securepassword', name: 'J', lastname: 'Doe' };

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Name must be at least 2 characters long' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Lastname Validation', () => {
    it('should return 400 if lastname is missing', () => {
      req.body = { email: 'test@example.com', password: 'securepassword', name: 'John' };

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Lastname is required and must be at least 2 characters long' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if lastname is too short', () => {
      req.body = { email: 'test@example.com', password: 'securepassword', name: 'John', lastname: 'D' };

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Lastname must be at least 2 characters long' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Role Validation', () => {
    it('should return 400 if role is invalid', () => {
      req.body = { email: 'test@example.com', password: 'securepassword', name: 'John', lastname: 'Doe', role: 'invalid_role' };

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Invalid role. Must be "student" or "admin"' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Validación de is_active', () => {
    it('debería retornar 400 si is_active no es un valor booleano', () => {
      req.body = { email: 'test@example.com', password: 'securepassword', name: 'John', lastname: 'Doe', is_active: 'true' }; // string en lugar de booleano

      validateUserData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'is_active must be a boolean' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});