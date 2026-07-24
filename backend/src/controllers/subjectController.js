const { Subject, PlanSubject, StudentCareerEnrollment } = require('../models');
const { Op } = require('sequelize');

const subjectController = {
  getAll: async (req, res) => {
    try {
      const whereClause = {};
      // Si viene por query string "is_unahur=true" o "false", lo filtramos
      if (req.query.is_unahur !== undefined) {
        whereClause.is_unahur = req.query.is_unahur === 'true';
      }
      
      const subjects = await Subject.findAll({ where: whereClause });
      res.status(200).json({ data: subjects });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching subjects', details: error.message });
    }
  },

  getByStudent: async (req, res) => {
    try {
      const { studentId } = req.params;

      const enrollments = await StudentCareerEnrollment.findAll({
        where: { student_id: studentId, is_active: true },
      });

      if (!enrollments.length) {
        return res.status(404).json({ error: 'No active enrollments found for this student' });
      }

      const studyPlanIds = enrollments.map((e) => e.study_plan_id).filter(Boolean);

      if (!studyPlanIds.length) {
        return res.status(400).json({ error: 'Enrollments have no study plan assigned' });
      }

      const planSubjects = await PlanSubject.findAll({
        where: { id_study_plan: studyPlanIds },
        include: [{ model: Subject, as: 'subject' }],
      });

      const subjectMap = new Map();
      for (const ps of planSubjects) {
        if (ps.subject && !subjectMap.has(ps.subject.id)) {
          subjectMap.set(ps.subject.id, ps.subject);
        }
      }

      res.status(200).json({ data: Array.from(subjectMap.values()) });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching subjects by student', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const subject = await Subject.findByPk(id);
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      res.status(200).json({ data: subject });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching subject', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const newSubject = await Subject.create({
        name: data.name,
        code: data.code,
        is_unahur: data.is_unahur !== undefined ? data.is_unahur : true,
      });
      res.status(201).json({ message: 'Subject created', data: newSubject });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Subject name already exists' });
      }
      res.status(500).json({ error: 'Error creating subject', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const [updatedRows] = await Subject.update(data, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Subject not found or no changes made' });
      }

      const updatedSubject = await Subject.findByPk(id);
      res.status(200).json({ message: 'Subject updated successfully', data: updatedSubject });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Subject name already exists' });
      }
      res.status(500).json({ error: 'Error updating subject', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Subject.destroy({ where: { id } });

      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      res.status(200).json({ message: `Subject with id: ${id} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting subject', details: error.message });
    }
  },

  // Endpoints Adicionales
  getUnahur: async (req, res) => {
    try {
      const subjects = await Subject.findAll({ where: { is_unahur: true } });
      res.status(200).json({ data: subjects });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching UNAHUR subjects', details: error.message });
    }
  },

  getCount: async (req, res) => {
    try {
      const count = await Subject.count();
      res.status(200).json({ data: { total: count } });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching subjects count', details: error.message });
    }
  },

  search: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      // Op.iLike asume Postgres. Busca case-insensitive y coincidencias parciales.
      const subjects = await Subject.findAll({ where: { name: { [Op.iLike]: `%${q}%` } } });
      res.status(200).json({ data: subjects });
    } catch (error) {
      res.status(500).json({ error: 'Error searching subjects', details: error.message });
    }
  },

  restore: async (req, res) => {
    try {
      const { id } = req.params;
      
      // .restore() deshace el Soft Delete (paranoid)
      await Subject.restore({ where: { id } });
      
      // Buscamos la materia para confirmar que se restauró y devolverla
      const restoredSubject = await Subject.findByPk(id);
      
      res.status(200).json({ message: `Subject with id: ${id} restored successfully`, data: restoredSubject });
    } catch (error) {
      res.status(500).json({ error: 'Error restoring subject', details: error.message });
    }
  }
};

module.exports = subjectController;
