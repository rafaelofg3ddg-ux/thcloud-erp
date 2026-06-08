"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";
import {
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  CreditCard,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Venda = {
  id: string;
  cliente_id: string | null;
  valor_total: number | null;
  desconto: number | null;
  forma_pagamento: string | null;
  status: string | null;
  created_at: string | null;
};

type Cliente = {
  id: string;
  nome: string;
};

type Produto = {
  id: string;
  nome: string;
  codigo: string | null;
  qtd_atual: number | null;
  qtd_minima: number | null;
  ativo: boolean | null;
};

type ContaReceber = {
  id: string;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
};

type ContaPagar = {
  id: string;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
};

type ItemVenda = {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number | null;
  subtotal: number | null;
};

type PagamentoVenda = {
  id: string;
  venda_id: string | null;
  forma_pagamento: string | null;
  valor: number | null;
};

type DashboardVenda = {
  data_venda: string;
  total_vendas: number;
  faturamento: number;
};

type AlertaEstoque = {
  id: string;
  codigo: string | null;
  nome: string;
  qtd_atual: number | null;
  qtd_minima: number | null;
  falta: number | null;
  fornecedor: string | null;
  nivel_alerta: string | null;
};

type TopProduto = {
  nome: string;
  quantidade: number;
  valor: number;
};

type TopCliente = {
  nome: string;
  compras: number;
  valor: number;
};

type FormaPagamentoGrafico = {
  forma: string;
  valor: number;
};

export default function DashboardExecutivoPage() {
  const [carregando, setCarregando] = useState(true);

  const [vendasDiarias, setVendasDiarias] = useState<DashboardVenda[]>([]);
  const [alertasEstoque, setAlertasEstoque] = useState<AlertaEstoque[]>([]);
  const [ultimasVendas, setUltimasVendas] = useState<Venda[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoGrafico[]>([]);

  const [faturamentoHoje, setFaturamentoHoje] = useState(0);
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [totalVendasMes, setTotalVendasMes] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);

  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState(0);

  const [contasReceberAberto, setContasReceberAberto] = useState(0);
  const [contasPagarAberto, setContasPagarAberto] = useState(0);
  const [saldoPrevisto, setSaldoPrevisto] = useState(0);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR");
  }

  function formatarDataBR(data: string | null) {
    if (!data) return "-";

    if (data.includes("T")) {
      return new Date(data).toLocaleDateString("pt-BR");
    }

    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function formatarDataHoraBR(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function inicioMesISO() {
    const hoje = new Date();

    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  }

  function inicio30DiasISO() {
    const data = new Date();
    data.setDate(data.getDate() - 30);

    return data.toISOString().split("T")[0];
  }

  function dataFimISO() {
    return new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
  }

  function dataInicioMesISOCompleta() {
    return new Date(inicioMesISO() + "T00:00:00").toISOString();
  }

  function dataInicio30DiasISOCompleta() {
    return new Date(inicio30DiasISO() + "T00:00:00").toISOString();
  }

  function dataInicioHojeISOCompleta() {
    return new Date(hojeISO() + "T00:00:00").toISOString();
  }

  function estaAberto(status: string | null) {
    const texto = String(status || "").toLowerCase();

    return texto !== "pago" && texto !== "recebido" && texto !== "cancelado";
  }

  function nomeCliente(clienteId: string | null, clientes: Cliente[]) {
    if (!clienteId) return "Consumidor Final";

    const cliente = clientes.find((item) => item.id === clienteId);

    return cliente?.nome || "Cliente não encontrado";
  }

  function gerarVendasDiarias(vendas: Venda[]) {
    const mapa = new Map<string, DashboardVenda>();

    vendas.forEach((venda) => {
      if (!venda.created_at) return;

      const data = new Date(venda.created_at).toISOString().split("T")[0];

      const atual = mapa.get(data) || {
        data_venda: data,
        total_vendas: 0,
        faturamento: 0,
      };

      atual.total_vendas += 1;
      atual.faturamento += Number(venda.valor_total || 0);

      mapa.set(data, atual);
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.data_venda.localeCompare(b.data_venda)
    );
  }

  async function carregarDashboard() {
    setCarregando(true);

    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      setCarregando(false);
      return;
    }

    const inicioMes = dataInicioMesISOCompleta();
    const inicioHoje = dataInicioHojeISOCompleta();
    const inicio30Dias = dataInicio30DiasISOCompleta();
    const fimHoje = dataFimISO();

    const [
      vendasMesReq,
      vendas30DiasReq,
      clientesReq,
      produtosReq,
      contasReceberReq,
      contasPagarReq,
    ] = await Promise.all([
      supabase
        .from("vendas")
        .select("id,cliente_id,valor_total,desconto,forma_pagamento,status,created_at")
        .eq("empresa_id", empresaId)
        .eq("status", "finalizada")
        .gte("created_at", inicioMes)
        .lte("created_at", fimHoje)
        .order("created_at", { ascending: false }),

      supabase
        .from("vendas")
        .select("id,cliente_id,valor_total,desconto,forma_pagamento,status,created_at")
        .eq("empresa_id", empresaId)
        .eq("status", "finalizada")
        .gte("created_at", inicio30Dias)
        .lte("created_at", fimHoje)
        .order("created_at", { ascending: true }),

      supabase
        .from("clientes")
        .select("id,nome")
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true }),

      supabase
        .from("produtos")
        .select("id,nome,codigo,qtd_atual,qtd_minima,ativo")
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true }),

      supabase
        .from("contas_receber")
        .select("id,valor,vencimento,status")
        .eq("empresa_id", empresaId),

      supabase
        .from("contas_pagar")
        .select("id,valor,vencimento,status")
        .eq("empresa_id", empresaId),
    ]);

    if (vendasMesReq.error) {
      alert("Erro ao carregar vendas: " + vendasMesReq.error.message);
      setCarregando(false);
      return;
    }

    if (vendas30DiasReq.error) {
      alert("Erro ao carregar vendas dos últimos 30 dias: " + vendas30DiasReq.error.message);
      setCarregando(false);
      return;
    }

    if (clientesReq.error) {
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      setCarregando(false);
      return;
    }

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      setCarregando(false);
      return;
    }

    if (contasReceberReq.error) {
      alert("Erro ao carregar contas a receber: " + contasReceberReq.error.message);
      setCarregando(false);
      return;
    }

    if (contasPagarReq.error) {
      alert("Erro ao carregar contas a pagar: " + contasPagarReq.error.message);
      setCarregando(false);
      return;
    }

    const vendasMes: Venda[] = vendasMesReq.data || [];
    const vendas30Dias: Venda[] = vendas30DiasReq.data || [];
    const clientes: Cliente[] = clientesReq.data || [];
    const produtos: Produto[] = produtosReq.data || [];
    const receber: ContaReceber[] = contasReceberReq.data || [];
    const pagar: ContaPagar[] = contasPagarReq.data || [];

    const vendaIds = vendasMes.map((venda) => venda.id);

    let itensVenda: ItemVenda[] = [];
    let pagamentos: PagamentoVenda[] = [];

    if (vendaIds.length > 0) {
      const [itensReq, pagamentosReq] = await Promise.all([
        supabase
          .from("itens_venda")
          .select("id,venda_id,produto_id,quantidade,subtotal")
          .eq("empresa_id", empresaId)
          .in("venda_id", vendaIds),

        supabase
          .from("pagamentos_venda")
          .select("id,venda_id,forma_pagamento,valor")
          .eq("empresa_id", empresaId)
          .in("venda_id", vendaIds),
      ]);

      if (itensReq.error) {
        alert("Erro ao carregar itens de venda: " + itensReq.error.message);
        setCarregando(false);
        return;
      }

      if (pagamentosReq.error) {
        alert("Erro ao carregar pagamentos: " + pagamentosReq.error.message);
        setCarregando(false);
        return;
      }

      itensVenda = itensReq.data || [];
      pagamentos = pagamentosReq.data || [];
    }

    const faturamentoDoMes = vendasMes.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0
    );

    const faturamentoDoDia = vendasMes
      .filter((venda) => {
        if (!venda.created_at) return false;
        return new Date(venda.created_at).toISOString() >= inicioHoje;
      })
      .reduce((total, venda) => total + Number(venda.valor_total || 0), 0);

    const receberAberto = receber
      .filter((conta) => estaAberto(conta.status))
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const pagarAberto = pagar
      .filter((conta) => estaAberto(conta.status))
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const alertas: AlertaEstoque[] = produtos
      .filter((produto) => {
        const qtdAtual = Number(produto.qtd_atual || 0);
        const qtdMinima = Number(produto.qtd_minima || 0);

        return produto.ativo !== false && qtdMinima > 0 && qtdAtual <= qtdMinima;
      })
      .map((produto) => {
        const qtdAtual = Number(produto.qtd_atual || 0);
        const qtdMinima = Number(produto.qtd_minima || 0);
        const falta = Math.max(qtdMinima - qtdAtual, 0);

        return {
          id: produto.id,
          codigo: produto.codigo,
          nome: produto.nome,
          qtd_atual: qtdAtual,
          qtd_minima: qtdMinima,
          falta,
          fornecedor: "-",
          nivel_alerta: qtdAtual <= 0 ? "critico" : "baixo",
        };
      })
      .sort((a, b) => Number(b.falta || 0) - Number(a.falta || 0))
      .slice(0, 10);

    const mapaProdutos = new Map<
      string,
      {
        nome: string;
        quantidade: number;
        valor: number;
      }
    >();

    itensVenda.forEach((item) => {
      const produto = produtos.find((prod) => prod.id === item.produto_id);

      const atual = mapaProdutos.get(item.produto_id) || {
        nome: produto?.nome || "Produto não encontrado",
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += Number(item.quantidade || 0);
      atual.valor += Number(item.subtotal || 0);

      mapaProdutos.set(item.produto_id, atual);
    });

    const rankingProdutos = Array.from(mapaProdutos.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const mapaClientes = new Map<
      string,
      {
        nome: string;
        compras: number;
        valor: number;
      }
    >();

    vendasMes.forEach((venda) => {
      const id = venda.cliente_id || "consumidor-final";

      const atual = mapaClientes.get(id) || {
        nome: nomeCliente(venda.cliente_id, clientes),
        compras: 0,
        valor: 0,
      };

      atual.compras += 1;
      atual.valor += Number(venda.valor_total || 0);

      mapaClientes.set(id, atual);
    });

    const rankingClientes = Array.from(mapaClientes.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const mapaPagamentos = new Map<string, number>();

    pagamentos.forEach((pagamento) => {
      const forma = pagamento.forma_pagamento || "Não informado";
      const atual = mapaPagamentos.get(forma) || 0;

      mapaPagamentos.set(forma, atual + Number(pagamento.valor || 0));
    });

    const formas = Array.from(mapaPagamentos.entries())
      .map(([forma, valor]) => ({
        forma,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor);

    setVendasDiarias(gerarVendasDiarias(vendas30Dias));
    setAlertasEstoque(alertas);
    setUltimasVendas(vendasMes.slice(0, 10));
    setTopProdutos(rankingProdutos);
    setTopClientes(rankingClientes);
    setFormasPagamento(formas);

    setFaturamentoHoje(faturamentoDoDia);
    setFaturamentoMes(faturamentoDoMes);
    setTotalVendasMes(vendasMes.length);
    setTicketMedio(vendasMes.length > 0 ? faturamentoDoMes / vendasMes.length : 0);

    setTotalClientes(clientes.length);
    setTotalProdutos(produtos.length);
    setProdutosEstoqueBaixo(alertas.length);

    setContasReceberAberto(receberAberto);
    setContasPagarAberto(pagarAberto);
    setSaldoPrevisto(receberAberto - pagarAberto);

    setCarregando(false);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const vendasGrafico = useMemo(() => {
    return vendasDiarias.map((item) => ({
      data: formatarDataBR(item.data_venda),
      vendas: Number(item.total_vendas || 0),
      faturamento: Number(item.faturamento || 0),
    }));
  }, [vendasDiarias]);

  const coresGrafico = [
    "#2563eb",
    "#16a34a",
    "#f97316",
    "#7c3aed",
    "#dc2626",
    "#0891b2",
    "#ca8a04",
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">THCloud ERP</p>

            <h1 className="text-4xl font-black mt-2">
              Dashboard Executivo
            </h1>

            <p className="text-blue-100 mt-2 max-w-3xl">
              Visão gerencial isolada por empresa com faturamento, vendas,
              estoque, contas, clientes e indicadores estratégicos.
            </p>
          </div>

          <div className="text-left xl:text-right">
            <p className="text-blue-100 text-sm">Atualizado em</p>
            <p className="text-2xl font-black">
              {new Date().toLocaleString("pt-BR")}
            </p>

            <button
              onClick={carregarDashboard}
              className="mt-4 bg-white text-blue-800 px-5 py-3 rounded-2xl font-bold hover:bg-blue-50"
            >
              Atualizar Dashboard
            </button>
          </div>
        </div>
      </div>

      {carregando && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 shadow-sm">
          <p className="text-slate-600 font-semibold">
            Carregando indicadores da empresa...
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <Card
          titulo="Faturamento Hoje"
          valor={moeda(faturamentoHoje)}
          detalhe="Vendas finalizadas hoje"
          cor="text-green-700"
          icone={<CircleDollarSign size={24} />}
        />

        <Card
          titulo="Faturamento do Mês"
          valor={moeda(faturamentoMes)}
          detalhe={`${totalVendasMes} venda(s) no mês`}
          cor="text-blue-700"
          icone={<TrendingUp size={24} />}
        />

        <Card
          titulo="Ticket Médio"
          valor={moeda(ticketMedio)}
          detalhe="Média por venda"
          cor="text-purple-700"
          icone={<ShoppingCart size={24} />}
        />

        <Card
          titulo="Saldo Previsto"
          valor={moeda(saldoPrevisto)}
          detalhe="Receber - pagar"
          cor={saldoPrevisto >= 0 ? "text-green-700" : "text-red-700"}
          icone={<Wallet size={24} />}
        />

        <Card
          titulo="Clientes"
          valor={numero(totalClientes)}
          detalhe="Clientes cadastrados"
          cor="text-indigo-700"
          icone={<Users size={24} />}
        />

        <Card
          titulo="Produtos"
          valor={numero(totalProdutos)}
          detalhe="Produtos cadastrados"
          cor="text-orange-700"
          icone={<Package size={24} />}
        />

        <Card
          titulo="Estoque Baixo"
          valor={numero(produtosEstoqueBaixo)}
          detalhe="Produtos em alerta"
          cor="text-red-700"
          icone={<AlertTriangle size={24} />}
        />

        <Card
          titulo="A Receber / A Pagar"
          valor={moeda(contasReceberAberto)}
          detalhe={`A pagar: ${moeda(contasPagarAberto)}`}
          cor="text-cyan-700"
          icone={<CreditCard size={24} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Evolução das Vendas
              </h2>

              <p className="text-slate-500">
                Faturamento diário dos últimos 30 dias.
              </p>
            </div>

            <BarChart3 className="text-blue-700" size={28} />
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={(value) => moeda(Number(value || 0))}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="faturamento"
                  name="Faturamento"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900">
            Formas de Pagamento
          </h2>

          <p className="text-slate-500 mb-4">
            Participação por forma no mês.
          </p>

          <div className="h-80">
            {formasPagamento.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formasPagamento}
                    dataKey="valor"
                    nameKey="forma"
                    outerRadius={105}
                    label
                  >
                    {formasPagamento.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={coresGrafico[index % coresGrafico.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => moeda(Number(value || 0))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Nenhum pagamento encontrado.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            Top 10 Produtos
          </h2>

          <div className="h-80">
            {topProdutos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProdutos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" fontSize={10} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(value) => moeda(Number(value || 0))} />
                  <Bar dataKey="valor" name="Faturamento" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Nenhum produto vendido no mês.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            Top Clientes
          </h2>

          <div className="space-y-3">
            {topClientes.map((cliente, index) => (
              <div
                key={`${cliente.nome}-${index}`}
                className="flex items-center justify-between border border-slate-100 rounded-2xl p-4"
              >
                <div>
                  <p className="font-black text-slate-900">
                    {index + 1}º {cliente.nome}
                  </p>

                  <p className="text-sm text-slate-500">
                    {numero(cliente.compras)} compra(s)
                  </p>
                </div>

                <p className="font-black text-blue-700">
                  {moeda(cliente.valor)}
                </p>
              </div>
            ))}

            {topClientes.length === 0 && (
              <p className="text-slate-500">
                Nenhum cliente com compra no mês.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            Últimas Vendas
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="p-3">Data</th>
                  <th className="p-3">Pagamento</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>

              <tbody>
                {ultimasVendas.map((venda) => (
                  <tr key={venda.id} className="border-b last:border-b-0">
                    <td className="p-3 text-slate-700">
                      {formatarDataHoraBR(venda.created_at)}
                    </td>

                    <td className="p-3 text-slate-700">
                      {venda.forma_pagamento || "-"}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                        {venda.status || "-"}
                      </span>
                    </td>

                    <td className="p-3 text-right font-black text-green-700">
                      {moeda(Number(venda.valor_total || 0))}
                    </td>
                  </tr>
                ))}

                {ultimasVendas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      Nenhuma venda encontrada no mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            Alertas de Estoque
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="p-3">Produto</th>
                  <th className="p-3 text-right">Atual</th>
                  <th className="p-3 text-right">Mínimo</th>
                  <th className="p-3 text-right">Falta</th>
                  <th className="p-3">Nível</th>
                </tr>
              </thead>

              <tbody>
                {alertasEstoque.map((produto) => (
                  <tr key={produto.id} className="border-b last:border-b-0">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">
                        {produto.nome}
                      </p>

                      <p className="text-xs text-slate-500">
                        Código: {produto.codigo || "-"} • Forn.:{" "}
                        {produto.fornecedor || "-"}
                      </p>
                    </td>

                    <td className="p-3 text-right font-black text-red-700">
                      {numero(Number(produto.qtd_atual || 0))}
                    </td>

                    <td className="p-3 text-right text-slate-700">
                      {numero(Number(produto.qtd_minima || 0))}
                    </td>

                    <td className="p-3 text-right font-bold text-orange-700">
                      {numero(Number(produto.falta || 0))}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full font-bold text-xs ${
                          produto.nivel_alerta === "critico"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {produto.nivel_alerta || "-"}
                      </span>
                    </td>
                  </tr>
                ))}

                {alertasEstoque.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Nenhum alerta de estoque.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>

          <h2 className={`text-3xl font-black mt-3 ${cor}`}>{valor}</h2>

          <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
        </div>

        <div className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}>
          {icone}
        </div>
      </div>
    </div>
  );
}
