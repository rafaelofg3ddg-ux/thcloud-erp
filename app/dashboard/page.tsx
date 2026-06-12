"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Venda = {
  id: string;
  empresa_id: string;
  valor_total: number | null;
  forma_pagamento: string | null;
  status: string | null;
  created_at: string | null;
};

type PagamentoVenda = {
  id: string;
  venda_id: string;
  forma_pagamento: string | null;
  valor: number | null;
  created_at: string | null;
  empresa_id: string | null;
};

type ContaReceber = {
  id: string;
  valor: number | null;
  status: string | null;
  vencimento: string | null;
  empresa_id: string | null;
};

type ContaPagar = {
  id: string;
  valor: number | null;
  status: string | null;
  vencimento: string | null;
  empresa_id: string | null;
};

type Produto = {
  id: string;
  nome: string;
  qtd_atual: number | null;
  qtd_minima: number | null;
  empresa_id: string | null;
  ativo: boolean | null;
};

type Cliente = {
  id: string;
  empresa_id: string | null;
  ativo: boolean | null;
};

type DashboardDados = {
  faturamentoHoje: number;
  faturamentoMes: number;
  ticketMedio: number;
  saldoPrevisto: number;
  totalClientes: number;
  totalProdutos: number;
  estoqueBaixo: number;
  totalReceber: number;
  totalPagar: number;
  vendasHoje: number;
  vendasMes: number;
  atualizacao: string;
  vendasPorDia: { data: string; total: number }[];
  pagamentosPorForma: { forma: string; total: number }[];
  produtosBaixo: Produto[];
};

export default function DashboardPage() {
  const [dados, setDados] = useState<DashboardDados>({
    faturamentoHoje: 0,
    faturamentoMes: 0,
    ticketMedio: 0,
    saldoPrevisto: 0,
    totalClientes: 0,
    totalProdutos: 0,
    estoqueBaixo: 0,
    totalReceber: 0,
    totalPagar: 0,
    vendasHoje: 0,
    vendasMes: 0,
    atualizacao: "",
    vendasPorDia: [],
    pagamentosPorForma: [],
    produtosBaixo: [],
  });

  const [empresaNome, setEmpresaNome] = useState("THCloud ERP");
  const [carregando, setCarregando] = useState(false);

  function empresaAtualId() {
    try {
      const usuarioStorage = localStorage.getItem("th_usuario");

      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);

        if (usuario.empresa_id) return usuario.empresa_id;
        if (usuario.empresa?.id) return usuario.empresa.id;
        if (usuario.empresa_nome) setEmpresaNome(usuario.empresa_nome);
      }

      const empresaStorage = localStorage.getItem("th_empresa");

      if (empresaStorage) {
        const empresa = JSON.parse(empresaStorage);

        if (empresa.nome_fantasia || empresa.nome) {
          setEmpresaNome(empresa.nome_fantasia || empresa.nome);
        }

        if (empresa.id) return empresa.id;
        if (empresa.empresa_id) return empresa.empresa_id;
      }

      return localStorage.getItem("empresa_id") || localStorage.getItem("th_empresa_id");
    } catch {
      return null;
    }
  }

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function dataHojeInicio() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return hoje;
  }

  function dataMesInicio() {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }

  function somenteData(data: Date) {
    return data.toISOString().split("T")[0];
  }

  function nomeDataCurta(dataIso: string) {
    const data = new Date(dataIso + "T00:00:00");
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  function ultimos30DiasBase() {
    const dias: { data: string; total: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      dias.push({
        data: somenteData(data),
        total: 0,
      });
    }

    return dias;
  }

  async function carregarDashboard() {
    const empresaId = empresaAtualId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    setCarregando(true);

    const inicioHoje = dataHojeInicio();
    const inicioMes = dataMesInicio();
    const hojeIso = inicioHoje.toISOString();
    const mesIso = inicioMes.toISOString();

    const inicio30 = new Date();
    inicio30.setDate(inicio30.getDate() - 29);
    inicio30.setHours(0, 0, 0, 0);

    const vendasReq = await supabase
      .from("vendas")
      .select("id,empresa_id,valor_total,forma_pagamento,status,created_at")
      .eq("empresa_id", empresaId)
      .gte("created_at", inicio30.toISOString())
      .order("created_at", { ascending: true });

    if (vendasReq.error) {
      alert("Erro ao carregar vendas: " + vendasReq.error.message);
      setCarregando(false);
      return;
    }

    const vendas = (vendasReq.data || []) as Venda[];
    const vendasFinalizadas = vendas.filter((venda) => venda.status !== "cancelada" && venda.status !== "devolvida");

    const vendasHoje = vendasFinalizadas.filter((venda) => {
      if (!venda.created_at) return false;
      return new Date(venda.created_at) >= inicioHoje;
    });

    const vendasMes = vendasFinalizadas.filter((venda) => {
      if (!venda.created_at) return false;
      return new Date(venda.created_at) >= inicioMes;
    });

    const faturamentoHoje = vendasHoje.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0
    );

    const faturamentoMes = vendasMes.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0
    );

    const ticketMedio =
      vendasMes.length > 0 ? faturamentoMes / vendasMes.length : 0;

    const vendasPorDia = ultimos30DiasBase();

    vendasFinalizadas.forEach((venda) => {
      if (!venda.created_at) return;

      const dia = somenteData(new Date(venda.created_at));
      const encontrado = vendasPorDia.find((item) => item.data === dia);

      if (encontrado) {
        encontrado.total += Number(venda.valor_total || 0);
      }
    });

    const pagamentosReq = await supabase
      .from("pagamentos_venda")
      .select("id,venda_id,forma_pagamento,valor,created_at,empresa_id")
      .eq("empresa_id", empresaId)
      .gte("created_at", mesIso);

    const pagamentos = pagamentosReq.error
      ? []
      : ((pagamentosReq.data || []) as PagamentoVenda[]);

    const mapaPagamentos: Record<string, number> = {};

    pagamentos.forEach((pagamento) => {
      const forma = pagamento.forma_pagamento || "não informado";
      mapaPagamentos[forma] =
        (mapaPagamentos[forma] || 0) + Number(pagamento.valor || 0);
    });

    const pagamentosPorForma = Object.entries(mapaPagamentos).map(
      ([forma, total]) => ({
        forma,
        total,
      })
    );

    const clientesReq = await supabase
      .from("clientes")
      .select("id,empresa_id,ativo")
      .eq("empresa_id", empresaId);

    const clientes = clientesReq.error ? [] : ((clientesReq.data || []) as Cliente[]);

    const produtosReq = await supabase
      .from("produtos")
      .select("id,nome,qtd_atual,qtd_minima,empresa_id,ativo")
      .eq("empresa_id", empresaId);

    const produtos = produtosReq.error ? [] : ((produtosReq.data || []) as Produto[]);

    const produtosAtivos = produtos.filter((produto) => produto.ativo !== false);

    const produtosBaixo = produtosAtivos.filter((produto) => {
      const atual = Number(produto.qtd_atual || 0);
      const minima = Number(produto.qtd_minima || 0);
      return minima > 0 && atual <= minima;
    });

    const receberReq = await supabase
      .from("contas_receber")
      .select("id,valor,status,vencimento,empresa_id")
      .eq("empresa_id", empresaId);

    const contasReceber = receberReq.error
      ? []
      : ((receberReq.data || []) as ContaReceber[]);

    let contasPagar: ContaPagar[] = [];

    try {
      const pagarReq = await supabase
        .from("contas_pagar")
        .select("id,valor,status,vencimento,empresa_id")
        .eq("empresa_id", empresaId);

      contasPagar = pagarReq.error ? [] : ((pagarReq.data || []) as ContaPagar[]);
    } catch {
      contasPagar = [];
    }

    const totalReceber = contasReceber
      .filter((conta) => conta.status !== "pago")
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const totalPagar = contasPagar
      .filter((conta) => conta.status !== "pago")
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    setDados({
      faturamentoHoje,
      faturamentoMes,
      ticketMedio,
      saldoPrevisto: totalReceber - totalPagar,
      totalClientes: clientes.length,
      totalProdutos: produtosAtivos.length,
      estoqueBaixo: produtosBaixo.length,
      totalReceber,
      totalPagar,
      vendasHoje: vendasHoje.length,
      vendasMes: vendasMes.length,
      atualizacao: new Date().toLocaleString("pt-BR"),
      vendasPorDia,
      pagamentosPorForma,
      produtosBaixo: produtosBaixo.slice(0, 8),
    });

    setCarregando(false);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const maxGrafico = useMemo(() => {
    const maximo = Math.max(...dados.vendasPorDia.map((item) => item.total), 0);
    return maximo <= 0 ? 100 : maximo;
  }, [dados.vendasPorDia]);

  const totalPagamentos = dados.pagamentosPorForma.reduce(
    (total, item) => total + item.total,
    0
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-3xl p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="font-bold">{empresaNome || "THCloud ERP"}</p>

            <h1 className="text-4xl font-black mt-3">
              Dashboard Executivo
            </h1>

            <p className="text-blue-100 mt-3 max-w-3xl">
              Visão gerencial isolada por empresa com faturamento, vendas,
              estoque, contas, clientes e indicadores estratégicos.
            </p>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-sm text-blue-100">Atualizado em</p>
            <p className="text-2xl font-black">
              {dados.atualizacao || "-"}
            </p>

            <button
              onClick={carregarDashboard}
              disabled={carregando}
              className="mt-4 bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-2xl font-black inline-flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={18} className={carregando ? "animate-spin" : ""} />
              Atualizar Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <CardIndicador
          titulo="Faturamento Hoje"
          valor={formatarMoeda(dados.faturamentoHoje)}
          subtitulo={`${dados.vendasHoje} venda(s) finalizadas hoje`}
          cor="text-green-700"
          icone={<CircleIcon><Wallet size={20} /></CircleIcon>}
        />

        <CardIndicador
          titulo="Faturamento do Mês"
          valor={formatarMoeda(dados.faturamentoMes)}
          subtitulo={`${dados.vendasMes} venda(s) no mês`}
          cor="text-blue-700"
          icone={<CircleIcon><TrendingUp size={20} /></CircleIcon>}
        />

        <CardIndicador
          titulo="Ticket Médio"
          valor={formatarMoeda(dados.ticketMedio)}
          subtitulo="Média por venda"
          cor="text-purple-700"
          icone={<CircleIcon><ShoppingCart size={20} /></CircleIcon>}
        />

        <CardIndicador
          titulo="Saldo Previsto"
          valor={formatarMoeda(dados.saldoPrevisto)}
          subtitulo="Receber - pagar"
          cor="text-green-700"
          icone={<CircleIcon><CreditCard size={20} /></CircleIcon>}
        />

        <CardIndicador
          titulo="Clientes"
          valor={`${dados.totalClientes}`}
          subtitulo="Clientes cadastrados"
          cor="text-indigo-700"
          icone={<CircleIcon><Users size={20} /></CircleIcon>}
        />

        <CardIndicador
          titulo="Produtos"
          valor={`${dados.totalProdutos}`}
          subtitulo="Produtos cadastrados"
          cor="text-orange-700"
          icone={<CircleIcon><Package size={20} /></CircleIcon>}
        />

        <CardIndicador
          titulo="Estoque Baixo"
          valor={`${dados.estoqueBaixo}`}
          subtitulo="Produtos em alerta"
          cor="text-red-700"
          icone={<CircleIcon><AlertTriangle size={20} /></CircleIcon>}
        />

        <CardIndicador
          titulo="A Receber / A Pagar"
          valor={formatarMoeda(dados.totalReceber)}
          subtitulo={`A pagar: ${formatarMoeda(dados.totalPagar)}`}
          cor="text-cyan-700"
          icone={<CircleIcon><CreditCard size={20} /></CircleIcon>}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Evolução das Vendas
              </h2>
              <p className="text-slate-500">
                Faturamento diário dos últimos 30 dias.
              </p>
            </div>

            <BarChart3 className="text-blue-700" />
          </div>

          <div className="h-72 flex items-end gap-1 border-l border-b border-slate-300 p-3">
            {dados.vendasPorDia.map((dia) => {
              const altura = Math.max((dia.total / maxGrafico) * 100, dia.total > 0 ? 4 : 0);

              return (
                <div key={dia.data} className="flex-1 h-full flex flex-col justify-end items-center group">
                  <div className="relative w-full flex justify-center">
                    <div
                      className="w-full max-w-5 bg-blue-600 rounded-t hover:bg-blue-800 transition"
                      style={{ height: `${altura}%` }}
                    />

                    <div className="hidden group-hover:block absolute bottom-full mb-2 bg-slate-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                      {nomeDataCurta(dia.data)}: {formatarMoeda(dia.total)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-slate-500 mt-3">
            <span>{dados.vendasPorDia[0] ? nomeDataCurta(dados.vendasPorDia[0].data) : "-"}</span>
            <span>Faturamento</span>
            <span>{dados.vendasPorDia[dados.vendasPorDia.length - 1] ? nomeDataCurta(dados.vendasPorDia[dados.vendasPorDia.length - 1].data) : "-"}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900">
            Formas de Pagamento
          </h2>

          <p className="text-slate-500 mb-6">
            Participação por forma no mês.
          </p>

          {dados.pagamentosPorForma.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-500 text-center">
              Nenhum pagamento encontrado no mês.
            </div>
          ) : (
            <div className="space-y-4">
              {dados.pagamentosPorForma.map((item) => {
                const percentual =
                  totalPagamentos > 0 ? (item.total / totalPagamentos) * 100 : 0;

                return (
                  <div key={item.forma}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700 capitalize">
                        {item.forma}
                      </span>
                      <span className="font-black text-slate-900">
                        {formatarMoeda(item.total)}
                      </span>
                    </div>

                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700 rounded-full"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      {percentual.toFixed(1).replace(".", ",")}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-4">
            Produtos com Estoque Baixo
          </h2>

          {dados.produtosBaixo.length === 0 ? (
            <p className="text-slate-500">
              Nenhum produto com estoque baixo no momento.
            </p>
          ) : (
            <div className="space-y-3">
              {dados.produtosBaixo.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between border border-red-100 bg-red-50 rounded-2xl p-4"
                >
                  <div>
                    <p className="font-black text-slate-900">{produto.nome}</p>
                    <p className="text-sm text-slate-500">
                      Mínimo: {produto.qtd_minima || 0}
                    </p>
                  </div>

                  <p className="text-red-700 font-black text-xl">
                    {produto.qtd_atual || 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-4">
            Resumo Financeiro
          </h2>

          <div className="space-y-4">
            <LinhaResumo
              label="Total a Receber"
              valor={formatarMoeda(dados.totalReceber)}
              classe="text-green-700"
            />

            <LinhaResumo
              label="Total a Pagar"
              valor={formatarMoeda(dados.totalPagar)}
              classe="text-red-700"
            />

            <LinhaResumo
              label="Saldo Previsto"
              valor={formatarMoeda(dados.saldoPrevisto)}
              classe={dados.saldoPrevisto >= 0 ? "text-blue-700" : "text-red-700"}
            />

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800">
              <p className="font-bold">
                Este dashboard já busca vendas, pagamentos, clientes, produtos,
                contas a receber e contas a pagar separados por empresa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardIndicador({
  titulo,
  valor,
  subtitulo,
  cor,
  icone,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  cor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-bold">{titulo}</p>
          <p className={`text-3xl font-black mt-3 ${cor}`}>{valor}</p>
          <p className="text-sm text-slate-500 mt-2">{subtitulo}</p>
        </div>

        {icone}
      </div>
    </div>
  );
}

function CircleIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-700">
      {children}
    </div>
  );
}

function LinhaResumo({
  label,
  valor,
  classe,
}: {
  label: string;
  valor: string;
  classe: string;
}) {
  return (
    <div className="flex items-center justify-between border border-slate-200 rounded-2xl p-5">
      <span className="text-slate-600 font-bold">{label}</span>
      <span className={`text-2xl font-black ${classe}`}>{valor}</span>
    </div>
  );
}
