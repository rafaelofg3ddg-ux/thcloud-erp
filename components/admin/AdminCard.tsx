import type { ReactNode } from "react";

type AdminCardProps = {
  title: string;
  value?: ReactNode;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
};

export default function AdminCard({ title, value, description, icon, children }: AdminCardProps) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{title}</p>
          {value !== undefined && <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>}
          {description && <p className="mt-2 text-sm font-semibold text-slate-500">{description}</p>}
        </div>
        {icon && <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">{icon}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
