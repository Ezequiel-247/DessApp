const { Report, ReportReason, Material, Subject, PlanSubject, StudyPlan, Career, User, sequelize } = require('../models');
const notificationService = require('../services/notificationService');

const reportController = {
  getAll: async (req, res) => {
    try {
      const { status, reporterId } = req.query;
      const where = {};
      if (status) where.status = status;
      if (reporterId) where.id_reporter = reporterId;
      const reports = await Report.findAll({ where });
      res.status(200).json({ data: reports });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching reports', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const report = await Report.findByPk(id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.status(200).json({ data: report });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching report', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_reporter: data.id_reporter || data.reporterId,
        id_content: data.id_content || data.contentId,
        content_type: data.content_type || data.contentType,
        id_reason: data.id_reason || data.reasonId,
        status: data.status || 'pending',
        resolved_by_id: data.resolved_by_id || data.resolvedById || null,
      };
      const newReport = await Report.create(payload);

      Promise.resolve(notificationService.createNotification({
        userId: payload.id_reporter,
        type: 'info',
        title: 'Denuncia registrada',
        message: `Recibimos tu denuncia sobre ${payload.content_type}. Vamos a revisarla.`,
      }))
        .catch((err) => console.error('Error al crear notificación de denuncia creada:', err));

      res.status(201).json({ message: 'Report created successfully', data: newReport });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Report already exists' });
      }
      res.status(500).json({ error: 'Error creating report', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        status: data.status,
        resolved_by_id: data.resolved_by_id || data.resolvedById,
      };

      const [updatedRows] = await Report.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Report not found or no changes made' });
      }

      const updatedReport = await Report.findByPk(id);

      if (updatedReport) {
        Promise.resolve(notificationService.createNotification({
          userId: updatedReport.id_reporter,
          type: updatedReport.status === 'verified' ? 'success' : 'info',
          title: 'Actualizacion de denuncia',
          message: `Tu denuncia #${updatedReport.id} cambio a estado "${updatedReport.status}".`,
        }))
          .catch((err) => console.error('Error al crear notificación de denuncia actualizada:', err));
      }

      res.status(200).json({ message: 'Report updated successfully', data: updatedReport });
    } catch (error) {
      res.status(500).json({ error: 'Error updating report', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Report.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.status(200).json({ message: `Report with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Report already exists' });
      }
      res.status(500).json({ error: 'Error updating report', details: error.message });
    }
  },

  summary: async (req, res) => {
    try {
      const totalMaterials = await Material.count({ where: { status: 'active' } });
      const subjectsWithMaterials = await Material.count({
        where: { status: 'active' },
        distinct: true,
        col: 'id_subject',
      });
      const activeUsers = await User.count({ where: { is_active: true } });

      res.status(200).json({
        data: {
          active_users: activeUsers,
          total_materials: totalMaterials,
          subjects_with_materials: subjectsWithMaterials,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching summary', details: error.message });
    }
  },

  moderationStats: async (req, res) => {
    try {
      const totalReports = await Report.count();

      const [statusCounts] = await sequelize.query(
        `SELECT status, COUNT(id)::int AS count FROM reports GROUP BY status`,
      );

      const contentTypeCounts = await Report.findAll({
        attributes: ['content_type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['content_type'],
        raw: true,
      });

      const [reasonCounts] = await sequelize.query(
        `SELECT rr.name AS reason_name, COUNT(r.id)::int AS count
         FROM reports r
         LEFT JOIN report_reasons rr ON rr.id = r.id_reason
         GROUP BY rr.name, r.id_reason`,
      );

      const [resolvedCounts] = await sequelize.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'verified') AS verified,
           COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
         FROM reports WHERE status IN ('verified', 'rejected')`,
      );

      const totalResolved = Number(resolvedCounts[0]?.verified ?? 0) + Number(resolvedCounts[0]?.rejected ?? 0);
      const resolutionRate = totalReports > 0
        ? +((totalResolved / totalReports) * 100).toFixed(1)
        : 0;

      const byStatus = { pending: 0, verified: 0, rejected: 0 };
      for (const s of statusCounts) {
        if (s.status === 'pending') byStatus.pending = Number(s.count);
        if (s.status === 'verified') byStatus.verified = Number(s.count);
        if (s.status === 'rejected') byStatus.rejected = Number(s.count);
      }

      const byReason = reasonCounts.map((r) => ({
        reason_name: r.reason_name ?? `ID sin motivo`,
        count: Number(r.count),
      }));

      const byContentType = contentTypeCounts.map((c) => ({
        content_type: c.content_type ?? 'unknown',
        count: Number(c.count),
      }));

      res.status(200).json({
        data: {
          total_reports: totalReports,
          by_status: byStatus,
          resolution_rate: resolutionRate,
          by_reason: byReason,
          by_content_type: byContentType,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching moderation stats', details: error.message });
    }
  },

  materialsBySubject: async (req, res) => {
    try {
      const { career_id, career_name, search, page = '1', limit = '20', sort_key, sort_dir } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      let whereClause = "WHERE m.status = 'active'";
      const replacements = {};
      const conditions = [];

      if (career_id) {
        conditions.push("c.id = :career_id");
        replacements.career_id = career_id;
      }
      if (career_name) {
        conditions.push("c.name ILIKE :career_name");
        replacements.career_name = `%${career_name}%`;
      }
      if (search) {
        conditions.push("s.name ILIKE :search");
        replacements.search = `%${search}%`;
      }
      if (conditions.length > 0) {
        whereClause += " AND " + conditions.join(" AND ");
      }

      const baseFrom = `
        FROM materials m
        JOIN subjects s ON s.id = m.id_subject
        LEFT JOIN plan_subjects ps ON ps.id_subject = s.id
        LEFT JOIN study_plans sp ON sp.id = ps.id_study_plan
        LEFT JOIN careers c ON c.id = sp.id_career
        ${whereClause}
      `;

      const [countResult] = await sequelize.query(
        `SELECT COUNT(*) AS cnt FROM (SELECT s.id ${baseFrom} GROUP BY s.id, s.name, c.name) sub`,
        { replacements, type: sequelize.QueryTypes.SELECT },
      );
      const total = Number(countResult?.cnt ?? 0);

      let orderBy = 'total DESC';
      if (sort_key === 'subject') {
        orderBy = `s.name ${sort_dir === 'asc' ? 'ASC' : 'DESC'}`;
      } else if (sort_key === 'total') {
        orderBy = `total ${sort_dir === 'asc' ? 'ASC' : 'DESC'}`;
      }

      const query = `
        SELECT
          s.id AS subject_id,
          s.name AS subject_name,
          c.name AS career_name,
          COUNT(m.id) AS total,
          COUNT(CASE WHEN m.type = 'pdf' THEN 1 END) AS pdf,
          COUNT(CASE WHEN m.type = 'video' THEN 1 END) AS video,
          COUNT(CASE WHEN m.type = 'link' THEN 1 END) AS link
        ${baseFrom}
        GROUP BY s.id, s.name, c.name
        ORDER BY ${orderBy}
        LIMIT :limitNum OFFSET :offset
      `;
      replacements.limitNum = limitNum;
      replacements.offset = offset;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      res.status(200).json({
        data: results,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching materials by subject', details: error.message });
    }
  },

  topRatedMaterials: async (req, res) => {
    try {
      const { subject_id, sort } = req.query;

      const where = { status: 'active' };
      if (subject_id) where.id_subject = subject_id;

      let order;
      switch (sort) {
        case 'likes':
          order = [['likes_count', 'DESC']];
          break;
        case 'total':
          order = [['total_upvotes', 'DESC']];
          break;
        default:
          order = [[sequelize.literal('COALESCE(valoracion_ratio, 0)'), 'DESC']];
      }

      const materials = await Material.findAll({
        where,
        include: [
          { model: Subject, attributes: ['id', 'name'] },
        ],
        attributes: ['id', 'title', 'id_subject', 'likes_count', 'dislikes_count', 'total_upvotes', 'valoracion_ratio'],
        order,
        limit: 50,
      });

      const data = materials.map(m => ({
        id: m.id,
        title: m.title,
        subject_id: m.id_subject,
        subject_name: m.Subject ? m.Subject.name : null,
        likes_count: m.likes_count,
        dislikes_count: m.dislikes_count,
        total_upvotes: m.total_upvotes,
        valoracion_ratio: m.valoracion_ratio,
      }));

      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching top rated materials', details: error.message });
    }
  },
  mostActiveCareers: async (req, res) => {
    try {
      const { limit = '10', start_date, end_date } = req.query;
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

      const dateMaterial = (start_date ? `AND m."createdAt" >= :start_date` : '') + (end_date ? ` AND m."createdAt" <= :end_date` : '');
      const dateSession = (start_date ? `AND ss."createdAt" >= :start_date` : '') + (end_date ? ` AND ss."createdAt" <= :end_date` : '');
      const dateReg = (start_date ? `AND ssr."createdAt" >= :start_date` : '') + (end_date ? ` AND ssr."createdAt" <= :end_date` : '');
      const dateConn = (start_date ? `AND conn."createdAt" >= :start_date` : '') + (end_date ? ` AND conn."createdAt" <= :end_date` : '');

      const replacements = {};
      if (start_date) replacements.start_date = start_date;
      if (end_date) replacements.end_date = end_date;

      const query = `
        SELECT
          c.id,
          c.name AS career_name,
          c.code AS career_code,
          COUNT(DISTINCT sce.student_id) AS total_students,
          COUNT(DISTINCT m.id) AS total_materials,
          COUNT(DISTINCT ss.id) AS total_sessions,
          COUNT(DISTINCT ssr.id) AS total_registrations,
          COUNT(DISTINCT conn.id) AS total_connections
        FROM careers c
        JOIN student_career_enrollments sce ON sce.career_id = c.id AND sce.status = 'active'
        LEFT JOIN materials m ON m.id_author = sce.student_id AND m.status = 'active' ${dateMaterial}
        LEFT JOIN study_sessions ss ON ss.host_student_id = sce.student_id AND ss.status = 'abierta' ${dateSession}
        LEFT JOIN study_session_registrations ssr ON ssr.student_id = sce.student_id ${dateReg}
        LEFT JOIN connections conn ON (conn.id_user = sce.student_id OR conn.id_connected_user = sce.student_id)
          AND conn.status = 'accepted' ${dateConn}
        GROUP BY c.id, c.name, c.code
        ORDER BY (COUNT(DISTINCT m.id) * 3 + COUNT(DISTINCT ss.id) * 4 + COUNT(DISTINCT ssr.id) * 2 + COUNT(DISTINCT conn.id)) DESC
        LIMIT :limitNum
      `;

      replacements.limitNum = limitNum;
      const results = await sequelize.query(query, { replacements, type: sequelize.QueryTypes.SELECT });
      console.log(`[mostActiveCareers] ${results.length} careers found`);

      const maxScore = results.length > 0
        ? Math.max(...results.map(r => Number(r.total_materials) * 3 + Number(r.total_sessions) * 4 + Number(r.total_registrations) * 2 + Number(r.total_connections)))
        : 1;

      // Monthly breakdown — simplified per-career loop
      const breakdownByCareer = {};
      const monthlyReps = {};
      if (start_date) monthlyReps.start_date = start_date;
      if (end_date) monthlyReps.end_date = end_date;
      for (const career of results) {
        try {
          const cid = career.id;
          const mc = start_date ? `AND "createdAt" >= :start_date` : '';
          const me = end_date ? ` AND "createdAt" <= :end_date` : '';
          const md = mc + me;

          const monthly = await sequelize.query(`
            SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*) AS cnt
            FROM materials WHERE id_author IN (SELECT student_id FROM student_career_enrollments WHERE career_id = ${cid} AND status = 'active')
            AND status = 'active' ${md} GROUP BY DATE_TRUNC('month', "createdAt") ORDER BY month
          `, { replacements: monthlyReps, type: sequelize.QueryTypes.SELECT });
          const monthlyS = await sequelize.query(`
            SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*) AS cnt
            FROM study_sessions WHERE host_student_id IN (SELECT student_id FROM student_career_enrollments WHERE career_id = ${cid} AND status = 'active')
            AND status = 'abierta' ${md} GROUP BY DATE_TRUNC('month', "createdAt") ORDER BY month
          `, { replacements: monthlyReps, type: sequelize.QueryTypes.SELECT });
          const monthlyR = await sequelize.query(`
            SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*) AS cnt
            FROM study_session_registrations WHERE student_id IN (SELECT student_id FROM student_career_enrollments WHERE career_id = ${cid} AND status = 'active')
            ${md} GROUP BY DATE_TRUNC('month', "createdAt") ORDER BY month
          `, { replacements: monthlyReps, type: sequelize.QueryTypes.SELECT });
          const monthlyC = await sequelize.query(`
            SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*) AS cnt
            FROM connections WHERE status = 'accepted' AND (id_user IN (SELECT student_id FROM student_career_enrollments WHERE career_id = ${cid} AND status = 'active')
              OR id_connected_user IN (SELECT student_id FROM student_career_enrollments WHERE career_id = ${cid} AND status = 'active'))
            ${md} GROUP BY DATE_TRUNC('month', "createdAt") ORDER BY month
          `, { replacements: monthlyReps, type: sequelize.QueryTypes.SELECT });

          // Merge by month
          const monthMap = {};
          for (const r of monthly) { if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, materials: 0, sessions: 0, registrations: 0, connections: 0, total: 0 }; monthMap[r.month].materials = Number(r.cnt); }
          for (const r of monthlyS) { if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, materials: 0, sessions: 0, registrations: 0, connections: 0, total: 0 }; monthMap[r.month].sessions = Number(r.cnt); }
          for (const r of monthlyR) { if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, materials: 0, sessions: 0, registrations: 0, connections: 0, total: 0 }; monthMap[r.month].registrations = Number(r.cnt); }
          for (const r of monthlyC) { if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, materials: 0, sessions: 0, registrations: 0, connections: 0, total: 0 }; monthMap[r.month].connections = Number(r.cnt); }

          breakdownByCareer[cid] = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({ ...m, total: m.materials + m.sessions + m.registrations + m.connections }));
        } catch (e) {
          console.warn(`Monthly breakdown failed for career ${career.id}:`, e.message);
        }
      }

      const data = results.map(r => {
        const rawScore = Number(r.total_materials) * 3 + Number(r.total_sessions) * 4 + Number(r.total_registrations) * 2 + Number(r.total_connections);
        return {
          id: r.id,
          career_name: r.career_name,
          career_code: r.career_code,
          total_students: Number(r.total_students),
          total_materials: Number(r.total_materials),
          total_sessions: Number(r.total_sessions),
          total_registrations: Number(r.total_registrations),
          total_connections: Number(r.total_connections),
          score: rawScore,
          score_pct: maxScore > 0 ? +((rawScore / maxScore) * 100).toFixed(1) : 0,
          monthly_breakdown: breakdownByCareer[r.id] || [],
        };
      });

      res.status(200).json({ data });
    } catch (error) {
      console.error('[mostActiveCareers] Error:', error.message);
      res.status(500).json({ error: 'Error fetching most active careers', details: error.message });
    }
  },
  activeUsers: async (req, res) => {
    try {
      const { start_date, end_date, role } = req.query;

      const conditions = [];
      const replacements = {};

      if (start_date) {
        conditions.push('u.created_at >= :start_date');
        replacements.start_date = start_date;
      }
      if (end_date) {
        conditions.push('u.created_at <= :end_date');
        replacements.end_date = end_date;
      }
      if (role) {
        conditions.push('u.role = :role');
        replacements.role = role;
      }

      const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      const today = new Date().toISOString().split('T')[0];

      const summaryQuery = `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE u.is_active = true) AS active,
          COUNT(*) FILTER (WHERE u.is_active = false) AS inactive
        FROM users u ${where}
      `;

      const monthlyQuery = `
        SELECT
          TO_CHAR(DATE_TRUNC('month', u.created_at), 'YYYY-MM') AS month,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE u.is_active = true) AS active,
          COUNT(*) FILTER (WHERE u.is_active = false) AS inactive
        FROM users u ${where}
        GROUP BY DATE_TRUNC('month', u.created_at)
        ORDER BY month
      `;

      const [summary] = await sequelize.query(summaryQuery, { replacements, type: sequelize.QueryTypes.SELECT });
      const monthly = await sequelize.query(monthlyQuery, { replacements, type: sequelize.QueryTypes.SELECT });

      res.status(200).json({
        data: {
          total: Number(summary.total),
          active: Number(summary.active),
          inactive: Number(summary.inactive),
          monthly_trend: monthly.map(r => ({
            month: r.month,
            total: Number(r.total),
            active: Number(r.active),
            inactive: Number(r.inactive),
          })),
        },
      });
    } catch (error) {
      console.error('[activeUsers] Error:', error.message);
      res.status(500).json({ error: 'Error fetching active users', details: error.message });
    }
  },
  subjectsApprovedByStudent: async (req, res) => {
    try {
      const { career_id } = req.query;

      const enrollmentConditions = ["sce.status = 'active'"];
      const replacements = {};

      if (career_id) {
        enrollmentConditions.push('sce.career_id = :career_id');
        replacements.career_id = career_id;
      }

      const needsEnrollment = !!career_id;
      const enrollmentJoin = needsEnrollment
        ? `JOIN student_career_enrollments sce ON sce.student_id = u.id AND ${enrollmentConditions.join(' AND ')}`
        : '';

      const query = `
        SELECT
          COALESCE(sub.approved_count, 0) AS approved_count,
          COUNT(*) AS student_count
        FROM users u
        ${enrollmentJoin}
        LEFT JOIN (
          SELECT
            ar.id_student,
            COUNT(DISTINCT COALESCE(ar.id_subject, ps.id_subject)) AS approved_count
          FROM academic_records ar
          LEFT JOIN final_exams fe ON fe.id_academic_record = ar.id AND fe.status = 'aprobado'
          LEFT JOIN plan_subjects ps ON ps.id = ar.plan_subject_id
          WHERE ar.status IN ('aprobado', 'equivalencia') OR (ar.status = 'pendiente' AND fe.id IS NOT NULL)
          GROUP BY ar.id_student
        ) sub ON sub.id_student = u.id
        WHERE u.role = 'student'
        GROUP BY COALESCE(sub.approved_count, 0)
        ORDER BY approved_count
      `;

      const distribution = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      const totalStudents = distribution.reduce((sum, r) => sum + Number(r.student_count), 0);
      const studentsWithApprovals = distribution
        .filter(r => Number(r.approved_count) > 0)
        .reduce((sum, r) => sum + Number(r.student_count), 0);
      const studentsWithoutApprovals = distribution
        .filter(r => Number(r.approved_count) === 0)
        .reduce((sum, r) => sum + Number(r.student_count), 0);
      const totalApproved = distribution.reduce((sum, r) => sum + Number(r.approved_count) * Number(r.student_count), 0);
      const averageApproved = studentsWithApprovals > 0 ? +((totalApproved / studentsWithApprovals)).toFixed(1) : 0;
      const maxApproved = distribution.length > 0
        ? Math.max(...distribution.map(r => Number(r.approved_count)))
        : 0;

      res.status(200).json({
        data: {
          distribution: distribution.map(r => ({
            approved_count: Number(r.approved_count),
            student_count: Number(r.student_count),
          })),
          total_students: totalStudents,
          students_with_approvals: studentsWithApprovals,
          students_without_approvals: studentsWithoutApprovals,
          pct_without_approvals: totalStudents > 0
            ? +((studentsWithoutApprovals / totalStudents) * 100).toFixed(1)
            : 0,
          average_approved: averageApproved,
          max_approved: maxApproved,
        },
      });
    } catch (error) {
      console.error('[subjectsApprovedByStudent] Error:', error.message);
      res.status(500).json({ error: 'Error fetching subjects approved by student', details: error.message });
    }
  },

  subjectsByStudent: async (req, res) => {
    try {
      const { career_id, start_date, end_date } = req.query;

      const enrollmentConditions = ["sce.status = 'active'"];
      const replacements = {};
      const dateConditions = [];

      if (career_id) {
        enrollmentConditions.push('sce.career_id = :career_id');
        replacements.career_id = career_id;
      }

      if (start_date) {
        dateConditions.push('ar."createdAt" >= :start_date');
        replacements.start_date = start_date;
      }

      if (end_date) {
        dateConditions.push('ar."createdAt" <= :end_date');
        replacements.end_date = end_date;
      }

      const dateWhere = dateConditions.length > 0
        ? `WHERE ${dateConditions.join(' AND ')}`
        : '';

      const needsEnrollment = !!career_id;
      const enrollmentJoin = needsEnrollment
        ? `JOIN student_career_enrollments sce ON sce.student_id = u.id AND ${enrollmentConditions.join(' AND ')}`
        : '';

      const query = `
        SELECT
          COALESCE(sub.cursada_count, 0) AS cursada_count,
          COUNT(*) AS student_count
        FROM users u
        ${enrollmentJoin}
        LEFT JOIN (
          SELECT
            ar.id_student,
            COUNT(DISTINCT COALESCE(ar.id_subject, ps.id_subject)) AS cursada_count
          FROM academic_records ar
          LEFT JOIN plan_subjects ps ON ps.id = ar.plan_subject_id
          ${dateWhere}
          GROUP BY ar.id_student
        ) sub ON sub.id_student = u.id
        WHERE u.role = 'student'
        GROUP BY COALESCE(sub.cursada_count, 0)
        ORDER BY cursada_count
      `;

      const distribution = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      const totalStudents = distribution.reduce((sum, r) => sum + Number(r.student_count), 0);
      const studentsWithRecords = distribution
        .filter(r => Number(r.cursada_count) > 0)
        .reduce((sum, r) => sum + Number(r.student_count), 0);
      const studentsWithoutRecords = distribution
        .filter(r => Number(r.cursada_count) === 0)
        .reduce((sum, r) => sum + Number(r.student_count), 0);
      const totalRecords = distribution.reduce((sum, r) => sum + Number(r.cursada_count) * Number(r.student_count), 0);
      const averageCursadas = studentsWithRecords > 0 ? +((totalRecords / studentsWithRecords)).toFixed(1) : 0;
      const maxCursadas = distribution.length > 0
        ? Math.max(...distribution.map(r => Number(r.cursada_count)))
        : 0;

      res.status(200).json({
        data: {
          distribution: distribution.map(r => ({
            cursada_count: Number(r.cursada_count),
            student_count: Number(r.student_count),
          })),
          total_students: totalStudents,
          students_with_records: studentsWithRecords,
          students_without_records: studentsWithoutRecords,
          pct_without_records: totalStudents > 0
            ? +((studentsWithoutRecords / totalStudents) * 100).toFixed(1)
            : 0,
          average_cursadas: averageCursadas,
          max_cursadas: maxCursadas,
        },
      });
    } catch (error) {
      console.error('[subjectsByStudent] Error:', error.message);
      res.status(500).json({ error: 'Error fetching subjects by student', details: error.message });
    }
  },

  getStudentsByCursadaCount: async (req, res) => {
    try {
      const { cursada_count, career_id } = req.query;

      if (cursada_count === undefined || cursada_count === '') {
        return res.status(400).json({ error: 'cursada_count is required' });
      }

      const count = Number(cursada_count);
      const enrollmentConditions = ["sce.status = 'active'"];
      const replacements = { cursada_count: count };

      if (career_id) {
        enrollmentConditions.push('sce.career_id = :career_id');
        replacements.career_id = career_id;
      }

      const needsEnrollment = !!career_id;
      const enrollmentJoin = needsEnrollment
        ? `JOIN student_career_enrollments sce ON sce.student_id = u.id AND ${enrollmentConditions.join(' AND ')}`
        : '';

      const query = `
        SELECT
          u.id,
          u.name,
          u.lastname,
          u.email,
          s.legajo,
          COALESCE(sub.cursada_count, 0) AS cursada_count
        FROM users u
        ${enrollmentJoin}
        LEFT JOIN students s ON s.user_id = u.id
        LEFT JOIN (
          SELECT
            ar.id_student,
            COUNT(DISTINCT COALESCE(ar.id_subject, ps.id_subject)) AS cursada_count
          FROM academic_records ar
          LEFT JOIN plan_subjects ps ON ps.id = ar.plan_subject_id
          GROUP BY ar.id_student
        ) sub ON sub.id_student = u.id
        WHERE u.role = 'student'
          AND COALESCE(sub.cursada_count, 0) = :cursada_count
        ORDER BY u.name, u.lastname
      `;

      const students = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      res.status(200).json({
        data: students.map(s => ({
          id: s.id,
          name: s.name,
          lastname: s.lastname,
          email: s.email,
          legajo: s.legajo,
          cursada_count: Number(s.cursada_count),
        })),
      });
    } catch (error) {
      console.error('[getStudentsByCursadaCount] Error:', error.message);
      res.status(500).json({ error: 'Error fetching students by cursada count', details: error.message });
    }
  },

  subjectsByCareer: async (req, res) => {
    try {
      const { career_id, start_date, end_date } = req.query;

      const replacements = {};
      const careerWhere = career_id ? 'AND sce.career_id = :career_id' : '';
      const recordDateConditions = [];
      if (career_id) replacements.career_id = career_id;

      if (start_date) {
        recordDateConditions.push('ar."createdAt" >= :start_date');
        replacements.start_date = start_date;
      }

      if (end_date) {
        recordDateConditions.push('ar."createdAt" <= :end_date');
        replacements.end_date = end_date;
      }

      const recordDateWhere = recordDateConditions.length > 0
        ? `AND ${recordDateConditions.join(' AND ')}`
        : '';

      // 1. Career-level stats
      const careersQuery = `
        SELECT
          c.id AS career_id,
          c.name AS career_name,
          COUNT(DISTINCT sce.student_id) AS total_students,
          COUNT(ar.id) AS total_records,
          COUNT(ar.id) FILTER (WHERE ar.status IN ('aprobado', 'equivalencia')) AS total_approved,
          COUNT(DISTINCT COALESCE(ar.id_subject, ps.id_subject)) AS total_subjects
        FROM careers c
        JOIN student_career_enrollments sce ON sce.career_id = c.id AND sce.status = 'active'
        LEFT JOIN academic_records ar ON ar.id_student = sce.student_id ${recordDateWhere}
        LEFT JOIN plan_subjects ps ON ps.id = ar.plan_subject_id
        WHERE 1=1 ${careerWhere}
        GROUP BY c.id, c.name
        ORDER BY total_records DESC
      `;

      const careers = await sequelize.query(careersQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      // 2. Subject-level stats per career
      const subjectsQuery = `
        SELECT
          sce.career_id,
          COALESCE(ar.id_subject, ps.id_subject) AS subject_id,
          s.name AS subject_name,
          COUNT(*) AS total_records,
          COUNT(*) FILTER (WHERE ar.status IN ('aprobado', 'equivalencia')) AS approved,
          COUNT(*) FILTER (WHERE ar.status = 'desaprobado') AS desaprobado,
          COUNT(*) FILTER (WHERE ar.status = 'pendiente') AS pendiente,
          COUNT(*) FILTER (WHERE ar.status = 'enrolled') AS enrolled
        FROM academic_records ar
        JOIN student_career_enrollments sce ON sce.student_id = ar.id_student AND sce.status = 'active'
        LEFT JOIN plan_subjects ps ON ps.id = ar.plan_subject_id
        LEFT JOIN subjects s ON s.id = COALESCE(ar.id_subject, ps.id_subject)
        WHERE 1=1 ${careerWhere}
          ${recordDateWhere}
          AND COALESCE(ar.id_subject, ps.id_subject) IS NOT NULL
        GROUP BY sce.career_id, COALESCE(ar.id_subject, ps.id_subject), s.name
        ORDER BY sce.career_id, total_records DESC
      `;

      const subjects = await sequelize.query(subjectsQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      // Assemble
      const subjectsByCareerId = {};
      for (const s of subjects) {
        const cid = Number(s.career_id);
        if (!subjectsByCareerId[cid]) subjectsByCareerId[cid] = [];
        subjectsByCareerId[cid].push({
          subject_id: Number(s.subject_id),
          subject_name: s.subject_name,
          total_records: Number(s.total_records),
          approved: Number(s.approved),
          desaprobado: Number(s.desaprobado),
          pendiente: Number(s.pendiente),
          enrolled: Number(s.enrolled),
        });
      }

      const result = careers.map(r => ({
        career_id: Number(r.career_id),
        career_name: r.career_name,
        total_students: Number(r.total_students),
        total_records: Number(r.total_records),
        total_approved: Number(r.total_approved),
        total_subjects: Number(r.total_subjects),
        subjects: subjectsByCareerId[Number(r.career_id)] || [],
      }));

      // Total unique students across all filtered careers
      const [totalUnique] = await sequelize.query(`
        SELECT COUNT(DISTINCT sce.student_id) AS cnt
        FROM student_career_enrollments sce
        WHERE sce.status = 'active' ${careerWhere}
      `, { replacements, type: sequelize.QueryTypes.SELECT });

      const totals = {
        total_careers: result.length,
        total_students: Number(totalUnique?.cnt ?? 0),
        total_records: result.reduce((s, r) => s + r.total_records, 0),
        total_approved: result.reduce((s, r) => s + r.total_approved, 0),
      };

      res.status(200).json({ data: result, totals });
    } catch (error) {
      console.error('[subjectsByCareer] Error:', error.message);
      res.status(500).json({ error: 'Error fetching subjects by career', details: error.message });
    }
  },

  studySessionsUsage: async (req, res) => {
    try {
      const { career_id, start_date, end_date, type } = req.query;
      const replacements = {};
      const sessionFilters = [];
      const careerFilter = career_id ? 'AND c.id = :career_id' : '';

      if (career_id) replacements.career_id = Number(career_id);

      if (start_date) {
        sessionFilters.push('ss.date_time >= :start_date');
        replacements.start_date = start_date;
      }

      if (end_date) {
        sessionFilters.push('ss.date_time <= :end_date');
        replacements.end_date = end_date;
      }

      if (type) {
        sessionFilters.push('ss.type = :type');
        replacements.type = type;
      }

      const sessionWhere = sessionFilters.length > 0 ? `AND ${sessionFilters.join(' AND ')}` : '';

      const careersQuery = `
        WITH session_base AS (
          SELECT
            ss.id,
            ss.subject_id,
            ss.status,
            COALESCE(ss.max_slots, 0) AS max_slots,
            sce.career_id
          FROM study_sessions ss
          JOIN student_career_enrollments sce
            ON sce.student_id = ss.host_student_id
            AND sce.status = 'active'
          WHERE 1=1 ${sessionWhere}
        ),
        registration_agg AS (
          SELECT
            ssr.study_session_id,
            COUNT(*) AS total_registrations,
            COUNT(*) FILTER (WHERE ssr.status = 'approved') AS approved,
            COUNT(*) FILTER (WHERE ssr.status = 'pending') AS pending,
            COUNT(*) FILTER (WHERE ssr.status = 'rejected') AS rejected
          FROM study_session_registrations ssr
          GROUP BY ssr.study_session_id
        )
        SELECT
          c.id AS career_id,
          c.name AS career_name,
          COUNT(sb.id) AS total_sessions,
          COUNT(sb.id) FILTER (WHERE sb.status = 'abierta') AS abierta,
          COUNT(sb.id) FILTER (WHERE sb.status = 'cancelada') AS cancelada,
          COUNT(sb.id) FILTER (WHERE sb.status = 'finalizada') AS finalizada,
          COALESCE(SUM(ra.total_registrations), 0) AS total_registrations,
          COALESCE(SUM(ra.approved), 0) AS approved,
          COALESCE(SUM(ra.pending), 0) AS pending,
          COALESCE(SUM(ra.rejected), 0) AS rejected,
          COALESCE(SUM(sb.max_slots), 0) AS total_slots
        FROM careers c
        LEFT JOIN session_base sb ON sb.career_id = c.id
        LEFT JOIN registration_agg ra ON ra.study_session_id = sb.id
        WHERE 1=1 ${careerFilter}
        GROUP BY c.id, c.name
        HAVING COUNT(sb.id) > 0
        ORDER BY total_sessions DESC, c.name ASC
      `;

      const subjectsQuery = `
        WITH session_base AS (
          SELECT
            ss.id,
            ss.subject_id,
            ss.status,
            COALESCE(ss.max_slots, 0) AS max_slots,
            sce.career_id
          FROM study_sessions ss
          JOIN student_career_enrollments sce
            ON sce.student_id = ss.host_student_id
            AND sce.status = 'active'
          WHERE 1=1 ${sessionWhere}
        ),
        registration_agg AS (
          SELECT
            ssr.study_session_id,
            COUNT(*) AS total_registrations,
            COUNT(*) FILTER (WHERE ssr.status = 'approved') AS approved,
            COUNT(*) FILTER (WHERE ssr.status = 'pending') AS pending,
            COUNT(*) FILTER (WHERE ssr.status = 'rejected') AS rejected
          FROM study_session_registrations ssr
          GROUP BY ssr.study_session_id
        )
        SELECT
          sb.career_id,
          sb.subject_id,
          subj.name AS subject_name,
          COUNT(sb.id) AS total_sessions,
          COUNT(sb.id) FILTER (WHERE sb.status = 'abierta') AS abierta,
          COUNT(sb.id) FILTER (WHERE sb.status = 'cancelada') AS cancelada,
          COUNT(sb.id) FILTER (WHERE sb.status = 'finalizada') AS finalizada,
          COALESCE(SUM(ra.total_registrations), 0) AS total_registrations,
          COALESCE(SUM(ra.approved), 0) AS approved,
          COALESCE(SUM(ra.pending), 0) AS pending,
          COALESCE(SUM(ra.rejected), 0) AS rejected,
          COALESCE(SUM(sb.max_slots), 0) AS total_slots
        FROM session_base sb
        LEFT JOIN registration_agg ra ON ra.study_session_id = sb.id
        LEFT JOIN subjects subj ON subj.id = sb.subject_id
        WHERE 1=1 ${career_id ? 'AND sb.career_id = :career_id' : ''}
          AND sb.subject_id IS NOT NULL
        GROUP BY sb.career_id, sb.subject_id, subj.name
        ORDER BY sb.career_id, total_sessions DESC, subj.name ASC
      `;

      const monthlyQuery = `
        WITH session_base AS (
          SELECT
            ss.id,
            ss.date_time,
            sce.career_id
          FROM study_sessions ss
          JOIN student_career_enrollments sce
            ON sce.student_id = ss.host_student_id
            AND sce.status = 'active'
          WHERE 1=1 ${sessionWhere}
        ),
        registration_agg AS (
          SELECT
            ssr.study_session_id,
            COUNT(*) AS total_registrations
          FROM study_session_registrations ssr
          GROUP BY ssr.study_session_id
        )
        SELECT
          TO_CHAR(DATE_TRUNC('month', sb.date_time), 'YYYY-MM') AS month,
          COUNT(sb.id) AS sessions,
          COALESCE(SUM(ra.total_registrations), 0) AS registrations
        FROM session_base sb
        LEFT JOIN registration_agg ra ON ra.study_session_id = sb.id
        WHERE 1=1 ${career_id ? 'AND sb.career_id = :career_id' : ''}
        GROUP BY DATE_TRUNC('month', sb.date_time)
        ORDER BY month ASC
      `;

      const careers = await sequelize.query(careersQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      const subjects = await sequelize.query(subjectsQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      const monthly = await sequelize.query(monthlyQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      const subjectsByCareerId = {};
      for (const row of subjects) {
        const cid = Number(row.career_id);
        if (!subjectsByCareerId[cid]) subjectsByCareerId[cid] = [];
        const totalSlots = Number(row.total_slots);
        const approvedRegs = Number(row.approved);
        subjectsByCareerId[cid].push({
          subject_id: Number(row.subject_id),
          subject_name: row.subject_name,
          total_sessions: Number(row.total_sessions),
          by_status: {
            abierta: Number(row.abierta),
            cancelada: Number(row.cancelada),
            finalizada: Number(row.finalizada),
          },
          participation: {
            total_registrations: Number(row.total_registrations),
            approved: approvedRegs,
            pending: Number(row.pending),
            rejected: Number(row.rejected),
            occupancy_pct: totalSlots > 0 ? +((approvedRegs / totalSlots) * 100).toFixed(1) : 0,
          },
        });
      }

      const by_career = careers.map((row) => {
        const totalSlots = Number(row.total_slots);
        const approvedRegs = Number(row.approved);
        return {
          career_id: Number(row.career_id),
          career_name: row.career_name,
          total_sessions: Number(row.total_sessions),
          by_status: {
            abierta: Number(row.abierta),
            cancelada: Number(row.cancelada),
            finalizada: Number(row.finalizada),
          },
          participation: {
            total_registrations: Number(row.total_registrations),
            approved: approvedRegs,
            pending: Number(row.pending),
            rejected: Number(row.rejected),
            occupancy_pct: totalSlots > 0 ? +((approvedRegs / totalSlots) * 100).toFixed(1) : 0,
          },
          subjects: subjectsByCareerId[Number(row.career_id)] || [],
        };
      });

      const totals = by_career.reduce((acc, row) => {
        acc.total_sessions += row.total_sessions;
        acc.by_status.abierta += row.by_status.abierta;
        acc.by_status.cancelada += row.by_status.cancelada;
        acc.by_status.finalizada += row.by_status.finalizada;
        acc.participation.total_registrations += row.participation.total_registrations;
        acc.participation.approved += row.participation.approved;
        acc.participation.pending += row.participation.pending;
        acc.participation.rejected += row.participation.rejected;
        return acc;
      }, {
        total_sessions: 0,
        by_status: { abierta: 0, cancelada: 0, finalizada: 0 },
        participation: { total_registrations: 0, approved: 0, pending: 0, rejected: 0, avg_occupancy: 0 },
      });

      totals.participation.avg_occupancy = by_career.length > 0
        ? +(by_career.reduce((sum, row) => sum + row.participation.occupancy_pct, 0) / by_career.length).toFixed(1)
        : 0;

      res.status(200).json({
        data: {
          totals,
          monthly_trend: monthly.map((row) => ({
            month: row.month,
            sessions: Number(row.sessions),
            registrations: Number(row.registrations),
          })),
          by_career,
        },
      });
    } catch (error) {
      console.error('[studySessionsUsage] Error:', error.message);
      res.status(500).json({ error: 'Error fetching study sessions usage', details: error.message });
    }
  },

  subjectsApprovedByCareer: async (req, res) => {
    try {
      const { career_id } = req.query;

      const replacements = {};
      const careerWhere = career_id ? 'AND sce.career_id = :career_id' : '';
      if (career_id) replacements.career_id = career_id;

      // 1. Career-level approval stats
      const careersQuery = `
        SELECT
          c.id AS career_id,
          c.name AS career_name,
          COUNT(DISTINCT sce.student_id) AS total_students,
          COUNT(DISTINCT ar.id) AS total_records,
          COUNT(DISTINCT ar.id) FILTER (WHERE ar.status IN ('aprobado', 'equivalencia')) AS approved_records,
          COUNT(DISTINCT subj.id) AS total_subjects,
          COUNT(DISTINCT subj.id) FILTER (WHERE ar.status IN ('aprobado', 'equivalencia')) AS approved_subjects
        FROM careers c
        JOIN student_career_enrollments sce ON sce.career_id = c.id AND sce.status = 'active'
        LEFT JOIN academic_records ar ON ar.id_student = sce.student_id
        LEFT JOIN plan_subjects ps ON ps.id = ar.plan_subject_id
        LEFT JOIN subjects subj ON subj.id = COALESCE(ar.id_subject, ps.id_subject)
        WHERE 1=1 ${careerWhere}
        GROUP BY c.id, c.name
        ORDER BY approved_records DESC
      `;

      const careers = await sequelize.query(careersQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      // 2. Subject-level approval per career
      const subjectsQuery = `
        SELECT
          sce.career_id,
          s.id AS subject_id,
          s.name AS subject_name,
          COUNT(DISTINCT ar.id) AS total_records,
          COUNT(DISTINCT ar.id) FILTER (WHERE ar.status IN ('aprobado', 'equivalencia')) AS approved_count,
          MIN(ps.suggested_year) AS suggested_year
        FROM academic_records ar
        JOIN student_career_enrollments sce ON sce.student_id = ar.id_student AND sce.status = 'active'
        LEFT JOIN plan_subjects ps ON ps.id = ar.plan_subject_id
        LEFT JOIN subjects s ON s.id = COALESCE(ar.id_subject, ps.id_subject)
        WHERE 1=1 ${careerWhere}
          AND COALESCE(ar.id_subject, ps.id_subject) IS NOT NULL
        GROUP BY sce.career_id, s.id, s.name
        ORDER BY sce.career_id, MIN(ps.suggested_year), s.name
      `;

      const subjects = await sequelize.query(subjectsQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      // Assemble
      const subjectsByCareerId = {};
      for (const s of subjects) {
        const cid = Number(s.career_id);
        if (!subjectsByCareerId[cid]) subjectsByCareerId[cid] = [];
        subjectsByCareerId[cid].push({
          subject_id: Number(s.subject_id),
          subject_name: s.subject_name,
          suggested_year: s.suggested_year ? Number(s.suggested_year) : null,
          total_records: Number(s.total_records),
          approved_count: Number(s.approved_count),
          approval_pct: Number(s.total_records) > 0
            ? +(((s.approved_count / s.total_records)) * 100).toFixed(1)
            : 0,
        });
      }

      const result = careers.map(r => {
        const approved = Number(r.approved_records);
        const total = Number(r.total_records);
        return {
          career_id: Number(r.career_id),
          career_name: r.career_name,
          total_students: Number(r.total_students),
          total_records: total,
          approved_records: approved,
          approval_pct: total > 0 ? +((approved / total) * 100).toFixed(1) : 0,
          total_subjects: Number(r.total_subjects),
          approved_subjects: Number(r.approved_subjects),
          subjects: subjectsByCareerId[Number(r.career_id)] || [],
        };
      });

      const totals = {
        total_careers: result.length,
        total_students: result.reduce((s, r) => s + r.total_students, 0),
        total_records: result.reduce((s, r) => s + r.total_records, 0),
        total_approved: result.reduce((s, r) => s + r.approved_records, 0),
        avg_approval_pct: result.length > 0
          ? +(result.reduce((s, r) => s + r.approval_pct, 0) / result.length).toFixed(1)
          : 0,
      };

      res.status(200).json({ data: result, totals });
    } catch (error) {
      console.error('[subjectsApprovedByCareer] Error:', error.message);
      res.status(500).json({ error: 'Error fetching subjects approved by career', details: error.message });
    }
  },

  getStudentsByApprovedCount: async (req, res) => {
    try {
      const { approved_count, career_id } = req.query;

      if (approved_count === undefined || approved_count === '') {
        return res.status(400).json({ error: 'approved_count is required' });
      }

      const approvedCount = Number(approved_count);
      const enrollmentConditions = ["sce.status = 'active'"];
      const replacements = { approved_count: approvedCount };

      if (career_id) {
        enrollmentConditions.push('sce.career_id = :career_id');
        replacements.career_id = career_id;
      }

      const needsEnrollment = !!career_id;
      const enrollmentJoin = needsEnrollment
        ? `JOIN student_career_enrollments sce ON sce.student_id = u.id AND ${enrollmentConditions.join(' AND ')}`
        : '';

      const query = `
        SELECT
          u.id,
          u.name,
          u.lastname,
          u.email,
          s.legajo,
          COALESCE(sub.approved_count, 0) AS approved_count
        FROM users u
        ${enrollmentJoin}
        LEFT JOIN students s ON s.user_id = u.id
        LEFT JOIN (
          SELECT
            ar.id_student,
            COUNT(DISTINCT COALESCE(ar.id_subject, ps.id_subject)) AS approved_count
          FROM academic_records ar
          LEFT JOIN final_exams fe ON fe.id_academic_record = ar.id AND fe.status = 'aprobado'
          LEFT JOIN plan_subjects ps ON ps.id = ar.plan_subject_id
          WHERE ar.status IN ('aprobado', 'equivalencia') OR (ar.status = 'pendiente' AND fe.id IS NOT NULL)
          GROUP BY ar.id_student
        ) sub ON sub.id_student = u.id
        WHERE u.role = 'student'
          AND COALESCE(sub.approved_count, 0) = :approved_count
        ORDER BY u.name, u.lastname
      `;

      const students = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      res.status(200).json({
        data: students.map(s => ({
          id: s.id,
          name: s.name,
          lastname: s.lastname,
          email: s.email,
          legajo: s.legajo,
          approved_count: Number(s.approved_count),
        })),
      });
    } catch (error) {
      console.error('[getStudentsByApprovedCount] Error:', error.message);
      res.status(500).json({ error: 'Error fetching students by approved count', details: error.message });
    }
  },

  socialConnections: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      const replacements = {};
      const dateConditions = [];

      if (start_date) {
        dateConditions.push('c."createdAt" >= :start_date');
        replacements.start_date = start_date;
      }
      if (end_date) {
        dateConditions.push('c."createdAt" <= :end_date');
        replacements.end_date = end_date;
      }

      const dateWhere = dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : '';

      // 1. Overall stats
      const statsQuery = `
        WITH user_connections AS (
          SELECT u.id AS user_id, COUNT(c.id)::int AS connections_count
          FROM users u
          LEFT JOIN connections c ON (c.id_user = u.id OR c.id_connected_user = u.id) AND c.status = 'accepted' ${dateWhere}
          WHERE u.role = 'student'
          GROUP BY u.id
        )
        SELECT
          COUNT(*)::int AS total_students,
          COUNT(*) FILTER (WHERE connections_count > 0)::int AS students_with_connections,
          COUNT(*) FILTER (WHERE connections_count = 0)::int AS students_without_connections,
          COALESCE(AVG(connections_count), 0)::float AS average_connections,
          COALESCE(MAX(connections_count), 0)::int AS max_connections
        FROM user_connections
      `;

      // 2. Distribution
      const distributionQuery = `
        WITH user_connections AS (
          SELECT u.id AS user_id, COUNT(c.id)::int AS connections_count
          FROM users u
          LEFT JOIN connections c ON (c.id_user = u.id OR c.id_connected_user = u.id) AND c.status = 'accepted' ${dateWhere}
          WHERE u.role = 'student'
          GROUP BY u.id
        )
        SELECT
          COALESCE(connections_count, 0) AS connections_count,
          COUNT(*)::int AS student_count
        FROM user_connections
        GROUP BY COALESCE(connections_count, 0)
        ORDER BY connections_count ASC
      `;

      // 3. Connection status breakdown
      const statusQuery = `
        SELECT status, COUNT(*)::int AS count
        FROM connections c
        WHERE 1=1 ${dateWhere}
        GROUP BY status
      `;

      const [stats] = await sequelize.query(statsQuery, { replacements, type: sequelize.QueryTypes.SELECT });
      const distribution = await sequelize.query(distributionQuery, { replacements, type: sequelize.QueryTypes.SELECT });
      const statusBreakdown = await sequelize.query(statusQuery, { replacements, type: sequelize.QueryTypes.SELECT });

      res.status(200).json({
        data: {
          total_students: Number(stats?.total_students ?? 0),
          students_with_connections: Number(stats?.students_with_connections ?? 0),
          students_without_connections: Number(stats?.students_without_connections ?? 0),
          average_connections: +(stats?.average_connections ?? 0).toFixed(1),
          max_connections: Number(stats?.max_connections ?? 0),
          distribution: distribution.map(d => ({
            connections_count: Number(d.connections_count),
            student_count: Number(d.student_count),
          })),
          status_breakdown: statusBreakdown.reduce((acc, row) => {
            acc[row.status] = Number(row.count);
            return acc;
          }, { pending: 0, accepted: 0, rejected: 0 }),
        }
      });
    } catch (error) {
      console.error('[socialConnections] Error:', error.message);
      res.status(500).json({ error: 'Error fetching social connections report', details: error.message });
    }
  },

  getStudentsByConnectionsCount: async (req, res) => {
    try {
      const { connections_count, career_id } = req.query;

      if (connections_count === undefined || connections_count === '') {
        return res.status(400).json({ error: 'connections_count is required' });
      }

      const count = Number(connections_count);
      const enrollmentConditions = ["sce.status = 'active'"];
      const replacements = { connections_count: count };

      if (career_id) {
        enrollmentConditions.push('sce.career_id = :career_id');
        replacements.career_id = career_id;
      }

      const needsEnrollment = !!career_id;
      const enrollmentJoin = needsEnrollment
        ? `JOIN student_career_enrollments sce ON sce.student_id = u.id AND ${enrollmentConditions.join(' AND ')}`
        : '';

      const query = `
        WITH user_connections AS (
          SELECT u.id AS user_id, COUNT(c.id)::int AS connections_count
          FROM users u
          LEFT JOIN connections c ON (c.id_user = u.id OR c.id_connected_user = u.id) AND c.status = 'accepted'
          WHERE u.role = 'student'
          GROUP BY u.id
        )
        SELECT
          u.id,
          u.name,
          u.lastname,
          u.email,
          s.legajo,
          COALESCE(uc.connections_count, 0) AS connections_count
        FROM users u
        ${enrollmentJoin}
        LEFT JOIN students s ON s.user_id = u.id
        LEFT JOIN user_connections uc ON uc.user_id = u.id
        WHERE u.role = 'student'
          AND COALESCE(uc.connections_count, 0) = :connections_count
        ORDER BY u.name, u.lastname
      `;

      const students = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      res.status(200).json({
        data: students.map(s => ({
          id: s.id,
          name: s.name,
          lastname: s.lastname,
          email: s.email,
          legajo: s.legajo,
          connections_count: Number(s.connections_count),
        })),
      });
    } catch (error) {
      console.error('[getStudentsByConnectionsCount] Error:', error.message);
      res.status(500).json({ error: 'Error fetching students by connections count', details: error.message });
    }
  },
};

module.exports = reportController;
