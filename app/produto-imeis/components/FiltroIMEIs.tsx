"use client";

import { Plus, RefreshCcw, Search } from "lucide-react";
import type { ProdutoImeisHook } from "../hooks/useProdutoImeis";

export function FiltroIMEIs({ imei }: { imei: ProdutoImeisHook }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-6 relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={imei.pesquisa}
            onChange={(e) => imei.setPesquisa(e.target.value)}
            placeholder="Pesquisar IMEI, produto, cliente, série, cor ou capacidade..."
            className="input-imei pl-12"
          />
        </div>

        <select
          value={imei.filtroStatus}
          onChange={(e) => imei.setFiltroStatus(e.target.value)}
          className="input-imei lg:col-span-3 bg-white"
        >
          <option value="todos">Todos os status</option>
          {imei.statusOpcoes.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.nome}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={imei.carregarDados}
          className="lg:col-span-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black flex items-center justify-center gap-2 px-4 py-3"
        >
          <RefreshCcw size={18} />
        </button>

        <button
          type="button"
          onClick={imei.abrirNovo}
          className="lg:col-span-2 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 px-4 py-3"
        >
          <Plus size={18} />
          Novo IMEI
        </button>
      </div>
    </div>
  );
}
