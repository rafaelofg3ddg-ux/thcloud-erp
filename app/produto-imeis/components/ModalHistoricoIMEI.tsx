"use client";

import { X } from "lucide-react";
import type { ProdutoImeisHook } from "../hooks/useProdutoImeis";

export function ModalHistoricoIMEI({ imei }: { imei: ProdutoImeisHook }) {
  const item = imei.imeiSelecionado;

  return (
    <div className="fixed inset-0 z-[95] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Histórico do IMEI
            </h2>

            <p className="text-slate-500">
              {item?.imei || "-"} • {item?.produtos?.nome || "Produto"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => imei.setModalHistoricoAberto(false)}
            className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
          >
            <X size={20} className="mx-auto" />
          </button>
        </div>

        <div className="p-5">
          {imei.historico.length === 0 && (
            <div className="text-center p-10 text-slate-500 font-bold">
              Nenhum histórico encontrado.
            </div>
          )}

          <div className="space-y-3">
            {imei.historico.map((h) => (
              <div
                key={h.id}
                className="border border-slate-200 rounded-2xl p-4 bg-slate-50"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <p className="font-black text-slate-900">{h.acao}</p>

                  <p className="text-sm text-slate-500">
                    {imei.dataBR(h.created_at)}
                  </p>
                </div>

                <p className="text-slate-700 mt-2">
                  {h.descricao || "-"}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Status: {h.status_anterior || "-"} → {h.status_novo || "-"} • Usuário: {h.usuario || "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
