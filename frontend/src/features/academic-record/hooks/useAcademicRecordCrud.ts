import { useState, useEffect, useCallback } from "react";
import type { AcademicRecord } from "@/entities/AcademicRecord";
import type { StudentCareerEnrollment } from "@/entities/StudentCareerEnrollment";
import type { FinalExam } from "@/entities/FinalExam";
import { getSubjects } from "@/entities/Subject";
import { getStudent, getStudentPlanSubjects } from "@/entities/Student";
import { useAuth } from "@/app/AuthContext";
import {
  getAcademicRecords,
  createAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord,
} from "@/entities/AcademicRecord";
import { getFinalExams, updateFinalExam, deleteFinalExam } from "@/entities/FinalExam";

type CreatePayload = Omit<AcademicRecord, "id">;

export function useAcademicRecordCrud() {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [finalExams, setFinalExams] = useState<FinalExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<StudentCareerEnrollment[]>([]);
  const [availableSubjectIds, setAvailableSubjectIds] = useState<Set<string>>(new Set());
  const [availableSubjectsList, setAvailableSubjectsList] = useState<any[]>([]);
  const { user } = useAuth();

  const loadRecords = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await getAcademicRecords(user.id);
      setRecords(list);
    } catch (err: any) {
      setError(err.message || "Error loading academic records");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadFinalExams = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getFinalExams(user.id);
      setFinalExams(list);
    } catch {
      setFinalExams([]);
    }
  }, [user]);

  const loadSubjects = useCallback(async () => {
    try {
      const list = await getSubjects();
      setSubjects(list);
    } catch (e) {
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    loadFinalExams();
  }, [loadFinalExams]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const loadEnrollments = useCallback(async () => {
    if (!user || user.role !== "student") {
      setEnrollments([]);
      return;
    }
    try {
      const student = await getStudent(user.id);
      setEnrollments(student.enrollments ?? []);
    } catch {
      setEnrollments([]);
    }
  }, [user]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const loadPlanSubjects = useCallback(async (enrollmentId: string) => {
    if (!user || !enrollmentId) {
      setAvailableSubjectIds(new Set());
      setAvailableSubjectsList([]);
      return;
    }
    try {
      const subjectsList = await getStudentPlanSubjects(user.id, enrollmentId);
      setAvailableSubjectIds(new Set(subjectsList.map((s) => s.id)));
      setAvailableSubjectsList(subjectsList);
    } catch {
      setAvailableSubjectIds(new Set());
      setAvailableSubjectsList([]);
    }
  }, [user]);

  const createRecord = useCallback(
    async (data: CreatePayload): Promise<AcademicRecord> => {
      const created = await createAcademicRecord(data as any);
      setRecords((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const updateRecord = useCallback(
    async (id: string, data: Partial<AcademicRecord>): Promise<AcademicRecord> => {
      const updated = await updateAcademicRecord(id, {
        ...data,
        grade: data.status === "enrolled" ? undefined : String(data.grade ?? ""),
      });
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    []
  );

  const removeRecord = useCallback(
    async (id: string): Promise<void> => {
      await deleteAcademicRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    },
    []
  );

  const createExam = useCallback(
    (exam: FinalExam): void => {
      setFinalExams((prev) => [...prev, exam]);
    },
    []
  );

  const updateExam = useCallback(
    async (id: string, data: {
      grade?: string;
      year?: number;
      semester?: number;
      status?: string;
    }): Promise<FinalExam> => {
      const updated = await updateFinalExam(id, data);
      setFinalExams((prev) => prev.map((e) => (String(e.id) === id ? updated : e)));
      return updated;
    },
    []
  );

  const removeExam = useCallback(
    async (id: string): Promise<void> => {
      await deleteFinalExam(id);
      setFinalExams((prev) => prev.filter((e) => String(e.id) !== id));
    },
    []
  );

  return {
    records,
    finalExams,
    isLoading,
    error,
    subjects,
    enrollments,
    availableSubjectIds,
    availableSubjectsList,
    loadRecords,
    loadFinalExams,
    loadSubjects,
    createRecord,
    updateRecord,
    removeRecord,
    createExam,
    updateExam,
    removeExam,
    loadPlanSubjects,
  };
}
