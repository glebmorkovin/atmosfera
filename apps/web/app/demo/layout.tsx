import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  if (!isLocal && process.env.NODE_ENV === "production") {
    notFound();
  }
  return <>{children}</>;
}
