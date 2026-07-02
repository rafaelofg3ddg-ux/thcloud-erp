export default function THLoading({ texto = "Carregando..." }: { texto?: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-black uppercase text-slate-500 shadow-sm">{texto}</div>;
}
