"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
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

type Usuario = {
  id: string;
  empresa_id: string | null;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  created_at: string | null;
  updated_at: string | null;
  senha: string | null;
  telefone: string | null;
  cargo: string | null;
  observacoes: string | null;
  ultimo_acesso: string | null;
  trocar_senha: boolean | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_crm: boolean | null;
  modulo_delivery: boolean | null;
  modulo_multiloja: boolean | null;
  modulo_relatorios_premium: boolean | null;
};

type Empresa = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean | null;
  modulo_fiscal?: boolean | null;
  modulo_whatsapp?: boolean | null;
  modulo_crm?: boolean | null;
  modulo_delivery?: boolean | null;
  modulo_multiloja?: boolean | null;
  modulo_relatorios_premium?: boolean | null;
};

type FormUsuario = {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  perfil: string;
  senha: string;
  confirmarSenha: string;
  observacoes: string;
  ativo: boolean;
  trocar_senha: boolean;
  modulo_fiscal: boolean;
  modulo_whatsapp: boolean;
  modulo_crm: boolean;
  modulo_delivery: boolean;
  modulo_multiloja: boolean;
  modulo_relatorios_premium: boolean;
};

const EMPRESA_PADRAO: Empresa = {
  id: "",
  razao_social: "Empresa",
  nome_fantasia: "Empresa",
  cnpj: null,
  telefone: null,
  email: null,
  ativo: true,
  modulo_fiscal: false,
  modulo_whatsapp: false,
  modulo_crm: false,
  modulo_delivery: false,
  modulo_multiloja: false,
  modulo_relatorios_premium: false,
};

const perfis = [
  "Administrador",
  "Gerente",
  "Financeiro",
  "Estoquista",
  "Operador de Caixa",
  "Vendedor",
];

export default function UsuariosPage() {
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado>({});
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [form, setForm] = useState<FormUsuario>({
    id: "",
    empresa_id: "",
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    perfil: "Vendedor",
    senha: "",
    confirmarSenha: "",
    observacoes: "",
    ativo: true,
    trocar_senha: false,
    modulo_fiscal: false,
    modulo_whatsapp: false,
    modulo_crm: false,
    modulo_delivery: false,
    modulo_multiloja: false,
    modulo_relatorios_premium: false,
  });

  function getUsuarioLogado() {
    const dados = JSON.parse(
      localStorage.getItem("th_usuario") || "{}"
    ) as UsuarioLogado;

    return dados;
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

  function formatarTelefone(valor: string | null) {
    if (!valor) return "-";

    const numeros = somenteNumeros(valor);

    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }

    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return valor;
  }

  function validarEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
  }

  function buscarEmpresaSelecionada(empresaId: string) {
    return empresas.find((empresa) => empresa.id === empresaId);
  }

  function aplicarModulosDaEmpresa(empresaId: string) {
    const empresa = buscarEmpresaSelecionada(empresaId);

    return {
      modulo_fiscal: empresa?.modulo_fiscal === true,
      modulo_whatsapp: empresa?.modulo_whatsapp === true,
      modulo_crm: empresa?.modulo_crm === true,
      modulo_delivery: empresa?.modulo_delivery === true,
      modulo_multiloja: empresa?.modulo_multiloja === true,
      modulo_relatorios_premium:
        empresa?.modulo_relatorios_premium === true,
    };
  }

  function empresaIdFormulario() {
    const logado = usuarioLogado;
    const superAdmin = isSuperAdmin(logado);

    if (!superAdmin) {
      return empresaPermitidaId(logado);
    }

    return empresas[0]?.id || "";
  }

  function limparFormulario() {
    const empresaId = empresaIdFormulario();

    setForm({
      id: "",
      empresa_id: empresaId,
      nome: "",
      email: "",
      telefone: "",
      cargo: "",
      perfil: "Vendedor",
      senha: "",
      confirmarSenha: "",
      observacoes: "",
      ativo: true,
      trocar_senha: false,
      ...aplicarModulosDaEmpresa(empresaId),
    });

    setMostrarSenha(false);
    setMostrarConfirmacao(false);
    setModoEdicao(false);
  }

  function abrirNovoUsuario() {
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEditarUsuario(usuario: Usuario) {
    if (!isSuperAdmin(usuarioLogado)) {
      const empresaId = empresaPermitidaId(usuarioLogado);

      if (usuario.empresa_id !== empresaId) {
        alert("Você não tem permissão para editar usuários de outra empresa.");
        return;
      }
    }

    setForm({
      id: usuario.id,
      empresa_id: usuario.empresa_id || empresaIdFormulario(),
      nome: usuario.nome || "",
      email: usuario.email || "",
      telefone: usuario.telefone || "",
      cargo: usuario.cargo || "",
      perfil: usuario.perfil || "Vendedor",
      senha: "",
      confirmarSenha: "",
      observacoes: usuario.observacoes || "",
      ativo: usuario.ativo,
      trocar_senha: usuario.trocar_senha || false,
      modulo_fiscal: usuario.modulo_fiscal === true,
      modulo_whatsapp: usuario.modulo_whatsapp === true,
      modulo_crm: usuario.modulo_crm === true,
      modulo_delivery: usuario.modulo_delivery === true,
      modulo_multiloja: usuario.modulo_multiloja === true,
      modulo_relatorios_premium:
        usuario.modulo_relatorios_premium === true,
    });

    setMostrarSenha(false);
    setMostrarConfirmacao(false);
    setModoEdicao(true);
    setModalAberto(true);
  }

  function nomeEmpresa(empresaId: string | null) {
    if (!empresaId) return "-";

    const empresa = empresas.find((item) => item.id === empresaId);

    return empresa?.nome_fantasia || empresa?.razao_social || "Empresa";
  }

  function classePerfil(perfil: string) {
    if (perfil === "Super Admin") return "bg-slate-900 text-white";
    if (perfil === "Administrador") return "bg-blue-100 text-blue-700";
    if (perfil === "Gerente") return "bg-purple-100 text-purple-700";
    if (perfil === "Financeiro") return "bg-green-100 text-green-700";
    if (perfil === "Estoquista") return "bg-orange-100 text-orange-700";
    if (perfil === "Operador de Caixa") return "bg-cyan-100 text-cyan-700";
    return "bg-slate-100 text-slate-700";
  }

  function quantidadeModulos(usuario: Usuario) {
    return [
      usuario.modulo_fiscal,
      usuario.modulo_whatsapp,
      usuario.modulo_crm,
      usuario.modulo_delivery,
      usuario.modulo_multiloja,
      usuario.modulo_relatorios_premium,
    ].filter(Boolean).length;
  }

  async function carregarEmpresas(logado: UsuarioLogado) {
    const superAdmin = isSuperAdmin(logado);
    const empresaId = empresaPermitidaId(logado);

    let consulta = supabase
      .from("empresas")
      .select(
        "id,razao_social,nome_fantasia,cnpj,telefone,email,ativo,modulo_fiscal,modulo_whatsapp,modulo_crm,modulo_delivery,modulo_multiloja,modulo_relatorios_premium"
      )
      .order("nome_fantasia", { ascending: true });

    if (!superAdmin) {
      if (!empresaId) {
        setEmpresas([]);
        return;
      }

      consulta = consulta.eq("id", empresaId);
    }

    const empresasReq = await consulta;

    if (empresasReq.error) {
      alert("Erro ao carregar empresas: " + empresasReq.error.message);
      return;
    }

    const listaEmpresas: Empresa[] =
      empresasReq.data && empresasReq.data.length > 0
        ? empresasReq.data
        : empresaId
        ? [
            {
              ...EMPRESA_PADRAO,
              id: empresaId,
              nome_fantasia: logado.empresa_nome || "Empresa",
              razao_social: logado.empresa_nome || "Empresa",
            },
          ]
        : [];

    setEmpresas(listaEmpresas);

    setForm((atual) => ({
      ...atual,
      empresa_id: atual.empresa_id || listaEmpresas[0]?.id || "",
    }));
  }

  async function carregarUsuarios(logado: UsuarioLogado) {
    const superAdmin = isSuperAdmin(logado);
    const empresaId = empresaPermitidaId(logado);

    let consulta = supabase
      .from("usuarios")
      .select(
        "id,empresa_id,nome,email,perfil,ativo,created_at,updated_at,senha,telefone,cargo,observacoes,ultimo_acesso,trocar_senha,modulo_fiscal,modulo_whatsapp,modulo_crm,modulo_delivery,modulo_multiloja,modulo_relatorios_premium"
      )
      .order("nome", { ascending: true });

    if (!superAdmin) {
      if (!empresaId) {
        setUsuarios([]);
        return;
      }

      consulta = consulta.eq("empresa_id", empresaId);
    }

    const usuariosReq = await consulta;

    if (usuariosReq.error) {
      alert("Erro ao carregar usuários: " + usuariosReq.error.message);
      return;
    }

    setUsuarios(usuariosReq.data || []);
  }

  async function carregarDados() {
    const logado = getUsuarioLogado();
    setUsuarioLogado(logado);

    if (!logado.id && !logado.email) {
      alert("Usuário não identificado. Faça login novamente.");
      return;
    }

    await carregarEmpresas(logado);
    await carregarUsuarios(logado);
  }

  function validarFormulario() {
    const superAdmin = isSuperAdmin(usuarioLogado);
    const empresaId = empresaPermitidaId(usuarioLogado);

    if (!form.empresa_id) {
      alert("Selecione uma empresa.");
      return false;
    }

    if (!superAdmin && form.empresa_id !== empresaId) {
      alert("Você só pode cadastrar usuários da sua própria empresa.");
      return false;
    }

    if (!form.nome.trim()) {
      alert("Informe o nome do usuário.");
      return false;
    }

    if (!form.email.trim()) {
      alert("Informe o e-mail do usuário.");
      return false;
    }

    if (!validarEmail(form.email.trim())) {
      alert("Informe um e-mail válido.");
      return false;
    }

    if (!modoEdicao && !form.senha.trim()) {
      alert("Informe uma senha para o usuário.");
      return false;
    }

    if (form.senha.trim() || form.confirmarSenha.trim()) {
      if (form.senha.length < 4) {
        alert("A senha deve ter pelo menos 4 caracteres.");
        return false;
      }

      if (form.senha !== form.confirmarSenha) {
        alert("A confirmação da senha não confere.");
        return false;
      }
    }

    return true;
  }

  async function salvarUsuario() {
    if (!validarFormulario()) return;

    setSalvando(true);

    const superAdmin = isSuperAdmin(usuarioLogado);
    const empresaIdPermitida = empresaPermitidaId(usuarioLogado);
    const empresaIdFinal = superAdmin ? form.empresa_id : empresaIdPermitida;

    const dadosBase = {
      empresa_id: empresaIdFinal,
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      telefone: form.telefone.trim() || null,
      cargo: form.cargo.trim() || null,
      perfil: form.perfil,
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
      trocar_senha: form.trocar_senha,
      modulo_fiscal: form.modulo_fiscal,
      modulo_whatsapp: form.modulo_whatsapp,
      modulo_crm: form.modulo_crm,
      modulo_delivery: form.modulo_delivery,
      modulo_multiloja: form.modulo_multiloja,
      modulo_relatorios_premium: form.modulo_relatorios_premium,
      updated_at: new Date().toISOString(),
    };

    if (modoEdicao) {
      const dadosAtualizacao =
        form.senha.trim() !== ""
          ? {
              ...dadosBase,
              senha: form.senha.trim(),
            }
          : dadosBase;

      let consulta = supabase
        .from("usuarios")
        .update(dadosAtualizacao)
        .eq("id", form.id);

      if (!superAdmin) {
        consulta = consulta.eq("empresa_id", empresaIdPermitida);
      }

      const { error } = await consulta;

      setSalvando(false);

      if (error) {
        alert("Erro ao atualizar usuário: " + error.message);
        return;
      }

      alert("Usuário atualizado com sucesso!");
    } else {
      const { error } = await supabase.from("usuarios").insert({
        ...dadosBase,
        senha: form.senha.trim(),
      });

      setSalvando(false);

      if (error) {
        if (error.message.includes("usuarios_email_key")) {
          alert("Já existe um usuário cadastrado com este e-mail.");
          return;
        }

        alert("Erro ao cadastrar usuário: " + error.message);
        return;
      }

      alert("Usuário cadastrado com sucesso!");
    }

    setModalAberto(false);
    limparFormulario();
    carregarDados();
  }

  async function alterarStatus(usuario: Usuario) {
    const superAdmin = isSuperAdmin(usuarioLogado);
    const empresaIdPermitida = empresaPermitidaId(usuarioLogado);

    if (!superAdmin && usuario.empresa_id !== empresaIdPermitida) {
      alert("Você não tem permissão para alterar usuários de outra empresa.");
      return;
    }

    const acao = usuario.ativo ? "inativar" : "ativar";

    const confirmar = confirm(
      `Deseja realmente ${acao} o usuário ${usuario.nome}?`
    );

    if (!confirmar) return;

    let consulta = supabase
      .from("usuarios")
      .update({
        ativo: !usuario.ativo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", usuario.id);

    if (!superAdmin) {
      consulta = consulta.eq("empresa_id", empresaIdPermitida);
    }

    const { error } = await consulta;

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    carregarDados();
  }

  async function excluirUsuario(usuario: Usuario) {
    const superAdmin = isSuperAdmin(usuarioLogado);
    const empresaIdPermitida = empresaPermitidaId(usuarioLogado);

    if (!superAdmin && usuario.empresa_id !== empresaIdPermitida) {
      alert("Você não tem permissão para excluir usuários de outra empresa.");
      return;
    }

    const confirmar = confirm(
      `Deseja realmente excluir o usuário ${usuario.nome}? Esta ação não poderá ser desfeita.`
    );

    if (!confirmar) return;

    let consulta = supabase.from("usuarios").delete().eq("id", usuario.id);

    if (!superAdmin) {
      consulta = consulta.eq("empresa_id", empresaIdPermitida);
    }

    const { error } = await consulta;

    if (error) {
      alert("Erro ao excluir usuário: " + error.message);
      return;
    }

    alert("Usuário excluído com sucesso!");
    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termo = busca.trim().toLowerCase();

    const bateBusca =
      termo === "" ||
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email.toLowerCase().includes(termo) ||
      String(usuario.telefone || "").toLowerCase().includes(termo) ||
      String(usuario.cargo || "").toLowerCase().includes(termo) ||
      usuario.perfil.toLowerCase().includes(termo);

    const batePerfil =
      filtroPerfil === "Todos" || usuario.perfil === filtroPerfil;

    const bateStatus =
      filtroStatus === "Todos" ||
      (filtroStatus === "Ativos" && usuario.ativo) ||
      (filtroStatus === "Inativos" && !usuario.ativo);

    return bateBusca && batePerfil && bateStatus;
  });

  const totalAtivos = usuarios.filter((usuario) => usuario.ativo).length;
  const totalInativos = usuarios.filter((usuario) => !usuario.ativo).length;
  const totalAdministradores = usuarios.filter(
    (usuario) => usuario.perfil === "Administrador"
  ).length;

  const totalComModulos = usuarios.filter(
    (usuario) => quantidadeModulos(usuario) > 0
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">THCloud ERP</p>

            <h1 className="text-4xl font-black mt-2">
              Usuários e Permissões
            </h1>

            <p className="text-blue-100 mt-2 max-w-3xl">
              Cadastre, edite e controle perfis, módulos liberados, dados de
              contato e senhas dos usuários.
            </p>

            {!isSuperAdmin(usuarioLogado) && (
              <p className="text-blue-100 mt-2 text-sm font-bold">
                Empresa atual:{" "}
                {usuarioLogado.empresa_nome || empresas[0]?.nome_fantasia || "Empresa"}
              </p>
            )}
          </div>

          <button
            onClick={abrirNovoUsuario}
            className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <ResumoCard
          titulo="Total de Usuários"
          valor={`${usuarios.length}`}
          detalhe="Usuários cadastrados"
          cor="text-blue-700"
          icone={<Users size={24} />}
        />

        <ResumoCard
          titulo="Ativos"
          valor={`${totalAtivos}`}
          detalhe="Usuários liberados"
          cor="text-green-700"
          icone={<CheckCircle size={24} />}
        />

        <ResumoCard
          titulo="Inativos"
          valor={`${totalInativos}`}
          detalhe="Usuários bloqueados"
          cor="text-red-700"
          icone={<XCircle size={24} />}
        />

        <ResumoCard
          titulo="Com Módulos"
          valor={`${totalComModulos}`}
          detalhe={`${totalAdministradores} administrador(es)`}
          cor="text-purple-700"
          icone={<Shield size={24} />}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, telefone, cargo ou perfil..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900"
            />
          </div>

          <select
            value={filtroPerfil}
            onChange={(e) => setFiltroPerfil(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white"
          >
            <option value="Todos">Todos os perfis</option>
            {perfis.map((perfil) => (
              <option key={perfil} value={perfil}>
                {perfil}
              </option>
            ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white"
          >
            <option value="Todos">Todos os status</option>
            <option value="Ativos">Ativos</option>
            <option value="Inativos">Inativos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Lista de Usuários
            </h2>

            <p className="text-slate-500">
              {usuariosFiltrados.length} usuário(s) encontrado(s).
            </p>
          </div>

          <button
            onClick={carregarDados}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
          >
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                <th className="p-4">Usuário</th>
                <th className="p-4">Empresa</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Perfil</th>
                <th className="p-4">Módulos</th>
                <th className="p-4">Status</th>
                <th className="p-4">Último acesso</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                        {usuario.nome.substring(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-black text-slate-900">
                          {usuario.nome}
                        </p>

                        <p className="text-slate-500">{usuario.email}</p>

                        {usuario.trocar_senha && (
                          <p className="text-xs text-orange-700 font-bold mt-1">
                            Deve trocar senha
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-slate-700">
                    {nomeEmpresa(usuario.empresa_id)}
                  </td>

                  <td className="p-4 text-slate-700">
                    {formatarTelefone(usuario.telefone)}
                  </td>

                  <td className="p-4 text-slate-700">
                    {usuario.cargo || "-"}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${classePerfil(
                        usuario.perfil
                      )}`}
                    >
                      {usuario.perfil}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                      {quantidadeModulos(usuario)} módulo(s)
                    </span>
                  </td>

                  <td className="p-4">
                    {usuario.ativo ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
                        Inativo
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-slate-700">
                    {formatarData(usuario.ultimo_acesso)}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditarUsuario(usuario)}
                        className="h-10 w-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center"
                        title="Editar"
                      >
                        <Edit size={17} />
                      </button>

                      <button
                        onClick={() => alterarStatus(usuario)}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          usuario.ativo
                            ? "bg-orange-50 hover:bg-orange-100 text-orange-700"
                            : "bg-green-50 hover:bg-green-100 text-green-700"
                        }`}
                        title={usuario.ativo ? "Inativar" : "Ativar"}
                      >
                        <UserCheck size={17} />
                      </button>

                      <button
                        onClick={() => excluirUsuario(usuario)}
                        className="h-10 w-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center"
                        title="Excluir"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Nenhum usuário encontrado para esta empresa.
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
                  {modoEdicao ? "Editar Usuário" : "Novo Usuário"}
                </h2>

                <p className="text-slate-500">
                  Defina os dados, perfil, módulos e senha de acesso.
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  Dados do Usuário
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Empresa
                    </label>

                    <select
                      value={form.empresa_id}
                      disabled={!isSuperAdmin(usuarioLogado)}
                      onChange={(e) => {
                        const empresaId = e.target.value;

                        setForm({
                          ...form,
                          empresa_id: empresaId,
                          ...aplicarModulosDaEmpresa(empresaId),
                        });
                      }}
                      className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.nome_fantasia ||
                            empresa.razao_social ||
                            "Empresa"}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nome
                    </label>

                    <input
                      value={form.nome}
                      onChange={(e) =>
                        setForm({ ...form, nome: e.target.value })
                      }
                      placeholder="Nome do usuário"
                      className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      E-mail
                    </label>

                    <input
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="email@empresa.com"
                      className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Telefone
                    </label>

                    <input
                      value={form.telefone}
                      onChange={(e) =>
                        setForm({ ...form, telefone: e.target.value })
                      }
                      placeholder="(99) 99999-9999"
                      className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Cargo / Função
                    </label>

                    <input
                      value={form.cargo}
                      onChange={(e) =>
                        setForm({ ...form, cargo: e.target.value })
                      }
                      placeholder="Ex.: Caixa, Gerente, Estoquista"
                      className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Perfil
                    </label>

                    <select
                      value={form.perfil}
                      onChange={(e) =>
                        setForm({ ...form, perfil: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900 bg-white"
                    >
                      {perfis.map((perfil) => (
                        <option key={perfil} value={perfil}>
                          {perfil}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  Módulos Liberados para Este Usuário
                </h3>

                <p className="text-sm text-slate-500 mb-4">
                  Marque somente os módulos que este usuário poderá acessar. O menu lateral usa essas permissões no login.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CheckBoxModulo
                    titulo="Fiscal"
                    descricao="NF-e, NFC-e e rotinas fiscais"
                    marcado={form.modulo_fiscal}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_fiscal: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="WhatsApp"
                    descricao="Envios e automações"
                    marcado={form.modulo_whatsapp}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_whatsapp: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="CRM"
                    descricao="Relacionamento e oportunidades"
                    marcado={form.modulo_crm}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_crm: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="Delivery"
                    descricao="Pedidos externos e entregas"
                    marcado={form.modulo_delivery}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_delivery: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="Multiloja"
                    descricao="Várias unidades"
                    marcado={form.modulo_multiloja}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_multiloja: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="Relatórios Premium"
                    descricao="Indicadores avançados"
                    marcado={form.modulo_relatorios_premium}
                    onChange={(valor) =>
                      setForm({
                        ...form,
                        modulo_relatorios_premium: valor,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  Segurança
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {modoEdicao ? "Nova Senha" : "Senha"}
                    </label>

                    <div className="relative">
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        value={form.senha}
                        onChange={(e) =>
                          setForm({ ...form, senha: e.target.value })
                        }
                        placeholder={
                          modoEdicao
                            ? "Deixe vazio para não alterar"
                            : "Digite a senha"
                        }
                        className="w-full border border-slate-300 rounded-2xl p-3 pr-12 text-slate-900"
                      />

                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      >
                        {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Confirmar Senha
                    </label>

                    <div className="relative">
                      <input
                        type={mostrarConfirmacao ? "text" : "password"}
                        value={form.confirmarSenha}
                        onChange={(e) =>
                          setForm({ ...form, confirmarSenha: e.target.value })
                        }
                        placeholder="Confirme a senha"
                        className="w-full border border-slate-300 rounded-2xl p-3 pr-12 text-slate-900"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarConfirmacao(!mostrarConfirmacao)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      >
                        {mostrarConfirmacao ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Status
                    </label>

                    <select
                      value={form.ativo ? "ativo" : "inativo"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ativo: e.target.value === "ativo",
                        })
                      }
                      className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900 bg-white"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Trocar senha no próximo login?
                    </label>

                    <select
                      value={form.trocar_senha ? "sim" : "nao"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          trocar_senha: e.target.value === "sim",
                        })
                      }
                      className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900 bg-white"
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </Campo>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  Observações
                </h3>

                <textarea
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  placeholder="Observações internas sobre o usuário..."
                  className="w-full border border-slate-300 rounded-2xl p-3 text-slate-900 min-h-28"
                />
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <p className="text-sm font-bold text-orange-800">
                  Aviso de segurança
                </p>

                <p className="text-sm text-orange-700 mt-1">
                  Nesta fase a senha está sendo salva no campo interno da tabela
                  usuários para desenvolvimento. Na versão final de produção o
                  ideal é usar Supabase Auth e senha criptografada.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={salvarUsuario}
                disabled={salvando}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : modoEdicao
                  ? "Salvar Alterações"
                  : "Cadastrar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
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
