import { useState, useCallback } from "react";
import { StatusBadge } from "@/widgets/ui/StatusBadge";
import { Tooltip } from "@/widgets/ui/Tooltip";
import { getStudent } from "@/entities/Student";

interface Props {
  user: any;
  isActive: boolean;
  onSelect: (id: string) => void;
  roleLabel: string;
  roleVariant: string;
}

function getInitials(name?: string, lastname?: string): string {
  const first = name?.[0] ?? "";
  const last = lastname?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

export function UserListItem({ user, isActive, onSelect, roleLabel, roleVariant }: Props) {
  const [enrollments, setEnrollments] = useState<{ career: string; plan: string }[] | null>(null);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const loadEnrollments = useCallback(() => {
    if (enrollments !== null || loadingEnrollments) return;
    setLoadingEnrollments(true);
    getStudent(user.id)
      .then((student) => {
        const items = (student.enrollments ?? []).map((e: any) => ({
          career: e.career?.name ?? "Sin carrera",
          plan: e.studyPlan?.name ?? "Sin plan",
        }));
        setEnrollments(items);
      })
      .catch(() => setEnrollments([]))
      .finally(() => setLoadingEnrollments(false));
  }, [user.id, enrollments, loadingEnrollments]);

  const initials = getInitials(user.name, user.lastname);
  const isStudent = user.role === "student";

  return (
    <article
      className={`rounded-xl border px-5 py-3 transition-colors ${
        isActive
          ? "border-primary-container bg-primary-container/5"
          : "border-outline-variant bg-surface-container-lowest hover:border-primary-container/40"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(user.id)}
        className="flex w-full gap-3 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed uppercase shrink-0 mt-0.5">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <h3 className="font-title-sm text-title-sm text-on-surface truncate">
                {user.name} {user.lastname}
              </h3>
              {isStudent && (
                <span
                  onMouseEnter={loadEnrollments}
                  className="shrink-0"
                >
                  <Tooltip
                    content={
                      loadingEnrollments ? (
                        <p className="text-body-sm">Cargando...</p>
                      ) : enrollments && enrollments.length > 0 ? (
                        <div className="space-y-2">
                          <p className="font-medium text-body-sm text-on-surface">Carreras</p>
                          {enrollments.map((e, i) => (
                            <div key={i}>
                              <p className="text-body-sm font-medium text-on-surface">{e.career}</p>
                              <p className="text-body-sm text-on-surface-variant">Plan: {e.plan}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-body-sm text-on-surface-variant">Sin carreras asignadas</p>
                      )
                    }
                  >
                    <span className="material-symbols-outlined text-[16px] text-outline cursor-help">info</span>
                  </Tooltip>
                </span>
              )}
            </div>
            <StatusBadge variant={roleVariant} label={roleLabel} className="shrink-0" />
          </div>
          <p className="text-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant mt-1.5">
            <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
            <span>{isStudent ? (user.legajo ?? "Sin legajo") : (user.cuil ?? "Sin CUIL")}</span>
          </div>
        </div>
      </button>
    </article>
  );
}
