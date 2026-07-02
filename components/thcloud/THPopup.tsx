"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type THPopupProps = {
  aberto: boolean;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  footer?: ReactNode;
  largura?: "sm" | "md" | "lg" | "xl" | "full";
  onFechar: () => void;
};

const larguras = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-7xl",
};

export function THPopup({
  aberto,
  titulo,
  subtitulo,
  children,
  footer,
  largura = "lg",
  onFechar,
}: THPopupProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        className={[
          "max-h-[94vh] w-full overflow-hidden rounded-3xl bg-white shadow-2xl",
          larguras[largura],
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{titulo}</h2>
            {subtitulo && <p className="mt-1 text-slate-500">{subtitulo}</p>}
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <X size={20} className="mx-auto" />
          </button>
        </div>

        <div className="max-h-[calc(94vh-150px)] overflow-y-auto p-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-slate-200 bg-white p-5">{footer}</div>
        )}
      </div>
    </div>
  );
}
