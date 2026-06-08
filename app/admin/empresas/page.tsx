"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  Building2,
  CalendarDays,
  CheckCircle,
  Edit,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Empresa = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  plano: string | null;
  status_assinatura: string | null;
  data_vencimento_assinatura: string | null;
  limite_usuarios: number | null;
  limite_produtos: number | null;
  observacoes_internas: string | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_delivery: boolean | null;
  modulo_crm: boolean | null;
  modulo_relatorios_premium: boolean | null;
  modulo_multiloja: boolean | null;
};

type FormEmpresa = {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  plano: string;
  status_assinatura: string;
  data_vencimento_assinatura: string;
  limite_usuarios: string;
  limite_produtos: string;
  observacoes_internas: string;
  ativo: boolean;
  modulo_fiscal: boolean;
  modulo_whatsapp: boolean;
  modulo_delivery: boolean;
  modulo_crm: boolean;
  modulo_relatorios_premium: boolean;
  modulo_multiloja: boolean;
  nome_admin: string;
  email_admin: string;
  senha_admin: string;
  telefone_admin: string;
};

const planos = ["Teste", "Básico", "Profissional", "Premium", "Enterprise"];
const statusAssinaturas = ["Ativo", "Teste", "Vencido", "Bloqueado", "Cancelado"];

const formInicial: FormEmpresa = {
  id: "",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  telefone: "",
  email: "",
  plano: "Teste",
  status_assinatura: "Teste",
  data_vencimento_assinatura: "",
  limite_usuarios: "999999",
  limite_produtos: "999999",
  observacoes_internas: "",
  ativo: true,
  modulo_fiscal: false,
  modulo_whatsapp: false,
  modulo_delivery: false,
  modulo_crm: false,
  modulo_relatorios_premium: false,
  modulo_multiloja: false,
  nome_admin: "",
  email_admin: "",
  senha_admin: "123456",
  telefone_admin: "",
};

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPlano, setFiltroPlano] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<FormEmpresa>(formInicial);

  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, "");
  }

  function validarEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
  }

  function formatarCNPJ(valor: string | null) {
    if (!valor) return "-";
    const numeros = somenteNumeros(valor);
    if (numeros.length !== 14) return valor;
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function formatarDataHora(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function adicionarDias(dias: number) {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  }

  function diasParaVencer(vencimento: string | null) {
    if (!vencimento) return null;
    const hoje = new Date(hojeISO() + "T00:00:00");
    const dataVencimento = new Date(vencimento + "T00:00:00");
    return Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  }

  function classeStatus(status: string | null, ativo: boolean | null) {
    if (ativo === false) return "bg-red-100 text-red-700";
    if (status === "Ativo") return "bg-green-100 text-green-700";
    if (status === "Teste") return "bg-blue-100 text-blue-700";
    if (status === "Vencido") return "bg-orange-100 text-orange-700";
    if (status === "Bloqueado") return "bg-red-100 text-red-700";
    if (status === "Cancelado") return "bg-slate-200 text-slate-700";
    return "bg-slate-100 text-slate-700";
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

  function abrirNovaEmpresa() {
    setForm({ ...formInicial, data_vencimento_assinatura: adicionarDias(7) });
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirEditarEmpresa(empresa: Empresa) {
    setForm({
      id: empresa.id,
      razao_social: empresa.razao_social || "",
      nome_fantasia: empresa.nome_fantasia || "",
      cnpj: empresa.cnpj || "",
      telefone: empresa.telefone || "",
      email: empresa.email || "",
      plano: empresa.plano || "Teste",
      status_assinatura: empresa.status_assinatura || "Teste",
      data_vencimento_assinatura: empresa.data_vencimento_assinatura || "",
      limite_usuarios: String(empresa.limite_usuarios || 999999),
      limite_produtos: String(empresa.limite_produtos || 999999),
      observacoes_internas: empresa.observacoes_internas || "",
      ativo: empresa.ativo !== false,
      modulo_fiscal: empresa.modulo_fiscal === true,
      modulo_whatsapp: empresa.modulo_whatsapp === true,
      modulo_delivery: empresa.modulo_delivery === true,
      modulo_crm: empresa.modulo_crm === true,
      modulo_relatorios_premium: empresa.modulo_relatorios_premium === true,
      modulo_multiloja: empresa.modulo_multiloja === true,
      nome_admin: "",
      email_admin: "",
      senha_admin: "123456",
      telefone_admin: "",
    });
    setModoEdicao(true);
    setModalAberto(true);
  }

  async function carregarEmpresas() {
    const { data, error } = await supabase
      .from("empresas")
      .select("id,razao_social,nome_fantasia,cnpj,telefone,email,ativo,created_at,updated_at,plano,status_assinatura,data_vencimento_assinatura,limite_usuarios,limite_produtos,observacoes_internas,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar empresas: " + error.message);
      return;
    }

    setEmpresas(data || []);
  }

  function validarFormulario() {
    if (!form.razao_social.trim()) {
      alert("Informe a razão social.");
      return false;
    }
    if (!form.nome_fantasia.trim()) {
      alert("Informe o nome fantasia.");
      return false;
    }
    if (form.email.trim() && !validarEmail(form.email.trim())) {
      alert("Informe um e-mail válido para a empresa.");
      return false;
    }
    if (!form.data_vencimento_assinatura) {
      alert("Informe o vencimento da assinatura.");
      return false;
    }

    if (!modoEdicao) {
      if (!form.nome_admin.trim()) {
        alert("Informe o nome do administrador da empresa.");
        return false;
      }
      if (!form.email_admin.trim()) {
        alert("Informe o e-mail de login do administrador.");
        return false;
      }
      if (!validarEmail(form.email_admin.trim())) {
        alert("Informe um e-mail válido para o administrador.");
        return false;
      }
      if (!form.senha_admin.trim()) {
        alert("Informe a senha inicial do administrador.");
        return false;
      }
      if (form.senha_admin.trim().length < 4) {
        alert("A senha inicial precisa ter pelo menos 4 caracteres.");
        return false;
      }
    }

    return true;
  }

  async function emailUsuarioJaExiste(email: string) {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .limit(1);

    if (error) throw new Error(error.message);
    return (data || []).length > 0;
  }

  async function salvarEmpresa() {
    if (!validarFormulario()) return;
    setSalvando(true);

    try {
      const dadosEmpresa = {
        razao_social: form.razao_social.trim(),
        nome_fantasia: form.nome_fantasia.trim(),
        cnpj: somenteNumeros(form.cnpj.trim()) || null,
        telefone: form.telefone.trim() || null,
        email: form.email.trim().toLowerCase() || null,
        plano: form.plano,
        status_assinatura: form.status_assinatura,
        data_vencimento_assinatura: form.data_vencimento_assinatura,
        limite_usuarios: Number(form.limite_usuarios || 999999),
        limite_produtos: Number(form.limite_produtos || 999999),
        observacoes_internas: form.observacoes_internas.trim() || null,
        ativo: form.ativo,
        modulo_fiscal: form.modulo_fiscal,
        modulo_whatsapp: form.modulo_whatsapp,
        modulo_delivery: form.modulo_delivery,
        modulo_crm: form.modulo_crm,
        modulo_relatorios_premium: form.modulo_relatorios_premium,
        modulo_multiloja: form.modulo_multiloja,
        updated_at: new Date().toISOString(),
      };

      if (modoEdicao) {
        const { error } = await supabase.from("empresas").update(dadosEmpresa).eq("id", form.id);
        if (error) {
          alert("Erro ao atualizar empresa: " + error.message);
          setSalvando(false);
          return;
        }
        alert("Empresa atualizada com sucesso!");
      } else {
        const emailAdmin = form.email_admin.trim().toLowerCase();
        const existe = await emailUsuarioJaExiste(emailAdmin);

        if (existe) {
          alert("Já existe um usuário cadastrado com este e-mail de administrador.");
          setSalvando(false);
          return;
        }

        const { data: empresaCriada, error: erroEmpresa } = await supabase
          .from("empresas")
          .insert(dadosEmpresa)
          .select("id")
          .single();

        if (erroEmpresa || !empresaCriada) {
          alert("Erro ao cadastrar empresa: " + (erroEmpresa?.message || ""));
          setSalvando(false);
          return;
        }

        const { error: erroUsuario } = await supabase.from("usuarios").insert({
          empresa_id: empresaCriada.id,
          nome: form.nome_admin.trim(),
          email: emailAdmin,
          senha: form.senha_admin.trim(),
          telefone: form.telefone_admin.trim() || null,
          cargo: "Administrador",
          perfil: "Administrador",
          ativo: true,
          observacoes: "Usuário administrador criado automaticamente pelo cadastro da empresa SaaS.",
          trocar_senha: true,
          modulo_fiscal: false,
          modulo_whatsapp: false,
          modulo_crm: false,
          modulo_delivery: false,
          modulo_multiloja: false,
          modulo_relatorios_premium: false,
          updated_at: new Date().toISOString(),
        });

        if (erroUsuario) {
          await supabase.from("empresas").delete().eq("id", empresaCriada.id);
          alert(
            "A empresa foi criada, mas houve erro ao criar o usuário administrador. A empresa foi removida para evitar cadastro incompleto. Erro: " +
              erroUsuario.message
          );
          setSalvando(false);
          return;
        }

        alert(
          `Empresa cadastrada com sucesso!\n\nLogin do administrador:\nE-mail: ${emailAdmin}\nSenha: ${form.senha_admin.trim()}`
        );
      }

      setModalAberto(false);
      setForm(formInicial);
      await carregarEmpresas();
    } catch (error: any) {
      alert("Erro ao salvar empresa: " + error.message);
    }

    setSalvando(false);
  }

  async function alterarStatusEmpresa(empresa: Empresa, novoStatus: string, ativo: boolean) {
    const confirmar = confirm(`Deseja alterar ${empresa.nome_fantasia || empresa.razao_social} para ${novoStatus}?`);
    if (!confirmar) return;

    const { error } = await supabase
      .from("empresas")
      .update({ status_assinatura: novoStatus, ativo, updated_at: new Date().toISOString() })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    carregarEmpresas();
  }

  async function renovarEmpresa(empresa: Empresa, dias: number) {
    const confirmar = confirm(`Deseja renovar ${empresa.nome_fantasia || empresa.razao_social} por ${dias} dias?`);
    if (!confirmar) return;

    const base = empresa.data_vencimento_assinatura
      ? new Date(empresa.data_vencimento_assinatura + "T00:00:00")
      : new Date();

    const hoje = new Date(hojeISO() + "T00:00:00");
    const dataBase = base < hoje ? hoje : base;
    dataBase.setDate(dataBase.getDate() + dias);
    const novoVencimento = dataBase.toISOString().split("T")[0];

    const { error } = await supabase
      .from("empresas")
      .update({
        data_vencimento_assinatura: novoVencimento,
        status_assinatura: "Ativo",
        ativo: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao renovar empresa: " + error.message);
      return;
    }

    alert("Empresa renovada com sucesso!");
    carregarEmpresas();
  }

  async function excluirEmpresa(empresa: Empresa) {
    const confirmar = confirm(
      `Deseja realmente excluir ${empresa.nome_fantasia || empresa.razao_social}? Esta ação não poderá ser desfeita.`
    );
    if (!confirmar) return;

    const { error } = await supabase.from("empresas").delete().eq("id", empresa.id);

    if (error) {
      alert("Erro ao excluir empresa. Ela pode estar vinculada a usuários, vendas ou cadastros: " + error.message);
      return;
    }

    alert("Empresa excluída com sucesso!");
    carregarEmpresas();
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const empresasFiltradas = empresas.filter((empresa) => {
    const termo = busca.trim().toLowerCase();

    const bateBusca =
      termo === "" ||
      String(empresa.razao_social || "").toLowerCase().includes(termo) ||
      String(empresa.nome_fantasia || "").toLowerCase().includes(termo) ||
      String(empresa.cnpj || "").toLowerCase().includes(termo) ||
      String(empresa.email || "").toLowerCase().includes(termo);

    const bateStatus =
      filtroStatus === "Todos" ||
      String(empresa.status_assinatura || "").toLowerCase() === filtroStatus.toLowerCase();

    const batePlano =
      filtroPlano === "Todos" ||
      String(empresa.plano || "").toLowerCase() === filtroPlano.toLowerCase();

    return bateBusca && bateStatus && batePlano;
  });

  const totalAtivas = empresas.filter(
    (empresa) => empresa.ativo !== false && empresa.status_assinatura === "Ativo"
  ).length;

  const totalTeste = empresas.filter((empresa) => empresa.status_assinatura === "Teste").length;

  const totalBloqueadas = empresas.filter(
    (empresa) =>
      empresa.ativo === false ||
      empresa.status_assinatura === "Bloqueado" ||
      empresa.status_assinatura === "Vencido"
  ).length;

  const vencendo = empresas.filter((empresa) => {
    const dias = diasParaVencer(empresa.data_vencimento_assinatura);
    return dias !== null && dias >= 0 && dias <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-slate-950 to-blue-800 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">Painel Master THCloud</p>
            <h1 className="text-4xl font-black mt-2">Ativação de Clientes</h1>
            <p className="text-blue-100 mt-2 max-w-3xl">
              Gerencie empresas clientes, planos, vencimentos, bloqueios, módulos adicionais e status de assinatura.
            </p>
          </div>

          <button
            onClick={abrirNovaEmpresa}
            className="bg-white text-blue-900 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Nova Empresa Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <ResumoCard titulo="Total Empresas" valor={`${empresas.length}`} detalhe="Clientes cadastrados" cor="text-blue-700" icone={<Building2 size={24} />} />
        <ResumoCard titulo="Ativas" valor={`${totalAtivas}`} detalhe="Assinaturas ativas" cor="text-green-700" icone={<CheckCircle size={24} />} />
        <ResumoCard titulo="Bloqueadas" valor={`${totalBloqueadas}`} detalhe="Vencidas ou bloqueadas" cor="text-red-700" icone={<Lock size={24} />} />
        <ResumoCard titulo="Vencem em 7 dias" valor={`${vencendo}`} detalhe={`${totalTeste} em teste`} cor="text-orange-700" icone={<CalendarDays size={24} />} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por empresa, CNPJ ou e-mail..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900"
            />
          </div>

          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white">
            <option value="Todos">Todos os status</option>
            {statusAssinaturas.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <select value={filtroPlano} onChange={(e) => setFiltroPlano(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white">
            <option value="Todos">Todos os planos</option>
            {planos.map((plano) => <option key={plano} value={plano}>{plano}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Empresas Clientes</h2>
            <p className="text-slate-500">{empresasFiltradas.length} empresa(s) encontrada(s).</p>
          </div>

          <button onClick={carregarEmpresas} className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-2">
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                <th className="p-4">Empresa</th>
                <th className="p-4">CNPJ</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Módulos</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Status</th>
                <th className="p-4">Cadastro</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {empresasFiltradas.map((empresa) => {
                const dias = diasParaVencer(empresa.data_vencimento_assinatura);

                return (
                  <tr key={empresa.id} className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-900">{empresa.nome_fantasia || "-"}</p>
                      <p className="text-slate-500">{empresa.razao_social || "-"}</p>
                      <p className="text-xs text-blue-700 mt-1">{empresa.email || "-"}</p>
                    </td>

                    <td className="p-4 text-slate-700">{formatarCNPJ(empresa.cnpj)}</td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700">
                        {empresa.plano || "Teste"}
                      </span>
                    </td>

                    <td className="p-4 text-slate-700">
                      <p className="font-bold text-slate-900">{quantidadeModulos(empresa)} adicional(is)</p>
                      <p className="text-xs text-slate-500 mt-1">Fiscal, WhatsApp, CRM, Delivery...</p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900">{formatarData(empresa.data_vencimento_assinatura)}</p>
                      <p className={`text-xs font-bold mt-1 ${
                        dias !== null && dias < 0 ? "text-red-700" : dias !== null && dias <= 7 ? "text-orange-700" : "text-slate-500"
                      }`}>
                        {dias === null ? "Sem vencimento" : dias < 0 ? `${Math.abs(dias)} dia(s) vencido` : `${dias} dia(s) restante(s)`}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${classeStatus(empresa.status_assinatura, empresa.ativo)}`}>
                        {empresa.ativo === false ? "Bloqueado" : empresa.status_assinatura || "Teste"}
                      </span>
                    </td>

                    <td className="p-4 text-slate-700">{formatarDataHora(empresa.created_at)}</td>

                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirEditarEmpresa(empresa)} className="h-10 w-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center" title="Editar">
                          <Edit size={17} />
                        </button>

                        <button onClick={() => renovarEmpresa(empresa, 30)} className="h-10 w-10 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 flex items-center justify-center" title="Renovar 30 dias">
                          <CalendarDays size={17} />
                        </button>

                        <button onClick={() => alterarStatusEmpresa(empresa, "Ativo", true)} className="h-10 w-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center" title="Ativar">
                          <CheckCircle size={17} />
                        </button>

                        <button onClick={() => alterarStatusEmpresa(empresa, "Bloqueado", false)} className="h-10 w-10 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 flex items-center justify-center" title="Bloquear">
                          <Lock size={17} />
                        </button>

                        <button onClick={() => excluirEmpresa(empresa)} className="h-10 w-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center" title="Excluir">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {modoEdicao ? "Editar Empresa Cliente" : "Nova Empresa Cliente"}
                </h2>
                <p className="text-slate-500">
                  Controle dados da empresa, plano, vencimento, módulos e usuário administrador.
                </p>
              </div>

              <button onClick={() => setModalAberto(false)} className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Dados da Empresa</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Campo label="Razão Social" className="md:col-span-2">
                    <input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} placeholder="Razão Social" className="input" />
                  </Campo>

                  <Campo label="Nome Fantasia">
                    <input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} placeholder="Nome Fantasia" className="input" />
                  </Campo>

                  <Campo label="CNPJ">
                    <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="input" />
                  </Campo>

                  <Campo label="Telefone">
                    <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(99) 99999-9999" className="input" />
                  </Campo>

                  <Campo label="E-mail da Empresa">
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" className="input" />
                  </Campo>
                </div>
              </section>

              {!modoEdicao && (
                <section>
                  <h3 className="text-lg font-black text-slate-900 mb-4">Administrador da Empresa</h3>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
                    <p className="text-sm text-blue-800 font-bold">
                      Este usuário será criado automaticamente para acessar a empresa.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Campo label="Nome do Administrador">
                      <input value={form.nome_admin} onChange={(e) => setForm({ ...form, nome_admin: e.target.value })} placeholder="Nome do responsável" className="input" />
                    </Campo>

                    <Campo label="Telefone do Administrador">
                      <input value={form.telefone_admin} onChange={(e) => setForm({ ...form, telefone_admin: e.target.value })} placeholder="(99) 99999-9999" className="input" />
                    </Campo>

                    <Campo label="E-mail de Login">
                      <input value={form.email_admin} onChange={(e) => setForm({ ...form, email_admin: e.target.value })} placeholder="admin@empresa.com" className="input" />
                    </Campo>

                    <Campo label="Senha Inicial">
                      <input value={form.senha_admin} onChange={(e) => setForm({ ...form, senha_admin: e.target.value })} placeholder="123456" className="input" />
                    </Campo>
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Plano e Assinatura</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Campo label="Plano">
                    <select value={form.plano} onChange={(e) => setForm({ ...form, plano: e.target.value })} className="input bg-white">
                      {planos.map((plano) => <option key={plano} value={plano}>{plano}</option>)}
                    </select>
                  </Campo>

                  <Campo label="Status da Assinatura">
                    <select value={form.status_assinatura} onChange={(e) => setForm({ ...form, status_assinatura: e.target.value, ativo: e.target.value !== "Bloqueado" })} className="input bg-white">
                      {statusAssinaturas.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </Campo>

                  <Campo label="Vencimento">
                    <input type="date" value={form.data_vencimento_assinatura} onChange={(e) => setForm({ ...form, data_vencimento_assinatura: e.target.value })} className="input" />
                  </Campo>

                  <Campo label="Empresa ativa?">
                    <select value={form.ativo ? "sim" : "nao"} onChange={(e) => setForm({ ...form, ativo: e.target.value === "sim" })} className="input bg-white">
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Módulos Adicionais Pagos</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CheckBoxModulo titulo="Fiscal" descricao="NFC-e, NF-e e recursos fiscais" marcado={form.modulo_fiscal} onChange={(valor) => setForm({ ...form, modulo_fiscal: valor })} />
                  <CheckBoxModulo titulo="WhatsApp" descricao="Comunicação e automações via WhatsApp" marcado={form.modulo_whatsapp} onChange={(valor) => setForm({ ...form, modulo_whatsapp: valor })} />
                  <CheckBoxModulo titulo="Delivery" descricao="Pedidos externos e entregas" marcado={form.modulo_delivery} onChange={(valor) => setForm({ ...form, modulo_delivery: valor })} />
                  <CheckBoxModulo titulo="CRM" descricao="Funil, relacionamento e oportunidades" marcado={form.modulo_crm} onChange={(valor) => setForm({ ...form, modulo_crm: valor })} />
                  <CheckBoxModulo titulo="Relatórios Premium" descricao="Indicadores avançados e análises extras" marcado={form.modulo_relatorios_premium} onChange={(valor) => setForm({ ...form, modulo_relatorios_premium: valor })} />
                  <CheckBoxModulo titulo="Multiloja" descricao="Gestão de várias unidades" marcado={form.modulo_multiloja} onChange={(valor) => setForm({ ...form, modulo_multiloja: valor })} />
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Observações Internas</h3>
                <textarea value={form.observacoes_internas} onChange={(e) => setForm({ ...form, observacoes_internas: e.target.value })} placeholder="Observações de suporte, contrato, cobrança ou implantação..." className="input min-h-28" />
              </section>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setModalAberto(false)} className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">
                Cancelar
              </button>

              <button onClick={salvarEmpresa} disabled={salvando} className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold disabled:opacity-60">
                {salvando ? "Salvando..." : modoEdicao ? "Salvar Alterações" : "Cadastrar Empresa Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 1rem;
          padding: 0.75rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
        }
      `}</style>
    </div>
  );
}

function Campo({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckBoxModulo({
  titulo,
  descricao,
  marcado,
  onChange,
}: {
  titulo: string;
  descricao: string;
  marcado: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <label
      className={`border rounded-2xl p-4 cursor-pointer transition ${
        marcado
          ? "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4"
        />

        <div>
          <p className="font-black text-slate-900">{titulo}</p>
          <p className="text-sm text-slate-500 mt-1">{descricao}</p>
        </div>
      </div>
    </label>
  );
}

function ResumoCard({
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
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>
          <h2 className={`text-3xl font-black mt-3 ${cor}`}>{valor}</h2>
          <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
        </div>

        <div
          className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}
        >
          {icone}
        </div>
      </div>
    </div>
  );
}
