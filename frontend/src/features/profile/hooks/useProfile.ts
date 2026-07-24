import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/AuthContext';
import { getStudent, updateStudentPrivacy, updateStudent, uploadStudentAvatar } from '@/entities/Student';
import type { StudentPrivacy } from '@/entities/Student';
import type { StudentCareerEnrollment } from '@/entities/StudentCareerEnrollment';

export interface ProfileData {
  displayName: string;
  careerName: string;
  university: string;
  email: string;
  enrollment: string | null;
  privacy: StudentPrivacy;
  userId: number;
  avatar: string | null;
  name: string;
  lastname: string;
  enrollments: StudentCareerEnrollment[];
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const student = await getStudent(user.id);
      const activeEnrollment = student.enrollments?.find((e) => e.isActive);
      setProfile({
        displayName: student.user
          ? `${student.user.name} ${student.user.lastname}`
          : user.name + ' ' + user.lastname,
        name: student.user?.name ?? user.name,
        lastname: student.user?.lastname ?? user.lastname,
        careerName: activeEnrollment?.career?.name ?? 'Sin carrera asignada',
        university: 'Universidad Nacional de Hurlingham',
        email: student.user?.email ?? user.email,
        enrollment: student.legajo,
        privacy: {
          publicProfile: student.publicProfile,
          showAcademicInfo: student.showAcademicInfo,
          publishApprovals: student.publishApprovals,
          showEmail: student.showEmail,
        },
        userId: student.userId,
        avatar: student.user?.avatar ?? null,
        enrollments: student.enrollments ?? [],
      });
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar perfil');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updatePrivacy = async (privacy: Partial<StudentPrivacy>) => {
    if (!user) return;
    try {
      const updated = await updateStudentPrivacy(user.id, privacy);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              privacy: {
                publicProfile: updated.publicProfile,
                showAcademicInfo: updated.showAcademicInfo,
                publishApprovals: updated.publishApprovals,
                showEmail: updated.showEmail,
              },
            }
          : prev
      );
      return {
        privacy: {
          publicProfile: updated.publicProfile,
          showAcademicInfo: updated.showAcademicInfo,
          publishApprovals: updated.publishApprovals,
          showEmail: updated.showEmail,
        },
      };
    } catch (err: any) {
      throw new Error(err.message ?? 'Error al actualizar privacidad');
    }
  };

  const updateEmail = async (email: string) => {
    if (!user) return;
    const updated = await updateStudent(user.id, { email });
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            email: updated.user?.email ?? email,
            displayName: updated.user
              ? `${updated.user.name} ${updated.user.lastname}`
              : prev.displayName,
            name: updated.user?.name ?? prev.name,
            lastname: updated.user?.lastname ?? prev.lastname,
          }
        : prev
    );
  };

  const updateLegajo = async (legajo: string) => {
    if (!user) return;
    const updated = await updateStudent(user.id, { legajo });
    setProfile((prev) =>
      prev ? { ...prev, enrollment: updated.legajo } : prev
    );
  };

  const updateAvatar = async (file: File) => {
    if (!user) return;
    const updated = await uploadStudentAvatar(user.id, file);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            avatar: updated.user?.avatar ?? prev.avatar,
          }
        : prev
    );
  };

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updatePrivacy,
    updateEmail,
    updateLegajo,
    updateAvatar,
  };
}
