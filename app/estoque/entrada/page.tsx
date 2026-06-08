"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";

type Produto = {
  id: string;
  codigo: string;
  nome: string;
  qtd_atual: number;
  preco_custo: number;
};

type Fornecedor = {
  id: string;
  razao_social: string;
};

type Movimento = {
  id: string;
  empresa_id: string | null;
  produto_id: string;
  fornecedor_id: string | null;
  tipo: string;
  quantidade: number;
  custo_unitario: number;
  nota_fiscal: string | null;
  observacao: string | null;
  created_at: string;
};

export default function EntradaEstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [custoUnitario, setCustoUnitario] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [observacao, setObservacao] = useState("");

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
      const usuario = localStorage.getItem("th_usuario");
      if (!usuario) return "admin";
      const dados = JSON.parse(usuario);
      return dados.nome || "admin";
    } catch {
      return "admin";
    }
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const produtosReq = await supabase
      .from("produtos")
      .select("id,codigo,nome,qtd_atual,preco_custo")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      return;
    }

    setProdutos(produtosReq.data || []);

    const fornecedoresReq = await supabase
      .from("fornecedores")
      .select("id,razao_social")
      .eq("empresa_id", empresaId)
      .order("razao_social");

    if (fornecedoresReq.error) {
      alert("Erro ao carregar fornecedores: " + fornecedoresReq.error.message);
      return;
    }

    setFornecedores(fornecedoresReq.data || []);

    const movimentosReq = await supabase
      .from("movimentacoes_estoque")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("tipo", "entrada")
      .order("created_at", { ascending: false });

    if (movimentosReq.error) {
      alert("Erro ao carregar movimentações: " + movimentosReq.error.message);
      return;
    }

    setMovimentos((movimentosReq.data || []).filter((item) => item.empresa_id === empresaId));
  }

  function nomeProduto(id: string) {
    const produto = produtos.find((item) => item.id === id);
    return produto ? `${produto.codigo} - ${produto.nome}` : "-";
  }

  function nomeFornecedor(id: string | null) {
    if (!id) return "-";
    const fornecedor = fornecedores.find((item) => item.id === id);
    return fornecedor ? fornecedor.razao_social : "-";
  }

  async function salvarEntrada() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!produtoId || !quantidade || !custoUnitario) {
      alert("Preencha produto, quantidade e custo unitário.");
      return;
    }

    const produto = produtos.find((item) => item.id === produtoId);

    if (!produto) {
      alert("Produto não encontrado.");
      return;
    }

    const qtdEntrada = converterNumero(quantidade);
    const custo = converterNumero(custoUnitario);

    if (isNaN(qtdEntrada) || qtdEntrada <= 0) {
      alert("Quantidade inválida.");
      return;
    }

    if (isNaN(custo) || custo <= 0) {
      alert("Custo unitário inválido.");
      return;
    }

    const novaQtdProduto = Number(produto.qtd_atual || 0) + qtdEntrada;

    const produtoUpdate = await supabase
      .from("produtos")
      .update({
        qtd_atual: novaQtdProduto,
        preco_custo: custo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", produtoId)
      .eq("empresa_id", empresaId);

    if (produtoUpdate.error) {
      alert("Erro ao atualizar produto: " + produtoUpdate.error.message);
      return;
    }

    const estoqueAtual = await supabase
      .from("estoque")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("produto_id", produtoId)
      .maybeSingle();

    if (estoqueAtual.error) {
      alert("Erro ao consultar estoque: " + estoqueAtual.error.message);
      return;
    }

    if (estoqueAtual.data) {
      const { error } = await supabase
        .from("estoque")
        .update({
          quantidade: Number(estoqueAtual.data.quantidade || 0) + qtdEntrada,
          updated_at: new Date().toISOString(),
        })
        .eq("empresa_id", empresaId)
        .eq("produto_id", produtoId);

      if (error) {
        alert("Erro ao atualizar estoque: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("estoque").insert([
        {
          empresa_id: empresaId,
          produto_id: produtoId,
          quantidade: qtdEntrada,
          reservado: 0,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        alert("Erro ao criar estoque: " + error.message);
        return;
      }
    }

    const movimento = await supabase.from("movimentacoes_estoque").insert([
      {
        empresa_id: empresaId,
        produto_id: produtoId,
        fornecedor_id: fornecedorId || null,
        tipo: "entrada",
        quantidade: qtdEntrada,
        custo_unitario: custo,
        nota_fiscal: notaFiscal || null,
        observacao: observacao || null,
        usuario: operadorAtual(),
      },
    ]);

    if (movimento.error) {
      alert("Erro ao registrar movimentação: " + movimento.error.message);
      return;
    }

    alert("Entrada registrada com sucesso!");

    setProdutoId("");
    setFornecedorId("");
    setQuantidade("");
    setCustoUnitario("");
    setNotaFiscal("");
    setObservacao("");

    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">
        Entrada de Mercadorias
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Nova Entrada
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium bg-white"
          >
            <option value="">Selecione o Produto</option>

            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.codigo} - {produto.nome}
              </option>
            ))}
          </select>

          <select
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium bg-white"
          >
            <option value="">Selecione o Fornecedor</option>

            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.razao_social}
              </option>
            ))}
          </select>

          <input
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Quantidade"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
          />

          <input
            value={custoUnitario}
            onChange={(e) => setCustoUnitario(e.target.value)}
            placeholder="Custo Unitário"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
          />

          <input
            value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
            placeholder="Nota Fiscal"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
          />

          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
          />
        </div>

        <button
          onClick={salvarEntrada}
          className="mt-6 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Registrar Entrada
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Histórico de Entradas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Fornecedor</th>
                <th className="p-3 text-left">Quantidade</th>
                <th className="p-3 text-left">Custo</th>
                <th className="p-3 text-left">Nota Fiscal</th>
              </tr>
            </thead>

            <tbody>
              {movimentos.map((movimento) => (
                <tr key={movimento.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-slate-800 font-medium">
                    {new Date(movimento.created_at).toLocaleDateString("pt-BR")}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {nomeProduto(movimento.produto_id)}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {nomeFornecedor(movimento.fornecedor_id)}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {movimento.quantidade}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    R$ {Number(movimento.custo_unitario).toFixed(2)}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {movimento.nota_fiscal || "-"}
                  </td>
                </tr>
              ))}

              {movimentos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-700">
                    Nenhuma entrada registrada para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
