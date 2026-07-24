const planUnahurBlockController = require('../src/controllers/planUnahurBlockController');
const planElectiveBlockController = require('../src/controllers/planElectiveBlockController');
const planCreditBlockController = require('../src/controllers/planCreditBlockController');

jest.mock('../src/models', () => ({
  PlanUnahurBlock: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  PlanElectiveBlock: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  PlanElectiveBlockSubject: {
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  PlanCreditBlock: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}), { virtual: true });

const { PlanUnahurBlock, PlanElectiveBlock, PlanElectiveBlockSubject, PlanCreditBlock } = require('../src/models');

const unahurBlockMock = { id: 1, id_study_plan: 1, suggested_year: 3, suggested_term: null, sort_order: 1 };
const electiveBlockMock = { id: 1, id_study_plan: 1, name: 'Electivas', min_required: 2, requires_approved_mandatory_count: 0, suggested_year: 4, sort_order: 1 };
const electiveBlockSubjectMock = { id: 1, id_elective_block: 1, id_plan_subject: 25 };
const creditBlockMock = { id: 1, id_study_plan: 1, name: 'Actividades', min_credits_required: 5, max_credits_allowed: 10, sort_order: 1 };

function buildReq(overrides = {}) {
  return { params: {}, body: {}, query: {}, ...overrides };
}
function buildRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── PlanUnahurBlockController ───────────────────────────────────────────────

describe('PlanUnahurBlock Controller', () => {
  describe('getAll', () => {
    it('should return all blocks for a plan with status 200', async () => {
      const req = buildReq({ params: { planId: '1' } });
      const res = buildRes();
      PlanUnahurBlock.findAll.mockResolvedValue([unahurBlockMock]);
      await planUnahurBlockController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [unahurBlockMock] });
    });

    it('should return 500 on error', async () => {
      PlanUnahurBlock.findAll.mockRejectedValue(new Error('DB error'));
      await planUnahurBlockController.getAll(buildReq({ params: { planId: '1' } }), buildRes());
    });
  });

  describe('getById', () => {
    it('should return block by id with status 200', async () => {
      const req = buildReq({ params: { id: '1' } });
      const res = buildRes();
      PlanUnahurBlock.findByPk.mockResolvedValue(unahurBlockMock);
      await planUnahurBlockController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      const req = buildReq({ params: { id: '999' } });
      const res = buildRes();
      PlanUnahurBlock.findByPk.mockResolvedValue(null);
      await planUnahurBlockController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      const req = buildReq({ params: { planId: '1' }, body: { suggested_year: 3 } });
      const res = buildRes();
      PlanUnahurBlock.create.mockResolvedValue(unahurBlockMock);
      await planUnahurBlockController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 500 on error', async () => {
      PlanUnahurBlock.create.mockRejectedValue(new Error('DB error'));
      await planUnahurBlockController.create(buildReq({ params: { planId: '1' }, body: { suggested_year: 3 } }), buildRes());
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      const req = buildReq({ params: { id: '1' }, body: { suggested_year: 4 } });
      const res = buildRes();
      PlanUnahurBlock.update.mockResolvedValue([1]);
      PlanUnahurBlock.findByPk.mockResolvedValue({ ...unahurBlockMock, suggested_year: 4 });
      await planUnahurBlockController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      const req = buildReq({ params: { id: '999' }, body: { suggested_year: 4 } });
      const res = buildRes();
      PlanUnahurBlock.update.mockResolvedValue([0]);
      await planUnahurBlockController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      const req = buildReq({ params: { id: '1' } });
      const res = buildRes();
      PlanUnahurBlock.destroy.mockResolvedValue(1);
      await planUnahurBlockController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      const req = buildReq({ params: { id: '999' } });
      const res = buildRes();
      PlanUnahurBlock.destroy.mockResolvedValue(0);
      await planUnahurBlockController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      PlanUnahurBlock.destroy.mockRejectedValue(new Error('DB error'));
      await planUnahurBlockController.delete(buildReq({ params: { id: '1' } }), buildRes());
    });
  });
});

// ─── PlanElectiveBlockController ─────────────────────────────────────────────

describe('PlanElectiveBlock Controller', () => {
  describe('getAll', () => {
    it('should return all blocks for a plan with status 200', async () => {
      const req = buildReq({ params: { planId: '1' } });
      const res = buildRes();
      PlanElectiveBlock.findAll.mockResolvedValue([electiveBlockMock]);
      await planElectiveBlockController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getById', () => {
    it('should return block by id with status 200', async () => {
      const req = buildReq({ params: { id: '1' } });
      const res = buildRes();
      PlanElectiveBlock.findByPk.mockResolvedValue(electiveBlockMock);
      await planElectiveBlockController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      const req = buildReq({ params: { id: '999' } });
      const res = buildRes();
      PlanElectiveBlock.findByPk.mockResolvedValue(null);
      await planElectiveBlockController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      const req = buildReq({ params: { planId: '1' }, body: { name: 'Nuevo Bloque' } });
      const res = buildRes();
      PlanElectiveBlock.create.mockResolvedValue(electiveBlockMock);
      await planElectiveBlockController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 409 on duplicate', async () => {
      PlanElectiveBlock.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      const req = buildReq({ params: { planId: '1' }, body: { name: 'Dup' } });
      const res = buildRes();
      await planElectiveBlockController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('getBlockSubjects', () => {
    it('should return subjects with status 200', async () => {
      const req = buildReq({ params: { blockId: '1' } });
      const res = buildRes();
      PlanElectiveBlockSubject.findAll.mockResolvedValue([electiveBlockSubjectMock]);
      await planElectiveBlockController.getBlockSubjects(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addBlockSubject', () => {
    it('should add and return status 201', async () => {
      const req = buildReq({ params: { blockId: '1' }, body: { id_plan_subject: 25 } });
      const res = buildRes();
      PlanElectiveBlockSubject.create.mockResolvedValue(electiveBlockSubjectMock);
      await planElectiveBlockController.addBlockSubject(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 409 on duplicate', async () => {
      PlanElectiveBlockSubject.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      const req = buildReq({ params: { blockId: '1' }, body: { id_plan_subject: 25 } });
      const res = buildRes();
      await planElectiveBlockController.addBlockSubject(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('removeBlockSubject', () => {
    it('should remove and return status 200', async () => {
      const req = buildReq({ params: { subjectId: '1' } });
      const res = buildRes();
      PlanElectiveBlockSubject.destroy.mockResolvedValue(1);
      await planElectiveBlockController.removeBlockSubject(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      PlanElectiveBlockSubject.destroy.mockResolvedValue(0);
      const res = buildRes();
      await planElectiveBlockController.removeBlockSubject(buildReq({ params: { subjectId: '999' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

// ─── PlanCreditBlockController ───────────────────────────────────────────────

describe('PlanCreditBlock Controller', () => {
  describe('getAll', () => {
    it('should return all blocks for a plan with status 200', async () => {
      const req = buildReq({ params: { planId: '1' } });
      const res = buildRes();
      PlanCreditBlock.findAll.mockResolvedValue([creditBlockMock]);
      await planCreditBlockController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getById', () => {
    it('should return block by id with status 200', async () => {
      PlanCreditBlock.findByPk.mockResolvedValue(creditBlockMock);
      await planCreditBlockController.getById(buildReq({ params: { id: '1' } }), buildRes());
    });

    it('should return 404 if not found', async () => {
      PlanCreditBlock.findByPk.mockResolvedValue(null);
      const res = buildRes();
      await planCreditBlockController.getById(buildReq({ params: { id: '999' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      const req = buildReq({ params: { planId: '1' }, body: { name: 'Créditos' } });
      const res = buildRes();
      PlanCreditBlock.create.mockResolvedValue(creditBlockMock);
      await planCreditBlockController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 409 on duplicate', async () => {
      PlanCreditBlock.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      const req = buildReq({ params: { planId: '1' }, body: { name: 'Dup' } });
      const res = buildRes();
      await planCreditBlockController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      PlanCreditBlock.update.mockResolvedValue([1]);
      PlanCreditBlock.findByPk.mockResolvedValue(creditBlockMock);
      const res = buildRes();
      await planCreditBlockController.update(buildReq({ params: { id: '1' }, body: { name: 'Updated' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      PlanCreditBlock.update.mockResolvedValue([0]);
      const res = buildRes();
      await planCreditBlockController.update(buildReq({ params: { id: '999' }, body: { name: 'Updated' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      PlanCreditBlock.destroy.mockResolvedValue(1);
      const res = buildRes();
      await planCreditBlockController.delete(buildReq({ params: { id: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      PlanCreditBlock.destroy.mockResolvedValue(0);
      const res = buildRes();
      await planCreditBlockController.delete(buildReq({ params: { id: '999' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
