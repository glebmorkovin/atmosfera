import Link from "next/link";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-white/10 bg-black/50">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-semibold">
            Атмосфера
          </Link>
          <Link href="/auth/login" className="ghost-btn">
            Войти в кабинет
          </Link>
        </div>
      </header>
      <div className="container flex items-center justify-center py-12">
        <div className="w-full max-w-xl space-y-8">{children}</div>
      </div>
    </div>
  );
}
