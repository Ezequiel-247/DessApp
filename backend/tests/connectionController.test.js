const connectionController = require('../src/controllers/connectionController');
const { connectionsMock } = require('./mocks/mockData');

jest.mock('sequelize', () => ({
  Op: {
    or: Symbol.for('or'),
    iLike: Symbol.for('iLike'),
    in: Symbol.for('in'),
  },
}));

jest.mock('../src/models', () => ({
  Connection: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  User: {
    findOne: jest.fn(),
  },
  Notification: {
    create: jest.fn(),
  },
}), { virtual: true });

jest.mock('../src/emailService', () => ({
  sendConnectionInvitationEmail: jest.fn(),
  sendInviteeNotRegisteredEmail: jest.fn(),
}), { virtual: true });

const { Op } = require('sequelize');
const { Connection, Notification, User } = require('../src/models');
const {
  sendConnectionInvitationEmail,
  sendInviteeNotRegisteredEmail,
} = require('../src/emailService');

describe('Connection Controller', () => {
  let req, res;
  const asInstance = (value) => ({ toJSON: () => value });

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      Connection.findAll.mockResolvedValue(connectionsMock.map(asInstance));
      await connectionController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by userId query param', async () => {
      req.query.userId = '2';
      Connection.findAll.mockResolvedValue([asInstance(connectionsMock[0])]);
      await connectionController.getAll(req, res);
      expect(Connection.findAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [{ id_user: '2' }, { id_connected_user: '2' }],
        },
        include: expect.any(Array),
      });
    });

    it('should filter by status query param', async () => {
      req.query.status = 'accepted';
      Connection.findAll.mockResolvedValue([asInstance(connectionsMock[0])]);
      await connectionController.getAll(req, res);
      expect(Connection.findAll).toHaveBeenCalledWith({
        where: { status: 'accepted' },
        include: expect.any(Array),
      });
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      Connection.findByPk.mockResolvedValue(connectionsMock[0]);
      await connectionController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Connection.findByPk.mockResolvedValue(null);
      await connectionController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_user: 2, id_connected_user: 3, status: 'pending' };
      Connection.create.mockResolvedValue({ id: 2, ...req.body });
      await connectionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { status: 'accepted' };
      Connection.update.mockResolvedValue([1]);
      Connection.findByPk.mockResolvedValue({ ...connectionsMock[0], status: 'accepted' });
      await connectionController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      Connection.destroy.mockResolvedValue(1);
      await connectionController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Connection.destroy.mockResolvedValue(0);
      await connectionController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Connection.destroy.mockRejectedValue(new Error('DB error'));
      await connectionController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      Connection.findAll.mockRejectedValue(new Error('DB error'));
      await connectionController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      Connection.findByPk.mockRejectedValue(new Error('DB error'));
      await connectionController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 409 on duplicate', async () => {
      req.body = { id_user: 1, id_connected_user: 2 };
      Connection.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await connectionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on error', async () => {
      req.body = { id_user: 1, id_connected_user: 2 };
      Connection.create.mockRejectedValue(new Error('DB error'));
      await connectionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { status: 'rejected' };
      Connection.update.mockResolvedValue([0]);
      await connectionController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { status: 'rejected' };
      Connection.update.mockRejectedValue(new Error('DB error'));
      await connectionController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('inviteByEmail', () => {
    beforeEach(() => {
      req.user = { id: 1, email: 'student1@example.com', name: 'Ana', lastname: 'Lopez' };
    });

    it('should notify inviter when target email is not registered', async () => {
      req.body = { email: 'ghost@example.com' };
      User.findOne.mockResolvedValue(null);

      await connectionController.inviteByEmail(req, res);

      expect(sendInviteeNotRegisteredEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ invited: false }));
    });

    it('should return 400 when user invites themself', async () => {
      req.body = { email: 'student1@example.com' };
      User.findOne.mockResolvedValue({ id: 1, email: 'student1@example.com' });

      await connectionController.inviteByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 when there is already a pending connection', async () => {
      req.body = { email: 'student2@example.com' };
      User.findOne.mockResolvedValue({ id: 2, email: 'student2@example.com' });
      Connection.findOne.mockResolvedValue({ id: 99 });

      await connectionController.inviteByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should create invitation and send email for registered user', async () => {
      req.body = { email: 'student2@example.com' };
      User.findOne.mockResolvedValue({ id: 2, email: 'student2@example.com' });
      Connection.findOne.mockResolvedValue(null);
      Connection.create.mockResolvedValue({ id: 15, id_user: 1, id_connected_user: 2, status: 'pending' });

      await connectionController.inviteByEmail(req, res);

      expect(Connection.create).toHaveBeenCalledWith(expect.objectContaining({
        id_user: 1,
        id_connected_user: 2,
        status: 'pending',
        target_email: 'student2@example.com',
        invitation_token: expect.any(String),
      }));
      expect(sendConnectionInvitationEmail).toHaveBeenCalled();
      expect(Notification.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getInvitationByToken', () => {
    it('should return 404 when token does not exist', async () => {
      req.params.token = 'abc';
      req.user = { id: 2 };
      Connection.findOne.mockResolvedValue(null);

      await connectionController.getInvitationByToken(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when requester is not invitee', async () => {
      req.params.token = 'abc';
      req.user = { id: 9 };
      Connection.findOne.mockResolvedValue({ id_connected_user: 2 });

      await connectionController.getInvitationByToken(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('respondInvitation', () => {
    it('should update status and return 200 on accept', async () => {
      req.params.token = 'token-ok';
      req.body = { action: 'accept' };
      req.user = { id: 2, name: 'Carlos' };

      Connection.findOne.mockResolvedValue({
        id: 10,
        id_user: 1,
        id_connected_user: 2,
        status: 'pending',
      });
      Connection.update.mockResolvedValue([1]);
      Connection.findByPk.mockResolvedValue({ id: 10, status: 'accepted' });

      await connectionController.respondInvitation(req, res);

      expect(Connection.update).toHaveBeenCalledWith(
        { status: 'accepted', invitation_token: null },
        { where: { id: 10 } }
      );
      expect(Notification.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 409 when invitation already has response', async () => {
      req.params.token = 'token-old';
      req.body = { action: 'reject' };
      req.user = { id: 2, name: 'Carlos' };

      Connection.findOne.mockResolvedValue({
        id: 10,
        id_user: 1,
        id_connected_user: 2,
        status: 'accepted',
      });

      await connectionController.respondInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });
});
