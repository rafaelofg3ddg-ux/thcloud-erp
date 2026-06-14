"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { supabase } from "../lib/supabase";

type ConfiguracaoSistema = {
  modo_compacto?: boolean | null;
  cor_principal?: string | null;
  nome_sistema?: string | null;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [modoCompacto, setModoCompacto] = useState(false);

  const semLayout =
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/api");

  function getEmpresaId() {
    try {
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        if (usuario?.empresa_id) return usuario.empresa_id;
        if (usuario?.empresa?.id) return usuario.empresa.id;
      }

      const empresaStorage =
        sessionStorage.getItem("th_empresa") ||
        localStorage.getItem("th_empresa");

      if (empresaStorage) {
        const empresa = JSON.parse(empresaStorage);
        if (empresa?.id) return empresa.id;
        if (empresa?.empresa_id) return empresa.empresa_id;
      }

      return localStorage.getItem("empresa_id") || localStorage.getItem("th_empresa_id");
    } catch {
      return null;
    }
  }

  function aplicarModoCompacto(ativo: boolean) {
    setModoCompacto(ativo);

    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("th-compact", ativo);
      document.body.classList.toggle("th-compact", ativo);
    }
  }

  async function carregarConfiguracoes() {
    if (semLayout) return;

    let compacto = false;

    try {
      const configLocal =
        localStorage.getItem("th_configuracoes_sistema") ||
        sessionStorage.getItem("th_configuracoes_sistema");

      if (configLocal) {
        const config = JSON.parse(configLocal) as ConfiguracaoSistema;
        compacto = config?.modo_compacto === true;
      }
    } catch {}

    const empresaId = getEmpresaId();

    if (empresaId) {
      try {
        const { data } = await supabase
          .from("configuracoes_gerais")
          .select("modo_compacto,cor_principal,nome_sistema")
          .eq("empresa_id", empresaId)
          .maybeSingle();

        if (data) {
          const config = data as ConfiguracaoSistema;
          compacto = config?.modo_compacto === true;
          localStorage.setItem("th_configuracoes_sistema", JSON.stringify(config));
        }
      } catch {
        try {
          const { data } = await supabase
            .from("configuracoes_sistema")
            .select("modo_compacto,cor_principal,nome_sistema")
            .eq("empresa_id", empresaId)
            .maybeSingle();

          if (data) {
            const config = data as ConfiguracaoSistema;
            compacto = config?.modo_compacto === true;
            localStorage.setItem("th_configuracoes_sistema", JSON.stringify(config));
          }
        } catch {}
      }
    }

    aplicarModoCompacto(compacto);
  }

  useEffect(() => {
    carregarConfiguracoes();

    const intervalo = window.setInterval(() => {
      carregarConfiguracoes();
    }, 2500);

    function ouvirStorage() {
      carregarConfiguracoes();
    }

    window.addEventListener("storage", ouvirStorage);
    window.addEventListener("th_configuracoes_atualizadas", ouvirStorage);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("storage", ouvirStorage);
      window.removeEventListener("th_configuracoes_atualizadas", ouvirStorage);
    };
  }, [pathname]);

  if (semLayout) {
    return <>{children}</>;
  }

  return (
    <div
      className={`th-app-shell flex min-h-screen w-full overflow-x-hidden bg-slate-100 ${
        modoCompacto ? "is-compact" : ""
      }`}
    >
      <Sidebar />

      <div className="th-main-area min-w-0 flex-1 overflow-x-hidden">
        <Header />

        <main className="th-page-content w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
