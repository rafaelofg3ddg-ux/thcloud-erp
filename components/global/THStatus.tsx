type THStatusProps = {
  texto: string;
  tipo?: "ativo" | "alerta" | "erro" | "neutro";
};

const estilos = {
  ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  alerta: "bg-amber-50 text-amber-700 border-amber-200",
  erro: "bg-red-50 text-red-700 border-red-200",
  neutro: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function THStatus({ texto, tipo = "neutro" }: THStatusProps) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${estilos[tipo]}`}>{texto}</span>;
}
