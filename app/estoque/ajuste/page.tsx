"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";

type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
  qtd_atual: number;
  unidade: string | null;
  ativo: boolean | null;
};

type Movimento = {
  id: string;
  empresa_id: string | null;
  produto_id: string;
  tipo: string;
  quantidade: number;
  observacao: string | null;
  usuario: string | null;
  created_at: string;
};

type UsuarioAutorizado = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean | null;
};

export default function AjusteEstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);

  const [buscaProduto, setBuscaProduto] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidadeNova, setQuantidadeNova] = useState("");
  const [observacao, setObservacao] = useState("");

  const [loginGerente, setLoginGerente] = useState("");
  const [senhaGerente, setSenhaGerente] = useState("");
  const [salvando, setSalvando] = useState(false);

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

  function produtoSelecionado() {
    return produtos.find((item) => item.id === produtoId) || null;
  }

  function diferencaAjuste() {
    const produto = produtoSelecionado();

    if (!produto || !quantidadeNova.trim()) return 0;

    return converterNumero(quantidadeNova) - Number(produto.qtd_atual || 0);
  }

  function tipoAjuste() {
    const diferenca = diferencaAjuste();

    if (diferenca > 0) return "entrada";
    if (diferenca < 0) return "saida";
    return "sem_ajuste";
  }

  async function validarPermissaoGerente() {
    const empresaId = empresaAtualId();
    if (!empresaId) return null;

    if (!loginGerente.trim() || !senhaGerente.trim()) {
      alert("Informe usuário/e-mail e senha de gerente para autorizar o ajuste.");
      return null;
    }

    const login = loginGerente.trim().toLowerCase();

    const { data: usuarios, error } = await supabase.rpc("verificar_login", {
      p_login: login,
      p_senha: senhaGerente,
      p_empresa_id: empresaId,
    });

    if (error) {
      alert("Erro ao validar gerente: " + error.message);
      return null;
    }

    const usuario = (usuarios && usuarios[0]) as UsuarioAutorizado | null;

    if (!usuario) {
      alert("Usuário ou senha inválidos.");
      return null;
    }

    if (usuario.ativo === false) {
      alert("Usuário inativo.");
      return null;
    }

    const perfil = String(usuario.perfil || "").toLowerCase();

    if (!["gerente", "administrador", "admin", "master", "super_admin"].includes(perfil)) {
      alert("Ajuste manual de estoque exige permissão de gerente ou administrador.");
      return null;
    }

    return usuario;
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const produtosReq = await supabase
      .from("produtos")
      .select("id,codigo,codigo_barras,nome,qtd_atual,unidade,ativo")
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
      .ilike("observacao", "%Ajuste Manual%")
      .order("created_at", { ascending: false })
      .limit(30);

    if (movimentosReq.error) {
      alert("Erro ao carregar ajustes: " + movimentosReq.error.message);
      return;
    }

    setMovimentos(movimentosReq.data || []);
  }

  function buscarProdutoRapido() {
    const termo = buscaProduto.trim().toLowerCase();

    if (!termo) {
      alert("Digite ou bipe o código do produto.");
      return;
    }

    const produto = produtos.find(
      (item) =>
        String(item.codigo || "").toLowerCase() === termo ||
        String(item.codigo_barras || "").toLowerCase() === termo ||
        String(item.nome || "").toLowerCase().includes(termo)
    );

    if (!produto) {
      alert("Produto não encontrado.");
      return;
    }

    if (produto.ativo === false) {
      alert("Produto inativo. Ative o produto antes de ajustar o estoque.");
      return;
    }

    setProdutoId(produto.id);
    setQuantidadeNova(String(produto.qtd_atual || 0));
  }

  function nomeProduto(id: string) {
    const produto = produtos.find((item) => item.id === id);
    return produto ? `${produto.codigo || "-"} - ${produto.nome}` : "-";
  }

  async function salvarAjuste() {
    if (salvando) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const produto = produtoSelecionado();

    if (!produto) {
      alert("Selecione ou bipe um produto.");
      return;
    }

    if (!quantidadeNova.trim()) {
      alert("Informe a nova quantidade do estoque.");
      return;
    }

    const qtdNova = converterNumero(quantidadeNova);

    if (isNaN(qtdNova) || qtdNova < 0) {
      alert("Quantidade inválida.");
      return;
    }

    const qtdAtual = Number(produto.qtd_atual || 0);
    const diferenca = qtdNova - qtdAtual;

    if (diferenca === 0) {
      alert("A quantidade informada é igual ao estoque atual. Nenhum ajuste necessário.");
      return;
    }

    const usuarioAutorizado = await validarPermissaoGerente();

    if (!usuarioAutorizado) {
      return;
    }

    const confirmar = confirm(
      `Confirmar ajuste manual?\n\nProduto: ${produto.nome}\nEstoque atual: ${qtdAtual}\nNova quantidade: ${qtdNova}\nDiferença: ${diferenca}\nAutorizado por: ${usuarioAutorizado.nome}`
    );

    if (!confirmar) return;

    setSalvando(true);

    /*
      O sistema usa a movimentação para o banco/trigger atualizar o saldo.
      Portanto, NÃO atualizamos produtos.qtd_atual diretamente aqui.
    */

    const movimento = await supabase.from("movimentacoes_estoque").insert([
      {
        empresa_id: empresaId,
        produto_id: produto.id,
        tipo: diferenca > 0 ? "entrada" : "saida",
        quantidade: Math.abs(diferenca),
        custo_unitario: 0,
        nota_fiscal: null,
        fornecedor_id: null,
        observacao:
          `Ajuste Manual | Atual: ${qtdAtual} | Novo: ${qtdNova} | Diferença: ${diferenca}` +
          (observacao.trim() ? ` | Obs: ${observacao.trim()}` : ""),
        usuario: `${usuarioAutorizado.nome} autorizou | Operador: ${operadorAtual()}`,
      },
    ]);

    if (movimento.error) {
      alert("Erro ao registrar ajuste: " + movimento.error.message);
      setSalvando(false);
      return;
    }

    alert("Ajuste de estoque registrado com sucesso!");

    setBuscaProduto("");
    setProdutoId("");
    setQuantidadeNova("");
    setObservacao("");
    setLoginGerente("");
    setSenhaGerente("");

    await carregarDados();
    setSalvando(false);
  }

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();

    if (!termo) return produtos.filter((produto) => produto.ativo !== false).slice(0, 20);

    return produtos
      .filter((produto) => {
        if (produto.ativo === false) return false;

        return (
          String(produto.nome || "").toLowerCase().includes(termo) ||
          String(produto.codigo || "").toLowerCase().includes(termo) ||
          String(produto.codigo_barras || "").toLowerCase().includes(termo)
        );
      })
      .slice(0, 20);
  }, [produtos, buscaProduto]);

  useEffect(() => {
    carregarDados();
  }, []);

  const produto = produtoSelecionado();
  const diferenca = diferencaAjuste();
  const tipo = tipoAjuste();

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <p className="text-blue-600 font-bold">Estoque</p>

        <h1 className="text-4xl font-black text-slate-900 mt-2">
          Ajuste Manual de Estoque
        </h1>

        <p className="text-slate-500 mt-2">
          Bipe ou procure o produto, informe a nova quantidade e autorize com senha de gerente.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 mb-5">
            Ajustar Produto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-black text-slate-700 mb-2">
                Bipar ou Procurar Produto
              </label>

              <div className="flex gap-3">
                <input
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") buscarProdutoRapido();
                  }}
                  placeholder="Digite/bipe código interno, código de barras ou nome"
                  className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={buscarProdutoRapido}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-6 rounded-2xl font-black"
                >
                  Buscar
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-black text-slate-700 mb-2">
                Resultado da Pesquisa
              </label>

              <select
                value={produtoId}
                onChange={(e) => {
                  const id = e.target.value;
                  const prod = produtos.find((item) => item.id === id);

                  setProdutoId(id);
                  setQuantidadeNova(prod ? String(prod.qtd_atual || 0) : "");
                }}
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white"
              >
                <option value="">Selecione o produto encontrado</option>

                {produtosFiltrados.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.codigo || "-"} - {item.nome} | Estoque atual: {item.qtd_atual} {item.unidade || "UN"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Nova Quantidade do Estoque
              </label>

              <input
                value={quantidadeNova}
                onChange={(e) => setQuantidadeNova(e.target.value)}
                placeholder="Digite a quantidade correta"
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Diferença Calculada
              </label>

              <input
                value={produto && quantidadeNova ? String(diferenca) : ""}
                disabled
                placeholder="Automático"
                className={`w-full border p-3 rounded-2xl font-bold ${
                  diferenca > 0
                    ? "border-green-200 bg-green-50 text-green-800"
                    : diferenca < 0
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-slate-300 bg-slate-100 text-slate-700"
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-black text-slate-700 mb-2">
                Observação do Ajuste
              </label>

              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: contagem física, quebra, perda, vencimento, sobra..."
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Usuário / E-mail do Gerente
              </label>

              <input
                value={loginGerente}
                onChange={(e) => setLoginGerente(e.target.value)}
                placeholder="Gerente ou administrador"
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Senha do Gerente
              </label>

              <input
                type="password"
                value={senhaGerente}
                onChange={(e) => setSenhaGerente(e.target.value)}
                placeholder="Senha de permissão"
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={salvarAjuste}
              disabled={salvando}
              className={`text-white px-6 py-3 rounded-2xl font-black ${
                salvando
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {salvando ? "Gravando..." : "Gravar Ajuste"}
            </button>

            <button
              type="button"
              onClick={() => {
                setBuscaProduto("");
                setProdutoId("");
                setQuantidadeNova("");
                setObservacao("");
                setLoginGerente("");
                setSenhaGerente("");
              }}
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm">
          <p className="text-slate-300 font-bold">Informações do Estoque</p>

          <h3 className="text-3xl font-black mt-2">
            {produto ? produto.nome : "Nenhum produto selecionado"}
          </h3>

          <div className="mt-5 space-y-3">
            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Código Interno</p>
              <p className="text-xl font-black">{produto?.codigo || "-"}</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Código de Barras</p>
              <p className="text-xl font-black">{produto?.codigo_barras || "-"}</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Estoque Atual</p>
              <p className="text-4xl font-black text-blue-300">
                {produto ? produto.qtd_atual : "-"}
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Nova Quantidade</p>
              <p className="text-4xl font-black text-white">
                {quantidadeNova || "-"}
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Ajuste</p>
              <p
                className={`text-3xl font-black ${
                  tipo === "entrada"
                    ? "text-green-400"
                    : tipo === "saida"
                    ? "text-red-400"
                    : "text-slate-300"
                }`}
              >
                {tipo === "entrada"
                  ? `+${diferenca}`
                  : tipo === "saida"
                  ? `${diferenca}`
                  : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mt-8">
        <h2 className="text-2xl font-black text-slate-900 mb-5">
          Últimos Ajustes Manuais
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Quantidade</th>
                <th className="p-3 text-left">Usuário</th>
                <th className="p-3 text-left">Observação</th>
              </tr>
            </thead>

            <tbody>
              {movimentos.map((movimento) => (
                <tr key={movimento.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-slate-800 font-medium">
                    {new Date(movimento.created_at).toLocaleString("pt-BR")}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {nomeProduto(movimento.produto_id)}
                  </td>

                  <td className="p-3 text-slate-800 font-medium uppercase">
                    {movimento.tipo}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
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

              {movimentos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-700">
                    Nenhum ajuste manual registrado.
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
