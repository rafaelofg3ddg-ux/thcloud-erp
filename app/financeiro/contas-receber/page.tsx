"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  whatsapp: string | null;
};

type ContaReceber = {
  id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  descricao: string | null;
  valor: number;
  vencimento: string;
  status: string | null;
};

export default function ContasReceberPage() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [modalReceber, setModalReceber] = useState(false);
  const [contaSelecionada, setContaSelecionada] =
    useState<ContaReceber | null>(null);

  const [valorRecebido, setValorRecebido] = useState("0,00");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function clienteNome(clienteId: string | null) {
    if (!clienteId) return "-";
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente ? cliente.nome : "-";
  }

  function clienteWhatsapp(clienteId: string | null) {
    if (!clienteId) return "";
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente?.whatsapp || "";
  }

  function estaVencida(conta: ContaReceber) {
    if (conta.status === "pago") return false;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(conta.vencimento + "T00:00:00");
    return vencimento < hoje;
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome,cpf_cnpj,whatsapp")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (clientesReq.error) {
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      return;
    }

    setClientes(clientesReq.data || []);

    const contasReq = await supabase
      .from("contas_receber")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("vencimento", { ascending: true });

    if (contasReq.error) {
      alert("Erro ao carregar contas a receber: " + contasReq.error.message);
      return;
    }

    setContas(contasReq.data || []);
  }

  function abrirRecebimento(conta: ContaReceber) {
    setContaSelecionada(conta);
    setValorRecebido(String(Number(conta.valor || 0).toFixed(2)).replace(".", ","));
    setFormaPagamento("dinheiro");
    setModalReceber(true);
  }

  function fecharModal() {
    setModalReceber(false);
    setContaSelecionada(null);
    setValorRecebido("0,00");
    setFormaPagamento("dinheiro");
  }

  async function confirmarRecebimento() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!contaSelecionada) return;

    const valor = converterNumero(valorRecebido);

    if (isNaN(valor) || valor <= 0) {
      alert("Informe um valor recebido válido.");
      return;
    }

    if (valor < Number(contaSelecionada.valor)) {
      alert(
        "Neste primeiro momento, vamos trabalhar com baixa total. Informe o valor total da parcela."
      );
      return;
    }

    const { error } = await supabase
      .from("contas_receber")
      .update({
        status: "pago",
      })
      .eq("id", contaSelecionada.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao receber conta: " + error.message);
      return;
    }

    alert("Conta recebida com sucesso!");

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

    const mensagem = `Olá, ${clienteNome(
      conta.cliente_id
    )}. Identificamos uma parcela em aberto no valor de ${formatarMoeda(
      Number(conta.valor)
    )}, com vencimento em ${formatarData(
      conta.vencimento
    )}. Por favor, entre em contato para regularização.`;

    const link = `https://wa.me/55${numero}?text=${encodeURIComponent(
      mensagem
    )}`;

    window.open(link, "_blank");
  }

  const contasFiltradas = contas.filter((conta) => {
    const texto = pesquisa.toLowerCase();

    const nome = clienteNome(conta.cliente_id).toLowerCase();
    const descricao = String(conta.descricao || "").toLowerCase();

    const passouPesquisa =
      nome.includes(texto) || descricao.includes(texto);

    if (!passouPesquisa) return false;

    if (filtroStatus === "todos") return true;

    if (filtroStatus === "aberto") {
      return conta.status !== "pago" && !estaVencida(conta);
    }

    if (filtroStatus === "vencido") {
      return estaVencida(conta);
    }

    if (filtroStatus === "pago") {
      return conta.status === "pago";
    }

    return true;
  });

  const totalAberto = contas
    .filter((conta) => conta.status !== "pago" && !estaVencida(conta))
    .reduce((total, conta) => total + Number(conta.valor || 0), 0);

  const totalVencido = contas
    .filter((conta) => estaVencida(conta))
    .reduce((total, conta) => total + Number(conta.valor || 0), 0);

  const totalPago = contas
    .filter((conta) => conta.status === "pago")
    .reduce((total, conta) => total + Number(conta.valor || 0), 0);

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Contas a Receber
          </h1>
          <p className="text-slate-600 mt-1">
            Controle de crediário, parcelas, cobranças e recebimentos por empresa
          </p>
        </div>

        <div className="w-24 h-16 bg-slate-900 rounded-xl flex items-center justify-center">
          <img
            src="/logo-thcloud.jpeg"
            alt="THCloud"
            className="max-h-14 max-w-20 object-contain"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-5 border border-slate-200">
          <p className="text-slate-500 text-sm">Em Aberto</p>
          <h2 className="text-3xl font-bold text-blue-700">
            {formatarMoeda(totalAberto)}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border border-slate-200">
          <p className="text-slate-500 text-sm">Vencido</p>
          <h2 className="text-3xl font-bold text-red-600">
            {formatarMoeda(totalVencido)}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border border-slate-200">
          <p className="text-slate-500 text-sm">Recebido</p>
          <h2 className="text-3xl font-bold text-green-600">
            {formatarMoeda(totalPago)}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Parcelas e Títulos
          </h2>

          <div className="flex gap-3">
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar cliente ou descrição..."
              className="border border-slate-300 p-3 rounded-lg w-80 text-slate-900"
            />

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-slate-300 p-3 rounded-lg text-slate-900 bg-white"
            >
              <option value="todos">Todos</option>
              <option value="aberto">Em aberto</option>
              <option value="vencido">Vencidos</option>
              <option value="pago">Pagos</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left">Vencimento</th>
                <th className="p-3 text-left">Valor</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {contasFiltradas.map((conta) => {
                const vencida = estaVencida(conta);
                const pago = conta.status === "pago";

                return (
                  <tr key={conta.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-slate-900 font-medium">
                      {clienteNome(conta.cliente_id)}
                    </td>

                    <td className="p-3 text-slate-800">
                      {conta.descricao || "-"}
                    </td>

                    <td className="p-3 text-slate-800">
                      {formatarData(conta.vencimento)}
                    </td>

                    <td className="p-3 text-slate-800 font-semibold">
                      {formatarMoeda(Number(conta.valor))}
                    </td>

                    <td className="p-3">
                      {pago ? (
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                          Pago
                        </span>
                      ) : vencida ? (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                          Vencido
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                          Aberto
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        {!pago && (
                          <button
                            onClick={() => abrirRecebimento(conta)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                          >
                            Receber
                          </button>
                        )}

                        {!pago && (
                          <button
                            onClick={() => abrirWhatsapp(conta)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded"
                          >
                            WhatsApp
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {contasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-700">
                    Nenhuma conta encontrada para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalReceber && contaSelecionada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Receber Parcela
            </h2>

            <div className="space-y-3 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-sm text-slate-500">Cliente</p>
                <p className="font-semibold text-slate-900">
                  {clienteNome(contaSelecionada.cliente_id)}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-sm text-slate-500">Descrição</p>
                <p className="font-semibold text-slate-900">
                  {contaSelecionada.descricao || "-"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-sm text-slate-500">Valor</p>
                  <p className="font-semibold text-slate-900">
                    {formatarMoeda(Number(contaSelecionada.valor))}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-sm text-slate-500">Vencimento</p>
                  <p className="font-semibold text-slate-900">
                    {formatarData(contaSelecionada.vencimento)}
                  </p>
                </div>
              </div>

              <input
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder="Valor recebido"
                className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
              />

              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 bg-white"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="debito">Cartão Débito</option>
                <option value="credito">Cartão Crédito</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={fecharModal} className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-3 rounded-lg">
                Cancelar
              </button>

              <button onClick={confirmarRecebimento} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg">
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
