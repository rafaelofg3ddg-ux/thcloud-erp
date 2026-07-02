"use client";

import type { InputHTMLAttributes } from "react";
import THButton from "./THButton";

type THSearchProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  onNovo?: () => void;
  textoNovo?: string;
};

export default function THSearch({ label, onNovo, textoNovo = "+", className = "", ...props }: THSearchProps) {
  return (
    <div className="space-y-1.5">
      {label ? <span className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</span> : null}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            {...props}
            className={`w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`.trim()}
          />
        </div>
        {onNovo ? <THButton onClick={onNovo} className="px-4">{textoNovo}</THButton> : null}
      </div>
    </div>
  );
}
