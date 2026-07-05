import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { StatusNivel } from "./StatusCard";

export type DiagnosticItem = {
  titulo: string;
  status: StatusNivel;
  descricao: string;
};

type DiagnosticChecklistProps = {
  itens: DiagnosticItem[];
};

const config = {
  online: { icone: CheckCircle2, classe: "text-emerald-600 bg-emerald-50", texto: "OK" },
  atencao: { icone: AlertTriangle, classe: "text-amber-600 bg-amber-50", texto: "Atenção" },
  offline: { icone: XCircle, classe: "text-red-600 bg-red-50", texto: "Falha" },
};

export default function DiagnosticChecklist({ itens }: DiagnosticChecklistProps) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-900">Diagnóstico rápido</h2>
        <p className="text-sm font-medium text-slate-500">Scanner visual para acompanhar pontos críticos sem alterar o banco.</p>
      </div>

      <div className="space-y-3">
        {itens.map((item) => {
          const itemConfig = config[item.status];
          const Icone = itemConfig.icone;

          return (
            <div key={item.titulo} className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3">
              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center ${itemConfig.classe}`}>
                <Icone size={19} strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-900 truncate">{item.titulo}</p>
                <p className="text-sm font-medium text-slate-500 truncate">{item.descricao}</p>
              </div>
              <span className="text-xs font-black text-slate-500 whitespace-nowrap">{itemConfig.texto}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
