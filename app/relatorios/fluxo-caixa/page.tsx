"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type Venda = {
  id: string;
  valor_total: number | null;
  status: string | null;
  forma_pagamento: string | null;
  created_at: string | null;
};

type ContaReceber = {
  id: string;
  descricao: string | null;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
};

type ContaPagar = {
  id: string;
  descricao: string | null;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
  data_pagamento: string | null;
};

type Movimento = {
  data: string;
  tipo: "Entrada" | "Saída";
  descricao: string;
  forma: string;
  valor: number;
};

export default function RelatorioFluxoCaixaPage() {
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [contasReceberAberto, setContasReceberAberto] = useState(0);
  const [contasPagarAberto, setContasPagarAberto] = useState(0);

  const [movimentos, setMovimentos] = useState<Movimento[]>([]);

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

  function formatarDataBR(data: string | null) {
    if (!data) return "-";
    if (data.includes("T")) return new Date(data).toLocaleDateString("pt-BR");
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function prepararDatas() {
    const inicio = dataInicial || primeiroDiaMesISO();
    const fim = dataFinal || hojeISO();

    return {
      inicio,
      fim,
      inicioISO: new Date(inicio + "T00:00:00").toISOString(),
      fimISO: new Date(fim + "T23:59:59").toISOString(),
    };
  }

  function statusAberto(status: string | null) {
    const texto = String(status || "").toLowerCase();
    return texto !== "pago" && texto !== "recebido" && texto !== "cancelado";
  }

  async function carregarRelatorio() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    const { inicio, fim, inicioISO, fimISO } = prepararDatas();

    if (!dataInicial) setDataInicial(inicio);
    if (!dataFinal) setDataFinal(fim);

    const vendasReq = await supabase
      .from("vendas")
      .select("id,valor_total,status,forma_pagamento,created_at")
      .eq("empresa_id", empresaId)
      .eq("status", "finalizada")
      .gte("created_at", inicioISO)
      .lte("created_at", fimISO)
      .order("created_at", { ascending: false });

    if (vendasReq.error) {
      alert("Erro ao carregar vendas: " + vendasReq.error.message);
      return;
    }

    const pagarReq = await supabase
      .from("contas_pagar")
      .select("id,descricao,valor,vencimento,status,data_pagamento")
      .eq("empresa_id", empresaId)
      .gte("vencimento", inicio)
      .lte("vencimento", fim)
      .order("vencimento", { ascending: false });

    if (pagarReq.error) {
      alert("Erro ao carregar contas a pagar: " + pagarReq.error.message);
      return;
    }

    const receberReq = await supabase
      .from("contas_receber")
      .select("id,descricao,valor,vencimento,status")
      .eq("empresa_id", empresaId)
      .gte("vencimento", inicio)
      .lte("vencimento", fim)
      .order("vencimento", { ascending: false });

    if (receberReq.error) {
      alert("Erro ao carregar contas a receber: " + receberReq.error.message);
      return;
    }

    const vendas: Venda[] = vendasReq.data || [];
    const pagar: ContaPagar[] = pagarReq.data || [];
    const receber: ContaReceber[] = receberReq.data || [];

    const totalEntradas = vendas.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0
    );

    const despesasPagas = pagar.filter(
      (conta) => String(conta.status || "").toLowerCase() === "pago"
    );

    const totalSaidas = despesasPagas.reduce(
      (total, conta) => total + Number(conta.valor || 0),
      0
    );

    const abertoReceber = receber
      .filter((conta) => statusAberto(conta.status))
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const abertoPagar = pagar
      .filter((conta) => statusAberto(conta.status))
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const listaMovimentos: Movimento[] = [
      ...vendas.map((venda) => ({
        data: venda.created_at || "",
        tipo: "Entrada" as const,
        descricao: "Venda finalizada",
        forma: venda.forma_pagamento || "-",
        valor: Number(venda.valor_total || 0),
      })),
      ...despesasPagas.map((conta) => ({
        data: conta.data_pagamento || conta.vencimento || "",
        tipo: "Saída" as const,
        descricao: conta.descricao || "Conta paga",
        forma: "Despesa",
        valor: Number(conta.valor || 0),
      })),
    ].sort((a, b) => {
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });

    setEntradas(totalEntradas);
    setSaidas(totalSaidas);
    setSaldo(totalEntradas - totalSaidas);
    setContasReceberAberto(abertoReceber);
    setContasPagarAberto(abertoPagar);
    setMovimentos(listaMovimentos);
  }

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "FLUXO DE CAIXA",
      ["Data", "Tipo", "Descrição", "Forma", "Valor"],
      movimentos.map((item) => [
        formatarDataBR(item.data),
        item.tipo,
        item.descricao,
        item.forma,
        moeda(item.valor),
      ])
    );
  }

  useEffect(() => {
    setDataInicial(primeiroDiaMesISO());
    setDataFinal(hojeISO());
  }, []);

  useEffect(() => {
    if (dataInicial && dataFinal) {
      carregarRelatorio();
    }
  }, [dataInicial, dataFinal]);

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

          aside,
          header,
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          .documento-relatorio {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="no-print max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Fluxo de Caixa
          </h1>
          <p className="text-slate-500">
            Entradas, saídas, saldo e contas em aberto.
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
        <h2 className="text-xl font-black text-slate-900 mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <h2 className="text-2xl font-black text-blue-800">THCloud</h2>
                <p className="text-sm text-slate-500 font-semibold">
                  Gestão Inteligente
                </p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                FLUXO DE CAIXA
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
                <strong>Emissão:</strong> {new Date().toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <BoxInfo titulo="DADOS DA EMPRESA">
              <LinhaInfo titulo="Empresa" valor="TH Gestão" />
              <LinhaInfo titulo="Sistema" valor="Th Cloud" />
              <LinhaInfo titulo="Site" valor="thcloud.com.br" />
              <LinhaInfo titulo="Responsável" valor="Administrador" />
            </BoxInfo>

            <BoxInfo titulo="DADOS DO RELATÓRIO">
              <LinhaInfo titulo="Relatório" valor="Fluxo de Caixa" />
              <LinhaInfo
                titulo="Período"
                valor={`${formatarDataBR(dataInicial)} até ${formatarDataBR(
                  dataFinal
                )}`}
              />
              <LinhaInfo titulo="Movimentos" valor={`${movimentos.length}`} />
              <LinhaInfo titulo="Saldo" valor={moeda(saldo)} />
            </BoxInfo>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard titulo="Entradas" valor={moeda(entradas)} cor="text-green-700" />
            <ResumoCard titulo="Saídas" valor={moeda(saidas)} cor="text-red-700" />
            <ResumoCard titulo="Saldo" valor={moeda(saldo)} cor={saldo >= 0 ? "text-blue-700" : "text-red-700"} />
            <ResumoCard titulo="A Receber" valor={moeda(contasReceberAberto)} cor="text-purple-700" />
          </div>
        </div>

        <div className="px-8 pb-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo Financeiro
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">INDICADOR</th>
                <th className="p-3 text-right w-52">VALOR</th>
              </tr>
            </thead>

            <tbody>
              <LinhaResumo titulo="ENTRADAS" detalhe="Vendas finalizadas no período" valor={moeda(entradas)} cor="text-green-700" />
              <LinhaResumo titulo="SAÍDAS" detalhe="Contas pagas no período" valor={moeda(saidas)} cor="text-red-700" />
              <LinhaResumo titulo="SALDO DO PERÍODO" detalhe="Entradas menos saídas" valor={moeda(saldo)} cor={saldo >= 0 ? "text-blue-700" : "text-red-700"} />
              <LinhaResumo titulo="CONTAS A RECEBER EM ABERTO" detalhe="Títulos ainda não recebidos" valor={moeda(contasReceberAberto)} cor="text-purple-700" />
              <LinhaResumo titulo="CONTAS A PAGAR EM ABERTO" detalhe="Despesas ainda não pagas" valor={moeda(contasPagarAberto)} cor="text-orange-700" />
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Movimentações
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DATA</th>
                <th className="p-3 text-left">TIPO</th>
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-left">FORMA</th>
                <th className="p-3 text-right">VALOR</th>
              </tr>
            </thead>

            <tbody>
              {movimentos.map((item, index) => (
                <tr
                  key={`${item.data}-${item.tipo}-${index}`}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                >
                  <td className="p-3">{formatarDataBR(item.data)}</td>
                  <td className={`p-3 font-black ${item.tipo === "Entrada" ? "text-green-700" : "text-red-700"}`}>
                    {item.tipo}
                  </td>
                  <td className="p-3">{item.descricao}</td>
                  <td className="p-3">{item.forma}</td>
                  <td className={`p-3 text-right font-black ${item.tipo === "Entrada" ? "text-green-700" : "text-red-700"}`}>
                    {moeda(item.valor)}
                  </td>
                </tr>
              ))}

              {movimentos.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Nenhuma movimentação encontrada no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Rodape />
      </div>
    </div>
  );
}

function BoxInfo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-100 px-4 py-3 text-blue-800 font-black text-sm border-b border-slate-200">
        {titulo}
      </div>
      <table className="w-full text-sm">
        <tbody>{children}</tbody>
      </table>
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
  cor,
}: {
  titulo: string;
  detalhe: string;
  valor: string;
  cor: string;
}) {
  return (
    <tr className="border-b border-slate-200">
      <td className="p-4">
        <p className="font-black text-slate-900">{titulo}</p>
        <p className="text-xs text-slate-500">{detalhe}</p>
      </td>
      <td className={`p-4 text-right font-black ${cor}`}>{valor}</td>
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

function Rodape() {
  return (
    <div className="px-8 py-5 border-t border-slate-300 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs text-slate-700">
        <div>
          <p className="font-bold text-slate-900">
            Th Cloud - Sistema de Gestão
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
  );
}
