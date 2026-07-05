type DatabaseCardProps = {
  online: boolean;
  tempoRespostaMs: number | null;
  tabelasConsultadas: number;
  atualizadoEm: string;
};

export default function DatabaseCard({ online, tempoRespostaMs, tabelasConsultadas, atualizadoEm }: DatabaseCardProps) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Banco de Dados</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Conectividade e leitura das tabelas principais.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${online ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {online ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">Tempo resposta</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{tempoRespostaMs === null ? "-" : `${tempoRespostaMs} ms`}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">Tabelas lidas</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{tabelasConsultadas}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">Atualização</p>
          <p className="mt-2 text-sm font-black text-slate-900">{atualizadoEm || "-"}</p>
        </div>
      </div>
    </div>
  );
}
