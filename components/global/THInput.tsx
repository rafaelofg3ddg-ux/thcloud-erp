"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseInput =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

type THInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  erro?: string;
  upper?: boolean;
};

type THTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  erro?: string;
  upper?: boolean;
};

export function THInput({ label, erro, className = "", upper = true, id, ...props }: THInputProps) {
  const inputId = id || props.name;

  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</span> : null}
      <input
        {...props}
        id={inputId}
        data-uppercase={upper ? "true" : "false"}
        className={`${baseInput} ${upper ? "uppercase" : ""} ${erro ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} ${className}`.trim()}
      />
      {erro ? <span className="text-xs font-bold text-red-600">{erro}</span> : null}
    </label>
  );
}

export function THTextarea({ label, erro, className = "", upper = true, id, ...props }: THTextareaProps) {
  const inputId = id || props.name;

  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</span> : null}
      <textarea
        {...props}
        id={inputId}
        data-uppercase={upper ? "true" : "false"}
        className={`${baseInput} min-h-[96px] resize-y ${upper ? "uppercase" : ""} ${erro ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} ${className}`.trim()}
      />
      {erro ? <span className="text-xs font-bold text-red-600">{erro}</span> : null}
    </label>
  );
}

export default THInput;
