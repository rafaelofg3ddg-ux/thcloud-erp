"use client";

import type { ReactNode } from "react";

type THCardProps = {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function THCard({
  titulo,
  subtitulo,
  children,
  actions,
  className = "",
}: THCardProps) {
  return (
    <section
      className={[
        "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      ].join(" ")}
    >
      {(titulo || subtitulo || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {titulo && <h3 className="text-xl font-black text-slate-900">{titulo}</h3>}
            {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
          </div>
          {actions}
        </div>
      )}

      {children}
    </section>
  );
}
