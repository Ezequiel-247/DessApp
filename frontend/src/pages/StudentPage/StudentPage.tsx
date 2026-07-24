/**
 * StudentPage - Layout de estudiante
 * Nexo - Stitch Design System
 */
import { Outlet } from "react-router-dom";
import { Layout } from "@/widgets/layout/Layout/Layout";

export function StudentPage() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
