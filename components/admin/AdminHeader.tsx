"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SYSTEM_ENVIRONMENT, SYSTEM_NAME, SYSTEM_VERSION } from "../../lib/systemVersion";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
};

export default function AdminHeader({ title, subtitle, breadcrumbs = [] }: AdminHeaderProps) {
  return (
    <div className="mb-6 rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600">
            <Link href="/admin" className="hover:text-blue-800">Super Admin</Link>
            {breadcrumbs.map((item) => (
              <span key={`${item.label}-${item.href || "atual"}`} className="flex items-center gap-2">
                <ChevronRight size={14} />
                {item.href ? (
                  <Link href={item.href} className="hover:text-blue-800">{item.label}</Link>
                ) : (
                  <span className="text-slate-500">{item.label}</span>
                )}
              </span>
            ))}
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{title}</h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-500">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <p className="font-black text-slate-900">{SYSTEM_NAME}</p>
          <p className="mt-1 font-semibold text-slate-500">v{SYSTEM_VERSION} • {SYSTEM_ENVIRONMENT}</p>
        </div>
      </div>
    </div>
  );
}
