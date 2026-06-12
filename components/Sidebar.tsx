"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  BarChart3,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  Warehouse,
} from "lucide-react";

type UsuarioLogado = {
  id: string;
  empresa_id: string | null;
  nome: string;
  email: string;
  perfil: string;

  modulo_fiscal?: boolean;
  modulo_whatsapp?: boolean;
  modulo_delivery?: boolean;
  modulo_crm?: boolean;
  modulo_relatorios_premium?: boolean;
  modulo_multiloja?: boolean;
};

export default function Sidebar() {
  const router = useRouter();

  const [cadastros, setCadastros] = useState(true);
  const [estoque, setEstoque] = useState(false);
  const [vendas, setVendas] = useState(false);
  const [financeiro, setFinanceiro] = useState(false);
  const [relatorios, setRelatorios] = useState(false);
  const [configuracoes, setConfiguracoes] = useState(false);

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

  useEffect(() => {
    async function carregarUsuario() {
      const salvo = localStorage.getItem("th_usuario");

      if (!salvo) return;

      const usuarioLocal = JSON.parse(salvo) as UsuarioLogado;

      if (usuarioLocal.perfil === "Super Admin") {
        setUsuario({
          ...usuarioLocal,
          modulo_fiscal: true,
          modulo_whatsapp: true,
          modulo_delivery: true,
          modulo_crm: true,
          modulo_relatorios_premium: true,
          modulo_multiloja: true,
        });

        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select(
          "id,empresa_id,nome,email,perfil,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja"
        )
        .eq("id", usuarioLocal.id)
        .maybeSingle();

      if (error || !data) {
        setUsuario(usuarioLocal);
        return;
      }

      const usuarioAtualizado = {
        ...usuarioLocal,
        nome: data.nome || usuarioLocal.nome,
        email: data.email || usuarioLocal.email,
        perfil: data.perfil || usuarioLocal.perfil,
        empresa_id: data.empresa_id || usuarioLocal.empresa_id,
        modulo_fiscal: data.modulo_fiscal === true,
        modulo_whatsapp: data.modulo_whatsapp === true,
        modulo_delivery: data.modulo_delivery === true,
        modulo_crm: data.modulo_crm === true,
        modulo_relatorios_premium: data.modulo_relatorios_premium === true,
        modulo_multiloja: data.modulo_multiloja === true,
      };

      localStorage.setItem("th_usuario", JSON.stringify(usuarioAtualizado));

      setUsuario(usuarioAtualizado);
    }

    carregarUsuario();
  }, []);

  const isSuperAdmin = usuario?.perfil === "Super Admin";
  const isAdministrador = usuario?.perfil === "Administrador";
  const podeVerConfiguracoes = isAdministrador || isSuperAdmin;

  function pode(modulo: string) {
    const perfil = usuario?.perfil || "";

    if (perfil === "Super Admin") {
      return ["admin", "configuracoes"].includes(modulo);
    }

    if (perfil === "Administrador") return true;

    if (perfil === "Gerente") {
      return [
        "dashboard",
        "clientes",
        "produtos",
        "fornecedores",
        "estoque",
        "vendas",
        "financeiro",
        "relatorios",
      ].includes(modulo);
    }

    if (perfil === "Operador de Caixa") {
      return ["dashboard", "clientes", "vendas"].includes(modulo);
    }

    if (perfil === "Financeiro") {
      return ["dashboard", "clientes", "financeiro", "relatorios"].includes(
        modulo
      );
    }

    if (perfil === "Estoquista") {
      return ["dashboard", "produtos", "estoque", "relatorios"].includes(
        modulo
      );
    }

    if (perfil === "Vendedor") {
      return ["dashboard", "clientes", "vendas", "relatorios"].includes(
        modulo
      );
    }

    return false;
  }

  function sair() {
    localStorage.removeItem("th_usuario");
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen shadow-sm flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src="/logo-thcloud-transparente.png"
            alt="THCloud"
            className="h-12 w-12 object-contain"
            onError={(e) => {
              e.currentTarget.src = "/logo-thcloud.jpeg";
            }}
          />

          <div>
            <h1 className="text-xl font-black text-blue-700">THCloud</h1>
            <p className="text-xs font-semibold text-slate-500">
              ERP Inteligente
            </p>
          </div>
        </div>
      </div>

      <nav className="p-3 flex-1 overflow-y-auto">
        {isSuperAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
          >
            <Home size={19} /> Dashboard SaaS
          </Link>
        )}

        {pode("dashboard") && (
          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
          >
            <Home size={19} /> Dashboard
          </Link>
        )}

        {(pode("produtos") || pode("clientes") || pode("fornecedores")) && (
          <div className="mt-1">
            <button
              onClick={() => setCadastros(!cadastros)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3">
                <Package size={19} /> Cadastros
              </span>
              <ChevronDown size={16} />
            </button>

            {cadastros && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                {pode("produtos") && (
                  <>
                    <Link
                      href="/produtos"
                      className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                    >
                      Produtos
                    </Link>

                    <Link
                      href="/grupos"
                      className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                    >
                      Grupos
                    </Link>

                    <Link
                      href="/etiquetas"
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700 font-bold text-blue-700"
                    >
                      <Tags size={15} /> Etiquetas
                    </Link>
                  </>
                )}

                {pode("fornecedores") && (
                  <Link
                    href="/fornecedores"
                    className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                  >
                    Fornecedores
                  </Link>
                )}

                {pode("clientes") && (
                  <Link
                    href="/clientes"
                    className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                  >
                    Clientes
                  </Link>
                )}
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
              <span className="flex items-center gap-3">
                <Warehouse size={19} /> Estoque
              </span>
              <ChevronDown size={16} />
            </button>

            {estoque && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                <Link
                  href="/estoque/entrada"
                  className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                >
                  Entrada
                </Link>

                <Link
                  href="/estoque/saida"
                  className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                >
                  Saída
                </Link>

                <Link
                  href="/estoque/ajuste"
                  className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                >
                  Ajuste Manual
                </Link>

                <Link
                  href="/estoque/inventario"
                  className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                >
                  Inventário
                </Link>
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
              <span className="flex items-center gap-3">
                <ShoppingCart size={19} /> Vendas
              </span>
              <ChevronDown size={16} />
            </button>

            {vendas && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                <Link
                  href="/caixa/pdv"
                  className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                >
                  PDV
                </Link>

                <Link
                  href="/vendas/orcamentos"
                  className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                >
                  Orçamentos
                </Link>

                <Link
                  href="/vendas/pedidos"
                  className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                >
                  Pedidos
                </Link>

                <Link
                  href="/vendas/devolucoes"
                  className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700"
                >
                  Devoluções
                </Link>
              </div>
            )}
          </div>
        )}

        {usuario?.modulo_delivery && (
          <Link
            href="/delivery"
            className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
          >
            <ShoppingCart size={19} /> Delivery
          </Link>
        )}

        {pode("financeiro") && (
          <div className="mt-1">
            <button
              onClick={() => setFinanceiro(!financeiro)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3">
                <CircleDollarSign size={19} /> Financeiro
              </span>
              <ChevronDown size={16} />
            </button>

            {financeiro && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                <Link href="/financeiro" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Dashboard Financeiro
                </Link>

                <Link href="/financeiro/contas-receber" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Contas a Receber
                </Link>

                <Link href="/financeiro/contas-pagar" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Contas a Pagar
                </Link>

                <Link href="/financeiro/fluxo-caixa" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Fluxo de Caixa
                </Link>

                <Link href="/financeiro/dre" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  DRE
                </Link>
              </div>
            )}
          </div>
        )}

        {usuario?.modulo_fiscal && (
          <Link href="/fiscal" className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition">
            <CircleDollarSign size={19} /> Fiscal
          </Link>
        )}

        {usuario?.modulo_whatsapp && (
          <Link href="/whatsapp" className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition">
            <Users size={19} /> WhatsApp
          </Link>
        )}

        {usuario?.modulo_crm && (
          <Link href="/crm" className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition">
            <Users size={19} /> CRM
          </Link>
        )}

        {usuario?.modulo_multiloja && (
          <Link href="/lojas" className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition">
            <Building2 size={19} /> Multiloja
          </Link>
        )}

        {pode("relatorios") && (
          <div className="mt-1">
            <button
              onClick={() => setRelatorios(!relatorios)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
            >
              <span className="flex items-center gap-3">
                <BarChart3 size={19} /> Relatórios
              </span>
              <ChevronDown size={16} />
            </button>

            {relatorios && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                <Link href="/relatorios" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700 font-bold text-slate-700">
                  Central de Relatórios
                </Link>

                <Link href="/relatorios/caixas" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700 font-bold text-blue-700">
                  Caixas
                </Link>

                <Link href="/relatorios/dre" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  DRE
                </Link>

                <Link href="/relatorios/fluxo-caixa" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Fluxo de Caixa
                </Link>

                <Link href="/relatorios/contas-receber" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Contas a Receber
                </Link>

                <Link href="/relatorios/contas-pagar" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Contas a Pagar
                </Link>

                <Link href="/relatorios/produtos" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Produtos
                </Link>

                <Link href="/relatorios/estoque" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Estoque
                </Link>

                <Link href="/relatorios/clientes" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Clientes
                </Link>

                <Link href="/relatorios/produtos-mais-vendidos" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Produtos Mais Vendidos
                </Link>

                <Link href="/relatorios/ranking-clientes" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Ranking de Clientes
                </Link>

                <Link href="/relatorios/lucratividade" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Lucratividade
                </Link>

                <Link href="/relatorios/vendas" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Vendas por Período
                </Link>

                <Link href="/relatorios/inadimplentes" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Clientes Inadimplentes
                </Link>

                <Link href="/relatorios/compras-fornecedor" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Compras por Fornecedor
                </Link>

                <Link href="/relatorios/formas-pagamento" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Formas de Pagamento
                </Link>

                <Link href="/relatorios/curva-abc" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                  Curva ABC
                </Link>

                {usuario?.modulo_relatorios_premium && (
                  <>
                    <div className="border-t border-slate-200 my-2"></div>

                    <p className="px-2 py-1 text-xs font-bold uppercase text-slate-400">
                      Relatórios Premium
                    </p>

                    <Link href="/relatorios/premium" className="block p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                      Indicadores Premium
                    </Link>
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
              <span className="flex items-center gap-3">
                <Settings size={19} /> Configurações
              </span>
              <ChevronDown size={16} />
            </button>

            {configuracoes && (
              <div className="ml-8 mt-1 space-y-1 text-sm text-slate-500">
                {!isSuperAdmin && (
                  <>
                    <Link href="/empresas" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                      <Building2 size={15} /> Minha Empresa
                    </Link>

                    <Link href="/usuarios" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                      <Users size={15} /> Usuários
                    </Link>

                    <Link href="/configuracoes" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                      <Settings size={15} /> Configurações Gerais
                    </Link>
                  </>
                )}

                {isSuperAdmin && (
                  <>
                    <p className="px-2 py-1 text-xs font-bold uppercase text-slate-400">
                      Administração SaaS
                    </p>

                    <Link href="/admin/empresas" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                      <Building2 size={15} /> Empresas SaaS
                    </Link>

                    <Link href="/admin/assinaturas" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 hover:text-blue-700">
                      <CircleDollarSign size={15} /> Assinaturas SaaS
                    </Link>
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

          <p className="text-slate-900 font-bold truncate">
            {usuario?.nome || "-"}
          </p>

          <p className="text-blue-600 text-sm font-semibold truncate">
            {usuario?.perfil || "-"}
          </p>

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
}
