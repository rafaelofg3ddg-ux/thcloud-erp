import { AlertTriangle, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { StatusNivel } from "./StatusCard";

export type HealthItem = {
  nome: string;
  status: StatusNivel;
  descricao: string;
  detalhe?: string;
  tempoMs?: number | null;
};

type SystemHealthPanelProps = {
  itens: HealthItem[];
  ultimaVerificacao: string;
  pontuacao: number;
};

const statusConfig = {
  online: {
    texto: "Online",
    classe: "bg-emerald-50 text-emerald-700 border-emerald-100",
    ponto: "bg-emerald-500",
    icone: CheckCircle2,
  },
  atencao: {
    texto: "Atenção",
    classe: "bg-amber-50 text-amber-700 border-amber-100",
    ponto: "bg-amber-500",
    icone: AlertTriangle,
  },
  offline: {
    texto: "Offline",
    classe: "bg-red-50 text-red-700 border-red-100",
    ponto: "bg-red-500",
    icone: XCircle,
  },
};

function classePontuacao(pontuacao: number) {
  if (pontuacao >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-100";
  if (pontuacao >= 70) return "text-amber-700 bg-amber-50 border-amber-100";
  return "text-red-700 bg-red-50 border-red-100";
}

export default function SystemHealthPanel({ itens, ultimaVerificacao, pontuacao }: SystemHealthPanelProps) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck size={23} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Centro de Saúde do Sistema</h2>
            <p className="text-sm font-medium text-slate-500">Verificação técnica dos serviços principais do TH Cloud.</p>
          </div>
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-center ${classePontuacao(pontuacao)}`}>
          <p className="text-xs font-black uppercase tracking-wide">Saúde geral</p>
          <p className="text-2xl font-black">{pontuacao}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {itens.map((item) => {
          const config = statusConfig[item.status];
          const Icone = config.icone;

          return (
            <div key={item.nome} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${config.ponto}`} />
                    <p className="font-black text-slate-900 truncate">{item.nome}</p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-500">{item.descricao}</p>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${config.classe}`}>
                  <Icone size={14} strokeWidth={2.5} />
                  {config.texto}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                <span className="truncate">{item.detalhe || "Sem observações"}</span>
                {typeof item.tempoMs === "number" && (
                  <span className="rounded-full bg-white border border-slate-200 px-2 py-1 text-slate-700 whitespace-nowrap">
                    {item.tempoMs} ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
        <Clock size={17} className="text-slate-500" />
        Última verificação: {ultimaVerificacao || "-"}
      </div>
    </div>
  );
}
