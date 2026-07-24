const noveltyController = require('../src/controllers/noveltyController');

jest.mock('sequelize', () => ({
  Op: {
    or: Symbol.for('or'),
    in: Symbol.for('in'),
  },
}));

jest.mock('../src/models', () => ({
  Connection: {
    findAll: jest.fn(),
  },
  AcademicRecord: {
    findAll: jest.fn(),
  },
  Post: {
    findAll: jest.fn(),
  },
  Comment: {
    findAll: jest.fn(),
  },
  Student: {
    findAll: jest.fn(),
  },
  Vote: {
    findAll: jest.fn().mockResolvedValue([]),
  },
  User: {},
  Subject: {},
}), { virtual: true });

const { Connection, AcademicRecord, Post, Comment, Student } = require('../src/models');

describe('Novelty Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {},
      user: { id: 10 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    req.user = null;

    await noveltyController.getFeed(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return empty feed when user has no accepted contacts', async () => {
    Connection.findAll.mockResolvedValue([]);
    AcademicRecord.findAll.mockResolvedValue([]);
    Post.findAll.mockResolvedValue([]);
    Comment.findAll.mockResolvedValue([]);

    await noveltyController.getFeed(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
    });
  });

  it('should merge and sort academic events and posts', async () => {
    Connection.findAll.mockResolvedValue([
      { toJSON: () => ({ id_user: 10, id_connected_user: 20 }) },
    ]);
    Student.findAll.mockResolvedValue([{ user_id: 20 }]);

    AcademicRecord.findAll.mockResolvedValue([
      {
        id: 7,
        id_student: 20,
        status: 'approved',
        updatedAt: '2026-06-10T10:00:00.000Z',
        createdAt: '2026-06-09T10:00:00.000Z',
        User: { name: 'Ana', lastname: 'Lopez', avatar: '/avatar.png' },
        Subject: { name: 'Matematica I', code: 'MAT1' },
      },
    ]);

    Post.findAll.mockResolvedValue([
      {
        id: 15,
        id_author: 20,
        title: 'Hola red',
        content: 'Nuevo resumen disponible',
        created_at: '2026-06-11T10:00:00.000Z',
        Student: { User: { name: 'Ana', lastname: 'Lopez', avatar: '/avatar.png' } },
      },
    ]);

    Comment.findAll.mockResolvedValue([
      { target_type: 'post', target_id: 15 },
      { target_type: 'post', target_id: 15 },
      { target_type: 'academic_event', target_id: 7 },
    ]);

    await noveltyController.getFeed(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];

    expect(payload.data).toHaveLength(2);
    expect(payload.data[0].type).toBe('post');
    expect(payload.data[0].postId).toBe(15);
    expect(payload.data[0].commentCount).toBe(2);
    expect(payload.data[1].type).toBe('academic_event');
    expect(payload.data[1].eventType).toBe('approval');
    expect(payload.data[1].commentCount).toBe(1);
    expect(payload.pagination.total).toBe(2);
  });

  it('should include own posts when there are no contacts', async () => {
    Connection.findAll.mockResolvedValue([]);
    AcademicRecord.findAll.mockResolvedValue([]);
    Post.findAll.mockResolvedValue([
      {
        id: 4,
        id_author: 10,
        title: 'Mi post',
        content: 'Contenido propio',
        created_at: '2026-06-11T10:00:00.000Z',
        Student: { User: { name: 'Usuario', lastname: 'Actual', avatar: null } },
      },
    ]);
    Comment.findAll.mockResolvedValue([]);

    await noveltyController.getFeed(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].type).toBe('post');
    expect(payload.data[0].postId).toBe(4);
  });

  it('should return 500 on unexpected errors', async () => {
    Connection.findAll.mockRejectedValue(new Error('DB error'));

    await noveltyController.getFeed(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});