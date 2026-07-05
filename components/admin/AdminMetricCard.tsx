import { ReactNode } from "react";

type AdminMetricCardProps = {
  title: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "slate" | "purple";
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100",
  slate: "bg-slate-50 text-slate-700 border-slate-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
};

export default function AdminMetricCard({ title, value, detail, icon, tone = "blue" }: AdminMetricCardProps) {
  return (
    <article className="bg-white rounded-[26px] border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</p>
          <h3 className="text-3xl font-black text-slate-950 mt-2 tracking-[-0.04em]">{value}</h3>
          {detail && <p className="text-sm text-slate-500 mt-1 font-semibold">{detail}</p>}
        </div>

        {icon && (
          <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${toneClasses[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </article>
  );
}
