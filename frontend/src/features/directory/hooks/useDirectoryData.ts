import { useEffect, useMemo, useState } from "react";
import { getUsers, deleteUser } from "@/entities/User";
import { getCareers } from "@/entities/Career";
import { getInstitutes } from "@/entities/Institute";
import { getStudents } from "@/entities/Student";
import { useAuth } from "@/app/AuthContext";
import { useConfirm } from "@/widgets/hooks/useConfirm";
import type { Career } from "@/entities/Career/model/career";

export interface Institute {
  id: string;
  name: string;
}

export function useDirectoryData() {
  const { user: currentUser } = useAuth();
  const { isOpen, options, open, close, handleConfirm } = useConfirm();
  const [users, setUsers] = useState<any[]>([]);
  const [careersOptions, setCareersOptions] = useState<Career[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [studentCareerMap, setStudentCareerMap] = useState<Map<string, string[]>>(new Map());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIsAdmin, setFilterIsAdmin] = useState(false);
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [filterInstituteId, setFilterInstituteId] = useState("");
  const [filterCareerId, setFilterCareerId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedUser = useMemo(
    () => users.find((u) => String(u.id) === String(selectedUserId)) ?? null,
    [users, selectedUserId]
  );

  const careersByInstitute = useMemo(
    () => careersOptions.filter((c) => String(c.instituteId) === filterInstituteId),
    [careersOptions, filterInstituteId]
  );

  useEffect(() => {
    if (institutes.length > 0 && !filterInstituteId) {
      setFilterInstituteId(String(institutes[0].id));
    }
  }, [institutes]);

  useEffect(() => {
    if (filterInstituteId && careersByInstitute.length > 0) {
      const stillValid = careersByInstitute.some((c) => String(c.id) === filterCareerId);
      if (!stillValid) {
        setFilterCareerId(String(careersByInstitute[0].id));
      }
    } else {
      setFilterCareerId("");
    }
  }, [filterInstituteId, careersByInstitute]);

  useEffect(() => {
    if (filterIsAdmin) {
      setFilterUnassigned(false);
    }
  }, [filterIsAdmin]);

  useEffect(() => {
    let mounted = true;
    let done = { users: false, careers: false, institutes: false, students: false };

    function checkDone() {
      if (done.users && done.careers && done.institutes && done.students && mounted) {
        setIsLoading(false);
      }
    }

    (async () => {
      try {
        const usersArr = await getUsers();
        if (!mounted) return;
        setUsers(usersArr);
        setUsersError(null);
      } catch (err: any) {
        if (!mounted) return;
        setUsersError(err.message || "Error al cargar usuarios");
      } finally {
        done.users = true; checkDone();
      }
    })();

    (async () => {
      try {
        const careersArr = await getCareers();
        if (!mounted) return;
        setCareersOptions(careersArr);
      } catch { } finally {
        done.careers = true; checkDone();
      }
    })();

    (async () => {
      try {
        const instArr = await getInstitutes();
        if (!mounted) return;
        setInstitutes(instArr);
      } catch { } finally {
        done.institutes = true; checkDone();
      }
    })();

    (async () => {
      try {
        const studentsArr = await getStudents();
        if (!mounted) return;
        const map = new Map<string, string[]>();
        for (const s of studentsArr) {
          const careerIds = (s.enrollments ?? []).map((e: any) => String(e.careerId));
          map.set(String(s.userId), careerIds);
        }
        setStudentCareerMap(map);
      } catch { } finally {
        done.students = true; checkDone();
      }
    })();

    return () => { mounted = false; };
  }, []);

  const filteredUsers = users.filter((user) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = !query || [user.name, user.email].join(" ").toLowerCase().includes(query);
    if (!matchesQuery) return false;

    const matchesStatus = !statusFilter ||
      (statusFilter === "active" ? user.is_active === true : user.is_active === false);
    if (!matchesStatus) return false;

    if (filterIsAdmin) {
      return user.role === "admin";
    }

    if (filterUnassigned) {
      if (user.role === "admin") return false;
      const userCareers = studentCareerMap.get(String(user.id));
      return !userCareers || userCareers.length === 0;
    }

    if (filterCareerId) {
      const userCareers = studentCareerMap.get(String(user.id));
      return userCareers?.includes(String(filterCareerId)) ?? false;
    }

    if (filterInstituteId) {
      const userCareers = studentCareerMap.get(String(user.id)) ?? [];
      const careersOfInst = careersOptions
        .filter((c) => String(c.instituteId) === filterInstituteId)
        .map((c) => String(c.id));
      return userCareers.some((cid) => careersOfInst.includes(cid));
    }

    return true;
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUserId((prev) => (prev === userId ? null : userId));
  };

  const handleNewUser = () => {
    setSelectedUserId(null);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => String(u.id) === String(userId));
    if (!user) return;

    if (String(currentUser?.id) === String(userId)) {
      setUsersError("No podés eliminar tu propia cuenta de administrador.");
      return;
    }

    const adminCount = users.filter((u) => u.role === "admin").length;
    if (user.role === "admin" && adminCount <= 1) {
      setUsersError("No se puede eliminar el último administrador del sistema.");
      return;
    }

    open({
      title: "Eliminar usuario",
      description: `¿Confirmás eliminar a ${user.legajo || user.email}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteUser(userId);
          const remaining = users.filter((u) => String(u.id) !== String(userId));
          setUsers(remaining);
          if (String(selectedUserId) === String(userId)) {
            setSelectedUserId(String(remaining[0]?.id ?? ""));
          }
          setUsersError(null);
        } catch (err: any) {
          setUsersError(err.message || "No se pudo eliminar el usuario");
        }
      },
    });
  };

  const refreshUsers = async () => {
    try {
      const usersArr = await getUsers();
      setUsers(usersArr);
    } catch (err: any) {
      console.error("Failed to refresh users:", err);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterIsAdmin(false);
    setFilterUnassigned(false);
    setFilterInstituteId("");
    setFilterCareerId("");
    setStatusFilter("");
  };

  const instituteFilterOptions = useMemo(() =>
    institutes.map((i) => ({ value: i.id, label: i.name })),
  [institutes]);

  return {
    users,
    filteredUsers,
    selectedUser,
    selectedUserId,
    careersOptions,
    careersByInstitute,
    institutes,
    instituteFilterOptions,
    isLoading,
    usersError,
    searchTerm,
    setSearchTerm,
    filterIsAdmin,
    setFilterIsAdmin,
    filterUnassigned,
    setFilterUnassigned,
    filterInstituteId,
    setFilterInstituteId,
    filterCareerId,
    setFilterCareerId,
    statusFilter,
    setStatusFilter,
    isOpen,
    options,
    close,
    handleConfirm,
    handleSelectUser,
    handleNewUser,
    handleDeleteUser,
    refreshUsers,
    resetFilters,
  };
}
