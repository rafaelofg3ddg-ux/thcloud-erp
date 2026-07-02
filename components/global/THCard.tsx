import type { HTMLAttributes, ReactNode } from "react";

type THCardProps = HTMLAttributes<HTMLDivElement> & {
  titulo?: string;
  children: ReactNode;
};

export default function THCard({ titulo, children, className = "", ...props }: THCardProps) {
  return (
    <section {...props} className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`.trim()}>
      {titulo ? <h2 className="mb-4 text-lg font-black uppercase text-slate-900">{titulo}</h2> : null}
      {children}
    </section>
  );
}
