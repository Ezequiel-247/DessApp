const { Op } = require('sequelize');
const { User, Student, Career, AcademicRecord, PlanSubject, Subject, StudyPlan, StudentCareerEnrollment, Connection, CustomStudyPlan, CustomStudyPlanItem, Correlativity, FinalExam, PlanElectiveBlock, PlanElectiveBlockSubject, sequelize } = require('../models');
const activityRecordService = require('../activityRecordService');

const buildProfilePayload = (student, options = {}) => {
  const { includeEmail = true, includeAcademicInfo = true, visibility = 'owner' } = options;
  const payload = student.toJSON();

  payload.visibility = visibility;

  if (payload.User && !includeEmail) {
    delete payload.User.email;
  }

  if (!includeAcademicInfo) {
    delete payload.academic_records;
  }

  return payload;
};

const findAcceptedConnection = async (viewerUserId, targetUserId) => {
  return Connection.findOne({
    where: {
      status: 'accepted',
      [Op.or]: [
        { id_user: viewerUserId, id_connected_user: targetUserId },
        { id_user: targetUserId, id_connected_user: viewerUserId },
      ],
    },
  });
};
const academicRecordService = require('../academicRecordService');

const studentController = {

  getAll: async (req, res) => {
    try {
      const students = await Student.findAll({
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          { model: StudentCareerEnrollment, as: 'enrollments', include: [{ model: Career, as: 'career' }, { model: StudyPlan, as: 'studyPlan' }] },
          {
            model: AcademicRecord,
            as: 'academic_records',
            include: [
              {
                model: PlanSubject,
                as: 'plan_subject',
                include: [
                  { model: Subject, as: 'subject' },
                  { model: StudyPlan, include: [{ model: Career }] },
                ],
              },
            ],
          },
        ],
      });
      return res.status(200).json({ data: students });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching students', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const user_id = req.params.id;
      const student = await Student.findOne({
        where: { user_id },
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          { model: StudentCareerEnrollment, as: 'enrollments', include: [{ model: Career, as: 'career' }, { model: StudyPlan, as: 'studyPlan' }] },
        ],
      });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      return res.status(200).json({ data: student });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching student', details: error.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const targetUserId = Number(req.params.id);
      const viewerUserId = Number(req.user?.id);

      if (!viewerUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (Number.isNaN(targetUserId)) {
        return res.status(400).json({ error: 'Invalid student id' });
      }

      const student = await Student.findOne({
        where: { user_id: targetUserId },
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          { model: StudentCareerEnrollment, as: 'enrollments', include: [{ model: Career, as: 'career' }, { model: StudyPlan, as: 'studyPlan' }] },
          {
            model: AcademicRecord,
            as: 'academic_records',
            include: [
              {
                model: PlanSubject,
                as: 'plan_subject',
                include: [
                  { model: Subject, as: 'subject' },
                  { model: StudyPlan, include: [{ model: Career }] },
                ],
              },
            ],
          },
        ],
      });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      if (viewerUserId === targetUserId) {
        return res.status(200).json({ data: buildProfilePayload(student, { visibility: 'owner' }) });
      }

      const isContact = Boolean(await findAcceptedConnection(viewerUserId, targetUserId));

      if (!student.public_profile && !isContact) {
        return res.status(403).json({ error: 'Profile is private. Only contacts can view details.' });
      }

      if (!student.public_profile && isContact) {
        return res.status(200).json({ data: buildProfilePayload(student, { visibility: 'contact' }) });
      }

      return res.status(200).json({
        data: buildProfilePayload(student, {
          includeEmail: Boolean(student.show_email),
          includeAcademicInfo: Boolean(student.show_academic_info),
          visibility: 'public',
        }),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching student profile', details: error.message });
    }
  },

  create: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { email, password, name, lastname, is_active, legajo, public_profile, show_email, show_academic_info, publish_approvals, enrollments } = req.body;

      const user = await User.create(
        { email, password, name, lastname, is_active: is_active !== undefined ? is_active : true, role: 'student' },
        { transaction }
      );

      const student = await Student.create(
        { user_id: user.id, legajo, public_profile, show_email, show_academic_info, publish_approvals },
        { transaction }
      );

      if (Array.isArray(enrollments) && enrollments.length > 0) {
        const enrollmentRecords = await Promise.all(
          enrollments.map(async (enrollment) => {
            const career = await Career.findByPk(enrollment.career_id, { transaction });
            if (!career) {
              throw new Error(`Career with id ${enrollment.career_id} not found`);
            }
            return {
              student_id: user.id,
              career_id: enrollment.career_id,
              enrolled_at: enrollment.enrolled_at || new Date().toISOString().split('T')[0],
              completed_at: enrollment.completed_at || null,
              status: enrollment.status || 'active',
              is_active: enrollment.is_active !== undefined ? enrollment.is_active : true,
            };
          })
        );
        await StudentCareerEnrollment.bulkCreate(enrollmentRecords, { transaction });
      }

      await transaction.commit();

      const userData = user.toJSON();
      delete userData.password;

      return res.status(201).json({ message: 'Student created successfully', data: { ...userData, student } });
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email o legajo' });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error creating student', details: error.message });
    }
  },

  update: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const user_id = req.params.id;
      const { email, password, name, lastname, is_active, legajo, public_profile, show_email, show_academic_info, publish_approvals } = req.body;

      const student = await Student.findOne({ where: { user_id } });
      if (!student) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Student not found' });
      }

      const userUpdateData = {};
      if (email !== undefined) userUpdateData.email = email;
      if (name !== undefined) userUpdateData.name = name;
      if (lastname !== undefined) userUpdateData.lastname = lastname;
      if (is_active !== undefined) userUpdateData.is_active = is_active;
      if (password) { userUpdateData.password = password; }

      if (Object.keys(userUpdateData).length > 0) {
        await User.update(userUpdateData, { where: { id: user_id }, transaction, individualHooks: true });
      }

      const studentUpdateData = {};
      if (legajo !== undefined) studentUpdateData.legajo = legajo;
      if (public_profile !== undefined) studentUpdateData.public_profile = public_profile;
      if (show_email !== undefined) studentUpdateData.show_email = show_email;
      if (show_academic_info !== undefined) studentUpdateData.show_academic_info = show_academic_info;
      if (publish_approvals !== undefined) studentUpdateData.publish_approvals = publish_approvals;

      if (Object.keys(studentUpdateData).length > 0) {
        await Student.update(studentUpdateData, { where: { user_id }, transaction });
      }

      await transaction.commit();

      const updatedStudent = await Student.findOne({
        where: { user_id },
        include: [{ model: User, attributes: { exclude: ['password'] } }]
      });

      return res.status(200).json({ message: 'Student updated successfully', data: updatedStudent });
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email o legajo' });
      }
      return res.status(500).json({ error: 'Error updating student', details: error.message });
    }
  },

  uploadAvatar: async (req, res) => {
    try {
      const targetUserId = Number(req.params.id);
      const viewerUserId = Number(req.user?.id);

      if (Number.isNaN(targetUserId)) {
        return res.status(400).json({ error: 'Invalid student id' });
      }

      if (!viewerUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (viewerUserId !== targetUserId) {
        return res.status(403).json({ error: 'You can only update your own avatar' });
      }

      const student = await Student.findOne({ where: { user_id: targetUserId } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Avatar file is required' });
      }

      const avatarUrl = req.file.url || `/uploads/avatars/${req.file.filename}`;
      await User.update({ avatar: avatarUrl }, { where: { id: targetUserId } });

      const updatedStudent = await Student.findOne({
        where: { user_id: targetUserId },
        include: [{ model: User, attributes: { exclude: ['password'] } }],
      });

      return res.status(200).json({
        message: 'Avatar updated successfully',
        data: updatedStudent,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error uploading avatar', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const user_id = req.params.id;
      const deletedRows = await User.destroy({ where: { id: user_id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      return res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Error deleting student', details: error.message });
    }
  },

  getEnrollments: async (req, res) => {
    try {
      const user_id = req.params.id;
      const student = await Student.findOne({ where: { user_id } });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const enrollments = await StudentCareerEnrollment.findAll({
        where: { student_id: user_id },
        include: [{ model: Career, as: 'career' }, { model: StudyPlan, as: 'studyPlan' }],
      });

      return res.status(200).json({ data: enrollments });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching enrollments', details: error.message });
    }
  },

  getPlanSubjects: async (req, res) => {
    try {
      const studentId = req.params.id;
      const enrollmentId = req.query.enrollmentId;

      if (!enrollmentId) {
        return res.status(400).json({ error: 'enrollmentId query parameter is required' });
      }

      const enrollment = await StudentCareerEnrollment.findOne({
        where: { id: enrollmentId, student_id: studentId },
      });

      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found for this student' });
      }

      if (!enrollment.study_plan_id) {
        return res.status(400).json({ error: 'Enrollment has no study plan assigned' });
      }

      const planSubjects = await PlanSubject.findAll({
        where: { id_study_plan: enrollment.study_plan_id },
        include: [{ model: Subject, as: 'subject' }],
      });

      const mandatorySubjects = planSubjects.map((ps) => {
        const subject = ps.subject;
        if (!subject) return null;
        return {
          id: String(subject.id),
          name: subject.name,
          code: subject.code,
          credits: ps.credits,
          suggested_year: ps.suggested_year,
          suggested_term: ps.suggested_term,
          is_unahur: subject.is_unahur,
        };
      }).filter(Boolean);

      const electiveBlocks = await PlanElectiveBlock.findAll({
        where: { id_study_plan: enrollment.study_plan_id },
        include: [{
          model: PlanElectiveBlockSubject,
          include: [{ model: PlanSubject, as: 'plan_subject', include: [{ model: Subject, as: 'subject' }] }],
        }],
      });

      const electiveSubjects = [];
      for (const block of electiveBlocks) {
        for (const link of (block.PlanElectiveBlockSubjects || [])) {
          const subj = link.plan_subject?.subject;
          if (!subj) continue;
          electiveSubjects.push({
            id: String(subj.id),
            name: subj.name,
            code: subj.code,
            credits: link.plan_subject.credits || null,
            suggested_year: block.suggested_year,
            suggested_term: link.plan_subject.suggested_term,
            is_unahur: subj.is_unahur,
          });
        }
      }

      const subjects = [...mandatorySubjects, ...electiveSubjects];

      return res.status(200).json({ data: subjects });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching plan subjects', details: error.message });
    }
  },

  getAcademicSummary: async (req, res) => {
    try {
      const studentId = req.params.id; // user_id in this context because the routes use user.id
      
      const student = await Student.findOne({ where: { user_id: studentId } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const summary = await academicRecordService.getAcademicSummary(studentId);
      return res.status(200).json({ data: summary });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching academic summary', details: error.message });
    }
  },

  getAcademicYearBreakdown: async (req, res) => {
    try {
      const studentId = req.params.id;
      const enrollmentId = req.query.enrollmentId || null;

      const student = await Student.findOne({ where: { user_id: studentId } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const breakdown = await academicRecordService.getAcademicYearBreakdown(studentId, enrollmentId);
      return res.status(200).json({ data: breakdown });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching academic year breakdown', details: error.message });
    }
  },

  getExamEligibility: async (req, res) => {
    try {
      const studentId = req.params.id;

      const student = await Student.findOne({ where: { user_id: studentId } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const eligible = await academicRecordService.getExamEligibility(studentId);
      return res.status(200).json({ data: eligible });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching exam eligibility', details: error.message });
    }
  },

  getSubjectEligibility: async (req, res) => {
    try {
      const studentId = req.params.id;
      const enrollmentId = req.query.enrollmentId || null;

      const student = await Student.findOne({ where: { user_id: studentId } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const eligibility = await academicRecordService.getSubjectEligibility(studentId, enrollmentId);
      return res.status(200).json({ data: eligibility });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching subject eligibility', details: error.message });
    }
  },

  getPendingFinalExams: async (req, res) => {
    try {
      const studentId = req.params.id;
      const enrollmentId = req.query.enrollmentId || null;

      const student = await Student.findOne({ where: { user_id: studentId } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const pending = await academicRecordService.getPendingFinalExams(studentId, enrollmentId);
      return res.status(200).json({ data: pending });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching pending final exams', details: error.message });
    }
  },

  getPlannerData: async (req, res) => {
    try {
      const studentId = req.params.id;
      const enrollmentId = req.query.enrollmentId;

      const student = await Student.findOne({ where: { user_id: studentId } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Sin enrollmentId (alumno con una sola carrera, o llamador viejo) se cae al
      // primer activo, igual que antes. Con enrollmentId (selector de carrera del
      // planificador) hay que anclarse a esa inscripción puntual: un alumno con más
      // de una carrera activa (ej. TUP + Ingeniería Ambiental) tiene varias filas que
      // matchean is_active+status, y sin este filtro findOne() siempre devolvía la
      // primera sin importar qué carrera hubiera elegido el alumno en el selector.
      const enrollment = await StudentCareerEnrollment.findOne({
        where: enrollmentId
          ? { id: enrollmentId, student_id: studentId }
          : { student_id: studentId, is_active: true, status: 'active' },
        include: [{ model: StudyPlan, as: 'studyPlan' }]
      });

      if (!enrollment || !enrollment.study_plan_id) {
        return res.status(404).json({ error: 'No active enrollment or study plan assigned' });
      }

      const planSubjects = await PlanSubject.findAll({
        where: { id_study_plan: enrollment.study_plan_id },
        include: [{ model: Subject, as: 'subject' }]
      });

      const planSubjectIds = planSubjects.map(ps => ps.id);

      const correlativities = await Correlativity.findAll({
        where: { id_plan_subject_target: planSubjectIds }
      });

      const academicRecords = await AcademicRecord.findAll({
        where: { id_student: studentId },
        include: [{ model: FinalExam, as: 'final_exams' }]
      });

      const enrolledAt = enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
      const now = new Date();
      const monthsDiff = (now.getFullYear() - enrolledAt.getFullYear()) * 12 + (now.getMonth() - enrolledAt.getMonth());
      const year = Math.max(1, Math.floor(monthsDiff / 12) + 1);
      const currentMonth = now.getMonth();
      const term = (currentMonth >= 2 && currentMonth <= 6) ? 1 : 2;

      return res.status(200).json({
        data: {
          planSubjects: planSubjects.map(ps => ({
            id: ps.id,
            id_study_plan: ps.id_study_plan,
            id_subject: ps.id_subject,
            suggested_year: ps.suggested_year,
            suggested_term: ps.suggested_term,
            weekly_hours: ps.subject?.weekly_hours || null,
            credits: ps.credits,
            is_elective: ps.is_elective,
            is_final_project: ps.is_final_project,
            subject: ps.subject ? {
              name: ps.subject.name,
              code: ps.subject.code,
              is_unahur: ps.subject.is_unahur,
              weekly_hours: ps.subject.weekly_hours
            } : null
          })),
          correlativities: correlativities.map(c => ({
            id: c.id,
            id_plan_subject_target: c.id_plan_subject_target,
            id_required_plan_subject: c.id_required_plan_subject,
            type: c.type
          })),
          academicRecords: academicRecords.map(ar => ({
            id: ar.id,
            id_subject: ar.id_subject,
            plan_subject_id: ar.plan_subject_id,
            status: ar.status,
            grade: ar.grade,
            regularity_expires_at: ar.regularity_expires_at,
            year: ar.year,
            semester: ar.semester,
            final_exams: (ar.final_exams || []).map(fe => ({
              id: fe.id,
              id_academic_record: fe.id_academic_record,
              grade: fe.grade,
              status: fe.status,
              date: fe.date,
              attempt_number: fe.attempt_number
            }))
          })),
          enrollment: {
            enrolled_at: enrollment.enrolled_at,
            study_plan_id: enrollment.study_plan_id,
            study_plan: null
          },
          currentPeriod: { year, term }
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching planner data', details: error.message });
    }
  },

  savePlan: async (req, res) => {
    try {
      const studentId = req.params.id;

      const student = await Student.findOne({ where: { user_id: studentId } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const { name, weekly_hours_limit, plan } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }
      if (!Array.isArray(plan) || plan.length === 0) {
        return res.status(400).json({ error: 'plan must be a non-empty array' });
      }

      const newPlan = await CustomStudyPlan.create({
        id_student: studentId,
        name,
        weekly_hours: weekly_hours_limit || null,
      });

      const items = [];
      for (const semester of plan) {
        const year = semester.academic_year;
        const term = semester.term;
        if (Array.isArray(semester.subjects)) {
          for (const subj of semester.subjects) {
            items.push({
              id_custom_study_plan: newPlan.id,
              plan_subject_id: subj.plan_subject_id,
              target_year: subj.target_year || year,
              target_term: subj.target_term || term,
              order: subj.order || null,
              status: 'planificado',
            });
          }
        }
      }

      if (items.length > 0) {
        await CustomStudyPlanItem.bulkCreate(items);
      }

      const savedPlan = await CustomStudyPlan.findByPk(newPlan.id, {
        include: [{
          model: CustomStudyPlanItem,
          as: 'items',
          include: [{ model: PlanSubject, as: 'plan_subject', include: [{ model: Subject, as: 'subject' }] }],
        }]
      });

      return res.status(201).json({ message: 'Plan saved successfully', data: savedPlan });
    } catch (error) {
      return res.status(500).json({ error: 'Error saving plan', details: error.message });
    }
  },

  addEnrollment: async (req, res) => {
    try {
      const user_id = req.params.id;
      const { career_id, study_plan_id, enrolled_at, completed_at, status, is_active } = req.body;

      const student = await Student.findOne({ where: { user_id } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const career = await Career.findByPk(career_id);
      if (!career) {
        return res.status(404).json({ error: 'Career not found' });
      }

      if (study_plan_id) {
        const plan = await StudyPlan.findByPk(study_plan_id);
        if (!plan) {
          return res.status(404).json({ error: 'Study plan not found' });
        }
        if (Number(plan.id_career) !== Number(career_id)) {
          return res.status(400).json({ error: 'Study plan does not belong to the selected career' });
        }
      }

      const existingActiveEnrollment = await StudentCareerEnrollment.findOne({
        where: { student_id: user_id, career_id, is_active: true },
      });

      if (existingActiveEnrollment) {
        return res.status(409).json({ error: 'The student already has an active enrollment for this career' });
      }

      const enrollment = await StudentCareerEnrollment.create({
        student_id: user_id,
        career_id,
        study_plan_id: study_plan_id || null,
        enrolled_at: enrolled_at || new Date().toISOString().split('T')[0],
        completed_at: completed_at || null,
        status: status || 'active',
        is_active: is_active !== undefined ? is_active : true,
      });

      return res.status(201).json({ message: 'Enrollment created successfully', data: enrollment });
    } catch (error) {
      return res.status(500).json({ error: 'Error creating enrollment', details: error.message });
    }
  },

  updateEnrollment: async (req, res) => {
    try {
      const user_id = req.params.id;
      const enrollmentId = req.params.enrollmentId;
      const { career_id, study_plan_id, enrolled_at, completed_at, status, is_active } = req.body;

      const student = await Student.findOne({ where: { user_id } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const enrollment = await StudentCareerEnrollment.findOne({
        where: { id: enrollmentId, student_id: user_id },
      });

      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      if (career_id && career_id !== enrollment.career_id) {
        const career = await Career.findByPk(career_id);
        if (!career) {
          return res.status(404).json({ error: 'Career not found' });
        }
      }

      if (study_plan_id !== undefined) {
        const plan = await StudyPlan.findByPk(study_plan_id);
        if (!plan) {
          return res.status(404).json({ error: 'Study plan not found' });
        }
        const targetCareerId = career_id || enrollment.career_id;
        if (Number(plan.id_career) !== Number(targetCareerId)) {
          return res.status(400).json({ error: 'Study plan does not belong to the selected career' });
        }
      }

      await StudentCareerEnrollment.update(
        { career_id, study_plan_id, enrolled_at, completed_at, status, is_active },
        { where: { id: enrollmentId } }
      );

      const updatedEnrollment = await StudentCareerEnrollment.findByPk(enrollmentId, {
        include: [{ model: Career, as: 'career' }, { model: StudyPlan, as: 'studyPlan' }],
      });

      return res.status(200).json({ message: 'Enrollment updated successfully', data: updatedEnrollment });
    } catch (error) {
      return res.status(500).json({ error: 'Error updating enrollment', details: error.message });
    }
  },

  deleteEnrollment: async (req, res) => {
    try {
      const user_id = req.params.id;
      const enrollmentId = req.params.enrollmentId;

      const student = await Student.findOne({ where: { user_id } });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const deletedRows = await StudentCareerEnrollment.destroy({
        where: { id: enrollmentId, student_id: user_id },
      });

      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      return res.status(200).json({ message: 'Enrollment deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Error deleting enrollment', details: error.message });
    }
  },

  getActivityEligibility: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await activityRecordService.getActivityEligibility(id);
      res.json({ data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = studentController;
