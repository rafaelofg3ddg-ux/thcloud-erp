"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  History,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlock,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  ativo: boolean | null;
  plano: string | null;
  status_assinatura: string | null;
  valor_mensal: number | null;
  data_vencimento_assinatura: string | null;
  ultimo_acesso: string | null;
  ultimo_usuario_acesso: string | null;
  bloqueio_motivo: string | null;
  bloqueada_em: string | null;
  created_at: string | null;
};

type Usuario = {
  id: string;
  empresa_id: string | null;
  nome: string | null;
  email: string | null;
  usuario: string | null;
  perfil: string | null;
  ativo: boolean | null;
  ultimo_acesso: string | null;
  resetar_senha_proximo_login: boolean | null;
};

type Auditoria = {
  id: string;
  empresa_id: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  tipo: string | null;
  acao: string | null;
  descricao: string | null;
  created_at: string | null;
};

type Acesso = {
  id: string;
  empresa_id: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  usuario_email: string | null;
  perfil: string | null;
  sucesso: boolean | null;
  motivo: string | null;
  created_at: string | null;
};

export default function AdminControlePage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function nomeEmpresa(empresa: Empresa) {
    return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
  }

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function dataHora(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function dataSimples(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function normalizarStatus(status: string | null) {
    const valor = String(status || "").toLowerCase();

    if (valor === "ativo" || valor === "ativa") return "Ativo";
    if (valor === "teste") return "Teste";
    if (valor === "vencido" || valor === "vencida") return "Vencido";
    if (valor === "bloqueado" || valor === "bloqueada") return "Bloqueado";
    if (valor === "cancelado" || valor === "cancelada") return "Cancelado";
    if (valor === "suspenso" || valor === "suspensa") return "Suspenso";

    return status || "Ativo";
  }

  function statusEmpresa(empresa: Empresa) {
    if (empresa.ativo === false) return "Bloqueada";

    if (
      empresa.data_vencimento_assinatura &&
      empresa.data_vencimento_assinatura < hojeISO()
    ) {
      return "Vencida";
    }

    return normalizarStatus(empresa.status_assinatura);
  }

  function usuariosDaEmpresa(empresaId: string) {
    return usuarios.filter((usuario) => usuario.empresa_id === empresaId);
  }

  function adminsDaEmpresa(empresaId: string) {
    return usuariosDaEmpresa(empresaId).filter((usuario) =>
      String(usuario.perfil || "").toLowerCase().includes("admin")
    );
  }

  function ultimoAcessoEmpresa(empresa: Empresa) {
    if (empresa.ultimo_acesso) return empresa.ultimo_acesso;

    const listaUsuarios = usuariosDaEmpresa(empresa.id)
      .filter((usuario) => usuario.ultimo_acesso)
      .sort((a, b) =>
        String(b.ultimo_acesso || "").localeCompare(String(a.ultimo_acesso || ""))
      );

    return listaUsuarios[0]?.ultimo_acesso || null;
  }

  async function registrarAuditoria(
    empresaId: string | null,
    tipo: string,
    acao: string,
    descricao: string
  ) {
    try {
      await supabase.from("auditoria_saas").insert([
        {
          empresa_id: empresaId,
          usuario_nome: "Super Admin",
          tipo,
          acao,
          descricao,
        },
      ]);

      if (empresaId) {
        await supabase.from("historico_empresas").insert([
          {
            empresa_id: empresaId,
            acao,
            descricao,
            usuario: "Super Admin",
          },
        ]);
      }
    } catch {}
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: empresasData, error: empresasError } = await supabase
      .from("empresas")
      .select(
        "id,nome_fantasia,razao_social,cnpj,email,telefone,celular,ativo,plano,status_assinatura,valor_mensal,data_vencimento_assinatura,ultimo_acesso,ultimo_usuario_acesso,bloqueio_motivo,bloqueada_em,created_at"
      )
      .order("created_at", { ascending: false });

    if (empresasError) {
      setCarregando(false);
      alert("Erro ao carregar empresas: " + empresasError.message);
      return;
    }

    setEmpresas((empresasData || []) as Empresa[]);

    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id,empresa_id,nome,email,usuario,perfil,ativo,ultimo_acesso,resetar_senha_proximo_login")
      .order("nome", { ascending: true });

    setUsuarios((usuariosData || []) as Usuario[]);

    const { data: auditoriasData } = await supabase
      .from("auditoria_saas")
      .select("id,empresa_id,usuario_id,usuario_nome,tipo,acao,descricao,created_at")
      .order("created_at", { ascending: false })
      .limit(80);

    setAuditorias((auditoriasData || []) as Auditoria[]);

    const { data: acessosData } = await supabase
      .from("acessos_saas")
      .select("id,empresa_id,usuario_id,usuario_nome,usuario_email,perfil,sucesso,motivo,created_at")
      .order("created_at", { ascending: false })
      .limit(80);

    setAcessos((acessosData || []) as Acesso[]);

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const empresasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return empresas.filter((empresa) => {
      const texto = `${nomeEmpresa(empresa)} ${empresa.cnpj || ""} ${empresa.email || ""} ${empresa.telefone || ""} ${empresa.celular || ""} ${empresa.plano || ""}`.toLowerCase();

      const passaBusca = !termo || texto.includes(termo);
      const passaStatus =
        filtroStatus === "Todos" || statusEmpresa(empresa) === filtroStatus;

      return passaBusca && passaStatus;
    });
  }, [empresas, busca, filtroStatus, usuarios]);

  const totalEmpresas = empresas.length;
  const empresasAtivas = empresas.filter((empresa) => statusEmpresa(empresa) === "Ativo").length;
  const empresasTeste = empresas.filter((empresa) => statusEmpresa(empresa) === "Teste").length;
  const empresasBloqueadas = empresas.filter((empresa) => statusEmpresa(empresa) === "Bloqueada").length;
  const empresasVencidas = empresas.filter((empresa) => statusEmpresa(empresa) === "Vencida").length;
  const receitaPrevista = empresas
    .filter((empresa) => empresa.ativo !== false)
    .reduce((total, empresa) => total + Number(empresa.valor_mensal || 0), 0);

  async function bloquearEmpresa(empresa: Empresa) {
    const motivo = prompt("Informe o motivo do bloqueio:", "Bloqueio manual pelo Super Admin");

    if (motivo === null) return;

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: false,
        status_assinatura: "Bloqueado",
        bloqueio_motivo: motivo || "Bloqueio manual pelo Super Admin",
        bloqueada_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao bloquear empresa: " + error.message);
      return;
    }

    await registrarAuditoria(
      empresa.id,
      "seguranca",
      "Empresa bloqueada",
      `${nomeEmpresa(empresa)} foi bloqueada manualmente. Motivo: ${motivo || "Não informado"}.`
    );

    await carregarDados();
  }

  async function liberarEmpresa(empresa: Empresa) {
    if (!confirm(`Liberar acesso da empresa ${nomeEmpresa(empresa)}?`)) return;

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: true,
        status_assinatura: "Ativo",
        bloqueio_motivo: null,
        bloqueada_em: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao liberar empresa: " + error.message);
      return;
    }

    await registrarAuditoria(
      empresa.id,
      "seguranca",
      "Empresa liberada",
      `${nomeEmpresa(empresa)} teve o acesso liberado manualmente.`
    );

    await carregarDados();
  }

  async function resetarSenhaAdmin(empresa: Empresa) {
    const admin = adminsDaEmpresa(empresa.id)[0];

    if (!admin) {
      alert("Nenhum usuário administrador encontrado para esta empresa.");
      return;
    }

    const novaSenha =
      prompt(
        `Informe a nova senha para ${admin.nome || admin.email || admin.usuario}:`,
        `th${Math.floor(100000 + Math.random() * 900000)}`
      ) || "";

    if (!novaSenha.trim()) return;

    const { error } = await supabase
      .from("usuarios")
      .update({
        senha: novaSenha.trim(),
        resetar_senha_proximo_login: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id);

    if (error) {
      alert("Erro ao resetar senha: " + error.message);
      return;
    }

    await registrarAuditoria(
      empresa.id,
      "seguranca",
      "Senha resetada",
      `Senha do administrador ${admin.nome || admin.email || admin.usuario} foi resetada pelo Super Admin.`
    );

    alert(`Senha resetada com sucesso.\n\nLogin: ${admin.email || admin.usuario}\nNova senha: ${novaSenha.trim()}`);

    await carregarDados();
  }

  function abrirDetalhes(empresa: Empresa) {
    setEmpresaSelecionada(empresa);
    setModalAberto(true);
  }

  function empresaPorId(empresaId: string | null) {
    if (!empresaId) return null;
    return empresas.find((empresa) => empresa.id === empresaId) || null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>

            <h1 className="text-3xl lg:text-4xl font-black mt-2">
              Centro de Controle SaaS
            </h1>

            <p className="mt-2 text-blue-100 max-w-4xl">
              Monitore empresas, acessos, segurança, bloqueios, usuários e auditoria operacional do Super Admin.
            </p>
          </div>

          <button
            onClick={carregarDados}
            className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <Card titulo="Empresas" valor={`${totalEmpresas}`} detalhe="Cadastradas" cor="text-blue-700" icone={<Building2 size={22} />} />
        <Card titulo="Ativas" valor={`${empresasAtivas}`} detalhe="Acesso liberado" cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Teste" valor={`${empresasTeste}`} detalhe="Trial ativo" cor="text-cyan-700" icone={<Clock size={22} />} />
        <Card titulo="Bloqueadas" valor={`${empresasBloqueadas}`} detalhe="Acesso suspenso" cor="text-red-700" icone={<Lock size={22} />} />
        <Card titulo="Vencidas" valor={`${empresasVencidas}`} detalhe="Precisam atenção" cor="text-orange-700" icone={<AlertTriangle size={22} />} />
        <Card titulo="MRR previsto" valor={moeda(receitaPrevista)} detalhe="Receita ativa" cor="text-purple-700" icone={<ShieldCheck size={22} />} />
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar empresa, CNPJ, e-mail, telefone ou plano..."
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
            <option>Bloqueada</option>
            <option>Vencida</option>
            <option>Cancelado</option>
            <option>Suspenso</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} />
          {empresasFiltradas.length} empresa(s) encontrada(s)
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Plano</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Último acesso</th>
                <th className="p-4 text-left">Usuários</th>
                <th className="p-4 text-left">Vencimento</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Carregando controle SaaS...
                  </td>
                </tr>
              )}

              {!carregando &&
                empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-950">{nomeEmpresa(empresa)}</p>
                      <p className="text-xs text-slate-500">{empresa.cnpj || "Sem CNPJ"}</p>
                      <p className="text-xs text-blue-700 font-bold">{empresa.email || "-"}</p>
                    </td>

                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black">
                        {empresa.plano || "Básico"}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {moeda(Number(empresa.valor_mensal || 0))}
                      </p>
                    </td>

                    <td className="p-4">
                      <StatusBadge status={statusEmpresa(empresa)} />
                      {empresa.bloqueio_motivo && (
                        <p className="text-xs text-red-600 mt-1 font-bold">
                          {empresa.bloqueio_motivo}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {dataHora(ultimoAcessoEmpresa(empresa))}
                      </p>
                      <p className="text-xs text-slate-500">
                        {empresa.ultimo_usuario_acesso || "Sem registro"}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-black text-slate-900">
                        {usuariosDaEmpresa(empresa.id).length}
                      </p>
                      <p className="text-xs text-slate-500">
                        {adminsDaEmpresa(empresa.id).length} admin(s)
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {dataSimples(empresa.data_vencimento_assinatura)}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <Botao cor="slate" titulo="Detalhes" onClick={() => abrirDetalhes(empresa)}>
                          <Eye size={17} />
                        </Botao>

                        <Botao cor="purple" titulo="Resetar senha Admin" onClick={() => resetarSenhaAdmin(empresa)}>
                          <KeyRound size={17} />
                        </Botao>

                        {empresa.ativo === false ? (
                          <Botao cor="green" titulo="Liberar empresa" onClick={() => liberarEmpresa(empresa)}>
                            <Unlock size={17} />
                          </Botao>
                        ) : (
                          <Botao cor="red" titulo="Bloquear empresa" onClick={() => bloquearEmpresa(empresa)}>
                            <Lock size={17} />
                          </Botao>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              {!carregando && empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PainelLista
          titulo="Últimos acessos"
          subtitulo="Registros mais recentes de login."
          icone={<Users size={22} />}
        >
          {acessos.map((acesso) => {
            const empresa = empresaPorId(acesso.empresa_id);

            return (
              <div key={acesso.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">
                      {acesso.usuario_nome || acesso.usuario_email || "Usuário"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {empresa ? nomeEmpresa(empresa) : "Empresa não encontrada"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {dataHora(acesso.created_at)}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      acesso.sucesso
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {acesso.sucesso ? "Sucesso" : "Falha"}
                  </span>
                </div>
              </div>
            );
          })}

          {acessos.length === 0 && (
            <div className="text-center text-slate-500 p-8">
              Nenhum acesso registrado.
            </div>
          )}
        </PainelLista>

        <PainelLista
          titulo="Auditoria SaaS"
          subtitulo="Últimas ações administrativas registradas."
          icone={<History size={22} />}
        >
          {auditorias.map((item) => {
            const empresa = empresaPorId(item.empresa_id);

            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-black text-slate-900">{item.acao || "-"}</p>
                <p className="text-sm text-slate-600 mt-1">{item.descricao || "-"}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {empresa ? nomeEmpresa(empresa) : "Sistema"} • {dataHora(item.created_at)}
                </p>
              </div>
            );
          })}

          {auditorias.length === 0 && (
            <div className="text-center text-slate-500 p-8">
              Nenhum log de auditoria registrado.
            </div>
          )}
        </PainelLista>
      </section>

      {modalAberto && empresaSelecionada && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <div className="bg-slate-950 text-white p-6 flex items-center justify-between">
              <div>
                <p className="text-blue-200 font-bold">Detalhes do controle</p>
                <h2 className="text-2xl font-black">{nomeEmpresa(empresaSelecionada)}</h2>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Info label="CNPJ" value={empresaSelecionada.cnpj || "-"} />
              <Info label="E-mail" value={empresaSelecionada.email || "-"} />
              <Info label="Telefone" value={empresaSelecionada.telefone || empresaSelecionada.celular || "-"} />
              <Info label="Plano" value={empresaSelecionada.plano || "Básico"} />
              <Info label="Status" value={statusEmpresa(empresaSelecionada)} />
              <Info label="Mensalidade" value={moeda(Number(empresaSelecionada.valor_mensal || 0))} />
              <Info label="Vencimento" value={dataSimples(empresaSelecionada.data_vencimento_assinatura)} />
              <Info label="Último acesso" value={dataHora(ultimoAcessoEmpresa(empresaSelecionada))} />
              <Info label="Último usuário" value={empresaSelecionada.ultimo_usuario_acesso || "-"} />
              <Info label="Motivo bloqueio" value={empresaSelecionada.bloqueio_motivo || "-"} />
            </div>

            <div className="p-6 border-t">
              <h3 className="text-xl font-black text-slate-950 mb-4">
                Usuários da empresa
              </h3>

              <div className="space-y-3">
                {usuariosDaEmpresa(empresaSelecionada.id).map((usuario) => (
                  <div key={usuario.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{usuario.nome || usuario.email || usuario.usuario}</p>
                      <p className="text-sm text-slate-500">
                        {usuario.email || usuario.usuario} • {usuario.perfil || "Usuário"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Último acesso: {dataHora(usuario.ultimo_acesso)}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        usuario.ativo !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {usuario.ativo !== false ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                ))}

                {usuariosDaEmpresa(empresaSelecionada.id).length === 0 && (
                  <div className="text-center text-slate-500 p-6">
                    Nenhum usuário encontrado.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => resetarSenhaAdmin(empresaSelecionada)}
                className="px-6 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-black"
              >
                Resetar senha Admin
              </button>

              {empresaSelecionada.ativo === false ? (
                <button
                  onClick={() => liberarEmpresa(empresaSelecionada)}
                  className="px-6 py-3 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black"
                >
                  Liberar Empresa
                </button>
              ) : (
                <button
                  onClick={() => bloquearEmpresa(empresaSelecionada)}
                  className="px-6 py-3 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-black"
                >
                  Bloquear Empresa
                </button>
              )}

              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
              >
                Fechar
              </button>
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
      : status === "Bloqueada" || status === "Vencida"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>{status}</span>;
}

function Botao({
  children,
  onClick,
  titulo,
  cor,
}: {
  children: React.ReactNode;
  onClick: () => void;
  titulo: string;
  cor: "slate" | "green" | "red" | "purple";
}) {
  const classes = {
    slate: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    green: "bg-green-50 hover:bg-green-100 text-green-700",
    red: "bg-red-50 hover:bg-red-100 text-red-700",
    purple: "bg-purple-50 hover:bg-purple-100 text-purple-700",
  };

  return (
    <button
      onClick={onClick}
      title={titulo}
      className={`h-10 w-10 rounded-xl flex items-center justify-center ${classes[cor]}`}
    >
      {children}
    </button>
  );
}

function PainelLista({
  titulo,
  subtitulo,
  icone,
  children,
}: {
  titulo: string;
  subtitulo: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
          {icone}
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-950">{titulo}</h2>
          <p className="text-sm text-slate-500">{subtitulo}</p>
        </div>
      </div>

      <div className="p-5 space-y-3 max-h-[520px] overflow-y-auto">
        {children}
      </div>
    </section>
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
