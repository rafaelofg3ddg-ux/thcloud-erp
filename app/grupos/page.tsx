"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Grupo = {
  id: string;
  empresa_id: string | null;
  nome: string;
  descricao: string | null;
  ativo: boolean | null;
  created_at?: string | null;
};

export default function GruposPage() {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [editando, setEditando] = useState<Grupo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function empresaAtualId() {
    try {
      const empresaStorage =
        sessionStorage.getItem("th_empresa") ||
        localStorage.getItem("th_empresa");

      if (empresaStorage) {
        const empresa = JSON.parse(empresaStorage);

        if (empresa.id) return empresa.id;
        if (empresa.empresa_id) return empresa.empresa_id;
      }

      const usuarioStorage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);

        if (usuario.empresa_id) return usuario.empresa_id;
        if (usuario.empresa?.id) return usuario.empresa.id;
      }

      const empresaIdDireto =
        sessionStorage.getItem("empresa_id") ||
        sessionStorage.getItem("th_empresa_id") ||
        localStorage.getItem("empresa_id") ||
        localStorage.getItem("th_empresa_id");

      if (empresaIdDireto) return empresaIdDireto;

      alert("Empresa não identificada. Faça login novamente.");
      return null;
    } catch {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }
  }

  function usuarioAtual() {
    try {
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (!usuarioStorage) return "Sistema";

      const usuario = JSON.parse(usuarioStorage);

      return usuario.nome || usuario.email || usuario.usuario || "Sistema";
    } catch {
      return "Sistema";
    }
  }

  function limparTexto(valor: string) {
    return String(valor || "").trim();
  }

  async function registrarAuditoria(acao: string, detalhe: string) {
    const empresaId = empresaAtualId();

    if (!empresaId) return;

    try {
      await supabase.from("auditoria_saas").insert([
        {
          empresa_id: empresaId,
          usuario: usuarioAtual(),
          acao,
          descricao: detalhe,
        },
      ]);
    } catch {
      // Não trava a tela se auditoria não existir.
    }
  }

  async function carregarGrupos() {
    const empresaId = empresaAtualId();

    if (!empresaId) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from("categorias")
      .select("id,empresa_id,nome,descricao,ativo,created_at")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    setCarregando(false);

    if (error) {
      alert("Erro ao carregar grupos: " + error.message);
      return;
    }

    setGrupos((data || []) as Grupo[]);
  }

  async function salvarGrupo() {
    const empresaId = empresaAtualId();

    if (!empresaId) return;

    const nomeLimpo = limparTexto(nome);
    const descricaoLimpa = limparTexto(descricao);

    if (!nomeLimpo) {
      alert("Informe o nome do grupo.");
      return;
    }

    const nomeDuplicado = grupos.some((grupo) => {
      const mesmoNome =
        grupo.nome.trim().toLowerCase() === nomeLimpo.toLowerCase();

      if (editando) {
        return mesmoNome && grupo.id !== editando.id;
      }

      return mesmoNome;
    });

    if (nomeDuplicado) {
      alert("Já existe um grupo com esse nome nesta empresa.");
      return;
    }

    setSalvando(true);

    if (editando) {
      const { error } = await supabase
        .from("categorias")
        .update({
          nome: nomeLimpo,
          descricao: descricaoLimpa || null,
          ativo: true,
        })
        .eq("id", editando.id)
        .eq("empresa_id", empresaId);

      setSalvando(false);

      if (error) {
        alert("Erro ao alterar grupo: " + error.message);
        return;
      }

      await registrarAuditoria(
        "GRUPO_ALTERADO",
        `Grupo alterado: ${nomeLimpo}`
      );

      alert("Grupo alterado com sucesso.");
    } else {
      const { error } = await supabase.from("categorias").insert([
        {
          empresa_id: empresaId,
          nome: nomeLimpo,
          descricao: descricaoLimpa || null,
          ativo: true,
        },
      ]);

      setSalvando(false);

      if (error) {
        alert("Erro ao cadastrar grupo: " + error.message);
        return;
      }

      await registrarAuditoria(
        "GRUPO_CRIADO",
        `Grupo cadastrado: ${nomeLimpo}`
      );

      alert("Grupo cadastrado com sucesso.");
    }

    limparFormulario();
    await carregarGrupos();
  }

  async function excluirGrupo(grupo: Grupo) {
    const empresaId = empresaAtualId();

    if (!empresaId) return;

    const confirmar = confirm(
      `Deseja realmente excluir/inativar o grupo "${grupo.nome}"?`
    );

    if (!confirmar) return;

    const produtosVinculados = await supabase
      .from("produtos")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("categoria_id", grupo.id)
      .limit(1);

    if (!produtosVinculados.error && produtosVinculados.data?.length) {
      const continuar = confirm(
        "Este grupo possui produtos vinculados. Para preservar o histórico, ele será apenas inativado. Deseja continuar?"
      );

      if (!continuar) return;
    }

    const { error } = await supabase
      .from("categorias")
      .update({
        ativo: false,
      })
      .eq("id", grupo.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao excluir grupo: " + error.message);
      return;
    }

    await registrarAuditoria(
      "GRUPO_INATIVADO",
      `Grupo inativado: ${grupo.nome}`
    );

    alert("Grupo excluído/inativado com sucesso.");

    if (editando?.id === grupo.id) {
      limparFormulario();
    }

    await carregarGrupos();
  }

  function editarGrupo(grupo: Grupo) {
    const empresaId = empresaAtualId();

    if (!empresaId) return;

    if (grupo.empresa_id !== empresaId) {
      alert("Este grupo não pertence à empresa logada.");
      return;
    }

    setEditando(grupo);
    setNome(grupo.nome || "");
    setDescricao(grupo.descricao || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limparFormulario() {
    setEditando(null);
    setNome("");
    setDescricao("");
  }

  useEffect(() => {
    carregarGrupos();
  }, []);

  const gruposFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return grupos;

    return grupos.filter((grupo) => {
      const texto = `${grupo.nome || ""} ${grupo.descricao || ""}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [grupos, pesquisa]);

  return (
    <div className="p-4 lg:p-8 bg-slate-100 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm mb-8">
        <p className="text-blue-700 font-black">Cadastros</p>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mt-2">
              Grupos de Produtos
            </h1>

            <p className="text-slate-500 mt-2">
              Cadastre e organize os grupos de produtos da empresa logada.
            </p>
          </div>

          <button
            onClick={carregarGrupos}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black"
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {editando ? "Alterar Grupo" : "Novo Grupo"}
          </h2>

          <p className="text-sm text-slate-500 mb-5">
            O grupo será vinculado automaticamente à empresa logada.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Nome do Grupo *
              </label>

              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Frios, Bebidas, Padaria..."
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Descrição
              </label>

              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição opcional do grupo"
                rows={4}
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700 resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={salvarGrupo}
              disabled={salvando}
              className={`px-6 py-3 rounded-2xl font-black text-white ${
                salvando
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {salvando
                ? "Salvando..."
                : editando
                ? "Salvar Alterações"
                : "Salvar Grupo"}
            </button>

            {editando && (
              <button
                onClick={limparFormulario}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Grupos Cadastrados
              </h2>

              <p className="text-sm text-slate-500">
                {carregando
                  ? "Carregando..."
                  : `${gruposFiltrados.length} grupo(s) encontrado(s)`}
              </p>
            </div>

            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar grupo..."
              className="border border-slate-300 p-3 rounded-2xl w-full lg:w-80 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700"
            />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="p-4 text-left">Grupo</th>
                  <th className="p-4 text-left">Descrição</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>

              <tbody>
                {gruposFiltrados.map((grupo) => (
                  <tr key={grupo.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-900">
                        {grupo.nome}
                      </p>

                      <p className="text-xs text-slate-500">
                        Empresa atual
                      </p>
                    </td>

                    <td className="p-4 text-slate-700 font-medium">
                      {grupo.descricao || "-"}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => editarGrupo(grupo)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-black"
                        >
                          Alterar
                        </button>

                        <button
                          onClick={() => excluirGrupo(grupo)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-black"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!carregando && gruposFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">
                      Nenhum grupo encontrado para esta empresa.
                    </td>
                  </tr>
                )}

                {carregando && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">
                      Carregando grupos...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
            <strong>Segurança multiempresa:</strong> esta tela mostra apenas
            grupos vinculados à empresa logada. Grupos sem empresa ou de outras
            empresas não são carregados.
          </div>
        </div>
      </div>
    </div>
  );
}
