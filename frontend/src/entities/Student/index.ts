export {
	getStudents,
	getStudent,
	updateStudentPrivacy,
	updateStudent,
	createStudent,
	getStudentPlanSubjects,
	getStudentProfile,
	uploadStudentAvatar,
	getExamEligibility,
	getSubjectEligibility,
} from "./api/studentApi";
export { normalizeStudent } from "./model/student";
export type { Student, StudentPrivacy } from "./model/student";
