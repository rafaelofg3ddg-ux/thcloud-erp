"use client";

import { Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
import { THButton } from "./THButton";
import { THInput } from "./THInput";
import { THPopup } from "./THPopup";

type THSearchProps<T> = {
  label: string;
  valor: string;
  aberto: boolean;
  titulo: string;
  subtitulo?: string;
  busca: string;
  itens: T[];
  placeholder?: string;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  onAbrir: () => void;
  onFechar: () => void;
  onNovo?: () => void;
  onBusca: (valor: string) => void;
  onSelecionar: (item: T) => void;
};

export function THSearch<T>({
  label,
  valor,
  aberto,
  titulo,
  subtitulo,
  busca,
  itens,
  placeholder = "PESQUISAR...",
  renderItem,
  getKey,
  onAbrir,
  onFechar,
  onNovo,
  onBusca,
  onSelecionar,
}: THSearchProps<T>) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-black text-slate-700">
          {label}
        </label>

        <div className="flex gap-2">
          <input
            value={valor}
            readOnly
            onClick={onAbrir}
            placeholder={label}
            className="w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold uppercase text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />

          <THButton type="button" onClick={onAbrir} className="px-4">
            <Search size={18} />
          </THButton>

          {onNovo && (
            <THButton type="button" variant="success" onClick={onNovo} className="px-4">
              <Plus size={18} />
            </THButton>
          )}
        </div>
      </div>

      <THPopup
        aberto={aberto}
        titulo={titulo}
        subtitulo={subtitulo}
        largura="lg"
        onFechar={onFechar}
      >
        <div className="space-y-4">
          <THInput
            value={busca}
            onValueChange={onBusca}
            placeholder={placeholder}
            leftIcon={<Search size={18} />}
            autoFocus
          />

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            {itens.map((item) => (
              <button
                key={getKey(item)}
                type="button"
                onClick={() => onSelecionar(item)}
                className="block w-full border-b border-slate-100 p-4 text-left last:border-b-0 hover:bg-blue-50"
              >
                {renderItem(item)}
              </button>
            ))}

            {itens.length === 0 && (
              <div className="p-8 text-center font-bold text-slate-500">
                NENHUM REGISTRO ENCONTRADO.
              </div>
            )}
          </div>
        </div>
      </THPopup>
    </>
  );
}
