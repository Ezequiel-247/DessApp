const { FinalExam, AcademicRecord, Subject } = require('../models');
const academicRecordService = require('../academicRecordService');

const finalExamController = {
  getAll: async (req, res) => {
    try {
      const { studentId } = req.query;
      const whereAcademicRecord = {};
      if (studentId) whereAcademicRecord.id_student = studentId;

      const exams = await FinalExam.findAll({
        include: [{
          model: AcademicRecord,
          where: whereAcademicRecord,
          attributes: ['id', 'id_student', 'id_subject', 'year', 'semester', 'grade', 'status'],
          include: [{ model: Subject, attributes: ['id', 'name', 'code'] }],
        }],
      });
      res.status(200).json({ data: exams });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching final exams', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const exam = await FinalExam.findByPk(id, { include: [{ model: AcademicRecord }] });
      if (!exam) {
        return res.status(404).json({ error: 'Final exam not found' });
      }
      res.status(200).json({ data: exam });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching final exam', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const newExam = await academicRecordService.addFinalExam(req.body, req.user?.id);
      res.status(201).json({ message: 'Examen final registrado exitosamente', data: newExam });
    } catch (error) {
      if (error.name === 'DomainError') {
        return res.status(error.statusCode).json({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'El examen final ya existe' });
      }
      res.status(500).json({ error: 'Error al registrar el examen final', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const [updatedRows] = await FinalExam.update(data, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Final exam not found or no changes made' });
      }

      const updatedExam = await FinalExam.findByPk(id);
      res.status(200).json({ message: 'Final exam updated successfully', data: updatedExam });
    } catch (error) {
      res.status(500).json({ error: 'Error updating final exam', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await FinalExam.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Final exam not found' });
      }
      res.status(200).json({ message: `Final exam with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Final exam already exists' });
      }
      res.status(500).json({ error: 'Error updating final exam', details: error.message });
    }
  }
};

module.exports = finalExamController;
