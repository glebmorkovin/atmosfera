import { RoleGuard } from "@/components/role-guard";
import { UserRole } from "@/lib/auth";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["ADMIN"] as UserRole[]}>
      <div className="min-h-screen bg-secondary text-white">{children}</div>
    </RoleGuard>
  );
}
