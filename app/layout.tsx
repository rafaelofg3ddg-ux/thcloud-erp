import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/AppShell";
import { THSystemStandards } from "../components/global";

export const metadata: Metadata = {
  title: "Th Cloud",
  description: "Sistema de gestão para varejo",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <THSystemStandards>
          <AppShell>{children}</AppShell>
        </THSystemStandards>
      </body>
    </html>
  );
}