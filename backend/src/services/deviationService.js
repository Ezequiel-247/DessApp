'use strict';
const { CustomStudyPlan, CustomStudyPlanItem, PlanSubject, Subject, AcademicRecord } = require('../models');

function termsDiff(yearA, termA, yearB, termB) {
  return (yearB - yearA) * 2 + (termB - termA);
}

function classifyDeviation(diff) {
  if (diff === 0) return 'on_time';
  if (diff < 0) return 'ahead';
  return 'delayed';
}

class DeviationService {
  async getDeviationMetrics(studentId, planId) {
    const plan = await CustomStudyPlan.findByPk(planId, {
      include: [{
        model: CustomStudyPlanItem,
        as: 'items',
        where: { status: 'completado' },
        required: false,
        include: [{
          model: PlanSubject,
          as: 'plan_subject',
          include: [{ model: Subject, as: 'subject' }]
        }]
      }]
    });

    if (!plan) throw new Error('Custom study plan not found');

    if (Number(plan.id_student) !== Number(studentId)) {
      throw new Error('Plan does not belong to this student');
    }

    const items = plan.items || [];
    if (items.length === 0) {
      return {
        plan_name: plan.name,
        summary: {
          total_subjects: 0,
          completed_subjects: 0,
          on_time: 0,
          ahead: 0,
          delayed: 0,
          average_delay_terms: 0,
        },
        subjects: [],
      };
    }

    const planSubjectIds = items.map(i => i.plan_subject_id);
    const records = await AcademicRecord.findAll({
      where: { id_student: studentId, plan_subject_id: planSubjectIds },
    });

    const recordByPlanSubject = {};
    for (const rec of records) {
      recordByPlanSubject[rec.plan_subject_id] = rec;
    }

    let onTime = 0;
    let ahead = 0;
    let delayed = 0;
    let totalDelayTerms = 0;
    const subjects = [];

    for (const item of items) {
      const ps = item.plan_subject;
      const actual = recordByPlanSubject[item.plan_subject_id];

      const deviationFromPlan = actual && actual.year && actual.semester
        ? termsDiff(item.target_year, item.target_term, actual.year, actual.semester)
        : null;

      const deviationFromOfficial = ps && actual && actual.year && actual.semester
        ? termsDiff(ps.suggested_year, ps.suggested_term, actual.year, actual.semester)
        : null;

      const devClass = deviationFromPlan !== null
        ? classifyDeviation(deviationFromPlan)
        : 'unknown';

      if (devClass === 'on_time') onTime++;
      else if (devClass === 'ahead') ahead++;
      else if (devClass === 'delayed') {
        delayed++;
        totalDelayTerms += deviationFromPlan;
      }

      subjects.push({
        plan_subject_id: item.plan_subject_id,
        subject_id: ps?.id_subject || null,
        subject_name: ps?.subject?.name || '',
        official_year: ps?.suggested_year || null,
        official_term: ps?.suggested_term || null,
        planned_year: item.target_year,
        planned_term: item.target_term,
        actual_year: actual?.year || null,
        actual_term: actual?.semester || null,
        grade: actual?.grade || null,
        status: actual?.status || null,
        deviation: devClass,
        deviation_terms: deviationFromPlan !== null ? deviationFromPlan : null,
        deviation_from_official: deviationFromOfficial !== null
          ? classifyDeviation(deviationFromOfficial)
          : null,
        deviation_terms_from_official: deviationFromOfficial !== null ? deviationFromOfficial : null,
      });
    }

    return {
      plan_name: plan.name,
      summary: {
        total_subjects: subjects.length,
        completed_subjects: subjects.length,
        on_time: onTime,
        ahead: ahead,
        delayed: delayed,
        average_delay_terms: delayed > 0 ? Number((totalDelayTerms / delayed).toFixed(2)) : 0,
      },
      subjects,
    };
  }
}

module.exports = new DeviationService();
