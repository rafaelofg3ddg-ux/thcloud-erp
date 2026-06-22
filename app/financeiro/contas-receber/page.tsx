"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  CreditCard,
  Filter,
  MessageCircle,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  whatsapp: string | null;
};

type Venda = {
  id: string;
  numero_venda: number | null;
  created_at: string | null;
};

type ContaReceber = {
  id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  venda_id: string | null;
  descricao: string | null;
  valor: number;
  vencimento: string;
  status: string | null;
  numero_parcela: number | null;
  total_parcelas: number | null;
  valor_recebido: number | null;
  forma_pagamento: string | null;
  data_recebimento: string | null;
  observacao_recebimento: string | null;
  created_at?: string | null;
};

type CreditoCliente = {
  id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  venda_id: string | null;
  devolucao_id: string | null;
  origem: string | null;
  tipo: string | null;
  valor: number;
  saldo_apos: number;
  descricao: string | null;
  usuario: string | null;
  created_at: string | null;
};

export default function ContasReceberPage() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [creditos, setCreditos] = useState<CreditoCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);

  const [visualizacao, setVisualizacao] = useState<"contas" | "creditos">("contas");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [carregando, setCarregando] = useState(false);

  const [modalReceber, setModalReceber] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<ContaReceber | null>(null);
  const [valorRecebido, setValorRecebido] = useState("0,00");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [observacaoRecebimento, setObservacaoRecebimento] = useState("");

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function operadorAtual() {
    try {
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (!usuarioStorage) return "Sistema";

      const usuario = JSON.parse(usuarioStorage);
      return usuario.nome || usuario.email || usuario.usuario || "Sistema";
    } catch {
      return "Sistema";
    }
  }

  async function registrarAuditoria(acao: string, detalhe: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    try {
      await supabase.from("auditoria_saas").insert([
        {
          empresa_id: empresaId,
          usuario: operadorAtual(),
          acao,
          descricao: detalhe,
        },
      ]);
    } catch {
      // Não trava a tela se auditoria ainda não existir.
    }
  }

  function converterNumero(valor: string | number) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarMoeda(valor: number | null | undefined) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null | undefined) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function formatarDataHora(data: string | null | undefined) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarNumero(numero: number | null | undefined) {
    if (!numero) return "-";
    return String(numero).padStart(6, "0");
  }

  function clientePorId(clienteId: string | null) {
    if (!clienteId) return null;
    return clientes.find((item) => item.id === clienteId) || null;
  }

  function clienteNome(clienteId: string | null) {
    return clientePorId(clienteId)?.nome || "Cliente não identificado";
  }

  function clienteWhatsapp(clienteId: string | null) {
    return clientePorId(clienteId)?.whatsapp || "";
  }

  function vendaPorId(vendaId: string | null) {
    if (!vendaId) return null;
    return vendas.find((item) => item.id === vendaId) || null;
  }

  function numeroVenda(conta: ContaReceber) {
    const venda = vendaPorId(conta.venda_id);

    if (venda?.numero_venda) return formatarNumero(venda.numero_venda);

    const texto = String(conta.descricao || "");
    const matchNumero = texto.match(/Venda Nº\s*(\d+)/i);
    if (matchNumero?.[1]) return formatarNumero(Number(matchNumero[1]));

    return conta.venda_id ? conta.venda_id.slice(0, 8) : "-";
  }

  function numeroVendaCredito(credito: CreditoCliente) {
    const venda = vendaPorId(credito.venda_id);

    if (venda?.numero_venda) return formatarNumero(venda.numero_venda);

    const texto = String(credito.descricao || "");
    const matchNumero = texto.match(/Venda nº\s*(\d+)/i);
    if (matchNumero?.[1]) return formatarNumero(Number(matchNumero[1]));

    return credito.venda_id ? credito.venda_id.slice(0, 8) : "-";
  }

  function parcelaTexto(conta: ContaReceber) {
    if (conta.numero_parcela && conta.total_parcelas) {
      return `${conta.numero_parcela}/${conta.total_parcelas}`;
    }

    const texto = String(conta.descricao || "");
    const matchParcela = texto.match(/Parcela\s*(\d+)\/(\d+)/i);

    if (matchParcela?.[1] && matchParcela?.[2]) {
      return `${matchParcela[1]}/${matchParcela[2]}`;
    }

    return "1/1";
  }

  function descricaoLimpa(conta: ContaReceber) {
    const vendaNumero = numeroVenda(conta);
    const parcela = parcelaTexto(conta);

    if (vendaNumero !== "-") {
      return `Venda Nº ${vendaNumero} - Parcela ${parcela}`;
    }

    return conta.descricao || `Parcela ${parcela}`;
  }

  function estaPaga(conta: ContaReceber) {
    return conta.status === "pago" || conta.status === "recebido";
  }

  function estaVencida(conta: ContaReceber) {
    if (estaPaga(conta)) return false;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(conta.vencimento + "T00:00:00");
    return vencimento < hoje;
  }

  function statusVisual(conta: ContaReceber) {
    if (estaPaga(conta)) return "Recebido";
    if (estaVencida(conta)) return "Vencido";
    return "Aberto";
  }

  function classeStatus(conta: ContaReceber) {
    if (estaPaga(conta)) return "bg-green-100 text-green-700";
    if (estaVencida(conta)) return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  }

  function estaNoPeriodo(conta: ContaReceber) {
    if (filtroPeriodo === "todos") return true;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(conta.vencimento + "T00:00:00");

    if (filtroPeriodo === "hoje") {
      return vencimento.getTime() === hoje.getTime();
    }

    if (filtroPeriodo === "7dias") {
      const limite = new Date(hoje);
      limite.setDate(limite.getDate() + 7);
      return vencimento >= hoje && vencimento <= limite;
    }

    if (filtroPeriodo === "30dias") {
      const limite = new Date(hoje);
      limite.setDate(limite.getDate() + 30);
      return vencimento >= hoje && vencimento <= limite;
    }

    return true;
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome,cpf_cnpj,whatsapp")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (clientesReq.error) {
      setCarregando(false);
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      return;
    }

    setClientes(clientesReq.data || []);

    const contasReq = await supabase
      .from("contas_receber")
      .select(
        "id,empresa_id,cliente_id,venda_id,descricao,valor,vencimento,status,numero_parcela,total_parcelas,valor_recebido,forma_pagamento,data_recebimento,observacao_recebimento,created_at"
      )
      .eq("empresa_id", empresaId)
      .neq("status", "credito")
      .gte("valor", 0)
      .order("vencimento", { ascending: true });

    if (contasReq.error) {
      setCarregando(false);
      alert("Erro ao carregar contas a receber: " + contasReq.error.message);
      return;
    }

    const listaContas = (contasReq.data || []) as ContaReceber[];
    setContas(listaContas);

    const creditosReq = await supabase
      .from("creditos_cliente")
      .select(
        "id,empresa_id,cliente_id,venda_id,devolucao_id,origem,tipo,valor,saldo_apos,descricao,usuario,created_at"
      )
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    const listaCreditos = creditosReq.error ? [] : ((creditosReq.data || []) as CreditoCliente[]);
    setCreditos(listaCreditos);

    const vendaIds = Array.from(
      new Set([
        ...listaContas.map((conta) => conta.venda_id).filter(Boolean),
        ...listaCreditos.map((credito) => credito.venda_id).filter(Boolean),
      ])
    ) as string[];

    if (vendaIds.length > 0) {
      const vendasReq = await supabase
        .from("vendas")
        .select("id,numero_venda,created_at")
        .eq("empresa_id", empresaId)
        .in("id", vendaIds);

      if (!vendasReq.error) {
        setVendas(vendasReq.data || []);
      } else {
        setVendas([]);
      }
    } else {
      setVendas([]);
    }

    setCarregando(false);
  }

  function abrirRecebimento(conta: ContaReceber) {
    if (estaPaga(conta)) {
      alert("Esta parcela já está recebida.");
      return;
    }

    setContaSelecionada(conta);
    setValorRecebido(String(Number(conta.valor || 0).toFixed(2)).replace(".", ","));
    setFormaPagamento("dinheiro");
    setObservacaoRecebimento("");
    setModalReceber(true);
  }

  function fecharModal() {
    setModalReceber(false);
    setContaSelecionada(null);
    setValorRecebido("0,00");
    setFormaPagamento("dinheiro");
    setObservacaoRecebimento("");
  }

  async function confirmarRecebimento() {
    const empresaId = empresaAtualId();
    if (!empresaId || !contaSelecionada) return;

    const valor = converterNumero(valorRecebido);

    if (isNaN(valor) || valor <= 0) {
      alert("Informe um valor recebido válido.");
      return;
    }

    if (valor < Number(contaSelecionada.valor || 0)) {
      const confirmar = confirm(
        "O valor recebido é menor que o valor da parcela. Deseja mesmo baixar como recebido?"
      );

      if (!confirmar) return;
    }

    const { error } = await supabase
      .from("contas_receber")
      .update({
        status: "pago",
        valor_recebido: valor,
        forma_pagamento: formaPagamento,
        data_recebimento: new Date().toISOString(),
        observacao_recebimento: observacaoRecebimento || null,
      })
      .eq("id", contaSelecionada.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao receber conta: " + error.message);
      return;
    }

    await registrarAuditoria(
      "CONTA_RECEBIDA",
      `Recebimento registrado | Cliente: ${clienteNome(contaSelecionada.cliente_id)} | Venda: ${numeroVenda(contaSelecionada)} | Valor: ${formatarMoeda(valor)} | Forma: ${formaPagamento}`
    );

    alert("Parcela recebida com sucesso!");
    fecharModal();
    carregarDados();
  }

  function abrirWhatsapp(conta: ContaReceber) {
    const whatsapp = clienteWhatsapp(conta.cliente_id);

    if (!whatsapp) {
      alert("Cliente sem WhatsApp cadastrado.");
      return;
    }

    const numero = whatsapp.replace(/\D/g, "");

    const mensagem = `Olá, ${clienteNome(conta.cliente_id)}. Identificamos a parcela ${parcelaTexto(
      conta
    )} da venda Nº ${numeroVenda(conta)}, no valor de ${formatarMoeda(
      Number(conta.valor)
    )}, com vencimento em ${formatarData(
      conta.vencimento
    )}. Por favor, entre em contato para regularização.`;

    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  const contasFiltradas = useMemo(() => {
    const texto = pesquisa.toLowerCase().trim();

    return contas.filter((conta) => {
      const cliente = clienteNome(conta.cliente_id).toLowerCase();
      const descricao = descricaoLimpa(conta).toLowerCase();
      const venda = numeroVenda(conta).toLowerCase();
      const documento = String(clientePorId(conta.cliente_id)?.cpf_cnpj || "").toLowerCase();

      const passouPesquisa =
        !texto ||
        cliente.includes(texto) ||
        descricao.includes(texto) ||
        venda.includes(texto) ||
        documento.includes(texto);

      if (!passouPesquisa) return false;
      if (!estaNoPeriodo(conta)) return false;

      if (filtroStatus === "todos") return true;
      if (filtroStatus === "aberto") return !estaPaga(conta) && !estaVencida(conta);
      if (filtroStatus === "vencido") return estaVencida(conta);
      if (filtroStatus === "pago") return estaPaga(conta);

      return true;
    });
  }, [contas, clientes, vendas, pesquisa, filtroStatus, filtroPeriodo]);

  const creditosFiltrados = useMemo(() => {
    const texto = pesquisa.toLowerCase().trim();

    return creditos.filter((credito) => {
      const cliente = clienteNome(credito.cliente_id).toLowerCase();
      const documento = String(clientePorId(credito.cliente_id)?.cpf_cnpj || "").toLowerCase();
      const descricao = String(credito.descricao || "").toLowerCase();
      const origem = String(credito.origem || "").toLowerCase();
      const tipo = String(credito.tipo || "").toLowerCase();
      const venda = numeroVendaCredito(credito).toLowerCase();

      return (
        !texto ||
        cliente.includes(texto) ||
        documento.includes(texto) ||
        descricao.includes(texto) ||
        origem.includes(texto) ||
        tipo.includes(texto) ||
        venda.includes(texto)
      );
    });
  }, [creditos, clientes, vendas, pesquisa]);

  const totalAberto = contas
    .filter((conta) => !estaPaga(conta) && !estaVencida(conta))
    .reduce((total, conta) => total + Number(conta.valor || 0), 0);

  const totalVencido = contas
    .filter((conta) => estaVencida(conta))
    .reduce((total, conta) => total + Number(conta.valor || 0), 0);

  const totalPago = contas
    .filter((conta) => estaPaga(conta))
    .reduce((total, conta) => total + Number(conta.valor_recebido || conta.valor || 0), 0);

  const totalCreditosEntradas = creditos
    .filter((credito) => credito.tipo === "entrada" || credito.tipo === "ajuste")
    .reduce((total, credito) => total + Number(credito.valor || 0), 0);

  const totalCreditosUsados = creditos
    .filter((credito) => credito.tipo === "saida" || credito.tipo === "uso")
    .reduce((total, credito) => total + Number(credito.valor || 0), 0);

  const saldoCreditos = totalCreditosEntradas - totalCreditosUsados;

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-6 lg:p-8 shadow-lg mb-6 text-white">
        <p className="text-blue-100 font-bold">THCloud ERP</p>
        <h1 className="text-3xl lg:text-4xl font-black mt-2">Contas a Receber</h1>
        <p className="text-blue-100 mt-2 max-w-4xl">
          Controle parcelas do crediário, vendas a prazo, vencimentos,
          recebimentos, créditos do cliente e cobrança por WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Resumo titulo="Em Aberto" valor={formatarMoeda(totalAberto)} detalhe="Parcelas dentro do prazo" icone={<Clock size={24} />} cor="text-blue-700" />
        <Resumo titulo="Vencido" valor={formatarMoeda(totalVencido)} detalhe="Parcelas em atraso" icone={<CalendarDays size={24} />} cor="text-red-700" />
        <Resumo titulo="Recebido" valor={formatarMoeda(totalPago)} detalhe="Baixas realizadas" icone={<CheckCircle size={24} />} cor="text-green-700" />
        <Resumo titulo="Créditos Cliente" valor={formatarMoeda(saldoCreditos)} detalhe="Saldo disponível" icone={<CreditCard size={24} />} cor="text-emerald-700" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar cliente, descrição, documento ou número da venda..."
              className="w-full border border-slate-300 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-semibold"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="lg:col-span-2 border border-slate-300 rounded-2xl py-3 px-4 text-slate-900 font-semibold bg-white"
          >
            <option value="todos">Todos</option>
            <option value="aberto">Aberto</option>
            <option value="vencido">Vencido</option>
            <option value="pago">Recebido</option>
          </select>

          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="lg:col-span-2 border border-slate-300 rounded-2xl py-3 px-4 text-slate-900 font-semibold bg-white"
          >
            <option value="todos">Todos os vencimentos</option>
            <option value="hoje">Vence hoje</option>
            <option value="7dias">Próximos 7 dias</option>
            <option value="30dias">Próximos 30 dias</option>
          </select>

          <button
            onClick={carregarDados}
            className="lg:col-span-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black flex items-center justify-center gap-2 px-4 py-3"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
        <button
          onClick={() => setVisualizacao("contas")}
          className={`flex-1 px-5 py-3 rounded-2xl font-black ${
            visualizacao === "contas"
              ? "bg-blue-700 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Contas a Receber
        </button>

        <button
          onClick={() => setVisualizacao("creditos")}
          className={`flex-1 px-5 py-3 rounded-2xl font-black ${
            visualizacao === "creditos"
              ? "bg-emerald-700 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Créditos do Cliente
        </button>
      </div>

      {visualizacao === "contas" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 lg:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Parcelas e Títulos</h2>
              <p className="text-slate-500">{contasFiltradas.length} parcela(s) encontrada(s)</p>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
              <Filter size={18} /> Dados isolados por empresa
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="p-4 text-left">Cliente</th>
                  <th className="p-4 text-left">Venda</th>
                  <th className="p-4 text-center">Parcela</th>
                  <th className="p-4 text-left">Descrição</th>
                  <th className="p-4 text-center">Vencimento</th>
                  <th className="p-4 text-right">Valor</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Recebido em</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contasFiltradas.map((conta) => (
                  <tr key={conta.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-900">{clienteNome(conta.cliente_id)}</p>
                      <p className="text-xs text-slate-500">{clientePorId(conta.cliente_id)?.cpf_cnpj || "Sem documento"}</p>
                    </td>
                    <td className="p-4 font-black text-blue-700">#{numeroVenda(conta)}</td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-black text-sm">
                        {parcelaTexto(conta)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">{descricaoLimpa(conta)}</td>
                    <td className="p-4 text-center font-bold text-slate-800">{formatarData(conta.vencimento)}</td>
                    <td className="p-4 text-right font-black text-slate-900">{formatarMoeda(conta.valor)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${classeStatus(conta)}`}>
                        {statusVisual(conta)}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-600">
                      {conta.data_recebimento ? formatarDataHora(conta.data_recebimento) : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {!estaPaga(conta) && (
                          <button
                            onClick={() => abrirRecebimento(conta)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-black"
                          >
                            Receber
                          </button>
                        )}
                        <button
                          onClick={() => abrirWhatsapp(conta)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-black flex items-center gap-2"
                        >
                          <MessageCircle size={16} /> WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {contasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-500">
                      {carregando ? "Carregando..." : "Nenhuma conta encontrada."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {visualizacao === "creditos" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 lg:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Créditos do Cliente</h2>
              <p className="text-slate-500">{creditosFiltrados.length} movimentação(ões) encontrada(s)</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-black">
              <CreditCard size={18} /> Saldo atual: {formatarMoeda(saldoCreditos)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="p-4 text-left">Cliente</th>
                  <th className="p-4 text-left">Data</th>
                  <th className="p-4 text-left">Venda</th>
                  <th className="p-4 text-left">Origem</th>
                  <th className="p-4 text-left">Descrição</th>
                  <th className="p-4 text-right">Entrada</th>
                  <th className="p-4 text-right">Uso/Saída</th>
                  <th className="p-4 text-right">Saldo Após</th>
                  <th className="p-4 text-left">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {creditosFiltrados.map((credito) => {
                  const entrada = credito.tipo === "entrada" || credito.tipo === "ajuste";
                  const saida = credito.tipo === "saida" || credito.tipo === "uso";

                  return (
                    <tr key={credito.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-black text-slate-900">{clienteNome(credito.cliente_id)}</p>
                        <p className="text-xs text-slate-500">{clientePorId(credito.cliente_id)?.cpf_cnpj || "Sem documento"}</p>
                      </td>
                      <td className="p-4 text-slate-700 font-bold">{formatarDataHora(credito.created_at)}</td>
                      <td className="p-4 font-black text-blue-700">#{numeroVendaCredito(credito)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${entrada ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {credito.origem || credito.tipo || "-"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700">{credito.descricao || "-"}</td>
                      <td className="p-4 text-right font-black text-emerald-700">{entrada ? formatarMoeda(Number(credito.valor || 0)) : "-"}</td>
                      <td className="p-4 text-right font-black text-red-700">{saida ? formatarMoeda(Number(credito.valor || 0)) : "-"}</td>
                      <td className="p-4 text-right font-black text-blue-700">{formatarMoeda(Number(credito.saldo_apos || 0))}</td>
                      <td className="p-4 text-slate-700">{credito.usuario || "-"}</td>
                    </tr>
                  );
                })}
                {creditosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-500">
                      Nenhuma movimentação de crédito encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalReceber && contaSelecionada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Receber Parcela</h2>
                <p className="text-slate-500">Venda #{numeroVenda(contaSelecionada)} • Parcela {parcelaTexto(contaSelecionada)}</p>
              </div>
              <button onClick={fecharModal} className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-900 text-white rounded-3xl p-5">
                <p className="text-slate-300 font-bold">VALOR DA PARCELA</p>
                <p className="text-4xl font-black mt-2">{formatarMoeda(contaSelecionada.valor)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Campo titulo="Valor recebido">
                  <input value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} className="input-contas text-right" />
                </Campo>
                <Campo titulo="Forma de pagamento">
                  <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="input-contas">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="transferencia">Transferência</option>
                    <option value="outros">Outros</option>
                  </select>
                </Campo>
              </div>

              <Campo titulo="Observação do recebimento">
                <textarea
                  value={observacaoRecebimento}
                  onChange={(e) => setObservacaoRecebimento(e.target.value)}
                  className="input-contas min-h-24"
                  placeholder="Ex.: pago no caixa, comprovante recebido, negociação..."
                />
              </Campo>

              <button onClick={confirmarRecebimento} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2">
                <CreditCard size={20} /> Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-contas {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 1rem;
          padding: 0.8rem 1rem;
          color: rgb(2 6 23);
          background: white;
          font-weight: 800;
          outline: none;
        }

        .input-contas:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
        }
      `}</style>
    </div>
  );
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-700 mb-2">{titulo}</label>
      {children}
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  detalhe,
  icone,
  cor,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: React.ReactNode;
  cor: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>
          <h2 className={`text-3xl font-black mt-2 ${cor}`}>{valor}</h2>
          <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
        </div>
        <div className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}>
          {icone}
        </div>
      </div>
    </div>
  );
}
