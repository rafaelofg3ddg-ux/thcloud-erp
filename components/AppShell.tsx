"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { supabase } from "../lib/supabase";

type UsuarioLogado = {
  id: string;
  empresa_id: string | null;
  nome?: string;
  email?: string;
  usuario?: string;
  perfil?: string;
};

type EmpresaStatus = {
  id: string;
  ativo: boolean | null;
  status_assinatura: string | null;
  onboarding_concluido: boolean | null;
  etapa_onboarding: number | null;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [verificando, setVerificando] = useState(true);
  const [liberado, setLiberado] = useState(false);

  function normalizarPerfil(perfil?: string | null) {
    return String(perfil || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function ehSuperAdmin(usuario: UsuarioLogado | null) {
    const perfil = normalizarPerfil(usuario?.perfil);
    return perfil === "super admin" || perfil === "superadmin" || perfil === "master";
  }

  function lerUsuarioSessao(): UsuarioLogado | null {
    try {
      const storage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (!storage) return null;

      return JSON.parse(storage) as UsuarioLogado;
    } catch {
      return null;
    }
  }

  function limparSessao() {
    sessionStorage.removeItem("th_usuario");
    sessionStorage.removeItem("th_empresa");
    sessionStorage.removeItem("th_permissoes");

    localStorage.removeItem("th_usuario");
    localStorage.removeItem("th_empresa");
    localStorage.removeItem("th_permissoes");
    localStorage.removeItem("empresa_id");
    localStorage.removeItem("th_empresa_id");
  }

  function rotaLivre() {
    return (
      pathname === "/login" ||
      pathname === "/onboarding" ||
      pathname?.startsWith("/onboarding")
    );
  }

  async function verificarAcesso() {
    setVerificando(true);

    const usuario = lerUsuarioSessao();

    if (!usuario) {
      setLiberado(false);
      setVerificando(false);

      if (pathname !== "/login") {
        router.replace("/login");
      }

      return;
    }

    if (ehSuperAdmin(usuario)) {
      setLiberado(true);
      setVerificando(false);
      return;
    }

    if (!usuario.empresa_id) {
      limparSessao();
      setLiberado(false);
      setVerificando(false);
      router.replace("/login");
      return;
    }

    const { data: empresaData, error } = await supabase
      .from("empresas")
      .select("id,ativo,status_assinatura,onboarding_concluido,etapa_onboarding")
      .eq("id", usuario.empresa_id)
      .maybeSingle();

    if (error || !empresaData) {
      limparSessao();
      setLiberado(false);
      setVerificando(false);
      router.replace("/login");
      return;
    }

    const empresa = empresaData as EmpresaStatus;

    if (empresa.ativo === false || empresa.status_assinatura === "Bloqueado") {
      setLiberado(true);
      setVerificando(false);

      if (pathname !== "/bloqueado") {
        router.replace("/bloqueado");
      }

      return;
    }

    if (empresa.status_assinatura === "Cancelado") {
      setLiberado(true);
      setVerificando(false);

      if (pathname !== "/bloqueado") {
        router.replace("/bloqueado");
      }

      return;
    }

    if (empresa.onboarding_concluido !== true && !rotaLivre()) {
      setLiberado(true);
      setVerificando(false);
      router.replace("/onboarding");
      return;
    }

    setLiberado(true);
    setVerificando(false);
  }

  useEffect(() => {
    verificarAcesso();
  }, [pathname]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (verificando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-black text-slate-900">
            Verificando ambiente...
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Aguarde um instante.
          </p>
        </div>
      </div>
    );
  }

  if (!liberado) return null;

  if (pathname === "/onboarding" || pathname?.startsWith("/onboarding")) {
    return <>{children}</>;
  }

  return (
    <div className="th-app-shell min-h-screen bg-slate-50 flex overflow-x-hidden">
      <Sidebar />

      <main className="th-main-area flex-1 min-w-0 overflow-x-hidden">
        <Header />

        <div className="th-page-content w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
