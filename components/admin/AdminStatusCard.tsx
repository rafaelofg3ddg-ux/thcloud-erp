import { ReactNode } from "react";

type Status = "online" | "warning" | "offline" | "info";

type AdminStatusCardProps = {
  title: string;
  status: Status;
  description: string;
  icon?: ReactNode;
};

const statusMap: Record<Status, { label: string; dot: string; badge: string }> = {
  online: { label: "Online", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  warning: { label: "Atenção", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-100" },
  offline: { label: "Indisponível", dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-100" },
  info: { label: "Informativo", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-100" },
};

export default function AdminStatusCard({ title, status, description, icon }: AdminStatusCardProps) {
  const cfg = statusMap[status];

  return (
    <article className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
      <div className="flex items-start gap-4">
        {icon && <div className="h-11 w-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-slate-900">{title}</h3>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black border ${cfg.badge}`}>
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2 font-medium">{description}</p>
        </div>
      </div>
    </article>
  );
}
