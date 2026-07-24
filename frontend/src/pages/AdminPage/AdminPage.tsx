import { Outlet } from "react-router-dom";
import { Layout } from "@/widgets/layout/Layout/Layout";

export function AdminPage() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default AdminPage;
