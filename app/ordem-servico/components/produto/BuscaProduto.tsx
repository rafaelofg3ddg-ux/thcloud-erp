"use client";

import { Search, X } from "lucide-react";
import { useMemo } from "react";

export type ProdutoBusca = {
  id: string;
  codigo?: string | null;
  codigo_barras?: string | null;
  nome: string;
  preco_venda?: number | null;
  qtd_atual?: number | null;
  unidade?: string | null;
};

type BuscaProdutoProps = {
  produtos: ProdutoBusca[];
  busca: string;
  setBusca: (valor: string) => void;
  onSelecionar: (produto: ProdutoBusca) => void;
  placeholder?: string;
  mostrarEstoque?: boolean;
  mostrarPreco?: boolean;
  limite?: number;
};

export default function BuscaProduto({
  produtos,
  busca,
  setBusca,
  onSelecionar,
  placeholder = "Pesquisar produto por nome, código ou código de barras...",
  mostrarEstoque = true,
  mostrarPreco = true,
  limite = 10,
}: BuscaProdutoProps) {
  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return [];

    return produtos
      .filter((produto) => {
        const texto = `${produto.codigo || ""} ${produto.codigo_barras || ""} ${
          produto.nome || ""
        }`.toLowerCase();

        return texto.includes(termo);
      })
      .slice(0, limite);
  }, [produtos, busca, limite]);

  function dinheiro(valor: number | null | undefined) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className="relative">
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-2xl py-3 pl-12 pr-12 text-slate-900 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
      />

      {busca && (
        <button
          type="button"
          onClick={() => setBusca("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          <X size={18} />
        </button>
      )}

      {busca && (
        <div className="absolute z-40 left-0 right-0 top-14 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          {produtosFiltrados.map((produto) => (
            <button
              key={produto.id}
              type="button"
              onClick={() => {
                onSelecionar(produto);
                setBusca("");
              }}
              className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-100 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-black text-slate-900 truncate">
                  {produto.codigo ? `${produto.codigo} - ` : ""}
                  {produto.nome}
                </p>

                <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500 font-bold">
                  {produto.codigo_barras && <span>Barra: {produto.codigo_barras}</span>}
                  {mostrarEstoque && (
                    <span>
                      Estoque: {Number(produto.qtd_atual || 0)}{" "}
                      {produto.unidade || ""}
                    </span>
                  )}
                </div>
              </div>

              {mostrarPreco && (
                <strong className="text-blue-700 whitespace-nowrap">
                  {dinheiro(produto.preco_venda)}
                </strong>
              )}
            </button>
          ))}

          {produtosFiltrados.length === 0 && (
            <div className="p-4 text-center text-slate-500 font-semibold">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
