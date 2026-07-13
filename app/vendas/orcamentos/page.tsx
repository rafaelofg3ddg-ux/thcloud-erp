"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import {
  CheckCircle,
  Edit,
  FileText,
  MessageCircle,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { formatarData, formatarMoeda } from "../../../components/global/THFormat";

type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
  preco_venda: number | null;
  qtd_atual: number | null;
};

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  whatsapp: string | null;
};

type ItemOrcamento = {
  produto_id: string | null;
  codigo: string | null;
  produto_nome: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
};

type Orcamento = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  numero_orcamento: number | null;
  cliente_nome: string | null;
  cliente_documento: string | null;
  cliente_whatsapp: string | null;
  validade: string | null;
  subtotal: number;
  desconto: number;
  valor_total: number;
  status: string;
  observacao: string | null;
  usuario: string | null;
  created_at: string;
};

type EmpresaDados = {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  logo_url: string;
};

export default function OrcamentosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [itensSalvos, setItensSalvos] = useState<Record<string, ItemOrcamento[]>>({});

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [modalEditor, setModalEditor] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [clienteNomeAvulso, setClienteNomeAvulso] = useState("");
  const [clienteDocumentoAvulso, setClienteDocumentoAvulso] = useState("");
  const [clienteWhatsappAvulso, setClienteWhatsappAvulso] = useState("");
  const [validade, setValidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [desconto, setDesconto] = useState("0");

  const [buscaProduto, setBuscaProduto] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valorUnitario, setValorUnitario] = useState("");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);

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
      const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
      return usuario.nome || "Admin";
    } catch {
      return "Admin";
    }
  }

  function empresaDados(): EmpresaDados {
    try {
      const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
      const empresa = JSON.parse(localStorage.getItem("th_empresa") || "{}");

      const endereco = [
        empresa.endereco || empresa.logradouro || empresa.rua,
        empresa.numero,
        empresa.bairro,
        empresa.cidade,
        empresa.uf || empresa.estado,
      ].filter(Boolean).join(", ");

      return {
        nome_fantasia:
          empresa.nome_fantasia ||
          empresa.nome ||
          usuario.empresa_nome ||
          "Th Cloud",
        razao_social:
          empresa.razao_social ||
          usuario.empresa_razao_social ||
          "",
        cnpj:
          empresa.cnpj ||
          usuario.empresa_cnpj ||
          "",
        telefone:
          empresa.telefone ||
          usuario.empresa_telefone ||
          "",
        whatsapp:
          empresa.whatsapp ||
          empresa.celular ||
          usuario.empresa_whatsapp ||
          "",
        email:
          empresa.email ||
          usuario.empresa_email ||
          "",
        endereco,
        logo_url:
          empresa.logo_url ||
          empresa.logo ||
          "/logo-thcloud.jpeg",
      };
    } catch {
      return {
        nome_fantasia: "Th Cloud",
        razao_social: "",
        cnpj: "",
        telefone: "",
        whatsapp: "",
        email: "",
        endereco: "",
        logo_url: "/logo-thcloud.jpeg",
      };
    }
  }

  function converterNumero(valor: string | number) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarDataHora(data: string | null | undefined) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarNumero(numero: number | null | undefined) {
    if (!numero) return "-";
    return String(numero).padStart(6, "0");
  }

  function limparWhatsApp(valor: string | null | undefined) {
    return String(valor || "").replace(/\D/g, "");
  }

  function clienteSelecionado() {
    return clientes.find((cliente) => cliente.id === clienteId) || null;
  }

  function dadosClienteAtual() {
    const cliente = clienteSelecionado();

    return {
      id: cliente?.id || null,
      nome: cliente?.nome || clienteNomeAvulso || "Consumidor Final",
      documento: cliente?.cpf_cnpj || clienteDocumentoAvulso || "",
      whatsapp: cliente?.whatsapp || clienteWhatsappAvulso || "",
    };
  }

  function subtotal() {
    return itens.reduce((total, item) => total + Number(item.subtotal || 0), 0);
  }

  function total() {
    return Math.max(subtotal() - converterNumero(desconto), 0);
  }

  function statusLabel(status: string) {
    const mapa: Record<string, string> = {
      aberto: "Aberto",
      enviado: "Enviado",
      aprovado: "Aprovado",
      recusado: "Recusado",
      cancelado: "Cancelado",
    };

    return mapa[status] || status;
  }

  function statusClasse(status: string) {
    if (status === "aprovado") return "bg-green-100 text-green-700";
    if (status === "enviado") return "bg-blue-100 text-blue-700";
    if (status === "recusado" || status === "cancelado") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  }

  async function proximoNumeroOrcamento() {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const { data, error } = await supabase
      .from("orcamentos")
      .select("numero_orcamento")
      .eq("empresa_id", empresaId)
      .not("numero_orcamento", "is", null)
      .order("numero_orcamento", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error("Erro ao gerar número do orçamento: " + error.message);
    }

    return Number(data?.[0]?.numero_orcamento || 0) + 1;
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);

    const produtosReq = await supabase
      .from("produtos")
      .select("id,codigo,codigo_barras,nome,preco_venda,qtd_atual")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (produtosReq.error) {
      setCarregando(false);
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      return;
    }

    setProdutos(produtosReq.data || []);

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome,cpf_cnpj,whatsapp")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (clientesReq.error) {
      setCarregando(false);
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      return;
    }

    setClientes(clientesReq.data || []);

    const orcamentosReq = await supabase
      .from("orcamentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(100);

    setCarregando(false);

    if (orcamentosReq.error) {
      alert("Erro ao carregar orçamentos: " + orcamentosReq.error.message);
      return;
    }

    const lista = orcamentosReq.data || [];
    setOrcamentos(lista);

    if (lista.length > 0) {
      const ids = lista.map((orc) => orc.id);

      const itensReq = await supabase
        .from("itens_orcamento")
        .select("*")
        .eq("empresa_id", empresaId)
        .in("orcamento_id", ids);

      if (!itensReq.error) {
        const agrupados: Record<string, ItemOrcamento[]> = {};

        (itensReq.data || []).forEach((item: any) => {
          if (!agrupados[item.orcamento_id]) agrupados[item.orcamento_id] = [];

          agrupados[item.orcamento_id].push({
            produto_id: item.produto_id,
            codigo: item.codigo,
            produto_nome: item.produto_nome,
            quantidade: Number(item.quantidade || 0),
            valor_unitario: Number(item.valor_unitario || 0),
            subtotal: Number(item.subtotal || 0),
          });
        });

        setItensSalvos(agrupados);
      }
    } else {
      setItensSalvos({});
    }
  }

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.toLowerCase().trim();

    return produtos.filter((produto) => {
      if (!termo) return true;

      return (
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.codigo || "").toLowerCase().includes(termo) ||
        String(produto.codigo_barras || "").toLowerCase().includes(termo)
      );
    });
  }, [produtos, buscaProduto]);

  const orcamentosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return orcamentos.filter((orc) => {
      const statusOk = statusFiltro === "todos" || orc.status === statusFiltro;

      const buscaOk =
        !termo ||
        String(orc.numero_orcamento || "").includes(termo) ||
        String(orc.cliente_nome || "").toLowerCase().includes(termo) ||
        String(orc.cliente_documento || "").toLowerCase().includes(termo) ||
        String(orc.cliente_whatsapp || "").toLowerCase().includes(termo);

      return statusOk && buscaOk;
    });
  }, [orcamentos, busca, statusFiltro]);

  function abrirNovo() {
    setEditandoId(null);
    setClienteId("");
    setClienteNomeAvulso("");
    setClienteDocumentoAvulso("");
    setClienteWhatsappAvulso("");
    setValidade(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setObservacao("Orçamento válido até a data informada. Valores sujeitos à disponibilidade de estoque.");
    setDesconto("0");
    setItens([]);
    setProdutoId("");
    setQuantidade("1");
    setValorUnitario("");
    setModalEditor(true);
  }

  function editarOrcamento(orc: Orcamento) {
    setEditandoId(orc.id);
    setClienteId(orc.cliente_id || "");
    setClienteNomeAvulso(orc.cliente_nome || "");
    setClienteDocumentoAvulso(orc.cliente_documento || "");
    setClienteWhatsappAvulso(orc.cliente_whatsapp || "");
    setValidade(orc.validade || "");
    setObservacao(orc.observacao || "");
    setDesconto(String(orc.desconto || 0).replace(".", ","));
    setItens(itensSalvos[orc.id] || []);
    setModalEditor(true);
  }

  function produtoSelecionado() {
    return produtos.find((produto) => produto.id === produtoId) || null;
  }

  function preencherPrecoProduto(id: string) {
    setProdutoId(id);

    const produto = produtos.find((item) => item.id === id);

    if (produto) {
      setValorUnitario(String(Number(produto.preco_venda || 0)).replace(".", ","));
    }
  }

  function adicionarItem() {
    const produto = produtoSelecionado();

    if (!produto) {
      alert("Selecione um produto.");
      return;
    }

    const qtd = converterNumero(quantidade);
    const valor = converterNumero(valorUnitario || produto.preco_venda || 0);

    if (qtd <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }

    if (valor < 0) {
      alert("Informe um valor válido.");
      return;
    }

    const existente = itens.find((item) => item.produto_id === produto.id);

    if (existente) {
      setItens(
        itens.map((item) => {
          if (item.produto_id !== produto.id) return item;

          const novaQuantidade = Number(item.quantidade || 0) + qtd;

          return {
            ...item,
            quantidade: novaQuantidade,
            valor_unitario: valor,
            subtotal: novaQuantidade * valor,
          };
        })
      );
    } else {
      setItens([
        ...itens,
        {
          produto_id: produto.id,
          codigo: produto.codigo || produto.codigo_barras || null,
          produto_nome: produto.nome,
          quantidade: qtd,
          valor_unitario: valor,
          subtotal: qtd * valor,
        },
      ]);
    }

    setProdutoId("");
    setQuantidade("1");
    setValorUnitario("");
    setBuscaProduto("");
  }

  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index));
  }

  function alterarQuantidadeItem(index: number, valor: string) {
    const qtd = converterNumero(valor);

    setItens(
      itens.map((item, i) =>
        i === index
          ? {
              ...item,
              quantidade: qtd,
              subtotal: qtd * Number(item.valor_unitario || 0),
            }
          : item
      )
    );
  }

  function alterarValorItem(index: number, valor: string) {
    const unitario = converterNumero(valor);

    setItens(
      itens.map((item, i) =>
        i === index
          ? {
              ...item,
              valor_unitario: unitario,
              subtotal: Number(item.quantidade || 0) * unitario,
            }
          : item
      )
    );
  }

  async function salvarOrcamento() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (itens.length === 0) {
      alert("Adicione pelo menos um item no orçamento.");
      return;
    }

    const cliente = dadosClienteAtual();

    if (!cliente.nome.trim()) {
      alert("Informe o cliente ou nome avulso.");
      return;
    }

    try {
      let orcamentoId = editandoId;
      let numero = null as number | null;

      if (!editandoId) {
        numero = await proximoNumeroOrcamento();

        const { data, error } = await supabase
          .from("orcamentos")
          .insert([
            {
              empresa_id: empresaId,
              cliente_id: cliente.id,
              numero_orcamento: numero,
              cliente_nome: cliente.nome,
              cliente_documento: cliente.documento || null,
              cliente_whatsapp: cliente.whatsapp || null,
              validade: validade || null,
              subtotal: subtotal(),
              desconto: converterNumero(desconto),
              valor_total: total(),
              status: "aberto",
              observacao,
              usuario: operadorAtual(),
            },
          ])
          .select("id")
          .single();

        if (error) throw new Error(error.message);

        orcamentoId = data.id;
      } else {
        const { error } = await supabase
          .from("orcamentos")
          .update({
            cliente_id: cliente.id,
            cliente_nome: cliente.nome,
            cliente_documento: cliente.documento || null,
            cliente_whatsapp: cliente.whatsapp || null,
            validade: validade || null,
            subtotal: subtotal(),
            desconto: converterNumero(desconto),
            valor_total: total(),
            observacao,
            usuario: operadorAtual(),
          })
          .eq("id", editandoId)
          .eq("empresa_id", empresaId);

        if (error) throw new Error(error.message);

        await supabase
          .from("itens_orcamento")
          .delete()
          .eq("orcamento_id", editandoId)
          .eq("empresa_id", empresaId);
      }

      const itensParaSalvar = itens.map((item) => ({
        empresa_id: empresaId,
        orcamento_id: orcamentoId,
        produto_id: item.produto_id,
        codigo: item.codigo,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        subtotal: item.subtotal,
      }));

      const itensReq = await supabase
        .from("itens_orcamento")
        .insert(itensParaSalvar);

      if (itensReq.error) throw new Error(itensReq.error.message);

      alert(editandoId ? "Orçamento atualizado com sucesso!" : `Orçamento Nº ${formatarNumero(numero)} salvo com sucesso!`);

      setModalEditor(false);
      await carregarDados();
    } catch (error: any) {
      alert("Erro ao salvar orçamento: " + error.message);
    }
  }

  async function atualizarStatus(orc: Orcamento, status: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { error } = await supabase
      .from("orcamentos")
      .update({ status })
      .eq("empresa_id", empresaId)
      .eq("id", orc.id);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
      return;
    }

    await carregarDados();
  }

  async function excluirOrcamento(orc: Orcamento) {
    const confirmar = confirm(`Deseja excluir o orçamento Nº ${formatarNumero(orc.numero_orcamento)}?`);

    if (!confirmar) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { error } = await supabase
      .from("orcamentos")
      .delete()
      .eq("empresa_id", empresaId)
      .eq("id", orc.id);

    if (error) {
      alert("Erro ao excluir orçamento: " + error.message);
      return;
    }

    await carregarDados();
  }

  function montarHtmlOrcamento(orc: Orcamento, itensDoOrcamento: ItemOrcamento[]) {
    const empresa = empresaDados();

    const linhas = itensDoOrcamento
      .map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${item.produto_nome}</strong>
            <br />
            <span>Cód: ${item.codigo || "-"}</span>
          </td>
          <td class="right">${Number(item.quantidade || 0).toLocaleString("pt-BR")}</td>
          <td class="right">${formatarMoeda(item.valor_unitario)}</td>
          <td class="right">${formatarMoeda(item.subtotal)}</td>
        </tr>
      `)
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Orçamento ${formatarNumero(orc.numero_orcamento)}</title>

          <style>
            * { box-sizing: border-box; }

            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              background: #e5e7eb;
              color: #111827;
              font-size: 12px;
            }

            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: #fff;
              padding: 16mm;
            }

            .top-actions {
              width: 210mm;
              margin: 0 auto;
              background: #6b7280;
              padding: 8px 12px;
              display: flex;
              justify-content: flex-end;
              gap: 10px;
            }

            .top-actions button {
              border: 0;
              background: #2563eb;
              color: white;
              padding: 8px 14px;
              border-radius: 6px;
              font-weight: bold;
              cursor: pointer;
            }

            .header {
              display: grid;
              grid-template-columns: 35mm 1fr 55mm;
              gap: 12px;
              align-items: start;
              border-bottom: 2px solid #111827;
              padding-bottom: 12px;
            }

            .logo-box {
              width: 30mm;
              height: 24mm;
              border: 1px solid #d1d5db;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }

            .logo-box img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }

            .company h1 {
              font-size: 18px;
              margin: 0 0 4px;
              text-transform: uppercase;
            }

            .company p {
              margin: 2px 0;
              color: #374151;
            }

            .doc-box {
              border: 2px solid #111827;
              padding: 8px;
              text-align: center;
            }

            .doc-box h2 {
              margin: 0;
              font-size: 17px;
            }

            .doc-box .numero {
              font-size: 22px;
              font-weight: 900;
              margin-top: 4px;
            }

            .section {
              margin-top: 14px;
            }

            .section-title {
              background: #111827;
              color: #fff;
              padding: 7px 9px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              border: 1px solid #d1d5db;
              border-top: 0;
            }

            .cell {
              padding: 8px;
              border-right: 1px solid #d1d5db;
              border-bottom: 1px solid #d1d5db;
              min-height: 32px;
            }

            .cell:nth-child(2n) {
              border-right: 0;
            }

            .label {
              display: block;
              color: #6b7280;
              font-size: 10px;
              text-transform: uppercase;
              margin-bottom: 3px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #d1d5db;
            }

            th {
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              padding: 7px;
              text-align: left;
              font-size: 11px;
              text-transform: uppercase;
            }

            td {
              border: 1px solid #d1d5db;
              padding: 7px;
              vertical-align: top;
            }

            td span {
              color: #6b7280;
              font-size: 10px;
            }

            .right {
              text-align: right;
            }

            .totals {
              margin-left: auto;
              width: 80mm;
              border: 1px solid #d1d5db;
              border-top: 0;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #d1d5db;
              padding: 8px;
            }

            .grand-total {
              background: #111827;
              color: #fff;
              font-size: 16px;
              font-weight: 900;
            }

            .obs {
              border: 1px solid #d1d5db;
              border-top: 0;
              padding: 10px;
              min-height: 35mm;
              white-space: pre-line;
            }

            .signatures {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 24px;
              margin-top: 30mm;
            }

            .signature {
              border-top: 1px solid #111827;
              text-align: center;
              padding-top: 5px;
              color: #374151;
            }

            .footer {
              margin-top: 16px;
              padding-top: 8px;
              border-top: 1px solid #d1d5db;
              text-align: center;
              color: #6b7280;
              font-size: 10px;
            }

            @media print {
              body { background: #fff; }
              .top-actions { display: none; }
              .page {
                width: 210mm;
                min-height: 297mm;
                padding: 14mm;
              }
            }
          </style>
        </head>

        <body>
          <div class="top-actions">
            <button onclick="window.print()">Imprimir / Salvar PDF</button>
          </div>

          <main class="page">
            <header class="header">
              <div class="logo-box">
                <img src="${empresa.logo_url}" />
              </div>

              <div class="company">
                <h1>${empresa.nome_fantasia}</h1>
                ${empresa.razao_social ? `<p>${empresa.razao_social}</p>` : ""}
                ${empresa.cnpj ? `<p><strong>CNPJ/CPF:</strong> ${empresa.cnpj}</p>` : ""}
                ${empresa.endereco ? `<p>${empresa.endereco}</p>` : ""}
                ${empresa.telefone ? `<p><strong>Telefone:</strong> ${empresa.telefone}</p>` : ""}
                ${empresa.whatsapp ? `<p><strong>WhatsApp:</strong> ${empresa.whatsapp}</p>` : ""}
                ${empresa.email ? `<p><strong>E-mail:</strong> ${empresa.email}</p>` : ""}
              </div>

              <div class="doc-box">
                <h2>ORÇAMENTO</h2>
                <div class="numero">Nº ${formatarNumero(orc.numero_orcamento)}</div>
                <p>Emitido em ${formatarData(orc.created_at)}</p>
                <p>Status: ${statusLabel(orc.status)}</p>
              </div>
            </header>

            <section class="section">
              <div class="section-title">Dados do Cliente</div>
              <div class="grid">
                <div class="cell">
                  <span class="label">Cliente</span>
                  <strong>${orc.cliente_nome || "Consumidor Final"}</strong>
                </div>

                <div class="cell">
                  <span class="label">CPF/CNPJ</span>
                  ${orc.cliente_documento || "-"}
                </div>

                <div class="cell">
                  <span class="label">WhatsApp</span>
                  ${orc.cliente_whatsapp || "-"}
                </div>

                <div class="cell">
                  <span class="label">Validade</span>
                  ${formatarData(orc.validade)}
                </div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Itens do Orçamento</div>

              <table>
                <thead>
                  <tr>
                    <th style="width: 10mm;">Item</th>
                    <th>Produto</th>
                    <th class="right" style="width: 20mm;">Qtd</th>
                    <th class="right" style="width: 30mm;">Unitário</th>
                    <th class="right" style="width: 35mm;">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  ${linhas}
                </tbody>
              </table>

              <div class="totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <strong>${formatarMoeda(orc.subtotal)}</strong>
                </div>

                <div class="total-row">
                  <span>Desconto</span>
                  <strong>${formatarMoeda(orc.desconto)}</strong>
                </div>

                <div class="total-row grand-total">
                  <span>TOTAL</span>
                  <strong>${formatarMoeda(orc.valor_total)}</strong>
                </div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Observações e Condições</div>
              <div class="obs">${orc.observacao || "Orçamento sujeito à disponibilidade de estoque e validade informada."}</div>
            </section>

            <div class="signatures">
              <div class="signature">Assinatura do Cliente</div>
              <div class="signature">Responsável pela Empresa</div>
            </div>

            <div class="footer">
              Documento gerado pelo Th Cloud • Orçamento sem valor fiscal.
            </div>
          </main>
        </body>
      </html>
    `;
  }

  function imprimirOrcamento(orc: Orcamento) {
    const itensDoOrcamento = itensSalvos[orc.id] || [];

    if (itensDoOrcamento.length === 0) {
      alert("Este orçamento não possui itens carregados.");
      return;
    }

    const janela = window.open("", "_blank", "width=1000,height=800");

    if (!janela) {
      alert("O navegador bloqueou a janela. Libere pop-ups para imprimir.");
      return;
    }

    janela.document.open();
    janela.document.write(montarHtmlOrcamento(orc, itensDoOrcamento));
    janela.document.close();
  }

  function mensagemWhatsApp(orc: Orcamento) {
    const empresa = empresaDados();
    const itensDoOrcamento = itensSalvos[orc.id] || [];

    const linhas = itensDoOrcamento
      .map((item) => {
        return `• ${item.quantidade}x ${item.produto_nome} - ${formatarMoeda(item.subtotal)}`;
      })
      .join("%0A");

    return encodeURIComponent(
      `Olá, ${orc.cliente_nome || "cliente"}! Segue seu orçamento da ${empresa.nome_fantasia}.`
    )
      .replace(/%250A/g, "%0A")
      + `%0A%0A*ORÇAMENTO Nº ${formatarNumero(orc.numero_orcamento)}*`
      + `%0AValidade: ${formatarData(orc.validade)}`
      + `%0A%0A*Itens:*%0A${linhas}`
      + `%0A%0ASubtotal: ${formatarMoeda(orc.subtotal)}`
      + `%0ADesconto: ${formatarMoeda(orc.desconto)}`
      + `%0A*Total: ${formatarMoeda(orc.valor_total)}*`
      + `%0A%0APara receber o PDF, solicite ao vendedor.`
      + `%0A%0AObrigado pela preferência!`;
  }

  async function enviarWhatsApp(orc: Orcamento) {
    const numero = limparWhatsApp(orc.cliente_whatsapp);

    if (!numero) {
      alert("Este orçamento não possui WhatsApp do cliente.");
      return;
    }

    await atualizarStatus(orc, "enviado");

    window.open(
      `https://wa.me/55${numero}?text=${mensagemWhatsApp(orc)}`,
      "_blank"
    );
  }

  function levarParaPdv(orc: Orcamento) {
    const itensDoOrcamento = itensSalvos[orc.id] || [];

    if (itensDoOrcamento.length === 0) {
      alert("Este orçamento não possui itens para enviar ao PDV.");
      return;
    }

    const payload = {
      id: orc.id,
      numero_orcamento: orc.numero_orcamento,
      cliente_id: orc.cliente_id,
      cliente_nome: orc.cliente_nome,
      cliente_documento: orc.cliente_documento,
      cliente_whatsapp: orc.cliente_whatsapp,
      desconto: Number(orc.desconto || 0),
      valor_total: Number(orc.valor_total || 0),
      observacao: orc.observacao || "",
      itens: itensDoOrcamento,
    };

    localStorage.setItem("th_orcamento_para_pdv", JSON.stringify(payload));

    alert(
      `Orçamento Nº ${formatarNumero(orc.numero_orcamento)} enviado para o PDV. A próxima tela abrirá com os itens carregados.`
    );

    window.location.href = "/caixa/pdv";
  }

  function visualizarOrcamento(orc: Orcamento) {
    setOrcamentoSelecionado(orc);
    setModalVisualizar(true);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalAberto = orcamentos
    .filter((orc) => orc.status === "aberto" || orc.status === "enviado")
    .reduce((total, orc) => total + Number(orc.valor_total || 0), 0);

  const totalAprovado = orcamentos
    .filter((orc) => orc.status === "aprovado")
    .reduce((total, orc) => total + Number(orc.valor_total || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-100 font-bold">Th Cloud</p>

            <h1 className="text-4xl font-black mt-2">Orçamentos</h1>

            <p className="text-blue-100 mt-2 max-w-4xl">
              Crie orçamentos profissionais, imprima em PDF, acompanhe status e envie diretamente pelo WhatsApp.
            </p>
          </div>

          <button
            onClick={abrirNovo}
            className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Novo Orçamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <Resumo titulo="Orçamentos" valor={`${orcamentos.length}`} detalhe="Total cadastrados" />
        <Resumo titulo="Em Aberto" valor={formatarMoeda(totalAberto)} detalhe="Aberto + enviado" />
        <Resumo titulo="Aprovados" valor={formatarMoeda(totalAprovado)} detalhe="Convertidos/aprovados" />
        <Resumo titulo="Produtos" valor={`${produtos.length}`} detalhe="Disponíveis para orçamento" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm mb-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por número, cliente, documento ou WhatsApp..."
              className="w-full border border-slate-300 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-semibold"
            />
          </div>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full border border-slate-300 rounded-2xl py-3 px-4 text-slate-900 font-semibold bg-white"
          >
            <option value="todos">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="enviado">Enviado</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Lista de Orçamentos</h2>
            <p className="text-slate-500">{orcamentosFiltrados.length} orçamento(s) encontrado(s).</p>
          </div>

          <button
            onClick={carregarDados}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-black"
          >
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-4 text-left">Número</th>
                <th className="p-4 text-left">Cliente</th>
                <th className="p-4 text-left">Validade</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Criado em</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {orcamentosFiltrados.map((orc) => (
                <tr key={orc.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-black text-blue-700">
                    #{formatarNumero(orc.numero_orcamento)}
                  </td>

                  <td className="p-4">
                    <p className="font-black text-slate-900">{orc.cliente_nome || "Consumidor Final"}</p>
                    <p className="text-sm text-slate-500">{orc.cliente_whatsapp || orc.cliente_documento || "-"}</p>
                  </td>

                  <td className="p-4 text-slate-700">{formatarData(orc.validade)}</td>

                  <td className="p-4 text-right font-black text-green-700">
                    {formatarMoeda(orc.valor_total)}
                  </td>

                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${statusClasse(orc.status)}`}>
                      {statusLabel(orc.status)}
                    </span>
                  </td>

                  <td className="p-4 text-slate-700">{formatarDataHora(orc.created_at)}</td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => visualizarOrcamento(orc)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-xl"
                        title="Visualizar"
                      >
                        <FileText size={18} />
                      </button>

                      <button
                        onClick={() => levarParaPdv(orc)}
                        disabled={orc.status === "aprovado" || orc.status === "cancelado"}
                        className={`p-2 rounded-xl ${
                          orc.status === "aprovado" || orc.status === "cancelado"
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-orange-50 hover:bg-orange-100 text-orange-700"
                        }`}
                        title="Puxar no PDV"
                      >
                        <ShoppingCart size={18} />
                      </button>

                      <button
                        onClick={() => editarOrcamento(orc)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded-xl"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => imprimirOrcamento(orc)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-2 rounded-xl"
                        title="Imprimir PDF"
                      >
                        <Printer size={18} />
                      </button>

                      <button
                        onClick={() => enviarWhatsApp(orc)}
                        className="bg-green-50 hover:bg-green-100 text-green-700 p-2 rounded-xl"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>

                      <button
                        onClick={() => atualizarStatus(orc, "aprovado")}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-xl"
                        title="Aprovar"
                      >
                        <CheckCircle size={18} />
                      </button>

                      <button
                        onClick={() => excluirOrcamento(orc)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 p-2 rounded-xl"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {orcamentosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    {carregando ? "Carregando..." : "Nenhum orçamento encontrado."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl max-h-[94vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  {editandoId ? "Editar Orçamento" : "Novo Orçamento"}
                </h2>
                <p className="text-slate-500">Preencha cliente, itens, validade e condições comerciais.</p>
              </div>

              <button
                onClick={() => setModalEditor(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Cliente</h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Campo titulo="Cliente cadastrado">
                      <select
                        value={clienteId}
                        onChange={(e) => {
                          setClienteId(e.target.value);
                          const cli = clientes.find((c) => c.id === e.target.value);

                          if (cli) {
                            setClienteNomeAvulso(cli.nome || "");
                            setClienteDocumentoAvulso(cli.cpf_cnpj || "");
                            setClienteWhatsappAvulso(cli.whatsapp || "");
                          }
                        }}
                        className="input-orcamento"
                      >
                        <option value="">Consumidor Final / Avulso</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </option>
                        ))}
                      </select>
                    </Campo>

                    <Campo titulo="Nome avulso">
                      <input
                        value={clienteNomeAvulso}
                        onChange={(e) => setClienteNomeAvulso(e.target.value)}
                        className="input-orcamento"
                        placeholder="Nome do cliente"
                      />
                    </Campo>

                    <Campo titulo="CPF/CNPJ">
                      <input
                        value={clienteDocumentoAvulso}
                        onChange={(e) => setClienteDocumentoAvulso(e.target.value)}
                        className="input-orcamento"
                        placeholder="Documento"
                      />
                    </Campo>

                    <Campo titulo="WhatsApp">
                      <input
                        value={clienteWhatsappAvulso}
                        onChange={(e) => setClienteWhatsappAvulso(e.target.value)}
                        className="input-orcamento"
                        placeholder="DDD + número"
                      />
                    </Campo>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Adicionar Produtos</h3>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <label className="block text-sm font-black text-slate-700 mb-2">Buscar produto</label>
                      <input
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        className="input-orcamento"
                        placeholder="Nome, código ou barras"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-sm font-black text-slate-700 mb-2">Produto</label>
                      <select
                        value={produtoId}
                        onChange={(e) => preencherPrecoProduto(e.target.value)}
                        className="input-orcamento"
                      >
                        <option value="">Selecione</option>
                        {produtosFiltrados.slice(0, 100).map((produto) => (
                          <option key={produto.id} value={produto.id}>
                            {produto.codigo || produto.codigo_barras || "-"} - {produto.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-black text-slate-700 mb-2">Qtd</label>
                      <input
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        className="input-orcamento text-right"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-black text-slate-700 mb-2">Valor</label>
                      <input
                        value={valorUnitario}
                        onChange={(e) => setValorUnitario(e.target.value)}
                        className="input-orcamento text-right"
                      />
                    </div>
                  </div>

                  <button
                    onClick={adicionarItem}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Adicionar Item
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
                  <table className="w-full min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-3 text-left">Produto</th>
                        <th className="p-3 text-center">Qtd</th>
                        <th className="p-3 text-right">Unitário</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>

                    <tbody>
                      {itens.map((item, index) => (
                        <tr key={`${item.produto_id}-${index}`} className="border-b">
                          <td className="p-3">
                            <p className="font-black text-slate-900">{item.produto_nome}</p>
                            <p className="text-sm text-slate-500">Cód: {item.codigo || "-"}</p>
                          </td>

                          <td className="p-3 text-center">
                            <input
                              value={item.quantidade}
                              onChange={(e) => alterarQuantidadeItem(index, e.target.value)}
                              className="w-24 border border-slate-300 rounded-xl p-2 text-center text-slate-900 font-black"
                            />
                          </td>

                          <td className="p-3 text-right">
                            <input
                              value={String(item.valor_unitario).replace(".", ",")}
                              onChange={(e) => alterarValorItem(index, e.target.value)}
                              className="w-32 border border-slate-300 rounded-xl p-2 text-right text-slate-900 font-black"
                            />
                          </td>

                          <td className="p-3 text-right font-black text-green-700">
                            {formatarMoeda(item.subtotal)}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              onClick={() => removerItem(index)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-xl font-bold"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}

                      {itens.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            Nenhum item adicionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="xl:col-span-4 space-y-5">
                <div className="bg-slate-900 text-white rounded-3xl p-6">
                  <p className="text-slate-300 font-bold">TOTAL DO ORÇAMENTO</p>
                  <p className="text-5xl font-black mt-2">{formatarMoeda(total())}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
                  <Campo titulo="Validade">
                    <input
                      type="date"
                      value={validade}
                      onChange={(e) => setValidade(e.target.value)}
                      className="input-orcamento"
                    />
                  </Campo>

                  <Campo titulo="Desconto R$">
                    <input
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                      className="input-orcamento text-right"
                    />
                  </Campo>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-slate-700">
                      <span>Subtotal</span>
                      <strong>{formatarMoeda(subtotal())}</strong>
                    </div>

                    <div className="flex justify-between text-slate-700">
                      <span>Desconto</span>
                      <strong>{formatarMoeda(converterNumero(desconto))}</strong>
                    </div>

                    <div className="flex justify-between text-2xl text-blue-700 font-black">
                      <span>Total</span>
                      <span>{formatarMoeda(total())}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5">
                  <Campo titulo="Observações e condições">
                    <textarea
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      className="input-orcamento min-h-36"
                    />
                  </Campo>
                </div>

                <button
                  onClick={salvarOrcamento}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white px-6 py-4 rounded-2xl font-black text-lg"
                >
                  Salvar Orçamento
                </button>

                <button
                  onClick={() => setModalEditor(false)}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <style jsx global>{`
              .input-orcamento {
                width: 100%;
                border: 1px solid rgb(203 213 225);
                border-radius: 1rem;
                padding: 0.75rem 1rem;
                color: rgb(2 6 23);
                background: white;
                font-weight: 800;
                outline: none;
              }

              .input-orcamento::placeholder {
                color: rgb(100 116 139);
              }

              .input-orcamento:focus {
                border-color: rgb(37 99 235);
                box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
              }
            `}</style>
          </div>
        </div>
      )}

      {modalVisualizar && orcamentoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Orçamento #{formatarNumero(orcamentoSelecionado.numero_orcamento)}
                </h2>
                <p className="text-slate-500">{orcamentoSelecionado.cliente_nome}</p>
              </div>

              <button
                onClick={() => setModalVisualizar(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Resumo titulo="Status" valor={statusLabel(orcamentoSelecionado.status)} detalhe="Situação atual" />
                <Resumo titulo="Validade" valor={formatarData(orcamentoSelecionado.validade)} detalhe="Data limite" />
                <Resumo titulo="Itens" valor={`${itensSalvos[orcamentoSelecionado.id]?.length || 0}`} detalhe="Produtos" />
                <Resumo titulo="Total" valor={formatarMoeda(orcamentoSelecionado.valor_total)} detalhe="Valor final" />
              </div>

              <div className="border border-slate-200 rounded-3xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-3 text-left">Produto</th>
                      <th className="p-3 text-right">Qtd</th>
                      <th className="p-3 text-right">Unitário</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(itensSalvos[orcamentoSelecionado.id] || []).map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3 text-slate-900 font-bold">{item.produto_nome}</td>
                        <td className="p-3 text-right">{item.quantidade}</td>
                        <td className="p-3 text-right">{formatarMoeda(item.valor_unitario)}</td>
                        <td className="p-3 text-right font-black text-green-700">{formatarMoeda(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-3">
                <button
                  onClick={() => levarParaPdv(orcamentoSelecionado)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Puxar no PDV
                </button>

                <button
                  onClick={() => imprimirOrcamento(orcamentoSelecionado)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Imprimir PDF
                </button>

                <button
                  onClick={() => enviarWhatsApp(orcamentoSelecionado)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  Enviar WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-700 mb-2">
        {titulo}
      </label>

      {children}
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{titulo}</p>
      <h2 className="text-2xl font-black text-blue-700 mt-2">{valor}</h2>
      <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
    </div>
  );
}
