"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
};

type ContaReceber = {
  id: string;
  cliente_id: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string | null;
};

type ContaRelatorio = {
  id: string;
  cliente: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  situacao: "aberto" | "recebido" | "vencido" | "cancelado";
};

export default function RelatorioContasReceberPage() {
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contas, setContas] = useState<ContaRelatorio[]>([]);

  const [totalAberto, setTotalAberto] = useState(0);
  const [totalRecebido, setTotalRecebido] = useState(0);
  const [totalVencido, setTotalVencido] = useState(0);
  const [totalGeral, setTotalGeral] = useState(0);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function primeiroDiaMesISO() {
    const hoje = new Date();

    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  }

  function formatarDataBR(data: string) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function prepararDatas() {
    const inicio = dataInicial || primeiroDiaMesISO();
    const fim = dataFinal || hojeISO();

    return { inicio, fim };
  }

  function nomeCliente(clienteId: string | null, listaClientes: Cliente[]) {
    if (!clienteId) return "Cliente não informado";

    const cliente = listaClientes.find((item) => item.id === clienteId);

    return cliente?.nome || "Cliente não encontrado";
  }

  function obterSituacao(conta: ContaReceber): ContaRelatorio["situacao"] {
    const status = String(conta.status || "").toLowerCase();

    if (status === "pago" || status === "recebido") {
      return "recebido";
    }

    if (status === "cancelado") {
      return "cancelado";
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(conta.vencimento + "T00:00:00");

    if (vencimento < hoje) {
      return "vencido";
    }

    return "aberto";
  }

  function statusTexto(situacao: ContaRelatorio["situacao"]) {
    if (situacao === "recebido") return "Recebido";
    if (situacao === "vencido") return "Vencido";
    if (situacao === "cancelado") return "Cancelado";
    return "Aberto";
  }

  function statusClasse(situacao: ContaRelatorio["situacao"]) {
    if (situacao === "recebido") return "bg-green-100 text-green-700";
    if (situacao === "vencido") return "bg-red-100 text-red-700";
    if (situacao === "cancelado") return "bg-slate-100 text-slate-700";
    return "bg-orange-100 text-orange-700";
  }

  async function carregarRelatorio() {
    const { inicio, fim } = prepararDatas();

    if (!dataInicial) setDataInicial(inicio);
    if (!dataFinal) setDataFinal(fim);

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome,cpf_cnpj,telefone")
      .order("nome");

    if (clientesReq.error) {
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      return;
    }

    const clientesData: Cliente[] = clientesReq.data || [];
    setClientes(clientesData);

    const contasReq = await supabase
      .from("contas_receber")
      .select("id,cliente_id,descricao,valor,vencimento,status")
      .gte("vencimento", inicio)
      .lte("vencimento", fim)
      .order("vencimento", { ascending: true });

    if (contasReq.error) {
      alert("Erro ao carregar contas a receber: " + contasReq.error.message);
      return;
    }

    const contasData: ContaReceber[] = contasReq.data || [];

    const lista = contasData
      .map((conta) => {
        const situacao = obterSituacao(conta);

        return {
          id: conta.id,
          cliente: nomeCliente(conta.cliente_id, clientesData),
          descricao: conta.descricao || "Conta a receber",
          valor: Number(conta.valor || 0),
          vencimento: conta.vencimento,
          situacao,
          status: statusTexto(situacao),
        };
      })
      .filter((conta) => {
        if (filtroStatus === "todos") return true;
        return conta.situacao === filtroStatus;
      });

    setContas(lista);

    setTotalAberto(
      lista
        .filter((item) => item.situacao === "aberto")
        .reduce((total, item) => total + Number(item.valor || 0), 0)
    );

    setTotalRecebido(
      lista
        .filter((item) => item.situacao === "recebido")
        .reduce((total, item) => total + Number(item.valor || 0), 0)
    );

    setTotalVencido(
      lista
        .filter((item) => item.situacao === "vencido")
        .reduce((total, item) => total + Number(item.valor || 0), 0)
    );

    setTotalGeral(
      lista.reduce((total, item) => total + Number(item.valor || 0), 0)
    );
  }

  function imprimirPdf() {
    window.print();
  }

  useEffect(() => {
    const inicio = primeiroDiaMesISO();
    const fim = hojeISO();

    setDataInicial(inicio);
    setDataFinal(fim);
  }, []);

  useEffect(() => {
    if (dataInicial && dataFinal) {
      carregarRelatorio();
    }
  }, [dataInicial, dataFinal, filtroStatus]);

  return (
    <div className="bg-slate-50 min-h-screen p-8 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            background: white !important;
          }

          aside,
          header,
          .no-print {
            display: none !important;
          }

          main {
            min-height: auto !important;
          }

          .documento-relatorio {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }

          .quebra-pagina {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Relatório de Contas a Receber
          </h1>

          <p className="text-slate-500">
            Relatório profissional de clientes, vencimentos e valores a receber.
          </p>
        </div>

        <button
          onClick={imprimirPdf}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-bold shadow-sm"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      <div className="no-print max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">
          Filtros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Data Inicial
            </label>

            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Data Final
            </label>

            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Status
            </label>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
            >
              <option value="todos">Todos</option>
              <option value="aberto">Abertos</option>
              <option value="recebido">Recebidos</option>
              <option value="vencido">Vencidos</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={carregarRelatorio}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="documento-relatorio max-w-5xl mx-auto bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b-4 border-blue-700 pb-5">
            <div className="flex items-center gap-4">
              <img
                src="/logo-thcloud-transparente.png"
                alt="THCloud"
                className="h-14 w-14 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/logo-thcloud.jpeg";
                }}
              />

              <div>
                <h2 className="text-2xl font-black text-blue-800">
                  THCloud
                </h2>

                <p className="text-sm text-slate-500 font-semibold">
                  ERP Inteligente
                </p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                CONTAS A RECEBER
              </h1>

              <p className="text-sm text-slate-500 font-semibold mt-1">
                Relatório Financeiro
              </p>
            </div>

            <div className="text-right text-xs text-slate-600">
              <p>
                <strong>Período:</strong> {formatarDataBR(dataInicial)} até{" "}
                {formatarDataBR(dataFinal)}
              </p>

              <p className="mt-1">
                <strong>Emissão:</strong>{" "}
                {new Date().toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 text-blue-800 font-black text-sm border-b border-slate-200">
                DADOS DA EMPRESA
              </div>

              <table className="w-full text-sm">
                <tbody>
                  <LinhaInfo titulo="Empresa" valor="TH Gestão" />
                  <LinhaInfo titulo="Sistema" valor="THCloud ERP" />
                  <LinhaInfo titulo="Site" valor="thcloud.com.br" />
                  <LinhaInfo titulo="Responsável" valor="Administrador" />
                </tbody>
              </table>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 text-blue-800 font-black text-sm border-b border-slate-200">
                DADOS DO RELATÓRIO
              </div>

              <table className="w-full text-sm">
                <tbody>
                  <LinhaInfo titulo="Relatório" valor="Contas a Receber" />
                  <LinhaInfo
                    titulo="Período"
                    valor={`${formatarDataBR(dataInicial)} até ${formatarDataBR(dataFinal)}`}
                  />
                  <LinhaInfo titulo="Filtro" valor={filtroStatus === "todos" ? "Todos" : filtroStatus} />
                  <LinhaInfo titulo="Registros" valor={`${contas.length} conta(s)`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard titulo="Total Geral" valor={moeda(totalGeral)} cor="text-blue-700" />
            <ResumoCard titulo="Em Aberto" valor={moeda(totalAberto)} cor="text-orange-700" />
            <ResumoCard titulo="Recebido" valor={moeda(totalRecebido)} cor="text-green-700" />
            <ResumoCard titulo="Vencido" valor={moeda(totalVencido)} cor="text-red-700" />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo do Relatório
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-right w-52">VALOR (R$)</th>
              </tr>
            </thead>

            <tbody>
              <LinhaResumo titulo="TOTAL GERAL" detalhe="Todas as contas filtradas" valor={totalGeral} tipo="normal" />
              <LinhaResumo titulo="EM ABERTO" detalhe="Contas ainda não recebidas" valor={totalAberto} tipo="alerta" />
              <LinhaResumo titulo="RECEBIDO" detalhe="Contas recebidas no período" valor={totalRecebido} tipo="entrada" />
              <LinhaResumo titulo="VENCIDO" detalhe="Contas vencidas e não recebidas" valor={totalVencido} tipo="saida" />
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Títulos a Receber
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">CLIENTE</th>
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-left">VENCIMENTO</th>
                <th className="p-3 text-left">STATUS</th>
                <th className="p-3 text-right">VALOR</th>
              </tr>
            </thead>

            <tbody>
              {contas.map((item, index) => (
                <tr
                  key={item.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-semibold">
                    {item.cliente}
                  </td>

                  <td className="p-3 text-slate-700">
                    {item.descricao}
                  </td>

                  <td className="p-3 text-slate-700">
                    {formatarDataBR(item.vencimento)}
                  </td>

                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusClasse(item.situacao)}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="p-3 text-right font-black text-blue-950">
                    {moeda(item.valor)}
                  </td>
                </tr>
              ))}

              {contas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Nenhuma conta a receber encontrada no período.
                  </td>
                </tr>
              )}
            </tbody>

            {contas.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td colSpan={4} className="p-3 text-right font-black text-slate-900">
                    TOTAL
                  </td>

                  <td className="p-3 text-right font-black text-blue-800">
                    {moeda(totalGeral)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="px-8 pb-6">
          <div className="border border-blue-300 rounded-xl p-4 flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-sm">
              i
            </div>

            <div>
              <p className="font-black text-blue-800">Observação</p>
              <p className="text-sm text-slate-700 mt-1">
                Relatório gerado automaticamente pelo sistema THCloud ERP com base nas contas
                a receber cadastradas dentro do período selecionado.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-300 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs text-slate-700">
            <div>
              <p className="font-bold text-slate-900">
                THCloud ERP - Sistema de Gestão Empresarial
              </p>
            </div>

            <div className="text-center">
              <p className="font-bold text-blue-700">www.thcloud.com.br</p>
            </div>

            <div className="text-right">
              <p>Página 1 de 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinhaInfo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <tr className="border-b last:border-b-0 border-slate-100">
      <td className="bg-slate-50 p-3 font-bold text-slate-800 w-32">
        {titulo}:
      </td>
      <td className="p-3 text-slate-800 font-medium">{valor}</td>
    </tr>
  );
}

function LinhaResumo({
  titulo,
  detalhe,
  valor,
  tipo,
}: {
  titulo: string;
  detalhe: string;
  valor: number;
  tipo: "normal" | "entrada" | "saida" | "alerta";
}) {
  return (
    <tr className="border-b border-slate-200">
      <td className="p-4">
        <p className="font-black text-slate-900">{titulo}</p>
        <p className="text-xs text-slate-500">{detalhe}</p>
      </td>

      <td
        className={`p-4 text-right font-black ${
          tipo === "entrada"
            ? "text-green-700"
            : tipo === "saida"
            ? "text-red-700"
            : tipo === "alerta"
            ? "text-orange-700"
            : "text-blue-950"
        }`}
      >
        {moedaInterno(valor)}
      </td>
    </tr>
  );
}

function ResumoCard({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
      <p className="text-sm font-semibold text-slate-600">{titulo}</p>
      <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
    </div>
  );
}

function moedaInterno(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
