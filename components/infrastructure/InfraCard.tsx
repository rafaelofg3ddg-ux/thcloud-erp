import type { ReactNode } from "react";

type InfraCardProps = {
  titulo: string;
  valor: string;
  detalhe?: string;
  icone?: ReactNode;
  tom?: "azul" | "verde" | "amarelo" | "vermelho" | "roxo" | "cinza";
};

const tons = {
  azul: "border-blue-100 bg-blue-50 text-blue-700",
  verde: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amarelo: "border-amber-100 bg-amber-50 text-amber-700",
  vermelho: "border-red-100 bg-red-50 text-red-700",
  roxo: "border-purple-100 bg-purple-50 text-purple-700",
  cinza: "border-slate-100 bg-slate-50 text-slate-700",
};

export default function InfraCard({ titulo, valor, detalhe, icone, tom = "azul" }: InfraCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-500 uppercase tracking-wide">{titulo}</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 truncate">{valor}</h3>
        </div>
        {icone && <div className={`rounded-2xl border p-3 ${tons[tom]}`}>{icone}</div>}
      </div>
      {detalhe && <p className="mt-3 text-sm font-semibold text-slate-500">{detalhe}</p>}
    </div>
  );
}
