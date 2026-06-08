"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";

type Produto = {
  id: string;
  codigo: string;
  nome: string;
  qtd_atual: number;
};

type Movimento = {
  id: string;
  empresa_id: string | null;
  produto_id: string;
  tipo: string;
  quantidade: number;
  observacao: string | null;
  created_at: string;
};

export default function SaidaEstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("Venda");
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
      .select("id,codigo,nome,qtd_atual")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      return;
    }

    setProdutos(produtosReq.data || []);

    const movimentosReq = await supabase
      .from("movimentacoes_estoque")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("tipo", "saida")
      .order("created_at", { ascending: false });

    if (movimentosReq.error) {
      alert("Erro ao carregar saídas: " + movimentosReq.error.message);
      return;
    }

    setMovimentos((movimentosReq.data || []).filter((item) => item.empresa_id === empresaId));
  }

  function nomeProduto(id: string) {
    const produto = produtos.find((item) => item.id === id);
    return produto ? `${produto.codigo} - ${produto.nome}` : "-";
  }

  async function registrarSaida() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!produtoId || !quantidade) {
      alert("Selecione o produto e informe a quantidade.");
      return;
    }

    const produto = produtos.find((item) => item.id === produtoId);

    if (!produto) {
      alert("Produto não encontrado.");
      return;
    }

    const qtdSaida = converterNumero(quantidade);

    if (isNaN(qtdSaida) || qtdSaida <= 0) {
      alert("Quantidade inválida.");
      return;
    }

    if (Number(produto.qtd_atual || 0) < qtdSaida) {
      alert("Estoque insuficiente para essa saída.");
      return;
    }

    const novaQtdProduto = Number(produto.qtd_atual || 0) - qtdSaida;

    const produtoUpdate = await supabase
      .from("produtos")
      .update({
        qtd_atual: novaQtdProduto,
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
      const novaQtdEstoque =
        Number(estoqueAtual.data.quantidade || 0) - qtdSaida;

      if (novaQtdEstoque < 0) {
        alert("Estoque insuficiente na tabela estoque.");
        return;
      }

      const { error } = await supabase
        .from("estoque")
        .update({
          quantidade: novaQtdEstoque,
          updated_at: new Date().toISOString(),
        })
        .eq("empresa_id", empresaId)
        .eq("produto_id", produtoId);

      if (error) {
        alert("Erro ao atualizar estoque: " + error.message);
        return;
      }
    }

    const movimento = await supabase.from("movimentacoes_estoque").insert([
      {
        empresa_id: empresaId,
        produto_id: produtoId,
        tipo: "saida",
        quantidade: qtdSaida,
        custo_unitario: 0,
        nota_fiscal: null,
        fornecedor_id: null,
        observacao: `${motivo} - ${observacao}`,
        usuario: operadorAtual(),
      },
    ]);

    if (movimento.error) {
      alert("Erro ao registrar saída: " + movimento.error.message);
      return;
    }

    alert("Saída registrada com sucesso!");

    setProdutoId("");
    setQuantidade("");
    setMotivo("Venda");
    setObservacao("");

    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">
        Saída de Mercadorias
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Nova Saída
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium bg-white"
          >
            <option value="">Selecione o Produto</option>

            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.codigo} - {produto.nome} | Estoque: {produto.qtd_atual}
              </option>
            ))}
          </select>

          <input
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Quantidade"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
          />

          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium bg-white"
          >
            <option value="Venda">Venda</option>
            <option value="Perda">Perda</option>
            <option value="Quebra">Quebra</option>
            <option value="Consumo Interno">Consumo Interno</option>
            <option value="Ajuste">Ajuste</option>
          </select>

          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
          />
        </div>

        <button
          onClick={registrarSaida}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Registrar Saída
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Histórico de Saídas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Quantidade</th>
                <th className="p-3 text-left">Observação</th>
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
                    {movimento.quantidade}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {movimento.observacao || "-"}
                  </td>
                </tr>
              ))}

              {movimentos.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-700">
                    Nenhuma saída registrada para esta empresa.
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
