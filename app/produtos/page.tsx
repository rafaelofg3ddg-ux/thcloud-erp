"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";

type Grupo = {
  id: string;
  nome: string;
};

type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
  categoria_id: string | null;
  unidade: string | null;
  preco_custo: number | null;
  preco_venda: number;
  qtd_atual: number;
  qtd_minima: number | null;
  localizacao: string | null;
  observacoes: string | null;
  foto_url: string | null;
  ativo: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function ProdutosPage() {
  const [codigo, setCodigo] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [nome, setNome] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [precoCusto, setPrecoCusto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [estoque, setEstoque] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [localizacao, setLocalizacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoAtual, setFotoAtual] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const [mostrarNovoGrupo, setMostrarNovoGrupo] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativos");
  const [filtroEstoque, setFiltroEstoque] = useState("todos");

  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function gerarCodigoAleatorio() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function gerarCodigoInterno() {
    setCodigo(gerarCodigoAleatorio());
  }

  function nomeDoGrupo(categoriaId: string | null) {
    if (!categoriaId) return "-";

    const grupo = grupos.find((item) => item.id === categoriaId);

    return grupo ? grupo.nome : "-";
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

  function selecionarFoto(arquivo: File | null) {
    setFotoArquivo(arquivo);

    if (!arquivo) {
      setFotoPreview(fotoAtual || "");
      return;
    }

    const url = URL.createObjectURL(arquivo);
    setFotoPreview(url);
  }

  function limparFormulario() {
    setProdutoEditandoId(null);
    setCodigo("");
    setCodigoBarras("");
    setNome("");
    setGrupoId("");
    setUnidade("UN");
    setPrecoCusto("");
    setPrecoVenda("");
    setEstoque("");
    setEstoqueMinimo("0");
    setLocalizacao("");
    setObservacoes("");
    setFotoArquivo(null);
    setFotoPreview("");
    setFotoAtual(null);
  }

  function carregarProdutoParaEditar(produto: Produto) {
    setProdutoEditandoId(produto.id);
    setCodigo(produto.codigo || "");
    setCodigoBarras(produto.codigo_barras || "");
    setNome(produto.nome || "");
    setGrupoId(produto.categoria_id || "");
    setUnidade(produto.unidade || "UN");
    setPrecoCusto(String(produto.preco_custo ?? produto.preco_venda ?? "").replace(".", ","));
    setPrecoVenda(String(produto.preco_venda ?? "").replace(".", ","));
    setEstoque(String(produto.qtd_atual ?? "0").replace(".", ","));
    setEstoqueMinimo(String(produto.qtd_minima ?? "0").replace(".", ","));
    setLocalizacao(produto.localizacao || "");
    setObservacoes(produto.observacoes || "");
    setFotoAtual(produto.foto_url || null);
    setFotoPreview(produto.foto_url || "");
    setFotoArquivo(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function carregarGrupos() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("categorias")
      .select("id,nome")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar grupos: " + error.message);
      return;
    }

    setGrupos(data || []);
  }

  async function carregarProdutos() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("produtos")
      .select(
        "id,codigo,codigo_barras,nome,categoria_id,unidade,preco_custo,preco_venda,qtd_atual,qtd_minima,localizacao,observacoes,foto_url,ativo,created_at,updated_at"
      )
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar produtos: " + error.message);
      return;
    }

    setProdutos(data || []);
  }

  async function enviarFotoProduto() {
    if (!fotoArquivo) return fotoAtual;

    const empresaId = empresaAtualId();
    if (!empresaId) return fotoAtual;

    const extensao = fotoArquivo.name.split(".").pop();
    const nomeArquivo = `${empresaId}/${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("produtos")
      .upload(nomeArquivo, fotoArquivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error("Erro ao enviar foto: " + error.message);
    }

    const { data } = supabase.storage.from("produtos").getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function salvarNovoGrupo() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!novoGrupo.trim()) {
      alert("Digite o nome do grupo.");
      return;
    }

    const { data, error } = await supabase
      .from("categorias")
      .insert([{ empresa_id: empresaId, nome: novoGrupo.trim() }])
      .select("id,nome")
      .single();

    if (error) {
      alert("Erro ao salvar grupo: " + error.message);
      return;
    }

    alert("Grupo salvo com sucesso!");

    setNovoGrupo("");
    setMostrarNovoGrupo(false);

    await carregarGrupos();

    if (data) {
      setGrupoId(data.id);
    }
  }

  async function salvarProduto() {
    if (salvando) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!nome.trim() || !grupoId || !precoVenda.trim()) {
      alert("Preencha nome do produto, grupo e preço de venda.");
      return;
    }

    const venda = converterNumero(precoVenda);
    const custo = precoCusto.trim() ? converterNumero(precoCusto) : venda;
    const qtdAtual = estoque.trim() ? converterNumero(estoque) : 0;
    const qtdMinima = estoqueMinimo.trim() ? converterNumero(estoqueMinimo) : 0;

    if (isNaN(venda) || venda <= 0) {
      alert("Preço de venda inválido.");
      return;
    }

    if (isNaN(custo) || custo < 0) {
      alert("Preço de custo inválido.");
      return;
    }

    if (isNaN(qtdAtual) || qtdAtual < 0) {
      alert("Estoque atual inválido.");
      return;
    }

    if (isNaN(qtdMinima) || qtdMinima < 0) {
      alert("Estoque mínimo inválido.");
      return;
    }

    setSalvando(true);

    try {
      const fotoUrl = await enviarFotoProduto();
      const codigoFinal = codigo.trim() || gerarCodigoAleatorio();

      const payload = {
        empresa_id: empresaId,
        codigo: codigoFinal,
        codigo_barras: codigoBarras.trim() || null,
        nome: nome.trim(),
        categoria_id: grupoId,
        unidade: unidade.trim() || "UN",
        preco_custo: custo,
        preco_venda: venda,
        qtd_atual: qtdAtual,
        qtd_minima: qtdMinima,
        localizacao: localizacao.trim() || null,
        observacoes: observacoes.trim() || null,
        foto_url: fotoUrl,
        ativo: true,
        updated_at: new Date().toISOString(),
      };

      if (produtoEditandoId) {
        const { error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", produtoEditandoId)
          .eq("empresa_id", empresaId);

        if (error) {
          alert("Erro ao alterar produto: " + error.message);
          setSalvando(false);
          return;
        }

        alert("Produto alterado com sucesso!");
      } else {
        const { error } = await supabase.from("produtos").insert([payload]);

        if (error) {
          alert("Erro ao salvar produto: " + error.message);
          setSalvando(false);
          return;
        }

        alert("Produto salvo com sucesso!");
      }

      limparFormulario();
      await carregarProdutos();
    } catch (error: any) {
      alert(error.message);
    }

    setSalvando(false);
  }

  async function alterarStatusProduto(produto: Produto, ativo: boolean) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const confirmar = confirm(
      ativo
        ? `Deseja reativar o produto "${produto.nome}"?`
        : `Deseja inativar o produto "${produto.nome}"?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("produtos")
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq("id", produto.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao alterar status do produto: " + error.message);
      return;
    }

    await carregarProdutos();
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const grupoNome = nomeDoGrupo(produto.categoria_id).toLowerCase();

      const combinaBusca =
        termo === "" ||
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.codigo || "").toLowerCase().includes(termo) ||
        String(produto.codigo_barras || "").toLowerCase().includes(termo) ||
        String(produto.observacoes || "").toLowerCase().includes(termo) ||
        String(produto.localizacao || "").toLowerCase().includes(termo) ||
        String(produto.unidade || "").toLowerCase().includes(termo) ||
        grupoNome.includes(termo);

      const combinaGrupo = !filtroGrupo || produto.categoria_id === filtroGrupo;

      let combinaStatus = true;

      if (filtroStatus === "ativos") combinaStatus = produto.ativo !== false;
      if (filtroStatus === "inativos") combinaStatus = produto.ativo === false;

      const qtdAtual = Number(produto.qtd_atual || 0);
      const qtdMinima = Number(produto.qtd_minima || 0);

      let combinaEstoque = true;

      if (filtroEstoque === "baixo") {
        combinaEstoque = produto.ativo !== false && qtdMinima > 0 && qtdAtual <= qtdMinima && qtdAtual > 0;
      }

      if (filtroEstoque === "sem") {
        combinaEstoque = produto.ativo !== false && qtdAtual <= 0;
      }

      if (filtroEstoque === "com") {
        combinaEstoque = produto.ativo !== false && qtdAtual > 0;
      }

      return combinaBusca && combinaGrupo && combinaStatus && combinaEstoque;
    });
  }, [produtos, busca, filtroGrupo, filtroStatus, filtroEstoque, grupos]);

  const totalProdutos = produtosFiltrados.length;
  const produtosAtivos = produtosFiltrados.filter((produto) => produto.ativo !== false).length;
  const produtosInativos = produtosFiltrados.filter((produto) => produto.ativo === false).length;
  const produtosBaixo = produtosFiltrados.filter((produto) => {
    const qtdAtual = Number(produto.qtd_atual || 0);
    const qtdMinima = Number(produto.qtd_minima || 0);
    return produto.ativo !== false && qtdMinima > 0 && qtdAtual <= qtdMinima && qtdAtual > 0;
  }).length;
  const produtosSemEstoque = produtosFiltrados.filter(
    (produto) => produto.ativo !== false && Number(produto.qtd_atual || 0) <= 0
  ).length;

  useEffect(() => {
    carregarGrupos();
    carregarProdutos();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <p className="text-blue-600 font-bold">Cadastros</p>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Cadastro de Produtos</h1>
        <p className="text-slate-500 mt-2">
          Cadastre, pesquise, altere, inative produtos e controle preços, grupos e estoque por empresa.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {produtoEditandoId ? "Alterar Produto" : "Novo Produto"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Código interno é opcional. Se ficar vazio, o sistema gera automaticamente.
            </p>
          </div>

          {produtoEditandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-5 py-3 rounded-2xl font-bold"
            >
              Cancelar Alteração
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Código Interno
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Opcional"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
            <button
              type="button"
              onClick={gerarCodigoInterno}
              className="mt-2 w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-2xl font-semibold"
            >
              Gerar Código
            </button>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Código de Barras
            </label>
            <input
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="Bipe ou digite o código"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Nome do Produto *
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Arroz Tipo 1"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Grupo *
            </label>
            <div className="flex gap-2">
              <select
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white"
              >
                <option value="">Selecione o Grupo</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setMostrarNovoGrupo(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-2xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Unidade
            </label>
            <input
              value={unidade}
              onChange={(e) => setUnidade(e.target.value.toUpperCase())}
              placeholder="UN, KG, CX"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Preço de Custo
            </label>
            <input
              value={precoCusto}
              onChange={(e) => setPrecoCusto(e.target.value)}
              placeholder="0,00"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Preço de Venda *
            </label>
            <input
              value={precoVenda}
              onChange={(e) => setPrecoVenda(e.target.value)}
              placeholder="0,00"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Estoque Atual
            </label>
            <input
              value={estoque}
              onChange={(e) => setEstoque(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Estoque Mínimo
            </label>
            <input
              value={estoqueMinimo}
              onChange={(e) => setEstoqueMinimo(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              Localização
            </label>
            <input
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex.: Prateleira A1"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />
          </div>

          <div className="border border-slate-300 rounded-2xl p-3 md:col-span-2">
            <label className="block text-sm font-black text-slate-700 mb-2">
              Foto do Produto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => selecionarFoto(e.target.files?.[0] || null)}
              className="w-full text-slate-900"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-black text-slate-700 mb-2">
              Descrição / Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descrição, detalhes, marca, sabor, embalagem, observações internas..."
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium min-h-24"
            />
          </div>
        </div>

        {fotoPreview && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700 mb-2">Pré-visualização</p>
            <img src={fotoPreview} alt="Preview" className="w-40 h-40 object-cover rounded-2xl border border-slate-300" />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <button type="button" onClick={salvarProduto} disabled={salvando} className={`text-white px-6 py-3 rounded-2xl font-semibold ${salvando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
            {salvando ? "Salvando..." : produtoEditandoId ? "Salvar Alterações" : "Salvar Produto"}
          </button>
          <button type="button" onClick={limparFormulario} className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-semibold">Limpar</button>
        </div>
      </div>

      {mostrarNovoGrupo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Novo Grupo</h2>
            <input value={novoGrupo} onChange={(e) => setNovoGrupo(e.target.value)} placeholder="Nome do Grupo" className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium" />
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setMostrarNovoGrupo(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-5 py-2 rounded-2xl font-semibold">Cancelar</button>
              <button type="button" onClick={salvarNovoGrupo} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-2xl font-semibold">Salvar Grupo</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Produtos Cadastrados</h2>
            <p className="text-slate-500 text-sm mt-1">Pesquisa por nome, código interno, código de barras, grupo, localização e descrição.</p>
          </div>
          <button type="button" onClick={carregarProdutos} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold">Atualizar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar produto, código, barras, descrição..." className="md:col-span-2 border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium" />
          <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white">
            <option value="">Todos os grupos</option>
            {grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>)}
          </select>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white">
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
          <select value={filtroEstoque} onChange={(e) => setFiltroEstoque(e.target.value)} className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white">
            <option value="todos">Todos os estoques</option>
            <option value="com">Com estoque</option>
            <option value="baixo">Estoque baixo</option>
            <option value="sem">Sem estoque</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
          <ResumoCard titulo="Encontrados" valor={`${totalProdutos}`} cor="text-blue-700" />
          <ResumoCard titulo="Ativos" valor={`${produtosAtivos}`} cor="text-green-700" />
          <ResumoCard titulo="Inativos" valor={`${produtosInativos}`} cor="text-slate-700" />
          <ResumoCard titulo="Estoque baixo" valor={`${produtosBaixo}`} cor="text-orange-700" />
          <ResumoCard titulo="Sem estoque" valor={`${produtosSemEstoque}`} cor="text-red-700" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-3 text-left">Foto</th>
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Barras</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Grupo</th>
                <th className="p-3 text-left">Un</th>
                <th className="p-3 text-right">Custo</th>
                <th className="p-3 text-right">Venda</th>
                <th className="p-3 text-right">Estoque</th>
                <th className="p-3 text-right">Mín.</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((produto) => {
                const status = statusProduto(produto);
                return (
                  <tr key={produto.id} className="border-b hover:bg-blue-50/40">
                    <td className="p-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
                        {produto.foto_url ? <img src={produto.foto_url} alt={produto.nome} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-500">Sem foto</span>}
                      </div>
                    </td>
                    <td className="p-3 text-slate-800 font-medium">{produto.codigo || "-"}</td>
                    <td className="p-3 text-slate-800 font-medium">{produto.codigo_barras || "-"}</td>
                    <td className="p-3">
                      <p className="text-slate-900 font-black">{produto.nome}</p>
                      <p className="text-xs text-slate-500 max-w-80 truncate">{produto.observacoes || produto.localizacao || "-"}</p>
                    </td>
                    <td className="p-3 text-slate-800 font-medium">{nomeDoGrupo(produto.categoria_id)}</td>
                    <td className="p-3 text-slate-800 font-medium">{produto.unidade || "UN"}</td>
                    <td className="p-3 text-right text-slate-800 font-medium">{formatarMoeda(Number(produto.preco_custo || 0))}</td>
                    <td className="p-3 text-right text-slate-800 font-medium">{formatarMoeda(Number(produto.preco_venda || 0))}</td>
                    <td className="p-3 text-right text-slate-800 font-medium">{produto.qtd_atual}</td>
                    <td className="p-3 text-right text-slate-800 font-medium">{produto.qtd_minima || 0}</td>
                    <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${status.classe}`}>{status.texto}</span></td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => carregarProdutoParaEditar(produto)} className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-xl font-bold">Alterar</button>
                        {produto.ativo === false ? (
                          <button type="button" onClick={() => alterarStatusProduto(produto, true)} className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-xl font-bold">Ativar</button>
                        ) : (
                          <button type="button" onClick={() => alterarStatusProduto(produto, false)} className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-xl font-bold">Inativar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {produtosFiltrados.length === 0 && (
                <tr><td colSpan={12} className="p-6 text-center text-slate-700 font-medium">Nenhum produto encontrado com os filtros informados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResumoCard({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <p className="text-sm text-slate-500 font-bold">{titulo}</p>
      <p className={`text-2xl font-black ${cor}`}>{valor}</p>
    </div>
  );
}
