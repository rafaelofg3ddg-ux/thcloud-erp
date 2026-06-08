"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  PackageCheck,
  ShieldAlert,
  TrendingUp,
  XCircle,
} from "lucide-react";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  status_assinatura: string | null;
  data_inicio_assinatura: string | null;
  data_vencimento_assinatura: string | null;
  created_at: string | null;

  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_delivery: boolean | null;
  modulo_crm: boolean | null;
  modulo_relatorios_premium: boolean | null;
  modulo_multiloja: boolean | null;
};

export default function AdminPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function adicionarDias(dias: number) {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  }

  function nomeEmpresa(empresa: Empresa) {
    return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
  }

  function estaVencida(empresa: Empresa) {
    if (empresa.status_assinatura === "Vencido") return true;
    if (!empresa.data_vencimento_assinatura) return false;

    return empresa.data_vencimento_assinatura < hojeISO();
  }

  function venceEmBreve(empresa: Empresa) {
    if (!empresa.data_vencimento_assinatura) return false;
    if (estaVencida(empresa)) return false;

    const hoje = hojeISO();
    const limite = adicionarDias(7);

    return (
      empresa.data_vencimento_assinatura >= hoje &&
      empresa.data_vencimento_assinatura <= limite
    );
  }

  function quantidadeModulos(empresa: Empresa) {
    return [
      empresa.modulo_fiscal,
      empresa.modulo_whatsapp,
      empresa.modulo_delivery,
      empresa.modulo_crm,
      empresa.modulo_relatorios_premium,
      empresa.modulo_multiloja,
    ].filter(Boolean).length;
  }

  async function carregarEmpresas() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("empresas")
      .select(
        "id,nome_fantasia,razao_social,cnpj,ativo,plano,valor_mensal,status_assinatura,data_inicio_assinatura,data_vencimento_assinatura,created_at,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja"
      )
      .order("created_at", { ascending: false });

    setCarregando(false);

    if (error) {
      alert("Erro ao carregar Dashboard Master: " + error.message);
      return;
    }

    setEmpresas(data || []);
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const totalEmpresas = empresas.length;

  const empresasAtivas = empresas.filter(
    (empresa) => empresa.ativo !== false && !estaVencida(empresa)
  ).length;

  const empresasTeste = empresas.filter(
    (empresa) => empresa.status_assinatura === "Teste"
  ).length;

  const empresasBloqueadas = empresas.filter(
    (empresa) =>
      empresa.ativo === false ||
      empresa.status_assinatura === "Bloqueado" ||
      empresa.status_assinatura === "Cancelado" ||
      empresa.status_assinatura === "Suspenso"
  ).length;

  const assinaturasVencidas = empresas.filter((empresa) =>
    estaVencida(empresa)
  ).length;

  const assinaturasVencendo = empresas.filter((empresa) =>
    venceEmBreve(empresa)
  ).length;

  const receitaMensal = empresas
    .filter((empresa) => empresa.ativo !== false && !estaVencida(empresa))
    .reduce((total, empresa) => total + Number(empresa.valor_mensal || 0), 0);

  const receitaAnual = receitaMensal * 12;

  const totalModulosVendidos = empresas.reduce(
    (total, empresa) => total + quantidadeModulos(empresa),
    0
  );

  const modulos = [
    {
      nome: "Fiscal",
      total: empresas.filter((empresa) => empresa.modulo_fiscal).length,
    },
    {
      nome: "WhatsApp",
      total: empresas.filter((empresa) => empresa.modulo_whatsapp).length,
    },
    {
      nome: "Delivery",
      total: empresas.filter((empresa) => empresa.modulo_delivery).length,
    },
    {
      nome: "CRM",
      total: empresas.filter((empresa) => empresa.modulo_crm).length,
    },
    {
      nome: "Relatórios Premium",
      total: empresas.filter((empresa) => empresa.modulo_relatorios_premium)
        .length,
    },
    {
      nome: "Multiloja",
      total: empresas.filter((empresa) => empresa.modulo_multiloja).length,
    },
  ];

  const empresasRecentes = empresas.slice(0, 8);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="bg-gradient-to-r from-slate-950 to-blue-800 rounded-3xl p-8 text-white mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-blue-100 font-bold">Painel Master THCloud</p>

            <h1 className="text-4xl font-black mt-2">
              Dashboard SaaS
            </h1>

            <p className="mt-2 text-blue-100 max-w-3xl">
              Visão geral das empresas, assinaturas, receita recorrente e módulos adicionais contratados.
            </p>
          </div>

          <button
            onClick={carregarEmpresas}
            className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50"
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card titulo="Total Empresas" valor={`${totalEmpresas}`} detalhe="Clientes cadastrados" cor="text-blue-700" icone={<Building2 size={24} />} />
        <Card titulo="Ativas" valor={`${empresasAtivas}`} detalhe="Clientes liberados" cor="text-green-700" icone={<CheckCircle2 size={24} />} />
        <Card titulo="Em Teste" valor={`${empresasTeste}`} detalhe="Período experimental" cor="text-cyan-700" icone={<Clock size={24} />} />
        <Card titulo="Bloqueadas" valor={`${empresasBloqueadas}`} detalhe="Acesso suspenso" cor="text-red-700" icone={<XCircle size={24} />} />
        <Card titulo="Vencendo" valor={`${assinaturasVencendo}`} detalhe="Próximos 7 dias" cor="text-orange-700" icone={<ShieldAlert size={24} />} />
        <Card titulo="Vencidas" valor={`${assinaturasVencidas}`} detalhe="Precisam atenção" cor="text-red-700" icone={<ShieldAlert size={24} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card titulo="Receita Mensal" valor={moeda(receitaMensal)} detalhe="MRR previsto" cor="text-purple-700" icone={<CircleDollarSign size={24} />} />
        <Card titulo="Receita Anual" valor={moeda(receitaAnual)} detalhe="Estimativa 12 meses" cor="text-blue-800" icone={<TrendingUp size={24} />} />
        <Card titulo="Módulos Vendidos" valor={`${totalModulosVendidos}`} detalhe="Adicionais contratados" cor="text-emerald-700" icone={<PackageCheck size={24} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Empresas Recentes
              </h2>

              <p className="text-slate-500">
                Últimas empresas cadastradas na plataforma.
              </p>
            </div>

            <Link href="/admin/empresas" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl font-bold">
              Ver empresas
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-3 text-left">Empresa</th>
                  <th className="p-3 text-left">Plano</th>
                  <th className="p-3 text-left">Mensalidade</th>
                  <th className="p-3 text-left">Vencimento</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Módulos</th>
                </tr>
              </thead>

              <tbody>
                {empresasRecentes.map((empresa) => (
                  <tr key={empresa.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{nomeEmpresa(empresa)}</p>
                      <p className="text-xs text-slate-500">{empresa.cnpj || "-"}</p>
                    </td>

                    <td className="p-3 text-slate-700">{empresa.plano || "-"}</td>

                    <td className="p-3 font-bold text-purple-700">
                      {moeda(Number(empresa.valor_mensal || 0))}
                    </td>

                    <td className="p-3 text-slate-700">
                      {formatarData(empresa.data_vencimento_assinatura)}
                    </td>

                    <td className="p-3">
                      {estaVencida(empresa) ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Vencida</span>
                      ) : empresa.ativo === false ? (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">Bloqueada</span>
                      ) : venceEmBreve(empresa) ? (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Vencendo</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Ativa</span>
                      )}
                    </td>

                    <td className="p-3 font-bold text-slate-700">
                      {quantidadeModulos(empresa)}
                    </td>
                  </tr>
                ))}

                {empresasRecentes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Nenhuma empresa cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Módulos Adicionais
          </h2>

          <p className="text-slate-500 mb-6">
            Quantidade de empresas com cada módulo contratado.
          </p>

          <div className="space-y-3">
            {modulos.map((modulo) => (
              <div key={modulo.nome} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="font-bold text-slate-800">{modulo.nome}</p>

                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-black">
                  {modulo.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/admin/empresas" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition">
          <h2 className="text-2xl font-black text-blue-700">
            Empresas SaaS
          </h2>

          <p className="text-slate-500 mt-2">
            Gerenciar clientes, planos, status de acesso e módulos adicionais.
          </p>
        </Link>

        <Link href="/admin/assinaturas" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition">
          <h2 className="text-2xl font-black text-green-700">
            Assinaturas SaaS
          </h2>

          <p className="text-slate-500 mt-2">
            Controle de mensalidades, vencimentos, renovações e bloqueios.
          </p>
        </Link>
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
  detalhe,
  cor,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  cor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{titulo}</p>

        <div className={`${cor} bg-slate-50 border border-slate-100 rounded-2xl p-2`}>
          {icone}
        </div>
      </div>

      <h2 className={`text-3xl font-black mt-4 ${cor}`}>{valor}</h2>

      <p className="text-xs text-slate-500 mt-2">{detalhe}</p>
    </div>
  );
}
