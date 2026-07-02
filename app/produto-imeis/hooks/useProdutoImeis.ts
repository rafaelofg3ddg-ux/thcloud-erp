"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";

export type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
  preco_venda: number | null;
  qtd_atual: number | null;
  controla_imei?: boolean | null;
};

export type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  whatsapp: string | null;
};

export type ProdutoImei = {
  id: string;
  empresa_id: string;
  produto_id: string;
  cliente_id: string | null;
  imei: string;
  imei_2: string | null;
  numero_serie: string | null;
  cor: string | null;
  capacidade: string | null;
  status: string;
  venda_id: string | null;
  item_venda_id: string | null;
  data_venda: string | null;
  observacoes: string | null;
  usuario: string | null;
  created_at: string;
  updated_at: string;
  produtos?: Produto | null;
  clientes?: Cliente | null;
};

export type HistoricoIMEI = {
  id: string;
  empresa_id: string;
  produto_imei_id: string;
  acao: string;
  status_anterior: string | null;
  status_novo: string | null;
  venda_id: string | null;
  cliente_id: string | null;
  descricao: string | null;
  usuario: string | null;
  created_at: string;
};

export const statusOpcoes = [
  { codigo: "disponivel", nome: "Disponível" },
  { codigo: "reservado", nome: "Reservado" },
  { codigo: "vendido", nome: "Vendido" },
  { codigo: "garantia", nome: "Garantia" },
  { codigo: "assistencia", nome: "Assistência" },
  { codigo: "devolvido", nome: "Devolvido" },
  { codigo: "cancelado", nome: "Cancelado" },
];

export function useProdutoImeis() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [imeis, setImeis] = useState<ProdutoImei[]>([]);
  const [historico, setHistorico] = useState<HistoricoIMEI[]>([]);

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [modalAberto, setModalAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [editando, setEditando] = useState<ProdutoImei | null>(null);
  const [imeiSelecionado, setImeiSelecionado] = useState<ProdutoImei | null>(null);

  const [produtoId, setProdutoId] = useState("");
  const [produtoBusca, setProdutoBusca] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clienteBusca, setClienteBusca] = useState("");
  const [imei, setImei] = useState("");
  const [imei2, setImei2] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [cor, setCor] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [status, setStatus] = useState("disponivel");
  const [observacoes, setObservacoes] = useState("");

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
      const storage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (!storage) return "Sistema";

      const usuario = JSON.parse(storage) as {
        nome?: string;
        email?: string;
        usuario?: string;
      };

      return usuario.nome || usuario.email || usuario.usuario || "Sistema";
    } catch {
      return "Sistema";
    }
  }

  function dinheiro(valor: unknown) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function dataBR(data: string | null | undefined) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function statusNome(codigo: string) {
    return statusOpcoes.find((item) => item.codigo === codigo)?.nome || codigo;
  }

  function statusClasse(codigo: string) {
    const mapa: Record<string, string> = {
      disponivel: "bg-green-100 text-green-700",
      reservado: "bg-yellow-100 text-yellow-700",
      vendido: "bg-blue-100 text-blue-700",
      garantia: "bg-purple-100 text-purple-700",
      assistencia: "bg-indigo-100 text-indigo-700",
      devolvido: "bg-slate-100 text-slate-700",
      cancelado: "bg-red-100 text-red-700",
    };

    return mapa[codigo] || "bg-slate-100 text-slate-700";
  }

  function limparFormulario() {
    setEditando(null);
    setProdutoId("");
    setProdutoBusca("");
    setClienteId("");
    setClienteBusca("");
    setImei("");
    setImei2("");
    setNumeroSerie("");
    setCor("");
    setCapacidade("");
    setStatus("disponivel");
    setObservacoes("");
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);

    const [prodReq, cliReq, imeiReq] = await Promise.all([
      supabase
        .from("produtos")
        .select("id,codigo,codigo_barras,nome,preco_venda,qtd_atual,controla_imei")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("clientes")
        .select("id,nome,cpf_cnpj,whatsapp")
        .eq("empresa_id", empresaId)
        .order("nome"),
      supabase
        .from("produto_imeis")
        .select("*, produtos:produto_id(id,codigo,codigo_barras,nome,preco_venda,qtd_atual,controla_imei), clientes:cliente_id(id,nome,cpf_cnpj,whatsapp)")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false }),
    ]);

    if (prodReq.error) alert("Erro ao carregar produtos: " + prodReq.error.message);
    if (cliReq.error) alert("Erro ao carregar clientes: " + cliReq.error.message);
    if (imeiReq.error) alert("Erro ao carregar IMEIs: " + imeiReq.error.message);

    setProdutos((prodReq.data || []) as Produto[]);
    setClientes((cliReq.data || []) as Cliente[]);
    setImeis((imeiReq.data || []) as ProdutoImei[]);

    setCarregando(false);
  }

  function abrirNovo() {
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEdicao(item: ProdutoImei) {
    setEditando(item);
    setProdutoId(item.produto_id);
    setProdutoBusca(item.produtos?.nome || "");
    setClienteId(item.cliente_id || "");
    setClienteBusca(item.clientes?.nome || "");
    setImei(item.imei || "");
    setImei2(item.imei_2 || "");
    setNumeroSerie(item.numero_serie || "");
    setCor(item.cor || "");
    setCapacidade(item.capacidade || "");
    setStatus(item.status || "disponivel");
    setObservacoes(item.observacoes || "");
    setModalAberto(true);
  }

  async function registrarHistorico(params: {
    produtoImeiId: string;
    acao: string;
    statusAnterior?: string | null;
    statusNovo?: string | null;
    descricao: string;
    clienteId?: string | null;
  }) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    await supabase.from("produto_imei_historico").insert([
      {
        empresa_id: empresaId,
        produto_imei_id: params.produtoImeiId,
        acao: params.acao,
        status_anterior: params.statusAnterior || null,
        status_novo: params.statusNovo || null,
        cliente_id: params.clienteId || null,
        descricao: params.descricao,
        usuario: operadorAtual(),
      },
    ]);
  }

  async function ativarControleImeiProduto(idProduto: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    await supabase
      .from("produtos")
      .update({ controla_imei: true })
      .eq("empresa_id", empresaId)
      .eq("id", idProduto);
  }

  async function salvarImei() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!produtoId) {
      alert("Selecione o produto/celular.");
      return;
    }

    if (!imei.trim()) {
      alert("Informe o IMEI.");
      return;
    }

    setSalvando(true);

    const payload = {
      empresa_id: empresaId,
      produto_id: produtoId,
      cliente_id: clienteId || null,
      imei: imei.trim(),
      imei_2: imei2.trim() || null,
      numero_serie: numeroSerie.trim() || null,
      cor: cor.trim() || null,
      capacidade: capacidade.trim() || null,
      status,
      observacoes: observacoes.trim() || null,
      usuario: operadorAtual(),
    };

    if (editando) {
      const statusAnterior = editando.status;

      const { error } = await supabase
        .from("produto_imeis")
        .update(payload)
        .eq("empresa_id", empresaId)
        .eq("id", editando.id);

      if (error) {
        alert("Erro ao alterar IMEI: " + error.message);
        setSalvando(false);
        return;
      }

      await registrarHistorico({
        produtoImeiId: editando.id,
        acao: "ALTERACAO_IMEI",
        statusAnterior,
        statusNovo: status,
        descricao: "Cadastro de IMEI alterado.",
        clienteId: clienteId || null,
      });

      alert("IMEI alterado com sucesso.");
    } else {
      const { data, error } = await supabase
        .from("produto_imeis")
        .insert([payload])
        .select("id")
        .single();

      if (error) {
        alert("Erro ao cadastrar IMEI: " + error.message);
        setSalvando(false);
        return;
      }

      await ativarControleImeiProduto(produtoId);

      if (data?.id) {
        await registrarHistorico({
          produtoImeiId: data.id,
          acao: "CADASTRO_IMEI",
          statusAnterior: null,
          statusNovo: status,
          descricao: "IMEI cadastrado no estoque.",
          clienteId: clienteId || null,
        });
      }

      alert("IMEI cadastrado com sucesso.");
    }

    setSalvando(false);
    setModalAberto(false);
    limparFormulario();
    await carregarDados();
  }

  async function alterarStatus(item: ProdutoImei, novoStatus: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (item.status === "vendido" && novoStatus !== "vendido") {
      if (!confirm("Este IMEI está vendido. Deseja realmente alterar o status?")) {
        return;
      }
    }

    const { error } = await supabase
      .from("produto_imeis")
      .update({
        status: novoStatus,
        usuario: operadorAtual(),
        updated_at: new Date().toISOString(),
      })
      .eq("empresa_id", empresaId)
      .eq("id", item.id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    await registrarHistorico({
      produtoImeiId: item.id,
      acao: "ALTERACAO_STATUS",
      statusAnterior: item.status,
      statusNovo: novoStatus,
      descricao: `Status alterado de ${statusNome(item.status)} para ${statusNome(novoStatus)}.`,
      clienteId: item.cliente_id,
    });

    await carregarDados();
  }

  async function excluirImei(item: ProdutoImei) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (item.status === "vendido") {
      alert("IMEI vendido não pode ser excluído.");
      return;
    }

    if (!confirm(`Deseja excluir o IMEI ${item.imei}?`)) return;

    const { error } = await supabase
      .from("produto_imeis")
      .delete()
      .eq("empresa_id", empresaId)
      .eq("id", item.id);

    if (error) {
      alert("Erro ao excluir IMEI: " + error.message);
      return;
    }

    await carregarDados();
  }

  async function abrirHistorico(item: ProdutoImei) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setImeiSelecionado(item);
    setModalHistoricoAberto(true);

    const { data, error } = await supabase
      .from("produto_imei_historico")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("produto_imei_id", item.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar histórico: " + error.message);
      return;
    }

    setHistorico((data || []) as HistoricoIMEI[]);
  }

  function imprimirEtiqueta(item: ProdutoImei) {
    const html = `
      <html>
        <head>
          <title>Etiqueta IMEI</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            .etiqueta { width: 280px; border: 1px solid #111827; padding: 12px; border-radius: 8px; }
            h2 { margin: 0 0 8px; font-size: 18px; }
            p { margin: 3px 0; font-size: 12px; }
            .imei { font-size: 16px; font-weight: bold; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="margin-bottom:10px;padding:8px 12px;">Imprimir</button>
          <div class="etiqueta">
            <h2>Th Cloud</h2>
            <p><b>Produto:</b> ${item.produtos?.nome || "-"}</p>
            <p class="imei">IMEI: ${item.imei}</p>
            <p>IMEI 2: ${item.imei_2 || "-"}</p>
            <p>Série: ${item.numero_serie || "-"}</p>
            <p>Cor/Capacidade: ${item.cor || "-"} ${item.capacidade || ""}</p>
          </div>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank", "width=400,height=500");

    if (!janela) {
      alert("Libere pop-ups para imprimir.");
      return;
    }

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }

  const produtosBusca = produtos
    .filter((produto) => {
      const termo = produtoBusca.toLowerCase();

      return (
        produto.nome.toLowerCase().includes(termo) ||
        String(produto.codigo || "").toLowerCase().includes(termo) ||
        String(produto.codigo_barras || "").toLowerCase().includes(termo)
      );
    })
    .slice(0, 10);

  const clientesBusca = clientes
    .filter((cliente) => {
      const termo = clienteBusca.toLowerCase();

      return (
        cliente.nome.toLowerCase().includes(termo) ||
        String(cliente.cpf_cnpj || "").toLowerCase().includes(termo) ||
        String(cliente.whatsapp || "").toLowerCase().includes(termo)
      );
    })
    .slice(0, 10);

  const imeisFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();

    return imeis.filter((item) => {
      const texto = `${item.imei} ${item.imei_2 || ""} ${
        item.numero_serie || ""
      } ${item.cor || ""} ${item.capacidade || ""} ${item.produtos?.nome || ""} ${
        item.produtos?.codigo || ""
      } ${item.clientes?.nome || ""} ${item.clientes?.cpf_cnpj || ""} ${
        item.clientes?.whatsapp || ""
      }`.toLowerCase();

      const passouPesquisa = !termo || texto.includes(termo);
      const passouStatus = filtroStatus === "todos" || item.status === filtroStatus;

      return passouPesquisa && passouStatus;
    });
  }, [imeis, pesquisa, filtroStatus]);

  const totalDisponivel = imeis.filter((item) => item.status === "disponivel").length;
  const totalVendido = imeis.filter((item) => item.status === "vendido").length;
  const totalReservado = imeis.filter((item) => item.status === "reservado").length;

  useEffect(() => {
    carregarDados();
  }, []);

  return {
    produtos,
    clientes,
    imeis,
    historico,
    carregando,
    salvando,
    pesquisa,
    setPesquisa,
    filtroStatus,
    setFiltroStatus,
    modalAberto,
    setModalAberto,
    modalHistoricoAberto,
    setModalHistoricoAberto,
    editando,
    imeiSelecionado,
    produtoId,
    setProdutoId,
    produtoBusca,
    setProdutoBusca,
    clienteId,
    setClienteId,
    clienteBusca,
    setClienteBusca,
    imei,
    setImei,
    imei2,
    setImei2,
    numeroSerie,
    setNumeroSerie,
    cor,
    setCor,
    capacidade,
    setCapacidade,
    status,
    setStatus,
    observacoes,
    setObservacoes,
    statusOpcoes,
    produtosBusca,
    clientesBusca,
    imeisFiltrados,
    totalDisponivel,
    totalVendido,
    totalReservado,
    dinheiro,
    dataBR,
    statusNome,
    statusClasse,
    carregarDados,
    abrirNovo,
    abrirEdicao,
    salvarImei,
    excluirImei,
    alterarStatus,
    abrirHistorico,
    imprimirEtiqueta,
    limparFormulario,
  };
}

export type ProdutoImeisHook = ReturnType<typeof useProdutoImeis>;
