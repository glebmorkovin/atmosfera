import "./globals.css";
import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";

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
      <body className="bg-secondary">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
