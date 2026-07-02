export function formatarMoeda(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(valor: string | Date | null | undefined) {
  if (!valor) return "-";
  const data = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR");
}

export function THMoney({ valor }: { valor: number | string | null | undefined }) {
  return <>{formatarMoeda(valor)}</>;
}

export function THDate({ valor }: { valor: string | Date | null | undefined }) {
  return <>{formatarData(valor)}</>;
}
