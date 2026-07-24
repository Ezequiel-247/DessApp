const { Course, CourseSchedule } = require('../models');

async function seedCourses(planSubjects) {
  const coursesData = [];
  const schedulesData = [];

  const indices = [0, 1, 2, 3, 4, 11, 12, 13, 14, 15];

  for (const i of indices) {
    if (i >= planSubjects.length) break;
    const planSubject = planSubjects[i];

    coursesData.push({
      plan_subject_id: planSubject.id,
      commission: 'Turno Mañana',
      year: 2026,
      term: 1,
      capacity: 50,
      professor_name: 'Prof. ' + planSubject.id,
    });
    coursesData.push({
      plan_subject_id: planSubject.id,
      commission: 'Turno Noche',
      year: 2026,
      term: 1,
      capacity: 40,
      professor_name: 'Prof. ' + planSubject.id + 'B',
    });
  }

  const createdCourses = await Course.bulkCreate(coursesData);

  createdCourses.forEach((course) => {
    if (course.commission === 'Turno Mañana') {
      schedulesData.push({
        course_id: course.id,
        day_of_week: 'Lunes',
        start_time: '08:00:00',
        end_time: '12:00:00',
        classroom: 'Aula 101'
      });
    } else {
      schedulesData.push({
        course_id: course.id,
        day_of_week: 'Jueves',
        start_time: '18:00:00',
        end_time: '22:00:00',
        classroom: 'Aula 202'
      });
    }
  });

  await CourseSchedule.bulkCreate(schedulesData);
  return createdCourses;
}

module.exports = seedCourses;
