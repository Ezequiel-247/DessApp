const { validateCreateSession } = require('../src/middlewares/studySessionMiddleware');

describe('StudySession Middleware', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  const runMiddleware = async (req, res, middlewares) => {
    for (const middleware of middlewares) {
      let resolved = false;
      await new Promise((resolve) => {
        const originalStatus = res.status;
        const originalJson = res.json;

        const done = () => {
          if (!resolved) {
            resolved = true;
            res.status = originalStatus;
            res.json = originalJson;
            resolve();
          }
        };

        res.status = jest.fn().mockImplementation((code) => {
          originalStatus(code);
          return res;
        });

        res.json = jest.fn().mockImplementation((data) => {
          originalJson(data);
          done();
        });

        middleware(req, res, () => {
          done();
        });
      });

      if (res.status.mock && res.status.mock.calls.length > 0) {
        break;
      }
    }
  };

  it('should pass validation when all fields are valid for virtual session', async () => {
    req.body = {
      subject_id: 1,
      title: 'Repaso Parcial',
      type: 'virtual',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      date_time: '2026-06-15T18:00:00.000Z',
      duration_hours: 2,
      duration_minutes: 30,
      max_slots: 10,
      approval_required: true
    };

    await runMiddleware(req, res, validateCreateSession);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should pass validation when all fields are valid for presencial session', async () => {
    req.body = {
      subject_id: 2,
      title: 'Repaso TP',
      type: 'presencial',
      location: 'Aula 302',
      date_time: '2026-06-15T18:00:00.000Z',
      duration_hours: 1,
      duration_minutes: 0,
      max_slots: null,
      approval_required: false
    };

    await runMiddleware(req, res, validateCreateSession);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should fail if subject_id is not an integer', async () => {
    req.body = {
      subject_id: 'not-an-int',
      title: 'Repaso',
      type: 'virtual',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      date_time: '2026-06-15T18:00:00.000Z',
      duration_hours: 2,
      duration_minutes: 0,
      approval_required: false
    };

    await runMiddleware(req, res, validateCreateSession);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({ msg: 'subject_id debe ser un entero' })
      ])
    }));
  });

  it('should fail if meeting_link is missing for virtual session', async () => {
    req.body = {
      subject_id: 1,
      title: 'Repaso',
      type: 'virtual',
      date_time: '2026-06-15T18:00:00.000Z',
      duration_hours: 2,
      duration_minutes: 0,
      approval_required: false
    };

    await runMiddleware(req, res, validateCreateSession);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({ msg: 'El link es requerido para sesiones virtuales' })
      ])
    }));
  });

  it('should fail if location is missing for presencial session', async () => {
    req.body = {
      subject_id: 1,
      title: 'Repaso',
      type: 'presencial',
      date_time: '2026-06-15T18:00:00.000Z',
      duration_hours: 2,
      duration_minutes: 0,
      approval_required: false
    };

    await runMiddleware(req, res, validateCreateSession);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({ msg: 'La ubicación es requerida para sesiones presenciales' })
      ])
    }));
  });
});
