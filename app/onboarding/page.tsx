"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Home,
  Loader2,
  Lock,
  PackagePlus,
  Rocket,
  ShoppingCart,
  Store,
  User,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type UsuarioSessao = {
  id: string;
  nome: string;
  email?: string;
  usuario?: string;
  perfil: string;
  empresa_id: string | null;
};

type Empresa = {
  id: string;
  tipo_pessoa: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  cnae: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  segmento: string | null;
  segmento_nome: string | null;
  onboarding_concluido: boolean | null;
  etapa_onboarding: number | null;
};

type UsuarioBanco = {
  id: string;
  nome: string | null;
  email: string | null;
  usuario: string | null;
  resetar_senha_proximo_login: boolean | null;
};

type Formulario = {
  tipo_pessoa: "juridica" | "fisica";
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  cnae: string;
  telefone: string;
  celular: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  admin_nome: string;
  admin_usuario: string;
  admin_email: string;
  nova_senha: string;
  confirmar_senha: string;
  segmento: string;
  segmento_nome: string;
};

const FORM_INICIAL: Formulario = {
  tipo_pessoa: "juridica",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  cpf: "",
  rg: "",
  data_nascimento: "",
  inscricao_estadual: "",
  inscricao_municipal: "",
  cnae: "",
  telefone: "",
  celular: "",
  email: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  admin_nome: "",
  admin_usuario: "",
  admin_email: "",
  nova_senha: "",
  confirmar_senha: "",
  segmento: "comercio_mercado",
  segmento_nome: "Mercado",
};

const segmentos = [
  {
    grupo: "Comércio",
    itens: [
      { codigo: "comercio_mercado", nome: "Mercado", icone: "🛒", descricao: "Vendas, estoque, clientes, caixa e financeiro.", recursos: ["PDV", "Estoque", "Financeiro"] },
      { codigo: "comercio_farmacia", nome: "Farmácia", icone: "💊", descricao: "Produtos, estoque, clientes e controle comercial.", recursos: ["PDV", "Produtos", "Clientes"] },
      { codigo: "comercio_roupas", nome: "Loja de Roupas", icone: "👕", descricao: "Vendas, estoque por produtos, clientes e caixa.", recursos: ["PDV", "Estoque", "Relatórios"] },
      { codigo: "comercio_autopecas", nome: "Auto Peças", icone: "⚙️", descricao: "Venda de peças, estoque, fornecedores e financeiro.", recursos: ["Peças", "Estoque", "PDV"] },
      { codigo: "comercio_material_construcao", nome: "Material de Construção", icone: "🏗️", descricao: "Produtos, estoque, vendas e controle financeiro.", recursos: ["Produtos", "Estoque", "Financeiro"] },
      { codigo: "comercio_distribuidora", nome: "Distribuidora", icone: "📦", descricao: "Pedidos, estoque, clientes e vendas.", recursos: ["Pedidos", "Estoque", "Clientes"] },
    ],
  },
  {
    grupo: "Assistência Técnica",
    itens: [
      { codigo: "loja_celular", nome: "Loja de Celular / Assistência Técnica", icone: "📱", descricao: "OS com IMEI, senha, conta, garantia e checklist do aparelho.", recursos: ["IMEI", "Garantia", "OS"] },
      { codigo: "informatica", nome: "Informática", icone: "💻", descricao: "OS para computadores, notebooks, senha, sistema e peças.", recursos: ["Equipamento", "Senha", "Peças"] },
      { codigo: "refrigeracao", nome: "Refrigeração", icone: "❄️", descricao: "OS para ar-condicionado, BTUs, gás, voltagem e instalação.", recursos: ["BTUs", "Gás", "Instalação"] },
      { codigo: "eletronicos", nome: "Eletrônicos", icone: "📺", descricao: "OS para TV, som, placas, número de série e diagnóstico.", recursos: ["Série", "Diagnóstico", "Garantia"] },
    ],
  },
  {
    grupo: "Oficina",
    itens: [
      { codigo: "oficina_mecanica", nome: "Oficina Mecânica", icone: "🚗", descricao: "OS com veículo, placa, chassi, KM, combustível e checklist.", recursos: ["Placa", "KM", "Checklist"] },
      { codigo: "oficina_moto", nome: "Oficina de Moto", icone: "🏍️", descricao: "OS para motos, placa, KM, peças e serviços.", recursos: ["Placa", "KM", "Peças"] },
      { codigo: "auto_eletrica", nome: "Auto Elétrica", icone: "🔋", descricao: "Serviços elétricos, bateria, alternador e diagnóstico.", recursos: ["Bateria", "Elétrica", "OS"] },
    ],
  },
  {
    grupo: "Alimentação",
    itens: [
      { codigo: "alimentacao_restaurante", nome: "Restaurante", icone: "🍽️", descricao: "Vendas, caixa, clientes, produtos e financeiro.", recursos: ["PDV", "Produtos", "Caixa"] },
      { codigo: "alimentacao_padaria", nome: "Padaria", icone: "🥖", descricao: "PDV, estoque, produtos e vendas rápidas.", recursos: ["PDV", "Estoque", "Vendas"] },
      { codigo: "alimentacao_acougue", nome: "Açougue", icone: "🥩", descricao: "Produtos, vendas, clientes e financeiro.", recursos: ["PDV", "Produtos", "Financeiro"] },
      { codigo: "alimentacao_hortifruti", nome: "Hortifruti", icone: "🥬", descricao: "Produtos, vendas rápidas e controle comercial.", recursos: ["PDV", "Estoque", "Caixa"] },
    ],
  },
  {
    grupo: "Serviços",
    itens: [
      { codigo: "servicos_geral", nome: "Serviços em Geral", icone: "🧰", descricao: "OS genérica para qualquer tipo de prestação de serviço.", recursos: ["OS Geral", "Serviços", "Clientes"] },
      { codigo: "pessoa_fisica", nome: "Pessoa Física", icone: "👤", descricao: "Controle simples para autônomos e pequenos prestadores.", recursos: ["Clientes", "Serviços", "Financeiro"] },
      { codigo: "geral", nome: "Outros", icone: "🏢", descricao: "Configuração geral para outros segmentos.", recursos: ["Geral", "PDV", "Financeiro"] },
    ],
  },
];

function obterNomeSegmento(codigo: string) {
  for (const grupo of segmentos) {
    const item = grupo.itens.find((segmento) => segmento.codigo === codigo);
    if (item) return item.nome;
  }
  return "Geral";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [usuarioBanco, setUsuarioBanco] = useState<UsuarioBanco | null>(null);
  const [form, setForm] = useState<Formulario>(FORM_INICIAL);
  const [passo, setPasso] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  function carregarSessao() {
    try {
      const usuarioStorage = sessionStorage.getItem("th_usuario") || localStorage.getItem("th_usuario");
      if (!usuarioStorage) {
        router.push("/login");
        return null;
      }
      const dados = JSON.parse(usuarioStorage) as UsuarioSessao;
      setUsuario(dados);
      return dados;
    } catch {
      router.push("/login");
      return null;
    }
  }

  async function carregarDados() {
    setCarregando(true);
    const usuarioSessao = carregarSessao();
    if (!usuarioSessao?.empresa_id) {
      setCarregando(false);
      return;
    }

    const { data: empresaData, error: empresaError } = await supabase
      .from("empresas")
      .select("id,tipo_pessoa,razao_social,nome_fantasia,cnpj,cpf,rg,data_nascimento,inscricao_estadual,inscricao_municipal,cnae,telefone,celular,email,cep,endereco,numero,complemento,bairro,cidade,estado,segmento,segmento_nome,onboarding_concluido,etapa_onboarding")
      .eq("id", usuarioSessao.empresa_id)
      .maybeSingle();

    if (empresaError || !empresaData) {
      alert("Erro ao carregar empresa.");
      setCarregando(false);
      return;
    }

    const empresaBanco = empresaData as Empresa;
    setEmpresa(empresaBanco);

    const { data: usuarioData } = await supabase
      .from("usuarios")
      .select("id,nome,email,usuario,resetar_senha_proximo_login")
      .eq("id", usuarioSessao.id)
      .maybeSingle();

    const usuarioBd = usuarioData as UsuarioBanco | null;
    setUsuarioBanco(usuarioBd);

    setForm({
      tipo_pessoa: empresaBanco.tipo_pessoa === "fisica" ? "fisica" : "juridica",
      razao_social: empresaBanco.razao_social || "",
      nome_fantasia: empresaBanco.nome_fantasia || "",
      cnpj: empresaBanco.cnpj || "",
      cpf: empresaBanco.cpf || "",
      rg: empresaBanco.rg || "",
      data_nascimento: empresaBanco.data_nascimento || "",
      inscricao_estadual: empresaBanco.inscricao_estadual || "",
      inscricao_municipal: empresaBanco.inscricao_municipal || "",
      cnae: empresaBanco.cnae || "",
      telefone: empresaBanco.telefone || "",
      celular: empresaBanco.celular || "",
      email: empresaBanco.email || usuarioBd?.email || usuarioSessao.email || "",
      cep: empresaBanco.cep || "",
      endereco: empresaBanco.endereco || "",
      numero: empresaBanco.numero || "",
      complemento: empresaBanco.complemento || "",
      bairro: empresaBanco.bairro || "",
      cidade: empresaBanco.cidade || "",
      estado: empresaBanco.estado || "",
      admin_nome: usuarioBd?.nome || usuarioSessao.nome || "",
      admin_usuario: usuarioBd?.usuario || usuarioSessao.usuario || "",
      admin_email: usuarioBd?.email || usuarioSessao.email || "",
      nova_senha: "",
      confirmar_senha: "",
      segmento: empresaBanco.segmento || "comercio_mercado",
      segmento_nome: empresaBanco.segmento_nome || obterNomeSegmento(empresaBanco.segmento || "comercio_mercado"),
    });

    const etapa = Number(empresaBanco.etapa_onboarding || 0);
    setPasso(empresaBanco.onboarding_concluido ? 5 : etapa > 0 ? etapa : 0);

    if (!empresaBanco.onboarding_concluido && !empresaBanco.etapa_onboarding) {
      await supabase
        .from("empresas")
        .update({ onboarding_iniciado_em: new Date().toISOString(), etapa_onboarding: 0, updated_at: new Date().toISOString() })
        .eq("id", empresaBanco.id);
    }

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function alterar(campo: keyof Formulario, valor: string) {
    if (campo === "segmento") {
      setForm((atual) => ({
        ...atual,
        segmento: valor,
        segmento_nome: obterNomeSegmento(valor),
      }));
      return;
    }

    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function apenasNumeros(valor: string) {
    return valor.replace(/\D/g, "");
  }

  async function consultarCep() {
    const cep = apenasNumeros(form.cep);
    if (cep.length !== 8) {
      alert("Informe um CEP válido com 8 números.");
      return;
    }

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await resposta.json();
      if (dados.erro) {
        alert("CEP não encontrado.");
        return;
      }
      setForm((atual) => ({ ...atual, endereco: dados.logradouro || atual.endereco, bairro: dados.bairro || atual.bairro, cidade: dados.localidade || atual.cidade, estado: dados.uf || atual.estado }));
    } catch {
      alert("Não foi possível consultar o CEP agora.");
    }
  }

  function consultarCpfCnpj() {
    if (form.tipo_pessoa === "fisica") {
      alert("Consulta de CPF automática será conectada futuramente. Preencha os dados manualmente.");
      return;
    }
    alert("Consulta CNPJ/Receita Federal será conectada futuramente. Por enquanto, preencha os dados manualmente.");
  }

  function validarPassoAtual() {
    if (passo === 1) {
      if (form.tipo_pessoa === "juridica") {
        if (!form.razao_social.trim() && !form.nome_fantasia.trim()) {
          alert("Informe a razão social ou nome fantasia.");
          return false;
        }
        if (form.cnpj && apenasNumeros(form.cnpj).length !== 14) {
          alert("CNPJ deve ter 14 números.");
          return false;
        }
      }

      if (form.tipo_pessoa === "fisica") {
        if (!form.nome_fantasia.trim() && !form.razao_social.trim()) {
          alert("Informe o nome completo.");
          return false;
        }
        if (form.cpf && apenasNumeros(form.cpf).length !== 11) {
          alert("CPF deve ter 11 números.");
          return false;
        }
      }
    }

    if (passo === 2 && (!form.cidade.trim() || !form.estado.trim())) {
      alert("Informe cidade e estado.");
      return false;
    }

    if (passo === 3) {
      if (!form.admin_nome.trim()) {
        alert("Informe o nome do administrador.");
        return false;
      }
      if (!form.admin_usuario.trim() && !form.admin_email.trim()) {
        alert("Informe o usuário ou e-mail do administrador.");
        return false;
      }
      if (usuarioBanco?.resetar_senha_proximo_login !== false) {
        if (!form.nova_senha.trim()) {
          alert("Informe a nova senha.");
          return false;
        }
        if (form.nova_senha.length < 6) {
          alert("A nova senha precisa ter pelo menos 6 caracteres.");
          return false;
        }
        if (form.nova_senha !== form.confirmar_senha) {
          alert("A confirmação de senha não confere.");
          return false;
        }
      }
    }

    if (passo === 4 && !form.segmento.trim()) {
      alert("Selecione o segmento.");
      return false;
    }

    return true;
  }

  async function salvarEtapa(proximoPasso: number) {
    if (!empresa || !usuario) return false;
    setSalvando(true);

    const dadosEmpresa = {
      tipo_pessoa: form.tipo_pessoa,
      razao_social: form.tipo_pessoa === "fisica" ? form.razao_social || form.nome_fantasia : form.razao_social,
      nome_fantasia: form.tipo_pessoa === "fisica" ? form.nome_fantasia || form.razao_social : form.nome_fantasia,
      cnpj: form.tipo_pessoa === "juridica" ? form.cnpj.trim() : "",
      cpf: form.tipo_pessoa === "fisica" ? form.cpf.trim() : "",
      rg: form.rg.trim(),
      data_nascimento: form.data_nascimento || null,
      inscricao_estadual: form.inscricao_estadual.trim(),
      inscricao_municipal: form.inscricao_municipal.trim(),
      cnae: form.cnae.trim(),
      telefone: form.telefone.trim(),
      celular: form.celular.trim(),
      email: form.email.trim(),
      cep: form.cep.trim(),
      endereco: form.endereco.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase(),
      segmento: form.segmento,
      segmento_nome: form.segmento_nome || obterNomeSegmento(form.segmento),
      etapa_onboarding: proximoPasso,
      updated_at: new Date().toISOString(),
    };

    const { error: erroEmpresa } = await supabase.from("empresas").update(dadosEmpresa).eq("id", empresa.id);
    if (erroEmpresa) {
      alert("Erro ao salvar empresa: " + erroEmpresa.message);
      setSalvando(false);
      return false;
    }

    const atualizarUsuario: any = {
      nome: form.admin_nome.trim(),
      usuario: form.admin_usuario.trim() || form.admin_email.trim(),
      email: form.admin_email.trim(),
      updated_at: new Date().toISOString(),
    };

    if (passo === 3 && form.nova_senha.trim()) {
      atualizarUsuario.senha = form.nova_senha.trim();
      atualizarUsuario.resetar_senha_proximo_login = false;
    }

    await supabase.from("usuarios").update(atualizarUsuario).eq("id", usuario.id);

    const { data: onboardingExistente } = await supabase.from("onboarding_empresas").select("id").eq("empresa_id", empresa.id).maybeSingle();

    const checklist = {
      empresa_id: empresa.id,
      etapa_atual: proximoPasso,
      dados_identificacao: proximoPasso >= 2,
      dados_endereco: proximoPasso >= 3,
      dados_administrador: proximoPasso >= 4,
      dados_segmento: proximoPasso >= 5,
      senha_alterada: usuarioBanco?.resetar_senha_proximo_login === false || !!form.nova_senha.trim() || proximoPasso >= 4,
      concluido: proximoPasso >= 5,
      updated_at: new Date().toISOString(),
    };

    if (onboardingExistente?.id) {
      await supabase.from("onboarding_empresas").update(checklist).eq("id", onboardingExistente.id);
    } else {
      await supabase.from("onboarding_empresas").insert([checklist]);
    }

    await supabase.from("historico_empresas").insert([{ empresa_id: empresa.id, acao: "Onboarding atualizado", descricao: `Empresa avançou para a etapa ${proximoPasso}/5 do assistente inicial.`, usuario: form.admin_nome || "Administrador" }]);

    const usuarioSessaoAtualizado = { ...usuario, nome: form.admin_nome.trim(), email: form.admin_email.trim(), usuario: form.admin_usuario.trim() || form.admin_email.trim() };
    sessionStorage.setItem("th_usuario", JSON.stringify(usuarioSessaoAtualizado));
    localStorage.setItem("th_usuario", JSON.stringify(usuarioSessaoAtualizado));

    const empresaSessaoAtualizada = {
      id: empresa.id,
      empresa_id: empresa.id,
      nome: form.nome_fantasia || form.razao_social,
      nome_fantasia: form.nome_fantasia || form.razao_social,
      razao_social: form.razao_social || form.nome_fantasia,
      plano: "Básico",
      segmento: form.segmento,
      segmento_nome: form.segmento_nome || obterNomeSegmento(form.segmento),
    };
    sessionStorage.setItem("th_empresa", JSON.stringify(empresaSessaoAtualizada));
    localStorage.setItem("th_empresa", JSON.stringify(empresaSessaoAtualizada));

    setSalvando(false);
    return true;
  }

  async function avancar() {
    if (passo === 0) {
      setPasso(1);
      await salvarEtapa(1);
      return;
    }

    if (!validarPassoAtual()) return;
    const proximo = Math.min(passo + 1, 5);
    const ok = await salvarEtapa(proximo);
    if (ok) setPasso(proximo);
  }

  async function concluirOnboarding(destino: string) {
    if (!empresa) return;
    setSalvando(true);
    await salvarEtapa(5);

    const { error } = await supabase
      .from("empresas")
      .update({ onboarding_concluido: true, etapa_onboarding: 5, onboarding_concluido_em: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao concluir implantação: " + error.message);
      setSalvando(false);
      return;
    }

    await supabase.from("notificacoes_saas").insert([{ tipo: "onboarding_concluido", titulo: "Implantação inicial concluída", descricao: `${form.nome_fantasia || form.razao_social || "Empresa"} concluiu o assistente inicial.`, empresa_id: empresa.id, lida: false }]);

    setSalvando(false);
    router.push(destino);
  }

  const progresso = useMemo(() => {
    if (passo === 0) return 0;
    return Math.min((passo / 5) * 100, 100);
  }, [passo]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-blue-700" size={42} />
          <p className="mt-4 font-black text-slate-900">Carregando implantação...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[34px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 font-black text-sm">
                <Rocket size={18} /> Assistente de Implantação
              </div>
              <h1 className="text-3xl lg:text-5xl font-black mt-5 tracking-[-0.04em]">
                {passo === 0 ? "Bem-vindo ao Th Cloud" : "Configure seu ambiente"}
              </h1>
              <p className="mt-3 text-blue-100 max-w-3xl">
                {passo === 0 ? "Sua empresa foi criada com sucesso. Antes de começar, vamos ajustar as informações principais." : "Complete os passos abaixo para deixar sua empresa pronta para vender, controlar estoque e usar o financeiro."}
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-3xl p-5 min-w-[240px]">
              <p className="text-blue-100 font-bold">Progresso</p>
              <h2 className="text-3xl font-black mt-1">Passo {passo}/5</h2>
              <div className="h-3 bg-white/15 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progresso}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[34px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 lg:p-6 border-b border-slate-200">
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className={`h-2 rounded-full ${passo >= item ? "bg-blue-700" : "bg-slate-200"}`} />
              ))}
            </div>
          </div>

          <div className="p-5 lg:p-8">
            {passo === 0 && <TelaBoasVindas />}
            {passo === 1 && <PassoIdentificacao form={form} alterar={alterar} consultarCpfCnpj={consultarCpfCnpj} />}
            {passo === 2 && <PassoEndereco form={form} alterar={alterar} consultarCep={consultarCep} />}
            {passo === 3 && (
              <PassoAdministrador
                form={form}
                alterar={alterar}
                exigirSenha={usuarioBanco?.resetar_senha_proximo_login !== false}
                mostrarSenha={mostrarSenha}
                setMostrarSenha={setMostrarSenha}
                mostrarConfirmar={mostrarConfirmar}
                setMostrarConfirmar={setMostrarConfirmar}
              />
            )}
            {passo === 4 && <PassoSegmento form={form} alterar={alterar} />}
            {passo === 5 && <PassoFinal form={form} salvando={salvando} concluir={concluirOnboarding} />}
          </div>

          {passo < 5 && (
            <div className="p-5 lg:p-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-between">
              <button
                onClick={() => setPasso(Math.max(passo - 1, 0))}
                disabled={passo === 0 || salvando}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} /> Voltar
              </button>

              <button
                onClick={avancar}
                disabled={salvando}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {salvando ? "Salvando..." : passo === 0 ? "Começar Configuração" : "Salvar e Avançar"}
                {!salvando && <ArrowRight size={18} />}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function TelaBoasVindas() {
  return (
    <div className="text-center py-8 lg:py-14">
      <div className="h-24 w-24 rounded-[30px] bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-6">
        <Store size={46} />
      </div>
      <h2 className="text-3xl lg:text-4xl font-black text-slate-950">Sua empresa foi criada com sucesso</h2>
      <p className="mt-4 text-slate-500 max-w-2xl mx-auto">Agora vamos configurar os dados principais para que o Th Cloud fique pronto para sua operação.</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <MiniCard icon={<Building2 size={24} />} titulo="Dados da empresa" texto="CPF/CNPJ, contato e endereço." />
        <MiniCard icon={<Lock size={24} />} titulo="Administrador" texto="Troca de senha e acesso seguro." />
        <MiniCard icon={<PackagePlus size={24} />} titulo="Primeiros passos" texto="Produto, cliente, PDV e dashboard." />
      </div>
    </div>
  );
}

function PassoIdentificacao({ form, alterar, consultarCpfCnpj }: { form: Formulario; alterar: (campo: keyof Formulario, valor: string) => void; consultarCpfCnpj: () => void; }) {
  return (
    <div>
      <TituloPasso titulo="Identificação" texto="Informe se o cadastro é Pessoa Jurídica com CNPJ ou Pessoa Física com CPF." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button onClick={() => alterar("tipo_pessoa", "juridica")} className={`rounded-3xl border p-5 text-left ${form.tipo_pessoa === "juridica" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
          <Building2 className="text-blue-700" size={28} />
          <p className="mt-3 font-black text-slate-950">Pessoa Jurídica</p>
          <p className="text-sm text-slate-500">Empresa com CNPJ.</p>
        </button>
        <button onClick={() => alterar("tipo_pessoa", "fisica")} className={`rounded-3xl border p-5 text-left ${form.tipo_pessoa === "fisica" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
          <User className="text-blue-700" size={28} />
          <p className="mt-3 font-black text-slate-950">Pessoa Física</p>
          <p className="text-sm text-slate-500">Autônomo, vendedor ou prestador.</p>
        </button>
      </div>

      {form.tipo_pessoa === "juridica" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Razão Social" value={form.razao_social} onChange={(v) => alterar("razao_social", v)} />
          <Input label="Nome Fantasia" value={form.nome_fantasia} onChange={(v) => alterar("nome_fantasia", v)} />
          <Input label="CNPJ" value={form.cnpj} onChange={(v) => alterar("cnpj", v)} />
          <Input label="Inscrição Estadual" value={form.inscricao_estadual} onChange={(v) => alterar("inscricao_estadual", v)} />
          <Input label="Inscrição Municipal" value={form.inscricao_municipal} onChange={(v) => alterar("inscricao_municipal", v)} />
          <Input label="CNAE" value={form.cnae} onChange={(v) => alterar("cnae", v)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome Completo" value={form.nome_fantasia} onChange={(v) => alterar("nome_fantasia", v)} />
          <Input label="CPF" value={form.cpf} onChange={(v) => alterar("cpf", v)} />
          <Input label="RG (opcional)" value={form.rg} onChange={(v) => alterar("rg", v)} />
          <Input label="Data de nascimento" type="date" value={form.data_nascimento} onChange={(v) => alterar("data_nascimento", v)} />
        </div>
      )}

      <div className="mt-4">
        <button onClick={consultarCpfCnpj} className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black">
          {form.tipo_pessoa === "juridica" ? "Consultar Receita Federal" : "Consultar CPF"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Telefone" value={form.telefone} onChange={(v) => alterar("telefone", v)} />
        <Input label="WhatsApp" value={form.celular} onChange={(v) => alterar("celular", v)} />
        <Input label="E-mail" value={form.email} onChange={(v) => alterar("email", v)} />
      </div>
    </div>
  );
}

function PassoEndereco({ form, alterar, consultarCep }: { form: Formulario; alterar: (campo: keyof Formulario, valor: string) => void; consultarCep: () => void; }) {
  return (
    <div>
      <TituloPasso titulo="Endereço" texto="Complete o endereço principal da empresa ou do responsável." />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
        <Input label="CEP" value={form.cep} onChange={(v) => alterar("cep", v)} />
        <button onClick={consultarCep} className="self-end px-5 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black">Buscar CEP</button>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2"><Input label="Rua / Avenida" value={form.endereco} onChange={(v) => alterar("endereco", v)} /></div>
        <Input label="Número" value={form.numero} onChange={(v) => alterar("numero", v)} />
        <Input label="Complemento" value={form.complemento} onChange={(v) => alterar("complemento", v)} />
        <Input label="Bairro" value={form.bairro} onChange={(v) => alterar("bairro", v)} />
        <Input label="Cidade" value={form.cidade} onChange={(v) => alterar("cidade", v)} />
        <Input label="Estado" value={form.estado} onChange={(v) => alterar("estado", v)} />
      </div>
    </div>
  );
}

function PassoAdministrador({ form, alterar, exigirSenha, mostrarSenha, setMostrarSenha, mostrarConfirmar, setMostrarConfirmar }: { form: Formulario; alterar: (campo: keyof Formulario, valor: string) => void; exigirSenha: boolean; mostrarSenha: boolean; setMostrarSenha: (valor: boolean) => void; mostrarConfirmar: boolean; setMostrarConfirmar: (valor: boolean) => void; }) {
  return (
    <div>
      <TituloPasso titulo="Administrador principal" texto="Confirme o usuário responsável e altere a senha provisória." />
      {exigirSenha && (
        <div className="mb-5 rounded-3xl bg-yellow-50 border border-yellow-200 p-5">
          <p className="font-black text-yellow-800">Troca de senha obrigatória</p>
          <p className="text-sm text-yellow-700 mt-1">Por segurança, altere a senha provisória antes de continuar.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Nome" value={form.admin_nome} onChange={(v) => alterar("admin_nome", v)} />
        <Input label="Usuário" value={form.admin_usuario} onChange={(v) => alterar("admin_usuario", v)} />
        <Input label="E-mail" value={form.admin_email} onChange={(v) => alterar("admin_email", v)} />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputSenha label="Nova senha" value={form.nova_senha} onChange={(v) => alterar("nova_senha", v)} mostrar={mostrarSenha} setMostrar={setMostrarSenha} />
        <InputSenha label="Confirmar senha" value={form.confirmar_senha} onChange={(v) => alterar("confirmar_senha", v)} mostrar={mostrarConfirmar} setMostrar={setMostrarConfirmar} />
      </div>
    </div>
  );
}

function PassoSegmento({ form, alterar }: { form: Formulario; alterar: (campo: keyof Formulario, valor: string) => void; }) {
  return (
    <div>
      <TituloPasso
        titulo="Segmento do negócio"
        texto="Escolha o segmento principal. O TH Cloud vai ajustar a Ordem de Serviço e os campos do atendimento conforme essa escolha."
      />

      <div className="space-y-7">
        {segmentos.map((grupo) => (
          <div key={grupo.grupo}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-500">{grupo.grupo}</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {grupo.itens.map((segmento) => {
                const selecionado = form.segmento === segmento.codigo;

                return (
                  <button
                    key={segmento.codigo}
                    type="button"
                    onClick={() => alterar("segmento", segmento.codigo)}
                    className={`rounded-3xl border p-5 text-left transition ${
                      selecionado
                        ? "border-blue-600 bg-blue-50 shadow-lg shadow-blue-100"
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                        {segmento.icone}
                      </div>

                      {selecionado && (
                        <div className="h-8 w-8 rounded-full bg-blue-700 text-white flex items-center justify-center">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                    </div>

                    <h3 className="mt-4 text-lg font-black text-slate-950">{segmento.nome}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{segmento.descricao}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {segmento.recursos.map((recurso) => (
                        <span
                          key={recurso}
                          className={`px-3 py-1 rounded-full text-xs font-black ${
                            selecionado ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {recurso}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-3xl bg-slate-950 p-5 text-white">
        <p className="font-black">Segmento selecionado</p>
        <p className="mt-1 text-blue-100">{form.segmento_nome || obterNomeSegmento(form.segmento)}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Essa escolha será usada para adaptar a Ordem de Serviço. Loja de celular exibe IMEI e senha; oficina mecânica exibe placa, chassi e KM; refrigeração exibe BTUs, gás e voltagem.
        </p>
      </div>
    </div>
  );
}
function PassoFinal({ form, salvando, concluir }: { form: Formulario; salvando: boolean; concluir: (destino: string) => void; }) {
  return (
    <div>
      <div className="text-center py-4">
        <div className="h-24 w-24 rounded-[30px] bg-green-50 text-green-700 flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} /></div>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-950">Tudo pronto para começar</h2>
        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">{form.nome_fantasia || form.razao_social || "Sua empresa"} já está configurada no Th Cloud. Agora escolha sua primeira ação.</p>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AcaoFinal icon={<PackagePlus size={30} />} titulo="Cadastrar Primeiro Produto" texto="Comece criando seus produtos." onClick={() => concluir("/produtos")} disabled={salvando} />
        <AcaoFinal icon={<Users size={30} />} titulo="Cadastrar Primeiro Cliente" texto="Registre seu primeiro cliente." onClick={() => concluir("/clientes")} disabled={salvando} />
        <AcaoFinal icon={<ShoppingCart size={30} />} titulo="Abrir PDV" texto="Acesse a tela de vendas." onClick={() => concluir("/caixa/pdv")} disabled={salvando} />
        <AcaoFinal icon={<Home size={30} />} titulo="Ir para Dashboard" texto="Ver resumo da empresa." onClick={() => concluir("/dashboard")} disabled={salvando} />
      </div>
    </div>
  );
}

function TituloPasso({ titulo, texto }: { titulo: string; texto: string }) {
  return <div className="mb-6"><h2 className="text-3xl font-black text-slate-950">{titulo}</h2><p className="mt-2 text-slate-500">{texto}</p></div>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (valor: string) => void; type?: string; }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
    </label>
  );
}

function InputSenha({ label, value, onChange, mostrar, setMostrar }: { label: string; value: string; onChange: (valor: string) => void; mostrar: boolean; setMostrar: (valor: boolean) => void; }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <div className="relative mt-2">
        <input type={mostrar ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
        <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700">{mostrar ? <EyeOff size={20} /> : <Eye size={20} />}</button>
      </div>
    </label>
  );
}

function MiniCard({ icon, titulo, texto }: { icon: React.ReactNode; titulo: string; texto: string; }) {
  return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="h-12 w-12 rounded-2xl bg-white text-blue-700 flex items-center justify-center mx-auto">{icon}</div><p className="mt-4 font-black text-slate-900">{titulo}</p><p className="mt-1 text-sm text-slate-500">{texto}</p></div>;
}

function AcaoFinal({ icon, titulo, texto, onClick, disabled }: { icon: React.ReactNode; titulo: string; texto: string; onClick: () => void; disabled: boolean; }) {
  return (
    <button onClick={onClick} disabled={disabled} className="rounded-3xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 p-5 text-left transition disabled:opacity-60">
      <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">{icon}</div>
      <p className="mt-5 font-black text-slate-950">{titulo}</p>
      <p className="mt-1 text-sm text-slate-500">{texto}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-blue-700 font-black">Acessar <ArrowRight size={17} /></div>
    </button>
  );
}
