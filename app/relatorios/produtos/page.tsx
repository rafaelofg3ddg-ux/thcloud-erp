"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
  categoria_id: string | null;
  fornecedor_id: string | null;
  unidade: string | null;
  preco_custo: number | null;
  preco_venda: number | null;
  qtd_atual: number | null;
  qtd_minima: number | null;
  localizacao: string | null;
  ativo: boolean | null;
  observacoes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function RelatorioProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  const [totalProdutos, setTotalProdutos] = useState(0);
  const [produtosAtivos, setProdutosAtivos] = useState(0);
  const [produtosInativos, setProdutosInativos] = useState(0);
  const [qtdTotal, setQtdTotal] = useState(0);
  const [valorCustoTotal, setValorCustoTotal] = useState(0);
  const [valorVendaTotal, setValorVendaTotal] = useState(0);
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR");
  }

  function texto(valor: string | null) {
    if (!valor || String(valor).trim() === "") return "-";
    return valor;
  }

  function statusProduto(produto: Produto) {
    if (produto.ativo === false) {
      return {
        texto: "Inativo",
        classe: "bg-slate-100 text-slate-700",
      };
    }

    const qtdAtual = Number(produto.qtd_atual || 0);
    const qtdMinima = Number(produto.qtd_minima || 0);

    if (qtdAtual <= 0) {
      return {
        texto: "Sem estoque",
        classe: "bg-red-100 text-red-700",
      };
    }

    if (qtdMinima > 0 && qtdAtual <= qtdMinima) {
      return {
        texto: "Estoque baixo",
        classe: "bg-orange-100 text-orange-700",
      };
    }

    return {
      texto: "Ativo",
      classe: "bg-green-100 text-green-700",
    };
  }

  function aplicarFiltros(lista: Produto[]) {
    return lista.filter((produto) => {
      const termo = busca.trim().toLowerCase();

      const combinaBusca =
        termo === "" ||
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.codigo || "").toLowerCase().includes(termo) ||
        String(produto.codigo_barras || "").toLowerCase().includes(termo);

      const qtdAtual = Number(produto.qtd_atual || 0);
      const qtdMinima = Number(produto.qtd_minima || 0);

      let combinaStatus = true;

      if (filtroStatus === "ativos") {
        combinaStatus = produto.ativo !== false;
      }

      if (filtroStatus === "inativos") {
        combinaStatus = produto.ativo === false;
      }

      if (filtroStatus === "baixo") {
        combinaStatus =
          produto.ativo !== false &&
          qtdMinima > 0 &&
          qtdAtual <= qtdMinima &&
          qtdAtual > 0;
      }

      if (filtroStatus === "sem") {
        combinaStatus = produto.ativo !== false && qtdAtual <= 0;
      }

      return combinaBusca && combinaStatus;
    });
  }

  async function carregarRelatorio() {
    const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
    const empresaId = usuario.empresa_id;

    setEmpresaNome(usuario.empresa_nome || "Empresa");
    setUsuarioNome(usuario.nome || "Administrador");

    if (!empresaId) {
      setProdutos([]);
      setTotalProdutos(0);
      setProdutosAtivos(0);
      setProdutosInativos(0);
      setQtdTotal(0);
      setValorCustoTotal(0);
      setValorVendaTotal(0);
      setEstoqueBaixo(0);
      return;
    }

    const { data, error } = await supabase
      .from("produtos")
      .select(
        "id,codigo,codigo_barras,nome,categoria_id,fornecedor_id,unidade,preco_custo,preco_venda,qtd_atual,qtd_minima,localizacao,ativo,observacoes,created_at,updated_at"
      )
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar produtos: " + error.message);
      return;
    }

    const listaCompleta: Produto[] = data || [];
    const lista = aplicarFiltros(listaCompleta);

    setProdutos(lista);
    setTotalProdutos(lista.length);

    setProdutosAtivos(lista.filter((produto) => produto.ativo !== false).length);
    setProdutosInativos(lista.filter((produto) => produto.ativo === false).length);

    setQtdTotal(
      lista.reduce((total, produto) => total + Number(produto.qtd_atual || 0), 0)
    );

    setValorCustoTotal(
      lista.reduce((total, produto) => {
        return (
          total +
          Number(produto.qtd_atual || 0) * Number(produto.preco_custo || 0)
        );
      }, 0)
    );

    setValorVendaTotal(
      lista.reduce((total, produto) => {
        return (
          total +
          Number(produto.qtd_atual || 0) * Number(produto.preco_venda || 0)
        );
      }, 0)
    );

    setEstoqueBaixo(
      lista.filter((produto) => {
        const qtdAtual = Number(produto.qtd_atual || 0);
        const qtdMinima = Number(produto.qtd_minima || 0);

        return (
          produto.ativo !== false &&
          qtdMinima > 0 &&
          qtdAtual <= qtdMinima
        );
      }).length
    );
  }

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "RELATÓRIO DE PRODUTOS",
      ["Código", "Barras", "Produto", "Un", "Qtd", "Custo", "Venda", "Status"],
      produtos.map((item) => [
        item.codigo || "-",
        item.codigo_barras || "-",
        item.nome,
        item.unidade || "-",
        numero(Number(item.qtd_atual || 0)),
        moeda(Number(item.preco_custo || 0)),
        moeda(Number(item.preco_venda || 0)),
        statusProduto(item).texto,
      ])
    );
  }

  useEffect(() => {
    carregarRelatorio();
  }, []);

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
            Relatório de Produtos
          </h1>

          <p className="text-slate-500">
            Relatório profissional de produtos cadastrados, preços e estoque.
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
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Buscar produto
            </label>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, código ou código de barras"
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Situação
            </label>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
              <option value="baixo">Estoque baixo</option>
              <option value="sem">Sem estoque</option>
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
                RELATÓRIO DE PRODUTOS
              </h1>

              <p className="text-sm text-slate-500 font-semibold mt-1">
                Relatório Cadastral
              </p>
            </div>

            <div className="text-right text-xs text-slate-600">
              <p>
                <strong>Filtro:</strong>{" "}
                {busca.trim() === "" ? "Todos" : busca}
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
                  <LinhaInfo titulo="Relatório" valor="Produtos" />
                  <LinhaInfo
                    titulo="Busca"
                    valor={busca.trim() === "" ? "Todos" : busca}
                  />
                  <LinhaInfo titulo="Situação" valor={filtroStatus} />
                  <LinhaInfo titulo="Produtos" valor={`${totalProdutos}`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard titulo="Produtos" valor={`${totalProdutos}`} cor="text-blue-700" />
            <ResumoCard titulo="Ativos" valor={`${produtosAtivos}`} cor="text-green-700" />
            <ResumoCard titulo="Inativos" valor={`${produtosInativos}`} cor="text-slate-700" />
            <ResumoCard titulo="Estoque Baixo" valor={`${estoqueBaixo}`} cor="text-orange-700" />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo dos Produtos
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-right w-52">TOTAL</th>
              </tr>
            </thead>

            <tbody>
              <LinhaResumo titulo="TOTAL DE PRODUTOS" detalhe="Produtos encontrados no filtro" valor={`${totalProdutos}`} cor="text-blue-950" />
              <LinhaResumo titulo="PRODUTOS ATIVOS" detalhe="Produtos disponíveis para uso" valor={`${produtosAtivos}`} cor="text-green-700" />
              <LinhaResumo titulo="PRODUTOS INATIVOS" detalhe="Produtos desativados no cadastro" valor={`${produtosInativos}`} cor="text-slate-700" />
              <LinhaResumo titulo="QUANTIDADE TOTAL EM ESTOQUE" detalhe="Soma das quantidades atuais" valor={numero(qtdTotal)} cor="text-blue-700" />
              <LinhaResumo titulo="VALOR TOTAL A CUSTO" detalhe="Quantidade atual x preço de custo" valor={moeda(valorCustoTotal)} cor="text-blue-700" />
              <LinhaResumo titulo="VALOR TOTAL A VENDA" detalhe="Quantidade atual x preço de venda" valor={moeda(valorVendaTotal)} cor="text-purple-700" />
              <LinhaResumo titulo="PRODUTOS COM ESTOQUE BAIXO" detalhe="Produtos abaixo ou iguais ao mínimo" valor={`${estoqueBaixo}`} cor="text-orange-700" />
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Produtos Cadastrados
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">CÓDIGO</th>
                <th className="p-3 text-left">PRODUTO</th>
                <th className="p-3 text-left">UN</th>
                <th className="p-3 text-right">CUSTO</th>
                <th className="p-3 text-right">VENDA</th>
                <th className="p-3 text-right">QTD</th>
                <th className="p-3 text-right">MÍN.</th>
                <th className="p-3 text-left">STATUS</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((produto, index) => {
                const status = statusProduto(produto);

                return (
                  <tr
                    key={produto.id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                  >
                    <td className="p-3 text-slate-700">
                      {texto(produto.codigo)}
                    </td>

                    <td className="p-3 text-slate-900 font-semibold">
                      {produto.nome}
                    </td>

                    <td className="p-3 text-slate-700">
                      {texto(produto.unidade)}
                    </td>

                    <td className="p-3 text-right text-slate-700">
                      {moeda(Number(produto.preco_custo || 0))}
                    </td>

                    <td className="p-3 text-right text-slate-700">
                      {moeda(Number(produto.preco_venda || 0))}
                    </td>

                    <td className="p-3 text-right font-black text-slate-900">
                      {numero(Number(produto.qtd_atual || 0))}
                    </td>

                    <td className="p-3 text-right text-slate-700">
                      {numero(Number(produto.qtd_minima || 0))}
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.classe}`}>
                        {status.texto}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {produtos.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhum produto encontrado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>

            {produtos.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td colSpan={5} className="p-3 text-right font-black text-slate-900">
                    TOTAIS
                  </td>

                  <td className="p-3 text-right font-black text-blue-800">
                    {numero(qtdTotal)}
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
                Relatório gerado automaticamente pelo sistema THCloud ERP com base
                nos produtos cadastrados da empresa logada.
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
