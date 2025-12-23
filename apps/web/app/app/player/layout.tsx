import { RoleGuard } from "@/components/role-guard";
import { UserRole } from "@/lib/auth";

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["PLAYER"] as UserRole[]}>
      <div className="min-h-screen bg-secondary text-white">{children}</div>
    </RoleGuard>
  );
}
