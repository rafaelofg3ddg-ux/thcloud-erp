"use client";

import { abrirCadastroPopup } from "../../../components/global/THSystemStandards";

import { PackageSearch, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { OrdemServicoHook, Produto } from "../hooks/useOrdemServico";

function maiusculo(valor: string) {
  return valor.toLocaleUpperCase("pt-BR");
}

export function ProdutoOS({ os }: { os: OrdemServicoHook }) {
  const [popupProduto, setPopupProduto] = useState(false);
  const [busca, setBusca] = useState("");

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return os.produtos
      .filter((produto) => {
        const texto = `${produto.codigo || ""} ${produto.codigo_barras || ""} ${produto.nome || ""}`.toLowerCase();
        return !termo || texto.includes(termo);
      })
      .slice(0, 40);
  }, [os.produtos, busca]);

  function selecionarProduto(produto: Produto) {
    os.addProduto(produto);
    setPopupProduto(false);
    setBusca("");
  }

  return (
    <section className="border border-slate-200 rounded-3xl p-4 bg-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="font-black text-slate-900 text-lg">Produtos / Peças</h3>

        <div className="flex flex-col md:flex-row gap-2">
          <button
            type="button"
            onClick={() => setPopupProduto(true)}
            className="bg-slate-900 hover:bg-slate-950 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2"
          >
            <Search size={18} /> Pesquisar Produto
          </button>

          <button
            type="button"
            onClick={() => abrirCadastroPopup("/produtos", "Novo Produto")}
            className="bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-center">Qtd</th>
              <th className="p-3 text-right">Unitário</th>
              <th className="p-3 text-right">Subtotal</th>
              <th className="p-3 text-center">Estoque</th>
              <th className="p-3 text-center">Ação</th>
            </tr>
          </thead>

          <tbody>
            {os.itensProdutos.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3 font-bold text-slate-900 uppercase">
                  {item.codigo ? `${item.codigo} - ` : ""}
                  {item.nome}
                </td>

                <td className="p-3">
                  <input value={item.quantidade} onChange={(e) => os.updProduto(index, "quantidade", e.target.value)} className="input-os text-center" />
                </td>

                <td className="p-3">
                  <input value={item.valor_unitario} onChange={(e) => os.updProduto(index, "valor_unitario", e.target.value)} className="input-os text-right" />
                </td>

                <td className="p-3 text-right font-black text-slate-900">{os.dinheiro(item.subtotal)}</td>

                <td className="p-3 text-center">
                  <input type="checkbox" checked={item.baixar_estoque} onChange={(e) => os.updProduto(index, "baixar_estoque", e.target.checked)} />
                </td>

                <td className="p-3 text-center">
                  <button type="button" onClick={() => os.removerProduto(index)} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-xl font-black">Excluir</button>
                </td>
              </tr>
            ))}

            {os.itensProdutos.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhum produto adicionado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {popupProduto && (
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><PackageSearch size={24} /> Pesquisar Produto</h2>
              <button type="button" onClick={() => setPopupProduto(false)} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"><X size={20} className="mx-auto" /></button>
            </div>

            <div className="p-5">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={busca} onChange={(e) => setBusca(maiusculo(e.target.value))} placeholder="PESQUISAR POR CÓDIGO, BARRAS OU NOME" className="input-os pl-12 uppercase" autoFocus />
              </div>

              <div className="max-h-[55vh] overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden mt-4">
                {produtosFiltrados.map((produto) => (
                  <button key={produto.id} type="button" onClick={() => selecionarProduto(produto)} className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-900 uppercase">{produto.codigo ? `${produto.codigo} - ` : ""}{produto.nome}</p>
                      <p className="text-xs text-slate-500 mt-1">Estoque: {produto.qtd_atual}</p>
                    </div>
                    <b className="text-blue-700">{os.dinheiro(produto.preco_venda)}</b>
                  </button>
                ))}
                {produtosFiltrados.length === 0 && <div className="p-8 text-center text-slate-500 font-bold">Nenhum produto encontrado.</div>}
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => abrirCadastroPopup("/produtos", "Novo Produto")} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black">+ Novo Produto</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}