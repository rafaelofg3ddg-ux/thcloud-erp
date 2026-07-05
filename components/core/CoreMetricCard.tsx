import type { ReactNode } from "react";

export function CoreMetricCard({
  titulo,
  valor,
  detalhe,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{titulo}</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{valor}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{detalhe}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">{icone}</div>
      </div>
    </div>
  );
}
