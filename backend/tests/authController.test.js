const authController = require('../src/controllers/authController');

// sequelize viene de config/database (no del index de modelos) → mock obligatorio
jest.mock('../src/config/database', () => ({
  sequelize: { transaction: jest.fn() },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../src/models/user', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  scope: jest.fn(),
}));

jest.mock('../src/models/student', () => ({
  create: jest.fn(),
}));

jest.mock('../src/models/admin', () => ({
  create: jest.fn(),
}));

jest.mock('../src/models/career', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../src/models/studyPlan', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../src/models/studentCareerEnrollment', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const { sequelize } = require('../src/config/database');
const { validationResult } = require('express-validator');
const User = require('../src/models/user');
const Student = require('../src/models/student');

const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedpassword',
  name: 'Test',
  lastname: 'User',
  role: 'student',
  is_active: true,
  toJSON: function () {
    const obj = { ...this };
    delete obj.password;
    return obj;
  },
};

const mockUserWithPassword = {
  ...mockUser,
  validatePassword: jest.fn(),
  toJSON: function () {
    const obj = { ...this };
    delete obj.password;
    return obj;
  },
};

describe('Auth Controller', () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    req = { body: {}, headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    // Evita ruido en salida cuando se prueban ramas de error esperadas.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
  });

  describe('register', () => {
    it('should register a student and return 201 with token', async () => {
      req.body = { email: 'new@test.com', password: 'password', name: 'New', lastname: 'User', role: 'student' };
      User.findOne.mockResolvedValue(null);
      const createdUser = { ...mockUser, id: 2, email: 'new@test.com' };
      User.create.mockResolvedValue(createdUser);
      Student.create.mockResolvedValue({ user_id: 2 });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User registered successfully', token: 'mock-token' })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should return 400 if email already exists', async () => {
      req.body = { email: 'existing@test.com', password: 'password' };
      User.findOne.mockResolvedValue(mockUser);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already in use' });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should return 400 if express-validator found validation errors', async () => {
      validationResult.mockReturnValueOnce({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid email' }],
      });
      req.body = {};

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid email' }] });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should return 500 and rollback on unexpected DB error', async () => {
      req.body = { email: 'new@test.com', password: 'password', name: 'New', lastname: 'User', role: 'student' };
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Unexpected DB failure'));

      await authController.register(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Server error during registration' })
      );
    });
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      req.body = { email: 'test@example.com', password: 'password' };
      User.scope = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          ...mockUserWithPassword,
          validatePassword: jest.fn().mockResolvedValue(true),
        }),
      });

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Login successful', token: 'mock-token' })
      );
    });

    it('should return 401 if email not found', async () => {
      req.body = { email: 'notfound@test.com', password: 'password' };
      User.scope = jest.fn().mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email not found' });
    });

    it('should return 401 if password is incorrect', async () => {
      req.body = { email: 'test@example.com', password: 'wrong' };
      User.scope = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          ...mockUserWithPassword,
          validatePassword: jest.fn().mockResolvedValue(false),
        }),
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Incorrect password' });
    });

    it('should return 401 if account is inactive', async () => {
      req.body = { email: 'test@example.com', password: 'password' };
      User.scope = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ ...mockUserWithPassword, is_active: false }),
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Account is inactive' });
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { email: 'test@example.com', password: 'password' };
      User.scope = jest.fn().mockReturnValue({
        findOne: jest.fn().mockRejectedValue(new Error('DB down')),
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('me', () => {
    it('should return the current user wrapped in data', async () => {
      req.user = mockUser;

      await authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith({ data: mockUser });
    });
  });
});
