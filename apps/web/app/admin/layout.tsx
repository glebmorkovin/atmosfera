import { AdminHeader } from "@/components/admin-header";
import { RoleGuard } from "@/components/role-guard";
import { UserRole } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["ADMIN"] as UserRole[]}>
      <div className="min-h-screen bg-secondary">
        <AdminHeader />
        {children}
      </div>
    </RoleGuard>
  );
}
