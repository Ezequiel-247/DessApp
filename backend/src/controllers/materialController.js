const { Op } = require('sequelize');
const { Material, Student, User, Report, ReportReason, Subject, StudentCareerEnrollment, PlanSubject } = require('../models');
const {
  getMaterialsWithFilters,
  formatMaterial,
  suspendIfThresholdReached,
  getReportThresholds,
} = require('../materialService');

const materialController = {
  // GET /api/material?career_id=&subject_id=&sort=top|new&q=&student_id=&viewer_student_id=
  getAll: async (req, res) => {
    try {
      const { career_id, subject_id, sort, q, student_id, show_suspended } = req.query || {};
      const materials = await getMaterialsWithFilters({
        career_id, subject_id, sort, q, student_id, show_suspended,
      });
      res.status(200).json({ data: materials });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching materials', details: error.message });
    }
  },

  // GET /api/material/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const material = await Material.findByPk(id, {
        include: [
          { model: Student, include: [{ model: User, attributes: ['name', 'lastname'] }] },
        ],
      });
      if (!material) return res.status(404).json({ error: 'Material not found' });

      // Report counts
      const reports = await Report.findAll({
        where: { id_content: id, content_type: 'material' },
        attributes: ['status'],
      });
      const reportCounts = { [id]: { pending: 0, verified: 0 } };
      for (const r of reports) {
        if (r.status === 'pending') reportCounts[id].pending++;
        if (r.status === 'verified') reportCounts[id].verified++;
      }

      res.status(200).json({ data: formatMaterial(material, { reportCounts }) });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching material', details: error.message });
    }
  },

  // GET /api/material/student/:student_id  (materiales subidos por ese estudiante)
  getByStudentId: async (req, res) => {
    try {
      const { student_id } = req.params;
      const materials = await Material.findAll({
        where: { id_author: student_id },
        include: [{ model: Student, include: [{ model: User, attributes: ['name', 'lastname'] }] }],
      });
      if (materials.length === 0) return res.status(404).json({ error: 'Material not found' });
      res.status(200).json({ data: materials.map((m) => formatMaterial(m)) });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching materials', details: error.message });
    }
  },

  // POST /api/material
  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_author: data.id_author || data.authorId,
        id_subject: data.id_subject || data.subjectId,
        title: data.title,
        type: data.type,
        file_url: data.file_url || data.fileUrl,
        total_upvotes: 0,
        status: data.status || 'active',
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
      const enrollments = await StudentCareerEnrollment.findAll({
        where: { student_id: payload.id_author, is_active: true },
      });

      if (enrollments.length > 0) {
        const studyPlanIds = enrollments.map((e) => e.study_plan_id).filter(Boolean);
        if (studyPlanIds.length > 0) {
          const planSubject = await PlanSubject.findOne({
            where: {
              id_study_plan: { [Op.in]: studyPlanIds },
              id_subject: payload.id_subject,
            },
          });
          if (!planSubject) {
            return res.status(400).json({ error: 'The selected subject does not belong to your study plan' });
          }
        }
      }

      let newMaterial = await Material.create(payload);
      newMaterial = await Material.findByPk(newMaterial.id, {
        include: [{ model: Student, include: [{ model: User, attributes: ['name', 'lastname'] }] }],
      });
      res.status(201).json({ message: 'Material created successfully', data: formatMaterial(newMaterial) });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Material already exists' });
      }
      res.status(500).json({ error: 'Error creating material', details: error.message });
    }
  },

  // PUT/PATCH /api/material/:id
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      delete data.total_upvotes;

      const payload = {
        id_author: data.id_author || data.authorId,
        id_subject: data.id_subject || data.subjectId,
        title: data.title,
        type: data.type,
        file_url: data.file_url || data.fileUrl,
        status: data.status,
        tags: Array.isArray(data.tags) ? data.tags : undefined,
      };
      // Remove undefined keys
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const [updatedRows] = await Material.update(payload, { where: { id } });
      if (updatedRows === 0) return res.status(404).json({ error: 'Material not found or no changes made' });

      const updated = await Material.findByPk(id, {
        include: [{ model: Student, include: [{ model: User, attributes: ['name', 'lastname'] }] }],
      });
      res.status(200).json({ message: 'Material updated successfully', data: formatMaterial(updated) });
    } catch (error) {
      res.status(500).json({ error: 'Error updating material', details: error.message });
    }
  },

  // DELETE /api/material/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Material.destroy({ where: { id } });
      if (deletedRows === 0) return res.status(404).json({ error: 'Material not found' });
      res.status(200).json({ message: `Material with id: ${id} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting material', details: error.message });
    }
  },

  // POST /api/material/:id/report  — Denunciar material
  reportMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      const { reporter_id, reason_id } = req.body;

      const material = await Material.findByPk(id);
      if (!material) return res.status(404).json({ error: 'Material not found' });
      if (material.status === 'suspended') {
        return res.status(400).json({ error: 'Material is already suspended' });
      }

      const report = await Report.create({
        id_reporter: reporter_id,
        id_content: id,
        content_type: 'material',
        id_reason: reason_id,
        status: 'pending',
      });

      // Evaluar si corresponde suspender
      const newStatus = await suspendIfThresholdReached(id);

      res.status(201).json({
        message: 'Report submitted',
        data: report,
        material_status: newStatus ?? material.status,
      });
    } catch (error) {
      res.status(500).json({ error: 'Error reporting material', details: error.message });
    }
  },

  // --- Panel de Moderación (Admin) ---

  // GET /api/material/admin/reported  — Materiales con denuncias pendientes
  getReported: async (req, res) => {
    try {
      const thresholds = await getReportThresholds();
      const { sort = 'new', status_filter } = req.query;

      // Traemos todos los materiales que tengan al menos 1 reporte
      const reportsRaw = await Report.findAll({
        where: { content_type: 'material', ...(status_filter ? { status: status_filter } : {}) },
        include: [
          { model: ReportReason },
          { model: User, as: 'reporter', attributes: ['id', 'name', 'lastname', 'email'] }
        ]
      });

      // Agrupar por material
      const counts = {};
      const reportsByMaterial = {};
      for (const r of reportsRaw) {
        if (!counts[r.id_content]) counts[r.id_content] = { pending: 0, verified: 0 };
        if (r.status === 'pending') counts[r.id_content].pending++;
        if (r.status === 'verified') counts[r.id_content].verified++;

        if (!reportsByMaterial[r.id_content]) reportsByMaterial[r.id_content] = [];
        reportsByMaterial[r.id_content].push(r);
      }

      const materialIds = Object.keys(counts).map(Number);
      if (materialIds.length === 0) return res.status(200).json({ data: [] });

      const materials = await Material.findAll({
        where: { id: materialIds },
        order: sort === 'top' ? [['total_upvotes', 'DESC']] : [['createdAt', 'DESC']],
        include: [
          { model: Subject },
          { model: Student, include: [{ model: User, attributes: ['name', 'lastname'] }] }
        ],
      });

      const formatted = materials.map((m) => ({
        ...formatMaterial(m, { reportCounts: counts }),
        report_counts: counts[m.id],
        reports: reportsByMaterial[m.id] || [],
        is_auto_suspended:
          (counts[m.id]?.pending ?? 0) >= thresholds.pending ||
          (counts[m.id]?.verified ?? 0) >= thresholds.verified,
      }));

      res.status(200).json({ data: formatted, thresholds });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching reported materials', details: error.message });
    }
  },

  // PATCH /api/material/admin/:id/resolve-report  — Admin resuelve denuncia
  resolveReport: async (req, res) => {
    try {
      const { id } = req.params; // report id
      const { action, resolved_by_id } = req.body; // action: 'confirm' | 'reject'

      const report = await Report.findByPk(id);
      if (!report) return res.status(404).json({ error: 'Report not found' });

      const newStatus = action === 'confirm' ? 'verified' : 'rejected';
      await report.update({ status: newStatus, resolved_by_id });

      // Re-evaluar suspensión tras confirmar
      let materialStatus = null;
      if (action === 'confirm') {
        materialStatus = await suspendIfThresholdReached(report.id_content);
      } else if (action === 'reject') {
        // Si se rechazan suficientes denuncias, podría reactivarse (lógica opcional)
      }

      res.status(200).json({
        message: `Report ${newStatus}`,
        data: report,
        material_status: materialStatus,
      });
    } catch (error) {
      res.status(500).json({ error: 'Error resolving report', details: error.message });
    }
  },
};

module.exports = materialController;
