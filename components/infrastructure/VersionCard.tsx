type VersionCardProps = {
  versao: string;
  canal: string;
  atualizadoEm: string;
};

export default function VersionCard({ versao, canal, atualizadoEm }: VersionCardProps) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-950 text-white shadow-xl p-6 overflow-hidden relative">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-100">TH Cloud</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight">v{versao}</h2>
        <p className="mt-2 text-blue-100 font-semibold">Canal: {canal}</p>
        <p className="mt-1 text-blue-100 font-semibold">Atualizado em: {atualizadoEm}</p>
      </div>
    </div>
  );
}
