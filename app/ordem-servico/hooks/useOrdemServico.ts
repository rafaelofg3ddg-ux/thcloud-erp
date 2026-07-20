"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import { carregarEmpresaPDF, htmlLogoEmpresa } from "../../../lib/empresaPdf";

export type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  whatsapp: string | null;
};

export type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
  preco_venda: number;
  qtd_atual: number;
};

export type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number;
  garantia_dias?: number | null;
};

export type EquipamentoCliente = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  segmento: string | null;
  segmento_nome: string | null;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  imei_1: string | null;
  imei_2: string | null;
  placa: string | null;
  chassi: string | null;
  ano: string | null;
  km_atual: string | null;
  btus: string | null;
  gas: string | null;
  voltagem: string | null;
  dados_segmento: Record<string, unknown> | null;
  garantia_ate: string | null;
  observacoes: string | null;
};

export type OrdemServico = {
  id: string;
  empresa_id: string;
  numero_os: number;
  cliente_id: string | null;
  equipamento_id?: string | null;
  equipamento_nome?: string | null;
  segmento?: string | null;
  segmento_nome?: string | null;
  dados_segmento?: Record<string, unknown> | null;
  tipo_equipamento: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  assistencia_celular: boolean;
  imei_1: string | null;
  imei_2: string | null;
  defeito_relatado: string | null;
  diagnostico: string | null;
  solucao: string | null;
  status: string;
  prioridade: string;
  valor_produtos: number;
  valor_servicos: number;
  desconto: number;
  valor_total: number;
  garantia_dias: number;
  data_entrada: string | null;
  data_previsao: string | null;
  usuario: string | null;
  observacao: string | null;
  clientes?: Cliente | null;
  equipamentos_cliente?: EquipamentoCliente | null;
};

export type ItemProduto = {
  produto_id: string | null;
  codigo: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  baixar_estoque: boolean;
};

export type ItemServico = {
  servico_id: string | null;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
};


export type ChecklistOSItem = {
  chave: string;
  label: string;
};

export type FotoOS = {
  tipo: string;
  url: string;
  descricao: string;
};

const CHECKLIST_OS: Record<string, ChecklistOSItem[]> = {
  geral: [
    { chave: "liga", label: "Liga" },
    { chave: "carrega", label: "Carrega" },
    { chave: "sem_quebras", label: "Sem quebras aparentes" },
    { chave: "acessorios_conferidos", label: "Acessórios conferidos" },
    { chave: "defeito_confirmado", label: "Defeito confirmado" },
    { chave: "cliente_ciente", label: "Cliente ciente das condições" },
  ],
  loja_celular: [
    { chave: "liga", label: "Liga" },
    { chave: "carrega", label: "Carrega" },
    { chave: "tela", label: "Tela" },
    { chave: "touch", label: "Touch" },
    { chave: "face_id", label: "Face ID / Biometria" },
    { chave: "botoes", label: "Botões" },
    { chave: "alto_falante", label: "Alto-falante" },
    { chave: "microfone", label: "Microfone" },
    { chave: "camera_frontal", label: "Câmera frontal" },
    { chave: "camera_traseira", label: "Câmera traseira" },
    { chave: "wifi", label: "Wi-Fi" },
    { chave: "bluetooth", label: "Bluetooth" },
    { chave: "chip", label: "Chip / Rede" },
    { chave: "oxidacao", label: "Sinais de oxidação" },
  ],
  notebook: [
    { chave: "liga", label: "Liga" },
    { chave: "carregador", label: "Carregador" },
    { chave: "tela", label: "Tela" },
    { chave: "teclado", label: "Teclado" },
    { chave: "touchpad", label: "Touchpad" },
    { chave: "hd_ssd", label: "HD / SSD" },
    { chave: "memoria", label: "Memória" },
    { chave: "bateria", label: "Bateria" },
  ],
  tv: [
    { chave: "liga", label: "Liga" },
    { chave: "controle", label: "Controle remoto" },
    { chave: "tela", label: "Tela" },
    { chave: "painel", label: "Painel" },
    { chave: "fonte", label: "Fonte" },
    { chave: "som", label: "Som" },
    { chave: "entradas", label: "Entradas HDMI/USB" },
  ],
};

function listaChecklistPorSegmento(segmento: string) {
  const chave = String(segmento || "geral").toLowerCase();
  if (CHECKLIST_OS[chave]) return CHECKLIST_OS[chave];
  if (chave.includes("celular") || chave.includes("phone")) return CHECKLIST_OS.loja_celular;
  if (chave.includes("note") || chave.includes("comput")) return CHECKLIST_OS.notebook;
  if (chave.includes("tv") || chave.includes("televis")) return CHECKLIST_OS.tv;
  return CHECKLIST_OS.geral;
}

function objetoTextoBooleano(valor: unknown): Record<string, boolean> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  return valor as Record<string, boolean>;
}

function listaFotosOS(valor: unknown): FotoOS[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const foto = item as Partial<FotoOS>;
      return {
        tipo: String(foto.tipo || "ANTES"),
        url: String(foto.url || ""),
        descricao: String(foto.descricao || ""),
      };
    })
    .filter((foto) => foto.url.trim());
}

export type OrdemServicoItemBanco = {
  id: string;
  empresa_id: string;
  ordem_servico_id: string;
  tipo: string;
  produto_id: string | null;
  servico_id: string | null;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  subtotal: number;
  baixar_estoque: boolean;
  garantia_dias: number;
};

export type HistoricoOrdemServico = {
  id: string;
  empresa_id: string;
  ordem_servico_id: string;
  status_anterior: string | null;
  status_novo: string | null;
  acao: string | null;
  descricao: string | null;
  usuario: string | null;
  created_at: string | null;
};


type EmpresaDadosOS = {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  logo_url: string;
};


export const statusOptions = [
  "aberta",
  "em_analise",
  "aguardando_aprovacao",
  "aprovada",
  "aguardando_peca",
  "em_execucao",
  "concluida",
  "entregue",
  "cancelada",
];

function valorTexto(valor: unknown) {
  return typeof valor === "string" ? valor : "";
}

function valorBooleano(valor: unknown) {
  return valor === true;
}

function pareceIdInterno(valor: unknown) {
  const texto = String(valor || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(texto);
}

function labelDadoEquipamento(chave: string) {
  const labels: Record<string, string> = {
    imei1: "IMEI 1",
    imei_1: "IMEI 1",
    imei2: "IMEI 2",
    imei_2: "IMEI 2",
    numero_serie: "Número de série",
    serie: "Número de série",
    cor: "Cor",
    liga: "Liga",
    carrega: "Carrega",
    tela_quebrada: "Tela quebrada",
    senha: "Senha",
    padrao: "Padrão",
    acessorios: "Acessórios",
    placa: "Placa",
    chassi: "Chassi",
    ano: "Ano",
    km_atual: "KM atual",
    btus: "BTUs",
    gas: "Gás",
    voltagem: "Voltagem",
    memoria: "Memória",
    capacidade: "Capacidade",
  };

  return labels[chave] || chave.replaceAll("_", " ");
}

function valorDadoEquipamento(valor: unknown) {
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  return String(valor ?? "").trim();
}

function deveMostrarDadoEquipamento(chave: string, valor: unknown) {
  const key = chave.toLowerCase();
  const texto = String(valor ?? "").trim();

  if (!texto || valor === false || valor === null || valor === undefined) return false;
  if (pareceIdInterno(valor)) return false;
  if (texto.length > 60) return false;

  const bloqueados = [
    "id",
    "uuid",
    "empresa",
    "cliente",
    "venda",
    "item_venda",
    "produto_id",
    "produto_imei",
    "ordem",
    "origem",
    "created",
    "updated",
  ];

  if (bloqueados.some((termo) => key === termo || key.includes(termo))) return false;

  const permitidos = [
    "imei1",
    "imei_1",
    "imei2",
    "imei_2",
    "numero_serie",
    "serie",
    "cor",
    "liga",
    "carrega",
    "tela_quebrada",
    "senha",
    "padrao",
    "acessorios",
    "placa",
    "chassi",
    "ano",
    "km_atual",
    "btus",
    "gas",
    "voltagem",
    "memoria",
    "capacidade",
  ];

  return permitidos.includes(key);
}

export function useOrdemServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [equipamentosCliente, setEquipamentosCliente] = useState<EquipamentoCliente[]>([]);

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gerandoOrcamento, setGerandoOrcamento] = useState<string | null>(null);
  const [enviandoPdv, setEnviandoPdv] = useState<string | null>(null);
  const [ordemEditando, setOrdemEditando] = useState<OrdemServico | null>(null);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [ordemHistorico, setOrdemHistorico] = useState<OrdemServico | null>(null);
  const [historicoOS, setHistoricoOS] = useState<HistoricoOrdemServico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  const [segmentoEmpresa, setSegmentoEmpresa] = useState("geral");
  const [segmentoNome, setSegmentoNome] = useState("Geral");
  const [dadosSegmento, setDadosSegmento] = useState<Record<string, unknown>>({});

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [modalNova, setModalNova] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [clientePesquisa, setClientePesquisa] = useState("");

  const [equipamentoId, setEquipamentoId] = useState("");
  const [equipamentoNome, setEquipamentoNome] = useState("");
  const [equipamentoBusca, setEquipamentoBusca] = useState("");

  const [tipoEquipamento, setTipoEquipamento] = useState("Equipamento");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");

  const [defeitoRelatado, setDefeitoRelatado] = useState("");
  const [acessoriosDeixados, setAcessoriosDeixados] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [solucao, setSolucao] = useState("");
  const [observacoesTecnicas, setObservacoesTecnicas] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  const [status, setStatus] = useState("aberta");
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [garantiaDias, setGarantiaDias] = useState("90");
  const [desconto, setDesconto] = useState("0");
  const [observacao, setObservacao] = useState("");

  const [produtoBusca, setProdutoBusca] = useState("");
  const [servicoBusca, setServicoBusca] = useState("");
  const [itensProdutos, setItensProdutos] = useState<ItemProduto[]>([]);
  const [itensServicos, setItensServicos] = useState<ItemServico[]>([]);

  function checklistAtual() {
    return listaChecklistPorSegmento(segmentoEmpresa);
  }

  function checklistValores() {
    return objetoTextoBooleano(dadosSegmento.checklist_os);
  }

  function checklistMarcado(chave: string) {
    return Boolean(checklistValores()[chave]);
  }

  function setChecklistMarcado(chave: string, marcado: boolean) {
    setDadosSegmento((atual) => ({
      ...atual,
      checklist_os: {
        ...objetoTextoBooleano(atual.checklist_os),
        [chave]: marcado,
      },
    }));
  }

  function fotosOS() {
    return listaFotosOS(dadosSegmento.fotos_os);
  }

  function adicionarFotoOS(foto: FotoOS) {
    const url = foto.url.trim();
    if (!url) {
      alert("Informe o link da foto.");
      return;
    }

    setDadosSegmento((atual) => ({
      ...atual,
      fotos_os: [
        ...listaFotosOS(atual.fotos_os),
        {
          tipo: foto.tipo || "ANTES",
          url,
          descricao: foto.descricao.trim(),
        },
      ],
    }));
  }

  function removerFotoOS(index: number) {
    setDadosSegmento((atual) => ({
      ...atual,
      fotos_os: listaFotosOS(atual.fotos_os).filter((_, indice) => indice !== index),
    }));
  }

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



  async function empresaDadosOS(): Promise<EmpresaDadosOS> {
    return carregarEmpresaPDF();
  }

  const TERMO_GARANTIA_PADRAO =
    "A garantia cobre somente o serviço executado e/ou peças substituídas descritas na Ordem de Serviço. Não cobre mau uso, queda, oxidação, violação, tentativa de reparo por terceiros, descarga elétrica, danos físicos, instalação indevida ou defeitos diferentes dos informados nesta OS.";

  const TERMO_ENTREGA_PADRAO =
    "Declaro que recebi o equipamento acima identificado, conferi as condições de entrega e estou ciente dos serviços executados, valores e condições de garantia informados pela empresa.";

  async function carregarTermosOS() {
    const empresaId = empresaAtualId();

    if (!empresaId) {
      return {
        condicoesGarantia: TERMO_GARANTIA_PADRAO,
        declaracaoEntrega: TERMO_ENTREGA_PADRAO,
      };
    }

    try {
      const { data } = await supabase
        .from("configuracoes_gerais")
        .select("termo_garantia_condicoes, termo_entrega_declaracao")
        .eq("empresa_id", empresaId)
        .maybeSingle();

      return {
        condicoesGarantia: data?.termo_garantia_condicoes || TERMO_GARANTIA_PADRAO,
        declaracaoEntrega: data?.termo_entrega_declaracao || TERMO_ENTREGA_PADRAO,
      };
    } catch {
      return {
        condicoesGarantia: TERMO_GARANTIA_PADRAO,
        declaracaoEntrega: TERMO_ENTREGA_PADRAO,
      };
    }
  }

  function textoHtml(valor: unknown) {
    return String(valor ?? "-")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function dinheiro(valor: unknown) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor: unknown) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function dataBR(data: string | null | undefined) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function numOS(n: number | null | undefined) {
    return String(n || 0).padStart(6, "0");
  }

  function statusLabel(s: string) {
    const mapa: Record<string, string> = {
      recepcao: "Recepção",
      aberta: "Aberta",
      orcamento: "Orçamento",
      em_analise: "Em análise",
      aguardando_aprovacao: "Aguardando aprovação",
      aprovada: "Aprovada",
      em_execucao: "Em manutenção",
      aguardando_peca: "Aguardando peça",
      pronto: "Pronto para entrega",
      concluida: "Concluída",
      entregue: "Entregue",
      garantia: "Garantia",
      cancelada: "Cancelada",
    };

    return mapa[s] || s;
  }

  function statusClasse(s: string) {
    const mapa: Record<string, string> = {
      recepcao: "bg-cyan-100 text-cyan-700",
      aberta: "bg-blue-100 text-blue-700",
      orcamento: "bg-teal-100 text-teal-700",
      em_analise: "bg-purple-100 text-purple-700",
      aguardando_aprovacao: "bg-yellow-100 text-yellow-700",
      aprovada: "bg-emerald-100 text-emerald-700",
      em_execucao: "bg-indigo-100 text-indigo-700",
      aguardando_peca: "bg-orange-100 text-orange-700",
      pronto: "bg-lime-100 text-lime-700",
      concluida: "bg-green-100 text-green-700",
      entregue: "bg-slate-100 text-slate-700",
      garantia: "bg-pink-100 text-pink-700",
      cancelada: "bg-red-100 text-red-700",
    };

    return mapa[s] || "bg-slate-100 text-slate-700";
  }

  function nomeEquipamento(equipamento: EquipamentoCliente) {
    const nome =
      `${equipamento.tipo || ""} ${equipamento.marca || ""} ${
        equipamento.modelo || ""
      }`.trim() || "Equipamento";

    if (equipamento.imei_1) return `${nome} - IMEI ${equipamento.imei_1}`;
    if (equipamento.placa) return `${nome} - Placa ${equipamento.placa}`;
    if (equipamento.numero_serie) return `${nome} - Série ${equipamento.numero_serie}`;

    return nome;
  }

  function limpar() {
    setOrdemEditando(null);
    setClienteId("");
    setClientePesquisa("");
    setEquipamentoId("");
    setEquipamentoNome("");
    setEquipamentoBusca("");
    setEquipamentosCliente([]);
    setTipoEquipamento("Equipamento");
    setMarca("");
    setModelo("");
    setNumeroSerie("");
    setDadosSegmento({});
    setDefeitoRelatado("");
    setAcessoriosDeixados("");
    setDiagnostico("");
    setSolucao("");
    setObservacoesTecnicas("");
    setPrioridade("normal");
    setStatus("aberta");
    setDataPrevisao("");
    setGarantiaDias("90");
    setDesconto("0");
    setObservacao("");
    setProdutoBusca("");
    setServicoBusca("");
    setItensProdutos([]);
    setItensServicos([]);
  }

  function abrirNovaOS() {
    limpar();
    setModalNova(true);
  }

  async function abrirEdicaoOS(ordem: OrdemServico) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    limpar();
    setOrdemEditando(ordem);
    setClienteId(ordem.cliente_id || "");
    setClientePesquisa(ordem.clientes?.nome || "");
    setEquipamentoId(ordem.equipamento_id || "");
    setEquipamentoNome(ordem.equipamento_nome || "");
    setEquipamentoBusca(ordem.equipamento_nome || "");
    setSegmentoEmpresa(ordem.segmento || "geral");
    setSegmentoNome(ordem.segmento_nome || "Geral");
    setDadosSegmento(ordem.dados_segmento || {});
    setTipoEquipamento(ordem.tipo_equipamento || "Equipamento");
    setMarca(ordem.marca || "");
    setModelo(ordem.modelo || "");
    setNumeroSerie(ordem.numero_serie || "");
    setDefeitoRelatado(ordem.defeito_relatado || "");
    setDiagnostico(ordem.diagnostico || "");
    setSolucao(ordem.solucao || "");
    setPrioridade(ordem.prioridade || "normal");
    setStatus(ordem.status || "aberta");
    setGarantiaDias(String(ordem.garantia_dias || 90));
    setDesconto(String(ordem.desconto || 0));
    setObservacao(ordem.observacao || "");

    if (ordem.cliente_id) await carregarEquipamentosDoCliente(ordem.cliente_id);

    const { data, error } = await supabase
      .from("ordem_servico_itens")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ordem_servico_id", ordem.id);

    if (error) {
      alert("Erro ao carregar itens da OS: " + error.message);
      return;
    }

    const itens = (data || []) as OrdemServicoItemBanco[];

    setItensProdutos(
      itens
        .filter((item) => item.tipo === "produto")
        .map((item) => ({
          produto_id: item.produto_id,
          codigo: item.codigo || "",
          nome: item.nome,
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.valor_unitario || 0),
          subtotal: Number(item.subtotal || 0),
          baixar_estoque: item.baixar_estoque,
        }))
    );

    setItensServicos(
      itens
        .filter((item) => item.tipo !== "produto")
        .map((item) => ({
          servico_id: item.servico_id,
          nome: item.nome,
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.valor_unitario || 0),
          subtotal: Number(item.subtotal || 0),
        }))
    );

    setModalNova(true);
  }

  async function carregarSegmentoEmpresa(empresaId: string) {
    const { data } = await supabase
      .from("empresas")
      .select("segmento,segmento_nome")
      .eq("id", empresaId)
      .maybeSingle();

    setSegmentoEmpresa(data?.segmento || "geral");
    setSegmentoNome(data?.segmento_nome || "Geral");
  }

  async function carregarEquipamentosDoCliente(clienteSelecionadoId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId || !clienteSelecionadoId) return;

    const { data, error } = await supabase
      .from("equipamentos_cliente")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("cliente_id", clienteSelecionadoId)
      .eq("status", "ativo")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar equipamentos do cliente: " + error.message);
      return;
    }

    setEquipamentosCliente((data || []) as EquipamentoCliente[]);
  }

  function selecionarEquipamento(equipamento: EquipamentoCliente) {
    const dados = equipamento.dados_segmento || {};
    const nome = nomeEquipamento(equipamento);

    setEquipamentoId(equipamento.id);
    setEquipamentoNome(nome);
    setEquipamentoBusca(nome);

    setSegmentoEmpresa(equipamento.segmento || segmentoEmpresa);
    setSegmentoNome(equipamento.segmento_nome || segmentoNome);

    setTipoEquipamento(equipamento.tipo || "Equipamento");
    setMarca(equipamento.marca || "");
    setModelo(equipamento.modelo || "");
    setNumeroSerie(equipamento.numero_serie || "");

    setDadosSegmento({
      ...dados,
      imei_1: equipamento.imei_1 || dados.imei_1 || "",
      imei_2: equipamento.imei_2 || dados.imei_2 || "",
      placa: equipamento.placa || dados.placa || "",
      chassi: equipamento.chassi || dados.chassi || "",
      ano: equipamento.ano || dados.ano || "",
      km_atual: equipamento.km_atual || dados.km_atual || "",
      btus: equipamento.btus || dados.btus || "",
      gas: equipamento.gas || dados.gas || "",
      voltagem: equipamento.voltagem || dados.voltagem || "",
      numero_serie: equipamento.numero_serie || dados.numero_serie || "",
      marca: equipamento.marca || dados.marca || "",
      modelo: equipamento.modelo || dados.modelo || "",
    });

    if (equipamento.garantia_ate) {
      const hoje = new Date();
      const garantia = new Date(equipamento.garantia_ate);

      if (garantia >= hoje) {
        setObservacao((atual) =>
          atual
            ? `${atual}\nEquipamento com garantia até ${garantia.toLocaleDateString("pt-BR")}.`
            : `Equipamento com garantia até ${garantia.toLocaleDateString("pt-BR")}.`
        );
      }
    }
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);
    await carregarSegmentoEmpresa(empresaId);

    const [osReq, cliReq, prodReq, servReq] = await Promise.all([
      supabase
        .from("ordens_servico")
        .select("*, clientes:cliente_id(id,nome,cpf_cnpj,whatsapp), equipamentos_cliente:equipamento_id(*)")
        .eq("empresa_id", empresaId)
        .order("numero_os", { ascending: false }),
      supabase
        .from("clientes")
        .select("id,nome,cpf_cnpj,whatsapp")
        .eq("empresa_id", empresaId)
        .order("nome"),
      supabase
        .from("produtos")
        .select("id,codigo,codigo_barras,nome,preco_venda,qtd_atual")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("servicos")
        .select("id,nome,descricao,valor,garantia_dias")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .order("nome"),
    ]);

    if (osReq.error) alert("Erro OS: " + osReq.error.message);
    if (cliReq.error) alert("Erro clientes: " + cliReq.error.message);
    if (prodReq.error) alert("Erro produtos: " + prodReq.error.message);
    if (servReq.error) alert("Erro serviços: " + servReq.error.message);

    setOrdens((osReq.data || []) as OrdemServico[]);
    setClientes(cliReq.data || []);
    setProdutos(prodReq.data || []);
    setServicos(servReq.data || []);
    setCarregando(false);
  }

  async function proximoNumeroOS() {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const { data, error } = await supabase.rpc("proximo_numero_os", {
      p_empresa_id: empresaId,
    });

    if (error) throw new Error(error.message);
    return Number(data || 1);
  }

  function totalProdutos() {
    return itensProdutos.reduce((total, item) => total + Number(item.subtotal || 0), 0);
  }

  function totalServicos() {
    return itensServicos.reduce((total, item) => total + Number(item.subtotal || 0), 0);
  }

  function totalOS() {
    return Math.max(totalProdutos() + totalServicos() - numero(desconto), 0);
  }

  function addProduto(produto: Produto) {
    setItensProdutos([
      ...itensProdutos,
      {
        produto_id: produto.id,
        codigo: produto.codigo || "",
        nome: produto.nome,
        quantidade: 1,
        valor_unitario: Number(produto.preco_venda || 0),
        subtotal: Number(produto.preco_venda || 0),
        baixar_estoque: true,
      },
    ]);

    setProdutoBusca("");
  }

  function addServico(servico: Servico) {
    setItensServicos([
      ...itensServicos,
      {
        servico_id: servico.id,
        nome: servico.nome,
        quantidade: 1,
        valor_unitario: Number(servico.valor || 0),
        subtotal: Number(servico.valor || 0),
      },
    ]);

    if (servico.garantia_dias && Number(servico.garantia_dias) > Number(garantiaDias || 0)) {
      setGarantiaDias(String(servico.garantia_dias));
    }

    setServicoBusca("");
  }

  function addServicoManual() {
    setItensServicos([
      ...itensServicos,
      {
        servico_id: null,
        nome: "Serviço manual",
        quantidade: 1,
        valor_unitario: 0,
        subtotal: 0,
      },
    ]);
  }

  function updProduto(index: number, campo: keyof ItemProduto, valor: string | number | boolean) {
    setItensProdutos(
      itensProdutos.map((item, i) => {
        if (i !== index) return item;

        const novo = {
          ...item,
          [campo]: campo === "baixar_estoque" ? Boolean(valor) : valor,
        };

        const qtd = Number(novo.quantidade || 0);
        const unit = numero(novo.valor_unitario);

        return {
          ...novo,
          quantidade: qtd,
          valor_unitario: unit,
          subtotal: qtd * unit,
        };
      })
    );
  }

  function updServico(index: number, campo: keyof ItemServico, valor: string | number) {
    setItensServicos(
      itensServicos.map((item, i) => {
        if (i !== index) return item;

        const novo = {
          ...item,
          [campo]: valor,
        };

        const qtd = Number(novo.quantidade || 0);
        const unit = numero(novo.valor_unitario);

        return {
          ...novo,
          quantidade: qtd,
          valor_unitario: unit,
          subtotal: qtd * unit,
        };
      })
    );
  }

  function removerProduto(index: number) {
    setItensProdutos(itensProdutos.filter((_, idx) => idx !== index));
  }

  function removerServico(index: number) {
    setItensServicos(itensServicos.filter((_, idx) => idx !== index));
  }

  async function salvarOS() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!clienteId) {
      alert("Selecione o cliente.");
      return;
    }

    if (!equipamentoId) {
      alert("Selecione um equipamento do cliente.");
      return;
    }

    if (!defeitoRelatado.trim()) {
      alert("Informe o defeito relatado.");
      return;
    }

    setSalvando(true);

    try {
      const isCelular = segmentoEmpresa === "loja_celular" || tipoEquipamento === "Celular";
      const payload = {
        empresa_id: empresaId,
        cliente_id: clienteId,
        equipamento_id: equipamentoId,
        equipamento_nome: equipamentoNome,
        segmento: segmentoEmpresa,
        segmento_nome: segmentoNome,
        dados_segmento: dadosSegmento,
        tipo_equipamento: tipoEquipamento || null,
        marca: marca || valorTexto(dadosSegmento.marca) || null,
        modelo: modelo || valorTexto(dadosSegmento.modelo) || null,
        numero_serie: numeroSerie || valorTexto(dadosSegmento.numero_serie) || null,
        assistencia_celular: isCelular,
        imei_1: isCelular ? valorTexto(dadosSegmento.imei_1) || null : null,
        imei_2: isCelular ? valorTexto(dadosSegmento.imei_2) || null : null,
        conta_google: isCelular ? valorTexto(dadosSegmento.conta_google) || null : null,
        senha_aparelho: isCelular ? valorTexto(dadosSegmento.senha_aparelho) || valorTexto(dadosSegmento.senha) || null : null,
        operadora: isCelular ? valorTexto(dadosSegmento.operadora) || null : null,
        cor: valorTexto(dadosSegmento.cor) || null,
        capacidade: isCelular ? valorTexto(dadosSegmento.capacidade) || null : null,
        tela_quebrada: isCelular ? valorBooleano(dadosSegmento.tela_quebrada) : false,
        molhado: isCelular ? valorBooleano(dadosSegmento.molhado) : false,
        liga: valorBooleano(dadosSegmento.liga),
        carrega: valorBooleano(dadosSegmento.carrega),
        observacoes_esteticas: valorTexto(dadosSegmento.observacoes_esteticas) || null,
        defeito_relatado: defeitoRelatado || null,
        diagnostico: diagnostico || null,
        solucao: solucao || null,
        observacoes_tecnicas: observacoesTecnicas || null,
        acessorios_deixados: acessoriosDeixados || null,
        status,
        prioridade,
        valor_produtos: totalProdutos(),
        valor_servicos: totalServicos(),
        desconto: numero(desconto),
        valor_total: totalOS(),
        garantia_dias: Number(garantiaDias || 90),
        data_previsao: dataPrevisao || null,
        usuario: operadorAtual(),
        observacao: observacao || null,
      };

      let ordemId = ordemEditando?.id || "";
      let numeroAtual = ordemEditando?.numero_os || 0;

      if (ordemEditando) {
        const { error } = await supabase
          .from("ordens_servico")
          .update(payload)
          .eq("empresa_id", empresaId)
          .eq("id", ordemEditando.id);

        if (error) throw new Error(error.message);

        await supabase
          .from("ordem_servico_itens")
          .delete()
          .eq("empresa_id", empresaId)
          .eq("ordem_servico_id", ordemEditando.id);
      } else {
        const numeroOS = await proximoNumeroOS();
        const { data, error } = await supabase
          .from("ordens_servico")
          .insert([{ ...payload, numero_os: numeroOS }])
          .select("id,numero_os")
          .single();

        if (error) throw new Error(error.message);
        ordemId = data.id;
        numeroAtual = data.numero_os;
      }

      const itensUnificados = [
        ...itensProdutos.map((item) => ({
          empresa_id: empresaId,
          ordem_servico_id: ordemId,
          tipo: "produto",
          produto_id: item.produto_id,
          servico_id: null,
          codigo: item.codigo || null,
          nome: item.nome,
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.valor_unitario || 0),
          subtotal: Number(item.subtotal || 0),
          baixar_estoque: item.baixar_estoque,
          garantia_dias: Number(garantiaDias || 0),
        })),
        ...itensServicos.map((item) => ({
          empresa_id: empresaId,
          ordem_servico_id: ordemId,
          tipo: "servico",
          produto_id: null,
          servico_id: item.servico_id,
          codigo: null,
          nome: item.nome,
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.valor_unitario || 0),
          subtotal: Number(item.subtotal || 0),
          baixar_estoque: false,
          garantia_dias: Number(garantiaDias || 0),
        })),
      ];

      if (itensUnificados.length > 0) {
        const { error: itensError } = await supabase
          .from("ordem_servico_itens")
          .insert(itensUnificados);
        if (itensError) throw new Error(itensError.message);
      }

      await supabase.from("ordem_servico_historico").insert([
        {
          empresa_id: empresaId,
          ordem_servico_id: ordemId,
          status_anterior: ordemEditando?.status || null,
          status_novo: status,
          acao: ordemEditando ? "ALTERACAO_OS" : "CRIACAO_OS",
          descricao: ordemEditando
            ? `OS Nº ${numOS(numeroAtual)} alterada.`
            : `OS Nº ${numOS(numeroAtual)} criada para ${equipamentoNome}.`,
          usuario: operadorAtual(),
        },
      ]);

      await supabase.from("historico_equipamento").insert([
        {
          empresa_id: empresaId,
          cliente_id: clienteId,
          equipamento_id: equipamentoId,
          ordem_servico_id: ordemId,
          tipo: "ordem_servico",
          titulo: `OS Nº ${numOS(numeroAtual)}`,
          descricao: defeitoRelatado,
          status,
          valor: totalOS(),
          usuario: operadorAtual(),
        },
      ]);

      alert(ordemEditando ? `OS Nº ${numOS(numeroAtual)} alterada com sucesso!` : `OS Nº ${numOS(numeroAtual)} salva com sucesso!`);
      setModalNova(false);
      limpar();
      await carregarDados();
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido.";
      alert("Erro ao salvar OS: " + mensagem);
    }

    setSalvando(false);
  }

  async function proximoNumeroOrcamento(empresaId: string) {
    const rpcReq = await supabase.rpc("proximo_numero_orcamento", {
      p_empresa_id: empresaId,
    });

    if (!rpcReq.error && rpcReq.data) {
      return Number(rpcReq.data || 1);
    }

    const { data, error } = await supabase
      .from("orcamentos")
      .select("numero_orcamento")
      .eq("empresa_id", empresaId)
      .order("numero_orcamento", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return Number(data?.numero_orcamento || 0) + 1;
  }

  async function imprimirOrcamentoDaOS(
    ordem: OrdemServico,
    numeroOrcamento: number,
    itens: OrdemServicoItemBanco[]
  ) {
    const empresa = await empresaDadosOS();

    const produtos = itens.filter((item) => item.tipo === "produto");
    const servicos = itens.filter((item) => item.tipo !== "produto");
    const numeroFormatado = String(numeroOrcamento || 0).padStart(6, "0");

    const linhaItens = (lista: OrdemServicoItemBanco[]) =>
      lista
        .map(
          (item) => `
            <tr>
              <td>${item.nome || "-"}</td>
              <td style="text-align:center;">${Number(item.quantidade || 0)}</td>
              <td style="text-align:right;">${dinheiro(item.valor_unitario)}</td>
              <td style="text-align:right;">${dinheiro(item.subtotal)}</td>
            </tr>`
        )
        .join("");

    const html = `
      <html>
        <head>
          <title>Orçamento ${numeroFormatado}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 860px; margin: 24px auto; color: #0f172a; }
            .top { display:flex; justify-content:space-between; gap:20px; border-bottom:3px solid #1d4ed8; padding-bottom:16px; }
            .logo { width:120px; height:80px; display:flex; align-items:center; justify-content:center; }
            .logo img { max-width:120px; max-height:80px; object-fit:contain; }
            .logo-texto { font-size:28px; font-weight:900; color:#1d4ed8; }
            h1 { margin:0; font-size:28px; }
            h2 { font-size:18px; margin:0 0 10px; color:#1e3a8a; }
            .box { border:1px solid #cbd5e1; border-radius:14px; padding:14px; margin-top:14px; }
            .grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
            table { width:100%; border-collapse:collapse; margin-top:8px; }
            th { background:#1d4ed8; color:#fff; padding:10px; text-align:left; }
            td { border-bottom:1px solid #e2e8f0; padding:10px; }
            .total { background:#0f172a; color:white; border-radius:14px; padding:16px; margin-top:14px; text-align:right; font-size:24px; font-weight:900; }
            .ass { display:grid; grid-template-columns:1fr 1fr; gap:70px; margin-top:70px; }
            .ass div { border-top:1px solid #0f172a; padding-top:8px; text-align:center; }
            .print { padding:12px 18px; border:0; border-radius:12px; background:#2563eb; color:#fff; font-weight:900; margin-bottom:16px; cursor:pointer; }
            @media print { .print { display:none; } body { margin:0 auto; } tr { page-break-inside: avoid; break-inside: avoid; } }
          </style>
        </head>
        <body>
          <button class="print" onclick="window.print()">Imprimir Orçamento</button>
          <div class="top">
            <div>
              <div class="logo">${htmlLogoEmpresa(empresa, textoHtml)}</div>
              <p><strong>${textoHtml(empresa.nome_fantasia)}</strong></p>
              ${empresa.telefone ? `<p>Telefone: ${textoHtml(empresa.telefone)}</p>` : ""}
              ${empresa.whatsapp ? `<p>WhatsApp: ${textoHtml(empresa.whatsapp)}</p>` : ""}
              ${empresa.email ? `<p>E-mail: ${textoHtml(empresa.email)}</p>` : ""}
            </div>
            <div style="text-align:right;">
              <h1>ORÇAMENTO Nº ${numeroFormatado}</h1>
              <p><b>Gerado da OS:</b> ${numOS(ordem.numero_os)}</p>
              <p><b>Data:</b> ${new Date().toLocaleDateString("pt-BR")}</p>
              <p><b>Validade:</b> 7 dias</p>
            </div>
          </div>

          <div class="box grid">
            <div>
              <h2>Cliente</h2>
              <p><b>Nome:</b> ${ordem.clientes?.nome || "-"}</p>
              <p><b>Contato:</b> ${ordem.clientes?.whatsapp || ordem.clientes?.cpf_cnpj || "-"}</p>
            </div>
            <div>
              <h2>Equipamento</h2>
              <p><b>Tipo:</b> ${ordem.tipo_equipamento || "-"}</p>
              <p><b>Modelo:</b> ${ordem.modelo || "-"}</p>
              <p><b>IMEI/Série:</b> ${ordem.imei_1 || ordem.numero_serie || "-"}</p>
            </div>
          </div>

          <div class="box">
            <h2>Defeito / Diagnóstico</h2>
            <p><b>Defeito relatado:</b> ${ordem.defeito_relatado || "-"}</p>
            <p><b>Diagnóstico:</b> ${ordem.diagnostico || "-"}</p>
            <p><b>Solução proposta:</b> ${ordem.solucao || "-"}</p>
          </div>

          <div class="box">
            <h2>Produtos / Peças</h2>
            <table>
              <thead><tr><th>Descrição</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Unitário</th><th style="text-align:right;">Subtotal</th></tr></thead>
              <tbody>${produtos.length ? linhaItens(produtos) : `<tr><td colspan="4" style="text-align:center;">Nenhum produto informado</td></tr>`}</tbody>
            </table>
          </div>

          <div class="box">
            <h2>Serviços</h2>
            <table>
              <thead><tr><th>Descrição</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Unitário</th><th style="text-align:right;">Subtotal</th></tr></thead>
              <tbody>${servicos.length ? linhaItens(servicos) : `<tr><td colspan="4" style="text-align:center;">Nenhum serviço informado</td></tr>`}</tbody>
            </table>
          </div>

          <div class="box">
            <p><b>Produtos:</b> ${dinheiro(ordem.valor_produtos)}</p>
            <p><b>Serviços:</b> ${dinheiro(ordem.valor_servicos)}</p>
            <p><b>Desconto:</b> ${dinheiro(ordem.desconto)}</p>
            <div class="total">TOTAL: ${dinheiro(ordem.valor_total)}</div>
          </div>

          <div class="ass"><div>Assinatura do Cliente</div><div>Assinatura da Empresa</div></div>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank", "width=950,height=850");
    if (!janela) {
      alert("Libere pop-ups para imprimir o orçamento.");
      return;
    }
    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }

  async function gerarOrcamento(ordem: OrdemServico) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!ordem.cliente_id) {
      alert("Esta OS não possui cliente vinculado.");
      return;
    }

    if (gerandoOrcamento) return;
    setGerandoOrcamento(ordem.id);

    try {
      const existente = await supabase
        .from("orcamentos")
        .select("id,numero_orcamento")
        .eq("empresa_id", empresaId)
        .eq("ordem_servico_id", ordem.id)
        .maybeSingle();

      if (existente.error) throw new Error(existente.error.message);

      const itensReq = await supabase
        .from("ordem_servico_itens")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("ordem_servico_id", ordem.id);

      if (itensReq.error) throw new Error(itensReq.error.message);
      const itens = (itensReq.data || []) as OrdemServicoItemBanco[];

      if (existente.data?.id) {
        alert(`Já existe orçamento Nº ${String(existente.data.numero_orcamento).padStart(6, "0")} para esta OS. Abrindo impressão.`);
        await imprimirOrcamentoDaOS(ordem, Number(existente.data.numero_orcamento || 0), itens);
        setGerandoOrcamento(null);
        return;
      }

      const numeroOrcamento = await proximoNumeroOrcamento(empresaId);
      const validade = new Date();
      validade.setDate(validade.getDate() + 7);

      const { data: orcamento, error: orcamentoError } = await supabase
        .from("orcamentos")
        .insert([
          {
            empresa_id: empresaId,
            numero_orcamento: numeroOrcamento,
            cliente_id: ordem.cliente_id,
            ordem_servico_id: ordem.id,
            equipamento_id: ordem.equipamento_id || null,
            origem: "ordem_servico",
            titulo: `ORÇAMENTO DA OS Nº ${numOS(ordem.numero_os)}`,
            descricao: ordem.defeito_relatado || null,
            observacoes: ordem.observacao || null,
            validade: validade.toISOString().slice(0, 10),
            status: "rascunho",
            valor_produtos: Number(ordem.valor_produtos || 0),
            valor_servicos: Number(ordem.valor_servicos || 0),
            desconto: Number(ordem.desconto || 0),
            valor_total: Number(ordem.valor_total || 0),
            usuario: operadorAtual(),
          },
        ])
        .select("id,numero_orcamento")
        .single();

      if (orcamentoError) throw new Error(orcamentoError.message);

      const itensOrcamento = itens.map((item) => ({
        empresa_id: empresaId,
        orcamento_id: orcamento.id,
        produto_id: item.tipo === "produto" ? item.produto_id : null,
        codigo: item.codigo || (item.tipo === "servico" ? "SERV" : "-"),
        produto_nome: item.tipo === "servico" ? `SERVIÇO: ${item.nome}` : item.nome,
        quantidade: Number(item.quantidade || 0),
        valor_unitario: Number(item.valor_unitario || 0),
        subtotal: Number(item.subtotal || 0),
      }));

      if (itensOrcamento.length > 0) {
        const { error } = await supabase.from("itens_orcamento").insert(itensOrcamento);
        if (error) throw new Error(error.message);
      }

      await supabase.from("ordem_servico_historico").insert([
        {
          empresa_id: empresaId,
          ordem_servico_id: ordem.id,
          status_anterior: ordem.status,
          status_novo: ordem.status,
          acao: "GERAR_ORCAMENTO",
          descricao: `Orçamento Nº ${String(orcamento.numero_orcamento).padStart(6, "0")} gerado a partir desta OS.`,
          usuario: operadorAtual(),
        },
      ]);

      alert(`Orçamento Nº ${String(orcamento.numero_orcamento).padStart(6, "0")} gerado com sucesso!`);
      await imprimirOrcamentoDaOS(ordem, Number(orcamento.numero_orcamento || 0), itens);
      await carregarDados();
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido.";
      alert("Erro ao gerar orçamento: " + mensagem);
    }

    setGerandoOrcamento(null);
  }


  async function enviarParaPdv(ordem: OrdemServico) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!ordem.cliente_id) {
      alert("Esta OS não possui cliente vinculado.");
      return;
    }

    if (enviandoPdv) return;
    setEnviandoPdv(ordem.id);

    try {
      const itensReq = await supabase
        .from("ordem_servico_itens")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("ordem_servico_id", ordem.id);

      if (itensReq.error) throw new Error(itensReq.error.message);

      const itens = (itensReq.data || []) as OrdemServicoItemBanco[];
      const itensValidos = itens.filter((item) => Number(item.quantidade || 0) > 0 && Number(item.valor_unitario || 0) >= 0);
      const produtosDaOS = itensValidos.filter((item) => item.tipo === "produto" && item.produto_id);
      const servicosDaOS = itensValidos.filter((item) => item.tipo !== "produto");

      if (itensValidos.length === 0) {
        alert("Esta OS não possui produtos ou serviços para enviar ao PDV.");
        setEnviandoPdv(null);
        return;
      }

      const payload = {
        id: ordem.id,
        numero_os: ordem.numero_os,
        cliente_id: ordem.cliente_id,
        cliente_nome: ordem.clientes?.nome || "Cliente",
        cliente_documento: ordem.clientes?.cpf_cnpj || "",
        cliente_whatsapp: ordem.clientes?.whatsapp || "",
        desconto: Number(ordem.desconto || 0),
        valor_total: Number(ordem.valor_total || 0),
        valor_produtos: Number(ordem.valor_produtos || 0),
        valor_servicos: Number(ordem.valor_servicos || 0),
        observacao: `Venda gerada pela OS Nº ${numOS(ordem.numero_os)} com ${produtosDaOS.length} produto(s) e ${servicosDaOS.length} serviço(s).`.trim(),
        itens: itensValidos.map((item) => ({
          tipo: item.tipo === "produto" ? "produto" : "servico",
          produto_id: item.tipo === "produto" ? item.produto_id : null,
          codigo: item.codigo || (item.tipo === "servico" ? "SERV" : "-"),
          produto_nome: item.tipo === "servico" ? `SERVIÇO: ${item.nome}` : item.nome,
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.valor_unitario || 0),
          subtotal: Number(item.subtotal || 0),
        })),
      };

      localStorage.setItem("th_os_para_pdv", JSON.stringify(payload));
      sessionStorage.setItem("th_os_para_pdv", JSON.stringify(payload));

      await supabase.from("ordem_servico_historico").insert([
        {
          empresa_id: empresaId,
          ordem_servico_id: ordem.id,
          status_anterior: ordem.status,
          status_novo: ordem.status,
          acao: "ENVIAR_PDV",
          descricao: `OS Nº ${numOS(ordem.numero_os)} enviada para o PDV com ${produtosDaOS.length} produto(s) e ${servicosDaOS.length} serviço(s).`,
          usuario: operadorAtual(),
        },
      ]);

      setTimeout(() => {
        window.location.assign("/caixa/pdv");
      }, 100);
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido.";
      alert("Erro ao enviar OS para o PDV: " + mensagem);
      setEnviandoPdv(null);
    }
  }


  function montarLinkOS(ordem: OrdemServico) {
    if (typeof window === "undefined") return `/ordem-servico?os=${ordem.id}`;
    return `${window.location.origin}/ordem-servico?os=${ordem.id}`;
  }

  async function copiarLinkOS(ordem: OrdemServico) {
    const link = montarLinkOS(ordem);

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else if (typeof window !== "undefined") {
        window.prompt("Copie o link da OS:", link);
        return;
      }

      alert(`Link da OS Nº ${numOS(ordem.numero_os)} copiado com sucesso!`);
    } catch {
      if (typeof window !== "undefined") {
        window.prompt("Copie o link da OS:", link);
      }
    }
  }

  function enviarWhatsApp(ordem: OrdemServico) {
    const telefoneLimpo = String(ordem.clientes?.whatsapp || "").replace(/\D/g, "");
    const telefone = telefoneLimpo.startsWith("55") ? telefoneLimpo : telefoneLimpo ? `55${telefoneLimpo}` : "";
    const linkOS = montarLinkOS(ordem);
    const mensagem = [
      `Olá, ${ordem.clientes?.nome || "cliente"}!`,
      `Segue sua Ordem de Serviço Nº ${numOS(ordem.numero_os)}.`,
      `Status: ${statusLabel(ordem.status)}.`,
      `Total: ${dinheiro(ordem.valor_total)}.`,
      linkOS,
    ].join("\n");

    const url = telefone
      ? `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function registrarHistoricoOS(
    ordemId: string,
    statusAnterior: string | null,
    statusNovo: string | null,
    acao: string,
    descricao: string
  ) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    await supabase.from("ordem_servico_historico").insert([
      {
        empresa_id: empresaId,
        ordem_servico_id: ordemId,
        status_anterior: statusAnterior,
        status_novo: statusNovo,
        acao,
        descricao,
        usuario: operadorAtual(),
      },
    ]);
  }

  async function carregarHistoricoOS(ordem: OrdemServico) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregandoHistorico(true);
    setOrdemHistorico(ordem);
    setModalHistorico(true);

    const { data, error } = await supabase
      .from("ordem_servico_historico")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ordem_servico_id", ordem.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar histórico da OS: " + error.message);
      setHistoricoOS([]);
    } else {
      setHistoricoOS((data || []) as HistoricoOrdemServico[]);
    }

    setCarregandoHistorico(false);
  }

  function fecharHistoricoOS() {
    setModalHistorico(false);
    setOrdemHistorico(null);
    setHistoricoOS([]);
  }

  async function alterarStatus(ordem: OrdemServico, novoStatus: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    if (ordem.status === novoStatus) return;

    const payload: Record<string, unknown> = {
      status: novoStatus,
      usuario: operadorAtual(),
    };

    if (novoStatus === "concluida") payload.data_conclusao = new Date().toISOString();
    if (novoStatus === "entregue") payload.data_entrega = new Date().toISOString();

    const { error } = await supabase
      .from("ordens_servico")
      .update(payload)
      .eq("empresa_id", empresaId)
      .eq("id", ordem.id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    await registrarHistoricoOS(
      ordem.id,
      ordem.status,
      novoStatus,
      "ALTERACAO_STATUS",
      `Status alterado de ${statusLabel(ordem.status)} para ${statusLabel(novoStatus)}.`
    );

    await carregarDados();
  }

  async function imprimir(ordem: OrdemServico) {
    const empresa = await empresaDadosOS();
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    let itens: OrdemServicoItemBanco[] = [];

    try {
      const { data, error } = await supabase
        .from("ordem_servico_itens")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("ordem_servico_id", ordem.id)
        .order("tipo", { ascending: true });

      if (error) throw new Error(error.message);
      itens = (data || []) as OrdemServicoItemBanco[];
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido.";
      alert("Erro ao carregar itens da OS para impressão: " + mensagem);
      return;
    }

    const produtos = itens.filter((item) => item.tipo === "produto");
    const servicosDaOS = itens.filter((item) => item.tipo !== "produto");
    const subtotal = Number(ordem.valor_produtos || 0) + Number(ordem.valor_servicos || 0);

    const linhasItens = (lista: OrdemServicoItemBanco[]) =>
      lista.length
        ? lista
            .map(
              (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <strong>${textoHtml(item.nome || "-")}</strong>
                    ${item.codigo ? `<br><span>Cód: ${textoHtml(item.codigo)}</span>` : ""}
                  </td>
                  <td class="right">${Number(item.quantidade || 0)}</td>
                  <td class="right">${dinheiro(item.valor_unitario)}</td>
                  <td class="right">${dinheiro(item.subtotal)}</td>
                </tr>
              `
            )
            .join("")
        : `<tr><td colspan="5" style="text-align:center;color:#6b7280;">Nenhum item informado</td></tr>`;

    const detalhesSegmento = ordem.dados_segmento
      ? Object.entries(ordem.dados_segmento)
          .filter(([chave, valor]) => deveMostrarDadoEquipamento(chave, valor))
          .map(
            ([chave, valor]) => `
              <div class="cell">
                <span class="label">${textoHtml(labelDadoEquipamento(chave))}</span>
                <strong>${textoHtml(valorDadoEquipamento(valor))}</strong>
              </div>
            `
          )
          .join("")
      : "";

    const checklistImpressao = ordem.dados_segmento
      ? listaChecklistPorSegmento(ordem.segmento || "geral").map((item) => ({
          ...item,
          marcado: Boolean(objetoTextoBooleano(ordem.dados_segmento?.checklist_os)[item.chave]),
        }))
      : [];

    const fotosImpressao = listaFotosOS(ordem.dados_segmento?.fotos_os);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Ordem de Serviço ${numOS(ordem.numero_os)}</title>

          <style>
            * { box-sizing: border-box; }

            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              background: #e5e7eb;
              color: #111827;
              font-size: 10.5px;
              line-height: 1.25;
            }

            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: #fff;
              padding: 8mm 12mm;
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
              grid-template-columns: 30mm 1fr 50mm;
              gap: 8px;
              align-items: start;
              border-bottom: 2px solid #111827;
              padding-bottom: 8px;
            }

            .logo-box {
              width: 26mm;
              height: 18mm;
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

            .logo-texto {
              font-size: 24px;
              font-weight: 900;
              color: #111827;
            }

            .company h1 {
              font-size: 15px;
              margin: 0 0 3px;
              text-transform: uppercase;
            }

            .company p {
              margin: 1px 0;
              color: #374151;
              font-size: 9.5px;
              line-height: 1.15;
            }

            .doc-box {
              border: 2px solid #111827;
              padding: 5px;
              text-align: center;
            }

            .doc-box h2 {
              margin: 0;
              font-size: 13px;
            }

            .doc-box .numero {
              font-size: 17px;
              font-weight: 900;
              margin-top: 2px;
            }

            .doc-box p {
              margin: 2px 0 0;
              font-size: 9px;
              color: #374151;
              line-height: 1.15;
            }

            .section {
              margin-top: 5px;
            }

            .section-title {
              background: #111827;
              color: #fff;
              padding: 3px 8px;
              font-size: 9px;
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
              padding: 3px 8px;
              border-right: 1px solid #d1d5db;
              border-bottom: 1px solid #d1d5db;
              min-height: 18px;
              line-height: 1.15;
            }

            .cell:nth-child(2n) { border-right: 0; }

            .label {
              display: block;
              color: #6b7280;
              font-size: 8px;
              text-transform: uppercase;
              margin-bottom: 1px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #d1d5db;
            }

            th {
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              padding: 3px 6px;
              text-align: left;
              font-size: 9px;
              text-transform: uppercase;
            }

            td {
              border: 1px solid #d1d5db;
              padding: 3px 6px;
              vertical-align: top;
              line-height: 1.15;
            }

            td span {
              color: #6b7280;
              font-size: 9px;
            }

            .right { text-align: right; }

            .totals {
              margin-left: auto;
              width: 75mm;
              border: 1px solid #d1d5db;
              border-top: 0;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #d1d5db;
              padding: 3px 8px;
              line-height: 1.15;
            }

            .grand-total {
              background: #111827;
              color: #fff;
              font-size: 12px;
              font-weight: 900;
            }

            .obs {
              border: 1px solid #d1d5db;
              border-top: 0;
              padding: 5px 8px;
              min-height: 6mm;
              white-space: pre-line;
              line-height: 1.2;
            }

            .signatures {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-top: 6mm;
            }

            .signature {
              border-top: 1px solid #111827;
              text-align: center;
              padding-top: 3px;
              color: #374151;
              font-size: 9px;
            }

            .footer {
              margin-top: 6px;
              padding-top: 4px;
              border-top: 1px solid #d1d5db;
              text-align: center;
              color: #6b7280;
              font-size: 8px;
            }

            .check-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              border: 1px solid #d1d5db;
              border-top: 0;
            }

            .check-item {
              padding: 3px 7px;
              border-right: 1px solid #d1d5db;
              border-bottom: 1px solid #d1d5db;
              font-weight: 700;
              font-size: 9px;
              line-height: 1.15;
            }

            .foto-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              border: 1px solid #d1d5db;
              border-top: 0;
              padding: 8px;
            }

            .foto-card img {
              width: 100%;
              height: 34mm;
              object-fit: cover;
              border: 1px solid #d1d5db;
            }

            .foto-card p {
              margin: 3px 0 0;
              font-size: 10px;
              color: #374151;
            }

            @page {
              size: A4;
              margin: 8mm;
            }

            @media print {
              body { background: #fff; }
              .top-actions { display: none; }
              .page {
                width: 210mm;
                min-height: auto;
                padding: 6mm 10mm;
                margin: 0;
              }
              thead {
                display: table-header-group;
              }
              tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .section,
              .grid,
              .check-grid,
              .totals,
              .signatures {
                page-break-inside: avoid;
                break-inside: avoid;
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
                ${htmlLogoEmpresa(empresa, textoHtml)}
              </div>

              <div class="company">
                <h1>${textoHtml(empresa.nome_fantasia)}</h1>
                ${empresa.razao_social ? `<p>${textoHtml(empresa.razao_social)}</p>` : ""}
                ${empresa.cnpj ? `<p><strong>CNPJ/CPF:</strong> ${textoHtml(empresa.cnpj)}</p>` : ""}
                ${empresa.endereco ? `<p>${textoHtml(empresa.endereco)}</p>` : ""}
                ${empresa.telefone ? `<p><strong>Telefone:</strong> ${textoHtml(empresa.telefone)}</p>` : ""}
                ${empresa.whatsapp ? `<p><strong>WhatsApp:</strong> ${textoHtml(empresa.whatsapp)}</p>` : ""}
                ${empresa.email ? `<p><strong>E-mail:</strong> ${textoHtml(empresa.email)}</p>` : ""}
              </div>

              <div class="doc-box">
                <h2>ORDEM DE SERVIÇO</h2>
                <div class="numero">Nº ${numOS(ordem.numero_os)}</div>
                <p>Emitido em ${new Date().toLocaleDateString("pt-BR")}</p>
                <p>Status: ${statusLabel(ordem.status)}</p>
              </div>
            </header>

            <section class="section">
              <div class="section-title">Dados do Cliente</div>
              <div class="grid">
                <div class="cell"><span class="label">Cliente</span><strong>${textoHtml(ordem.clientes?.nome || "-")}</strong></div>
                <div class="cell"><span class="label">CPF/CNPJ</span>${textoHtml(ordem.clientes?.cpf_cnpj || "-")}</div>
                <div class="cell"><span class="label">WhatsApp</span>${textoHtml(ordem.clientes?.whatsapp || "-")}</div>
                <div class="cell"><span class="label">Entrada</span>${dataBR(ordem.data_entrada)}</div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Dados do Equipamento</div>
              <div class="grid">
                <div class="cell"><span class="label">Equipamento</span><strong>${textoHtml(ordem.equipamento_nome || ordem.tipo_equipamento || "-")}</strong></div>
                <div class="cell"><span class="label">Tipo</span>${textoHtml(ordem.tipo_equipamento || "-")}</div>
                <div class="cell"><span class="label">Marca</span>${textoHtml(ordem.marca || "-")}</div>
                <div class="cell"><span class="label">Modelo</span>${textoHtml(ordem.modelo || "-")}</div>
                <div class="cell"><span class="label">IMEI / Série</span>${textoHtml(ordem.imei_1 || ordem.numero_serie || "-")}</div>
                <div class="cell"><span class="label">Garantia</span>${Number(ordem.garantia_dias || 0)} dias</div>
                ${detalhesSegmento}
              </div>
            </section>

            <section class="section">
              <div class="section-title">Defeito / Diagnóstico</div>
              <div class="grid">
                <div class="cell"><span class="label">Defeito relatado</span><strong>${textoHtml(ordem.defeito_relatado || "-")}</strong></div>
                <div class="cell"><span class="label">Diagnóstico</span>${textoHtml(ordem.diagnostico || "-")}</div>
                <div class="cell" style="grid-column:1 / -1;"><span class="label">Solução / Serviço a executar</span>${textoHtml(ordem.solucao || "-")}</div>
              </div>
            </section>

            ${checklistImpressao.length ? `
            <section class="section">
              <div class="section-title">Checklist do Equipamento</div>
              <div class="check-grid">
                ${checklistImpressao
                  .map((item) => `<div class="check-item">${item.marcado ? "☑" : "☐"} ${textoHtml(item.label)}</div>`)
                  .join("")}
              </div>
            </section>
            ` : ""}

            ${fotosImpressao.length ? `
            <section class="section">
              <div class="section-title">Fotos da Ordem de Serviço</div>
              <div class="foto-grid">
                ${fotosImpressao
                  .slice(0, 6)
                  .map((foto) => `
                    <div class="foto-card">
                      <img src="${textoHtml(foto.url)}" alt="Foto da OS" />
                      <p><strong>${textoHtml(foto.tipo)}</strong>${foto.descricao ? ` - ${textoHtml(foto.descricao)}` : ""}</p>
                    </div>
                  `)
                  .join("")}
              </div>
            </section>
            ` : ""}

            <section class="section">
              <div class="section-title">Produtos / Peças</div>
              <table>
                <thead><tr><th style="width:10mm;">Item</th><th>Produto</th><th class="right" style="width:20mm;">Qtd</th><th class="right" style="width:30mm;">Unitário</th><th class="right" style="width:35mm;">Subtotal</th></tr></thead>
                <tbody>${linhasItens(produtos)}</tbody>
              </table>
            </section>

            <section class="section">
              <div class="section-title">Serviços</div>
              <table>
                <thead><tr><th style="width:10mm;">Item</th><th>Serviço</th><th class="right" style="width:20mm;">Qtd</th><th class="right" style="width:30mm;">Unitário</th><th class="right" style="width:35mm;">Subtotal</th></tr></thead>
                <tbody>${linhasItens(servicosDaOS)}</tbody>
              </table>

              <div class="totals">
                <div class="total-row"><span>Subtotal</span><strong>${dinheiro(subtotal)}</strong></div>
                <div class="total-row"><span>Produtos</span><strong>${dinheiro(ordem.valor_produtos)}</strong></div>
                <div class="total-row"><span>Serviços</span><strong>${dinheiro(ordem.valor_servicos)}</strong></div>
                <div class="total-row"><span>Desconto</span><strong>${dinheiro(ordem.desconto)}</strong></div>
                <div class="total-row grand-total"><span>TOTAL</span><strong>${dinheiro(ordem.valor_total)}</strong></div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Observações e Condições</div>
              <div class="obs">${textoHtml(ordem.observacao || "Documento gerado pelo Th Cloud. Ordem de serviço sem valor fiscal.")}</div>
            </section>

            <div class="signatures">
              <div class="signature">Assinatura do Cliente</div>
              <div class="signature">Responsável pela Empresa</div>
            </div>

            <div class="footer">
              Documento gerado pelo Th Cloud • Ordem de serviço sem valor fiscal.
            </div>
          </main>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank", "width=1000,height=800");

    if (!janela) {
      alert("Libere pop-ups para imprimir.");
      return;
    }

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }

  const clientesBusca = clientes
    .filter((cliente) => {
      const termo = clientePesquisa.toLowerCase();
      return (
        cliente.nome.toLowerCase().includes(termo) ||
        String(cliente.cpf_cnpj || "").toLowerCase().includes(termo) ||
        String(cliente.whatsapp || "").toLowerCase().includes(termo)
      );
    })
    .slice(0, 8);

  const produtosBusca = produtos
    .filter((produto) => {
      const termo = produtoBusca.toLowerCase();
      return (
        produto.nome.toLowerCase().includes(termo) ||
        String(produto.codigo || "").toLowerCase().includes(termo) ||
        String(produto.codigo_barras || "").toLowerCase().includes(termo)
      );
    })
    .slice(0, 8);

  const servicosBusca = servicos
    .filter((servico) => servico.nome.toLowerCase().includes(servicoBusca.toLowerCase()))
    .slice(0, 8);

  const ordensFiltradas = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();

    return ordens.filter((ordem) => {
      const texto = `${ordem.numero_os} ${ordem.clientes?.nome || ""} ${
        ordem.clientes?.cpf_cnpj || ""
      } ${ordem.clientes?.whatsapp || ""} ${ordem.equipamento_nome || ""} ${
        ordem.segmento_nome || ""
      } ${ordem.tipo_equipamento || ""} ${ordem.marca || ""} ${ordem.modelo || ""} ${
        ordem.imei_1 || ""
      } ${ordem.imei_2 || ""} ${JSON.stringify(ordem.dados_segmento || {})}`.toLowerCase();

      return (
        (filtroStatus === "todos" || ordem.status === filtroStatus) &&
        (!termo || texto.includes(termo))
      );
    });
  }, [ordens, pesquisa, filtroStatus]);

  const totalAberto = ordens
    .filter((ordem) => !["entregue", "cancelada"].includes(ordem.status))
    .reduce((total, ordem) => total + Number(ordem.valor_total || 0), 0);

  async function aprovarOrcamentoCliente(ordem: OrdemServico) {
    const confirmar = typeof window === "undefined" ? true : window.confirm(`Confirmar aprovação do orçamento da OS Nº ${numOS(ordem.numero_os)}?`);
    if (!confirmar) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    try {
      const statusAnterior = ordem.status;
      const statusNovo = "aprovada";

      const { error } = await supabase
        .from("ordens_servico")
        .update({ status: statusNovo })
        .eq("empresa_id", empresaId)
        .eq("id", ordem.id);

      if (error) throw new Error(error.message);

      await registrarHistoricoOS(
        ordem.id,
        statusAnterior,
        statusNovo,
        "APROVACAO_CLIENTE",
        `Cliente aprovou o orçamento da OS Nº ${numOS(ordem.numero_os)}.`
      );

      await carregarDados();
      alert(`OS Nº ${numOS(ordem.numero_os)} aprovada com sucesso.`);
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido.";
      alert("Erro ao aprovar OS: " + mensagem);
    }
  }

  async function recusarOrcamentoCliente(ordem: OrdemServico) {
    const motivo = typeof window === "undefined" ? "" : window.prompt("Informe o motivo da recusa do cliente:", "CLIENTE NÃO APROVOU O ORÇAMENTO") || "CLIENTE NÃO APROVOU O ORÇAMENTO";
    if (!motivo) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    try {
      const statusAnterior = ordem.status;
      const statusNovo = "cancelada";

      const { error } = await supabase
        .from("ordens_servico")
        .update({ status: statusNovo, observacao: [ordem.observacao, `RECUSA: ${motivo}`].filter(Boolean).join("\n") })
        .eq("empresa_id", empresaId)
        .eq("id", ordem.id);

      if (error) throw new Error(error.message);

      await registrarHistoricoOS(
        ordem.id,
        statusAnterior,
        statusNovo,
        "RECUSA_CLIENTE",
        `Cliente recusou o orçamento da OS Nº ${numOS(ordem.numero_os)}. Motivo: ${motivo}`
      );

      await carregarDados();
      alert(`Recusa registrada na OS Nº ${numOS(ordem.numero_os)}.`);
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido.";
      alert("Erro ao registrar recusa: " + mensagem);
    }
  }

  function enviarWhatsAppAprovacao(ordem: OrdemServico) {
    const telefoneLimpo = String(ordem.clientes?.whatsapp || "").replace(/\D/g, "");
    const telefone = telefoneLimpo.startsWith("55") ? telefoneLimpo : telefoneLimpo ? `55${telefoneLimpo}` : "";
    const linkOS = montarLinkOS(ordem);
    const mensagem = [
      `Olá, ${ordem.clientes?.nome || "cliente"}!`,
      `Seu orçamento referente à OS Nº ${numOS(ordem.numero_os)} está pronto para análise.`,
      `Total: ${dinheiro(ordem.valor_total)}.`,
      `Para aprovar ou tirar dúvidas, responda esta mensagem.`,
      linkOS,
    ].join("\n");

    const url = telefone
      ? `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }


  async function notificarEquipamentoPronto(ordem: OrdemServico) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    try {
      if (ordem.status !== "concluida" && ordem.status !== "entregue") {
        const { error } = await supabase
          .from("ordens_servico")
          .update({ status: "concluida", data_conclusao: new Date().toISOString(), usuario: operadorAtual() })
          .eq("empresa_id", empresaId)
          .eq("id", ordem.id);

        if (error) throw new Error(error.message);

        await registrarHistoricoOS(
          ordem.id,
          ordem.status,
          "concluida",
          "EQUIPAMENTO_PRONTO",
          `Equipamento da OS Nº ${numOS(ordem.numero_os)} marcado como pronto para entrega e cliente notificado pelo WhatsApp.`
        );
      } else {
        await registrarHistoricoOS(
          ordem.id,
          ordem.status,
          ordem.status,
          "WHATSAPP_PRONTO",
          `Mensagem de equipamento pronto enviada ao cliente da OS Nº ${numOS(ordem.numero_os)}.`
        );
      }

      const telefoneLimpo = String(ordem.clientes?.whatsapp || "").replace(/\D/g, "");
      const telefone = telefoneLimpo.startsWith("55") ? telefoneLimpo : telefoneLimpo ? `55${telefoneLimpo}` : "";
      const linkOS = montarLinkOS(ordem);
      const mensagem = [
        `Olá, ${ordem.clientes?.nome || "cliente"}!`,
        `Seu equipamento referente à OS Nº ${numOS(ordem.numero_os)} está pronto para retirada.`,
        `Equipamento: ${[ordem.tipo_equipamento, ordem.marca, ordem.modelo].filter(Boolean).join(" ") || "não informado"}.`,
        `Total: ${dinheiro(ordem.valor_total)}.`,
        `Por favor, compareça para conferência e retirada.`,
        linkOS,
      ].join("\n");

      const url = telefone
        ? `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`
        : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

      await carregarDados();

      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido.";
      alert("Erro ao notificar equipamento pronto: " + mensagem);
    }
  }

  async function registrarEntregaOS(ordem: OrdemServico) {
    const confirmar = typeof window === "undefined" ? true : window.confirm(`Confirmar entrega da OS Nº ${numOS(ordem.numero_os)} ao cliente?`);
    if (!confirmar) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    try {
      const { error } = await supabase
        .from("ordens_servico")
        .update({ status: "entregue", data_entrega: new Date().toISOString(), usuario: operadorAtual() })
        .eq("empresa_id", empresaId)
        .eq("id", ordem.id);

      if (error) throw new Error(error.message);

      await registrarHistoricoOS(
        ordem.id,
        ordem.status,
        "entregue",
        "ENTREGA_CLIENTE",
        `OS Nº ${numOS(ordem.numero_os)} entregue ao cliente.`
      );

      await carregarDados();
      alert(`Entrega registrada na OS Nº ${numOS(ordem.numero_os)}.`);
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido.";
      alert("Erro ao registrar entrega: " + mensagem);
    }
  }

  async function imprimirComprovanteEntrega(ordem: OrdemServico) {
    const empresa = await carregarEmpresaPDF();
    const { declaracaoEntrega } = await carregarTermosOS();

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Comprovante de Entrega - OS ${numOS(ordem.numero_os)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 28px; background: #f8fafc; }
  .doc { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; padding: 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111827; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 70px; height: 70px; display:flex; align-items:center; justify-content:center; flex-shrink: 0; }
  .logo img { max-width:70px; max-height:70px; object-fit:contain; }
  .logo-texto { width:70px; height:70px; border-radius:14px; background:#1d4ed8; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:22px; }
  .brand-nome { font-size: 19px; font-weight: 900; color: #1d4ed8; }
  .brand-info { font-size: 11px; color: #475569; margin-top: 2px; }
  .box { border: 1px solid #111827; padding: 10px 14px; text-align: right; font-weight: 900; }
  .section { border: 1px solid #e5e7eb; margin-top: 14px; }
  .section h2 { margin: 0; background: #111827; color: white; font-size: 13px; padding: 9px 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; }
  .label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 800; }
  .value { font-size: 13px; font-weight: 800; margin-top: 3px; }
  .text { padding: 12px; line-height: 1.55; font-size: 13px; white-space: pre-line; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
  .line { border-top: 1px solid #111827; padding-top: 8px; text-align: center; font-size: 12px; font-weight: 800; }
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    <div class="brand">
      <div class="logo">${htmlLogoEmpresa(empresa, textoHtml)}</div>
      <div>
        <div class="brand-nome">${textoHtml(empresa.nome_fantasia)}</div>
        ${empresa.cnpj ? `<div class="brand-info">CNPJ/CPF: ${textoHtml(empresa.cnpj)}</div>` : ""}
        ${empresa.telefone ? `<div class="brand-info">Tel: ${textoHtml(empresa.telefone)}</div>` : ""}
        ${empresa.endereco ? `<div class="brand-info">${textoHtml(empresa.endereco)}</div>` : ""}
      </div>
    </div>
    <div class="box">COMPROVANTE DE ENTREGA<br/>OS Nº ${numOS(ordem.numero_os)}</div>
  </div>
  <div class="section"><h2>DADOS DA ENTREGA</h2><div class="grid">
    <div><div class="label">Cliente</div><div class="value">${textoHtml(ordem.clientes?.nome || "-")}</div></div>
    <div><div class="label">Contato</div><div class="value">${textoHtml(ordem.clientes?.whatsapp || ordem.clientes?.cpf_cnpj || "-")}</div></div>
    <div><div class="label">Equipamento</div><div class="value">${textoHtml([ordem.tipo_equipamento, ordem.marca, ordem.modelo].filter(Boolean).join(" ") || "-")}</div></div>
    <div><div class="label">Série/IMEI</div><div class="value">${textoHtml(ordem.numero_serie || ordem.imei_1 || "-")}</div></div>
    <div><div class="label">Data da entrega</div><div class="value">${new Date().toLocaleString("pt-BR")}</div></div>
    <div><div class="label">Valor total</div><div class="value">${dinheiro(ordem.valor_total)}</div></div>
  </div></div>
  <div class="section"><h2>DECLARAÇÃO</h2><div class="text">${textoHtml(declaracaoEntrega)}</div></div>
  <div class="section"><h2>SERVIÇO / SOLUÇÃO</h2><div class="text">${textoHtml(ordem.solucao || ordem.diagnostico || "-")}</div></div>
  <div class="sign"><div class="line">Cliente / Responsável pela retirada</div><div class="line">Responsável pela entrega</div></div>
</div>
<script>window.print();</script>
</body>
</html>`;

    const janela = window.open("", "_blank", "width=900,height=1000");
    if (!janela) return;
    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }

  async function imprimirTermoGarantia(ordem: OrdemServico) {
    const empresa = await carregarEmpresaPDF();
    const { condicoesGarantia } = await carregarTermosOS();
    const validade = new Date();
    validade.setDate(validade.getDate() + Number(ordem.garantia_dias || 0));

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Termo de Garantia - OS ${numOS(ordem.numero_os)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 28px; background: #f8fafc; }
  .doc { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; padding: 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111827; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 70px; height: 70px; display:flex; align-items:center; justify-content:center; flex-shrink: 0; }
  .logo img { max-width:70px; max-height:70px; object-fit:contain; }
  .logo-texto { width:70px; height:70px; border-radius:14px; background:#1d4ed8; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:22px; }
  .brand-nome { font-size: 19px; font-weight: 900; color: #1d4ed8; }
  .brand-info { font-size: 11px; color: #475569; margin-top: 2px; }
  .box { border: 1px solid #111827; padding: 10px 14px; text-align: right; font-weight: 900; }
  h1 { font-size: 20px; margin: 0 0 14px; }
  .section { border: 1px solid #e5e7eb; margin-top: 14px; }
  .section h2 { margin: 0; background: #111827; color: white; font-size: 13px; padding: 9px 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; }
  .label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 800; }
  .value { font-size: 13px; font-weight: 800; margin-top: 3px; }
  .text { padding: 12px; line-height: 1.55; font-size: 13px; white-space: pre-line; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
  .line { border-top: 1px solid #111827; padding-top: 8px; text-align: center; font-size: 12px; font-weight: 800; }
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    <div class="brand">
      <div class="logo">${htmlLogoEmpresa(empresa, textoHtml)}</div>
      <div>
        <div class="brand-nome">${textoHtml(empresa.nome_fantasia)}</div>
        ${empresa.cnpj ? `<div class="brand-info">CNPJ/CPF: ${textoHtml(empresa.cnpj)}</div>` : ""}
        ${empresa.telefone ? `<div class="brand-info">Tel: ${textoHtml(empresa.telefone)}</div>` : ""}
        ${empresa.endereco ? `<div class="brand-info">${textoHtml(empresa.endereco)}</div>` : ""}
      </div>
    </div>
    <div class="box">TERMO DE GARANTIA<br/>OS Nº ${numOS(ordem.numero_os)}</div>
  </div>
  <h1>Termo de Garantia do Serviço</h1>
  <div class="section"><h2>DADOS PRINCIPAIS</h2><div class="grid">
    <div><div class="label">Cliente</div><div class="value">${textoHtml(ordem.clientes?.nome || "-")}</div></div>
    <div><div class="label">Documento/Contato</div><div class="value">${textoHtml(ordem.clientes?.cpf_cnpj || ordem.clientes?.whatsapp || "-")}</div></div>
    <div><div class="label">Equipamento</div><div class="value">${textoHtml([ordem.tipo_equipamento, ordem.marca, ordem.modelo].filter(Boolean).join(" ") || "-")}</div></div>
    <div><div class="label">Número/Série/IMEI</div><div class="value">${textoHtml(ordem.numero_serie || ordem.imei_1 || "-")}</div></div>
    <div><div class="label">Garantia</div><div class="value">${Number(ordem.garantia_dias || 0)} dias</div></div>
    <div><div class="label">Válida até</div><div class="value">${validade.toLocaleDateString("pt-BR")}</div></div>
  </div></div>
  <div class="section"><h2>CONDIÇÕES</h2><div class="text">${textoHtml(condicoesGarantia)}</div></div>
  <div class="section"><h2>SERVIÇO / SOLUÇÃO</h2><div class="text">${textoHtml(ordem.solucao || ordem.diagnostico || "-")}</div></div>
  <div class="sign"><div class="line">Cliente</div><div class="line">Responsável Técnico</div></div>
</div>
<script>window.print();</script>
</body>
</html>`;

    const janela = window.open("", "_blank", "width=900,height=1000");
    if (!janela) return;
    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }


  useEffect(() => {
    carregarDados();
  }, []);

  return {
    ordens,
    clientes,
    produtos,
    servicos,
    equipamentosCliente,
    carregando,
    salvando,
    gerandoOrcamento,
    enviandoPdv,
    ordemEditando,
    modalHistorico,
    ordemHistorico,
    historicoOS,
    carregandoHistorico,
    setModalHistorico,
    segmentoEmpresa,
    segmentoNome,
    dadosSegmento,
    setDadosSegmento,
    checklistAtual,
    checklistMarcado,
    setChecklistMarcado,
    fotosOS,
    adicionarFotoOS,
    removerFotoOS,
    pesquisa,
    setPesquisa,
    filtroStatus,
    setFiltroStatus,
    modalNova,
    setModalNova,
    clienteId,
    setClienteId,
    clientePesquisa,
    setClientePesquisa,
    equipamentoId,
    equipamentoNome,
    equipamentoBusca,
    setEquipamentoBusca,
    tipoEquipamento,
    setTipoEquipamento,
    marca,
    setMarca,
    modelo,
    setModelo,
    numeroSerie,
    setNumeroSerie,
    defeitoRelatado,
    setDefeitoRelatado,
    acessoriosDeixados,
    setAcessoriosDeixados,
    diagnostico,
    setDiagnostico,
    solucao,
    setSolucao,
    observacoesTecnicas,
    setObservacoesTecnicas,
    prioridade,
    setPrioridade,
    status,
    setStatus,
    dataPrevisao,
    setDataPrevisao,
    garantiaDias,
    setGarantiaDias,
    desconto,
    setDesconto,
    observacao,
    setObservacao,
    produtoBusca,
    setProdutoBusca,
    servicoBusca,
    setServicoBusca,
    itensProdutos,
    itensServicos,
    statusOptions,
    clientesBusca,
    produtosBusca,
    servicosBusca,
    ordensFiltradas,
    totalAberto,
    carregarDados,
    abrirNovaOS,
    abrirEdicaoOS,
    dinheiro,
    numero,
    dataBR,
    numOS,
    statusLabel,
    statusClasse,
    totalProdutos,
    totalServicos,
    totalOS,
    addProduto,
    addServico,
    addServicoManual,
    updProduto,
    updServico,
    removerProduto,
    removerServico,
    salvarOS,
    alterarStatus,
    carregarHistoricoOS,
    fecharHistoricoOS,
    gerarOrcamento,
    enviarWhatsApp,
    copiarLinkOS,
    enviarParaPdv,
    aprovarOrcamentoCliente,
    recusarOrcamentoCliente,
    enviarWhatsAppAprovacao,
    notificarEquipamentoPronto,
    registrarEntregaOS,
    imprimirComprovanteEntrega,
    imprimirTermoGarantia,
    imprimir,
    selecionarEquipamento,
    carregarEquipamentosDoCliente,
  };
}

export type OrdemServicoHook = ReturnType<typeof useOrdemServico>;
