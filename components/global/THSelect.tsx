"use client";

import type { SelectHTMLAttributes } from "react";

type THSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  erro?: string;
};

export default function THSelect({ label, erro, className = "", id, children, ...props }: THSelectProps) {
  const inputId = id || props.name;

  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</span> : null}
      <select
        {...props}
        id={inputId}
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${erro ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} ${className}`.trim()}
      >
        {children}
      </select>
      {erro ? <span className="text-xs font-bold text-red-600">{erro}</span> : null}
    </label>
  );
}
