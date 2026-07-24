const { Op } = require('sequelize');
const {
  Material, Student, User, Subject, StudyPlan,
  StudentCareerEnrollment, Report, SystemConfig, Vote,
  AcademicRecord
} = require('./models');

/**
 * Obtiene los IDs de Subject pertenecientes a los planes de una o varias carreras.
 */
async function getSubjectIdsByCareerIds(careerIds) {
  const plans = await StudyPlan.findAll({
    where: { id_career: careerIds },
    include: [{ model: Subject, attributes: ['id'] }],
  });
  const ids = new Set();
  for (const plan of plans) {
    for (const subj of plan.Subjects ?? []) {
      ids.add(subj.id);
    }
  }
  return Array.from(ids);
}

/**
 * Obtiene los IDs de carrera en las que está inscripto un estudiante.
 */
async function getCareerIdsByStudentId(studentId) {
  const enrollments = await StudentCareerEnrollment.findAll({
    where: { student_id: studentId },
    attributes: ['career_id'],
  });
  return enrollments.map((e) => e.career_id);
}

async function getReportThresholds() {
  const configs = await SystemConfig.findAll({
    where: { key: ['pending_reports_threshold', 'verified_reports_threshold'] },
  });
  const map = {};
  for (const c of configs) map[c.key] = parseInt(c.value, 10);
  return {
    pending: map['pending_reports_threshold'] ?? 10,
    verified: map['verified_reports_threshold'] ?? 3,
  };
}

async function suspendIfThresholdReached(materialId) {
  const thresholds = await getReportThresholds();

  const pendingCount = await Report.count({
    where: { id_content: materialId, content_type: 'material', status: 'pending' },
  });
  const verifiedCount = await Report.count({
    where: { id_content: materialId, content_type: 'material', status: 'verified' },
  });
  const rejectedCount = await Report.count({
    where: { id_content: materialId, content_type: 'material', status: 'rejected' },
  });

  const effectivePendingThreshold = thresholds.pending + rejectedCount;
  const effectiveVerifiedThreshold = thresholds.verified + rejectedCount;

  if (pendingCount >= effectivePendingThreshold || verifiedCount >= effectiveVerifiedThreshold) {
    await Material.update({ status: 'suspended' }, { where: { id: materialId } });
    return 'suspended';
  }
  return null;
}

function formatMaterial(material, { reportCounts = {}, studentVotes = {} } = {}) {
  const plain = material.get ? material.get({ plain: true }) : material;
  const student = plain.Student;
  const user = student?.User;
  const authorName = user ? `${user.name ?? ''} ${user.lastname ?? ''}`.trim() : '';
  const rest = { ...plain };
  delete rest.Student;

  const isSuspended = rest.status === 'suspended';
  const reports = reportCounts[rest.id] ?? { pending: 0, verified: 0 };
  const myVote = studentVotes[rest.id] ?? null; // null | 'up' | 'down'

  return {
    ...rest,

    tags: Array.isArray(rest.tags)
      ? rest.tags
      : (() => { try { return rest.tags ? JSON.parse(rest.tags) : []; } catch { return []; } })(),
    author_name: authorName || undefined,
    file_url: isSuspended ? null : rest.file_url,
    report_counts: reports,
    my_vote: myVote,
  };
}

/**
 * Query principal con filtros.
 *
 * @param {object} filters
 * @param {string}  [filters.student_id]   - Filtra por carrera del estudiante
 * @param {string}  [filters.career_id]    - Filtra por carrera específica
 * @param {string}  [filters.subject_id]   - Filtra por materia
 * @param {'top'|'new'|'rating'} [filters.sort] - Ordenamiento
 * @param {string}  [filters.q]            - Búsqueda por texto en título
 * @param {string}  [filters.viewer_student_id] - Para saber el voto del estudiante activo
 * @param {string|boolean} [filters.show_suspended] - Incluye suspendidos si es true
 */
async function getMaterialsWithFilters(filters = {}) {
  const { student_id, career_id, subject_id, sort = 'new', q, viewer_student_id, show_suspended } = filters;

  const where = {};

  const includeSuspended = show_suspended === true || show_suspended === 'true' || show_suspended === '1';
  if (!includeSuspended) {
    where.status = 'active';
  }

  // Filtro por texto
  if (q) {
    where.title = { [Op.like]: `%${q}%` };
  }

  // Filtro por materia
  if (subject_id) {
    where.id_subject = subject_id;
  }

  // Filtro por carrera o por materias del estudiante (según sus registros académicos)
  if (career_id) {
    const subjectIds = await getSubjectIdsByCareerIds([career_id]);
    where.id_subject = subjectIds.length ? { [Op.in]: subjectIds } : { [Op.in]: [-1] };
  } else if (student_id) {
    const records = await AcademicRecord.findAll({
      where: { id_student: student_id },
      attributes: ['id_subject'],
    });
    const subjectIds = [...new Set(records.map((r) => r.id_subject).filter(Boolean))];
    where.id_subject = subjectIds.length ? { [Op.in]: subjectIds } : { [Op.in]: [-1] };
  }

  let order;
  if (sort === 'top') {
    order = [['total_upvotes', 'DESC'], ['createdAt', 'DESC']];
  } else if (sort === 'rating') {
    order = [['valoracion_ratio', 'DESC'], ['total_upvotes', 'DESC'], ['createdAt', 'DESC']];
  } else {
    order = [['createdAt', 'DESC']];
  }

  const materials = await Material.findAll({
    where,
    order,
    include: [
      {
        model: Student,
        include: [{ model: User, attributes: ['name', 'lastname'] }],
      },
      {
        model: Subject,
        attributes: ['id', 'name'],
      },
    ],
  });

  // Conteo de denuncias por material
  const materialIds = materials.map((m) => m.id);
  let reportCounts = {};
  let studentVotes = {};

  if (materialIds.length > 0) {
    const reports = await Report.findAll({
      where: { id_content: materialIds, content_type: 'material' },
      attributes: ['id_content', 'status'],
    });
    for (const r of reports) {
      if (!reportCounts[r.id_content]) reportCounts[r.id_content] = { pending: 0, verified: 0 };
      if (r.status === 'pending') reportCounts[r.id_content].pending++;
      if (r.status === 'verified') reportCounts[r.id_content].verified++;
    }

    // Votos del estudiante activo
    if (viewer_student_id) {
      const votes = await Vote.findAll({
        where: { target_type: 'material', target_id: materialIds, id_student: viewer_student_id },
        attributes: ['target_id', 'is_upvote'],
      });
      for (const v of votes) {
        studentVotes[v.target_id] = v.is_upvote ? 'up' : 'down';
      }
    }
  }

  return materials.map((m) => formatMaterial(m, { reportCounts, studentVotes }));
}

module.exports = {
  getMaterialsWithFilters,
  getCareerIdsByStudentId,
  getSubjectIdsByCareerIds,
  suspendIfThresholdReached,
  formatMaterial,
  getReportThresholds,
};
