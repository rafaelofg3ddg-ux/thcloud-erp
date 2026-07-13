"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Edit,
  Eye,
  Filter,
  History,
  KeyRound,
  LogIn,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Unlock,
  X,
  XCircle,
  Activity,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { formatarData } from "../../../components/global/THFormat";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  cidade: string | null;
  estado: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  status_assinatura: string | null;
  data_inicio_assinatura: string | null;
  data_vencimento_assinatura: string | null;
  observacoes: string | null;
  created_at: string | null;
  ultimo_acesso: string | null;
  ultima_venda: string | null;
  onboarding_concluido: boolean | null;
  etapa_onboarding: number | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_delivery: boolean | null;
  modulo_crm: boolean | null;
  modulo_relatorios_premium: boolean | null;
  modulo_multiloja: boolean | null;
};

type Plano = {
  id: string;
  nome: string;
  valor_mensal: number | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_delivery: boolean | null;
  modulo_crm: boolean | null;
  modulo_relatorios_premium: boolean | null;
  modulo_multiloja: boolean | null;
};

type Historico = {
  id: string;
  empresa_id: string | null;
  acao: string | null;
  descricao: string | null;
  usuario: string | null;
  created_at: string | null;
};

type UsuarioAdmin = {
  id: string;
  empresa_id: string | null;
  nome: string | null;
  email: string | null;
  usuario: string | null;
  perfil: string | null;
  ativo: boolean | null;
  ultimo_acesso: string | null;
};

type FormEmpresa = {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  email: string;
  telefone: string;
  celular: string;
  cidade: string;
  estado: string;
  plano: string;
  valor_mensal: string;
  status_assinatura: string;
  data_inicio_assinatura: string;
  data_vencimento_assinatura: string;
  ativo: boolean;
  observacoes: string;
  modulo_fiscal: boolean;
  modulo_whatsapp: boolean;
  modulo_delivery: boolean;
  modulo_crm: boolean;
  modulo_relatorios_premium: boolean;
  modulo_multiloja: boolean;
};

const FORM_VAZIO: FormEmpresa = {
  id: "",
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  email: "",
  telefone: "",
  celular: "",
  cidade: "",
  estado: "",
  plano: "Básico",
  valor_mensal: "99.90",
  status_assinatura: "Ativo",
  data_inicio_assinatura: "",
  data_vencimento_assinatura: "",
  ativo: true,
  observacoes: "",
  modulo_fiscal: false,
  modulo_whatsapp: false,
  modulo_delivery: false,
  modulo_crm: false,
  modulo_relatorios_premium: false,
  modulo_multiloja: false,
};

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [usuariosAdmin, setUsuariosAdmin] = useState<UsuarioAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPlano, setFiltroPlano] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [visualizando, setVisualizando] = useState<Empresa | null>(null);
  const [empresaHistorico, setEmpresaHistorico] = useState<Empresa | null>(null);
  const [form, setForm] = useState<FormEmpresa>(FORM_VAZIO);

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function adicionarDias(dias: number) {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  }

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function nomeEmpresa(empresa: Empresa) {
    return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
  }

  function usuarioAtual() {
    try {
      const storage =
        sessionStorage.getItem("th_usuario") || localStorage.getItem("th_usuario");

      if (!storage) return "Super Admin";

      const usuario = JSON.parse(storage);
      return usuario?.nome || usuario?.email || "Super Admin";
    } catch {
      return "Super Admin";
    }
  }

  function normalizarStatus(status: string | null) {
    const valor = String(status || "Ativo").toLowerCase();

    if (valor === "ativa") return "Ativo";
    if (valor === "ativo") return "Ativo";
    if (valor === "teste") return "Teste";
    if (valor === "vencido" || valor === "vencida") return "Vencido";
    if (valor === "bloqueado" || valor === "bloqueada") return "Bloqueado";
    if (valor === "cancelado" || valor === "cancelada") return "Cancelado";
    if (valor === "suspenso" || valor === "suspensa") return "Suspenso";

    return status || "Ativo";
  }

  function estaVencida(empresa: Empresa) {
    if (normalizarStatus(empresa.status_assinatura) === "Vencido") return true;
    if (!empresa.data_vencimento_assinatura) return false;

    return empresa.data_vencimento_assinatura < hojeISO();
  }

  function venceEmBreve(empresa: Empresa) {
    if (!empresa.data_vencimento_assinatura) return false;
    if (estaVencida(empresa)) return false;

    const hoje = hojeISO();
    const limite = adicionarDias(7);

    return (
      empresa.data_vencimento_assinatura >= hoje &&
      empresa.data_vencimento_assinatura <= limite
    );
  }

  function statusReal(empresa: Empresa) {
    if (empresa.ativo === false) return "Bloqueado";
    if (estaVencida(empresa)) return "Vencido";
    if (venceEmBreve(empresa)) return "Vencendo";
    return normalizarStatus(empresa.status_assinatura);
  }

  function quantidadeModulos(empresa: Empresa) {
    return [
      empresa.modulo_fiscal,
      empresa.modulo_whatsapp,
      empresa.modulo_delivery,
      empresa.modulo_crm,
      empresa.modulo_relatorios_premium,
      empresa.modulo_multiloja,
    ].filter(Boolean).length;
  }

  function formatarDataHora(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function diasDesde(data: string | null) {
    if (!data) return 9999;

    const origem = new Date(data);
    const agora = new Date();
    const diferenca = agora.getTime() - origem.getTime();

    return Math.floor(diferenca / (1000 * 60 * 60 * 24));
  }

  function onboardingTexto(empresa: Empresa) {
    if (empresa.onboarding_concluido) return "Concluído";
    const etapa = Number(empresa.etapa_onboarding || 0);
    if (etapa > 0) return `Etapa ${etapa}/5`;
    return "Não iniciado";
  }

  function saudeEmpresa(empresa: Empresa) {
    const status = statusReal(empresa);
    const diasSemAcesso = diasDesde(empresa.ultimo_acesso);

    if (status === "Bloqueado" || status === "Vencido" || diasSemAcesso > 30) {
      return "Crítica";
    }

    if (!empresa.onboarding_concluido || status === "Vencendo" || diasSemAcesso > 15 || !empresa.ultima_venda) {
      return "Atenção";
    }

    return "Saudável";
  }

  function usuariosDaEmpresa(empresaId: string) {
    return usuariosAdmin.filter((usuario) => usuario.empresa_id === empresaId);
  }

  function adminPrincipal(empresaId: string) {
    return (
      usuariosDaEmpresa(empresaId).find((usuario) =>
        String(usuario.perfil || "").toLowerCase().includes("admin")
      ) || usuariosDaEmpresa(empresaId)[0]
    );
  }

  async function registrarHistorico(
    empresaId: string,
    acao: string,
    descricao: string
  ) {
    try {
      await supabase.from("historico_empresas").insert([
        {
          empresa_id: empresaId,
          acao,
          descricao,
          usuario: usuarioAtual(),
        },
      ]);
    } catch {}
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: empresasData, error: empresasError } = await supabase
      .from("empresas")
      .select(
        "id,nome_fantasia,razao_social,cnpj,email,telefone,celular,cidade,estado,ativo,plano,valor_mensal,status_assinatura,data_inicio_assinatura,data_vencimento_assinatura,observacoes,created_at,ultimo_acesso,ultima_venda,onboarding_concluido,etapa_onboarding,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja"
      )
      .order("created_at", { ascending: false });

    if (empresasError) {
      setCarregando(false);
      alert("Erro ao carregar empresas SaaS: " + empresasError.message);
      return;
    }

    setEmpresas((empresasData || []) as Empresa[]);

    const { data: planosData } = await supabase
      .from("planos_saas")
      .select(
        "id,nome,valor_mensal,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja"
      )
      .eq("ativo", true)
      .order("valor_mensal", { ascending: true });

    setPlanos((planosData || []) as Plano[]);

    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id,empresa_id,nome,email,usuario,perfil,ativo,ultimo_acesso")
      .order("nome", { ascending: true });

    setUsuariosAdmin((usuariosData || []) as UsuarioAdmin[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const empresasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return empresas.filter((empresa) => {
      const texto = `${nomeEmpresa(empresa)} ${empresa.cnpj || ""} ${empresa.email || ""} ${empresa.telefone || ""} ${empresa.celular || ""} ${empresa.cidade || ""} ${empresa.estado || ""}`.toLowerCase();

      const passaBusca = !termo || texto.includes(termo);
      const passaPlano = filtroPlano === "Todos" || empresa.plano === filtroPlano;
      const passaStatus =
        filtroStatus === "Todos" || statusReal(empresa) === filtroStatus;

      return passaBusca && passaPlano && passaStatus;
    });
  }, [empresas, busca, filtroStatus, filtroPlano]);

  const totalEmpresas = empresas.length;
  const empresasAtivas = empresas.filter(
    (empresa) => empresa.ativo !== false && !estaVencida(empresa)
  ).length;
  const empresasTeste = empresas.filter(
    (empresa) => statusReal(empresa) === "Teste"
  ).length;
  const empresasBloqueadas = empresas.filter(
    (empresa) => empresa.ativo === false
  ).length;
  const empresasVencidas = empresas.filter((empresa) => estaVencida(empresa)).length;
  const empresasVencendo = empresas.filter((empresa) => venceEmBreve(empresa)).length;
  const onboardingConcluido = empresas.filter((empresa) => empresa.onboarding_concluido).length;
  const onboardingPendente = empresas.filter((empresa) => !empresa.onboarding_concluido).length;
  const semAcesso7Dias = empresas.filter((empresa) => diasDesde(empresa.ultimo_acesso) > 7).length;
  const semAcesso30Dias = empresas.filter((empresa) => diasDesde(empresa.ultimo_acesso) > 30).length;
  const receitaMensal = empresas
    .filter((empresa) => empresa.ativo !== false && !estaVencida(empresa))
    .reduce((total, empresa) => total + Number(empresa.valor_mensal || 0), 0);

  function aplicarPlano(nomePlano: string) {
    const plano = planos.find((item) => item.nome === nomePlano);

    setForm((atual) => ({
      ...atual,
      plano: nomePlano,
      valor_mensal: plano?.valor_mensal ? String(plano.valor_mensal) : atual.valor_mensal,
      modulo_fiscal: plano?.modulo_fiscal === true,
      modulo_whatsapp: plano?.modulo_whatsapp === true,
      modulo_delivery: plano?.modulo_delivery === true,
      modulo_crm: plano?.modulo_crm === true,
      modulo_relatorios_premium: plano?.modulo_relatorios_premium === true,
      modulo_multiloja: plano?.modulo_multiloja === true,
    }));
  }

  function abrirNovaEmpresa() {
    setForm({
      ...FORM_VAZIO,
      data_inicio_assinatura: hojeISO(),
      data_vencimento_assinatura: adicionarDias(30),
    });
    setVisualizando(null);
    setModalAberto(true);
  }

  function editarEmpresa(empresa: Empresa) {
    setForm({
      id: empresa.id,
      nome_fantasia: empresa.nome_fantasia || "",
      razao_social: empresa.razao_social || "",
      cnpj: empresa.cnpj || "",
      email: empresa.email || "",
      telefone: empresa.telefone || "",
      celular: empresa.celular || "",
      cidade: empresa.cidade || "",
      estado: empresa.estado || "",
      plano: empresa.plano || "Básico",
      valor_mensal: String(empresa.valor_mensal || 0),
      status_assinatura: normalizarStatus(empresa.status_assinatura),
      data_inicio_assinatura: empresa.data_inicio_assinatura || hojeISO(),
      data_vencimento_assinatura:
        empresa.data_vencimento_assinatura || adicionarDias(30),
      ativo: empresa.ativo !== false,
      observacoes: empresa.observacoes || "",
      modulo_fiscal: empresa.modulo_fiscal === true,
      modulo_whatsapp: empresa.modulo_whatsapp === true,
      modulo_delivery: empresa.modulo_delivery === true,
      modulo_crm: empresa.modulo_crm === true,
      modulo_relatorios_premium: empresa.modulo_relatorios_premium === true,
      modulo_multiloja: empresa.modulo_multiloja === true,
    });

    setVisualizando(null);
    setModalAberto(true);
  }

  function alterarCampo(campo: keyof FormEmpresa, valor: string | boolean) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarEmpresa() {
    if (!form.nome_fantasia.trim() && !form.razao_social.trim()) {
      alert("Informe o nome fantasia ou razão social.");
      return;
    }

    setSalvando(true);

    const dadosCadastrais = {
      nome_fantasia: form.nome_fantasia.trim(),
      razao_social: form.razao_social.trim(),
      cnpj: form.cnpj.trim(),
      email: form.email.trim(),
      telefone: form.telefone.trim(),
      celular: form.celular.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase(),
      observacoes: form.observacoes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const dadosNovaEmpresa = {
      ...dadosCadastrais,
      plano: "Básico",
      valor_mensal: 0,
      status_assinatura: "Teste",
      data_inicio_assinatura: hojeISO(),
      data_vencimento_assinatura: adicionarDias(7),
      ativo: true,
      onboarding_concluido: false,
      etapa_onboarding: 0,
      modulo_fiscal: false,
      modulo_whatsapp: false,
      modulo_delivery: false,
      modulo_crm: false,
      modulo_relatorios_premium: false,
      modulo_multiloja: false,
    };

    let resultado;
    let empresaId = form.id;

    if (form.id) {
      resultado = await supabase.from("empresas").update(dadosCadastrais).eq("id", form.id);
    } else {
      resultado = await supabase.from("empresas").insert([dadosNovaEmpresa]).select("id").single();
    }

    setSalvando(false);

    if (resultado.error) {
      alert("Erro ao salvar empresa: " + resultado.error.message);
      return;
    }

    if (!empresaId && resultado.data?.id) empresaId = resultado.data.id;

    if (empresaId) {
      await registrarHistorico(
        empresaId,
        form.id ? "Empresa atualizada" : "Empresa criada",
        form.id ? "Dados cadastrais atualizados no Super Admin." : "Empresa cadastrada e enviada para provisionamento/onboarding inicial."
      );

      if (!form.id) {
        try {
          const provisionamento = await fetch("/api/saas/provisionar-empresa", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              empresa_id: empresaId,
              nome_admin:
                form.nome_fantasia || form.razao_social || "Administrador",
              email_admin: form.email,
              usuario_admin: form.email || form.cnpj.replace(/\D/g, ""),
            }),
          });

          const resultadoProvisionamento = await provisionamento.json();

          if (resultadoProvisionamento.ok) {
            alert(
              `Empresa cadastrada e provisionada com sucesso!\n\nLogin: ${resultadoProvisionamento.login}\nSenha: ${resultadoProvisionamento.senha}`
            );
          } else {
            alert(
              `Empresa salva, mas houve erro ao provisionar usuário: ${resultadoProvisionamento.erro || "Erro desconhecido."}`
            );
          }
        } catch (erro) {
          console.error("Erro ao provisionar empresa", erro);
          alert("Empresa salva, mas houve erro ao provisionar o usuário administrador.");
        }
      }
    }

    setModalAberto(false);
    await carregarDados();
  }

  async function bloquearLiberar(empresa: Empresa) {
    const liberar = empresa.ativo === false;

    if (
      !confirm(
        liberar
          ? "Deseja liberar o acesso desta empresa?"
          : "Deseja bloquear o acesso desta empresa?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: liberar,
        status_assinatura: liberar ? "Ativo" : "Bloqueado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    await registrarHistorico(
      empresa.id,
      liberar ? "Empresa liberada" : "Empresa bloqueada",
      liberar
        ? "Acesso da empresa liberado pelo Super Admin."
        : "Acesso da empresa bloqueado pelo Super Admin."
    );

    await carregarDados();
  }

  async function renovar30Dias(empresa: Empresa) {
    if (!confirm("Renovar assinatura por mais 30 dias?")) return;

    const base =
      empresa.data_vencimento_assinatura &&
      empresa.data_vencimento_assinatura > hojeISO()
        ? new Date(empresa.data_vencimento_assinatura + "T00:00:00")
        : new Date();

    base.setDate(base.getDate() + 30);

    const novoVencimento = base.toISOString().split("T")[0];

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: true,
        status_assinatura: "Ativo",
        data_vencimento_assinatura: novoVencimento,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao renovar assinatura: " + error.message);
      return;
    }

    await registrarHistorico(
      empresa.id,
      "Assinatura renovada",
      `Assinatura renovada por 30 dias. Novo vencimento: ${formatarData(novoVencimento)}.`
    );

    await carregarDados();
  }

  async function resetarSenhaAdmin(empresa: Empresa) {
    const admin = adminPrincipal(empresa.id);

    if (!admin) {
      alert("Nenhum usuário administrador encontrado para esta empresa.");
      return;
    }

    const novaSenha = `TH@${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

    if (!confirm(`Resetar senha do administrador ${admin.nome || admin.email || admin.usuario}?\n\nNova senha: ${novaSenha}`)) return;

    const { error: erroSenha } = await supabase.rpc("definir_senha", {
      p_usuario_id: admin.id,
      p_senha_nova: novaSenha,
    });

    if (erroSenha) {
      alert("Erro ao resetar senha: " + erroSenha.message);
      return;
    }

    const { error } = await supabase
      .from("usuarios")
      .update({
        resetar_senha_proximo_login: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id);

    if (error) {
      alert("Erro ao resetar senha: " + error.message);
      return;
    }

    await registrarHistorico(
      empresa.id,
      "Senha resetada",
      `Senha do administrador ${admin.nome || admin.email || admin.usuario} foi resetada pelo Super Admin.`
    );

    alert(`Senha resetada com sucesso!\n\nLogin: ${admin.email || admin.usuario}\nNova senha: ${novaSenha}`);
    await carregarDados();
  }

  async function entrarComoCliente(empresa: Empresa) {
    const admin = adminPrincipal(empresa.id);

    if (!admin) {
      alert("Nenhum usuário administrador encontrado para esta empresa.");
      return;
    }

    if (!confirm(`Entrar no sistema como ${nomeEmpresa(empresa)}?`)) return;

    const usuarioSessao = {
      id: admin.id,
      nome: admin.nome || admin.email || admin.usuario || "Administrador",
      email: admin.email || "",
      usuario: admin.usuario || "",
      perfil: admin.perfil || "Admin",
      empresa_id: empresa.id,
      empresa_nome: nomeEmpresa(empresa),
      plano: empresa.plano || "Básico",
      acesso_suporte: true,
      super_admin_impersonando: true,
    };

    const empresaSessao = {
      id: empresa.id,
      empresa_id: empresa.id,
      nome: nomeEmpresa(empresa),
      nome_fantasia: empresa.nome_fantasia || nomeEmpresa(empresa),
      razao_social: empresa.razao_social || nomeEmpresa(empresa),
      plano: empresa.plano || "Básico",
      ativo: empresa.ativo !== false,
      status_assinatura: empresa.status_assinatura || "Ativo",
    };

    sessionStorage.setItem("th_usuario", JSON.stringify(usuarioSessao));
    sessionStorage.setItem("th_empresa", JSON.stringify(empresaSessao));
    localStorage.setItem("th_usuario", JSON.stringify(usuarioSessao));
    localStorage.setItem("th_empresa", JSON.stringify(empresaSessao));
    localStorage.setItem("empresa_id", empresa.id);
    localStorage.setItem("th_empresa_id", empresa.id);

    await registrarHistorico(
      empresa.id,
      "Acesso suporte",
      "Super Admin entrou no ambiente da empresa para suporte/implantação."
    );

    window.location.href = "/dashboard";
  }

  async function abrirHistorico(empresa: Empresa) {
    setEmpresaHistorico(empresa);
    setModalHistorico(true);
    setHistorico([]);

    const { data, error } = await supabase
      .from("historico_empresas")
      .select("id,empresa_id,acao,descricao,usuario,created_at")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar histórico: " + error.message);
      return;
    }

    setHistorico((data || []) as Historico[]);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>

            <h1 className="text-3xl lg:text-4xl font-black mt-2">
              Empresas SaaS
            </h1>

            <p className="mt-2 text-blue-100 max-w-4xl">
              Cadastre, edite, bloqueie, libere e acompanhe seus clientes do Th Cloud.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={carregarDados}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>

            <button
              onClick={abrirNovaEmpresa}
              className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Nova Empresa
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-4">
        <Card titulo="Total" valor={`${totalEmpresas}`} detalhe="Empresas cadastradas" cor="text-blue-700" icone={<Building2 size={22} />} />
        <Card titulo="Ativas" valor={`${empresasAtivas}`} detalhe="Clientes liberados" cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Teste" valor={`${empresasTeste}`} detalhe="Período experimental" cor="text-cyan-700" icone={<Clock size={22} />} />
        <Card titulo="Bloqueadas" valor={`${empresasBloqueadas}`} detalhe="Acesso suspenso" cor="text-red-700" icone={<XCircle size={22} />} />
        <Card titulo="Vencendo" valor={`${empresasVencendo}`} detalhe="Próximos 7 dias" cor="text-orange-700" icone={<ShieldAlert size={22} />} />
        <Card titulo="MRR" valor={moeda(receitaMensal)} detalhe="Receita mensal" cor="text-purple-700" icone={<CircleDollarSign size={22} />} />
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card titulo="Onboarding OK" valor={`${onboardingConcluido}`} detalhe="Implantação concluída" cor="text-green-700" icone={<Activity size={22} />} />
        <Card titulo="Onboarding pendente" valor={`${onboardingPendente}`} detalhe="Aguardando implantação" cor="text-orange-700" icone={<ShieldAlert size={22} />} />
        <Card titulo="Sem acesso 7 dias" valor={`${semAcesso7Dias}`} detalhe="Baixo engajamento" cor="text-yellow-700" icone={<Clock size={22} />} />
        <Card titulo="Sem acesso 30 dias" valor={`${semAcesso30Dias}`} detalhe="Risco de churn" cor="text-red-700" icone={<XCircle size={22} />} />
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por empresa, CNPJ, e-mail, telefone ou cidade..."
              className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todos</option>
            <option>Ativo</option>
            <option>Teste</option>
            <option>Vencendo</option>
            <option>Vencido</option>
            <option>Bloqueado</option>
            <option>Cancelado</option>
            <option>Suspenso</option>
          </select>

          <select
            value={filtroPlano}
            onChange={(e) => setFiltroPlano(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todos</option>
            {planos.map((plano) => (
              <option key={plano.id}>{plano.nome}</option>
            ))}
            {planos.length === 0 && (
              <>
                <option>Básico</option>
                <option>Profissional</option>
                <option>Premium</option>
                <option>Enterprise</option>
              </>
            )}
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} />
          {empresasFiltradas.length} empresa(s) encontrada(s)
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Plano</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Onboarding</th>
                <th className="p-4 text-left">Último Acesso</th>
                <th className="p-4 text-left">Última Venda</th>
                <th className="p-4 text-left">Mensalidade</th>
                <th className="p-4 text-left">Saúde</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Carregando empresas...
                  </td>
                </tr>
              )}

              {!carregando &&
                empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-950">{nomeEmpresa(empresa)}</p>
                      <p className="text-xs text-slate-500">{empresa.razao_social || "-"}</p>
                      <p className="text-xs text-blue-700 font-bold">{empresa.cnpj || "Sem CNPJ"}</p>
                    </td>

                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black">
                        {empresa.plano || "Básico"}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {quantidadeModulos(empresa)} módulo(s)
                      </p>
                    </td>

                    <td className="p-4">
                      <StatusBadge status={statusReal(empresa)} />
                      <p className="text-xs text-slate-500 mt-1">
                        Vence: {formatarData(empresa.data_vencimento_assinatura)}
                      </p>
                    </td>

                    <td className="p-4">
                      <OnboardingBadge texto={onboardingTexto(empresa)} concluido={empresa.onboarding_concluido === true} />
                      <p className="text-xs text-slate-500 mt-1">
                        Etapa {Number(empresa.etapa_onboarding || 0)}/5
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {formatarDataHora(empresa.ultimo_acesso)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {diasDesde(empresa.ultimo_acesso) >= 9999
                          ? "Nunca acessou"
                          : `${diasDesde(empresa.ultimo_acesso)} dia(s)`}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {formatarDataHora(empresa.ultima_venda)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {empresa.ultima_venda ? "Venda registrada" : "Sem venda"}
                      </p>
                    </td>

                    <td className="p-4 font-black text-purple-700">
                      {moeda(Number(empresa.valor_mensal || 0))}
                    </td>

                    <td className="p-4">
                      <SaudeBadge saude={saudeEmpresa(empresa)} />
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <BotaoAcao cor="green" titulo="Entrar como cliente" onClick={() => entrarComoCliente(empresa)}>
                          <LogIn size={17} />
                        </BotaoAcao>

                        <BotaoAcao cor="purple" titulo="Resetar senha Admin" onClick={() => resetarSenhaAdmin(empresa)}>
                          <KeyRound size={17} />
                        </BotaoAcao>

                        <BotaoAcao cor="slate" titulo="Visualizar" onClick={() => setVisualizando(empresa)}>
                          <Eye size={17} />
                        </BotaoAcao>

                        <BotaoAcao cor="blue" titulo="Editar" onClick={() => editarEmpresa(empresa)}>
                          <Edit size={17} />
                        </BotaoAcao>

                        <BotaoAcao cor="green" titulo="Renovar 30 dias" onClick={() => renovar30Dias(empresa)}>
                          <CheckCircle2 size={17} />
                        </BotaoAcao>

                        <BotaoAcao cor="purple" titulo="Histórico" onClick={() => abrirHistorico(empresa)}>
                          <History size={17} />
                        </BotaoAcao>

                        <BotaoAcao
                          cor={empresa.ativo === false ? "green" : "red"}
                          titulo={empresa.ativo === false ? "Liberar" : "Bloquear"}
                          onClick={() => bloquearLiberar(empresa)}
                        >
                          {empresa.ativo === false ? <Unlock size={17} /> : <Lock size={17} />}
                        </BotaoAcao>
                      </div>
                    </td>
                  </tr>
                ))}

              {!carregando && empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-[30px]">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {form.id ? "Editar Empresa SaaS" : "Nova Empresa SaaS"}
                </h2>
                <p className="text-slate-500">
                  Dados cadastrais da empresa. A assinatura e os módulos serão liberados depois no menu Assinaturas.
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 lg:p-6 space-y-6">
              <div>
                <h3 className="font-black text-slate-900 mb-3">Dados da empresa</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nome fantasia" value={form.nome_fantasia} onChange={(v) => alterarCampo("nome_fantasia", v)} />
                  <Input label="Razão social" value={form.razao_social} onChange={(v) => alterarCampo("razao_social", v)} />
                  <Input label="CPF/CNPJ" value={form.cnpj} onChange={(v) => alterarCampo("cnpj", v)} />
                  <Input label="E-mail" value={form.email} onChange={(v) => alterarCampo("email", v)} />
                  <Input label="Telefone" value={form.telefone} onChange={(v) => alterarCampo("telefone", v)} />
                  <Input label="Celular/WhatsApp" value={form.celular} onChange={(v) => alterarCampo("celular", v)} />

                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <Input label="Cidade" value={form.cidade} onChange={(v) => alterarCampo("cidade", v)} />
                    <Input label="UF" value={form.estado} onChange={(v) => alterarCampo("estado", v)} />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="font-black text-blue-950 mb-2">Provisionamento inicial</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Ao salvar, a empresa será criada e provisionada para fazer o primeiro acesso.
                  O cliente será direcionado para o onboarding inicial. A assinatura, mensalidade,
                  vencimento e módulos contratados serão liberados depois no menu Assinaturas SaaS.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-black text-slate-800">Observações internas</span>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => alterarCampo("observacoes", e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
                />
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 flex flex-col sm:flex-row gap-3 justify-end rounded-b-[30px]">
              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
              >
                Cancelar
              </button>

              <button
                onClick={salvarEmpresa}
                disabled={salvando}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black disabled:opacity-60"
              >
                {salvando ? "Salvando..." : form.id ? "Salvar Alterações" : "Cadastrar e Provisionar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {visualizando && (
        <ModalVisualizacao
          empresa={visualizando}
          nomeEmpresa={nomeEmpresa}
          statusReal={statusReal}
          quantidadeModulos={quantidadeModulos}
          moeda={moeda}
          formatarData={formatarData}
          formatarDataHora={formatarDataHora}
          saudeEmpresa={saudeEmpresa}
          onClose={() => setVisualizando(null)}
          onEditar={() => {
            const empresa = visualizando;
            setVisualizando(null);
            editarEmpresa(empresa);
          }}
        />
      )}

      {modalHistorico && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="bg-slate-950 text-white p-6 flex items-center justify-between">
              <div>
                <p className="text-blue-200 font-bold">Histórico da empresa</p>
                <h2 className="text-2xl font-black">
                  {empresaHistorico ? nomeEmpresa(empresaHistorico) : "-"}
                </h2>
              </div>

              <button
                onClick={() => setModalHistorico(false)}
                className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3">
              {historico.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-black text-slate-900">{item.acao || "-"}</p>
                  <p className="text-sm text-slate-600 mt-1">{item.descricao || "-"}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {item.usuario || "-"} • {item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "-"}
                  </p>
                </div>
              ))}

              {historico.length === 0 && (
                <div className="text-center text-slate-500 p-8">
                  Nenhum histórico encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  titulo,
  valor,
  detalhe,
  cor,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  cor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-500">{titulo}</p>
        <div className={`${cor} bg-slate-50 border border-slate-100 rounded-2xl p-2`}>
          {icone}
        </div>
      </div>
      <h2 className={`text-2xl font-black mt-3 ${cor}`}>{valor}</h2>
      <p className="text-xs text-slate-500 mt-1">{detalhe}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classe =
    status === "Ativo"
      ? "bg-green-100 text-green-700"
      : status === "Teste"
      ? "bg-cyan-100 text-cyan-700"
      : status === "Vencendo"
      ? "bg-orange-100 text-orange-700"
      : status === "Vencido"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>{status}</span>;
}

function BotaoAcao({
  children,
  onClick,
  titulo,
  cor,
}: {
  children: React.ReactNode;
  onClick: () => void;
  titulo: string;
  cor: "slate" | "blue" | "green" | "red" | "purple";
}) {
  const classes = {
    slate: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    green: "bg-green-50 hover:bg-green-100 text-green-700",
    red: "bg-red-50 hover:bg-red-100 text-red-700",
    purple: "bg-purple-50 hover:bg-purple-100 text-purple-700",
  };

  return (
    <button
      onClick={onClick}
      className={`h-10 w-10 rounded-xl flex items-center justify-center ${classes[cor]}`}
      title={titulo}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
      />
    </label>
  );
}

function CheckModulo({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition ${
        checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" />
      <div>
        <p className="font-black text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">Liberar para esta empresa</p>
      </div>
    </label>
  );
}

function ModalVisualizacao({
  empresa,
  nomeEmpresa,
  statusReal,
  quantidadeModulos,
  moeda,
  formatarData,
  formatarDataHora,
  saudeEmpresa,
  onClose,
  onEditar,
}: {
  empresa: Empresa;
  nomeEmpresa: (empresa: Empresa) => string;
  statusReal: (empresa: Empresa) => string;
  quantidadeModulos: (empresa: Empresa) => number;
  moeda: (valor: number) => string;
  formatarData: (data: string | null) => string;
  formatarDataHora: (data: string | null) => string;
  saudeEmpresa: (empresa: Empresa) => string;
  onClose: () => void;
  onEditar: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="bg-slate-950 text-white p-6 flex items-center justify-between">
          <div>
            <p className="text-blue-200 font-bold">Detalhes da empresa</p>
            <h2 className="text-2xl font-black">{nomeEmpresa(empresa)}</h2>
          </div>

          <button
            onClick={onClose}
            className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Info label="CNPJ" value={empresa.cnpj || "-"} />
          <Info label="E-mail" value={empresa.email || "-"} />
          <Info label="Telefone" value={empresa.telefone || empresa.celular || "-"} />
          <Info label="Cidade/UF" value={[empresa.cidade, empresa.estado].filter(Boolean).join(" / ") || "-"} />
          <Info label="Plano" value={empresa.plano || "Básico"} />
          <Info label="Mensalidade" value={moeda(Number(empresa.valor_mensal || 0))} />
          <Info label="Status" value={statusReal(empresa)} />
          <Info label="Vencimento" value={formatarData(empresa.data_vencimento_assinatura)} />
          <Info label="Módulos contratados" value={`${quantidadeModulos(empresa)} módulo(s)`} />
          <Info label="Criada em" value={empresa.created_at ? new Date(empresa.created_at).toLocaleString("pt-BR") : "-"} />
          <Info label="Onboarding" value={empresa.onboarding_concluido ? "Concluído" : `Etapa ${Number(empresa.etapa_onboarding || 0)}/5`} />
          <Info label="Último acesso" value={formatarDataHora(empresa.ultimo_acesso)} />
          <Info label="Última venda" value={formatarDataHora(empresa.ultima_venda)} />
          <Info label="Saúde" value={saudeEmpresa(empresa)} />
          <Info label="Observações" value={empresa.observacoes || "-"} />
        </div>

        <div className="p-6 border-t flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onEditar}
            className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black"
          >
            Editar
          </button>

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function SaudeBadge({ saude }: { saude: string }) {
  const classe =
    saude === "Saudável"
      ? "bg-green-100 text-green-700"
      : saude === "Atenção"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  const simbolo = saude === "Saudável" ? "🟢" : saude === "Atenção" ? "🟡" : "🔴";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>
      {simbolo} {saude}
    </span>
  );
}

function OnboardingBadge({
  texto,
  concluido,
}: {
  texto: string;
  concluido: boolean;
}) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-black ${
        concluido
          ? "bg-green-100 text-green-700"
          : "bg-orange-100 text-orange-700"
      }`}
    >
      {concluido ? "✅" : "⚠️"} {texto}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-widest font-black text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900 break-words">{value}</p>
    </div>
  );
}
