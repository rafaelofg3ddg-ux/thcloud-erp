"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  BarChart3, Bell, Building2, ChevronDown, CircleDollarSign, FileText, Home,
  LogOut, Menu, Package, Settings, ShoppingCart, Store, Tags, Truck, Users,
  Warehouse, X
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
};

const MODULOS_EMPRESA_PADRAO: ModulosEmpresa = {
  plano: null,
  modulo_fiscal: false,
  modulo_whatsapp: false,
  modulo_delivery: false,
  modulo_crm: false,
  modulo_relatorios_premium: false,
  modulo_multiloja: false,
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileAberto, setMobileAberto] = useState(false);
  const [cadastros, setCadastros] = useState(true);
  const [estoque, setEstoque] = useState(false);
  const [vendas, setVendas] = useState(false);
  const [financeiro, setFinanceiro] = useState(false);
  const [relatorios, setRelatorios] = useState(false);
  const [configuracoes, setConfiguracoes] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>({});
  const [modulosEmpresa, setModulosEmpresa] = useState<ModulosEmpresa>(
    MODULOS_EMPRESA_PADRAO
  );

  useEffect(() => {
    async function carregarUsuario() {
      const salvo =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (!salvo) return;

      const usuarioLocal = JSON.parse(salvo) as UsuarioLogado;
      let usuarioFinal: UsuarioLogado = usuarioLocal;

      if (usuarioLocal.perfil === "Super Admin") {
        usuarioFinal = {
          ...usuarioLocal,
          modulo_fiscal: true,
          modulo_whatsapp: true,
          modulo_delivery: true,
          modulo_crm: true,
          modulo_relatorios_premium: true,
          modulo_multiloja: true,
        };
        setModulosEmpresa({
          plano: "Administração SaaS",
          modulo_fiscal: true,
          modulo_whatsapp: true,
          modulo_delivery: true,
          modulo_crm: true,
          modulo_relatorios_premium: true,
          modulo_multiloja: true,
        });

        sessionStorage.setItem("th_usuario", JSON.stringify(usuarioFinal));
        localStorage.setItem("th_usuario", JSON.stringify(usuarioFinal));
        setUsuario(usuarioFinal);
        return;
      }

      const { data } = await supabase
        .from("usuarios")
        .select(
          "id,empresa_id,nome,email,perfil"
        )
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
            "id,razao_social,nome_fantasia,plano,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja"
          )
          .eq("id", usuarioFinal.empresa_id)
          .maybeSingle();

        if (empresaBanco) {
          const modulosAtualizados: ModulosEmpresa = {
            plano: empresaBanco.plano || usuarioFinal.plano || null,
            modulo_fiscal: empresaBanco.modulo_fiscal === true,
            modulo_whatsapp: empresaBanco.modulo_whatsapp === true,
            modulo_delivery: empresaBanco.modulo_delivery === true,
            modulo_crm: empresaBanco.modulo_crm === true,
            modulo_relatorios_premium:
              empresaBanco.modulo_relatorios_premium === true,
            modulo_multiloja: empresaBanco.modulo_multiloja === true,
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
    if (pathname?.startsWith("/vendas") || pathname?.startsWith("/caixa")) setVendas(true);
    if (pathname?.startsWith("/financeiro")) setFinanceiro(true);
    if (pathname?.startsWith("/relatorios")) setRelatorios(true);
    if (pathname?.startsWith("/empresas") || pathname?.startsWith("/usuarios") || pathname?.startsWith("/configuracoes")) {
      setConfiguracoes(true);
    }
  }, [pathname]);

  const isSuperAdmin = usuario?.perfil === "Super Admin";
  const isAdministrador = usuario?.perfil === "Administrador";
  const podeVerConfiguracoes = isAdministrador || isSuperAdmin;

  function temModuloPremium(modulo: string) {
    if (isSuperAdmin) return true;

    /*
      MÓDULOS DINÂMICOS DO PAINEL SUPER ADMIN:
      O menu aparece ou some conforme os campos da tabela empresas.
      Marcar no Super Admin: aparece.
      Desmarcar no Super Admin: some.
      Marcar novamente: volta a aparecer.
    */

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

  function pode(modulo: string) {
    const perfil = usuario?.perfil || "";

    if (permissoes && Object.keys(permissoes).length > 0) {
      if (permissoes[modulo] === true) return true;
      if (permissoes[modulo] === false) return false;
    }

    if (perfil === "Super Admin") return ["admin", "configuracoes"].includes(modulo);
    if (perfil === "Administrador") return true;

    if (perfil === "Gerente") {
      return ["dashboard","clientes","produtos","grupos","etiquetas","fornecedores","estoque","vendas","pdv","orcamentos","pedidos","devolucoes","financeiro","relatorios"].includes(modulo);
    }

    if (perfil === "Operador de Caixa") {
      return ["dashboard","clientes","vendas","pdv","orcamentos","devolucoes"].includes(modulo);
    }

    if (perfil === "Financeiro") return ["dashboard","clientes","financeiro","relatorios"].includes(modulo);
    if (perfil === "Estoquista") return ["dashboard","produtos","grupos","etiquetas","estoque","relatorios"].includes(modulo);
    if (perfil === "Vendedor") return ["dashboard","clientes","vendas","pdv","orcamentos","pedidos","relatorios"].includes(modulo);

    return false;
  }

  function sair() {
    sessionStorage.removeItem("th_usuario");
    sessionStorage.removeItem("th_empresa");
    sessionStorage.removeItem("th_permissoes");

    localStorage.removeItem("th_usuario");
    localStorage.removeItem("th_empresa");
    localStorage.removeItem("th_permissoes");
    router.push("/login");
  }

  function ativo(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname?.startsWith(href + "/");
  }

  function classeLink(href: string) {
    return `flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
      ativo(href) ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
    }`;
  }

  function classeSubLink(href: string) {
    return `block p-2 rounded-lg transition ${
      ativo(href) ? "bg-blue-50 text-blue-700 font-black" : "hover:bg-slate-100 hover:text-blue-700"
    }`;
  }

  const menu = (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen shadow-sm flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo-thcloud-transparente.png"
            alt="THCloud"
            className="h-12 w-12 object-contain"
            onError={(e) => { e.currentTarget.src = "/logo-thcloud.jpeg"; }}
          />
          <div>
            <h1 className="text-xl font-black text-blue-700">THCloud</h1>
            <p className="text-xs font-semibold text-slate-500">ERP Inteligente</p>
          </div>
        </div>

        <button
          onClick={() => setMobileAberto(false)}
          className="lg:hidden h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="p-3 flex-1 overflow-y-auto">
        {isSuperAdmin && (
          <Link href="/admin" className={classeLink("/admin")}>
            <Home size={19} /> Dashboard SaaS
          </Link>
        )}

        {pode("dashboard") && (
          <Link href="/dashboard" className={classeLink("/dashboard")}>
            <Home size={19} /> Dashboard
          </Link>
        )}

        {(pode("produtos") || pode("clientes") || pode("fornecedores") || pode("grupos") || pode("etiquetas")) && (
          <div className="mt-1">
            <button
              onClick={() => setCadastros(!cadastros)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3"><Package size={19} /> Cadastros</span>
              <ChevronDown size={16} />
            </button>

            {cadastros && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                {pode("produtos") && <Link href="/produtos" className={classeSubLink("/produtos")}>Produtos</Link>}
                {pode("grupos") && <Link href="/grupos" className={classeSubLink("/grupos")}>Grupos</Link>}
                {pode("etiquetas") && (
                  <Link href="/etiquetas" className={classeSubLink("/etiquetas")}>
                    <span className="flex items-center gap-2"><Tags size={15} /> Etiquetas</span>
                  </Link>
                )}
                {pode("fornecedores") && <Link href="/fornecedores" className={classeSubLink("/fornecedores")}>Fornecedores</Link>}
                {pode("clientes") && <Link href="/clientes" className={classeSubLink("/clientes")}>Clientes</Link>}
              </div>
            )}
          </div>
        )}

        {pode("estoque") && (
          <div className="mt-1">
            <button
              onClick={() => setEstoque(!estoque)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3"><Warehouse size={19} /> Estoque</span>
              <ChevronDown size={16} />
            </button>

            {estoque && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                <Link href="/estoque/entrada" className={classeSubLink("/estoque/entrada")}>Entrada</Link>
                <Link href="/estoque/saida" className={classeSubLink("/estoque/saida")}>Saída</Link>
                <Link href="/estoque/ajuste" className={classeSubLink("/estoque/ajuste")}>Ajuste Manual</Link>
                <Link href="/estoque/inventario" className={classeSubLink("/estoque/inventario")}>Inventário</Link>
              </div>
            )}
          </div>
        )}

        {pode("vendas") && (
          <div className="mt-1">
            <button
              onClick={() => setVendas(!vendas)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3"><ShoppingCart size={19} /> Vendas</span>
              <ChevronDown size={16} />
            </button>

            {vendas && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                {pode("pdv") && <Link href="/caixa/pdv" className={classeSubLink("/caixa/pdv")}>PDV</Link>}
                {pode("orcamentos") && <Link href="/vendas/orcamentos" className={classeSubLink("/vendas/orcamentos")}>Orçamentos</Link>}
                {pode("pedidos") && <Link href="/vendas/pedidos" className={classeSubLink("/vendas/pedidos")}>Pedidos</Link>}
                {pode("devolucoes") && <Link href="/vendas/devolucoes" className={classeSubLink("/vendas/devolucoes")}>Devoluções</Link>}
              </div>
            )}
          </div>
        )}

        {temModuloPremium("delivery") && <Link href="/delivery" className={classeLink("/delivery")}><Truck size={19} /> Delivery</Link>}
        {temModuloPremium("fiscal") && <Link href="/fiscal" className={classeLink("/fiscal")}><FileText size={19} /> Fiscal</Link>}
        {temModuloPremium("whatsapp") && <Link href="/whatsapp" className={classeLink("/whatsapp")}><Bell size={19} /> WhatsApp</Link>}
        {temModuloPremium("crm") && <Link href="/crm" className={classeLink("/crm")}><Users size={19} /> CRM</Link>}
        {temModuloPremium("multiloja") && <Link href="/lojas" className={classeLink("/lojas")}><Store size={19} /> Multiloja</Link>}

        {pode("financeiro") && (
          <div className="mt-1">
            <button
              onClick={() => setFinanceiro(!financeiro)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3"><CircleDollarSign size={19} /> Financeiro</span>
              <ChevronDown size={16} />
            </button>

            {financeiro && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                <Link href="/financeiro" className={classeSubLink("/financeiro")}>Dashboard Financeiro</Link>
                <Link href="/financeiro/contas-receber" className={classeSubLink("/financeiro/contas-receber")}>Contas a Receber</Link>
                <Link href="/financeiro/contas-pagar" className={classeSubLink("/financeiro/contas-pagar")}>Contas a Pagar</Link>
                <Link href="/financeiro/fluxo-caixa" className={classeSubLink("/financeiro/fluxo-caixa")}>Fluxo de Caixa</Link>
                <Link href="/financeiro/dre" className={classeSubLink("/financeiro/dre")}>DRE</Link>
              </div>
            )}
          </div>
        )}

        {pode("relatorios") && (
          <div className="mt-1">
            <button
              onClick={() => setRelatorios(!relatorios)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3"><BarChart3 size={19} /> Relatórios</span>
              <ChevronDown size={16} />
            </button>

            {relatorios && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                <Link href="/relatorios" className={classeSubLink("/relatorios")}>Central de Relatórios</Link>
                <Link href="/relatorios/dre" className={classeSubLink("/relatorios/dre")}>DRE</Link>
                <Link href="/relatorios/fluxo-caixa" className={classeSubLink("/relatorios/fluxo-caixa")}>Fluxo de Caixa</Link>
                <Link href="/relatorios/caixas" className={classeSubLink("/relatorios/caixas")}>Caixas</Link>
                <Link href="/relatorios/contas-receber" className={classeSubLink("/relatorios/contas-receber")}>Contas a Receber</Link>
                <Link href="/relatorios/contas-pagar" className={classeSubLink("/relatorios/contas-pagar")}>Contas a Pagar</Link>
                <Link href="/relatorios/produtos" className={classeSubLink("/relatorios/produtos")}>Produtos</Link>
                <Link href="/relatorios/estoque" className={classeSubLink("/relatorios/estoque")}>Estoque</Link>
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
                    <div className="border-t border-slate-200 my-2"></div>
                    <p className="px-2 py-1 text-xs font-bold uppercase text-slate-400">Relatórios Premium</p>
                    <Link href="/relatorios/premium" className={classeSubLink("/relatorios/premium")}>Indicadores Premium</Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {podeVerConfiguracoes && (
          <div className="mt-1">
            <button
              onClick={() => setConfiguracoes(!configuracoes)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3"><Settings size={19} /> Configurações</span>
              <ChevronDown size={16} />
            </button>

            {configuracoes && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                {!isSuperAdmin && (
                  <>
                    <Link href="/empresas" className={classeSubLink("/empresas")}><span className="flex items-center gap-2"><Building2 size={15} /> Minha Empresa</span></Link>
                    <Link href="/usuarios" className={classeSubLink("/usuarios")}><span className="flex items-center gap-2"><Users size={15} /> Usuários</span></Link>
                    <Link href="/configuracoes" className={classeSubLink("/configuracoes")}><span className="flex items-center gap-2"><Settings size={15} /> Configurações Gerais</span></Link>
                  </>
                )}

                {isSuperAdmin && (
                  <>
                    <p className="px-2 py-1 text-xs font-bold uppercase text-slate-400">Administração SaaS</p>
                    <Link href="/admin/empresas" className={classeSubLink("/admin/empresas")}><span className="flex items-center gap-2"><Building2 size={15} /> Empresas SaaS</span></Link>
                    <Link href="/admin/assinaturas" className={classeSubLink("/admin/assinaturas")}><span className="flex items-center gap-2"><CircleDollarSign size={15} /> Assinaturas SaaS</span></Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500">Operador</p>
          <p className="text-slate-900 font-bold truncate">{usuario?.nome || "-"}</p>
          <p className="text-blue-600 text-sm font-semibold truncate">{usuario?.perfil || "-"}</p>

          {(usuario?.plano || usuario?.plano_nome || usuario?.nome_plano) && (
            <p className="mt-1 text-xs font-black text-emerald-700 truncate">
              Plano: {usuario?.plano_nome || usuario?.nome_plano || usuario?.plano}
            </p>
          )}

          <button
            onClick={sair}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-xl font-semibold"
          >
            <LogOut size={16} /> Sair
          </button>
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

      <div className="hidden lg:block">{menu}</div>

      {mobileAberto && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileAberto(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[86vw] bg-white shadow-2xl">
            {menu}
          </div>
        </div>
      )}
    </>
  );
}
