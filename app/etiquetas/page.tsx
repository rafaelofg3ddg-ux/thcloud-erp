"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Edit,
  Eye,
  Package,
  Plus,
  Printer,
  Save,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
  preco_venda: number | null;
  qtd_atual: number | null;
  ativo: boolean | null;
  unidade?: string | null;
};

type ModeloEtiqueta = {
  id: string;
  empresa_id?: string | null;
  nome: string;
  largura: number;
  altura: number;
  margem_topo: number;
  margem_esquerda: number;
  espaco_horizontal: number;
  espaco_vertical: number;
  fonte_nome: number;
  fonte_preco: number;
  fonte_codigo: number;
  fonte_extra: number;
  colunas: number;
  alinhamento: "center" | "left" | "right";
  borda_impressao: boolean;
  mostrar_nome: boolean;
  mostrar_preco: boolean;
  mostrar_codigo: boolean;
  mostrar_barras: boolean;
  mostrar_empresa: boolean;
  mostrar_data: boolean;
  mostrar_unidade: boolean;
  mostrar_estoque: boolean;
  mostrar_grupo: boolean;
  mostrar_preco_promocional: boolean;
  texto_livre: string;
};

type ItemImpressao = {
  produto: Produto;
  quantidade: number;
  preco_promocional: string;
};

const modelosPadrao: ModeloEtiqueta[] = [
  {
    id: "padrao-1",
    nome: "Etiqueta Pequena 50x30mm",
    largura: 50,
    altura: 30,
    margem_topo: 5,
    margem_esquerda: 5,
    espaco_horizontal: 2,
    espaco_vertical: 2,
    fonte_nome: 9,
    fonte_preco: 13,
    fonte_codigo: 8,
    fonte_extra: 7,
    colunas: 3,
    alinhamento: "center",
    borda_impressao: false,
    mostrar_nome: true,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_barras: true,
    mostrar_empresa: false,
    mostrar_data: false,
    mostrar_unidade: false,
    mostrar_estoque: false,
    mostrar_grupo: false,
    mostrar_preco_promocional: false,
    texto_livre: "",
  },
  {
    id: "padrao-2",
    nome: "Etiqueta Média 60x40mm",
    largura: 60,
    altura: 40,
    margem_topo: 5,
    margem_esquerda: 5,
    espaco_horizontal: 3,
    espaco_vertical: 3,
    fonte_nome: 10,
    fonte_preco: 15,
    fonte_codigo: 8,
    fonte_extra: 8,
    colunas: 3,
    alinhamento: "center",
    borda_impressao: false,
    mostrar_nome: true,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_barras: true,
    mostrar_empresa: true,
    mostrar_data: false,
    mostrar_unidade: false,
    mostrar_estoque: false,
    mostrar_grupo: false,
    mostrar_preco_promocional: false,
    texto_livre: "",
  },
  {
    id: "padrao-3",
    nome: "Etiqueta Gôndola 80x40mm",
    largura: 80,
    altura: 40,
    margem_topo: 6,
    margem_esquerda: 6,
    espaco_horizontal: 3,
    espaco_vertical: 3,
    fonte_nome: 11,
    fonte_preco: 18,
    fonte_codigo: 8,
    fonte_extra: 8,
    colunas: 2,
    alinhamento: "center",
    borda_impressao: false,
    mostrar_nome: true,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_barras: false,
    mostrar_empresa: true,
    mostrar_data: true,
    mostrar_unidade: false,
    mostrar_estoque: false,
    mostrar_grupo: false,
    mostrar_preco_promocional: false,
    texto_livre: "OFERTA",
  },
];

export default function EtiquetasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [modelos, setModelos] = useState<ModeloEtiqueta[]>(modelosPadrao);
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState("padrao-1");
  const [modalModelo, setModalModelo] = useState(false);
  const [modeloEditando, setModeloEditando] = useState<ModeloEtiqueta | null>(null);

  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [precoPromocional, setPrecoPromocional] = useState("");
  const [itens, setItens] = useState<ItemImpressao[]>([]);

  function empresaAtualId() {
    try {
      const usuario = localStorage.getItem("th_usuario");
      if (!usuario) return null;
      const dados = JSON.parse(usuario);
      return dados.empresa_id || null;
    } catch {
      return null;
    }
  }

  function empresaNome() {
    try {
      const empresa = JSON.parse(localStorage.getItem("th_empresa") || "{}");
      return empresa?.nome_fantasia || empresa?.razao_social || "THCloud ERP";
    } catch {
      return "THCloud ERP";
    }
  }

  function formatarMoeda(valor: number | null | undefined) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function modeloAtual() {
    return modelos.find((modelo) => modelo.id === modeloSelecionadoId) || modelos[0];
  }

  function normalizarModelo(modelo: any): ModeloEtiqueta {
    return {
      ...modelosPadrao[0],
      ...modelo,
      alinhamento: modelo?.alinhamento || "center",
      texto_livre: modelo?.texto_livre || "",
      fonte_extra: Number(modelo?.fonte_extra || 7),
      borda_impressao: modelo?.borda_impressao === true,
      mostrar_empresa: modelo?.mostrar_empresa === true,
      mostrar_data: modelo?.mostrar_data === true,
      mostrar_unidade: modelo?.mostrar_unidade === true,
      mostrar_estoque: modelo?.mostrar_estoque === true,
      mostrar_grupo: modelo?.mostrar_grupo === true,
      mostrar_preco_promocional: modelo?.mostrar_preco_promocional === true,
    };
  }

  async function carregarModelosSalvos() {
    const empresaId = empresaAtualId();

    if (!empresaId) {
      setModelos(modelosPadrao);
      return;
    }

    const { data, error } = await supabase
      .from("modelos_etiquetas")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("created_at", { ascending: true });

    if (error) {
      alert("Erro ao carregar modelos de etiquetas: " + error.message);
      setModelos(modelosPadrao);
      return;
    }

    if (data && data.length > 0) {
      const normalizados = data.map(normalizarModelo);
      setModelos(normalizados);
      setModeloSelecionadoId(normalizados[0].id);
      return;
    }

    await criarModelosPadraoNoSupabase(empresaId);
  }

  async function criarModelosPadraoNoSupabase(empresaId: string) {
    const modelosParaSalvar = modelosPadrao.map((modelo) => ({
      empresa_id: empresaId,
      nome: modelo.nome,
      largura: modelo.largura,
      altura: modelo.altura,
      margem_topo: modelo.margem_topo,
      margem_esquerda: modelo.margem_esquerda,
      espaco_horizontal: modelo.espaco_horizontal,
      espaco_vertical: modelo.espaco_vertical,
      fonte_nome: modelo.fonte_nome,
      fonte_preco: modelo.fonte_preco,
      fonte_codigo: modelo.fonte_codigo,
      fonte_extra: modelo.fonte_extra,
      colunas: modelo.colunas,
      alinhamento: modelo.alinhamento,
      borda_impressao: modelo.borda_impressao,
      mostrar_nome: modelo.mostrar_nome,
      mostrar_preco: modelo.mostrar_preco,
      mostrar_codigo: modelo.mostrar_codigo,
      mostrar_barras: modelo.mostrar_barras,
      mostrar_empresa: modelo.mostrar_empresa,
      mostrar_data: modelo.mostrar_data,
      mostrar_unidade: modelo.mostrar_unidade,
      mostrar_estoque: modelo.mostrar_estoque,
      mostrar_grupo: modelo.mostrar_grupo,
      mostrar_preco_promocional: modelo.mostrar_preco_promocional,
      texto_livre: modelo.texto_livre,
      ativo: true,
    }));

    const { data, error } = await supabase
      .from("modelos_etiquetas")
      .insert(modelosParaSalvar)
      .select("*");

    if (error) {
      alert("Erro ao criar modelos padrão: " + error.message);
      setModelos(modelosPadrao);
      return;
    }

    const normalizados = (data || []).map(normalizarModelo);
    setModelos(normalizados.length > 0 ? normalizados : modelosPadrao);
    setModeloSelecionadoId(normalizados[0]?.id || modelosPadrao[0].id);
  }

  function modeloParaSupabase(modelo: ModeloEtiqueta, empresaId: string) {
    return {
      empresa_id: empresaId,
      nome: modelo.nome,
      largura: modelo.largura,
      altura: modelo.altura,
      margem_topo: modelo.margem_topo,
      margem_esquerda: modelo.margem_esquerda,
      espaco_horizontal: modelo.espaco_horizontal,
      espaco_vertical: modelo.espaco_vertical,
      fonte_nome: modelo.fonte_nome,
      fonte_preco: modelo.fonte_preco,
      fonte_codigo: modelo.fonte_codigo,
      fonte_extra: modelo.fonte_extra,
      colunas: modelo.colunas,
      alinhamento: modelo.alinhamento,
      borda_impressao: modelo.borda_impressao,
      mostrar_nome: modelo.mostrar_nome,
      mostrar_preco: modelo.mostrar_preco,
      mostrar_codigo: modelo.mostrar_codigo,
      mostrar_barras: modelo.mostrar_barras,
      mostrar_empresa: modelo.mostrar_empresa,
      mostrar_data: modelo.mostrar_data,
      mostrar_unidade: modelo.mostrar_unidade,
      mostrar_estoque: modelo.mostrar_estoque,
      mostrar_grupo: modelo.mostrar_grupo,
      mostrar_preco_promocional: modelo.mostrar_preco_promocional,
      texto_livre: modelo.texto_livre,
      ativo: true,
    };
  }

  async function carregarProdutos() {
    const empresaId = empresaAtualId();
    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("produtos")
      .select("id,codigo,codigo_barras,nome,preco_venda,qtd_atual,ativo,unidade")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    setCarregando(false);

    if (error) {
      alert("Erro ao carregar produtos: " + error.message);
      return;
    }

    setProdutos(data || []);
  }

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();

    return produtos.filter((produto) => {
      if (!termo) return true;

      return (
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.codigo || "").toLowerCase().includes(termo) ||
        String(produto.codigo_barras || "").toLowerCase().includes(termo) ||
        false
      );
    });
  }, [produtos, buscaProduto]);

  const produtoSelecionado = produtos.find((produto) => produto.id === produtoSelecionadoId);

  function codigoProduto(produto: Produto) {
    return produto.codigo_barras || produto.codigo || produto.id || "-";
  }

  function grupoProduto(produto: Produto) {
    return "-";
  }

  function precoEtiqueta(item: ItemImpressao) {
    const modelo = modeloAtual();
    if (modelo.mostrar_preco_promocional && item.preco_promocional) {
      return converterNumero(item.preco_promocional);
    }
    return Number(item.produto.preco_venda || 0);
  }

  function adicionarProduto() {
    if (!produtoSelecionado) {
      alert("Selecione um produto.");
      return;
    }

    const qtd = Number(quantidade || 0);
    if (qtd <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }

    const existente = itens.find((item) => item.produto.id === produtoSelecionado.id);
    if (existente) {
      setItens(
        itens.map((item) =>
          item.produto.id === produtoSelecionado.id
            ? {
                ...item,
                quantidade: item.quantidade + qtd,
                preco_promocional: precoPromocional || item.preco_promocional,
              }
            : item
        )
      );
    } else {
      setItens([
        ...itens,
        {
          produto: produtoSelecionado,
          quantidade: qtd,
          preco_promocional: precoPromocional,
        },
      ]);
    }

    setProdutoSelecionadoId("");
    setQuantidade("1");
    setPrecoPromocional("");
    setBuscaProduto("");
  }

  function removerItem(produtoId: string) {
    setItens(itens.filter((item) => item.produto.id !== produtoId));
  }

  function alterarQuantidadeItem(produtoId: string, qtd: string) {
    const novaQtd = Number(qtd || 0);
    if (novaQtd <= 0) return;

    setItens(
      itens.map((item) =>
        item.produto.id === produtoId ? { ...item, quantidade: novaQtd } : item
      )
    );
  }

  function alterarPromocionalItem(produtoId: string, valor: string) {
    setItens(
      itens.map((item) =>
        item.produto.id === produtoId
          ? { ...item, preco_promocional: valor }
          : item
      )
    );
  }

  function abrirNovoModelo() {
    const atual = modeloAtual();
    setModeloEditando({
      ...atual,
      id: "",
      nome: "Novo Modelo de Etiqueta",
    });
    setModalModelo(true);
  }

  function abrirEditarModelo(modelo: ModeloEtiqueta) {
    setModeloEditando({ ...normalizarModelo(modelo) });
    setModalModelo(true);
  }

  async function salvarModelo() {
    if (!modeloEditando) return;

    const empresaId = empresaAtualId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    if (!modeloEditando.nome.trim()) {
      alert("Informe o nome do modelo.");
      return;
    }

    if (Number(modeloEditando.largura || 0) <= 0 || Number(modeloEditando.altura || 0) <= 0) {
      alert("Informe largura e altura válidas.");
      return;
    }

    const payload = modeloParaSupabase(modeloEditando, empresaId);

    if (modeloEditando.id) {
      const { data, error } = await supabase
        .from("modelos_etiquetas")
        .update(payload)
        .eq("id", modeloEditando.id)
        .eq("empresa_id", empresaId)
        .select("*")
        .single();

      if (error) {
        alert("Erro ao atualizar modelo: " + error.message);
        return;
      }

      const atualizado = normalizarModelo(data);
      setModelos(
        modelos.map((modelo) =>
          modelo.id === atualizado.id ? atualizado : modelo
        )
      );
      setModeloSelecionadoId(atualizado.id);
    } else {
      const { data, error } = await supabase
        .from("modelos_etiquetas")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        alert("Erro ao salvar novo modelo: " + error.message);
        return;
      }

      const novo = normalizarModelo(data);
      setModelos([...modelos, novo]);
      setModeloSelecionadoId(novo.id);
    }

    setModalModelo(false);
    setModeloEditando(null);
  }

  async function excluirModelo(id: string) {
    const empresaId = empresaAtualId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    if (modelos.length <= 1) {
      alert("É necessário manter pelo menos um modelo.");
      return;
    }

    const confirmar = confirm("Deseja excluir este modelo de etiqueta?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("modelos_etiquetas")
      .update({ ativo: false })
      .eq("id", id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao excluir modelo: " + error.message);
      return;
    }

    const novaLista = modelos.filter((modelo) => modelo.id !== id);
    setModelos(novaLista);
    setModeloSelecionadoId(novaLista[0].id);
  }

  async function resetarModelosPadrao() {
    const empresaId = empresaAtualId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    const confirmar = confirm(
      "Deseja restaurar os modelos padrão? Os modelos atuais serão desativados e novos modelos serão criados."
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from("modelos_etiquetas")
      .update({ ativo: false })
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao restaurar modelos: " + error.message);
      return;
    }

    await criarModelosPadraoNoSupabase(empresaId);
  }

  function gerarLinhasImpressao() {
    const lista: ItemImpressao[] = [];
    itens.forEach((item) => {
      for (let i = 0; i < item.quantidade; i++) lista.push(item);
    });
    return lista;
  }

  function montarCodigoBarrasFake(codigo: string) {
    return String(codigo || "7890000000000")
      .split("")
      .map((char, index) => {
        const numero = Number(char) || index;
        const altura = numero % 2 === 0 ? 19 : 15;
        const largura = numero % 3 === 0 ? 2 : 1;
        return `<span style="height:${altura}px;width:${largura}px;"></span>`;
      })
      .join("");
  }

  function imprimirEtiquetas() {
    if (itens.length === 0) {
      alert("Adicione produtos para imprimir.");
      return;
    }

    const modelo = modeloAtual();
    const itensImpressao = gerarLinhasImpressao();

    const etiquetasHtml = itensImpressao
      .map((item) => {
        const produto = item.produto;
        const codigo = codigoProduto(produto);

        return `
          <div class="etiqueta">
            ${modelo.mostrar_empresa ? `<div class="empresa-label">${empresaNome()}</div>` : ""}
            ${modelo.texto_livre ? `<div class="texto-livre">${modelo.texto_livre}</div>` : ""}
            ${modelo.mostrar_nome ? `<div class="nome">${produto.nome || "-"}</div>` : ""}
            ${modelo.mostrar_grupo ? `<div class="extra">Grupo: ${grupoProduto(produto)}</div>` : ""}
            ${modelo.mostrar_unidade ? `<div class="extra">Unidade: ${produto.unidade || "UN"}</div>` : ""}
            ${modelo.mostrar_estoque ? `<div class="extra">Estoque: ${produto.qtd_atual ?? 0}</div>` : ""}
            ${modelo.mostrar_preco ? `<div class="preco">${formatarMoeda(precoEtiqueta(item))}</div>` : ""}
            ${modelo.mostrar_barras ? `<div class="barcode">${montarCodigoBarrasFake(codigo)}</div>` : ""}
            ${modelo.mostrar_codigo ? `<div class="codigo">Cód: ${codigo}</div>` : ""}
            ${modelo.mostrar_data ? `<div class="extra">Impresso em ${new Date().toLocaleDateString("pt-BR")}</div>` : ""}
          </div>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Impressão de Etiquetas</title>
          <style>
            @page { size: A4; margin: 0; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: ${modelo.margem_topo}mm 0 0 ${modelo.margem_esquerda}mm;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            }
            .folha {
              display: grid;
              grid-template-columns: repeat(${modelo.colunas}, ${modelo.largura}mm);
              column-gap: ${modelo.espaco_horizontal}mm;
              row-gap: ${modelo.espaco_vertical}mm;
              align-items: start;
            }
            .etiqueta {
              width: ${modelo.largura}mm;
              height: ${modelo.altura}mm;
              border: ${modelo.borda_impressao ? "1px solid #111827" : "1px dashed #cbd5e1"};
              padding: 2mm;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: ${modelo.alinhamento === "left" ? "flex-start" : modelo.alinhamento === "right" ? "flex-end" : "center"};
              justify-content: center;
              text-align: ${modelo.alinhamento};
              page-break-inside: avoid;
            }
            .empresa-label { font-size: ${modelo.fonte_extra}px; font-weight: bold; line-height: 1; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .texto-livre { font-size: ${modelo.fonte_extra + 1}px; font-weight: 900; line-height: 1; text-transform: uppercase; margin-bottom: 1mm; }
            .nome { font-size: ${modelo.fonte_nome}px; font-weight: bold; line-height: 1.05; max-height: 22px; overflow: hidden; margin-bottom: 1mm; }
            .preco { font-size: ${modelo.fonte_preco}px; font-weight: 900; line-height: 1; margin-bottom: 1mm; }
            .codigo { font-size: ${modelo.fonte_codigo}px; margin-top: 1mm; white-space: nowrap; }
            .extra { font-size: ${modelo.fonte_extra}px; line-height: 1.05; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .barcode { height: 20px; display: flex; align-items: flex-end; justify-content: center; gap: 1px; margin-top: 1mm; overflow: hidden; width: 100%; }
            .barcode span { display: inline-block; background: #111827; }
            @media print { .etiqueta { border: ${modelo.borda_impressao ? "1px solid #111827" : "none"}; } }
          </style>
        </head>
        <body>
          <div class="folha">${etiquetasHtml}</div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank", "width=1000,height=800");
    if (!janela) {
      alert("O navegador bloqueou a janela de impressão. Libere pop-ups.");
      return;
    }
    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }

  useEffect(() => {
    carregarModelosSalvos();
    carregarProdutos();
  }, []);

  const modelo = modeloAtual();
  const totalEtiquetas = itens.reduce(
    (total, item) => total + Number(item.quantidade || 0),
    0
  );

  const itemPreview: ItemImpressao = {
    produto: produtoSelecionado || {
      id: "preview",
      codigo: "000001",
      codigo_barras: "7890000000000",
      nome: "Nome do Produto",
      preco_venda: 9.99,
      qtd_atual: 10,
      ativo: true,
      unidade: "UN",
    },
    quantidade: 1,
    preco_promocional: precoPromocional,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">THCloud ERP</p>
            <h1 className="text-4xl font-black mt-2">Etiquetas de Produtos</h1>
            <p className="text-blue-100 mt-2 max-w-4xl">
              Crie modelos de etiquetas, escolha quais informações aparecem, salve configurações e imprima produtos com preço, código e barras.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button onClick={abrirNovoModelo} className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2">
              <Plus size={20} /> Novo Modelo
            </button>
            <button onClick={imprimirEtiquetas} className="bg-blue-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-900 flex items-center justify-center gap-2">
              <Printer size={20} /> Imprimir Etiquetas
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center"><Settings size={24} /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Modelo da Etiqueta</h2>
                <p className="text-sm text-slate-500">Escolha ou edite um modelo salvo.</p>
              </div>
            </div>

            <label className="block text-sm font-black text-slate-700 mb-2">Modelo</label>
            <select value={modeloSelecionadoId} onChange={(e) => setModeloSelecionadoId(e.target.value)} className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 bg-white font-semibold">
              {modelos.map((modelo) => <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>)}
            </select>

            <div className="flex gap-3 mt-4">
              <button onClick={() => abrirEditarModelo(modelo)} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-2xl font-black flex items-center justify-center gap-2"><Edit size={18} /> Editar</button>
              <button onClick={abrirNovoModelo} className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-2xl font-black"><Plus size={18} /></button>
              <button onClick={() => excluirModelo(modelo.id)} className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-2xl font-black"><Trash2 size={18} /></button>
            </div>

            <button onClick={resetarModelosPadrao} className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-2xl font-black">Restaurar Modelos Padrão</button>

            <div className="mt-5 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="font-black text-slate-900 mb-2">Configuração atual</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                <p>Largura: <strong>{modelo.largura}mm</strong></p>
                <p>Altura: <strong>{modelo.altura}mm</strong></p>
                <p>Colunas: <strong>{modelo.colunas}</strong></p>
                <p>Topo: <strong>{modelo.margem_topo}mm</strong></p>
                <p>Alinhamento: <strong>{modelo.alinhamento}</strong></p>
                <p>Borda: <strong>{modelo.borda_impressao ? "Sim" : "Não"}</strong></p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center"><Package size={24} /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Adicionar Produto</h2>
                <p className="text-sm text-slate-500">Escolha produto e quantidade de etiquetas.</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} placeholder="Buscar por nome, código ou barras..." className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900 font-semibold bg-white placeholder:text-slate-500" />
            </div>

            <select value={produtoSelecionadoId} onChange={(e) => setProdutoSelecionadoId(e.target.value)} className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-semibold bg-white mb-4">
              <option value="">Selecione um produto</option>
              {produtosFiltrados.slice(0, 100).map((produto) => (
                <option key={produto.id} value={produto.id}>{produto.codigo || produto.codigo_barras || "-"} - {produto.nome}</option>
              ))}
            </select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">Quantidade de etiquetas</label>
                <input value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full border border-slate-300 p-3 rounded-2xl text-slate-950 font-black bg-white placeholder:text-slate-500" placeholder="Quantidade" />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">Preço promocional</label>
                <input value={precoPromocional} onChange={(e) => setPrecoPromocional(e.target.value)} className="w-full border border-slate-300 p-3 rounded-2xl text-slate-950 font-black bg-white placeholder:text-slate-500" placeholder="Opcional" />
              </div>
            </div>

            <button onClick={adicionarProduto} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2"><Plus size={18} /> Adicionar para Impressão</button>
            <p className="text-sm text-slate-500 mt-4">{carregando ? "Carregando produtos..." : `${produtosFiltrados.length} produto(s) encontrado(s).`}</p>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-700 flex items-center justify-center"><Eye size={24} /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Prévia Aprimorada da Etiqueta</h2>
                <p className="text-sm text-slate-500">Visual aproximado com as informações marcadas no modelo.</p>
              </div>
            </div>

            <div className="bg-slate-100 rounded-3xl p-8 overflow-auto">
              <div className="flex items-center justify-center min-h-[260px]">
                <div className="bg-white border-2 border-dashed border-slate-400 shadow-xl overflow-hidden" style={{ width: `${modelo.largura * 4}px`, height: `${modelo.altura * 4}px`, padding: "10px", textAlign: modelo.alinhamento, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: modelo.alinhamento === "left" ? "flex-start" : modelo.alinhamento === "right" ? "flex-end" : "center" }}>
                  {modelo.mostrar_empresa && <p className="text-xs font-black text-slate-700 truncate max-w-full">{empresaNome()}</p>}
                  {modelo.texto_livre && <p className="text-sm font-black text-red-700 uppercase truncate max-w-full">{modelo.texto_livre}</p>}
                  {modelo.mostrar_nome && <p className="font-black text-slate-900 leading-tight max-w-full" style={{ fontSize: `${modelo.fonte_nome + 5}px` }}>{itemPreview.produto.nome}</p>}
                  {modelo.mostrar_grupo && <p className="text-xs text-slate-700 truncate max-w-full">Grupo: {grupoProduto(itemPreview.produto)}</p>}
                  {modelo.mostrar_unidade && <p className="text-xs text-slate-700">Unidade: {itemPreview.produto.unidade || "UN"}</p>}
                  {modelo.mostrar_estoque && <p className="text-xs text-slate-700">Estoque: {itemPreview.produto.qtd_atual ?? 0}</p>}
                  {modelo.mostrar_preco && <p className="font-black text-blue-800 my-1" style={{ fontSize: `${modelo.fonte_preco + 8}px` }}>{formatarMoeda(precoEtiqueta(itemPreview))}</p>}
                  {modelo.mostrar_barras && (
                    <div className="flex items-end justify-center gap-[2px] h-10 my-1 max-w-full overflow-hidden">
                      {String(codigoProduto(itemPreview.produto)).split("").map((char, index) => {
                        const numero = Number(char) || index;
                        return <span key={index} className="bg-slate-900 inline-block" style={{ height: numero % 2 === 0 ? "34px" : "25px", width: numero % 3 === 0 ? "4px" : "2px" }} />;
                      })}
                    </div>
                  )}
                  {modelo.mostrar_codigo && <p className="text-slate-800 font-bold" style={{ fontSize: `${modelo.fonte_codigo + 3}px` }}>Cód: {codigoProduto(itemPreview.produto)}</p>}
                  {modelo.mostrar_data && <p className="text-[10px] text-slate-600">{new Date().toLocaleDateString("pt-BR")}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <InfoPreview titulo="Tamanho" valor={`${modelo.largura} x ${modelo.altura} mm`} />
              <InfoPreview titulo="Colunas" valor={`${modelo.colunas}`} />
              <InfoPreview titulo="Total" valor={`${totalEtiquetas} etiqueta(s)`} />
              <InfoPreview titulo="Produto" valor={produtoSelecionado?.nome || "Prévia"} />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div><h2 className="text-2xl font-black text-slate-900">Produtos para Impressão</h2><p className="text-slate-500">Lista de produtos que serão impressos.</p></div>
              <button onClick={() => setItens([])} className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl font-black">Limpar</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead><tr className="bg-slate-100 text-slate-700"><th className="p-4 text-left">Produto</th><th className="p-4 text-left">Código</th><th className="p-4 text-right">Preço</th><th className="p-4 text-right">Promoção</th><th className="p-4 text-center">Quantidade</th><th className="p-4 text-center">Ação</th></tr></thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.produto.id} className="border-b border-slate-100">
                      <td className="p-4 font-black text-slate-900">{item.produto.nome}</td>
                      <td className="p-4 text-slate-700 font-semibold">{codigoProduto(item.produto)}</td>
                      <td className="p-4 text-right font-black text-blue-700">{formatarMoeda(item.produto.preco_venda)}</td>
                      <td className="p-4 text-right"><input value={item.preco_promocional} onChange={(e) => alterarPromocionalItem(item.produto.id, e.target.value)} className="w-28 border border-slate-300 rounded-xl p-2 text-right text-slate-950 font-black bg-white" placeholder="Opcional" /></td>
                      <td className="p-4 text-center"><input value={item.quantidade} onChange={(e) => alterarQuantidadeItem(item.produto.id, e.target.value)} className="w-24 border border-slate-300 rounded-xl p-2 text-center text-slate-950 font-black bg-white" /></td>
                      <td className="p-4 text-center"><button onClick={() => removerItem(item.produto.id)} className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold">Remover</button></td>
                    </tr>
                  ))}
                  {itens.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">Nenhum produto adicionado para impressão.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-slate-600">Total de etiquetas: <strong>{totalEtiquetas}</strong></p>
              <button onClick={imprimirEtiquetas} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2"><Printer size={20} /> Imprimir Etiquetas</button>
            </div>
          </div>
        </div>
      </div>

      {modalModelo && modeloEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div><h2 className="text-3xl font-black text-slate-900">Configurar Modelo de Etiqueta</h2><p className="text-slate-500">Ajuste tamanho, margens, colunas e informações exibidas.</p></div>
              <button onClick={() => setModalModelo(false)} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black">✕</button>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-black text-slate-900 mb-4">Tamanho e Layout</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <Campo titulo="Nome do modelo"><input value={modeloEditando.nome} onChange={(e) => setModeloEditando({ ...modeloEditando, nome: e.target.value })} className="input-etiqueta" /></Campo>
                <Campo titulo="Largura (mm)"><input value={modeloEditando.largura} onChange={(e) => setModeloEditando({ ...modeloEditando, largura: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Altura (mm)"><input value={modeloEditando.altura} onChange={(e) => setModeloEditando({ ...modeloEditando, altura: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Colunas por folha"><input value={modeloEditando.colunas} onChange={(e) => setModeloEditando({ ...modeloEditando, colunas: Number(e.target.value || 1) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Margem topo (mm)"><input value={modeloEditando.margem_topo} onChange={(e) => setModeloEditando({ ...modeloEditando, margem_topo: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Margem esquerda (mm)"><input value={modeloEditando.margem_esquerda} onChange={(e) => setModeloEditando({ ...modeloEditando, margem_esquerda: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Espaço horizontal (mm)"><input value={modeloEditando.espaco_horizontal} onChange={(e) => setModeloEditando({ ...modeloEditando, espaco_horizontal: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Espaço vertical (mm)"><input value={modeloEditando.espaco_vertical} onChange={(e) => setModeloEditando({ ...modeloEditando, espaco_vertical: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Fonte nome"><input value={modeloEditando.fonte_nome} onChange={(e) => setModeloEditando({ ...modeloEditando, fonte_nome: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Fonte preço"><input value={modeloEditando.fonte_preco} onChange={(e) => setModeloEditando({ ...modeloEditando, fonte_preco: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Fonte código"><input value={modeloEditando.fonte_codigo} onChange={(e) => setModeloEditando({ ...modeloEditando, fonte_codigo: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Fonte extras"><input value={modeloEditando.fonte_extra} onChange={(e) => setModeloEditando({ ...modeloEditando, fonte_extra: Number(e.target.value || 0) })} className="input-etiqueta" /></Campo>
                <Campo titulo="Alinhamento"><select value={modeloEditando.alinhamento} onChange={(e) => setModeloEditando({ ...modeloEditando, alinhamento: e.target.value as "center" | "left" | "right" })} className="input-etiqueta"><option value="center">Centralizado</option><option value="left">Esquerda</option><option value="right">Direita</option></select></Campo>
                <Campo titulo="Texto livre"><input value={modeloEditando.texto_livre} onChange={(e) => setModeloEditando({ ...modeloEditando, texto_livre: e.target.value })} placeholder="Ex.: OFERTA" className="input-etiqueta" /></Campo>
              </div>

              <h3 className="text-xl font-black text-slate-900 mt-8 mb-4">Informações que sairão na etiqueta</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <CheckModelo titulo="Nome do produto" checked={modeloEditando.mostrar_nome} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_nome: checked })} />
                <CheckModelo titulo="Preço" checked={modeloEditando.mostrar_preco} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_preco: checked })} />
                <CheckModelo titulo="Código" checked={modeloEditando.mostrar_codigo} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_codigo: checked })} />
                <CheckModelo titulo="Código de barras" checked={modeloEditando.mostrar_barras} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_barras: checked })} />
                <CheckModelo titulo="Nome da empresa" checked={modeloEditando.mostrar_empresa} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_empresa: checked })} />
                <CheckModelo titulo="Data de impressão" checked={modeloEditando.mostrar_data} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_data: checked })} />
                <CheckModelo titulo="Unidade" checked={modeloEditando.mostrar_unidade} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_unidade: checked })} />
                <CheckModelo titulo="Estoque" checked={modeloEditando.mostrar_estoque} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_estoque: checked })} />
                <CheckModelo titulo="Usar preço promocional" checked={modeloEditando.mostrar_preco_promocional} onChange={(checked) => setModeloEditando({ ...modeloEditando, mostrar_preco_promocional: checked })} />
                <CheckModelo titulo="Imprimir borda" checked={modeloEditando.borda_impressao} onChange={(checked) => setModeloEditando({ ...modeloEditando, borda_impressao: checked })} />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-3">
              <button onClick={() => setModalModelo(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black">Cancelar</button>
              <button onClick={salvarModelo} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2"><Save size={20} /> Salvar Modelo</button>
            </div>

            <style jsx global>{`.input-etiqueta{width:100%;border:1px solid rgb(203 213 225);border-radius:1rem;padding:.75rem 1rem;color:rgb(2 6 23);background:white;font-weight:800;outline:none}.input-etiqueta::placeholder{color:rgb(100 116 139)}.input-etiqueta:focus{border-color:rgb(37 99 235);box-shadow:0 0 0 3px rgb(37 99 235 / .12)}`}</style>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-black text-slate-700 mb-2">{titulo}</label>{children}</div>;
}

function CheckModelo({ titulo, checked, onChange }: { titulo: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="border border-slate-200 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" /><span className="font-black text-slate-800">{titulo}</span></label>;
}

function InfoPreview({ titulo, valor }: { titulo: string; valor: string }) {
  return <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4"><p className="text-xs font-bold text-slate-500">{titulo}</p><p className="text-slate-900 font-black mt-1 truncate">{valor}</p></div>;
}
