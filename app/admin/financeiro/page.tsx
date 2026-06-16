"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  status_assinatura: string | null;
  data_vencimento_assinatura: string | null;
};

type Cobranca = {
  id: string;
  empresa_id: string | null;
  descricao: string | null;
  valor: number | null;
  vencimento: string | null;
  data_pagamento: string | null;
  status: string | null;
  forma_pagamento: string | null;
  created_at: string | null;
  empresas: Empresa | Empresa[] | null;
};

type CobrancaTratada = Omit<Cobranca, "empresas"> & {
  empresas: Empresa | null;
};

function tratarEmpresaRelacionada(valor: Empresa | Empresa[] | null): Empresa | null {
  if (Array.isArray(valor)) return valor[0] || null;
  return valor || null;
}

export default function AdminFinanceiroPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cobrancas, setCobrancas] = useState<CobrancaTratada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

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

  function nomeEmpresa(empresa?: Empresa | null) {
    return empresa?.nome_fantasia || empresa?.razao_social || "Empresa não informada";
  }

  function statusCobranca(cobranca: CobrancaTratada) {
    const status = String(cobranca.status || "").toLowerCase();

    if (status === "pago" || status === "paga") return "Pago";
    if (status === "cancelado" || status === "cancelada") return "Cancelado";
    if (cobranca.vencimento && cobranca.vencimento < hojeISO()) return "Vencido";

    return "Aberta";
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: empresasData, error: empresasError } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,cnpj,ativo,plano,valor_mensal,status_assinatura,data_vencimento_assinatura")
      .order("nome_fantasia", { ascending: true });

    if (empresasError) {
      setCarregando(false);
      alert("Erro ao carregar empresas: " + empresasError.message);
      return;
    }

    setEmpresas((empresasData || []) as Empresa[]);

    const { data: cobrancasData, error: cobrancasError } = await supabase
      .from("cobrancas_saas")
      .select(`
        id,
        empresa_id,
        descricao,
        valor,
        vencimento,
        data_pagamento,
        status,
        forma_pagamento,
        created_at,
        empresas:empresa_id (
          id,
          nome_fantasia,
          razao_social,
          cnpj,
          ativo,
          plano,
          valor_mensal,
          status_assinatura,
          data_vencimento_assinatura
        )
      `)
      .order("vencimento", { ascending: false });

    setCarregando(false);

    if (cobrancasError) {
      alert("Erro ao carregar financeiro SaaS: " + cobrancasError.message);
      return;
    }

    const lista = ((cobrancasData || []) as Cobranca[]).map((item) => ({
      ...item,
      empresas: tratarEmpresaRelacionada(item.empresas),
    }));

    setCobrancas(lista);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const cobrancasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return cobrancas.filter((cobranca) => {
      const empresa = cobranca.empresas;
      const texto = `${nomeEmpresa(empresa)} ${empresa?.cnpj || ""} ${empresa?.plano || ""} ${cobranca.descricao || ""} ${cobranca.status || ""} ${cobranca.forma_pagamento || ""}`.toLowerCase();

      const passaBusca = !termo || texto.includes(termo);
      const passaStatus =
        filtroStatus === "Todos" || statusCobranca(cobranca) === filtroStatus;

      return passaBusca && passaStatus;
    });
  }, [cobrancas, busca, filtroStatus]);

  const empresasAtivas = empresas.filter(
    (empresa) => empresa.ativo !== false && empresa.status_assinatura !== "Bloqueado"
  );

  const mrr = empresasAtivas.reduce(
    (total, empresa) => total + Number(empresa.valor_mensal || 0),
    0
  );

  const arr = mrr * 12;

  const recebido = cobrancas
    .filter((cobranca) => statusCobranca(cobranca) === "Pago")
    .reduce((total, cobranca) => total + Number(cobranca.valor || 0), 0);

  const aberto = cobrancas
    .filter((cobranca) => statusCobranca(cobranca) === "Aberta")
    .reduce((total, cobranca) => total + Number(cobranca.valor || 0), 0);

  const vencido = cobrancas
    .filter((cobranca) => statusCobranca(cobranca) === "Vencido")
    .reduce((total, cobranca) => total + Number(cobranca.valor || 0), 0);

  const ticketMedio = empresasAtivas.length > 0 ? mrr / empresasAtivas.length : 0;

  const inadimplentes = cobrancas.filter(
    (cobranca) => statusCobranca(cobranca) === "Vencido"
  ).length;

  const taxaInadimplencia =
    cobrancas.length > 0 ? (inadimplentes / cobrancas.length) * 100 : 0;

  const porPlano = ["Básico", "Profissional", "Premium", "Enterprise"].map((plano) => {
    const lista = empresasAtivas.filter((empresa) => empresa.plano === plano);
    const total = lista.reduce(
      (soma, empresa) => soma + Number(empresa.valor_mensal || 0),
      0
    );

    return { plano, quantidade: lista.length, total };
  });

  const ultimosRecebimentos = cobrancas
    .filter((cobranca) => statusCobranca(cobranca) === "Pago")
    .slice(0, 8);

  function exportarCSV() {
    const cabecalho = [
      "Empresa",
      "CNPJ",
      "Plano",
      "Descricao",
      "Valor",
      "Vencimento",
      "Pagamento",
      "Status",
      "Forma de Pagamento",
    ];

    const linhas = cobrancasFiltradas.map((cobranca) => [
      nomeEmpresa(cobranca.empresas),
      cobranca.empresas?.cnpj || "",
      cobranca.empresas?.plano || "",
      cobranca.descricao || "",
      String(cobranca.valor || 0).replace(".", ","),
      formatarData(cobranca.vencimento),
      formatarData(cobranca.data_pagamento),
      statusCobranca(cobranca),
      cobranca.forma_pagamento || "",
    ]);

    const conteudo = [cabecalho, ...linhas]
      .map((linha) =>
        linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + conteudo], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financeiro-saas-${hojeISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>

            <h1 className="text-3xl lg:text-4xl font-black mt-2">
              Financeiro SaaS
            </h1>

            <p className="mt-2 text-blue-100 max-w-4xl">
              Acompanhe MRR, ARR, recebimentos, inadimplência, ticket médio e desempenho financeiro do THCloud.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={carregarDados}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>

            <button
              onClick={exportarCSV}
              className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Exportar CSV
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <Card titulo="MRR" valor={moeda(mrr)} detalhe="Receita mensal recorrente" cor="text-purple-700" icone={<CircleDollarSign size={22} />} />
        <Card titulo="ARR" valor={moeda(arr)} detalhe="Receita anual prevista" cor="text-blue-700" icone={<TrendingUp size={22} />} />
        <Card titulo="Recebido" valor={moeda(recebido)} detalhe="Pagamentos confirmados" cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Em Aberto" valor={moeda(aberto)} detalhe="Cobranças pendentes" cor="text-orange-700" icone={<CalendarClock size={22} />} />
        <Card titulo="Vencido" valor={moeda(vencido)} detalhe="Valor inadimplente" cor="text-red-700" icone={<AlertTriangle size={22} />} />
        <Card titulo="Ticket Médio" valor={moeda(ticketMedio)} detalhe="Por cliente ativo" cor="text-slate-800" icone={<Banknote size={22} />} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <ResumoCard titulo="Clientes ativos" valor={`${empresasAtivas.length}`} detalhe="Empresas liberadas e com assinatura ativa." cor="text-blue-700" icone={<Building2 size={36} />} />
        <ResumoCard titulo="Inadimplentes" valor={`${inadimplentes}`} detalhe={`Taxa aproximada: ${taxaInadimplencia.toFixed(1).replace(".", ",")}%`} cor="text-red-700" icone={<XCircle size={36} />} />
        <ResumoCard titulo="Cobranças" valor={`${cobrancas.length}`} detalhe="Total de registros financeiros SaaS." cor="text-purple-700" icone={<BarChart3 size={36} />} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="xl:col-span-2 bg-white rounded-[28px] border border-slate-200 p-5 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-1">
            Receita por Plano
          </h2>
          <p className="text-slate-500 mb-5">
            Distribuição da receita recorrente por plano contratado.
          </p>

          <div className="space-y-3">
            {porPlano.map((item) => {
              const percentual = mrr > 0 ? (item.total / mrr) * 100 : 0;

              return (
                <div key={item.plano} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <p className="font-black text-slate-900">{item.plano}</p>
                      <p className="text-xs text-slate-500">{item.quantidade} cliente(s)</p>
                    </div>

                    <p className="font-black text-blue-700">{moeda(item.total)}</p>
                  </div>

                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full"
                      style={{ width: `${Math.min(percentual, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 p-5 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-1">
            Últimos Recebimentos
          </h2>
          <p className="text-slate-500 mb-5">
            Pagamentos confirmados recentemente.
          </p>

          <div className="space-y-3">
            {ultimosRecebimentos.map((cobranca) => (
              <div key={cobranca.id} className="border border-slate-100 bg-slate-50 rounded-2xl p-4">
                <p className="font-black text-slate-900">
                  {nomeEmpresa(cobranca.empresas)}
                </p>
                <p className="text-sm text-green-700 font-black">
                  {moeda(Number(cobranca.valor || 0))}
                </p>
                <p className="text-xs text-slate-500">
                  Pago em {formatarData(cobranca.data_pagamento)}
                </p>
              </div>
            ))}

            {ultimosRecebimentos.length === 0 && (
              <div className="text-center text-slate-500 p-6">
                Nenhum pagamento confirmado.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar empresa, plano, status, forma de pagamento..."
              className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todos</option>
            <option>Aberta</option>
            <option>Vencido</option>
            <option>Pago</option>
            <option>Cancelado</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} />
          {cobrancasFiltradas.length} lançamento(s) encontrado(s)
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1050px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Plano</th>
                <th className="p-4 text-left">Descrição</th>
                <th className="p-4 text-left">Valor</th>
                <th className="p-4 text-left">Vencimento</th>
                <th className="p-4 text-left">Pagamento</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Carregando financeiro SaaS...
                  </td>
                </tr>
              )}

              {!carregando &&
                cobrancasFiltradas.map((cobranca) => (
                  <tr key={cobranca.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-950">
                        {nomeEmpresa(cobranca.empresas)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cobranca.empresas?.cnpj || "Sem documento"}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black">
                        {cobranca.empresas?.plano || "-"}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{cobranca.descricao || "-"}</p>
                      <p className="text-xs text-slate-500">{cobranca.forma_pagamento || "Sem forma de pagamento"}</p>
                    </td>

                    <td className="p-4 font-black text-purple-700">
                      {moeda(Number(cobranca.valor || 0))}
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      {formatarData(cobranca.vencimento)}
                    </td>

                    <td className="p-4 text-slate-700">
                      {formatarData(cobranca.data_pagamento)}
                    </td>

                    <td className="p-4">
                      <StatusBadge status={statusCobranca(cobranca)} />
                    </td>
                  </tr>
                ))}

              {!carregando && cobrancasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
    <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-500">{titulo}</p>

        <div className={`${cor} bg-slate-50 border border-slate-100 rounded-2xl p-2`}>
          {icone}
        </div>
      </div>

      <h2 className={`text-2xl font-black mt-3 ${cor}`}>{valor}</h2>

      <p className="text-xs text-slate-500 mt-1">{detalhe}</p>
    </div>
  );
}

function ResumoCard({
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
    <div className="bg-white rounded-[28px] border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>
          <h2 className={`text-3xl font-black mt-2 ${cor}`}>{valor}</h2>
        </div>

        <div className={cor}>{icone}</div>
      </div>

      <p className="text-sm text-slate-500 mt-3">{detalhe}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classe =
    status === "Pago"
      ? "bg-green-100 text-green-700"
      : status === "Aberta"
      ? "bg-blue-100 text-blue-700"
      : status === "Vencido"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>
      {status}
    </span>
  );
}
