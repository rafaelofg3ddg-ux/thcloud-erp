"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type Cliente = {
  id: string;
  nome: string;
};

type Venda = {
  id: string;
  cliente_id: string | null;
  valor_total: number | null;
  desconto: number | null;
  forma_pagamento: string | null;
  status: string | null;
  created_at: string | null;
};

type PagamentoVenda = {
  id: string;
  venda_id: string | null;
  forma_pagamento: string | null;
  valor: number | null;
  created_at: string | null;
};

type VendaRelatorio = {
  id: string;
  cliente: string;
  data: string;
  valor_total: number;
  desconto: number;
  status: string;
  forma_pagamento: string;
  pagamentos: string;
};

type PagamentoResumo = {
  forma: string;
  quantidade: number;
  valor: number;
  percentual: number;
};

type VendaDia = {
  data: string;
  quantidade: number;
  valor: number;
};

export default function RelatorioVendasPeriodoPage() {
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("finalizada");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  const [vendas, setVendas] = useState<VendaRelatorio[]>([]);
  const [pagamentosResumo, setPagamentosResumo] = useState<PagamentoResumo[]>([]);
  const [vendasPorDia, setVendasPorDia] = useState<VendaDia[]>([]);

  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [descontoTotal, setDescontoTotal] = useState(0);
  const [quantidadeVendas, setQuantidadeVendas] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [maiorVenda, setMaiorVenda] = useState(0);

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

  function formatarDataHora(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarDataAgrupamento(data: string | null) {
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

  function nomeCliente(clienteId: string | null, clientes: Cliente[]) {
    if (!clienteId) return "Consumidor Final";

    const cliente = clientes.find((item) => item.id === clienteId);

    return cliente?.nome || "Cliente não encontrado";
  }

  function statusClasse(status: string) {
    const texto = String(status || "").toLowerCase();

    if (texto === "finalizada") return "bg-green-100 text-green-700";
    if (texto === "cancelada" || texto === "cancelado") {
      return "bg-red-100 text-red-700";
    }
    if (texto === "aberta" || texto === "aberto") {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-slate-100 text-slate-700";
  }

  function pagamentosDaVenda(vendaId: string, pagamentos: PagamentoVenda[]) {
    const lista = pagamentos.filter((pagamento) => pagamento.venda_id === vendaId);

    if (lista.length === 0) return "-";

    return lista
      .map((pagamento) => {
        return `${pagamento.forma_pagamento || "Pagamento"}: ${moeda(
          Number(pagamento.valor || 0)
        )}`;
      })
      .join(" | ");
  }

  function gerarResumoPagamentos(pagamentos: PagamentoVenda[], total: number) {
    const mapa = new Map<
      string,
      {
        quantidade: number;
        valor: number;
      }
    >();

    pagamentos.forEach((pagamento) => {
      const forma = pagamento.forma_pagamento || "Não informado";

      const atual = mapa.get(forma) || {
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += 1;
      atual.valor += Number(pagamento.valor || 0);

      mapa.set(forma, atual);
    });

    const lista: PagamentoResumo[] = Array.from(mapa.entries()).map(
      ([forma, dados]) => {
        return {
          forma,
          quantidade: dados.quantidade,
          valor: dados.valor,
          percentual: total > 0 ? (dados.valor / total) * 100 : 0,
        };
      }
    );

    lista.sort((a, b) => b.valor - a.valor);

    setPagamentosResumo(lista);
  }

  function gerarVendasPorDia(lista: VendaRelatorio[]) {
    const mapa = new Map<
      string,
      {
        quantidade: number;
        valor: number;
      }
    >();

    lista.forEach((venda) => {
      const dia = formatarDataAgrupamento(venda.data);

      const atual = mapa.get(dia) || {
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += 1;
      atual.valor += Number(venda.valor_total || 0);

      mapa.set(dia, atual);
    });

    const agrupado: VendaDia[] = Array.from(mapa.entries()).map(
      ([data, dados]) => {
        return {
          data,
          quantidade: dados.quantidade,
          valor: dados.valor,
        };
      }
    );

    setVendasPorDia(agrupado);
  }

  function zerarResumo() {
    setVendas([]);
    setPagamentosResumo([]);
    setVendasPorDia([]);
    setFaturamentoTotal(0);
    setDescontoTotal(0);
    setQuantidadeVendas(0);
    setTicketMedio(0);
    setMaiorVenda(0);
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

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (clientesReq.error) {
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      return;
    }

    const clientes: Cliente[] = clientesReq.data || [];

    let vendasQuery = supabase
      .from("vendas")
      .select("id,cliente_id,valor_total,desconto,forma_pagamento,status,created_at")
      .eq("empresa_id", empresaId)
      .gte("created_at", inicioISO)
      .lte("created_at", fimISO)
      .order("created_at", { ascending: false });

    if (filtroStatus !== "todos") {
      vendasQuery = vendasQuery.eq("status", filtroStatus);
    }

    const vendasReq = await vendasQuery;

    if (vendasReq.error) {
      alert("Erro ao carregar vendas: " + vendasReq.error.message);
      return;
    }

    const vendasData: Venda[] = vendasReq.data || [];

    const vendaIds = vendasData.map((venda) => venda.id);

    let pagamentos: PagamentoVenda[] = [];

    if (vendaIds.length > 0) {
      const pagamentosReq = await supabase
        .from("pagamentos_venda")
        .select("id,venda_id,forma_pagamento,valor,created_at")
        .in("venda_id", vendaIds);

      if (pagamentosReq.error) {
        alert("Erro ao carregar pagamentos: " + pagamentosReq.error.message);
        return;
      }

      pagamentos = pagamentosReq.data || [];
    }

    const lista: VendaRelatorio[] = vendasData.map((venda) => {
      return {
        id: venda.id,
        cliente: nomeCliente(venda.cliente_id, clientes),
        data: venda.created_at || "",
        valor_total: Number(venda.valor_total || 0),
        desconto: Number(venda.desconto || 0),
        status: venda.status || "-",
        forma_pagamento: venda.forma_pagamento || "-",
        pagamentos: pagamentosDaVenda(venda.id, pagamentos),
      };
    });

    const total = lista.reduce(
      (soma, venda) => soma + Number(venda.valor_total || 0),
      0
    );

    const desconto = lista.reduce(
      (soma, venda) => soma + Number(venda.desconto || 0),
      0
    );

    const maior = lista.reduce((maiorValor, venda) => {
      return Number(venda.valor_total || 0) > maiorValor
        ? Number(venda.valor_total || 0)
        : maiorValor;
    }, 0);

    setVendas(lista);
    setFaturamentoTotal(total);
    setDescontoTotal(desconto);
    setQuantidadeVendas(lista.length);
    setTicketMedio(lista.length > 0 ? total / lista.length : 0);
    setMaiorVenda(maior);

    gerarResumoPagamentos(pagamentos, total);
    gerarVendasPorDia(lista);
  }

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "VENDAS POR PERÍODO",
      ["Data", "Cliente", "Status", "Forma", "Pagamentos", "Desconto", "Total"],
      vendas.map((item) => [
        formatarDataHora(item.data),
        item.cliente,
        item.status,
        item.forma_pagamento,
        item.pagamentos,
        moeda(item.desconto),
        moeda(item.valor_total),
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
            Relatório de Vendas por Período
          </h1>

          <p className="text-slate-500">
            Faturamento, ticket médio, vendas por dia e formas de pagamento.
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
              Status
            </label>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
            >
              <option value="todos">Todos</option>
              <option value="finalizada">Finalizadas</option>
              <option value="cancelada">Canceladas</option>
              <option value="aberta">Abertas</option>
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
                VENDAS POR PERÍODO
              </h1>

              <p className="text-sm text-slate-500 font-semibold mt-1">
                Relatório Comercial
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
                  <LinhaInfo titulo="Sistema" valor="THCloud ERP" />
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
                  <LinhaInfo titulo="Relatório" valor="Vendas por Período" />
                  <LinhaInfo
                    titulo="Período"
                    valor={`${formatarDataBR(dataInicial)} até ${formatarDataBR(
                      dataFinal
                    )}`}
                  />
                  <LinhaInfo titulo="Status" valor={filtroStatus} />
                  <LinhaInfo titulo="Vendas" valor={`${quantidadeVendas}`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard
              titulo="Faturamento"
              valor={moeda(faturamentoTotal)}
              cor="text-green-700"
            />
            <ResumoCard
              titulo="Vendas"
              valor={`${quantidadeVendas}`}
              cor="text-blue-700"
            />
            <ResumoCard
              titulo="Ticket Médio"
              valor={moeda(ticketMedio)}
              cor="text-purple-700"
            />
            <ResumoCard
              titulo="Maior Venda"
              valor={moeda(maiorVenda)}
              cor="text-orange-700"
            />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo Comercial
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-right w-52">TOTAL</th>
              </tr>
            </thead>

            <tbody>
              <LinhaResumo
                titulo="FATURAMENTO TOTAL"
                detalhe="Soma das vendas no período"
                valor={moeda(faturamentoTotal)}
                cor="text-green-700"
              />
              <LinhaResumo
                titulo="DESCONTOS"
                detalhe="Total de descontos aplicados"
                valor={moeda(descontoTotal)}
                cor="text-red-700"
              />
              <LinhaResumo
                titulo="QUANTIDADE DE VENDAS"
                detalhe="Número de vendas encontradas"
                valor={`${quantidadeVendas}`}
                cor="text-blue-950"
              />
              <LinhaResumo
                titulo="TICKET MÉDIO"
                detalhe="Faturamento dividido pela quantidade de vendas"
                valor={moeda(ticketMedio)}
                cor="text-purple-700"
              />
              <LinhaResumo
                titulo="MAIOR VENDA"
                detalhe="Maior valor registrado no período"
                valor={moeda(maiorVenda)}
                cor="text-orange-700"
              />
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Vendas por Dia
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DATA</th>
                <th className="p-3 text-right">VENDAS</th>
                <th className="p-3 text-right">FATURAMENTO</th>
                <th className="p-3 text-right">TICKET MÉDIO</th>
              </tr>
            </thead>

            <tbody>
              {vendasPorDia.map((item, index) => (
                <tr
                  key={`${item.data}-${index}`}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-semibold">
                    {item.data}
                  </td>

                  <td className="p-3 text-right font-black text-blue-700">
                    {numero(item.quantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-green-700">
                    {moeda(item.valor)}
                  </td>

                  <td className="p-3 text-right text-purple-700 font-bold">
                    {moeda(item.quantidade > 0 ? item.valor / item.quantidade : 0)}
                  </td>
                </tr>
              ))}

              {vendasPorDia.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    Nenhuma venda encontrada no período para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Formas de Pagamento
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">FORMA</th>
                <th className="p-3 text-right">QTD.</th>
                <th className="p-3 text-right">VALOR</th>
                <th className="p-3 text-right">%</th>
              </tr>
            </thead>

            <tbody>
              {pagamentosResumo.map((item, index) => (
                <tr
                  key={`${item.forma}-${index}`}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-semibold">
                    {item.forma}
                  </td>

                  <td className="p-3 text-right text-slate-700 font-bold">
                    {numero(item.quantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-blue-950">
                    {moeda(item.valor)}
                  </td>

                  <td className="p-3 text-right text-purple-700 font-bold">
                    {item.percentual.toFixed(2)}%
                  </td>
                </tr>
              ))}

              {pagamentosResumo.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    Nenhum pagamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Vendas Detalhadas
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DATA</th>
                <th className="p-3 text-left">CLIENTE</th>
                <th className="p-3 text-left">STATUS</th>
                <th className="p-3 text-left">PAGAMENTO</th>
                <th className="p-3 text-right">DESCONTO</th>
                <th className="p-3 text-right">VALOR</th>
              </tr>
            </thead>

            <tbody>
              {vendas.map((venda, index) => (
                <tr
                  key={venda.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-700">
                    {formatarDataHora(venda.data)}
                  </td>

                  <td className="p-3 text-slate-900 font-semibold">
                    {venda.cliente}
                  </td>

                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusClasse(venda.status)}`}>
                      {venda.status}
                    </span>
                  </td>

                  <td className="p-3 text-slate-700">
                    {venda.pagamentos !== "-"
                      ? venda.pagamentos
                      : venda.forma_pagamento}
                  </td>

                  <td className="p-3 text-right text-red-700 font-bold">
                    {moeda(venda.desconto)}
                  </td>

                  <td className="p-3 text-right font-black text-blue-950">
                    {moeda(venda.valor_total)}
                  </td>
                </tr>
              ))}

              {vendas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhuma venda encontrada no período para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>

            {vendas.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td colSpan={4} className="p-3 text-right font-black text-slate-900">
                    TOTAIS
                  </td>

                  <td className="p-3 text-right font-black text-red-700">
                    {moeda(descontoTotal)}
                  </td>

                  <td className="p-3 text-right font-black text-blue-800">
                    {moeda(faturamentoTotal)}
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
                Relatório gerado automaticamente pelo THCloud ERP com base nas vendas
                cadastradas da empresa logada e nos pagamentos vinculados ao período
                selecionado.
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

      <td className={`p-4 text-right font-black ${cor}`}>
        {valor}
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
