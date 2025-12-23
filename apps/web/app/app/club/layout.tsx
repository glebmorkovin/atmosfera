import { RoleGuard } from "@/components/role-guard";
import { UserRole } from "@/lib/auth";

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["CLUB"] as UserRole[]}>
      <div className="min-h-screen bg-secondary text-white">{children}</div>
    </RoleGuard>
  );
}
