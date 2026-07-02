"use client";

type THStatusProps = {
  status: string;
  label?: string;
};

export function THStatus({ status, label }: THStatusProps) {
  const mapa: Record<string, string> = {
    aberto: "bg-blue-100 text-blue-700",
    aberta: "bg-blue-100 text-blue-700",
    aprovado: "bg-green-100 text-green-700",
    aprovada: "bg-green-100 text-green-700",
    finalizado: "bg-emerald-100 text-emerald-700",
    finalizada: "bg-emerald-100 text-emerald-700",
    vendido: "bg-blue-100 text-blue-700",
    disponivel: "bg-green-100 text-green-700",
    reservado: "bg-yellow-100 text-yellow-700",
    cancelado: "bg-red-100 text-red-700",
    cancelada: "bg-red-100 text-red-700",
    garantia: "bg-purple-100 text-purple-700",
    ativo: "bg-green-100 text-green-700",
    inativo: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-black uppercase",
        mapa[status] || "bg-slate-100 text-slate-700",
      ].join(" ")}
    >
      {label || status}
    </span>
  );
}
