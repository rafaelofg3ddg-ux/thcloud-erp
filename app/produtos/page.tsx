"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../../lib/supabase";

type Grupo = {
  id: string;
  empresa_id: string | null;
  nome: string;
  descricao?: string | null;
  ativo?: boolean | null;
};

type CodigoAlternativo = {
  id?: string;
  empresa_id?: string | null;
  produto_id?: string | null;
  codigo: string;
  tipo: string;
  descricao?: string | null;
  ativo?: boolean | null;
};

type EmbalagemProduto = {
  id?: string;
  empresa_id?: string | null;
  produto_id?: string | null;
  nome: string;
  codigo: string;
  fator_conversao: number;
  preco_venda: number | null;
  unidade?: string | null;
  ativo?: boolean | null;
};

type Produto = {
  id: string;
  empresa_id: string | null;
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
  marca_nome?: string | null;
  fornecedor_nome?: string | null;
  preco_promocional?: number | null;
  preco_atacado?: number | null;
  qtd_atacado?: number | null;
  estoque_maximo?: number | null;
  ncm?: string | null;
  cest?: string | null;
  cfop?: string | null;
  origem?: string | null;
  csosn_cst?: string | null;
  garantia_dias?: number | null;
  produto_composto?: boolean | null;
  controlar_imei?: boolean | null;
  controlar_lote?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const abas = [
  "Principal",
  "Códigos",
  "Embalagens",
  "Preços",
  "Estoque",
  "Fiscal",
  "Avançado",
] as const;

type AbaProduto = (typeof abas)[number];

export default function ProdutosPage() {
  const [codigo, setCodigo] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [nome, setNome] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [marcaNome, setMarcaNome] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [precoPromocional, setPrecoPromocional] = useState("");
  const [precoAtacado, setPrecoAtacado] = useState("");
  const [qtdAtacado, setQtdAtacado] = useState("");
  const [estoque, setEstoque] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [estoqueMaximo, setEstoqueMaximo] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [ncm, setNcm] = useState("");
  const [cest, setCest] = useState("");
  const [cfop, setCfop] = useState("");
  const [origem, setOrigem] = useState("0");
  const [csosnCst, setCsosnCst] = useState("");
  const [garantiaDias, setGarantiaDias] = useState("");
  const [produtoComposto, setProdutoComposto] = useState(false);
  const [controlarImei, setControlarImei] = useState(false);
  const [controlarLote, setControlarLote] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoAtual, setFotoAtual] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [codigosPorProduto, setCodigosPorProduto] = useState<Record<string, CodigoAlternativo[]>>({});
  const [embalagensPorProduto, setEmbalagensPorProduto] = useState<Record<string, EmbalagemProduto[]>>({});
  const [codigosAlternativos, setCodigosAlternativos] = useState<CodigoAlternativo[]>([]);
  const [embalagens, setEmbalagens] = useState<EmbalagemProduto[]>([]);
  const [novoCodigo, setNovoCodigo] = useState("");
  const [novoCodigoTipo, setNovoCodigoTipo] = useState("ALTERNATIVO");
  const [novoCodigoDescricao, setNovoCodigoDescricao] = useState("");
  const [novaEmbalagemNome, setNovaEmbalagemNome] = useState("");
  const [novaEmbalagemCodigo, setNovaEmbalagemCodigo] = useState("");
  const [novaEmbalagemFator, setNovaEmbalagemFator] = useState("1");
  const [novaEmbalagemPreco, setNovaEmbalagemPreco] = useState("");
  const [novaEmbalagemUnidade, setNovaEmbalagemUnidade] = useState("UN");

  const [mostrarProdutoModal, setMostrarProdutoModal] = useState(false);
  const [mostrarNovoGrupo, setMostrarNovoGrupo] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<AbaProduto>("Principal");

  const [busca, setBusca] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativos");
  const [filtroEstoque, setFiltroEstoque] = useState("todos");

  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [avisoCodigos, setAvisoCodigos] = useState("");

  function empresaAtualId() {
    try {
      const empresaStorage =
        sessionStorage.getItem("th_empresa") || localStorage.getItem("th_empresa");

      if (empresaStorage) {
        const empresa = JSON.parse(empresaStorage);
        if (empresa.id) return empresa.id;
        if (empresa.empresa_id) return empresa.empresa_id;
      }

      const usuarioStorage =
        sessionStorage.getItem("th_usuario") || localStorage.getItem("th_usuario");

      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        if (usuario.empresa_id) return usuario.empresa_id;
        if (usuario.empresa?.id) return usuario.empresa.id;
      }

      const empresaIdDireto =
        sessionStorage.getItem("empresa_id") ||
        sessionStorage.getItem("th_empresa_id") ||
        localStorage.getItem("empresa_id") ||
        localStorage.getItem("th_empresa_id");

      if (empresaIdDireto) return empresaIdDireto;

      alert("Empresa não identificada. Faça login novamente.");
      return null;
    } catch {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }
  }

  function usuarioAtual() {
    try {
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") || localStorage.getItem("th_usuario");
      if (!usuarioStorage) return "Sistema";
      const usuario = JSON.parse(usuarioStorage);
      return usuario.nome || usuario.email || usuario.usuario || "Sistema";
    } catch {
      return "Sistema";
    }
  }

  async function registrarAuditoria(acao: string, detalhe: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    try {
      await supabase.from("auditoria_saas").insert([
        { empresa_id: empresaId, usuario: usuarioAtual(), acao, descricao: detalhe },
      ]);
    } catch {}
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(/\./g, "").replace(",", "."));
  }

  function numeroParaInput(valor: number | null | undefined) {
    if (valor === null || valor === undefined) return "";
    return String(valor).replace(".", ",");
  }

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  function margemCalculada() {
    const custo = converterNumero(precoCusto);
    const venda = converterNumero(precoVenda);
    if (!custo || custo <= 0 || !venda) return 0;
    return ((venda - custo) / custo) * 100;
  }

  function aplicarMargem(margem: string) {
    const custo = converterNumero(precoCusto);
    const percentual = converterNumero(margem);
    if (!custo || custo <= 0 || percentual < 0) return;
    const venda = custo + custo * (percentual / 100);
    setPrecoVenda(venda.toFixed(2).replace(".", ","));
  }

  function statusProduto(produto: Produto) {
    if (produto.ativo === false) return { texto: "Inativo", classe: "bg-slate-100 text-slate-700" };
    const qtdAtual = Number(produto.qtd_atual || 0);
    const qtdMinima = Number(produto.qtd_minima || 0);
    if (qtdAtual <= 0) return { texto: "Sem estoque", classe: "bg-red-100 text-red-700" };
    if (qtdMinima > 0 && qtdAtual <= qtdMinima) {
      return { texto: "Estoque baixo", classe: "bg-orange-100 text-orange-700" };
    }
    return { texto: "Ativo", classe: "bg-green-100 text-green-700" };
  }

  function selecionarFoto(arquivo: File | null) {
    setFotoArquivo(arquivo);
    if (!arquivo) {
      setFotoPreview(fotoAtual || "");
      return;
    }
    setFotoPreview(URL.createObjectURL(arquivo));
  }

  function limparFormulario() {
    setProdutoEditandoId(null);
    setCodigo("");
    setCodigoBarras("");
    setNome("");
    setGrupoId("");
    setUnidade("UN");
    setMarcaNome("");
    setFornecedorNome("");
    setPrecoCusto("");
    setPrecoVenda("");
    setPrecoPromocional("");
    setPrecoAtacado("");
    setQtdAtacado("");
    setEstoque("");
    setEstoqueMinimo("0");
    setEstoqueMaximo("");
    setLocalizacao("");
    setNcm("");
    setCest("");
    setCfop("");
    setOrigem("0");
    setCsosnCst("");
    setGarantiaDias("");
    setProdutoComposto(false);
    setControlarImei(false);
    setControlarLote(false);
    setObservacoes("");
    setFotoArquivo(null);
    setFotoPreview("");
    setFotoAtual(null);
    setCodigosAlternativos([]);
    setEmbalagens([]);
    setNovoCodigo("");
    setNovoCodigoTipo("ALTERNATIVO");
    setNovoCodigoDescricao("");
    setNovaEmbalagemNome("");
    setNovaEmbalagemCodigo("");
    setNovaEmbalagemFator("1");
    setNovaEmbalagemPreco("");
    setNovaEmbalagemUnidade("UN");
    setAbaAtiva("Principal");
  }

  function abrirNovoProduto() {
    limparFormulario();
    setMostrarProdutoModal(true);
  }

  function fecharProdutoModal() {
    setMostrarProdutoModal(false);
    limparFormulario();
  }

  async function carregarProdutoParaEditar(produto: Produto) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    if (produto.empresa_id !== empresaId) {
      alert("Este produto não pertence à empresa logada.");
      return;
    }

    setProdutoEditandoId(produto.id);
    setCodigo(produto.codigo || "");
    setCodigoBarras(produto.codigo_barras || "");
    setNome(produto.nome || "");
    setGrupoId(produto.categoria_id || "");
    setUnidade(produto.unidade || "UN");
    setMarcaNome(produto.marca_nome || "");
    setFornecedorNome(produto.fornecedor_nome || "");
    setPrecoCusto(numeroParaInput(produto.preco_custo ?? produto.preco_venda));
    setPrecoVenda(numeroParaInput(produto.preco_venda));
    setPrecoPromocional(numeroParaInput(produto.preco_promocional));
    setPrecoAtacado(numeroParaInput(produto.preco_atacado));
    setQtdAtacado(numeroParaInput(produto.qtd_atacado));
    setEstoque(numeroParaInput(produto.qtd_atual));
    setEstoqueMinimo(numeroParaInput(produto.qtd_minima ?? 0));
    setEstoqueMaximo(numeroParaInput(produto.estoque_maximo));
    setLocalizacao(produto.localizacao || "");
    setNcm(produto.ncm || "");
    setCest(produto.cest || "");
    setCfop(produto.cfop || "");
    setOrigem(produto.origem || "0");
    setCsosnCst(produto.csosn_cst || "");
    setGarantiaDias(numeroParaInput(produto.garantia_dias));
    setProdutoComposto(Boolean(produto.produto_composto));
    setControlarImei(Boolean(produto.controlar_imei));
    setControlarLote(Boolean(produto.controlar_lote));
    setObservacoes(produto.observacoes || "");
    setFotoAtual(produto.foto_url || null);
    setFotoPreview(produto.foto_url || "");
    setFotoArquivo(null);
    setCodigosAlternativos(codigosPorProduto[produto.id] || []);
    setEmbalagens(embalagensPorProduto[produto.id] || []);
    setAbaAtiva("Principal");
    setMostrarProdutoModal(true);
  }

  async function carregarGrupos() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    const { data, error } = await supabase
      .from("categorias")
      .select("id,empresa_id,nome,descricao,ativo")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome", { ascending: true });
    if (error) {
      alert("Erro ao carregar grupos: " + error.message);
      return;
    }
    setGrupos((data || []) as Grupo[]);
  }

  async function carregarCodigosAlternativos(produtosLista: Produto[]) {
    const empresaId = empresaAtualId();
    if (!empresaId || produtosLista.length === 0) {
      setCodigosPorProduto({});
      return;
    }

    const ids = produtosLista.map((produto) => produto.id);
    const { data, error } = await supabase
      .from("produto_codigos")
      .select("id,empresa_id,produto_id,codigo,tipo,descricao,ativo")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .in("produto_id", ids)
      .order("created_at", { ascending: true });

    if (error) {
      setAvisoCodigos(
        "Códigos alternativos ainda não estão ativos. Rode o SQL sql_produtos_v2_codigos_alternativos.sql no Supabase."
      );
      setCodigosPorProduto({});
      return;
    }

    const agrupado: Record<string, CodigoAlternativo[]> = {};
    (data || []).forEach((codigoItem: any) => {
      const produtoId = String(codigoItem.produto_id || "");
      if (!produtoId) return;
      if (!agrupado[produtoId]) agrupado[produtoId] = [];
      agrupado[produtoId].push(codigoItem as CodigoAlternativo);
    });
    setAvisoCodigos("");
    setCodigosPorProduto(agrupado);
  }

  async function carregarEmbalagens(produtosLista: Produto[]) {
    const empresaId = empresaAtualId();
    if (!empresaId || produtosLista.length === 0) {
      setEmbalagensPorProduto({});
      return;
    }

    const ids = produtosLista.map((produto) => produto.id);
    const { data, error } = await supabase
      .from("produto_embalagens")
      .select("id,empresa_id,produto_id,nome,codigo,fator_conversao,preco_venda,unidade,ativo")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .in("produto_id", ids)
      .order("nome", { ascending: true });

    if (error) {
      setEmbalagensPorProduto({});
      return;
    }

    const agrupado: Record<string, EmbalagemProduto[]> = {};
    (data || []).forEach((embalagem: any) => {
      const produtoId = String(embalagem.produto_id || "");
      if (!produtoId) return;
      if (!agrupado[produtoId]) agrupado[produtoId] = [];
      agrupado[produtoId].push(embalagem as EmbalagemProduto);
    });
    setEmbalagensPorProduto(agrupado);
  }

  async function carregarProdutos() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    setCarregando(true);

    const selectCompleto =
      "id,empresa_id,codigo,codigo_barras,nome,categoria_id,unidade,preco_custo,preco_venda,qtd_atual,qtd_minima,localizacao,observacoes,foto_url,ativo,marca_nome,fornecedor_nome,preco_promocional,preco_atacado,qtd_atacado,estoque_maximo,ncm,cest,cfop,origem,csosn_cst,garantia_dias,produto_composto,controlar_imei,controlar_lote,created_at,updated_at";

    let resposta: any = await supabase
      .from("produtos")
      .select(selectCompleto)
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (resposta.error) {
      const fallback = await supabase
        .from("produtos")
        .select(
          "id,empresa_id,codigo,codigo_barras,nome,categoria_id,unidade,preco_custo,preco_venda,qtd_atual,qtd_minima,localizacao,observacoes,foto_url,ativo,created_at,updated_at"
        )
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      resposta = fallback;
      if (fallback.error) {
        setCarregando(false);
        alert("Erro ao carregar produtos: " + fallback.error.message);
        return;
      }
    }

    const lista = (resposta.data || []) as Produto[];
    setProdutos(lista);
    setCarregando(false);
    await carregarCodigosAlternativos(lista);
    await carregarEmbalagens(lista);
  }

  async function enviarFotoProduto() {
    if (!fotoArquivo) return fotoAtual;
    const empresaId = empresaAtualId();
    if (!empresaId) return fotoAtual;
    const extensao = fotoArquivo.name.split(".").pop();
    const nomeArquivo = `${empresaId}/${Date.now()}-${crypto.randomUUID()}.${extensao}`;
    const { error } = await supabase.storage.from("produtos").upload(nomeArquivo, fotoArquivo, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error("Erro ao enviar foto: " + error.message);
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
    const grupoDuplicado = grupos.some(
      (grupo) => grupo.nome.trim().toLowerCase() === novoGrupo.trim().toLowerCase()
    );
    if (grupoDuplicado) {
      alert("Já existe um grupo com esse nome nesta empresa.");
      return;
    }
    const { data, error } = await supabase
      .from("categorias")
      .insert([{ empresa_id: empresaId, nome: novoGrupo.trim(), ativo: true }])
      .select("id,empresa_id,nome,descricao,ativo")
      .single();
    if (error) {
      alert("Erro ao salvar grupo: " + error.message);
      return;
    }
    await registrarAuditoria("GRUPO_CRIADO", `Grupo cadastrado pelo produto: ${novoGrupo.trim()}`);
    setNovoGrupo("");
    setMostrarNovoGrupo(false);
    await carregarGrupos();
    if (data) setGrupoId(data.id);
  }

  function adicionarCodigoAlternativo() {
    const codigoLimpo = novoCodigo.trim();
    if (!codigoLimpo) {
      alert("Digite o código alternativo.");
      return;
    }

    const todosCodigos = [
      codigo.trim(),
      codigoBarras.trim(),
      ...codigosAlternativos.map((item) => item.codigo.trim()),
    ].filter(Boolean);

    if (todosCodigos.some((item) => item.toLowerCase() === codigoLimpo.toLowerCase())) {
      alert("Este código já está vinculado a este produto.");
      return;
    }

    setCodigosAlternativos((lista) => [
      ...lista,
      {
        codigo: codigoLimpo,
        tipo: novoCodigoTipo || "ALTERNATIVO",
        descricao: novoCodigoDescricao.trim() || null,
        ativo: true,
      },
    ]);
    setNovoCodigo("");
    setNovoCodigoTipo("ALTERNATIVO");
    setNovoCodigoDescricao("");
  }

  function removerCodigoAlternativo(index: number) {
    setCodigosAlternativos((lista) => lista.filter((_, itemIndex) => itemIndex !== index));
  }

  function adicionarEmbalagem() {
    const nomeLimpo = novaEmbalagemNome.trim();
    const codigoLimpo = novaEmbalagemCodigo.trim();
    const fator = converterNumero(novaEmbalagemFator);
    const preco = novaEmbalagemPreco.trim() ? converterNumero(novaEmbalagemPreco) : null;

    if (!nomeLimpo) return alert("Digite o nome da embalagem.");
    if (!codigoLimpo) return alert("Digite ou bipe o código da embalagem.");
    if (isNaN(fator) || fator <= 0) return alert("Fator de conversão inválido.");
    if (preco !== null && (isNaN(preco) || preco <= 0)) return alert("Preço da embalagem inválido.");

    const todosCodigos = [
      codigo.trim(),
      codigoBarras.trim(),
      ...codigosAlternativos.map((item) => item.codigo.trim()),
      ...embalagens.map((item) => item.codigo.trim()),
    ].filter(Boolean);

    if (todosCodigos.some((item) => item.toLowerCase() === codigoLimpo.toLowerCase())) {
      return alert("Este código já está vinculado a este produto.");
    }

    setEmbalagens((lista) => [
      ...lista,
      {
        nome: nomeLimpo,
        codigo: codigoLimpo,
        fator_conversao: fator,
        preco_venda: preco,
        unidade: novaEmbalagemUnidade.trim() || "UN",
        ativo: true,
      },
    ]);
    setNovaEmbalagemNome("");
    setNovaEmbalagemCodigo("");
    setNovaEmbalagemFator("1");
    setNovaEmbalagemPreco("");
    setNovaEmbalagemUnidade("UN");
  }

  function removerEmbalagem(index: number) {
    setEmbalagens((lista) => lista.filter((_, itemIndex) => itemIndex !== index));
  }

  async function salvarEmbalagens(produtoId: string, empresaId: string) {
    const { error: deleteError } = await supabase
      .from("produto_embalagens")
      .delete()
      .eq("empresa_id", empresaId)
      .eq("produto_id", produtoId);

    if (deleteError) {
      throw new Error(
        "Erro ao atualizar embalagens. Rode o SQL sql/produtos_v3_embalagens_codigos.sql no Supabase. Detalhe: " +
          deleteError.message
      );
    }

    const embalagensValidas = embalagens
      .filter((item) => item.nome.trim() && item.codigo.trim() && Number(item.fator_conversao || 0) > 0)
      .map((item) => ({
        empresa_id: empresaId,
        produto_id: produtoId,
        nome: item.nome.trim(),
        codigo: item.codigo.trim(),
        fator_conversao: Number(item.fator_conversao || 1),
        preco_venda: item.preco_venda === null || item.preco_venda === undefined ? null : Number(item.preco_venda),
        unidade: item.unidade?.trim() || "UN",
        ativo: true,
        updated_at: new Date().toISOString(),
      }));

    if (embalagensValidas.length === 0) return;

    const { error } = await supabase.from("produto_embalagens").insert(embalagensValidas);
    if (error) throw new Error("Erro ao salvar embalagens: " + error.message);
  }

  async function salvarCodigosAlternativos(produtoId: string, empresaId: string) {
    const { error: deleteError } = await supabase
      .from("produto_codigos")
      .delete()
      .eq("empresa_id", empresaId)
      .eq("produto_id", produtoId);

    if (deleteError) {
      throw new Error(
        "Erro ao atualizar códigos alternativos. Rode o SQL sql_produtos_v2_codigos_alternativos.sql no Supabase. Detalhe: " +
          deleteError.message
      );
    }

    const codigosValidos = codigosAlternativos
      .filter((item) => item.codigo.trim())
      .map((item) => ({
        empresa_id: empresaId,
        produto_id: produtoId,
        codigo: item.codigo.trim(),
        tipo: item.tipo || "ALTERNATIVO",
        descricao: item.descricao?.trim() || null,
        ativo: true,
        updated_at: new Date().toISOString(),
      }));

    if (codigosValidos.length === 0) return;

    const { error } = await supabase.from("produto_codigos").insert(codigosValidos);
    if (error) {
      throw new Error("Erro ao salvar códigos alternativos: " + error.message);
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

    const grupoPertenceEmpresa = grupos.some((grupo) => grupo.id === grupoId && grupo.empresa_id === empresaId);
    if (!grupoPertenceEmpresa) {
      alert("O grupo selecionado não pertence à empresa logada.");
      return;
    }

    const venda = converterNumero(precoVenda);
    const custo = precoCusto.trim() ? converterNumero(precoCusto) : venda;
    const qtdAtual = estoque.trim() ? converterNumero(estoque) : 0;
    const qtdMinima = estoqueMinimo.trim() ? converterNumero(estoqueMinimo) : 0;
    const maximo = estoqueMaximo.trim() ? converterNumero(estoqueMaximo) : null;

    if (isNaN(venda) || venda <= 0) return alert("Preço de venda inválido.");
    if (isNaN(custo) || custo < 0) return alert("Preço de custo inválido.");
    if (isNaN(qtdAtual) || qtdAtual < 0) return alert("Estoque atual inválido.");
    if (isNaN(qtdMinima) || qtdMinima < 0) return alert("Estoque mínimo inválido.");

    setSalvando(true);

    try {
      const fotoUrl = await enviarFotoProduto();
      const codigoFinal = codigo.trim() || gerarCodigoAleatorio();

      const payload: any = {
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
        marca_nome: marcaNome.trim() || null,
        fornecedor_nome: fornecedorNome.trim() || null,
        preco_promocional: precoPromocional.trim() ? converterNumero(precoPromocional) : null,
        preco_atacado: precoAtacado.trim() ? converterNumero(precoAtacado) : null,
        qtd_atacado: qtdAtacado.trim() ? converterNumero(qtdAtacado) : null,
        estoque_maximo: maximo,
        ncm: ncm.trim() || null,
        cest: cest.trim() || null,
        cfop: cfop.trim() || null,
        origem: origem.trim() || null,
        csosn_cst: csosnCst.trim() || null,
        garantia_dias: garantiaDias.trim() ? converterNumero(garantiaDias) : null,
        produto_composto: produtoComposto,
        controlar_imei: controlarImei,
        controlar_lote: controlarLote,
        updated_at: new Date().toISOString(),
      };

      let produtoId = produtoEditandoId;

      if (produtoEditandoId) {
        const { error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", produtoEditandoId)
          .eq("empresa_id", empresaId);
        if (error) throw new Error("Erro ao alterar produto: " + error.message);
        await registrarAuditoria("PRODUTO_ALTERADO", `Produto alterado: ${nome.trim()}`);
      } else {
        const { data, error } = await supabase.from("produtos").insert([payload]).select("id").single();
        if (error) throw new Error("Erro ao salvar produto: " + error.message);
        produtoId = data?.id;
        await registrarAuditoria("PRODUTO_CRIADO", `Produto cadastrado: ${nome.trim()}`);
      }

      if (produtoId) {
        await salvarCodigosAlternativos(produtoId, empresaId);
        await salvarEmbalagens(produtoId, empresaId);
      }

      alert(produtoEditandoId ? "Produto alterado com sucesso!" : "Produto salvo com sucesso!");
      limparFormulario();
      setMostrarProdutoModal(false);
      await carregarProdutos();
    } catch (error: any) {
      alert(error.message);
    }

    setSalvando(false);
  }

  async function alterarStatusProduto(produto: Produto, ativo: boolean) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    if (produto.empresa_id !== empresaId) return alert("Este produto não pertence à empresa logada.");
    const confirmar = confirm(
      ativo ? `Deseja reativar o produto "${produto.nome}"?` : `Deseja inativar o produto "${produto.nome}"?`
    );
    if (!confirmar) return;
    const { error } = await supabase
      .from("produtos")
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq("id", produto.id)
      .eq("empresa_id", empresaId);
    if (error) return alert("Erro ao alterar status do produto: " + error.message);
    await registrarAuditoria(ativo ? "PRODUTO_REATIVADO" : "PRODUTO_INATIVADO", `${produto.nome}`);
    await carregarProdutos();
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((produto) => {
      const grupoNome = nomeDoGrupo(produto.categoria_id).toLowerCase();
      const codigosExtras = (codigosPorProduto[produto.id] || [])
        .map((item) => `${item.codigo} ${item.tipo} ${item.descricao || ""}`)
        .join(" ")
        .toLowerCase();
      const embalagensExtras = (embalagensPorProduto[produto.id] || [])
        .map((item) => `${item.nome} ${item.codigo} ${item.unidade || ""}`)
        .join(" ")
        .toLowerCase();
      const combinaBusca =
        termo === "" ||
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.codigo || "").toLowerCase().includes(termo) ||
        String(produto.codigo_barras || "").toLowerCase().includes(termo) ||
        String(produto.observacoes || "").toLowerCase().includes(termo) ||
        String(produto.localizacao || "").toLowerCase().includes(termo) ||
        String(produto.unidade || "").toLowerCase().includes(termo) ||
        String(produto.marca_nome || "").toLowerCase().includes(termo) ||
        String(produto.fornecedor_nome || "").toLowerCase().includes(termo) ||
        grupoNome.includes(termo) ||
        codigosExtras.includes(termo) ||
        embalagensExtras.includes(termo);

      const combinaGrupo = !filtroGrupo || produto.categoria_id === filtroGrupo;
      let combinaStatus = true;
      if (filtroStatus === "ativos") combinaStatus = produto.ativo !== false;
      if (filtroStatus === "inativos") combinaStatus = produto.ativo === false;

      const qtdAtual = Number(produto.qtd_atual || 0);
      const qtdMinima = Number(produto.qtd_minima || 0);
      let combinaEstoque = true;
      if (filtroEstoque === "baixo") combinaEstoque = produto.ativo !== false && qtdMinima > 0 && qtdAtual <= qtdMinima && qtdAtual > 0;
      if (filtroEstoque === "sem") combinaEstoque = produto.ativo !== false && qtdAtual <= 0;
      if (filtroEstoque === "com") combinaEstoque = produto.ativo !== false && qtdAtual > 0;
      return combinaBusca && combinaGrupo && combinaStatus && combinaEstoque;
    });
  }, [produtos, busca, filtroGrupo, filtroStatus, filtroEstoque, grupos, codigosPorProduto, embalagensPorProduto]);

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
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white border border-blue-700 rounded-3xl p-6 lg:p-8 shadow-sm mb-8">
        <p className="font-black opacity-90">Th Cloud</p>
        <h1 className="text-3xl lg:text-4xl font-black mt-2">Produtos</h1>
        <p className="text-blue-100 mt-2 max-w-3xl">
          Cadastro profissional com códigos alternativos, preços, estoque, fiscal e opções avançadas em abas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <ResumoCard titulo="Encontrados" valor={`${totalProdutos}`} cor="text-blue-700" />
        <ResumoCard titulo="Ativos" valor={`${produtosAtivos}`} cor="text-green-700" />
        <ResumoCard titulo="Inativos" valor={`${produtosInativos}`} cor="text-slate-700" />
        <ResumoCard titulo="Estoque baixo" valor={`${produtosBaixo}`} cor="text-orange-700" />
        <ResumoCard titulo="Sem estoque" valor={`${produtosSemEstoque}`} cor="text-red-700" />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Produtos cadastrados</h2>
            <p className="text-slate-500 text-sm mt-1">
              Pesquise por nome, código interno, barras, código alternativo, grupo, marca ou fornecedor.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={carregarProdutos} className="btn-secondary">
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>
            <button type="button" onClick={abrirNovoProduto} className="btn-primary">
              + Novo Produto
            </button>
          </div>
        </div>

        {avisoCodigos && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 font-semibold">
            {avisoCodigos}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-5">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar produto, código, barras, alternativo..." className="md:col-span-2 input" />
          <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} className="input bg-white">
            <option value="">Todos os grupos</option>
            {grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>)}
          </select>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="input bg-white">
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
          <select value={filtroEstoque} onChange={(e) => setFiltroEstoque(e.target.value)} className="input bg-white">
            <option value="todos">Todos os estoques</option>
            <option value="com">Com estoque</option>
            <option value="baixo">Estoque baixo</option>
            <option value="sem">Sem estoque</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Códigos</th>
                <th className="p-3 text-left">Grupo / Marca</th>
                <th className="p-3 text-right">Custo</th>
                <th className="p-3 text-right">Venda</th>
                <th className="p-3 text-right">Estoque</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((produto) => {
                const status = statusProduto(produto);
                const extras = codigosPorProduto[produto.id] || [];
                return (
                  <tr key={produto.id} className="border-b hover:bg-slate-50 align-top">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {produto.foto_url ? (
                          <img src={produto.foto_url} alt={produto.nome} className="h-12 w-12 rounded-xl object-cover border border-slate-200" />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black">
                            {produto.nome.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-slate-900">{produto.nome}</p>
                          <p className="text-xs text-slate-500">{produto.localizacao || "Sem localização"}</p>
                          {produto.produto_composto && <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-black">KIT/COMPOSTO</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">
                      <p><strong>Interno:</strong> {produto.codigo || "-"}</p>
                      <p className="text-xs text-slate-500">Barras: {produto.codigo_barras || "-"}</p>
                      {extras.length > 0 && (
                        <p className="text-xs text-blue-700 font-bold mt-1">+ {extras.length} código(s) alternativo(s)</p>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">
                      <p className="font-bold">{nomeDoGrupo(produto.categoria_id)}</p>
                      <p className="text-xs text-slate-500">Marca: {produto.marca_nome || "-"}</p>
                    </td>
                    <td className="p-3 text-right text-slate-700">{formatarMoeda(Number(produto.preco_custo || 0))}</td>
                    <td className="p-3 text-right text-green-700 font-black">{formatarMoeda(Number(produto.preco_venda || 0))}</td>
                    <td className="p-3 text-right">
                      <p className="font-black text-slate-900">{Number(produto.qtd_atual || 0)}</p>
                      <p className="text-xs text-slate-500">Mín.: {Number(produto.qtd_minima || 0)}</p>
                    </td>
                    <td className="p-3 text-center"><span className={`px-3 py-1 rounded-full text-xs font-black ${status.classe}`}>{status.texto}</span></td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => carregarProdutoParaEditar(produto)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-xl font-bold">Alterar</button>
                        {produto.ativo === false ? (
                          <button onClick={() => alterarStatusProduto(produto, true)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl font-bold">Ativar</button>
                        ) : (
                          <button onClick={() => alterarStatusProduto(produto, false)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl font-bold">Inativar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!carregando && produtosFiltrados.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">Nenhum produto encontrado.</td></tr>}
              {carregando && <tr><td colSpan={8} className="p-8 text-center text-slate-500">Carregando produtos...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarProdutoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white z-20 border-b border-slate-200 p-6 rounded-t-3xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{produtoEditandoId ? "Alterar Produto" : "Novo Produto"}</h2>
                  <p className="text-slate-500 text-sm mt-1">Cadastro avançado com abas. Os campos obrigatórios são nome, grupo e preço de venda.</p>
                </div>
                <button type="button" onClick={fecharProdutoModal} className="btn-secondary">Fechar</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {abas.map((aba) => (
                  <button key={aba} type="button" onClick={() => setAbaAtiva(aba)} className={`px-4 py-2 rounded-2xl text-sm font-black ${abaAtiva === aba ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{aba}</button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {abaAtiva === "Principal" && (
                <Secao titulo="Dados principais" descricao="Identificação básica do produto para busca, PDV, OS, orçamento e estoque.">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Campo titulo="Código Interno"><input value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} placeholder="Opcional" className="input" /><button type="button" onClick={gerarCodigoInterno} className="mt-2 w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-2xl font-semibold">Gerar Código</button></Campo>
                    <Campo titulo="Código de Barras Principal"><input value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} placeholder="Bipe ou digite" className="input" /></Campo>
                    <Campo titulo="Nome do Produto *"><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: CAPA A11 AZUL" className="input" /></Campo>
                    <Campo titulo="Grupo *"><div className="flex gap-2"><select value={grupoId} onChange={(e) => setGrupoId(e.target.value)} className="input bg-white"><option value="">Selecione</option>{grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>)}</select><button type="button" onClick={() => setMostrarNovoGrupo(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-2xl font-bold">+</button></div></Campo>
                    <Campo titulo="Marca"><input value={marcaNome} onChange={(e) => setMarcaNome(e.target.value)} placeholder="Ex.: SAMSUNG" className="input" /></Campo>
                    <Campo titulo="Fornecedor"><input value={fornecedorNome} onChange={(e) => setFornecedorNome(e.target.value)} placeholder="Fornecedor principal" className="input" /></Campo>
                    <Campo titulo="Unidade"><input value={unidade} onChange={(e) => setUnidade(e.target.value.toUpperCase())} placeholder="UN, KG, CX" className="input" /></Campo>
                    <div className="border border-slate-300 rounded-2xl p-3"><label className="block text-sm font-black text-slate-700 mb-2">Foto do Produto</label><input type="file" accept="image/*" onChange={(e) => selecionarFoto(e.target.files?.[0] || null)} className="w-full text-slate-900" /></div>
                    <div className="md:col-span-4"><label className="block text-sm font-black text-slate-700 mb-2">Descrição / Observações</label><textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Descrição, detalhes, aplicação, observações internas..." className="textarea" /></div>
                  </div>
                  {fotoPreview && <div className="mt-5"><p className="text-sm font-semibold text-slate-700 mb-2">Pré-visualização</p><img src={fotoPreview} alt="Preview" className="w-40 h-40 object-cover rounded-2xl border border-slate-300" /></div>}
                </Secao>
              )}

              {abaAtiva === "Códigos" && (
                <Secao titulo="Códigos alternativos" descricao="Vários códigos diferentes podem apontar para este mesmo produto. Ao bipar qualquer um deles no PDV, o sistema encontrará o produto correto.">
                  <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900 mb-5"><strong>Exemplo:</strong> CAPA A11 AZUL pode ter código interno, código do fornecedor, código da embalagem antiga e código de barras novo, todos no mesmo cadastro.</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <Campo titulo="Novo código"><input value={novoCodigo} onChange={(e) => setNovoCodigo(e.target.value)} placeholder="Bipe ou digite" className="input" /></Campo>
                    <Campo titulo="Tipo"><select value={novoCodigoTipo} onChange={(e) => setNovoCodigoTipo(e.target.value)} className="input bg-white"><option>ALTERNATIVO</option><option>FORNECEDOR</option><option>EMBALAGEM</option><option>SKU</option><option>ANTIGO</option></select></Campo>
                    <Campo titulo="Descrição"><input value={novoCodigoDescricao} onChange={(e) => setNovoCodigoDescricao(e.target.value)} placeholder="Ex.: código antigo" className="input" /></Campo>
                    <div className="flex items-end"><button type="button" onClick={adicionarCodigoAlternativo} className="btn-primary w-full">Adicionar código</button></div>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-slate-100 text-slate-700"><th className="p-3 text-left">Código</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Descrição</th><th className="p-3 text-center">Ação</th></tr></thead><tbody>{codigosAlternativos.map((item, index) => <tr key={`${item.codigo}-${index}`} className="border-t"><td className="p-3 font-black text-slate-900">{item.codigo}</td><td className="p-3">{item.tipo}</td><td className="p-3">{item.descricao || "-"}</td><td className="p-3 text-center"><button type="button" onClick={() => removerCodigoAlternativo(index)} className="text-red-700 font-black">Remover</button></td></tr>)}{codigosAlternativos.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">Nenhum código alternativo adicionado.</td></tr>}</tbody></table></div>
                </Secao>
              )}

              {abaAtiva === "Embalagens" && (
                <Secao titulo="Embalagens e unidades de venda" descricao="Venda o mesmo produto por unidade, caixa, fardo, pacote ou qualquer embalagem com código próprio.">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900 mb-5">
                    <strong>Exemplo:</strong> o mesmo REFRIGERANTE pode ter código da unidade, código da caixa com 6 e código do fardo com 12. Ao bipar a caixa no PDV, o sistema vende a embalagem correta sem criar outro produto.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                    <Campo titulo="Nome da embalagem"><input value={novaEmbalagemNome} onChange={(e) => setNovaEmbalagemNome(e.target.value)} placeholder="Ex.: CAIXA C/ 6" className="input" /></Campo>
                    <Campo titulo="Código da embalagem"><input value={novaEmbalagemCodigo} onChange={(e) => setNovaEmbalagemCodigo(e.target.value)} placeholder="Bipe ou digite" className="input" /></Campo>
                    <Campo titulo="Fator"><input value={novaEmbalagemFator} onChange={(e) => setNovaEmbalagemFator(e.target.value)} placeholder="Ex.: 6" className="input" /></Campo>
                    <Campo titulo="Preço da embalagem"><input value={novaEmbalagemPreco} onChange={(e) => setNovaEmbalagemPreco(e.target.value)} placeholder="Opcional" className="input" /></Campo>
                    <Campo titulo="Unidade"><input value={novaEmbalagemUnidade} onChange={(e) => setNovaEmbalagemUnidade(e.target.value.toUpperCase())} placeholder="CX, FD, PC" className="input" /></Campo>
                    <div className="flex items-end"><button type="button" onClick={adicionarEmbalagem} className="btn-primary w-full">Adicionar</button></div>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-100 text-slate-700"><th className="p-3 text-left">Embalagem</th><th className="p-3 text-left">Código</th><th className="p-3 text-right">Fator</th><th className="p-3 text-right">Preço</th><th className="p-3 text-left">Unidade</th><th className="p-3 text-center">Ação</th></tr></thead>
                      <tbody>
                        {embalagens.map((item, index) => (
                          <tr key={`${item.codigo}-${index}`} className="border-t">
                            <td className="p-3 font-black text-slate-900">{item.nome}</td>
                            <td className="p-3">{item.codigo}</td>
                            <td className="p-3 text-right">{Number(item.fator_conversao || 1)}</td>
                            <td className="p-3 text-right">{item.preco_venda ? formatarMoeda(Number(item.preco_venda)) : "Usar preço do produto"}</td>
                            <td className="p-3">{item.unidade || "UN"}</td>
                            <td className="p-3 text-center"><button type="button" onClick={() => removerEmbalagem(index)} className="text-red-700 font-black">Remover</button></td>
                          </tr>
                        ))}
                        {embalagens.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhuma embalagem adicionada.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </Secao>
              )}

              {abaAtiva === "Preços" && (
                <Secao titulo="Preços e margem" descricao="Controle de custo, venda, promoção e atacado.">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Campo titulo="Preço de Custo"><input value={precoCusto} onChange={(e) => setPrecoCusto(e.target.value)} placeholder="0,00" className="input" /></Campo>
                    <Campo titulo="Preço de Venda *"><input value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} placeholder="0,00" className="input" /></Campo>
                    <Campo titulo="Margem Atual"><div className="input bg-slate-50">{margemCalculada().toFixed(2).replace(".", ",")}%</div></Campo>
                    <Campo titulo="Aplicar margem %"><input onBlur={(e) => aplicarMargem(e.target.value)} placeholder="Ex.: 40" className="input" /></Campo>
                    <Campo titulo="Preço Promocional"><input value={precoPromocional} onChange={(e) => setPrecoPromocional(e.target.value)} placeholder="0,00" className="input" /></Campo>
                    <Campo titulo="Preço Atacado"><input value={precoAtacado} onChange={(e) => setPrecoAtacado(e.target.value)} placeholder="0,00" className="input" /></Campo>
                    <Campo titulo="Qtd. mínima atacado"><input value={qtdAtacado} onChange={(e) => setQtdAtacado(e.target.value)} placeholder="Ex.: 10" className="input" /></Campo>
                  </div>
                </Secao>
              )}

              {abaAtiva === "Estoque" && (
                <Secao titulo="Estoque" descricao="Controle de quantidades, localização, alertas e rastreabilidade.">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Campo titulo="Estoque Atual"><input value={estoque} onChange={(e) => setEstoque(e.target.value)} placeholder="0" className="input" /></Campo>
                    <Campo titulo="Estoque Mínimo"><input value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} placeholder="0" className="input" /></Campo>
                    <Campo titulo="Estoque Máximo"><input value={estoqueMaximo} onChange={(e) => setEstoqueMaximo(e.target.value)} placeholder="0" className="input" /></Campo>
                    <Campo titulo="Localização"><input value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} placeholder="Ex.: PRATELEIRA A1" className="input" /></Campo>
                    <Check titulo="Controlar IMEI / Série" valor={controlarImei} setValor={setControlarImei} />
                    <Check titulo="Controlar lote / validade" valor={controlarLote} setValor={setControlarLote} />
                  </div>
                </Secao>
              )}

              {abaAtiva === "Fiscal" && (
                <Secao titulo="Fiscal" descricao="Campos fiscais básicos para futuras emissões e relatórios.">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Campo titulo="NCM"><input value={ncm} onChange={(e) => setNcm(e.target.value.replace(/\D/g, ""))} placeholder="00000000" className="input" /></Campo>
                    <Campo titulo="CEST"><input value={cest} onChange={(e) => setCest(e.target.value.replace(/\D/g, ""))} placeholder="0000000" className="input" /></Campo>
                    <Campo titulo="CFOP"><input value={cfop} onChange={(e) => setCfop(e.target.value.replace(/\D/g, ""))} placeholder="5102" className="input" /></Campo>
                    <Campo titulo="Origem"><select value={origem} onChange={(e) => setOrigem(e.target.value)} className="input bg-white"><option value="0">0 - Nacional</option><option value="1">1 - Estrangeira importação direta</option><option value="2">2 - Estrangeira mercado interno</option></select></Campo>
                    <Campo titulo="CSOSN / CST"><input value={csosnCst} onChange={(e) => setCsosnCst(e.target.value)} placeholder="102, 500..." className="input" /></Campo>
                  </div>
                </Secao>
              )}

              {abaAtiva === "Avançado" && (
                <Secao titulo="Opções avançadas" descricao="Configurações que ajudam o produto a se comportar melhor em OS, PDV e estoque.">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Campo titulo="Garantia em dias"><input value={garantiaDias} onChange={(e) => setGarantiaDias(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 90" className="input" /></Campo>
                    <Check titulo="Produto composto / kit" valor={produtoComposto} setValor={setProdutoComposto} />
                    <div className="md:col-span-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600"><strong>Próxima evolução:</strong> composição do produto, similares/equivalentes e histórico completo de compras, vendas, OS e ajustes.</div>
                  </div>
                </Secao>
              )}

              <div className="flex flex-col md:flex-row gap-3 mt-6 border-t border-slate-200 pt-5">
                <button type="button" onClick={salvarProduto} disabled={salvando} className={`text-white px-6 py-3 rounded-2xl font-semibold ${salvando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"}`}>{salvando ? "Salvando..." : produtoEditandoId ? "Salvar Alterações" : "Salvar Produto"}</button>
                <button type="button" onClick={fecharProdutoModal} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarNovoGrupo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Novo Grupo</h2>
            <input value={novoGrupo} onChange={(e) => setNovoGrupo(e.target.value)} placeholder="Nome do Grupo" className="input" />
            <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setMostrarNovoGrupo(false)} className="btn-secondary">Cancelar</button><button type="button" onClick={salvarNovoGrupo} className="btn-primary">Salvar Grupo</button></div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input { width: 100%; border: 1px solid rgb(203 213 225); padding: 0.75rem; border-radius: 1rem; color: rgb(15 23 42); font-weight: 500; outline: none; }
        .input:focus { border-color: rgb(29 78 216); box-shadow: 0 0 0 4px rgb(219 234 254); }
        .textarea { width: 100%; border: 1px solid rgb(203 213 225); padding: 0.75rem; border-radius: 1rem; color: rgb(15 23 42); font-weight: 500; min-height: 6rem; outline: none; }
        .textarea:focus { border-color: rgb(29 78 216); box-shadow: 0 0 0 4px rgb(219 234 254); }
        .btn-primary { background: rgb(29 78 216); color: white; padding: 0.75rem 1.25rem; border-radius: 1rem; font-weight: 900; }
        .btn-primary:hover { background: rgb(30 64 175); }
        .btn-secondary { background: rgb(226 232 240); color: rgb(15 23 42); padding: 0.75rem 1.25rem; border-radius: 1rem; font-weight: 800; }
        .btn-secondary:hover { background: rgb(203 213 225); }
      `}</style>
    </div>
  );
}

function Secao({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5">
      <h3 className="text-xl font-black text-slate-900">{titulo}</h3>
      <p className="text-sm text-slate-500 mt-1 mb-5">{descricao}</p>
      {children}
    </div>
  );
}

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-700 mb-2">{titulo}</label>
      {children}
    </div>
  );
}

function Check({ titulo, valor, setValor }: { titulo: string; valor: boolean; setValor: (valor: boolean) => void }) {
  return (
    <label className="border border-slate-200 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50">
      <input type="checkbox" checked={valor} onChange={(e) => setValor(e.target.checked)} className="h-5 w-5" />
      <span className="font-black text-slate-800">{titulo}</span>
    </label>
  );
}

function ResumoCard({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{titulo}</p>
      <p className={`text-2xl font-black mt-1 ${cor}`}>{valor}</p>
    </div>
  );
}
