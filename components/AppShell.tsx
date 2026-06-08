"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    const usuario = localStorage.getItem("th_usuario");

    if (pathname === "/login") {
      setCarregando(false);
      return;
    }

    if (!usuario) {
      router.push("/login");
      return;
    }

    setLogado(true);
    setCarregando(false);
  }, [pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow border text-slate-800 font-semibold">
          Carregando THCloud ERP...
        </div>
      </div>
    );
  }

  if (!logado) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Header />

        <main className="min-h-[calc(100vh-80px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}