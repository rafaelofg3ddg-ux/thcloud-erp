"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import { carregarEmpresaPDF } from "../../../lib/empresaPdf";
import {
  CONFIGURACOES_PADRAO,
  normalizarConfiguracoesSistema,
  type ConfiguracoesSistema,
} from "../../../lib/configuracoesSistema";
import SelecionarImeiProdutoPDV, {
  type ImeiDisponivelPDV,
} from "./components/SelecionarImeiProdutoPDV";
import { formatarData, formatarMoeda } from "../../../components/global/THFormat";

type Produto = {
  id: string;
  codigo: string;
  codigo_barras: string | null;
  nome: string;
  preco_venda: number;
  qtd_atual: number;
  foto_url: string | null;
  controlar_imei?: boolean | null;
};

type ProdutoCodigoPdv = {
  id: string;
  produto_id: string;
  codigo: string;
  tipo: string | null;
  descricao: string | null;
};

type ProdutoEmbalagemPdv = {
  id: string;
  produto_id: string;
  nome: string;
  codigo: string;
  fator_conversao: number;
  preco_venda: number | null;
  unidade: string | null;
};

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  whatsapp: string | null;
};

type Caixa = {
  id: string;
  empresa_id: string;
  usuario: string | null;
  valor_abertura: number;
  valor_fechamento: number | null;
  status: string | null;
  data_abertura: string | null;
  data_fechamento: string | null;
  observacao: string | null;
  numero_caixa?: number | null;
};

type MovimentoCaixa = {
  id: string;
  caixa_id: string;
  empresa_id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  usuario: string | null;
  created_at: string;
};

type VendaCaixa = {
  id: string;
  cliente_id: string | null;
  valor_total: number;
  created_at: string | null;
};

type PagamentoVenda = {
  id: string;
  venda_id: string;
  forma_pagamento: string;
  valor: number;
};

type ItemVendaConsulta = {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  produtos?: {
    nome: string;
    codigo: string | null;
  } | null;
};

type VendaDetalhada = {
  id: string;
  numero_venda?: number | null;
  cliente_id: string | null;
  valor_total: number;
  created_at: string | null;
  status: string | null;
  forma_pagamento: string | null;
  desconto: number | null;
  itens_venda?: ItemVendaConsulta[];
  pagamentos_venda?: PagamentoVenda[];
};

type EmpresaDados = {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  endereco: string;
  logo_url?: string;
};

type ItemCarrinho = {
  tipo?: "produto" | "servico";
  produto_id: string | null;
  codigo: string;
  nome: string;
  foto_url: string | null;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  controlar_imei?: boolean | null;
  produto_imei_id?: string | null;
  imei?: string | null;
  imei_2?: string | null;
  numero_serie?: string | null;
};

type OrcamentoPdv = {
  id: string;
  numero_orcamento: number | null;
  ordem_servico_id?: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  cliente_documento: string | null;
  cliente_whatsapp: string | null;
  desconto: number;
  valor_total: number;
  observacao: string;
  itens: {
    tipo?: "produto" | "servico";
    produto_id: string | null;
    codigo: string | null;
    produto_nome: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
  }[];
};

type OrdemServicoPdv = {
  id: string;
  numero_os: number | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  cliente_documento: string | null;
  cliente_whatsapp: string | null;
  desconto: number;
  valor_total: number;
  valor_produtos: number;
  valor_servicos: number;
  observacao: string;
  itens: {
    tipo?: "produto" | "servico";
    produto_id: string | null;
    codigo: string | null;
    produto_nome: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
  }[];
};

// Componente isolado só pro relógio do cabeçalho. Fica de fora do
// PdvPage de propósito: assim, o "tic-tac" de 1 em 1 segundo só
// re-renderiza esse pedacinho pequeno da tela, e não o PDV inteiro
// (que é enorme) — isso evita que a tela toda fique recalculando sem
// parar, o que podia atrapalhar quem estivesse digitando em algum
// campo (motivo de devolução, observações, etc.) bem nesse instante.
function RelogioPdv() {
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const relogio = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(relogio);
  }, []);

  return (
    <div className="text-right hidden md:block">
      <p className="text-xs text-slate-500 font-bold">{agora.toLocaleDateString("pt-BR")}</p>
      <p className="text-2xl font-black text-slate-900 leading-none">{agora.toLocaleTimeString("pt-BR")}</p>
    </div>
  );
}

export default function PdvPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoCodigos, setProdutoCodigos] = useState<ProdutoCodigoPdv[]>([]);
  const [produtoEmbalagens, setProdutoEmbalagens] = useState<ProdutoEmbalagemPdv[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [caixaAberto, setCaixaAberto] = useState<Caixa | null>(null);
  const [movimentosCaixa, setMovimentosCaixa] = useState<MovimentoCaixa[]>([]);
  const [vendasCaixa, setVendasCaixa] = useState<VendaCaixa[]>([]);
  const [pagamentosCaixa, setPagamentosCaixa] = useState<PagamentoVenda[]>([]);

  const [codigoBusca, setCodigoBusca] = useState("");
  const [pesquisaProduto, setPesquisaProduto] = useState("");
  const [modalProdutos, setModalProdutos] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalDelivery, setModalDelivery] = useState(false);
  const [modalAtalhos, setModalAtalhos] = useState(false);
  const [modalConsultarVendas, setModalConsultarVendas] = useState(false);
  const [modalHistoricoCaixa, setModalHistoricoCaixa] = useState(false);
  const [modalDevolucao, setModalDevolucao] = useState(false);
  const [modoTelaCheia, setModoTelaCheia] = useState(false);
  // (relógio foi isolado no componente RelogioPdv, mais abaixo, pra não
  // forçar o PDV inteiro a recalcular a cada segundo)
  const produtoInputRef = useRef<HTMLInputElement | null>(null);

  const [vendasDetalhadas, setVendasDetalhadas] = useState<VendaDetalhada[]>(
    [],
  );
  const [vendaDevolucao, setVendaDevolucao] = useState<VendaDetalhada | null>(
    null,
  );
  const [tipoDevolucao, setTipoDevolucao] = useState<"estorno" | "credito">(
    "estorno",
  );
  // O campo de motivo da devolução usa uma referência direta (não é mais
  // "controlado" pelo React a cada letra digitada) — isso evita qualquer
  // interferência de autopreenchimento/gerenciador de senha do navegador
  // no meio da digitação. O texto só é lido na hora de confirmar.
  const motivoDevolucaoRef = useRef<HTMLTextAreaElement>(null);
  const [processandoDevolucao, setProcessandoDevolucao] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [pesquisaCliente, setPesquisaCliente] = useState("");
  const [modalPesquisarCliente, setModalPesquisarCliente] = useState(false);
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteDocumento, setNovoClienteDocumento] = useState("");
  const [novoClienteWhatsapp, setNovoClienteWhatsapp] = useState("");

  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false);
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false);
  const [operadorCaixa, setOperadorCaixa] = useState("Admin");
  const [valorAbertura, setValorAbertura] = useState("0,00");
  const [observacaoCaixa, setObservacaoCaixa] = useState("");
  const [loginOperacao, setLoginOperacao] = useState("");
  const [senhaOperacao, setSenhaOperacao] = useState("");

  const [fechDinheiro, setFechDinheiro] = useState("0,00");
  const [fechPix, setFechPix] = useState("0,00");
  const [fechDebito, setFechDebito] = useState("0,00");
  const [fechCredito, setFechCredito] = useState("0,00");
  const [fechCrediario, setFechCrediario] = useState("0,00");

  const [modalMovimentoCaixa, setModalMovimentoCaixa] = useState(false);
  const [tipoMovimentoCaixa, setTipoMovimentoCaixa] = useState<
    "sangria" | "suprimento"
  >("sangria");
  const [valorMovimentoCaixa, setValorMovimentoCaixa] = useState("0,00");
  const [descricaoMovimentoCaixa, setDescricaoMovimentoCaixa] = useState("");

  const [descontoValor, setDescontoValor] = useState("0");
  const [descontoPercentual, setDescontoPercentual] = useState("0");

  const [pagDinheiro, setPagDinheiro] = useState("0");
  const [pagPix, setPagPix] = useState("0");
  const [chavePix, setChavePix] = useState("");
  const [nomeRecebedorPix, setNomeRecebedorPix] = useState("TH GESTAO");
  const [cidadePix, setCidadePix] = useState("SAO PAULO");
  const [pagDebito, setPagDebito] = useState("0");
  const [pagCredito, setPagCredito] = useState("0");
  const [pagCrediario, setPagCrediario] = useState("0");
  const [arredondamentoVenda, setArredondamentoVenda] = useState("0");

  const [parcelas, setParcelas] = useState("1");
  const [primeiroVencimento, setPrimeiroVencimento] = useState("");
  const [diasEntreParcelas, setDiasEntreParcelas] = useState("30");

  const [totalCompradoCliente, setTotalCompradoCliente] = useState(0);
  const [totalAbertoCliente, setTotalAbertoCliente] = useState(0);
  const [ultimaCompraCliente, setUltimaCompraCliente] = useState("");
  const [saldoCreditoCliente, setSaldoCreditoCliente] = useState(0);
  const [usarCreditoCliente, setUsarCreditoCliente] = useState(false);

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [modalSelecionarImei, setModalSelecionarImei] = useState(false);
  const [produtoAguardandoImei, setProdutoAguardandoImei] =
    useState<Produto | null>(null);
  const [imeisDisponiveisProduto, setImeisDisponiveisProduto] = useState<
    ImeiDisponivelPDV[]
  >([]);
  const [buscaImeiVenda, setBuscaImeiVenda] = useState("");

  const [empresaNome, setEmpresaNome] = useState("");
  const [usuarioNome, setUsuarioNome] = useState("");
  const [empresaDados, setEmpresaDados] = useState<EmpresaDados>({
    nome_fantasia: "",
    razao_social: "",
    cnpj: "",
    telefone: "",
    whatsapp: "",
    email: "",
    endereco: "",
    logo_url: "",
  });

  const [ehDelivery, setEhDelivery] = useState(false);
  const [telefoneEntrega, setTelefoneEntrega] = useState("");
  const [enderecoEntrega, setEnderecoEntrega] = useState("");
  const [numeroEntrega, setNumeroEntrega] = useState("");
  const [bairroEntrega, setBairroEntrega] = useState("");
  const [referenciaEntrega, setReferenciaEntrega] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("0");
  const [entregador, setEntregador] = useState("");
  const [observacaoEntrega, setObservacaoEntrega] = useState("");
  const [usarDadosClienteEntrega, setUsarDadosClienteEntrega] = useState(true);
  const [finalizandoVenda, setFinalizandoVenda] = useState(false);
  const [orcamentoPdv, setOrcamentoPdv] = useState<OrcamentoPdv | null>(null);
  const [ordemServicoPdv, setOrdemServicoPdv] =
    useState<OrdemServicoPdv | null>(null);
  const [configuracoesSistema, setConfiguracoesSistema] =
    useState<ConfiguracoesSistema>(CONFIGURACOES_PADRAO);

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
      if (!usuario) return operadorCaixa || "Admin";
      const dados = JSON.parse(usuario);
      return dados.nome || operadorCaixa || "Admin";
    } catch {
      return operadorCaixa || "Admin";
    }
  }

  async function carregarConfiguracoesSistema() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data } = await supabase
      .from("configuracoes_gerais")
      .select("*")
      .eq("empresa_id", empresaId)
      .maybeSingle();

    const config = normalizarConfiguracoesSistema(data || {});
    setConfiguracoesSistema(config);
    setDiasEntreParcelas(String(config.intervalo_parcelas_padrao_dias || 30));

    if (config.chave_pix) setChavePix(config.chave_pix);
    if (config.nome_recebedor_pix)
      setNomeRecebedorPix(config.nome_recebedor_pix);
    if (config.cidade_pix) setCidadePix(config.cidade_pix);
  }


  function enderecoEmpresaFormatado(dados: any) {
    if (dados.endereco) return dados.endereco;

    const partes = [
      dados.logradouro || dados.rua,
      dados.numero,
      dados.bairro,
      dados.cidade,
      dados.uf || dados.estado,
    ].filter(Boolean);

    return partes.join(", ");
  }

  async function carregarEmpresaDoStorage(dadosUsuario: any) {
    let dadosEmpresa: any = {};

    try {
      const empresaStorage = localStorage.getItem("th_empresa");

      if (empresaStorage) {
        dadosEmpresa = JSON.parse(empresaStorage);
      }
    } catch {}

    const empresaFinal = {
      nome_fantasia:
        dadosEmpresa.nome_fantasia ||
        dadosEmpresa.nome ||
        dadosUsuario.empresa_nome ||
        empresaNome ||
        "THCloud ERP",
      razao_social:
        dadosEmpresa.razao_social ||
        dadosUsuario.razao_social ||
        dadosUsuario.empresa_razao_social ||
        "",
      cnpj:
        dadosEmpresa.cnpj ||
        dadosUsuario.cnpj ||
        dadosUsuario.empresa_cnpj ||
        "",
      telefone:
        dadosEmpresa.telefone ||
        dadosEmpresa.whatsapp ||
        dadosUsuario.telefone ||
        dadosUsuario.empresa_telefone ||
        "",
      whatsapp: dadosEmpresa.whatsapp || dadosUsuario.empresa_whatsapp || "",
      email:
        dadosEmpresa.email ||
        dadosUsuario.email_empresa ||
        dadosUsuario.empresa_email ||
        "",
      endereco: enderecoEmpresaFormatado({
        ...dadosUsuario,
        ...dadosEmpresa,
      }),
      logo_url:
        dadosEmpresa.logo_url ||
        dadosEmpresa.logo ||
        dadosEmpresa.logoUrl ||
        "",
    };

    setEmpresaDados(empresaFinal);
    setEmpresaNome(empresaFinal.nome_fantasia);

    try {
      const empresaPdf = await carregarEmpresaPDF();

      setEmpresaDados((atual) => ({
        ...atual,
        nome_fantasia: empresaPdf.nome_fantasia || atual.nome_fantasia,
        razao_social: empresaPdf.razao_social || atual.razao_social,
        cnpj: empresaPdf.cnpj || atual.cnpj,
        telefone: empresaPdf.telefone || atual.telefone,
        whatsapp: empresaPdf.whatsapp || atual.whatsapp,
        email: empresaPdf.email || atual.email,
        endereco: empresaPdf.endereco || atual.endereco,
        logo_url: empresaPdf.logo_url || atual.logo_url,
      }));
      setEmpresaNome(empresaPdf.nome_fantasia || empresaFinal.nome_fantasia);
    } catch {}
  }

  function textoHtml(valor: unknown) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function logoEmpresaCupom(logoUrl: string) {
    if (!configuracoesSistema.mostrar_logo_cupom || !logoUrl) return "";

    return `<img src="${textoHtml(logoUrl)}" class="logo" alt="Logo da empresa" />`;
  }

  function cabecalhoEmpresaCupom() {
    let empresaAtual: any = {};

    try {
      const empresaStorage = localStorage.getItem("th_empresa");

      if (empresaStorage) {
        empresaAtual = JSON.parse(empresaStorage);
      }
    } catch {}

    const nome =
      empresaAtual.nome_fantasia ||
      empresaDados.nome_fantasia ||
      empresaNome ||
      "THCloud ERP";

    const razao = empresaAtual.razao_social || empresaDados.razao_social || "";

    const documento =
      empresaAtual.tipo_pessoa === "fisica"
        ? empresaAtual.cpf || ""
        : empresaAtual.cnpj || empresaDados.cnpj || "";

    const telefone =
      empresaAtual.whatsapp ||
      empresaAtual.telefone ||
      empresaDados.telefone ||
      "";

    const email = empresaAtual.email || empresaDados.email || "";

    const endereco =
      [
        empresaAtual.endereco,
        empresaAtual.numero,
        empresaAtual.bairro,
        empresaAtual.cidade,
        empresaAtual.estado,
      ]
        .filter(Boolean)
        .join(", ") ||
      empresaDados.endereco ||
      "";

    const logo =
      empresaAtual.logo_url ||
      empresaAtual.logo ||
      empresaAtual.logoUrl ||
      empresaDados.logo_url ||
      "";

    return `
    <div class="center">
      ${logoEmpresaCupom(logo)}
      <h1>${textoHtml(nome)}</h1>
      ${razao ? `<p>${textoHtml(razao)}</p>` : ""}
      ${documento ? `<p><strong>${empresaAtual.tipo_pessoa === "fisica" ? "CPF" : "CNPJ"}:</strong> ${textoHtml(documento)}</p>` : ""}
      ${telefone ? `<p><strong>Telefone:</strong> ${textoHtml(telefone)}</p>` : ""}
      ${email ? `<p><strong>E-mail:</strong> ${textoHtml(email)}</p>` : ""}
      ${endereco ? `<p class="small">${textoHtml(endereco)}</p>` : ""}
    </div>
  `;
  }

  async function validarUsuarioOperacao() {
    const empresaId = empresaAtualId();
    if (!empresaId) return null;

    if (!loginOperacao.trim() || !senhaOperacao.trim()) {
      alert("Informe usuário/e-mail e senha para autorizar a operação.");
      return null;
    }

    const loginLimpo = loginOperacao.trim().toLowerCase();

    const { data: usuarios, error } = await supabase.rpc("verificar_login", {
      p_login: loginLimpo,
      p_senha: senhaOperacao,
      p_empresa_id: empresaId,
    });

    if (error) {
      alert("Erro ao validar usuário: " + error.message);
      return null;
    }

    const usuario = usuarios && usuarios[0];

    if (!usuario) {
      alert("Usuário ou senha inválidos para esta empresa.");
      return null;
    }

    if (usuario.ativo === false) {
      alert("Usuário inativo.");
      return null;
    }

    return usuario;
  }

  function limparAutorizacaoOperacao() {
    setLoginOperacao("");
    setSenhaOperacao("");
  }

  async function alternarTelaCheia() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setModoTelaCheia(true);
      } else {
        await document.exitFullscreen();
        setModoTelaCheia(false);
      }
    } catch {
      alert("Não foi possível alterar para tela cheia neste navegador.");
    }
  }

  function atualizarStatusTelaCheia() {
    setModoTelaCheia(!!document.fullscreenElement);
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarNumeroVenda(numero: number | null | undefined) {
    if (!numero) return "-";
    return String(numero).padStart(6, "0");
  }

  async function proximoNumeroVenda() {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const { data, error } = await supabase.rpc("proximo_numero_venda", {
      p_empresa_id: empresaId,
    });

    if (error) {
      throw new Error("Erro ao gerar número da venda: " + error.message);
    }

    return Number(data || 1);
  }

  function totalBruto() {
    return carrinho.reduce((total, item) => total + item.subtotal, 0);
  }

  function valorDescontoPercentual() {
    return (totalBruto() * converterNumero(descontoPercentual)) / 100;
  }

  function valorDescontoTotal() {
    return converterNumero(descontoValor) + valorDescontoPercentual();
  }

  function totalFinalSemArredondamento() {
    return Math.max(
      totalBruto() - valorDescontoTotal() + converterNumero(taxaEntrega),
      0,
    );
  }

  function valorArredondamento() {
    return converterNumero(arredondamentoVenda);
  }

  function totalFinalAntesCredito() {
    return Math.max(totalFinalSemArredondamento() + valorArredondamento(), 0);
  }

  function valorCreditoUtilizado() {
    if (!usarCreditoCliente || !clienteId) return 0;

    return Math.min(Number(saldoCreditoCliente || 0), totalFinalAntesCredito());
  }

  function totalFinal() {
    return Math.max(totalFinalAntesCredito() - valorCreditoUtilizado(), 0);
  }

  function aplicarArredondamento(tipo: "baixo" | "cima") {
    const totalBase = totalFinalSemArredondamento();
    const totalArredondado =
      tipo === "cima" ? Math.ceil(totalBase) : Math.floor(totalBase);
    const diferenca = Number((totalArredondado - totalBase).toFixed(2));

    setArredondamentoVenda(String(diferenca.toFixed(2)).replace(".", ","));
  }

  function limparArredondamento() {
    setArredondamentoVenda("0");
  }

  function totalPago() {
    return (
      converterNumero(pagDinheiro) +
      converterNumero(pagPix) +
      converterNumero(pagDebito) +
      converterNumero(pagCredito) +
      converterNumero(pagCrediario)
    );
  }

  function faltaPagar() {
    return Math.max(totalFinal() - totalPago(), 0);
  }

  function troco() {
    return Math.max(totalPago() - totalFinal(), 0);
  }

  function valorRestanteParaPagamento() {
    return Math.max(totalFinal() - totalPago(), 0);
  }

  function formatarValorInput(valor: number) {
    return String(valor.toFixed(2)).replace(".", ",");
  }

  function preencherPagamentoRestante(setter: (valor: string) => void) {
    const restante = valorRestanteParaPagamento();

    if (restante <= 0) {
      return;
    }

    setter(formatarValorInput(restante));
  }

  function atualizarDescontoValor(valor: string) {
    setDescontoValor(valor);

    const numero = converterNumero(valor);
    const bruto = totalBruto();

    if (bruto > 0 && numero >= 0) {
      const percentual = (numero / bruto) * 100;
      setDescontoPercentual(String(percentual.toFixed(2)).replace(".", ","));
    }
  }

  function atualizarDescontoPercentual(valor: string) {
    setDescontoPercentual(valor);

    const percentual = converterNumero(valor);
    const bruto = totalBruto();

    if (bruto > 0 && percentual >= 0) {
      const valorCalculado = (bruto * percentual) / 100;
      setDescontoValor(String(valorCalculado.toFixed(2)).replace(".", ","));
    }
  }

  function formaPagamentoResumo() {
    const formas = [];

    if (converterNumero(pagDinheiro) > 0) formas.push("dinheiro");
    if (converterNumero(pagPix) > 0) formas.push("pix");
    if (converterNumero(pagDebito) > 0) formas.push("debito");
    if (converterNumero(pagCredito) > 0) formas.push("credito");
    if (converterNumero(pagCrediario) > 0) formas.push("crediario");
    if (valorCreditoUtilizado() > 0) formas.push("credito_cliente");

    return formas.length > 1 ? "misto" : formas[0] || "nao_informado";
  }

  function clienteSelecionado() {
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente ? cliente.nome : "Consumidor Final";
  }

  function preencherDeliveryComDadosCliente() {
    const cliente = clientes.find((item) => item.id === clienteId);

    if (!cliente) {
      return;
    }

    if (cliente.whatsapp && !telefoneEntrega.trim()) {
      setTelefoneEntrega(cliente.whatsapp);
    }
  }

  function carregarOrcamentoPendenteParaPdv() {
    try {
      const salvo = localStorage.getItem("th_orcamento_para_pdv");

      if (!salvo) return;

      const orcamento = JSON.parse(salvo) as OrcamentoPdv;

      if (!orcamento?.id || !Array.isArray(orcamento.itens)) {
        localStorage.removeItem("th_orcamento_para_pdv");
        return;
      }

      const itensConvertidos: ItemCarrinho[] = orcamento.itens.map((item) => ({
        tipo: item.produto_id ? "produto" : "servico",
        produto_id: item.produto_id || null,
        codigo: item.codigo || (item.produto_id ? "-" : "SERV"),
        nome: item.produto_nome,
        foto_url: null,
        quantidade: Number(item.quantidade || 0),
        valor_unitario: Number(item.valor_unitario || 0),
        subtotal: Number(item.subtotal || 0),
        controlar_imei: false,
        produto_imei_id: null,
        imei: null,
        imei_2: null,
        numero_serie: null,
      }));

      setCarrinho(itensConvertidos);
      setClienteId(orcamento.cliente_id || "");
      setDescontoValor(
        String(Number(orcamento.desconto || 0)).replace(".", ","),
      );
      setDescontoPercentual("0");
      setOrcamentoPdv(orcamento);

      localStorage.removeItem("th_orcamento_para_pdv");

      setTimeout(() => {
        alert(
          `Orçamento Nº ${formatarNumeroVenda(orcamento.numero_orcamento)} carregado no PDV. Confira os itens e finalize a venda.`,
        );
      }, 500);
    } catch {
      localStorage.removeItem("th_orcamento_para_pdv");
    }
  }

  function carregarOrdemServicoPendenteParaPdv() {
    try {
      const salvo =
        localStorage.getItem("th_os_para_pdv") ||
        sessionStorage.getItem("th_os_para_pdv");

      if (!salvo) return;

      const ordem = JSON.parse(salvo) as OrdemServicoPdv;

      if (!ordem?.id || !Array.isArray(ordem.itens)) {
        localStorage.removeItem("th_os_para_pdv");
        sessionStorage.removeItem("th_os_para_pdv");
        return;
      }

      const itensConvertidos: ItemCarrinho[] = ordem.itens
        .filter((item) => Number(item.quantidade || 0) > 0)
        .map((item) => ({
          tipo:
            item.tipo === "servico" || !item.produto_id ? "servico" : "produto",
          produto_id: item.produto_id || null,
          codigo: item.codigo || (item.produto_id ? "-" : "SERV"),
          nome: item.produto_nome,
          foto_url: null,
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.valor_unitario || 0),
          subtotal: Number(item.subtotal || 0),
          controlar_imei: false,
          produto_imei_id: null,
          imei: null,
          imei_2: null,
          numero_serie: null,
        }));

      if (itensConvertidos.length === 0) {
        localStorage.removeItem("th_os_para_pdv");
        sessionStorage.removeItem("th_os_para_pdv");
        return;
      }

      setCarrinho(itensConvertidos);
      setClienteId(ordem.cliente_id || "");
      setDescontoValor(String(Number(ordem.desconto || 0)).replace(".", ","));
      setDescontoPercentual("0");
      setOrdemServicoPdv(ordem);
      setOrcamentoPdv(null);

      localStorage.removeItem("th_os_para_pdv");
      sessionStorage.removeItem("th_os_para_pdv");

      setTimeout(() => {
        alert(
          `OS Nº ${formatarNumeroVenda(ordem.numero_os)} carregada no PDV. Confira os produtos/peças e finalize a venda.`,
        );
      }, 500);
    } catch {
      localStorage.removeItem("th_os_para_pdv");
      sessionStorage.removeItem("th_os_para_pdv");
    }
  }

  function cancelarOrdemServicoNoPdv() {
    const confirmar = confirm(
      "Remover a OS carregada do PDV e limpar a venda atual?",
    );

    if (!confirmar) return;

    setOrdemServicoPdv(null);
    limparVenda();
  }

  function cancelarOrcamentoNoPdv() {
    const confirmar = confirm(
      "Remover o orçamento carregado do PDV e limpar a venda atual?",
    );

    if (!confirmar) return;

    setOrcamentoPdv(null);
    setOrdemServicoPdv(null);
    limparVenda();
  }

  function abrirFluxoFinalizacao() {
    if (!caixaAberto) {
      alert("Abra o caixa antes de finalizar uma venda.");
      setModalAbrirCaixa(true);
      return;
    }

    if (carrinho.length === 0) {
      alert("Adicione produtos ao carrinho.");
      return;
    }

    if (ehDelivery) {
      if (usarDadosClienteEntrega) {
        preencherDeliveryComDadosCliente();
      }

      setModalDelivery(true);
      return;
    }

    setModalPagamento(true);
  }

  function totalVendasCaixa() {
    return vendasCaixa.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0,
    );
  }

  function totalPorForma(forma: string) {
    return pagamentosCaixa
      .filter((pag) => pag.forma_pagamento === forma)
      .reduce((total, pag) => total + Number(pag.valor || 0), 0);
  }

  function totalSuprimentos() {
    return movimentosCaixa
      .filter((mov) => mov.tipo === "suprimento")
      .reduce((total, mov) => total + Number(mov.valor || 0), 0);
  }

  function totalSangrias() {
    return movimentosCaixa
      .filter((mov) => mov.tipo === "sangria")
      .reduce((total, mov) => total + Number(mov.valor || 0), 0);
  }

  function saldoEsperado() {
    return (
      Number(caixaAberto?.valor_abertura || 0) +
      totalPorForma("dinheiro") +
      totalSuprimentos() -
      totalSangrias()
    );
  }

  function totalInformadoFechamento() {
    return (
      converterNumero(fechDinheiro) +
      converterNumero(fechPix) +
      converterNumero(fechDebito) +
      converterNumero(fechCredito) +
      converterNumero(fechCrediario)
    );
  }

  function diferencaFechamento() {
    const dinheiroEsperado =
      Number(caixaAberto?.valor_abertura || 0) +
      totalPorForma("dinheiro") +
      totalSuprimentos() -
      totalSangrias();

    const totalSistema =
      dinheiroEsperado +
      totalPorForma("pix") +
      totalPorForma("debito") +
      totalPorForma("credito") +
      totalPorForma("crediario");

    return totalInformadoFechamento() - totalSistema;
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const produtosReq = await supabase
      .from("produtos")
      .select(
        "id,codigo,codigo_barras,nome,preco_venda,qtd_atual,foto_url,controlar_imei",
      )
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome");

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      return;
    }

    const produtosLista = produtosReq.data || [];
    setProdutos(produtosLista);

    const produtoIds = produtosLista.map((produto) => produto.id);

    if (produtoIds.length > 0) {
      const codigosReq = await supabase
        .from("produto_codigos")
        .select("id,produto_id,codigo,tipo,descricao")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .in("produto_id", produtoIds);

      setProdutoCodigos(codigosReq.error ? [] : ((codigosReq.data || []) as ProdutoCodigoPdv[]));

      const embalagensReq = await supabase
        .from("produto_embalagens")
        .select("id,produto_id,nome,codigo,fator_conversao,preco_venda,unidade")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .in("produto_id", produtoIds);

      setProdutoEmbalagens(embalagensReq.error ? [] : ((embalagensReq.data || []) as ProdutoEmbalagemPdv[]));
    } else {
      setProdutoCodigos([]);
      setProdutoEmbalagens([]);
    }

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome,cpf_cnpj,whatsapp")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (clientesReq.error) {
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      return;
    }

    setClientes(clientesReq.data || []);

    const caixaReq = await supabase
      .from("caixas")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("status", "aberto")
      .order("data_abertura", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (caixaReq.error) {
      alert("Erro ao verificar caixa: " + caixaReq.error.message);
      return;
    }

    setCaixaAberto(caixaReq.data || null);

    if (caixaReq.data?.id) {
      await carregarMovimentosCaixa(caixaReq.data.id);
      await carregarVendasCaixa(caixaReq.data.id);
      await carregarVendasDetalhadas(caixaReq.data.id);
    } else {
      setMovimentosCaixa([]);
      setVendasCaixa([]);
      setPagamentosCaixa([]);
      setVendasDetalhadas([]);
    }
  }

  async function carregarMovimentosCaixa(caixaId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const req = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("caixa_id", caixaId)
      .order("created_at", { ascending: false });

    if (req.error) {
      alert("Erro ao carregar movimentações do caixa: " + req.error.message);
      return;
    }

    setMovimentosCaixa(req.data || []);
  }

  async function carregarVendasDetalhadas(caixaId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    /*
      Correção importante:
      Esta consulta NÃO usa relacionamento automático entre vendas e pagamentos_venda,
      porque no seu Supabase ainda não existe FK entre pagamentos_venda.venda_id e vendas.id.
      Por isso carregamos vendas, itens e pagamentos em consultas separadas.
    */

    const vendasReq = await supabase
      .from("vendas")
      .select(
        "id,numero_venda,cliente_id,valor_total,created_at,status,forma_pagamento,desconto,caixa_id,empresa_id",
      )
      .eq("empresa_id", empresaId)
      .eq("caixa_id", caixaId)
      .order("created_at", { ascending: false });

    if (vendasReq.error) {
      alert("Erro ao carregar vendas: " + vendasReq.error.message);
      return;
    }

    const vendas = vendasReq.data || [];

    if (vendas.length === 0) {
      setVendasDetalhadas([]);
      return;
    }

    const vendaIds = vendas.map((venda) => venda.id);

    const itensReq = await supabase
      .from("itens_venda")
      .select(
        "id,venda_id,produto_id,quantidade,valor_unitario,subtotal,empresa_id",
      )
      .eq("empresa_id", empresaId)
      .in("venda_id", vendaIds);

    if (itensReq.error) {
      alert("Erro ao carregar itens das vendas: " + itensReq.error.message);
      return;
    }

    const itens = itensReq.data || [];
    const produtoIds = Array.from(
      new Set(itens.map((item) => item.produto_id).filter(Boolean)),
    );

    let produtosItens: any[] = [];

    if (produtoIds.length > 0) {
      const produtosReq = await supabase
        .from("produtos")
        .select("id,codigo,nome")
        .eq("empresa_id", empresaId)
        .in("id", produtoIds);

      if (produtosReq.error) {
        alert(
          "Erro ao carregar nomes dos produtos: " + produtosReq.error.message,
        );
        return;
      }

      produtosItens = produtosReq.data || [];
    }

    const pagamentosReq = await supabase
      .from("pagamentos_venda")
      .select("id,venda_id,forma_pagamento,valor,empresa_id")
      .eq("empresa_id", empresaId)
      .in("venda_id", vendaIds);

    if (pagamentosReq.error) {
      alert(
        "Erro ao carregar pagamentos das vendas: " +
          pagamentosReq.error.message,
      );
      return;
    }

    const pagamentos = pagamentosReq.data || [];

    const vendasMontadas = vendas.map((venda: any) => {
      const itensDaVenda = itens
        .filter((item: any) => item.venda_id === venda.id)
        .map((item: any) => {
          const produto = produtosItens.find(
            (prod: any) => prod.id === item.produto_id,
          );

          return {
            id: item.id,
            venda_id: item.venda_id,
            produto_id: item.produto_id,
            quantidade: Number(item.quantidade || 0),
            valor_unitario: Number(item.valor_unitario || 0),
            subtotal: Number(item.subtotal || 0),
            produtos: {
              nome: produto?.nome || "Produto",
              codigo: produto?.codigo || "-",
            },
          };
        });

      return {
        id: venda.id,
        numero_venda: Number(venda.numero_venda || 0),
        cliente_id: venda.cliente_id,
        valor_total: Number(venda.valor_total || 0),
        created_at: venda.created_at,
        status: venda.status,
        forma_pagamento: venda.forma_pagamento,
        desconto: Number(venda.desconto || 0),
        itens_venda: itensDaVenda,
        pagamentos_venda: pagamentos.filter(
          (pag: any) => pag.venda_id === venda.id,
        ),
      };
    });

    setVendasDetalhadas(vendasMontadas as VendaDetalhada[]);
  }

  async function carregarVendasCaixa(caixaId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const vendasReq = await supabase
      .from("vendas")
      .select("id,cliente_id,valor_total,created_at")
      .eq("empresa_id", empresaId)
      .eq("caixa_id", caixaId)
      .eq("status", "finalizada");

    if (vendasReq.error) {
      alert("Erro ao carregar vendas do caixa: " + vendasReq.error.message);
      return;
    }

    const vendas = vendasReq.data || [];
    setVendasCaixa(vendas);

    if (vendas.length === 0) {
      setPagamentosCaixa([]);
      return;
    }

    const vendaIds = vendas.map((venda) => venda.id);

    const pagamentosReq = await supabase
      .from("pagamentos_venda")
      .select("*")
      .eq("empresa_id", empresaId)
      .in("venda_id", vendaIds);

    if (pagamentosReq.error) {
      alert("Erro ao carregar pagamentos: " + pagamentosReq.error.message);
      return;
    }

    setPagamentosCaixa(pagamentosReq.data || []);
  }

  async function carregarHistoricoCliente(idCliente: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!idCliente) {
      setTotalCompradoCliente(0);
      setTotalAbertoCliente(0);
      setUltimaCompraCliente("");
      setSaldoCreditoCliente(0);
      setUsarCreditoCliente(false);
      return;
    }

    const vendasReq = await supabase
      .from("vendas")
      .select("valor_total,created_at")
      .eq("empresa_id", empresaId)
      .eq("cliente_id", idCliente)
      .eq("status", "finalizada")
      .order("created_at", { ascending: false });

    const vendas = vendasReq.data || [];

    setTotalCompradoCliente(
      vendas.reduce(
        (total, venda) => total + Number(venda.valor_total || 0),
        0,
      ),
    );

    setUltimaCompraCliente(vendas[0]?.created_at || "");

    const contasReq = await supabase
      .from("contas_receber")
      .select("valor,status")
      .eq("empresa_id", empresaId)
      .eq("cliente_id", idCliente);

    const contas = contasReq.data || [];

    setTotalAbertoCliente(
      contas
        .filter((conta) => conta.status !== "pago")
        .reduce((total, conta) => total + Number(conta.valor || 0), 0),
    );

    try {
      const saldoReq = await supabase.rpc("saldo_credito_cliente", {
        p_empresa_id: empresaId,
        p_cliente_id: idCliente,
      });

      const saldo = saldoReq.error ? 0 : Number(saldoReq.data || 0);
      setSaldoCreditoCliente(saldo);

      if (saldo <= 0) {
        setUsarCreditoCliente(false);
      }
    } catch {
      setSaldoCreditoCliente(0);
      setUsarCreditoCliente(false);
    }
  }

  async function proximoNumeroCaixa() {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const { data, error } = await supabase
      .from("caixas")
      .select("numero_caixa")
      .eq("empresa_id", empresaId)
      .not("numero_caixa", "is", null)
      .order("numero_caixa", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error("Erro ao gerar número do caixa: " + error.message);
    }

    return Number(data?.[0]?.numero_caixa || 0) + 1;
  }

  async function abrirCaixa() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (caixaAberto) {
      alert("Já existe um caixa aberto.");
      return;
    }

    const usuarioAutorizado = await validarUsuarioOperacao();

    if (!usuarioAutorizado) {
      return;
    }

    const operadorValidado =
      usuarioAutorizado.nome || operadorCaixa || operadorAtual();

    if (!operadorValidado) {
      alert("Informe o operador do caixa.");
      return;
    }

    const valor = converterNumero(valorAbertura);

    if (isNaN(valor) || valor < 0) {
      alert("Valor de abertura inválido.");
      return;
    }

    let numeroCaixaGerado = 1;

    try {
      numeroCaixaGerado = await proximoNumeroCaixa();
    } catch (error: any) {
      alert(error.message);
      return;
    }

    const { error } = await supabase.from("caixas").insert([
      {
        empresa_id: empresaId,
        numero_caixa: numeroCaixaGerado,
        usuario: operadorValidado,
        valor_abertura: valor,
        valor_fechamento: null,
        status: "aberto",
        data_abertura: new Date().toISOString(),
        data_fechamento: null,
        observacao: observacaoCaixa,
      },
    ]);

    if (error) {
      alert("Erro ao abrir caixa: " + error.message);
      return;
    }

    alert(
      `Caixa Nº ${formatarNumeroVenda(numeroCaixaGerado)} aberto com sucesso!`,
    );

    setValorAbertura("0,00");
    setObservacaoCaixa("");
    limparAutorizacaoOperacao();
    setModalAbrirCaixa(false);

    await carregarDados();
  }

  function abrirDevolucao(venda: VendaDetalhada) {
    if (venda.status === "cancelada" || venda.status === "devolvida") {
      alert("Esta venda já está cancelada/devolvida.");
      return;
    }

    setVendaDevolucao(venda);
    setTipoDevolucao("estorno");
    if (motivoDevolucaoRef.current) motivoDevolucaoRef.current.value = "";
    setLoginOperacao("");
    setSenhaOperacao("");
    setModalDevolucao(true);
  }

  function nomeClienteVenda(clienteIdVenda: string | null) {
    if (!clienteIdVenda) return "Consumidor Final";
    const cliente = clientes.find((item) => item.id === clienteIdVenda);
    return cliente?.nome || "Consumidor Final";
  }

  function totalVendaDevolucao() {
    return Number(vendaDevolucao?.valor_total || 0);
  }

  async function devolverVenda() {
    if (processandoDevolucao) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!caixaAberto) {
      alert("Abra o caixa antes de registrar uma devolução.");
      return;
    }

    if (!vendaDevolucao) {
      alert("Nenhuma venda selecionada.");
      return;
    }

    const motivoDevolucao = (motivoDevolucaoRef.current?.value || "").trim();

    if (!motivoDevolucao) {
      alert("Informe o motivo da devolução.");
      return;
    }

    const usuarioAutorizado = await validarUsuarioOperacao();

    if (!usuarioAutorizado) return;

    const confirmar = confirm(
      `Confirmar devolução da venda ${vendaDevolucao.id}?\n\nValor: ${formatarMoeda(totalVendaDevolucao())}\nTipo: ${
        tipoDevolucao === "estorno"
          ? "Estorno/saída do caixa"
          : "Crédito para cliente"
      }`,
    );

    if (!confirmar) return;

    setProcessandoDevolucao(true);

    try {
      const itens = vendaDevolucao.itens_venda || [];

      for (const item of itens) {
        const movimento = await supabase.from("movimentacoes_estoque").insert([
          {
            empresa_id: empresaId,
            produto_id: item.produto_id,
            tipo: "entrada",
            quantidade: Number(item.quantidade || 0),
            custo_unitario: 0,
            nota_fiscal: null,
            fornecedor_id: null,
            observacao: `Devolução venda ${vendaDevolucao.id}`,
            usuario: usuarioAutorizado.nome || operadorAtual(),
          },
        ]);

        if (movimento.error) throw new Error(movimento.error.message);
      }

      if (tipoDevolucao === "estorno") {
        const movimentoCaixa = await supabase
          .from("movimentacoes_caixa")
          .insert([
            {
              caixa_id: caixaAberto.id,
              empresa_id: empresaId,
              tipo: "sangria",
              valor: totalVendaDevolucao(),
              descricao: `Estorno devolução venda Nº ${formatarNumeroVenda(vendaDevolucao.numero_venda)} - ${motivoDevolucao}`,
              usuario: usuarioAutorizado.nome || operadorAtual(),
            },
          ]);

        if (movimentoCaixa.error) throw new Error(movimentoCaixa.error.message);
      } else {
        if (!vendaDevolucao.cliente_id) {
          throw new Error(
            "Para gerar crédito, a venda precisa ter cliente selecionado.",
          );
        }

        const credito = await supabase.from("contas_receber").insert([
          {
            empresa_id: empresaId,
            cliente_id: vendaDevolucao.cliente_id,
            descricao: `Crédito de devolução da venda ${vendaDevolucao.id}`,
            valor: totalVendaDevolucao() * -1,
            vencimento: new Date().toISOString().split("T")[0],
            status: "credito",
          },
        ]);

        if (credito.error) throw new Error(credito.error.message);
      }

      const vendaUpdate = await supabase
        .from("vendas")
        .update({
          status: "devolvida",
          observacao: `Devolução: ${motivoDevolucao}`,
        })
        .eq("empresa_id", empresaId)
        .eq("id", vendaDevolucao.id);

      if (vendaUpdate.error) throw new Error(vendaUpdate.error.message);

      alert("Devolução registrada com sucesso!");

      setModalDevolucao(false);
      setVendaDevolucao(null);
      if (motivoDevolucaoRef.current) motivoDevolucaoRef.current.value = "";
      limparAutorizacaoOperacao();

      await carregarDados();
    } catch (error: any) {
      alert("Erro ao registrar devolução: " + error.message);
    }

    setProcessandoDevolucao(false);
  }

  function montarRelatorioFechamentoCaixa(dados: {
    caixa: Caixa;
    dataFechamento: string;
    dinheiroSistema: number;
    pixSistema: number;
    debitoSistema: number;
    creditoSistema: number;
    crediarioSistema: number;
    valorInformado: number;
    saldoSistema: number;
    diferenca: number;
    observacao: string;
  }) {
    const movimentos = movimentosCaixa
      .map((mov) => {
        return `
          <tr>
            <td>${formatarData(mov.created_at)}</td>
            <td>${String(mov.tipo || "").toUpperCase()}</td>
            <td style="text-align:right;">${formatarMoeda(Number(mov.valor || 0))}</td>
          </tr>
          <tr>
            <td colspan="3" class="small">${mov.descricao || "-"}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Fechamento de Caixa</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              width: 300px;
              margin: 0 auto;
              color: #111827;
              font-size: 12px;
            }

            .center {
              text-align: center;
            }

            h1 {
              font-size: 17px;
              margin: 4px 0;
            }

            h2 {
              font-size: 14px;
              margin: 8px 0 4px;
            }

            p {
              margin: 3px 0;
            }

            hr {
              border: none;
              border-top: 1px dashed #111827;
              margin: 10px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding: 3px 0;
              vertical-align: top;
            }

            .total {
              font-size: 16px;
              font-weight: bold;
            }

            .small {
              font-size: 11px;
            }

            .assinatura {
              margin-top: 28px;
              border-top: 1px solid #111827;
              text-align: center;
              padding-top: 4px;
            }

            @media print {
              body {
                width: 80mm;
              }

              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          ${cabecalhoEmpresaCupom()}

          <div class="center">
            <p class="small">Relatório de Fechamento de Caixa</p>
            <p class="small">Cupom de Conferência Interna</p>
          </div>

          <hr />

          <p><strong>Caixa Nº:</strong> ${formatarNumeroVenda(dados.caixa.numero_caixa)}</p>
          <p><strong>ID do Caixa:</strong> ${dados.caixa.id}</p>
          <p><strong>Operador:</strong> ${dados.caixa.usuario || operadorAtual()}</p>
          <p><strong>Abertura:</strong> ${formatarData(dados.caixa.data_abertura)}</p>
          <p><strong>Fechamento:</strong> ${formatarData(dados.dataFechamento)}</p>
          <p><strong>Valor abertura:</strong> ${formatarMoeda(Number(dados.caixa.valor_abertura || 0))}</p>

          <hr />

          <h2>Vendas por Forma de Pagamento</h2>

          <table>
            <tbody>
              <tr>
                <td>Dinheiro</td>
                <td style="text-align:right;">${formatarMoeda(dados.dinheiroSistema)}</td>
              </tr>
              <tr>
                <td>PIX</td>
                <td style="text-align:right;">${formatarMoeda(dados.pixSistema)}</td>
              </tr>
              <tr>
                <td>Débito</td>
                <td style="text-align:right;">${formatarMoeda(dados.debitoSistema)}</td>
              </tr>
              <tr>
                <td>Crédito</td>
                <td style="text-align:right;">${formatarMoeda(dados.creditoSistema)}</td>
              </tr>
              <tr>
                <td>Crediário</td>
                <td style="text-align:right;">${formatarMoeda(dados.crediarioSistema)}</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <h2>Resumo do Caixa</h2>

          <table>
            <tbody>
              <tr>
                <td>Vendas realizadas</td>
                <td style="text-align:right;">${vendasCaixa.length}</td>
              </tr>
              <tr>
                <td>Total vendido</td>
                <td style="text-align:right;">${formatarMoeda(totalVendasCaixa())}</td>
              </tr>
              <tr>
                <td>Suprimentos</td>
                <td style="text-align:right;">${formatarMoeda(totalSuprimentos())}</td>
              </tr>
              <tr>
                <td>Sangrias</td>
                <td style="text-align:right;">${formatarMoeda(totalSangrias())}</td>
              </tr>
              <tr>
                <td>Saldo esperado</td>
                <td style="text-align:right;">${formatarMoeda(dados.saldoSistema)}</td>
              </tr>
              <tr>
                <td>Valor informado</td>
                <td style="text-align:right;">${formatarMoeda(dados.valorInformado)}</td>
              </tr>
              <tr class="total">
                <td>Diferença</td>
                <td style="text-align:right;">${formatarMoeda(dados.diferenca)}</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <h2>Movimentações</h2>

          ${
            movimentos
              ? `<table><tbody>${movimentos}</tbody></table>`
              : `<p class="small">Nenhuma sangria ou suprimento registrado.</p>`
          }

          <hr />

          <p><strong>Observação:</strong></p>
          <p class="small">${dados.observacao || "-"}</p>

          <div class="assinatura">
            Assinatura do Operador
          </div>

          <div class="assinatura">
            Conferência do Gerente
          </div>

          <hr />

          <div class="center">
            <p class="small">THCloud ERP</p>
            <p class="small">Relatório interno para conferência de caixa.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
  }

  function imprimirRelatorioFechamentoCaixa(html: string) {
    const janela = window.open("", "_blank", "width=420,height=700");

    if (!janela) {
      alert(
        "O navegador bloqueou a janela de impressão. Libere pop-ups para imprimir o fechamento.",
      );
      return;
    }

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }

  async function fecharCaixa() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!caixaAberto) {
      alert("Nenhum caixa aberto.");
      return;
    }

    const dinheiroSistema =
      Number(caixaAberto.valor_abertura || 0) +
      totalPorForma("dinheiro") +
      totalSuprimentos() -
      totalSangrias();

    const pixSistema = totalPorForma("pix");
    const debitoSistema = totalPorForma("debito");
    const creditoSistema = totalPorForma("credito");
    const crediarioSistema = totalPorForma("crediario");

    const valorInformado = totalInformadoFechamento();
    const saldoSistema =
      dinheiroSistema +
      pixSistema +
      debitoSistema +
      creditoSistema +
      crediarioSistema;

    const diferenca = valorInformado - saldoSistema;
    const dataFechamento = new Date().toISOString();

    const relatorioFechamento = montarRelatorioFechamentoCaixa({
      caixa: caixaAberto,
      dataFechamento,
      dinheiroSistema,
      pixSistema,
      debitoSistema,
      creditoSistema,
      crediarioSistema,
      valorInformado,
      saldoSistema,
      diferenca,
      observacao: observacaoCaixa,
    });

    const { error } = await supabase
      .from("caixas")
      .update({
        valor_fechamento: valorInformado,
        total_dinheiro: dinheiroSistema,
        total_pix: pixSistema,
        total_debito: debitoSistema,
        total_credito: creditoSistema,
        total_crediario: crediarioSistema,
        saldo_esperado: saldoSistema,
        valor_informado: valorInformado,
        diferenca,
        status: "fechado",
        data_fechamento: dataFechamento,
        observacao: observacaoCaixa,
      })
      .eq("id", caixaAberto.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao fechar caixa: " + error.message);
      return;
    }

    alert("Caixa fechado com sucesso!");

    imprimirRelatorioFechamentoCaixa(relatorioFechamento);

    setFechDinheiro("0,00");
    setFechPix("0,00");
    setFechDebito("0,00");
    setFechCredito("0,00");
    setFechCrediario("0,00");
    setObservacaoCaixa("");
    setModalFecharCaixa(false);
    setCaixaAberto(null);

    await carregarDados();
  }

  function abrirMovimentoCaixa(tipo: "sangria" | "suprimento") {
    if (!caixaAberto) {
      alert("Abra o caixa primeiro.");
      return;
    }

    setTipoMovimentoCaixa(tipo);
    setValorMovimentoCaixa("0,00");
    setDescricaoMovimentoCaixa("");
    setModalMovimentoCaixa(true);
  }

  async function registrarMovimentoCaixa() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!caixaAberto) {
      alert("Nenhum caixa aberto.");
      return;
    }

    const usuarioAutorizado = await validarUsuarioOperacao();

    if (!usuarioAutorizado) {
      return;
    }

    const valor = converterNumero(valorMovimentoCaixa);

    if (isNaN(valor) || valor <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const { error } = await supabase.from("movimentacoes_caixa").insert([
      {
        caixa_id: caixaAberto.id,
        empresa_id: empresaId,
        tipo: tipoMovimentoCaixa,
        valor,
        descricao: descricaoMovimentoCaixa,
        usuario:
          usuarioAutorizado.nome || caixaAberto.usuario || operadorAtual(),
      },
    ]);

    if (error) {
      alert("Erro ao registrar movimentação: " + error.message);
      return;
    }

    alert(
      tipoMovimentoCaixa === "sangria"
        ? "Sangria registrada com sucesso!"
        : "Suprimento registrado com sucesso!",
    );

    setValorMovimentoCaixa("0,00");
    setDescricaoMovimentoCaixa("");
    limparAutorizacaoOperacao();
    setModalMovimentoCaixa(false);

    await carregarDados();
  }

  function chaveItemCarrinho(item: ItemCarrinho) {
    if (item.produto_imei_id) return item.produto_imei_id;
    if (item.produto_id) return item.produto_id;
    return `servico-${item.codigo || item.nome}-${item.valor_unitario}`;
  }

  async function carregarImeisDisponiveisProduto(produto: Produto) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("produto_imeis")
      .select("id,produto_id,imei,imei_2,numero_serie,cor,capacidade,status")
      .eq("empresa_id", empresaId)
      .eq("produto_id", produto.id)
      .eq("status", "disponivel")
      .order("created_at", { ascending: true });

    if (error) {
      alert("Erro ao carregar IMEIs disponíveis: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert(
        "Este produto controla IMEI, mas não possui IMEI disponível cadastrado.",
      );
      return;
    }

    setProdutoAguardandoImei(produto);
    setImeisDisponiveisProduto((data || []) as ImeiDisponivelPDV[]);
    setBuscaImeiVenda("");
    setModalSelecionarImei(true);
  }

  function adicionarProdutoComImei(
    produto: Produto,
    imeiSelecionado: ImeiDisponivelPDV,
  ) {
    const jaExiste = carrinho.some(
      (item) => item.produto_imei_id === imeiSelecionado.id,
    );

    if (jaExiste) {
      alert("Este IMEI já está no carrinho.");
      return;
    }

    setCarrinho([
      ...carrinho,
      {
        produto_id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        foto_url: produto.foto_url,
        quantidade: 1,
        valor_unitario: Number(produto.preco_venda),
        subtotal: Number(produto.preco_venda),
        controlar_imei: true,
        produto_imei_id: imeiSelecionado.id,
        imei: imeiSelecionado.imei,
        imei_2: imeiSelecionado.imei_2,
        numero_serie: imeiSelecionado.numero_serie,
      },
    ]);

    setCodigoBusca("");
    setPesquisaProduto("");
    setModalProdutos(false);
    setModalSelecionarImei(false);
    setProdutoAguardandoImei(null);
    setImeisDisponiveisProduto([]);
    setBuscaImeiVenda("");
  }

  function adicionarProduto(
    produto: Produto,
    opcoes?: { quantidade?: number; valorUnitario?: number; codigoUsado?: string; descricaoExtra?: string },
  ) {
    if (!caixaAberto) {
      alert("Abra o caixa antes de iniciar uma venda.");
      setModalAbrirCaixa(true);
      return;
    }

    if (
      !configuracoesSistema.permitir_estoque_negativo &&
      Number(produto.qtd_atual || 0) <= 0
    ) {
      alert("Produto sem estoque.");
      return;
    }

    if (produto.controlar_imei === true) {
      carregarImeisDisponiveisProduto(produto);
      return;
    }

    const quantidadeAdicionar = Number(opcoes?.quantidade || 1);
    const valorUnitario = Number(opcoes?.valorUnitario || produto.preco_venda);
    const codigoVenda = opcoes?.codigoUsado || produto.codigo;
    const nomeVenda = opcoes?.descricaoExtra ? `${produto.nome} - ${opcoes.descricaoExtra}` : produto.nome;

    const existente = carrinho.find(
      (item) =>
        item.produto_id === produto.id &&
        !item.produto_imei_id &&
        item.codigo === codigoVenda &&
        item.valor_unitario === valorUnitario,
    );

    if (existente) {
      const novaQuantidade = existente.quantidade + quantidadeAdicionar;

      if (
        !configuracoesSistema.permitir_estoque_negativo &&
        novaQuantidade > Number(produto.qtd_atual || 0)
      ) {
        alert("Estoque insuficiente.");
        return;
      }

      setCarrinho(
        carrinho.map((item) =>
          item.produto_id === produto.id
            ? {
                ...item,
                quantidade: novaQuantidade,
                subtotal: novaQuantidade * item.valor_unitario,
              }
            : item,
        ),
      );
    } else {
      setCarrinho([
        ...carrinho,
        {
          produto_id: produto.id,
          codigo: codigoVenda,
          nome: nomeVenda,
          foto_url: produto.foto_url,
          quantidade: quantidadeAdicionar,
          valor_unitario: valorUnitario,
          subtotal: quantidadeAdicionar * valorUnitario,
          controlar_imei: false,
          produto_imei_id: null,
          imei: null,
          imei_2: null,
          numero_serie: null,
        },
      ]);
    }

    setCodigoBusca("");
    setPesquisaProduto("");
    setModalProdutos(false);
  }

  function localizarProdutoPorTermo(termoOriginal: string) {
    const termo = termoOriginal.trim().toLowerCase();
    if (!termo) return null;

    const produtoDireto = produtos.find(
      (item) =>
        item.codigo?.toLowerCase() === termo ||
        item.codigo_barras?.toLowerCase() === termo,
    );

    if (produtoDireto) return { produto: produtoDireto, codigoUsado: termoOriginal.trim() };

    const codigoAlternativo = produtoCodigos.find(
      (item) => item.codigo?.toLowerCase() === termo,
    );

    if (codigoAlternativo) {
      const produto = produtos.find((item) => item.id === codigoAlternativo.produto_id);
      if (produto) return { produto, codigoUsado: codigoAlternativo.codigo };
    }

    const embalagem = produtoEmbalagens.find(
      (item) => item.codigo?.toLowerCase() === termo,
    );

    if (embalagem) {
      const produto = produtos.find((item) => item.id === embalagem.produto_id);
      if (produto) {
        const fator = Number(embalagem.fator_conversao || 1);
        const precoEmbalagem = Number(embalagem.preco_venda || 0);
        return {
          produto,
          codigoUsado: embalagem.codigo,
          quantidade: fator,
          valorUnitario: precoEmbalagem > 0 && fator > 0 ? precoEmbalagem / fator : Number(produto.preco_venda),
          descricaoExtra: `${embalagem.nome} (${fator} ${embalagem.unidade || produto.codigo || "UN"})`,
        };
      }
    }

    const produtoPorNome = produtos.find((item) => item.nome?.toLowerCase().includes(termo));
    return produtoPorNome ? { produto: produtoPorNome, codigoUsado: produtoPorNome.codigo } : null;
  }

  function textoBuscaProduto(produto: Produto) {
    const codigosExtras = produtoCodigos
      .filter((item) => item.produto_id === produto.id)
      .map((item) => `${item.codigo} ${item.tipo || ""} ${item.descricao || ""}`)
      .join(" ");

    const embalagensExtras = produtoEmbalagens
      .filter((item) => item.produto_id === produto.id)
      .map((item) => `${item.nome} ${item.codigo} ${item.unidade || ""}`)
      .join(" ");

    return `${produto.nome} ${produto.codigo || ""} ${produto.codigo_barras || ""} ${codigosExtras} ${embalagensExtras}`.toLowerCase();
  }

  function buscarProduto() {
    if (!caixaAberto) {
      alert("Abra o caixa antes de vender.");
      setModalAbrirCaixa(true);
      return;
    }

    if (!codigoBusca) {
      alert("Digite ou bipe um código.");
      return;
    }

    const resultado = localizarProdutoPorTermo(codigoBusca);

    if (!resultado) {
      alert("Produto não encontrado. Use a lupa para pesquisar.");
      return;
    }

    adicionarProduto(resultado.produto, {
      quantidade: resultado.quantidade,
      valorUnitario: resultado.valorUnitario,
      codigoUsado: resultado.codigoUsado,
      descricaoExtra: resultado.descricaoExtra,
    });
  }

  function alterarQuantidade(chaveItem: string, quantidade: string) {
    const qtd = converterNumero(quantidade);

    if (isNaN(qtd) || qtd <= 0) return;

    const itemCarrinho = carrinho.find(
      (item) => chaveItemCarrinho(item) === chaveItem,
    );
    if (!itemCarrinho) return;

    if (itemCarrinho.controlar_imei || itemCarrinho.produto_imei_id) {
      if (qtd !== 1) {
        alert(
          "Produto com controle de IMEI deve ser vendido com quantidade 1 por aparelho.",
        );
      }
      return;
    }

    if (itemCarrinho.tipo !== "servico") {
      const produto = produtos.find(
        (item) => item.id === itemCarrinho.produto_id,
      );
      if (!produto) return;

      if (
        !configuracoesSistema.permitir_estoque_negativo &&
        qtd > Number(produto.qtd_atual || 0)
      ) {
        alert("Estoque insuficiente.");
        return;
      }
    }

    setCarrinho(
      carrinho.map((item) =>
        chaveItemCarrinho(item) === chaveItem
          ? { ...item, quantidade: qtd, subtotal: qtd * item.valor_unitario }
          : item,
      ),
    );
  }

  function removerItem(chaveItem: string) {
    setCarrinho(
      carrinho.filter((item) => chaveItemCarrinho(item) !== chaveItem),
    );
  }

  function cancelarUltimoItem() {
    if (carrinho.length === 0) {
      alert("Nenhum item para cancelar.");
      return;
    }

    const ultimoItem = carrinho[carrinho.length - 1];

    const confirmar = confirm(
      `Deseja cancelar o último item?\n\n${ultimoItem.nome}`,
    );

    if (!confirmar) return;

    removerItem(chaveItemCarrinho(ultimoItem));
  }

  function cancelarVendaAtual() {
    if (carrinho.length === 0) {
      alert("Nenhuma venda em andamento.");
      return;
    }

    const confirmar = confirm(
      "Deseja cancelar a venda atual? Todos os itens serão removidos.",
    );

    if (!confirmar) return;

    limparVenda();
  }

  async function emitirNfce() {
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    const { data: empresaFiscal } = await supabase
      .from("empresas")
      .select("modulo_fiscal, fiscal_configurado")
      .eq("id", empresaId)
      .maybeSingle();

    if (!empresaFiscal?.modulo_fiscal) {
      alert(
        "O módulo fiscal ainda não está habilitado para a sua empresa. Fale com o suporte para contratar.",
      );
      return;
    }

    if (!empresaFiscal?.fiscal_configurado) {
      alert(
        "O módulo fiscal está habilitado, mas a configuração ainda não foi concluída. Acesse Fiscal, no menu, para completar.",
      );
      return;
    }

    alert(
      "Toda venda finalizada já gera automaticamente um registro de NFC-e pendente, visível em Fiscal → Documentos emitidos. A emissão de verdade acontece assim que um provedor de emissão for conectado.",
    );
  }

  // Roda automaticamente logo após uma venda ser finalizada. Não emite a
  // NFC-e de verdade ainda (isso depende de conectar um provedor de
  // emissão fiscal), mas já deixa o registro pronto, na fila, pra quando
  // essa integração existir — sem travar nem atrasar a venda.
  async function registrarDocumentoFiscalPendente(
    vendaId: string,
    valorTotalVenda: number,
  ) {
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    const { data: empresaFiscal } = await supabase
      .from("empresas")
      .select("modulo_fiscal, fiscal_configurado, ambiente_fiscal, serie_nfce, proximo_numero_nfce, provedor_fiscal")
      .eq("id", empresaId)
      .maybeSingle();

    if (!empresaFiscal?.modulo_fiscal || !empresaFiscal?.fiscal_configurado) {
      return;
    }

    const numeroDocumento = empresaFiscal.proximo_numero_nfce || 1;

    const { error } = await supabase.from("documentos_fiscais").insert({
      empresa_id: empresaId,
      venda_id: vendaId,
      tipo: "nfce",
      status: "pendente",
      numero: numeroDocumento,
      serie: empresaFiscal.serie_nfce || 1,
      ambiente: empresaFiscal.ambiente_fiscal || "homologacao",
      valor_total: valorTotalVenda,
      provedor: empresaFiscal.provedor_fiscal || null,
    });

    if (!error) {
      await supabase
        .from("empresas")
        .update({ proximo_numero_nfce: numeroDocumento + 1 })
        .eq("id", empresaId);
    }
  }

  function limparVenda() {
    setCarrinho([]);
    setClienteId("");
    setCodigoBusca("");
    setPesquisaProduto("");
    setDescontoValor("0");
    setDescontoPercentual("0");
    setPagDinheiro("0");
    setPagPix("0");
    setPagDebito("0");
    setPagCredito("0");
    setPagCrediario("0");
    setArredondamentoVenda("0");
    setParcelas("1");
    setPrimeiroVencimento("");
    setDiasEntreParcelas(
      String(configuracoesSistema.intervalo_parcelas_padrao_dias || 30),
    );
    setEhDelivery(false);
    setTelefoneEntrega("");
    setEnderecoEntrega("");
    setNumeroEntrega("");
    setBairroEntrega("");
    setReferenciaEntrega("");
    setTaxaEntrega("0");
    setEntregador("");
    window.setTimeout(() => produtoInputRef.current?.focus(), 80);
    setObservacaoEntrega("");
    setUsarDadosClienteEntrega(true);
    setTotalCompradoCliente(0);
    setTotalAbertoCliente(0);
    setUltimaCompraCliente("");
    setSaldoCreditoCliente(0);
    setUsarCreditoCliente(false);
    setOrcamentoPdv(null);
    setOrdemServicoPdv(null);
  }

  function selecionarCliente(cliente: Cliente) {
    setClienteId(cliente.id);
    setModalPesquisarCliente(false);
    setPesquisaCliente("");
    carregarHistoricoCliente(cliente.id);
  }

  async function salvarNovoCliente() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!novoClienteNome && !novoClienteDocumento) {
      alert("Digite o nome ou CPF/CNPJ do cliente.");
      return;
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert([
        {
          empresa_id: empresaId,
          nome: novoClienteNome || "Cliente sem nome",
          cpf_cnpj: novoClienteDocumento || null,
          whatsapp: novoClienteWhatsapp || null,
          ativo: true,
        },
      ])
      .select("id,nome,cpf_cnpj,whatsapp")
      .single();

    if (error) {
      alert("Erro ao salvar cliente: " + error.message);
      return;
    }

    await carregarDados();

    if (data) {
      setClienteId(data.id);
      carregarHistoricoCliente(data.id);
    }

    setNovoClienteNome("");
    setNovoClienteDocumento("");
    setNovoClienteWhatsapp("");
    setModalNovoCliente(false);
  }

  function gerarVencimentoPorDias(base: string, parcelaIndex: number) {
    const intervalo = Math.max(
      Number(
        diasEntreParcelas ||
          configuracoesSistema.intervalo_parcelas_padrao_dias ||
          30,
      ),
      1,
    );
    const data = new Date(base + "T00:00:00");
    data.setDate(data.getDate() + intervalo * parcelaIndex);
    return data.toISOString().split("T")[0];
  }

  async function baixarEstoque(item: ItemCarrinho) {
    if (item.tipo === "servico" || !item.produto_id) return;

    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const produto = produtos.find((p) => p.id === item.produto_id);

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    const quantidadeVendida = Number(item.quantidade || 0);

    if (quantidadeVendida <= 0) {
      throw new Error(`Quantidade inválida para ${produto.nome}.`);
    }

    const quantidadeAtual = Number(produto.qtd_atual || 0);

    if (
      !configuracoesSistema.permitir_estoque_negativo &&
      quantidadeVendida > quantidadeAtual
    ) {
      throw new Error(`Estoque insuficiente para ${produto.nome}.`);
    }

    /*
      CORREÇÃO DEFINITIVA:
      Seu banco provavelmente possui trigger no Supabase que atualiza produtos.qtd_atual
      quando uma movimentação é inserida em movimentacoes_estoque.

      Por isso, se o código atualizar produtos.qtd_atual e depois inserir a movimentação,
      o estoque baixa 2 vezes.

      Agora o PDV NÃO altera produtos.qtd_atual diretamente.
      Ele apenas registra a movimentação de saída.
      A trigger/banco faz a baixa do estoque uma única vez.
    */

    const movimento = await supabase.from("movimentacoes_estoque").insert([
      {
        empresa_id: empresaId,
        produto_id: item.produto_id,
        tipo: "saida",
        quantidade: quantidadeVendida,
        custo_unitario: 0,
        nota_fiscal: null,
        fornecedor_id: null,
        observacao: item.imei ? `Venda PDV - IMEI ${item.imei}` : "Venda PDV",
        usuario: caixaAberto?.usuario || operadorAtual(),
      },
    ]);

    if (movimento.error) {
      throw new Error(movimento.error.message);
    }
  }

  async function gerarContasReceber(
    vendaId: string,
    numeroVenda?: number | null,
  ) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const valorCrediario = converterNumero(pagCrediario);

    if (valorCrediario <= 0) return;

    if (!clienteId) {
      throw new Error("Selecione um cliente para vender no crediário.");
    }

    if (!primeiroVencimento) {
      throw new Error("Informe o primeiro vencimento.");
    }

    const qtdParcelas = Number(parcelas || 1);

    if (qtdParcelas <= 0) {
      throw new Error("Quantidade de parcelas inválida.");
    }

    const valorBase = Math.floor((valorCrediario / qtdParcelas) * 100) / 100;
    let soma = 0;
    const contas = [];

    for (let i = 1; i <= qtdParcelas; i++) {
      let valorParcela = valorBase;

      if (i === qtdParcelas) {
        valorParcela = Number((valorCrediario - soma).toFixed(2));
      }

      soma += valorParcela;

      const ordemIdConta =
        ordemServicoPdv?.id || orcamentoPdv?.ordem_servico_id || null;
      const origemConta = ordemIdConta
        ? "ordem_servico"
        : orcamentoPdv?.id
          ? "orcamento"
          : "pdv";
      const complementoOrigem = `${orcamentoPdv?.numero_orcamento ? ` - Orçamento Nº ${formatarNumeroVenda(orcamentoPdv.numero_orcamento)}` : ""}${ordemServicoPdv?.numero_os ? ` - OS Nº ${formatarNumeroVenda(ordemServicoPdv.numero_os)}` : ""}`;

      contas.push({
        empresa_id: empresaId,
        cliente_id: clienteId,
        descricao: `Venda Nº ${formatarNumeroVenda(numeroVenda)}${complementoOrigem} - Parcela ${i}/${qtdParcelas}`,
        venda_id: vendaId,
        numero_parcela: i,
        total_parcelas: qtdParcelas,
        valor: valorParcela,
        vencimento: gerarVencimentoPorDias(primeiroVencimento, i - 1),
        status: "aberto",
        origem: origemConta,
        orcamento_id: orcamentoPdv?.id || null,
        ordem_servico_id: ordemIdConta,
      });
    }

    const contasReq = await supabase.from("contas_receber").insert(contas);

    if (contasReq.error) {
      throw new Error(contasReq.error.message);
    }
  }

  async function salvarPagamentosVenda(vendaId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const pagamentos = [
      { forma_pagamento: "dinheiro", valor: converterNumero(pagDinheiro) },
      { forma_pagamento: "pix", valor: converterNumero(pagPix) },
      { forma_pagamento: "debito", valor: converterNumero(pagDebito) },
      { forma_pagamento: "credito", valor: converterNumero(pagCredito) },
      { forma_pagamento: "crediario", valor: converterNumero(pagCrediario) },
      { forma_pagamento: "credito_cliente", valor: valorCreditoUtilizado() },
    ]
      .filter((pag) => pag.valor > 0)
      .map((pag) => ({
        empresa_id: empresaId,
        venda_id: vendaId,
        forma_pagamento: pag.forma_pagamento,
        valor: pag.valor,
      }));

    if (pagamentos.length === 0) return;

    const { error } = await supabase
      .from("pagamentos_venda")
      .insert(pagamentos);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function consumirCreditoCliente(
    vendaId: string,
    numeroVenda?: number | null,
  ) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const valorCredito = valorCreditoUtilizado();

    if (valorCredito <= 0) return;

    if (!clienteId) {
      throw new Error("Selecione um cliente para usar crédito.");
    }

    const saldoReq = await supabase.rpc("saldo_credito_cliente", {
      p_empresa_id: empresaId,
      p_cliente_id: clienteId,
    });

    if (saldoReq.error) {
      throw new Error(
        "Erro ao consultar saldo do crédito: " + saldoReq.error.message,
      );
    }

    const saldoAtual = Number(saldoReq.data || 0);

    if (saldoAtual < valorCredito) {
      throw new Error("Saldo de crédito insuficiente para esta venda.");
    }

    const saldoApos = Number((saldoAtual - valorCredito).toFixed(2));

    const creditoReq = await supabase.from("creditos_cliente").insert([
      {
        empresa_id: empresaId,
        cliente_id: clienteId,
        venda_id: vendaId,
        devolucao_id: null,
        origem: "venda",
        tipo: "saida",
        valor: valorCredito,
        saldo_apos: saldoApos,
        descricao: `Crédito utilizado na venda Nº ${formatarNumeroVenda(numeroVenda)}`,
        usuario: caixaAberto?.usuario || operadorAtual(),
      },
    ]);

    if (creditoReq.error) {
      throw new Error(
        "Erro ao baixar crédito do cliente: " + creditoReq.error.message,
      );
    }

    setSaldoCreditoCliente(saldoApos);
  }

  function montarCupomVendaSalva(venda: VendaDetalhada) {
    const linhasItens = (venda.itens_venda || [])
      .map((item) => {
        return `
          <tr>
            <td>${item.quantidade}x ${item.produtos?.nome || "Produto"}</td>
            <td style="text-align:right;">${formatarMoeda(Number(item.subtotal || 0))}</td>
          </tr>
        `;
      })
      .join("");

    const pagamentos = (venda.pagamentos_venda || [])
      .map((pag) => {
        return `
          <tr>
            <td>${pag.forma_pagamento}</td>
            <td style="text-align:right;">${formatarMoeda(Number(pag.valor || 0))}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Reimpressão Venda ${formatarNumeroVenda(venda.numero_venda)}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              width: 300px;
              margin: 0 auto;
              color: #111827;
              font-size: 12px;
            }

            .center {
              text-align: center;
            }

            .logo {
              max-width: 120px;
              max-height: 70px;
              object-fit: contain;
              margin-bottom: 6px;
            }

            h1 {
              font-size: 18px;
              margin: 4px 0;
            }

            p {
              margin: 3px 0;
            }

            hr {
              border: none;
              border-top: 1px dashed #111827;
              margin: 10px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding: 3px 0;
              vertical-align: top;
            }

            .total {
              font-size: 18px;
              font-weight: bold;
            }

            .small {
              font-size: 11px;
            }

            @media print {
              body {
                width: 80mm;
              }

              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          ${cabecalhoEmpresaCupom()}

          <p class="center small">Cupom Não Fiscal - Reimpressão</p>

          <hr />

          <p><strong>Nº Venda:</strong> ${formatarNumeroVenda(venda.numero_venda)}</p>
          <p><strong>ID Interno:</strong> ${venda.id}</p>
          <p><strong>Data:</strong> ${formatarData(venda.created_at)}</p>
          <p><strong>Operador:</strong> ${caixaAberto?.usuario || operadorAtual()}</p>
          <p><strong>Cliente:</strong> ${nomeClienteVenda(venda.cliente_id)}</p>
          <p><strong>Status:</strong> ${venda.status || "finalizada"}</p>

          <hr />

          <table>
            <tbody>
              ${linhasItens}
            </tbody>
          </table>

          <hr />

          <table>
            <tbody>
              <tr>
                <td>Desconto</td>
                <td style="text-align:right;">${formatarMoeda(Number(venda.desconto || 0))}</td>
              </tr>

              <tr class="total">
                <td>TOTAL</td>
                <td style="text-align:right;">${formatarMoeda(Number(venda.valor_total || 0))}</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <p><strong>Pagamentos</strong></p>

          <table>
            <tbody>
              ${pagamentos || "<tr><td>Pagamento não localizado</td></tr>"}
            </tbody>
          </table>

          <hr />

          <div class="center">
            ${configuracoesSistema.mensagem_cupom ? `<p>${configuracoesSistema.mensagem_cupom}</p>` : `<p>Obrigado pela preferência!</p>`}
            <p class="small">Sistema THCloud ERP</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
  }

  function reimprimirCupomVenda(venda: VendaDetalhada) {
    const janela = window.open("", "_blank", "width=420,height=700");

    if (!janela) {
      alert(
        "O navegador bloqueou a janela de impressão. Libere pop-ups para reimprimir o cupom.",
      );
      return;
    }

    janela.document.open();
    janela.document.write(montarCupomVendaSalva(venda));
    janela.document.close();
  }

  function montarCupom(vendaId: string, numeroVenda?: number) {
    const linhasItens = carrinho
      .map((item) => {
        return `
          <tr>
            <td>${item.quantidade}x ${item.nome}${item.imei ? ` - IMEI: ${item.imei}` : ""}</td>
            <td style="text-align:right;">${formatarMoeda(item.subtotal)}</td>
          </tr>
        `;
      })
      .join("");

    const pagamentos = [
      ["Dinheiro", converterNumero(pagDinheiro)],
      ["PIX", converterNumero(pagPix)],
      ["Débito", converterNumero(pagDebito)],
      ["Crédito", converterNumero(pagCredito)],
      ["Crediário", converterNumero(pagCrediario)],
    ]
      .filter((item) => Number(item[1]) > 0)
      .map(
        ([forma, valor]) => `
          <tr>
            <td>${forma}</td>
            <td style="text-align:right;">${formatarMoeda(Number(valor))}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cupom Venda ${vendaId}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              width: 300px;
              margin: 0 auto;
              color: #111827;
              font-size: 12px;
            }

            .center {
              text-align: center;
            }

            .logo {
              max-width: 120px;
              max-height: 70px;
              object-fit: contain;
              margin-bottom: 6px;
            }

            h1 {
              font-size: 18px;
              margin: 4px 0;
            }

            p {
              margin: 3px 0;
            }

            hr {
              border: none;
              border-top: 1px dashed #111827;
              margin: 10px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding: 3px 0;
              vertical-align: top;
            }

            .total {
              font-size: 18px;
              font-weight: bold;
            }

            .small {
              font-size: 11px;
            }

            @media print {
              body {
                width: 80mm;
              }

              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          ${cabecalhoEmpresaCupom()}

          <p class="center small">Cupom Não Fiscal</p>

          <hr />

          <p><strong>Nº Venda:</strong> ${formatarNumeroVenda(numeroVenda)}</p>
          <p><strong>ID Interno:</strong> ${vendaId}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
          <p><strong>Operador:</strong> ${caixaAberto?.usuario || "Admin"}</p>
          <p><strong>Cliente:</strong> ${clienteSelecionado()}</p>

          <hr />

          <table>
            <tbody>
              ${linhasItens}
            </tbody>
          </table>

          <hr />

          <table>
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td style="text-align:right;">${formatarMoeda(totalBruto())}</td>
              </tr>

              <tr>
                <td>Desconto</td>
                <td style="text-align:right;">${formatarMoeda(valorDescontoTotal())}</td>
              </tr>

              ${
                valorArredondamento() !== 0
                  ? `
                    <tr>
                      <td>Arredondamento</td>
                      <td style="text-align:right;">${formatarMoeda(valorArredondamento())}</td>
                    </tr>
                  `
                  : ""
              }

              ${
                ehDelivery
                  ? `
                    <tr>
                      <td>Taxa Entrega</td>
                      <td style="text-align:right;">${formatarMoeda(converterNumero(taxaEntrega))}</td>
                    </tr>
                  `
                  : ""
              }

              <tr class="total">
                <td>TOTAL</td>
                <td style="text-align:right;">${formatarMoeda(totalFinal())}</td>
              </tr>

              <tr>
                <td>Total Pago</td>
                <td style="text-align:right;">${formatarMoeda(totalPago())}</td>
              </tr>

              <tr>
                <td>Troco</td>
                <td style="text-align:right;">${formatarMoeda(troco())}</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <p><strong>Pagamentos</strong></p>

          <table>
            <tbody>
              ${pagamentos}
            </tbody>
          </table>

          ${
            converterNumero(pagCrediario) > 0
              ? `
                <hr />
                <p><strong>Crediário:</strong> ${parcelas} parcela(s)</p>
                <p><strong>1º vencimento:</strong> ${primeiroVencimento || "-"}</p>
              `
              : ""
          }

          <hr />

          <div class="center">
            ${configuracoesSistema.mensagem_cupom ? `<p>${configuracoesSistema.mensagem_cupom}</p>` : `<p>Obrigado pela preferência!</p>`}
            <p class="small">Sistema THCloud ERP</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
  }

  async function manterTelaCheiaAposImpressao() {
    if (!modoTelaCheia) return;

    setTimeout(async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {}
    }, 800);
  }

  function imprimirCupom(vendaId: string, numeroVenda?: number) {
    const janela = window.open("", "_blank", "width=420,height=700");

    if (!janela) {
      alert(
        "O navegador bloqueou a janela de impressão. Libere pop-ups para imprimir o cupom.",
      );
      return;
    }

    janela.document.open();
    janela.document.write(montarCupom(vendaId, numeroVenda));
    janela.document.close();
    manterTelaCheiaAposImpressao();
  }

  function montarRomaneioEntrega(vendaId: string) {
    const linhasItens = carrinho
      .map((item) => {
        return `
          <tr>
            <td>${item.quantidade}x ${item.nome}${item.imei ? ` - IMEI: ${item.imei}` : ""}</td>
            <td style="text-align:right;">${formatarMoeda(item.subtotal)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Romaneio de Entrega ${vendaId}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              width: 300px;
              margin: 0 auto;
              color: #111827;
              font-size: 12px;
            }

            .center {
              text-align: center;
            }

            h1 {
              font-size: 17px;
              margin: 4px 0;
            }

            h2 {
              font-size: 14px;
              margin: 8px 0 4px;
            }

            p {
              margin: 3px 0;
            }

            hr {
              border: none;
              border-top: 1px dashed #111827;
              margin: 10px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding: 3px 0;
              vertical-align: top;
            }

            .total {
              font-size: 17px;
              font-weight: bold;
            }

            .small {
              font-size: 11px;
            }

            .assinatura {
              margin-top: 30px;
              border-top: 1px solid #111827;
              text-align: center;
              padding-top: 4px;
            }

            @media print {
              body {
                width: 80mm;
              }

              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          ${cabecalhoEmpresaCupom()}

          <div class="center">
            <h1>ROMANEIO DE ENTREGA</h1>
            <p class="small">Documento interno de entrega</p>
          </div>

          <hr />

          <p><strong>Pedido/Venda:</strong> ${vendaId}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
          <p><strong>Operador:</strong> ${caixaAberto?.usuario || operadorAtual()}</p>

          <hr />

          <h2>Dados do Cliente</h2>
          <p><strong>Cliente:</strong> ${clienteSelecionado()}</p>
          <p><strong>Telefone:</strong> ${telefoneEntrega || "-"}</p>

          <hr />

          <h2>Endereço de Entrega</h2>
          <p><strong>Endereço:</strong> ${enderecoEntrega || "-"}</p>
          <p><strong>Número:</strong> ${numeroEntrega || "-"}</p>
          <p><strong>Bairro:</strong> ${bairroEntrega || "-"}</p>
          <p><strong>Referência:</strong> ${referenciaEntrega || "-"}</p>
          <p><strong>Entregador:</strong> ${entregador || "-"}</p>

          ${
            observacaoEntrega
              ? `<p><strong>Obs:</strong> ${observacaoEntrega}</p>`
              : ""
          }

          <hr />

          <h2>Itens</h2>

          <table>
            <tbody>
              ${linhasItens}
            </tbody>
          </table>

          <hr />

          <table>
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td style="text-align:right;">${formatarMoeda(totalBruto())}</td>
              </tr>
              <tr>
                <td>Desconto</td>
                <td style="text-align:right;">${formatarMoeda(valorDescontoTotal())}</td>
              </tr>
              <tr>
                <td>Taxa entrega</td>
                <td style="text-align:right;">${formatarMoeda(converterNumero(taxaEntrega))}</td>
              </tr>
              <tr class="total">
                <td>TOTAL</td>
                <td style="text-align:right;">${formatarMoeda(totalFinal())}</td>
              </tr>
            </tbody>
          </table>

          <div class="assinatura">
            Assinatura do Cliente
          </div>

          <div class="assinatura">
            Assinatura do Entregador
          </div>

          <hr />

          <div class="center">
            <p class="small">THCloud ERP</p>
            <p class="small">Romaneio para conferência de entrega.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
  }

  function imprimirRomaneioEntrega(vendaId: string) {
    const janela = window.open("", "_blank", "width=420,height=700");

    if (!janela) {
      alert(
        "O navegador bloqueou a janela de impressão. Libere pop-ups para imprimir o romaneio.",
      );
      return;
    }

    janela.document.open();
    janela.document.write(montarRomaneioEntrega(vendaId));
    janela.document.close();
    manterTelaCheiaAposImpressao();
  }

  function corpoDocumentoImpressao(html: string) {
    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const corpo = match?.[1] || html;

    return corpo.replace(/<script[\s\S]*?<\/script>/gi, "");
  }

  function montarCupomRomaneioEntrega(vendaId: string, numeroVenda?: number) {
    const corpoCupom = corpoDocumentoImpressao(
      montarCupom(vendaId, numeroVenda),
    );
    const corpoRomaneio = corpoDocumentoImpressao(
      montarRomaneioEntrega(vendaId),
    );

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Venda ${formatarNumeroVenda(numeroVenda)} - Cupom e Romaneio</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              width: 300px;
              margin: 0 auto;
              color: #111827;
              font-size: 12px;
            }

            .center {
              text-align: center;
            }

            .logo {
              max-width: 120px;
              max-height: 70px;
              object-fit: contain;
              margin-bottom: 6px;
            }

            h1 {
              font-size: 18px;
              margin: 4px 0;
            }

            h2 {
              font-size: 14px;
              margin: 8px 0 4px;
            }

            p {
              margin: 3px 0;
            }

            hr {
              border: none;
              border-top: 1px dashed #111827;
              margin: 10px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding: 3px 0;
              vertical-align: top;
            }

            .total {
              font-size: 18px;
              font-weight: bold;
            }

            .small {
              font-size: 11px;
            }

            .assinatura {
              margin-top: 30px;
              border-top: 1px solid #111827;
              text-align: center;
              padding-top: 4px;
            }

            .pagina-cupom {
              page-break-after: always;
              break-after: page;
            }

            .pagina-romaneio {
              page-break-before: always;
              break-before: page;
            }

            @media print {
              body {
                width: 80mm;
              }

              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="pagina-cupom">
            ${corpoCupom}
          </div>

          <div class="pagina-romaneio">
            ${corpoRomaneio}
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;
  }

  function imprimirCupomRomaneioEntrega(vendaId: string, numeroVenda?: number) {
    const janela = window.open("", "_blank", "width=420,height=700");

    if (!janela) {
      alert(
        "O navegador bloqueou a janela de impressão. Libere pop-ups para imprimir cupom e romaneio.",
      );
      return;
    }

    janela.document.open();
    janela.document.write(montarCupomRomaneioEntrega(vendaId, numeroVenda));
    janela.document.close();
    manterTelaCheiaAposImpressao();
  }

  function montarPromissoriasCrediario(vendaId: string, numeroVenda?: number) {
    const valorCrediario = converterNumero(pagCrediario);
    const qtdParcelas = Math.max(Number(parcelas || 1), 1);
    const valorBase = Math.floor((valorCrediario / qtdParcelas) * 100) / 100;
    let soma = 0;
    const linhas = [];

    for (let i = 1; i <= qtdParcelas; i++) {
      let valorParcela = valorBase;
      if (i === qtdParcelas)
        valorParcela = Number((valorCrediario - soma).toFixed(2));
      soma += valorParcela;

      linhas.push(`
        <div class="promissoria">
          <h2>PROMISSÓRIA / DUPLICATA</h2>
          <p><strong>Venda Nº:</strong> ${formatarNumeroVenda(numeroVenda)} &nbsp; <strong>Parcela:</strong> ${i}/${qtdParcelas}</p>
          <p><strong>Vencimento:</strong> ${formatarData(gerarVencimentoPorDias(primeiroVencimento, i - 1))}</p>
          <p><strong>Valor:</strong> ${formatarMoeda(valorParcela)}</p>
          <p>Eu, <strong>${clienteSelecionado()}</strong>, reconheço a dívida referente à compra realizada nesta data e comprometo-me a pagar o valor acima no vencimento informado.</p>
          <div class="assinaturas">
            <div>Assinatura do Cliente</div>
            <div>Responsável pela Loja</div>
          </div>
        </div>
      `);
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Promissórias Venda ${vendaId}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 20px; }
            .promissoria { border: 2px solid #111827; border-radius: 12px; padding: 18px; margin-bottom: 18px; page-break-inside: avoid; }
            h2 { text-align: center; margin: 0 0 12px; }
            p { font-size: 14px; line-height: 1.5; }
            .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 45px; }
            .assinaturas div { border-top: 1px solid #111827; text-align: center; padding-top: 6px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="padding:10px 14px;background:#2563eb;color:white;border:0;border-radius:8px;font-weight:bold;">Imprimir Promissórias</button>
          ${cabecalhoEmpresaCupom()}
          ${linhas.join("")}
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `;
  }

  function imprimirPromissoriasCrediario(
    vendaId: string,
    numeroVenda?: number,
  ) {
    if (
      converterNumero(pagCrediario) <= 0 ||
      !configuracoesSistema.gerar_promissoria_crediario
    )
      return;

    const janela = window.open("", "_blank", "width=900,height=800");

    if (!janela) {
      alert(
        "O navegador bloqueou a janela de promissórias. Libere pop-ups para imprimir.",
      );
      return;
    }

    janela.document.open();
    janela.document.write(montarPromissoriasCrediario(vendaId, numeroVenda));
    janela.document.close();
    manterTelaCheiaAposImpressao();
  }

  async function registrarImeisVenda(
    vendaId: string,
    itensSalvos: { id: string; produto_id: string }[],
  ) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    for (let index = 0; index < carrinho.length; index++) {
      const item = carrinho[index];

      if (!item.produto_imei_id) continue;

      const itemSalvo =
        itensSalvos[index] ||
        itensSalvos.find((salvo) => salvo.produto_id === item.produto_id);

      if (!itemSalvo?.id) {
        throw new Error(
          `Não foi possível localizar o item da venda para o IMEI ${item.imei}.`,
        );
      }

      const { error } = await supabase.rpc("registrar_venda_imei", {
        p_empresa_id: empresaId,
        p_produto_imei_id: item.produto_imei_id,
        p_venda_id: vendaId,
        p_item_venda_id: itemSalvo.id,
        p_cliente_id: clienteId || null,
        p_usuario: caixaAberto?.usuario || operadorAtual(),
      });

      if (error) {
        throw new Error("Erro ao registrar venda do IMEI: " + error.message);
      }
    }
  }

  async function registrarRecebimentosFinanceiros(
    vendaId: string,
    numeroVenda?: number | null,
  ) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");
    if (!caixaAberto?.id) throw new Error("Caixa não identificado.");

    const pagamentos = [
      { forma: "dinheiro", valor: converterNumero(pagDinheiro) },
      { forma: "pix", valor: converterNumero(pagPix) },
      { forma: "debito", valor: converterNumero(pagDebito) },
      { forma: "credito", valor: converterNumero(pagCredito) },
      { forma: "credito_cliente", valor: valorCreditoUtilizado() },
    ].filter((pag) => pag.valor > 0);

    if (pagamentos.length === 0) return;

    const movimentos = pagamentos.map((pag) => ({
      caixa_id: caixaAberto.id,
      empresa_id: empresaId,
      tipo: "suprimento",
      valor: pag.valor,
      descricao: `Recebimento venda Nº ${formatarNumeroVenda(numeroVenda)} (${pag.forma})${orcamentoPdv?.numero_orcamento ? ` - Orçamento Nº ${formatarNumeroVenda(orcamentoPdv.numero_orcamento)}` : ""}${ordemServicoPdv?.numero_os ? ` - OS Nº ${formatarNumeroVenda(ordemServicoPdv.numero_os)}` : ""}`,
      usuario: caixaAberto.usuario || operadorAtual(),
    }));

    const { error } = await supabase
      .from("movimentacoes_caixa")
      .insert(movimentos);

    if (error) {
      throw new Error(
        "Erro ao registrar recebimento no caixa/financeiro: " + error.message,
      );
    }
  }

  async function atualizarIntegracoesVenda(
    vendaId: string,
    numeroVenda?: number | null,
  ) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const agora = new Date().toISOString();
    const usuario = caixaAberto?.usuario || operadorAtual();
    const ordemIdVinculada =
      ordemServicoPdv?.id || orcamentoPdv?.ordem_servico_id || null;

    if (orcamentoPdv?.id) {
      const statusOrcamento = await supabase
        .from("orcamentos")
        .update({
          status: "aprovado",
          convertido_venda_id: vendaId,
          convertido_em: agora,
        })
        .eq("empresa_id", empresaId)
        .eq("id", orcamentoPdv.id);

      if (statusOrcamento.error) {
        throw new Error(
          "Venda finalizada, mas não foi possível atualizar o orçamento: " +
            statusOrcamento.error.message,
        );
      }
    }

    if (ordemIdVinculada) {
      const statusOs = await supabase
        .from("ordens_servico")
        .update({
          status: "entregue",
          data_entrega: agora,
          usuario,
        })
        .eq("empresa_id", empresaId)
        .eq("id", ordemIdVinculada);

      if (statusOs.error) {
        throw new Error(
          "Venda finalizada, mas não foi possível atualizar a OS: " +
            statusOs.error.message,
        );
      }

      const historicoOs = await supabase
        .from("ordem_servico_historico")
        .insert([
          {
            empresa_id: empresaId,
            ordem_servico_id: ordemIdVinculada,
            status_anterior: ordemServicoPdv?.id ? "" : "aprovada",
            status_novo: "entregue",
            acao: "GERAR_VENDA_PDV",
            descricao: `Venda Nº ${formatarNumeroVenda(numeroVenda)} gerada no PDV${orcamentoPdv?.numero_orcamento ? ` a partir do Orçamento Nº ${formatarNumeroVenda(orcamentoPdv.numero_orcamento)}` : ""}${ordemServicoPdv?.numero_os ? ` a partir da OS Nº ${formatarNumeroVenda(ordemServicoPdv.numero_os)}` : ""}.`,
            usuario,
          },
        ]);

      if (historicoOs.error) {
        throw new Error(
          "Venda finalizada, mas não foi possível registrar o histórico da OS: " +
            historicoOs.error.message,
        );
      }

      const orcamentosOs = await supabase
        .from("orcamentos")
        .update({
          status: "aprovado",
          convertido_venda_id: vendaId,
          convertido_em: agora,
        })
        .eq("empresa_id", empresaId)
        .eq("ordem_servico_id", ordemIdVinculada)
        .is("convertido_venda_id", null);

      if (orcamentosOs.error) {
        throw new Error(
          "Venda finalizada, mas não foi possível atualizar o orçamento vinculado à OS: " +
            orcamentosOs.error.message,
        );
      }
    }
  }

  async function finalizarVenda() {
    if (finalizandoVenda) {
      setFinalizandoVenda(false);
      return;
    }

    setFinalizandoVenda(true);

    const empresaId = empresaAtualId();

    if (!empresaId) {
      setFinalizandoVenda(false);
      setFinalizandoVenda(false);
      return;
    }

    if (!caixaAberto) {
      alert("Abra o caixa antes de finalizar uma venda.");
      setModalAbrirCaixa(true);
      setFinalizandoVenda(false);
      return;
    }

    if (carrinho.length === 0) {
      alert("Adicione produtos ao carrinho.");
      setFinalizandoVenda(false);
      return;
    }

    if (totalPago() < totalFinal()) {
      alert("O valor pago é menor que o total da venda.");
      setFinalizandoVenda(false);
      return;
    }

    if (
      configuracoesSistema.exigir_autorizacao_desconto &&
      Number(configuracoesSistema.desconto_maximo_percentual || 0) > 0 &&
      converterNumero(descontoPercentual) >
        Number(configuracoesSistema.desconto_maximo_percentual || 0)
    ) {
      alert(
        `Desconto acima do limite permitido (${configuracoesSistema.desconto_maximo_percentual}%).`,
      );
      setFinalizandoVenda(false);
      return;
    }

    if (converterNumero(pagCrediario) > 0 && !clienteId) {
      alert("Para crediário, selecione ou cadastre um cliente.");
      setFinalizandoVenda(false);
      return;
    }

    if (ehDelivery) {
      if (!clienteId) {
        alert("Para venda delivery, selecione ou cadastre um cliente.");
        setFinalizandoVenda(false);
        return;
      }

      if (!telefoneEntrega.trim()) {
        alert("Informe o telefone/WhatsApp da entrega.");
        setFinalizandoVenda(false);
        return;
      }

      if (!enderecoEntrega.trim()) {
        alert("Informe o endereço da entrega.");
        setFinalizandoVenda(false);
        return;
      }

      if (!bairroEntrega.trim()) {
        alert("Informe o bairro da entrega.");
        setFinalizandoVenda(false);
        return;
      }
    }

    let numeroVendaGerado = 0;

    try {
      numeroVendaGerado = await proximoNumeroVenda();
    } catch (error: any) {
      alert(error.message);
      setFinalizandoVenda(false);
      return;
    }

    const ordemIdVenda =
      ordemServicoPdv?.id || orcamentoPdv?.ordem_servico_id || null;
    const origemVenda = ordemIdVenda
      ? "ordem_servico"
      : orcamentoPdv?.id
        ? "orcamento"
        : "pdv";

    const vendaReq = await supabase
      .from("vendas")
      .insert([
        {
          empresa_id: empresaId,
          cliente_id: clienteId || null,
          caixa_id: caixaAberto.id,
          numero_venda: numeroVendaGerado,
          valor_original: totalFinalAntesCredito(),
          credito_utilizado: valorCreditoUtilizado(),
          valor_total: totalFinal(),
          desconto: valorDescontoTotal(),
          forma_pagamento: formaPagamentoResumo(),
          status: "finalizada",
          orcamento_id: orcamentoPdv?.id || null,
          ordem_servico_id: ordemIdVenda,
          origem: origemVenda,
        },
      ])
      .select("id,numero_venda")
      .single();

    if (vendaReq.error) {
      alert("Erro ao criar venda: " + vendaReq.error.message);
      setFinalizandoVenda(false);
      return;
    }

    const vendaId = vendaReq.data.id;
    const numeroVenda = vendaReq.data.numero_venda || numeroVendaGerado;

    const itens = carrinho
      .filter((item) => item.tipo !== "servico" && item.produto_id)
      .map((item) => ({
        empresa_id: empresaId,
        venda_id: vendaId,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        subtotal: item.subtotal,
      }));

    let itensSalvos: { id: string; produto_id: string }[] = [];

    if (itens.length > 0) {
      const itensReq = await supabase
        .from("itens_venda")
        .insert(itens)
        .select("id,produto_id");

      if (itensReq.error) {
        alert("Erro ao salvar itens da venda: " + itensReq.error.message);
        setFinalizandoVenda(false);
        return;
      }

      itensSalvos = (itensReq.data || []) as {
        id: string;
        produto_id: string;
      }[];
    }

    try {
      await salvarPagamentosVenda(vendaId);
      await registrarRecebimentosFinanceiros(vendaId, numeroVenda);
      await consumirCreditoCliente(vendaId, numeroVenda);
      await registrarImeisVenda(vendaId, itensSalvos);

      for (const item of carrinho) {
        await baixarEstoque(item);
      }

      await gerarContasReceber(vendaId, numeroVenda);

      await atualizarIntegracoesVenda(vendaId, numeroVenda);
    } catch (error: any) {
      alert("Venda criada, mas ocorreu erro após salvar: " + error.message);
      setFinalizandoVenda(false);
      return;
    }

    alert(
      `Venda Nº ${formatarNumeroVenda(numeroVenda)} finalizada com sucesso!`,
    );

    registrarDocumentoFiscalPendente(vendaId, totalFinal());

    if (
      ehDelivery &&
      configuracoesSistema.imprimir_cupom_automatico &&
      configuracoesSistema.imprimir_romaneio_delivery
    ) {
      imprimirCupomRomaneioEntrega(vendaId, numeroVenda);
    } else {
      if (configuracoesSistema.imprimir_cupom_automatico) {
        imprimirCupom(vendaId, numeroVenda);
      }

      if (ehDelivery && configuracoesSistema.imprimir_romaneio_delivery) {
        imprimirRomaneioEntrega(vendaId);
      }
    }

    imprimirPromissoriasCrediario(vendaId, numeroVenda);

    limparVenda();
    await carregarDados();
    setFinalizandoVenda(false);
  }

  useEffect(() => {
    const usuario = localStorage.getItem("th_usuario");

    if (usuario) {
      try {
        const dados = JSON.parse(usuario);

        setUsuarioNome(dados.nome || "");
        carregarEmpresaDoStorage(dados);

        if (dados.nome) {
          setOperadorCaixa(dados.nome);
        }
      } catch {}
    }

    carregarDados();
    carregarConfiguracoesSistema();
    carregarOrcamentoPendenteParaPdv();
    carregarOrdemServicoPendenteParaPdv();
  }, []);

  // (o intervalo do relógio agora vive dentro do componente RelogioPdv)

  useEffect(() => {
    atualizarStatusTelaCheia();

    document.addEventListener("fullscreenchange", atualizarStatusTelaCheia);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        atualizarStatusTelaCheia,
      );
    };
  }, []);

  useEffect(() => {
    function atalhos(event: KeyboardEvent) {
      // Enquanto o usuário estiver digitando dentro de um campo de texto
      // (input, textarea, campo de senha, etc.), a tecla Delete e o
      // Ctrl+X precisam continuar se comportando normalmente (apagar
      // texto/recortar), em vez de disparar os atalhos do PDV (cancelar
      // item, cancelar venda) por baixo dos panos.
      const elementoAtivo = document.activeElement;
      const estaDigitandoEmCampo =
        elementoAtivo instanceof HTMLInputElement ||
        elementoAtivo instanceof HTMLTextAreaElement ||
        (elementoAtivo instanceof HTMLElement && elementoAtivo.isContentEditable);

      if (event.key === "F1") {
        event.preventDefault();
        setModalAtalhos(true);
      }

      if (event.key === "F2") {
        event.preventDefault();
        setModalProdutos(true);
      }

      if (event.key === "F3") {
        event.preventDefault();
        setModalPesquisarCliente(true);
      }

      if (event.key === "F4") {
        event.preventDefault();
        setModalProdutos(true);
      }

      if (event.key === "F5") {
        event.preventDefault();
        if (!caixaAberto) {
          setModalAbrirCaixa(true);
        } else {
          setFechDinheiro(String(saldoEsperado().toFixed(2)).replace(".", ","));
          setFechPix(String(totalPorForma("pix").toFixed(2)).replace(".", ","));
          setFechDebito(
            String(totalPorForma("debito").toFixed(2)).replace(".", ","),
          );
          setFechCredito(
            String(totalPorForma("credito").toFixed(2)).replace(".", ","),
          );
          setFechCrediario(
            String(totalPorForma("crediario").toFixed(2)).replace(".", ","),
          );
          setModalFecharCaixa(true);
        }
      }

      if (event.key === "F6") {
        event.preventDefault();
        abrirMovimentoCaixa("sangria");
      }

      if (event.key === "F7") {
        event.preventDefault();
        abrirMovimentoCaixa("suprimento");
      }

      if (event.key === "F8") {
        event.preventDefault();
        abrirFluxoFinalizacao();
      }

      if (event.key === "F9") {
        event.preventDefault();
        setModalHistoricoCaixa(true);
      }

      if (event.key === "F10") {
        event.preventDefault();
        setModalConsultarVendas(true);
      }

      if (event.key === "F11") {
        event.preventDefault();
        emitirNfce();
      }

      if (event.key === "F12") {
        event.preventDefault();
        alternarTelaCheia();
      }

      if (event.key === "Delete" && !estaDigitandoEmCampo) {
        event.preventDefault();
        cancelarUltimoItem();
      }

      if (event.ctrlKey && event.key.toLowerCase() === "x" && !estaDigitandoEmCampo) {
        event.preventDefault();
        cancelarVendaAtual();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setModalProdutos(false);
        setModalPesquisarCliente(false);
        setModalNovoCliente(false);
        setModalAbrirCaixa(false);
        setModalFecharCaixa(false);
        setModalMovimentoCaixa(false);
        setModalPagamento(false);
        setModalDelivery(false);
        setModalAtalhos(false);
        setModalConsultarVendas(false);
        setModalDevolucao(false);
      }
    }

    window.addEventListener("keydown", atalhos);
    return () => window.removeEventListener("keydown", atalhos);
  });

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = pesquisaProduto.toLowerCase();
    return textoBuscaProduto(produto).includes(termo);
  });

  const produtosInstantaneos = produtos
    .filter((produto) => {
      const termo = codigoBusca.toLowerCase();

      if (!termo || termo.length < 2) return false;

      return textoBuscaProduto(produto).includes(termo);
    })
    .slice(0, 6);

  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = pesquisaCliente.toLowerCase();
    return (
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.cpf_cnpj?.toLowerCase().includes(termo) ||
      cliente.whatsapp?.toLowerCase().includes(termo)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-hidden p-2 flex flex-col gap-2">
      {ordemServicoPdv && (
        <div className="bg-violet-700 text-white rounded-2xl px-4 py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2 shadow-sm">
          <div>
            <p className="font-black">
              Venda carregada da OS Nº{" "}
              {formatarNumeroVenda(ordemServicoPdv.numero_os)}
            </p>
            <p className="text-sm text-violet-100">
              Cliente: {ordemServicoPdv.cliente_nome || "Cliente"} • Produtos:{" "}
              {formatarMoeda(ordemServicoPdv.valor_produtos)} • Serviços na OS:{" "}
              {formatarMoeda(ordemServicoPdv.valor_servicos)}
            </p>
          </div>
          <button
            type="button"
            onClick={cancelarOrdemServicoNoPdv}
            className="bg-white text-violet-800 px-4 py-2 rounded-xl font-black hover:bg-violet-50"
          >
            Remover OS do PDV
          </button>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 flex-none">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-xl shadow-sm">
              Th
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">Th Cloud PDV</p>
              <p className="text-sm text-slate-500 font-semibold">
                Modo caixa: venda rápida, tela limpa e foco no operador.
              </p>
            </div>

            <div className={`px-3 py-2 rounded-2xl border text-sm font-black ${caixaAberto ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {caixaAberto ? "● Caixa Aberto" : "● Caixa Fechado"}
            </div>

            <div className="text-sm text-slate-700 font-bold">
              Caixa: {caixaAberto?.numero_caixa || "001"}
            </div>
            <div className="text-sm text-slate-700 font-bold">
              Operador: {caixaAberto?.usuario || operadorAtual()}
            </div>
          </div>

          <div className="flex flex-col xl:items-end gap-2">
            <RelogioPdv />

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setModalAbrirCaixa(true)}
                disabled={!!caixaAberto}
                className={`px-4 py-2 rounded-xl font-bold text-white text-sm ${caixaAberto ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
              >
                Abrir Caixa
              </button>

              <button
                onClick={() => abrirMovimentoCaixa("sangria")}
                disabled={!caixaAberto}
                className={`px-4 py-2 rounded-xl font-bold text-white text-sm ${!caixaAberto ? "bg-slate-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                Sangria
              </button>

              <button
                onClick={() => abrirMovimentoCaixa("suprimento")}
                disabled={!caixaAberto}
                className={`px-4 py-2 rounded-xl font-bold text-white text-sm ${!caixaAberto ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                Suprimento
              </button>

              <button
                onClick={() => setModalHistoricoCaixa(true)}
                disabled={!caixaAberto}
                className={`px-4 py-2 rounded-xl font-bold text-white text-sm ${!caixaAberto ? "bg-slate-400 cursor-not-allowed" : "bg-slate-800 hover:bg-slate-900"}`}
              >
                Histórico F9
              </button>

              <button
                onClick={() => {
                  setFechDinheiro(String(saldoEsperado().toFixed(2)).replace(".", ","));
                  setFechPix(String(totalPorForma("pix").toFixed(2)).replace(".", ","));
                  setFechDebito(String(totalPorForma("debito").toFixed(2)).replace(".", ","));
                  setFechCredito(String(totalPorForma("credito").toFixed(2)).replace(".", ","));
                  setFechCrediario(String(totalPorForma("crediario").toFixed(2)).replace(".", ","));
                  setModalFecharCaixa(true);
                }}
                disabled={!caixaAberto}
                className={`px-4 py-2 rounded-xl font-bold text-white text-sm ${!caixaAberto ? "bg-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
              >
                Fechar Caixa
              </button>

              <button
                onClick={() => setModalConsultarVendas(true)}
                className="px-4 py-2 rounded-xl font-bold text-white text-sm bg-purple-600 hover:bg-purple-700"
              >
                Vendas F10
              </button>

              <button
                onClick={() => setModalAtalhos(true)}
                className="px-4 py-2 rounded-xl font-bold text-white text-sm bg-slate-700 hover:bg-slate-800"
              >
                Atalhos F1
              </button>

              <button
                onClick={alternarTelaCheia}
                className="px-4 py-2 rounded-xl font-bold text-white text-sm bg-blue-700 hover:bg-blue-800"
              >
                {modoTelaCheia ? "Sair Tela Cheia" : "Tela Cheia F12"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="xl:col-span-8 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 h-full min-h-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">Produtos</h2>
              <p className="text-xs text-slate-500 font-bold">Digite, bipe ou use F2 para pesquisar. Enter adiciona ao carrinho.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-black text-slate-600">
              <span className="px-2 py-1 rounded-lg bg-slate-100">F2 Pesquisa</span>
              <span className="px-2 py-1 rounded-lg bg-slate-100">Enter Adiciona</span>
            </div>
          </div>

          <div className="relative">
            <div className="flex gap-2 mb-3">
              <input
                ref={produtoInputRef}
                value={codigoBusca}
                onChange={(e) => setCodigoBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") buscarProduto();
                }}
                placeholder="🔍 Código de barras / Código interno / Nome do produto"
                className="w-full border-2 border-slate-200 focus:border-blue-600 outline-none px-4 py-3 rounded-xl text-slate-900 font-bold text-base"
                autoFocus
                disabled={!caixaAberto}
              />

              <button
                onClick={buscarProduto}
                disabled={!caixaAberto}
                className={`px-6 rounded-xl font-black text-white ${
                  !caixaAberto
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                Adicionar
              </button>

              <button
                title="Pesquisar produtos - F2"
                onClick={() => setModalProdutos(true)}
                disabled={!caixaAberto}
                className={`px-5 rounded-lg font-semibold text-white ${
                  !caixaAberto
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-700 hover:bg-slate-800"
                }`}
              >
                🔍
              </button>
            </div>

            {produtosInstantaneos.length > 0 && caixaAberto && (
              <div className="absolute z-40 top-14 left-0 right-32 bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden">
                {produtosInstantaneos.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarProduto(produto)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 text-left border-b"
                  >
                    <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {produto.foto_url ? (
                        <img
                          src={produto.foto_url}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-500">Sem foto</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{produto.nome}</p>
                      <p className="text-sm text-slate-600">
                        Código: {produto.codigo} • Estoque: {produto.qtd_atual}
                      </p>
                    </div>

                    <strong className="text-blue-700">
                      {formatarMoeda(Number(produto.preco_venda || 0))}
                    </strong>
                  </button>
                ))}
              </div>
            )}
          </div>

          {orcamentoPdv && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="text-sm font-black text-amber-800">
                📋 Orçamento Nº {formatarNumeroVenda(orcamentoPdv.numero_orcamento)} carregado nesta venda
              </p>
              <button
                type="button"
                onClick={cancelarOrcamentoNoPdv}
                className="rounded-xl border border-amber-400 bg-white px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100"
              >
                Remover orçamento
              </button>
            </div>
          )}

          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="p-2 text-left">Foto</th>
                  <th className="p-2 text-left">Produto/Serviço</th>
                  <th className="p-2 text-left">Qtd</th>
                  <th className="p-2 text-left">Unitário</th>
                  <th className="p-2 text-left">Subtotal</th>
                  <th className="p-2 text-center">Ação</th>
                </tr>
              </thead>

              <tbody>
                {carrinho.map((item) => (
                  <tr key={chaveItemCarrinho(item)} className="border-b hover:bg-blue-50/40 transition">
                    <td className="p-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {item.foto_url ? (
                          <img
                            src={item.foto_url}
                            alt={item.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : item.tipo === "servico" ? (
                          <span className="text-xs text-blue-700 font-black">
                            Serv.
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Sem</span>
                        )}
                      </div>
                    </td>

                    <td className="p-2 text-slate-900 font-black">
                      <p>
                        {item.codigo} - {item.nome}
                      </p>
                      {item.imei && (
                        <p className="text-xs text-blue-700 font-black mt-1">
                          IMEI: {item.imei}
                          {item.imei_2 ? ` • IMEI 2: ${item.imei_2}` : ""}
                        </p>
                      )}
                    </td>

                    <td className="p-3">
                      <input
                        value={item.quantidade}
                        onChange={(e) =>
                          alterarQuantidade(
                            chaveItemCarrinho(item),
                            e.target.value,
                          )
                        }
                        className="w-20 border border-slate-300 p-2 rounded text-slate-900"
                      />
                    </td>

                    <td className="p-2 text-slate-800">
                      {formatarMoeda(Number(item.valor_unitario))}
                    </td>

                    <td className="p-2 text-slate-800">
                      {formatarMoeda(Number(item.subtotal))}
                    </td>

                    <td className="p-2 text-center">
                      <button
                        onClick={() => removerItem(chaveItemCarrinho(item))}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}

                {carrinho.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-700">
                      {caixaAberto
                        ? "Nenhum produto no carrinho."
                        : "Abra o caixa para iniciar uma venda."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
            <span>
              F2 Pesquisa • Enter adiciona • Delete remove último item • F8
              pagamento
            </span>
            <button
              type="button"
              onClick={() => setModalHistoricoCaixa(true)}
              disabled={!caixaAberto}
              className={`px-3 py-2 rounded-lg font-black ${
                !caixaAberto
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800"
              }`}
            >
              Ver histórico do caixa
            </button>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-200 h-full min-h-0 overflow-y-auto">
          <h2 className="text-lg font-black text-slate-800 mb-2">
            Resumo da Venda
          </h2>

          <div className="space-y-1.5">
            <div className="flex gap-2">
              <div className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 bg-slate-50">
                {clienteSelecionado()}
              </div>

              <button
                onClick={() => setModalPesquisarCliente(true)}
                className="bg-slate-700 hover:bg-slate-800 text-white px-4 rounded-lg font-bold"
              >
                🔍
              </button>

              <button
                onClick={() => setModalNovoCliente(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-lg font-bold"
              >
                +
              </button>
            </div>

            {clienteId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs">
                <p className="font-bold text-blue-800">Histórico do Cliente</p>
                <p className="text-slate-700">
                  Última compra:{" "}
                  <strong>
                    {ultimaCompraCliente
                      ? formatarData(ultimaCompraCliente)
                      : "-"}
                  </strong>
                </p>
                <p className="text-slate-700">
                  Total comprado:{" "}
                  <strong>{formatarMoeda(totalCompradoCliente)}</strong>
                </p>
                <p className="text-slate-700">
                  Em aberto:{" "}
                  <strong>{formatarMoeda(totalAbertoCliente)}</strong>
                </p>

                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-emerald-800 text-xs">
                        Crédito disponível
                      </p>
                      <p className="text-xl font-black text-emerald-700 leading-tight">
                        {formatarMoeda(saldoCreditoCliente)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (saldoCreditoCliente <= 0) {
                          alert("Este cliente não possui crédito disponível.");
                          return;
                        }

                        setUsarCreditoCliente(!usarCreditoCliente);
                      }}
                      disabled={saldoCreditoCliente <= 0}
                      className={`px-2.5 py-1 rounded-lg font-black text-xs text-white ${
                        saldoCreditoCliente <= 0
                          ? "bg-slate-300 cursor-not-allowed"
                          : usarCreditoCliente
                            ? "bg-emerald-700 hover:bg-emerald-800"
                            : "bg-blue-700 hover:bg-blue-800"
                      }`}
                    >
                      {usarCreditoCliente ? "Crédito marcado" : "Usar Crédito"}
                    </button>
                  </div>

                  {usarCreditoCliente && (
                    <p className="text-xs text-emerald-800 mt-1 font-bold">
                      Será abatido nesta venda:{" "}
                      {formatarMoeda(valorCreditoUtilizado())}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border border-orange-200 rounded-xl p-2 bg-orange-50">
              <label className="flex items-center gap-3 font-black text-orange-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ehDelivery}
                  onChange={(e) => {
                    setEhDelivery(e.target.checked);

                    if (e.target.checked && usarDadosClienteEntrega) {
                      preencherDeliveryComDadosCliente();
                    }
                  }}
                  className="h-4 w-4"
                />
                Venda para Entrega / Delivery
              </label>

              {ehDelivery && (
                <div className="mt-2 text-xs text-orange-800">
                  <p>
                    Os dados da entrega serão solicitados em um popup antes do
                    pagamento.
                  </p>
                  <p className="font-bold mt-1">
                    Taxa de Entrega:{" "}
                    {formatarMoeda(converterNumero(taxaEntrega))}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
              <p className="font-black text-blue-900">Pagamento</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Clique em <strong>Finalizar Venda - F8</strong> para abrir a
                tela de pagamento.
              </p>
            </div>

            <div className="border-t pt-2 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <strong>{formatarMoeda(totalBruto())}</strong>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Desconto:</span>
                <strong>{formatarMoeda(valorDescontoTotal())}</strong>
              </div>

              {valorArredondamento() !== 0 && (
                <div
                  className={`flex justify-between ${valorArredondamento() < 0 ? "text-orange-700" : "text-green-700"}`}
                >
                  <span>Arredondamento:</span>
                  <strong>{formatarMoeda(valorArredondamento())}</strong>
                </div>
              )}

              {ehDelivery && (
                <div className="flex justify-between text-orange-700">
                  <span>Taxa Entrega:</span>
                  <strong>{formatarMoeda(converterNumero(taxaEntrega))}</strong>
                </div>
              )}

              {valorCreditoUtilizado() > 0 && (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>Total antes do crédito:</span>
                    <strong>{formatarMoeda(totalFinalAntesCredito())}</strong>
                  </div>

                  <div className="flex justify-between text-emerald-700">
                    <span>Crédito do cliente:</span>
                    <strong>- {formatarMoeda(valorCreditoUtilizado())}</strong>
                  </div>
                </>
              )}

              <div className="flex justify-between text-slate-700">
                <span>Total Pago:</span>
                <strong>{formatarMoeda(totalPago())}</strong>
              </div>

              <div className="flex justify-between text-red-700">
                <span>Falta:</span>
                <strong>{formatarMoeda(faltaPagar())}</strong>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-3">
              <p className="text-xs text-slate-300">TOTAL DA VENDA</p>
              <p className="text-2xl font-black leading-tight">
                {formatarMoeda(totalFinal())}
              </p>
            </div>

            <button
              onClick={abrirFluxoFinalizacao}
              disabled={!caixaAberto}
              className={`w-full px-5 py-2.5 rounded-lg font-black text-white ${
                !caixaAberto
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Finalizar Venda - F8
            </button>

            <button
              onClick={limparVenda}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 px-5 py-2.5 rounded-lg font-black"
            >
              Limpar Venda
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm flex-none">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-black text-slate-700">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">F1 Atalhos</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">F2 Produtos</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">F3 Cliente</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">F8 Finalizar</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">F9 Histórico</span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700">F10 Vendas</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">ESC Fechar</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">DEL Remove último</span>
        </div>
      </div>

      <SelecionarImeiProdutoPDV
        aberto={modalSelecionarImei}
        produtoNome={produtoAguardandoImei?.nome || ""}
        imeis={imeisDisponiveisProduto}
        busca={buscaImeiVenda}
        setBusca={setBuscaImeiVenda}
        onFechar={() => {
          setModalSelecionarImei(false);
          setProdutoAguardandoImei(null);
          setImeisDisponiveisProduto([]);
          setBuscaImeiVenda("");
        }}
        onSelecionar={(imeiSelecionado) => {
          if (!produtoAguardandoImei) return;
          adicionarProdutoComImei(produtoAguardandoImei, imeiSelecionado);
        }}
      />

      {modalHistoricoCaixa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Histórico do Caixa
                </h2>
                <p className="text-slate-500">
                  Movimentações do caixa atual. A tela principal do PDV continua
                  livre para a venda.
                </p>
              </div>

              <button
                onClick={() => setModalHistoricoCaixa(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                <Resumo
                  titulo="Movimentos"
                  valor={`${movimentosCaixa.length}`}
                  cor="text-blue-700"
                />
                <Resumo
                  titulo="Dinheiro"
                  valor={formatarMoeda(totalPorForma("dinheiro"))}
                  cor="text-slate-900"
                />
                <Resumo
                  titulo="PIX"
                  valor={formatarMoeda(totalPorForma("pix"))}
                  cor="text-emerald-700"
                />
                <Resumo
                  titulo="Saldo esperado"
                  valor={formatarMoeda(saldoEsperado())}
                  cor="text-green-700"
                />
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-3 text-left">Data</th>
                      <th className="p-3 text-left">Tipo</th>
                      <th className="p-3 text-left">Descrição</th>
                      <th className="p-3 text-right">Valor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimentosCaixa.map((mov) => (
                      <tr key={mov.id} className="border-b last:border-b-0">
                        <td className="p-3 text-slate-800">
                          {formatarData(mov.created_at)}
                        </td>
                        <td className="p-3 text-slate-800 uppercase font-black">
                          {mov.tipo}
                        </td>
                        <td className="p-3 text-slate-800">
                          {mov.descricao || "-"}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          {formatarMoeda(Number(mov.valor))}
                        </td>
                      </tr>
                    ))}

                    {movimentosCaixa.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-slate-500"
                        >
                          Nenhuma movimentação registrada neste caixa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setModalHistoricoCaixa(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAtalhos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Atalhos do PDV
                </h2>
                <p className="text-slate-500">
                  Use as teclas de função para operar o caixa com mais rapidez.
                </p>
              </div>

              <button
                onClick={() => setModalAtalhos(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Atalho tecla="F1" descricao="Abrir tela de atalhos" />
              <Atalho tecla="F2" descricao="Consulta rápida de produtos" />
              <Atalho tecla="F3" descricao="Pesquisar/selecionar cliente" />
              <Atalho tecla="F4" descricao="Pesquisar produto" />
              <Atalho tecla="F5" descricao="Abrir ou fechar caixa" />
              <Atalho tecla="F6" descricao="Registrar sangria" />
              <Atalho tecla="F7" descricao="Registrar suprimento" />
              <Atalho tecla="F8" descricao="Abrir pagamento/finalizar venda" />
              <Atalho tecla="F9" descricao="Abrir histórico do caixa" />
              <Atalho
                tecla="F10"
                descricao="Consultar vendas e devoluções"
              />
              <Atalho tecla="F11" descricao="NFC-e / módulo fiscal" />
              <Atalho tecla="F12" descricao="Entrar ou sair da tela cheia" />
              <Atalho
                tecla="DELETE"
                descricao="Cancelar último item da venda"
              />
              <Atalho tecla="CTRL + X" descricao="Cancelar venda atual" />
              <Atalho tecla="ESC" descricao="Fechar janelas abertas" />
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setModalAtalhos(false)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-black"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConsultarVendas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Consultar Vendas / Devoluções
                </h2>
                <p className="text-slate-500">
                  Consulte vendas do caixa, reimprima cupom ou registre
                  devolução.
                </p>
              </div>

              <button
                onClick={() => setModalConsultarVendas(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <Resumo
                  titulo="Vendas"
                  valor={`${vendasDetalhadas.length}`}
                  cor="text-blue-700"
                />
                <Resumo
                  titulo="Total Vendido"
                  valor={formatarMoeda(totalVendasCaixa())}
                  cor="text-green-700"
                />
                <Resumo
                  titulo="Dinheiro"
                  valor={formatarMoeda(totalPorForma("dinheiro"))}
                  cor="text-slate-900"
                />
                <Resumo
                  titulo="PIX"
                  valor={formatarMoeda(totalPorForma("pix"))}
                  cor="text-emerald-700"
                />
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-3 text-left">Venda</th>
                      <th className="p-3 text-left">Data</th>
                      <th className="p-3 text-left">Cliente</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Itens</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-2 text-center">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vendasDetalhadas.map((venda) => (
                      <tr
                        key={venda.id}
                        className="border-b last:border-b-0 align-top"
                      >
                        <td className="p-3 text-slate-900 font-bold">
                          <p className="text-blue-700">
                            Nº {formatarNumeroVenda(venda.numero_venda)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {venda.id}
                          </p>
                        </td>
                        <td className="p-3 text-slate-700">
                          {formatarData(venda.created_at)}
                        </td>
                        <td className="p-3 text-slate-700">
                          {nomeClienteVenda(venda.cliente_id)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black ${
                              venda.status === "devolvida" ||
                              venda.status === "cancelada"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {venda.status || "finalizada"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">
                          {(venda.itens_venda || []).slice(0, 3).map((item) => (
                            <p key={item.id}>
                              {item.quantidade}x{" "}
                              {item.produtos?.nome || "Produto"}
                            </p>
                          ))}
                          {(venda.itens_venda || []).length > 3 && (
                            <p className="text-xs text-slate-500">
                              + {(venda.itens_venda || []).length - 3} item(ns)
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-right text-green-700 font-black">
                          {formatarMoeda(Number(venda.valor_total || 0))}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => reimprimirCupomVenda(venda)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg font-bold"
                            >
                              Reimprimir
                            </button>

                            <button
                              onClick={() => abrirDevolucao(venda)}
                              disabled={
                                venda.status === "devolvida" ||
                                venda.status === "cancelada"
                              }
                              className={`px-3 py-2 rounded-lg font-bold ${
                                venda.status === "devolvida" ||
                                venda.status === "cancelada"
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-red-100 hover:bg-red-200 text-red-800"
                              }`}
                            >
                              Devolver
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {vendasDetalhadas.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-slate-500"
                        >
                          Nenhuma venda encontrada neste caixa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setModalConsultarVendas(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalDevolucao && vendaDevolucao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Devolução de Venda
                </h2>
                <p className="text-slate-500">
                  A devolução volta os produtos para o estoque e registra
                  saída/crédito.
                </p>
              </div>

              <button
                onClick={() => setModalDevolucao(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="font-black text-slate-900">
                    Venda: Nº {formatarNumeroVenda(vendaDevolucao.numero_venda)}
                  </p>
                  <p className="text-slate-700">
                    Cliente: {nomeClienteVenda(vendaDevolucao.cliente_id)}
                  </p>
                  <p className="text-slate-700">
                    Data: {formatarData(vendaDevolucao.created_at)}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-3 text-left">Produto</th>
                        <th className="p-3 text-right">Qtd</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(vendaDevolucao.itens_venda || []).map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="p-2 text-slate-800">
                            {item.produtos?.codigo || "-"} -{" "}
                            {item.produtos?.nome || "Produto"}
                          </td>
                          <td className="p-3 text-right text-slate-800">
                            {item.quantidade}
                          </td>
                          <td className="p-3 text-right text-slate-800">
                            {formatarMoeda(Number(item.subtotal || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="border border-slate-200 rounded-2xl p-4 cursor-pointer">
                    <input
                      type="radio"
                      checked={tipoDevolucao === "estorno"}
                      onChange={() => setTipoDevolucao("estorno")}
                      className="mr-2"
                    />
                    <strong>Estornar valor</strong>
                    <p className="text-sm text-slate-600 mt-1">
                      Registra saída do caixa como sangria/estorno.
                    </p>
                  </label>

                  <label className="border border-slate-200 rounded-2xl p-4 cursor-pointer">
                    <input
                      type="radio"
                      checked={tipoDevolucao === "credito"}
                      onChange={() => setTipoDevolucao("credito")}
                      className="mr-2"
                    />
                    <strong>Crédito para cliente</strong>
                    <p className="text-sm text-slate-600 mt-1">
                      Gera crédito no financeiro do cliente.
                    </p>
                  </label>
                </div>

                <textarea
                  ref={motivoDevolucaoRef}
                  key={vendaDevolucao?.id || "sem-venda"}
                  defaultValue=""
                  placeholder="Motivo da devolução"
                  className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 min-h-24"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  name="motivo-devolucao"
                  data-lpignore="true"
                  data-1p-ignore
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={loginOperacao}
                    onChange={(e) => setLoginOperacao(e.target.value)}
                    placeholder="Usuário/e-mail autorizador"
                    className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900"
                    autoComplete="off"
                    name="operador-devolucao-login"
                    data-lpignore="true"
                    data-1p-ignore
                  />
                  <input
                    type="password"
                    value={senhaOperacao}
                    onChange={(e) => setSenhaOperacao(e.target.value)}
                    placeholder="Senha"
                    className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900"
                    autoComplete="new-password"
                    name="operador-devolucao-senha"
                    data-lpignore="true"
                    data-1p-ignore
                  />
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-5 h-fit">
                <p className="text-slate-300 font-bold">Resumo</p>
                <p className="text-4xl font-black mt-2">
                  {formatarMoeda(totalVendaDevolucao())}
                </p>

                <div className="mt-5 space-y-3 text-sm">
                  <p>
                    <strong>Estoque:</strong> os itens voltam para o estoque.
                  </p>
                  <p>
                    <strong>Caixa:</strong>{" "}
                    {tipoDevolucao === "estorno"
                      ? "sairá como estorno/sangria."
                      : "não sai dinheiro; gera crédito para cliente."}
                  </p>
                  <p>
                    <strong>Venda:</strong> será marcada como devolvida.
                  </p>
                </div>

                <button
                  onClick={devolverVenda}
                  disabled={processandoDevolucao}
                  className={`w-full mt-6 px-6 py-4 rounded-2xl font-black text-white ${
                    processandoDevolucao
                      ? "bg-slate-500 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {processandoDevolucao
                    ? "Processando..."
                    : "Confirmar Devolução"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[65] p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Dados da Entrega
                </h2>
                <p className="text-slate-500">
                  Preencha as informações que sairão no romaneio de entrega.
                </p>
              </div>

              <button
                onClick={() => setModalDelivery(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border border-orange-200 bg-orange-50 rounded-2xl p-4">
                <label className="flex items-center gap-3 font-black text-orange-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarDadosClienteEntrega}
                    onChange={(e) => {
                      setUsarDadosClienteEntrega(e.target.checked);

                      if (e.target.checked) {
                        preencherDeliveryComDadosCliente();
                      }
                    }}
                    className="h-4 w-4"
                  />
                  Usar dados do cliente no romaneio
                </label>

                <p className="text-sm text-orange-800 mt-2">
                  Cliente selecionado: <strong>{clienteSelecionado()}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CampoDelivery titulo="Telefone / WhatsApp">
                  <input
                    value={telefoneEntrega}
                    onChange={(e) => setTelefoneEntrega(e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    className="input-delivery"
                  />
                </CampoDelivery>

                <CampoDelivery titulo="Taxa de Entrega">
                  <input
                    value={taxaEntrega}
                    onChange={(e) => setTaxaEntrega(e.target.value)}
                    placeholder="0,00"
                    className="input-delivery"
                  />
                </CampoDelivery>

                <CampoDelivery titulo="Endereço" className="md:col-span-2">
                  <input
                    value={enderecoEntrega}
                    onChange={(e) => setEnderecoEntrega(e.target.value)}
                    placeholder="Rua, avenida, travessa..."
                    className="input-delivery"
                  />
                </CampoDelivery>

                <CampoDelivery titulo="Número">
                  <input
                    value={numeroEntrega}
                    onChange={(e) => setNumeroEntrega(e.target.value)}
                    placeholder="Número"
                    className="input-delivery"
                  />
                </CampoDelivery>

                <CampoDelivery titulo="Bairro">
                  <input
                    value={bairroEntrega}
                    onChange={(e) => setBairroEntrega(e.target.value)}
                    placeholder="Bairro"
                    className="input-delivery"
                  />
                </CampoDelivery>

                <CampoDelivery titulo="Referência" className="md:col-span-2">
                  <input
                    value={referenciaEntrega}
                    onChange={(e) => setReferenciaEntrega(e.target.value)}
                    placeholder="Ponto de referência"
                    className="input-delivery"
                  />
                </CampoDelivery>

                <CampoDelivery titulo="Entregador" className="md:col-span-2">
                  <input
                    value={entregador}
                    onChange={(e) => setEntregador(e.target.value)}
                    placeholder="Nome do entregador"
                    className="input-delivery"
                  />
                </CampoDelivery>

                <CampoDelivery
                  titulo="Observação da Entrega"
                  className="md:col-span-2"
                >
                  <textarea
                    value={observacaoEntrega}
                    onChange={(e) => setObservacaoEntrega(e.target.value)}
                    placeholder="Ex.: entregar pelo portão lateral, cuidado com troco, observações do pedido..."
                    className="input-delivery min-h-24"
                  />
                </CampoDelivery>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-5">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Subtotal</span>
                  <strong>{formatarMoeda(totalBruto())}</strong>
                </div>

                <div className="flex justify-between text-sm text-slate-300 mt-1">
                  <span>Desconto</span>
                  <strong>{formatarMoeda(valorDescontoTotal())}</strong>
                </div>

                <div className="flex justify-between text-sm text-orange-300 mt-1">
                  <span>Taxa de Entrega</span>
                  <strong>{formatarMoeda(converterNumero(taxaEntrega))}</strong>
                </div>

                <div className="flex justify-between text-2xl font-black mt-3 border-t border-slate-700 pt-3">
                  <span>Total</span>
                  <span>{formatarMoeda(totalFinal())}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-3">
              <button
                onClick={() => setModalDelivery(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-xl font-black"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  if (!telefoneEntrega.trim()) {
                    alert("Informe o telefone/WhatsApp da entrega.");
                    return;
                  }

                  if (!enderecoEntrega.trim()) {
                    alert("Informe o endereço da entrega.");
                    return;
                  }

                  if (!bairroEntrega.trim()) {
                    alert("Informe o bairro da entrega.");
                    return;
                  }

                  setModalDelivery(false);
                  setModalPagamento(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-black"
              >
                Continuar para Pagamento
              </button>
            </div>

            <style jsx global>{`
              .input-delivery {
                width: 100%;
                border: 1px solid rgb(254 215 170);
                border-radius: 0.75rem;
                padding: 0.75rem;
                color: rgb(15 23 42);
                outline: none;
              }

              .input-delivery:focus {
                border-color: rgb(249 115 22);
                box-shadow: 0 0 0 3px rgb(249 115 22 / 0.12);
              }
            `}</style>
          </div>
        </div>
      )}

      {modalPagamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl max-h-[96vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Pagamento da Venda
                </h2>
                <p className="text-slate-500 text-sm">
                  Informe os pagamentos em tabela, aplique arredondamento e
                  finalize.
                </p>
              </div>

              <button
                onClick={() => setModalPagamento(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-8 space-y-3">
                {ehDelivery && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                    <p className="font-black text-orange-900">Venda Delivery</p>
                    <p className="text-sm text-orange-800 mt-1">
                      Cupom e romaneio de entrega serão impressos.
                    </p>
                    <p className="text-sm text-orange-800">
                      Entrega: {enderecoEntrega || "-"},{" "}
                      {numeroEntrega || "S/N"} - {bairroEntrega || "-"}
                    </p>
                    <p className="text-sm text-orange-800 font-bold mt-1">
                      Taxa de Entrega:{" "}
                      {formatarMoeda(converterNumero(taxaEntrega))}
                    </p>
                  </div>
                )}

                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                  <h3 className="font-black text-slate-900 mb-2">
                    Descontos da Venda
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-slate-700">
                        Desconto R$
                      </label>
                      <input
                        value={descontoValor}
                        onChange={(e) => atualizarDescontoValor(e.target.value)}
                        className="w-full border border-slate-300 p-2 rounded-xl text-slate-900 font-black text-right"
                        placeholder="0,00"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-700">
                        Desconto %
                      </label>
                      <input
                        value={descontoPercentual}
                        onChange={(e) =>
                          atualizarDescontoPercentual(e.target.value)
                        }
                        className="w-full border border-slate-300 p-2 rounded-xl text-slate-900 font-black text-right"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="bg-slate-900 text-white px-4 py-3">
                    <h3 className="font-black">Formas de Pagamento</h3>
                    <p className="text-[11px] text-slate-300">
                      Clique em uma forma para preencher automaticamente o valor
                      restante. Pagamento misto continua funcionando.
                    </p>
                  </div>

                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      [
                        "💵",
                        "Dinheiro",
                        pagDinheiro,
                        setPagDinheiro,
                        "Recebimento em espécie",
                      ],
                      ["📱", "PIX", pagPix, setPagPix, "Pagamento instantâneo"],
                      [
                        "💳",
                        "Débito",
                        pagDebito,
                        setPagDebito,
                        "Cartão de débito",
                      ],
                      [
                        "💳",
                        "Crédito",
                        pagCredito,
                        setPagCredito,
                        "Cartão de crédito",
                      ],
                      [
                        "📝",
                        "Crediário",
                        pagCrediario,
                        setPagCrediario,
                        "Venda fiado / parcelada",
                      ],
                    ].map(([icone, label, value, setter, obs]: any) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/40 transition"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div>
                            <p className="font-black text-slate-900">
                              {icone} {label}
                            </p>
                            <p className="text-xs text-slate-500">{obs}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => preencherPagamentoRestante(setter)}
                            className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-black text-xs"
                          >
                            Restante
                          </button>
                        </div>

                        <input
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 text-right font-black text-lg"
                          placeholder="0,00"
                        />
                      </div>
                    ))}

                    {valorCreditoUtilizado() > 0 && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 md:col-span-2">
                        <p className="font-black text-emerald-800">
                          ✅ Crédito do Cliente
                        </p>
                        <p className="text-2xl font-black text-emerald-700">
                          {formatarMoeda(valorCreditoUtilizado())}
                        </p>
                        <p className="text-xs text-emerald-700">
                          Abatimento automático do saldo do cliente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-blue-200 rounded-2xl p-3 bg-blue-50">
                  <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                    <div className="flex-1">
                      <p className="font-black text-blue-900">Arredondamento</p>
                      <p className="text-xs text-blue-700">
                        Use para ajustar centavos para mais ou para menos. Ex.:
                        R$ 5,50 pode virar R$ 5,00 ou R$ 6,00.
                      </p>
                    </div>

                    <div className="w-full lg:w-52">
                      <label className="text-sm font-bold text-blue-900">
                        Valor +/-
                      </label>
                      <input
                        value={arredondamentoVenda}
                        onChange={(e) => setArredondamentoVenda(e.target.value)}
                        className="w-full border border-blue-300 p-2 rounded-xl text-slate-900 text-right font-black"
                        placeholder="0,00"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        configuracoesSistema.permitir_arredondamento_operador
                          ? aplicarArredondamento("baixo")
                          : alert(
                              "Arredondamento bloqueado nas Configurações Gerais.",
                            )
                      }
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl font-black text-sm"
                    >
                      Arred. para Menos
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        configuracoesSistema.permitir_arredondamento_operador
                          ? aplicarArredondamento("cima")
                          : alert(
                              "Arredondamento bloqueado nas Configurações Gerais.",
                            )
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl font-black text-sm"
                    >
                      Arred. para Mais
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        configuracoesSistema.permitir_arredondamento_operador
                          ? limparArredondamento()
                          : alert(
                              "Arredondamento bloqueado nas Configurações Gerais.",
                            )
                      }
                      className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-3 py-2 rounded-xl font-black text-sm"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {converterNumero(pagPix) > 0 && (
                  <div className="space-y-3 border border-emerald-200 rounded-2xl p-4 bg-emerald-50">
                    <p className="font-black text-emerald-800">PIX</p>
                    <p className="text-sm text-emerald-700">
                      Informe apenas o valor recebido no PIX. O sistema não gera
                      mais QR Code nesta tela.
                    </p>
                  </div>
                )}

                {converterNumero(pagCrediario) > 0 && (
                  <div className="space-y-3 border border-blue-200 rounded-2xl p-4 bg-blue-50">
                    <p className="font-black text-blue-800">
                      Crediário da Loja
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={parcelas}
                        onChange={(e) => setParcelas(e.target.value)}
                        placeholder="Quantidade de parcelas"
                        className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
                      />

                      <input
                        type="date"
                        value={primeiroVencimento}
                        onChange={(e) => setPrimeiroVencimento(e.target.value)}
                        className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
                      />

                      <input
                        value={diasEntreParcelas}
                        onChange={(e) => setDiasEntreParcelas(e.target.value)}
                        placeholder="Dias entre parcelas. Ex.: 30"
                        className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
                      />

                      <div className="bg-white rounded-xl border border-blue-200 p-3 text-sm text-blue-800">
                        As próximas parcelas serão calculadas automaticamente
                        pelo intervalo de dias.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="xl:col-span-4 space-y-3">
                <div className="bg-slate-900 text-white rounded-2xl p-4">
                  <p className="text-xs text-slate-300 font-bold">
                    TOTAL DA VENDA
                  </p>
                  <p className="text-3xl font-black leading-tight">
                    {formatarMoeda(totalFinal())}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal:</span>
                    <strong>{formatarMoeda(totalBruto())}</strong>
                  </div>

                  <div className="flex justify-between text-slate-700">
                    <span>Desconto:</span>
                    <strong>{formatarMoeda(valorDescontoTotal())}</strong>
                  </div>

                  {ehDelivery && (
                    <div className="flex justify-between text-orange-700">
                      <span>Taxa entrega:</span>
                      <strong>
                        {formatarMoeda(converterNumero(taxaEntrega))}
                      </strong>
                    </div>
                  )}

                  <div
                    className={`flex justify-between ${valorArredondamento() < 0 ? "text-orange-700" : valorArredondamento() > 0 ? "text-green-700" : "text-slate-700"}`}
                  >
                    <span>Arredondamento:</span>
                    <strong>{formatarMoeda(valorArredondamento())}</strong>
                  </div>

                  {valorCreditoUtilizado() > 0 && (
                    <>
                      <div className="border-t pt-2 flex justify-between text-slate-700">
                        <span>Total antes do crédito:</span>
                        <strong>
                          {formatarMoeda(totalFinalAntesCredito())}
                        </strong>
                      </div>

                      <div className="flex justify-between text-emerald-700">
                        <span>Crédito do cliente:</span>
                        <strong>
                          - {formatarMoeda(valorCreditoUtilizado())}
                        </strong>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-2 flex justify-between text-slate-900">
                    <span>Total final:</span>
                    <strong>{formatarMoeda(totalFinal())}</strong>
                  </div>

                  <div className="flex justify-between text-slate-700">
                    <span>Total Pago:</span>
                    <strong>{formatarMoeda(totalPago())}</strong>
                  </div>

                  <div className="flex justify-between text-red-700">
                    <span>Falta:</span>
                    <strong>{formatarMoeda(faltaPagar())}</strong>
                  </div>
                </div>

                <div className="bg-green-600 text-white rounded-2xl p-4">
                  <p className="text-xs text-green-100 font-bold">TROCO</p>
                  <p className="text-3xl font-black leading-tight">
                    {formatarMoeda(troco())}
                  </p>
                </div>

                <button
                  onClick={async () => {
                    await finalizarVenda();
                    setModalPagamento(false);
                  }}
                  disabled={finalizandoVenda}
                  className={`w-full px-5 py-3 rounded-2xl font-black text-base text-white ${
                    finalizandoVenda
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {finalizandoVenda ? "Finalizando..." : "Confirmar Venda - F8"}
                </button>

                <button
                  onClick={() => setModalPagamento(false)}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black"
                >
                  Cancelar / Voltar - ESC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalProdutos && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-5xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Consulta Rápida de Produto - F2
            </h2>

            <input
              value={pesquisaProduto}
              onChange={(e) => setPesquisaProduto(e.target.value)}
              placeholder="Digite nome, código interno ou código de barras"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-4"
              autoFocus
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {produtosFiltrados.map((produto) => (
                <button
                  key={produto.id}
                  onClick={() => adicionarProduto(produto)}
                  className="border rounded-xl p-3 flex items-center gap-3 hover:bg-blue-50 text-left"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {produto.foto_url ? (
                      <img
                        src={produto.foto_url}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Sem foto</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-slate-900">
                      {produto.codigo} - {produto.nome}
                    </p>
                    <p className="text-sm text-slate-600">
                      Estoque: {produto.qtd_atual}
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      {formatarMoeda(Number(produto.preco_venda || 0))}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setModalProdutos(false)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPesquisarCliente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Pesquisar Cliente
            </h2>

            <input
              value={pesquisaCliente}
              onChange={(e) => setPesquisaCliente(e.target.value)}
              placeholder="Buscar por nome, CPF/CNPJ ou WhatsApp"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-4"
              autoFocus
            />

            <table className="w-full">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">CPF/CNPJ</th>
                  <th className="p-3 text-left">WhatsApp</th>
                  <th className="p-2 text-center">Ação</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="border-b">
                    <td className="p-3 text-slate-900">{cliente.nome}</td>
                    <td className="p-2 text-slate-800">
                      {cliente.cpf_cnpj || "-"}
                    </td>
                    <td className="p-2 text-slate-800">
                      {cliente.whatsapp || "-"}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => selecionarCliente(cliente)}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded"
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}

                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-700">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalPesquisarCliente(false)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg"
              >
                Fechar
              </button>

              <button
                onClick={() => {
                  setModalPesquisarCliente(false);
                  setNovoClienteDocumento(pesquisaCliente);
                  setModalNovoCliente(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
              >
                + Cadastrar por CPF/CNPJ
              </button>
            </div>
          </div>
        </div>
      )}

      {modalNovoCliente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Novo Cliente
            </h2>

            <input
              value={novoClienteDocumento}
              onChange={(e) => setNovoClienteDocumento(e.target.value)}
              placeholder="CPF / CNPJ"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3"
              autoFocus
            />

            <input
              value={novoClienteNome}
              onChange={(e) => setNovoClienteNome(e.target.value)}
              placeholder="Nome do Cliente"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3"
            />

            <input
              value={novoClienteWhatsapp}
              onChange={(e) => setNovoClienteWhatsapp(e.target.value)}
              placeholder="WhatsApp"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalNovoCliente(false)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={salvarNovoCliente}
                className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbrirCaixa && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Abrir Caixa
            </h2>

            <input
              value={operadorCaixa}
              onChange={(e) => setOperadorCaixa(e.target.value)}
              placeholder="Operador"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                value={loginOperacao}
                onChange={(e) => setLoginOperacao(e.target.value)}
                placeholder="Usuário ou e-mail"
                className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
                autoComplete="off"
                name="operador-abertura-login"
                data-lpignore="true"
                data-1p-ignore
              />

              <input
                type="password"
                value={senhaOperacao}
                onChange={(e) => setSenhaOperacao(e.target.value)}
                placeholder="Senha"
                className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
                autoComplete="new-password"
                name="operador-abertura-senha"
                data-lpignore="true"
                data-1p-ignore
              />
            </div>

            <input
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
              placeholder="Valor de abertura"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3"
            />

            <input
              value={observacaoCaixa}
              onChange={(e) => setObservacaoCaixa(e.target.value)}
              placeholder="Observação"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalAbrirCaixa(false);
                  limparAutorizacaoOperacao();
                }}
                className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={abrirCaixa}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
              >
                Abrir Caixa
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMovimentoCaixa && caixaAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {tipoMovimentoCaixa === "sangria"
                ? "Registrar Sangria"
                : "Registrar Suprimento"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                value={loginOperacao}
                onChange={(e) => setLoginOperacao(e.target.value)}
                placeholder="Usuário ou e-mail"
                className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
                autoComplete="off"
                name="operador-movimento-login"
                data-lpignore="true"
                data-1p-ignore
              />

              <input
                type="password"
                value={senhaOperacao}
                onChange={(e) => setSenhaOperacao(e.target.value)}
                placeholder="Senha"
                className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
                autoComplete="new-password"
                name="operador-movimento-senha"
                data-lpignore="true"
                data-1p-ignore
              />
            </div>

            <input
              value={valorMovimentoCaixa}
              onChange={(e) => setValorMovimentoCaixa(e.target.value)}
              placeholder="Valor"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3"
            />

            <input
              value={descricaoMovimentoCaixa}
              onChange={(e) => setDescricaoMovimentoCaixa(e.target.value)}
              placeholder="Descrição"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalMovimentoCaixa(false);
                  limparAutorizacaoOperacao();
                }}
                className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={registrarMovimentoCaixa}
                className={`text-white px-5 py-2 rounded-lg ${tipoMovimentoCaixa === "sangria" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalFecharCaixa && caixaAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Fechamento Inteligente de Caixa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
              {[
                ["Dinheiro", saldoEsperado(), fechDinheiro, setFechDinheiro],
                ["PIX", totalPorForma("pix"), fechPix, setFechPix],
                ["Débito", totalPorForma("debito"), fechDebito, setFechDebito],
                [
                  "Crédito",
                  totalPorForma("credito"),
                  fechCredito,
                  setFechCredito,
                ],
                [
                  "Crediário",
                  totalPorForma("crediario"),
                  fechCrediario,
                  setFechCrediario,
                ],
              ].map(([label, sistema, informado, setter]: any) => (
                <div key={label} className="border rounded-xl p-3 bg-slate-50">
                  <p className="font-bold text-slate-900">{label}</p>
                  <p className="text-sm text-slate-600">
                    Sistema: {formatarMoeda(Number(sistema))}
                  </p>
                  <input
                    value={informado}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full border p-2 mt-2 rounded text-slate-900"
                  />
                </div>
              ))}
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-5 mb-4">
              <div className="flex justify-between text-lg">
                <span>Total Informado:</span>
                <strong>{formatarMoeda(totalInformadoFechamento())}</strong>
              </div>

              <div
                className={`flex justify-between text-2xl font-bold mt-3 ${
                  diferencaFechamento() === 0
                    ? "text-green-400"
                    : diferencaFechamento() < 0
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                <span>Diferença:</span>
                <span>{formatarMoeda(diferencaFechamento())}</span>
              </div>
            </div>

            <input
              value={observacaoCaixa}
              onChange={(e) => setObservacaoCaixa(e.target.value)}
              placeholder="Observação do fechamento"
              className="w-full border border-slate-300 p-3 rounded-lg text-slate-900"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalFecharCaixa(false)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={fecharCaixa}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
              >
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CampoDelivery({
  titulo,
  children,
  className = "",
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-black text-slate-700 mb-2">
        {titulo}
      </label>

      {children}
    </div>
  );
}

function Atalho({ tecla, descricao }: { tecla: string; descricao: string }) {
  return (
    <div className="flex items-center gap-4 border border-slate-200 rounded-2xl p-4 bg-slate-50">
      <div className="min-w-24 text-center bg-slate-900 text-white rounded-xl px-3 py-2 font-black">
        {tecla}
      </div>

      <p className="text-slate-800 font-bold">{descricao}</p>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border">
      <p className="text-sm text-slate-500">{titulo}</p>
      <h3 className={`text-2xl font-bold ${cor}`}>{valor}</h3>
    </div>
  );
}
