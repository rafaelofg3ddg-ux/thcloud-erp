"use client";

import { Search, Smartphone, X } from "lucide-react";
import { useMemo } from "react";

export type ImeiDisponivelPDV = {
  id: string;
  produto_id: string;
  imei: string;
  imei_2: string | null;
  numero_serie: string | null;
  cor: string | null;
  capacidade: string | null;
  status: string;
};

type Props = {
  aberto: boolean;
  produtoNome: string;
  imeis: ImeiDisponivelPDV[];
  busca: string;
  setBusca: (valor: string) => void;
  onFechar: () => void;
  onSelecionar: (imei: ImeiDisponivelPDV) => void;
};

export default function SelecionarImeiProdutoPDV({
  aberto,
  produtoNome,
  imeis,
  busca,
  setBusca,
  onFechar,
  onSelecionar,
}: Props) {
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return imeis
      .filter((item) => {
        const texto = `${item.imei} ${item.imei_2 || ""} ${item.numero_serie || ""} ${item.cor || ""} ${item.capacidade || ""}`.toLowerCase();
        return !termo || texto.includes(termo);
      })
      .slice(0, 30);
  }, [imeis, busca]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Smartphone size={24} />
              Selecionar IMEI
            </h2>
            <p className="text-slate-500 mt-1">Produto: <strong>{produtoNome}</strong></p>
          </div>

          <button type="button" onClick={onFechar} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black">
            <X size={20} className="mx-auto" />
          </button>
        </div>

        <div className="p-5">
          <div className="relative mb-4">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por IMEI, IMEI 2, série, cor ou capacidade..."
              className="w-full border border-slate-300 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </div>

          <div className="max-h-[55vh] overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden">
            {filtrados.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelecionar(item)}
                className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-100 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-black text-slate-900">IMEI: {item.imei}</p>
                  <p className="text-xs text-slate-500 mt-1">IMEI 2: {item.imei_2 || "-"} • Série: {item.numero_serie || "-"}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.cor || "-"} {item.capacidade ? `• ${item.capacidade}` : ""}</p>
                </div>
                <span className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-black">Disponível</span>
              </button>
            ))}

            {filtrados.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-bold">
                Nenhum IMEI disponível encontrado para este produto.
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 flex justify-end">
          <button type="button" onClick={onFechar} className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
