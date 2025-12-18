import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { NotificationsIndicator } from "@/components/notifications-indicator";

export const metadata: Metadata = {
  title: "Атмосфера — цифровые профили хоккеистов",
  description: "Веб-приложение «Атмосфера»: цифровые профили хоккеистов, поиск и инструменты скаутов"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-gradient-to-b from-secondary via-secondary to-black text-white">
        <header className="border-b border-white/10 bg-black/50">
          <div className="container flex items-center justify-between py-4">
            <Link href="/" className="text-lg font-semibold">
              Атмосфера
            </Link>
            <nav className="flex items-center gap-4 text-sm text-white/80">
              <Link href="/player/dashboard">Игрок</Link>
              <Link href="/scout">Скаут</Link>
              <Link href="/admin">Админ</Link>
              <Link href="/notifications" className="flex items-center gap-1">
                Уведомления
                <NotificationsIndicator />
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
