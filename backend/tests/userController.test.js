const userController = require('../src/controllers/userController');
const { usersMock, studentsMock, adminsMock } = require('./mocks/mockData'); // Assuming userMock is part of mockData.js

// Mockeamos de forma virtual los modelos de Sequelize
jest.mock('../src/models', () => ({
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    // Mock toJSON for instances returned by Sequelize methods
    // This is important because the controller calls user.toJSON()
    // and then deletes the password property from the result.
    // We need to simulate a Sequelize instance behavior.
    build: jest.fn((data) => ({
      ...data,
      toJSON: () => ({ ...data }),
    })),
  },
  Student: {
    // Mock Student model if needed for includes, but for userController, User.findAll/findByPk handles it
  },
  Admin: {
    // Mock Admin model if needed for includes
  },
}), { virtual: true });

const { User, Student, Admin } = require('../src/models');

describe('User Controller - CRUD', () => {
  let req, res;
  let consoleErrorSpy;

  // Helper to create a user object without password for assertions
  const userWithoutPassword = (user) => {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  };

  beforeEach(() => {
    // Reset mocks for req and res before each test
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(), // Allows chaining res.status().json()
      json: jest.fn(),
    };
    jest.clearAllMocks();

    // Reset mock implementations for Sequelize models
    User.findAll.mockReset();
    User.findByPk.mockReset();
    User.create.mockReset();
    User.update.mockReset();
    User.destroy.mockReset();

    // Default mock for User.build to simulate Sequelize instance behavior
    User.build.mockImplementation((data) => ({
      ...data,
      toJSON: () => ({ ...data }),
    }));

    // Evita ruido en salida cuando se prueban ramas de error esperadas.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
  });

  describe('getAll', () => {
    it('should get all users and return status 200, excluding passwords', async () => {
      // Simulate Sequelize returning instances with toJSON method
      const mockUsersInstances = usersMock.map(user => User.build(user));
      User.findAll.mockResolvedValue(mockUsersInstances);

      await userController.getAll(req, res);

      expect(User.findAll).toHaveBeenCalledWith({
        include: [
          { model: Student, as: 'student' },
          { model: Admin, as: 'admin' },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.length).toBe(usersMock.length);
      expect(responseData[0]).not.toHaveProperty('password');
      expect(responseData[1]).not.toHaveProperty('password');
      expect(responseData[2]).not.toHaveProperty('password');
      expect(responseData).toEqual(usersMock.map(userWithoutPassword));
    });

    it('should handle errors and return status 500', async () => {
      const errorMessage = 'Database error';
      User.findAll.mockRejectedValue(new Error(errorMessage));

      await userController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching users', details: errorMessage });
    });
  });

  describe('getMe', () => {
    it('should return 501 Not Implemented', async () => {
      await userController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not Implemented: getMe' });
    });
  });

  describe('getById', () => {
    it('should get a user by its ID and return status 200, excluding password', async () => {
      req.params.id = 1;
      const mockUser = usersMock[0];
      // Simulate Sequelize returning an instance with toJSON method
      const mockUserInstance = User.build(mockUser);
      User.findByPk.mockResolvedValue(mockUserInstance);

      await userController.getById(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(req.params.id, {
        include: [
          { model: Student, as: 'student' },
          { model: Admin, as: 'admin' },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: userWithoutPassword(mockUser) });
    });

    it('should return status 404 if the user does not exist', async () => {
      req.params.id = 999; // Non-existent ID
      User.findByPk.mockResolvedValue(null);

      await userController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle errors and return status 500', async () => {
      req.params.id = 1;
      const errorMessage = 'Database error';
      User.findByPk.mockRejectedValue(new Error(errorMessage));

      await userController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching user', details: errorMessage });
    });
  });

  describe('create', () => {
    it('should create a new user and return status 201', async () => {
      const newUserPayload = {
        email: 'newuser@example.com',
        password: 'newpassword',
        name: 'New',
        lastname: 'User',
        is_active: true,
        role: 'admin',
      };
      req.body = newUserPayload;

      const createdUser = {
        id: 4,
        ...newUserPayload,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      User.create.mockResolvedValue(User.build(createdUser));

      await userController.create(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: newUserPayload.email,
          password: newUserPayload.password,
          role: newUserPayload.role,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        data: userWithoutPassword(createdUser),
      });
    });

    it('should default role to "student" if not provided', async () => {
      const newUserPayload = {
        email: 'defaultrole@example.com',
        password: 'defaultpassword',
        name: 'Default',
        lastname: 'Role',
        is_active: true,
      };
      req.body = newUserPayload;

      const createdUser = {
        id: 5,
        ...newUserPayload,
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      User.create.mockResolvedValue(User.build(createdUser));

      await userController.create(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: newUserPayload.email,
          role: 'student',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        data: userWithoutPassword(createdUser),
      });
    });

    it('should handle errors and return status 500', async () => {
      req.body = { email: 'invalid@example.com', password: 'pass' };
      const errorMessage = 'Validation error';
      User.create.mockRejectedValue(new Error(errorMessage));

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error creating user', details: errorMessage });
    });
  });

  describe('update', () => {
    it('should update an existing user and return status 200, hashing password via model hook', async () => {
      req.params.id = 1;
      const updatePayload = {
        name: 'Updated',
        password: 'newpassword',
      };
      req.body = updatePayload;

      User.update.mockResolvedValue([1]);
      const updatedUser = { ...usersMock[0], ...updatePayload };
      User.findByPk.mockResolvedValue(User.build(updatedUser));

      await userController.update(req, res);

      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updatePayload.name,
          password: updatePayload.password,
        }),
        { where: { id: req.params.id }, individualHooks: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User updated successfully',
        data: userWithoutPassword(updatedUser),
      });
    });

    it('should return status 404 if user to update is not found', async () => {
      req.params.id = 999;
      req.body = { name: 'NonExistent' };
      User.update.mockResolvedValue([0]);

      await userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found or no changes made' });
    });

    it('should handle errors and return status 500', async () => {
      req.params.id = 1;
      req.body = { first_name: 'Error' };
      const errorMessage = 'Database error';
      User.update.mockRejectedValue(new Error(errorMessage));

      await userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error updating user', details: errorMessage });
    });
  });

  describe('delete', () => {
    it('should delete a user and return status 200', async () => {
      req.params.id = 1;
      User.destroy.mockResolvedValue(1); // 1 row deleted

      await userController.delete(req, res);

      expect(User.destroy).toHaveBeenCalledWith({ where: { id: req.params.id } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should return status 404 if user to delete is not found', async () => {
      req.params.id = 999;
      User.destroy.mockResolvedValue(0); // 0 rows deleted

      await userController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle errors and return status 500', async () => {
      req.params.id = 1;
      const errorMessage = 'Database error';
      User.destroy.mockRejectedValue(new Error(errorMessage));

      await userController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error deleting user', details: errorMessage });
    });
  });
});