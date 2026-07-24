/**
 * Router - Definiciones de rutas con lazy loading
 * Nexo - Stitch Design System
 */
import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const LoginPage = lazy(() =>
  import("@/pages/LoginPage/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("@/pages/RegisterPage/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const InvitationPage = lazy(() =>
  import("@/pages/InvitationPage/InvitationPage").then((m) => ({ default: m.InvitationPage }))
);
const StudentPage = lazy(() =>
  import("@/pages/StudentPage/StudentPage").then((m) => ({ default: m.StudentPage }))
);
const DashboardPage = lazy(() =>
  import("@/pages/StudentPage/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const MyProgressPage = lazy(() =>
  import("@/pages/StudentPage/MyProgressPage").then((m) => ({ default: m.MyProgressPage }))
);
const ProfilePage = lazy(() =>
  import("@/pages/StudentPage/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const StudentPublicProfilePage = lazy(() =>
  import("@/pages/StudentPage/StudentPublicProfilePage").then((m) => ({ default: m.StudentPublicProfilePage }))
);
const MyPlannerPage = lazy(() =>
  import("@/pages/StudentPage/MyPlannerPage").then((m) => ({ default: m.MyPlannerPage }))
);
const MaterialsPage = lazy(() =>
  import("@/pages/StudentPage/MaterialsPage").then((m) => ({ default: m.MaterialsPage }))
);
const SessionsPage = lazy(() =>
  import("@/pages/StudentPage/SessionsPage").then((m) => ({ default: m.SessionsPage }))
);
const ConnectionsPage = lazy(() =>
  import("@/pages/StudentPage/ConnectionsPage").then((m) => ({ default: m.ConnectionsPage }))
);
const NoveltiesPage = lazy(() =>
  import("@/pages/StudentPage/NoveltiesPage").then((m) => ({ default: m.NoveltiesPage }))
);
const AcademicRecordPage = lazy(() =>
  import("@/pages/StudentPage/AcademicRecordPage").then((m) => ({ default: m.AcademicRecordPage }))
);
const CareersPage = lazy(() =>
  import("@/pages/AdminPage/CareersPage").then((m) => ({ default: m.CareersPage }))
);
const AdminPage = lazy(() =>
  import("@/pages/AdminPage/AdminPage").then((m) => ({ default: m.AdminPage }))
);
const SubjectsPage = lazy(() =>
  import("@/pages/AdminPage/SubjectsPage").then((m) => ({ default: m.SubjectsPage }))
);
const PlansPage = lazy(() =>
  import("@/pages/AdminPage/PlansPage").then((m) => ({ default: m.PlansPage }))
);
const DirectoryPage = lazy(() =>
  import("@/pages/AdminPage/DirectoryPage").then((m) => ({ default: m.DirectoryPage }))
);
const InstitutesPage = lazy(() =>
  import("@/pages/AdminPage/InstitutesPage").then((m) => ({ default: m.InstitutesPage }))
);
const AdminModerationPage = lazy(() =>
  import("@/pages/AdminPage/AdminModerationPage").then((m) => ({ default: m.AdminModerationPage }))
);
const AdminDashboardPage = lazy(() =>
  import("@/pages/AdminPage/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage }))
);
const ActivitiesPage = lazy(() =>
  import("@/pages/AdminPage/ActivitiesPage").then((m) => ({ default: m.ActivitiesPage }))
);



function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bright">
      <div className="flex flex-col items-center gap-4">
        <span
          className="material-symbols-outlined text-primary text-[48px] animate-spin"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          progress_activity
        </span>
        <span className="text-body-md text-on-surface-variant">Cargando...</span>
      </div>
    </div>
  );
}

export function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invitations/:token" element={<InvitationPage />} />

        {/* Student routes */}
        <Route
          path="student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentPage />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="academic-record" element={<AcademicRecordPage />} />
          <Route path="myProgress" element={<MyProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<StudentPublicProfilePage />} />
          <Route path="myPlanner" element={<MyPlannerPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="novelties" element={<NoveltiesPage />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="careers" replace />} />
          <Route path="careers" element={<CareersPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="directory" element={<DirectoryPage />} />
          <Route path="institutes" element={<InstitutesPage />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
