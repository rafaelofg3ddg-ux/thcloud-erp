"use client";

import type { SelectHTMLAttributes } from "react";

type THSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  erro?: string;
  ajuda?: string;
};

export function THSelect({
  label,
  erro,
  ajuda,
  className = "",
  children,
  ...props
}: THSelectProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-black text-slate-700">
          {label}
        </span>
      )}

      <select
        {...props}
        className={[
          "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold uppercase text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",
          erro ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </select>

      {erro && <p className="mt-1 text-sm font-bold text-red-600">{erro}</p>}
      {!erro && ajuda && <p className="mt-1 text-xs text-slate-500">{ajuda}</p>}
    </label>
  );
}
