type LogItem = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  tipo?: string;
};

type TimelineLogsProps = {
  logs: LogItem[];
};

function formatarDataHora(data: string) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

export default function TimelineLogs({ logs }: TimelineLogsProps) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900">Logs recentes</h2>
          <p className="text-sm font-medium text-slate-500">Últimos eventos técnicos registrados.</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500 font-semibold">
          Nenhum log recente encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4">
              <div className="pt-1">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                <div className="mx-auto mt-1 h-full w-px bg-slate-200" />
              </div>
              <div className="min-w-0 flex-1 pb-4 border-b border-slate-100 last:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-900 truncate">{log.titulo}</p>
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap">{formatarDataHora(log.data)}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">{log.descricao}</p>
                {log.tipo && (
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {log.tipo}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
