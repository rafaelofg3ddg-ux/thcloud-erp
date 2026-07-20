"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Home,
  Lock,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";

type UsuarioLogado = {
  id: string;
  empresa_id: string | null;
  nome: string;
  email: string;
  perfil: string;
  empresa_nome?: string | null;
  plano?: string | null;
  plano_nome?: string | null;
  nome_plano?: string | null;
  modulo_fiscal?: boolean;
  modulo_whatsapp?: boolean;
  modulo_delivery?: boolean;
  modulo_crm?: boolean;
  modulo_relatorios_premium?: boolean;
  modulo_multiloja?: boolean;
  modulo_ordem_servico?: boolean;
};

type PermissoesUsuario = Record<string, boolean>;

type ModulosEmpresa = {
  plano: string | null;
  modulo_fiscal: boolean;
  modulo_whatsapp: boolean;
  modulo_delivery: boolean;
  modulo_crm: boolean;
  modulo_relatorios_premium: boolean;
  modulo_multiloja: boolean;
  modulo_ordem_servico: boolean;
};

const MODULOS_EMPRESA_PADRAO: ModulosEmpresa = {
  plano: null,
  modulo_fiscal: false,
  modulo_whatsapp: false,
  modulo_delivery: false,
  modulo_crm: false,
  modulo_relatorios_premium: false,
  modulo_multiloja: false,
  modulo_ordem_servico: true,
};

// Definidos fora do Sidebar (e não dentro dele) de propósito: assim o React
// não precisa recriar e remontar esses pedaços da tela toda vez que o
// Sidebar renderiza de novo — evita piscar e melhora a performance.
function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 mt-4 mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-blue-200/90">
      {children}
    </p>
  );
}

function LogoTopo() {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-12 w-12 rounded-full bg-white/10 shadow-xl shadow-blue-950/30 flex items-center justify-center border border-white/20 overflow-hidden">
        <img
          src="/logo-thcloud-original.png"
          alt="THCloud"
          className="h-12 w-12 object-cover"
          onError={(e) => {
            e.currentTarget.src = "/logo-thcloud-transparente.png";
          }}
        />
      </div>

      <div className="min-w-0">
        <h1 className="text-[22px] leading-none font-black tracking-[-0.03em] text-white drop-shadow-md">
          TH Cloud
        </h1>
        <p className="text-[11px] text-blue-100 font-semibold leading-tight mt-1">
          Sistema de Gestão
        </p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileAberto, setMobileAberto] = useState(false);
  const [colapsado, setColapsado] = useState(false);

  useEffect(() => {
    setColapsado(localStorage.getItem("th_sidebar_colapsado") === "1");
  }, []);

  function alternarColapso() {
    setColapsado((atual) => {
      const novo = !atual;
      localStorage.setItem("th_sidebar_colapsado", novo ? "1" : "0");
      return novo;
    });
  }
  const [cadastros, setCadastros] = useState(true);
  const [estoque, setEstoque] = useState(false);
  const [vendas, setVendas] = useState(false);
  const [financeiro, setFinanceiro] = useState(false);
  const [relatorios, setRelatorios] = useState(false);
  const [configuracoes, setConfiguracoes] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>({});
  const [modulosEmpresa, setModulosEmpresa] =
    useState<ModulosEmpresa>(MODULOS_EMPRESA_PADRAO);

  useEffect(() => {
    async function carregarUsuario() {
      const salvo =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (!salvo) return;

      const usuarioLocal = JSON.parse(salvo) as UsuarioLogado;
      let usuarioFinal: UsuarioLogado = usuarioLocal;

      if (ehSuperAdminPorPerfil(usuarioLocal.perfil)) {
        usuarioFinal = {
          ...usuarioLocal,
          perfil: "Super Admin",
          modulo_fiscal: true,
          modulo_whatsapp: true,
          modulo_delivery: true,
          modulo_crm: true,
          modulo_relatorios_premium: true,
          modulo_multiloja: true,
          modulo_ordem_servico: true,
        };

        setModulosEmpresa({
          plano: "Master",
          modulo_fiscal: true,
          modulo_whatsapp: true,
          modulo_delivery: true,
          modulo_crm: true,
          modulo_relatorios_premium: true,
          modulo_multiloja: true,
          modulo_ordem_servico: true,
        });

        sessionStorage.setItem("th_usuario", JSON.stringify(usuarioFinal));
        localStorage.setItem("th_usuario", JSON.stringify(usuarioFinal));
        setUsuario(usuarioFinal);
        return;
      }

      const { data } = await supabase
        .from("usuarios")
        .select("id,empresa_id,nome,email,perfil")
        .eq("id", usuarioLocal.id)
        .maybeSingle();

      if (data) {
        usuarioFinal = {
          ...usuarioLocal,
          nome: data.nome || usuarioLocal.nome,
          email: data.email || usuarioLocal.email,
          perfil: data.perfil || usuarioLocal.perfil,
          empresa_id: data.empresa_id || usuarioLocal.empresa_id,
          plano: usuarioLocal.plano,
          plano_nome: usuarioLocal.plano_nome,
          nome_plano: usuarioLocal.nome_plano,
        };
      }

      if (usuarioFinal.empresa_id) {
        const { data: empresaBanco } = await supabase
          .from("empresas")
          .select(
            "id,razao_social,nome_fantasia,plano,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja,modulo_ordem_servico"
          )
          .eq("id", usuarioFinal.empresa_id)
          .maybeSingle();

        if (empresaBanco) {
          const modulosAtualizados: ModulosEmpresa = {
            plano: empresaBanco.plano || usuarioFinal.plano || "Básico",
            modulo_fiscal: empresaBanco.modulo_fiscal === true,
            modulo_whatsapp: empresaBanco.modulo_whatsapp === true,
            modulo_delivery: empresaBanco.modulo_delivery === true,
            modulo_crm: empresaBanco.modulo_crm === true,
            modulo_relatorios_premium:
              empresaBanco.modulo_relatorios_premium === true,
            modulo_multiloja: empresaBanco.modulo_multiloja === true,
            modulo_ordem_servico: empresaBanco.modulo_ordem_servico !== false,
          };

          setModulosEmpresa(modulosAtualizados);

          usuarioFinal = {
            ...usuarioFinal,
            empresa_nome:
              empresaBanco.nome_fantasia ||
              empresaBanco.razao_social ||
              usuarioFinal.empresa_nome,
            plano: modulosAtualizados.plano,
            modulo_fiscal: modulosAtualizados.modulo_fiscal,
            modulo_whatsapp: modulosAtualizados.modulo_whatsapp,
            modulo_delivery: modulosAtualizados.modulo_delivery,
            modulo_crm: modulosAtualizados.modulo_crm,
            modulo_relatorios_premium:
              modulosAtualizados.modulo_relatorios_premium,
            modulo_multiloja: modulosAtualizados.modulo_multiloja,
            modulo_ordem_servico: modulosAtualizados.modulo_ordem_servico,
          };
        }
      }

      try {
        const permissoesLocal =
          sessionStorage.getItem("th_permissoes") ||
          localStorage.getItem("th_permissoes");

        if (permissoesLocal) setPermissoes(JSON.parse(permissoesLocal));
      } catch {}

      sessionStorage.setItem("th_usuario", JSON.stringify(usuarioFinal));
      localStorage.setItem("th_usuario", JSON.stringify(usuarioFinal));
      setUsuario(usuarioFinal);
    }

    carregarUsuario();
  }, []);

  useEffect(() => {
    setMobileAberto(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname?.startsWith("/estoque")) setEstoque(true);
    if (pathname?.startsWith("/vendas") || pathname?.startsWith("/caixa")) {
      setVendas(true);
    }
    if (pathname?.startsWith("/financeiro")) setFinanceiro(true);
    if (pathname?.startsWith("/relatorios")) setRelatorios(true);
    if (
      pathname?.startsWith("/empresas") ||
      pathname?.startsWith("/usuarios") ||
      pathname?.startsWith("/configuracoes") ||
      pathname?.startsWith("/admin/configuracoes")
    ) {
      setConfiguracoes(true);
    }
  }, [pathname]);

  function normalizarPerfil(perfil?: string | null) {
    return String(perfil || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function ehSuperAdminPorPerfil(perfil?: string | null) {
    const valor = normalizarPerfil(perfil);
    return valor === "super admin" || valor === "superadmin" || valor === "master";
  }

  function ehAdministradorPorPerfil(perfil?: string | null) {
    const valor = normalizarPerfil(perfil);
    return (
      valor === "admin" ||
      valor === "administrador" ||
      valor === "administrador empresa" ||
      valor === "gestor" ||
      valor === "gerente geral"
    );
  }

  const isSuperAdmin = ehSuperAdminPorPerfil(usuario?.perfil);
  const isAdministrador = ehAdministradorPorPerfil(usuario?.perfil);
  const podeVerConfiguracoes = isAdministrador || isSuperAdmin;

  function temModuloPremium(modulo: string) {
    if (isSuperAdmin) return true;

    if (modulo === "fiscal") return modulosEmpresa.modulo_fiscal === true;
    if (modulo === "whatsapp") return modulosEmpresa.modulo_whatsapp === true;
    if (modulo === "delivery") return modulosEmpresa.modulo_delivery === true;
    if (modulo === "crm") return modulosEmpresa.modulo_crm === true;
    if (modulo === "relatorios_premium") {
      return modulosEmpresa.modulo_relatorios_premium === true;
    }
    if (modulo === "multiloja") return modulosEmpresa.modulo_multiloja === true;

    return false;
  }

  function temModuloOrdemServico() {
    if (isSuperAdmin) return true;
    return modulosEmpresa.modulo_ordem_servico !== false;
  }

  function pode(modulo: string) {
    const perfil = usuario?.perfil || "";
    const perfilNormalizado = normalizarPerfil(perfil);

    if (permissoes && Object.keys(permissoes).length > 0) {
      if (permissoes[modulo] === true) return true;
      if (permissoes[modulo] === false) return false;
    }

    if (isSuperAdmin) {
      return ["admin", "configuracoes"].includes(modulo);
    }

    if (isAdministrador) return true;

    if (perfilNormalizado === "gerente") {
      return [
        "dashboard",
        "clientes",
        "equipamentos",
        "produto_imeis",
        "produtos",
        "servicos",
        "grupos",
        "etiquetas",
        "fornecedores",
        "estoque",
        "ordem_servico",
        "vendas",
        "pdv",
        "orcamentos",
        "pedidos",
        "devolucoes",
        "financeiro",
        "ordem_servico",
        "relatorios",
      ].includes(modulo);
    }

    if (perfilNormalizado === "operador de caixa" || perfilNormalizado === "caixa") {
      return [
        "dashboard",
        "clientes",
        "servicos",
        "vendas",
        "pdv",
        "orcamentos",
        "devolucoes",
      ].includes(modulo);
    }

    if (perfilNormalizado === "financeiro") {
      return ["dashboard", "clientes", "financeiro", "ordem_servico", "relatorios"].includes(modulo);
    }

    if (perfilNormalizado === "estoquista") {
      return [
        "dashboard",
        "produtos",
        "servicos",
        "grupos",
        "etiquetas",
        "equipamentos",
        "produto_imeis",
        "estoque",
        "relatorios",
      ].includes(modulo);
    }

    if (perfilNormalizado === "vendedor") {
      return [
        "dashboard",
        "clientes",
        "servicos",
        "vendas",
        "pdv",
        "orcamentos",
        "pedidos",
        "ordem_servico",
        "relatorios",
      ].includes(modulo);
    }

    return false;
  }

  function sair() {
    sessionStorage.removeItem("th_usuario");
    sessionStorage.removeItem("th_empresa");
    sessionStorage.removeItem("th_permissoes");

    localStorage.removeItem("th_usuario");
    localStorage.removeItem("th_empresa");
    localStorage.removeItem("th_permissoes");
    localStorage.removeItem("empresa_id");
    localStorage.removeItem("th_empresa_id");

    router.push("/login");
  }

  function ativo(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname?.startsWith(href + "/");
  }

  function classeLink(href: string) {
    return `group flex items-center gap-3 px-3 py-3 rounded-2xl font-black text-[14px] transition-all duration-200 ${
      ativo(href)
        ? "bg-blue-500/95 text-white shadow-xl shadow-blue-950/30"
        : "text-blue-50 hover:bg-white/10 hover:text-white"
    }`;
  }

  function classeSubLink(href: string) {
    return `block px-3 py-2 rounded-xl transition-all duration-200 text-[13px] ${
      ativo(href)
        ? "bg-white text-blue-800 font-black shadow-lg"
        : "text-blue-100/85 hover:bg-white/10 hover:text-white"
    }`;
  }

  function classeBotaoGrupo(aberto: boolean) {
    return `w-full flex items-center justify-between px-3 py-3 rounded-2xl font-black text-[14px] transition-all duration-200 ${
      aberto
        ? "bg-white/10 text-white"
        : "text-blue-50 hover:bg-white/10 hover:text-white"
    }`;
  }

  const menu = (
    <aside
      className={`${colapsado ? "w-0" : "w-[280px]"} bg-gradient-to-b from-blue-700 via-blue-900 to-[#031a55] text-white h-screen min-h-screen shadow-2xl flex flex-col sticky top-0 relative overflow-hidden transition-[width] duration-200 ease-in-out`}
    >
      <div className="absolute inset-x-0 top-0 h-56 bg-sky-400/10 blur-3xl rounded-full -translate-y-36" />
      <div className="absolute -right-24 top-24 h-56 w-56 bg-blue-300/20 blur-3xl rounded-full" />
      <div className="absolute -left-24 bottom-24 h-60 w-60 bg-blue-500/20 blur-3xl rounded-full" />

      <div className="relative px-5 pt-5 pb-4 flex items-center justify-between">
        <LogoTopo />

        <button
          onClick={() => setMobileAberto(false)}
          className="lg:hidden h-10 w-10 rounded-2xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="relative px-4 pb-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {isSuperAdmin && (
          <>
            <TituloSecao>Visão Geral</TituloSecao>

            <Link href="/admin" className={classeLink("/admin")}>
              <Home size={21} strokeWidth={2.4} />
              Dashboard Executivo
            </Link>

            <TituloSecao>Gestão</TituloSecao>

            <Link href="/admin/empresas" className={classeLink("/admin/empresas")}>
              <Building2 size={21} strokeWidth={2.4} />
              Empresas
            </Link>

            <Link href="/usuarios" className={classeLink("/usuarios")}>
              <Users size={21} strokeWidth={2.4} />
              Usuários
            </Link>

            <Link href="/admin/planos" className={classeLink("/admin/planos")}>
              <Tags size={21} strokeWidth={2.4} />
              Planos
            </Link>

            <Link href="/admin/assinaturas" className={classeLink("/admin/assinaturas")}>
              <CircleDollarSign size={21} strokeWidth={2.4} />
              Assinaturas
            </Link>

            <TituloSecao>Infraestrutura</TituloSecao>

            <Link href="/admin/infraestrutura" className={classeLink("/admin/infraestrutura")}>
              <ShieldCheck size={21} strokeWidth={2.4} />
              Dashboard Técnico
            </Link>

            <Link href="/admin/core" className={classeLink("/admin/core")}>
              <Settings size={21} strokeWidth={2.4} />
              Core do Sistema
            </Link>

            <Link href="/admin/auditoria" className={classeLink("/admin/auditoria")}>
              <FileText size={21} strokeWidth={2.4} />
              Auditoria
            </Link>

            <Link href="/admin/notificacoes" className={classeLink("/admin/notificacoes")}>
              <Bell size={21} strokeWidth={2.4} />
              Logs e Alertas
            </Link>

            <Link href="/configuracoes/backup" className={classeLink("/configuracoes/backup")}>
              <Package size={21} strokeWidth={2.4} />
              Backups
            </Link>

            <Link href="/admin/configuracoes" className={classeLink("/admin/configuracoes")}>
              <Settings size={21} strokeWidth={2.4} />
              Atualizações
            </Link>

            <TituloSecao>Plataforma</TituloSecao>

            <Link href="/admin/configuracoes" className={classeLink("/admin/configuracoes")}>
              <Settings size={21} strokeWidth={2.4} />
              Configurações Globais
            </Link>

            <Link href="/admin/controle" className={classeLink("/admin/controle")}>
              <ShieldCheck size={21} strokeWidth={2.4} />
              Controle de Acesso
            </Link>

            <Link href="/onboarding" className={classeLink("/onboarding")}>
              <Package size={21} strokeWidth={2.4} />
              Onboarding
            </Link>

            <TituloSecao>SaaS</TituloSecao>

            <Link href="/admin/financeiro" className={classeLink("/admin/financeiro")}>
              <CircleDollarSign size={21} strokeWidth={2.4} />
              Financeiro SaaS
            </Link>

            <Link href="/admin/cobrancas" className={classeLink("/admin/cobrancas")}>
              <CircleDollarSign size={21} strokeWidth={2.4} />
              Cobranças
            </Link>

            <Link href="/admin/bloqueios" className={classeLink("/admin/bloqueios")}>
              <Lock size={21} strokeWidth={2.4} />
              Bloqueios
            </Link>

            <TituloSecao>Sistema</TituloSecao>

            <Link href="/admin/implantacoes" className={classeLink("/admin/implantacoes")}>
              <Package size={21} strokeWidth={2.4} />
              Implantação
            </Link>

            <Link href="/admin" className={classeLink("/admin")}>
              <FileText size={21} strokeWidth={2.4} />
              Changelog
            </Link>
          </>
        )}

        {!isSuperAdmin && pode("dashboard") && (
          <Link href="/dashboard" className={classeLink("/dashboard")}>
            <Home size={21} strokeWidth={2.4} />
            Dashboard
          </Link>
        )}

        {!isSuperAdmin &&
          (pode("produtos") ||
            pode("servicos") ||
            pode("clientes") ||
            pode("equipamentos") ||
            pode("produto_imeis") ||
            pode("fornecedores") ||
            pode("grupos") ||
            pode("etiquetas") ||
            pode("estoque") ||
            ((pode("ordem_servico") && temModuloOrdemServico()) ||
            pode("vendas"))) && <TituloSecao>Operação</TituloSecao>}

        {!isSuperAdmin &&
          (pode("produtos") ||
            pode("servicos") ||
            pode("clientes") ||
            pode("equipamentos") ||
            pode("produto_imeis") ||
            pode("fornecedores") ||
            pode("grupos") ||
            pode("etiquetas")) && (
            <div className="mt-1">
              <button
                onClick={() => setCadastros(!cadastros)}
                className={classeBotaoGrupo(cadastros)}
              >
                <span className="flex items-center gap-3">
                  <Users size={21} strokeWidth={2.4} />
                  Cadastros
                </span>

                <ChevronDown
                  size={17}
                  className={`transition-transform ${cadastros ? "rotate-180" : ""}`}
                />
              </button>

              {cadastros && (
                <div className="ml-5 mt-2 pl-4 border-l border-white/15 space-y-1">
                  {pode("produtos") && (
                    <Link href="/produtos" className={classeSubLink("/produtos")}>
                      Produtos
                    </Link>
                  )}

                  {pode("servicos") && (
                    <Link href="/servicos" className={classeSubLink("/servicos")}>
                      Serviços
                    </Link>
                  )}

                  {pode("grupos") && (
                    <Link href="/grupos" className={classeSubLink("/grupos")}>
                      Grupos
                    </Link>
                  )}

                  {pode("etiquetas") && (
                    <Link href="/etiquetas" className={classeSubLink("/etiquetas")}>
                      <span className="flex items-center gap-2">
                        <Tags size={14} />
                        Etiquetas
                      </span>
                    </Link>
                  )}

                  {pode("fornecedores") && (
                    <Link href="/fornecedores" className={classeSubLink("/fornecedores")}>
                      Fornecedores
                    </Link>
                  )}

                  {pode("clientes") && (
                    <Link href="/clientes" className={classeSubLink("/clientes")}>
                      Clientes
                    </Link>
                  )}

                  {pode("equipamentos") && (
                    <Link href="/equipamentos" className={classeSubLink("/equipamentos")}>
                      Equipamentos
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

        {!isSuperAdmin && pode("estoque") && (
          <div className="mt-1">
            <button onClick={() => setEstoque(!estoque)} className={classeBotaoGrupo(estoque)}>
              <span className="flex items-center gap-3">
                <Package size={21} strokeWidth={2.4} />
                Estoque
              </span>

              <ChevronDown size={17} className={`transition-transform ${estoque ? "rotate-180" : ""}`} />
            </button>

            {estoque && (
              <div className="ml-5 mt-2 pl-4 border-l border-white/15 space-y-1">
                <Link href="/estoque/entrada" className={classeSubLink("/estoque/entrada")}>Entrada</Link>
                <Link href="/estoque/saida" className={classeSubLink("/estoque/saida")}>Saída</Link>
                <Link href="/estoque/ajuste" className={classeSubLink("/estoque/ajuste")}>Ajuste Manual</Link>
                <Link href="/estoque/inventario" className={classeSubLink("/estoque/inventario")}>Inventário</Link>
              </div>
            )}
          </div>
        )}

        {!isSuperAdmin && pode("ordem_servico") && temModuloOrdemServico() && (
          <Link href="/ordem-servico" className={classeLink("/ordem-servico")}>
            <Wrench size={21} strokeWidth={2.4} />
            Ordem de Serviço
          </Link>
        )}

        {!isSuperAdmin && pode("vendas") && (
          <div className="mt-1">
            <button onClick={() => setVendas(!vendas)} className={classeBotaoGrupo(vendas)}>
              <span className="flex items-center gap-3">
                <ShoppingCart size={21} strokeWidth={2.4} />
                Vendas
              </span>

              <ChevronDown size={17} className={`transition-transform ${vendas ? "rotate-180" : ""}`} />
            </button>

            {vendas && (
              <div className="ml-5 mt-2 pl-4 border-l border-white/15 space-y-1">
                {pode("pdv") && <Link href="/caixa/pdv" className={classeSubLink("/caixa/pdv")}>PDV</Link>}
                {pode("orcamentos") && <Link href="/vendas/orcamentos" className={classeSubLink("/vendas/orcamentos")}>Orçamentos</Link>}
                {pode("pedidos") && <Link href="/vendas/pedidos" className={classeSubLink("/vendas/pedidos")}>Pedidos</Link>}
                {pode("devolucoes") && <Link href="/vendas/devolucoes" className={classeSubLink("/vendas/devolucoes")}>Devoluções</Link>}
              </div>
            )}
          </div>
        )}

        {!isSuperAdmin && (pode("financeiro") || pode("relatorios")) ? <TituloSecao>Gestão</TituloSecao> : null}

        {!isSuperAdmin && pode("financeiro") && (
          <div className="mt-1">
            <button onClick={() => setFinanceiro(!financeiro)} className={classeBotaoGrupo(financeiro)}>
              <span className="flex items-center gap-3">
                <CircleDollarSign size={21} strokeWidth={2.4} />
                Financeiro
              </span>

              <ChevronDown size={17} className={`transition-transform ${financeiro ? "rotate-180" : ""}`} />
            </button>

            {financeiro && (
              <div className="ml-5 mt-2 pl-4 border-l border-white/15 space-y-1">
                <Link href="/financeiro" className={classeSubLink("/financeiro")}>Dashboard Financeiro</Link>
                <Link href="/financeiro/contas-receber" className={classeSubLink("/financeiro/contas-receber")}>Contas a Receber</Link>
                <Link href="/financeiro/contas-pagar" className={classeSubLink("/financeiro/contas-pagar")}>Contas a Pagar</Link>
                <Link href="/financeiro/fluxo-caixa" className={classeSubLink("/financeiro/fluxo-caixa")}>Fluxo de Caixa</Link>
                <Link href="/financeiro/dre" className={classeSubLink("/financeiro/dre")}>DRE</Link>
              </div>
            )}
          </div>
        )}

        {!isSuperAdmin && pode("relatorios") && (
          <div className="mt-1">
            <button onClick={() => setRelatorios(!relatorios)} className={classeBotaoGrupo(relatorios)}>
              <span className="flex items-center gap-3">
                <BarChart3 size={21} strokeWidth={2.4} />
                Relatórios
              </span>

              <ChevronDown size={17} className={`transition-transform ${relatorios ? "rotate-180" : ""}`} />
            </button>

            {relatorios && (
              <div className="ml-5 mt-2 pl-4 border-l border-white/15 space-y-1">
                <Link href="/relatorios" className={classeSubLink("/relatorios")}>Central de Relatórios</Link>
                <Link href="/relatorios/dre" className={classeSubLink("/relatorios/dre")}>DRE</Link>
                <Link href="/relatorios/fluxo-caixa" className={classeSubLink("/relatorios/fluxo-caixa")}>Fluxo de Caixa</Link>
                <Link href="/relatorios/caixas" className={classeSubLink("/relatorios/caixas")}>Caixas</Link>
                <Link href="/relatorios/contas-receber" className={classeSubLink("/relatorios/contas-receber")}>Contas a Receber</Link>
                <Link href="/relatorios/contas-pagar" className={classeSubLink("/relatorios/contas-pagar")}>Contas a Pagar</Link>
                <Link href="/relatorios/produtos" className={classeSubLink("/relatorios/produtos")}>Produtos</Link>
                <Link href="/relatorios/estoque" className={classeSubLink("/relatorios/estoque")}>Estoque</Link>
                <Link href="/relatorios/imeis" className={classeSubLink("/relatorios/imeis")}>IMEI / Celulares</Link>
                <Link href="/relatorios/clientes" className={classeSubLink("/relatorios/clientes")}>Clientes</Link>
                <Link href="/relatorios/produtos-mais-vendidos" className={classeSubLink("/relatorios/produtos-mais-vendidos")}>Produtos Mais Vendidos</Link>
                <Link href="/relatorios/ranking-clientes" className={classeSubLink("/relatorios/ranking-clientes")}>Ranking de Clientes</Link>
                <Link href="/relatorios/lucratividade" className={classeSubLink("/relatorios/lucratividade")}>Lucratividade</Link>
                <Link href="/relatorios/vendas" className={classeSubLink("/relatorios/vendas")}>Vendas por Período</Link>
                <Link href="/relatorios/inadimplentes" className={classeSubLink("/relatorios/inadimplentes")}>Clientes Inadimplentes</Link>
                <Link href="/relatorios/compras-fornecedor" className={classeSubLink("/relatorios/compras-fornecedor")}>Compras por Fornecedor</Link>
                <Link href="/relatorios/formas-pagamento" className={classeSubLink("/relatorios/formas-pagamento")}>Formas de Pagamento</Link>
                <Link href="/relatorios/curva-abc" className={classeSubLink("/relatorios/curva-abc")}>Curva ABC</Link>

                {temModuloPremium("relatorios_premium") && (
                  <>
                    <div className="border-t border-white/15 my-2" />
                    <p className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-200/70">
                      Relatórios Premium
                    </p>
                    <Link href="/relatorios/premium" className={classeSubLink("/relatorios/premium")}>
                      Indicadores Premium
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {!isSuperAdmin &&
          (temModuloPremium("whatsapp") || temModuloPremium("crm") || temModuloPremium("delivery")) && (
            <TituloSecao>Comunicação</TituloSecao>
          )}

        {!isSuperAdmin && temModuloPremium("whatsapp") && (
          <Link href="/whatsapp" className={classeLink("/whatsapp")}>
            <Bell size={21} strokeWidth={2.4} />
            WhatsApp
          </Link>
        )}

        {!isSuperAdmin && temModuloPremium("crm") && (
          <Link href="/crm" className={classeLink("/crm")}>
            <Users size={21} strokeWidth={2.4} />
            CRM
          </Link>
        )}

        {!isSuperAdmin && temModuloPremium("delivery") && (
          <Link href="/delivery" className={classeLink("/delivery")}>
            <Truck size={21} strokeWidth={2.4} />
            Delivery
          </Link>
        )}

        {!isSuperAdmin &&
          (podeVerConfiguracoes || temModuloPremium("fiscal") || temModuloPremium("multiloja")) && (
            <TituloSecao>Administração</TituloSecao>
          )}

        {!isSuperAdmin && temModuloPremium("fiscal") && (
          <Link href="/fiscal" className={classeLink("/fiscal")}>
            <FileText size={21} strokeWidth={2.4} />
            Fiscal
          </Link>
        )}

        {!isSuperAdmin && temModuloPremium("multiloja") && (
          <Link href="/lojas" className={classeLink("/lojas")}>
            <Store size={21} strokeWidth={2.4} />
            Multiloja
          </Link>
        )}

        {!isSuperAdmin && podeVerConfiguracoes && (
          <div className="mt-1">
            <button onClick={() => setConfiguracoes(!configuracoes)} className={classeBotaoGrupo(configuracoes)}>
              <span className="flex items-center gap-3">
                <Settings size={21} strokeWidth={2.4} />
                Configurações
              </span>

              <ChevronDown size={17} className={`transition-transform ${configuracoes ? "rotate-180" : ""}`} />
            </button>

            {configuracoes && (
              <div className="ml-5 mt-2 pl-4 border-l border-white/15 space-y-1">
                <Link href="/empresas" className={classeSubLink("/empresas")}>
                  <span className="flex items-center gap-2"><Building2 size={14} /> Minha Empresa</span>
                </Link>
                <Link href="/usuarios" className={classeSubLink("/usuarios")}>
                  <span className="flex items-center gap-2"><Users size={14} /> Usuários</span>
                </Link>
                <Link href="/configuracoes" className={classeSubLink("/configuracoes")}>
                  <span className="flex items-center gap-2"><Settings size={14} /> Configurações Gerais</span>
                </Link>
                <Link href="/configuracoes/backup" className={classeSubLink("/configuracoes/backup")}>
                  Backup
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="relative px-4 pb-4 pt-2">
        <div className="bg-blue-500/20 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-2xl shadow-blue-950/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-lg shadow-xl">
                {(usuario?.nome || "U").slice(0, 1).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="text-white font-black truncate text-sm">{usuario?.nome || "-"}</p>
                <p className="text-blue-100 text-xs font-medium truncate">
                  {isSuperAdmin ? "Super Admin" : usuario?.perfil || "-"}
                </p>
              </div>
            </div>

            <ChevronDown size={16} className="text-blue-100" />
          </div>

          {(usuario?.plano || usuario?.plano_nome || usuario?.nome_plano || isSuperAdmin) && (
            <div className="mt-4">
              <p className="text-sm font-black text-white">
                Plano {isSuperAdmin ? "Master" : usuario?.plano_nome || usuario?.nome_plano || usuario?.plano}
              </p>

              <div className="mt-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-950/50 border border-white/10">
                  <span className="text-xs font-bold text-blue-100">
                    {isSuperAdmin ? "Painel Master SaaS" : `Plano ${usuario?.plano_nome || usuario?.nome_plano || usuario?.plano}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-white/10 mt-4 pt-3">
            <button
              onClick={sair}
              className="w-full flex items-center gap-3 text-white hover:text-red-100 py-2 rounded-2xl font-black transition text-sm"
            >
              <LogOut size={19} />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <button
        onClick={() => setMobileAberto(true)}
        className="lg:hidden fixed top-4 left-4 z-[90] h-12 w-12 rounded-2xl bg-blue-700 text-white shadow-lg flex items-center justify-center"
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      <div className={`hidden lg:block ${colapsado ? "w-0" : "w-[280px]"} shrink-0 bg-gradient-to-b from-blue-700 via-blue-900 to-[#031a55] min-h-screen self-stretch transition-[width] duration-200 ease-in-out overflow-hidden`}>{menu}</div>

      <button
        onClick={alternarColapso}
        className="hidden lg:flex fixed bottom-6 z-[95] h-8 w-8 rounded-full bg-blue-800 border-2 border-white text-white shadow-lg items-center justify-center hover:bg-blue-700 transition-all duration-200"
        style={{ left: colapsado ? "8px" : "266px" }}
        aria-label={colapsado ? "Expandir menu" : "Recolher menu"}
        title={colapsado ? "Expandir menu" : "Recolher menu"}
      >
        {colapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {mobileAberto && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileAberto(false)}
          />

          <div className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[88vw] shadow-2xl">
            {menu}
          </div>
        </div>
      )}
    </>
  );
}
