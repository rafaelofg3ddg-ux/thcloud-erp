"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function GruposPage() {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [grupos, setGrupos] = useState<any[]>([]);
  const [editando, setEditando] = useState<any>(null);

  async function carregarGrupos() {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("nome");

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setGrupos(data || []);
  }

  async function salvarGrupo() {
    if (!nome) {
      alert("Informe o nome do grupo.");
      return;
    }

    if (editando) {
      const { error } = await supabase
        .from("categorias")
        .update({
          nome,
          descricao,
        })
        .eq("id", editando.id);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Grupo alterado com sucesso.");
    } else {
      const { error } = await supabase
        .from("categorias")
        .insert([
          {
            nome,
            descricao,
          },
        ]);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Grupo cadastrado com sucesso.");
    }

    limparFormulario();
    carregarGrupos();
  }

  async function excluirGrupo(id: string) {
    if (!confirm("Deseja realmente excluir este grupo?")) {
      return;
    }

    const { error } = await supabase
      .from("categorias")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Grupo excluído com sucesso.");
    carregarGrupos();
  }

  function editarGrupo(grupo: any) {
    setEditando(grupo);
    setNome(grupo.nome || "");
    setDescricao(grupo.descricao || "");
  }

  function limparFormulario() {
    setEditando(null);
    setNome("");
    setDescricao("");
  }

  useEffect(() => {
    carregarGrupos();
  }, []);

  const gruposFiltrados = grupos.filter((grupo) =>
    grupo.nome?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">
        Grupos de Produtos
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {editando ? "Alterar Grupo" : "Novo Grupo"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do Grupo"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
          />

          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={salvarGrupo}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {editando ? "Salvar Alterações" : "Salvar Grupo"}
          </button>

          {editando && (
            <button
              onClick={limparFormulario}
              className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Grupos Cadastrados
          </h2>

          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar grupo..."
            className="border border-slate-300 p-3 rounded-lg w-80 text-slate-900"
          />
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="p-3 text-left">Grupo</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {gruposFiltrados.map((grupo) => (
              <tr key={grupo.id} className="border-b">
                <td className="p-3 font-medium text-slate-900">
                  {grupo.nome}
                </td>

                <td className="p-3 text-slate-800">
                  {grupo.descricao || "-"}
                </td>

                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => editarGrupo(grupo)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                    >
                      Alterar
                    </button>

                    <button
                      onClick={() => excluirGrupo(grupo.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {gruposFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-6 text-center text-slate-700"
                >
                  Nenhum grupo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}