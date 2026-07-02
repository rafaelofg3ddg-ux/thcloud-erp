"use client";

import { Search, Wrench, X } from "lucide-react";
import type { EquipamentoCliente } from "../hooks/useOrdemServico";

type Props = {
  equipamentos: EquipamentoCliente[];
  busca: string;
  setBusca: (valor: string) => void;
  onSelecionar: (equipamento: EquipamentoCliente) => void;
};

export function BuscaEquipamentoOS({
  equipamentos,
  busca,
  setBusca,
  onSelecionar,
}: Props) {
  const termo = busca.trim().toLowerCase();

  const filtrados = equipamentos
    .filter((equipamento) => {
      const texto = `${equipamento.tipo || ""} ${equipamento.marca || ""} ${
        equipamento.modelo || ""
      } ${equipamento.numero_serie || ""} ${equipamento.imei_1 || ""} ${
        equipamento.imei_2 || ""
      } ${equipamento.placa || ""} ${equipamento.chassi || ""}`.toLowerCase();

      return !termo || texto.includes(termo);
    })
    .slice(0, 8);

  function nomeEquipamento(equipamento: EquipamentoCliente) {
    const nome =
      `${equipamento.tipo || ""} ${equipamento.marca || ""} ${
        equipamento.modelo || ""
      }`.trim() || "Equipamento";

    if (equipamento.imei_1) return `${nome} - IMEI ${equipamento.imei_1}`;

    if (equipamento.placa) return `${nome} - Placa ${equipamento.placa}`;

    if (equipamento.numero_serie) {
      return `${nome} - Série ${equipamento.numero_serie}`;
    }

    return nome;
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
        placeholder="Pesquisar equipamento do cliente..."
        className="input-os pl-12 pr-12"
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
          {filtrados.map((equipamento) => (
            <button
              key={equipamento.id}
              type="button"
              onClick={() => {
                onSelecionar(equipamento);
                setBusca(nomeEquipamento(equipamento));
              }}
              className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-100 flex items-start gap-3"
            >
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Wrench size={18} />
              </div>

              <div className="min-w-0">
                <p className="font-black text-slate-900 truncate">
                  {nomeEquipamento(equipamento)}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {equipamento.segmento_nome || "Geral"}
                  {equipamento.garantia_ate
                    ? ` • Garantia até ${new Date(
                        equipamento.garantia_ate
                      ).toLocaleDateString("pt-BR")}`
                    : ""}
                </p>
              </div>
            </button>
          ))}

          {filtrados.length === 0 && (
            <div className="p-4 text-center text-slate-500 font-semibold">
              Nenhum equipamento encontrado para este cliente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
