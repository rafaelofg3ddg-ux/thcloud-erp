"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type Venda = {
  id: string;
  status: string | null;
  created_at: string | null;
};

type ItemVenda = {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number | null;
  subtotal: number | null;
};

type Produto = {
  id: string;
  nome: string;
  codigo: string | null;
  unidade: string | null;
};

type ProdutoABC = {
  produto_id: string;
  codigo: string;
  nome: string;
  unidade: string;
  quantidade: number;
  faturamento: number;
  participacao: number;
  acumulado: number;
  classe: "A" | "B" | "C";
};

export default function CurvaABCPage() {
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("todas");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  const [produtosABC, setProdutosABC] = useState<ProdutoABC[]>([]);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalQuantidade, setTotalQuantidade] = useState(0);
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);

  const [classeAProdutos, setClasseAProdutos] = useState(0);
  const [classeBProdutos, setClasseBProdutos] = useState(0);
  const [classeCProdutos, setClasseCProdutos] = useState(0);

  const [classeAFaturamento, setClasseAFaturamento] = useState(0);
  const [classeBFaturamento, setClasseBFaturamento] = useState(0);
  const [classeCFaturamento, setClasseCFaturamento] = useState(0);

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

  function definirClasse(acumulado: number): "A" | "B" | "C" {
    if (acumulado <= 80) return "A";
    if (acumulado <= 95) return "B";
    return "C";
  }

  function classeBadge(classe: "A" | "B" | "C") {
    if (classe === "A") return "bg-green-100 text-green-700";
    if (classe === "B") return "bg-blue-100 text-blue-700";
    return "bg-orange-100 text-orange-700";
  }

  function classeTexto(classe: "A" | "B" | "C") {
    if (classe === "A") return "Classe A";
    if (classe === "B") return "Classe B";
    return "Classe C";
  }

  function zerarResumo() {
    setProdutosABC([]);
    setTotalProdutos(0);
    setTotalQuantidade(0);
    setFaturamentoTotal(0);
    setClasseAProdutos(0);
    setClasseBProdutos(0);
    setClasseCProdutos(0);
    setClasseAFaturamento(0);
    setClasseBFaturamento(0);
    setClasseCFaturamento(0);
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
      .select("id,venda_id,produto_id,quantidade,subtotal")
      .in("venda_id", vendaIds);

    if (itensReq.error) {
      alert("Erro ao carregar itens de venda: " + itensReq.error.message);
      return;
    }

    const itens: ItemVenda[] = itensReq.data || [];

    const produtosReq = await supabase
      .from("produtos")
      .select("id,nome,codigo,unidade")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      return;
    }

    const produtos: Produto[] = produtosReq.data || [];
    const produtoIdsDaEmpresa = new Set(produtos.map((produto) => produto.id));

    const itensDaEmpresa = itens.filter((item) =>
      produtoIdsDaEmpresa.has(item.produto_id)
    );

    const mapa = new Map<
      string,
      {
        quantidade: number;
        faturamento: number;
      }
    >();

    itensDaEmpresa.forEach((item) => {
      const atual = mapa.get(item.produto_id) || {
        quantidade: 0,
        faturamento: 0,
      };

      atual.quantidade += Number(item.quantidade || 0);
      atual.faturamento += Number(item.subtotal || 0);

      mapa.set(item.produto_id, atual);
    });

    const totalFaturado = Array.from(mapa.values()).reduce(
      (total, item) => total + Number(item.faturamento || 0),
      0
    );

    let acumulado = 0;

    const listaBase: ProdutoABC[] = Array.from(mapa.entries())
      .map(([produto_id, dados]) => {
        const produto = produtos.find((item) => item.id === produto_id);

        return {
          produto_id,
          codigo: produto?.codigo || "-",
          nome: produto?.nome || "Produto não encontrado",
          unidade: produto?.unidade || "-",
          quantidade: dados.quantidade,
          faturamento: dados.faturamento,
          participacao:
            totalFaturado > 0 ? (dados.faturamento / totalFaturado) * 100 : 0,
          acumulado: 0,
          classe: "C" as "A" | "B" | "C",
        };
      })
      .sort((a, b) => b.faturamento - a.faturamento)
      .map((item) => {
        acumulado += item.participacao;

        return {
          ...item,
          acumulado,
          classe: definirClasse(acumulado),
        };
      });

    const lista =
      filtroClasse === "todas"
        ? listaBase
        : listaBase.filter((item) => item.classe === filtroClasse);

    setProdutosABC(lista);
    setTotalProdutos(lista.length);
    setTotalQuantidade(
      lista.reduce((total, item) => total + Number(item.quantidade || 0), 0)
    );
    setFaturamentoTotal(
      lista.reduce((total, item) => total + Number(item.faturamento || 0), 0)
    );

    setClasseAProdutos(listaBase.filter((item) => item.classe === "A").length);
    setClasseBProdutos(listaBase.filter((item) => item.classe === "B").length);
    setClasseCProdutos(listaBase.filter((item) => item.classe === "C").length);

    setClasseAFaturamento(
      listaBase
        .filter((item) => item.classe === "A")
        .reduce((total, item) => total + Number(item.faturamento || 0), 0)
    );

    setClasseBFaturamento(
      listaBase
        .filter((item) => item.classe === "B")
        .reduce((total, item) => total + Number(item.faturamento || 0), 0)
    );

    setClasseCFaturamento(
      listaBase
        .filter((item) => item.classe === "C")
        .reduce((total, item) => total + Number(item.faturamento || 0), 0)
    );
  }

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "CURVA ABC DE PRODUTOS",
      ["Código", "Produto", "Un", "Qtd", "Faturamento", "Part. %", "Acum. %", "Classe"],
      produtosABC.map((item) => [
        item.codigo,
        item.nome,
        item.unidade,
        numero(item.quantidade),
        moeda(item.faturamento),
        `${item.participacao.toFixed(2)}%`,
        `${item.acumulado.toFixed(2)}%`,
        item.classe,
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
  }, [dataInicial, dataFinal, filtroClasse]);

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

          table {
            border-collapse: collapse;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Curva ABC de Produtos
          </h1>

          <p className="text-slate-500">
            Classificação de produtos por participação no faturamento.
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
              Classe
            </label>

            <select
              value={filtroClasse}
              onChange={(e) => setFiltroClasse(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
            >
              <option value="todas">Todas</option>
              <option value="A">Classe A</option>
              <option value="B">Classe B</option>
              <option value="C">Classe C</option>
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
                CURVA ABC DE PRODUTOS
              </h1>

              <p className="text-sm text-slate-500 font-semibold mt-1">
                Relatório Gerencial
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
                  <LinhaInfo titulo="Relatório" valor="Curva ABC" />
                  <LinhaInfo
                    titulo="Período"
                    valor={`${formatarDataBR(dataInicial)} até ${formatarDataBR(
                      dataFinal
                    )}`}
                  />
                  <LinhaInfo
                    titulo="Classe"
                    valor={filtroClasse === "todas" ? "Todas" : filtroClasse}
                  />
                  <LinhaInfo titulo="Produtos" valor={`${totalProdutos}`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard titulo="Produtos" valor={`${totalProdutos}`} cor="text-blue-700" />
            <ResumoCard titulo="Qtd. Vendida" valor={numero(totalQuantidade)} cor="text-green-700" />
            <ResumoCard titulo="Faturamento" valor={moeda(faturamentoTotal)} cor="text-purple-700" />
            <ResumoCard titulo="Classe A" valor={`${classeAProdutos} produto(s)`} cor="text-green-700" />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo da Classificação
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">CLASSE</th>
                <th className="p-3 text-left">CRITÉRIO</th>
                <th className="p-3 text-right">PRODUTOS</th>
                <th className="p-3 text-right">FATURAMENTO</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-3 font-black text-green-700">Classe A</td>
                <td className="p-3 text-slate-700">
                  Até 80% acumulado do faturamento
                </td>
                <td className="p-3 text-right font-bold">{classeAProdutos}</td>
                <td className="p-3 text-right font-black text-green-700">
                  {moeda(classeAFaturamento)}
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="p-3 font-black text-blue-700">Classe B</td>
                <td className="p-3 text-slate-700">
                  De 80% até 95% acumulado
                </td>
                <td className="p-3 text-right font-bold">{classeBProdutos}</td>
                <td className="p-3 text-right font-black text-blue-700">
                  {moeda(classeBFaturamento)}
                </td>
              </tr>

              <tr>
                <td className="p-3 font-black text-orange-700">Classe C</td>
                <td className="p-3 text-slate-700">
                  Acima de 95% acumulado
                </td>
                <td className="p-3 text-right font-bold">{classeCProdutos}</td>
                <td className="p-3 text-right font-black text-orange-700">
                  {moeda(classeCFaturamento)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Produtos Classificados
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
                <th className="p-3 text-right">%</th>
                <th className="p-3 text-right">ACUM.</th>
                <th className="p-3 text-left">CLASSE</th>
              </tr>
            </thead>

            <tbody>
              {produtosABC.map((item, index) => (
                <tr
                  key={item.produto_id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-black">
                    {index + 1}º
                  </td>

                  <td className="p-3 text-slate-700">
                    {item.codigo}
                  </td>

                  <td className="p-3 text-slate-900 font-semibold">
                    {item.nome}
                  </td>

                  <td className="p-3 text-slate-700">
                    {item.unidade}
                  </td>

                  <td className="p-3 text-right font-black text-green-700">
                    {numero(item.quantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-blue-950">
                    {moeda(item.faturamento)}
                  </td>

                  <td className="p-3 text-right font-bold text-purple-700">
                    {item.participacao.toFixed(2)}%
                  </td>

                  <td className="p-3 text-right font-bold text-slate-700">
                    {item.acumulado.toFixed(2)}%
                  </td>

                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${classeBadge(item.classe)}`}>
                      {classeTexto(item.classe)}
                    </span>
                  </td>
                </tr>
              ))}

              {produtosABC.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500">
                    Nenhum produto vendido encontrado no período para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>

            {produtosABC.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td colSpan={4} className="p-3 text-right font-black text-slate-900">
                    TOTAIS
                  </td>

                  <td className="p-3 text-right font-black text-green-700">
                    {numero(totalQuantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-blue-800">
                    {moeda(faturamentoTotal)}
                  </td>

                  <td colSpan={3}></td>
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
                Relatório gerado automaticamente pelo Th Cloud com base nas vendas
                finalizadas e nos itens vendidos da empresa logada dentro do período
                selecionado. A classificação ABC usa o faturamento acumulado:
                Classe A até 80%, Classe B até 95% e Classe C acima de 95%.
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
