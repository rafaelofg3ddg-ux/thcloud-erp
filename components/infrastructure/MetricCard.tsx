import { LucideIcon } from "lucide-react";

type MetricCardProps = {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone: LucideIcon;
  destaque?: "azul" | "verde" | "amarelo" | "vermelho" | "cinza";
};

const estilos = {
  azul: "bg-blue-50 text-blue-700 border-blue-100",
  verde: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amarelo: "bg-amber-50 text-amber-700 border-amber-100",
  vermelho: "bg-red-50 text-red-700 border-red-100",
  cinza: "bg-slate-50 text-slate-700 border-slate-100",
};

export default function MetricCard({
  titulo,
  valor,
  descricao,
  icone: Icone,
  destaque = "azul",
}: MetricCardProps) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{titulo}</p>
          <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight">{valor}</p>
          {descricao && <p className="mt-2 text-sm font-medium text-slate-500">{descricao}</p>}
        </div>

        <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${estilos[destaque]}`}>
          <Icone size={24} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
