import type { ReactNode } from "react";

type THPageProps = {
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
  children: ReactNode;
};

export default function THPage({ titulo, subtitulo, acoes, children }: THPageProps) {
  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">{titulo}</h1>
          {subtitulo ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitulo}</p> : null}
        </div>
        {acoes ? <div className="flex flex-wrap gap-3">{acoes}</div> : null}
      </header>
      {children}
    </main>
  );
}
