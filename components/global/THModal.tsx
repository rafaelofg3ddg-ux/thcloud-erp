"use client";

import type { ReactNode } from "react";
import THButton from "./THButton";

type THModalProps = {
  aberto: boolean;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  onFechar: () => void;
  rodape?: ReactNode;
  largura?: "sm" | "md" | "lg" | "xl" | "full";
};

const larguras = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[96vw]",
};

export default function THModal({ aberto, titulo, subtitulo, children, onFechar, rodape, largura = "md" }: THModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full overflow-hidden rounded-3xl bg-white shadow-2xl ${larguras[largura]}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{titulo}</h2>
            {subtitulo ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitulo}</p> : null}
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          {rodape || <THButton variant="ghost" onClick={onFechar}>Fechar</THButton>}
        </div>
      </div>
    </div>
  );
}
