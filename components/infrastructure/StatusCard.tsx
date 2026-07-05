import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export type StatusNivel = "online" | "atencao" | "offline";

type StatusCardProps = {
  titulo: string;
  descricao: string;
  status: StatusNivel;
};

const config = {
  online: {
    texto: "Online",
    classe: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icone: CheckCircle2,
  },
  atencao: {
    texto: "Atenção",
    classe: "bg-amber-50 text-amber-700 border-amber-100",
    icone: AlertTriangle,
  },
  offline: {
    texto: "Offline",
    classe: "bg-red-50 text-red-700 border-red-100",
    icone: XCircle,
  },
};

export default function StatusCard({ titulo, descricao, status }: StatusCardProps) {
  const item = config[status];
  const Icone = item.icone;

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-black text-slate-900">{titulo}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{descricao}</p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black ${item.classe}`}>
          <Icone size={17} strokeWidth={2.5} />
          {item.texto}
        </div>
      </div>
    </div>
  );
}
