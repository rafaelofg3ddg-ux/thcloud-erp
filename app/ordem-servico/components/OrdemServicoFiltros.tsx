import { Plus, RefreshCcw, Search } from "lucide-react";

export function OrdemServicoFiltros({
  pesquisa,
  setPesquisa,
  filtroStatus,
  setFiltroStatus,
  statusOptions,
  statusLabel,
  carregarDados,
  abrirNovaOS,
}: {
  pesquisa: string;
  setPesquisa: (valor: string) => void;
  filtroStatus: string;
  setFiltroStatus: (valor: string) => void;
  statusOptions: string[];
  statusLabel: (valor: string) => string;
  carregarDados: () => void;
  abrirNovaOS: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-6 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar cliente, OS, equipamento ou IMEI..."
            className="input-os pl-12"
          />
        </div>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="input-os lg:col-span-3"
        >
          <option value="todos">Todos os status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>

        <button
          onClick={carregarDados}
          className="lg:col-span-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black flex items-center justify-center gap-2 px-4 py-3"
        >
          <RefreshCcw size={18} />
        </button>

        <button
          onClick={abrirNovaOS}
          className="lg:col-span-2 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 px-4 py-3"
        >
          <Plus size={18} /> Nova OS
        </button>
      </div>
    </div>
  );
}
