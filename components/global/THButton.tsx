"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primary" | "secondary" | "danger" | "success" | "ghost";

type THButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variante;
};

const estilos: Record<Variante, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200",
  secondary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200",
  ghost: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-200",
};

export default function THButton({ children, variant = "primary", className = "", type = "button", ...props }: THButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide shadow-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${estilos[variant]} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
