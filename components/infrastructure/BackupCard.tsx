type BackupCardProps = {
  ultimoBackup?: string;
  status: "ok" | "atencao";
};

export default function BackupCard({ ultimoBackup, status }: BackupCardProps) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Backups</p>
      <h2 className="mt-1 text-xl font-black text-slate-900">Proteção dos dados</h2>

      <div className={`mt-5 rounded-2xl p-4 border ${status === "ok" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
        <p className={`font-black ${status === "ok" ? "text-emerald-700" : "text-amber-700"}`}>
          {status === "ok" ? "Backup recente" : "Backup precisa de atenção"}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Último registro: {ultimoBackup || "Ainda não informado pelo sistema"}
        </p>
      </div>

      <div className="mt-4 text-sm text-slate-500 font-semibold leading-relaxed">
        Esta primeira versão não executa backup automático. Ela apenas centraliza o status para evoluirmos com segurança.
      </div>
    </div>
  );
}
