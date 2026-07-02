"use client";

import { abrirCadastroPopup } from "../../../components/global/THSystemStandards";

import { Plus, Search, Settings, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { OrdemServicoHook, Servico } from "../hooks/useOrdemServico";

function maiusculo(valor: string) {
  return valor.toLocaleUpperCase("pt-BR");
}

export function ServicoOS({ os }: { os: OrdemServicoHook }) {
  const [popupServico, setPopupServico] = useState(false);
  const [busca, setBusca] = useState("");

  const servicosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return os.servicos
      .filter((servico) => {
        const texto = `${servico.nome || ""} ${servico.descricao || ""}`.toLowerCase();
        return !termo || texto.includes(termo);
      })
      .slice(0, 40);
  }, [os.servicos, busca]);

  function selecionarServico(servico: Servico) {
    os.addServico(servico);
    setPopupServico(false);
    setBusca("");
  }

  return (
    <section className="border border-slate-200 rounded-3xl p-4 bg-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="font-black text-slate-900 text-lg">Serviços / Mão de obra</h3>

        <div className="flex flex-col md:flex-row gap-2">
          <button type="button" onClick={() => setPopupServico(true)} className="bg-slate-900 hover:bg-slate-950 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2">
            <Search size={18} /> Pesquisar Serviço
          </button>

          <button type="button" onClick={os.addServicoManual} className="bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2">
            <Plus size={18} /> Manual
          </button>

          <button type="button" onClick={() => abrirCadastroPopup("/servicos", "Novo Serviço")} className="bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2">
            <Plus size={18} /> Novo Serviço
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-3 text-left">Serviço</th>
              <th className="p-3 text-center">Qtd</th>
              <th className="p-3 text-right">Unitário</th>
              <th className="p-3 text-right">Subtotal</th>
              <th className="p-3 text-center">Ação</th>
            </tr>
          </thead>

          <tbody>
            {os.itensServicos.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3"><input value={item.nome} onChange={(e) => os.updServico(index, "nome", maiusculo(e.target.value))} className="input-os uppercase" /></td>
                <td className="p-3"><input value={item.quantidade} onChange={(e) => os.updServico(index, "quantidade", e.target.value)} className="input-os text-center" /></td>
                <td className="p-3"><input value={item.valor_unitario} onChange={(e) => os.updServico(index, "valor_unitario", e.target.value)} className="input-os text-right" /></td>
                <td className="p-3 text-right font-black text-slate-900">{os.dinheiro(item.subtotal)}</td>
                <td className="p-3 text-center"><button type="button" onClick={() => os.removerServico(index)} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-xl font-black">Excluir</button></td>
              </tr>
            ))}

            {os.itensServicos.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nenhum serviço adicionado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {popupServico && (
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Settings size={24} /> Pesquisar Serviço</h2>
              <button type="button" onClick={() => setPopupServico(false)} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"><X size={20} className="mx-auto" /></button>
            </div>

            <div className="p-5">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={busca} onChange={(e) => setBusca(maiusculo(e.target.value))} placeholder="PESQUISAR SERVIÇO" className="input-os pl-12 uppercase" autoFocus />
              </div>

              <div className="max-h-[55vh] overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden mt-4">
                {servicosFiltrados.map((servico) => (
                  <button key={servico.id} type="button" onClick={() => selecionarServico(servico)} className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-900 uppercase">{servico.nome}</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase">{servico.descricao || ""}</p>
                    </div>
                    <b className="text-blue-700">{os.dinheiro(servico.valor)}</b>
                  </button>
                ))}
                {servicosFiltrados.length === 0 && <div className="p-8 text-center text-slate-500 font-bold">Nenhum serviço encontrado.</div>}
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => abrirCadastroPopup("/servicos", "Novo Serviço")} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black">+ Novo Serviço</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}