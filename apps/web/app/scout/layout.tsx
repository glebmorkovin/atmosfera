import { RoleGuard } from "@/components/role-guard";
import { UserRole } from "@/lib/auth";

export default function ScoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["SCOUT", "AGENT", "CLUB"] as UserRole[]}>
      <div className="min-h-screen bg-secondary text-white">{children}</div>
    </RoleGuard>
  );
}
