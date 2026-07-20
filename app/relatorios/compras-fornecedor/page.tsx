"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type Fornecedor = {
  id: string;
  razao_social: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  contato_nome: string | null;
  prazo_entrega: string | null;
};

type Produto = {
  id: string;
  fornecedor_id: string | null;
  nome: string;
  codigo: string | null;
  unidade: string | null;
  preco_custo: number | null;
  preco_venda: number | null;
  qtd_atual: number | null;
  ativo: boolean | null;
};

type RankingFornecedor = {
  fornecedor_id: string;
  fornecedor: string;
  cnpj: string;
  telefone: string;
  email: string;
  contato: string;
  prazo_entrega: string;
  produtos: number;
  quantidade_total: number;
  valor_custo: number;
  valor_venda: number;
  lucro_potencial: number;
  margem_potencial: number;
  custo_medio: number;
};

export default function ComprasFornecedorPage() {
  const [fornecedoresRanking, setFornecedoresRanking] = useState<RankingFornecedor[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  const [totalFornecedores, setTotalFornecedores] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const [valorCustoTotal, setValorCustoTotal] = useState(0);
  const [valorVendaTotal, setValorVendaTotal] = useState(0);
  const [lucroPotencialTotal, setLucroPotencialTotal] = useState(0);
  const [margemMedia, setMargemMedia] = useState(0);

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

  function classeMargem(margem: number) {
    if (margem >= 40) return "text-green-700";
    if (margem >= 20) return "text-blue-700";
    if (margem >= 10) return "text-orange-700";
    return "text-red-700";
  }

  function statusMargem(margem: number) {
    if (margem >= 40) {
      return {
        texto: "Excelente",
        classe: "bg-green-100 text-green-700",
      };
    }

    if (margem >= 20) {
      return {
        texto: "Boa",
        classe: "bg-blue-100 text-blue-700",
      };
    }

    if (margem >= 10) {
      return {
        texto: "Atenção",
        classe: "bg-orange-100 text-orange-700",
      };
    }

    return {
      texto: "Baixa",
      classe: "bg-red-100 text-red-700",
    };
  }

  function aplicarFiltros(lista: RankingFornecedor[]) {
    let filtrada = [...lista];

    const termo = busca.trim().toLowerCase();

    if (termo !== "") {
      filtrada = filtrada.filter((item) => {
        return (
          item.fornecedor.toLowerCase().includes(termo) ||
          item.cnpj.toLowerCase().includes(termo) ||
          item.contato.toLowerCase().includes(termo)
        );
      });
    }

    if (filtro === "com_produtos") {
      filtrada = filtrada.filter((item) => item.produtos > 0);
    }

    if (filtro === "sem_produtos") {
      filtrada = filtrada.filter((item) => item.produtos === 0);
    }

    if (filtro === "maior_valor") {
      filtrada.sort((a, b) => b.valor_custo - a.valor_custo);
    }

    if (filtro === "maior_lucro") {
      filtrada.sort((a, b) => b.lucro_potencial - a.lucro_potencial);
    }

    if (filtro === "maior_quantidade") {
      filtrada.sort((a, b) => b.quantidade_total - a.quantidade_total);
    }

    if (filtro === "menor_margem") {
      filtrada.sort((a, b) => a.margem_potencial - b.margem_potencial);
    }

    if (filtro === "todos" || filtro === "com_produtos" || filtro === "sem_produtos") {
      filtrada.sort((a, b) => b.valor_custo - a.valor_custo);
    }

    return filtrada;
  }

  function zerarResumo() {
    setFornecedoresRanking([]);
    setTotalFornecedores(0);
    setTotalProdutos(0);
    setTotalItens(0);
    setValorCustoTotal(0);
    setValorVendaTotal(0);
    setLucroPotencialTotal(0);
    setMargemMedia(0);
  }

  async function carregarRelatorio() {
    const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
    const empresaId = usuario.empresa_id;

    setEmpresaNome(usuario.empresa_nome || "Empresa");
    setUsuarioNome(usuario.nome || "Administrador");

    if (!empresaId) {
      zerarResumo();
      return;
    }

    const fornecedoresReq = await supabase
      .from("fornecedores")
      .select("id,razao_social,cnpj,telefone,email,contato_nome,prazo_entrega")
      .eq("empresa_id", empresaId)
      .order("razao_social", { ascending: true });

    if (fornecedoresReq.error) {
      alert("Erro ao carregar fornecedores: " + fornecedoresReq.error.message);
      return;
    }

    const produtosReq = await supabase
      .from("produtos")
      .select("id,fornecedor_id,nome,codigo,unidade,preco_custo,preco_venda,qtd_atual,ativo")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      return;
    }

    const fornecedores: Fornecedor[] = fornecedoresReq.data || [];
    const produtos: Produto[] = produtosReq.data || [];

    const fornecedoresBase: RankingFornecedor[] = fornecedores.map((fornecedor) => {
      const produtosFornecedor = produtos.filter(
        (produto) => produto.fornecedor_id === fornecedor.id && produto.ativo !== false
      );

      const quantidadeTotal = produtosFornecedor.reduce(
        (total, produto) => total + Number(produto.qtd_atual || 0),
        0
      );

      const valorCusto = produtosFornecedor.reduce((total, produto) => {
        return (
          total +
          Number(produto.qtd_atual || 0) * Number(produto.preco_custo || 0)
        );
      }, 0);

      const valorVenda = produtosFornecedor.reduce((total, produto) => {
        return (
          total +
          Number(produto.qtd_atual || 0) * Number(produto.preco_venda || 0)
        );
      }, 0);

      const lucroPotencial = valorVenda - valorCusto;
      const margemPotencial =
        valorVenda > 0 ? (lucroPotencial / valorVenda) * 100 : 0;

      const custoMedio =
        produtosFornecedor.length > 0
          ? produtosFornecedor.reduce(
              (total, produto) => total + Number(produto.preco_custo || 0),
              0
            ) / produtosFornecedor.length
          : 0;

      return {
        fornecedor_id: fornecedor.id,
        fornecedor: fornecedor.razao_social || "Fornecedor sem nome",
        cnpj: fornecedor.cnpj || "-",
        telefone: fornecedor.telefone || "-",
        email: fornecedor.email || "-",
        contato: fornecedor.contato_nome || "-",
        prazo_entrega: fornecedor.prazo_entrega || "-",
        produtos: produtosFornecedor.length,
        quantidade_total: quantidadeTotal,
        valor_custo: valorCusto,
        valor_venda: valorVenda,
        lucro_potencial: lucroPotencial,
        margem_potencial: margemPotencial,
        custo_medio: custoMedio,
      };
    });

    const semFornecedor = produtos.filter(
      (produto) => !produto.fornecedor_id && produto.ativo !== false
    );

    if (semFornecedor.length > 0) {
      const quantidadeTotal = semFornecedor.reduce(
        (total, produto) => total + Number(produto.qtd_atual || 0),
        0
      );

      const valorCusto = semFornecedor.reduce((total, produto) => {
        return (
          total +
          Number(produto.qtd_atual || 0) * Number(produto.preco_custo || 0)
        );
      }, 0);

      const valorVenda = semFornecedor.reduce((total, produto) => {
        return (
          total +
          Number(produto.qtd_atual || 0) * Number(produto.preco_venda || 0)
        );
      }, 0);

      const lucroPotencial = valorVenda - valorCusto;
      const margemPotencial =
        valorVenda > 0 ? (lucroPotencial / valorVenda) * 100 : 0;

      fornecedoresBase.push({
        fornecedor_id: "sem-fornecedor",
        fornecedor: "Produtos sem fornecedor",
        cnpj: "-",
        telefone: "-",
        email: "-",
        contato: "-",
        prazo_entrega: "-",
        produtos: semFornecedor.length,
        quantidade_total: quantidadeTotal,
        valor_custo: valorCusto,
        valor_venda: valorVenda,
        lucro_potencial: lucroPotencial,
        margem_potencial: margemPotencial,
        custo_medio:
          semFornecedor.length > 0
            ? semFornecedor.reduce(
                (total, produto) => total + Number(produto.preco_custo || 0),
                0
              ) / semFornecedor.length
            : 0,
      });
    }

    const lista = aplicarFiltros(fornecedoresBase);

    const custoTotal = lista.reduce(
      (total, item) => total + Number(item.valor_custo || 0),
      0
    );

    const vendaTotal = lista.reduce(
      (total, item) => total + Number(item.valor_venda || 0),
      0
    );

    const lucroTotal = vendaTotal - custoTotal;

    setFornecedoresRanking(lista);
    setTotalFornecedores(lista.length);
    setTotalProdutos(
      lista.reduce((total, item) => total + Number(item.produtos || 0), 0)
    );
    setTotalItens(
      lista.reduce((total, item) => total + Number(item.quantidade_total || 0), 0)
    );
    setValorCustoTotal(custoTotal);
    setValorVendaTotal(vendaTotal);
    setLucroPotencialTotal(lucroTotal);
    setMargemMedia(vendaTotal > 0 ? (lucroTotal / vendaTotal) * 100 : 0);
  }

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "COMPRAS POR FORNECEDOR",
      ["Fornecedor", "CNPJ", "Produtos", "Qtd", "Custo", "Venda", "Lucro", "Margem"],
      fornecedoresRanking.map((item) => [
        item.fornecedor,
        item.cnpj,
        numero(item.produtos),
        numero(item.quantidade_total),
        moeda(item.valor_custo),
        moeda(item.valor_venda),
        moeda(item.lucro_potencial),
        `${item.margem_potencial.toFixed(2)}%`,
      ])
    );
  }

  useEffect(() => {
    carregarRelatorio();
  }, [filtro]);

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
            Compras por Fornecedor
          </h1>

          <p className="text-slate-500">
            Análise de fornecedores, produtos vinculados e valor potencial do estoque.
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
              Buscar fornecedor
            </label>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Razão social, CNPJ ou contato"
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Ordenação / Situação
            </label>

            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
            >
              <option value="todos">Todos</option>
              <option value="com_produtos">Com produtos</option>
              <option value="sem_produtos">Sem produtos</option>
              <option value="maior_valor">Maior valor em estoque</option>
              <option value="maior_lucro">Maior lucro potencial</option>
              <option value="maior_quantidade">Maior quantidade</option>
              <option value="menor_margem">Menor margem</option>
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
                COMPRAS POR FORNECEDOR
              </h1>

              <p className="text-sm text-slate-500 font-semibold mt-1">
                Relatório Gerencial
              </p>
            </div>

            <div className="text-right text-xs text-slate-600">
              <p>
                <strong>Filtro:</strong> {filtro}
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
                  <LinhaInfo titulo="Relatório" valor="Compras por Fornecedor" />
                  <LinhaInfo titulo="Filtro" valor={filtro} />
                  <LinhaInfo titulo="Fornecedores" valor={`${totalFornecedores}`} />
                  <LinhaInfo titulo="Produtos" valor={`${totalProdutos}`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard titulo="Fornecedores" valor={`${totalFornecedores}`} cor="text-blue-700" />
            <ResumoCard titulo="Produtos" valor={`${totalProdutos}`} cor="text-green-700" />
            <ResumoCard titulo="Valor a Custo" valor={moeda(valorCustoTotal)} cor="text-orange-700" />
            <ResumoCard titulo="Lucro Potencial" valor={moeda(lucroPotencialTotal)} cor={lucroPotencialTotal >= 0 ? "text-purple-700" : "text-red-700"} />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo Geral
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-right w-52">TOTAL</th>
              </tr>
            </thead>

            <tbody>
              <LinhaResumo titulo="TOTAL DE FORNECEDORES" detalhe="Fornecedores filtrados no relatório" valor={`${totalFornecedores}`} cor="text-blue-950" />
              <LinhaResumo titulo="TOTAL DE PRODUTOS" detalhe="Produtos vinculados aos fornecedores" valor={`${totalProdutos}`} cor="text-green-700" />
              <LinhaResumo titulo="QUANTIDADE EM ESTOQUE" detalhe="Soma das quantidades atuais" valor={numero(totalItens)} cor="text-blue-700" />
              <LinhaResumo titulo="VALOR TOTAL A CUSTO" detalhe="Quantidade x preço de custo" valor={moeda(valorCustoTotal)} cor="text-orange-700" />
              <LinhaResumo titulo="VALOR POTENCIAL DE VENDA" detalhe="Quantidade x preço de venda" valor={moeda(valorVendaTotal)} cor="text-purple-700" />
              <LinhaResumo titulo="LUCRO POTENCIAL" detalhe="Valor de venda - valor de custo" valor={moeda(lucroPotencialTotal)} cor={lucroPotencialTotal >= 0 ? "text-green-700" : "text-red-700"} />
              <LinhaResumo titulo="MARGEM MÉDIA" detalhe="Lucro potencial dividido pelo valor de venda" valor={`${margemMedia.toFixed(2)}%`} cor={classeMargem(margemMedia)} />
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Ranking de Fornecedores
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">FORNECEDOR</th>
                <th className="p-3 text-left">CONTATO</th>
                <th className="p-3 text-right">PROD.</th>
                <th className="p-3 text-right">QTD</th>
                <th className="p-3 text-right">CUSTO</th>
                <th className="p-3 text-right">VENDA</th>
                <th className="p-3 text-right">LUCRO</th>
                <th className="p-3 text-left">MARGEM</th>
              </tr>
            </thead>

            <tbody>
              {fornecedoresRanking.map((item, index) => {
                const status = statusMargem(item.margem_potencial);

                return (
                  <tr
                    key={item.fornecedor_id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                  >
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{index + 1}º {item.fornecedor}</p>
                      <p className="text-slate-500">CNPJ: {texto(item.cnpj)}</p>
                      <p className="text-slate-500">Prazo: {texto(item.prazo_entrega)}</p>
                    </td>

                    <td className="p-3">
                      <p className="text-slate-700">{texto(item.contato)}</p>
                      <p className="text-slate-500">{texto(item.telefone)}</p>
                      <p className="text-slate-500">{texto(item.email)}</p>
                    </td>

                    <td className="p-3 text-right font-black text-blue-700">
                      {numero(item.produtos)}
                    </td>

                    <td className="p-3 text-right text-slate-700 font-bold">
                      {numero(item.quantidade_total)}
                    </td>

                    <td className="p-3 text-right font-black text-orange-700">
                      {moeda(item.valor_custo)}
                    </td>

                    <td className="p-3 text-right font-black text-purple-700">
                      {moeda(item.valor_venda)}
                    </td>

                    <td className={`p-3 text-right font-black ${item.lucro_potencial >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {moeda(item.lucro_potencial)}
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.classe}`}>
                        {item.margem_potencial.toFixed(2)}% - {status.texto}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {fornecedoresRanking.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhum fornecedor encontrado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>

            {fornecedoresRanking.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td colSpan={2} className="p-3 text-right font-black text-slate-900">
                    TOTAIS
                  </td>

                  <td className="p-3 text-right font-black text-blue-700">
                    {numero(totalProdutos)}
                  </td>

                  <td className="p-3 text-right font-black text-slate-900">
                    {numero(totalItens)}
                  </td>

                  <td className="p-3 text-right font-black text-orange-700">
                    {moeda(valorCustoTotal)}
                  </td>

                  <td className="p-3 text-right font-black text-purple-700">
                    {moeda(valorVendaTotal)}
                  </td>

                  <td className={`p-3 text-right font-black ${lucroPotencialTotal >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {moeda(lucroPotencialTotal)}
                  </td>

                  <td></td>
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
                Relatório gerado automaticamente pelo Th Cloud com base nos fornecedores
                cadastrados da empresa logada e nos produtos vinculados a cada fornecedor.
                O valor de compra é calculado com base no preço de custo atual do cadastro
                do produto.
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
