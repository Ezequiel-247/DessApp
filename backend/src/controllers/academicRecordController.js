const { Op } = require('sequelize');
const { AcademicRecord, PlanSubject, StudentCareerEnrollment, Subject, FinalExam, PlanElectiveBlock, PlanElectiveBlockSubject } = require('../models');
const academicRecordService = require('../academicRecordService');
const { calcularMicroEstado } = require('../domain/microEstados');

const academicRecordController = {

  getAll: async (req, res) => {
    try {
      const { studentId } = req.query || {};
      const where = {};
      if (studentId) where.id_student = studentId;
      const academicRecords = await AcademicRecord.findAll({
        where,
        include: [
          { model: Subject },
          { model: FinalExam, as: 'final_exams', attributes: ['id', 'status', 'grade', 'year', 'semester'] }
        ]
      });
      const enriched = academicRecords.map((record) => {
        const plain = record.toJSON();
        const finalExams = plain.final_exams || [];
        const sorted = [...finalExams].sort((a, b) => (b.year - a.year) || (b.semester - a.semester));
        return {
          ...plain,
          micro_estado_calculado: calcularMicroEstado(record),
          final_exams_count: finalExams.length,
          latest_final_exam_status: sorted[0]?.status || null,
        };
      });
      res.status(200).json({ data: enriched });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching academic records', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const record = await AcademicRecord.findByPk(id, {
        include: [{ model: Subject }]
      });
      if (!record) {
        return res.status(404).json({ error: 'Academic record not found' });
      }
      res.status(200).json({ data: record });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching academic record', details: error.message });
    }
  },

  getByStudentId: async (req, res) => {
    try {
      const { student_id } = req.params;
      const academicRecord = await AcademicRecord.findOne({
        where: { id_student: student_id },
        include: [{ model: Subject }]
      });

      if (!academicRecord) {
        return res.status(404).json({ error: 'Academic record not found' });
      }

      res.status(200).json({ data: academicRecord });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching academic record', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const studentId = data.id_student || data.studentId;

      const enrollment = await StudentCareerEnrollment.findOne({
        where: { student_id: studentId, is_active: true, status: 'active' }
      });
      if (!enrollment || !enrollment.study_plan_id) {
        return res.status(400).json({ error: 'Student has no active enrollment' });
      }

      const planSubject = await PlanSubject.findOne({
        where: {
          id_study_plan: enrollment.study_plan_id,
          id_subject: data.id_subject || data.subjectId
        }
      });

      if (!planSubject) {
        const subject = await Subject.findByPk(data.id_subject || data.subjectId);
        if (!subject) {
          return res.status(400).json({ error: 'Subject not found' });
        }
        if (subject.is_unahur) {
          // Materia UNAHUR válida fuera del plan específico.
        } else {
          const electivePs = await PlanSubject.findOne({
            where: { id_study_plan: enrollment.study_plan_id, id_subject: data.id_subject || data.subjectId, is_elective: true }
          });
          if (!electivePs) {
            return res.status(400).json({ error: 'Subject not found in the student\'s study plan' });
          }
          const electiveBlock = await PlanElectiveBlock.findOne({
            where: { id_study_plan: enrollment.study_plan_id },
            include: [{
              model: PlanElectiveBlockSubject,
              where: { id_plan_subject: electivePs.id },
              required: true,
            }],
          });
          if (!electiveBlock) {
            return res.status(400).json({ error: 'Subject not found in the student\'s study plan' });
          }
        }
      }

      // Anti-colisión cuatrimestral: mismo subject + year + semester en AcademicRecord
      if (data.year && data.semester) {
        const collision = await AcademicRecord.findOne({
          where: {
            id_subject: data.id_subject || data.subjectId,
            id_student: studentId,
            year: data.year,
            semester: data.semester,
          },
        });
        if (collision) {
          return res.status(422).json({
            error: 'No es posible registrar múltiples cursadas para una misma materia en el mismo año y cuatrimestre.',
          });
        }
      }

      // effectiveStatus también se reutiliza más abajo para recalcular
      // regularity_expires_at server-side, sin confiar en lo que mande el cliente
      // (ver FIX_VENCIMIENTO_REGULARIDAD_FINALES.md — la importación de Excel mandaba
      // un vencimiento calculado mal y este endpoint lo persistía tal cual).
      let effectiveStatus = data.status;
      if ((data.status === 'aprobado' || data.status === 'approved') && data.grade) {
        const gradeNum = parseFloat(data.grade);
        if (!isNaN(gradeNum) && gradeNum >= 4 && gradeNum <= 6) {
          effectiveStatus = 'pendiente';
        }
      }

      // Superposición de regularidades: si el nuevo registro será pendiente,
      // calcular su vencimiento (year + 2) y rechazar si colisiona con uno posterior
      if (data.year && data.semester) {
        if (effectiveStatus === 'pendiente') {
          const newYear = Number(data.year);
          const expiryYear = newYear + 2;
          const laterRecord = await AcademicRecord.findOne({
            where: {
              id_subject: data.id_subject || data.subjectId,
              id_student: studentId,
              [Op.and]: [
                {
                  [Op.or]: [
                    { year: { [Op.gt]: newYear } },
                    { year: newYear, semester: { [Op.gt]: Number(data.semester) } },
                  ],
                },
                { year: { [Op.lte]: expiryYear } },
              ],
            },
            order: [['year', 'ASC'], ['semester', 'ASC']],
          });
          if (laterRecord) {
            return res.status(422).json({
              error: 'Inconsistencia cronológica: La nueva regularidad se superpone con un registro posterior.',
            });
          }
        }
      }

      // Bloqueo de cursadas en período de regularidad histórica vigente
      if (data.year && data.semester) {
        const newSemesterMid = Number(data.semester) === 1 ? '06-15' : '12-15';
        const newDateStr = `${String(data.year).padStart(4, '0')}-${newSemesterMid}`;
        const activeRegularidad = await AcademicRecord.findOne({
          where: {
            id_subject: data.id_subject || data.subjectId,
            id_student: studentId,
            status: 'pendiente',
            regularity_expires_at: { [Op.gte]: newDateStr },
            [Op.or]: [
              { year: { [Op.lt]: Number(data.year) } },
              { year: Number(data.year), semester: { [Op.lt]: Number(data.semester) } },
            ],
          },
          order: [['year', 'DESC'], ['semester', 'DESC']],
        });
        if (activeRegularidad) {
          return res.status(422).json({
            error: 'Inconsistencia cronológica: No es posible registrar una nueva cursada durante el período de vigencia de una regularidad anterior.',
          });
        }
      }

      // Si el cliente no manda un vencimiento explícito, se recalcula acá con la
      // fórmula oficial en vez de dejarlo en null — así ningún origen (import Excel,
      // alta manual, etc.) puede persistir una regularidad sin vencimiento o con uno
      // inventado del lado del cliente.
      const regularityExpiresAt = data.regularity_expires_at
        ?? (effectiveStatus === 'pendiente' && data.year && data.semester
          ? academicRecordService.calcularRegularidadExpiresAt(Number(data.year), Number(data.semester))
          : null);

      const payload = {
        student_id: studentId,
        plan_subject_id: planSubject ? planSubject.id : null,
        id_subject: data.id_subject || data.subjectId,
        year: data.year,
        term: data.semester,
        status: data.status,
        grade: data.grade,
        regularity_expires_at: regularityExpiresAt,
        course_id: data.course_id || null,
      };

      const newAcademicRecord = await academicRecordService.addRecord(payload);
      res.status(201).json({ message: 'Academic record created successfully', data: newAcademicRecord });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Academic record already exists' });
      }
      res.status(400).json({ error: 'Error creating academic record', details: error.message });
    }
  },

    update: async (req, res) => {
        try{
            const {id} = req.params;
            const data = req.body;
            const currentRecord = await AcademicRecord.findByPk(id);
            if (!currentRecord) {
                return res.status(404).json({ error: 'Academic record not found' });
            }

            const payload = {
              id_student: data.id_student || data.studentId,
              id_subject: data.id_subject || data.subjectId,
              grade: data.grade,
            };

            if (data.year !== undefined) payload.year = data.year;
            if (data.semester !== undefined) payload.semester = data.semester;

            // Bug 2: solo enrolled puede cambiar de estado
            if (data.status && currentRecord.status === 'enrolled') {
              payload.status = data.status;
            }

            // Recalcular regularity_expires_at si cambia el año/cuatrimestre de
            // cursada o la nota: si no, queda desincronizado con lo que el
            // modal de edición mostró como vencimiento (ver AcademicRecordFormModal).
            const resolvedYear = payload.year ?? currentRecord.year;
            const resolvedSemester = payload.semester ?? currentRecord.semester;
            const resolvedGrade = payload.grade ?? currentRecord.grade;
            const numGrade = resolvedGrade !== null && resolvedGrade !== undefined ? parseFloat(resolvedGrade) : NaN;

            if (data.regularity_expires_at !== undefined) {
              payload.regularity_expires_at = data.regularity_expires_at;
            } else if (!isNaN(numGrade) && numGrade >= 4 && numGrade <= 6) {
              payload.regularity_expires_at = academicRecordService.calcularRegularidadExpiresAt(resolvedYear, resolvedSemester);
            }

      const [updatedRows] = await AcademicRecord.update(payload, {where: {id}});
      if (updatedRows === 0){
          return res.status(404).json({ error: 'Academic record not found or no changes made' });
      }

      const updateAcademicRecord = await AcademicRecord.findByPk(id);
      res.status(200).json({ message: 'Academic record updated successfully', data: updateAcademicRecord });
    }
    catch(error){
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Academic record already exists' });
      }
      res.status(500).json({ error: 'Error updating academic record', details: error.message });
    }
    },

    updateByStudentId: async (req, res) => {
        try{
            const {student_id} = req.params;
            const data = req.body;
            const payload = {
              id_student: data.id_student || data.studentId,
              id_subject: data.id_subject || data.subjectId,
              year: data.year,
              semester: data.semester,
              status: data.status,
              grade: data.grade,
              regularity_expires_at: data.regularity_expires_at,
            };

      const [updatedRows] = await AcademicRecord.update(payload, {where: {id_student: student_id}});
      if (updatedRows === 0){
          return res.status(404).json({ error: 'Academic record not found or no changes made' });
      }

      const updateAcademicRecord = await AcademicRecord.findOne({ where: { id_student: student_id } });
      res.status(200).json({ message: 'Academic record updated successfully', data: updateAcademicRecord });
    }
    catch(error){
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Academic record already exists' });
      }
      res.status(500).json({ error: 'Error updating academic record', details: error.message });
    }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await academicRecordService.deleteRecord(id);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.name === 'DomainError') {
                return res.status(error.statusCode || 422).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error deleting academic record', details: error.message });
        }
    },

    deleteByStudentId: async (req, res) => {
        try {
            const {student_id} = req.params;
            const deleteRows = await AcademicRecord.destroy({where: {id_student: student_id}});

            if (deleteRows === 0) {
                return res.status(404).json({ error: 'Academic record not found' });
            }

            res.status(200).json({ message: `Academic record with student id: ${student_id} deleted successfully` });
        }
        catch (error){
            res.status(500).json({ error: 'Error deleting academic record', details: error.message });
        }
    }
};

module.exports = academicRecordController;
