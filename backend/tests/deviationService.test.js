const deviationService = require('../src/services/deviationService');

jest.mock('../src/models', () => ({
  CustomStudyPlan: {
    findByPk: jest.fn(),
  },
  CustomStudyPlanItem: {},
  PlanSubject: {},
  Subject: {},
  AcademicRecord: {
    findAll: jest.fn(),
  },
  FinalExam: {},
}), { virtual: true });

const { CustomStudyPlan, AcademicRecord } = require('../src/models');

describe('DeviationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if plan not found', async () => {
    CustomStudyPlan.findByPk.mockResolvedValue(null);
    await expect(deviationService.getDeviationMetrics(2, 999)).rejects.toThrow('Custom study plan not found');
  });

  it('should throw if plan belongs to another student', async () => {
    CustomStudyPlan.findByPk.mockResolvedValue({ id: 1, id_student: 3, name: 'Other Plan', items: [] });
    await expect(deviationService.getDeviationMetrics(2, 1)).rejects.toThrow('Plan does not belong to this student');
  });

  it('should return empty metrics when no completed items', async () => {
    CustomStudyPlan.findByPk.mockResolvedValue({
      id: 1,
      id_student: 2,
      name: 'My Plan',
      items: [],
    });
    const result = await deviationService.getDeviationMetrics(2, 1);
    expect(result).toEqual({
      plan_name: 'My Plan',
      summary: { total_subjects: 0, completed_subjects: 0, on_time: 0, ahead: 0, delayed: 0, average_delay_terms: 0 },
      subjects: [],
    });
  });

  it('should calculate deviation correctly', async () => {
    CustomStudyPlan.findByPk.mockResolvedValue({
      id: 1,
      id_student: 2,
      name: 'My Plan',
      items: [
        {
          plan_subject_id: 1,
          target_year: 2025,
          target_term: 1,
          plan_subject: {
            id_subject: 1,
            suggested_year: 2025,
            suggested_term: 1,
            subject: { name: 'Matemática I' },
          },
        },
        {
          plan_subject_id: 2,
          target_year: 2025,
          target_term: 2,
          plan_subject: {
            id_subject: 2,
            suggested_year: 2025,
            suggested_term: 1,
            subject: { name: 'Programación I' },
          },
        },
        {
          plan_subject_id: 3,
          target_year: 2025,
          target_term: 1,
          plan_subject: {
            id_subject: 3,
            suggested_year: 2026,
            suggested_term: 1,
            subject: { name: 'Algoritmos' },
          },
        },
      ],
    });

    AcademicRecord.findAll.mockResolvedValue([
      { plan_subject_id: 1, year: 2025, semester: 1, grade: '8', status: 'aprobado' },
      { plan_subject_id: 2, year: 2026, semester: 1, grade: '6', status: 'pendiente' },
      { plan_subject_id: 3, year: 2025, semester: 1, grade: '7', status: 'aprobado' },
    ]);

    const result = await deviationService.getDeviationMetrics(2, 1);

    expect(result.plan_name).toBe('My Plan');
    expect(result.summary).toEqual({
      total_subjects: 3,
      completed_subjects: 3,
      on_time: 2,
      ahead: 0,
      delayed: 1,
      average_delay_terms: 1,
    });

    expect(result.subjects[0]).toMatchObject({
      subject_name: 'Matemática I',
      deviation: 'on_time',
      deviation_terms: 0,
      deviation_from_official: 'on_time',
      deviation_terms_from_official: 0,
    });

    expect(result.subjects[1]).toMatchObject({
      subject_name: 'Programación I',
      deviation: 'delayed',
      deviation_terms: 1,
      deviation_from_official: 'delayed',
      deviation_terms_from_official: 2,
    });

    expect(result.subjects[2]).toMatchObject({
      subject_name: 'Algoritmos',
      deviation: 'on_time',
      deviation_terms: 0,
      deviation_from_official: 'ahead',
      deviation_terms_from_official: -2,
    });
  });

  it('should handle items with no matching academic record', async () => {
    CustomStudyPlan.findByPk.mockResolvedValue({
      id: 1,
      id_student: 2,
      name: 'My Plan',
      items: [
        {
          plan_subject_id: 1,
          target_year: 2025,
          target_term: 1,
          plan_subject: {
            id_subject: 1,
            suggested_year: 2025,
            suggested_term: 1,
            subject: { name: 'Matemática I' },
          },
        },
      ],
    });

    AcademicRecord.findAll.mockResolvedValue([]);

    const result = await deviationService.getDeviationMetrics(2, 1);
    expect(result.subjects[0].deviation).toBe('unknown');
    expect(result.subjects[0].deviation_terms).toBeNull();
    expect(result.subjects[0].actual_year).toBeNull();
  });
});
