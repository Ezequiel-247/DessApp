export {
  type AcademicRecord,
  ACADEMIC_STATUS,
  type AcademicStatus,
  GRADE_VALUES,
  SEMESTERS,
  type Semester,
} from "./model/academicRecord";
export {
  getAcademicRecords,
  createAcademicRecord,
  updateAcademicRecord,
} from "./api/academicRecordApi";
export { deleteAcademicRecord } from "./api/academicRecordApi";
