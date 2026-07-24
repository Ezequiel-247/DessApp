const validateFinalExamData = (req, res, next) => {
  const { id_academic_record, grade, year, semester, status } = req.body;

  if (!id_academic_record || !Number.isInteger(Number(id_academic_record))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_academic_record is required and must be a valid integer'
    });
  }

  if (grade !== undefined && grade !== null && typeof grade !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'grade must be a string' });
  }

  if (year !== undefined && year !== null && !Number.isInteger(Number(year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'year must be a valid integer' });
  }

  // "pendiente" programa un final a futuro (todavía no rendido, sin nota) — es
  // justamente lo que hace el planificador al reprogramar el final de una materia
  // regularizada a un cuatrimestre por venir (ver moveFinalEvent en usePlanner.ts y
  // addFinalExam en academicRecordService.js). Un año futuro solo es inválido para un
  // examen ya rendido (con nota/aprobado/desaprobado).
  if (year !== undefined && year !== null && status !== 'pendiente' && Number(year) > new Date().getFullYear()) {
    return res.status(400).json({ error: 'Bad Request', message: 'year cannot be in the future' });
  }

  if (semester !== undefined && semester !== null && ![1, 2].includes(Number(semester))) {
    return res.status(400).json({ error: 'Bad Request', message: 'semester must be 1 or 2' });
  }

  if (!status || typeof status !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'status is required and must be a string' });
  }

  next();
};

const validateFinalExamUpdateData = (req, res, next) => {
  const { id_academic_record, grade, year, semester, status } = req.body;

  if (id_academic_record !== undefined && id_academic_record !== null && !Number.isInteger(Number(id_academic_record))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_academic_record must be a valid integer' });
  }

  if (grade !== undefined && grade !== null && typeof grade !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'grade must be a string' });
  }

  if (year !== undefined && year !== null && !Number.isInteger(Number(year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'year must be a valid integer' });
  }

  // Mismo criterio que en el alta: "pendiente" es una reprogramación a futuro, no un
  // examen ya rendido — no debe chocar con la validación de año futuro.
  if (year !== undefined && year !== null && status !== 'pendiente' && Number(year) > new Date().getFullYear()) {
    return res.status(400).json({ error: 'Bad Request', message: 'year cannot be in the future' });
  }

  if (semester !== undefined && semester !== null && ![1, 2].includes(Number(semester))) {
    return res.status(400).json({ error: 'Bad Request', message: 'semester must be 1 or 2' });
  }

  if (status !== undefined && status !== null && typeof status !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'status must be a string' });
  }

  next();
};

module.exports = { validateFinalExamData, validateFinalExamUpdateData };
