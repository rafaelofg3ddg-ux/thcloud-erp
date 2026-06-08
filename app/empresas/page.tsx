"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Building2,
  CheckCircle,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type UsuarioLogado = {
  id?: string;
  empresa_id?: string | null;
  nome?: string;
  email?: string;
  perfil?: string;
  empresa_nome?: string;
};

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
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  cnae: string | null;
  celular: string | null;
  whatsapp: string | null;
  site: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  complemento: string | null;
  regime_tributario: string | null;
  logo_url: string | null;
  cor_principal: string | null;
};

type FormEmpresa = {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  cnae: string;
  telefone: string;
  celular: string;
  whatsapp: string;
  email: string;
  site: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  regime_tributario: string;
  logo_url: string;
  cor_principal: string;
  ativo: boolean;
};

const regimes = ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI", "Isento"];

const formInicial: FormEmpresa = {
  id: "",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  inscricao_estadual: "",
  inscricao_municipal: "",
  cnae: "",
  telefone: "",
  celular: "",
  whatsapp: "",
  email: "",
  site: "",
  cep: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  complemento: "",
  regime_tributario: "Simples Nacional",
  logo_url: "",
  cor_principal: "#1d4ed8",
  ativo: true,
};

export default function EmpresasPage() {
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado>({});
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<FormEmpresa>(formInicial);

  function getUsuarioLogado() {
    return JSON.parse(localStorage.getItem("th_usuario") || "{}") as UsuarioLogado;
  }

  function isSuperAdmin(usuario: UsuarioLogado) {
    return usuario.perfil === "Super Admin";
  }

  function empresaPermitidaId(usuario: UsuarioLogado) {
    return usuario.empresa_id || "";
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, "");
  }

  function formatarCNPJ(valor: string | null) {
    if (!valor) return "-";
    const numeros = somenteNumeros(valor);
    if (numeros.length !== 14) return valor;
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  function formatarTelefone(valor: string | null) {
    if (!valor) return "-";
    const numeros = somenteNumeros(valor);
    if (numeros.length === 11) return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (numeros.length === 10) return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return valor;
  }

  function preencherFormulario(empresa: Empresa) {
    setForm({
      id: empresa.id,
      razao_social: empresa.razao_social || "",
      nome_fantasia: empresa.nome_fantasia || "",
      cnpj: empresa.cnpj || "",
      inscricao_estadual: empresa.inscricao_estadual || "",
      inscricao_municipal: empresa.inscricao_municipal || "",
      cnae: empresa.cnae || "",
      telefone: empresa.telefone || "",
      celular: empresa.celular || "",
      whatsapp: empresa.whatsapp || "",
      email: empresa.email || "",
      site: empresa.site || "",
      cep: empresa.cep || "",
      endereco: empresa.endereco || "",
      numero: empresa.numero || "",
      bairro: empresa.bairro || "",
      cidade: empresa.cidade || "",
      estado: empresa.estado || "",
      complemento: empresa.complemento || "",
      regime_tributario: empresa.regime_tributario || "Simples Nacional",
      logo_url: empresa.logo_url || "",
      cor_principal: empresa.cor_principal || "#1d4ed8",
      ativo: empresa.ativo !== false,
    });
  }

  function abrirNovaEmpresa() {
    if (!isSuperAdmin(usuarioLogado)) {
      alert("Apenas o Super Admin pode cadastrar novas empresas.");
      return;
    }

    setForm(formInicial);
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirEditarEmpresa(empresa: Empresa) {
    if (!isSuperAdmin(usuarioLogado) && empresa.id !== empresaPermitidaId(usuarioLogado)) {
      alert("Você não tem permissão para editar outra empresa.");
      return;
    }

    preencherFormulario(empresa);
    setModoEdicao(true);
    setModalAberto(true);
  }

  async function carregarEmpresas() {
    const logado = getUsuarioLogado();
    setUsuarioLogado(logado);

    const superAdmin = isSuperAdmin(logado);
    const empresaId = empresaPermitidaId(logado);

    if (!logado.id && !logado.email) {
      alert("Usuário não identificado. Faça login novamente.");
      setEmpresas([]);
      return;
    }

    let consulta = supabase.from("empresas").select("*").order("nome_fantasia", { ascending: true });

    if (!superAdmin) {
      if (!empresaId) {
        setEmpresas([]);
        return;
      }

      consulta = consulta.eq("id", empresaId);
    }

    const { data, error } = await consulta;

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

    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email.trim())) {
      alert("Informe um e-mail válido.");
      return false;
    }

    if (!isSuperAdmin(usuarioLogado) && form.id !== empresaPermitidaId(usuarioLogado)) {
      alert("Você só pode alterar os dados da sua própria empresa.");
      return false;
    }

    return true;
  }

  async function salvarEmpresa() {
    if (!validarFormulario()) return;

    setSalvando(true);

    const dados = {
      razao_social: form.razao_social.trim(),
      nome_fantasia: form.nome_fantasia.trim(),
      cnpj: somenteNumeros(form.cnpj.trim()) || null,
      inscricao_estadual: form.inscricao_estadual.trim() || null,
      inscricao_municipal: form.inscricao_municipal.trim() || null,
      cnae: form.cnae.trim() || null,
      telefone: form.telefone.trim() || null,
      celular: form.celular.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      site: form.site.trim() || null,
      cep: form.cep.trim() || null,
      endereco: form.endereco.trim() || null,
      numero: form.numero.trim() || null,
      bairro: form.bairro.trim() || null,
      cidade: form.cidade.trim() || null,
      estado: form.estado.trim().toUpperCase() || null,
      complemento: form.complemento.trim() || null,
      regime_tributario: form.regime_tributario || null,
      logo_url: form.logo_url.trim() || null,
      cor_principal: form.cor_principal || "#1d4ed8",
      ativo: form.ativo,
      updated_at: new Date().toISOString(),
    };

    if (modoEdicao) {
      let consulta = supabase.from("empresas").update(dados).eq("id", form.id);

      if (!isSuperAdmin(usuarioLogado)) {
        consulta = consulta.eq("id", empresaPermitidaId(usuarioLogado));
      }

      const { error } = await consulta;
      setSalvando(false);

      if (error) {
        alert("Erro ao atualizar empresa: " + error.message);
        return;
      }

      alert("Empresa atualizada com sucesso!");
    } else {
      if (!isSuperAdmin(usuarioLogado)) {
        setSalvando(false);
        alert("Apenas o Super Admin pode cadastrar novas empresas.");
        return;
      }

      const { error } = await supabase.from("empresas").insert(dados);
      setSalvando(false);

      if (error) {
        alert("Erro ao cadastrar empresa: " + error.message);
        return;
      }

      alert("Empresa cadastrada com sucesso!");
    }

    setModalAberto(false);
    setForm(formInicial);
    carregarEmpresas();
  }

  async function alterarStatus(empresa: Empresa) {
    if (!isSuperAdmin(usuarioLogado)) {
      alert("Apenas o Super Admin pode ativar ou inativar empresas.");
      return;
    }

    const acao = empresa.ativo !== false ? "inativar" : "ativar";
    const confirmar = confirm(`Deseja realmente ${acao} a empresa ${empresa.nome_fantasia || empresa.razao_social}?`);

    if (!confirmar) return;

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: empresa.ativo === false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    carregarEmpresas();
  }

  async function excluirEmpresa(empresa: Empresa) {
    if (!isSuperAdmin(usuarioLogado)) {
      alert("Apenas o Super Admin pode excluir empresas.");
      return;
    }

    const confirmar = confirm(
      `Deseja realmente excluir a empresa ${empresa.nome_fantasia || empresa.razao_social}? Esta ação não poderá ser desfeita.`
    );

    if (!confirmar) return;

    const { error } = await supabase.from("empresas").delete().eq("id", empresa.id);

    if (error) {
      alert("Erro ao excluir empresa. Ela pode estar vinculada a usuários, produtos ou vendas: " + error.message);
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
      String(empresa.email || "").toLowerCase().includes(termo) ||
      String(empresa.cidade || "").toLowerCase().includes(termo);

    const bateStatus =
      filtroStatus === "Todos" ||
      (filtroStatus === "Ativas" && empresa.ativo !== false) ||
      (filtroStatus === "Inativas" && empresa.ativo === false);

    return bateBusca && bateStatus;
  });

  const totalAtivas = empresas.filter((empresa) => empresa.ativo !== false).length;
  const totalInativas = empresas.filter((empresa) => empresa.ativo === false).length;
  const totalComCnpj = empresas.filter((empresa) => empresa.cnpj).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">THCloud ERP</p>

            <h1 className="text-4xl font-black mt-2">Empresas</h1>

            <p className="text-blue-100 mt-2 max-w-3xl">
              Cadastre e gerencie empresas, dados fiscais, contato, endereço,
              logomarca e personalização.
            </p>

            {!isSuperAdmin(usuarioLogado) && (
              <p className="text-blue-100 mt-2 text-sm font-bold">
                Empresa atual: {usuarioLogado.empresa_nome || empresas[0]?.nome_fantasia || empresas[0]?.razao_social || "Empresa"}
              </p>
            )}
          </div>

          {isSuperAdmin(usuarioLogado) && (
            <button
              onClick={abrirNovaEmpresa}
              className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Nova Empresa
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <ResumoCard titulo="Total de Empresas" valor={`${empresas.length}`} detalhe="Empresas visíveis" cor="text-blue-700" icone={<Building2 size={24} />} />
        <ResumoCard titulo="Ativas" valor={`${totalAtivas}`} detalhe="Empresas liberadas" cor="text-green-700" icone={<CheckCircle size={24} />} />
        <ResumoCard titulo="Inativas" valor={`${totalInativas}`} detalhe="Empresas bloqueadas" cor="text-red-700" icone={<XCircle size={24} />} />
        <ResumoCard titulo="Com CNPJ" valor={`${totalComCnpj}`} detalhe="Empresas identificadas" cor="text-purple-700" icone={<Building2 size={24} />} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, razão social, CNPJ, cidade ou e-mail..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white"
          >
            <option value="Todos">Todos os status</option>
            <option value="Ativas">Ativas</option>
            <option value="Inativas">Inativas</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Lista de Empresas</h2>
            <p className="text-slate-500">{empresasFiltradas.length} empresa(s) encontrada(s).</p>
          </div>

          <button
            onClick={carregarEmpresas}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
          >
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                <th className="p-4">Empresa</th>
                <th className="p-4">CNPJ</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Endereço</th>
                <th className="p-4">Regime</th>
                <th className="p-4">Status</th>
                <th className="p-4">Criado em</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {empresasFiltradas.map((empresa) => (
                <tr key={empresa.id} className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-2xl text-white flex items-center justify-center font-black overflow-hidden"
                        style={{ background: empresa.cor_principal || "#1d4ed8" }}
                      >
                        {empresa.logo_url ? (
                          <img src={empresa.logo_url} alt={empresa.nome_fantasia || "Logo"} className="h-full w-full object-cover" />
                        ) : (
                          (empresa.nome_fantasia || empresa.razao_social || "E").substring(0, 1).toUpperCase()
                        )}
                      </div>

                      <div>
                        <p className="font-black text-slate-900">{empresa.nome_fantasia || "-"}</p>
                        <p className="text-slate-500">{empresa.razao_social || "-"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-slate-700">{formatarCNPJ(empresa.cnpj)}</td>

                  <td className="p-4 text-slate-700">
                    <p className="flex items-center gap-2">
                      <Phone size={14} />
                      {formatarTelefone(empresa.telefone || empresa.celular)}
                    </p>

                    <p className="flex items-center gap-2 mt-1">
                      <Mail size={14} />
                      {empresa.email || "-"}
                    </p>
                  </td>

                  <td className="p-4 text-slate-700">
                    <p className="flex items-center gap-2">
                      <MapPin size={14} />
                      {empresa.cidade || "-"} {empresa.estado ? `/${empresa.estado}` : ""}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {empresa.endereco || "-"} {empresa.numero || ""}
                    </p>
                  </td>

                  <td className="p-4 text-slate-700">{empresa.regime_tributario || "-"}</td>

                  <td className="p-4">
                    {empresa.ativo !== false ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700">Ativa</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">Inativa</span>
                    )}
                  </td>

                  <td className="p-4 text-slate-700">{formatarData(empresa.created_at)}</td>

                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditarEmpresa(empresa)}
                        className="h-10 w-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center"
                        title="Editar"
                      >
                        <Edit size={17} />
                      </button>

                      {isSuperAdmin(usuarioLogado) && (
                        <>
                          <button
                            onClick={() => alterarStatus(empresa)}
                            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                              empresa.ativo !== false
                                ? "bg-orange-50 hover:bg-orange-100 text-orange-700"
                                : "bg-green-50 hover:bg-green-100 text-green-700"
                            }`}
                            title={empresa.ativo !== false ? "Inativar" : "Ativar"}
                          >
                            <CheckCircle size={17} />
                          </button>

                          <button
                            onClick={() => excluirEmpresa(empresa)}
                            className="h-10 w-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center"
                            title="Excluir"
                          >
                            <Trash2 size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhuma empresa encontrada para este usuário.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{modoEdicao ? "Editar Empresa" : "Nova Empresa"}</h2>
                <p className="text-slate-500">Preencha os dados cadastrais, fiscais, contato e identidade visual.</p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Dados Cadastrais</h3>

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

                  <Campo label="Inscrição Estadual">
                    <input value={form.inscricao_estadual} onChange={(e) => setForm({ ...form, inscricao_estadual: e.target.value })} placeholder="Inscrição Estadual" className="input" />
                  </Campo>

                  <Campo label="Inscrição Municipal">
                    <input value={form.inscricao_municipal} onChange={(e) => setForm({ ...form, inscricao_municipal: e.target.value })} placeholder="Inscrição Municipal" className="input" />
                  </Campo>

                  <Campo label="CNAE">
                    <input value={form.cnae} onChange={(e) => setForm({ ...form, cnae: e.target.value })} placeholder="CNAE" className="input" />
                  </Campo>

                  <Campo label="Regime Tributário">
                    <select value={form.regime_tributario} onChange={(e) => setForm({ ...form, regime_tributario: e.target.value })} className="input bg-white">
                      {regimes.map((regime) => (
                        <option key={regime} value={regime}>{regime}</option>
                      ))}
                    </select>
                  </Campo>

                  <Campo label="Status">
                    <select value={form.ativo ? "ativo" : "inativo"} disabled={!isSuperAdmin(usuarioLogado)} onChange={(e) => setForm({ ...form, ativo: e.target.value === "ativo" })} className="input bg-white disabled:bg-slate-100 disabled:text-slate-500">
                      <option value="ativo">Ativa</option>
                      <option value="inativo">Inativa</option>
                    </select>
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Contato</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Campo label="Telefone">
                    <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(99) 9999-9999" className="input" />
                  </Campo>

                  <Campo label="Celular">
                    <input value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} placeholder="(99) 99999-9999" className="input" />
                  </Campo>

                  <Campo label="WhatsApp">
                    <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(99) 99999-9999" className="input" />
                  </Campo>

                  <Campo label="E-mail">
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" className="input" />
                  </Campo>

                  <Campo label="Site" className="md:col-span-2">
                    <input value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} placeholder="www.empresa.com.br" className="input" />
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Endereço</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Campo label="CEP">
                    <input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="00000-000" className="input" />
                  </Campo>

                  <Campo label="Endereço" className="md:col-span-2">
                    <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua / Avenida" className="input" />
                  </Campo>

                  <Campo label="Número">
                    <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Nº" className="input" />
                  </Campo>

                  <Campo label="Bairro">
                    <input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Bairro" className="input" />
                  </Campo>

                  <Campo label="Cidade">
                    <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Cidade" className="input" />
                  </Campo>

                  <Campo label="Estado">
                    <input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="UF" maxLength={2} className="input uppercase" />
                  </Campo>

                  <Campo label="Complemento">
                    <input value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} placeholder="Complemento" className="input" />
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">Identidade Visual</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Campo label="URL da Logo" className="md:col-span-2">
                    <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." className="input" />
                  </Campo>

                  <Campo label="Cor Principal">
                    <input type="color" value={form.cor_principal} onChange={(e) => setForm({ ...form, cor_principal: e.target.value })} className="w-full h-12 border border-slate-300 rounded-2xl p-1" />
                  </Campo>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setModalAberto(false)} className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">
                Cancelar
              </button>

              <button onClick={salvarEmpresa} disabled={salvando} className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold disabled:opacity-60">
                {salvando ? "Salvando..." : modoEdicao ? "Salvar Alterações" : "Cadastrar Empresa"}
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
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      {children}
    </div>
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

        <div className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}>
          {icone}
        </div>
      </div>
    </div>
  );
}
