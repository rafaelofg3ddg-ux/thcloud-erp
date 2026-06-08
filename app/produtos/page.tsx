"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";

type Grupo = {
  id: string;
  nome: string;
};

type Produto = {
  id: string;
  codigo: string;
  codigo_barras: string | null;
  nome: string;
  categoria_id: string | null;
  preco_venda: number;
  qtd_atual: number;
  qtd_minima: number | null;
  unidade: string;
  foto_url: string | null;
};

export default function ProdutosPage() {
  const [codigo, setCodigo] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [nome, setNome] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const [mostrarNovoGrupo, setMostrarNovoGrupo] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState("");

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function carregarGrupos() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("categorias")
      .select("id,nome")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar grupos: " + error.message);
      return;
    }

    setGrupos(data || []);
  }

  async function carregarProdutos() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("produtos")
      .select(
        "id,codigo,codigo_barras,nome,categoria_id,preco_venda,qtd_atual,qtd_minima,unidade,foto_url"
      )
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar produtos: " + error.message);
      return;
    }

    setProdutos(data || []);
  }

  function gerarCodigoInterno() {
    const numero = Math.floor(100000 + Math.random() * 900000);
    setCodigo(numero.toString());
  }

  function nomeDoGrupo(categoriaId: string | null) {
    if (!categoriaId) return "-";

    const grupo = grupos.find((item) => item.id === categoriaId);

    return grupo ? grupo.nome : "-";
  }

  function selecionarFoto(arquivo: File | null) {
    setFotoArquivo(arquivo);

    if (!arquivo) {
      setFotoPreview("");
      return;
    }

    const url = URL.createObjectURL(arquivo);
    setFotoPreview(url);
  }

  async function enviarFotoProduto() {
    if (!fotoArquivo) return null;

    const empresaId = empresaAtualId();
    if (!empresaId) return null;

    const extensao = fotoArquivo.name.split(".").pop();
    const nomeArquivo = `${empresaId}/${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("produtos")
      .upload(nomeArquivo, fotoArquivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error("Erro ao enviar foto: " + error.message);
    }

    const { data } = supabase.storage
      .from("produtos")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function salvarNovoGrupo() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!novoGrupo.trim()) {
      alert("Digite o nome do grupo.");
      return;
    }

    const { data, error } = await supabase
      .from("categorias")
      .insert([
        {
          empresa_id: empresaId,
          nome: novoGrupo.trim(),
        },
      ])
      .select("id,nome")
      .single();

    if (error) {
      alert("Erro ao salvar grupo: " + error.message);
      return;
    }

    alert("Grupo salvo com sucesso!");

    setNovoGrupo("");
    setMostrarNovoGrupo(false);

    await carregarGrupos();

    if (data) {
      setGrupoId(data.id);
    }
  }

  async function salvarProduto() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!codigo || !nome || !grupoId || !preco || !estoque) {
      alert("Preencha código interno, nome, grupo, preço e estoque.");
      return;
    }

    try {
      const fotoUrl = await enviarFotoProduto();

      const { data: produtoCriado, error } = await supabase
        .from("produtos")
        .insert([
          {
            empresa_id: empresaId,
            codigo,
            codigo_barras: codigoBarras || null,
            nome,
            categoria_id: grupoId,
            unidade: "UN",
            preco_custo: converterNumero(preco),
            preco_venda: converterNumero(preco),
            qtd_atual: converterNumero(estoque),
            qtd_minima: converterNumero(estoqueMinimo),
            foto_url: fotoUrl,
            ativo: true,
          },
        ])
        .select("id")
        .single();

      if (error) {
        alert("Erro ao salvar produto: " + error.message);
        return;
      }

      if (produtoCriado?.id) {
        const { error: estoqueError } = await supabase.from("estoque").insert([
          {
            empresa_id: empresaId,
            produto_id: produtoCriado.id,
            quantidade: converterNumero(estoque),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (estoqueError) {
          console.log("Aviso estoque:", estoqueError.message);
        }
      }

      alert("Produto salvo com sucesso!");

      setCodigo("");
      setCodigoBarras("");
      setNome("");
      setGrupoId("");
      setPreco("");
      setEstoque("");
      setEstoqueMinimo("0");
      setFotoArquivo(null);
      setFotoPreview("");

      await carregarProdutos();
    } catch (error: any) {
      alert(error.message);
    }
  }

  useEffect(() => {
    carregarGrupos();
    carregarProdutos();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <p className="text-blue-600 font-bold">Cadastros</p>

        <h1 className="text-4xl font-black text-slate-900 mt-2">
          Cadastro de Produtos
        </h1>

        <p className="text-slate-500 mt-2">
          Cadastre produtos, imagens, preços, grupos e controle de estoque por empresa.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-6">
          Novo Produto
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código Interno"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />

            <button
              type="button"
              onClick={gerarCodigoInterno}
              className="mt-2 w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-2xl font-semibold"
            >
              Gerar Código
            </button>
          </div>

          <input
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            placeholder="Código de Barras"
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
          />

          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do Produto"
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
          />

          <div className="flex gap-2">
            <select
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white"
            >
              <option value="">Selecione o Grupo</option>

              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setMostrarNovoGrupo(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-2xl font-bold"
            >
              +
            </button>
          </div>

          <input
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="Preço"
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
          />

          <input
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
            placeholder="Estoque Atual"
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
          />

          <input
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            placeholder="Estoque Mínimo"
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
          />

          <div className="border border-slate-300 rounded-2xl p-3">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Foto do Produto
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => selecionarFoto(e.target.files?.[0] || null)}
              className="w-full text-slate-900"
            />
          </div>
        </div>

        {fotoPreview && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Pré-visualização
            </p>

            <img
              src={fotoPreview}
              alt="Preview"
              className="w-40 h-40 object-cover rounded-2xl border border-slate-300"
            />
          </div>
        )}

        <button
          type="button"
          onClick={salvarProduto}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold"
        >
          Salvar Produto
        </button>
      </div>

      {mostrarNovoGrupo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Novo Grupo
            </h2>

            <input
              value={novoGrupo}
              onChange={(e) => setNovoGrupo(e.target.value)}
              placeholder="Nome do Grupo"
              className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setMostrarNovoGrupo(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-5 py-2 rounded-2xl font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarNovoGrupo}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-2xl font-semibold"
              >
                Salvar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 mb-6">
          Produtos Cadastrados
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-3 text-left">Foto</th>
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Barras</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Grupo</th>
                <th className="p-3 text-left">Unidade</th>
                <th className="p-3 text-left">Preço</th>
                <th className="p-3 text-left">Estoque</th>
                <th className="p-3 text-left">Mínimo</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id} className="border-b hover:bg-blue-50/40">
                  <td className="p-3">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
                      {produto.foto_url ? (
                        <img
                          src={produto.foto_url}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-500">Sem foto</span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {produto.codigo}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {produto.codigo_barras || "-"}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {produto.nome}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {nomeDoGrupo(produto.categoria_id)}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {produto.unidade}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {formatarMoeda(Number(produto.preco_venda))}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {produto.qtd_atual}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {produto.qtd_minima || 0}
                  </td>
                </tr>
              ))}

              {produtos.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-3 text-center text-slate-700 font-medium"
                  >
                    Nenhum produto cadastrado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
