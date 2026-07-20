"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Save, Search, Trash2, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";

type UsuarioSistema = any;

const gruposPermissoes = [
  {
    titulo: "Painel Inicial",
    itens: [
      ["permissao_dashboard", "Dashboard", "Acessar painel inicial e indicadores."],
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      ["permissao_clientes", "Clientes", "Cadastrar e consultar clientes."],
      ["permissao_produtos", "Produtos", "Cadastrar e consultar produtos."],
      ["permissao_grupos", "Grupos", "Cadastrar grupos/categorias."],
      ["permissao_fornecedores", "Fornecedores", "Cadastrar fornecedores."],
    ],
  },
  {
    titulo: "Estoque",
    itens: [
      ["permissao_estoque", "Menu Estoque", "Visualizar menu de estoque."],
      ["permissao_estoque_entrada", "Entrada", "Registrar entrada de mercadoria."],
      ["permissao_estoque_saida", "Saída", "Registrar saída manual."],
      ["permissao_estoque_ajuste", "Ajuste Manual", "Alterar quantidade com autorização."],
      ["permissao_estoque_inventario", "Inventário", "Acessar inventário."],
    ],
  },
  {
    titulo: "Vendas",
    itens: [
      ["permissao_pdv", "PDV", "Acessar tela de caixa e vendas."],
      ["permissao_vendas_consulta", "Consulta de Vendas", "Consultar vendas realizadas."],
      ["permissao_devolucoes", "Devoluções", "Registrar devoluções e estornos."],
      ["permissao_orcamentos", "Orçamentos", "Criar e consultar orçamentos."],
      ["permissao_pedidos", "Pedidos", "Criar e consultar pedidos."],
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      ["permissao_financeiro", "Menu Financeiro", "Visualizar menu financeiro."],
      ["permissao_contas_receber", "Contas a Receber", "Gerenciar recebimentos."],
      ["permissao_contas_pagar", "Contas a Pagar", "Gerenciar despesas."],
      ["permissao_fluxo_caixa", "Fluxo de Caixa", "Acompanhar entradas e saídas."],
      ["permissao_dre", "DRE", "Visualizar resultado financeiro."],
    ],
  },
  {
    titulo: "Sistema",
    itens: [
      ["permissao_relatorios", "Relatórios", "Acessar relatórios."],
      ["permissao_configuracoes", "Configurações", "Acessar configurações gerais."],
      ["permissao_usuarios", "Usuários", "Cadastrar usuários e permissões."],
      ["permissao_empresa", "Minha Empresa", "Editar dados da empresa."],
      ["permissao_fiscal", "Fiscal", "Acessar módulo fiscal."],
      ["permissao_whatsapp", "WhatsApp", "Acessar integração WhatsApp."],
      ["permissao_crm", "CRM", "Acessar CRM."],
      ["permissao_delivery", "Delivery", "Acessar delivery."],
      ["permissao_multiloja", "Multiloja", "Acessar múltiplas lojas."],
    ],
  },
];

const perfis = ["Administrador", "Gerente", "Operador de Caixa", "Financeiro", "Estoquista", "Vendedor"];

function permissoesVazias() {
  const obj: any = {};
  gruposPermissoes.forEach((g) => g.itens.forEach((i) => (obj[i[0]] = false)));
  obj.permissao_dashboard = true;
  return obj;
}

function permissoesPorPerfil(perfil: string) {
  const p = permissoesVazias();
  const marcar = (lista: string[]) => lista.forEach((c) => (p[c] = true));

  if (perfil === "Administrador") {
    gruposPermissoes.forEach((g) => g.itens.forEach((i) => (p[i[0]] = true)));
  }

  if (perfil === "Gerente") {
    marcar([
      "permissao_dashboard", "permissao_clientes", "permissao_produtos", "permissao_grupos",
      "permissao_fornecedores", "permissao_estoque", "permissao_estoque_entrada",
      "permissao_estoque_saida", "permissao_estoque_ajuste", "permissao_estoque_inventario",
      "permissao_pdv", "permissao_vendas_consulta", "permissao_devolucoes",
      "permissao_orcamentos", "permissao_pedidos", "permissao_financeiro",
      "permissao_contas_receber", "permissao_contas_pagar", "permissao_fluxo_caixa",
      "permissao_relatorios",
    ]);
  }

  if (perfil === "Operador de Caixa") {
    marcar(["permissao_dashboard", "permissao_clientes", "permissao_pdv", "permissao_vendas_consulta", "permissao_devolucoes"]);
  }

  if (perfil === "Financeiro") {
    marcar(["permissao_dashboard", "permissao_clientes", "permissao_financeiro", "permissao_contas_receber", "permissao_contas_pagar", "permissao_fluxo_caixa", "permissao_dre", "permissao_relatorios"]);
  }

  if (perfil === "Estoquista") {
    marcar(["permissao_dashboard", "permissao_produtos", "permissao_grupos", "permissao_fornecedores", "permissao_estoque", "permissao_estoque_entrada", "permissao_estoque_saida", "permissao_estoque_ajuste", "permissao_estoque_inventario", "permissao_relatorios"]);
  }

  if (perfil === "Vendedor") {
    marcar(["permissao_dashboard", "permissao_clientes", "permissao_pdv", "permissao_vendas_consulta", "permissao_orcamentos", "permissao_pedidos", "permissao_relatorios"]);
  }

  return p;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("Operador de Caixa");
  const [ativo, setAtivo] = useState(true);
  const [permissoes, setPermissoes] = useState<any>(permissoesPorPerfil("Operador de Caixa"));

  function empresaAtualId() {
    const empresaId = getEmpresaId();
    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }
    return empresaId;
  }

  async function carregarUsuarios() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (error) {
      alert("Erro ao carregar usuários: " + error.message);
      return;
    }

    setUsuarios(data || []);
  }

  function abrirNovo() {
    setEditandoId(null);
    setNome("");
    setEmail("");
    setSenha("");
    setPerfil("Operador de Caixa");
    setAtivo(true);
    setPermissoes(permissoesPorPerfil("Operador de Caixa"));
    setModal(true);
  }

  function abrirEditar(usuario: any) {
    setEditandoId(usuario.id);
    setNome(usuario.nome || "");
    setEmail(usuario.email || "");
    setSenha("");
    setPerfil(usuario.perfil || "Operador de Caixa");
    setAtivo(usuario.ativo !== false);

    const novas = permissoesVazias();
    gruposPermissoes.forEach((g) => g.itens.forEach((i) => (novas[i[0]] = usuario[i[0]] === true)));
    setPermissoes(novas);
    setModal(true);
  }

  function aplicarPerfil(novoPerfil: string) {
    setPerfil(novoPerfil);
    setPermissoes(permissoesPorPerfil(novoPerfil));
  }

  function marcarGrupo(grupo: any, valor: boolean) {
    const novo = { ...permissoes };
    grupo.itens.forEach((i: any) => (novo[i[0]] = valor));
    setPermissoes(novo);
  }

  function marcarTodas(valor: boolean) {
    const novo = { ...permissoes };
    gruposPermissoes.forEach((g) => g.itens.forEach((i) => (novo[i[0]] = valor)));
    setPermissoes(novo);
  }

  async function salvarUsuario() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!nome.trim() || !email.trim()) {
      alert("Preencha nome e e-mail/login.");
      return;
    }

    if (!editandoId && !senha.trim()) {
      alert("Defina uma senha para o novo usuário.");
      return;
    }

    const registro = {
      empresa_id: empresaId,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      perfil,
      ativo,
      ...permissoes,
      updated_at: new Date().toISOString(),
    };

    if (editandoId) {
      const { error } = await supabase.from("usuarios").update(registro).eq("id", editandoId).eq("empresa_id", empresaId);
      if (error) {
        alert("Erro ao atualizar usuário: " + error.message);
        return;
      }

      if (senha.trim()) {
        const { error: erroSenha } = await supabase.rpc("definir_senha", {
          p_usuario_id: editandoId,
          p_senha_nova: senha.trim(),
        });
        if (erroSenha) {
          alert("Usuário atualizado, mas houve erro ao trocar a senha: " + erroSenha.message);
          return;
        }
      }

      alert("Usuário atualizado com sucesso!");
    } else {
      const { data: novoUsuario, error } = await supabase.from("usuarios").insert([registro]).select("id").single();
      if (error) {
        alert("Erro ao cadastrar usuário: " + error.message);
        return;
      }

      const { error: erroSenha } = await supabase.rpc("definir_senha", {
        p_usuario_id: novoUsuario.id,
        p_senha_nova: senha.trim(),
      });
      if (erroSenha) {
        alert("Usuário criado, mas houve erro ao definir a senha: " + erroSenha.message);
        return;
      }

      alert("Usuário cadastrado com sucesso!");
    }

    setModal(false);
    await carregarUsuarios();
  }

  async function alternarAtivo(usuario: any) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { error } = await supabase
      .from("usuarios")
      .update({ ativo: usuario.ativo === false, updated_at: new Date().toISOString() })
      .eq("id", usuario.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao alterar usuário: " + error.message);
      return;
    }

    await carregarUsuarios();
  }

  async function excluirUsuario(usuario: any) {
    const confirmar = confirm(`Deseja excluir o usuário ${usuario.nome}?`);
    if (!confirmar) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { error } = await supabase.from("usuarios").delete().eq("id", usuario.id).eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao excluir usuário: " + error.message);
      return;
    }

    await carregarUsuarios();
  }

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.nome?.toLowerCase().includes(termo) ||
        u.email?.toLowerCase().includes(termo) ||
        u.perfil?.toLowerCase().includes(termo)
    );
  }, [usuarios, busca]);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8">
        <p className="text-blue-700 font-black">Configurações</p>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mt-2">Usuários e Permissões</h1>
            <p className="text-slate-500 mt-2">
              Cadastre usuários e marque exatamente o que cada perfil pode acessar.
            </p>
          </div>

          <button onClick={abrirNovo} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2">
            <Plus size={20} /> Novo Usuário
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <h2 className="text-2xl font-black text-slate-900">Lista de Usuários</h2>

          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar usuário..." className="w-full border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-slate-900 font-semibold" />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-4 text-left">Usuário</th>
                <th className="p-4 text-left">E-mail/Login</th>
                <th className="p-4 text-left">Perfil</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id} className="border-b last:border-b-0">
                  <td className="p-4 font-black text-slate-900">{usuario.nome}</td>
                  <td className="p-4 text-slate-700 font-semibold">{usuario.email}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-black">{usuario.perfil}</span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => alternarAtivo(usuario)} className={`px-4 py-2 rounded-xl font-black ${usuario.ativo === false ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {usuario.ativo === false ? "Bloqueado" : "Ativo"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => abrirEditar(usuario)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-xl font-black"><Edit size={17} /></button>
                      <button onClick={() => excluirUsuario(usuario)} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-xl font-black"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl max-h-[94vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900">{editandoId ? "Editar Usuário" : "Novo Usuário"}</h2>
                <p className="text-slate-500">Defina o grupo e marque as permissões.</p>
              </div>

              <button onClick={() => setModal(false)} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black">
                <X />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 space-y-4">
                <Campo titulo="Nome">
                  <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do usuário" className="input" />
                </Campo>

                <Campo titulo="E-mail / Login">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" className="input" />
                </Campo>

                <Campo titulo={editandoId ? "Nova senha (deixe em branco para manter a atual)" : "Senha"}>
                  <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={editandoId ? "Deixe em branco para não alterar" : "Senha de acesso"} className="input" autoComplete="new-password" />
                </Campo>

                <Campo titulo="Grupo / Perfil">
                  <select value={perfil} onChange={(e) => aplicarPerfil(e.target.value)} className="input">
                    {perfis.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Campo>

                <label className="flex items-center gap-3 border border-slate-200 bg-slate-50 rounded-2xl p-4 cursor-pointer">
                  <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-5 w-5" />
                  <div>
                    <p className="font-black text-slate-900">Usuário ativo</p>
                    <p className="text-sm text-slate-500">Desmarque para bloquear acesso.</p>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => marcarTodas(true)} className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-3 rounded-2xl font-black">Marcar tudo</button>
                  <button onClick={() => marcarTodas(false)} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded-2xl font-black">Desmarcar</button>
                </div>
              </div>

              <div className="xl:col-span-2 space-y-5">
                {gruposPermissoes.map((grupo) => (
                  <div key={grupo.titulo} className="border border-slate-200 rounded-3xl overflow-hidden">
                    <div className="bg-slate-100 p-4 flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900">{grupo.titulo}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => marcarGrupo(grupo, true)} className="bg-white hover:bg-green-50 text-green-700 px-3 py-2 rounded-xl text-sm font-black">Marcar grupo</button>
                        <button onClick={() => marcarGrupo(grupo, false)} className="bg-white hover:bg-red-50 text-red-700 px-3 py-2 rounded-xl text-sm font-black">Limpar grupo</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                      {grupo.itens.map((item) => (
                        <label key={item[0]} className={`border rounded-2xl p-4 cursor-pointer transition ${permissoes[item[0]] ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={permissoes[item[0]] === true} onChange={(e) => setPermissoes({ ...permissoes, [item[0]]: e.target.checked })} className="h-5 w-5 mt-1" />
                            <div>
                              <p className="font-black text-slate-900">{item[1]}</p>
                              <p className="text-sm text-slate-500 mt-1">{item[2]}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setModal(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black">Cancelar</button>
              <button onClick={salvarUsuario} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2">
                <Save size={18} /> Salvar Usuário
              </button>
            </div>

            <style jsx global>{`
              .input {
                width: 100%;
                border: 1px solid rgb(203 213 225);
                border-radius: 1rem;
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
        </div>
      )}
    </div>
  );
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-700 mb-2">{titulo}</label>
      {children}
    </div>
  );
}
