"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  ArrowUpRight,
  Banknote,
  Boxes,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  UserPlus,
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

type UsuarioLocal = {
  id?: string;
  nome?: string;
  perfil?: string;
  empresa_id?: string;
  empresa_nome?: string;
  plano?: string;
  plano_nome?: string;
  nome_plano?: string;
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
  contasReceberVencidas: number;
  contasPagarVencidas: number;
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
    contasReceberVencidas: 0,
    contasPagarVencidas: 0,
  });

  const [empresaNome, setEmpresaNome] = useState("THCloud ERP");
  const [usuarioNome, setUsuarioNome] = useState("Rafael");
  const [usuarioPerfil, setUsuarioPerfil] = useState("Administrador");
  const [planoNome, setPlanoNome] = useState("Básico");
  const [carregando, setCarregando] = useState(false);

  function carregarDadosLocais() {
    try {
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage) as UsuarioLocal;

        if (usuario.nome) setUsuarioNome(usuario.nome);
        if (usuario.perfil) setUsuarioPerfil(usuario.perfil);

        const plano =
          usuario.plano_nome ||
          usuario.nome_plano ||
          usuario.plano ||
          "Básico";

        setPlanoNome(plano);

        if (usuario.empresa_nome) setEmpresaNome(usuario.empresa_nome);
      }

      const empresaStorage =
        sessionStorage.getItem("th_empresa") ||
        localStorage.getItem("th_empresa");

      if (empresaStorage) {
        const empresa = JSON.parse(empresaStorage);

        if (empresa.nome_fantasia || empresa.razao_social || empresa.nome) {
          setEmpresaNome(
            empresa.nome_fantasia || empresa.razao_social || empresa.nome
          );
        }
      }
    } catch {}
  }

  function empresaAtualId() {
    try {
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);

        if (usuario.empresa_id) return usuario.empresa_id;
        if (usuario.empresa?.id) return usuario.empresa.id;
        if (usuario.empresa_nome) setEmpresaNome(usuario.empresa_nome);
      }

      const empresaStorage =
        sessionStorage.getItem("th_empresa") ||
        localStorage.getItem("th_empresa");

      if (empresaStorage) {
        const empresa = JSON.parse(empresaStorage);

        if (empresa.nome_fantasia || empresa.nome) {
          setEmpresaNome(empresa.nome_fantasia || empresa.nome);
        }

        if (empresa.id) return empresa.id;
        if (empresa.empresa_id) return empresa.empresa_id;
      }

      return (
        localStorage.getItem("empresa_id") ||
        localStorage.getItem("th_empresa_id")
      );
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

  function ultimos7DiasBase() {
    const dias: { data: string; total: number }[] = [];

    for (let i = 6; i >= 0; i--) {
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

    carregarDadosLocais();
    setCarregando(true);

    const inicioHoje = dataHojeInicio();
    const inicioMes = dataMesInicio();
    const mesIso = inicioMes.toISOString();

    const inicio7 = new Date();
    inicio7.setDate(inicio7.getDate() - 6);
    inicio7.setHours(0, 0, 0, 0);

    const vendasReq = await supabase
      .from("vendas")
      .select("id,empresa_id,valor_total,forma_pagamento,status,created_at")
      .eq("empresa_id", empresaId)
      .gte("created_at", inicio7.toISOString())
      .order("created_at", { ascending: true });

    if (vendasReq.error) {
      alert("Erro ao carregar vendas: " + vendasReq.error.message);
      setCarregando(false);
      return;
    }

    const vendas = (vendasReq.data || []) as Venda[];

    const vendasFinalizadas = vendas.filter(
      (venda) => venda.status !== "cancelada" && venda.status !== "devolvida"
    );

    const vendasHojeLista = vendasFinalizadas.filter((venda) => {
      if (!venda.created_at) return false;
      return new Date(venda.created_at) >= inicioHoje;
    });

    const vendasMesLista = vendasFinalizadas.filter((venda) => {
      if (!venda.created_at) return false;
      return new Date(venda.created_at) >= inicioMes;
    });

    const faturamentoHoje = vendasHojeLista.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0
    );

    const faturamentoMes = vendasMesLista.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0
    );

    const ticketMedio =
      vendasMesLista.length > 0 ? faturamentoMes / vendasMesLista.length : 0;

    const vendasPorDia = ultimos7DiasBase();

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

    const clientes = clientesReq.error
      ? []
      : ((clientesReq.data || []) as Cliente[]);

    const produtosReq = await supabase
      .from("produtos")
      .select("id,nome,qtd_atual,qtd_minima,empresa_id,ativo")
      .eq("empresa_id", empresaId);

    const produtos = produtosReq.error
      ? []
      : ((produtosReq.data || []) as Produto[]);

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

    const hojeData = somenteData(new Date());

    const totalReceber = contasReceber
      .filter((conta) => conta.status !== "pago")
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const totalPagar = contasPagar
      .filter((conta) => conta.status !== "pago")
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const contasReceberVencidas = contasReceber.filter((conta) => {
      if (conta.status === "pago") return false;
      if (!conta.vencimento) return false;
      return conta.vencimento < hojeData;
    }).length;

    const contasPagarVencidas = contasPagar.filter((conta) => {
      if (conta.status === "pago") return false;
      if (!conta.vencimento) return false;
      return conta.vencimento < hojeData;
    }).length;

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
      vendasHoje: vendasHojeLista.length,
      vendasMes: vendasMesLista.length,
      atualizacao: new Date().toLocaleString("pt-BR"),
      vendasPorDia,
      pagamentosPorForma,
      produtosBaixo: produtosBaixo.slice(0, 6),
      contasReceberVencidas,
      contasPagarVencidas,
    });

    setCarregando(false);
  }

  useEffect(() => {
    carregarDadosLocais();
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

  const metaMes = Math.max(dados.faturamentoMes * 1.35, 1000);
  const percentualMeta = Math.min((dados.faturamentoMes / metaMes) * 100, 100);

  return (
    <div className="min-h-screen bg-[#f7faff] px-4 py-6 md:px-8">
      <section className="mb-5 rounded-[2rem] bg-gradient-to-r from-white via-white to-blue-50 border border-blue-100 shadow-sm p-6 md:p-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-2 text-blue-700 font-black text-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {empresaNome || "THCloud ERP"}
            </div>

            <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-[-0.04em] text-slate-950">
              Olá, {usuarioNome || "Rafael"}! 👋
            </h1>

            <p className="mt-3 text-sm lg:text-base text-slate-600 max-w-3xl">
              Bem-vindo de volta ao THCloud ERP. Acompanhe vendas, estoque,
              financeiro, clientes e indicadores estratégicos em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xl:min-w-[520px]">
            <InfoTopo titulo="Perfil" valor={usuarioPerfil || "-"} />
            <InfoTopo titulo="Plano" valor={planoNome || "Básico"} />
            <InfoTopo titulo="Atualizado" valor={dados.atualizacao || "-"} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <CardPremium
          titulo="Vendas Hoje"
          valor={formatarMoeda(dados.faturamentoHoje)}
          subtitulo={`${dados.vendasHoje} venda(s) finalizadas hoje`}
          detalhe="+ Atualizado em tempo real"
          corValor="text-blue-700"
          fundoIcone="bg-blue-100"
          icone={<Wallet size={27} />}
        />

        <CardPremium
          titulo="Produtos"
          valor={`${dados.totalProdutos}`}
          subtitulo="Ativos em estoque"
          detalhe={`${dados.estoqueBaixo} produto(s) em alerta`}
          corValor="text-emerald-600"
          fundoIcone="bg-emerald-100"
          icone={<Package size={27} />}
        />

        <CardPremium
          titulo="Clientes"
          valor={`${dados.totalClientes}`}
          subtitulo="Clientes cadastrados"
          detalhe="Base comercial ativa"
          corValor="text-purple-700"
          fundoIcone="bg-purple-100"
          icone={<Users size={27} />}
        />

        <CardPremium
          titulo="Faturamento Mês"
          valor={formatarMoeda(dados.faturamentoMes)}
          subtitulo={`${dados.vendasMes} venda(s) no mês`}
          detalhe="Comparativo mensal"
          corValor="text-orange-600"
          fundoIcone="bg-orange-100"
          icone={<TrendingUp size={27} />}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        <CardResumo
          titulo="Ticket Médio"
          valor={formatarMoeda(dados.ticketMedio)}
          icone={<ShoppingCart size={22} />}
          cor="text-blue-700"
        />

        <CardResumo
          titulo="Saldo Previsto"
          valor={formatarMoeda(dados.saldoPrevisto)}
          icone={<CreditCard size={22} />}
          cor={dados.saldoPrevisto >= 0 ? "text-green-700" : "text-red-700"}
        />

        <CardResumo
          titulo="A Receber"
          valor={formatarMoeda(dados.totalReceber)}
          icone={<Banknote size={22} />}
          cor="text-cyan-700"
        />

        <CardResumo
          titulo="A Pagar"
          valor={formatarMoeda(dados.totalPagar)}
          icone={<CircleDollarSign size={22} />}
          cor="text-red-700"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-5">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 md:p-7">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-[-0.03em] text-slate-950">
                Resumo de Vendas
              </h2>

              <p className="text-slate-500 mt-1">
                Evolução do faturamento dos últimos 7 dias.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-700">
              Últimos 7 dias
            </div>
          </div>

          <div className="h-64 flex items-end gap-3 border-l border-b border-slate-200 px-3 pt-4 pb-2">
            {dados.vendasPorDia.map((dia) => {
              const altura = Math.max(
                (dia.total / maxGrafico) * 100,
                dia.total > 0 ? 5 : 0
              );

              return (
                <div
                  key={dia.data}
                  className="flex-1 h-full flex flex-col justify-end items-center group"
                >
                  <div className="relative w-full h-full flex items-end justify-center">
                    <div
                      className="w-full max-w-10 bg-gradient-to-t from-blue-700 to-blue-400 rounded-t-2xl hover:from-blue-800 hover:to-blue-500 transition-all shadow-sm"
                      style={{ height: `${altura}%` }}
                    />

                    <div className="hidden group-hover:block absolute bottom-full mb-3 bg-slate-950 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap z-10 shadow-xl">
                      {nomeDataCurta(dia.data)}: {formatarMoeda(dia.total)}
                    </div>
                  </div>

                  <span className="text-xs text-slate-500 font-bold mt-3">
                    {nomeDataCurta(dia.data)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 md:p-7">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                Meta do Mês
              </h2>

              <p className="text-slate-500 mt-1">
                Acompanhe o desempenho mensal.
              </p>
            </div>

            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 shadow-xl shadow-blue-900/20">
            <p className="text-blue-100 font-bold">Faturamento atual</p>
            <h3 className="text-4xl font-black mt-2">
              {formatarMoeda(dados.faturamentoMes)}
            </h3>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-bold text-blue-100">
                <span>Meta sugerida</span>
                <span>{percentualMeta.toFixed(0)}%</span>
              </div>

              <div className="mt-2 h-3 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${percentualMeta}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-blue-100">
                Meta: {formatarMoeda(metaMes)}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <LinhaCompacta
              label="Contas vencidas a receber"
              valor={`${dados.contasReceberVencidas}`}
              cor="text-red-700"
            />

            <LinhaCompacta
              label="Contas vencidas a pagar"
              valor={`${dados.contasPagarVencidas}`}
              cor="text-orange-700"
            />

            <LinhaCompacta
              label="Produtos em alerta"
              valor={`${dados.estoqueBaixo}`}
              cor="text-blue-700"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-5">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                Atalhos Rápidos
              </h2>

              <p className="text-slate-500 mt-1">
                Acesse as principais ações do sistema.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Atalho href="/caixa/pdv" titulo="Nova Venda" texto="Abrir PDV" icone={<ShoppingCart size={23} />} />
            <Atalho href="/clientes" titulo="Novo Cliente" texto="Cadastro rápido" icone={<UserPlus size={23} />} />
            <Atalho href="/produtos" titulo="Novo Produto" texto="Cadastrar item" icone={<Package size={23} />} />
            <Atalho href="/estoque/entrada" titulo="Entrada Estoque" texto="Adicionar saldo" icone={<Boxes size={23} />} />
            <Atalho href="/financeiro/contas-receber" titulo="Conta a Receber" texto="Gerenciar títulos" icone={<Wallet size={23} />} />
            <Atalho href="/vendas/orcamentos" titulo="Orçamentos" texto="Criar proposta" icone={<ClipboardList size={23} />} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 md:p-7">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
            Formas de Pagamento
          </h2>

          <p className="text-slate-500 mt-1 mb-6">
            Participação por forma no mês.
          </p>

          {dados.pagamentosPorForma.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-500 text-center rounded-3xl bg-slate-50 border border-slate-100 p-5">
              Nenhum pagamento encontrado no mês.
            </div>
          ) : (
            <div className="space-y-4">
              {dados.pagamentosPorForma.map((item) => {
                const percentual =
                  totalPagamentos > 0
                    ? (item.total / totalPagamentos) * 100
                    : 0;

                return (
                  <div key={item.forma}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-black text-slate-700 capitalize">
                        {item.forma}
                      </span>

                      <span className="font-black text-slate-900">
                        {formatarMoeda(item.total)}
                      </span>
                    </div>

                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full"
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
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 md:p-7">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                Produtos com Estoque Baixo
              </h2>

              <p className="text-slate-500 mt-1">
                Itens que precisam de atenção.
              </p>
            </div>

            <AlertTriangle className="text-orange-600" />
          </div>

          {dados.produtosBaixo.length === 0 ? (
            <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5 text-emerald-800 font-bold">
              Nenhum produto com estoque baixo no momento.
            </div>
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

        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 md:p-7">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                Resumo Financeiro
              </h2>

              <p className="text-slate-500 mt-1">
                Visão rápida de entradas, saídas e saldo.
              </p>
            </div>

            <CalendarClock className="text-blue-700" />
          </div>

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
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoTopo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-3xl bg-white border border-blue-100 shadow-sm p-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 text-slate-950 font-black truncate">
        {valor}
      </p>
    </div>
  );
}

function CardPremium({
  titulo,
  valor,
  subtitulo,
  detalhe,
  corValor,
  fundoIcone,
  icone,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  detalhe: string;
  corValor: string;
  fundoIcone: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="group bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className={`h-16 w-16 rounded-full ${fundoIcone} flex items-center justify-center text-blue-700`}>
          {icone}
        </div>

        <ArrowUpRight className="text-slate-300 group-hover:text-blue-700 transition" />
      </div>

      <p className="mt-6 text-lg font-black text-slate-900">{titulo}</p>

      <p className={`mt-3 text-3xl md:text-4xl font-black tracking-[-0.04em] ${corValor}`}>
        {valor}
      </p>

      <p className="mt-3 text-slate-600 font-semibold">{subtitulo}</p>

      <p className="mt-3 text-sm text-green-600 font-bold">
        {detalhe}
      </p>
    </div>
  );
}

function CardResumo({
  titulo,
  valor,
  icone,
  cor,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
  cor: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-black">{titulo}</p>

          <p className={`mt-2 text-2xl font-black ${cor}`}>{valor}</p>
        </div>

        <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 text-blue-700 flex items-center justify-center">
          {icone}
        </div>
      </div>
    </div>
  );
}

function Atalho({
  href,
  titulo,
  texto,
  icone,
}: {
  href: string;
  titulo: string;
  texto: string;
  icone: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="h-13 w-13 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
        {icone}
      </div>

      <p className="font-black text-slate-950">{titulo}</p>

      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{texto}</p>

        <Plus size={18} className="text-slate-300 group-hover:text-blue-700" />
      </div>
    </Link>
  );
}

function LinhaCompacta({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: string;
  cor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="font-bold text-slate-600">{label}</span>

      <span className={`font-black ${cor}`}>{valor}</span>
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
    <div className="flex items-center justify-between border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50">
      <span className="text-slate-600 font-black">{label}</span>

      <span className={`text-2xl font-black ${classe}`}>{valor}</span>
    </div>
  );
}
