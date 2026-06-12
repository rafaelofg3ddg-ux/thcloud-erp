"use client";

import { useEffect, useState } from "react";
import { Bell, Send, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  nome: string | null;
};

type Notificacao = {
  id: string;
  empresa_id: string | null;
  titulo: string;
  mensagem: string;
  tipo: string | null;
  destino: string | null;
  link: string | null;
  lida: boolean | null;
  ativo: boolean | null;
  automatico: boolean | null;
  criado_por: string | null;
  created_at: string;
};

export default function AdminNotificacoesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("info");
  const [destino, setDestino] = useState("todos");
  const [empresaId, setEmpresaId] = useState("");
  const [link, setLink] = useState("/dashboard");
  const [usuarioNome, setUsuarioNome] = useState("Super Admin");

  function carregarUsuario() {
    try {
      const usuarioStorage = localStorage.getItem("th_usuario");
      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        setUsuarioNome(usuario.nome || "Super Admin");
      }
    } catch {}
  }

  async function carregarEmpresas() {
    const { data } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,nome")
      .order("nome_fantasia");

    setEmpresas((data || []) as Empresa[]);
  }

  async function carregarNotificacoes() {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      alert("Erro ao carregar notificações: " + error.message);
      return;
    }

    setNotificacoes((data || []) as Notificacao[]);
  }

  async function enviarNotificacao() {
    if (!titulo.trim() || !mensagem.trim()) {
      alert("Informe título e mensagem.");
      return;
    }

    const notificacao = {
      empresa_id: empresaId || null,
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      tipo,
      destino,
      link: link.trim() || null,
      lida: false,
      ativo: true,
      automatico: false,
      criado_por: usuarioNome,
    };

    const { error } = await supabase.from("notificacoes").insert([notificacao]);

    if (error) {
      alert("Erro ao enviar notificação: " + error.message);
      return;
    }

    alert("Notificação enviada com sucesso!");

    setTitulo("");
    setMensagem("");
    setTipo("info");
    setDestino("todos");
    setEmpresaId("");
    setLink("/dashboard");

    await carregarNotificacoes();
  }

  async function excluirNotificacao(id: string) {
    const confirmar = confirm("Deseja desativar esta notificação?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("notificacoes")
      .update({
        ativo: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert("Erro ao desativar notificação: " + error.message);
      return;
    }

    await carregarNotificacoes();
  }

  function nomeEmpresa(id: string | null) {
    if (!id) return "Todas as empresas";
    const empresa = empresas.find((item) => item.id === id);
    return empresa?.nome_fantasia || empresa?.razao_social || empresa?.nome || "Empresa";
  }

  useEffect(() => {
    carregarUsuario();
    carregarEmpresas();
    carregarNotificacoes();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
        <p className="text-blue-700 font-black">Painel Super Admin</p>

        <h1 className="text-4xl font-black text-slate-900 mt-2">
          Notificações do Sistema
        </h1>

        <p className="text-slate-500 mt-2">
          Envie avisos manuais para todas as empresas, uma empresa específica ou perfis de usuários.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-fit">
          <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-2">
            <Send className="text-blue-700" /> Nova Notificação
          </h2>

          <div className="space-y-4">
            <Campo titulo="Título">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Atualização do sistema"
                className="input"
              />
            </Campo>

            <Campo titulo="Mensagem">
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite o aviso que aparecerá no sino..."
                className="input min-h-32"
              />
            </Campo>

            <Campo titulo="Tipo">
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
                <option value="info">Informação</option>
                <option value="alerta">Alerta</option>
                <option value="sucesso">Sucesso</option>
                <option value="erro">Erro</option>
              </select>
            </Campo>

            <Campo titulo="Destino por perfil">
              <select value={destino} onChange={(e) => setDestino(e.target.value)} className="input">
                <option value="todos">Todos</option>
                <option value="Administrador">Administradores</option>
                <option value="Gerente">Gerentes</option>
                <option value="Operador de Caixa">Operadores de Caixa</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Estoquista">Estoquista</option>
                <option value="Vendedor">Vendedor</option>
              </select>
            </Campo>

            <Campo titulo="Empresa específica">
              <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className="input">
                <option value="">Todas as empresas</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia || empresa.razao_social || empresa.nome || empresa.id}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Link ao clicar">
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/dashboard"
                className="input"
              />
            </Campo>

            <button
              onClick={enviarNotificacao}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white px-6 py-4 rounded-2xl font-black"
            >
              Enviar Notificação
            </button>
          </div>

          <style jsx global>{`
            .input {
              width: 100%;
              border: 1px solid rgb(203 213 225);
              border-radius: 0.75rem;
              padding: 0.75rem;
              color: rgb(15 23 42);
              background: white;
              font-weight: 600;
              outline: none;
            }

            .input:focus {
              border-color: rgb(37 99 235);
              box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
            }
          `}</style>
        </div>

        <div className="xl:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-2">
            <Bell className="text-yellow-600" /> Histórico de Notificações
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3 text-left">Título</th>
                  <th className="p-3 text-left">Destino</th>
                  <th className="p-3 text-left">Empresa</th>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Ação</th>
                </tr>
              </thead>

              <tbody>
                {notificacoes.map((item) => (
                  <tr key={item.id} className="border-b align-top">
                    <td className="p-3">
                      <p className="font-black text-slate-900">{item.titulo}</p>
                      <p className="text-slate-500">{item.mensagem}</p>
                      <p className="text-xs text-blue-700 mt-1">{item.link || "-"}</p>
                    </td>

                    <td className="p-3 text-slate-700">{item.destino || "todos"}</td>
                    <td className="p-3 text-slate-700">{nomeEmpresa(item.empresa_id)}</td>
                    <td className="p-3 text-slate-700">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        item.ativo === false
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {item.ativo === false ? "Inativa" : "Ativa"}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => excluirNotificacao(item.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-xl font-black"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {notificacoes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhuma notificação cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
