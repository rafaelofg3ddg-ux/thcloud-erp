"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";
import {
  Calendar,
  Clock,
  Download,
  RefreshCcw,
  Search,
  User,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatarData, formatarMoeda } from "../../../components/global/THFormat";

type Caixa = {
  id: string;
  empresa_id: string;
  usuario: string | null;
  valor_abertura: number | null;
  valor_fechamento: number | null;
  status: string | null;
  data_abertura: string | null;
  data_fechamento: string | null;
  observacao: string | null;
  total_dinheiro?: number | null;
  total_pix?: number | null;
  total_debito?: number | null;
  total_credito?: number | null;
  total_crediario?: number | null;
  saldo_esperado?: number | null;
  valor_informado?: number | null;
  diferenca?: number | null;
};

type Venda = {
  id: string;
  caixa_id: string | null;
  valor_total: number | null;
  forma_pagamento: string | null;
  status: string | null;
  created_at: string | null;
};

type PagamentoVenda = {
  id: string;
  venda_id: string;
  forma_pagamento: string;
  valor: number;
  created_at: string | null;
};

type MovimentoCaixa = {
  id: string;
  caixa_id: string;
  empresa_id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  usuario: string | null;
  created_at: string | null;
};

type CaixaResumo = Caixa & {
  vendas: Venda[];
  pagamentos: PagamentoVenda[];
  movimentos: MovimentoCaixa[];
  totalVendas: number;
  quantidadeVendas: number;
  dinheiro: number;
  pix: number;
  debito: number;
  credito: number;
  crediario: number;
  sangrias: number;
  suprimentos: number;
  saldoCalculado: number;
};

export default function RelatorioCaixasPage() {
  const hoje = new Date().toISOString().split("T")[0];

  const [caixas, setCaixas] = useState<CaixaResumo[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [dataInicial, setDataInicial] = useState(hoje);
  const [dataFinal, setDataFinal] = useState(hoje);
  const [horaInicial, setHoraInicial] = useState("");
  const [horaFinal, setHoraFinal] = useState("");
  const [operador, setOperador] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  function empresaAtualId() {
    try {
      const usuario = localStorage.getItem("th_usuario");
      if (!usuario) return null;

      const dados = JSON.parse(usuario);
      return dados.empresa_id || null;
    } catch {
      return null;
    }
  }

  function formatarDataHora(data: string | null | undefined) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarHora(data: string | null | undefined) {
    if (!data) return "-";
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function inicioFiltro() {
    return `${dataInicial || hoje}T${horaInicial || "00:00"}:00`;
  }

  function fimFiltro() {
    return `${dataFinal || hoje}T${horaFinal || "23:59"}:59`;
  }

  function totalPagamentosPorForma(pagamentos: PagamentoVenda[], forma: string) {
    return pagamentos
      .filter((pagamento) => pagamento.forma_pagamento === forma)
      .reduce((total, pagamento) => total + Number(pagamento.valor || 0), 0);
  }

  function totalMovimentosPorTipo(movimentos: MovimentoCaixa[], tipo: string) {
    return movimentos
      .filter((movimento) => movimento.tipo === tipo)
      .reduce((total, movimento) => total + Number(movimento.valor || 0), 0);
  }

  async function carregarRelatorio() {
    const empresaId = empresaAtualId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    setCarregando(true);

    const caixasReq = await supabase
      .from("caixas")
      .select("*")
      .eq("empresa_id", empresaId)
      .gte("data_abertura", inicioFiltro())
      .lte("data_abertura", fimFiltro())
      .order("data_abertura", { ascending: false });

    if (caixasReq.error) {
      setCarregando(false);
      alert("Erro ao carregar caixas: " + caixasReq.error.message);
      return;
    }

    const caixasBase: Caixa[] = caixasReq.data || [];

    if (caixasBase.length === 0) {
      setCaixas([]);
      setCarregando(false);
      return;
    }

    const caixaIds = caixasBase.map((caixa) => caixa.id);

    const vendasReq = await supabase
      .from("vendas")
      .select("id,caixa_id,valor_total,forma_pagamento,status,created_at")
      .eq("empresa_id", empresaId)
      .in("caixa_id", caixaIds);

    if (vendasReq.error) {
      setCarregando(false);
      alert("Erro ao carregar vendas dos caixas: " + vendasReq.error.message);
      return;
    }

    const vendas: Venda[] = vendasReq.data || [];
    const vendaIds = vendas.map((venda) => venda.id);

    let pagamentos: PagamentoVenda[] = [];

    if (vendaIds.length > 0) {
      const pagamentosReq = await supabase
        .from("pagamentos_venda")
        .select("id,venda_id,forma_pagamento,valor,created_at")
        .eq("empresa_id", empresaId)
        .in("venda_id", vendaIds);

      if (pagamentosReq.error) {
        setCarregando(false);
        alert("Erro ao carregar pagamentos dos caixas: " + pagamentosReq.error.message);
        return;
      }

      pagamentos = pagamentosReq.data || [];
    }

    const movimentosReq = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("empresa_id", empresaId)
      .in("caixa_id", caixaIds);

    if (movimentosReq.error) {
      setCarregando(false);
      alert("Erro ao carregar sangrias e suprimentos: " + movimentosReq.error.message);
      return;
    }

    const movimentos: MovimentoCaixa[] = movimentosReq.data || [];

    const montados: CaixaResumo[] = caixasBase.map((caixa) => {
      const vendasDoCaixa = vendas.filter(
        (venda) => venda.caixa_id === caixa.id && venda.status !== "cancelada"
      );

      const vendaIdsDoCaixa = vendasDoCaixa.map((venda) => venda.id);

      const pagamentosDoCaixa = pagamentos.filter((pagamento) =>
        vendaIdsDoCaixa.includes(pagamento.venda_id)
      );

      const movimentosDoCaixa = movimentos.filter(
        (movimento) => movimento.caixa_id === caixa.id
      );

      const dinheiro = totalPagamentosPorForma(pagamentosDoCaixa, "dinheiro");
      const pix = totalPagamentosPorForma(pagamentosDoCaixa, "pix");
      const debito = totalPagamentosPorForma(pagamentosDoCaixa, "debito");
      const credito = totalPagamentosPorForma(pagamentosDoCaixa, "credito");
      const crediario = totalPagamentosPorForma(pagamentosDoCaixa, "crediario");

      const sangrias = totalMovimentosPorTipo(movimentosDoCaixa, "sangria");
      const suprimentos = totalMovimentosPorTipo(movimentosDoCaixa, "suprimento");

      const totalVendas = vendasDoCaixa.reduce(
        (total, venda) => total + Number(venda.valor_total || 0),
        0
      );

      const saldoCalculado =
        Number(caixa.valor_abertura || 0) +
        dinheiro +
        suprimentos -
        sangrias;

      return {
        ...caixa,
        vendas: vendasDoCaixa,
        pagamentos: pagamentosDoCaixa,
        movimentos: movimentosDoCaixa,
        totalVendas,
        quantidadeVendas: vendasDoCaixa.length,
        dinheiro,
        pix,
        debito,
        credito,
        crediario,
        sangrias,
        suprimentos,
        saldoCalculado,
      };
    });

    setCaixas(montados);
    setCarregando(false);
  }

  const operadores = useMemo(() => {
    const lista = Array.from(
      new Set(caixas.map((caixa) => caixa.usuario || "Sem operador"))
    );

    return lista.sort();
  }, [caixas]);

  const caixasFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return caixas.filter((caixa) => {
      const operadorOk =
        operador === "todos" ||
        String(caixa.usuario || "Sem operador") === operador;

      const statusOk =
        status === "todos" ||
        String(caixa.status || "").toLowerCase() === status.toLowerCase();

      const textoBusca = [
        caixa.id,
        caixa.usuario,
        caixa.status,
        caixa.observacao,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const buscaOk = !termo || textoBusca.includes(termo);

      return operadorOk && statusOk && buscaOk;
    });
  }, [caixas, operador, status, busca]);

  const totalAbertura = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.valor_abertura || 0),
    0
  );

  const totalVendido = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.totalVendas || 0),
    0
  );

  const totalDinheiro = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.dinheiro || 0),
    0
  );

  const totalPix = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.pix || 0),
    0
  );

  const totalDebito = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.debito || 0),
    0
  );

  const totalCredito = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.credito || 0),
    0
  );

  const totalCrediario = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.crediario || 0),
    0
  );

  const totalSangrias = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.sangrias || 0),
    0
  );

  const totalSuprimentos = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.suprimentos || 0),
    0
  );

  const totalSaldoCalculado = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.saldoCalculado || 0),
    0
  );

  const totalDiferenca = caixasFiltrados.reduce(
    (total, caixa) => total + Number(caixa.diferenca || 0),
    0
  );

  async function gerarPDFResumoCaixas() {
    await gerarPDFPadrao(
      "Relatório de Caixas - Resumo",
      [
        "Abertura",
        "Fechamento",
        "Operador",
        "Status",
        "Vendas",
        "Dinheiro",
        "PIX",
        "Sangrias",
        "Suprimentos",
        "Saldo Caixa",
        "Diferença",
      ],
      caixasFiltrados.map((caixa) => [
        formatarDataHora(caixa.data_abertura),
        formatarDataHora(caixa.data_fechamento),
        caixa.usuario || "-",
        caixa.status || "-",
        formatarMoeda(caixa.totalVendas),
        formatarMoeda(caixa.dinheiro),
        formatarMoeda(caixa.pix),
        formatarMoeda(caixa.sangrias),
        formatarMoeda(caixa.suprimentos),
        formatarMoeda(caixa.saldoCalculado),
        formatarMoeda(caixa.diferenca),
      ])
    );
  }

  async function gerarPDFDetalhadoCaixas() {
    const linhas: any[][] = [];

    caixasFiltrados.forEach((caixa) => {
      linhas.push([
        "CAIXA",
        formatarDataHora(caixa.data_abertura),
        caixa.usuario || "-",
        caixa.status || "-",
        "Abertura",
        formatarMoeda(caixa.valor_abertura),
      ]);

      linhas.push([
        "RESUMO",
        "Vendas",
        caixa.quantidadeVendas,
        "Total vendido",
        "",
        formatarMoeda(caixa.totalVendas),
      ]);

      linhas.push([
        "PAGAMENTOS",
        "Dinheiro",
        formatarMoeda(caixa.dinheiro),
        "PIX",
        formatarMoeda(caixa.pix),
        "",
      ]);

      linhas.push([
        "PAGAMENTOS",
        "Débito",
        formatarMoeda(caixa.debito),
        "Crédito",
        formatarMoeda(caixa.credito),
        `Crediário: ${formatarMoeda(caixa.crediario)}`,
      ]);

      linhas.push([
        "MOVIMENTOS",
        "Sangrias",
        formatarMoeda(caixa.sangrias),
        "Suprimentos",
        formatarMoeda(caixa.suprimentos),
        "",
      ]);

      linhas.push([
        "FECHAMENTO",
        formatarDataHora(caixa.data_fechamento),
        "Saldo calculado",
        formatarMoeda(caixa.saldoCalculado),
        "Diferença",
        formatarMoeda(caixa.diferenca),
      ]);

      if (caixa.movimentos.length > 0) {
        caixa.movimentos.forEach((movimento) => {
          linhas.push([
            "MOV. CAIXA",
            formatarDataHora(movimento.created_at),
            movimento.tipo,
            movimento.usuario || "-",
            movimento.descricao || "-",
            formatarMoeda(movimento.valor),
          ]);
        });
      }

      linhas.push(["", "", "", "", "", ""]);
    });

    await gerarPDFPadrao(
      "Relatório de Caixas - Detalhado",
      ["Tipo", "Data/Hora", "Campo 1", "Campo 2", "Descrição", "Valor"],
      linhas
    );
  }

  function limparFiltros() {
    setDataInicial(hoje);
    setDataFinal(hoje);
    setHoraInicial("");
    setHoraFinal("");
    setOperador("todos");
    setStatus("todos");
    setBusca("");
  }

  useEffect(() => {
    carregarRelatorio();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">
              Th Cloud
            </p>

            <h1 className="text-4xl font-black mt-2">
              Relatório de Caixas
            </h1>

            <p className="text-blue-100 mt-2 max-w-4xl">
              Conferência gerencial de abertura, fechamento, vendas, formas de pagamento, sangrias, suprimentos, diferenças e movimentos por operador.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={gerarPDFResumoCaixas}
              className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              PDF Resumo
            </button>

            <button
              onClick={gerarPDFDetalhadoCaixas}
              className="bg-blue-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-900 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              PDF Detalhado
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-5 mb-8">
        <ResumoCard
          titulo="Caixas"
          valor={`${caixasFiltrados.length}`}
          detalhe="Caixas encontrados"
          cor="text-blue-700"
          icone={<Wallet size={24} />}
        />

        <ResumoCard
          titulo="Vendas"
          valor={formatarMoeda(totalVendido)}
          detalhe="Total vendido"
          cor="text-green-700"
          icone={<DollarSign size={24} />}
        />

        <ResumoCard
          titulo="Dinheiro"
          valor={formatarMoeda(totalDinheiro)}
          detalhe="Recebido em dinheiro"
          cor="text-emerald-700"
          icone={<DollarSign size={24} />}
        />

        <ResumoCard
          titulo="PIX"
          valor={formatarMoeda(totalPix)}
          detalhe="Recebido via PIX"
          cor="text-cyan-700"
          icone={<DollarSign size={24} />}
        />

        <ResumoCard
          titulo="Sangrias"
          valor={formatarMoeda(totalSangrias)}
          detalhe="Saídas do caixa"
          cor="text-red-700"
          icone={<TrendingDown size={24} />}
        />

        <ResumoCard
          titulo="Suprimentos"
          valor={formatarMoeda(totalSuprimentos)}
          detalhe="Entradas no caixa"
          cor="text-purple-700"
          icone={<TrendingUp size={24} />}
        />

        <ResumoCard
          titulo="Saldo Caixa"
          valor={formatarMoeda(totalSaldoCalculado)}
          detalhe="Dinheiro esperado"
          cor="text-slate-800"
          icone={<Wallet size={24} />}
        />

        <ResumoCard
          titulo="Diferença"
          valor={formatarMoeda(totalDiferenca)}
          detalhe="Sobra ou falta"
          cor={totalDiferenca === 0 ? "text-green-700" : "text-orange-700"}
          icone={totalDiferenca === 0 ? <CheckCircle size={24} /> : <XCircle size={24} />}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
          <CampoFiltro titulo="Data Inicial" icone={<Calendar size={16} />}>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="input-filtro"
            />
          </CampoFiltro>

          <CampoFiltro titulo="Data Final" icone={<Calendar size={16} />}>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="input-filtro"
            />
          </CampoFiltro>

          <CampoFiltro titulo="Hora Inicial" icone={<Clock size={16} />}>
            <input
              type="time"
              value={horaInicial}
              onChange={(e) => setHoraInicial(e.target.value)}
              className="input-filtro"
            />
          </CampoFiltro>

          <CampoFiltro titulo="Hora Final" icone={<Clock size={16} />}>
            <input
              type="time"
              value={horaFinal}
              onChange={(e) => setHoraFinal(e.target.value)}
              className="input-filtro"
            />
          </CampoFiltro>

          <CampoFiltro titulo="Operador" icone={<User size={16} />}>
            <select
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              className="input-filtro"
            >
              <option value="todos">Todos</option>

              {operadores.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </CampoFiltro>

          <CampoFiltro titulo="Status" icone={<CheckCircle size={16} />}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-filtro"
            >
              <option value="todos">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="fechado">Fechado</option>
            </select>
          </CampoFiltro>

          <div className="flex items-end">
            <button
              onClick={carregarRelatorio}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} />
              Filtrar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-5">
          <div className="xl:col-span-4 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por operador, ID do caixa, observação ou status..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900"
            />
          </div>

          <button
            onClick={limparFiltros}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-2xl font-black"
          >
            Limpar Filtros
          </button>
        </div>

        <p className="text-sm text-slate-500 mt-5">
          {carregando
            ? "Carregando relatório de caixas..."
            : `${caixasFiltrados.length} caixa(s) encontrado(s).`}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-black text-slate-900">
            Conferência de Caixas
          </h2>

          <p className="text-slate-500">
            Acompanhe a movimentação completa dos caixas filtrados.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-4 text-left">Abertura</th>
                <th className="p-4 text-left">Fechamento</th>
                <th className="p-4 text-left">Operador</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Abertura R$</th>
                <th className="p-4 text-right">Vendas</th>
                <th className="p-4 text-right">Dinheiro</th>
                <th className="p-4 text-right">PIX</th>
                <th className="p-4 text-right">Cartões</th>
                <th className="p-4 text-right">Sangrias</th>
                <th className="p-4 text-right">Suprimentos</th>
                <th className="p-4 text-right">Saldo Caixa</th>
                <th className="p-4 text-right">Diferença</th>
              </tr>
            </thead>

            <tbody>
              {caixasFiltrados.map((caixa) => (
                <tr key={caixa.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-700">
                    <p className="font-bold">{formatarData(caixa.data_abertura)}</p>
                    <p className="text-sm text-slate-500">{formatarHora(caixa.data_abertura)}</p>
                    <p className="text-xs text-slate-400 mt-1">{caixa.id}</p>
                  </td>

                  <td className="p-4 text-slate-700">
                    <p className="font-bold">{formatarData(caixa.data_fechamento)}</p>
                    <p className="text-sm text-slate-500">{formatarHora(caixa.data_fechamento)}</p>
                  </td>

                  <td className="p-4 text-slate-900 font-bold">
                    {caixa.usuario || "-"}
                  </td>

                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                        caixa.status === "fechado"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {caixa.status || "-"}
                    </span>
                  </td>

                  <td className="p-4 text-right font-bold text-slate-800">
                    {formatarMoeda(caixa.valor_abertura)}
                  </td>

                  <td className="p-4 text-right font-black text-green-700">
                    <p>{formatarMoeda(caixa.totalVendas)}</p>
                    <p className="text-xs text-slate-500">
                      {caixa.quantidadeVendas} venda(s)
                    </p>
                  </td>

                  <td className="p-4 text-right font-bold text-emerald-700">
                    {formatarMoeda(caixa.dinheiro)}
                  </td>

                  <td className="p-4 text-right font-bold text-cyan-700">
                    {formatarMoeda(caixa.pix)}
                  </td>

                  <td className="p-4 text-right font-bold text-blue-700">
                    {formatarMoeda(caixa.debito + caixa.credito)}
                  </td>

                  <td className="p-4 text-right font-bold text-red-700">
                    {formatarMoeda(caixa.sangrias)}
                  </td>

                  <td className="p-4 text-right font-bold text-purple-700">
                    {formatarMoeda(caixa.suprimentos)}
                  </td>

                  <td className="p-4 text-right font-black text-slate-900">
                    {formatarMoeda(caixa.saldoCalculado)}
                  </td>

                  <td
                    className={`p-4 text-right font-black ${
                      Number(caixa.diferenca || 0) === 0
                        ? "text-green-700"
                        : "text-orange-700"
                    }`}
                  >
                    {formatarMoeda(caixa.diferenca)}
                  </td>
                </tr>
              ))}

              {caixasFiltrados.length === 0 && (
                <tr>
                  <td colSpan={13} className="p-10 text-center text-slate-500">
                    Nenhum caixa encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>

            {caixasFiltrados.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black">
                  <td className="p-4" colSpan={4}>
                    TOTAIS
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalAbertura)}
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalVendido)}
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalDinheiro)}
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalPix)}
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalDebito + totalCredito)}
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalSangrias)}
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalSuprimentos)}
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalSaldoCalculado)}
                  </td>
                  <td className="p-4 text-right">
                    {formatarMoeda(totalDiferenca)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <style jsx global>{`
        .input-filtro {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          color: rgb(15 23 42);
          background: white;
          outline: none;
        }

        .input-filtro:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
        }
      `}</style>
    </div>
  );
}

function CampoFiltro({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2">
        {icone}
        {titulo}
      </label>

      {children}
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
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {titulo}
          </p>

          <h2 className={`text-2xl font-black mt-2 ${cor}`}>
            {valor}
          </h2>

          <p className="text-xs text-slate-500 mt-2">
            {detalhe}
          </p>
        </div>

        <div className={`h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}>
          {icone}
        </div>
      </div>
    </div>
  );
}
