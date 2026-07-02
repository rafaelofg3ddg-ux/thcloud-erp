export function OrdemServicoResumo({
  totalOrdens,
  totalAberto,
  totalFiltrado,
  dinheiro,
}: {
  totalOrdens: number;
  totalAberto: number;
  totalFiltrado: number;
  dinheiro: (valor: unknown) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card titulo="Ordens" valor={String(totalOrdens)} cor="text-blue-700" />
      <Card titulo="Em aberto" valor={dinheiro(totalAberto)} cor="text-orange-700" />
      <Card titulo="Exibindo" valor={String(totalFiltrado)} cor="text-slate-900" />
    </div>
  );
}

function Card({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
      <p className="text-sm font-bold text-slate-500">{titulo}</p>
      <h3 className={`text-2xl font-black mt-1 ${cor}`}>{valor}</h3>
    </div>
  );
}
