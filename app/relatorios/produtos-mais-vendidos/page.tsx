"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type Produto = {
  id: string;
  nome: string;
  codigo: string | null;
  unidade: string | null;
};

type Venda = {
  id: string;
  status: string | null;
  created_at: string | null;
};

type ItemVenda = {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
};

type ProdutoRanking = {
  produto_id: string;
  nome: string;
  codigo: string;
  unidade: string;
  quantidade: number;
  valor_total: number;
  ticket_medio: number;
  participacao: number;
};

export default function ProdutosMaisVendidosPage() {
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [limite, setLimite] = useState("todos");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  const [ranking, setRanking] = useState<ProdutoRanking[]>([]);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalQuantidade, setTotalQuantidade] = useState(0);
  const [totalFaturado, setTotalFaturado] = useState(0);
  const [ticketMedioGeral, setTicketMedioGeral] = useState(0);

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

  function posicaoEmoji(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}º`;
  }

  function zerarResumo() {
    setRanking([]);
    setTotalProdutos(0);
    setTotalQuantidade(0);
    setTotalFaturado(0);
    setTicketMedioGeral(0);
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

    const itensReq = await supabase
      .from("itens_venda")
      .select("id,venda_id,produto_id,quantidade,valor_unitario,subtotal")
      .in("venda_id", vendaIds);

    if (itensReq.error) {
      alert("Erro ao carregar itens da venda: " + itensReq.error.message);
      return;
    }

    const itens: ItemVenda[] = itensReq.data || [];

    const produtosReq = await supabase
      .from("produtos")
      .select("id,nome,codigo,unidade")
      .eq("empresa_id", empresaId);

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      return;
    }

    const produtos: Produto[] = produtosReq.data || [];
    const produtoIdsDaEmpresa = new Set(produtos.map((produto) => produto.id));

    const itensDaEmpresa = itens.filter((item) =>
      produtoIdsDaEmpresa.has(item.produto_id)
    );

    const agrupado = new Map<
      string,
      {
        quantidade: number;
        valor_total: number;
      }
    >();

    itensDaEmpresa.forEach((item) => {
      const atual = agrupado.get(item.produto_id) || {
        quantidade: 0,
        valor_total: 0,
      };

      atual.quantidade += Number(item.quantidade || 0);
      atual.valor_total += Number(item.subtotal || 0);

      agrupado.set(item.produto_id, atual);
    });

    const faturamentoGeral = Array.from(agrupado.values()).reduce(
      (total, item) => total + item.valor_total,
      0
    );

    let lista: ProdutoRanking[] = Array.from(agrupado.entries()).map(
      ([produto_id, dados]) => {
        const produto = produtos.find((item) => item.id === produto_id);

        const ticketMedio =
          dados.quantidade > 0 ? dados.valor_total / dados.quantidade : 0;

        const participacao =
          faturamentoGeral > 0
            ? (dados.valor_total / faturamentoGeral) * 100
            : 0;

        return {
          produto_id,
          nome: produto?.nome || "Produto não encontrado",
          codigo: produto?.codigo || "-",
          unidade: produto?.unidade || "-",
          quantidade: dados.quantidade,
          valor_total: dados.valor_total,
          ticket_medio: ticketMedio,
          participacao,
        };
      }
    );

    lista.sort((a, b) => b.quantidade - a.quantidade);

    if (limite !== "todos") {
      lista = lista.slice(0, Number(limite));
    }

    setRanking(lista);
    setTotalProdutos(lista.length);

    const qtdLista = lista.reduce(
      (total, item) => total + Number(item.quantidade || 0),
      0
    );

    const fatLista = lista.reduce(
      (total, item) => total + Number(item.valor_total || 0),
      0
    );

    setTotalQuantidade(qtdLista);
    setTotalFaturado(fatLista);
    setTicketMedioGeral(qtdLista > 0 ? fatLista / qtdLista : 0);
  }

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "PRODUTOS MAIS VENDIDOS",
      ["Posição", "Código", "Produto", "Un", "Qtd", "Total", "Ticket", "Participação"],
      ranking.map((item, index) => [
        posicaoEmoji(index),
        item.codigo,
        item.nome,
        item.unidade,
        numero(item.quantidade),
        moeda(item.valor_total),
        moeda(item.ticket_medio),
        `${item.participacao.toFixed(2)}%`,
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
  }, [dataInicial, dataFinal, limite]);

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
            Produtos Mais Vendidos
          </h1>

          <p className="text-slate-500">
            Ranking profissional de produtos por quantidade vendida e faturamento.
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
              Limite
            </label>

            <select
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
            >
              <option value="todos">Todos</option>
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
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
                PRODUTOS MAIS VENDIDOS
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
                  <LinhaInfo titulo="Relatório" valor="Produtos Mais Vendidos" />
                  <LinhaInfo
                    titulo="Período"
                    valor={`${formatarDataBR(dataInicial)} até ${formatarDataBR(
                      dataFinal
                    )}`}
                  />
                  <LinhaInfo
                    titulo="Limite"
                    valor={limite === "todos" ? "Todos" : `Top ${limite}`}
                  />
                  <LinhaInfo titulo="Produtos" valor={`${totalProdutos}`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard
              titulo="Produtos"
              valor={`${totalProdutos}`}
              cor="text-blue-700"
            />
            <ResumoCard
              titulo="Qtd. Vendida"
              valor={numero(totalQuantidade)}
              cor="text-green-700"
            />
            <ResumoCard
              titulo="Faturamento"
              valor={moeda(totalFaturado)}
              cor="text-purple-700"
            />
            <ResumoCard
              titulo="Ticket Médio"
              valor={moeda(ticketMedioGeral)}
              cor="text-orange-700"
            />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo do Ranking
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
                titulo="PRODUTOS NO RANKING"
                detalhe="Produtos vendidos no período"
                valor={`${totalProdutos}`}
                cor="text-blue-950"
              />
              <LinhaResumo
                titulo="QUANTIDADE VENDIDA"
                detalhe="Soma das quantidades vendidas"
                valor={numero(totalQuantidade)}
                cor="text-green-700"
              />
              <LinhaResumo
                titulo="FATURAMENTO TOTAL"
                detalhe="Soma dos subtotais dos itens vendidos"
                valor={moeda(totalFaturado)}
                cor="text-purple-700"
              />
              <LinhaResumo
                titulo="TICKET MÉDIO POR ITEM"
                detalhe="Faturamento dividido pela quantidade vendida"
                valor={moeda(ticketMedioGeral)}
                cor="text-orange-700"
              />
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Ranking de Produtos
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">POS.</th>
                <th className="p-3 text-left">CÓDIGO</th>
                <th className="p-3 text-left">PRODUTO</th>
                <th className="p-3 text-left">UN</th>
                <th className="p-3 text-right">QTD</th>
                <th className="p-3 text-right">FATURAMENTO</th>
                <th className="p-3 text-right">TICKET</th>
                <th className="p-3 text-right">%</th>
              </tr>
            </thead>

            <tbody>
              {ranking.map((item, index) => (
                <tr
                  key={item.produto_id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  } border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-black">
                    {posicaoEmoji(index)}
                  </td>

                  <td className="p-3 text-slate-700">{item.codigo}</td>

                  <td className="p-3 text-slate-900 font-semibold">
                    {item.nome}
                  </td>

                  <td className="p-3 text-slate-700">{item.unidade}</td>

                  <td className="p-3 text-right font-black text-green-700">
                    {numero(item.quantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-blue-950">
                    {moeda(item.valor_total)}
                  </td>

                  <td className="p-3 text-right text-slate-700">
                    {moeda(item.ticket_medio)}
                  </td>

                  <td className="p-3 text-right font-bold text-purple-700">
                    {item.participacao.toFixed(2)}%
                  </td>
                </tr>
              ))}

              {ranking.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhum produto vendido no período para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>

            {ranking.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td
                    colSpan={4}
                    className="p-3 text-right font-black text-slate-900"
                  >
                    TOTAIS
                  </td>

                  <td className="p-3 text-right font-black text-green-700">
                    {numero(totalQuantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-blue-800">
                    {moeda(totalFaturado)}
                  </td>

                  <td colSpan={2}></td>
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
                Relatório gerado automaticamente pelo sistema THCloud ERP com base nas
                vendas finalizadas e nos itens vendidos da empresa logada dentro
                do período selecionado.
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
