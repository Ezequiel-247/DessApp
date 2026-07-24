jest.mock('../src/models', () => {
  const Material = {
    update: jest.fn(),
    findAll: jest.fn(),
  };
  const Student = { findAll: jest.fn() };
  const User = { findAll: jest.fn() };
  const Subject = { findAll: jest.fn() };
  const StudyPlan = { findAll: jest.fn() };
  const Career = { findAll: jest.fn() };
  const StudentCareerEnrollment = { findAll: jest.fn() };
  const PlanSubject = { findAll: jest.fn() };
  const Report = {
    count: jest.fn(),
    findAll: jest.fn(),
  };
  const SystemConfig = {
    findAll: jest.fn(),
  };
  const Vote = {
    findAll: jest.fn(),
  };

  return {
    Material,
    Student,
    User,
    Subject,
    StudyPlan,
    Career,
    StudentCareerEnrollment,
    PlanSubject,
    Report,
    SystemConfig,
    Vote,
  };
}, { virtual: true });

const materialService = require('../src/materialService');
const { Report, Material, SystemConfig } = require('../src/models');

describe('materialService.suspendIfThresholdReached', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('suspende cuando alcanza umbral base sin rechazadas', async () => {
    SystemConfig.findAll.mockResolvedValue([]);

    Report.count
      .mockResolvedValueOnce(10) // pending
      .mockResolvedValueOnce(0)  // verified
      .mockResolvedValueOnce(0); // rejected

    const status = await materialService.suspendIfThresholdReached(55);

    expect(status).toBe('suspended');
    expect(Material.update).toHaveBeenCalledWith(
      { status: 'suspended' },
      { where: { id: 55 } }
    );
  });

  it('no suspende si hay rechazadas y no alcanza umbral efectivo', async () => {
    SystemConfig.findAll.mockResolvedValue([]);

    Report.count
      .mockResolvedValueOnce(10) // pending
      .mockResolvedValueOnce(0)  // verified
      .mockResolvedValueOnce(2); // rejected -> pending efectivo 12

    const status = await materialService.suspendIfThresholdReached(77);

    expect(status).toBeNull();
    expect(Material.update).not.toHaveBeenCalled();
  });

  it('suspende por verified cuando alcanza umbral efectivo', async () => {
    SystemConfig.findAll.mockResolvedValue([
      { key: 'verified_reports_threshold', value: '3' },
    ]);

    Report.count
      .mockResolvedValueOnce(0) // pending
      .mockResolvedValueOnce(5) // verified
      .mockResolvedValueOnce(2); // rejected -> verified efectivo 5

    const status = await materialService.suspendIfThresholdReached(88);

    expect(status).toBe('suspended');
    expect(Material.update).toHaveBeenCalledWith(
      { status: 'suspended' },
      { where: { id: 88 } }
    );
  });
});

describe('materialService.getMaterialsWithFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Material.findAll.mockResolvedValue([]);
  });

  it('excluye suspendidos por defecto', async () => {
    await materialService.getMaterialsWithFilters({});

    expect(Material.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'active' }),
      })
    );
  });

  it('incluye suspendidos cuando show_suspended=true', async () => {
    await materialService.getMaterialsWithFilters({ show_suspended: 'true' });

    const firstCall = Material.findAll.mock.calls[0][0];
    expect(firstCall.where.status).toBeUndefined();
  });
});
