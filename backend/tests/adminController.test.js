const adminController = require('../src/controllers/adminController');
const { adminsMock, usersMock } = require('./mocks/mockData');

const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

jest.mock('../src/models', () => ({
  Admin: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  User: {
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  sequelize: {
    transaction: jest.fn()
  }
}), { virtual: true });

const { Admin, User, sequelize } = require('../src/models');

describe('Admin Controller', () => {
  let req, res;

  const buildUserInstance = (data) => ({
    ...data,
    toJSON: () => ({ ...data })
  });

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe('getAll', () => {
    it('should return all admins with status 200', async () => {
      Admin.findAll.mockResolvedValue(adminsMock);
      await adminController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: adminsMock });
    });

    it('should return 500 on error', async () => {
      Admin.findAll.mockRejectedValue(new Error('DB error'));
      await adminController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById', () => {
    it('should return an admin by id with status 200', async () => {
      req.params.id = 1;
      Admin.findByPk.mockResolvedValue(adminsMock[0]);
      await adminController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: adminsMock[0] });
    });

    it('should return 404 if admin not found', async () => {
      req.params.id = 999;
      Admin.findByPk.mockResolvedValue(null);
      await adminController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin not found' });
    });
  });

  describe('create', () => {
    it('should create user + admin atomically and return status 201', async () => {
      const payload = {
        email: 'newadmin@test.com',
        password: 'secret123',
        name: 'New',
        lastname: 'Admin',
        cuil: '20-98765432-1',
        role: 'admin',
      };
      req.body = payload;

      const createdUser = buildUserInstance({ id: 4, email: payload.email, name: payload.name, lastname: payload.lastname, role: 'admin', is_active: true });
      const createdAdmin = { id: 2, id_users: 4, cuil: payload.cuil, role: payload.role };

      User.create.mockResolvedValue(createdUser);
      Admin.create.mockResolvedValue(createdAdmin);

      await adminController.create(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: payload.email, role: 'admin' }),
        { transaction: mockTransaction }
      );
      expect(Admin.create).toHaveBeenCalledWith(
        expect.objectContaining({ id_users: 4, cuil: payload.cuil }),
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin created successfully',
        data: expect.objectContaining({ id: 4, email: payload.email, admin: createdAdmin })
      });
    });

    it('should rollback and return 500 on error', async () => {
      User.create.mockRejectedValue(new Error('DB error'));
      req.body = { email: 'fail@test.com', password: 'pass', name: 'Fail', lastname: 'User', cuil: '20-11111111-1' };

      await adminController.create(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update', () => {
    it('should update user + admin and return status 200', async () => {
      req.params.id = 1;
      req.body = { email: 'updated@test.com', name: 'Updated', role: 'superadmin' };

      Admin.findByPk.mockResolvedValue({ id: 1, id_users: 1 });
      Admin.update.mockResolvedValue([1]);
      Admin.findByPk.mockResolvedValue({ ...adminsMock[0], role: 'superadmin' });

      await adminController.update(req, res);

      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'updated@test.com', name: 'Updated' }),
        { where: { id: 1 }, transaction: mockTransaction, individualHooks: true }
      );
      expect(Admin.update).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'superadmin' }),
        { where: { id: 1 }, transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if admin not found', async () => {
      req.params.id = 999;
      Admin.findByPk.mockResolvedValue(null);

      await adminController.update(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete the linked user (cascade to admin) and return status 200', async () => {
      req.params.id = 1;
      Admin.findByPk.mockResolvedValue({ id: 1, id_users: 1 });
      User.destroy.mockResolvedValue(1);

      await adminController.delete(req, res);

      expect(User.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if admin not found', async () => {
      req.params.id = 999;
      Admin.findByPk.mockResolvedValue(null);

      await adminController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
