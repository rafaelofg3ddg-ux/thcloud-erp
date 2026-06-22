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
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  cpf?: string | null;
  tipo_pessoa?: string | null;
  telefone?: string | null;
  celular?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  plano?: string | null;
  valor_mensal?: number | null;
  data_vencimento_assinatura?: string | null;
  ativo: boolean | null;
  status_assinatura: string | null;
  onboarding_concluido: boolean | null;
  etapa_onboarding: number | null;
  modulo_fiscal?: boolean | null;
  modulo_whatsapp?: boolean | null;
  modulo_delivery?: boolean | null;
  modulo_crm?: boolean | null;
  modulo_relatorios_premium?: boolean | null;
  modulo_multiloja?: boolean | null;
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

    return (
      perfil === "super admin" ||
      perfil === "superadmin" ||
      perfil === "master"
    );
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
    sessionStorage.removeItem("empresa_id");
    sessionStorage.removeItem("th_empresa_id");

    localStorage.removeItem("th_usuario");
    localStorage.removeItem("th_empresa");
    localStorage.removeItem("th_permissoes");
    localStorage.removeItem("empresa_id");
    localStorage.removeItem("th_empresa_id");
  }

  function salvarSessaoEmpresa(usuario: UsuarioLogado, empresa: EmpresaStatus) {
    const empresaNormalizada = {
      id: empresa.id,
      empresa_id: empresa.id,
      razao_social: empresa.razao_social || "",
      nome_fantasia: empresa.nome_fantasia || "",
      nome: empresa.nome_fantasia || empresa.razao_social || "Empresa",
      cnpj: empresa.cnpj || "",
      cpf: empresa.cpf || "",
      tipo_pessoa: empresa.tipo_pessoa || "",
      telefone: empresa.telefone || "",
      celular: empresa.celular || "",
      whatsapp: empresa.whatsapp || "",
      email: empresa.email || "",
      plano: empresa.plano || "Básico",
      valor_mensal: Number(empresa.valor_mensal || 0),
      data_vencimento_assinatura: empresa.data_vencimento_assinatura || null,
      ativo: empresa.ativo !== false,
      status_assinatura: empresa.status_assinatura || "Ativo",
      onboarding_concluido: empresa.onboarding_concluido === true,
      etapa_onboarding: Number(empresa.etapa_onboarding || 0),
      modulo_fiscal: empresa.modulo_fiscal === true,
      modulo_whatsapp: empresa.modulo_whatsapp === true,
      modulo_delivery: empresa.modulo_delivery === true,
      modulo_crm: empresa.modulo_crm === true,
      modulo_relatorios_premium: empresa.modulo_relatorios_premium === true,
      modulo_multiloja: empresa.modulo_multiloja === true,
    };

    const usuarioNormalizado = {
      ...usuario,
      empresa_id: empresa.id,
      empresa_nome: empresaNormalizada.nome,
      plano: empresaNormalizada.plano,
      modulo_fiscal: empresaNormalizada.modulo_fiscal,
      modulo_whatsapp: empresaNormalizada.modulo_whatsapp,
      modulo_delivery: empresaNormalizada.modulo_delivery,
      modulo_crm: empresaNormalizada.modulo_crm,
      modulo_relatorios_premium: empresaNormalizada.modulo_relatorios_premium,
      modulo_multiloja: empresaNormalizada.modulo_multiloja,
    };

    sessionStorage.setItem("th_usuario", JSON.stringify(usuarioNormalizado));
    sessionStorage.setItem("th_empresa", JSON.stringify(empresaNormalizada));
    sessionStorage.setItem("empresa_id", empresa.id);
    sessionStorage.setItem("th_empresa_id", empresa.id);

    localStorage.setItem("th_usuario", JSON.stringify(usuarioNormalizado));
    localStorage.setItem("th_empresa", JSON.stringify(empresaNormalizada));
    localStorage.setItem("empresa_id", empresa.id);
    localStorage.setItem("th_empresa_id", empresa.id);
  }

  async function gerarNotificacaoAssinatura(empresaId: string) {
    try {
      await supabase.rpc("gerar_notificacao_assinatura_empresa", {
        p_empresa_id: empresaId,
      });
    } catch {
      // Não trava o sistema se a função ainda não existir no Supabase.
    }
  }

  function rotaLivre() {
    return (
      pathname === "/login" ||
      pathname === "/bloqueado" ||
      pathname === "/onboarding" ||
      pathname?.startsWith("/onboarding")
    );
  }

  function rotaAdmin() {
    return pathname === "/admin" || pathname?.startsWith("/admin/");
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
      sessionStorage.setItem("th_usuario", JSON.stringify(usuario));
      localStorage.setItem("th_usuario", JSON.stringify(usuario));

      setLiberado(true);
      setVerificando(false);
      return;
    }

    if (rotaAdmin()) {
      setLiberado(false);
      setVerificando(false);
      router.replace("/dashboard");
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
      .select(
        "id,razao_social,nome_fantasia,cnpj,cpf,tipo_pessoa,telefone,celular,whatsapp,email,plano,valor_mensal,data_vencimento_assinatura,ativo,status_assinatura,onboarding_concluido,etapa_onboarding,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja"
      )
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

    salvarSessaoEmpresa(usuario, empresa);

    await gerarNotificacaoAssinatura(empresa.id);

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

  if (
    pathname === "/onboarding" ||
    pathname?.startsWith("/onboarding") ||
    pathname === "/bloqueado"
  ) {
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
