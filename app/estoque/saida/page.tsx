"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";

type Produto = {
  id: string;
  empresa_id?: string | null;
  codigo: string | null;
  codigo_barras?: string | null;
  nome: string;
  qtd_atual: number;
  unidade?: string | null;
  ativo?: boolean | null;
};

type Movimento = {
  id: string;
  empresa_id: string | null;
  produto_id: string;
  tipo: string;
  quantidade: number;
  observacao: string | null;
  usuario?: string | null;
  created_at: string;
};

export default function SaidaEstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("Venda");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);

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
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (!usuarioStorage) return "admin";

      const dados = JSON.parse(usuarioStorage);

      return dados.nome || dados.email || dados.usuario || "admin";
    } catch {
      return "admin";
    }
  }

  async function registrarAuditoria(acao: string, detalhe: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    try {
      await supabase.from("auditoria_saas").insert([
        {
          empresa_id: empresaId,
          usuario: operadorAtual(),
          acao,
          descricao: detalhe,
        },
      ]);
    } catch {
      // Não trava a tela se a tabela de auditoria não existir.
    }
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function produtoSelecionado() {
    return produtos.find((item) => item.id === produtoId) || null;
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);

    const produtosReq = await supabase
      .from("produtos")
      .select("id,empresa_id,codigo,codigo_barras,nome,qtd_atual,unidade,ativo")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      setCarregando(false);
      return;
    }

    setProdutos((produtosReq.data || []) as Produto[]);

    const movimentosReq = await supabase
      .from("movimentacoes_estoque")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("tipo", "saida")
      .order("created_at", { ascending: false })
      .limit(100);

    if (movimentosReq.error) {
      alert("Erro ao carregar saídas: " + movimentosReq.error.message);
      setCarregando(false);
      return;
    }

    setMovimentos((movimentosReq.data || []) as Movimento[]);
    setCarregando(false);
  }

  function nomeProduto(id: string) {
    const produto = produtos.find((item) => item.id === id);
    return produto ? `${produto.codigo || "-"} - ${produto.nome}` : "-";
  }

  function formatarDataHora(data: string) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  async function registrarSaida() {
    if (salvando) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!produtoId || !quantidade) {
      alert("Selecione o produto e informe a quantidade.");
      return;
    }

    const produto = produtoSelecionado();

    if (!produto) {
      alert("Produto não encontrado.");
      return;
    }

    if (produto.empresa_id !== empresaId) {
      alert("Este produto não pertence à empresa logada.");
      return;
    }

    if (produto.ativo === false) {
      alert("Produto inativo. Ative o produto antes de registrar saída.");
      return;
    }

    const qtdSaida = converterNumero(quantidade);

    if (isNaN(qtdSaida) || qtdSaida <= 0) {
      alert("Quantidade inválida.");
      return;
    }

    const estoqueAtual = Number(produto.qtd_atual || 0);

    if (estoqueAtual < qtdSaida) {
      alert(
        `Estoque insuficiente.\n\nProduto: ${produto.nome}\nEstoque atual: ${estoqueAtual}\nQuantidade solicitada: ${qtdSaida}`
      );
      return;
    }

    const confirmar = confirm(
      `Confirmar saída de estoque?\n\nProduto: ${produto.nome}\nEstoque atual: ${estoqueAtual}\nQuantidade de saída: ${qtdSaida}\nMotivo: ${motivo}`
    );

    if (!confirmar) return;

    setSalvando(true);

    /*
      PADRÃO CORRETO DO Th Cloud:
      Esta tela NÃO altera produtos.qtd_atual diretamente.
      Ela apenas registra a movimentação de saída.
      O banco/trigger é responsável por atualizar o saldo do produto.
      Isso evita desconto duplicado no estoque.
    */

    const movimento = await supabase.from("movimentacoes_estoque").insert([
      {
        empresa_id: empresaId,
        produto_id: produtoId,
        tipo: "saida",
        quantidade: qtdSaida,
        custo_unitario: 0,
        nota_fiscal: null,
        fornecedor_id: null,
        observacao:
          `${motivo}` + (observacao.trim() ? ` - ${observacao.trim()}` : ""),
        usuario: operadorAtual(),
      },
    ]);

    if (movimento.error) {
      alert("Erro ao registrar saída: " + movimento.error.message);
      setSalvando(false);
      return;
    }

    await registrarAuditoria(
      "SAIDA_ESTOQUE",
      `Saída registrada: ${produto.nome} | Quantidade: ${qtdSaida} | Motivo: ${motivo}`
    );

    alert("Saída registrada com sucesso!");

    setProdutoId("");
    setQuantidade("");
    setMotivo("Venda");
    setObservacao("");

    await carregarDados();
    setSalvando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const produto = produtoSelecionado();
  const qtdSaida = converterNumero(quantidade || "0");
  const estoqueAtual = Number(produto?.qtd_atual || 0);
  const estoqueApos = produto ? estoqueAtual - qtdSaida : 0;

  return (
    <div className="p-4 lg:p-8 bg-slate-100 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm mb-8">
        <p className="text-blue-600 font-black">Estoque</p>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mt-2">
              Saída de Mercadorias
            </h1>

            <p className="text-slate-500 mt-2">
              Registre perdas, quebras, consumo interno e outras saídas manuais com segurança por empresa.
            </p>
          </div>

          <button
            onClick={carregarDados}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black"
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            Nova Saída
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-black text-slate-700 mb-2">
                Produto *
              </label>

              <select
                value={produtoId}
                onChange={(e) => setProdutoId(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700"
              >
                <option value="">Selecione o Produto</option>

                {produtos
                  .filter((produto) => produto.ativo !== false)
                  .map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.codigo || "-"} - {produto.nome} | Estoque:{" "}
                      {produto.qtd_atual} {produto.unidade || "UN"}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Quantidade *
              </label>

              <input
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Quantidade"
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Motivo *
              </label>

              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700"
              >
                <option value="Venda">Venda</option>
                <option value="Perda">Perda</option>
                <option value="Quebra">Quebra</option>
                <option value="Vencimento">Vencimento</option>
                <option value="Consumo Interno">Consumo Interno</option>
                <option value="Bonificação">Bonificação</option>
                <option value="Ajuste">Ajuste</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-black text-slate-700 mb-2">
                Observação
              </label>

              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: produto vencido, perda operacional, consumo interno..."
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium min-h-24 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-6">
            <button
              onClick={registrarSaida}
              disabled={salvando}
              className={`text-white px-6 py-3 rounded-2xl font-black ${
                salvando
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {salvando ? "Registrando..." : "Registrar Saída"}
            </button>

            <button
              onClick={() => {
                setProdutoId("");
                setQuantidade("");
                setMotivo("Venda");
                setObservacao("");
              }}
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm">
          <p className="text-slate-300 font-bold">Resumo da Saída</p>

          <h3 className="text-2xl font-black mt-2">
            {produto ? produto.nome : "Nenhum produto"}
          </h3>

          <div className="mt-5 space-y-3">
            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Código</p>
              <p className="text-xl font-black">{produto?.codigo || "-"}</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Estoque Atual</p>
              <p className="text-4xl font-black text-blue-300">
                {produto ? estoqueAtual : "-"}
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Quantidade de Saída</p>
              <p className="text-4xl font-black text-red-300">
                {quantidade || "-"}
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Estoque após Saída</p>
              <p
                className={`text-4xl font-black ${
                  produto && estoqueApos < 0 ? "text-red-400" : "text-green-300"
                }`}
              >
                {produto && quantidade ? estoqueApos : "-"}
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Motivo</p>
              <p className="text-xl font-black">{motivo}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 mb-6">
          Histórico de Saídas
        </h2>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Quantidade</th>
                <th className="p-3 text-left">Usuário</th>
                <th className="p-3 text-left">Observação</th>
              </tr>
            </thead>

            <tbody>
              {movimentos.map((movimento) => (
                <tr key={movimento.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-slate-800 font-medium">
                    {formatarDataHora(movimento.created_at)}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {nomeProduto(movimento.produto_id)}
                  </td>

                  <td className="p-3 text-red-700 font-black">
                    {movimento.quantidade}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {movimento.usuario || "-"}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {movimento.observacao || "-"}
                  </td>
                </tr>
              ))}

              {movimentos.length === 0 && !carregando && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-700">
                    Nenhuma saída registrada para esta empresa.
                  </td>
                </tr>
              )}

              {carregando && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-700">
                    Carregando saídas...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Segurança multiempresa:</strong> esta tela registra apenas
          movimentações da empresa logada e não altera o saldo diretamente. O
          banco/trigger fica responsável por atualizar o estoque.
        </div>
      </div>
    </div>
  );
}
