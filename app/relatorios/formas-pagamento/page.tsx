"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type PagamentoVenda = {
  id: string;
  venda_id: string | null;
  forma_pagamento: string | null;
  valor: number | null;
  created_at: string | null;
};

type Venda = {
  id: string;
  status: string | null;
  created_at: string | null;
};

type FormaResumo = {
  forma: string;
  quantidade: number;
  valor: number;
  percentual: number;
  ticket_medio: number;
};

type FormaDia = {
  data: string;
  forma: string;
  quantidade: number;
  valor: number;
};

export default function FormasPagamentoPage() {
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [filtroForma, setFiltroForma] = useState("todas");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  const [resumo, setResumo] = useState<FormaResumo[]>([]);
  const [detalhado, setDetalhado] = useState<FormaDia[]>([]);
  const [formasDisponiveis, setFormasDisponiveis] = useState<string[]>([]);

  const [totalRecebido, setTotalRecebido] = useState(0);
  const [totalPagamentos, setTotalPagamentos] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [maiorForma, setMaiorForma] = useState("-");

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR");
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

  function formatarDataPagamento(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function prepararDatas() {
    const inicio = dataInicial || primeiroDiaMesISO();
    const fim = dataFinal || hojeISO();

    const inicioISO = new Date(inicio + "T00:00:00").toISOString();
    const fimISO = new Date(fim + "T23:59:59").toISOString();

    return {
      inicio,
      fim,
      inicioISO,
      fimISO,
    };
  }

  function normalizarForma(forma: string | null) {
    if (!forma || String(forma).trim() === "") return "Não informado";
    return forma;
  }

  function zerarResumo() {
    setResumo([]);
    setDetalhado([]);
    setFormasDisponiveis([]);
    setTotalRecebido(0);
    setTotalPagamentos(0);
    setTicketMedio(0);
    setMaiorForma("-");
  }

  async function carregarRelatorio() {
    const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
    const empresaId = usuario.empresa_id;

    setEmpresaNome(usuario.empresa_nome || "Empresa");
    setUsuarioNome(usuario.nome || "Administrador");

    const { inicio, fim, inicioISO, fimISO } = prepararDatas();

    if (!dataInicial) setDataInicial(inicio);
    if (!dataFinal) setDataFinal(fim);

    if (!empresaId) {
      zerarResumo();
      return;
    }

    const vendasReq = await supabase
      .from("vendas")
      .select("id,status,created_at")
      .eq("empresa_id", empresaId)
      .eq("status", "finalizada")
      .gte("created_at", inicioISO)
      .lte("created_at", fimISO);

    if (vendasReq.error) {
      alert("Erro ao carregar vendas: " + vendasReq.error.message);
      return;
    }

    const vendas: Venda[] = vendasReq.data || [];
    const vendaIds = vendas.map((venda) => venda.id);

    if (vendaIds.length === 0) {
      zerarResumo();
      return;
    }

    const pagamentosReq = await supabase
      .from("pagamentos_venda")
      .select("id,venda_id,forma_pagamento,valor,created_at")
      .in("venda_id", vendaIds)
      .order("created_at", { ascending: true });

    if (pagamentosReq.error) {
      alert("Erro ao carregar pagamentos: " + pagamentosReq.error.message);
      return;
    }

    const pagamentos: PagamentoVenda[] = pagamentosReq.data || [];

    const formas = Array.from(
      new Set(
        pagamentos.map((pagamento) =>
          normalizarForma(pagamento.forma_pagamento)
        )
      )
    ).sort();

    setFormasDisponiveis(formas);

    const pagamentosFiltrados =
      filtroForma === "todas"
        ? pagamentos
        : pagamentos.filter(
            (pagamento) =>
              normalizarForma(pagamento.forma_pagamento) === filtroForma
          );

    const total = pagamentosFiltrados.reduce(
      (soma, pagamento) => soma + Number(pagamento.valor || 0),
      0
    );

    const mapaResumo = new Map<
      string,
      {
        quantidade: number;
        valor: number;
      }
    >();

    pagamentosFiltrados.forEach((pagamento) => {
      const forma = normalizarForma(pagamento.forma_pagamento);

      const atual = mapaResumo.get(forma) || {
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += 1;
      atual.valor += Number(pagamento.valor || 0);

      mapaResumo.set(forma, atual);
    });

    const resumoLista: FormaResumo[] = Array.from(mapaResumo.entries()).map(
      ([forma, dados]) => {
        return {
          forma,
          quantidade: dados.quantidade,
          valor: dados.valor,
          percentual: total > 0 ? (dados.valor / total) * 100 : 0,
          ticket_medio:
            dados.quantidade > 0 ? dados.valor / dados.quantidade : 0,
        };
      }
    );

    resumoLista.sort((a, b) => b.valor - a.valor);

    const mapaDia = new Map<
      string,
      {
        data: string;
        forma: string;
        quantidade: number;
        valor: number;
      }
    >();

    pagamentosFiltrados.forEach((pagamento) => {
      const data = formatarDataPagamento(pagamento.created_at);
      const forma = normalizarForma(pagamento.forma_pagamento);
      const chave = `${data}-${forma}`;

      const atual = mapaDia.get(chave) || {
        data,
        forma,
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += 1;
      atual.valor += Number(pagamento.valor || 0);

      mapaDia.set(chave, atual);
    });

    const detalhadoLista = Array.from(mapaDia.values()).sort((a, b) => {
      return a.data.localeCompare(b.data);
    });

    setResumo(resumoLista);
    setDetalhado(detalhadoLista);
    setTotalRecebido(total);
    setTotalPagamentos(pagamentosFiltrados.length);
    setTicketMedio(
      pagamentosFiltrados.length > 0 ? total / pagamentosFiltrados.length : 0
    );
    setMaiorForma(resumoLista[0]?.forma || "-");
  }

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "FORMAS DE PAGAMENTO",
      ["Forma", "Quantidade", "Valor", "Percentual", "Ticket Médio"],
      resumo.map((item) => [
        item.forma,
        numero(item.quantidade),
        moeda(item.valor),
        `${item.percentual.toFixed(2)}%`,
        moeda(item.ticket_medio),
      ])
    );
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
  }, [dataInicial, dataFinal, filtroForma]);

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
            Formas de Pagamento
          </h1>

          <p className="text-slate-500">
            Relatório de valores recebidos por dinheiro, Pix, cartão e demais
            formas.
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
              Forma
            </label>

            <select
              value={filtroForma}
              onChange={(e) => setFiltroForma(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
            >
              <option value="todas">Todas</option>

              {formasDisponiveis.map((forma) => (
                <option key={forma} value={forma}>
                  {forma}
                </option>
              ))}
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
                  Gestão Inteligente
                </p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                FORMAS DE PAGAMENTO
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
                  <LinhaInfo titulo="Empresa" valor={empresaNome} />
                  <LinhaInfo titulo="Sistema" valor="Th Cloud" />
                  <LinhaInfo titulo="Site" valor="thcloud.com.br" />
                  <LinhaInfo titulo="Responsável" valor={usuarioNome} />
                </tbody>
              </table>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 text-blue-800 font-black text-sm border-b border-slate-200">
                DADOS DO RELATÓRIO
              </div>

              <table className="w-full text-sm">
                <tbody>
                  <LinhaInfo titulo="Relatório" valor="Formas de Pagamento" />
                  <LinhaInfo
                    titulo="Período"
                    valor={`${formatarDataBR(dataInicial)} até ${formatarDataBR(
                      dataFinal
                    )}`}
                  />
                  <LinhaInfo
                    titulo="Forma"
                    valor={filtroForma === "todas" ? "Todas" : filtroForma}
                  />
                  <LinhaInfo titulo="Pagamentos" valor={`${totalPagamentos}`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard
              titulo="Total Recebido"
              valor={moeda(totalRecebido)}
              cor="text-green-700"
            />
            <ResumoCard
              titulo="Pagamentos"
              valor={`${totalPagamentos}`}
              cor="text-blue-700"
            />
            <ResumoCard
              titulo="Ticket Médio"
              valor={moeda(ticketMedio)}
              cor="text-purple-700"
            />
            <ResumoCard
              titulo="Maior Forma"
              valor={maiorForma}
              cor="text-orange-700"
            />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo por Forma
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">FORMA</th>
                <th className="p-3 text-right">QTD.</th>
                <th className="p-3 text-right">VALOR</th>
                <th className="p-3 text-right">TICKET</th>
                <th className="p-3 text-right">%</th>
              </tr>
            </thead>

            <tbody>
              {resumo.map((item, index) => (
                <tr
                  key={item.forma}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  } border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-semibold">
                    {item.forma}
                  </td>

                  <td className="p-3 text-right font-bold text-blue-700">
                    {numero(item.quantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-green-700">
                    {moeda(item.valor)}
                  </td>

                  <td className="p-3 text-right font-bold text-purple-700">
                    {moeda(item.ticket_medio)}
                  </td>

                  <td className="p-3 text-right font-bold text-orange-700">
                    {item.percentual.toFixed(2)}%
                  </td>
                </tr>
              ))}

              {resumo.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Nenhum pagamento encontrado no período para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>

            {resumo.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td className="p-3 text-right font-black text-slate-900">
                    TOTAL
                  </td>

                  <td className="p-3 text-right font-black text-blue-700">
                    {numero(totalPagamentos)}
                  </td>

                  <td className="p-3 text-right font-black text-green-700">
                    {moeda(totalRecebido)}
                  </td>

                  <td className="p-3 text-right font-black text-purple-700">
                    {moeda(ticketMedio)}
                  </td>

                  <td className="p-3 text-right font-black text-orange-700">
                    100%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Detalhamento por Dia
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DATA</th>
                <th className="p-3 text-left">FORMA</th>
                <th className="p-3 text-right">QTD.</th>
                <th className="p-3 text-right">VALOR</th>
              </tr>
            </thead>

            <tbody>
              {detalhado.map((item, index) => (
                <tr
                  key={`${item.data}-${item.forma}-${index}`}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  } border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-semibold">
                    {item.data}
                  </td>

                  <td className="p-3 text-slate-700">{item.forma}</td>

                  <td className="p-3 text-right font-bold text-blue-700">
                    {numero(item.quantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-green-700">
                    {moeda(item.valor)}
                  </td>
                </tr>
              ))}

              {detalhado.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    Nenhum detalhamento encontrado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
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
                Relatório gerado automaticamente pelo Th Cloud com base nos
                pagamentos vinculados às vendas finalizadas da empresa logada
                dentro do período selecionado.
              </p>
            </div>
          </div>
        </div>

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
